---
name: mathrix-blog-maintenance
description: Maintain Mathrix's GitHub Pages project blog when a new Dreams-Possible repository appears, a project changes, or the user asks to refresh the homepage, project archive, descriptions, or categories. Read this skill before editing project content in this repository.
---

# Maintain the Mathrix project blog

## Source of truth

- Public name: **Mathrix**. GitHub account: `Dreams-Possible`.
- Project content lives in `data/projects.js`; shared interface translations live in `data/i18n.js`. `index.html` and `projects.html` render through `site.js`.
- `CNAME` maps GitHub Pages to `mathrix.eu.org`; preserve it.
- Homepage picks six projects with equal chance on each visit. Do not add ranking, stars, or a `featured` flag. The project page supports timeline, category, and search.
- UI changes must follow `docs/interface-design-system.md`; the current implementation brief is `docs/site-redesign-brief.md`.
- `docs/project-selection.md` records the historical editorial audit. Update it when changing the editorial approach, but the site data is the operational source of truth.

## When a new project appears

1. Run `python3 scripts/check_projects.py` to compare the current public GitHub repositories against `data/projects.js`. If the API is unavailable, inspect the GitHub profile and new repository directly, then state what could not be checked.
2. Open the new repository's README and inspect enough files to describe what it actually does. Do not invent results, performance, compatibility, or maturity. Keep limitations that the author states.
3. Add one object to `window.MATHRIX_PROJECTS` in `data/projects.js`: exact repository `name`, `date` from GitHub `pushed_at` (`YYYY-MM-DD`), one existing `category`, and short, verified `description.zh` and `description.en` text. The file derives the URL from the repository name. Exclude this website's own repository from the public project list.
4. For existing projects with new code pushes, refresh their `date`. Adjust their description only when the project itself changed, not because of a GitHub metadata update. Keep entries ordered from newest to oldest so the file is easy to review.
5. Run `python3 scripts/check_projects.py` again. Verify the project appears in the archive and can appear in the homepage shuffle. Check at mobile width and ensure links resolve.
6. Summarize which projects were added or changed, cite their repository pages, and mention any facts left uncertain.

## Writing and classification

- Use a concrete one-sentence description in both languages: what the project does, with a key technology or context if useful.
- Existing categories: `嵌入式与控制`, `系统与设备`, `Web 与桌面`, `机器人与数据`, `工程工具`. Add a category only if existing ones genuinely cannot describe the project; update site copy and checks at the same time.
- A prototype remains a prototype. A configuration specific to one device must not be called universal. A learning record must not be sold as a finished product.
- Do not use stars or popularity as a proxy for importance. All listed projects are equally eligible for the homepage shuffle.
- Never add placeholder social links, unverified personal information, or generated project screenshots presented as real.

## Quick local preview

From the repository root, run `python3 -m http.server 8000`, then visit `http://localhost:8000/` and `http://localhost:8000/projects.html`. Check shuffle, timeline/category switch, search, keyboard focus, and a narrow viewport.
