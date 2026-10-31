const ASSET_VERSION = "20261031-7";
const DATA_PATHS = {
  profile: `data/profile.json?v=${ASSET_VERSION}`,
  research: `data/research.json?v=${ASSET_VERSION}`,
  design: `data/design.json?v=${ASSET_VERSION}`,
  awards: `data/awards.json?v=${ASSET_VERSION}`
};

const state = { profile: null, research: null, design: null, awards: null, activePage: "research", lastFocus: null, lastStatFocus: null };
let drawerCloseTimer;
let statsCloseTimer;
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const valueOr = (value, fallback = "待补充") => value && String(value).trim() ? value : fallback;
const versionedAsset = path => path ? `${path}${path.includes("?") ? "&" : "?"}v=${ASSET_VERSION}` : path;

async function loadData() {
  try {
    const entries = await Promise.all(Object.entries(DATA_PATHS).map(async ([key, path]) => {
      return [key, await fetchJson(path)];
    }));
    Object.assign(state, Object.fromEntries(entries));
    renderAll();
  } catch (error) {
    console.error("数据加载失败", error);
    showToast("数据加载失败，请通过本地 HTTP 服务器打开网站。");
    renderEmpty($("#research-grid"), "数据暂时无法读取", "请检查 JSON 文件路径，或使用本地静态服务器预览。");
  }
}

async function fetchJson(path) {
  if (window.fetch) {
    try {
      const response = await fetch(path, { cache: "no-store" });
      if (response.ok) return response.json();
    } catch (error) {
      console.warn(`Fetch 读取失败，尝试兼容模式：${path}`, error);
    }
  }
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("GET", `${path}&t=${Date.now()}`, true);
    request.onload = () => {
      if (request.status < 200 || request.status >= 300) return reject(new Error(`${path}: HTTP ${request.status}`));
      try { resolve(JSON.parse(request.responseText)); }
      catch (error) { reject(error); }
    };
    request.onerror = () => reject(new Error(`${path}: 网络请求失败`));
    request.send();
  });
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
  const bio = $("#profile-bio");
  bio.textContent = profile.bio || "";
  bio.hidden = !profile.bio;
  const photo = $("#profile-photo");
  photo.innerHTML = profile.photo
    ? `<img src="${escapeHtml(versionedAsset(profile.photo))}" alt="${escapeHtml(profile.name || "个人照片")}" decoding="async">`
    : "<span>PHOTO</span>";
  photo.setAttribute("aria-hidden", profile.photo ? "false" : "true");

  const actions = [];
  if (profile.resumePdf) actions.push(`<a class="action-link" href="${escapeHtml(profile.resumePdf)}" target="_blank" rel="noopener">PDF 简历 ↗</a>`);
  (profile.contacts || []).forEach(contact => {
    if (contact.url) actions.push(`<a class="action-link" href="${escapeHtml(contact.url)}">${escapeHtml(contact.label)}</a>`);
  });
  $("#profile-actions").innerHTML = actions.length ? actions.join("") : '<span class="action-link" aria-disabled="true">联系方式待补充</span>';
}

function renderResearch() {
  const papers = state.research.papers || [];
  const projects = state.research.projects || [];
  renderStats($("#research-stats"), [
    [papers.filter(item => ["published", "accepted"].includes(item.status)).length, "发表/已录用论文", "published"],
    [papers.filter(item => item.status === "under-review").length, "正在投稿论文", "under-review"],
    [projects.length, "参与科研课题", "projects"]
  ], true);
  $$(".stat-button", $("#research-stats")).forEach(button => button.addEventListener("click", () => openStats(button.dataset.stat)));
  const grid = $("#research-grid");
  if (!papers.length) return renderEmpty(grid, "科研成果占位区", "尚未录入真实论文。后续将从 research.json 自动生成错落卡片、统计与详情。");
  grid.innerHTML = papers.map(renderPaperCard).join("");
  $$(".card-open", grid).forEach(card => card.addEventListener("click", () => openPaper(card.dataset.id)));
}

function renderPaperCard(paper) {
  const jcr = valueOr(paper.rankings?.jcr).replace(/\s+/g, "-");
  const cas = valueOr(paper.rankings?.cas).replace(/^中科院/, "中科院-");
  const hasImage = Boolean(paper.coverImage);
  const media = hasImage ? `<span class="card-media"><img src="${escapeHtml(versionedAsset(paper.coverImage))}" alt="${escapeHtml(paper.coverAlt || paper.title)}" loading="lazy" decoding="async"><span class="card-overlay">${escapeHtml(valueOr(paper.authorRoleLabel))}</span></span>` : "";
  const kickerLabel = hasImage
    ? `<span>${escapeHtml(valueOr(paper.journal))}</span>`
    : `<strong class="card-author-position">${escapeHtml(valueOr(paper.authorPosition, paper.authorRoleLabel))}</strong>`;
  const contribution = paper.contribution ? `<p><strong>个人贡献：</strong>${escapeHtml(paper.contribution)}</p>` : "";
  return `<article class="work-card${hasImage ? "" : " work-card-no-image"}" data-id="${escapeHtml(paper.id)}">
    <div class="card-kicker">${kickerLabel}<span class="card-rankings"><span>${escapeHtml(jcr)}</span><span>${escapeHtml(cas)}</span></span></div>
    <button class="card-open" type="button" data-id="${escapeHtml(paper.id)}" aria-label="查看论文：${escapeHtml(paper.title)}">
      ${media}<span class="card-body"><h3>${escapeHtml(valueOr(paper.title))}</h3>${contribution}</span>
    </button>
  </article>`;
}

function renderDesign() {
  const items = state.design.projects || [];
  const labels = state.design.statDefinitions || ["项目数量", "角色类型", "合作项目"];
  renderStats($("#design-stats"), labels.map(label => ["—", label]));
  if (!items.length) renderEmpty($("#design-grid"), "设计实践占位区", "分类与统计口径将在用户提供真实项目后确定。");
}

function renderAwards() {
  const items = (state.awards.awards || [])
    .filter(item => item.public !== false)
    .sort((a, b) => String(b.date || b.year || "").localeCompare(String(a.date || a.year || "")));
  const levels = [
    { key: "national", label: "国家级", statLabel: "国家级奖项" },
    { key: "provincial", label: "省级", statLabel: "省级奖项" },
    { key: "other", label: "其他荣誉", statLabel: "其他荣誉" }
  ];
  renderStats($("#awards-stats"), levels.map(level => [items.filter(item => item.level === level.key).length, level.statLabel]));
  const grid = $("#awards-grid");
  if (!items.length) return renderEmpty(grid, "荣誉与其他占位区", "尚未录入已确认公开的真实奖项或荣誉，后续将依据 awards.json 自动统计。");
  grid.innerHTML = levels.map(level => {
    const groupedItems = items.filter(item => item.level === level.key);
    return `<section class="award-group" aria-labelledby="award-group-${level.key}">
      <div class="award-group-header"><h3 id="award-group-${level.key}">${level.label}</h3><span>${groupedItems.length} 项</span></div>
      <div class="award-list">${groupedItems.map(renderAwardCard).join("")}</div>
    </section>`;
  }).join("");
}

function renderAwardCard(item) {
  return `<article class="award-card">
    <div class="award-meta"><span>${escapeHtml(valueOr(item.date || item.year))}</span><span>${escapeHtml(valueOr(item.summary))}</span></div>
    <h4>${escapeHtml(valueOr(item.title))}</h4>
    <p>${escapeHtml(valueOr(item.organization))}</p>
  </article>`;
}

function renderStats(container, stats, interactive = false) {
  container.innerHTML = stats.map(([value, label, key]) => interactive
    ? `<button class="stat stat-button" type="button" data-stat="${escapeHtml(key)}" aria-label="查看${escapeHtml(label)}详情"><strong class="stat-value">${escapeHtml(String(value))}</strong><span class="stat-label">${escapeHtml(label)}</span><span class="stat-hint" aria-hidden="true">↗</span></button>`
    : `<div class="stat"><strong class="stat-value">${escapeHtml(String(value))}</strong><span class="stat-label">${escapeHtml(label)}</span></div>`).join("");
}

function openStats(type) {
  const papers = state.research.papers || [];
  const projects = state.research.projects || [];
  const definitions = {
    published: { title: "发表/已录用论文", items: papers.filter(item => ["published", "accepted"].includes(item.status)), kind: "paper", empty: "暂无已发表或已录用论文。" },
    "under-review": { title: "正在投稿论文", items: papers.filter(item => item.status === "under-review"), kind: "paper", empty: "暂无正在投稿论文。" },
    projects: { title: "参与科研课题", items: projects, kind: "project", empty: "暂无科研课题。" }
  };
  const definition = definitions[type];
  if (!definition) return;
  clearTimeout(statsCloseTimer);
  state.lastStatFocus = document.activeElement;
  $("#stats-popover-label").textContent = "科研成果统计";
  $("#stats-popover-title").textContent = definition.title;
  $("#stats-popover-content").innerHTML = definition.items.length
    ? definition.items.map(item => definition.kind === "paper"
      ? `<article class="stats-item"><h4>${escapeHtml(valueOr(item.title))}</h4><p><strong class="stats-author-position">${escapeHtml(valueOr(item.authorPosition, item.authorRoleLabel))}</strong><span>${escapeHtml(valueOr(item.journal))} · ${escapeHtml(valueOr(item.rankings?.jcr))} · ${escapeHtml(valueOr(item.rankings?.cas))}</span></p></article>`
      : `<article class="stats-item"><h4>${escapeHtml(valueOr(item.title || item.name))}</h4><p>${escapeHtml(valueOr(item.role || item.status, "基本信息待补充"))}</p></article>`).join("")
    : `<p class="stats-empty">${escapeHtml(definition.empty)}</p>`;
  $("#stats-backdrop").hidden = false;
  $("#stats-popover").classList.add("is-open");
  $("#stats-popover").setAttribute("aria-hidden", "false");
  document.body.classList.add("stats-open");
  $("#stats-close").focus();
}

function closeStats() {
  if ($("#stats-popover").getAttribute("aria-hidden") === "true") return;
  $("#stats-popover").classList.remove("is-open");
  $("#stats-popover").setAttribute("aria-hidden", "true");
  document.body.classList.remove("stats-open");
  const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 220;
  clearTimeout(statsCloseTimer);
  statsCloseTimer = setTimeout(() => {
    if (!$("#stats-popover").classList.contains("is-open")) $("#stats-backdrop").hidden = true;
  }, delay);
  state.lastStatFocus?.focus();
}

function renderEmpty(container, title, text) {
  container.innerHTML = `<div class="empty-state"><div><strong>${escapeHtml(title)}</strong><p>${escapeHtml(text)}</p></div></div>`;
}

function openPaper(id) {
  const paper = (state.research.papers || []).find(item => item.id === id);
  if (!paper) return;
  clearTimeout(drawerCloseTimer);
  state.lastFocus = document.activeElement;
  const gallery = [
    ...(paper.detailImage || paper.coverImage ? [{ src: paper.detailImage || paper.coverImage, alt: paper.detailAlt || paper.coverAlt || paper.title }] : []),
    ...(paper.detailImages || [])
  ];
  const galleryMarkup = gallery.length ? `<div class="detail-gallery">${gallery.map(image => `<img class="detail-image" src="${escapeHtml(versionedAsset(image.src))}" alt="${escapeHtml(image.alt || paper.title)}" decoding="async">`).join("")}</div>` : "";
  const detailRows = [
    paper.statusLabel ? detailRow("当前状态", paper.statusLabel) : "",
    paper.publicationDate ? detailRow("发表日期", paper.publicationDate) : "",
    paper.contributionDetail || paper.contribution ? detailRow("个人贡献", paper.contributionDetail || paper.contribution) : "",
    paper.issn ? detailRow("ISSN", paper.issn) : "",
    paper.doi ? detailLinkRow("DOI", paper.doi, paper.articleUrl) : "",
    paper.articleUrl ? detailLinkRow("论文原文", "访问出版社开放获取页面 ↗", paper.articleUrl) : "",
    paper.pdfUrl ? detailLinkRow("PDF", "预览或下载 PDF ↗", paper.pdfUrl) : (paper.articleUrl ? detailRow("PDF", "暂未上传；可通过出版社原文入口访问") : "")
  ].join("");
  $("#detail-content").innerHTML = `<p class="eyebrow">${escapeHtml(valueOr(paper.journal))}</p><h2 id="detail-title">${escapeHtml(valueOr(paper.title))}</h2>
    ${galleryMarkup}<div class="detail-list">${detailRows}</div>`;
  $("#drawer-backdrop").hidden = false;
  $("#detail-drawer").classList.add("is-open");
  $("#detail-drawer").setAttribute("aria-hidden", "false");
  document.body.classList.add("drawer-open");
  $("#drawer-close").focus();
}

function detailRow(label, value) {
  return `<div class="detail-row"><span>${escapeHtml(label)}</span><span>${escapeHtml(valueOr(value))}</span></div>`;
}

function detailLinkRow(label, text, url) {
  if (!url) return detailRow(label, text);
  return `<div class="detail-row"><span>${escapeHtml(label)}</span><span><a class="detail-link" href="${escapeHtml(url)}" target="_blank" rel="noopener">${escapeHtml(valueOr(text))}</a></span></div>`;
}

function closeDrawer() {
  if ($("#detail-drawer").getAttribute("aria-hidden") === "true") return;
  $("#detail-drawer").classList.remove("is-open");
  $("#detail-drawer").setAttribute("aria-hidden", "true");
  document.body.classList.remove("drawer-open");
  const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 320;
  clearTimeout(drawerCloseTimer);
  drawerCloseTimer = setTimeout(() => {
    if (!$("#detail-drawer").classList.contains("is-open")) $("#drawer-backdrop").hidden = true;
  }, delay);
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
$("#drawer-close").addEventListener("click", closeDrawer);
$("#drawer-backdrop").addEventListener("click", closeDrawer);
$("#stats-close").addEventListener("click", closeStats);
$("#stats-backdrop").addEventListener("click", closeStats);
document.addEventListener("keydown", event => {
  if (event.key !== "Escape") return;
  closeStats();
  closeDrawer();
});

const initialPage = location.hash.slice(1);
if (["research", "design", "awards"].includes(initialPage)) switchPage(initialPage, false);
loadData();
