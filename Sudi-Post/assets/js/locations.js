/* ==========================================================================
   SUDI-POST — Locations: searchable directory + projected SVG map
   ========================================================================== */
(function () {
  "use strict";
  const { icon, $, $$, esc, debounce } = SP;

  const state = { q: "", country: "", type: "", service: "", pickup: false, active: null, results: SP.LOCATIONS.slice() };

  function byId(id) {
    return SP.LOCATIONS.filter(function (l) { return l.id === id; })[0];
  }

  /* ------------------------------------------------------------- filters */
  function hydrateFilters() {
    const countries = [];
    SP.LOCATIONS.forEach(function (l) { if (countries.indexOf(l.country) === -1) countries.push(l.country); });
    $("#locCountry").innerHTML += countries.sort().map(function (c) {
      return '<option value="' + esc(c) + '">' + esc(c) + "</option>";
    }).join("");

    const services = [];
    SP.LOCATIONS.forEach(function (l) {
      l.services.forEach(function (s) { if (services.indexOf(s) === -1) services.push(s); });
    });
    $("#locService").innerHTML += services.sort().map(function (s) {
      return '<option value="' + esc(s) + '">' + esc(s) + "</option>";
    }).join("");
  }

  function apply() {
    const q = state.q.trim().toLowerCase();
    state.results = SP.LOCATIONS.filter(function (l) {
      if (state.country && l.country !== state.country) return false;
      if (state.type && l.type !== state.type) return false;
      if (state.service && l.services.indexOf(state.service) === -1) return false;
      if (state.pickup && !l.pickup) return false;
      if (!q) return true;
      return [l.name, l.city, l.country, l.address, l.email, l.phone, l.type].join(" ").toLowerCase().indexOf(q) > -1;
    });
    paint();
  }

  /* --------------------------------------------------------------- paint */
  function card(l) {
    const active = state.active === l.id ? " is-active" : "";
    const open = isOpenNow(l);
    return '' +
    '<article class="loc-card' + active + '" role="listitem" id="loc-' + l.id + '" tabindex="0" data-loc="' + l.id + '">' +
      '<div class="loc-card__top">' +
        "<div>" +
          '<h3 class="loc-card__name">' + icon(l.isHead ? "building" : l.partner ? "handshake" : "map-pin") + " " + esc(l.name) + "</h3>" +
          '<p class="loc-card__type">' + esc(l.city) + " · " + esc(l.country) + " · " + esc(l.type) + "</p>" +
        "</div>" +
        '<span class="badge badge--' + (open ? "success" : "muted") + '">' + (open ? "Open" : "Closed") + "</span>" +
      "</div>" +
      '<p class="loc-card__addr">' + icon("pin") + "<span>" + esc(l.address) + "</span></p>" +
      '<div class="loc-card__meta">' +
        "<span>" + icon("clock") + esc(l.hours) + "</span>" +
        '<span>' + icon("phone") + '<a href="tel:' + esc(l.phone.replace(/\s/g, "")) + '">' + esc(l.phone) + "</a></span>" +
        '<span>' + icon("mail") + '<a href="mailto:' + esc(l.email) + '">' + esc(l.email) + "</a></span>" +
      "</div>" +
      '<div class="chip-row mt-3">' +
        l.services.map(function (s) { return '<span class="chip chip--soft">' + esc(s) + "</span>"; }).join("") +
        (l.pickup ? '<span class="chip chip--gold">' + icon("truck") + " Pickup</span>" : "") +
      "</div>" +
      '<div class="loc-card__foot">' +
        '<a class="btn btn--outline btn--xs" href="' + SP.map.searchUrl(l) + '" target="_blank" rel="noopener">' + icon("navigation") + "Directions</a>" +
        '<a class="btn btn--outline btn--xs" href="send.html?location=' + l.id + '">' + icon("send") + "Send here</a>" +
        '<a class="btn btn--ghost btn--xs" href="tel:' + esc(l.phone.replace(/\s/g, "")) + '">Call</a>' +
      "</div>" +
    "</article>";
  }

  function paint() {
    const list = $("#locList");
    list.innerHTML = state.results.map(card).join("");
    $("#locEmpty").hidden = state.results.length > 0;

    const n = state.results.length;
    const t = state.q || state.country || state.type || state.service || state.pickup ? "matching your search" : "locations";
    $("#locCount").textContent = n + " " + t;

    $$("#locList [data-loc]").forEach(function (node) {
      node.addEventListener("click", function (e) {
        if (e.target.closest("a")) return;
        select(node.dataset.loc, true);
      });
      node.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(node.dataset.loc, true); }
      });
    });

    paintMap();
    const activeNode = state.active && $('#locList [data-loc="' + state.active + '"]');
    if (activeNode) activeNode.classList.add("is-active");
  }

  /* ----------------------------------------------------------------- map */
  function isOpenNow(l) {
    const now = new Date();
    const day = now.getDay();
    const mins = now.getHours() * 60 + now.getMinutes();
    if (l.weekend === false && (day === 0 || day === 6)) return false;
    const m = String(l.hours).match(/(\d{2}):(\d{2})–(\d{2}):(\d{2})/);
    if (!m) return true;
    const open = (+m[1]) * 60 + (+m[2]);
    const close = (+m[3]) * 60 + (+m[4]);
    return mins >= open && mins < close;
  }

  function select(id, scroll) {
    state.active = state.active === id ? null : id;
    $$("#locList [data-loc]").forEach(function (n) { n.classList.toggle("is-active", n.dataset.loc === state.active); });
    const l = byId(state.active);
    paintMap();
    if (state.active) {
      paintMapInfo(l);
      if (scroll) {
        const card = $('#locList [data-loc="' + id + '"]');
        if (card) card.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    } else paintMapInfo(null);
  }

  function paintMapInfo(l) {
    const host = $("#locMapInfo");
    if (!l) {
      host.innerHTML = '<p class="text-sm text-muted">Select a location on the map or in the list to see its ' +
        "details. Sudi-Post covers all ten states of South Sudan and ships to 4 countries.</p>";
      return;
    }
    host.innerHTML = '' +
      '<div class="flex items-center gap-2"><span class="map-panel__pin">' + icon(l.isHead ? "building" : "map-pin") + "</span>" +
        "<div><strong>" + esc(l.name) + "</strong><br><span class=\"text-sm text-muted\">" + esc(l.city) + ", " + esc(l.country) + "</span></div></div>" +
      '<p class="text-sm mt-3">' + esc(l.address) + "</p>" +
      '<div class="flex flex-wrap gap-2 mt-3">' +
        '<span class="chip chip--soft">' + icon("clock") + " " + esc(l.hours) + "</span>" +
        (l.pickup ? '<span class="chip chip--gold">' + icon("truck") + " Pickup available</span>" : "") +
      "</div>" +
      '<div class="flex flex-wrap gap-2 mt-4">' +
        '<a class="btn btn--primary btn--sm" href="send.html?location=' + l.id + '">' + icon("send") + "Send here</a>" +
        '<a class="btn btn--outline btn--sm" href="' + SP.map.directionsUrl(l) + '" target="_blank" rel="noopener">' + icon("navigation") + "Directions</a>" +
      "</div>";
  }

  function paintMap() {
    SP.map.render($("#locMap"), {
      activeId: state.active,
      visible: state.results,
      route: true,
      onSelect: function (id) {
        state.active = id;
        paintMap();
        paintMapInfo(byId(id));
        $$("#locList [data-loc]").forEach(function (n) { n.classList.toggle("is-active", n.dataset.loc === id); });
        const card = $('#locList [data-loc="' + id + '"]');
        if (card) card.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    });
    if (state.active) paintMapInfo(byId(state.active));
  }

  /* --------------------------------------------------------- coverage -- */
  function coverage() {
    const byCountry = {};
    SP.LOCATIONS.forEach(function (l) { byCountry[l.country] = (byCountry[l.country] || 0) + 1; });
    const byType = {};
    SP.LOCATIONS.forEach(function (l) { byType[l.type] = (byType[l.type] || 0) + 1; });
    const pickup = SP.LOCATIONS.filter(function (l) { return l.pickup; }).length;
    const staff = SP.LOCATIONS.reduce(function (n, l) { return n + (l.staff || 0); }, 0);

    const tiles = [
      { n: byCountry["South Sudan"] || 0, l: "South Sudan locations", i: "map-pin", p: "loc.jpg" },
      { n: (byCountry["Ethiopia"] || 0) + (byCountry["Kenya"] || 0) + (byCountry["Uganda"] || 0), l: "Regional & partner points", i: "globe", p: "pat.jpg" },
      { n: pickup, l: "Pickup points offering collection", i: "truck", p: "van.jpg" },
      { n: staff, l: "Local staff on the ground", i: "users", p: "pipo.jpg" }
    ];
    $("#coverageStats").innerHTML = tiles.map(function (t) {
      return '' +
      '<div class="stat stat--center reveal">' +
        '<span class="stat__photo">' + icon(t.i) +
          '<img src="assets/img/' + t.p + '" alt="" loading="lazy" decoding="async" onerror="this.remove()">' +
        "</span>" +
        '<div class="stat__value" data-count="' + t.n + '">0</div>' +
        '<div class="stat__label">' + esc(t.l) + "</div>" +
      "</div>";
    }).join("");
  }

  /* -------------------------------------------------------------- init */
  function init() {
    hydrateFilters();
    coverage();

    const search = $("#locSearch");
    search.addEventListener("input", debounce(function () { state.q = search.value; apply(); }, 180));
    $("#locCountry").addEventListener("change", function (e) { state.country = e.target.value; apply(); });
    $("#locType").addEventListener("change", function (e) { state.type = e.target.value; apply(); });
    $("#locService").addEventListener("change", function (e) { state.service = e.target.value; apply(); });
    $("#locPickup").addEventListener("change", function (e) { state.pickup = e.target.checked; apply(); });
    $("#locReset").addEventListener("click", function () {
      state.q = state.country = state.type = state.service = "";
      state.pickup = false;
      search.value = ""; $("#locCountry").value = ""; $("#locType").value = ""; $("#locService").value = ""; $("#locPickup").checked = false;
      apply();
    });

    apply();
    paintMapInfo(null);
    SP.initReveal();
    SP.initCounters();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
