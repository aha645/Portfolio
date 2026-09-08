// 페이지 로드 시 실행
document.addEventListener("DOMContentLoaded", async () => {
  // 1. data.json 파일 읽기
  const res = await fetch("data/info.json");
  const data = await res.json();

  // 2. Hero 채우기
  document.getElementById("hero-greeting").textContent = data.hero.greeting;
  const cta = document.getElementById("hero-cta");
  cta.textContent = data.hero.ctaText;
  cta.href = data.hero.ctaLink;

  // 3. About 채우기
  const aboutImg = document.getElementById("about-img");
  aboutImg.src = data.about.image;
  aboutImg.alt = data.about.imageAlt; // 의미있는 alt
  document.getElementById("about-text").textContent = data.about.text;

  // 4. Skills 목록 만들기
  const skillsList = document.getElementById("skills-list");
  data.skills.forEach((skill) => {
    const li = document.createElement("li");
    li.textContent = skill;
    skillsList.appendChild(li);
  });

  // 5. Footer 채우기
  document.getElementById("footer-copyright").textContent = data.footer.copyright;
  const socialList = document.getElementById("footer-social");
  data.footer.social.forEach((s) => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = s.url;
    a.textContent = s.name;
    li.appendChild(a);
    socialList.appendChild(li);
  });

  // 6. GitHub API 연동 (프로젝트 카드)
  loadProjects(data.github.username);
});

// GitHub 저장소를 카드로 표시
async function loadProjects(username) {
  const res = await fetch(`https://api.github.com/users/${username}/repos`);
  const repos = await res.json();

  const container = document.getElementById("projects-list");
  repos.forEach((repo) => {
    const article = document.createElement("article"); // 시맨틱 태그!
    article.innerHTML = `
      <h3>${repo.name}</h3>
      <p>${repo.description ?? "설명 없음"}</p>
      <a href="${repo.html_url}" target="_blank">GitHub 보기</a>
    `;
    container.appendChild(article);
  });
}