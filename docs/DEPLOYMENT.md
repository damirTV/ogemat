# Deployment

## Static application

1. Install development tools with `npm ci`.
2. Run `npm test`, `npm run lint`, and `npm run format:check`.
3. Run `npm run build`.
4. Publish the contents of `dist/` to an HTTPS static host.

HTTPS is required for service workers and PWA installation outside localhost. The `dist/sw.js` cache key is generated from the app contents, so a new build updates clients without editing the source service worker.

## Feedback

Feedback is local-only by default. It is sent nowhere unless `feedback-config.js` contains an HTTPS endpoint, for example:

```js
window.OGE_FEEDBACK_ENDPOINT = 'https://example.org/feedback.php';
```

The endpoint must accept same-origin or correctly configured CORS `POST` requests with JSON `{ id, kind, text, ts }`, respond with a successful 2xx status only after accepting the message, and apply rate limiting.

## PHP endpoint

`feedback.php` is optional and must run behind a PHP-capable web server. Configure these server environment variables instead of editing the file:

- `OGE_FEEDBACK_MAIL_TO`
- `OGE_FEEDBACK_MAIL_FROM`
- `OGE_FEEDBACK_DATA_DIR`

`OGE_FEEDBACK_DATA_DIR` must be an absolute directory outside the public document root and writable by the PHP process. Configure a valid mail transport on the server. Do not publish the project root with `feedback-data/` inside it.

The client endpoint and PHP URL may be on different origins only when the endpoint explicitly permits the production origin with CORS.
