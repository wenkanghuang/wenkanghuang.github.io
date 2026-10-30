# 文件与 ID 命名规范

- 仅使用小写英文字母、数字和连字符，不使用空格、中文或特殊字符。
- ID 一经发布保持稳定；标题变化不应导致 ID 变化。
- 三位数字从 `001` 递增；删除条目后不复用旧 ID。
- 同一成果的文件均以对应 ID 开头。

```text
assets/profile/profile-photo.webp
assets/profile/cv-wenkang-huang.pdf
assets/papers/paper-001-cover.webp
assets/papers/paper-001-abstract.webp
assets/projects/project-001-cover.webp
assets/awards/award-001-certificate.webp
```

JSON 条目的 `id` 是主关联键。图片替换时优先保持路径不变；若必须改名，应同时更新 JSON，并检查旧路径是否仍被引用。
