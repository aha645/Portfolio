// ============================================================
// 0. 공통 변수
//    - var 대신 const/let만 사용 (과제 요구사항)
//    - 모든 DOM 조작은 querySelector 계열 + addEventListener로 처리하고,
//      HTML에는 onclick 속성을 절대 쓰지 않는다.
// ============================================================
const root = document.documentElement; // <html> 요소, data-theme 속성을 여기에 토글한다
const THEME_KEY = "portfolio-theme";

// 기준값들은 README에도 동일하게 명시한다 (자유 변경 가능하지만 값을 고정해서 문서화)
const NAV_SCROLL_THRESHOLD = 60;   // 이 값(px) 이상 스크롤하면 header에 .scrolled 부여
const SCROLL_TOP_THRESHOLD = 300;  // 이 값(px) 이상 스크롤하면 맨 위로 버튼 표시
const REVEAL_THRESHOLD = 0.2;      // IntersectionObserver: 요소가 20% 보이면 애니메이션 실행

// 정적 섹션(.reveal)과 GitHub API로 나중에 추가되는 프로젝트 카드(.reveal) 모두
// 같은 관찰자 하나를 재사용한다 (observer를 여러 개 만들 필요가 없다).
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target); // 한 번 보여준 요소는 다시 관찰할 필요 없음
      }
    });
  },
  { threshold: REVEAL_THRESHOLD }
);
const observeReveal = (scope = document) => {
  scope.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));
};

// ============================================================
// 상태 흐름 1: 다크 모드 토글
//   이벤트(버튼 클릭) → 상태 변경(data-theme 속성 + localStorage) → 렌더링(전체 배색 변경)
//   CSS의 [data-theme="dark"] 선택자가 CSS 변수 값을 바꿔주므로
//   JS는 "상태(속성값)"만 바꾸면 되고 개별 요소 스타일을 일일이 건드릴 필요가 없다.
// ============================================================
const applyTheme = (theme) => {
  root.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme); // 새로고침 후에도 유지되어야 하므로 저장
  const toggleBtn = document.getElementById("theme-toggle");
  if (toggleBtn) {
    toggleBtn.textContent = theme === "dark" ? "☀️" : "🌙";
  }
};

const initTheme = () => {
  const saved = localStorage.getItem(THEME_KEY);
  applyTheme(saved === "dark" ? "dark" : "light");
};

document.addEventListener("DOMContentLoaded", async () => {
  // ---- 다크모드 초기화 + 토글 이벤트 연결 ----
  initTheme();
  document.getElementById("theme-toggle").addEventListener("click", () => {
    const current = root.getAttribute("data-theme");
    applyTheme(current === "dark" ? "light" : "dark");
  });

  // ---- 햄버거 메뉴 토글 ----
  // classList.toggle의 반환값(boolean)을 그대로 활용해
  // 메뉴가 열렸는지 닫혔는지에 따라 아이콘(.active)과 aria-expanded를 동기화한다.
  const hamburger = document.getElementById("hamburger");
  const navMenu = document.getElementById("nav-menu");

  hamburger.addEventListener("click", () => {
    const isOpen = navMenu.classList.toggle("active");
    hamburger.classList.toggle("active", isOpen);
    hamburger.setAttribute("aria-expanded", String(isOpen));
  });

  // ---- 부드러운 스크롤 + 메뉴 클릭 시 자동 닫힘 ----
  // <a href="#id">의 기본 동작(순간 이동)을 preventDefault로 막고,
  // scrollIntoView({ behavior: "smooth" })로 직접 부드럽게 이동시킨다.
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const targetId = link.getAttribute("href");
      const target = document.querySelector(targetId);
      target?.scrollIntoView({ behavior: "smooth" });

      // 모바일에서 메뉴 클릭 후 드롭다운이 계속 열려 있으면 불편하므로 닫아준다.
      navMenu.classList.remove("active");
      hamburger.classList.remove("active");
      hamburger.setAttribute("aria-expanded", "false");
    });
  });

  // ---- 스크롤 이벤트: 네비 배경 변경 + 스크롤탑 버튼 표시/숨김 ----
  const header = document.getElementById("site-header");
  const scrollTopBtn = document.getElementById("scroll-top");

  window.addEventListener("scroll", () => {
    header.classList.toggle("scrolled", window.scrollY > NAV_SCROLL_THRESHOLD);
    scrollTopBtn.classList.toggle("show", window.scrollY > SCROLL_TOP_THRESHOLD);
  });

  scrollTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // ---- 스크롤 애니메이션 (Intersection Observer) ----
  // 각 섹션에 미리 넣어둔 .reveal 클래스(opacity:0 + translateY)를
  // 화면에 20% 이상 들어오는 순간 .visible로 바꿔 CSS transition이 실행되게 한다.
  observeReveal();

  // ---- info.json 기반 콘텐츠 채우기 ----
  const res = await fetch("data/info.json");
  const data = await res.json();

  // 구조분해 할당으로 필요한 값만 바로 꺼내 쓴다.
  const { hero, about, skills, footer, github } = data;

  document.getElementById("hero-greeting").textContent = hero.greeting;
  const cta = document.getElementById("hero-cta");
  cta.textContent = hero.ctaText;
  cta.href = hero.ctaLink;

  const aboutImg = document.getElementById("about-img");
  aboutImg.src = about.image;
  aboutImg.alt = about.imageAlt; // 의미있는 alt
  document.getElementById("about-text").textContent = about.text;

  // forEach: 배열을 순회하며 DOM 노드를 하나씩 추가
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

  // ---- GitHub API 연동 ----
  loadProjects(github.username);

  // ---- 문의 폼 유효성 검사 ----
  initContactForm();
});

// ============================================================
// 상태 흐름 2: GitHub API 연동
//   이벤트(페이지 로드 / 재시도 버튼 클릭)
//   → 상태 변경(로딩 → 성공 또는 에러 → 빈 상태 가능)
//   → 렌더링(#projects-status, #projects-list의 innerHTML 교체)
// ============================================================
const renderStatus = (html) => {
  document.getElementById("projects-status").innerHTML = html;
};

const renderProjects = (repos) => {
  const container = document.getElementById("projects-list");

  // map: repo 객체 배열 → 카드 HTML 문자열 배열로 변환 (템플릿 리터럴 사용)
  // 구조분해 할당으로 필요한 필드만 꺼내 쓴다.
  container.innerHTML = repos
    .map(({ name, description, html_url, language, stargazers_count }) => `
      <article class="project-card reveal">
        <h3>${name}</h3>
        <p>${description ?? "설명이 없습니다."}</p>
        <div class="project-meta">
          ${language ? `<span class="badge">${language}</span>` : ""}
          <span class="badge">⭐ ${stargazers_count}</span>
        </div>
        <a href="${html_url}" target="_blank" rel="noopener">GitHub에서 보기</a>
      </article>
    `)
    .join("");

  // 새로 생성된 카드도 스크롤 등장 애니메이션 대상에 포함시킨다.
  observeReveal(container);
};

const loadProjects = async (username) => {
  // 1) 로딩 상태: 요청 시작과 동시에 안내 문구 표시
  renderStatus(`<p class="loading">프로젝트를 불러오는 중...</p>`);
  document.getElementById("projects-list").innerHTML = "";

  try {
    const res = await fetch(`https://api.github.com/users/${username}/repos?sort=updated`);

    // fetch는 404/500이어도 예외를 던지지 않으므로 res.ok를 직접 확인해야 한다.
    if (!res.ok) {
      throw new Error(`GitHub API 오류: ${res.status}`);
    }

    const repos = await res.json();

    // filter: 내가 만든 저장소만 남기고 fork한 저장소는 제외 (배열 메서드 활용)
    const ownRepos = repos.filter((repo) => !repo.fork);

    // 2) 빈 상태: 요청은 성공했지만 표시할 데이터가 없는 경우
    if (ownRepos.length === 0) {
      renderStatus(`<p class="empty">표시할 프로젝트가 없습니다.</p>`);
      return;
    }

    // 3) 성공 상태
    renderStatus("");
    renderProjects(ownRepos);
  } catch (error) {
    // 4) 에러 상태: 네트워크 오류, API 오류 등 → 메시지 + 재시도 버튼
    console.error(error);
    renderStatus(`
      <p class="error">프로젝트를 불러올 수 없습니다.</p>
      <button id="retry-btn" type="button">다시 시도</button>
    `);

    // innerHTML로 새로 만든 버튼이라 onclick 속성 대신
    // 삽입 이후 addEventListener로 이벤트를 연결해야 규칙(onclick 금지)을 지킬 수 있다.
    document.getElementById("retry-btn").addEventListener("click", () => loadProjects(username));
  }
};

// ============================================================
// 상태 흐름 3: 문의 폼 유효성 검사
//   이벤트(input 입력 / submit 클릭)
//   → 상태 변경(각 필드의 유효성 결과)
//   → 렌더링(에러 메시지 표시/숨김, invalid 클래스, 성공 메시지)
// ============================================================
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const initContactForm = () => {
  const form = document.getElementById("contact-form");
  const successMsg = document.getElementById("form-success");

  // 필드별 input/에러메시지 엘리먼트를 한 곳에서 관리 (반복 코드 최소화)
  const fields = {
    name: {
      input: document.getElementById("name"),
      error: document.getElementById("name-error"),
    },
    email: {
      input: document.getElementById("email"),
      error: document.getElementById("email-error"),
    },
    message: {
      input: document.getElementById("message"),
      error: document.getElementById("message-error"),
    },
  };

  const setFieldError = (field, message) => {
    const { input, error } = fields[field];
    error.textContent = message;
    input.classList.toggle("invalid", Boolean(message));
  };

  // 필드 하나를 검증하고, 통과 여부(boolean)를 반환한다.
  const validateField = (field) => {
    const { input } = fields[field];
    const value = input.value.trim();

    if (!value) {
      setFieldError(field, "필수 입력 항목입니다.");
      return false;
    }
    if (field === "email" && !EMAIL_REGEX.test(value)) {
      setFieldError(field, "올바른 이메일 형식이 아닙니다.");
      return false;
    }

    setFieldError(field, "");
    return true;
  };

  // input 이벤트: 타이핑하는 동안 실시간으로 에러 상태를 갱신해
  // "제출을 눌러야만 에러를 아는" 불편함을 줄인다.
  Object.keys(fields).forEach((field) => {
    fields[field].input.addEventListener("input", () => validateField(field));
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault(); // 폼의 기본 제출(페이지 새로고침) 방지

    // map + every: 모든 필드를 검증하고, 하나라도 실패하면 전체를 실패로 처리
    const isValid = Object.keys(fields)
      .map((field) => validateField(field))
      .every(Boolean);

    if (!isValid) {
      successMsg.textContent = "";
      return;
    }

    successMsg.textContent = "문의가 성공적으로 접수되었습니다. 감사합니다!";
    form.reset();
  });
};
