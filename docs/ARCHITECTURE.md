# Architecture

## Runtime

The application is a dependency-free browser PWA. `index.html` loads scripts in a deliberate order:

1. `logic*.js` creates and extends the DOM-free `window.Logic` API.
2. `app.js` creates `window.OGE`, owns navigation, persisted state, shared UI helpers, and global events.
3. `modes*.js` adds individual screens and action handlers to `OGE`.
4. `feedback-config.js`, `feedback.js`, and `sound.js` add optional feedback and audio behavior.

The load order is a contract. New logic or modes must be inserted after their dependencies.

## Main modules

| Area            | Logic                                 | UI                                    |
| --------------- | ------------------------------------- | ------------------------------------- |
| Task 6          | `logic.js`, `logic2.js`, `logic3.js`  | `app.js`, `modes.js`, `modes2.js`     |
| Task 7          | `logic4.js`, `logic5.js`, `logic6.js` | `modes3.js`, `modes4.js`, `modes5.js` |
| Tasks 1-5       | `logic7.js`, `logic8.js`, `logic9.js` | `modes6.js`, `modes7.js`              |
| Tasks 9, 11, 12 | `logic10.js`, `logic11.js`            | `modes8.js`, `modes9.js`              |

## State

Progress lives in `localStorage`; the primary structure is created by `Logic.defaultStats()`.
Temporary round state remains in the corresponding UI module. The service worker persists the app shell for offline use but never stores learner progress.

## Content and testing

Task generators return structured task objects. UI modules render these objects and route `data-act` actions to `OGE.ACT`. `tests/run-tests.js` executes generator and consistency checks in Node. `tests/tests.html` additionally exercises DOM interaction in a browser.

## Release

`npm run build` copies deployable assets to `dist/` and writes a content-hashed cache name into its generated `sw.js`. Deploy only `dist/`, not the project root. See `DEPLOYMENT.md`.
