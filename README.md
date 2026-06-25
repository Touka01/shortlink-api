# shortlink-api

A small but production-minded URL shortener API. It takes a long URL and returns a short code, redirects visitors to the original, and tracks click analytics along the way. Built to show clean REST design, input validation, persistence, rate limiting, and tests rather than to reinvent bit.ly.

## Features

- Shorten any http or https URL to a compact code
- Optional custom aliases (for example `/launch`) with duplicate protection
- Optional expiry, after which a link returns `410 Gone`
- Click analytics: total clicks plus the ten most recent, with referrer and user agent
- Rate limiting on the create endpoint to discourage abuse
- SQLite persistence with a clean, injectable database so tests run fully in memory
- A test suite covering the main paths

## Tech

Node.js, Express, better-sqlite3, express-rate-limit. Tests use the built in `node --test` runner with supertest.

## Getting started

```bash
npm install
npm start
# server on http://localhost:3000
```

## Examples

Create a short link:

```bash
curl -X POST http://localhost:3000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/a/very/long/path","expiresInDays":30}'
```

```json
{ "code": "Xa3b9Z", "url": "https://example.com/a/very/long/path", "shortUrl": "http://localhost:3000/Xa3b9Z", "expiresAt": 1788900000000 }
```

Follow it:

```bash
curl -i http://localhost:3000/Xa3b9Z      # 302 redirect to the original URL
```

See the stats:

```bash
curl http://localhost:3000/api/stats/Xa3b9Z
```

## API

| Method | Path | Description |
| --- | --- | --- |
| POST | `/api/shorten` | Create a short link |
| GET | `/:code` | Redirect to the original URL |
| GET | `/api/stats/:code` | Click analytics for a link |
| GET | `/api/health` | Health check |

The full contract is described in [`openapi.yaml`](./openapi.yaml).

## Tests

```bash
npm test
```

## License

MIT
