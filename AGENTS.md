# AGENTS.md - TailTools Autonomous Agent Guidelines

Welcome to **TailTools**! This document provides operational rules, architectural guidelines, and automation workflows for all AI coding assistants (Antigravity, Claude Code, Cursor, Codex, etc.).

---

## 1. Project Mission & Architecture

**TailTools** is an npm package library designed to provide lightweight, elegant, and reactive UI plugins tailored for:
1. **Tailwind CSS v4.3+** (using native CSS animations, `tailwind-animations`, and utility classes).
2. **Laravel** (native Blade components, declarative data-attributes, and Vite asset bundling).

### Technology Baseline
- **Runtime:** Native JavaScript (ES2022+), zero unnecessary bloat.
- **Type Safety:** Full TypeScript declarations (`.d.ts`) for every plugin and the core package.
- **Styling:** Modern CSS / Tailwind CSS v4 (`@import "tailwindcss";`, `@import "tailwind-animations";`).
- **Build & Dev:** Vite + `@tailwindcss/vite`.

---

## 2. Mandatory Rules for Plugin Creation

Whenever the user asks for a plugin `X` (e.g., *Tooltip*, *Modal*, *Accordion*, *Dropdown*, *Toast*):

### Rule 1: Standardized Naming
- The plugin MUST be named **`CGE` + `PascalCase(X)`** (e.g., `CGETooltip`).
- The directory MUST be located at `plugins/CGE<X>/`.
- Inside the directory, files MUST be:
  - `CGE<X>.js` - Core native JavaScript class.
  - `CGE<X>.d.ts` - TypeScript type definitions.
  - `style.css` - Tailwind v4 compatible styles.
  - `index.js` - Barrel export.

### Rule 2: Planning & Progress Tracking
- **Plan File:** Create `ai-todos/plans/CGE<X>-plan.md` before writing code.
- **Checklist File:** Create `ai-todos/todo-cheks/CGE<X>-checklist.md` tracking all creation phases.

### Rule 3: End-of-Creation Testing (Mandatory)
- Never declare a plugin finished without testing.
- Add an interactive showcase and test section into [index.html](file:///f:/GITHUB/TailTools/index.html).
- Verify both programmatic instantiation (`new CGE<X>()`) and declarative data attributes (`data-cge-*`).

### Rule 4: Dedicated Documentation
- Create a complete documentation folder at `docs/CGE<X>/`:
  - `README.md` - Overview and quick start.
  - `usage.md` - Complete options, methods, and event hooks.
  - `examples.md` - Practical code samples for HTML/Tailwind and Laravel Blade.
  - `api.md` - Full TypeScript interfaces and event payload types.
- **Maintenance Guarantee:** Any time a plugin is updated, its `docs/CGE<X>/` files MUST be updated immediately.

### Rule 5: Per-Plugin AI Skills Generation
- After creating a plugin, generate an AI skill at:
  `.agents/skills/cge-<x>/SKILL.md`
- Must adhere to the open agent skills format (YAML frontmatter with `name` and `description`).
- Works universally across Antigravity, Claude Code, Codex, and Cursor.

---

## 3. Directory Layout Reference

```text
TailTools/
├── .agents/
│   ├── rules/                 # Architectural & workflow rules
│   └── skills/                # Agent Skills (SKILL.md)
│       └── cge-plugin-creator/
├── ai-todos/
│   ├── plans/                 # Architectural plans for each plugin
│   └── todo-cheks/            # Phase checklists
├── docs/                      # General & per-plugin documentation
│   ├── installing.md          # Installation guide (npm, Laravel, CDN)
│   ├── versioning.md          # SemVer & release process
│   ├── developing.md          # Architecture & developer guide
│   └── CGE<X>/                # Per-plugin docs (README, usage, examples, api)
├── plugins/                   # All CGE plugins live here
│   └── CGE<X>/
├── src/                       # Library core & Vite development entry
│   ├── style.css
│   └── index.ts
├── index.html                 # Interactive testbed
├── package.json
└── vite.config.ts
```

---

## 4. Universal Prompt Template for Users

To request a new plugin from any AI assistant with guaranteed adherence to these rules, use the following standardized prompt:

```text
Create CGE plugin: [Plugin Name]
Description: [What it does, key features]
Requirements:
- Native JS with full TypeScript (.d.ts) support
- Tailwind CSS v4 styling & animations
- Laravel Blade component markup pattern with data-cge-* attributes
- Full execution of plan, checklist, testing, docs, and AI skill
```
