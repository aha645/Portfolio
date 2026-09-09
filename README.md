# 반응형 포트폴리오 웹사이트

HTML/CSS/JavaScript(순수 바닐라)로 제작한 반응형 포트폴리오 사이트입니다.
다크 모드, GitHub API 연동 프로젝트 목록, 폼 유효성 검사 및 실제 전송을 프레임워크 없이 구현했습니다.

## 배포 URL

- GitHub 저장소: https://github.com/aha645/Portfolio
- GitHub Pages: https://aha645.github.io/Portfolio/

## 스크린샷

| 화면 | 데스크톱 | 모바일 |
|---|---|---|
| 라이트 모드 | ![데스크톱 화면](images/screenshot-desktop.png) | ![모바일 화면](images/screenshot-mobile.png) |
| 다크 모드 | ![데스크톱 다크모드 화면](images/screenshot-desktop-dark.png) | ![모바일 다크모드 화면](images/screenshot-mobile-dark.png) |

## 사용 기술

- **HTML5**: 시맨틱 태그(`header`/`nav`/`main`/`section`/`article`/`footer`)
- **CSS3**: CSS 변수(`:root`), Flexbox, Grid, `@media` 반응형, `transition`/`@keyframes`
- **JavaScript (ES6+)**: `fetch`/`async-await`, `IntersectionObserver`, `localStorage`, `matchMedia`, 단일 `STATE` 객체 기반 상태 관리
- **GitHub REST API**: `GET /users/{username}/repos`
- **EmailJS**: 문의 폼 실제 이메일 전송 (SMTP Server로 네이버 메일 연결)
- **배포**: GitHub Pages

## Flexbox vs Grid 선택 기준

한 줄/한 열 정렬이면 Flexbox, 여러 줄에서도 열 너비가 정확히 맞아야 하면 Grid를 썼습니다.

| 위치 | 선택 | 이유 |
|---|---|---|
| `nav` ([css/style.css:98](css/style.css#L98)) | Flexbox | 로고-메뉴 양 끝 배치만 하면 되는 1차원 정렬 |
| `#skills-list`, `.filters` ([css/style.css:339](css/style.css#L339)) | Flexbox + wrap | 태그처럼 줄바꿈만 필요, 줄 간 정렬 불필요 |
| `#projects-list` ([css/style.css:366](css/style.css#L366)) | Grid | 카드가 여러 줄이어도 열 너비가 항상 같아야 함 (`auto-fit`, `minmax`) |

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

## 기준값 (자유 변경 가능, `js/script.js` 상단 상수)

| 기능 | 기준값 | 상수명 |
|---|---|---|
| 네비게이션 배경 변경 스크롤 위치 | `60px` | `NAV_SCROLL_THRESHOLD` |
| 스크롤 탑 버튼 표시 스크롤 위치 | `300px` | `SCROLL_TOP_THRESHOLD` |
| 스크롤 등장 애니메이션 임계값 | `0.2` | `REVEAL_THRESHOLD` |
| GitHub API 요청 타임아웃 | `8000ms` | `FETCH_TIMEOUT_MS` |
| Hero 타이핑 효과 속도 | 글자당 `80ms` | `TYPING_SPEED_MS` |
| 반응형 브레이크포인트 | `768px`(태블릿), `1024px`(데스크톱) | `css/style.css` `@media` |

## 상태(state) → 렌더링 흐름

단일 `STATE` 객체와 `setState()`로 "이벤트 → 상태 변경 → 화면 갱신"을 한 방향으로 강제합니다.

```js
const STATE = {
  theme, navOpen, scrolled, showScrollTop,
  projects: { status, items, username, message, filter },
  formErrors, formStatus, formMessage,
};
```

| 상태 | 이벤트 | 렌더링 |
|---|---|---|
| 다크 모드 (`theme`) | 토글 클릭 / OS 설정 변경 | 전체 배색 전환 |
| 메뉴 열림 (`navOpen`) | 햄버거 클릭 / `Esc` | 드롭다운 표시·숨김 |
| 프로젝트 (`projects`) | 로드 / 재시도 / 언어 필터 클릭 | 로딩·성공·에러·빈 상태 + 카드 필터링 |
| 폼 (`formErrors`/`formStatus`) | 입력 / 제출 | 에러 메시지, 전송 상태 문구 |
| 스크롤 (`scrolled`/`showScrollTop`) | 스크롤 | 헤더 배경, 스크롤탑 버튼 표시 |

`setState`는 바뀐 상태에 매핑된 render 함수만 실행하므로, 스크롤처럼 잦은 이벤트가 무관한
영역(프로젝트 카드 등)까지 다시 그리지 않습니다. Hero/About/Skills/Footer 콘텐츠는 로드 시
한 번만 채워지는 정적 값이라 `STATE`에 포함하지 않았습니다.

## 문의 폼 실제 전송 설정 (EmailJS + 네이버 SMTP)

Gmail 대신 **SMTP Server 서비스로 네이버 메일**을 연결해 실제 이메일이 전송되도록 구성했습니다.

1. 네이버 메일 → 환경설정 → POP3/IMAP 설정 → "SMTP 사용" 활성화 (2단계 인증 시 애플리케이션 비밀번호 발급)
2. EmailJS → Email Services → Add New Service → **SMTP Server**
   - SMTP Server: `smtp.naver.com` / Port: `587`(STARTTLS) 또는 `465`(SSL)
   - Username / Password: 본인 네이버 메일 주소 / 위 비밀번호
3. Email Templates에서 `{{name}}`, `{{email}}`, `{{message}}` 변수로 템플릿 작성, To Email은 본인 메일 주소, Reply To는 `{{email}}`
4. 발급된 Service ID / Template ID / Public Key를 [js/script.js](js/script.js)의 `EMAILJS_*` 상수에 채워 넣기 (이미 채워져 있어 바로 동작)

## 로컬 개발 환경

1. VS Code에서 프로젝트 폴더 열기
2. `Live Server` 확장 설치 후 `index.html`에서 우클릭 → "Open with Live Server"
3. GitHub API 확인: `data/info.json`의 `github.username`을 본인 GitHub 아이디로 설정
