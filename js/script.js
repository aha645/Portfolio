// 반응형 포트폴리오 — 동작 스크립트 (객체지향 버전)
// 기존 함수형(STATE → setState → render 함수) 구조를 그대로 유지하되,
// 각 기능(테마/네비/스크롤/프로젝트/문의폼)을 담당 클래스로 분리했다.
// 콜백으로 넘겨지거나 렌더러 맵에 저장되는 메서드는 전부 화살표 함수 클래스 필드로
// 선언해 this가 항상 해당 인스턴스에 고정되도록 했다 (별도 bind() 불필요).

// 0. 설정 상수
const THEME_KEY = "portfolio-theme";

const NAV_SCROLL_THRESHOLD = 60;
const SCROLL_TOP_THRESHOLD = 300;
const REVEAL_THRESHOLD = 0.2;
const FETCH_TIMEOUT_MS = 8000;
const TYPING_SPEED_MS = 80;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EMAILJS_PUBLIC_KEY = "n1fS48XnUB9-n_G3l";
const EMAILJS_SERVICE_ID = "service_g48smoo";
const EMAILJS_TEMPLATE_ID = "template_rvdgv14";

const DEBUG = false;

// 1. 유틸리티 클래스 — 특정 기능에 속하지 않는 순수 도우미

class Utils {
  static escapeHtml(value) {
    const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return String(value).replace(/[&<>"']/g, (ch) => entities[ch]);
  }
}

// Hero 타이핑 효과. 재귀 스텝(_typeStep)을 함수 안에 숨은 익명 클로저가 아니라
// 클래스의 이름 있는 메서드로 분리해서, "함수 안에 함수"처럼 보이지 않게 했다.
// (el, text, index는 인스턴스 필드가 아니라 매개변수로 주고받으므로, 같은
// TypeWriter 인스턴스로 여러 타이핑을 동시에 실행해도 서로 간섭하지 않는다.)
class TypeWriter {
  constructor(speed = TYPING_SPEED_MS) {
    this.speed = speed;
  }

  type(el, text) {
    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      el.textContent = text;
      return;
    }

    el.textContent = "";
    el.classList.add("typing");
    this._typeStep(el, text, 0);
  }

  // setTimeout에는 이 메서드를 통째로 넘기는 게 아니라 () => this._typeStep(...)로
  // 감싸서 넘긴다 — 즉 항상 this._typeStep(...) 리시버 호출로만 쓰이므로,
  // 화살표 필드가 아닌 일반 메서드로 선언해도 this가 깨지지 않는다.
  _typeStep(el, text, index) {
    if (index < text.length) {
      el.textContent += text[index];
      setTimeout(() => this._typeStep(el, text, index + 1), this.speed);
    } else {
      el.classList.remove("typing");
    }
  };
}

// 스크롤 등장 애니메이션. 관찰자(IntersectionObserver) 하나를 인스턴스가 들고 있다가
// observe(scope)로 원하는 범위의 .reveal 요소들을 등록한다.
class RevealAnimator {
  constructor(threshold = REVEAL_THRESHOLD) {
    this.observer = new IntersectionObserver(this._handleIntersect, { threshold });
  }

  _handleIntersect = (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        this.observer.unobserve(entry.target);
      }
    });
  };

  observe(scope = document) {
    scope.querySelectorAll(".reveal").forEach((el) => this.observer.observe(el));
  }
}

// 2. 기능별 컨트롤러 클래스
// 각 컨트롤러는 PortfolioApp 인스턴스(app)를 생성자로 받아 app.state를 읽고
// app.setState(...)로만 상태를 바꾼다 — "단일 상태 저장소"라는 원래 설계는 그대로 유지된다.

class ThemeController {
  constructor(app) {
    this.app = app;
  }

  getInitialTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "dark" || saved === "light") {
      return saved;
    }
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "dark" : "light";
  }

  render = () => {
    document.documentElement.setAttribute("data-theme", this.app.state.theme);
    const toggleBtn = document.getElementById("theme-toggle");
    if (toggleBtn) {
      toggleBtn.textContent = this.app.state.theme === "dark" ? "☀️" : "🌙";
    }
  };

  handleToggleClick = () => {
    const next = this.app.state.theme === "dark" ? "light" : "dark";
    localStorage.setItem(THEME_KEY, next);
    this.app.setState({ theme: next });
  };

  // 사용자가 토글을 직접 누른 적이 없을 때만 OS 다크모드 변경을 실시간 반영한다.
  handleSystemChange = (event) => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "dark" || saved === "light") {
      return;
    }
    this.app.setState({ theme: event.matches ? "dark" : "light" });
  };

  init() {
    this.app.setState({ theme: this.getInitialTheme() });
    document.getElementById("theme-toggle").addEventListener("click", this.handleToggleClick);

    const darkSchemeQuery = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (darkSchemeQuery) {
      if (darkSchemeQuery.addEventListener) {
        darkSchemeQuery.addEventListener("change", this.handleSystemChange);
      } else if (darkSchemeQuery.addListener) {
        darkSchemeQuery.addListener(this.handleSystemChange);
      }
    }
  }
}

class NavMenu {
  constructor(app) {
    this.app = app;
  }

  render = () => {
    const hamburger = document.getElementById("hamburger");
    const navMenu = document.getElementById("nav-menu");

    navMenu.classList.toggle("active", this.app.state.navOpen);
    hamburger.classList.toggle("active", this.app.state.navOpen);
    hamburger.setAttribute("aria-expanded", String(this.app.state.navOpen));
  };

  handleHamburgerClick = () => {
    this.app.setState({ navOpen: !this.app.state.navOpen });
  };

  handleNavLinkClick = (event) => {
    event.preventDefault();
    const target = document.querySelector(event.currentTarget.getAttribute("href"));
    target?.scrollIntoView({ behavior: "smooth" });
    this.app.setState({ navOpen: false });
  };

  handleKeydown = (event) => {
    if (event.key === "Escape" && this.app.state.navOpen) {
      this.app.setState({ navOpen: false });
      document.getElementById("hamburger").focus();
    }
  };

  init() {
    document.getElementById("hamburger").addEventListener("click", this.handleHamburgerClick);
    document.addEventListener("keydown", this.handleKeydown);
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", this.handleNavLinkClick);
    });
  }
}

class ScrollWatcher {
  constructor(app) {
    this.app = app;
  }

  renderHeader = () => {
    document.getElementById("site-header").classList.toggle("scrolled", this.app.state.scrolled);
  };

  renderScrollTopButton = () => {
    document.getElementById("scroll-top").classList.toggle("show", this.app.state.showScrollTop);
  };

  handleScroll = () => {
    const scrolled = window.scrollY > NAV_SCROLL_THRESHOLD;
    const showScrollTop = window.scrollY > SCROLL_TOP_THRESHOLD;

    if (scrolled !== this.app.state.scrolled || showScrollTop !== this.app.state.showScrollTop) {
      this.app.setState({ scrolled, showScrollTop });
    }
  };

  handleScrollTopClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  init() {
    window.addEventListener("scroll", this.handleScroll);
    document.getElementById("scroll-top").addEventListener("click", this.handleScrollTopClick);
  }
}

class ProjectsSection {
  constructor(app, revealAnimator) {
    this.app = app;
    this.reveal = revealAnimator;
  }

  async fetchWithTimeout(url, timeoutMs = FETCH_TIMEOUT_MS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  getErrorMessage(status) {
    if (status === 403) return "GitHub API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.";
    if (status === 404) return "해당 GitHub 사용자를 찾을 수 없습니다.";
    if (status >= 500) return "GitHub 서버에 일시적인 문제가 발생했습니다.";
    return `프로젝트를 불러올 수 없습니다. (오류 코드: ${status})`;
  }

  // 항상 this.load(...) 또는 () => this.load(...) 형태(리시버 있음)로만 호출되므로
  // 일반 메서드로 선언해도 this가 깨지지 않는다.
  async load(username) {
    this.app.setState({
      projects: { status: "loading", items: [], username, message: "", filter: "all" },
    });

    try {
      const res = await this.fetchWithTimeout(
        `https://api.github.com/users/${username}/repos?sort=updated`
      );

      if (!res.ok) {
        throw new Error(this.getErrorMessage(res.status));
      }

      const repos = await res.json();
      const ownRepos = repos.filter((repo) => !repo.fork);

      if (ownRepos.length === 0) {
        this.app.setState({
          projects: { status: "empty", items: [], username, message: "", filter: "all" },
        });
        return;
      }

      this.app.setState({
        projects: { status: "success", items: ownRepos, username, message: "", filter: "all" },
      });
    } catch (error) {
      console.error(error);

      let message = error.message || "프로젝트를 불러올 수 없습니다.";
      if (error.name === "AbortError") {
        message = "요청 시간이 초과되었습니다. 네트워크 상태를 확인 후 다시 시도해주세요.";
      } else if (error instanceof TypeError) {
        message = "네트워크 연결을 확인해주세요.";
      }

      this.app.setState({
        projects: { status: "error", items: [], username, message, filter: "all" },
      });
    }
  }

  // 항상 () => this.handleFilterClick(...)로 감싸서 호출되므로(300번째 줄)
  // 일반 메서드로 선언해도 this가 깨지지 않는다.
  handleFilterClick(language) {
    this.app.setState({ projects: { ...this.app.state.projects, filter: language } });
  }

  renderFilters(items, activeFilter) {
    const filtersEl = document.getElementById("projects-filters");

    const languages = [...new Set(items.map((repo) => repo.language).filter(Boolean))];
    const filters = ["all", ...languages];

    filtersEl.innerHTML = filters
      .map((lang) => `
        <button
          type="button"
          class="filter-btn${lang === activeFilter ? " active" : ""}"
          data-filter="${Utils.escapeHtml(lang)}"
        >${lang === "all" ? "전체" : Utils.escapeHtml(lang)}</button>
      `)
      .join("");

    filtersEl.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.addEventListener("click", () => this.handleFilterClick(btn.dataset.filter));
    });
  }

  render = () => {
    const { status, items, username, message, filter } = this.app.state.projects;
    const filtersEl = document.getElementById("projects-filters");
    const statusEl = document.getElementById("projects-status");
    const listEl = document.getElementById("projects-list");

    if (status === "loading") {
      filtersEl.innerHTML = "";
      statusEl.innerHTML = `<p class="loading">프로젝트를 불러오는 중...</p>`;
      listEl.innerHTML = "";
      return;
    }

    if (status === "error") {
      filtersEl.innerHTML = "";
      statusEl.innerHTML = `
        <p class="error">${message}</p>
        <button id="retry-btn" class="btn" type="button">다시 시도</button>
      `;
      listEl.innerHTML = "";
      document.getElementById("retry-btn").addEventListener("click", () => this.load(username));
      return;
    }

    if (status === "empty") {
      filtersEl.innerHTML = "";
      statusEl.innerHTML = `<p class="empty">표시할 프로젝트가 없습니다.</p>`;
      listEl.innerHTML = "";
      return;
    }

    if (status === "success") {
      this.renderFilters(items, filter);

      const filteredItems =
        filter === "all" ? items : items.filter((repo) => repo.language === filter);

      if (filteredItems.length === 0) {
        statusEl.innerHTML = `<p class="empty">해당 언어의 프로젝트가 없습니다.</p>`;
        listEl.innerHTML = "";
        return;
      }

      statusEl.innerHTML = "";

      listEl.innerHTML = filteredItems
        .map(({ name, description, html_url, language, stargazers_count }) => `
          <article class="project-card reveal">
            <h3>${Utils.escapeHtml(name)}</h3>
            <p>${description ? Utils.escapeHtml(description) : "설명이 없습니다."}</p>
            <div class="project-meta">
              ${language ? `<span class="badge">${Utils.escapeHtml(language)}</span>` : ""}
              <span class="badge">⭐ ${stargazers_count}</span>
            </div>
            <a href="${Utils.escapeHtml(html_url)}" target="_blank" rel="noopener">GitHub에서 보기</a>
          </article>
        `)
        .join("");

      this.reveal.observe(listEl);
      return;
    }

    filtersEl.innerHTML = "";
    statusEl.innerHTML = "";
    listEl.innerHTML = "";
  };
}

class ContactForm {
  constructor(app) {
    this.app = app;
    this.fieldNames = ["name", "email", "message"];
    this.form = document.getElementById("contact-form");

    if (typeof emailjs !== "undefined") {
      emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
    }
  }

  validateField(field) {
    const value = document.getElementById(field).value.trim();
    if (!value) return "필수 입력 항목입니다.";
    if (field === "email" && !EMAIL_REGEX.test(value)) return "올바른 이메일 형식이 아닙니다.";
    return "";
  }

  // 항상 this.validateAndSetField(...) 리시버 호출로만 쓰이므로 일반 메서드로 충분하다.
  validateAndSetField(field) {
    const message = this.validateField(field);
    this.app.setState({ formErrors: { ...this.app.state.formErrors, [field]: message } });
    return message === "";
  }

  renderErrors = () => {
    Object.entries(this.app.state.formErrors).forEach(([field, message]) => {
      document.getElementById(`${field}-error`).textContent = message;
      document.getElementById(field).classList.toggle("invalid", Boolean(message));
    });
  };

  renderStatus = () => {
    const submitBtn = document.getElementById("contact-submit");
    const statusEl = document.getElementById("form-status");

    submitBtn.disabled = this.app.state.formStatus === "sending";
    submitBtn.textContent = this.app.state.formStatus === "sending" ? "전송 중..." : "보내기";

    statusEl.textContent = this.app.state.formMessage;
    statusEl.className =
      this.app.state.formStatus === "error"
        ? "error-message"
        : this.app.state.formStatus === "success"
          ? "success-message"
          : "";
  };

  // 이 메서드 자신은 항상 this.handleFieldInput(field) 리시버 호출로만 쓰이므로
  // 일반 메서드로 충분하다. 반환하는 내부의 () => this.validateAndSetField(field)만
  // addEventListener에 리시버 없이 전달되는데, 이 화살표는 호출 시점에 이미 this가
  // 정상 바인딩된 상태에서 만들어지므로 그 this를 그대로 캡처해 안전하다.
  handleFieldInput(field) {
    return () => this.validateAndSetField(field);
  }

  handleSubmit = (event) => {
    event.preventDefault();

    const isValid = this.fieldNames.map((field) => this.validateAndSetField(field)).every(Boolean);

    if (!isValid) {
      this.app.setState({ formStatus: "idle", formMessage: "" });
      return;
    }

    if (typeof emailjs === "undefined") {
      this.app.setState({ formStatus: "error", formMessage: "메일 전송 기능을 사용할 수 없습니다." });
      return;
    }

    this.app.setState({ formStatus: "sending", formMessage: "" });

    emailjs
      .sendForm(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, this.form)
      .then(() => {
        this.app.setState({
          formStatus: "success",
          formMessage: "문의가 성공적으로 접수되었습니다. 감사합니다!",
        });
        this.form.reset();
      })
      .catch((error) => {
        console.error(error);
        this.app.setState({
          formStatus: "error",
          formMessage: "메일 전송에 실패했습니다. 잠시 후 다시 시도해주세요.",
        });
      });
  };

  init() {
    this.fieldNames.forEach((field) => {
      document.getElementById(field).addEventListener("input", this.handleFieldInput(field));
    });
    this.form.addEventListener("submit", this.handleSubmit);
  }
}

// 3. PortfolioApp — 중앙 상태 저장소 + 초기화 진입점
// 기존의 전역 STATE/setState/RENDERERS를 인스턴스 필드로만 옮긴 것으로,
// "단일 상태 객체 → setState → 매핑된 render만 실행"이라는 흐름 자체는 그대로다.
class PortfolioApp {
  constructor() {
    this.state = {
      theme: "light",
      navOpen: false,
      scrolled: false,
      showScrollTop: false,
      projects: {
        status: "idle",
        items: [],
        username: "",
        message: "",
        filter: "all",
      },
      formErrors: { name: "", email: "", message: "" },
      formStatus: "idle",
      formMessage: "",
    };

    this.reveal = new RevealAnimator();
    this.typewriter = new TypeWriter();

    this.theme = new ThemeController(this);
    this.nav = new NavMenu(this);
    this.scrollWatcher = new ScrollWatcher(this);
    this.projects = new ProjectsSection(this, this.reveal);
    this.contactForm = new ContactForm(this);

    // 상태 키 → 그 키를 화면에 반영하는 render 메서드. 여러 키가 같은 메서드를
    // 가리켜도(formStatus/formMessage), setState 쪽에서 Set으로 중복 실행을 막는다.
    this.renderers = {
      theme: this.theme.render,
      navOpen: this.nav.render,
      scrolled: this.scrollWatcher.renderHeader,
      showScrollTop: this.scrollWatcher.renderScrollTopButton,
      projects: this.projects.render,
      formErrors: this.contactForm.renderErrors,
      formStatus: this.contactForm.renderStatus,
      formMessage: this.contactForm.renderStatus,
    };
  }

  // 모든 하위 컨트롤러가 항상 this.app.setState(...) 리시버 호출로만 사용하므로
  // 일반 메서드로 충분하다 (이벤트 리스너나 렌더러 맵에 값으로 전달된 적이 없음).
  setState(patch) {
    if (DEBUG) {
      console.log("[setState]", patch);
    }
    Object.assign(this.state, patch);

    const renderersToRun = new Set(
      Object.keys(patch)
        .map((key) => this.renderers[key])
        .filter(Boolean)
    );
    renderersToRun.forEach((renderFn) => renderFn());
  }

  async init() {
    this.theme.init();
    this.nav.init();
    this.scrollWatcher.init();

    const res = await fetch("data/info.json");
    const data = await res.json();
    const { hero, about, skills, footer, github } = data;

    this.typewriter.type(document.getElementById("hero-greeting"), hero.greeting);
    const cta = document.getElementById("hero-cta");
    cta.textContent = hero.ctaText;
    cta.href = hero.ctaLink;

    const aboutImg = document.getElementById("about-img");
    aboutImg.src = about.image;
    aboutImg.alt = about.imageAlt;
    document.getElementById("about-text").textContent = about.text;

    const skillsList = document.getElementById("skills-list");
    skills.forEach((skill) => {
      const li = document.createElement("li");
      li.textContent = skill;
      skillsList.appendChild(li);
    });

    document.getElementById("footer-copyright").textContent = footer.copyright;
    const socialList = document.getElementById("footer-social");
    footer.social.forEach(({ name, url }) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = url;
      a.textContent = name;
      li.appendChild(a);
      socialList.appendChild(li);
    });

    // Hero/About/Skills/Footer 콘텐츠가 전부 채워져 섹션 높이가 확정된 뒤에
    // 관찰을 시작해야 IntersectionObserver가 "텅 빈 상태" 높이를 기준으로
    // 20% 교차 여부를 잘못 판단하지 않는다.
    this.reveal.observe();

    this.projects.load(github.username);
    this.contactForm.init();
  }
}

// 4. 부트스트랩
document.addEventListener("DOMContentLoaded", () => {
  const app = new PortfolioApp();
  app.init();
});
