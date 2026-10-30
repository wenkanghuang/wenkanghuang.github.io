# 个人学术主页

这是部署在 [wenkanghuang.github.io](https://wenkanghuang.github.io) 的纯静态个人学术主页。网站以 JSON 管理内容，以 HTML、CSS 和原生 JavaScript 渲染，适配电脑与手机。

## 项目结构

```text
.
├── AGENTS.md                 # 长期协作规则
├── README.md                 # 项目说明
├── index.html                # 页面语义结构
├── style.css                 # 响应式视觉样式
├── script.js                 # 数据加载、统计与交互
├── data/                     # 结构化公开内容
├── assets/                   # 经确认可公开的网页素材
└── docs/                     # 维护、命名与更新记录
```

## 本地预览

JSON 通过 `fetch` 加载，因此不要直接双击 `index.html`。在仓库根目录运行 `python -m http.server 8000`，然后访问 `http://localhost:8000/`。

## 内容更新

1. 在对应 JSON 中新增条目并分配唯一 ID。
2. 将用户已确认公开的优化后素材放入相应 `assets/` 子目录。
3. 在 JSON 中填写相对路径，例如 `assets/papers/paper-001-cover.webp`。
4. 本地预览并检查导航、统计、详情与手机布局。
5. 更新 `docs/changelog.md` 后再提交。

字段说明见 [docs/data-schema.md](docs/data-schema.md)，素材规范见 [docs/asset-management.md](docs/asset-management.md)。

## 发布方式

GitHub Pages 当前约定从 `main` 分支仓库根目录发布。正常更新只需将审核通过的静态文件提交并推送到 `main`；不要改变 Pages 配置或网站地址。

## 当前状态

V1.0 初始框架已建立，所有个人资料及成果数据均为空，等待用户审核后逐步填充真实内容。
