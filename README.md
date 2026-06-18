# 💄 DM Beauty Parlour

<div align="center">

![DM Beauty Parlour](https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=1200&q=85)

**A full-stack beauty salon web app — bridal studio bookings, admin dashboard, push notifications, and more.**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange?logo=firebase)](https://firebase.google.com)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?logo=vercel)](https://vercel.com)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)

[🌐 Live Demo](https://dm-beauty-salon.vercel.app) · [📋 Report Bug](https://github.com/NaveenKumarK1407/DM-Beauty-Salon/issues) · [✨ Request Feature](https://github.com/NaveenKumarK1407/DM-Beauty-Salon/issues)

</div>

---

## ✨ Features

- 🏠 **Public Website** — Hero, services marquee, gallery, testimonials, contact
- 📅 **Booking System** — Customers can book appointments with service selection & phone validation
- 🖼️ **Gallery Lookbook** — Admin-managed photo gallery
- 📦 **Packages** — Bridal & seasonal beauty packages with pricing
- ⭐ **Reviews** — Customer testimonials managed from the admin panel
- 🔔 **Push Notifications** — FCM push alerts to the studio owner on new bookings/messages
- 🔐 **Admin Dashboard** — Full CRUD for bookings, services, packages, gallery, payments, reviews & settings
- 📍 **Google Maps** — Embedded studio location
- 📱 **PWA Ready** — Web manifest, service worker, installable
- 🌙 **Dark / Light Mode** — Automatic theme switching
- 🔍 **SEO Optimised** — Metadata, sitemap, robots.txt, JSON-LD schema

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 14 (App Router) |
| **Styling** | Vanilla CSS (custom design system) |
| **Database** | Firebase Firestore (Admin SDK) |
| **Auth** | Firebase Admin (server-side only) |
| **Push** | Firebase Cloud Messaging (FCM) |
| **Hosting** | Vercel (serverless) |
| **Fonts** | Cormorant Garamond · Jost · Playfair Display |

---

## 📁 Project Structure

```
DM-Beauty-Salon/
├── app/
│   ├── page.jsx              # Home page
│   ├── layout.jsx            # Root layout + SEO metadata
│   ├── booking/              # Booking flow
│   ├── services/             # Services catalogue
│   ├── gallery/              # Photo gallery
│   ├── contact/              # Contact page
│   ├── admin/                # Admin dashboard
│   └── api/                  # API routes (bookings, services, FCM...)
├── components/               # Reusable UI components
├── lib/
│   ├── firebaseAdmin.js      # Firebase Admin SDK (server-only)
│   ├── firebaseClient.js     # Firebase client SDK
│   ├── store.js              # Firestore data layer
│   ├── staticData.js         # Static fallback data
│   └── utils.js              # Helper utilities
├── public/                   # Static assets
├── .env.local                # ⚠️ Never committed — see setup below
└── next.config.mjs           # Next.js config
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A [Firebase](https://firebase.google.com) project with Firestore enabled
- A [Vercel](https://vercel.com) account (for deployment)

### 1. Clone the repo

```bash
git clone https://github.com/NaveenKumarK1407/DM-Beauty-Salon.git
cd DM-Beauty-Salon
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

Then open `.env.local` and fill in all the values (see [Environment Variables](#-environment-variables) below).

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## 🔑 Environment Variables

Create a `.env.local` file in the root with the following:

```env
# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Firebase Web SDK (Client-side)
# Firebase Console → Project Settings → General → Your apps → Web app
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
NEXT_PUBLIC_FIREBASE_DATABASE_URL=

# FCM VAPID Key (Push Notifications)
# Firebase Console → Project Settings → Cloud Messaging → Web Push certificates
NEXT_PUBLIC_FIREBASE_VAPID_KEY=

# Firebase Admin SDK (Server-side)
# Firebase Console → Project Settings → Service accounts → Generate new private key
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

> ⚠️ **Never commit `.env.local`** — it's in `.gitignore`. Store secrets in [Vercel Environment Variables](https://vercel.com/docs/environment-variables) for production.

---

## 🌍 Deployment

### Deploy to Vercel

```bash
npm install -g vercel
vercel login
vercel --prod
```

Or connect your GitHub repo to Vercel for automatic deployments on every push.

### Add environment variables to Vercel

```bash
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
# repeat for each variable
```

---

## 📸 Screenshots

| Home | Services | Admin |
|---|---|---|
| ![Home](https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400&q=80) | ![Services](https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&q=80) | ![Admin](https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=400&q=80) |

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first.

1. Fork the repo
2. Create your branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'feat: add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

---

## 📄 License

MIT © [Naveen Kumar K]([https://github.com/NaveenKumarK1407](https://www.linkedin.com/in/naveen-kumar-kusangi-721b5826b/))

---

<div align="center">
  Made with ❤️ for DM Beauty Parlour, Medak — Telangana

  [![GitHub](https://img.shields.io/badge/GitHub-NaveenKumarK1407-black?logo=github)](https://github.com/NaveenKumarK1407)
  [![LinkedIn](https://img.shields.io/badge/LinkedIn-Naveen%20Kumar-blue?logo=linkedin)](https://www.linkedin.com/in/naveen-kumar-kusangi-721b5826b/)
</div>
