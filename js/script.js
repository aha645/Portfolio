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
const TYPING_SPEED_MS = 80;        // Hero 타이핑 효과: 한 글자당 이 시간(ms)만큼 지연
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// [보안] GitHub API가 돌려주는 저장소 이름/설명/언어/URL은 "우리가 통제할 수 없는 외부 문자열"이다.
// 이 값들을 템플릿 리터럴로 조합해 innerHTML에 그대로 넣으면, 문자열 안에 <img onerror=...>
// 같은 HTML/스크립트가 섞여 있을 경우 브라우저가 진짜 태그로 해석해 실행해버린다(XSS).
// 삽입 전 <, >, &, ", ' 를 HTML 엔티티로 바꿔서 "글자 그대로의 텍스트"로만 표시되게 만든다.
const escapeHtml = (value) => {
  const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return String(value).replace(/[&<>"']/g, (ch) => entities[ch]);
};

// [index.html 연동] <h1 id="hero-greeting">에 문구를 한 글자씩 타이핑하듯 채워 넣는다.
// 스크롤 애니메이션(revealObserver)과 마찬가지로 "한 번 실행되고 끝나는" 연출이라
// STATE로 관리하지 않고 독립적인 함수로 처리한다 (매 글자마다 setState를 거치면
// 불필요하게 무거워질 뿐 아니라, 이 텍스트는 애초에 사용자 인터랙션으로 바뀌는
// 값이 아니라서 "다시 그릴 필요가 있는 상태"에 해당하지 않는다).
const typeText = (el, text, speed = TYPING_SPEED_MS) => {
  // [접근성] 화면 움직임에 민감한 사용자를 위한 시스템 설정을 존중해,
  // 이 설정이 켜져 있으면 애니메이션 없이 텍스트를 바로 전부 보여준다.
  const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) {
    el.textContent = text;
    return;
  }

  el.textContent = "";
  // css `#hero-greeting.typing::after`가 이 클래스를 보고 깜빡이는 커서(|)를 그려준다.
  el.classList.add("typing");

  let i = 0;
  const step = () => {
    if (i < text.length) {
      el.textContent += text[i];
      i += 1;
      setTimeout(step, speed);
    } else {
      el.classList.remove("typing"); // 다 타이핑되면 커서를 없애 완성된 문장처럼 보이게 함
    }
  };
  step();
};

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
    items: [],                   // 성공 시 GitHub 저장소 배열 (필터와 무관하게 항상 전체 목록)
    username: "",                // 재시도 버튼이 다시 fetch할 때 사용
    message: "",                 // "error" 상태일 때 원인별로 다르게 보여줄 안내 문구
    filter: "all",                // "all" | 특정 언어 문자열 — 언어별 필터 버튼 선택 상태
  },
  formErrors: { name: "", email: "", message: "" },
  formStatus: "idle",           // "idle" | "sending" | "success" | "error" — EmailJS 전송 상태
  formMessage: "",              // formStatus가 success/error일 때 보여줄 안내 문구
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

// [index.html 연동] <div id="projects-filters">. GitHub에서 받아온 저장소들의
// language 값 중 중복을 제거해 "전체" + 언어별 버튼을 동적으로 만든다.
// (요구사항: "프로젝트 내용을 확인한 후" 실제 존재하는 언어만 버튼으로 노출 —
// 고정된 언어 목록을 미리 박아두지 않는다)
const renderProjectFilters = (items, activeFilter) => {
  const filtersEl = document.getElementById("projects-filters");

  // map: repo 배열 → language 값만 추출, filter(Boolean): null/undefined(언어 미지정 저장소) 제거,
  // Set: 중복 제거 → 배열로 다시 펼침
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

  // innerHTML로 새로 만든 버튼들이라 onclick 속성 대신
  // 삽입 이후 addEventListener로 이벤트를 연결해야 규칙(onclick 금지)을 지킬 수 있다.
  filtersEl.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => handleFilterClick(btn.dataset.filter));
  });
};

const renderProjects = () => {
  // [index.html 연동] <div id="projects-filters">(언어 필터 버튼),
  // <div id="projects-status">(로딩/에러/빈 상태 문구),
  // <div id="projects-list">(실제 카드)를 STATE.projects의 값에 맞춰 다시 그린다.
  const { status, items, username, message, filter } = STATE.projects;
  const filtersEl = document.getElementById("projects-filters");
  const statusEl = document.getElementById("projects-status");
  const listEl = document.getElementById("projects-list");

  if (status === "loading") {
    filtersEl.innerHTML = ""; // 아직 목록이 없으니 필터링할 대상도 없음
    statusEl.innerHTML = `<p class="loading">프로젝트를 불러오는 중...</p>`;
    listEl.innerHTML = "";
    return;
  }

  if (status === "error") {
    // message는 loadProjects()의 catch에서 원인(상태코드/네트워크/타임아웃)별로
    // 구체적으로 채워 넣는다. 화면에는 그 문구를 그대로 보여준다.
    filtersEl.innerHTML = "";
    statusEl.innerHTML = `
      <p class="error">${message}</p>
      <button id="retry-btn" type="button">다시 시도</button>
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

    // array.filter(): 선택된 언어(filter)와 일치하는 저장소만 남긴다.
    // "all"이면 거르지 않고 전체를 그대로 사용한다.
    const filteredItems =
      filter === "all" ? items : items.filter((repo) => repo.language === filter);

    if (filteredItems.length === 0) {
      // 언어는 있지만(버튼도 있지만) 그 언어로 필터링하면 결과가 0개인 경우
      // (이론상 버튼 생성 로직상 발생하지 않지만, 안전하게 빈 상태를 보여준다)
      statusEl.innerHTML = `<p class="empty">해당 언어의 프로젝트가 없습니다.</p>`;
      listEl.innerHTML = "";
      return;
    }

    statusEl.innerHTML = "";
    // map: repo 객체 배열 → 카드 HTML 문자열 배열로 변환 (템플릿 리터럴 사용)
    // 구조분해 할당으로 필요한 필드만 꺼내 쓴다.
    // name/description/language/html_url은 GitHub API가 돌려주는 외부 문자열이라
    // escapeHtml()을 거쳐야 innerHTML에 안전하게 삽입된다 (XSS 방지, 위쪽 escapeHtml 정의 참고).
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
    // innerHTML로 새로 삽입된 .reveal 요소는 페이지 로드 시점의 observeReveal() 호출
    // 범위에 없었으므로(그때는 DOM에 존재하지도 않았다) 반드시 다시 관찰 등록해야
    // 스크롤 애니메이션이 적용된다.
    observeReveal(listEl);
    return;
  }

  // status === "idle": 아직 fetch를 시작하기 전(초기값) — 아무것도 표시하지 않는다.
  filtersEl.innerHTML = "";
  statusEl.innerHTML = "";
  listEl.innerHTML = "";
};

// 필터 버튼 클릭(이벤트) → STATE.projects.filter 변경(상태) → renderProjects()가
// #projects-list를 다시 그린다(렌더링). fetch를 다시 하지 않고 이미 받아둔
// STATE.projects.items를 array.filter()로 걸러내기만 한다.
const handleFilterClick = (language) => {
  setState({ projects: { ...STATE.projects, filter: language } });
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
};

// [index.html 연동] <button id="contact-submit">과 <p id="form-status">.
// STATE.formStatus에 따라 제출 버튼을 잠그고(중복 전송 방지) 문구를 바꾼다:
//  - "sending": EmailJS 응답을 기다리는 중 → 버튼 비활성화 + "전송 중..."
//  - "success": 전송 성공 → 성공 문구(success-message 스타일)
//  - "error": 전송 실패(네트워크/EmailJS 설정 문제 등) → 에러 문구(error-message 스타일)
//  - "idle": 아직 제출 전이거나 유효성 검사에 실패한 상태 → 버튼 정상, 문구 없음
const renderFormStatus = () => {
  const submitBtn = document.getElementById("contact-submit");
  const statusEl = document.getElementById("form-status");

  submitBtn.disabled = STATE.formStatus === "sending";
  submitBtn.textContent = STATE.formStatus === "sending" ? "전송 중..." : "보내기";

  statusEl.textContent = STATE.formMessage;
  // className을 통째로 지정해 이전 상태의 클래스(success/error)가 남아있지 않게 한다.
  statusEl.className =
    STATE.formStatus === "error"
      ? "error-message"
      : STATE.formStatus === "success"
        ? "success-message"
        : "";
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
  formStatus: renderFormStatus,
  formMessage: renderFormStatus,
};

const setState = (patch) => {
  Object.assign(STATE, patch); // 얕은 병합 — patch에 준 키만 STATE에 덮어쓴다
  // Set을 쓰는 이유: formStatus/formMessage처럼 서로 다른 키가 같은 render 함수를
  // 가리키는 경우, 한 번의 setState 호출({formStatus, formMessage}를 동시에 patch)에서
  // renderFormStatus가 두 번 실행되는 것을 막기 위함.
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
  // 다시 불러올 때마다 이전에 선택돼 있던 언어 필터는 초기화한다(filter: "all") —
  // 새로 받아온 목록 기준으로 필터 버튼도 다시 만들어지기 때문.
  setState({ projects: { status: "loading", items: [], username, message: "", filter: "all" } });

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
      setState({ projects: { status: "empty", items: [], username, message: "", filter: "all" } });
      return;
    }

    setState({
      projects: { status: "success", items: ownRepos, username, message: "", filter: "all" },
    });
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

    setState({ projects: { status: "error", items: [], username, message, filter: "all" } });
  }
};

// ============================================================
// EmailJS 설정 — 문의 폼 실제 전송
//    emailjs.com 대시보드에서 발급받은 값으로 아래 세 상수를 본인 값으로 교체해야 한다.
//
//    이 프로젝트는 Gmail이 아니라 네이버 메일을 SMTP로 연결해 쓴다:
//      1) 네이버 메일 로그인 → 환경설정 → POP3/IMAP 설정 → "SMTP 사용" 켜기
//         (2단계 인증을 쓰면 별도로 "애플리케이션 비밀번호"를 발급해 그 값을 비밀번호로 사용)
//      2) EmailJS 대시보드 → Email Services → Add New Service → **SMTP Server** 선택
//           - SMTP Server: smtp.naver.com
//           - Port: 587 (Security: STARTTLS) 또는 465 (Security: SSL/TLS)
//           - Username: 본인의 네이버 메일 주소
//           - Password: 위 1)에서 확인한 비밀번호
//      3) Email Templates → Create New Template에서, 이 폼의 input name 속성과
//         동일한 이름의 변수({{name}}, {{email}}, {{message}})로 본문을 작성하고,
//         "To Email"은 본인의 네이버 메일 주소, "Reply To"는 {{email}}로 설정
//      4) 발급된 Service ID / Template ID, Account → General의 Public Key를 아래에 채운다
// ============================================================
const EMAILJS_PUBLIC_KEY = "n1fS48XnUB9-n_G3l";
const EMAILJS_SERVICE_ID = "service_g48smoo";
const EMAILJS_TEMPLATE_ID = "template_rvdgv14";

// index.html에서 EmailJS SDK를 script.js보다 먼저(defer 순서상) 불러오므로,
// 이 시점에 전역 emailjs 객체가 이미 존재하는 것이 정상이다. 다만 CDN 로드 실패
// (네트워크 문제, 광고 차단기 등)에 대비해 존재 여부를 확인 후 초기화한다 — 그렇지
// 않으면 여기서 발생하는 에러 하나가 스크립트 전체 실행을 멈춰 다크모드/햄버거 같은
// 무관한 기능까지 전부 죽어버린다.
if (typeof emailjs !== "undefined") {
  emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
}

// ============================================================
// 5. 문의 폼 유효성 검사 + 실제 전송 (상태 흐름 예시 ②)
//    이벤트(input 입력 / submit 클릭)
//    → setState로 STATE.formErrors(필드별 유효성) / STATE.formStatus·formMessage(전송 상태) 변경
//    → renderFormErrors()/renderFormStatus()가 에러 메시지·전송 상태 문구를 갱신
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
      // 유효성 실패 시 이전에 남아있을 수 있는 전송 성공/실패 문구를 비운다.
      setState({ formStatus: "idle", formMessage: "" });
      return;
    }

    // EmailJS SDK가 로드되지 않았다면(CDN 실패 등) 바로 에러로 처리하고 끝낸다.
    if (typeof emailjs === "undefined") {
      setState({ formStatus: "error", formMessage: "메일 전송 기능을 사용할 수 없습니다." });
      return;
    }

    // 전송 시작: 버튼을 잠그고 "전송 중..."으로 바꿔 중복 클릭을 막는다.
    setState({ formStatus: "sending", formMessage: "" });

    // emailjs.sendForm은 form 엘리먼트 안의 name 속성 있는 입력값(name/email/message)을
    // 그대로 읽어서, EmailJS 템플릿에 만들어둔 같은 이름의 변수({{name}}, {{email}},
    // {{message}})에 매핑해 전송한다. 성공/실패 모두 Promise로 알려준다.
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
        // 네트워크 문제, Service/Template ID 오타, SMTP 인증 실패 등이 여기로 들어온다.
        console.error(error);
        setState({
          formStatus: "error",
          formMessage: "메일 전송에 실패했습니다. 잠시 후 다시 시도해주세요.",
        });
      });
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

// [실시간 반영] 페이지를 열어둔 채로 OS의 다크모드 설정이 바뀌는 경우를 감지한다.
// 단, 사용자가 토글 버튼으로 이미 직접 테마를 고른 적이 있다면(localStorage에 저장됨)
// 그 선택을 존중해 시스템 변경을 무시한다 — 그렇지 않으면 사용자가 일부러 라이트모드로
// 바꿔놨는데 OS 설정이 바뀔 때마다 의도치 않게 테마가 따라 바뀌는 불편함이 생긴다.
const handleSystemThemeChange = (event) => {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "dark" || saved === "light") {
    return; // 사용자가 직접 고른 값이 있으므로 시스템 변경을 반영하지 않는다
  }
  setState({ theme: event.matches ? "dark" : "light" });
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

  // prefers-color-scheme 미디어쿼리 자체를 구독해, 페이지를 열어둔 채로 OS 설정이
  // 바뀌는 순간(예: 저녁이 되어 시스템이 자동으로 다크모드로 전환)에도 실시간으로
  // 반영한다. MediaQueryList.addEventListener는 비교적 최신 API라 구형 Safari 등
  // 일부 브라우저는 addListener(구버전 API)만 지원하므로 함께 대응한다.
  const darkSchemeQuery = window.matchMedia?.("(prefers-color-scheme: dark)");
  if (darkSchemeQuery) {
    if (darkSchemeQuery.addEventListener) {
      darkSchemeQuery.addEventListener("change", handleSystemThemeChange);
    } else if (darkSchemeQuery.addListener) {
      darkSchemeQuery.addListener(handleSystemThemeChange);
    }
  }

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

  typeText(document.getElementById("hero-greeting"), hero.greeting);
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
