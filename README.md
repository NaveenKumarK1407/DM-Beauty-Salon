# DM Beauty Parlour — Next.js

A small, considered beauty studio site for **DM Beauty Parlour, Medak (Telangana)** —
everyday rituals and once-in-a-lifetime bridal looks.

Originally a Vite/React prototype (`DM Beauty Parlour.html` design), rebuilt as a
**Next.js (App Router)** product that is **SEO-friendly**, has a **backend API**, and
sends **Firebase Cloud Messaging notifications** to the studio for new bookings and
enquiries.

## Features

- **Pages** (real routes, SSR for SEO): Home `/`, Services `/services`,
  Gallery `/gallery`, Booking `/booking`, Contact `/contact`, Admin `/admin`.
- **SEO**: per-page `metadata` (titles, descriptions, canonical, OpenGraph/Twitter),
  `BeautySalon` JSON-LD structured data, `app/sitemap.js`, `app/robots.js`,
  and a web app manifest.
- **Backend (Route Handlers)**:
  - `POST /api/bookings` — create a booking, persist it, notify the studio. `GET` lists bookings (admin).
  - `POST /api/contact` — store an enquiry and notify the studio.
  - `POST /api/notifications/subscribe` — register an FCM device token.
- **Firebase**:
  - Firestore stores `bookings`, `messages`, `fcmTokens`.
  - Cloud Messaging pushes a notification to the studio's registered devices on every
    new booking/enquiry (enable from the bell icon in the Admin header).
- **Graceful fallback**: with no Firebase credentials the app still runs end-to-end —
  data is written to a local `.data/` JSON store and notifications are logged to the console.
- **Live appearance panel**: theme (light/dark), palette, display font, and density,
  persisted to `localStorage`.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in values (optional for local dev)
npm run dev                  # http://localhost:3000
```

`npm run build && npm start` for production.

## Firebase setup (for real notifications)

1. Create a Firebase project and a **Web app**; copy the config into the
   `NEXT_PUBLIC_FIREBASE_*` vars in `.env.local`.
2. **Cloud Messaging → Web Push certificates**: generate a key pair and put the public
   key in `NEXT_PUBLIC_FIREBASE_VAPID_KEY`.
3. Paste the same web config into **`public/firebase-messaging-sw.js`** (service workers
   can't read env vars).
4. **Service account** (Project settings → Service accounts → Generate new private key):
   set `FIREBASE_SERVICE_ACCOUNT_KEY` (full JSON) **or** the discrete
   `FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY`.
5. Enable **Firestore** in the console.
6. Open `/admin`, click the bell to grant notification permission and register the device.

## Project structure

```
app/
  layout.jsx            root layout: fonts, SEO metadata, JSON-LD, chrome
  page.jsx              Home (server-rendered)
  services|gallery|contact|booking|admin/page.jsx
  api/bookings|contact|notifications/subscribe/route.js
  sitemap.js  robots.js  manifest.js
components/              Nav, Footer, Chrome, page views, SettingsPanel, MapMockup
lib/
  data.jsx              service/gallery/testimonial data + SVG icons
  firebaseClient.js     web SDK + notification opt-in
  firebaseAdmin.js      admin SDK (server)
  store.js              Firestore-or-local-JSON persistence
  notify.js             FCM send helper
public/firebase-messaging-sw.js
```

## Internal design document

`/design` is an **internal** route (not linked from the public site, `noindex`) — a
printable brand style-guide: color palette, typography, components and light/dark
tokens. It's for developers to understand the design system, not for visitors. Open
`http://localhost:3000/design` and use **Save as PDF**. The same tokens it documents
are what drive the whole site (see `:root` in `app/globals.css`).

## Theme toggle

A light/dark toggle (sun/moon icon) lives in the navbar and the mobile menu. Theme,
palette, font and density are managed by a single source of truth (`lib/appearance.jsx`)
shared by the toggle and the floating appearance panel, and persisted to `localStorage`.

## Notes

- Replace the placeholder `public/icon-192.png` / `icon-512.png` with real brand icons.
- Demo photos load from Unsplash; broken images are hidden gracefully.
