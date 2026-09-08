// ============================================================
// 0. 공통 변수
//    - var 대신 const/let만 사용 (과제 요구사항)
//    - 모든 DOM 조작은 querySelector 계열 + addEventListener로 처리하고,
//      HTML에는 onclick 속성을 절대 쓰지 않는다.
// ============================================================
// [index.html 연동] <html lang="ko"> 요소 자체를 가리킨다.
// applyTheme()이 이 root에 data-theme 속성을 붙였다 떼었다 하면,
// css/style.css의 `[data-theme="dark"] { --color-bg: ...; }` 규칙이 켜지면서
// :root에서 정의한 CSS 변수 값이 전부 바뀌어 페이지 전체 배색이 바뀐다.
const root = document.documentElement;
const THEME_KEY = "portfolio-theme"; // localStorage에 저장할 때 쓰는 키 이름

// 기준값들은 README에도 동일하게 명시한다 (자유 변경 가능하지만 값을 고정해서 문서화)
const NAV_SCROLL_THRESHOLD = 60;   // 이 값(px) 이상 스크롤하면 header에 .scrolled 부여
const SCROLL_TOP_THRESHOLD = 300;  // 이 값(px) 이상 스크롤하면 맨 위로 버튼 표시
const REVEAL_THRESHOLD = 0.2;      // IntersectionObserver: 요소가 20% 보이면 애니메이션 실행

// [index.html 연동] index.html에는 class="reveal"이 붙은 <section> 5개
// (hero/about/skills/projects/contact)와, GitHub API 응답으로 나중에 생기는
// <article class="project-card reveal"> 카드들이 있다. 이 관찰자 하나가
// 그 모든 .reveal 요소를 공통으로 지켜보다가, 화면에 20% 이상 들어오는 순간
// css/style.css의 `.reveal.visible` 규칙이 켜지도록 class="visible"만 추가해준다.
// (실제 애니메이션 값 자체는 CSS가 담당하고, JS는 "언제"만 결정한다)
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
// 상태 흐름 1: 다크 모드 토글
//   이벤트(버튼 클릭) → 상태 변경(data-theme 속성 + localStorage) → 렌더링(전체 배색 변경)
//   CSS의 [data-theme="dark"] 선택자가 CSS 변수 값을 바꿔주므로
//   JS는 "상태(속성값)"만 바꾸면 되고 개별 요소 스타일을 일일이 건드릴 필요가 없다.
// ============================================================
const applyTheme = (theme) => {
  // [index.html 연동] <html> 태그에 data-theme="dark" 또는 "light"를 세팅한다.
  // 이 한 줄만으로 css/style.css의 [data-theme="dark"] 블록이 켜지고 꺼지며
  // body/header/card 등 CSS 변수를 쓰는 모든 요소의 색이 자동으로 따라 바뀐다.
  root.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme); // 새로고침 후에도 유지되어야 하므로 저장

  // [index.html 연동] <button id="theme-toggle">🌙</button>의 아이콘 텍스트를
  // 현재 테마에 맞게 바꿔준다 (다크모드일 땐 "밝게 바꾸기"라는 의미로 ☀️ 표시).
  const toggleBtn = document.getElementById("theme-toggle");
  if (toggleBtn) {
    toggleBtn.textContent = theme === "dark" ? "☀️" : "🌙";
  }
};

const initTheme = () => {
  const saved = localStorage.getItem(THEME_KEY);
  applyTheme(saved === "dark" ? "dark" : "light");
};

// script.js는 <head>에서 defer로 로드되므로 DOM 파싱은 이미 끝나 있지만,
// 아래처럼 DOMContentLoaded로 한 번 더 감싸도 안전하다 — defer 스크립트는
// DOMContentLoaded 이벤트가 "발생하기 직전"에 실행되므로 이 리스너는
// 반드시 등록 시점보다 뒤에 호출된다.
document.addEventListener("DOMContentLoaded", async () => {
  // ---- 다크모드 초기화 + 토글 이벤트 연결 ----
  // [index.html 연동] <button id="theme-toggle">에 click 리스너를 연결한다.
  // (html에는 onclick 속성이 전혀 없다 — 요구사항대로 JS에서만 이벤트를 붙인다)
  initTheme();
  document.getElementById("theme-toggle").addEventListener("click", () => {
    const current = root.getAttribute("data-theme");
    applyTheme(current === "dark" ? "light" : "dark");
  });

  // ---- 햄버거 메뉴 토글 ----
  // [index.html 연동] <button id="hamburger">와 <ul id="nav-menu">를 가져온다.
  // classList.toggle의 반환값(boolean)을 그대로 활용해
  // 메뉴가 열렸는지 닫혔는지에 따라 아이콘(.active)과 aria-expanded를 동기화한다.
  const hamburger = document.getElementById("hamburger");
  const navMenu = document.getElementById("nav-menu");

  hamburger.addEventListener("click", () => {
    // navMenu(#nav-menu)에 .active를 붙이면 css/style.css의 `nav ul.active`가
    // display:none → flex로 바꿔 모바일 드롭다운 메뉴가 펼쳐진다.
    const isOpen = navMenu.classList.toggle("active");
    // hamburger(#hamburger) 자신에도 .active를 붙이면 css의
    // `.hamburger.active span:nth-child(n)`이 3개의 막대를 "X"자로 회전시킨다.
    hamburger.classList.toggle("active", isOpen);
    hamburger.setAttribute("aria-expanded", String(isOpen));
  });

  // ---- 부드러운 스크롤 + 메뉴 클릭 시 자동 닫힘 ----
  // [index.html 연동] <ul id="nav-menu"> 안의 5개 <a class="nav-link" href="#섹션id">를
  // 전부 찾는다. class="nav-link"는 CSS가 아니라 이 querySelectorAll을 위한 훅이다.
  // <a href="#id">의 기본 동작(순간 이동)을 preventDefault로 막고,
  // scrollIntoView({ behavior: "smooth" })로 직접 부드럽게 이동시킨다.
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      // href="#hero" 같은 값을 그대로 CSS 선택자로 써서 목적지 section을 찾는다.
      // (index.html의 <section id="hero">, id="about" ... 와 문자열이 정확히 일치해야 한다)
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
  // [index.html 연동] <header id="site-header">와 <button id="scroll-top">.
  const header = document.getElementById("site-header");
  const scrollTopBtn = document.getElementById("scroll-top");

  window.addEventListener("scroll", () => {
    // window.scrollY(현재 스크롤 위치)가 기준값을 넘는지에 따라
    // classList.toggle(클래스명, 조건)의 두 번째 인자로 켜기/끄기를 한 줄로 처리한다.
    // header에 .scrolled가 붙으면 css의 `header.scrolled`가 그림자를 진하게 만들고,
    // scrollTopBtn에 .show가 붙으면 css의 `.scroll-top.show`가 버튼을 나타나게 한다.
    header.classList.toggle("scrolled", window.scrollY > NAV_SCROLL_THRESHOLD);
    scrollTopBtn.classList.toggle("show", window.scrollY > SCROLL_TOP_THRESHOLD);
  });

  scrollTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // ---- 스크롤 애니메이션 (Intersection Observer) ----
  // 지금 이 시점에 index.html에 이미 존재하는 5개의 <section class="reveal">을
  // 전부 찾아서 관찰을 시작한다 (GitHub API로 나중에 추가되는 카드는
  // renderProjects() 안에서 별도로 observeReveal(container)를 한 번 더 호출한다).
  // 각 섹션에 미리 넣어둔 .reveal 클래스(opacity:0 + translateY)를
  // 화면에 20% 이상 들어오는 순간 .visible로 바꿔 CSS transition이 실행되게 한다.
  observeReveal();

  // ---- info.json 기반 콘텐츠 채우기 ----
  // index.html 자체에는 문구가 하나도 없다(빈 태그만 존재). 아래에서
  // data/info.json을 fetch해 그 값들을 각 요소에 채워 넣어야 화면에 보인다.
  const res = await fetch("data/info.json");
  const data = await res.json();

  // 구조분해 할당으로 필요한 값만 바로 꺼내 쓴다.
  const { hero, about, skills, footer, github } = data;

  // [index.html 연동] <h1 id="hero-greeting"></h1> (빈 태그) → textContent로 문구 삽입.
  document.getElementById("hero-greeting").textContent = hero.greeting;
  // [index.html 연동] <a id="hero-cta" href="#projects">버튼</a>의 기본 텍스트("버튼")와
  // href("#projects")는 자리표시자일 뿐, 아래에서 실제 값으로 덮어쓴다.
  const cta = document.getElementById("hero-cta");
  cta.textContent = hero.ctaText;
  cta.href = hero.ctaLink;

  // [index.html 연동] <img id="about-img" src="" alt="" />는 처음에는 src/alt가 비어
  // 아무것도 안 보이는 상태다. 여기서 src와 "의미있는" alt를 채워 넣어야
  // 실제 이미지가 나타나고 스크린리더에서도 사진 내용을 읽을 수 있다.
  const aboutImg = document.getElementById("about-img");
  aboutImg.src = about.image;
  aboutImg.alt = about.imageAlt; // 의미있는 alt
  document.getElementById("about-text").textContent = about.text;

  // [index.html 연동] <ul id="skills-list"></ul>(빈 목록)에 <li>를 하나씩 추가한다.
  // forEach: 배열을 순회하며 DOM 노드를 하나씩 추가
  const skillsList = document.getElementById("skills-list");
  skills.forEach((skill) => {
    const li = document.createElement("li");
    li.textContent = skill;
    skillsList.appendChild(li); // 추가되는 즉시 css의 #skills-list 배지 스타일을 물려받는다
  });

  // [index.html 연동] <p id="footer-copyright">, <ul id="footer-social"> 채우기.
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
  // [index.html 연동] 아래 loadProjects()가 <div id="projects-status">와
  // <div id="projects-list">를 직접 조작한다 (함수 정의는 파일 하단 참고).
  loadProjects(github.username);

  // ---- 문의 폼 유효성 검사 ----
  // [index.html 연동] 아래 initContactForm()이 <form id="contact-form">과
  // 그 안의 입력 필드/에러 span들을 전부 연결한다.
  initContactForm();
});

// ============================================================
// 상태 흐름 2: GitHub API 연동
//   이벤트(페이지 로드 / 재시도 버튼 클릭)
//   → 상태 변경(로딩 → 성공 또는 에러 → 빈 상태 가능)
//   → 렌더링(#projects-status, #projects-list의 innerHTML 교체)
// ============================================================
// [index.html 연동] <div id="projects-status" class="status-msg" aria-live="polite">.
// 이 div의 innerHTML을 통째로 갈아끼우는 방식으로 로딩/에러/빈 상태를 표현한다.
// html이 빈 문자열("")이면 css의 `.status-msg:empty { display:none }`가 자동으로
// 이 영역을 화면에서 숨겨준다 — JS가 display를 직접 건드릴 필요가 없다.
const renderStatus = (html) => {
  document.getElementById("projects-status").innerHTML = html;
};

const renderProjects = (repos) => {
  // [index.html 연동] <div id="projects-list"></div>(처음엔 빈 상태)를 가져와
  // 카드 HTML을 통째로 채워 넣는다. 부모 div는 css `#projects-list`의
  // grid(auto-fit, minmax(280px,1fr)) 규칙을 이미 가지고 있으므로,
  // 카드를 넣기만 하면 화면 너비에 맞춰 자동으로 줄바꿈되는 반응형 그리드가 완성된다.
  const container = document.getElementById("projects-list");

  // map: repo 객체 배열 → 카드 HTML 문자열 배열로 변환 (템플릿 리터럴 사용)
  // 구조분해 할당으로 필요한 필드만 꺼내 쓴다.
  // 여기서 생성되는 class="project-card reveal"의 두 클래스는 각각
  //  - project-card: css/style.css의 `#projects-list article`(부모 id 기반)이 카드 모양을 입힘
  //  - reveal: 위쪽 공용 revealObserver가 스크롤 등장 애니메이션 대상으로 잡을 수 있게 함
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

  // innerHTML로 새로 삽입된 .reveal 요소는 페이지 로드 시점의 observeReveal()
  // 호출 범위에 없었으므로(그때는 DOM에 존재하지도 않았다) 반드시 다시
  // 관찰 등록을 해줘야 스크롤 애니메이션이 적용된다.
  observeReveal(container);
};

const loadProjects = async (username) => {
  // 1) 로딩 상태: [index.html 연동] #projects-status에 안내 문구를 넣고,
  // 이전 결과가 남아있을 수 있는 #projects-list는 비워 화면이 꼬이지 않게 한다.
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

    // 3) 성공 상태: #projects-status는 비우고(→ css :empty로 자동 숨김),
    // #projects-list에 실제 카드를 렌더링한다.
    renderStatus("");
    renderProjects(ownRepos);
  } catch (error) {
    // 4) 에러 상태: 네트워크 오류, API 오류 등 → [index.html 연동]
    // #projects-status 안에 에러 문구와 함께 <button id="retry-btn">을
    // "그때그때" 새로 만들어 삽입한다 (평소 index.html에는 이 버튼이 없다).
    console.error(error);
    renderStatus(`
      <p class="error">프로젝트를 불러올 수 없습니다.</p>
      <button id="retry-btn" type="button">다시 시도</button>
    `);

    // innerHTML로 새로 만든 버튼이라 onclick 속성 대신
    // 삽입 이후 addEventListener로 이벤트를 연결해야 규칙(onclick 금지)을 지킬 수 있다.
    // 클릭하면 loadProjects()를 재귀 호출해 위 1)번 로딩 상태부터 다시 시작한다.
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
  // [index.html 연동] <form id="contact-form" novalidate>와
  // <p id="form-success" class="success-message">.
  const form = document.getElementById("contact-form");
  const successMsg = document.getElementById("form-success");

  // [index.html 연동] index.html의 3쌍 — <input id="name">+<span id="name-error">,
  // <input id="email">+<span id="email-error">, <textarea id="message">+
  // <span id="message-error"> — 을 필드별로 한 곳에 묶어서 관리한다 (반복 코드 최소화).
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

  // [index.html 연동] 해당 필드의 <span class="error-message">에 메시지를 넣고,
  // 동시에 <input>/<textarea>에 class="invalid"를 붙였다 뗐다 한다.
  // → css의 `.error-message`가 빨간 글씨를, `input.invalid`가 빨간 테두리를 담당한다.
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

  // [index.html 연동] 각 <input>/<textarea>에 input 이벤트를 건다.
  // 타이핑하는 동안 실시간으로 에러 상태를 갱신해
  // "제출을 눌러야만 에러를 아는" 불편함을 줄인다.
  Object.keys(fields).forEach((field) => {
    fields[field].input.addEventListener("input", () => validateField(field));
  });

  // [index.html 연동] <form id="contact-form">의 submit 이벤트
  // (버튼의 onclick이 아니라 폼의 submit을 듣는 이유: Enter 키 제출도 함께 잡기 위함).
  form.addEventListener("submit", (event) => {
    event.preventDefault(); // 폼의 기본 제출(페이지 새로고침) 방지

    // map + every: 모든 필드를 검증하고, 하나라도 실패하면 전체를 실패로 처리
    const isValid = Object.keys(fields)
      .map((field) => validateField(field))
      .every(Boolean);

    if (!isValid) {
      // [index.html 연동] 유효성 실패 시 <p id="form-success">는 비워둔다
      // (이전에 성공 메시지가 남아있는 상태에서 다시 틀리게 제출하는 경우 대비).
      successMsg.textContent = "";
      return;
    }

    // [index.html 연동] 모든 필드 통과 → #form-success에 성공 문구를 넣고
    // form.reset()으로 <input>/<textarea> 값을 전부 비운다.
    successMsg.textContent = "문의가 성공적으로 접수되었습니다. 감사합니다!";
    form.reset();
  });
};
