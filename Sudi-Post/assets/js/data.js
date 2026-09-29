/* ==========================================================================
   SUDI-POST — Data Layer
   --------------------------------------------------------------------------
   Central mock/API data source. When the REST API is live, replace the
   bodies of the SP.API.* functions with fetch() calls and keep the same
   return shapes so no view code has to change.
   ========================================================================== */
(function (global) {
  "use strict";

  /* ---------------------------------------------------------------------
     BRAND / COMPANY
     --------------------------------------------------------------------- */
  const BRAND = {
    name: "Sudi-Post",
    legalName: "Sudi-Post Delivery Services",
    tagline: "Private Postal, Courier & Delivery Services",
    founded: 2019,
    currency: "SSP",
    currencySymbol: "SSP",
    usdRate: 1300, // 1 USD = 1300 SSP — configure per rate update
    phones: {
      main: "+211 927 100 141",
      juba: "+211 977 000 101",
      addis: "+251 989 407 436",
      support: "+211 977 000 199"
    },
    whatsapp: "+211927100141",
    emails: {
      general: "info@sudipost.com",
      support: "support@sudipost.com",
      business: "business@sudipost.com",
      careers: "careers@sudipost.com"
    },
    address: {
      street: "Malakia Road",
      city: "Juba",
      country: "South Sudan",
      postal: "11111"
    },
    addisAddress: {
      street: "Bole Sub-City, Woreda 03, House 214",
      city: "Addis Ababa",
      country: "Ethiopia",
      postal: "1000"
    },
    hours: [
      { day: "Monday – Friday", open: "07:30", close: "18:30" },
      { day: "Saturday", open: "08:00", close: "17:00" },
      { day: "Sunday", open: "09:00", close: "14:00" },
      { day: "Public holidays", open: "09:00", close: "13:00" }
    ],
    hoursShort: "Mon–Fri 07:30–18:30 • Sat 08:00–17:00 • Sun 09:00–14:00",
    socials: [
      { name: "Facebook", short: "f", url: "https://facebook.com/sudipost" },
      { name: "X", short: "X", url: "https://x.com/sudipost" },
      { name: "Instagram", short: "ig", url: "https://instagram.com/sudipost" },
      { name: "LinkedIn", short: "in", url: "https://linkedin.com/company/sudipost" },
      { name: "YouTube", short: "yt", url: "https://youtube.com/@sudipost" }
    ]
  };

  /* ---------------------------------------------------------------------
     SHIPMENT STATUSES
     --------------------------------------------------------------------- */
  const STATUSES = {
    pending:     { key: "pending",     label: "Pending",         short: "Pending",         color: "#647689", badge: "badge st-pending",     icon: "clock",        desc: "Shipment request received and awaiting collection." },
    received:    { key: "received",    label: "Received",        short: "Received",        color: "#4E6072", badge: "badge st-received",    icon: "inbox",        desc: "Parcel accepted and checked in at the origin branch." },
    processing:  { key: "processing",  label: "Processing",      short: "Processing",      color: "#0A5A60", badge: "badge st-processing",  icon: "package",      desc: "Being sorted, weighed, scanned and labelled for dispatch." },
    transit:     { key: "transit",     label: "In Transit",      short: "In Transit",      color: "#8A6116", badge: "badge st-transit",     icon: "truck",        desc: "Moving between hubs towards the destination." },
    arrived:     { key: "arrived",     label: "Arrived",         short: "Arrived",         color: "#0A5A60", badge: "badge st-transit",     icon: "flag",         desc: "Arrived at the destination hub and awaiting delivery." },
    outfordeliv: { key: "outfordeliv", label: "Out for Delivery",short: "Out for Delivery",color: "#C2761F", badge: "badge st-outfordeliv",icon: "walk",        desc: "With the delivery agent on the final mile." },
    delivered:   { key: "delivered",   label: "Delivered",       short: "Delivered",       color: "#0E7C6B", badge: "badge st-delivered",   icon: "check-circle", desc: "Delivered and confirmed by the recipient." },
    returned:    { key: "returned",    label: "Returned",        short: "Returned",        color: "#647689", badge: "badge st-returned",    icon: "undo",         desc: "Undeliverable — returned to sender." },
    delayed:     { key: "delayed",     label: "Delayed",         short: "Delayed",         color: "#A3342A", badge: "badge st-delayed",     icon: "alert",        desc: "Exception in transit. Our team is resolving it." }
  };

  /* Canonical tracking progress (7 steps) */
  const TRACK_STEPS = [
    { step: 1, key: "created",   status: "pending",     label: "Shipment Created",  icon: "file" },
    { step: 2, key: "received",  status: "received",    label: "Package Received",  icon: "inbox" },
    { step: 3, key: "processing",status: "processing",  label: "Processing",        icon: "package" },
    { step: 4, key: "transit",   status: "transit",     label: "In Transit",        icon: "truck" },
    { step: 5, key: "arrived",   status: "arrived",     label: "Arrived",           icon: "flag" },
    { step: 6, key: "outfordeliv",status:"outfordeliv",label: "Out for Delivery",  icon: "walk" },
    { step: 7, key: "delivered", status: "delivered",   label: "Delivered",         icon: "check-circle" }
  ];

  /* ---------------------------------------------------------------------
     SERVICES
     --------------------------------------------------------------------- */
  const SERVICES = [
    {
      id: "domestic", icon: "home", title: "Domestic Delivery", photo: "van.jpg",
      desc: "Reliable delivery of letters, documents and parcels within South Sudan, reaching every state from Juba to the far reaches of the north.",
      features: ["Nationwide coverage", "2–7 day delivery", "Door-to-door or branch drop-off", "SMS notifications"],
      metric: "All 10 states", zone: "zone2"
    },
    {
      id: "international", icon: "globe", title: "International Delivery", photo: "air.jpg",
      desc: "Connect customers to international destinations through our postal, air freight and last-mile logistics partners across South Sudan, Ethiopia, Kenya and Uganda.",
      features: ["Partner network in 4 countries", "7–21 day delivery", "Customs guidance support", "Full tracking to doorstep"],
      metric: "4 countries", zone: "zone5"
    },
    {
      id: "express", icon: "zap", title: "Express Courier", photo: "exp.png",
      desc: "Fast, priority handling for urgent documents, medical supplies and time-critical packages that simply cannot wait for the next scheduled batch.",
      features: ["Priority handling", "24–72 hour transit", "Air freight to regional hubs", "Saturday delivery"],
      metric: "24–72 hrs", zone: "zone1"
    },
    {
      id: "door-to-door", icon: "route", title: "Door-to-Door Delivery", photo: "Do.png",
      desc: "We collect from your door and deliver directly to your recipient's door — no branch queues, no missed pickups, complete handover records.",
      features: ["Free pickup within Juba", "Named delivery agent", "Two-hour delivery windows", "Proof of delivery capture"],
      metric: "2-hour windows", zone: "zone1"
    },
    {
      id: "documents", icon: "shield", title: "Document Delivery", photo: "exp.png",
      desc: "Secure, tracked transportation of personal and business documents — certificates, contracts, legal papers and examination results.",
      features: ["Tamper-evident pouches", "Direct-to-recipient", "Chain-of-custody log", "Signature mandatory"],
      metric: "Sealed & signed", zone: "zone1"
    },
    {
      id: "parcel", icon: "package", title: "Parcel Delivery", photo: "van.jpg",
      desc: "Safe, careful handling and transportation of packages of every size — from a shoebox to a full household consignment.",
      features: ["Up to 50 kg per parcel", "Bubble wrap & wrapping", "Fragile handling", "Insurance options"],
      metric: "Up to 50 kg", zone: "zone2"
    },
    {
      id: "ecommerce", icon: "cart", title: "E-Commerce Delivery", photo: "van.jpg",
      desc: "End-to-end delivery solutions for online businesses, marketplaces and social-media sellers — payment on delivery, order sync and returns.",
      features: ["Cash on delivery", "Order API integration", "Branded packaging", "Failed-delivery re-attempts"],
      metric: "COD available", zone: "zone2"
    },
    {
      id: "business", icon: "briefcase", title: "Business Logistics", photo: "log.jpg",
      desc: "Customised delivery, warehousing and distribution solutions designed around how your organisation actually operates.",
      features: ["Dedicated account manager", "Scheduled collections", "SLAs with credits", "Consolidated invoicing"],
      metric: "Custom SLAs", zone: "zone3"
    },
    {
      id: "student", icon: "graduation", title: "Student Package Delivery", photo: "exp.png",
      desc: "Specialised delivery of personal items, documents and packages between students in South Sudan and their families abroad — especially across the Juba–Addis corridor.",
      features: ["Semester schedules", "Family address book", "Group consolidation", "Fee-friendly instalments"],
      metric: "Juba ⇄ Addis", zone: "zone3"
    }
  ];

  /* ---------------------------------------------------------------------
     RATE CARD & ZONES
     --------------------------------------------------------------------- */
  const ZONES = [
    {
      id: "zone1", name: "Juba Metro", desc: "Within Juba city — delivery across all central districts",
      transit: "Same day – 1 day", base: 2500, perKg: 800, perKm: 0,
      destinations: ["Juba", "Juba – Kobero", "Juba – Malakia", "Juba – Hai Tong", "Juba – Kuajok", "Juba – Munuki", "Juba – Gaba", "Juba – Amarat"]
    },
    {
      id: "zone2", name: "South Sudan Regional", desc: "Juba to state capitals and major towns across the country",
      transit: "2 – 4 days", base: 6000, perKg: 1200, perKm: 180,
      destinations: ["Yei", "Nimule", "Kapoeta", "Torit", "Bor", "Yei", "Kajo-Keji", "Aweil", "Wau", "Rumbek", "Malakal", "Kushmok", "Akon", "Aweil Centre"]
    },
    {
      id: "zone3", name: "Ethiopia Corridor", desc: "South Sudan ⇄ Ethiopia — Addis Ababa, Dire Dawa and beyond",
      transit: "3 – 6 days", base: 12000, perKg: 2400, perKm: 0,
      destinations: ["Addis Ababa", "Addis Ababa – Bole", "Dire Dawa", "Bahir Dar", "Hawassa", "Adama", "Mekelle", "Gambella"]
    },
    {
      id: "zone4", name: "East Africa", desc: "Regional destinations via partner networks",
      transit: "5 – 9 days", base: 18000, perKg: 3600, perKm: 0,
      destinations: ["Nairobi", "Kampala", "Mombasa", "Entebbe"]
    },
    {
      id: "zone5", name: "International", desc: "Cross-border delivery across our four-country network",
      transit: "10 – 21 days", base: 45000, perKg: 7800, perKm: 0,
      destinations: ["Nairobi (int'l)", "Kampala (int'l)", "Addis Ababa (int'l)", "Juba (int'l)"]
    }
  ];

  const SERVICES_SPEEDS = [
    { id: "standard", label: "Standard", mult: 1, addDays: [0, 2], desc: "Cost-optimised, scheduled departures" },
    { id: "express",  label: "Express",  mult: 1.75, addDays: [-2, 0], desc: "Priority handling and fastest routing" }
  ];

  const PACKAGE_TYPES = [
    { id: "document", label: "Document / Letter", mult: 0.8, base: 1500, icon: "file" },
    { id: "small",    label: "Small Parcel",       mult: 1,   base: 2500, icon: "package" },
    { id: "medium",   label: "Medium Parcel",      mult: 1.15,base: 3000, icon: "box" },
    { id: "large",    label: "Large Parcel",       mult: 1.45,base: 4500, icon: "layers" },
    { id: "fragile",  label: "Fragile / Electronics", mult: 1.35, base: 4000, icon: "shield" },
    { id: "cargo",    label: "Cargo / Pallet",     mult: 1.9, base: 12000, icon: "container" }
  ];

  const SURCHARGES = [
    { id: "insurance", label: "Insurance cover", desc: "Protection up to declared value", rate: 0.02, unit: "of declared value" },
    { id: "residential", label: "Residential delivery", desc: "Doorstep handover beyond branch hours", rate: 2000, unit: "per shipment" },
    { id: "saturday", label: "Saturday delivery", desc: "Weekend handling at destination", rate: 3000, unit: "per shipment" },
    { id: "remote", label: "Remote area surcharge", desc: "Hard-to-reach townships and states", rate: 0.15, unit: "of freight" },
    { id: "signature", label: "Signature required", desc: "Named-recipient proof of delivery", rate: 1000, unit: "per shipment" },
    { id: "customs", label: "Customs handling", desc: "International clearance support", rate: 12000, unit: "per shipment" }
  ];

  /* ---------------------------------------------------------------------
     LUGGAGE RATE — luggage / parcel counter tariff
     A single fixed rate: the customer only enters the weight and the
     price is weight x 23,000 SSP. No zone, package type, dimensions,
     speed or surcharge inputs are involved.
     --------------------------------------------------------------------- */
  const LUGGAGE = {
    perKg: 23000,
    currency: "SSP",
    min: 0.5,
    max: 500,
    step: 0.1,
    note: "1 KG = 23,000 SSP. Fractional kilograms are charged pro rata, so 3.5 KG = 80,500 SSP.",
    /* printed reference table, mirrors the published tariff */
    table: [1, 2, 3, 4, 5, 10]
  };

  /* ---------------------------------------------------------------------
     LOCATIONS
     --------------------------------------------------------------------- */
  const LOCATIONS = [
    { id: "juba-hq", name: "Sudi-Post Head Office", type: "Head Office", country: "South Sudan", city: "Juba",
      address: "Malakia Road, Juba Central", phone: "+211 927 100 141", email: "info@sudipost.com",
      hours: "Mon–Fri 07:30–18:30 • Sat 08:00–17:00", lat: 4.8594, lon: 31.5713, pickup: true, weekend: true,
      services: ["Domestic", "International", "Express", "Documents", "Business"], staff: 42, isHead: true },

    { id: "juba-kijuk", name: "Sudi-Post Kuajok Branch", type: "Branch", country: "South Sudan", city: "Juba",
      address: "Kuajok Street, Hai Tong, Juba", phone: "+211 977 000 102", email: "kuajok@sudipost.com",
      hours: "Mon–Sat 08:00–18:00", lat: 4.8656, lon: 31.6106, pickup: true, weekend: true,
      services: ["Domestic", "Express", "Parcel", "Documents"], staff: 14 },

    { id: "juba-munuki", name: "Sudi-Post Munuki Pickup Point", type: "Pickup Point", country: "South Sudan", city: "Juba",
      address: "Munuki Market Road, Munuki, Juba", phone: "+211 977 000 103", email: "munuki@sudipost.com",
      hours: "Mon–Sat 07:30–17:30", lat: 4.8486, lon: 31.5406, pickup: true, weekend: false,
      services: ["Domestic", "Parcel", "E-Commerce"], staff: 5 },

    { id: "yei", name: "Sudi-Post Yei Branch", type: "Branch", country: "South Sudan", city: "Yei",
      address: "Yei Town Centre, Main Road, Yei", phone: "+211 977 000 110", email: "yei@sudipost.com",
      hours: "Mon–Sat 08:00–17:30", lat: 4.5769, lon: 31.5589, pickup: true, weekend: true,
      services: ["Domestic", "Parcel", "Documents"], staff: 9 },

    { id: "nimule", name: "Sudi-Post Nimule Pickup Point", type: "Pickup Point", country: "South Sudan", city: "Nimule",
      address: "Nimule Town, Opposite Border Market, Nimule", phone: "+211 977 000 111", email: "nimule@sudipost.com",
      hours: "Mon–Fri 08:00–16:00", lat: 3.6667, lon: 32.0333, pickup: true, weekend: false,
      services: ["Domestic", "Parcel"], staff: 3 },

    { id: "torit", name: "Sudi-Post Torit Branch", type: "Branch", country: "South Sudan", city: "Torit",
      address: "Torit Commercial Area, Market Street, Torit", phone: "+211 977 000 112", email: "torit@sudipost.com",
      hours: "Mon–Sat 08:00–17:30", lat: 4.5769, lon: 31.6, pickup: true, weekend: false,
      services: ["Domestic", "Parcel", "Documents"], staff: 7 },

    { id: "kapoeta", name: "Sudi-Post Kapoeta Pickup Point", type: "Pickup Point", country: "South Sudan", city: "Kapoeta",
      address: "Kapoeta Town, Kide Road, Kapoeta", phone: "+211 977 000 113", email: "kapoeta@sudipost.com",
      hours: "Mon–Fri 08:30–16:30", lat: 4.7667, lon: 33.5833, pickup: true, weekend: false,
      services: ["Domestic", "Parcel"], staff: 3 },

    { id: "wau", name: "Sudi-Post Wau Branch", type: "Branch", country: "South Sudan", city: "Wau",
      address: "Wau Commercial Area, Main Street, Wau", phone: "+211 977 000 114", email: "wau@sudipost.com",
      hours: "Mon–Sat 08:00–17:00", lat: 7.7, lon: 28.0, pickup: true, weekend: false,
      services: ["Domestic", "Parcel", "Documents"], staff: 6 },

    { id: "malakal", name: "Sudi-Post Malakal Branch", type: "Branch", country: "South Sudan", city: "Malakal",
      address: "Malakal Town, Railway Quarter, Malakal", phone: "+211 977 000 115", email: "malakal@sudipost.com",
      hours: "Mon–Sat 08:00–17:00", lat: 9.5333, lon: 31.6667, pickup: true, weekend: false,
      services: ["Domestic", "Parcel"], staff: 5 },

    { id: "rumbek", name: "Sudi-Post Rumbek Pickup Point", type: "Pickup Point", country: "South Sudan", city: "Rumbek",
      address: "Rumbek Town, Near Referral Hospital, Rumbek", phone: "+211 977 000 116", email: "rumbek@sudipost.com",
      hours: "Mon–Fri 08:30–16:30", lat: 7.8667, lon: 29.2, pickup: true, weekend: false,
      services: ["Domestic", "Parcel"], staff: 3 },

    { id: "bor", name: "Sudi-Post Bor Branch", type: "Branch", country: "South Sudan", city: "Bor",
      address: "Bor Town, Nile Street, Bor", phone: "+211 977 000 117", email: "bor@sudipost.com",
      hours: "Mon–Sat 08:00–17:00", lat: 6.2, lon: 31.6167, pickup: true, weekend: false,
      services: ["Domestic", "Parcel", "Documents"], staff: 5 },

    { id: "aweil", name: "Sudi-Post Aweil Pickup Point", type: "Pickup Point", country: "South Sudan", city: "Aweil",
      address: "Aweil Centre, Market Road, Aweil", phone: "+211 977 000 118", email: "aweil@sudipost.com",
      hours: "Mon–Fri 08:30–16:00", lat: 8.7667, lon: 27.4, pickup: true, weekend: false,
      services: ["Domestic", "Parcel"], staff: 2 },

    { id: "addis", name: "Sudi-Post Addis Ababa Branch", type: "Branch", country: "Ethiopia", city: "Addis Ababa",
      address: "Bole Sub-City, Woreda 03, House 214, Addis Ababa", phone: "+251 989 407 436", email: "addis@sudipost.com",
      hours: "Mon–Sat 08:00–18:00 (EAT)", lat: 9.03, lon: 38.74, pickup: true, weekend: true,
      services: ["International", "Express", "Student", "Business", "Documents"], staff: 24 },

    { id: "dire-dawa", name: "Sudi-Post Dire Dawa Branch", type: "Branch", country: "Ethiopia", city: "Dire Dawa",
      address: "Dire Dawa Main Road, Kawaiti Area, Dire Dawa", phone: "+251 911 000 110", email: "dire@sudipost.com",
      hours: "Mon–Sat 08:00–17:30 (EAT)", lat: 9.5931, lon: 41.8661, pickup: true, weekend: true,
      services: ["International", "Express", "Student", "Parcel"], staff: 12 },

    { id: "bahir-dar", name: "Sudi-Post Bahir Dar Pickup Point", type: "Pickup Point", country: "Ethiopia", city: "Bahir Dar",
      address: "Bahir Dar Town, Near University Gate, Bahir Dar", phone: "+251 911 000 111", email: "bahirdar@sudipost.com",
      hours: "Mon–Sat 08:30–17:00 (EAT)", lat: 11.5936, lon: 37.3908, pickup: true, weekend: false,
      services: ["International", "Student", "Parcel"], staff: 6 },

    { id: "hawassa", name: "Sudi-Post Hawassa Pickup Point", type: "Pickup Point", country: "Ethiopia", city: "Hawassa",
      address: "Hawassa Town, Tabor Road, Hawassa", phone: "+251 911 000 112", email: "hawassa@sudipost.com",
      hours: "Mon–Sat 08:30–17:00 (EAT)", lat: 7.0622, lon: 38.4764, pickup: true, weekend: false,
      services: ["International", "Student", "Parcel"], staff: 5 },

    { id: "nairobi", name: "Sudi-Post Nairobi Partner Point", type: "Partner Point", country: "Kenya", city: "Nairobi",
      address: "Eastleigh, Mosque Road, Nairobi, Kenya", phone: "+254 700 000 100", email: "nairobi@sudipost.com",
      hours: "Mon–Sat 08:00–18:00 (EAT)", lat: -1.2921, lon: 36.8219, pickup: true, weekend: true,
      services: ["International", "E-Commerce", "Parcel"], staff: 0, partner: true },

    { id: "kampala", name: "Sudi-Post Kampala Partner Point", type: "Partner Point", country: "Uganda", city: "Kampala",
      address: "Kampala Central, Plot 42, Uganda", phone: "+256 700 000 100", email: "kampala@sudipost.com",
      hours: "Mon–Sat 08:00–18:00 (EAT)", lat: 0.3476, lon: 32.5825, pickup: true, weekend: true,
      services: ["International", "E-Commerce", "Parcel"], staff: 0, partner: true }
  ];

  /* ---------------------------------------------------------------------
     NEWS
     --------------------------------------------------------------------- */
  const NEWS = [
    { id: "n1", cat: "Announcement", date: "2026-09-18", read: 4, featured: true, photo: "lau.jpg",
      title: "Sudi-Post launches scheduled Juba ⇄ Addis Ababa student package service",
      excerpt: "Starting this semester, students in South Sudan can consolidate family support parcels, documents and personal items into one scheduled shipment departing Juba every Tuesday and Thursday.",
      body: ["Sudi-Post has formally launched a scheduled student package service on the Juba to Addis Ababa corridor, responding to consistent demand from families sending support materials to students abroad.", "The service operates on a fixed weekly schedule: collections close on Mondays and Wednesdays, with parcels departing Juba on Tuesdays and Thursdays and arriving in Addis Ababa within three to six days depending on volume.", "Registered students receive a dedicated address book for family members in Ethiopia, consolidated invoicing, and status notifications by SMS and WhatsApp at every stage of the journey.", "Students can register at any Sudi-Post branch or through the customer portal. A valid student identification document is required for the student package rate."] },

    { id: "n2", cat: "New Location", date: "2026-09-05", read: 3, photo: "loc.jpg",
      title: "New Sudi-Post pickup point opens in Torit, Eastern Equatoria",
      excerpt: "Our newest Eastern Equatoria location brings parcel drop-off, express courier acceptance and pickup booking to Torit town centre.",
      body: ["Sudi-Post has opened a new branch in Torit, Eastern Equatoria State, expanding our footprint to seven South Sudan locations outside the capital.", "The Torit branch offers full domestic services, express courier acceptance, document delivery and scheduled pickup bookings for surrounding townships.", "The location operates Monday to Saturday, 08:00 to 17:30, with walk-in acceptance available throughout opening hours."] },

    { id: "n3", cat: "Service Update", date: "2026-08-27", read: 2, photo: "sca.jpg",
      title: "Improved scan frequency for all cross-border shipments",
      excerpt: "Every scan event on international shipments is now visible in the tracking portal within 30 minutes, with an expanded set of status labels.",
      body: ["We have upgraded our scanning cadence at Juba, Addis Ababa and partner hubs. International shipments now generate a scan event at each handover rather than at each daily batch.", "The tracking portal has been updated with clearer status labels, including a dedicated Arrived status for shipments that have reached the destination hub but are awaiting final delivery.", "Customers can subscribe to notifications by SMS, email or WhatsApp from the customer portal."] },

    { id: "n4", cat: "Partnership", date: "2026-08-12", read: 5,
      title: "Sudi-Post and Ethiopian regional carrier sign scheduled road freight agreement",
      excerpt: "A fixed three-day-a-week road freight schedule between Juba and Addis Ababa will improve predictability and reduce transit times.",
      body: ["Sudi-Post has signed a scheduled road freight partnership with a regional carrier operating between Juba and Addis Ababa.", "The agreement establishes three fixed departures per week with guaranteed loading capacity, replacing ad-hoc vehicle arrangements that previously caused unpredictable delays.", "For customers, the practical effect is a more reliable published transit time of three to six days door to door, and clearer exception handling when a departure is missed."] },

    { id: "n5", cat: "Customer Notice", date: "2026-07-30", read: 2,
      title: "Revised customs documentation guidance for international parcels",
      excerpt: "A clearer checklist for commercial and personal shipments leaving South Sudan, plus guidance on prohibited and restricted items.",
      body: ["International shipments require accurate customs declarations. To reduce holds at the border, we have published a simplified checklist for both personal and commercial consignments.", "Personal shipments require a full description of contents, quantity, weight and an approximate value. Commercial shipments additionally require a commercial invoice or proforma invoice on the sender's letterhead.", "Prohibited items include hazardous materials, perishables without cold chain, live animals, currency and counterfeit goods. Sudi-Post reserves the right to refuse any consignment that does not comply."] },

    { id: "n6", cat: "Announcement", date: "2026-07-14", read: 3,
      title: "Sudi-Post introduces proof of delivery photo capture for all staff handovers",
      excerpt: "Every delivery now records recipient name, time, signature and an optional photograph, strengthening accountability for our customers.",
      body: ["Sudi-Post delivery staff now record a full proof of delivery record at the point of handover: recipient name, date, time, signature and an optional photograph.", "Records are stored against the shipment reference and are available to the sender through the customer portal and on request at any branch.", "Where a recipient declines to sign, staff record the reason and escalate the shipment to a supervisor, and the customer is notified automatically."] },

    { id: "n7", cat: "New Service", date: "2026-06-22", read: 4,
      title: "Business logistics programme opens for corporates and NGOs",
      excerpt: "Recurring delivery contracts, dedicated account management, consolidated invoicing and SLA credits for organisations with regular shipment volumes.",
      body: ["We have launched a structured business logistics programme for corporates, NGOs and institutions with regular shipment volumes.", "Participating organisations receive a dedicated account manager, scheduled collections, consolidated monthly invoicing, and service level agreements with credits where targets are missed.", "The programme is built around three tiers — Business, Corporate and Enterprise — priced on committed monthly volume."] },

    { id: "n8", cat: "Service Update", date: "2026-06-04", read: 2, newsPhoto: "cash.jpg",
      title: "Payment on delivery now available across all South Sudan branches",
      excerpt: "Recipients may now pay cash, or via mobile money where supported, at the point of delivery for COD shipments.",
      body: ["Cash on delivery is now available at every Sudi-Post branch and pickup point in South Sudan.", "Where mobile money settlement is supported, the recipient's confirmation is recorded on the delivery agent's device and the shipment closes automatically once payment is confirmed.", "COD fees are shown transparently in the rate calculator before a shipment is booked."] }
  ];

  /* ---------------------------------------------------------------------
     SEED SHIPMENTS  (demo database)
     --------------------------------------------------------------------- */
  function t(iso) { return iso; }

  const SHIPMENTS = [
    {
      id: "SH-1001", tracking: "SUD-2026-000125", customerId: "C-1001", branchId: "juba-hq", driverId: "D-04",
      createdAt: t("2026-09-18T08:24:00"),
      sender:    { name: "Joseph Loro", phone: "+211977112233", email: "joseph.loro@example.com", address: "Munuki, Juba", city: "Juba" },
      receiver:  { name: "Rebecca Loro", phone: "+251911223344", email: "rebecca.loro@example.com", address: "Bole, Addis Ababa", city: "Addis Ababa" },
      origin: "Juba", destination: "Addis Ababa", type: "student", service: "express",
      weight: 12, dims: { l: 60, w: 40, h: 35 }, chargeable: 17.4,
      declaredValue: 450, cod: 0,
      status: "transit", currentLocation: "In transit — Juba → Addis Ababa scheduled line",
      estimatedDelivery: "2026-09-24",
      zoneId: "zone3", cost: 48500, payment: { status: "paid", method: "mobile-money", receipt: "RCP-2026-4411", paidAt: "2026-09-18T08:31:00" },
      pod: null, priority: "express",
      history: [
        { key: "created",    at: "2026-09-18T08:24:00", location: "Juba, South Sudan",            note: "Shipment request created online and reference issued." },
        { key: "received",   at: "2026-09-18T10:05:00", location: "Sudi-Post Head Office, Juba",  note: "Parcel weighed, inspected and checked in. 12 kg, 60×40×35 cm." },
        { key: "processing", at: "2026-09-18T14:40:00", location: "Juba Sorting Hub, Kobero",     note: "Sorted, labelled and manifested for the Addis Ababa line." },
        { key: "transit",    at: "2026-09-19T06:15:00", location: "Juba Logistics Terminal",      note: "Loaded to scheduled Juba → Addis Ababa road freight. Manifest AJ-0919." }
      ]
    },
    {
      id: "SH-1002", tracking: "SUD-2026-000124", customerId: "C-1001", branchId: "juba-hq", driverId: "D-04",
      createdAt: t("2026-09-16T11:02:00"),
      sender:   { name: "Joseph Loro", phone: "+211977112233", email: "joseph.loro@example.com", address: "Munuki, Juba", city: "Juba" },
      receiver: { name: "Anna Nyeko", phone: "+211977445566", email: "anna.nyeko@example.com", address: "Kuajok, Juba", city: "Juba" },
      origin: "Juba", destination: "Juba", type: "document", service: "express",
      weight: 0.6, dims: { l: 32, w: 23, h: 2 }, chargeable: 0.6,
      declaredValue: 0, cod: 0,
      status: "delivered", currentLocation: "Delivered — Kuajok, Juba",
      estimatedDelivery: "2026-09-16", deliveredAt: "2026-09-16T13:22:00",
      zoneId: "zone1", cost: 3300, payment: { status: "paid", method: "cash", receipt: "RCP-2026-4390", paidAt: "2026-09-16T13:25:00" },
      pod: { recipient: "Anna Nyeko", date: "2026-09-16", time: "13:22", signature: "A. Nyeko", photo: false, gps: { lat: 4.8656, lon: 31.6106 }, note: "Handed to recipient at office." },
      priority: "normal",
      history: [
        { key: "created",    at: "2026-09-16T11:02:00", location: "Juba, South Sudan",           note: "Shipment request created." },
        { key: "received",   at: "2026-09-16T11:20:00", location: "Sudi-Post Head Office, Juba", note: "Document received in tamper-evident pouch." },
        { key: "processing", at: "2026-09-16T11:45:00", location: "Juba Sorting Hub, Kobero",    note: "Priority sort for Juba metro." },
        { key: "transit",    at: "2026-09-16T12:30:00", location: "Juba Courier Fleet",          note: "Out with courier vehicle J-12." },
        { key: "arrived",    at: "2026-09-16T13:05:00", location: "Kuajok Delivery Zone, Juba",   note: "With delivery agent for final mile." },
        { key: "outfordeliv",at: "2026-09-16T13:10:00", location: "Kuajok, Juba",                 note: "Delivery agent departed branch." },
        { key: "delivered",  at: "2026-09-16T13:22:00", location: "Kuajok, Juba",                 note: "Delivered to Anna Nyeko. Signature captured." }
      ]
    },
    {
      id: "SH-1003", tracking: "SUD-2026-000123", customerId: "C-1002", branchId: "addis", driverId: "D-07",
      createdAt: t("2026-09-15T07:55:00"),
      sender:   { name: "Meron Tadesse", phone: "+251911334455", email: "meron@example.com", address: "Bole, Addis Ababa", city: "Addis Ababa" },
      receiver: { name: "Peter Deng", phone: "+211977778899", email: "peter.deng@example.com", address: "Kobero, Juba", city: "Juba" },
      origin: "Addis Ababa", destination: "Juba", type: "small", service: "standard",
      weight: 4.2, dims: { l: 40, w: 30, h: 20 }, chargeable: 4.2,
      declaredValue: 120, cod: 18000,
      status: "delayed", currentLocation: "Exception — held for customs clarification, Addis Ababa",
      estimatedDelivery: "2026-09-22",
      zoneId: "zone3", cost: 22000, payment: { status: "pending", method: "cod", receipt: "RCP-2026-4388", paidAt: null },
      pod: null, priority: "normal",
      history: [
        { key: "created",    at: "2026-09-15T07:55:00", location: "Addis Ababa, Ethiopia",       note: "Shipment created at Addis Ababa branch." },
        { key: "received",   at: "2026-09-15T09:10:00", location: "Sudi-Post Addis Ababa",      note: "Parcel received and weighed." },
        { key: "processing", at: "2026-09-15T11:00:00", location: "Bole Sorting Centre",         note: "Manifested for Juba line; customs form raised." },
        { key: "transit",    at: "2026-09-16T06:40:00", location: "Addis Ababa Logistics Depot", note: "Departed on scheduled Addis Ababa → Juba line." },
        { key: "arrived",    at: "2026-09-18T15:50:00", location: "Bole, Addis Ababa (return)",  note: "Returned to origin hub pending customs clarification on declared value." }
      ],
      exception: { type: "delayed", reason: "Customs clarification required: declared value of contents not itemised.", openedAt: "2026-09-18T15:55:00", owner: "Sudi-Post Addis Ababa" }
    },
    {
      id: "SH-1004", tracking: "SUD-2026-000122", customerId: "C-1003", branchId: "juba-kijuk", driverId: "D-02",
      createdAt: t("2026-09-14T16:12:00"),
      sender:   { name: "Grace Akwang", phone: "+211977123456", email: "grace@example.com", address: "Kuajok, Juba", city: "Juba" },
      receiver: { name: "Loro Enterprises Ltd", phone: "+211977009900", email: "orders@loroent.example", address: "Malakia Road, Juba", city: "Juba" },
      origin: "Juba", destination: "Juba", type: "medium", service: "standard",
      weight: 8, dims: { l: 50, w: 40, h: 30 }, chargeable: 8,
      declaredValue: 300, cod: 0,
      status: "outfordeliv", currentLocation: "Out for delivery — Malakia Road, Juba",
      estimatedDelivery: "2026-09-20",
      zoneId: "zone1", cost: 8900, payment: { status: "pending", method: "cod", receipt: "RCP-2026-4380", paidAt: null },
      pod: null, priority: "normal",
      history: [
        { key: "created",    at: "2026-09-14T16:12:00", location: "Juba, South Sudan",          note: "Shipment created." },
        { key: "received",   at: "2026-09-15T08:05:00", location: "Sudi-Post Kuajok Branch",     note: "Received and inspected." },
        { key: "processing", at: "2026-09-15T10:30:00", location: "Kuajok Branch, Juba",         note: "Sorted for Juba metro." },
        { key: "transit",    at: "2026-09-19T07:00:00", location: "Juba Sorting Hub, Kobero",   note: "Loaded to courier route J-07." },
        { key: "arrived",    at: "2026-09-19T09:15:00", location: "Malakia Delivery Zone",      note: "Arrived in delivery zone." },
        { key: "outfordeliv",at: "2026-09-19T09:40:00", location: "Malakia Road, Juba",         note: "Agent D-02 en route to consignee." }
      ]
    },
    {
      id: "SH-1005", tracking: "SUD-2026-000121", customerId: "C-1004", branchId: "juba-hq", driverId: "D-04",
      createdAt: t("2026-09-10T09:00:00"),
      sender:   { name: "Amina Hussein", phone: "+211977990011", email: "amina@example.com", address: "Hai Tong, Juba", city: "Juba" },
      receiver: { name: "Amina Hussein", phone: "+211977990011", email: "amina@example.com", address: "Hai Tong, Juba", city: "Juba" },
      origin: "Juba", destination: "Wau", type: "large", service: "standard",
      weight: 22, dims: { l: 70, w: 50, h: 45 }, chargeable: 26.4,
      declaredValue: 250, cod: 0,
      status: "delivered", currentLocation: "Delivered — Wau Commercial Area",
      estimatedDelivery: "2026-09-14", deliveredAt: "2026-09-14T14:10:00",
      zoneId: "zone2", cost: 32500, payment: { status: "paid", method: "mobile-money", receipt: "RCP-2026-4301", paidAt: "2026-09-10T09:20:00" },
      pod: { recipient: "Amina Hussein", date: "2026-09-14", time: "14:10", signature: "A. Hussein", photo: true, gps: { lat: 7.7, lon: 28.0 }, note: "Delivered to recipient at residence." },
      priority: "normal",
      history: [
        { key: "created",    at: "2026-09-10T09:00:00", location: "Juba, South Sudan",       note: "Shipment created." },
        { key: "received",   at: "2026-09-10T10:15:00", location: "Sudi-Post Head Office, Juba", note: "Received; volumetric weight applied." },
        { key: "processing", at: "2026-09-11T08:30:00", location: "Juba Sorting Hub, Kobero",  note: "Manifested for Wau regional line." },
        { key: "transit",    at: "2026-09-12T06:00:00", location: "Juba → Wau Road Line",     note: "Departed Juba." },
        { key: "arrived",    at: "2026-09-14T11:20:00", location: "Wau Branch",               note: "Arrived at Wau branch." },
        { key: "outfordeliv",at: "2026-09-14T13:20:00", location: "Wau Commercial Area",       note: "Agent departed branch." },
        { key: "delivered",  at: "2026-09-14T14:10:00", location: "Wau, South Sudan",         note: "Delivered to Amina Hussein. Signature and photo captured." }
      ]
    },
    {
      id: "SH-1006", tracking: "SUD-2026-000120", customerId: "C-1002", branchId: "dire-dawa", driverId: "D-08",
      createdAt: t("2026-09-12T13:40:00"),
      sender:   { name: "Meron Tadesse", phone: "+251911334455", email: "meron@example.com", address: "Dire Dawa, Ethiopia", city: "Dire Dawa" },
      receiver: { name: "Salma Maker", phone: "+211977554433", email: "salma@example.com", address: "Munuki, Juba", city: "Juba" },
      origin: "Dire Dawa", destination: "Juba", type: "document", service: "express",
      weight: 0.8, dims: { l: 30, w: 22, h: 3 }, chargeable: 0.8,
      declaredValue: 0, cod: 0,
      status: "processing", currentLocation: "Juba Sorting Hub, Kobero",
      estimatedDelivery: "2026-09-21",
      zoneId: "zone3", cost: 15600, payment: { status: "paid", method: "card", receipt: "RCP-2026-4355", paidAt: "2026-09-12T13:45:00" },
      pod: null, priority: "express",
      history: [
        { key: "created",    at: "2026-09-12T13:40:00", location: "Dire Dawa, Ethiopia",     note: "Shipment created." },
        { key: "received",   at: "2026-09-12T14:10:00", location: "Sudi-Post Dire Dawa",     note: "Documents received in sealed pouch." },
        { key: "processing", at: "2026-09-13T07:20:00", location: "Dire Dawa Logistics Hub",  note: "Manifested on express line." },
        { key: "transit",    at: "2026-09-14T05:30:00", location: "Dire Dawa → Juba",        note: "Departed on scheduled line." },
        { key: "arrived",    at: "2026-09-19T08:40:00", location: "Juba Sorting Hub, Kobero",note: "Arrived at destination hub; priority sort for Juba metro." }
      ]
    },
    {
      id: "SH-1007", tracking: "SUD-2026-000119", customerId: "C-1005", branchId: "juba-hq", driverId: "D-03",
      createdAt: t("2026-09-08T10:25:00"),
      sender:   { name: "Bol Maker", phone: "+211977222333", email: "bol@example.com", address: "Kobero, Juba", city: "Juba" },
      receiver: { name: "Joseph Loro", phone: "+251911223344", email: "joseph.loro@example.com", address: "Bole, Addis Ababa", city: "Addis Ababa" },
      origin: "Juba", destination: "Addis Ababa", type: "medium", service: "standard",
      weight: 9, dims: { l: 55, w: 40, h: 35 }, chargeable: 12.1,
      declaredValue: 380, cod: 0,
      status: "returned", currentLocation: "Returned to sender — Juba Head Office",
      estimatedDelivery: "2026-09-16",
      zoneId: "zone3", cost: 34000, payment: { status: "refunded", method: "mobile-money", receipt: "RCP-2026-4290", paidAt: "2026-09-08T10:40:00", refundedAt: "2026-09-19T12:00:00" },
      pod: null, priority: "normal",
      history: [
        { key: "created",    at: "2026-09-08T10:25:00", location: "Juba, South Sudan",        note: "Shipment created." },
        { key: "received",   at: "2026-09-08T11:10:00", location: "Sudi-Post Head Office, Juba", note: "Received and inspected." },
        { key: "processing", at: "2026-09-09T08:00:00", location: "Juba Sorting Hub, Kobero",  note: "Manifested for Addis Ababa line." },
        { key: "transit",    at: "2026-09-10T06:30:00", location: "Juba → Addis Ababa",       note: "Departed Juba." },
        { key: "arrived",    at: "2026-09-13T09:20:00", location: "Bole, Addis Ababa",         note: "Arrived at destination hub." },
        { key: "outfordeliv",at: "2026-09-14T10:00:00", location: "Bole, Addis Ababa",         note: "Three delivery attempts made without success." }
      ],
      exception: { type: "returned", reason: "Recipient unavailable at address on three attempts. Returned to sender unopened.", openedAt: "2026-09-15T16:00:00", owner: "Sudi-Post Addis Ababa" }
    },
    {
      id: "SH-1008", tracking: "SUD-2026-000118", customerId: "C-1001", branchId: "juba-hq", driverId: null,
      createdAt: t("2026-09-20T07:15:00"),
      sender:   { name: "Joseph Loro", phone: "+211977112233", email: "joseph.loro@example.com", address: "Munuki, Juba", city: "Juba" },
      receiver: { name: "Rebecca Loro", phone: "+251911223344", email: "rebecca.loro@example.com", address: "Bole, Addis Ababa", city: "Addis Ababa" },
      origin: "Juba", destination: "Addis Ababa", type: "student", service: "standard",
      weight: 15, dims: { l: 65, w: 45, h: 40 }, chargeable: 19.2,
      declaredValue: 500, cod: 0,
      status: "pending", currentLocation: "Awaiting pickup — sender address, Munuki",
      estimatedDelivery: "2026-09-27",
      zoneId: "zone3", cost: 52000, payment: { status: "pending", method: null, receipt: "RCP-2026-4425", paidAt: null },
      pod: null, priority: "normal", pickup: { requested: true, window: "2026-09-21T09:00", confirmed: false },
      history: [
        { key: "created", at: "2026-09-20T07:15:00", location: "Munuki, Juba", note: "Shipment request created. Pickup requested for 21 Sep, 09:00–11:00." }
      ]
    }
  ];

  /* ---------------------------------------------------------------------
     PEOPLE
     --------------------------------------------------------------------- */
  const CUSTOMERS = [
    { id: "C-1001", name: "Joseph Loro", email: "joseph.loro@example.com", phone: "+211977112233", city: "Juba", type: "Individual", since: "2024-03-11", shipments: 12, spent: 486500, verified: true, status: "active" },
    { id: "C-1002", name: "Meron Tadesse", email: "meron@example.com", phone: "+251911334455", city: "Addis Ababa", type: "Business", since: "2024-08-02", shipments: 47, spent: 2148600, verified: true, status: "active" },
    { id: "C-1003", name: "Grace Akwang", email: "grace@example.com", phone: "+211977123456", city: "Juba", type: "Business", since: "2025-01-19", shipments: 28, spent: 1182400, verified: true, status: "active" },
    { id: "C-1004", name: "Amina Hussein", email: "amina@example.com", phone: "+211977990011", city: "Juba", type: "Individual", since: "2023-11-05", shipments: 6, spent: 214300, verified: true, status: "active" },
    { id: "C-1005", name: "Bol Maker", email: "bol@example.com", phone: "+211977222333", city: "Juba", type: "Individual", since: "2025-06-30", shipments: 3, spent: 189700, verified: false, status: "active" },
    { id: "C-1006", name: "Nadia Elman", email: "nadia@southsunretail.example", phone: "+211977667788", city: "Juba", type: "Corporate", since: "2024-05-22", shipments: 84, spent: 5127400, verified: true, status: "active", tier: "Enterprise" },
    { id: "C-1007", name: "Peter Deng", email: "peter.deng@example.com", phone: "+211977778899", city: "Juba", type: "Individual", since: "2025-09-14", shipments: 2, spent: 44300, verified: true, status: "active" }
  ];

  const DRIVERS = [
    { id: "D-02", name: "Simon Loro",   phone: "+211977111002", branch: "juba-kijuk",   status: "active",   vehicle: "Motorcycle • R 778 B", assigned: 4, completed: 168, rating: 4.7, lat: 4.8656, lon: 31.6106 },
    { id: "D-03", name: "David Okot",   phone: "+211977111003", branch: "juba-hq",      status: "onbreak",  vehicle: "Van • R 220 D",        assigned: 2, completed: 132, rating: 4.6, lat: 4.8486, lon: 31.5406 },
    { id: "D-04", name: "James Bol",    phone: "+211977111004", branch: "juba-hq",      status: "active",   vehicle: "Motorcycle • R 090 A", assigned: 5, completed: 251, rating: 4.9, lat: 4.8594, lon: 31.5713 },
    { id: "D-05", name: "Victor Deng",  phone: "+211977111005", branch: "wau",          status: "active",   vehicle: "Pickup • WS 118",      assigned: 3, completed: 97,  rating: 4.5, lat: 7.7, lon: 28.0 },
    { id: "D-06", name: "Anthony Gai",  phone: "+211977111006", branch: "yei",          status: "active",   vehicle: "Motorcycle • R 331 F", assigned: 2, completed: 88,  rating: 4.6, lat: 4.5769, lon: 31.5589 },
    { id: "D-07", name: "Moses Bekele", phone: "+251911222001", branch: "addis",        status: "active",   vehicle: "Van • AA 4471",        assigned: 7, completed: 176, rating: 4.8, lat: 9.03, lon: 38.74 },
    { id: "D-08", name: "Sara Girma",   phone: "+251911222002", branch: "dire-dawa",    status: "offline",  vehicle: "Motorcycle • DD 220",  assigned: 1, completed: 74,  rating: 4.4, lat: 9.5931, lon: 41.8661 }
  ];

  /* ---------------------------------------------------------------------
     FINANCE
     --------------------------------------------------------------------- */
  const INVOICES = [
    { id: "INV-2026-0912", shipment: "SUD-2026-000125", customer: "Joseph Loro", amount: 48500, currency: "SSP", status: "paid",    issued: "2026-09-18", due: "2026-09-18", method: "Mobile Money", receipt: "RCP-2026-4411" },
    { id: "INV-2026-0911", shipment: "SUD-2026-000124", customer: "Joseph Loro", amount: 3300,  currency: "SSP", status: "paid",    issued: "2026-09-16", due: "2026-09-16", method: "Cash",         receipt: "RCP-2026-4390" },
    { id: "INV-2026-0910", shipment: "SUD-2026-000123", customer: "Meron Tadesse", amount: 22000, currency: "SSP", status: "pending", issued: "2026-09-15", due: "2026-09-22", method: "Cash on Delivery", receipt: "RCP-2026-4388" },
    { id: "INV-2026-0909", shipment: "SUD-2026-000122", customer: "Grace Akwang", amount: 8900,  currency: "SSP", status: "pending", issued: "2026-09-14", due: "2026-09-21", method: "Cash on Delivery", receipt: "RCP-2026-4380" },
    { id: "INV-2026-0908", shipment: "SUD-2026-000121", customer: "Amina Hussein", amount: 32500, currency: "SSP", status: "paid",   issued: "2026-09-10", due: "2026-09-14", method: "Mobile Money", receipt: "RCP-2026-4301" },
    { id: "INV-2026-0907", shipment: "SUD-2026-000119", customer: "Bol Maker", amount: 34000, currency: "SSP", status: "refunded", issued: "2026-09-08", due: "2026-09-16", method: "Mobile Money", receipt: "RCP-2026-4290" },
    { id: "INV-2026-0906", shipment: "SUD-2026-000118", customer: "Joseph Loro", amount: 52000, currency: "SSP", status: "pending", issued: "2026-09-20", due: "2026-09-27", method: "Unpaid",      receipt: "RCP-2026-4425" }
  ];

  const PAYMENT_METHODS = [
    { id: "mobile-money", label: "Mobile Money", desc: "MTN and Orange via Sudi-Post wallet", logo: "MM", currencies: ["SSP", "ETB"] },
    { id: "card",         label: "Bank Card",    desc: "Visa, Mastercard and UnionPay",      logo: "VISA", currencies: ["USD", "SSP", "ETB"] },
    { id: "bank",         label: "Bank Transfer",desc: "Direct to Sudi-Post current account", logo: "BANK", currencies: ["SSP", "ETB", "USD"] },
    { id: "cash",         label: "Cash at Branch", desc: "Pay at any Sudi-Post location",     logo: "CASH", currencies: ["SSP", "ETB"] },
    { id: "cod",          label: "Cash on Delivery", desc: "Recipient pays the delivery agent", logo: "COD", currencies: ["SSP"] }
  ];

  const PAYMENT_STATUSES = {
    unpaid:   { label: "Unpaid",   badge: "badge st-pending",  desc: "Checkout was closed before the money was received." },
    pending:  { label: "Pending",  badge: "badge st-pending",  desc: "Payment sent to the provider. Awaiting confirmation that the money was received." },
    paid:     { label: "Paid",     badge: "badge st-delivered",desc: "Money received and confirmed by the payment provider." },
    failed:   { label: "Failed",   badge: "badge st-delayed",  desc: "The provider declined the payment or it timed out." },
    refunded: { label: "Refunded", badge: "badge st-returned", desc: "Funds returned to the original payment method." }
  };

  /* ---------------------------------------------------------------------
     CONTENT BLOCKS
     --------------------------------------------------------------------- */
  const VALUES = [
    { icon: "shield-check", title: "Reliability", desc: "Published transit times, scheduled departures and a network that runs on a timetable — not on promises." },
    { icon: "check-circle", title: "Integrity",  desc: "Honest pricing, transparent status and a refusal to hide behind vague exceptions." },
    { icon: "users",       title: "Customer Service", desc: "Real people on the phone and on WhatsApp, in the languages our customers actually use." },
    { icon: "lock",         title: "Security",   desc: "Sealed parcels, chain-of-custody logging, signature capture and controlled branch access." },
    { icon: "lightbulb",    title: "Innovation", desc: "Online tracking, instant quotes, digital proof of delivery and API-ready architecture." },
    { icon: "clipboard",    title: "Accountability", desc: "Every shipment has a named owner, an audit trail and a measurable service level." }
  ];

  const PROCESS = [
    { num: "1", title: "Request & Quote", desc: "Book online, at any branch or by phone. Get an instant price and transit estimate before you commit.", icon: "clipboard" },
    { num: "2", title: "Collection",     desc: "Our agent collects from your door, or you drop off at any Sudi-Post location. Items are weighed and inspected.", icon: "truck" },
    { num: "3", title: "Sort & Dispatch",desc: "Parcels are sorted by destination, labelled, manifested and loaded to the next scheduled departure.", icon: "package" },
    { num: "4", title: "Track & Deliver",desc: "Follow every scan online. The recipient receives an SMS or WhatsApp alert, then signs on delivery.", icon: "map-pin" }
  ];

  const BUSINESS_SOLUTIONS = [
    { icon: "briefcase", title: "Corporate Deliveries", desc: "Scheduled document and parcel delivery to staff, clients and branches, with a named account manager and consolidated billing." },
    { icon: "layers",    title: "Bulk Shipments",     desc: "Priced on committed volume, with dedicated loading, manifesting and capacity reserved for your regular dispatch days." },
    { icon: "cart",      title: "E-Commerce Logistics",desc: "Order intake, dispatch, cash on delivery, customer notifications and reverse logistics for online sellers." },
    { icon: "file",      title: "Document Delivery",  desc: "Sealed, tracked and signature-confirmed document movement for legal, HR and procurement workflows." },
    { icon: "shopping-cart", title: "Procurement Delivery", desc: "Movement of goods from suppliers to your stores or sites, with receiving reports and discrepancy handling." },
    { icon: "package",   title: "Business Parcels",   desc: "Same-day and next-day services for urgent, high-value or time-critical consignments." },
    { icon: "repeat",    title: "Recurring Contracts", desc: "Fixed weekly or monthly collection and delivery schedules agreed in advance, billed on one invoice." },
    { icon: "settings",  title: "Customised Solutions", desc: "Route design, multi-stop collections, dedicated vehicles and warehouse handling built around your operation." }
  ];

  const FAQS = [
    { q: "How do I track my shipment?", a: "Enter your tracking number — in the format SUD-2026-000125 — on the Track & Trace page. You will see the sender, receiver, origin, destination, current status, estimated delivery date and the full shipment history timeline. Tracking is available without an account." },
    { q: "How long does delivery take?", a: "Juba metro is same day to one day. South Sudan regional routes are two to four days. The Juba to Addis Ababa corridor runs three to six days on scheduled road freight. International destinations are ten to twenty-one days depending on the country. Every quote shows an estimated delivery period." },
    { q: "How do I get a shipping price?", a: "Open the Shipping Rates calculator and enter your luggage weight. That is the only thing we need: the total is your weight in kilograms multiplied by 23,000 SSP, so 3 kg is 69,000 SSP and 3.5 kg is 80,500 SSP. There are no extra charges added to the calculator price." },
    { q: "Has my payment gone through?", a: "Not until the payment provider confirms it. As soon as you press Pay Now the status shows Payment Pending. It only changes to Paid when the provider confirms the money was received. If you close the payment page first it stays Pending and Unpaid, and if the payment is declined it shows Payment Failed with nothing charged." },
    { q: "Can I pay cash on delivery?", a: "Yes. Cash on delivery is available across all South Sudan branches and pickup points, and is shown transparently before you pay. Where mobile money settlement is supported, the agent records the provider confirmation on their device before the order is released." },
    { q: "Do you deliver to my address?", a: "Door-to-door delivery is available in Juba metro and at all branch service areas. Elsewhere, delivery is to the nearest Sudi-Post location or partner point. Use the Locations page to check the address before booking." },
    { q: "What should I do if my shipment is delayed?", a: "Check the tracking page first — exceptions are shown with a reason and the team handling them. If the delay is not explained, contact us on +211 977 000 199 or WhatsApp and quote your tracking number. We aim to acknowledge every exception within two hours during operating hours." },
    { q: "How is my parcel protected?", a: "Parcels are checked in against a reference, sorted under staff supervision and moved through a chain-of-custody log. Every delivery records recipient name, date, time and signature, with an optional photograph. Insurance is available as a percentage of declared value." },
    { q: "How do I open a business account?", a: "Submit the Business Solutions enquiry form or email business@sudipost.com with your monthly volume estimate. We respond with a tiered proposal — Business, Corporate or Enterprise — within one business day." }
  ];

  const TESTIMONIALS = [
    { name: "Rebecca Loro",        role: "Student, Addis Ababa",       rating: 5, text: "My family sends books and clothes from Juba every semester. The scheduled service means I stop guessing when a parcel will arrive, and I can see it moving on my phone." },
    { name: "Nadia Elman",         role: "Customer, South Sun Retail", rating: 5, text: "We moved eighty-four shipments in eight months on a corporate account. Consolidated invoicing alone saved our finance team a full day every month." },
    { name: "Bol Maker",           role: "E-commerce seller, Juba",   rating: 4, text: "Cash on delivery changed how I sell. Orders that fail are rare now because customers get a real tracking number instead of a promise." },
    { name: "Meron Tadesse",       role: "Importer, Addis Ababa",    rating: 5, text: "A customs hold on one shipment was flagged to me the same day with the exact reason and what was needed. That transparency is rare in this corridor." },
    { name: "Amina Hussein",       role: "Regular customer, Juba",   rating: 5, text: "The photo and signature on delivery settled a family argument about a missing parcel. I could show exactly who received it and when." },
    { name: "Peter Deng",          role: "NGO coordinator, Juba",     rating: 4, text: "Field supplies reach our county offices without me chasing vehicles. The scheduled collection windows have made our planning much easier." }
  ];

  const STATS = {
    shipments: 18420,
    delivered: 17120,
    inTransit: 940,
    pending: 268,
    delayed: 92,
    customers: 4310,
    activeRequests: 168,
    revenue: 148520000,
    branches: 17,
    staff: 214,
    cities: 12,
    countries: 4,
    onTimeRate: 94.6,
    satisfaction: 4.8
  };

  /* ---------------------------------------------------------------------
     HELPERS
     --------------------------------------------------------------------- */
  const MONTHLY_VOLUME = [
    { month: "Mar", standard: 1180, express: 420 },
    { month: "Apr", standard: 1240, express: 470 },
    { month: "May", standard: 1320, express: 510 },
    { month: "Jun", standard: 1280, express: 560 },
    { month: "Jul", standard: 1410, express: 590 },
    { month: "Aug", standard: 1520, express: 640 },
    { month: "Sep", standard: 1640, express: 715 }
  ];

  const CORRIDOR_SCHEDULE = [
    { day: "Monday",    depart: "Juba → Addis Ababa", time: "07:00", note: "Collection closes Sunday 18:00" },
    { day: "Tuesday",   depart: "Addis Ababa → Juba", time: "07:30", note: "Student package priority load" },
    { day: "Wednesday", depart: "Juba → Addis Ababa", time: "07:00", note: "General freight" },
    { day: "Thursday",  depart: "Addis Ababa → Juba", time: "07:30", note: "Student package priority load" },
    { day: "Friday",    depart: "Juba → Addis Ababa", time: "07:00", note: "Express and documents" },
    { day: "Saturday",  depart: "Addis Ababa → Juba", time: "08:00", note: "Weekend clearance run" }
  ];

  /* ---------------------------------------------------------------------
     FORMATTING
     --------------------------------------------------------------------- */
  function money(amount, currency) {
    const cur = currency || BRAND.currency;
    const n = Math.round(Number(amount) || 0);
    return cur + " " + n.toLocaleString("en-US");
  }
  function usd(amount) {
    const n = Math.round((Number(amount) || 0) / BRAND.usdRate * 100) / 100;
    return "US$ " + n.toFixed(2);
  }
  function date(value, opts) {
    if (!value) return "—";
    const d = new Date(value);
    if (isNaN(d)) return String(value);
    return d.toLocaleDateString("en-GB", opts || { day: "2-digit", month: "short", year: "numeric" });
  }
  function dateTime(value) {
    if (!value) return "—";
    const d = new Date(value);
    if (isNaN(d)) return String(value);
    return date(value, { day: "2-digit", month: "short", year: "numeric" }) + " · " +
           d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  }
  function timeOnly(value) {
    const d = new Date(value);
    return isNaN(d) ? "—" : d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  }
  function relative(value) {
    const d = new Date(value);
    if (isNaN(d)) return "—";
    const diff = Date.now() - d.getTime();
    const m = Math.round(diff / 60000);
    if (Math.abs(m) < 60) return m <= 0 ? "just now" : m + " min ago";
    const h = Math.round(m / 60);
    if (Math.abs(h) < 24) return h + (h > 0 ? " hrs ago" : " hrs");
    const days = Math.round(h / 24);
    return days + (days > 0 ? " days ago" : " days");
  }

  /* ---------------------------------------------------------------------
     RATE ENGINE
     --------------------------------------------------------------------- */
  function volumetricWeight(dims) {
    if (!dims || !dims.l || !dims.w || !dims.h) return 0;
    return (Number(dims.l) * Number(dims.w) * Number(dims.h)) / 5000;
  }

  /* Fixed luggage tariff: total = weight (kg) x 23,000 SSP.
     Fractional kilograms are charged pro rata (3.5 KG = 80,500 SSP). */
  function luggageQuote(weight) {
    const w = Math.max(0, parseFloat(weight) || 0);
    return {
      currency: LUGGAGE.currency,
      perKg: LUGGAGE.perKg,
      weight: w,
      chargeable: Math.round(w * 100) / 100,
      total: Math.round(w * LUGGAGE.perKg),
      note: LUGGAGE.note
    };
  }

  function findZone(origin, destination) {
    const dest = String(destination || "").toLowerCase();
    for (let i = 0; i < ZONES.length; i++) {
      if (ZONES[i].destinations.some(function (d) { return dest.indexOf(d.toLowerCase()) !== -1; })) return ZONES[i];
    }
    const org = String(origin || "").toLowerCase();
    if (org.indexOf("juba") !== -1 && dest.indexOf("juba") !== -1) return ZONES[0];
    for (let i = 0; i < ZONES.length; i++) {
      if (ZONES[i].destinations.some(function (d) { return org.indexOf(d.toLowerCase()) !== -1; })) return ZONES[i];
    }
    return ZONES[1];
  }

  /**
   * calculateQuote(input) -> structured quotation
   * Replace with: POST /api/v1/quotes  (server must own pricing)
   */
  function calculateQuote(input) {
    const i = input || {};
    const zone = i.zoneId ? ZONES.filter(function (z) { return z.id === i.zoneId; })[0] : findZone(i.origin, i.destination);
    const speed = SERVICES_SPEEDS.filter(function (s) { return s.id === (i.speed || "standard"); })[0] || SERVICES_SPEEDS[0];
    const ptype = PACKAGE_TYPES.filter(function (p) { return p.id === (i.packageType || "small"); })[0] || PACKAGE_TYPES[1];

    const weight = Math.max(0.1, Number(i.weight) || 0.1);
    const vol = volumetricWeight(i.dims);
    const chargeable = Math.max(weight, vol, 0.5);

    const freight = zone.base + chargeable * zone.perKg;
    const typeAdj = freight * (ptype.mult - 1);
    const speedAdj = freight * (speed.mult - 1);
    const subTotal = ptype.base + freight + typeAdj + speedAdj;

    const extras = [];
    const selected = i.surcharges || [];
    SURCHARGES.forEach(function (s) {
      if (selected.indexOf(s.id) === -1) return;
      let amount = 0;
      if (s.id === "insurance") amount = (Number(i.declaredValue) || 0) * s.rate;
      else if (s.id === "remote") amount = subTotal * s.rate;
      else amount = s.rate;
      if (amount > 0) extras.push({ id: s.id, label: s.label, amount: Math.round(amount) });
    });

    const serviceFee = Math.round(subTotal * 0.05);
    const extrasTotal = extras.reduce(function (a, b) { return a + b.amount; }, 0);
    const total = Math.round(subTotal + extrasTotal + serviceFee);

    const [lo, hi] = zone.transit.replace(/[^0-9–-]/g, "").split("–");
    let minDays = parseInt(lo, 10);
    let maxDays = parseInt(hi, 10);
    if (isNaN(minDays)) minDays = 2;
    if (isNaN(maxDays)) maxDays = minDays;
    if (speed.id === "express") { minDays = Math.max(1, minDays + speed.addDays[0]); maxDays = Math.max(minDays, maxDays + speed.addDays[1]); }

    const depart = new Date();
    depart.setDate(depart.getDate() + 1);
    const arrive = new Date();
    arrive.setDate(arrive.getDate() + maxDays);

    return {
      zone: zone,
      speed: speed,
      packageType: ptype,
      volumetric: Math.round(vol * 10) / 10,
      chargeable: Math.round(chargeable * 10) / 10,
      lines: [
        { label: "Base handling — " + zone.name, amount: Math.round(ptype.base) },
        { label: "Freight — " + chargeable + " kg chargeable (" + (vol > weight ? "volumetric" : "actual") + ")", amount: Math.round(freight) },
        { label: speed.label + " speed adjustment", amount: Math.round(speedAdj) }
      ].filter(function (l) { return l.amount !== 0; }),
      packageAdj: Math.round(typeAdj),
      extras: extras,
      extrasTotal: extrasTotal,
      serviceFee: serviceFee,
      total: total,
      currency: BRAND.currency,
      transit: { min: minDays, max: maxDays, label: minDays + "–" + maxDays + " business days" },
      departBy: depart.toISOString(),
      arriveBy: arrive.toISOString(),
      included: [
        "Online tracking to " + zone.name,
        speed.id === "express" ? "Priority handling and dispatch" : "Scheduled line-haul and standard handling",
        "SMS notification at dispatch and delivery",
        "Proof of delivery on signature",
        "Declared-value handling up to USD 5,000"
      ]
    };
  }

  /* ---------------------------------------------------------------------
     SHIPMENT HELPERS
     --------------------------------------------------------------------- */
  let sequence = 126;
  function nextTracking() {
    sequence += 1;
    const y = new Date().getFullYear();
    return "SUD-" + y + "-" + String(sequence).padStart(6, "0");
  }

  function stepIndex(history) {
    const keys = (history || []).map(function (h) { return h.key; });
    if (keys.indexOf("delivered") !== -1) return 7;
    if (keys.indexOf("outfordeliv") !== -1) return 6;
    if (keys.indexOf("arrived") !== -1) return 5;
    if (keys.indexOf("transit") !== -1) return 4;
    if (keys.indexOf("processing") !== -1) return 3;
    if (keys.indexOf("received") !== -1) return 2;
    return 1;
  }

  function normaliseTracking(input) {
    return String(input || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  }

  global.SP = {
    BRAND: BRAND,
    STATUSES: STATUSES,
    TRACK_STEPS: TRACK_STEPS,
    SERVICES: SERVICES,
    ZONES: ZONES,
    SERVICES_SPEEDS: SERVICES_SPEEDS,
    PACKAGE_TYPES: PACKAGE_TYPES,
    SURCHARGES: SURCHARGES,
    LOCATIONS: LOCATIONS,
    NEWS: NEWS,
    SHIPMENTS: SHIPMENTS,
    CUSTOMERS: CUSTOMERS,
    DRIVERS: DRIVERS,
    INVOICES: INVOICES,
    PAYMENT_METHODS: PAYMENT_METHODS,
    PAYMENT_STATUSES: PAYMENT_STATUSES,
    VALUES: VALUES,
    PROCESS: PROCESS,
    BUSINESS_SOLUTIONS: BUSINESS_SOLUTIONS,
    FAQS: FAQS,
    TESTIMONIALS: TESTIMONIALS,
    STATS: STATS,
    MONTHLY_VOLUME: MONTHLY_VOLUME,
    CORRIDOR_SCHEDULE: CORRIDOR_SCHEDULE,
    fmt: { money: money, usd: usd, date: date, dateTime: dateTime, time: timeOnly, relative: relative },
    rates: { calculate: calculateQuote, findZone: findZone, volumetricWeight: volumetricWeight, luggage: luggageQuote },
    luggage: LUGGAGE,
    ship: { nextTracking: nextTracking, stepIndex: stepIndex, normaliseTracking: normaliseTracking },
    /* ---- API seam: swap these for real HTTP calls ---- */
    API: {
      getShipments: function () { return Promise.resolve(SP.SHIPMENTS.slice()); },
      getShipment: function (tracking) {
        const key = SP.ship.normaliseTracking(tracking);
        const found = SP.SHIPMENTS.filter(function (s) { return SP.ship.normaliseTracking(s.tracking) === key; })[0];
        return Promise.resolve(found || null);
      },
      listLocations: function () { return Promise.resolve(SP.LOCATIONS.slice()); },
      listNews: function () { return Promise.resolve(SP.NEWS.slice()); }
    }
  };
})(window);
