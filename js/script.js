// 반응형 포트폴리오 — 동작 스크립트
// 상태 관리 구조(STATE → setState → render), 기능별 동작 흐름, 설계 결정의 배경은
// docs/ARCHITECTURE.md 참고

// 0. 공통 상수 · 유틸
const root = document.documentElement;
const THEME_KEY = "portfolio-theme";

const NAV_SCROLL_THRESHOLD = 60;
const SCROLL_TOP_THRESHOLD = 300;
const REVEAL_THRESHOLD = 0.2;
const FETCH_TIMEOUT_MS = 8000;
const TYPING_SPEED_MS = 80;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const escapeHtml = (value) => {
  const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return String(value).replace(/[&<>"']/g, (ch) => entities[ch]);
};

const typeText = (el, text, speed = TYPING_SPEED_MS) => {
  const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) {
    el.textContent = text;
    return;
  }

  el.textContent = "";

  el.classList.add("typing");

  let i = 0;
  const step = () => {
    if (i < text.length) {
      el.textContent += text[i];
      i += 1;
      setTimeout(step, speed);
    } else {
      el.classList.remove("typing");
    }
  };
  step();
};

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: REVEAL_THRESHOLD }
);

const observeReveal = (scope = document) => {
  scope.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));
};

// 1. 중앙 상태 객체
const STATE = {
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

// 2. render 함수 — STATE를 읽어 DOM에 반영
const renderTheme = () => {
  root.setAttribute("data-theme", STATE.theme);
  const toggleBtn = document.getElementById("theme-toggle");
  if (toggleBtn) {
    toggleBtn.textContent = STATE.theme === "dark" ? "☀️" : "🌙";
  }
};

const renderNav = () => {
  const hamburger = document.getElementById("hamburger");
  const navMenu = document.getElementById("nav-menu");

  navMenu.classList.toggle("active", STATE.navOpen);

  hamburger.classList.toggle("active", STATE.navOpen);
  hamburger.setAttribute("aria-expanded", String(STATE.navOpen));
};

const renderHeaderScroll = () => {
  document.getElementById("site-header").classList.toggle("scrolled", STATE.scrolled);
};

const renderScrollTopButton = () => {
  document.getElementById("scroll-top").classList.toggle("show", STATE.showScrollTop);
};

const renderProjectFilters = (items, activeFilter) => {
  const filtersEl = document.getElementById("projects-filters");

  const languages = [...new Set(items.map((repo) => repo.language).filter(Boolean))];
  const filters = ["all", ...languages];

  filtersEl.innerHTML = filters
    .map((lang) => `
      <button
        type="button"
        class="filter-btn${lang === activeFilter ? " active" : ""}"
        data-filter="${escapeHtml(lang)}"
      >${lang === "all" ? "전체" : escapeHtml(lang)}</button>
    `)
    .join("");

  filtersEl.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => handleFilterClick(btn.dataset.filter));
  });
};

const renderProjects = () => {
  const { status, items, username, message, filter } = STATE.projects;
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
    const handleRetryClick = () => loadProjects(username);
    document.getElementById("retry-btn").addEventListener("click", handleRetryClick);
    return;
  }

  if (status === "empty") {
    filtersEl.innerHTML = "";
    statusEl.innerHTML = `<p class="empty">표시할 프로젝트가 없습니다.</p>`;
    listEl.innerHTML = "";
    return;
  }

  if (status === "success") {
    renderProjectFilters(items, filter);

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
          <h3>${escapeHtml(name)}</h3>
          <p>${description ? escapeHtml(description) : "설명이 없습니다."}</p>
          <div class="project-meta">
            ${language ? `<span class="badge">${escapeHtml(language)}</span>` : ""}
            <span class="badge">⭐ ${stargazers_count}</span>
          </div>
          <a href="${escapeHtml(html_url)}" target="_blank" rel="noopener">GitHub에서 보기</a>
        </article>
      `)
      .join("");

    observeReveal(listEl);
    return;
  }

  filtersEl.innerHTML = "";
  statusEl.innerHTML = "";
  listEl.innerHTML = "";
};

const handleFilterClick = (language) => {
  setState({ projects: { ...STATE.projects, filter: language } });
};

const renderFormErrors = () => {
  Object.entries(STATE.formErrors).forEach(([field, message]) => {
    document.getElementById(`${field}-error`).textContent = message;

    document.getElementById(field).classList.toggle("invalid", Boolean(message));
  });
};

const renderFormStatus = () => {
  const submitBtn = document.getElementById("contact-submit");
  const statusEl = document.getElementById("form-status");

  submitBtn.disabled = STATE.formStatus === "sending";
  submitBtn.textContent = STATE.formStatus === "sending" ? "전송 중..." : "보내기";

  statusEl.textContent = STATE.formMessage;

  statusEl.className =
    STATE.formStatus === "error"
      ? "error-message"
      : STATE.formStatus === "success"
        ? "success-message"
        : "";
};

// 3. setState — STATE를 바꾸는 유일한 통로
const RENDERERS = {
  theme: renderTheme,
  navOpen: renderNav,
  scrolled: renderHeaderScroll,
  showScrollTop: renderScrollTopButton,
  projects: renderProjects,
  formErrors: renderFormErrors,
  formStatus: renderFormStatus,
  formMessage: renderFormStatus,
};

const DEBUG = false;

const setState = (patch) => {
  if (DEBUG) {
    console.log("[setState]", patch);
  }
  Object.assign(STATE, patch);

  const renderersToRun = new Set(
    Object.keys(patch)
      .map((key) => RENDERERS[key])
      .filter(Boolean)
  );
  renderersToRun.forEach((renderFn) => renderFn());
};

// 4. GitHub API 연동
const fetchWithTimeout = async (url, timeoutMs = FETCH_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
};

const getGitHubErrorMessage = (status) => {
  if (status === 403) return "GitHub API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.";
  if (status === 404) return "해당 GitHub 사용자를 찾을 수 없습니다.";
  if (status >= 500) return "GitHub 서버에 일시적인 문제가 발생했습니다.";
  return `프로젝트를 불러올 수 없습니다. (오류 코드: ${status})`;
};

const loadProjects = async (username) => {
  setState({ projects: { status: "loading", items: [], username, message: "", filter: "all" } });

  try {
    const res = await fetchWithTimeout(
      `https://api.github.com/users/${username}/repos?sort=updated`
    );

    if (!res.ok) {
      throw new Error(getGitHubErrorMessage(res.status));
    }

    const repos = await res.json();

    const ownRepos = repos.filter((repo) => !repo.fork);

    if (ownRepos.length === 0) {
      setState({ projects: { status: "empty", items: [], username, message: "", filter: "all" } });
      return;
    }

    setState({
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

    setState({ projects: { status: "error", items: [], username, message, filter: "all" } });
  }
};

// 5. EmailJS 설정 (docs/ARCHITECTURE.md 4.2 참고)
const EMAILJS_PUBLIC_KEY = "n1fS48XnUB9-n_G3l";
const EMAILJS_SERVICE_ID = "service_g48smoo";
const EMAILJS_TEMPLATE_ID = "template_rvdgv14";

if (typeof emailjs !== "undefined") {
  emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
}

// 6. 문의 폼 — 유효성 검사 + 전송
const initContactForm = () => {
  const form = document.getElementById("contact-form");
  const fieldNames = ["name", "email", "message"];

  const validateField = (field) => {
    const value = document.getElementById(field).value.trim();
    if (!value) return "필수 입력 항목입니다.";
    if (field === "email" && !EMAIL_REGEX.test(value)) return "올바른 이메일 형식이 아닙니다.";
    return "";
  };

  const validateAndSetField = (field) => {
    const message = validateField(field);
    setState({ formErrors: { ...STATE.formErrors, [field]: message } });
    return message === "";
  };

  const makeFieldInputHandler = (field) => () => validateAndSetField(field);

  const handleFormSubmit = (event) => {
    event.preventDefault();

    const isValid = fieldNames.map((field) => validateAndSetField(field)).every(Boolean);

    if (!isValid) {
      setState({ formStatus: "idle", formMessage: "" });
      return;
    }

    if (typeof emailjs === "undefined") {
      setState({ formStatus: "error", formMessage: "메일 전송 기능을 사용할 수 없습니다." });
      return;
    }

    setState({ formStatus: "sending", formMessage: "" });

    emailjs
      .sendForm(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, form)
      .then(() => {
        setState({
          formStatus: "success",
          formMessage: "문의가 성공적으로 접수되었습니다. 감사합니다!",
        });
        form.reset();
      })
      .catch((error) => {
        console.error(error);
        setState({
          formStatus: "error",
          formMessage: "메일 전송에 실패했습니다. 잠시 후 다시 시도해주세요.",
        });
      });
  };

  fieldNames.forEach((field) => {
    document.getElementById(field).addEventListener("input", makeFieldInputHandler(field));
  });

  form.addEventListener("submit", handleFormSubmit);
};

// 7. 초기화 · 이벤트 핸들러
const getInitialTheme = () => {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "dark" || saved === "light") {
    return saved;
  }
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
};

const handleSystemThemeChange = (event) => {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "dark" || saved === "light") {
    return;
  }
  setState({ theme: event.matches ? "dark" : "light" });
};

const handleThemeToggleClick = () => {
  const next = STATE.theme === "dark" ? "light" : "dark";
  localStorage.setItem(THEME_KEY, next);
  setState({ theme: next });
};

const handleHamburgerClick = () => {
  setState({ navOpen: !STATE.navOpen });
};

const handleNavLinkClick = (event) => {
  event.preventDefault();
  const target = document.querySelector(event.currentTarget.getAttribute("href"));
  target?.scrollIntoView({ behavior: "smooth" });
  setState({ navOpen: false });
};

const handleScroll = () => {
  const scrolled = window.scrollY > NAV_SCROLL_THRESHOLD;
  const showScrollTop = window.scrollY > SCROLL_TOP_THRESHOLD;

  if (scrolled !== STATE.scrolled || showScrollTop !== STATE.showScrollTop) {
    setState({ scrolled, showScrollTop });
  }
};

const handleScrollTopClick = () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const handleKeydown = (event) => {
  if (event.key === "Escape" && STATE.navOpen) {
    setState({ navOpen: false });
    document.getElementById("hamburger").focus();
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  setState({ theme: getInitialTheme() });
  document.getElementById("theme-toggle").addEventListener("click", handleThemeToggleClick);

  const darkSchemeQuery = window.matchMedia?.("(prefers-color-scheme: dark)");
  if (darkSchemeQuery) {
    if (darkSchemeQuery.addEventListener) {
      darkSchemeQuery.addEventListener("change", handleSystemThemeChange);
    } else if (darkSchemeQuery.addListener) {
      darkSchemeQuery.addListener(handleSystemThemeChange);
    }
  }

  document.getElementById("hamburger").addEventListener("click", handleHamburgerClick);
  document.addEventListener("keydown", handleKeydown);

  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", handleNavLinkClick);
  });

  window.addEventListener("scroll", handleScroll);
  document.getElementById("scroll-top").addEventListener("click", handleScrollTopClick);

  observeReveal();

  const res = await fetch("data/info.json");
  const data = await res.json();

  const { hero, about, skills, footer, github } = data;

  typeText(document.getElementById("hero-greeting"), hero.greeting);
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

  loadProjects(github.username);
  initContactForm();
});
