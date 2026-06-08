# Tasks-OS // Product Specifications & Roadmap

## Document Control & Version History

| Version | Date | Author | Description | Status |
| --- | --- | --- | --- | --- |
| v1.0.0 | 2026-06-08 | Mohamed Saleh | Initial architectural schema definition & wireframe design. | Superseded |
| v1.1.0 | 2026-06-08 | Mohamed Saleh | MVP Realignment: Integrated manual setting tab abstractions, physical atomic file I/O operations, dual-input habit tracking nodes, and monolithic esbuild compilation architecture. | **Active / Approved** |

---

## 1. Architectural Architecture & Design Principles

### Core Architecture

* **Layered Clean Architecture:** Strict decoupling between the Data Layer (`StateManager`), Event Dynamics (`RenameListener`), and the Presentation Layer (`DashboardView`, `TaskEditModal`).
* **State-First Local Engine:** All runtime operations read and write to an in-memory RAM cache (`TasksPluginState`) for $O(1)$ velocity. Physical disk I/O to the state JSON file (`data.json`) is processed upon mutations.
* **Single Source of Truth:** Directional dependency tracking to ensure single-point data integrity without out-of-sync risks.
* **Monolithic Bundling Strategy:** Uses `esbuild` to compile all source modules into a single, self-contained `main.js` asset, bypassing relative path evaluation constraints inside Electron's application framework.

### Task Scheduling Paradigm

* **deadline:** The hard external target delivery date (e.g., project submission). Used strictly for warning indicators and strict chronological boundaries.
* **duedate:** The internal execution date/time chosen manually by the user to focus work execution on a specific day.

---

## 2. Component Specifications (MVP Scope)

### Settings Subsystem (Manual Configuration)

* Exposes user-facing configuration abstractions via a custom Obsidian setting sheet (`TasksOSSettingTab`).
* Removes hardcoded variables by providing interactive inputs for specifying target daily notes vault paths, heading level markers (`#`, `##`, `###`), and fallback capturing headings.

### Journal Capturer Component

* Inline text input container embedded directly inside the central dashboard stream feed.
* **Live File I/O Engine:** Swapped mock alert banners with authentic atomic string operations. Utilizes `this.app.vault.read()` and `this.app.vault.modify()` to append data silenty.
* **Smart Tag Routing:** Evaluates raw text buffers for explicit hash anchors (e.g., `#مشاكل` or `#أمنيات`). Automatically splits file strings and splices bullets right beneath the matching configured heading sizes without shifting active editor workspace focus.

### Habits Tracker Component

* **Binary Habits:** Simple toggle button to switch state seamlessly between done and todo.
* **Qualitative/Quantitative Habits:** Dual-input structural node. Features a manual text input box allowing immediate direct key entry, flanked by explicit mathematical increment (`+`) and decrement (`-`) execution buttons.

### Task Configuration Modal Workspace

* Dedicated property management dialog panel (`TaskEditModal`) triggered on element row selections.
* Maps internal settings directly back to the `StateManager` to modify execution criteria, shift priorities, adjust text values, or explicitly flag hard target deadlines.

### Performance Analytics Pane

* Minimalist text-based output fields tracking numerical calculations directly from the cache.
* Avoids graphical rendering libraries or heavy strings for progress representation in the initial deployment phase to maintain optimization.

---

## 3. Product Backlog & Feature Checklists

### MVP Features (Current Scope)

* [x] Implement StateManager with RAM cache and serialized JSON file storage
* [x] Create RenameListener to intercept file changes and prevent broken paths inside storage
* [x] Build LineParser to detect standard task structures within markdown files
* [x] Setup Scroll-Spy Single-Column Navigation Feed for seamless section jumping
* [x] Build Inline Journal Capturer with rule-based tag routing to subheadings
* [x] Establish authentic, atomic Local File I/O system processing inside target vault notes
* [x] Construct Qualitative Habits node with custom plus, minus, text inputs, and binary toggle interactions
* [x] Implement user-facing native Obsidian Setting Tab for manual runtime configurations
* [x] Build multi-property TaskEditModal configuration workspace sheet
* [x] Enforce strict property separation between manual duedate and hard deadline targets
* [x] Transition build pipelines to an optimized single-file packaging matrix using esbuild
* [x] Render clean numeric text analytics for core completion metrics
* [ ] Integrate non-recursive auto-release engine for hanging tasks upon dependency resolution

### Post-MVP Features (Future Sprints)

* [ ] Auto-pulling algorithm to inject tasks into Today focus if the external deadline is within 48 hours
* [ ] Automated internal file scraper to aggregate unindexed tasks across all raw markdown vault files
* [ ] Interactive UI canvas charts and visual progress graphs instead of text-based summary metrics
* [ ] Dedicated weekly planning overview block to buffer upcoming operations
* [ ] Advanced dimensional configurations for habits logging data
* [ ] Decoupled financial ledger management sub-plugin integration