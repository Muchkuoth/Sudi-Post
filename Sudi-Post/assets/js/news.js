/* ==========================================================================
   SUDI-POST — News & updates
   ========================================================================== */
(function () {
  "use strict";
  const { icon, $, $$, esc, openModal, toast, debounce } = SP;
  const F = SP.fmt;

  const state = { cat: "all", q: "" };
  let featured = null;

  const CAT_ICON = {
    "Announcement": "megaphone",
    "New Location": "map-pin",
    "Service Update": "refresh",
    "Partnership": "handshake",
    "Customer Notice": "alert",
    "New Service": "sparkles"
  };
  const CAT_BADGE = {
    "Announcement": "badge--navy",
    "New Location": "badge--success",
    "Service Update": "badge--info",
    "Partnership": "badge--purple",
    "Customer Notice": "badge--warning",
    "New Service": "badge--gold"
  };
  /* Photo per category. A per-article `newsPhoto` overrides this, so the two
     Service Update stories can differ (scanning vs payment on delivery). */
  const CAT_PHOTO = {
    "Announcement": "pipo.jpg",
    "New Location": "loc.jpg",
    "Service Update": "sca.jpg",
    "Partnership": "pat.jpg",
    "Customer Notice": "Do.png",
    "New Service": "Do.png"
  };
  function photoOf(n) { return n.newsPhoto || CAT_PHOTO[n.cat] || null; }

  function cats() {
    const list = ["all"];
    SP.NEWS.forEach(function (n) { if (list.indexOf(n.cat) === -1) list.push(n.cat); });
    return list;
  }

  /* ------------------------------------------------------------- renderers */
  function renderFeatured() {
    featured = SP.NEWS.filter(function (n) { return n.featured; })[0] || SP.NEWS[0];
    const host = $("#newsFeatured");
    /* The media box is styled for a cover photo (.news-featured__media > img),
       but nothing emitted one, so the largest element on the page rendered as
       an empty navy rectangle with a small logo floating in it. */
    const photo = photoOf(featured);
    host.innerHTML = '' +
    '<div class="news-featured__media">' +
      (photo ? '<img src="assets/img/' + photo + '" alt="" loading="lazy" decoding="async" onerror="this.remove()">' : '') +
      '<div class="text-center" style="position:relative;z-index:1;padding:var(--sp-6) var(--sp-5)">' +
        '<div class="news-featured__mark">' +
          '<img src="assets/img/logo.jpg" alt="Sudi-Post" width="240" height="155" loading="lazy" decoding="async" onerror="this.remove()">' +
        "</div>" +
        '<p class="text-sm mt-5" style="color:var(--sp-navy-200)">' + F.date(featured.date) + " · " +
          featured.read + " min read</p>" +
      "</div>" +
    "</div>" +
    '<div class="news-featured__body">' +
      '<span class="news-card__cat">' + esc(featured.cat) + "</span>" +
      "<h3>" + esc(featured.title) + "</h3>" +
      '<p class="lead mt-4">' + esc(featured.excerpt) + "</p>" +
      '<div class="flex flex-wrap gap-3 mt-6">' +
        '<button class="btn btn--gold" type="button" data-read="' + featured.id + '">Read the announcement' +
          icon("arrow-right", "", { size: 16 }) + "</button>" +
        '<a class="btn btn--outline" href="contact.html?topic=general">Ask a question</a>' +
      "</div>" +
    "</div>";
    host.querySelector("[data-read]").addEventListener("click", function () { openArticle(featured.id); });
  }

  function filtered() {
    const q = state.q.trim().toLowerCase();
    return SP.NEWS.filter(function (n) {
      if (n.id === featured.id) return false;
      if (state.cat !== "all" && n.cat !== state.cat) return false;
      if (!q) return true;
      return (n.title + " " + n.excerpt + " " + n.body.join(" ") + " " + n.cat).toLowerCase().indexOf(q) > -1;
    });
  }

  function card(n, i) {
    const p = photoOf(n);
    return '' +
    '<article class="card news-card reveal" data-reveal-delay="' + (i % 3) * 80 + '">' +
      '<div class="news-card__media">' +
        '<div style="text-align:center;position:relative;z-index:1;padding:var(--sp-5)">' +
          '<div style="color:var(--sp-gold-300)">' + icon(CAT_ICON[n.cat] || "file", "", { size: 30 }) + "</div>" +
        "</div>" +
        (p ? '<img src="assets/img/' + esc(p) + '" alt="" loading="lazy" decoding="async" onerror="this.remove()">' : "") +
      "</div>" +
      "</div>" +
      '<div class="news-card__body">' +
        '<div class="flex items-center gap-2 flex-wrap">' +
          '<span class="badge ' + (CAT_BADGE[n.cat] || "badge--navy") + '">' + esc(n.cat) + "</span>" +
          '<span class="news-card__date">' + icon("clock", "", { size: 13 }) + F.date(n.date) + "</span>" +
        "</div>" +
        "<h3 class=\"news-card__title\">" + esc(n.title) + "</h3>" +
        '<p class="news-card__excerpt">' + esc(n.excerpt) + "</p>" +
      "</div>" +
      '<div class="news-card__foot">' +
        '<button class="link-arrow" type="button" data-read="' + n.id + '">Read article' + icon("arrow-right", "", { size: 15 }) + "</button>" +
        '<span class="text-xs text-muted">' + n.read + " min read</span>" +
      "</div>" +
    "</article>";
  }

  function paint() {
    const list = filtered();
    const grid = $("#newsGrid");
    grid.innerHTML = list.map(card).join("");
    $("#newsEmpty").hidden = list.length > 0;

    $$("#newsGrid [data-read]").forEach(function (b) {
      b.addEventListener("click", function () { openArticle(b.getAttribute("data-read")); });
    });
    SP.initReveal();
  }

  function filters() {
    const host = $("#newsFilters");
    const list = cats();
    host.innerHTML = list.map(function (c) {
      const n = c === "all" ? SP.NEWS.length : SP.NEWS.filter(function (a) { return a.cat === c; }).length;
      return '<button class="chip' + (c === state.cat ? " is-active" : "") + '" type="button" data-cat="' +
        esc(c) + '" aria-pressed="' + (c === state.cat) + '">' +
        (c === "all" ? "All updates" : esc(c)) + ' <span class="chip__count">' + n + "</span></button>";
    }).join("");

    $$("#newsFilters [data-cat]").forEach(function (b) {
      b.addEventListener("click", function () {
        state.cat = b.getAttribute("data-cat");
        filters();
        paint();
      });
    });
  }

  /* ------------------------------------------------------------- article -- */
  function openArticle(id) {
    const n = SP.NEWS.filter(function (a) { return a.id === id; })[0];
    if (!n) return;
    const body = n.body.map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("");
    openModal({
      title: n.title,
      subtitle: n.cat + " · " + F.date(n.date) + " · " + n.read + " min read",
      wide: true,
      content: '<div class="article-prose">' +
          '<p class="lead">' + esc(n.excerpt) + "</p>" + body + "</div>" +
        '<div class="flex flex-wrap gap-3 mt-6" style="padding-top:var(--sp-5);border-top:1px solid var(--color-border)">' +
          '<a class="btn btn--primary" href="send.html">' + icon("send") + "Send a package</a>" +
          '<a class="btn btn--outline" href="track.html">' + icon("search") + "Track a shipment</a>" +
          '<a class="btn btn--ghost" href="locations.html">' + icon("map-pin") + "Find a location</a>" +
        "</div>",
      footer: '<span class="text-xs text-muted">Reference ' + esc(n.id.toUpperCase()) + "</span>" +
        '<button class="btn btn--ghost btn--sm" type="button" data-share>Share</button>'
    });

    const share = document.querySelector("[data-share]");
    if (share) {
      share.addEventListener("click", function () {
        SP.copyText(n.title + " — Sudi-Post").then(function (ok) {
          toast(ok ? "Headline copied to clipboard." : "Could not copy automatically.", ok ? "success" : "error");
        });
      });
    }
  }

  /* ---------------------------------------------------------- subscribe -- */
  function subscribe() {
    const form = $("#newsSubForm");
    SP.bindValidation(form);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!SP.validateForm(form)) { toast("Please enter a valid email address.", "error"); return; }
      const email = SP.getData(form).email;
      const btn = $('button[type="submit"]', form);
      SP.setLoading(btn, true, "Subscribing.");
      setTimeout(function () {
        SP.setLoading(btn, false);
        form.innerHTML = '<div class="alert alert--success">' + icon("check-circle") +
          '<div class="alert__body"><strong>You are subscribed.</strong> We will email ' +
          esc(email) + " when something changes. Unsubscribe any time.</div></div>";
        SP.hydrateIcons(form);
        toast("Subscribed to Sudi-Post updates.", "success");
      }, 600);
    });
  }

  /* ------------------------------------------------------------------ init */
  function init() {
    renderFeatured();
    filters();
    paint();
    subscribe();

    const search = $("#newsSearch");
    search.addEventListener("input", debounce(function () { state.q = search.value; paint(); }, 180));

    $("#newsClear").addEventListener("click", function () {
      state.q = ""; state.cat = "all";
      search.value = "";
      filters(); paint();
    });

    /* deep link: news.html?article=n3 */
    const wanted = new URLSearchParams(window.location.search).get("article");
    if (wanted) openArticle(wanted);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
