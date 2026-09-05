# Local SEO — Medak, Telangana 502110

Target: rank for **"beauty parlour in Medak"** and its variants.

## What is already built

| Item | Where |
|---|---|
| Local landing page | `app/beauty-parlour-in-medak/page.jsx` |
| Page body / copy | `components/LocalSeoView.jsx` |
| Keywords, FAQs, service areas | `lib/localSeo.js` |
| Footer link (every page) | `components/Nav.jsx` → Footer → Explore |
| Sitemap entry (priority 0.9) | `app/sitemap.js` |
| Site-wide LocalBusiness schema | `app/layout.jsx` |

The landing page ships `BeautySalon`, `FAQPage` and `BreadcrumbList` JSON-LD, one
`<h1>`, eight FAQs, and 14 served areas — all in the static HTML.

## Required before this can rank — do these first

On-page work alone will **not** win the Medak map pack. In local search the
Google Business Profile is the dominant ranking factor. In rough order of impact:

1. **Claim and verify the Google Business Profile.**
   Search "DM Beauty Parlour Medak" on Google → claim the listing, or create it
   at <https://business.google.com>. Verification is by postcard or phone and
   takes a few days. Nothing below matters as much as this.
   - Primary category: **Beauty salon**. Secondary: *Bridal shop*, *Makeup artist*.
   - Set the service area to Medak district (the towns in `MEDAK_AREAS`).
   - Add real photos of the studio, at least 10, and keep adding monthly.
   - Post the exact same name, address and phone as this site shows.

2. **Set the production site URL.**
   `.env.local` currently has `NEXT_PUBLIC_SITE_URL=http://localhost:3000`, which
   makes every canonical tag and sitemap URL point at localhost. On the live
   host this **must** be the real domain (e.g. `https://dmbeauty.in`), or Google
   will index the wrong URLs.

3. **Link the profile back to this page.**
   In the Business Profile, set the website to the homepage and add
   `/beauty-parlour-in-medak` as the appointment/services link. Then fill in the
   `instagram`, `facebook` and `googleMapsUrl` settings in the admin panel — the
   layout emits these as schema `sameAs`, which is a strong entity signal. They
   are omitted from the schema while empty, so there is no penalty for waiting.

4. **Submit to Google Search Console.**
   Add the property, verify it, submit `https://<domain>/sitemap.xml`, then use
   URL Inspection → Request Indexing on `/beauty-parlour-in-medak`.

5. **Reviews.** Ask every satisfied client for a Google review and reply to each
   one. Review count and recency move map-pack rank more than any on-page edit.
   Do not buy reviews — it risks the listing.

6. **Local citations.** Create consistent NAP (name, address, phone) listings on
   JustDial, Sulekha, IndiaMART, Facebook Page and Bing Places. The name,
   address and phone must match this site **character for character**.

## Deliberate omissions

- **No `aggregateRating` in schema.** The previous code hard-coded
  "4.9 from 312 reviews". Review counts that do not correspond to real, visible
  reviews violate Google's structured-data policy and can trigger a manual
  action. Ratings should come from the Google Business Profile instead. Only add
  `aggregateRating` back if genuine on-site reviews are collected and displayed.
- **No prices in the FAQ copy.** The live service catalogue has `price: null`
  for every service, so any figure written into the page would be invented. The
  FAQ points to the services page instead. Schema `Offer` blocks omit `price`
  entirely rather than emitting `"null"`, which would be invalid.

## When prices are entered in the admin panel

The page picks them up automatically — "From ₹…" badges appear per service group
and schema `Offer` entries gain `price` / `priceCurrency`. No code change needed.

## Editing the copy

All wording lives in `lib/localSeo.js`:
`MEDAK_FAQS`, `MEDAK_AREAS`, `MEDAK_SERVICE_GROUPS`, `MEDAK_TRUST_POINTS`.

FAQ answers are functions of live settings, so the same text renders in both the
visible page and the JSON-LD. Keep it that way — Google penalises FAQ schema
whose answers do not appear on the page.
