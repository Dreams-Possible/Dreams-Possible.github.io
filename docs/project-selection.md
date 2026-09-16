# Mathrix 博客：项目展示与维护方案

> 更新于 2026-09-16。公开署名使用 **Mathrix**，GitHub 账号为 [Dreams-Possible](https://github.com/Dreams-Possible)。

## 展示原则

不再给项目划“首页重点”和“次选”。首页每次从项目数据中**等概率随机抽出四个不同项目**，并提供“换一组”按钮。访客想系统查找时，进入[全部项目页](../projects.html)，按最近代码推送时间或类别浏览，也可以搜索。

页面收录 46 个公开项目仓库；第 47 个公开仓库是本站自身，不作为项目卡片。项目清单的实际维护入口是 [`data/projects.js`](../data/projects.js)。每项有名称、最近代码推送日期、类别和一句经过核实的简介，页面自动生成 GitHub 链接。随机展示不代表项目成熟度或推荐次序。

## 近期项目也要完整呈现

上一版调研错误地报告了 46 个公开仓库，并遗漏了部分近期项目的内容比较。2026-09-16 复查 [GitHub 仓库 API](https://api.github.com/users/Dreams-Possible/repos?per_page=100&type=owner) 时，公开自有仓库总数为 47。最近更新时间按 `pushed_at`，不是可能因元数据变化而更新的 `updated_at`。以下近期项目均已录入站点，与其他项目同样有机会出现在首页。

| 最近推送 | 项目 | 适合继续写的内容 |
| --- | --- | --- |
| 2026-08-24 | [HyperOS3AutoLTPO](https://github.com/Dreams-Possible/HyperOS3AutoLTPO) | 系统刷新策略和实验 DTBO 的分层排查，以及指定小米 13 Ultra 环境的实测结果；明确设备与版本边界。 |
| 2026-08-24 | [Python-Graphical-Application-Framework](https://github.com/Dreams-Possible/Python-Graphical-Application-Framework) | Qt 单向数据流与应用打包；目前以计数器示例说明架构。 |
| 2026-08-23 | [HyperOS3EnableAOD](https://github.com/Dreams-Possible/HyperOS3EnableAOD) | 特定设备的 AOD 方案与适配过程。 |
| 2026-08-16 | [ThinkPad-X390-OpenCore-EFI](https://github.com/Dreams-Possible/ThinkPad-X390-OpenCore-EFI) | 配置适用范围、遇到的设备问题与解决过程。 |
| 2026-08-11 | [ASUS-UX425JA_U4700-Hackintosh](https://github.com/Dreams-Possible/ASUS-UX425JA_U4700-Hackintosh) | ACPI、电池识别、亮度快捷键与睡眠限制的排查记录。 |
| 2026-08-09 | [SpacePlanePerspective](https://github.com/Dreams-Possible/SpacePlanePerspective) | 视点输入、屏幕坐标换算与动态离轴投影；标明原型阶段的限制。 |
| 2026-08-09 | [Typing-Practice-Website](https://github.com/Dreams-Possible/Typing-Practice-Website) | 原始版与模块化重构版的对照，以及实际训练体验。 |
| 2026-08-02 | [Project-Harness](https://github.com/Dreams-Possible/Project-Harness) | 可复用协作规则和任务流程；避免误称自动运行的 Agent 平台。 |

## 内容分类

站点目前采用五类：**嵌入式与控制、系统与设备、Web 与桌面、机器人与数据、工程工具**。类别只帮助查找，不表达高低。所有项目均在[项目数据文件](../data/projects.js)中逐条列出；新增项目时以仓库 README 和代码核实描述，不按 star 数决定是否收录。实验原型、学习记录、仅适配特定设备的方案，都要如实说明边界。

## 新项目如何维护

仓库根目录的 [`AGENTS.md`](../AGENTS.md) 会引导 AI 读取本地 [`mathrix-blog-maintenance` 指令](../skills/mathrix-blog-maintenance/SKILL.md)。维护流程是：对比 GitHub 公开仓库 → 阅读新增项目 → 更新 `data/projects.js` → 运行 `python3 scripts/check_projects.py` → 本地预览首页与项目页。网站保持无构建的静态 HTML/CSS/JavaScript，适用于现有 GitHub Pages 与 `mathrix.eu.org` 域名。
