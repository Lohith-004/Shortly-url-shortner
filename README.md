# Shortly — URL Shortener

> A full-stack web application that converts long URLs into short, shareable links and provides basic click analytics.

## Live demo

**Application:** [https://shortly-url-shortner.onrender.com](https://shortly-url-shortner.onrender.com)

**Health check:** [https://shortly-url-shortner.onrender.com/health](https://shortly-url-shortner.onrender.com/health)

---

## 1. Project overview

Shortly is a URL shortener application. A user enters a long URL, and the application generates a smaller, easy-to-share URL. For example:

```text
Long URL:  https://example.com/products/category/summer-sale?id=123
Short URL: https://shortly-url-shortner.onrender.com/summer-sale
```

When someone opens the short URL, the application redirects them to the original destination. The app also records the number of clicks and the last time the link was visited.

---

## 2. Problem statement

Long URLs can be difficult to share in social media posts, messages, marketing campaigns, presentations, and printed materials. Shortly solves this by creating compact and memorable links. It also gives users simple analytics to understand how often their links are being opened.

---

## 3. Features

- Create short links from valid `http://` or `https://` URLs.
- Generate secure random aliases automatically.
- Create custom aliases such as `/portfolio` or `/summer-sale`.
- Redirect each short link to its original URL.
- Track click count for every link.
- Record the last time a short link was used.
- View total links, total clicks, and the top-performing link.
- Copy a generated short URL from the dashboard.
- Delete links from the dashboard.
- Use a `/health` endpoint to verify that the deployed service is running.
- Use a responsive UI that works on desktop and mobile devices.

---

## 4. Technology stack

| Layer | Technology | Purpose |
| --- | --- | --- |
| Frontend | HTML | Dashboard structure |
| Frontend | CSS | Responsive user interface and styling |
| Frontend | Vanilla JavaScript | Form handling, API calls, dashboard updates |
| Backend | Node.js | HTTP server, APIs, validation, redirects |
| Storage | JSON file | Stores link records for the demo |
| Deployment | Render | Hosts the public Node.js application |
| Version control | Git and GitHub | Source-code management and deployment integration |

The application deliberately uses Node.js built-in modules and does not require external runtime packages.

---

## 5. Architecture

```text
┌─────────────────────┐
│   User's browser    │
│  Dashboard / UI     │
└─────────┬───────────┘
          │ REST API requests
          ▼
┌─────────────────────┐
│   Node.js server    │
│ validation + API +  │
│ redirect handling   │
└─────────┬───────────┘
          │ read / write
          ▼
┌─────────────────────┐
│  data/links.json    │
│  local data store   │
└─────────────────────┘

Visitor opens /:code
          │
          ▼
Node.js updates analytics and returns a 302 redirect
          │
          ▼
Original destination URL
```

### Architecture explanation

The frontend, backend, and storage layers have separate responsibilities:

- The **frontend** displays the dashboard and collects user input.
- The **backend** validates requests, generates aliases, saves records, and performs redirects.
- The **storage layer** stores each short-link record in a JSON file.

The browser does not directly access the storage file. It communicates only through backend API endpoints.

---

## 6. Complete application workflow

### A. Creating a short link

1. The user enters a destination URL in the dashboard.
2. The user may optionally enter a custom alias and a link label.
3. The frontend sends a `POST /api/links` request to the server.
4. The server validates that the destination uses `http` or `https`.
5. The server validates the custom alias, if supplied.
6. If no alias was supplied, the server generates a secure random code.
7. The server saves the link record in `data/links.json`.
8. The server returns the generated short URL.
9. The dashboard displays the short link and provides a Copy button.

### B. Redirecting a visitor

1. A visitor opens a short URL such as `/summer-sale`.
2. The Node.js server looks for the matching code.
3. If it exists, the server increases its click count.
4. The server records the current date and time as `lastVisitedAt`.
5. The server saves the updated link record.
6. The server sends an HTTP `302` redirect to the original destination URL.

### C. Viewing analytics

1. The frontend requests all links using `GET /api/links`.
2. The server returns saved links and their analytics data.
3. The dashboard shows total links, total clicks, the top-performing link, and individual click counts.

---

## 7. API documentation

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/links` | Returns all saved links. |
| `POST` | `/api/links` | Creates a new short link. |
| `DELETE` | `/api/links/:id` | Deletes a link using its internal ID. |
| `GET` | `/:code` | Records a click and redirects to the original URL. |
| `GET` | `/health` | Returns the service status. |

### Create a short link

**Request**

```json
{
  "url": "https://example.com/products/summer-sale",
  "code": "summer-sale",
  "title": "Summer campaign"
}
```

**Response**

```json
{
  "id": "unique-uuid",
  "code": "summer-sale",
  "destination": "https://example.com/products/summer-sale",
  "title": "Summer campaign",
  "createdAt": "2026-07-30T10:00:00.000Z",
  "clicks": 0,
  "lastVisitedAt": null,
  "shortUrl": "https://shortly-url-shortner.onrender.com/summer-sale"
}
```

---

## 8. Data model

Each short link is stored in this format:

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

| Field | Meaning |
| --- | --- |
| `id` | Unique internal identifier used for operations such as deletion. |
| `code` | Public short-link alias. |
| `destination` | Original URL to which visitors are redirected. |
| `title` | Optional human-readable link label. |
| `createdAt` | Date and time the link was created. |
| `clicks` | Total number of redirect requests. |
| `lastVisitedAt` | Date and time of the most recent visit. |

---

## 9. Project structure

```text
url-shortener/
│
├── public/
│   ├── index.html       # Dashboard markup
│   ├── styles.css       # Responsive UI styling
│   └── app.js           # Frontend logic and API calls
│
├── data/
│   └── links.json       # Local persistent data; created automatically
│
├── server.js            # APIs, validation, redirects, static-file server
├── package.json         # Node.js configuration and start command
├── .gitignore           # Files excluded from Git
└── README.md            # Project-level documentation
```

---

## 10. Local setup

### Prerequisites

- Node.js 18 or later
- Git (optional, for cloning and version control)

### Run the project

```bash
git clone https://github.com/Lohith-004/Shortly-url-shortner.git
cd Shortly-url-shortner/i/outputs/url-shortener
npm start
```

Then open:

```text
http://localhost:3000
```

No `npm install` step is necessary because the application uses only Node.js built-in modules. `npm install` is still safe to run on hosting platforms.

---

## 11. Deployment

The project is deployed on Render as a Node.js web service.

| Deployment setting | Value |
| --- | --- |
| Build command | `npm install` |
| Start command | `npm start` |
| Health-check path | `/health` |
| Root directory | `i/outputs/url-shortener` |
| Live URL | `https://shortly-url-shortner.onrender.com` |

The server reads the `PORT` environment variable provided by the deployment platform and listens on `0.0.0.0`, allowing the Render load balancer to reach the service.

---

## 12. Important technical decisions

### Why use HTTP 302 redirects?

The application uses a `302` temporary redirect. This allows the destination to remain editable in a future version. A `301` permanent redirect can be cached by browsers and should only be used if the destination will never change.

### How are aliases made unique?

Before creating a link, the server checks whether the requested custom alias already exists. If no custom alias is provided, Node.js cryptographic random bytes generate a random short code.

### How are URLs validated?

The backend uses Node.js URL parsing and allows only `http:` and `https:` destination URLs.

### How is data written safely?

The backend writes data to a temporary file and then renames it to the final JSON file. This reduces the chance of data corruption during a write.

---

## 13. Limitations and production improvements

This version is suitable as a portfolio project, local demo, or small single-server application. It is not yet designed for heavy public usage.

### Current limitations

- JSON storage is not suitable for multiple server instances or high traffic.
- Render free services use temporary filesystem storage, so stored links can be lost after a restart or redeployment.
- There is no authentication or link ownership.
- A click is counted for every redirect request, including bots.

### Recommended production improvements

- Use PostgreSQL or MongoDB instead of a JSON file.
- Add user signup, login, and link ownership.
- Use Redis for caching and rate limiting.
- Add link expiry and destination editing.
- Record detailed analytics asynchronously: location, referrer, browser, and device.
- Add malicious-link detection, abuse reporting, and audit logs.
- Add automated tests, CI/CD, monitoring, backups, and error logging.
- Configure a custom domain and HTTPS.

---

## 14. Interview explanation

### 60-second answer

> I built Shortly, a full-stack URL shortener application. Users enter a long destination URL through a responsive dashboard, and the Node.js backend validates it, creates a custom or random short code, and saves the record. When a visitor opens the short link, the server finds the matching record, updates its click analytics, and responds with a 302 redirect to the original URL. I created REST APIs for link creation, listing, and deletion, and I deployed the application to Render through GitHub. For the demo I used JSON storage, but for production I would use PostgreSQL, authentication, Redis rate limiting, and asynchronous analytics.

### Suggested demo flow

1. Open the live application.
2. Enter a long URL and custom alias.
3. Create and copy the short link.
4. Open the short link in a new browser tab.
5. Show that it redirects to the destination.
6. Return to the dashboard and show that the click count increased.
7. Explain the API request and redirect workflow.

---

## 15. Author

**Lohith**

Project repository: [Lohith-004/Shortly-url-shortner](https://github.com/Lohith-004/Shortly-url-shortner)
