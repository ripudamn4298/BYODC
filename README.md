# Techarium

Technology you learn by doing.

Techarium is a browser-based platform for interactive technology courses. The platform provides the course catalog, learner profiles, progress tracking, and resume links. Each course owns its simulations, narrative, and visual vocabulary.

Available courses:

- **Build Your Own Data Centre**: 21 interactive builds across semiconductor physics, digital logic, fabrication, GPU architecture, and data-centre systems.
- **Build a Neural Network**: 16 guided experiments from one neuron to a tiny next-token transformer.

## Run locally

No package installation or build step is required.

```bash
npm run serve
```

Open `http://localhost:4173`. Native ES modules require HTTP; `file://` is not supported.

Validate source modules and course registrations with:

```bash
npm run check
```

## Routes

- `index.html`: Techarium platform home, catalog, dashboard, and local profile management.
- `course.html`: Build Your Own Data Centre landing and interactive runtime.
- `ai-course.html`: Build a Neural Network landing and interactive runtime.
- `course.html?act=3&start=1`: directly launch an act, used by resume links.
- `test.html`: standalone visual harness for the BYODC frame-scrub landing animation.

## Architecture

```text
index.html + css/platform.css + js/platform/app.js
  Platform shell: catalog, profiles, dashboard

js/platform/course-registry.js
  Course manifests and launch routing

js/platform/profile-store.js
  Browser-local profile and progress adapter

course.html + js/main.js
  BYODC course entry and five-act router

js/engine/
  Reusable interactive runtime: flow, guide, HUD, stage, controls

js/steps/ + js/acts/
  BYODC course content

js/courses/neural-networks/
  AI course router, four labs, presenter, deterministic engine, and landing
```

Profiles are deliberately local for the MVP. Data is stored under `techarium:mvp:v1` in `localStorage`; there is no email, authentication service, tracking request, or cross-device sync. Platform code imports the store through a small API so it can later be replaced with an authenticated backend.

## Add a course

Read [COURSE_AUTHORING.md](COURSE_AUTHORING.md). A course is registered through one manifest in `js/platform/course-registry.js`. Available manifests must point to an existing launch page. The platform catalog and dashboard render from registry data—do not add course cards directly to `index.html`.

## Important runtime rule

BYODC uses deterministic record-and-replay navigation. Every learner interaction inside a step must pass through `flow.ask()`. Back and Restart reconstruct a step from recorded answers; bypassing `flow.ask()` breaks that contract.

## Current MVP boundaries

- Browser-local profiles only.
- Progress saves after completed steps; resume returns to the beginning of the last active act.
- Two available courses; future-course manifests demonstrate broader cross-domain catalog support.
- No analytics, backend, certificates, payments, or cross-device synchronization.
