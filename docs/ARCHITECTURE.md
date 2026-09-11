# 구조 설명서 — HTML · CSS · JavaScript는 각각 무엇을 담당하는가

이 문서는 `index.html` / `css/style.css` / `js/script.js` 세 파일이 **어떤 기능을 위해, 왜 그렇게 작성되었는지**를 설명합니다.
소스 파일에는 코드만 남기고, 배경 설명은 전부 이 문서로 옮겼습니다.

- **0장**은 **문서 골격** — 세 파일의 역할 분담, 시맨틱 태그·폼·스크립트 로딩을 그렇게 쓴 이유
- **1~2장**은 **디자인 레이아웃** — 색·간격·배치·반응형이 어떤 규칙으로 짜였는지
- **3~4장**은 **동작 흐름** — 사용자가 무언가 했을 때 코드가 어떤 순서로 반응하는지
- **5장**은 **대응표** — `id`/`class` 하나를 놓고 세 파일을 오가며 찾을 때 쓰는 색인

---

# 0. 문서 골격과 역할 분담

## 0.1 세 파일의 역할 분담

이 프로젝트를 관통하는 원칙은 하나입니다.

> **HTML은 "무엇이 있는지"(구조), CSS는 "어떻게 보이는지"(모양), JS는 "언제 바뀌는지"(시점)만 담당한다.**

가장 자주 등장하는 형태가 **클래스 스위치 패턴**입니다. JS가 색을 직접 칠하지 않고 클래스만 붙였다 떼면, CSS가 그 클래스를 보고 모양을 바꿉니다.

```js
// ❌ 이렇게 하지 않는다 — 색상값이 JS에 흩어진다
header.style.backgroundColor = "#eceef5";

// ✅ 이렇게 한다 — JS는 스위치만, 색은 CSS가 안다
header.classList.toggle("scrolled", STATE.scrolled);
```

이 패턴 덕분에 **색을 바꾸고 싶으면 CSS만, 타이밍을 바꾸고 싶으면 JS만** 고치면 됩니다.

### 클래스 스위치 전체 목록

| 클래스/속성 | 붙는 대상 | JS가 붙이는 조건 | CSS가 하는 일 |
|---|---|---|---|
| `data-theme="dark"` | `<html>` | 토글 버튼 클릭 / OS 설정 | CSS 변수 6개를 다크값으로 교체 |
| `.scrolled` | `#site-header` | 스크롤 > 60px | 헤더 배경·그림자 진하게 |
| `.active` | `#nav-menu` | 햄버거 클릭 | 드롭다운 펼침 (`display: flex`) |
| `.active` | `#hamburger` | 햄버거 클릭 | 막대 3개를 X자로 회전 |
| `.active` | `.filter-btn` | 해당 언어가 선택됨 | 버튼을 강조색으로 반전 |
| `.show` | `#scroll-top` | 스크롤 > 300px | 버튼 서서히 등장 |
| `.visible` | `.reveal` | 화면에 20% 진입 | 아래에서 위로 떠오름 |
| `.typing` | `#hero-greeting` | 타이핑 진행 중 | 깜빡이는 커서(`|`) 표시 |
| `.invalid` | `input` / `textarea` | 유효성 검사 실패 | 테두리 빨간색 |
| `disabled` | `#contact-submit` | 메일 전송 중 | 반투명 + 커서 금지 표시 |

---

## 0.2 시맨틱 마크업 — `<div>` 대신 의미를 가진 태그

문서의 뼈대는 전부 의미를 가진 태그로 짰습니다.

```html
<header id="site-header">
  <nav> … 로고 · 테마버튼 · 햄버거 · 메뉴 … </nav>
</header>
<main>
  <section id="hero">   <section id="about">   <section id="skills">
  <section id="projects">
      <article class="project-card">  ← 저장소 하나하나가 독립적인 콘텐츠
  <section id="contact">
</main>
<footer> … </footer>
<button id="scroll-top">   ← footer 바깥
```

| 태그 | 왜 이걸 썼나 |
|---|---|
| `<header>` / `<footer>` | 페이지 머리·바닥 영역임을 브라우저와 보조기술에 명시 |
| `<nav>` | 스크린리더가 "탐색 영역"으로 인식해 건너뛰기 가능 |
| `<main>` | 페이지의 본문. 문서당 하나만 존재 |
| `<section>` | 제목(`<h2>`)을 가진 주제 단위 묶음 |
| `<article>` | **그 자체로 독립적으로 성립하는 콘텐츠** — 프로젝트 카드는 떼어내도 의미가 통하므로 `<div>`가 아니라 `<article>` |

**`#scroll-top`이 `<footer>` 바깥, `<body>` 맨 끝에 있는 이유** — `position: fixed`로 화면 우하단에 항상 떠 있어야 하는 요소라 문서 구조상 어느 섹션에도 속하지 않습니다. 특정 영역 안에 두면 그 영역의 의미를 오염시킵니다.

## 0.3 스크립트 로딩 — `<head>` + `defer`

```html
<script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/…" defer></script>
<script src="js/script.js" defer></script>
```

**왜 `<body>` 끝이 아니라 `<head>`인가** — `defer`는 "다운로드는 HTML 파싱과 **동시에**, 실행은 파싱이 **끝난 뒤**"입니다. `<body>` 끝에 두면 파서가 그 지점에 도달해야 비로소 다운로드가 시작되므로, `<head>`에 `defer`로 두는 편이 더 빠릅니다. 실행 시점은 둘 다 DOM이 준비된 뒤로 동일합니다.

**왜 EmailJS가 먼저인가** — `defer` 스크립트는 **문서에 나온 순서대로** 실행됩니다. 이 순서 덕분에 `script.js`가 실행될 때 전역 `emailjs` 객체가 이미 존재하는 것이 보장됩니다.

## 0.4 "빈 껍데기" 원칙

`index.html`에는 **표시할 문구가 거의 없습니다.**

```html
<h1 id="hero-greeting"></h1>          <!-- 비어 있음 -->
<a id="hero-cta" class="btn"></a>     <!-- 비어 있음 -->
<ul id="skills-list"></ul>            <!-- 비어 있음 -->
<div id="projects-list"></div>        <!-- 비어 있음 -->
```

HTML은 값이 들어갈 **자리만** 잡아두고, 실제 내용은 `data/info.json`(정적 콘텐츠)과 GitHub API(동적 콘텐츠)에서 옵니다.

**이렇게 한 이유** — 이름·소개글·스킬 목록을 바꾸려고 HTML을 열 필요가 없습니다. `info.json` 한 파일만 고치면 됩니다. 콘텐츠와 구조를 분리한 것입니다.

**id를 붙이는 기준** — 페이지에 하나뿐이면서 JS가 값을 채워야 하는 요소에 `id`를 붙였습니다. `document.getElementById()`가 JS의 접근 지점이 되고, 동시에 `#hero`, `#about` 같은 것은 네비게이션 링크(`<a href="#about">`)의 도착점 역할도 겸합니다.

**`#projects-list`에 클래스가 없는 이유** — 그리드 레이아웃을 `#projects-list` id 선택자가 담당하기 때문입니다. 클래스를 붙여도 대응하는 CSS 규칙이 없어 아무 효과가 없습니다.

## 0.5 폼 마크업

```html
<form id="contact-form" novalidate>
  <div class="form-group">
    <label for="name">이름</label>
    <input type="text" id="name" name="name" />
    <span class="error-message" id="name-error"></span>
  </div>
  …
  <button type="submit" id="contact-submit" class="btn">보내기</button>
  <p id="form-status" role="status"></p>
</form>
```

| 속성 | 이유 |
|---|---|
| **`novalidate`** | 브라우저 기본 유효성 팝업을 끈다. 대신 JS가 검증해 **에러 메시지를 해당 필드 바로 아래**에 한국어로 표시한다 — 어떤 필드가 왜 틀렸는지 훨씬 분명하다 |
| **`label for` ↔ `input id`** | 1:1로 매칭되어 있어 **라벨을 클릭하면 입력창에 포커스**가 간다. 스크린리더도 입력창의 이름을 이 라벨로 읽는다 |
| **`name` 속성** | EmailJS가 `sendForm()`으로 폼을 통째로 읽을 때, `name` 값이 템플릿 변수(`{{name}}`, `{{email}}`, `{{message}}`)와 그대로 매핑된다 |
| **`role="status"`** | 전송 성공/실패 문구가 들어오면 스크린리더가 **자동으로 읽어준다** (`aria-live="polite"`와 같은 효과) |
| **`type="submit"`** | Enter 키 제출도 `submit` 이벤트로 잡히게 한다 |

**id 이름 규칙** — `name` / `email` / `message` 필드와 `name-error` / `email-error` / `message-error` 에러 영역이 `-error` 접미사로 짝을 이룹니다. 덕분에 JS가 반복문 하나로 세 필드를 모두 처리할 수 있습니다.

```js
Object.entries(STATE.formErrors).forEach(([field, message]) => {
  document.getElementById(`${field}-error`).textContent = message;
  document.getElementById(field).classList.toggle("invalid", Boolean(message));
});
```

---

# 1. 디자인 레이아웃

## 1.1 색상 시스템 — CSS 변수 하나로 테마 전환

모든 색은 `:root`에 변수로 선언되고, 실제 규칙들은 그 변수만 참조합니다.

```css
:root          { --color-bg: #ffffff; --color-text: #222222; ... }
:root[data-theme="dark"] { --color-bg: #1a1a2e; --color-text: #f0f0f0; ... }

body { background-color: var(--color-bg); }   /* 값이 아니라 이름을 참조 */
```

**왜 이렇게 했나** — 다크 모드를 위해 규칙을 두 벌 쓸 필요가 없습니다. `<html>`에 붙는 속성 하나가 바뀌면 변수 6개의 값이 교체되고, 그 변수를 쓰는 **모든 규칙이 자동으로 따라옵니다.** 다크 모드용 CSS는 위의 6줄이 전부입니다.

**왜 `:root`인가** — CSS 변수는 상속되므로, 문서의 최상위인 `<html>`(`:root`)에 선언하면 페이지 어디서든 꺼내 쓸 수 있습니다.

**왜 `:root[data-theme="dark"]`인가 (`:root` 없이 쓰지 않는 이유)** — `[data-theme="dark"]` 단독은 `:root`와 명시도가 `0-1-0`으로 **동점**입니다. 동점이면 파일에서 나중에 나온 쪽이 이기므로, 블록 순서를 바꾸는 순간 다크 모드가 조용히 깨집니다. `:root`를 붙이면 `0-2-0`이 되어 순서와 무관하게 항상 이깁니다.

**왜 클래스(`.dark`)가 아니라 `data-` 속성인가** — 테마는 켜짐/꺼짐이 아니라 `"light" | "dark"` 중 **하나를 고르는 값**입니다. 클래스로 하면 새 값을 붙일 때 이전 값을 지우는 걸 잊으면 버그가 나지만, 속성은 `setAttribute` 한 줄로 통째로 교체됩니다. 테마가 3개로 늘어도 JS는 그대로입니다.

### 정의된 변수

| 변수 | 라이트 | 다크 | 쓰임 |
|---|---|---|---|
| `--color-bg` | `#ffffff` | `#1a1a2e` | 페이지 배경, 배지·입력창 배경 |
| `--color-text` | `#222222` | `#f0f0f0` | 기본 글자색 |
| `--color-primary` | `#4a6cf7` | `#6c8cff` | 버튼·강조·hover |
| `--color-card` | `#f5f6fa` | `#24243e` | 헤더·카드·푸터 배경 |
| `--color-border` | `#e0e0e0` | `#3a3a5a` | 테두리 |
| `--color-header-scrolled` | `#eceef5` | `#2e2e4d` | 스크롤 시 헤더 배경 |
| `--color-card-hover` | *(변화 없음)* | `#35355c` | 카드 hover 시 표면 — [1.1.1](#111-그림자도-테마별로-달라야-한다) 참고 |
| `--color-error` | `#e5484d` | (공통) | 유효성 실패 테두리·문구 |
| `--color-success` | `#2f9e44` | (공통) | 전송 성공 문구 |

### 그림자 토큰

| 변수 | 라이트 | 다크 |
|---|---|---|
| `--shadow-header` | `0 2px 8px rgba(0,0,0,.05)` | `0 2px 8px rgba(0,0,0,.4)` |
| `--shadow-header-scrolled` | `0 4px 14px rgba(0,0,0,.12)` | `0 4px 14px rgba(0,0,0,.6)` |
| `--shadow-card` | `0 4px 12px rgba(0,0,0,.08)` | `0 4px 12px rgba(0,0,0,.5)` |
| `--shadow-card-hover` | `0 8px 20px rgba(0,0,0,.15)` | `0 10px 28px rgba(0,0,0,.75)` |

## 1.1.1 그림자도 테마별로 달라야 한다

처음에는 그림자를 값으로 직접 박아두었는데, **다크 모드에서 카드 hover가 거의 보이지 않는 문제**가 있었습니다. 원인을 숫자로 확인하면 분명합니다.

`rgba(0,0,0,0.15)` 그림자를 배경 위에 합성했을 때, 그림자와 배경의 대비비:

| 상황 | 배경 | 그림자 부분 | 대비비 |
|---|---|---|---|
| 라이트 | `#ffffff` | `rgb(217,217,217)` | **1.41 : 1** |
| 다크 (수정 전) | `#1a1a2e` | `rgb(22,22,39)` | **1.04 : 1** ← 사실상 안 보임 |

**흰 배경은 아래로 내려갈 여지가 255만큼 있지만, `#1a1a2e`는 26밖에 없습니다.** 같은 불투명도라도 어두운 배경에서는 그림자가 만들 수 있는 변화량 자체가 10분의 1 수준입니다.

### 해결 1 — 그림자를 테마 변수로 분리

다크 모드에서는 불투명도를 크게 올렸습니다 (`0.15` → `0.75`). 대비비가 1.04 → **1.18**로 개선됩니다.

### 해결 2 — 표면 밝기로 높이를 표현

다만 그림자만으로는 한계가 있습니다. `#1a1a2e` 위에 **순수 검정(불투명도 1.0)을 써도 최대 1.23:1**이라, 라이트 모드의 1.41:1에 구조적으로 도달할 수 없습니다.

그래서 다크 UI가 흔히 쓰는 방식을 함께 적용했습니다 — **어두운 화면에서 "떠오름"은 그림자가 아니라 표면이 밝아지는 것으로 표현한다.**

```css
.project-card:hover {
  transform: translateY(-6px);
  box-shadow: var(--shadow-card-hover);
  background-color: var(--color-card-hover);   /* 다크에서만 실제로 변한다 */
}
```

라이트 모드에서는 `--color-card-hover: var(--color-card)`로 두어 **기존과 동일하게 그림자만** 동작합니다. 변수 하나로 두 테마의 서로 다른 표현 방식을 담은 것입니다.

| 다크 모드 hover 피드백 | 대비비 |
|---|---|
| 그림자 (`0.75`) | 1.18 : 1 |
| 표면 밝아짐 (`#24243e` → `#35355c`) | 1.30 : 1 |
| + `translateY(-6px)` 이동 | (움직임으로 별도 인지) |

세 신호가 겹쳐 라이트 모드와 비슷한 강도의 피드백이 됩니다.

> **일반화:** 색을 테마 변수로 뺐다면 **그림자도 색이다.** `rgba(0,0,0,…)`를 하드코딩하는 순간 그 값은 밝은 배경에서만 유효한 가정을 품게 된다.

### 색이 아닌 토큰

| 변수 | 값 | 왜 변수로 뺐나 |
|---|---|---|
| `--space-xs/sm/md/lg` | 4 / 8 / 16 / 32px | 여백을 4의 배수로 통일해 리듬을 맞춤 |
| `--radius` | `12px` | 카드·버튼·입력창의 둥글기를 한 번에 조정 |
| `--transition` | `0.3s ease` | 모든 전환 속도를 통일 (테마·hover·등장) |
| `--font-main` | `'Segoe UI', sans-serif` | 폰트 교체 지점을 한 곳으로 |

---

## 1.2 Flexbox와 Grid를 나눠 쓴 기준

> **한 줄(또는 한 열)로 늘어놓기만 하면 Flexbox, 여러 줄에서 열 너비까지 맞아야 하면 Grid.**

| 위치 | 선택 | 이유 |
|---|---|---|
| `nav` | Flexbox | 로고 ↔ 메뉴 양 끝 배치, 1차원 |
| `nav ul` | Flexbox | 메뉴 항목 나열 (모바일 세로 / 데스크톱 가로) |
| `#skills-list`, `.filters` | Flexbox + `wrap` | 태그처럼 줄바꿈만 필요, 줄 사이 정렬은 불필요 |
| `.project-meta` | Flexbox | 배지 2개 나열 |
| `form`, `.form-group` | Flexbox (column) | 라벨-입력-에러를 세로로 쌓기 |
| `#footer-social` | Flexbox | 링크 가로 중앙 정렬 |
| **`#projects-list`** | **Grid** | 카드가 여러 줄이 되어도 **열 너비가 정확히 일치**해야 함 |

Grid를 쓴 유일한 곳은 프로젝트 카드입니다.

```css
grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
```

`auto-fit` + `minmax`는 **"최소 280px을 보장하되, 들어갈 수 있는 만큼 열을 만들고 남는 공간은 균등 분배"** 라는 뜻입니다. 미디어쿼리 없이 화면 폭에 따라 1열 → 2열 → 3열로 알아서 바뀝니다. JS는 카드를 몇 개 넣을지만 결정하고, 몇 줄로 배치할지는 신경 쓰지 않습니다.

### 로고를 왼쪽 끝에 붙이는 방법

`nav`는 `justify-content: space-between`인데 자식이 4개(로고·테마버튼·햄버거·메뉴)라 그냥 두면 넷이 고르게 흩어집니다. `.logo`에 `margin-right: auto`를 주면 **남은 공간을 로고 오른쪽이 전부 흡수**해서, 로고만 왼쪽에 남고 나머지 셋이 오른쪽으로 뭉칩니다.

---

## 1.3 반응형 — 모바일 퍼스트 3단 구성

기본 스타일이 곧 모바일이고, `min-width`로 큰 화면을 덧씌웁니다.

| 구간 | 내비게이션 | 프로젝트 카드 | 여백·글자 |
|---|---|---|---|
| **~767px** (기본) | 햄버거 표시, 메뉴는 드롭다운(숨김) | 1열 | 기본 |
| **768px~** | 햄버거 숨김, 메뉴 가로 고정 노출 | 2열 (자동) | 기본 |
| **1024px~** | 동일 | 3열 (자동) | 섹션 여백 1.5배, 히어로 2.5rem |

**왜 모바일 퍼스트인가** — 작은 화면이 제약이 가장 크므로, 여기서 성립하는 레이아웃을 먼저 만들고 큰 화면에서 여유를 더하는 편이 반대 방향보다 규칙이 적게 듭니다.

**768px 블록이 6줄이나 되는 이유** — 모바일용 드롭다운(`position: absolute`, 고정폭 200px, 배경색, 안쪽 여백)을 데스크톱에서 되돌려야 하기 때문입니다. 이건 모바일 퍼스트의 구조적 비용이라 피할 수 없습니다.

```css
@media (min-width: 768px) {
  .hamburger { display: none; }
  nav ul {
    display: flex; flex-direction: row;
    position: static; width: auto; background: none; padding: 0;
  }
}
```

**카드 개수에 미디어쿼리가 없는 이유** — 위의 `auto-fit`이 이미 처리하므로 별도 분기가 필요 없습니다. 1024px 블록이 하는 일은 여백과 글자 크기뿐입니다.

---

## 1.4 버튼 체계 — 5종류를 어떻게 구분했나

이 사이트에는 성격이 다른 버튼이 5종류 있고, **각자 전용 클래스로 조준**합니다.

| 클래스 | 대상 | 모양 | 비고 |
|---|---|---|---|
| `.btn` | `#hero-cta`(`<a>`), `#contact-submit`, `#retry-btn` | 파란 배경 알약, hover 시 위로 3px | 공용 |
| `.theme-toggle` | `#theme-toggle` | 36px 원형, 테두리만, hover 시 20° 회전 | 아이콘 전용 |
| `.hamburger` | `#hamburger` | 32px, 막대 3개, 배경 없음 | 아이콘 전용 |
| `.scroll-top` | `#scroll-top` | 44px 원형 파란 배경, 우하단 고정 | 아이콘 전용 |
| `.filter-btn` | JS 생성 필터 버튼 | 카드색 배경 + 테두리, `.active`면 반전 | 탭 성격 |

**왜 `button` 태그로 조준하지 않았나** — 이 부분은 실제로 한 번 잘못 갔다가 되돌린 지점이라 기록해 둡니다.

원래는 "모든 `button`은 파란 알약"으로 조준하고, 예외를 빼내는 방식이었습니다.

```css
/* 이전 방식 — 뺄셈 */
#hero-cta,
button:not(.hamburger):not(.theme-toggle):not(.scroll-top) { ... }
```

이러면 두 가지 문제가 생깁니다.

1. **빠뜨린 것이 오염된다.** `.filter-btn`은 `:not()` 목록에 없어서 파랗게 물들었고, 그걸 되돌리려고 관계없는 조상 `id`를 끌어와 명시도를 `1-1-0`까지 올려야 했습니다 (`#projects-filters .filter-btn`).
2. **버튼이 늘 때마다 규칙이 는다.** 새 아이콘 버튼을 만들면 `:not()`을 하나 더 붙여야 합니다.

`.btn` 클래스를 **필요한 3곳에만 붙이는 덧셈 방식**으로 바꾸자 `:not()` 3개와 `#projects-filters` 목발이 전부 사라졌습니다.

> 교훈: **예외를 계속 파내고 있다면 조준 범위가 틀린 것.**

### disabled 처리

```css
.btn:hover:not(:disabled) { transform: translateY(-3px); opacity: 0.9; }
.btn:disabled             { opacity: 0.6; cursor: not-allowed; }
```

hover를 걸어놓고 disabled일 때 되돌리는 대신, **애초에 걸리지 않게** 했습니다. 규칙이 하나 줄고 의도도 분명합니다.

---

## 1.5 명시도(specificity) 원칙

> **필요한 만큼만 구체적으로. 점수를 낭비하면 나중에 예외를 만들 때 자기 발등을 찍는다.**

현재 컴포넌트 스타일은 전부 `0-1-0`(클래스 1개)으로 평평합니다. `id`를 스타일링에 쓰는 곳은 레이아웃 컨테이너(`#projects-list`, `#skills-list`, `#hero` 등 페이지에 하나뿐인 영역)뿐이고, 재사용되는 부품은 전부 클래스입니다.

| 선택자 | 점수 |
|---|---|
| `*` | 0 |
| `button`, `nav a` | 1, 2 |
| `.btn`, `.filter-btn`, `.project-card` | 10 |
| `.filter-btn.active`, `header.scrolled` | 20, 11 |
| `#hero`, `#projects-list` | 100 |

동점이면 파일에서 **나중에 나온 쪽**이 이깁니다. 그래서 각 규칙 그룹은 "기본 → 예외" 순서로 배치했습니다 (예: `.status-msg` → `.status-msg:empty`).

---

## 1.6 애니메이션 3종

| 이름 | 방식 | 어디에 |
|---|---|---|
| 커서 깜빡임 | `@keyframes blink-cursor` — `50% { opacity: 0 }` | `#hero-greeting.typing::after` |
| 로딩 스피너 | `@keyframes spin` + `border-top-color`만 다른 원 | `.status-msg .loading::before` |
| 등장 효과 | `transition` (키프레임 아님) | `.reveal` → `.reveal.visible` |

스피너는 **이미지 파일 없이** 만들었습니다. 원(`border-radius: 50%`)의 테두리 4면 중 위쪽만 다른 색으로 칠하고 회전시키면, 한 조각이 도는 것처럼 보입니다.

`::before` / `::after`는 HTML에 없는 요소를 CSS가 만들어내는 **의사 요소**입니다. 커서와 스피너 모두 "내용이 아니라 장식"이므로 HTML을 더럽히지 않고 CSS에서 생성했습니다.

---

# 2. 상태 관리 아키텍처

## 2.1 STATE → setState → render

프레임워크 없이 React의 사고방식만 빌려왔습니다.

```
사용자 이벤트  →  setState({ 바뀐 값 })  →  해당 render 함수만 실행  →  DOM 갱신
```

**규칙 세 가지**

1. 이벤트 핸들러는 **DOM을 직접 건드리지 않는다.** `setState`만 호출한다.
2. `render` 함수는 **STATE를 읽기만 한다.** STATE를 바꾸지 않는다.
3. `render`는 몇 번 호출해도 같은 결과가 나와야 한다. (STATE 값이 곧 화면)

이렇게 하면 "지금 앱이 어떤 상태인지"를 `STATE` 객체 하나만 보면 알 수 있고, 화면 갱신 로직이 한곳에 모입니다.

## 2.2 STATE에 넣는 것과 넣지 않는 것

```js
const STATE = {
  theme, navOpen, scrolled, showScrollTop,
  projects: { status, items, username, message, filter },
  formErrors, formStatus, formMessage,
};
```

**기준: "사용자 인터랙션에 따라 바뀌고, 그때마다 다시 그려야 하는 값"만 넣는다.**

| STATE 밖에 둔 것 | 이유 |
|---|---|
| `info.json`으로 채우는 콘텐츠 (히어로 문구, 소개, 스킬, 푸터) | 한 번 fetch해서 한 번 그리면 끝. 다시 그릴 일이 없음 |
| 타이핑 진행 상황 | 1회성 연출. 매 글자마다 setState를 거치면 무겁기만 함 |
| reveal 관찰 결과 | 한 번 나타나면 끝인 1회성 트리거 |

## 2.3 setState가 render를 골라서 실행하는 이유

```js
const RENDERERS = {
  theme: renderTheme,
  navOpen: renderNav,
  scrolled: renderHeaderScroll,
  showScrollTop: renderScrollTopButton,
  projects: renderProjects,
  formErrors: renderFormErrors,
  formStatus: renderFormStatus,
  formMessage: renderFormStatus,   // 서로 다른 키가 같은 함수를 가리킴
};
```

`patch`에 담긴 **키에 해당하는 render만** 실행합니다. 스크롤 이벤트는 초당 수십 번 발생하는데 그때마다 프로젝트 카드와 폼까지 다시 그리면 낭비이고, 진행 중이던 애니메이션이 끊기는 버그의 원인이 됩니다.

`Set`으로 감싸는 이유는 `formStatus`와 `formMessage`가 같은 `renderFormStatus`를 가리키기 때문입니다. 둘을 한 번에 patch해도 함수는 **한 번만** 실행됩니다.

---

# 3. 동작 흐름 (기능별)

## 3.1 다크 모드

```
[클릭] #theme-toggle
   → handleThemeToggleClick(): 반대 테마 계산 + localStorage 저장
   → setState({ theme })
   → renderTheme(): <html>에 data-theme 설정 + 버튼 이모지 🌙/☀️ 교체
   → CSS :root[data-theme="dark"]가 변수 6개를 교체
   → body의 transition이 배경·글자색을 0.3초에 걸쳐 부드럽게 전환
```

**초기 테마 결정 (우선순위)**

1. `localStorage`에 저장된 사용자의 이전 선택
2. OS/브라우저의 `prefers-color-scheme: dark`
3. 둘 다 없으면 `"light"`

**페이지를 열어둔 채 OS 설정이 바뀌면** — `matchMedia`를 구독해 실시간 반영합니다. 단, **사용자가 토글을 눌러 직접 고른 적이 있으면 무시**합니다. 일부러 라이트로 바꿔놨는데 저녁이 되어 OS가 다크로 전환할 때마다 따라 바뀌면 곤란하기 때문입니다.

`addEventListener`가 없는 구형 Safari를 위해 `addListener`(구버전 API)도 함께 대응합니다.

## 3.2 네비게이션 & 햄버거 메뉴

```
[클릭] #hamburger
   → setState({ navOpen: !navOpen })
   → renderNav():
       #nav-menu에 .active  → CSS가 display:none → flex (드롭다운 펼침)
       #hamburger에 .active → CSS가 막대 3개를 X자로 회전
       aria-expanded 갱신    → 스크린리더에 열림 상태 전달
```

**햄버거 → X 변형**은 `<span>` 3개를 각각 다르게 움직여 만듭니다.

```css
.hamburger.active span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
.hamburger.active span:nth-child(2) { opacity: 0; }              /* 가운데는 숨김 */
.hamburger.active span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }
```

**메뉴 링크 클릭 시**

```
[클릭] .nav-link
   → preventDefault()로 <a href="#id">의 순간 이동을 막고
   → scrollIntoView({ behavior: "smooth" })로 부드럽게 이동
   → setState({ navOpen: false })로 모바일 드롭다운 자동 닫힘
```

`class="nav-link"`는 **CSS가 쓰지 않는 JS 전용 훅**입니다. 링크의 실제 모양은 태그 선택자 `nav a`가 담당합니다.

**Esc 키로 닫기** — 키보드만 쓰는 사용자가 메뉴를 열었다가 마우스 없이 빠져나올 수 있도록, Esc를 누르면 메뉴를 닫고 **포커스를 햄버거 버튼으로 되돌려줍니다.**

## 3.3 스크롤 반응 — 헤더 배경 & 맨 위로 버튼

```
[스크롤] window
   → handleScroll(): scrollY를 두 기준선과 비교
       > 60px  → scrolled = true
       > 300px → showScrollTop = true
   → 값이 실제로 바뀐 순간에만 setState  ★
   → renderHeaderScroll(): #site-header에 .scrolled
   → renderScrollTopButton(): #scroll-top에 .show
```

★ **최적화 지점** — 스크롤 이벤트는 초당 수십 번 발생합니다. 매번 `setState`를 부르면 낭비이므로, **경계선을 막 넘은 순간에만** 상태를 갱신합니다.

```js
if (scrolled !== STATE.scrolled || showScrollTop !== STATE.showScrollTop) {
  setState({ scrolled, showScrollTop });
}
```

**헤더가 상단에 붙어 있는 것은 JS가 아닙니다.** `position: sticky; top: 0`만으로 브라우저가 처리합니다. JS는 배경색 전환 타이밍만 담당합니다.

**스크롤탑 버튼에 `display: none`을 쓰지 않은 이유** — `display`는 전환(transition)이 불가능합니다. 부드럽게 나타나게 하려고 `opacity` + `transform`을 쓰고, 보이지 않을 때 클릭까지 막기 위해 `visibility: hidden`을 함께 걸었습니다.

## 3.4 등장 애니메이션 (reveal)

```
[스크롤로 화면에 20% 진입]
   → IntersectionObserver가 감지
   → .visible 클래스 추가
   → CSS transition이 opacity 0→1, translateY(30px)→0
   → unobserve() — 한 번 보여준 요소는 관찰 해제
```

**관찰자는 하나뿐입니다.** `revealObserver` 인스턴스 하나가 모든 `.reveal` 요소를 담당합니다.

**`observeReveal(scope)`가 인자를 받는 이유** — 페이지 최초 로드 시엔 HTML에 이미 있는 `<section class="reveal">` 5개를 등록하지만, GitHub API 응답으로 나중에 삽입되는 프로젝트 카드는 **그 시점에 DOM에 존재하지도 않았습니다.** 그래서 `renderProjects()`가 카드를 그린 직후 `observeReveal(listEl)`로 새 카드들만 다시 등록합니다.

여기서도 역할 분담이 지켜집니다 — **"무엇을 어떻게"(30px 이동, 0.6초)는 CSS가, "언제"(20% 진입)는 JS가** 결정합니다.

## 3.5 히어로 타이핑 효과

```
[페이지 로드] info.json에서 hero.greeting 읽음
   → typeText(el, text)
   → .typing 클래스 부여 → CSS ::after가 깜빡이는 커서(|) 생성
   → setTimeout으로 80ms마다 한 글자씩 textContent에 추가
   → 끝나면 .typing 제거 → 커서 사라짐
```

**접근성 배려** — `prefers-reduced-motion: reduce`가 켜져 있으면(화면 움직임에 민감한 사용자) 애니메이션 없이 텍스트를 **즉시 전부** 보여줍니다.

**STATE를 쓰지 않는 이유** — 매 글자마다 `setState`를 거치면 무겁기만 하고, 이 텍스트는 사용자 인터랙션으로 바뀌는 값이 아니라 "다시 그릴 필요가 있는 상태"에 해당하지 않습니다.

## 3.6 프로젝트 목록 — GitHub API

```
[페이지 로드] loadProjects(username)
   → setState({ projects: { status: "loading" } })   → "불러오는 중..." + 스피너
   → fetchWithTimeout()으로 GitHub REST API 호출
   → 성공: fork 제외 → 0개면 "empty", 있으면 "success"
   → 실패: 원인별 메시지와 함께 "error"
   → renderProjects()가 status에 따라 화면을 통째로 교체
```

### 5가지 상태

| status | 화면 |
|---|---|
| `idle` | 아무것도 표시 안 함 (fetch 시작 전) |
| `loading` | 회전하는 스피너 + "프로젝트를 불러오는 중..." |
| `success` | 필터 버튼 + 카드 그리드 |
| `empty` | "표시할 프로젝트가 없습니다." |
| `error` | 원인별 안내 문구 + "다시 시도" 버튼 |

### 왜 타임아웃이 필요한가

`fetch`에는 **자체 타임아웃이 없습니다.** 응답이 영영 오지 않으면 "로딩 중..."에서 무한정 멈춥니다. `AbortController`로 8초 후 요청을 강제 취소합니다.

```js
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
try   { return await fetch(url, { signal: controller.signal }); }
finally { clearTimeout(timeoutId); }   // 제때 왔다면 예약해둔 취소를 취소
```

### 에러 메시지를 원인별로 나눈 이유

모든 실패를 "불러올 수 없습니다"로 뭉뚱그리면 사용자가 무엇을 해야 할지 알 수 없습니다.

| 원인 | 메시지 |
|---|---|
| `403` | GitHub API 요청 한도 초과 — 잠시 후 재시도 |
| `404` | 해당 사용자를 찾을 수 없음 |
| `5xx` | GitHub 서버의 일시적 문제 |
| `AbortError` | 요청 시간 초과 — 네트워크 확인 |
| `TypeError` | 네트워크 연결 확인 (오프라인 등) |

`fetch`는 404나 500이어도 **예외를 던지지 않습니다.** 반드시 `res.ok`를 직접 확인해야 합니다.

### 자동 재시도를 넣지 않은 이유

실패의 흔한 원인이 레이트리밋(403)인데, 자동으로 계속 재요청하면 **오히려 API를 더 두드려 한도 회복을 늦춥니다.** 그래서 수동 "다시 시도" 버튼만 제공합니다.

## 3.7 언어 필터

```
[클릭] .filter-btn
   → handleFilterClick(language)
   → setState({ projects: { ...projects, filter: language } })
   → renderProjects()가 이미 받아둔 items를 array.filter()로 걸러 다시 그림
```

**핵심: fetch를 다시 하지 않습니다.** `STATE.projects.items`에 전체 목록이 항상 보관되어 있고, 필터는 화면에 그릴 때만 적용됩니다. 그래서 필터를 아무리 눌러도 네트워크 요청이 발생하지 않습니다.

**버튼 목록은 하드코딩하지 않습니다.** 받아온 저장소들의 `language` 값에서 중복을 제거해 실제 존재하는 언어만 버튼으로 만듭니다.

```js
const languages = [...new Set(items.map((r) => r.language).filter(Boolean))];
```

`map`으로 언어만 뽑고 → `filter(Boolean)`으로 언어 미지정(`null`) 저장소를 제거하고 → `Set`으로 중복을 없앤 뒤 → 배열로 펼칩니다.

**이벤트는 삽입 후에 연결합니다.** `innerHTML`로 만든 버튼이므로 HTML에 `onclick`을 쓸 수 없고(프로젝트 규칙), 삽입이 끝난 뒤 `addEventListener`로 붙입니다. 어떤 언어인지는 `data-filter` 속성에 담아 `btn.dataset.filter`로 읽습니다.

## 3.8 문의 폼

```
[입력 중] input 이벤트
   → validateAndSetField(field)
   → setState({ formErrors })
   → renderFormErrors(): <span>에 메시지 + input에 .invalid

[제출] submit 이벤트
   → preventDefault()로 새로고침 방지
   → 3개 필드 전부 검증 (map + every)
   → 실패 → 중단
   → 성공 → setState({ formStatus: "sending" }) → 버튼 잠금 + "전송 중..."
   → emailjs.sendForm() → Promise
        성공 → "success" + form.reset()
        실패 → "error"
```

**타이핑 중에 실시간 검증하는 이유** — 제출을 눌러야만 에러를 알게 되는 불편을 줄이기 위해서입니다.

**`click`이 아니라 `submit`을 듣는 이유** — Enter 키로 제출하는 경우까지 함께 잡기 위해서입니다.

**버튼을 잠그는 이유** — 응답이 오기 전에 중복 클릭하면 메일이 여러 통 전송됩니다.

**에러 메시지 자리를 미리 비워두는 이유**

```css
.error-message { min-height: 1em; }
```

메시지가 나타났다 사라질 때 아래 요소들이 덜컹거리며 밀리는 것을 막습니다.

**`statusEl.className`을 통째로 지정하는 이유** — `classList.add`로 쌓으면 이전 상태의 `success-message`가 남아 성공/실패 색이 섞입니다. 통째로 교체하면 항상 하나만 남습니다.

**이메일 정규식**

```js
/^[^\s@]+@[^\s@]+\.[^\s@]+$/
```

`로컬파트@도메인.최상위도메인` 형태만 봅니다. RFC 5322의 예외적 케이스(따옴표 포함 로컬파트, 국제화 도메인 등)까지는 검사하지 않는, 실무에서 흔히 쓰는 단순화된 패턴입니다.

## 3.9 초기 콘텐츠 로딩

`index.html`에는 **문구가 하나도 없습니다.** 빈 태그만 있고, `data/info.json`을 fetch해 채웁니다.

| JSON 경로 | 들어가는 곳 |
|---|---|
| `hero.greeting` | `#hero-greeting` (타이핑 효과) |
| `hero.ctaText` / `ctaLink` | `#hero-cta`의 텍스트 / href |
| `about.image` / `imageAlt` / `text` | `#about-img`의 src / alt, `#about-text` |
| `skills[]` | `#skills-list`에 `<li>` 생성 |
| `footer.copyright` / `social[]` | `#footer-copyright`, `#footer-social` |
| `github.username` | `loadProjects()` 인자 |

**`<img>`의 alt를 처음부터 비워두지 않은 이유** — fetch가 끝나기 전 스크린리더가 이미지를 만나면 아무 정보도 얻지 못합니다. HTML에 "프로필 사진을 불러오는 중입니다"를 기본값으로 넣어두고, JS가 실제 alt로 덮어씁니다.

---

# 4. 안전장치와 접근성

## 4.1 XSS 방지 — `escapeHtml()`

GitHub API가 돌려주는 저장소 이름·설명·언어·URL은 **우리가 통제할 수 없는 외부 문자열**입니다. 이를 템플릿 리터럴로 조합해 `innerHTML`에 넣으면, 문자열에 `<img onerror=...>` 같은 것이 섞여 있을 때 브라우저가 **진짜 태그로 해석해 실행**합니다.

```js
const escapeHtml = (value) => {
  const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return String(value).replace(/[&<>"']/g, (ch) => entities[ch]);
};
```

`< > & " '`를 HTML 엔티티로 바꿔 **글자 그대로의 텍스트**로만 표시되게 만듭니다. 카드에 삽입되는 모든 외부 값이 이 함수를 거칩니다.

## 4.2 외부 스크립트 방어

EmailJS SDK는 CDN에서 불러오는데, 네트워크 문제나 광고 차단기로 실패할 수 있습니다.

```js
if (typeof emailjs !== "undefined") { emailjs.init({ publicKey: ... }); }
```

이 확인이 없으면 **에러 하나가 스크립트 전체 실행을 멈춰** 다크 모드나 햄버거 메뉴 같은 무관한 기능까지 전부 죽습니다.

## 4.3 새 탭 링크

```html
<a href="..." target="_blank" rel="noopener">
```

`rel="noopener"`가 없으면 새로 열린 페이지가 `window.opener`로 원본 페이지를 조작할 수 있습니다.

## 4.4 접근성 정리

| 항목 | 조치 |
|---|---|
| 문서 구조 | 시맨틱 태그(`header`/`nav`/`main`/`section`/`article`/`footer`)로 영역 구분 |
| 햄버거 상태 | `aria-expanded`를 열림/닫힘에 맞춰 갱신, `aria-controls`로 대상 명시 |
| 아이콘 버튼 | `aria-label`로 "다크 모드 전환", "메뉴 열기", "맨 위로 이동" 제공 |
| 폼 라벨 | `label for` ↔ `input id` 1:1 매칭 (라벨 클릭 시 포커스 이동) |
| 폼 전송 결과 | `#form-status`에 `role="status"` — 성공/실패 문구를 자동으로 읽어줌 |
| 프로젝트 상태 영역 | `aria-live="polite"`로 로딩·에러 변화를 자동 안내 |
| 에러 메시지 | `min-height: 1em`으로 자리를 유지해 레이아웃이 흔들리지 않음 |
| 키보드 탐색 | Esc로 메뉴 닫기 + 포커스 복귀 |
| 움직임 민감성 | `prefers-reduced-motion` 존중 (타이핑 효과 생략) |
| 이미지 | 로딩 중에도 의미 있는 `alt` 유지 |

## 4.5 이벤트 리스너를 제거하지 않는 이유

React였다면 언마운트 시 리스너를 정리해야 메모리 누수가 없지만, 이 페이지는 **컴포넌트가 마운트/언마운트되는 SPA가 아니라 처음부터 끝까지 그대로 떠 있는 정적 페이지**입니다. `#hamburger` 같은 요소가 페이지 생명주기 동안 사라지지 않으므로, 리스너도 한 번 등록되고 유지되면 충분합니다.

## 4.6 `defer`와 `DOMContentLoaded`

스크립트 태그의 배치와 순서는 [0.3](#03-스크립트-로딩--head--defer)에 정리했습니다. 여기서는 JS 쪽 대응만 다룹니다.

`defer` 스크립트는 `DOMContentLoaded`가 **발생하기 직전**에 실행됩니다. 따라서 코드 안에서 `DOMContentLoaded`를 한 번 더 기다려도 안전합니다 — 리스너 등록이 이벤트 발생보다 반드시 먼저이기 때문입니다.

```js
document.addEventListener("DOMContentLoaded", async () => { … });
```

`defer` 덕분에 이미 DOM은 준비되어 있지만, 이렇게 감싸두면 나중에 `defer`를 빼거나 스크립트 위치를 옮겨도 깨지지 않습니다.

---

# 5. 대응표 — id/class ↔ CSS ↔ JS

## 5.1 HTML에 고정으로 존재하는 요소

| id / class | CSS 규칙 | JS가 하는 일 |
|---|---|---|
| `#site-header` | `header`, `header.scrolled` | `.scrolled` 토글 |
| `#theme-toggle` | `.theme-toggle`, `:hover` | 클릭 리스너, 이모지 교체 |
| `#hamburger` | `.hamburger`, `.hamburger.active span:nth-child(n)` | 클릭 리스너, `.active`·`aria-expanded` 토글 |
| `#nav-menu` | `nav ul`, `nav ul.active` | `.active` 토글 |
| `.nav-link` | *(없음 — `nav a`가 담당)* | 부드러운 스크롤 훅 |
| `.logo` | `.logo` | — |
| `#hero-greeting` | `#hero-greeting.typing::after` | 타이핑 효과 |
| `#hero-cta` | `.btn` | `info.json`의 텍스트·href 주입 |
| `#about-img` / `#about-text` | `#about-img` | `info.json` 주입 |
| `#skills-list` | `#skills-list`, `#skills-list li` | `<li>` 생성 |
| `#projects-filters` | `.filters`, `.filters:empty` | 필터 버튼 생성 |
| `#projects-status` | `.status-msg`, `:empty`, `.error`, `.loading::before` | 상태별 문구 교체 |
| `#projects-list` | `#projects-list` (Grid) | 카드 생성 |
| `#contact-form` | `form` | submit 리스너 |
| `#name` / `#email` / `#message` | `input`, `textarea`, `.invalid` | input 리스너, `.invalid` 토글 |
| `#name-error` 등 | `.error-message` | 메시지 주입 |
| `#contact-submit` | `.btn`, `.btn:disabled` | `disabled`·텍스트 교체 |
| `#form-status` | `.error-message` / `.success-message` | `className` 교체 |
| `#footer-copyright` / `#footer-social` | `#footer-social` | `info.json` 주입 |
| `#scroll-top` | `.scroll-top`, `.scroll-top.show` | `.show` 토글, 클릭 리스너 |
| `.reveal` | `.reveal`, `.reveal.visible` | IntersectionObserver가 `.visible` 부여 |

## 5.2 JS가 만들어 넣는 요소

| 생성 위치 | 마크업 | CSS 규칙 |
|---|---|---|
| `renderProjectFilters()` | `<button class="filter-btn" data-filter="...">` | `.filter-btn`, `:hover`, `.active` |
| `renderProjects()` 성공 | `<article class="project-card reveal">` | `.project-card`, `:hover` |
| ↳ 카드 내부 | `<div class="project-meta"><span class="badge">` | `.project-meta`, `.badge` |
| `renderProjects()` 로딩 | `<p class="loading">` | `.status-msg .loading::before` |
| `renderProjects()` 에러 | `<p class="error">` + `<button id="retry-btn" class="btn">` | `.status-msg .error`, `.btn`, `#retry-btn` |
| `renderProjects()` 빈 상태 | `<p class="empty">` | *(전용 스타일 없음 — `.status-msg`만)* |

## 5.3 설정 상수

| 상수 | 값 | 의미 |
|---|---|---|
| `NAV_SCROLL_THRESHOLD` | `60` | 헤더 배경이 바뀌는 스크롤 위치(px) |
| `SCROLL_TOP_THRESHOLD` | `300` | 맨 위로 버튼이 나타나는 위치(px) |
| `REVEAL_THRESHOLD` | `0.2` | 등장 애니메이션 발동 비율(20%) |
| `FETCH_TIMEOUT_MS` | `8000` | GitHub API 최대 대기 시간 |
| `TYPING_SPEED_MS` | `80` | 타이핑 한 글자당 지연 |
| `THEME_KEY` | `"portfolio-theme"` | localStorage 키 |
| `DEBUG` | `false` | `true`로 바꾸면 setState 로그 출력 |
