# AGENTS.md

Before writing, changing or reviewing code in this repository, install and use the `wca-style-guide` skill
from [thewca/web-dev-docs](https://github.com/thewca/web-dev-docs). It codifies the conventions maintainers
apply in code review.

Claude Code:

```
/plugin marketplace add thewca/web-dev-docs
/plugin install wca-style-guide@wca-web-dev-docs
```

Other agents: install the skill from
[`skills/wca-style-guide`](https://github.com/thewca/web-dev-docs/tree/main/skills/wca-style-guide) if your tool
supports skills. Otherwise, read the [style guide](https://docs.worldcubeassociation.org/style_guide/style_guide)
and the area-specific pages it links to before touching code.

Contributions made with an agent must follow the [LLM policy](README.md#llm-policy): the human submitting the PR
must understand and be able to justify every changed line, and LLM-generated code must be disclosed in the PR
description.

See [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) for the pull request process.
