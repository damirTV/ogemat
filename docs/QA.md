# Release QA

## Automated gate

- Run `npm test` and confirm all tests pass.
- Run `npm run lint`.
- Run `npm run format:check`.
- Run `npm run build` and serve `dist/` over HTTP locally.

## Desktop browser

- Open the menu and every ready task: 1-5, 6, 7, 9, 11, and 12.
- Start each mode, answer one correct and one incorrect task, use a hint, and return to the menu.
- Run every sprint until its result screen and confirm that the timer, review, and score render.
- Check SVG plans, number lines, graphs, and wheel diagrams at narrow and wide widths.
- Use keyboard input for number pads, navigation, and primary actions.
- Reload after completing a round and confirm progress remains.

## Mobile and PWA

- Test the published HTTPS build on current Android Chrome and iPhone Safari.
- Install the app and open it from the home screen.
- Complete a round, close the app, and confirm the stored progress remains.
- Open once online, switch the device offline, then restart the installed app and repeat a ready mode.
- After deploying a new build, reopen the app online and confirm the updated build replaces the old cache.

## Feedback

- With an empty endpoint, confirm a submitted message says it was stored locally and no request is sent.
- With a production endpoint, submit a test message and confirm a 2xx response, server-side storage outside web-root, and the expected email delivery.
