# 기능 요구사항 검증 문서

과제 명세서의 "4. 기능 요구 사항", "5. 보너스 과제", "6. 개발 환경", "7. 제약 사항" 각 항목을,
실제 구현 위치(파일:라인)와 핵심 코드, 검증(테스트) 방법으로 대조한 문서입니다.
줄 번호는 이 문서 작성 시점 기준입니다.

---

## 1. 프로젝트 기본 구성

| 요구사항 | 구현 위치 | 핵심 내용 | 검증 방법 |
|---|---|---|---|
| 폴더 구조 분리 (index.html / css/ / js/ / images/) | 프로젝트 루트 | `index.html`, `css/style.css`, `js/script.js`, `data/info.json`, `images/` | `ls`로 최상위 구조 확인 |
| 외부 스타일시트 연결 | [index.html:7](index.html#L7) | `<link rel="stylesheet" href="css/style.css" />` | 브라우저 개발자도구 Network 탭에서 `style.css` 200 응답 확인 |
| 외부 JS 연결 | [index.html:22](index.html#L22) | `<script src="js/script.js" defer></script>` | 위와 동일, `script.js` 200 응답 확인 |
| VS Code + Live Server | [README.md:161-162](README.md#L161-L162) | 로컬 개발 환경 안내 | `Live Server` 확장으로 `index.html` 열어 자동 새로고침 확인 |

---

## 2. HTML 구조 (시맨틱 마크업)

| 요구사항 | 구현 위치 | 핵심 코드 | 검증 방법 |
|---|---|---|---|
| `<header>` | [index.html:35](index.html#L35) | `<header id="site-header">` | 개발자도구 Elements 탭에서 태그명 확인 |
| `<nav>` | [index.html:36](index.html#L36) | `<nav>` | 〃 |
| `<main>` | [index.html:97](index.html#L97) | `<main>` | 〃 |
| `<section>` ×5 | [index.html:109](index.html#L109), [125](index.html#L125), [144](index.html#L144), [158](index.html#L158), [197](index.html#L197) | `<section id="hero">` 등 | 〃 |
| `<article>` (동적 생성) | [js/script.js:231](js/script.js#L231) | `<article class="project-card reveal">` | GitHub API 응답 성공 후 Elements 탭에서 `#projects-list` 하위 확인 |
| `<footer>` | [index.html:264](index.html#L264) | `<footer>` | 개발자도구 Elements 탭 |
| Hero (인사말+CTA) | [index.html:109-122](index.html#L109-L122) | `#hero-greeting`, `#hero-cta` | 화면에서 인사말·버튼 노출 확인 |
| About (소개+이미지) | [index.html:125-141](index.html#L125-L141) | `#about-img`, `#about-text` | 화면에서 프로필 사진·소개문 확인 |
| Skills (기술 목록) | [index.html:144-155](index.html#L144-L155) | `#skills-list` | 화면에서 기술 배지 목록 확인 |
| Projects (GitHub 카드) | [index.html:158-194](index.html#L158-L194) | `#projects-list` | 화면에서 저장소 카드 렌더링 확인 |
| Contact (문의 폼) | [index.html:197-253](index.html#L197-L253) | `<form id="contact-form">` | 화면에서 폼 노출 확인 |
| Footer (저작권+소셜) | [index.html:264-267](index.html#L264-L267) | `#footer-copyright`, `#footer-social` | 화면 하단 확인 |
| 네비 앵커 링크 5개 | [index.html:88-92](index.html#L88-L92) | `<a href="#hero" class="nav-link">` 등 | 메뉴 클릭 시 해당 섹션으로 이동하는지 확인 |
| 모든 이미지에 의미있는 alt | [index.html:139](index.html#L139) | `alt="프로필 사진을 불러오는 중입니다"` → JS가 [js/script.js:652](js/script.js#L652)에서 `about.imageAlt`로 덮어씀 | 개발자도구에서 `<img>`의 `alt` 속성값 확인 |
| label for-id 매칭 | [index.html:212-213](index.html#L212-L213), [225-226](index.html#L225-L226), [232-233](index.html#L232-L233) | `<label for="name">` ↔ `<input id="name">` (email, message 동일 패턴) | label 텍스트 클릭 시 해당 입력창에 포커스가 가는지 확인 |

---

## 3. CSS 스타일링 (레이아웃 & 반응형)

| 요구사항 | 구현 위치 | 핵심 코드 | 검증 방법 |
|---|---|---|---|
| 외부 스타일시트(css/style.css) | `css/style.css` 전체 | — | 위 1번 항목과 동일 |
| CSS 변수(:root) — 색상/폰트/간격 | [css/style.css:6-26](css/style.css#L6-L26) | `--color-*`, `--font-main`, `--space-*` | 개발자도구 Elements → Computed 탭에서 CSS 변수 값 확인 |
| 다크모드 변수 `[data-theme="dark"]` | [css/style.css:38-45](css/style.css#L38-L45) | `--color-bg: #1a1a2e;` 등 | 다크모드 토글 후 변수 값 재계산 확인 |
| 네비게이션 Flexbox (로고 왼쪽/메뉴 오른쪽) | [css/style.css:98-105](css/style.css#L98-L105), [110-116](css/style.css#L110-L116) | `nav { display:flex; justify-content:space-between; }` + `.logo { margin-right:auto; }` | 개발자도구에서 `nav` 요소의 `display: flex` 확인 |
| Projects 카드 Grid (auto-fit, minmax) | [css/style.css:366-370](css/style.css#L366-L370) | `grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));` | 창 너비를 줄였다 늘렸다 하며 카드 열 개수 변화 관찰 |
| 모바일 퍼스트 작성 | [css/style.css:159-170](css/style.css#L159-L170) (기본: 햄버거 보임) → [650](css/style.css#L650) (`min-width` 미디어쿼리로 덮어씀) | `.hamburger { display:flex }` 기본, `@media (min-width:768px)`에서 숨김 | 코드 순서 확인 (기본값이 좁은 화면 기준) |
| 브레이크포인트 768px/1024px | [css/style.css:650](css/style.css#L650), [676](css/style.css#L676) | `@media (min-width: 768px)`, `@media (min-width: 1024px)` | 개발자도구 반응형 모드에서 폭 767→768px, 1023→1024px 경계 확인 |
| 모바일에서 네비 숨김+햄버거 노출 | [css/style.css:224-239](css/style.css#L224-L239) (기본 숨김+`.active`), [650-656](css/style.css#L650-L656) (768px↑ 강제 표시) | `nav ul { display:none }` / `.hamburger{display:none}`(768px↑) | 767px 이하에서 메뉴 숨김+햄버거 노출, 768px 이상에서 반대 확인 |
| 버튼/카드 hover 효과 + transition | [css/style.css:286-303](css/style.css#L286-L303) (버튼), [375-387](css/style.css#L375-L387) (카드) | `transition: transform ...` + `:hover { transform: translateY(...) }` | 마우스 올렸을 때 버튼/카드가 부드럽게 움직이는지 확인 |
| 카드 box-shadow | [css/style.css:379](css/style.css#L379) | `box-shadow: 0 4px 12px rgba(0,0,0,0.08);` | 개발자도구 Computed 탭에서 `box-shadow` 값 확인 |

---

## 4. JavaScript 기초 (DOM & 이벤트)

| 요구사항 | 구현 위치 | 핵심 코드 | 검증 방법 |
|---|---|---|---|
| `<script defer>` | [index.html:22](index.html#L22) | `defer` 속성 | 태그 속성 확인 |
| `const`/`let`만 사용 (`var` 금지) | `js/script.js` 전체 | — | `grep -n "\bvar\b" js/script.js` 결과 없음 확인 |
| `onclick` 미사용, `addEventListener`만 사용 | `index.html` 전체 / [js/script.js:602](js/script.js#L602) 등 | `document.getElementById(...).addEventListener("click", ...)` | `grep -n "onclick" index.html` 결과 없음 확인 |
| `querySelector`/`querySelectorAll` | [js/script.js:75](js/script.js#L75) (`.reveal`), [168](js/script.js#L168) (`.filter-btn`), [563](js/script.js#L563) (앵커 대상), [622](js/script.js#L622) (`.nav-link`) | `scope.querySelectorAll(".reveal")` 등 | 코드 확인 |
| `textContent`/`innerHTML` | textContent: [js/script.js:116](js/script.js#L116), [647](js/script.js#L647) / innerHTML: [156](js/script.js#L156), [184](js/script.js#L184), [229](js/script.js#L229) | `toggleBtn.textContent = ...`, `listEl.innerHTML = ...` | 코드 확인 |
| `classList.add/remove/toggle` | add/remove: [js/script.js:38](js/script.js#L38), [47](js/script.js#L47), [65](js/script.js#L65) / toggle: [125](js/script.js#L125), [135](js/script.js#L135), [270](js/script.js#L270) | `el.classList.add("typing")`, `.toggle("active", STATE.navOpen)` | 코드 확인 + 개발자도구에서 클래스 변화 관찰 |
| `click` 이벤트 | [js/script.js:602](js/script.js#L602), [618](js/script.js#L618), [623](js/script.js#L623), [628](js/script.js#L628) | `.addEventListener("click", handle...)` | 각 버튼 클릭 시 반응 확인 |
| `submit` 이벤트 | [js/script.js:514](js/script.js#L514) | `form.addEventListener("submit", handleFormSubmit)` | 폼 제출 시 반응 확인 |
| `scroll` 이벤트 | [js/script.js:627](js/script.js#L627) | `window.addEventListener("scroll", handleScroll)` | 스크롤 시 헤더/버튼 반응 확인 |
| `input` 이벤트 | [js/script.js:509](js/script.js#L509) | `.addEventListener("input", makeFieldInputHandler(field))` | 필드 타이핑 중 실시간 에러 표시 확인 |
| `event.preventDefault()` | [js/script.js:463](js/script.js#L463) (폼 제출), [562](js/script.js#L562) (앵커 클릭) | `event.preventDefault();` | 폼 제출 시 새로고침이 안 일어나는지, 앵커 클릭 시 URL 점프가 없는지 확인 |

---

## 5. 인터랙션 구현

| 요구사항 | 구현 위치 | 핵심 코드 | 검증 방법 |
|---|---|---|---|
| 햄버거 메뉴 토글 (`classList.toggle('active')`) | [js/script.js:555-557](js/script.js#L555-L557) (`handleHamburgerClick`), [120-130](js/script.js#L120-L130) (`renderNav`) | `navMenu.classList.toggle("active", STATE.navOpen);` | 767px 이하 화면에서 햄버거 클릭 → 메뉴 열림/닫힘 |
| 부드러운 스크롤 | [js/script.js:561-566](js/script.js#L561-L566) (`handleNavLinkClick`) | `target?.scrollIntoView({ behavior: "smooth" });` | 네비 메뉴 클릭 시 해당 섹션으로 부드럽게 스크롤되는지 확인 |
| 스크롤 탑 버튼 (300px, 자유 변경 가능) | [js/script.js:16](js/script.js#L16) (`SCROLL_TOP_THRESHOLD = 300`), [568-577](js/script.js#L568-L577) (`handleScroll`), [579-581](js/script.js#L579-L581) (클릭 시 맨 위로) | `window.scrollY > SCROLL_TOP_THRESHOLD` | 300px 이상 스크롤 시 버튼 노출, 클릭 시 최상단 이동 |
| 네비게이션 스타일 변경 (60px, 자유 변경 가능) | [js/script.js:15](js/script.js#L15) (`NAV_SCROLL_THRESHOLD = 60`), [css/style.css:91-94](css/style.css#L91-L94) (`header.scrolled`) | `background-color: var(--color-header-scrolled);` | 60px 이상 스크롤 시 헤더 배경색/그림자 변화 확인 |
| 다크 모드 토글 | [js/script.js:549-553](js/script.js#L549-L553) (`handleThemeToggleClick`) | `localStorage.setItem(THEME_KEY, next); setState({ theme: next });` | 버튼 클릭 시 즉시 배색 전환 확인 |
| 다크 모드 localStorage 유지 | [js/script.js:12](js/script.js#L12) (`THEME_KEY`), [525-532](js/script.js#L525-L532) (`getInitialTheme`) | `localStorage.getItem(THEME_KEY)` | 다크모드 전환 후 새로고침(F5) 시 유지되는지 확인 |
| 스크롤 애니메이션 (threshold 0.2, 자유 변경 가능) | [js/script.js:17](js/script.js#L17) (`REVEAL_THRESHOLD = 0.2`), [61-71](js/script.js#L61-L71) (`revealObserver`), [css/style.css:632-641](css/style.css#L632-L641) (`.reveal`/`.reveal.visible`) | `new IntersectionObserver(..., { threshold: REVEAL_THRESHOLD })` | 페이지를 아래로 스크롤하며 각 섹션이 서서히 나타나는지 확인 |

---

## 6. 폼 UX

| 요구사항 | 구현 위치 | 핵심 코드 | 검증 방법 |
|---|---|---|---|
| 문의 폼 (이름/이메일/메시지) | [index.html:210-251](index.html#L210-L251) | `<input id="name">`, `<input id="email">`, `<textarea id="message">` | 화면에서 3개 필드 확인 |
| 필수값 검증 (빈 필드 제출 불가) | [js/script.js:443-448](js/script.js#L443-L448) (`validateField`) | `if (!value) return "필수 입력 항목입니다.";` | 빈 값으로 제출 시 에러 메시지 표시 + 전송 안 됨 확인 |
| 이메일 형식 검증 | [js/script.js:20](js/script.js#L20) (`EMAIL_REGEX`), [446](js/script.js#L446) | `EMAIL_REGEX.test(value)` | `abc`처럼 형식이 틀린 값 입력 시 에러 메시지 확인 |
| 에러 메시지가 필드 근처에 표시 | [index.html:221](index.html#L221), [228](index.html#L228), [235](index.html#L235) (`<span class="error-message">`), [js/script.js:262-272](js/script.js#L262-L272) (`renderFormErrors`) | `document.getElementById(\`${field}-error\`).textContent = message;` | 각 입력창 바로 아래에 에러 문구가 뜨는지 확인 |
| `preventDefault()` + 성공 메시지 | [js/script.js:463](js/script.js#L463) (`preventDefault`), [486-502](js/script.js#L486-L502) (`emailjs.sendForm().then(...)`), [280-295](js/script.js#L280-L295) (`renderFormStatus`) | `setState({ formStatus: "success", formMessage: "문의가 성공적으로 접수되었습니다..." })` | 정상 값으로 제출 시 새로고침 없이 성공 문구가 뜨는지 확인 |

---

## 7. ES6+ 문법 & 배열 메서드

| 요구사항 | 구현 위치 | 핵심 코드 |
|---|---|---|
| 화살표 함수 | 파일 전반 (예: [js/script.js:112](js/script.js#L112) `renderTheme`) | `const renderTheme = () => { ... }` |
| 템플릿 리터럴로 HTML 동적 생성 | [js/script.js:157-163](js/script.js#L157-L163) (필터 버튼), [230-240](js/script.js#L230-L240) (프로젝트 카드) | `` `<article class="project-card reveal">...${name}...</article>` `` |
| 구조분해 할당 | [js/script.js:177](js/script.js#L177) (`STATE.projects`), [230](js/script.js#L230) (`repo` 필드), [643](js/script.js#L643) (`info.json`), [665](js/script.js#L665) (`{ name, url }`) | `const { status, items, username, message, filter } = STATE.projects;` |
| `map` — GitHub 데이터 → HTML 카드 변환 | [js/script.js:229-241](js/script.js#L229-L241) | `filteredItems.map(({ name, description, ... }) => \`<article>...\`)` |
| `filter` — 조건별 필터링 (fork 제외 + 언어 필터, 보너스) | [js/script.js:374](js/script.js#L374) (`!repo.fork`), [153](js/script.js#L153) (언어 추출), [216](js/script.js#L216) (선택 언어 필터) | `repos.filter((repo) => !repo.fork)` |
| `forEach` — 배열 순회 | [js/script.js:63](js/script.js#L63), [76](js/script.js#L76), [168](js/script.js#L168), [508](js/script.js#L508), [622](js/script.js#L622), [657](js/script.js#L657), [665](js/script.js#L665) | `skills.forEach((skill) => { ... })` |

---

## 8. 비동기 처리 & API 연동

| 요구사항 | 구현 위치 | 핵심 코드 | 검증 방법 |
|---|---|---|---|
| `fetch` + `async/await` | [js/script.js:356](js/script.js#L356) (`async loadProjects`), [362](js/script.js#L362) (`await fetchWithTimeout`) | `const res = await fetchWithTimeout(...)` | 코드 확인 |
| 엔드포인트 `GET /users/{username}/repos` | [js/script.js:363](js/script.js#L363) | `` `https://api.github.com/users/${username}/repos?sort=updated` `` | 개발자도구 Network 탭에서 실제 요청 URL 확인 |
| 로딩 상태 (텍스트) | [js/script.js:359](js/script.js#L359) (`setState` loading), [182-187](js/script.js#L182-L187) (`renderProjects` 로딩 분기) | `<p class="loading">프로젝트를 불러오는 중...</p>` | 새로고침 직후 짧게 "로딩 중..." 문구+스피너 확인(네트워크 느리게 하면 더 잘 보임) |
| 성공 상태 (카드 렌더링) | [js/script.js:381-383](js/script.js#L381-L383), [210-247](js/script.js#L210-L247) | `setState({ projects: { status: "success", items: ownRepos, ... } })` | 정상 로드 시 카드 목록 표시 확인 |
| 에러 상태 + 재시도 버튼 | [js/script.js:189-201](js/script.js#L189-L201) | `<button id="retry-btn" type="button">다시 시도</button>` | 개발자도구 Network 탭에서 오프라인으로 전환 후 새로고침 → 에러 문구+재시도 버튼 확인, 버튼 클릭 시 재요청 확인 |
| 빈 상태 | [js/script.js:376-379](js/script.js#L376-L379), [203-208](js/script.js#L203-L208) | `<p class="empty">표시할 프로젝트가 없습니다.</p>` | `data/info.json`의 `github.username`을 저장소가 0개인 계정으로 바꿔 확인 |
| `try/catch` 에러 처리 | [js/script.js:361-399](js/script.js#L361-L399) | `try { ... } catch (error) { ... }` | 코드 확인 |

---

## 9. 상태 관리 패턴 (3가지 이상의 "상태 → 렌더링" 흐름)

중앙 `STATE` 객체([js/script.js:90-105](js/script.js#L90-L105))와 단일 진입점 `setState()`([js/script.js:315-326](js/script.js#L315-L326))로 구현했습니다. 총 **6개**의 흐름이 있습니다([README.md:108-113](README.md#L108-L113)).

| # | 흐름 | 상태 변경 코드 | 렌더링 코드 |
|---|---|---|---|
| 1 | 다크 모드 토글 → 테마 상태 → 전체 배색 변경 (예시 1) | [js/script.js:549-553](js/script.js#L549-L553) | [js/script.js:112-118](js/script.js#L112-L118) `renderTheme` |
| 2 | 햄버거 클릭/Esc → 열림 상태 → 메뉴 표시 변경 | [js/script.js:555-557](js/script.js#L555-L557), [586-591](js/script.js#L586-L591) | [js/script.js:120-130](js/script.js#L120-L130) `renderNav` |
| 3 | API 호출 → 로딩/성공/에러/빈 상태 → Projects 렌더링 변경 (예시 2) | [js/script.js:356-400](js/script.js#L356-L400) `loadProjects` | [js/script.js:173-253](js/script.js#L173-L253) `renderProjects` |
| 4 | 필터 버튼 클릭 → 필터 상태 → 프로젝트 목록 변경 (예시 4, 보너스) | [js/script.js:258-260](js/script.js#L258-L260) `handleFilterClick` | [js/script.js:173-253](js/script.js#L173-L253) `renderProjects` (내부 `array.filter`) |
| 5 | 폼 입력/제출 → 유효성·전송 상태 → 에러/성공 메시지 (예시 3) | [js/script.js:450-455](js/script.js#L450-L455), [462-503](js/script.js#L462-L503) | [js/script.js:262-272](js/script.js#L262-L272) `renderFormErrors`, [280-295](js/script.js#L280-L295) `renderFormStatus` |
| 6 | 스크롤 → 헤더/스크롤탑 상태 → 클래스 갱신 | [js/script.js:568-577](js/script.js#L568-L577) `handleScroll` | [js/script.js:132-142](js/script.js#L132-L142) `renderHeaderScroll`/`renderScrollTopButton` |

**검증 방법**: 각 이벤트를 발생시킨 뒤 개발자도구 콘솔에서 `STATE`를 직접 찍어보면(`console.log(STATE)` 등을 임시로 추가) 값이 바뀌는 것을 확인할 수 있습니다. `setState`([js/script.js:315](js/script.js#L315))가 유일한 변경 통로이므로, 코드 전체에서 `STATE.xxx = ...` 형태의 직접 대입이 없다는 것도 `grep`으로 확인 가능합니다.

---

## 10. 배포

| 요구사항 | 구현 위치 | 검증 방법 |
|---|---|---|
| GitHub Pages 배포 | [README.md:9](README.md#L9) `https://aha645.github.io/Portfolio/` | 브라우저로 접속해 정상 로드 확인 |
| 배포 URL에서 모든 기능 정상 동작 | — | 배포 URL에서 반응형/인터랙션/API/폼을 실제로 조작해 확인 (스크린샷으로 다크모드·필터·폼 성공까지 기확인됨) |
| README: 프로젝트 설명 | [README.md:1-5](README.md#L1-L5) | README 렌더링 확인 |
| README: 사용 기술 | [README.md:21-31](README.md#L21-L31) | 〃 |
| README: 배포 URL | [README.md:9](README.md#L9) | 〃 |
| README: 스크린샷 | [README.md:14-19](README.md#L14-L19), `images/screenshot-desktop.png`, `images/screenshot-mobile.png` | README에서 이미지 렌더링 확인 |

---

## 11. 보너스 과제

| 항목 | 구현 위치 | 핵심 코드 | 검증 방법 |
|---|---|---|---|
| **프로젝트 언어 필터링** (`array.filter()`) | [index.html:161-168](index.html#L161-L168) (`#projects-filters`), [js/script.js:144-171](js/script.js#L144-L171) (`renderProjectFilters`), [258-260](js/script.js#L258-L260) (`handleFilterClick`), [215-216](js/script.js#L215-L216) (`filter()` 적용), [css/style.css:414-453](css/style.css#L414-L453) (`.filters`/`.filter-btn`) | `items.filter((repo) => repo.language === filter)` | 언어 필터 버튼 클릭 시 해당 언어 카드만 표시되는지, Network 탭에서 API가 재호출되지 않는지 확인 |
| **타이핑 효과** | [js/script.js:19](js/script.js#L19) (`TYPING_SPEED_MS`), [22-51](js/script.js#L22-L51) (`typeText`), [645](js/script.js#L645) (호출부), [css/style.css:263-278](css/style.css#L263-L278) (`.typing::after` 커서 애니메이션) | `el.textContent += text[i]; setTimeout(step, speed);` | 새로고침 시 Hero 인사말이 한 글자씩 나타나는지, 커서(`|`)가 깜빡이는지 확인. `prefers-reduced-motion` 켜면 즉시 전체 표시되는지도 확인 가능 |
| **폼 실제 전송 (EmailJS)** | [index.html:14](index.html#L14) (SDK 로드), [js/script.js:402-430](js/script.js#L402-L430) (설정+`init`), [462-503](js/script.js#L462-L503) (`sendForm`), [css/style.css:309-319](css/style.css#L309-L319) (`button:disabled`) | `emailjs.sendForm(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, form)` | 폼 제출 → 버튼이 "전송 중..."으로 잠기는지 확인 → 수신 메일함(SMTP로 연결한 계정)에 실제 도착 확인 (앞서 스크린샷으로 성공 상태 확인됨) |
| **시스템 다크모드 감지** (`prefers-color-scheme`) | [js/script.js:525-532](js/script.js#L525-L532) (`getInitialTheme`), [534-544](js/script.js#L534-L544) (`handleSystemThemeChange`, 실시간 반영), [604-615](js/script.js#L604-L615) (구독 등록) | `window.matchMedia("(prefers-color-scheme: dark)").matches` | `localStorage.clear()` 후 새로고침하면 OS 다크모드 설정을 따라가는지, OS 설정을 실시간으로 바꾸면(토글 안 누른 상태에서) 반영되는지 확인 |

---

## 12. 개발 환경

| 요구사항 | 확인 결과 | 근거 / 검증 방법 |
|---|---|---|
| React/Vue/jQuery/Bootstrap/Tailwind 등 외부 라이브러리 금지 | ✅ 미사용 | `index.html`의 `<script>` 태그는 EmailJS SDK([index.html:14](index.html#L14))와 `js/script.js`([index.html:22](index.html#L22))뿐. `grep -n "<script" index.html`으로 재확인 가능 |
| 순수 HTML/CSS/JavaScript만 사용 | ✅ | DOM 조작·상태 관리·이벤트 처리 전부 `js/script.js`에 직접 구현 (프레임워크 API 미사용) |
| Font Awesome/Google Fonts 허용 (선택) | ✅ 미사용(선택사항이므로 문제없음) | 아이콘은 이모지(🌙/☀️/↑)와 `<span>` 3개로 만든 햄버거([index.html:67-69](index.html#L67-L69)), 폰트는 시스템 폰트([css/style.css:16](css/style.css#L16) `--font-main: 'Segoe UI', sans-serif;`) |
| EmailJS SDK가 "외부 라이브러리 금지"에 해당하는가? | ✅ 해당 없음 | 금지 목록은 DOM/UI 렌더링 프레임워크(React 등)이고, EmailJS는 이메일 발송 API 클라이언트일 뿐. 과제 5번 보너스 항목이 "Formspree 또는 **EmailJS**를 연동"이라고 명시적으로 허용/요구함 |

## 13. 제약 사항

| 요구사항 | 확인 결과 | 근거 / 검증 방법 |
|---|---|---|
| 핵심 목표: "이벤트 → 상태 → 렌더링" 흐름 우선 | ✅ | [STATE](js/script.js#L90-L105)/[setState](js/script.js#L315-L326)/[RENDERERS](js/script.js#L304-L313) 구조 — 위 "9. 상태 관리 패턴" 섹션 참고 |
| `var` 대신 `const`/`let` | ✅ | 아래 명령어로 재확인 가능 (실제 `var` 선언 0건) |
| `onclick` 대신 `addEventListener` | ✅ | `grep -n "onclick" index.html` → 0건 |
| 인라인 스타일(`style="..."`) 사용 금지 | ✅ | `grep -n 'style="' index.html` → 0건. JS에서도 `element.style.xxx` 직접 조작 없이 전부 `classList.add/remove/toggle`로만 스타일 상태를 바꿈 (`grep -n "\.style\." js/script.js` → 0건) |
| 최신 Chrome 브라우저에서 정상 동작 | ✅ | 배포 사이트 스크린샷 자체가 Chrome에서 캡처됨(다크모드 토글·언어 필터·폼 전송 성공까지 확인됨). 사용 API(`fetch`, `IntersectionObserver`, `AbortController`, `matchMedia`, 옵셔널 체이닝 등) 모두 최신 Chrome 표준 지원 범위 |
| 제출물 — GitHub 저장소 URL | ✅ | [README.md:9](README.md#L9) `https://github.com/aha645/Portfolio` |
| 제출물 — 배포된 사이트 URL | ✅ | [README.md:10](README.md#L10) `https://aha645.github.io/Portfolio/` |
| 제출물 — 데스크톱/모바일/다크모드 스크린샷 | ✅ | 라이트 모드: `images/screenshot-desktop.png`, `images/screenshot-mobile.png` / 다크 모드: `images/screenshot-desktop-dark.png`, `images/screenshot-mobile-dark.png` — [README.md:13-22](README.md#L13-L22)에 2×2(화면×모드) 표로 배치 |
| GitHub API 레이트리밋(403) 시 에러 상태 UI 표시 | ✅ | [js/script.js:350](js/script.js#L350) `if (status === 403) return "GitHub API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.";` → `renderProjects()`의 에러 분기([js/script.js:189-201](js/script.js#L189-L201))가 재시도 버튼과 함께 표시 |

**검증 방법 (레이트리밋)**: 브라우저 개발자도구 Network 탭에서 GitHub API 요청을 60회 이상 짧은 시간에 반복하거나, 콘솔에서 `loadProjects("존재하지-않는-매우-긴-임의문자열")`처럼 강제로 다른 오류를 유발해 에러 UI 분기가 실제로 동작하는지 확인할 수 있습니다(403을 인위적으로 재현하려면 실제로 60회 호출이 필요해 일상적인 개발 중에는 거의 발생하지 않습니다).

---

## 참고: 전역 규칙 준수 확인용 명령어

```bash
# 실제 var 선언 여부 (주석 속 "var" 언급은 제외, 0건이어야 정상)
grep -n "\bvar\b" js/script.js | grep -Ev "^[0-9]+:[[:space:]]*//"

# onclick 속성 사용 여부 (0건이어야 정상)
grep -n "onclick" index.html

# 인라인 style 속성 사용 여부 (0건이어야 정상)
grep -n 'style="' index.html

# JS에서 .style 직접 조작 여부 (0건이어야 정상 — classList로만 스타일 상태 변경)
grep -n "\.style\." js/script.js

# JS 문법 검증
node --check js/script.js

# JSON 유효성 검증
python3 -c "import json; json.load(open('data/info.json'))"
```
