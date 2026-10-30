const DATA_PATHS = {
  profile: "data/profile.json",
  research: "data/research.json",
  design: "data/design.json",
  awards: "data/awards.json"
};

const state = { profile: null, research: null, design: null, awards: null, ranking: "jcr", activePage: "research", lastFocus: null };
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const valueOr = (value, fallback = "待补充") => value && String(value).trim() ? value : fallback;

async function loadData() {
  try {
    const entries = await Promise.all(Object.entries(DATA_PATHS).map(async ([key, path]) => {
      const response = await fetch(path);
      if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
      return [key, await response.json()];
    }));
    Object.assign(state, Object.fromEntries(entries));
    renderAll();
  } catch (error) {
    console.error("数据加载失败", error);
    showToast("数据加载失败，请通过本地 HTTP 服务器打开网站。");
    renderEmpty($("#research-grid"), "数据暂时无法读取", "请检查 JSON 文件路径，或使用本地静态服务器预览。");
  }
}

function renderAll() {
  renderProfile(state.profile.profile);
  renderResearch();
  renderDesign();
  renderAwards();
}

function renderProfile(profile) {
  $("#profile-name").textContent = valueOr(profile.name, "个人信息待补充");
  const role = [profile.institution, profile.major, profile.degree].filter(Boolean).join(" · ");
  $("#profile-role").textContent = valueOr(role, "学校 / 专业 / 学历");
  $("#profile-bio").textContent = valueOr(profile.bio, "我的个人学术主页，持续更新中。欢迎访问我的个人学术主页。");
  const photo = $("#profile-photo");
  photo.innerHTML = profile.photo
    ? `<img src="${escapeHtml(profile.photo)}" alt="${escapeHtml(profile.name || "个人照片")}">`
    : "<span>PHOTO</span>";
  photo.setAttribute("aria-hidden", profile.photo ? "false" : "true");

  const fields = [
    ["学校", profile.institution], ["专业", profile.major], ["学历", profile.degree],
    ["研究方向", Array.isArray(profile.researchInterests) ? profile.researchInterests.join("、") : profile.researchInterests]
  ];
  $("#profile-meta").innerHTML = fields.map(([label, value]) => `<div><dt>${label}</dt><dd>${escapeHtml(valueOr(value))}</dd></div>`).join("");

  const actions = [];
  if (profile.resumePdf) actions.push(`<a class="action-link" href="${escapeHtml(profile.resumePdf)}" target="_blank" rel="noopener">PDF 简历 ↗</a>`);
  (profile.contacts || []).forEach(contact => {
    if (contact.url) actions.push(`<a class="action-link" href="${escapeHtml(contact.url)}" target="_blank" rel="noopener">${escapeHtml(contact.label)} ↗</a>`);
  });
  $("#profile-actions").innerHTML = actions.length ? actions.join("") : '<span class="action-link" aria-disabled="true">联系方式待补充</span>';
}

function renderResearch() {
  const papers = state.research.papers || [];
  const projects = state.research.projects || [];
  renderStats($("#research-stats"), [
    [papers.filter(item => ["published", "accepted"].includes(item.status)).length, "已发表及已录用论文"],
    [papers.filter(item => ["first", "co-first"].includes(item.authorRole)).length, "第一作者及共同一作"],
    [papers.filter(item => item.status === "under-review").length, "正在投稿论文"],
    [projects.length, "参与科研课题"]
  ]);
  $("#research-count").textContent = `${papers.length} 项成果`;
  const grid = $("#research-grid");
  if (!papers.length) return renderEmpty(grid, "科研成果占位区", "尚未录入真实论文。后续将从 research.json 自动生成错落卡片、统计与详情。");
  grid.innerHTML = papers.map(renderPaperCard).join("");
  $$(".work-card", grid).forEach(card => card.addEventListener("click", () => openPaper(card.dataset.id)));
}

function renderPaperCard(paper) {
  const ranking = paper.rankings?.[state.ranking] || "待补充";
  const media = paper.coverImage ? `<img src="${escapeHtml(paper.coverImage)}" alt="${escapeHtml(paper.coverAlt || paper.title)}" loading="lazy">` : "";
  return `<button class="work-card" type="button" data-id="${escapeHtml(paper.id)}" aria-label="查看论文：${escapeHtml(paper.title)}">
    <span class="card-media">${media}<span class="card-overlay">${escapeHtml(valueOr(paper.authorRoleLabel))}</span></span>
    <span class="card-body"><span class="card-kicker"><span>${escapeHtml(valueOr(paper.journal))}</span><span>${escapeHtml(ranking)}</span></span>
    <h3>${escapeHtml(valueOr(paper.title))}</h3><p>${escapeHtml(valueOr(paper.contribution, "个人贡献待补充"))}</p></span>
  </button>`;
}

function renderDesign() {
  const items = state.design.projects || [];
  const labels = state.design.statDefinitions || ["项目数量", "角色类型", "合作项目"];
  renderStats($("#design-stats"), labels.map(label => ["—", label]));
  if (!items.length) renderEmpty($("#design-grid"), "设计实践占位区", "分类与统计口径将在用户提供真实项目后确定。");
}

function renderAwards() {
  const items = (state.awards.awards || []).filter(item => item.public !== false);
  renderStats($("#awards-stats"), [
    [items.filter(item => item.level === "national").length, "国家级奖项"],
    [items.filter(item => item.level === "provincial").length, "省级奖项"],
    [items.filter(item => item.level === "other").length, "其他荣誉"]
  ]);
  if (!items.length) renderEmpty($("#awards-grid"), "荣誉与其他占位区", "尚未录入已确认公开的真实奖项或荣誉，后续将依据 awards.json 自动统计。");
}

function renderStats(container, stats) {
  container.innerHTML = stats.map(([value, label]) => `<div class="stat"><strong class="stat-value">${escapeHtml(String(value))}</strong><span class="stat-label">${escapeHtml(label)}</span></div>`).join("");
}

function renderEmpty(container, title, text) {
  container.innerHTML = `<div class="empty-state"><div><strong>${escapeHtml(title)}</strong><p>${escapeHtml(text)}</p></div></div>`;
}

function openPaper(id) {
  const paper = (state.research.papers || []).find(item => item.id === id);
  if (!paper) return;
  state.lastFocus = document.activeElement;
  const ranks = paper.rankings || {};
  $("#detail-content").innerHTML = `${paper.detailImage || paper.coverImage ? `<img class="detail-image" src="${escapeHtml(paper.detailImage || paper.coverImage)}" alt="${escapeHtml(paper.coverAlt || paper.title)}">` : ""}
    <p class="eyebrow">${escapeHtml(valueOr(paper.journal))}</p><h2 id="detail-title">${escapeHtml(valueOr(paper.title))}</h2>
    <div class="detail-list">${detailRow("作者排序", paper.authors)}${detailRow("作者身份", paper.authorRoleLabel)}
      ${detailRow("JCR 分区", ranks.jcr)}${detailRow("中科院分区", ranks.cas)}${detailRow("新锐学术", ranks.emerging)}
      ${detailRow("个人贡献", paper.contribution)}${detailRow("DOI", paper.doi)}${detailRow("相关材料", paper.materialsLabel)}</div>`;
  $("#drawer-backdrop").hidden = false;
  $("#detail-drawer").classList.add("is-open");
  $("#detail-drawer").setAttribute("aria-hidden", "false");
  document.body.classList.add("drawer-open");
  $("#drawer-close").focus();
}

function detailRow(label, value) {
  return `<div class="detail-row"><span>${escapeHtml(label)}</span><span>${escapeHtml(valueOr(value))}</span></div>`;
}

function closeDrawer() {
  $("#detail-drawer").classList.remove("is-open");
  $("#detail-drawer").setAttribute("aria-hidden", "true");
  $("#drawer-backdrop").hidden = true;
  document.body.classList.remove("drawer-open");
  state.lastFocus?.focus();
}

function switchPage(page, updateHash = true) {
  state.activePage = page;
  $$("[data-page-panel]").forEach(panel => {
    const active = panel.dataset.pagePanel === page;
    panel.hidden = !active;
    panel.classList.toggle("is-active", active);
  });
  $$("[data-page]").forEach(button => {
    const active = button.dataset.page === page;
    button.classList.toggle("is-active", active);
    active ? button.setAttribute("aria-current", "page") : button.removeAttribute("aria-current");
  });
  if (updateHash) history.replaceState(null, "", `#${page}`);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
}

let toastTimer;
function showToast(message) {
  const toast = $("#status-toast");
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 5000);
}

$$('[data-page]').forEach(button => button.addEventListener("click", () => switchPage(button.dataset.page)));
$$('[data-ranking]').forEach(button => button.addEventListener("click", () => {
  state.ranking = button.dataset.ranking;
  $$('[data-ranking]').forEach(item => {
    const active = item === button;
    item.classList.toggle("is-active", active);
    item.setAttribute("aria-pressed", String(active));
  });
  if (state.research) renderResearch();
}));
$("#drawer-close").addEventListener("click", closeDrawer);
$("#drawer-backdrop").addEventListener("click", closeDrawer);
document.addEventListener("keydown", event => { if (event.key === "Escape") closeDrawer(); });

const initialPage = location.hash.slice(1);
if (["research", "design", "awards"].includes(initialPage)) switchPage(initialPage, false);
loadData();
