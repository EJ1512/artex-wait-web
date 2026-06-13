# Artex Waitlist Webpage

Standalone static waitlist page for Artex. Pure black theme with a faint
golden glow, minimal futuristic styling, and a live artist trend preview.

## Files

- `index.html`: page markup (hero, market, signals, waitlist panels).
- `styles.css`: black/gold UI and animations. Desktop (≥ 901px) uses a
  full-screen panel deck; smaller screens get a normal scrolling document.
- `app.js`: panel/scroll layout modes, artist trend preview (Drake, Taylor
  Swift, Kanye West, Bad Bunny, SZA with their Spotify profile images), and
  Supabase waitlist insert logic.
- `contact.html`, `privacy.html`: legal/contact pages.
- `supabase-schema.sql`: waitlist table and insert-only anonymous RLS policy.

## Supabase Setup

1. Run `supabase-schema.sql` in your Supabase SQL editor.
2. In `app.js`, configure:

```js
const SUPABASE_URL = "https://YOUR_PROJECT.supabase.co";
const SUPABASE_PUBLIC_KEY = "YOUR_SUPABASE_PUBLISHABLE_KEY";
```

with your public project URL and publishable key.

Do not put a service-role key in browser code.

## Security

- Each page ships a `Content-Security-Policy` meta tag limiting scripts to
  same-origin, images to Spotify's CDN, and network calls to the Supabase
  project. If you change the Supabase project URL, update the `connect-src`
  in `index.html` to match.
- Client-side email validation mirrors the RLS insert policy (length 6-254,
  same regex), so bad input fails before it reaches Supabase.
- The form includes a hidden honeypot field; automated submissions that fill
  it are dropped without a network call.
- When deploying, also set real response headers at the host/CDN level
  (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` or
  `frame-ancestors`, `Strict-Transport-Security`); meta tags cannot cover
  those.

## Open Locally

Open `index.html` in a browser, or serve this folder with any static file
server, e.g. `npx http-server . -p 8123`.
