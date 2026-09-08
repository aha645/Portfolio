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
- **JavaScript (ES6+, 순수 바닐라)**: `fetch`/`async-await`, `IntersectionObserver`, `localStorage`,
  화살표 함수, 구조분해 할당, 템플릿 리터럴, `map`/`filter`/`forEach`
- **GitHub REST API**: `GET /users/{username}/repos`
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
| 반응형 브레이크포인트 | `768px`(태블릿), `1024px`(데스크톱) | `css/style.css` `@media` |

## 인터랙션 목록

- **다크 모드 토글**: 우측 상단 버튼 클릭 → `html[data-theme]` 속성 전환 → `localStorage`에 저장되어 새로고침 후에도 유지
- **햄버거 메뉴**: 768px 미만 화면에서 메뉴 버튼 클릭 시 `classList.toggle('active')`로 열림/닫힘
- **부드러운 스크롤**: 네비게이션 클릭 시 `scrollIntoView({ behavior: 'smooth' })`로 해당 섹션 이동
- **스크롤 탑 버튼**: 300px 이상 스크롤 시 표시, 클릭 시 최상단으로 이동
- **Projects 섹션**: GitHub API에서 저장소 목록을 가져와 로딩 → 성공/빈 상태/에러(재시도 버튼 포함) 순으로 렌더링
- **문의 폼 유효성 검사**: 이름/이메일/메시지 필수 입력 검증 + 이메일 형식 검증, 필드 근처에 에러 메시지 표시, 통과 시 성공 메시지 표시

## 상태(state) → 렌더링 흐름 (React의 상태-렌더링 기초 연습)

1. **다크 모드**: 버튼 클릭(이벤트) → `data-theme` 속성 변경(상태) → CSS 변수로 전체 배색 변경(렌더링)
2. **GitHub API**: 페이지 로드/재시도 클릭(이벤트) → 로딩/성공/에러/빈 상태 변경(상태) → `#projects-list` innerHTML 교체(렌더링)
3. **폼 검증**: 입력/제출(이벤트) → 필드별 유효성 결과 변경(상태) → 에러 메시지 표시·숨김(렌더링)

## 로컬 개발 환경

1. VS Code에서 프로젝트 폴더 열기
2. `Live Server` 확장 설치 후 `index.html`에서 우클릭 → "Open with Live Server"
3. GitHub API 호출을 확인하려면 `data/info.json`의 `github.username` 값을 본인 GitHub 아이디로 설정
