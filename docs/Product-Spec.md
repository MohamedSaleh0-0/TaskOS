# Tasks-OS // Product Specifications & Roadmap

## 1. Architectural Architecture & Design Principles
This document serves as the single source of truth for the technical design, architectural constraints, and backlog tracking of the Tasks-OS plugin.

### Core Architecture
- Layered Clean Architecture: Strict decoupling between the Data Layer (StateManager), Event Dynamics (Rename & Ingestion), and the Presentation Layer.
- State-First Local Engine: All runtime operations read and write to an in-memory RAM cache for O(1) velocity. Physical disk I/O to the state JSON file is scheduled upon mutations.
- Single Source of Truth: Directional dependency checking to ensure single-point data integrity without out-of-sync risks.

### Task Scheduling Paradigm
- deadline: The hard external target delivery date (e.g., project submission). Used strictly for warning indicators and strict chronological boundaries.
- duedate: The internal execution date chosen manually by the user to focus work execution on a specific day.

---

## 2. Component Specifications (MVP Scope)

### Journal Capturer Component
- Inline text input container embedded directly inside the central dashboard stream feed.
- Passive parsing logic: Appends inputs straight to the current daily note file under the specified heading without altering workspace leaf focus.
- Smart Tag Routing: If the text includes a specific tag, the engine dynamically routes the text under that corresponding subheading in the journal note; otherwise, it falls back to the default journal heading.

### Habits Tracker Component
- Binary Habits: Simple toggle button to switch state seamlessly between done and todo.
- Qualitative/Quantitative Habits: Text logging field coupled with incremental plus and minus buttons to adjust numeric metrics dynamically.

### Performance Analytics Pane
- Minimalist text-based output fields tracking numerical calculations directly from the cache.
- Avoids graphical rendering libraries or heavy strings for progress representation in the initial deployment phase to maintain optimization.

---

## 3. Product Backlog & Feature Checklists

### MVP Features (Current Scope)
- [ ] Implement StateManager with RAM cache and serialized JSON file storage
- [ ] Integrate non-recursive auto-release engine for hanging tasks upon dependency resolution
- [ ] Create RenameListener to intercept file changes and prevent broken paths inside storage
- [ ] Build LineParser to detect standard task structures within markdown files
- [ ] Setup Scroll-Spy Single-Column Navigation Feed for seamless section jumping
- [ ] Build Inline Journal Capturer with rule-based tag routing to subheadings
- [ ] Construct Qualitative Habits node with custom plus, minus, and binary toggle interactions
- [ ] Enforce strict property separation between manual duedate and hard deadline targets
- [ ] Render clean numeric text analytics for core completion metrics

### Post-MVP Features (Future Sprints)
- [ ] Auto-pulling algorithm to inject tasks into Today focus if the external deadline is within 48 hours
- [ ] Interactive UI canvas charts and visual progress graphs instead of text-based summary metrics
- [ ] Dedicated weekly planning overview block to buffer upcoming operations
- [ ] Advanced dimensional configurations for habits logging data
- [ ] Decoupled financial ledger management sub-plugin integration