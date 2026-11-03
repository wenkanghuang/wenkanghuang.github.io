# JSON 数据字段说明

四个 JSON 均含 `schemaVersion`。文件内 `fieldTemplate` 只说明字段，不会渲染为真实成果。

## profile.json

- `profile.name` / `nameEn`：中英文姓名。
- `photo`、`resumePdf`：相对仓库根目录的公开文件路径。
- `researchInterests`：研究方向数组。
- `contacts`：对象数组，建议字段为 `label` 和 `url`。

## research.json

- `papers`：论文数组；`status` 和 `authorRole` 用于自动统计，作者名单使用字符串数组。
- `statusLabel`：未正式发表论文的当前阶段，如“校稿中”“编辑任务中”“同行评审中”；此类条目的 `title` 仅保存“期刊名（当前状态）”。
- `rankings`：同一论文的 JCR、中科院、新锐学术分区。
- `detailImage` / `detailAlt`：详情页主图版路径及可访问性说明；多张相关图片优先预先合并，减少网页请求。
- `detailImages`：需要独立展示时使用的补充图片数组，每项包含 `src` 与可访问性说明 `alt`。
- `projects`：科研课题数组，用于参与课题统计。
- `articleUrl`、`pdfUrl`：出版社原文与站内/公开 PDF 入口；没有 PDF 时保持空字符串。

## design.json

- `projects`：设计实践数组。
- `statDefinitions`：第一阶段暂定的统计标签，确认口径后再实现自动计算。

## awards.json

- `awards`：荣誉数组。
- `level`：`national`、`provincial` 或 `other`，用于自动统计。
- `date`：证书年月；`summary`：奖项等级、作者排序或成果状态的简要说明。
- `public`：是否已确认可公开；正式录入时仅展示 `true` 的内容。
- `certificateImage` 默认留空；只有用户明确要求公开证书图片时才关联文件。

科研成果的 `rankings.classification` 用于记录“普刊”“南核”等不属于 JCR 或中科院分区的期刊分类。

科研课题使用 `PROJECT-000` 形式的唯一 ID；`projectNumber`、`role`、`status`、`funding` 分别记录项目编号、参与排序、当前状态和经费；可选字段 `category`、`level`、`approvalDate`、`startDate`、`plannedEndDate` 记录项目类别、级别及日期。
