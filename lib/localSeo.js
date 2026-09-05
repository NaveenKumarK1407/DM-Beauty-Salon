// Local-SEO content for the Medak landing page. Kept out of the component so the
// copy can be edited without touching JSX, and so the FAQ answers can be reused
// verbatim in both the visible page and the FAQPage JSON-LD (Google penalises
// schema whose answers don't appear on the page).

export const MEDAK_GEO = { lat: 18.0461, lng: 78.2693 };

// Neighbourhoods and nearby towns people actually search from. Feeds areaServed
// in the schema and the "areas we serve" block — the phrases that catch
// "beauty parlour near <place>" queries.
export const MEDAK_AREAS = [
  'Medak',
  'Pochamma Maidan',
  'Medak Fort Road',
  'Mukkamamidi',
  'Havelighanpur',
  'Ramayampet',
  'Narsapur',
  'Toopran',
  'Papannapet',
  'Chegunta',
  'Shankarampet',
  'Kohir',
  'Sangareddy',
  'Siddipet',
];

// Long-tail intent phrases woven into the page body as real sentences.
export const MEDAK_SEARCH_TERMS = [
  'beauty parlour in Medak',
  'best beauty parlour in Medak',
  'ladies beauty parlour Medak',
  'bridal makeup in Medak',
  'bridal makeup artist Medak',
  'HD makeup Medak',
  'beauty salon near me Medak',
  'hair colour salon Medak',
  'facial in Medak',
  'gel nail art Medak',
  'waxing and threading Medak',
  'pellikuturu makeup Medak',
];

// Answers are functions so live studio settings (phone, hours, address) stay in
// sync between the rendered copy and the structured data.
export const MEDAK_FAQS = [
  {
    q: 'Which is the best beauty parlour in Medak for bridal makeup?',
    a: ({ city }) =>
      `DM Beauty Parlour is a dedicated bridal and beauty studio in ${city}, Telangana. Brides book us for the full wedding sequence — pellikuturu, mehendi, haldi, engagement, muhurtham and reception — with HD and airbrush makeup, saree draping and jewellery setting done in-studio by Devi Madhuri. Every bridal booking starts with a free trial and consultation so the look is settled before the wedding day.`,
  },
  {
    q: 'Where exactly is DM Beauty Parlour located in Medak?',
    a: ({ address }) =>
      `We are at ${address}. The studio is in central Medak, easy to reach from Medak Fort Road, the bus stand and the Pochamma Maidan area, with parking on the street outside.`,
  },
  {
    q: 'What are your opening hours?',
    a: ({ hours }) =>
      `Our hours are ${hours}. Walk-ins are welcome whenever we are open, though bridal and hair-colour appointments should be booked ahead so we can block the full slot for you.`,
  },
  {
    // No hard figures here on purpose: the studio's live price list is the only
    // source of truth, and quoting numbers that drift out of date is worse for
    // trust than sending people to the page that is always current.
    q: 'How much does bridal makeup cost in Medak?',
    a: ({ phone }) =>
      `Bridal pricing depends on how many looks you need — a single engagement or reception look costs less than a full wedding-day package covering mehendi, haldi, muhurtham and reception. Current rates for every service are listed on our services page, and we confirm the exact total in writing when you book, so there are no additions on the day. For a package quote, call or WhatsApp ${phone} and tell us your dates.`,
  },
  {
    q: 'Do you do home service or travel outside Medak for weddings?',
    a: () =>
      `Yes. We travel for bridal bookings across Medak district and nearby towns including Narsapur, Toopran, Ramayampet, Papannapet, Chegunta, Sangareddy and Siddipet. Travel is charged based on distance and is confirmed when you book, so there are no surprises on the wedding day.`,
  },
  {
    q: 'How do I book an appointment?',
    a: ({ phone }) =>
      `Book online through the booking page on this site, message us on WhatsApp, or call ${phone}. For bridal work we recommend booking at least a month ahead, especially during the wedding season, as weekend slots fill first.`,
  },
  {
    q: 'What services does your Medak beauty parlour offer?',
    a: ({ city }) =>
      `Our ${city} studio covers bridal and party makeup, mehendi, eye makeup and lashes, hair styling, skin and facial treatments, hand and nail care, waxing and threading. The full, current list with pricing is on our services page.`,
  },
  {
    q: 'Is DM Beauty Parlour a ladies-only parlour?',
    a: ({ city }) =>
      `Yes, we are a ladies beauty parlour in ${city} with a private, comfortable studio space. All services are carried out by female beauticians.`,
  },
];

// Service groupings shown as keyword-rich headings on the landing page.
export const MEDAK_SERVICE_GROUPS = [
  {
    heading: 'Bridal Makeup in Medak',
    body: 'Pellikuturu, mehendi, haldi, engagement, muhurtham and reception looks. HD and airbrush bases built to hold through a full Telangana wedding day, with saree draping, hairstyling and jewellery setting included. Free trial before every bridal booking.',
    cats: ['Bridal'],
  },
  {
    heading: 'Party & Occasion Makeup',
    body: 'Soft glam for receptions, birthdays and functions, and light, breathable day makeup for work, brunches and photoshoots — finished in about an hour.',
    cats: ['Makeup'],
  },
  {
    heading: 'Hair Salon — Cut, Colour & Spa',
    body: 'Consultation-led haircuts, blow-dry styling, ammonia-free global hair colour with a gloss finish, and keratin hair spa with scalp massage and steam.',
    cats: ['Hair'],
  },
  {
    heading: 'Facials & Skin Care',
    body: '24K gold glow facials for events and derma-clear treatments targeting acne, pigmentation and dullness — matched to your skin after a short consultation.',
    cats: ['Skin'],
  },
  {
    heading: 'Nails, Waxing & Threading',
    body: 'Hand and nail care, designer gel extensions and nail art, manicure and pedicure, waxing with sensitive-skin formulas, and brow shaping with threading, eye makeup and lashes.',
    cats: ['Nails', 'Waxing', 'Threading'],
  },
  {
    heading: 'Mehendi & Bridal Henna',
    body: 'Traditional, Arabic, bridal and modern mehendi designs for weddings, engagements, festivals and baby showers — natural henna for deep colour that lasts.',
    cats: ['Mehendi', 'Mehndi', 'Henna'],
  },
];

// Why-us points. Written as specific, verifiable claims — vague superlatives
// carry no weight with either readers or Google's quality signals.
export const MEDAK_TRUST_POINTS = [
  {
    title: 'A studio, not a chair in a shop',
    body: 'A private, air-conditioned space in central Medak with a dedicated bridal room, so your trial and your wedding morning are unhurried.',
  },
  {
    title: 'Brands you can check',
    body: 'Professional HD and airbrush lines, ammonia-free colour and sensitive-skin wax formulas — we show you the product before we use it.',
  },
  {
    title: 'Prices published in advance',
    body: 'Every service and package is listed in INR on this site. What you are quoted at booking is what you pay.',
  },
  {
    title: 'Telugu, Hindi and English',
    body: 'Consultations in the language you are comfortable in, so nothing about your look gets lost in translation.',
  },
];
