# 📅 PM Scheduler

A lightweight, fully client-side project management and Gantt charting tool. Create projects, assign tasks to colleagues with start/end dates, track milestones, and visualize everything on a responsive Gantt chart — all running entirely in your browser with no backend, no accounts, and no data ever leaving your device.

**🔗 Live site: [https://saptakdutta.github.io/pm_scheduler/](https://saptakdutta.github.io/pm_scheduler/)**

---

## Table of Contents

- [Philosophy & Reasoning](#philosophy--reasoning)
- [Features](#features)
- [How It Works](#how-it-works)
- [Architecture](#architecture)
- [Getting Started (Local Development)](#getting-started-local-development)
- [Building the WebAssembly Module](#building-the-webassembly-module)
- [Deployment](#deployment)
- [Offline Support & Caching](#offline-support--caching)
- [Data Model](#data-model)
- [Project Structure](#project-structure)
- [Browser Support](#browser-support)
- [License](#license)

---

## Philosophy & Reasoning

This project is built around a few deliberate principles that shape every technical decision:

### 1. Client-side only — your data stays with you
There is **no server, no database, and no telemetry**. Every computation — validating projects, summing hours, building the Gantt layout — happens locally in your browser. Your schedule data is never transmitted anywhere. You explicitly save your work as a JSON file that lives on your own machine, and load it back when you need it. This makes the tool inherently private and puts you in complete control of your data.

### 2. Zero external dependencies — fully self-contained
The app deliberately avoids CDNs, external stylesheets, analytics scripts, and third-party charting libraries. Everything needed to run is bundled into the project itself: hand-written HTML/CSS/JavaScript and a compiled WebAssembly module. This has real benefits:

- **Auditability** — the entire codebase is small enough to read and understand end to end.
- **Longevity** — no external service can disappear and break the app.
- **Offline capability** — with nothing to fetch from the network at runtime, the app can run completely offline.
- **Security** — a smaller, self-contained surface with no third-party code is easier to trust.

### 3. Rust + WebAssembly for the logic
The core data logic — validation, hour tallying, serialization, and the Gantt-preparation math — is written in **Rust** and compiled to **WebAssembly (Wasm)**. JavaScript handles the UI and orchestration; Rust handles the structured data transformation. This split:

- Keeps the data model **strongly typed and validated** at the boundary.
- Provides **predictable, near-native performance** for compute-oriented work — a foundation that scales well if heavier algorithms are added later.
- Serves as a clean, maintainable separation between "what the app *is*" (Rust data model) and "how it *looks*" (HTML/JS).

### 4. Hand-rolled, dependency-free Gantt rendering
The Gantt chart is drawn as **pure SVG**, generated directly from the Gantt-ready structure produced by Rust. No charting library is involved. This keeps the app self-contained, makes the output fully controllable, and enables clean **SVG export** for sharing or embedding elsewhere.

### 5. Progressive resilience
The app installs a **Service Worker** so that, once loaded, it continues to work even without a network connection. The intent is a tool you can rely on regardless of connectivity — open it once, and it's yours.

---

## Features

- **Project management** — create, edit, and delete projects with assigned hours and a list of collaborating colleagues.
- **Task assignment** — add tasks with a title, an **assignee**, and **start/end dates**. Tasks become bars on the Gantt.
- **Milestones** — add dated milestones that appear as diamond markers on the timeline.
- **Full edit mode** — click **✏️ Edit** on any project to reload it into the form, then rename/reassign/re-date individual tasks and milestones, add or remove entries, and update hours.
- **Interactive Gantt chart** — pure-SVG timeline with:
  - Project span bars, per-project color coding, and milestone diamonds.
  - A **"today" line** for quick orientation.
  - **Switchable grouping**: view the timeline grouped **by Project** or **by Employee**.
  - **Responsive scaling** that fills the available screen width and adapts on window resize / device rotation, with horizontal scrolling for long timelines.
- **SVG export** — download the current Gantt chart as an `.svg` file.
- **Save / Load** — export your entire schedule to a JSON file (with a custom filename) and load it back later.
- **Offline support** — runs from cache after the first visit.

---

## How It Works

1. **Overview tab** — enter projects, tasks (with assignees and dates), and milestones. Everything is validated by the Rust/Wasm layer as you add it.
2. **Gantt tab** — the app hands your project list to a Rust `build_gantt` function, which groups and computes the timeline structure, then renders it as SVG in the browser.
3. **Save your work** — export to JSON whenever you like; nothing is stored remotely.
4. **Come back later** — load your JSON file to pick up where you left off.

---

## Architecture

```
┌──────────────────────────────────────────────┐
│                   Browser                      │
│                                                │
│   ┌────────────┐        ┌──────────────────┐  │
│   │ index.html │        │  Service Worker  │  │
│   │  (UI + JS) │◄──────►│  (offline cache) │  │
│   └─────┬──────┘        └──────────────────┘  │
│         │  calls                               │
│         ▼                                      │
│   ┌────────────────────────────┐              │
│   │  pm_scheduler (Rust → Wasm)│              │
│   │  • make_project            │              │
│   │  • total_hours             │              │
│   │  • serialize_projects      │              │
│   │  • load_projects           │              │
│   │  • build_gantt             │              │
│   └────────────────────────────┘              │
│                                                │
│   Data in / out: local JSON files only         │
└──────────────────────────────────────────────┘
```

- **JavaScript** manages the DOM, form handling, tab navigation, and SVG rendering.
- **Rust/Wasm** owns the data model, validation, and Gantt-preparation logic.
- **Service Worker** caches the static assets for offline use.

---

## Getting Started (Local Development)

### Prerequisites
- [Rust](https://www.rust-lang.org/tools/install)
- [`wasm-pack`](https://rustwasm.github.io/wasm-pack/installer/)
- A simple static file server (examples below use Python via [`uv`](https://github.com/astral-sh/uv))

### Run locally
```bash
# 1. Build the WebAssembly module (see next section)
wasm-pack build --target web --release

# 2. Serve the project root over HTTP
uv run python -m http.server 8000

# 3. Open the app
#    http://localhost:8000
```

> **Note:** Opening `index.html` directly via `file://` will not work, because ES modules and WebAssembly must be served over HTTP(S). Always use a local server for development.

> **Tip:** The Service Worker is intentionally **disabled on `localhost`** so your changes always appear immediately during development. It activates only on the deployed site.

---

## Building the WebAssembly Module

Whenever you change the Rust source (`src/lib.rs`), rebuild:

```bash
wasm-pack build --target web --release
```

This regenerates the `pkg/` directory containing:
- `pm_scheduler.js` — the JS bindings
- `pm_scheduler_bg.wasm` — the compiled module

Both must be deployed alongside `index.html`.

---

## Deployment

The app is deployed as a static site on **GitHub Pages**:

**[https://saptakdutta.github.io/pm_scheduler/](https://saptakdutta.github.io/pm_scheduler/)**

To deploy an update:
1. Rebuild the Wasm module if `src/lib.rs` changed (`wasm-pack build --target web --release`).
2. Commit and push `index.html`, `sw.js`, and the entire `pkg/` directory.
3. If any cached file changed, **bump the cache version** in `sw.js` (see below).

---

## Offline Support & Caching

The app registers a **Service Worker** (`sw.js`) on the deployed site to enable offline use.

- On the first online visit, the app's core files are cached.
- On subsequent visits, the app loads from cache and works without a connection.

### Updating cached files
Because assets are cached, deploying new files requires signalling the browser to refresh them. Bump the `CACHE_NAME` version in `sw.js` (e.g. `pm-scheduler-v4` → `pm-scheduler-v5`) whenever you deploy changes. The Service Worker's `activate` handler automatically purges older caches.

> If a device is still showing an old version after an update, clear that site's website data / cache once to shed the previously registered Service Worker. (On iOS Safari: **Settings → Safari → Advanced → Website Data**, then remove the site.)

---

## Data Model

Schedules are plain JSON, so they're easy to inspect, back up, and version.

```json
[
  {
    "name": "Website Redesign",
    "hours_assigned": 200,
    "colleagues": ["Alex", "Sam", "Jordan"],
    "tasks": [
      {
        "title": "Wireframes",
        "assignee": "Alex",
        "start_date": "2026-01-05",
        "end_date": "2026-01-19",
        "completed": false
      }
    ],
    "milestones": [
      {
        "title": "Design sign-off",
        "due_date": "2026-02-02",
        "completed": false
      }
    ]
  }
]
```

- **Tasks** need a start *and* end date to render as bars.
- **Milestones** need a date to render as diamonds.
- Older schedule files without `tasks`/`milestones` still load correctly (these fields default to empty).

---

## Project Structure

```
pm_scheduler/
├── index.html          # UI, styling, JS orchestration, SVG Gantt rendering
├── sw.js               # Service Worker (offline caching)
├── Cargo.toml          # Rust package manifest
├── src/
│   └── lib.rs          # Rust data model + logic (compiled to Wasm)
└── pkg/                # Generated by wasm-pack (JS bindings + .wasm)
    ├── pm_scheduler.js
    └── pm_scheduler_bg.wasm
```

---

## Browser Support

Works in modern browsers that support WebAssembly, ES modules, and SVG — including recent versions of Chrome, Edge, Firefox, and Safari (desktop and mobile). The Gantt view is responsive and adapts to different screen sizes and orientations.

---

## License
TBD
