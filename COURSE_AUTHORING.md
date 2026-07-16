# Adding a Techarium course

Techarium separates platform concerns from course runtime code. The platform should never import a course's lessons, and a course should never render catalog or profile UI.

## 1. Create a course package

Recommended shape:

```text
js/courses/<course-id>/
  index.js              course router
  manifest.js           optional course-local metadata
  modules/
    module1/
      step1.js
  engine/               course-specific visual vocabulary
  assets/
css/courses/<course-id>.css
<course-id>.html        isolated course shell
```

Shared interaction primitives belong in `js/engine/` only when at least two courses can use them without course-specific language or styling.

## 2. Register the manifest

Add one object to `COURSES` in `js/platform/course-registry.js`:

```js
{
  id: 'cloud-internals',
  slug: 'build-a-cloud-service',
  title: 'Build a Cloud Service',
  displayTitle: 'Build a <em>Cloud Service.</em>',
  domain: 'systems',
  domainLabel: 'Systems · Cloud',
  status: 'available',
  featured: false,
  level: 'Foundations',
  duration: '2–3 hours',
  moduleCount: 4,
  lessonCount: 16,
  launchUrl: 'cloud-internals.html',
  description: 'Short catalog description.',
  outcomes: ['Queues', 'Storage', 'Scaling', 'Failure recovery'],
}
```

Use `status: 'coming-soon'` and `launchUrl: null` while a course is not playable. `npm run check` rejects an available course whose launch page is missing.

## 3. Emit generic progress events

Course code talks to `js/platform/profile-store.js`; it does not read or write `localStorage` directly.

```js
markCourseStarted(courseId, { act, step, totalSteps });
recordCoursePosition(courseId, { act, step, totalSteps });
recordCourseStep(courseId, { act, step, globalStep, totalSteps });
recordCourseActCompleted(courseId, act);
recordCourseCompleted(courseId);
```

If the course uses `flow.run`, connect progress through `onStepStart` and `onStepComplete`. Storage hooks are fail-open: a course remains playable without a profile.

## 4. Keep the course isolated

- Course URLs must work without visiting the platform page first.
- Learners without a profile can play; only persistence is skipped.
- Do not place learner names or profile state inside deterministic replay answers.
- Course-specific costs, inventory, sound, and narration stay within the course.
- Provide a visible route back to `index.html`.
- Respect keyboard access and `prefers-reduced-motion`.

## 5. Definition of done

- Manifest passes `npm run check`.
- Course launch URL loads with no console errors.
- First and final lesson can initialize directly.
- Progress appears on the platform dashboard after completing a step.
- Resume opens the correct module or act.
- Back and Restart reproduce the same visual state.
- Layout works at 360 px and desktop widths.

## Reference implementations

- **Build Your Own Data Centre** uses the default flow presenter, which owns its cost and inventory HUD plus venture milestone cards.
- **Build a Neural Network** supplies a course presenter through `flow.run({ presenter })`. Its `enterStep(context)` method renders model/capability state, while `completeStep(context)` renders generic lab milestones through `guide.milestone()`.

Use a custom presenter when a course needs different HUD semantics. Do not add conditionals for course IDs inside the shared flow engine.
