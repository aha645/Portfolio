# 반응형 포트폴리오 웹사이트

HTML/CSS/JavaScript(순수 바닐라)만으로 제작한 1인 개발자 포트폴리오 사이트입니다.
모바일 퍼스트 반응형 레이아웃, 다크 모드, GitHub API 연동 프로젝트 목록, 폼 유효성 검사 등
정적 웹 페이지에서 구현 가능한 인터랙션을 프레임워크 없이 직접 구현했습니다.

## 배포 URL

- GitHub Pages: https://aha645.github.io/Portfolio/
  (저장소 Settings → Pages에서 `main` 브랜치 `/ (root)`로 배포)

## 스크린샷

> `images/screenshot-desktop.png`, `images/screenshot-mobile.png` 파일을 추가한 뒤
> 아래 링크를 실제 이미지로 교체하세요.

| 데스크톱 | 모바일 |
|---|---|
| ![데스크톱 화면](images/screenshot-desktop.png) | ![모바일 화면](images/screenshot-mobile.png) |

## 사용 기술

- **HTML5**: 시맨틱 태그(`header`, `nav`, `main`, `section`, `article`, `footer`)로 구조화
- **CSS3**: CSS 변수(`:root`), Flexbox, Grid, `@media` 반응형, `transition`/`@keyframes` 애니메이션
- **JavaScript (ES6+, 순수 바닐라)**: `fetch`/`async-await`, `AbortController`(요청 타임아웃),
  `IntersectionObserver`, `localStorage`, `matchMedia`(`prefers-color-scheme`,
  `prefers-reduced-motion`), 화살표 함수, 구조분해 할당, 템플릿 리터럴, `map`/`filter`/`forEach`,
  단일 `STATE` 객체 기반 상태 관리
- **GitHub REST API**: `GET /users/{username}/repos`
- **EmailJS**: 문의 폼 실제 이메일 전송 (SMTP Server 서비스로 네이버 메일 연결)
- **배포**: GitHub Pages

## 폴더 구조

```
Portfolio/
├── index.html        # 메인 페이지 (시맨틱 마크업)
├── css/style.css      # 전체 스타일시트
├── js/script.js       # 인터랙션 / 상태 관리 / API 연동
├── data/info.json     # Hero·About·Skills·Footer 콘텐츠 데이터
├── images/            # 프로필 사진 등 이미지 리소스
└── README.md
```

## 주요 기능 & 기준값

과제 요구사항 중 "자유롭게 변경 가능하지만 문서에 명시"하도록 되어 있는 값들입니다.
(실제 값은 [js/script.js](js/script.js) 상단 상수로 관리됩니다.)

| 기능 | 기준값 | 위치 |
|---|---|---|
| 네비게이션 배경 변경 시작 스크롤 위치 | `60px` | `NAV_SCROLL_THRESHOLD` |
| 스크롤 탑 버튼이 나타나는 스크롤 위치 | `300px` | `SCROLL_TOP_THRESHOLD` |
| 스크롤 등장 애니메이션(IntersectionObserver) 임계값 | `0.2` (20% 노출 시 실행) | `REVEAL_THRESHOLD` |
| GitHub API 요청 타임아웃 | `8000ms` | `FETCH_TIMEOUT_MS` |
| Hero 타이핑 효과 속도 | 글자당 `80ms` | `TYPING_SPEED_MS` |
| 반응형 브레이크포인트 | `768px`(태블릿), `1024px`(데스크톱) | `css/style.css` `@media` |

## 인터랙션 목록

- **Hero 타이핑 효과**: 인사말이 한 글자씩 타자기처럼 나타나고, 타이핑 중에는 깜빡이는 커서(`|`)가 표시된다. 시스템의 "동작 줄이기"(`prefers-reduced-motion`) 설정이 켜져 있으면 애니메이션 없이 전체 문구를 즉시 표시한다
- **다크 모드 토글**: 우측 상단 버튼 클릭 → `html[data-theme]` 속성 전환 → `localStorage`에 저장되어 새로고침 후에도 유지. 저장된 값이 없는 첫 방문 시에는 OS의 `prefers-color-scheme`(다크 모드 선호 여부)를 확인해 초기 테마를 정한다 (`getInitialTheme()`)
- **햄버거 메뉴**: 768px 미만 화면에서 메뉴 버튼 클릭 시 `classList.toggle('active')`로 열림/닫힘. 메뉴가 열린 상태에서 `Esc` 키를 누르면 닫히고 포커스가 햄버거 버튼으로 돌아간다 (키보드 접근성)
- **부드러운 스크롤**: 네비게이션 클릭 시 `scrollIntoView({ behavior: 'smooth' })`로 해당 섹션 이동
- **스크롤 탑 버튼**: 300px 이상 스크롤 시 표시, 클릭 시 최상단으로 이동
- **Projects 섹션**: GitHub API에서 저장소 목록을 가져와 로딩 → 성공/빈 상태/에러(재시도 버튼 포함) 순으로 렌더링. 요청이 8초(`FETCH_TIMEOUT_MS`) 안에 끝나지 않으면 자동 취소하고, 상태 코드(403/404/5xx)·네트워크 단절·타임아웃을 구분한 안내 메시지를 보여준다
- **프로젝트 언어 필터**: 저장소를 불러온 뒤 실제 존재하는 언어만 골라 "전체" + 언어별 버튼을 동적으로 생성(고정된 언어 목록 아님). 버튼 클릭 시 API를 다시 부르지 않고, 이미 받아둔 목록을 `array.filter()`로 걸러 즉시 다시 그린다
- **문의 폼 유효성 검사 + 실제 전송**: 이름/이메일/메시지 필수 입력 검증 + 이메일 형식 검증, 필드 근처에 에러 메시지 표시. 통과하면 EmailJS로 실제 이메일을 전송하며, 전송 중엔 버튼이 잠기고 "전송 중..."으로 바뀌고, 성공/실패에 따라 다른 안내 문구를 보여준다

## 상태(state) → 렌더링 흐름 (React의 상태-렌더링 기초 연습)

`js/script.js`에는 앱의 모든 동적인 값을 모아둔 단일 `STATE` 객체가 있습니다.
DOM을 직접 여기저기서 건드리는 대신 **`setState(patch)` → `STATE` 갱신 → 관련 `render*()` 함수 실행**
한 방향으로만 화면이 바뀌도록 강제해서, "지금 앱이 어떤 상태인지"를 `STATE` 객체 하나만 보고 알 수 있습니다.

```js
const STATE = {
  theme, navOpen, scrolled, showScrollTop,
  projects: { status, items, username, message, filter }, // message: 에러 원인별 안내 문구
                                                            // filter: "all" | 선택된 언어
  formErrors,                 // 필드별 유효성 검사 에러 (name/email/message)
  formStatus, formMessage,    // EmailJS 전송 상태("idle"|"sending"|"success"|"error")와 안내 문구
};
```

1. **다크 모드**: 버튼 클릭(이벤트) → `setState({ theme })`로 `STATE.theme` 변경(상태) → `renderTheme()`이 `data-theme` 속성/버튼 아이콘 갱신 → CSS 변수로 전체 배색 변경(렌더링). 초기값은 `getInitialTheme()`이 `localStorage` → `prefers-color-scheme` 순으로 결정
2. **햄버거 메뉴**: 버튼 클릭 또는 열린 상태에서 `Esc`(이벤트) → `setState({ navOpen })`로 열림/닫힘 상태 변경 → `renderNav()`가 `.active` 클래스와 `aria-expanded`를 갱신(렌더링)
3. **GitHub API**: 페이지 로드/재시도 클릭(이벤트) → `loadProjects()`가 `setState({ projects: {...} })`로 로딩/성공/에러(상태코드·네트워크·타임아웃별 `message` 포함)/빈 상태 변경(상태) → `renderProjects()`가 `#projects-list`/`#projects-status` innerHTML 교체(렌더링)
4. **언어 필터**: 필터 버튼 클릭(이벤트) → `handleFilterClick()`이 `setState({ projects: { ...STATE.projects, filter } })`로 `STATE.projects.filter` 변경(상태) → `renderProjects()`가 이미 받아둔 `items`를 `array.filter()`로 걸러 `#projects-list`를 다시 그림(렌더링). API를 다시 호출하지 않는다
5. **폼 검증 + 전송**: 입력(이벤트) → `setState({ formErrors: {...} })`로 필드별 유효성 결과 변경(상태) → `renderFormErrors()`가 에러 메시지 표시·숨김(렌더링). 제출(이벤트) → 검증 통과 시 `setState({ formStatus: "sending" })` → `emailjs.sendForm()` 결과에 따라 `setState({ formStatus: "success"|"error", formMessage })`(상태) → `renderFormStatus()`가 제출 버튼 잠금/문구를 갱신(렌더링)
6. **스크롤**: 스크롤 이벤트 → 임계값을 막 넘었을 때만 `setState({ scrolled, showScrollTop })` 호출(상태) → `renderHeaderScroll()`/`renderScrollTopButton()`이 해당 클래스만 갱신(렌더링)

`setState`는 바뀐 키에 매핑된 `render*()` 함수만 실행합니다(`RENDERERS` 매핑 테이블).
그래서 스크롤처럼 자주 발생하는 이벤트가 프로젝트 카드나 폼처럼 무관한 영역까지
다시 그리며 애니메이션을 끊거나 성능을 낭비하지 않습니다.

반면 Hero/About/Skills/Footer의 콘텐츠(`data/info.json` 값)는 페이지 로드 시 한 번만
채워지고 이후 바뀌지 않는 정적인 값이라 `STATE`에 포함하지 않았습니다.

모든 이벤트 핸들러(`handleThemeToggleClick`, `handleHamburgerClick`, `handleNavLinkClick`,
`handleScroll`, `handleScrollTopClick`, `handleFormSubmit`, `handleKeydown` 등)는
`addEventListener`에 넘기는 익명 함수 대신 이름 붙은 함수로 분리되어 있어,
어떤 이벤트가 `STATE`의 어떤 값을 바꾸는지 함수 이름만으로 추적할 수 있습니다.

## 문의 폼 실제 전송 설정 (EmailJS + 네이버 SMTP)

이 프로젝트는 Formspree/EmailJS의 기본 Gmail 연동 대신, **네이버 메일(`likylove@naver.com`)을
SMTP로 직접 연결**해서 문의 폼 제출 시 실제 이메일이 오도록 구성했습니다.

1. **네이버 메일에서 SMTP 켜기**: 네이버 메일 로그인 → 환경설정 → POP3/IMAP 설정 → "SMTP 사용" 활성화
   (2단계 인증을 쓰는 계정이면 네이버 보안설정에서 별도의 "애플리케이션 비밀번호"를 발급받아
   그 값을 아래 비밀번호 자리에 사용)
2. **EmailJS에서 SMTP 서비스 추가**: [emailjs.com](https://www.emailjs.com) 가입 →
   Email Services → Add New Service → **SMTP Server** 선택 후 입력
   - SMTP Server: `smtp.naver.com`
   - Port: `587`(Security: STARTTLS) 또는 `465`(Security: SSL/TLS)
   - Username: `likylove@naver.com`
   - Password: 1번에서 확인한 비밀번호
3. **템플릿 작성**: Email Templates → Create New Template. 이 폼의 `<input name="...">`과
   동일한 이름의 변수를 그대로 사용합니다 (`{{name}}`, `{{email}}`, `{{message}}`).
   - To Email: `likylove@naver.com`
   - Reply To: `{{email}}` (문의자에게 바로 답장할 수 있도록)
4. **키 발급**: 생성된 **Service ID**, **Template ID**, Account → General의 **Public Key**를
   확인해 [js/script.js](js/script.js) 상단의 세 상수에 채워 넣습니다.
   ```js
   const EMAILJS_PUBLIC_KEY = "...";
   const EMAILJS_SERVICE_ID = "...";
   const EMAILJS_TEMPLATE_ID = "...";
   ```

키를 채우지 않은 채로 두면(placeholder 상태) `emailjs.sendForm()`이 실패하고,
폼은 "메일 전송에 실패했습니다."라는 에러 상태를 정상적으로 보여줍니다(즉,
검증 로직 자체는 키 설정과 무관하게 항상 동작합니다). 이 프로젝트는 이미
실제 키 값이 채워져 있어 배포된 상태에서 바로 이메일 전송이 동작합니다.

## 로컬 개발 환경

1. VS Code에서 프로젝트 폴더 열기
2. `Live Server` 확장 설치 후 `index.html`에서 우클릭 → "Open with Live Server"
3. GitHub API 호출을 확인하려면 `data/info.json`의 `github.username` 값을 본인 GitHub 아이디로 설정
4. 문의 폼 실제 전송을 확인하려면 위 "문의 폼 실제 전송 설정" 절차대로 EmailJS 키를 발급받아
   `js/script.js`의 `EMAILJS_PUBLIC_KEY`/`EMAILJS_SERVICE_ID`/`EMAILJS_TEMPLATE_ID`를 채우기
