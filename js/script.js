// ============================================================
// 0. 공통 변수
//    - var 대신 const/let만 사용 (과제 요구사항)
//    - 모든 DOM 조작은 querySelector 계열 + addEventListener로 처리하고,
//      HTML에는 onclick 속성을 절대 쓰지 않는다.
// ============================================================
// [index.html 연동] <html lang="ko"> 요소 자체를 가리킨다.
// renderTheme()이 이 root에 data-theme 속성을 붙였다 떼었다 하면,
// css/style.css의 `[data-theme="dark"] { --color-bg: ...; }` 규칙이 켜지면서
// :root에서 정의한 CSS 변수 값이 전부 바뀌어 페이지 전체 배색이 바뀐다.
const root = document.documentElement;
const THEME_KEY = "portfolio-theme"; // localStorage에 저장할 때 쓰는 키 이름

// 기준값들은 README에도 동일하게 명시한다 (자유 변경 가능하지만 값을 고정해서 문서화)
const NAV_SCROLL_THRESHOLD = 60;   // 이 값(px) 이상 스크롤하면 header에 .scrolled 부여
const SCROLL_TOP_THRESHOLD = 300;  // 이 값(px) 이상 스크롤하면 맨 위로 버튼 표시
const REVEAL_THRESHOLD = 0.2;      // IntersectionObserver: 요소가 20% 보이면 애니메이션 실행
const FETCH_TIMEOUT_MS = 8000;     // GitHub API 응답을 이 시간(ms) 이상 기다리지 않음
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// [index.html 연동] index.html에는 class="reveal"이 붙은 <section> 5개
// (hero/about/skills/projects/contact)와, GitHub API 응답으로 나중에 생기는
// <article class="project-card reveal"> 카드들이 있다. 이 관찰자 하나가
// 그 모든 .reveal 요소를 공통으로 지켜보다가, 화면에 20% 이상 들어오는 순간
// css/style.css의 `.reveal.visible` 규칙이 켜지도록 class="visible"만 추가해준다.
// (실제 애니메이션 값 자체는 CSS가 담당하고, JS는 "언제"만 결정한다)
// 이 관찰 결과는 "다시 보여줄 필요가 없는 1회성 트리거"라서 STATE로 관리하지 않는다
// (아래 STATE는 "화면을 다시 그릴 때 참고해야 하는 값"만 모아둔 것).
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
// scope를 인자로 받는 이유: 페이지 최초 로드 시(document 전체)뿐 아니라,
// GitHub API 응답으로 #projects-list 안에 새 카드가 추가된 "이후"에도
// 그 카드들만 다시 관찰 등록해야 하기 때문이다 (renderProjects()에서 재사용).
const observeReveal = (scope = document) => {
  scope.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));
};

// ============================================================
// 1. 중앙 상태 객체 (STATE)
//    React의 state와 같은 역할을 한다: "이벤트가 발생하면 DOM을 바로 건드리지 않고,
//    먼저 STATE의 값을 바꾼 뒤(setState) → 그 값을 화면에 반영(render)한다."
//    이렇게 하면 "지금 앱이 어떤 상태인지"를 이 객체 하나만 보고 알 수 있고,
//    화면을 갱신하는 로직(render 함수들)이 한 곳에 모여 재사용/디버깅이 쉬워진다.
//
//    반대로 data/info.json으로 채우는 hero/about/skills/footer 콘텐츠는
//    "한 번 fetch해서 한 번 그리고 끝"인 정적인 값이라 STATE에 넣지 않았다.
//    STATE에는 "사용자 인터랙션에 따라 바뀌고, 그때마다 다시 그려야 하는 값"만 둔다.
// ============================================================
const STATE = {
  theme: "light",              // "light" | "dark" — 다크모드 토글
  navOpen: false,               // 모바일 햄버거 메뉴 열림 여부
  scrolled: false,               // 헤더 스크롤 배경 전환 여부 (NAV_SCROLL_THRESHOLD 기준)
  showScrollTop: false,          // 스크롤탑 버튼 표시 여부 (SCROLL_TOP_THRESHOLD 기준)
  projects: {
    status: "idle",              // "idle" | "loading" | "success" | "empty" | "error"
    items: [],                   // 성공 시 GitHub 저장소 배열
    username: "",                // 재시도 버튼이 다시 fetch할 때 사용
    message: "",                 // "error" 상태일 때 원인별로 다르게 보여줄 안내 문구
  },
  formErrors: { name: "", email: "", message: "" },
  formSuccess: "",
};

// ============================================================
// 2. render 함수들
//    각 함수는 "STATE를 읽어서 DOM에 반영"만 한다 (STATE를 직접 바꾸지 않는다).
//    여러 번 호출돼도 항상 같은 결과가 나오도록(=STATE 값이 곧 화면) 작성한다.
// ============================================================
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
  // navMenu(#nav-menu)에 .active가 붙으면 css `nav ul.active`가 display:none → flex로 바꿔
  // 모바일 드롭다운 메뉴가 펼쳐진다.
  navMenu.classList.toggle("active", STATE.navOpen);
  // hamburger(#hamburger) 자신에도 .active가 붙으면 css `.hamburger.active span:nth-child(n)`이
  // 3개의 막대를 "X"자로 회전시킨다.
  hamburger.classList.toggle("active", STATE.navOpen);
  hamburger.setAttribute("aria-expanded", String(STATE.navOpen));
};

const renderHeaderScroll = () => {
  // [index.html 연동] <header id="site-header">. css `header.scrolled`가
  // 배경색/그림자를 더 진하게 바꾼다.
  document.getElementById("site-header").classList.toggle("scrolled", STATE.scrolled);
};

const renderScrollTopButton = () => {
  // [index.html 연동] <button id="scroll-top">. css `.scroll-top.show`가
  // opacity/visibility를 켜서 버튼을 서서히 나타나게 한다.
  document.getElementById("scroll-top").classList.toggle("show", STATE.showScrollTop);
};

const renderProjects = () => {
  // [index.html 연동] <div id="projects-status">(로딩/에러/빈 상태 문구)와
  // <div id="projects-list">(실제 카드)를 STATE.projects의 값에 맞춰 통째로 다시 그린다.
  const { status, items, username, message } = STATE.projects;
  const statusEl = document.getElementById("projects-status");
  const listEl = document.getElementById("projects-list");

  if (status === "loading") {
    statusEl.innerHTML = `<p class="loading">프로젝트를 불러오는 중...</p>`;
    listEl.innerHTML = "";
    return;
  }

  if (status === "error") {
    // message는 loadProjects()의 catch에서 원인(상태코드/네트워크/타임아웃)별로
    // 구체적으로 채워 넣는다. 화면에는 그 문구를 그대로 보여준다.
    statusEl.innerHTML = `
      <p class="error">${message}</p>
      <button id="retry-btn" type="button">다시 시도</button>
    `;
    listEl.innerHTML = "";
    // innerHTML로 새로 만든 버튼이라 onclick 속성 대신
    // 삽입 이후 addEventListener로 이벤트를 연결해야 규칙(onclick 금지)을 지킬 수 있다.
    const handleRetryClick = () => loadProjects(username);
    document.getElementById("retry-btn").addEventListener("click", handleRetryClick);
    return;
  }

  if (status === "empty") {
    statusEl.innerHTML = `<p class="empty">표시할 프로젝트가 없습니다.</p>`;
    listEl.innerHTML = "";
    return;
  }

  if (status === "success") {
    statusEl.innerHTML = "";
    // map: repo 객체 배열 → 카드 HTML 문자열 배열로 변환 (템플릿 리터럴 사용)
    // 구조분해 할당으로 필요한 필드만 꺼내 쓴다.
    listEl.innerHTML = items
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
    // innerHTML로 새로 삽입된 .reveal 요소는 페이지 로드 시점의 observeReveal() 호출
    // 범위에 없었으므로(그때는 DOM에 존재하지도 않았다) 반드시 다시 관찰 등록해야
    // 스크롤 애니메이션이 적용된다.
    observeReveal(listEl);
    return;
  }

  // status === "idle": 아직 fetch를 시작하기 전(초기값) — 아무것도 표시하지 않는다.
  statusEl.innerHTML = "";
  listEl.innerHTML = "";
};

const renderFormErrors = () => {
  // [index.html 연동] index.html의 3쌍 — <input id="name">+<span id="name-error">,
  // <input id="email">+<span id="email-error">, <textarea id="message">+
  // <span id="message-error">. STATE.formErrors의 키(name/email/message)가
  // 그대로 각 input/span의 id와 대응된다.
  Object.entries(STATE.formErrors).forEach(([field, message]) => {
    document.getElementById(`${field}-error`).textContent = message;
    // css `.error-message`가 빨간 글씨를, `input.invalid`가 빨간 테두리를 담당한다.
    document.getElementById(field).classList.toggle("invalid", Boolean(message));
  });
  // [index.html 연동] <p id="form-success">.
  document.getElementById("form-success").textContent = STATE.formSuccess;
};

// ============================================================
// 3. setState — STATE를 바꾸는 유일한 통로
//    "어떤 키가 바뀌었는지"에 따라 그 키를 화면에 반영하는 render 함수만 골라서 실행한다.
//    (예: 스크롤 이벤트는 매우 자주 발생하는데, 그때마다 프로젝트 카드나 폼까지
//     통째로 다시 그리면 낭비이자 버그(진행 중이던 애니메이션이 끊기는 등)의 원인이 된다.
//     그래서 "바뀐 키 → 그 키 담당 render 함수"만 실행되도록 매핑해둔다.)
// ============================================================
const RENDERERS = {
  theme: renderTheme,
  navOpen: renderNav,
  scrolled: renderHeaderScroll,
  showScrollTop: renderScrollTopButton,
  projects: renderProjects,
  formErrors: renderFormErrors,
  formSuccess: renderFormErrors,
};

const setState = (patch) => {
  Object.assign(STATE, patch); // 얕은 병합 — patch에 준 키만 STATE에 덮어쓴다
  // Set을 쓰는 이유: formErrors/formSuccess처럼 서로 다른 키가 같은 render 함수를
  // 가리키는 경우, 한 번의 setState 호출({formErrors, formSuccess}를 동시에 patch)에서
  // renderFormErrors가 두 번 실행되는 것을 막기 위함.
  const renderersToRun = new Set(
    Object.keys(patch)
      .map((key) => RENDERERS[key])
      .filter(Boolean)
  );
  renderersToRun.forEach((renderFn) => renderFn());
};

// ============================================================
// 4. GitHub API 연동 (상태 흐름 예시 ①)
//    이벤트(페이지 로드 / 재시도 버튼 클릭)
//    → setState로 STATE.projects 변경(로딩→성공/빈/에러)
//    → renderProjects()가 #projects-status, #projects-list를 갱신
// ============================================================
// fetch에는 자체 타임아웃이 없다. AbortController로 일정 시간(FETCH_TIMEOUT_MS)
// 안에 응답이 오지 않으면 요청을 강제로 취소해, 응답이 느린 네트워크에서
// "로딩 중..." 상태로 무한정 멈춰 있는 것을 방지한다.
const fetchWithTimeout = async (url, timeoutMs = FETCH_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeoutId); // 응답이 제때 왔다면 예약해둔 취소를 취소한다
  }
};

// HTTP 상태 코드별로 사용자에게 보여줄 메시지를 구체화한다.
// (모든 실패를 "프로젝트를 불러올 수 없습니다"로 뭉뚱그리지 않기 위함)
const getGitHubErrorMessage = (status) => {
  if (status === 403) return "GitHub API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.";
  if (status === 404) return "해당 GitHub 사용자를 찾을 수 없습니다.";
  if (status >= 500) return "GitHub 서버에 일시적인 문제가 발생했습니다.";
  return `프로젝트를 불러올 수 없습니다. (오류 코드: ${status})`;
};

const loadProjects = async (username) => {
  setState({ projects: { status: "loading", items: [], username, message: "" } });

  try {
    const res = await fetchWithTimeout(
      `https://api.github.com/users/${username}/repos?sort=updated`
    );

    // fetch는 404/500이어도 예외를 던지지 않으므로 res.ok를 직접 확인해야 한다.
    if (!res.ok) {
      throw new Error(getGitHubErrorMessage(res.status));
    }

    const repos = await res.json();

    // filter: 내가 만든 저장소만 남기고 fork한 저장소는 제외 (배열 메서드 활용)
    const ownRepos = repos.filter((repo) => !repo.fork);

    if (ownRepos.length === 0) {
      setState({ projects: { status: "empty", items: [], username, message: "" } });
      return;
    }

    setState({ projects: { status: "success", items: ownRepos, username, message: "" } });
  } catch (error) {
    console.error(error);

    // 에러 종류에 따라 사용자에게 보여줄 메시지를 구분한다.
    //  - AbortError: fetchWithTimeout이 타임아웃으로 강제 취소한 경우
    //  - TypeError: 오프라인 등 네트워크 자체가 실패한 경우 (fetch가 이 타입으로 던짐)
    //  - 그 외: 위에서 getGitHubErrorMessage()로 만든 상태코드 기반 메시지(error.message)
    let message = error.message || "프로젝트를 불러올 수 없습니다.";
    if (error.name === "AbortError") {
      message = "요청 시간이 초과되었습니다. 네트워크 상태를 확인 후 다시 시도해주세요.";
    } else if (error instanceof TypeError) {
      message = "네트워크 연결을 확인해주세요.";
    }

    setState({ projects: { status: "error", items: [], username, message } });
  }
};

// ============================================================
// 5. 문의 폼 유효성 검사 (상태 흐름 예시 ②)
//    이벤트(input 입력 / submit 클릭)
//    → setState로 STATE.formErrors / STATE.formSuccess 변경
//    → renderFormErrors()가 에러 메시지·성공 메시지를 갱신
// ============================================================
const initContactForm = () => {
  const form = document.getElementById("contact-form");
  const fieldNames = ["name", "email", "message"];

  // 필드 하나의 값을 읽어 유효성 메시지를 반환한다 (통과하면 빈 문자열).
  const validateField = (field) => {
    const value = document.getElementById(field).value.trim();
    if (!value) return "필수 입력 항목입니다.";
    if (field === "email" && !EMAIL_REGEX.test(value)) return "올바른 이메일 형식이 아닙니다.";
    return "";
  };

  // 검증 결과를 STATE.formErrors에 반영(setState)하고, 통과 여부(boolean)를 반환한다.
  const validateAndSetField = (field) => {
    const message = validateField(field);
    setState({ formErrors: { ...STATE.formErrors, [field]: message } });
    return message === "";
  };

  // 필드 하나의 input 이벤트를 처리하는 핸들러를 필드별로 만들어 반환한다.
  // (익명 콜백 대신 이름 붙은 함수로 분리해 각 필드가 무엇을 하는 핸들러인지
  // 드러나게 하고, 필요하면 다른 곳에서도 재사용할 수 있게 한다)
  const makeFieldInputHandler = (field) => () => validateAndSetField(field);

  const handleFormSubmit = (event) => {
    event.preventDefault(); // 폼의 기본 제출(페이지 새로고침) 방지

    // map + every: 모든 필드를 검증하고, 하나라도 실패하면 전체를 실패로 처리
    const isValid = fieldNames.map((field) => validateAndSetField(field)).every(Boolean);

    if (!isValid) {
      // 유효성 실패 시 이전에 남아있을 수 있는 성공 메시지를 비운다.
      setState({ formSuccess: "" });
      return;
    }

    setState({ formSuccess: "문의가 성공적으로 접수되었습니다. 감사합니다!" });
    form.reset();
  };

  // [index.html 연동] 각 <input>/<textarea>에 input 이벤트를 건다.
  // 타이핑하는 동안 실시간으로 에러 상태를 갱신해
  // "제출을 눌러야만 에러를 아는" 불편함을 줄인다.
  fieldNames.forEach((field) => {
    document.getElementById(field).addEventListener("input", makeFieldInputHandler(field));
  });

  // [index.html 연동] <form id="contact-form">의 submit 이벤트
  // (버튼의 onclick이 아니라 폼의 submit을 듣는 이유: Enter 키 제출도 함께 잡기 위함).
  form.addEventListener("submit", handleFormSubmit);
};

// ============================================================
// 6. 초기화
// ============================================================
// 저장된 테마가 없을 때(첫 방문) 화면을 무엇으로 시작할지 결정한다.
// 1순위: localStorage에 사용자가 이전에 직접 고른 값
// 2순위: OS/브라우저의 "어두운 화면" 선호도(prefers-color-scheme) — 시스템이 다크모드면
//        굳이 밝은 화면으로 시작해 사용자가 매번 토글을 누르게 하지 않기 위함
// 3순위: 위 둘 다 없으면 기본값 "light"
const getInitialTheme = () => {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "dark" || saved === "light") {
    return saved;
  }
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
};

// 아래는 각 인터랙션의 이벤트 핸들러를 이름 붙은 함수로 분리한 것이다.
// addEventListener에 매번 새 익명 함수를 넘기는 대신 이렇게 분리해두면,
// 핸들러 이름만 보고도 무슨 동작인지 알 수 있고 필요하면 다른 곳에서도 재사용할 수 있다.
const handleThemeToggleClick = () => {
  const next = STATE.theme === "dark" ? "light" : "dark";
  localStorage.setItem(THEME_KEY, next); // 새로고침 후에도 유지되어야 하므로 저장
  setState({ theme: next });
};

const handleHamburgerClick = () => {
  setState({ navOpen: !STATE.navOpen });
};

// [index.html 연동] <ul id="nav-menu"> 안의 5개 <a class="nav-link" href="#섹션id">
// 클릭을 처리한다. class="nav-link"는 CSS가 아니라 이 핸들러를 연결하기 위한 훅이다.
const handleNavLinkClick = (event) => {
  event.preventDefault(); // <a href="#id">의 기본 동작(순간 이동) 방지
  const target = document.querySelector(event.currentTarget.getAttribute("href"));
  target?.scrollIntoView({ behavior: "smooth" });
  setState({ navOpen: false }); // 모바일에서 링크 클릭 후 드롭다운 자동 닫힘
};

const handleScroll = () => {
  const scrolled = window.scrollY > NAV_SCROLL_THRESHOLD;
  const showScrollTop = window.scrollY > SCROLL_TOP_THRESHOLD;
  // 값이 실제로 바뀔 때만 setState를 호출한다 — 스크롤 이벤트는 초당 수십 번씩
  // 발생하는데, 그때마다 render를 실행하면 낭비이기 때문에 "경계를 막 넘은 순간"에만
  // 상태를 갱신한다.
  if (scrolled !== STATE.scrolled || showScrollTop !== STATE.showScrollTop) {
    setState({ scrolled, showScrollTop });
  }
};

const handleScrollTopClick = () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
};

// [접근성] 햄버거 메뉴가 열려 있을 때 Esc 키를 누르면 메뉴를 닫고,
// 포커스를 다시 햄버거 버튼으로 돌려준다. 마우스 없이 키보드만으로 탐색하는
// 사용자가 메뉴를 열었다가 마우스 클릭 없이도 빠져나올 수 있게 하기 위함이다.
const handleKeydown = (event) => {
  if (event.key === "Escape" && STATE.navOpen) {
    setState({ navOpen: false });
    document.getElementById("hamburger").focus();
  }
};

// script.js는 <head>에서 defer로 로드되므로 DOM 파싱은 이미 끝나 있지만,
// 아래처럼 DOMContentLoaded로 한 번 더 감싸도 안전하다 — defer 스크립트는
// DOMContentLoaded 이벤트가 "발생하기 직전"에 실행되므로 이 리스너는
// 반드시 등록 시점보다 뒤에 호출된다.
document.addEventListener("DOMContentLoaded", async () => {
  // ---- 다크모드 초기화 + 토글 이벤트 연결 (상태 흐름 예시 ③) ----
  // 이벤트(버튼 클릭) → setState로 STATE.theme 변경 → renderTheme()이 <html>의
  // data-theme 속성과 버튼 아이콘을 갱신 → css [data-theme="dark"]가 전체 배색을 바꾼다.
  setState({ theme: getInitialTheme() });
  document.getElementById("theme-toggle").addEventListener("click", handleThemeToggleClick);

  // ---- 햄버거 메뉴 토글 (+ Esc로 닫기) ----
  document.getElementById("hamburger").addEventListener("click", handleHamburgerClick);
  document.addEventListener("keydown", handleKeydown);

  // ---- 부드러운 스크롤 + 메뉴 클릭 시 자동 닫힘 ----
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", handleNavLinkClick);
  });

  // ---- 스크롤 이벤트: 네비 배경 변경 + 스크롤탑 버튼 표시/숨김 ----
  window.addEventListener("scroll", handleScroll);
  document.getElementById("scroll-top").addEventListener("click", handleScrollTopClick);

  // ---- 스크롤 애니메이션 (Intersection Observer) ----
  // 지금 이 시점에 index.html에 이미 존재하는 5개의 <section class="reveal">을
  // 전부 찾아서 관찰을 시작한다 (GitHub API로 나중에 추가되는 카드는
  // renderProjects() 안에서 별도로 observeReveal(listEl)을 한 번 더 호출한다).
  observeReveal();

  // ---- info.json 기반 콘텐츠 채우기 (1회성 정적 콘텐츠 — STATE 밖에서 직접 렌더) ----
  // index.html 자체에는 문구가 하나도 없다(빈 태그만 존재). 아래에서
  // data/info.json을 fetch해 그 값들을 각 요소에 채워 넣어야 화면에 보인다.
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

  // ---- GitHub API 연동 / 문의 폼 ----
  loadProjects(github.username);
  initContactForm();
});
