# Shortly — URL Shortener

A lightweight, full-stack URL shortener. It creates memorable links, redirects visitors to the destination, records click totals, and provides a simple dashboard.

## Quick start

1. Install [Node.js 18+](https://nodejs.org/).
2. In this folder, run `npm start`.
3. Open `http://localhost:3000`.

No `npm install` step is required: the application uses only built-in Node.js modules.

## How it works

```text
Browser dashboard ──POST /api/links──> Node HTTP server ──> data/links.json
       │                                      │
       └──GET /api/links <────────────────────┘

Visitor ──GET /summer-sale──> Node HTTP server ──increments clicks──> 302 redirect to destination
```

### Components

| Component | Responsibility |
| --- | --- |
| `public/index.html` | Dashboard markup and form controls. |
| `public/styles.css` | Responsive visual design. |
| `public/app.js` | Calls the API, updates the dashboard, copies and deletes links. |
| `server.js` | API endpoints, validation, code generation, redirects, static-file serving. |
| `data/links.json` | Local persistent data store, created automatically on first start. |

## API

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/links` | List all links with live short URLs. |
| `POST` | `/api/links` | Create a link: `{ "url", "code?", "title?" }`. |
| `DELETE` | `/api/links/:id` | Delete a link. |
| `GET` | `/:code` | Increment clicks and issue a `302` redirect. |
| `GET` | `/health` | Minimal health check. |

## Request workflow

1. A user enters a destination URL and optional alias in the dashboard.
2. The browser sends a JSON request to `POST /api/links`.
3. The server validates `http`/`https`, validates the alias, and creates a cryptographically random code if necessary.
4. The link record is saved atomically in `data/links.json`, then returned to the dashboard.
5. When someone opens `/:code`, the server finds the record, increments `clicks`, records `lastVisitedAt`, saves it, and returns a `302 Location` response.

## Local data model

```json
{
  "id": "uuid",
  "code": "summer-sale",
  "destination": "https://example.com/offer",
  "title": "Summer campaign",
  "createdAt": "2026-07-30T10:00:00.000Z",
  "clicks": 0,
  "lastVisitedAt": null
}
```

## Production architecture

This version is intentionally ideal for local demos and small single-instance deployments. For a production service, retain the UI/API/redirect separation but replace and add these parts:

```text
CDN / HTTPS load balancer
          │
     Node API instances ───── PostgreSQL (links, users, domains)
          │                  Redis (redirect cache + rate limits)
          └─────────────── Queue / analytics warehouse (click events)
```

- Use PostgreSQL with a unique, case-insensitive index on `code` instead of the JSON file.
- Put the application behind HTTPS and set its public base URL (for example, `https://go.example.com`).
- Record click events asynchronously for location, referrer, and device analytics; never block the redirect on analytics writes.
- Add authentication and ownership before allowing a dashboard to list or delete links.
- Use rate limiting, bot protection, destination scanning, abuse reporting, audit logs, backups, and monitoring.
- Prefer `301` only for truly permanent destinations; the included `302` lets links remain editable in a future version.

## Deployment checklist

1. Deploy the folder to a Node 18+ host.
2. Set `PORT` to the platform-provided port.
3. Ensure the `data/` directory uses durable storage (or migrate to a managed database).
4. Configure a custom domain and HTTPS at the hosting provider/reverse proxy.
5. Run `/health` as the platform health check.

## Limitations of this starter

It is deliberately unauthenticated and its JSON file is not suitable for multiple server instances or high write traffic. It also counts one click per redirect request, including bots. Those are the first areas to address before a public launch.
