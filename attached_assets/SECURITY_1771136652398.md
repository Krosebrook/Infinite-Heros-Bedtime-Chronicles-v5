# Security Policy -- Infinity Heroes: Bedtime Chronicles

## Table of Contents

1. [Security Overview](#1-security-overview)
2. [API Key Protection](#2-api-key-protection)
3. [Content Security Policy (CSP)](#3-content-security-policy-csp)
4. [HTTP Security Headers](#4-http-security-headers)
5. [Input Validation](#5-input-validation)
6. [CORS and Origin Policies](#6-cors-and-origin-policies)
7. [Dependency Security](#7-dependency-security)
8. [Reporting Security Vulnerabilities](#8-reporting-security-vulnerabilities)
9. [Security Best Practices for Contributors](#9-security-best-practices-for-contributors)
10. [Known Security Considerations](#10-known-security-considerations)

---

## 1. Security Overview

Infinity Heroes: Bedtime Chronicles is a children's bedtime story application that uses Google's Gemini AI to generate stories, illustrations, and narration. The application is built with React and deployed on Vercel.

The primary security architecture centers on a **server-side API proxy pattern**: all calls to the Google Gemini API are routed through Vercel serverless functions (`/api/*`), ensuring that API credentials never leave the server environment and are never bundled into client-side code. The application also enforces a strict Content Security Policy and additional HTTP security headers to mitigate common web vulnerabilities.

**Key security principles:**

- API keys are stored exclusively in server-side environment variables.
- The client application contains zero secrets or credentials.
- All AI generation endpoints enforce HTTP method restrictions.
- Content Security Policy limits the origins the browser may load resources from.
- Standard HTTP security headers protect against clickjacking, MIME sniffing, and referrer leakage.

---

## 2. API Key Protection

### How the API Proxy Pattern Works

The application uses four Vercel serverless functions as a secure proxy layer between the browser client and the Google Gemini API:

| Endpoint                  | Purpose              | Gemini Model Used                |
| ------------------------- | -------------------- | -------------------------------- |
| `/api/generate-story`     | Story text generation | `gemini-3-pro-preview`          |
| `/api/generate-avatar`    | Hero avatar images   | `gemini-2.5-flash-image`        |
| `/api/generate-scene`     | Scene illustrations  | `gemini-2.5-flash-image`        |
| `/api/generate-narration` | Text-to-speech audio | `gemini-2.5-flash-preview-tts`  |

**Request flow:**

```
Browser (AIClient.ts)
   |
   |  POST /api/generate-story  (no API key in request)
   v
Vercel Serverless Function (api/generate-story.ts)
   |
   |  reads process.env.GEMINI_API_KEY
   |  calls Google Gemini API with key
   v
Google Generative AI API
   |
   |  returns generated content
   v
Vercel Serverless Function
   |
   |  returns sanitized response to browser
   v
Browser
```

### Why Keys Are Never in the Client Bundle

- The `GEMINI_API_KEY` is set as a Vercel environment variable, accessible only within serverless function execution contexts via `process.env.GEMINI_API_KEY`.
- The client-side code (`AIClient.ts`) makes `fetch()` calls to relative paths (e.g., `/api/generate-story`), sending only prompt content -- never credentials.
- The `useApiKey.ts` hook confirms this pattern: `validateApiKey()` always returns `true` because key validation is handled entirely server-side. No key is ever stored in the browser, localStorage, or client-side state.
- Vite's build process (`vite.config.ts`) does not inject any `GEMINI_*` environment variables into the client bundle. Only variables prefixed with `VITE_` are exposed to client code, and no such variables are used for API keys.

### Server-Side Environment Variable Usage

Each serverless function follows an identical guard pattern:

```typescript
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) return res.status(500).json({ error: 'API key not configured' });
```

This ensures:
- If the environment variable is missing, the endpoint fails safely with a generic error.
- The key value is never reflected in error responses to the client.
- The key exists only in server memory during request processing.

---

## 3. Content Security Policy (CSP)

The CSP is defined in `vercel.json` and applied to all routes (`/(.*)`):

```
default-src 'self';
script-src 'self' 'unsafe-inline';
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
img-src 'self' data: blob:;
connect-src 'self' https://generativelanguage.googleapis.com;
```

### Directive Breakdown

| Directive      | Value                                                      | Explanation                                                                                                                                     |
| -------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `default-src`  | `'self'`                                                   | Baseline restriction: only resources from the application's own origin are permitted unless overridden by a more specific directive.             |
| `script-src`   | `'self' 'unsafe-inline'`                                   | Scripts must originate from the app's domain. `'unsafe-inline'` is required for React's runtime and Vite's HMR injections during development. No external script CDNs are permitted. |
| `style-src`    | `'self' 'unsafe-inline' https://fonts.googleapis.com`      | Stylesheets may be loaded from the app origin and Google Fonts. `'unsafe-inline'` is needed for Tailwind CSS and dynamic style injection.       |
| `font-src`     | `'self' https://fonts.gstatic.com`                         | Font files may only be loaded from the app origin and Google's font CDN (`fonts.gstatic.com`).                                                  |
| `img-src`      | `'self' data: blob:`                                       | Images may come from the app origin, `data:` URIs (base64-encoded AI-generated images), and `blob:` URIs (dynamically created image objects).   |
| `connect-src`  | `'self' https://generativelanguage.googleapis.com`         | Network requests (fetch/XHR) are restricted to the app origin (covers `/api/*` proxy calls) and the Google Generative AI API endpoint directly. |

### What Is Blocked

- External script sources (CDNs, analytics, ad networks).
- Loading frames, objects, or plugins (covered by `default-src 'self'`).
- Connecting to arbitrary third-party APIs from the browser.
- Loading images from external URLs (only self, data, and blob are allowed).

---

## 4. HTTP Security Headers

Three additional security headers are set in `vercel.json` on all routes:

### X-Frame-Options: DENY

Prevents the application from being embedded in `<iframe>`, `<frame>`, or `<object>` elements on any domain. This mitigates **clickjacking attacks** where an attacker overlays the application in an invisible frame to trick users into unintended interactions. The `DENY` value is the most restrictive option -- no framing is allowed from any origin, including the app's own domain.

### X-Content-Type-Options: nosniff

Instructs browsers to strictly honor the `Content-Type` header returned by the server and not attempt MIME-type sniffing. This prevents attacks where a malicious file (e.g., an uploaded image containing executable script) could be reinterpreted as an executable content type by the browser.

### Referrer-Policy: strict-origin-when-cross-origin

Controls how much referrer information is sent with outgoing requests:
- **Same-origin requests:** Full URL is sent as the referrer.
- **Cross-origin requests (HTTPS to HTTPS):** Only the origin (scheme + host + port) is sent, without path or query parameters.
- **Downgrade requests (HTTPS to HTTP):** No referrer is sent.

This protects user privacy by preventing URL paths (which may contain story IDs or session identifiers) from leaking to third-party services.

---

## 5. Input Validation

### HTTP Method Enforcement

All four API endpoints enforce POST-only access:

```typescript
if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
```

GET, PUT, DELETE, and other HTTP methods are rejected with a `405 Method Not Allowed` response.

### Request Body Handling

Each endpoint destructures only the expected fields from the request body:

| Endpoint             | Expected Fields                              |
| -------------------- | -------------------------------------------- |
| `generate-story`     | `systemInstruction`, `userPrompt`, `responseSchema` |
| `generate-avatar`    | `prompt`                                     |
| `generate-scene`     | `prompt`                                     |
| `generate-narration` | `text`, `voiceName`                          |

Unexpected fields in the request body are ignored (not processed or forwarded in their entirety).

### Client-Side Prompt Truncation

The `AIClient.ts` client applies length limits before sending prompts to the proxy:

```typescript
// Scene illustration prompt is truncated to 400 characters
const prompt = `...${context.substring(0, 400)}...`;
```

### Request Size Limits

Vercel serverless functions enforce a default request body size limit of **4.5 MB** for serverless functions. This is an infrastructure-level constraint that applies to all API endpoints without additional configuration.

### Error Handling

API error responses are sanitized. Internal error objects and stack traces are logged server-side via `console.error()` but only a generic message is returned to the client:

```typescript
res.status(error.status || 500).json({ error: error.message || 'Generation failed' });
```

---

## 6. CORS and Origin Policies

### Default Vercel Behavior

Vercel serverless functions hosted under the `/api` directory of the same project are treated as same-origin requests by the browser. Since the client and API share the same domain, standard same-origin policy applies and no explicit CORS headers are needed.

### Cross-Origin Restrictions

- The API endpoints do not set `Access-Control-Allow-Origin` or other CORS headers, meaning they are **not accessible from other domains** by default.
- The `connect-src` CSP directive further restricts the browser to only make network requests to `'self'` and `https://generativelanguage.googleapis.com`.
- External websites cannot make AJAX/fetch calls to these API endpoints due to the absence of CORS headers.

### Considerations

- If the API were to be accessed from a different domain (e.g., a mobile app web view on a different origin), explicit CORS headers would need to be added to the serverless functions.

---

## 7. Dependency Security

### Auditing Dependencies

Run regular security audits on project dependencies:

```bash
npm audit
```

To automatically fix vulnerabilities where possible:

```bash
npm audit fix
```

### Keeping Dependencies Updated

- Use `npm outdated` to check for available updates.
- Update dependencies regularly, especially those flagged with security advisories.
- Consider using tools like [Dependabot](https://github.com/dependabot) or [Renovate](https://www.mend.io/renovate/) for automated dependency update pull requests.

### Key Dependencies to Monitor

| Dependency              | Role                         | Security Relevance                    |
| ----------------------- | ---------------------------- | ------------------------------------- |
| `@google/genai`         | Google Gemini API client     | Handles API communication             |
| `@vercel/node`          | Serverless function runtime  | Request/response handling              |
| `react`, `react-dom`    | UI framework                 | XSS vectors if misused                |
| `vite`                  | Build tool and dev server    | Dev server security, build integrity  |
| `vite-plugin-pwa`       | PWA/service worker support   | Cache management, offline behavior     |

### Supply Chain Protections

- Use `package-lock.json` to pin exact dependency versions and ensure reproducible builds.
- Review new dependencies before adding them, paying attention to package popularity, maintenance activity, and known vulnerabilities.

---

## 8. Reporting Security Vulnerabilities

We take the security of Infinity Heroes: Bedtime Chronicles seriously. If you discover a security vulnerability, we appreciate your help in disclosing it to us responsibly.

### Responsible Disclosure

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them via one of the following channels:

- **Email:** Send a detailed report to the repository maintainer (see the repository's GitHub profile for contact information).
- **GitHub Security Advisories:** Use the [GitHub Security Advisory](https://docs.github.com/en/code-security/security-advisories) feature if enabled on this repository.

### What to Include in Your Report

- A description of the vulnerability and its potential impact.
- Steps to reproduce the issue.
- Any relevant screenshots, logs, or proof-of-concept code.
- Your suggested fix, if applicable.

### What to Expect

- **Acknowledgment:** We will acknowledge receipt of your report within 48 hours.
- **Assessment:** We will evaluate the report and provide an initial assessment within 7 days.
- **Fix Timeline:** Critical vulnerabilities will be addressed as quickly as possible. Non-critical issues will be prioritized in our development cycle.
- **Credit:** With your permission, we will credit you in the release notes for the fix.

### Scope

The following are in scope for security reports:

- API proxy endpoints (`/api/*`).
- Client-side data handling (storage, caching, state management).
- Content Security Policy bypasses.
- Authentication or authorization issues.
- Information disclosure in error responses.

The following are out of scope:

- Vulnerabilities in third-party services (Google Gemini API, Vercel platform).
- Social engineering attacks.
- Denial-of-service attacks against Vercel infrastructure.

---

## 9. Security Best Practices for Contributors

### Environment Variables

- **Never** commit API keys, tokens, or secrets to the repository.
- Use Vercel's environment variable management for production secrets.
- For local development, use a `.env` file that is listed in `.gitignore`.
- Never prefix sensitive variables with `VITE_`, as Vite exposes those to the client bundle.

### Code Practices

- **Sanitize user input:** Always validate and sanitize data received from request bodies before processing.
- **Avoid `eval()` and `new Function()`:** Never execute dynamically constructed code strings.
- **Use parameterized queries:** If database access is ever added, use parameterized queries to prevent injection attacks.
- **Minimize `'unsafe-inline'`:** When modifying the CSP, avoid adding new `unsafe-*` directives. Prefer nonce-based or hash-based approaches for inline scripts if possible.
- **Do not log sensitive data:** Ensure `console.log()` and `console.error()` calls do not output API keys, user credentials, or personally identifiable information.

### Pull Request Review Checklist

- [ ] No secrets or API keys are present in the diff.
- [ ] New API endpoints enforce HTTP method restrictions.
- [ ] New network requests are covered by the CSP `connect-src` directive.
- [ ] Error responses do not leak internal system details.
- [ ] New dependencies have been vetted for security advisories.
- [ ] Client-side code does not reference `process.env.GEMINI_API_KEY` or similar server-only variables.

---

## 10. Known Security Considerations

### Client-Side IndexedDB Data (Not Encrypted)

The application uses IndexedDB (via `StorageManager`) to persistently cache generated audio narration data on the client. This data is stored **unencrypted** in the browser's IndexedDB storage.

**Implications:**
- Any user or process with access to the browser profile can read cached audio data.
- IndexedDB data persists across sessions and browser restarts.
- This is an acceptable trade-off for a children's story application where the cached data consists of AI-generated narration audio, which does not contain sensitive or private information.

**Mitigations:**
- Users can clear IndexedDB data through browser settings.
- The application could implement a "Clear Cache" feature to let users manage stored data.

### Image and Audio Data Handling

- **Images** (avatars and scene illustrations) are returned from the API as base64-encoded data and rendered as `data:` URIs. These are stored in application state and may be persisted in IndexedDB. Base64 images can be large and reside in browser memory during the session.
- **Audio** (narration) is returned as base64-encoded raw PCM data, decoded client-side using the Web Audio API, and cached in both an in-memory `Map` and IndexedDB.
- Neither images nor audio data are validated for content integrity beyond what the Gemini API provides. The application trusts the response from its own server-side proxy.

### Rate Limiting Considerations

**Current state:** The API proxy endpoints do **not** implement application-level rate limiting.

**Risks:**
- Without rate limiting, a malicious actor could make excessive requests to the `/api/*` endpoints, consuming the project's Gemini API quota and potentially incurring costs.
- Vercel provides some infrastructure-level protections (e.g., DDoS mitigation and function invocation limits per plan), but these may not be sufficient for fine-grained abuse prevention.

**Recommended mitigations:**
- Implement per-IP or per-session rate limiting in the serverless functions (e.g., using Vercel KV, Upstash Redis, or an in-memory store with a sliding window algorithm).
- Add API request throttling on the client side (the `AIClient.ts` retry logic with exponential backoff partially addresses this for legitimate use).
- Monitor Gemini API usage through the Google Cloud Console and set budget alerts.

### Additional Considerations

- **No authentication:** The API endpoints are publicly accessible. Any client that can reach the Vercel deployment can call the endpoints. This is by design for a free children's application but should be reconsidered if usage costs become a concern.
- **Prompt injection:** User-provided story parameters (hero name, power, setting, etc.) are passed directly into AI prompts. While the AI model has its own safety filters, the application does not perform explicit prompt injection defenses. The system instructions constrain output to children's story content, which provides some guardrails.
- **Service worker caching:** The PWA configuration (`vite-plugin-pwa`) caches static assets aggressively. Ensure that security-sensitive responses (if any are added in the future) are not inadvertently cached by the service worker.

---

*Last updated: 2026-02-14*
