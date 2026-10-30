# JSON 数据字段说明

四个 JSON 均含 `schemaVersion`。文件内 `fieldTemplate` 只说明字段，不会渲染为真实成果。

## profile.json

- `profile.name` / `nameEn`：中英文姓名。
- `photo`、`resumePdf`：相对仓库根目录的公开文件路径。
- `researchInterests`：研究方向数组。
- `contacts`：对象数组，建议字段为 `label` 和 `url`。

## research.json

- `papers`：论文数组；`status` 和 `authorRole` 用于自动统计。
- `rankings`：同一论文的 JCR、中科院、新锐学术分区。
- `projects`：科研课题数组，用于参与课题统计。

## design.json

- `projects`：设计实践数组。
- `statDefinitions`：第一阶段暂定的统计标签，确认口径后再实现自动计算。

## awards.json

- `awards`：荣誉数组。
- `level`：`national`、`provincial` 或 `other`，用于自动统计。
- `public`：是否已确认可公开；正式录入时仅展示 `true` 的内容。
