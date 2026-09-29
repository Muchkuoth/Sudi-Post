/* ==========================================================================
   SUDI-POST — UI Kernel
   Icons, navigation, toasts, modals, validation, reveal, counters, helpers.
   No dependencies. ~ single file loaded on every page.
   ========================================================================== */
(function (global) {
  "use strict";

  /* =====================================================================
     1. ICON SYSTEM (inline SVG — zero network requests)
     ===================================================================== */
  const P = {
    /* interface */
    menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    "chevron-down": '<path d="m6 9 6 6 6-6"/>',
    "chevron-right": '<path d="m9 18 6-6-6-6"/>',
    "chevron-left": '<path d="m15 18-6-6 6-6"/>',
    "arrow-right": '<path d="M5 12h14M12 5l7 7-7 7"/>',
    "arrow-left": '<path d="M19 12H5M12 19l-7-7 7-7"/>',
    "arrow-up-right": '<path d="M7 17 17 7M7 7h10v10"/>',
    "external-link": '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    filter: '<path d="M3 5h18l-7 8v6l-4 2v-8Z"/>',
    "more-horizontal": '<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-3-6.7M21 4v5h-5"/>',
    print: '<path d="M6 9V3h12v6M6 18H4a1 1 0 0 1-1-1v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a1 1 0 0 1-1 1h-2"/><path d="M6 14h12v7H6z"/>',
    download: '<path d="M12 3v12M7 11l5 5 5-5M4 20h16"/>',
    upload: '<path d="M12 21V9M7 13l5-5 5 5M4 4h16"/>',
    edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',

    /* status */
    "check-circle": '<circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
    "alert-circle": '<circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.5v.01"/>',
    alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    timer: '<path d="M12 8v4l2.5 1.5"/><circle cx="12" cy="13" r="8"/><path d="M9 2h6"/>',
    flag: '<path d="M4 22V3M4 4h13l-2 4 2 4H4"/>',
    inbox: '<path d="M3 12h5l2 3h4l2-3h5"/><path d="M4.5 5.5 3 12v6a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-6l-1.5-6.5A1 1 0 0 0 18.5 5h-13a1 1 0 0 0-1 .5Z"/>',
    undo: '<path d="M3 8h11a5 5 0 0 1 0 10H7"/><path d="m6 5-3 3 3 3"/>',
    "trending-up": '<path d="m3 17 6-6 4 4 8-8"/><path d="M14 7h7v7"/>',
    "trending-down": '<path d="m3 7 6 6 4-4 8 8"/><path d="M14 17h7v-7"/>',

    /* logistics */
    truck: '<path d="M2 6h11v10H2zM13 9h4l3 3v4h-7z"/><circle cx="6" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
    package: '<path d="m12 2 8 4v12l-8 4-8-4V6Z"/><path d="m4 6 8 4 8-4M12 10v12"/>',
    box: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M8 6V4h8v2"/>',
    "box-open": '<path d="M3 9.5 12 4l9 5.5V20H3Z"/><path d="M3 9.5 12 15l9-5.5M12 15v5"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5Z"/><path d="m3 13 9 5 9-5M3 17.5 12 22l9-4.5"/>',
    container: '<rect x="2" y="6" width="20" height="13" rx="1.5"/><path d="M6 6v13M10 6v13M14 6v13M18 6v13M2 10h20M2 15h20"/>',
    route: '<circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="5" r="2.5"/><path d="M8.5 19H15a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h6.5"/>',
    "map-pin": '<path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/>',
    pin: '<path d="M9 3h6l-1 6 3.5 3.5V15h-11v-2.5L10 9Z"/><path d="M12 15v6"/>',
    megaphone: '<path d="M3 11v2a1 1 0 0 0 1 1h2l3 6h2l-2-6h1l8 4V4l-8 4H4a1 1 0 0 0-1 1v2Z"/><path d="M18 8a4 4 0 0 1 0 8"/>',
    "file-text": '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
    "user-plus": '<path d="M15 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M19 8v6M16 11h6"/>',
    "eye-off": '<path d="M10.6 6.2A9.9 9.9 0 0 1 12 6c5 0 9 4.5 10 6-.4.6-1.3 2-3 3.4M6.6 6.6C4 8.2 2.3 10.4 2 12c1 1.5 5 6 10 6 1.7 0 3.2-.5 4.5-1.2"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M2 2l20 20"/>',
    building: '<path d="M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16"/><path d="M15 9h4a1 1 0 0 1 1 1v11M3 21h18M8 8h3M8 12h3M8 16h3M17 13h1M17 17h1"/>',
    handshake: '<path d="m11 17 2 2 3-3 3 3 4-4-8-8-3 3-2-2-4 4 3 3Z"/><path d="m8 13 3 3M6 11l-4 4 3 3"/>',
    navigation: '<path d="M3 11 21 3l-8 18-2-8Z"/>',
    home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/>',
    walk: '<circle cx="13" cy="4" r="1.8"/><path d="m10 21 2-6 3 3 1 3M12 15l-1-5 3-2 3 2M11 10 8 8"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z"/>',
    send: '<path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4Z"/>',
    repeat: '<path d="m17 2 4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/>',
    "calendar-check": '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18M9 15l2 2 4-4"/>',

    /* commerce & docs */
    cart: '<circle cx="9" cy="20" r="1.6"/><circle cx="18" cy="20" r="1.6"/><path d="M2 3h3l2.4 12.4A2 2 0 0 0 9.4 17h8.5a2 2 0 0 0 2-1.6L21.5 7H6"/>',
    "shopping-cart": '<circle cx="9" cy="20" r="1.6"/><circle cx="18" cy="20" r="1.6"/><path d="M2 3h3l2.4 12.4A2 2 0 0 0 9.4 17h8.5a2 2 0 0 0 2-1.6L21.5 7H6"/><path d="M9 9h7M9 13h5"/>',
    file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
    clipboard: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 12h6M9 16h4"/>',
    briefcase: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M2 13h20"/>',
    receipt: '<path d="M5 3v18l2.5-1.5L10 21l2-1.5L14 21l2.5-1.5L19 21V3H5Z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
    "credit-card": '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>',
    wallet: '<path d="M3 7a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><path d="M16 12h3"/>',
    "credit-card-alt": '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',

    /* trust & security */
    shield: '<path d="M12 2 4 5.5V11c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5.5Z"/>',
    "shield-check": '<path d="M12 2 4 5.5V11c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5.5Z"/><path d="m9 12 2 2 4-4"/>',
    lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="m10.8 12.2 8-8M17 6l2 2M14.5 8.5l2 2"/>',
    verified: '<path d="m12 2 2.2 2.1 3-.4 1 2.9 2.8 1.4-1.2 2.9 1.2 2.9-2.8 1.4-1 2.9-3-.4L12 22l-2.2-2.1-3 .4-1-2.9L3 16l1.2-2.9L3 10.2 5.8 8.8l1-2.9 3 .4Z"/><path d="m9 12 2 2 4-4"/>',
    scale: '<path d="M12 3v18M7 21h10M3 8h18"/><path d="m3 8-2 6a3 3 0 0 0 6 0Zm18 0-2 6a3 3 0 0 0 6 0Z"/>',

    /* people */
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2 21a7 7 0 0 1 14 0"/><path d="M17 4.5a3.5 3.5 0 0 1 0 7M18 21h4a6 6 0 0 0-4-5.6"/>',
    headset: '<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="2" y="13" width="4" height="7" rx="2"/><rect x="18" y="13" width="4" height="7" rx="2"/><path d="M20 20a4 4 0 0 1-4 4h-3"/>',
    graduation: '<path d="m12 4 10 5-10 5L2 9Z"/><path d="M6 11v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5M22 9v6"/>',

    /* contact */
    phone: '<path d="M4 3h4l2 5-2.5 1.5a12 12 0 0 0 5 5L14 12l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 1-2Z"/>',
    "phone-call": '<path d="M4 3h4l2 5-2.5 1.5a12 12 0 0 0 5 5L14 12l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 1-2Z"/><path d="M16 3h3l1 3-2 1"/><path d="M18 12v3M16.5 13.5h3"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2.5 6.5 9.5 7 9.5-7"/>',
    message: '<path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"/>',
    bell: '<path d="M18 8a6 6 0 1 0-12 0c0 6-3 7-3 7h18s-3-1-3-7"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
    login: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="m10 17 5-5-5-5M15 12H3"/>',

    /* misc */
    zap: '<path d="M13 2 4 14h7l-1 8 9-12h-7Z"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.5l6.1-.9Z"/>',
    quote: '<path d="M9 7H5a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h2v1a2 2 0 0 1-2 2H4M18 7h-4a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h2v1a2 2 0 0 1-2 2h-1"/>',
    lightbulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.5.4.8 1 .8 1.6V16h5.4v-.5c0-.6.3-1.2.8-1.6A6 6 0 0 0 12 3Z"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
    chart: '<path d="M3 3v18h18"/><path d="M7 15v-3M12 15V7M17 15v-6"/>',
    "bar-chart": '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    pie: '<path d="M21 15.5A9 9 0 1 1 8.5 3v9Z"/><path d="M15.5 3.5A9 9 0 0 1 21 9h-9Z"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    database: '<ellipse cx="12" cy="5.5" rx="8" ry="3"/><path d="M4 5.5v13c0 1.7 3.6 3 8 3s8-1.3 8-3v-13"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>',
    camera: '<path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><circle cx="12" cy="13" r="3.6"/>',
    pen: '<path d="M12 19h8"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    cloud: '<path d="M17.5 19a4.5 4.5 0 0 0 .3-9 6.5 6.5 0 0 0-12.4 2A4 4 0 0 0 6 19Z"/>',
    sparkles: '<path d="m12 3 1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6Z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8Z"/>',
    percent: '<path d="M19 5 5 19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>',
    barcode: '<path d="M3 5v14M6.5 5v14M10 5v10M13.5 5v14M17 5v10M20.5 5v14"/>',
    wifi: '<path d="M2 8.5a16 16 0 0 1 20 0M5 12a11 11 0 0 1 14 0M8.5 15.5a6 6 0 0 1 7 0"/><circle cx="12" cy="19" r="1.2"/>',
    "signal-off": '<path d="m2 2 20 20M8.5 15.5a6 6 0 0 1 5-1.3M5 12a11 11 0 0 1 3-1.8M2 8.5A16 16 0 0 1 6 6M12 19h.01"/><path d="M19 5a16 16 0 0 1 3 1.5"/>',
    globe2: '<path d="M12 2v20M2 12h20"/><circle cx="12" cy="12" r="9"/>',

    /* social (filled) */
    facebook: '<path fill="currentColor" stroke="none" d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.7l-.4 2.9h-2.3v7A10 10 0 0 0 22 12Z"/>',
    x: '<path fill="currentColor" stroke="none" d="M17.5 3h3.1l-6.8 7.8L22 21h-6.2l-4.9-6.4L5.2 21H2.1l7.3-8.3L2 3h6.4l4.4 5.8Zm-1.1 16.1h1.7L7.7 4.8H5.9Z"/>',
    instagram: '<rect fill="currentColor" stroke="none" x="2.5" y="2.5" width="19" height="19" rx="5.5"/><circle cx="12" cy="12" r="4.2" fill="none" stroke="#fff" stroke-width="1.8"/><circle cx="17.4" cy="6.6" r="1.3" fill="#fff" stroke="none"/>',
    linkedin: '<path fill="currentColor" stroke="none" d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3ZM9.5 9h3.8v1.7h.05c.53-.95 1.83-1.95 3.77-1.95 4.03 0 4.78 2.5 4.78 5.76V21h-4v-5.7c0-1.36-.03-3.1-1.98-3.1-1.98 0-2.28 1.47-2.28 3V21h-4Z"/>',
    youtube: '<path fill="currentColor" stroke="none" d="M21.6 7.2a2.5 2.5 0 0 0-1.76-1.77C18.28 5 12 5 12 5s-6.28 0-7.84.43A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.76 1.77C5.72 19 12 19 12 19s6.28 0 7.84-.43a2.5 2.5 0 0 0 1.76-1.77A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8ZM10 15.2V8.8l5.5 3.2Z"/>',
    whatsapp: '<path fill="currentColor" stroke="none" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.05-1.3A10 10 0 1 0 12 2Zm5.8 14.1c-.25.7-1.45 1.34-2 1.39-.5.05-1.13.09-1.83-.11a16.6 16.6 0 0 1-1.66-.61 12.5 12.5 0 0 1-5.72-5.03c-.44-.76-1-1.66-1.02-2.6-.02-.9.42-1.75.8-2.15a.83.83 0 0 1 .6-.28h.43c.14 0 .32-.05.5.38.19.45.63 1.54.68 1.65.06.11.09.24.02.39-.07.14-.1.23-.2.35-.11.12-.23.27-.33.36-.11.09-.23.2-.1.38.13.19.59.97 1.26 1.57.87.77 1.6 1.01 1.83 1.13.23.11.36.09.5-.06.13-.14.57-.66.72-.9.15-.23.3-.19.5-.12.2.07 1.29.61 1.51.72.23.11.38.17.44.26.05.09.05.5-.2 1.2Z"/>'
  };

  function icon(name, cls, opts) {
    const o = opts || {};
    const d = P[name] || P[name + "-alt"] || P.box;
    const filled = /facebook|^x$|instagram|linkedin|youtube|whatsapp/.test(name);
    return '<svg class="icon' + (cls ? " " + cls : "") + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false"' +
      (filled ? ' fill="currentColor"' : ' fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"') +
      (o.size ? ' width="' + o.size + '" height="' + o.size + '"' : "") + ">" + d + "</svg>";
  }

  /* =====================================================================
     2. DOM HELPERS
     ===================================================================== */
  const $  = function (sel, root) { return (root || document).querySelector(sel); };
  const $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  function el(tag, attrs, html) {
    const node = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === "class") node.className = attrs[k];
      else if (k === "dataset") Object.keys(attrs[k]).forEach(function (d) { node.dataset[d] = attrs[k][d]; });
      else if (k.indexOf("on") === 0 && typeof attrs[k] === "function") node.addEventListener(k.slice(2), attrs[k]);
      else node.setAttribute(k, attrs[k]);
    });
    if (html !== undefined) node.innerHTML = html;
    return node;
  }
  function esc(s) {
    return String(s === undefined || s === null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function debounce(fn, ms) {
    let t;
    return function () {
      const args = arguments, ctx = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, args); }, ms || 200);
    };
  }

  /* =====================================================================
     3. TOASTS
     ===================================================================== */
  function toastRegion() {
    let r = $(".toast-region");
    if (!r) { r = el("div", { class: "toast-region", role: "status", "aria-live": "polite" }); document.body.appendChild(r); }
    return r;
  }
  function toast(message, type, title) {
    const t = type || "info";
    const node = el("div", { class: "toast toast--" + t },
      '<span>' + icon(t === "success" ? "check-circle" : t === "error" ? "alert-circle" : "info") + "</span>" +
      "<div>" + (title ? '<div class="toast__title">' + esc(title) + "</div>" : "") +
      '<div class="toast__body">' + esc(message) + "</div></div>");
    toastRegion().appendChild(node);
    setTimeout(function () {
      node.classList.add("is-leaving");
      setTimeout(function () { node.remove(); }, 240);
    }, 4200);
    return node;
  }

  /* =====================================================================
     4. MODAL
     ===================================================================== */
  const modalStack = [];
  function openModal(content, opts) {
    const o = opts || {};
    const modal = el("div", { class: "modal", role: "dialog", "aria-modal": "true", "aria-label": o.title || "Dialog" },
      '<div class="modal__panel' + (o.wide ? " modal__panel--wide" : "") + '">' +
        '<div class="modal__header">' +
          "<div><h2 class=\"modal__title\">" + esc(o.title || "") + (o.subtitle ? '<div class="text-sm text-muted mt-1">' + esc(o.subtitle) + "</div>" : "") + "</h2></div>" +
          '<button class="modal__close" type="button" aria-label="Close dialog">' + icon("close") + "</button>" +
        "</div>" +
        '<div class="modal__body">' + content + "</div>" +
        (o.footer ? '<div class="modal__footer">' + o.footer + "</div>" : "") +
      "</div>");
    document.body.appendChild(modal);
    document.body.classList.add("is-locked");
    requestAnimationFrame(function () { modal.classList.add("is-open"); });
    const close = function () {
      modal.classList.remove("is-open");
      document.body.classList.remove("is-locked");
      setTimeout(function () { modal.remove(); }, 220);
      document.removeEventListener("keydown", onKey);
      const i = modalStack.indexOf(modal);
      if (i > -1) modalStack.splice(i, 1);
      if (o.onClose) o.onClose();
    };
    const onKey = function (e) { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    $(".modal__close", modal).addEventListener("click", close);
    modal.addEventListener("mousedown", function (e) { if (e.target === modal) close(); });
    modalStack.push(modal);
    const focusable = $("input,select,textarea,button,a[href]", modal);
    setTimeout(function () { if (focusable) focusable.focus(); }, 120);
    return { el: modal, close: close };
  }
  function closeAllModals() { modalStack.slice().forEach(function (m) { $(".modal__close", m).click(); }); }

  /* =====================================================================
     5. FORM VALIDATION
     Rules: { required, email, min, max, minlen, maxlen, pattern, tel, match }
     ===================================================================== */
  const VALIDATORS = {
    required: function (v) { return String(v).trim().length > 0; },
    email:    function (v) { return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(String(v).trim()); },
    tel:      function (v) { return /^[+]?[\d\s()-]{7,20}$/.test(String(v).trim()); },
    minlen:   function (v, r) { return String(v).trim().length >= r; },
    maxlen:   function (v, r) { return String(v).trim().length <= r; },
    min:      function (v, r) { return parseFloat(v) >= r; },
    max:      function (v, r) { return parseFloat(v) <= r; },
    int:      function (v) { return /^-?\d+$/.test(String(v).trim()); },
    /* Counts digits only, so a value the field itself groups for readability
       (e.g. a card number shown as "4111 1111 1111 1111") still validates. */
    digits:   function (v, r) { return new RegExp("^\\d{" + r + ",}$").test(String(v).replace(/\s+/g, "")); },
    pattern:  function (v, r) { return new RegExp(r).test(String(v).trim()); },
    match:    function (v, r, data) { return String(v) === String(data ? data[r] : ""); },
    nofuture: function (v) { return !v || new Date(v) <= new Date(); }
  };

  const MESSAGES = {
    required: "This field is required.",
    email: "Enter a valid email address, e.g. name@example.com",
    tel: "Enter a valid phone number including country code.",
    minlen: function (r) { return "Must be at least " + r + " characters."; },
    maxlen: function (r) { return "Must be " + r + " characters or fewer."; },
    min: function (r) { return "Must be at least " + r + "."; },
    max: function (r) { return "Must be " + r + " or less."; },
    int: "Enter a whole number.",
    digits: function (r) { return "Enter at least " + r + " digits."; },
    pattern: "Please check the format.",
    match: function (r) { return "Must match the " + String(r).replace("password", "password") + " field."; }
  };

  function fieldWrap(input) { return input.closest(".field") || input.closest(".form-group") || input.parentElement; }

  function validateField(input) {
    const wrap = fieldWrap(input);
    if (!wrap || input.type === "hidden") return true;
    const rules = (input.dataset.rules || "").split("|").filter(Boolean);
    if (!rules.length) return true;

    let ok = true, message = "";
    for (let i = 0; i < rules.length; i++) {
      const parts = rules[i].split(":");
      const name = parts[0], arg = parts.slice(1).join(":");
      const fn = VALIDATORS[name];
      if (!fn) continue;
      const val = input.type === "checkbox" ? (input.checked ? "on" : "") : input.value;
      if (!fn(val, arg, getData(input.form))) {
        ok = false;
        message = typeof MESSAGES[name] === "function" ? MESSAGES[name](arg) : (MESSAGES[name] || "Invalid value.");
        break;
      }
    }
    wrap.classList.toggle("is-invalid", !ok);
    wrap.classList.toggle("is-valid", ok);
    const err = $(".field-error", wrap);
    if (err) err.innerHTML = icon("alert-circle") + "<span>" + esc(message) + "</span>";
    input.setAttribute("aria-invalid", ok ? "false" : "true");
    return ok;
  }

  function getData(form) {
    const out = {};
    if (!form) return out;
    $$("input,select,textarea", form).forEach(function (f) {
      if (!f.name) return;
      if (f.type === "checkbox") { if (f.dataset.group) out[f.dataset.group] = f.checked; else out[f.name] = f.checked; }
      else if (f.type === "radio") { if (f.checked) out[f.name] = f.value; }
      else out[f.name] = f.value;
    });
    return out;
  }

  function validateForm(form) {
    let valid = true, firstBad = null;
    const requiredGroups = {};
    $$("input,select,textarea", form).forEach(function (f) {
      if (f.type === "hidden" || f.disabled) return;
      if ((f.dataset.rules || "").indexOf("required") === -1) return;
      if (f.type === "checkbox" && f.dataset.group) {
        const group = requiredGroups[f.dataset.group] || (requiredGroups[f.dataset.group] = []);
        group.push(f);
        return;
      }
      if (!validateField(f)) { valid = false; if (!firstBad) firstBad = f; }
    });
    Object.keys(requiredGroups).forEach(function (g) {
      const boxes = requiredGroups[g];
      const any = boxes.some(function (b) { return b.checked; });
      const wrap = fieldWrap(boxes[0]);
      if (wrap) wrap.classList.toggle("is-invalid", !any);
      if (!any) { valid = false; if (!firstBad) firstBad = boxes[0]; }
    });
    if (firstBad) {
      firstBad.focus();
      firstBad.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    return valid;
  }

  function bindValidation(form) {
    form.setAttribute("novalidate", "novalidate");
    $$("input,select,textarea", form).forEach(function (f) {
      f.addEventListener("blur", function () { validateField(f); });
      f.addEventListener("input", debounce(function () {
        const wrap = fieldWrap(f);
        if (wrap && wrap.classList.contains("is-invalid")) validateField(f);
      }, 220));
      f.addEventListener("change", function () { validateField(f); });
    });
  }

  function setLoading(button, loading, label) {
    if (!button) return;
    if (loading) {
      button.dataset.original = button.innerHTML;
      button.disabled = true;
      button.innerHTML = '<span class="spinner"></span><span>' + esc(label || "Working…") + "</span>";
    } else {
      button.disabled = false;
      if (button.dataset.original) button.innerHTML = button.dataset.original;
    }
  }

  /* =====================================================================
     6. NAVIGATION
     ===================================================================== */
  function initNav() {
    const toggle = $(".nav-toggle");
    const nav = $("#primaryNav");
    if (!toggle || !nav) return;

    let scrim = $(".nav-scrim");
    if (!scrim) { scrim = el("div", { class: "nav-scrim" }); document.body.appendChild(scrim); }

    function open() {
      nav.classList.add("is-open");
      scrim.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
      document.body.classList.add("is-locked");
    }
    function close() {
      nav.classList.remove("is-open");
      scrim.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      document.body.classList.remove("is-locked");
    }
    toggle.addEventListener("click", function () {
      if (toggle.getAttribute("aria-expanded") === "true") close(); else open();
    });
    scrim.addEventListener("click", close);
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && nav.classList.contains("is-open")) close(); });
    window.addEventListener("resize", debounce(function () {
      if (window.innerWidth > 1080) close();
    }, 180));
  }

  function initStickyHeader() {
    const header = $(".site-header");
    if (!header) return;
    const onScroll = function () { header.classList.toggle("is-stuck", window.scrollY > 8); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  function markActiveNav() {
    const path = window.location.pathname.split("/").pop() || "index.html";
    $$(".nav__link").forEach(function (a) {
      const href = (a.getAttribute("href") || "").split("/").pop();
      if (href === path) a.setAttribute("aria-current", "page");
    });
    /* Also mark links nested inside a dropdown, and flag the group they live in
       so the collapsed trigger still shows where you are. */
    $$(".nav__sublink").forEach(function (a) {
      const href = (a.getAttribute("href") || "").split("/").pop();
      if (href !== path) return;
      a.setAttribute("aria-current", "page");
      const group = a.closest(".nav__item--menu, .account-menu");
      if (group) group.classList.add("is-current");
    });
  }

  /* ---------------------------------------------------------------- dropdowns
     Closed panels are display:none, so nothing inside them is tabbable; that
     is why focus-in opens the group rather than the panel just being visible. */
  function initNavMenus() {
    const triggers = $$("[data-menu-trigger]");
    if (!triggers.length) return;

    const HOVER_OK = "(hover: hover) and (min-width: 1081px)";
    const hoverOk = function () { return window.matchMedia(HOVER_OK).matches; };
    const itemOf = function (t) { return t.closest(".nav__item--menu, .account-menu"); };
    const isOpen = function (t) { return t.getAttribute("aria-expanded") === "true"; };

    function panel(t) {
      const id = t.getAttribute("aria-controls");
      return id ? document.getElementById(id) : null;
    }
    function setOpen(t, open) {
      const item = itemOf(t);
      if (!item) return;
      t.setAttribute("aria-expanded", open ? "true" : "false");
      item.classList.toggle("is-open", !!open);
    }
    function closeAll(except) {
      triggers.forEach(function (t) { if (t !== except) setOpen(t, false); });
    }
    function openTriggers() { return triggers.filter(isOpen); }

    triggers.forEach(function (trigger) {
      const item = itemOf(trigger);
      if (!item) return;

      trigger.addEventListener("click", function (e) {
        e.preventDefault();
        const open = !isOpen(trigger);
        closeAll(trigger);
        setOpen(trigger, open);
      });

      item.addEventListener("mouseenter", function () {
        if (!hoverOk()) return;
        closeAll(trigger);
        setOpen(trigger, true);
      });
      item.addEventListener("mouseleave", function () {
        if (!hoverOk()) return;
        setOpen(trigger, false);
      });

      item.addEventListener("focusin", function () { setOpen(trigger, true); });
      item.addEventListener("focusout", function (e) {
        if (item.contains(e.relatedTarget)) return;
        setOpen(trigger, false);
      });

      trigger.addEventListener("keydown", function (e) {
        if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
        const p = panel(trigger);
        if (!p) return;
        e.preventDefault();
        closeAll(trigger);
        setOpen(trigger, true);
        const links = $$("a, button", p);
        const i = links.indexOf(document.activeElement);
        const n = e.key === "ArrowDown" ? i + 1 : (i <= 0 ? links.length : i - 1);
        links[Math.max(0, n) % links.length].focus();
      });
    });

    document.addEventListener("click", function (e) {
      if (openTriggers().length && !e.target.closest("[data-menu-trigger]")) closeAll(null);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape" || !openTriggers().length) return;
      const wasOpen = openTriggers();
      closeAll(null);
      wasOpen[wasOpen.length - 1].focus();
    });

    /* Leaving the drawer breakpoint must not strand a rotated chevron. */
    window.addEventListener("resize", debounce(function () {
      if (window.innerWidth > 1080) closeAll(null);
    }, 180));
  }

  /* Account panel reflects sign-in state: guests see Sign in / Create account,
     signed-in users see their portal and Sign out. */
  function initAccountLink() {
    const trigger = $("[data-account-trigger]");
    const label = $("[data-account-label]");
    const link = $("[data-account-link]");
    const guestItems = $$("[data-guest-only]");
    const authItems = $$("[data-auth-only]");
    if (!trigger && !link) return;

    function apply(user) {
      guestItems.forEach(function (n) { n.hidden = !!user; });
      authItems.forEach(function (n) { n.hidden = !user; });

      if (!user) {
        if (label) label.textContent = "Login";
        if (trigger) trigger.setAttribute("title", "Sign in or create an account");
        if (link) link.setAttribute("href", "account.html");
        return;
      }
      if (label) label.textContent = user.name.split(" ")[0];
      if (trigger) trigger.setAttribute("title", "Signed in as " + user.name);
      const home = user.role === "admin" ? "admin.html"
                 : user.role === "driver" ? "driver.html" : "account.html";
      if (link) {
        link.setAttribute("href", home);
        link.setAttribute("title", "Open your " + user.role + " portal");
      }
    }

    apply(global.SP && SP.auth ? SP.auth.current() : null);

    const signOut = $("[data-sign-out]");
    if (signOut) signOut.addEventListener("click", function () {
      if (global.SP && SP.auth) SP.auth.logout();
      apply(null);
      if (label) label.textContent = "Login";
    });
  }

  /* =====================================================================
     7. MOTION & OBSERVERS
     ===================================================================== */
  /* Page scripts render cards, stats and counters after boot() has run, so a
     one-shot pass over the DOM misses anything created later. This watches for
     new nodes and hands each one to `fn` exactly once, then stops. */
  function onAdded(selector, fn) {
    if (!("MutationObserver" in window)) return;
    const seen = new WeakSet();
    $$ (selector).forEach(function (n) { seen.add(n); fn(n); });
    const mo = new MutationObserver(function () {
      const fresh = $$(selector).filter(function (n) { return !seen.has(n); });
      if (!fresh.length) return;
      fresh.forEach(function (n) { seen.add(n); fn(n); });
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  function initReveal() {
    const showAll = function () {
      $$(".reveal").forEach(function (n) { n.classList.add("is-visible"); });
    };
    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      showAll();
      onAdded(".reveal", function (n) { n.classList.add("is-visible"); });
      return;
    }

    const show = function (n) {
      const d = parseInt(n.dataset.revealDelay || "0", 10);
      setTimeout(function () { n.classList.add("is-visible"); }, d);
    };

    /* threshold 0 with a positive bottom margin: the old threshold of 0.12
       asked for 12% of the element to be visible, which an element taller than
       roughly 8x the viewport can never satisfy, so it stayed at opacity 0
       forever. Anything already on screen is shown immediately rather than
       waiting for a callback that may never arrive. */
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        show(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0, rootMargin: "0px 0px 8% 0px" });

    /* home.js and the page renderers inject .reveal cards after boot(), so
       those are wired up as they arrive instead of staying invisible. */
    onAdded(".reveal", function (n) {
      const b = n.getBoundingClientRect();
      if (b.top < window.innerHeight * 1.05 && b.bottom > 0) show(n);
      else io.observe(n);
    });

    /* Failsafe: if the observer never reports (throttled tab, restored scroll
       position, a container that clips its children), reveal everything a
       moment later. Text must never depend on an animation to become legible. */
    setTimeout(showAll, 2500);
    window.addEventListener("beforeprint", showAll);
  }

  function countUp(node) {
    /* A node can be reached by the observer, by the failsafe and by a late
       render; counting it twice restarts the animation. */
    if (node.dataset.counted) return;
    node.dataset.counted = "1";
    const target = parseFloat(node.dataset.count);
    if (isNaN(target)) return;
    const decimals = (node.dataset.count.split(".")[1] || "").length;
    const prefix = node.dataset.prefix || "";
    const suffix = node.dataset.suffix || "";
    const dur = parseInt(node.dataset.duration || "1600", 10);
    const render = function (value) {
      node.textContent = prefix + value.toLocaleString("en-US", {
        minimumFractionDigits: decimals, maximumFractionDigits: decimals
      }) + suffix;
    };
    const start = performance.now();
    function frame(now) {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      render(target * eased);
      if (p < 1) requestAnimationFrame(frame);
    }
    render(0);
    if (typeof window.requestAnimationFrame === "function") requestAnimationFrame(frame);
    /* Guarantee the real number. requestAnimationFrame is paused in a
       background tab and in headless rendering, which would otherwise leave a
       visible, permanently wrong "0" where a statistic belongs. */
    setTimeout(function () { render(target); }, dur + 150);
  }

    function initCounters() {
      /* about.js, locations.js and business.js build these after boot() has
         run, so a snapshot of the DOM at start-up is never complete. */
      const runAll = function () { $$("[data-count]").forEach(countUp); };
      if (!("IntersectionObserver" in window) ||
          window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        runAll();
        onAdded("[data-count]", countUp);
        return;
      }
      /* threshold 0: a 0.4 ratio is unreachable for a tall element, and a
         counter that never runs leaves a visible, wrong "0" on the page. */
      const io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          countUp(entry.target);
          io.unobserve(entry.target);
        });
      }, { threshold: 0, rootMargin: "0px 0px 8% 0px" });
      onAdded("[data-count]", function (n) {
        const b = n.getBoundingClientRect();
        if (b.top < window.innerHeight * 1.05 && b.bottom > 0) countUp(n);
        else io.observe(n);
      });
      /* a counter left showing "0" is worse than one that never animated */
      setTimeout(runAll, 2500);
    }

    function initBars() {
      const nodes = $$("[data-bar]");
      if (!nodes.length) return;
      const set = function (n) { n.style.width = (n.dataset.bar || 0) + "%"; };
      const setAll = function () { nodes.forEach(set); };
      if (!("IntersectionObserver" in window) ||
          window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setAll(); return; }
      const io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          setTimeout(function () { set(entry.target); }, 90);
          io.unobserve(entry.target);
        });
      }, { threshold: 0, rootMargin: "0px 0px 8% 0px" });
      nodes.forEach(function (n) {
        var b = n.getBoundingClientRect();
        if (b.top < window.innerHeight * 1.05 && b.bottom > 0) set(n);
        else io.observe(n);
      });
      /* a bar stuck at 0% reads as "no data", so back it up with a timeout */
      setTimeout(setAll, 2500);
  }

  /* =====================================================================
     8. TABS / ACCORDION / FILTERS
     ===================================================================== */
  function initTabs() {
    $$("[data-tabs]").forEach(function (group) {
      const tabs = $$('[role="tab"]', group);
      tabs.forEach(function (tab) {
        tab.addEventListener("click", function () {
          tabs.forEach(function (t) {
            t.setAttribute("aria-selected", "false");
            t.setAttribute("tabindex", "-1");
            const panel = document.getElementById(t.getAttribute("aria-controls"));
            if (panel) panel.hidden = true;
          });
          tab.setAttribute("aria-selected", "true");
          tab.setAttribute("tabindex", "0");
          const panel = document.getElementById(tab.getAttribute("aria-controls"));
          if (panel) panel.hidden = false;
        });
        tab.addEventListener("keydown", function (e) {
          const i = tabs.indexOf(tab);
          let next = null;
          if (e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
          if (e.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
          if (next) { e.preventDefault(); next.focus(); next.click(); }
        });
      });
    });
  }

  function initChips(onChange) {
    $$("[data-chips]").forEach(function (group) {
      group.addEventListener("click", function (e) {
        const chip = e.target.closest(".chip");
        if (!chip) return;
        $$(".chip", group).forEach(function (c) { c.classList.remove("is-active"); c.setAttribute("aria-pressed", "false"); });
        chip.classList.add("is-active");
        chip.setAttribute("aria-pressed", "true");
        if (onChange) onChange(chip.dataset.value, chip);
      });
    });
  }

  function initYear() {
    $$("[data-year]").forEach(function (n) { n.textContent = new Date().getFullYear(); });
  }

  /* Replace <i data-icon="name"> with inline SVG so markup stays small */
  function hydrateIcons(root) {
    $$("[data-icon]", root).forEach(function (n) {
      n.innerHTML = icon(n.dataset.icon);
      n.removeAttribute("data-icon");
    });
  }

  /* =====================================================================
     9. RENDER HELPERS (shared templates)
     ===================================================================== */
  function statusBadge(key) {
    const s = SP.STATUSES[key] || SP.STATUSES.pending;
    return '<span class="' + s.badge + '">' + esc(s.label) + "</span>";
  }
  function paymentBadge(key) {
    const p = SP.PAYMENT_STATUSES[key] || SP.PAYMENT_STATUSES.pending;
    return '<span class="' + p.badge + '">' + esc(p.label) + "</span>";
  }
  function locationById(id) {
    return SP.LOCATIONS.filter(function (l) { return l.id === id; })[0];
  }
  function driverById(id) {
    return SP.DRIVERS.filter(function (d) { return d.id === id; })[0];
  }
  function serviceIcon(id) {
    const s = SP.SERVICES.filter(function (x) { return x.id === id; })[0];
    return s ? s.icon : "package";
  }
  /* Service photograph plate. Pass the service object; falls back to the
     line icon if the service has no photo or the file fails to load. */
  function servicePhoto(s, cls) {
    var iconHtml = icon(s && s.icon);
    var photo = s && s.photo
      ? '<img src="assets/img/' + s.photo + '" alt="" loading="lazy" decoding="async" onerror="this.remove()">'
      : "";
    return '<span class="' + cls + '">' + iconHtml + photo + "</span>";
  }
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function () { return true; })
        .catch(function () { return legacyCopy(text); });
    }
    return Promise.resolve(legacyCopy(text));
  }
  function legacyCopy(text) {
    const ta = el("textarea", { style: "position:fixed;opacity:0" });
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    ta.remove();
    return ok;
  }

  /* =====================================================================
     10. BOOT
     ===================================================================== */
  function initModalActions() {
    document.addEventListener("click", function (e) {
      const closer = e.target.closest("[data-modal-close]");
      if (closer) {
        const panel = closer.closest(".modal");
        if (panel) {
          const btn = $(".modal__close", panel);
          if (btn) btn.click();
        }
        return;
      }
      if (e.target.closest("[data-print]")) window.print();
    });
  }

  /* ---------------------------------------------------------------- plates --
     Every framed photo on the site holds a fixed shape with the picture cropped
     to fill it, so a photo whose shape disagrees with its frame loses the part
     that mattered: a landscape shot of a person forced into a circle keeps about
     half the frame, and a 2:3 portrait in a 3:2 banner keeps roughly 37% of
     itself. Both read as a mistake rather than a crop.

     So a framed photo now takes the shape of its own picture, within limits, and
     crops only what falls outside them. Measure each photo once it has loaded
     and hand its ratio to CSS through --plate-ar. These frames are injected from
     data at runtime on several pages, so watch for new ones instead of only
     running at boot. */
  const PHOTO_FRAMES = ".photo-plate, .service-card__icon--photo, .icon-box--photo";
  const fittedFrames = new WeakSet();
  /* how far a frame may stretch away from square to follow its photo. A person
     gets a taller band, a shared banner a narrower one, so neither one odd
     photo can take over its row. */
  const FOLLOW = {
    person: [0.85, 1.9],
    wide: [0.8, 1.55],
    thumb: [0.72, 1.7]
  };

  function follow(frame, range) {
    const img = frame.querySelector("img");
    if (!img || !img.naturalWidth) return;
    const ar = img.naturalWidth / img.naturalHeight;
    frame.style.setProperty("--plate-ar", Math.min(range[1], Math.max(range[0], ar)).toFixed(3));
  }

  function fitFrame(frame) {
    if (fittedFrames.has(frame)) return;
    const img = frame.querySelector("img");
    if (!img) return;
    fittedFrames.add(frame);

    function apply() {
      if (!img.naturalWidth) return;
      if (frame.classList.contains("photo-plate--person")) return follow(frame, FOLLOW.person);
      if (frame.classList.contains("photo-plate--wide")) return follow(frame, FOLLOW.wide);
      if (frame.classList.contains("service-card__icon--photo") || frame.classList.contains("icon-box--photo")) {
        follow(frame, FOLLOW.thumb);
      }
    }

    if (img.complete && img.naturalWidth) apply();
    else img.addEventListener("load", apply, { once: true });
    img.addEventListener("error", function () { fittedFrames.delete(frame); });
  }

  function fitPlates(scope) {
    (scope || document).querySelectorAll(PHOTO_FRAMES).forEach(fitFrame);
    if (scope || !global.MutationObserver) return;
    new MutationObserver(function (records) {
      for (const r of records) {
        for (const n of r.addedNodes) {
          if (n.nodeType !== 1) continue;
          if (n.matches && n.matches(PHOTO_FRAMES)) fitFrame(n);
          if (n.querySelectorAll) n.querySelectorAll(PHOTO_FRAMES).forEach(fitFrame);
        }
      }
    }).observe(document.body, { childList: true, subtree: true });
  }

  function boot() {
  initNav();
  initNavMenus();
  initStickyHeader();
    markActiveNav();
    initAccountLink();
    initTabs();
    initChips();
    initYear();
    initReveal();
    initCounters();
    initBars();
    initModalActions();
    hydrateIcons();
    fitPlates();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  /* ---------------------------------------------------------------- utils -- */
  /** safe same-origin navigation (refuses absolute/protocol-relative targets) */
  function redirect(path, delay) {
    const target = String(path || "index.html");
    if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.indexOf("//") === 0 || target.charAt(0) === "/") {
      return;
    }
    if (delay) { setTimeout(function () { location.href = target; }, delay); return; }
    location.href = target;
  }

  /** SSP money formatter — 0 decimals, thin-space thousands */
  function money(amount) {
    const n = Number(amount) || 0;
    return "SSP " + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  }

  /** ISO date -> "12 Aug 2026" */
  function today(iso) {
    const d = iso ? new Date(iso) : new Date();
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  }

  /** pre-filled WhatsApp deep link (wa.me, no third-party script) */
  function waLink(text) {
    const number = (SP.BRAND && SP.BRAND.whatsapp) || "";
    return "https://wa.me/" + number + "?text=" + encodeURIComponent(text || "");
  }

  /* ======================================================================
     PAYMENT STATE MACHINE
     ----------------------------------------------------------------------
     One rule governs this whole module: a payment can only become "paid"
     when the payment PROVIDER confirms the money was received. The
     customer's Pay button can never set "paid" on its own.

     Legal transitions
       (start)  -> unpaid            nothing chosen yet / closed without paying
       unpaid   -> pending           customer pressed Pay Now
       pending  -> paid              PROVIDER confirmed receipt of funds
       pending  -> failed            provider declined, or the intent expired
       pending  -> unpaid            customer closed the page without paying
       failed   -> pending           customer retries
       paid     -> (terminal)        receipt + tracking already issued
     ====================================================================== */
  const PAY_STATES = ["unpaid", "pending", "paid", "failed"];
  const PAY_TRANSITIONS = {
    unpaid:  ["pending"],
    pending: ["paid", "failed", "unpaid"],
    failed:  ["pending"],
    paid:    []
  };

  /* The pending state deliberately does NOT resolve on a timer. A real
     deployment clears it from the provider webhook / callback (SP.API).
     Here that confirmation is an explicit, visible action so the state
     change is always attributable to the provider, never to a click. */
  function createPaymentSession(opts) {
    const o = opts || {};
    const listeners = [];
    const session = {
      ref: o.ref || ("PAY-" + Date.now().toString(36).toUpperCase()),
      amount: Number(o.amount) || 0,
      weight: o.weight == null ? null : Number(o.weight),
      method: null,
      status: "unpaid",
      receipt: null,
      tracking: null,
      providerRef: null,
      history: [{ status: "unpaid", at: new Date().toISOString() }]
    };

    function emit(reason) {
      listeners.forEach(function (fn) {
        try { fn(session, reason); } catch (e) { /* never break the flow */ }
      });
    }

    function move(next, reason, extra) {
      if (PAY_TRANSITIONS[session.status].indexOf(next) === -1) {
        return { ok: false, reason: "illegal transition " + session.status + " -> " + next };
      }
      session.status = next;
      if (extra) Object.assign(session, extra);
      session.history.push({ status: next, at: new Date().toISOString(), reason: reason });
      emit(reason);
      return { ok: true };
    }

    session.on = function (fn) { listeners.push(fn); return session; };

    session.selectMethod = function (id) {
      if (session.status === "paid") return { ok: false, reason: "already paid" };
      session.method = id;
      return { ok: true };
    };

    /* Customer presses Pay Now. This ONLY opens the payment intent. */
    session.payNow = function (methodId) {
      if (methodId) session.method = methodId;
      if (!session.method) return { ok: false, reason: "no payment method chosen" };
      if (session.amount <= 0) return { ok: false, reason: "amount must be greater than zero" };
      return move("pending", "customer clicked Pay Now", { providerRef: null });
    };

    /* The payment provider reports the outcome. This is the ONLY way in. */
    session.providerConfirm = function (result) {
      const r = result || {};
      if (session.status !== "pending") {
        return { ok: false, reason: "cannot confirm from " + session.status };
      }
      if (r.ok === true) {
        const stamp = Date.now().toString(36).slice(-4).toUpperCase();
        return move("paid", "provider confirmed receipt", {
          providerRef: r.providerRef || ("PRV-" + stamp),
          receipt: "RCP-" + stamp,
          tracking: SP.ship.nextTracking(),
          paidAt: new Date().toISOString()
        });
      }
      return move("failed", r.reason || "provider declined the payment", {
        providerRef: r.providerRef || null,
        failure: r.reason || "Payment was declined by the provider."
      });
    };

    /* Customer closed the provider page or navigated away without paying. */
    session.customerAbandoned = function () {
      if (session.status !== "pending") return { ok: false, reason: "not pending" };
      return move("unpaid", "checkout closed before payment");
    };

    session.isPaid = function () { return session.status === "paid"; };
    session.canPayNow = function () { return session.status === "unpaid" || session.status === "failed"; };
    session.awaitingProvider = function () { return session.status === "pending"; };

    return session;
  }

  /* Visual treatment for a payment state. Pending and unpaid are both
     amber, failed is red, paid is green -- matching the published flow. */
  function payStateView(status) {
    const map = {
      unpaid:  { tone: "warn",   label: "Payment Pending / Unpaid", icon: "clock",
                 blurb: "No money has been received yet. Complete payment to secure your shipment." },
      pending: { tone: "warn",   label: "Payment Pending", icon: "clock",
                 blurb: "Sent to the payment provider. We will mark this Paid only once they confirm the money arrived." },
      paid:    { tone: "ok",     label: "Payment Successful", icon: "check-circle",
                 blurb: "Money received and confirmed by the payment provider." },
      failed:  { tone: "danger", label: "Payment Failed", icon: "alert",
                 blurb: "The provider could not take the payment. Nothing was charged. You can try again." }
    };
    return map[status] || map.unpaid;
  }

  /* Expose */
  global.SP = global.SP || {};
  Object.assign(global.SP, {
    icon: icon, ICONS: P, $: $, $$: $$, el: el, esc: esc, debounce: debounce,
    toast: toast, openModal: openModal, closeAllModals: closeAllModals,
    validateForm: validateForm, validateField: validateField, bindValidation: bindValidation,
    getData: getData, setLoading: setLoading, countUp: countUp,
    statusBadge: statusBadge, paymentBadge: paymentBadge,
    locationById: locationById, driverById: driverById, serviceIcon: serviceIcon,
    servicePhoto: servicePhoto,
    copyText: copyText, initTabs: initTabs, initChips: initChips, initReveal: initReveal,
    initCounters: initCounters, initBars: initBars, hydrateIcons: hydrateIcons,
    fitPlates: fitPlates,
    waLink: waLink, redirect: redirect, money: money, today: today,
    PAY_STATES: PAY_STATES, createPaymentSession: createPaymentSession, payStateView: payStateView
  });
})(window);
