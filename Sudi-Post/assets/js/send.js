/* ==========================================================================
   SUDI-POST — Send a package: 4-step booking wizard
   ========================================================================== */
(function () {
  "use strict";
  const { icon, $, $$, esc, statusBadge, toast, copyText } = SP;
  const F = SP.fmt;

  const state = { step: 1, max: 1, service: "parcel", quote: null, tracking: null };

  /* ------------------------------------------------------------- options */
  function hydrateOptions() {
    /* service cards */
    $("#sendServices").innerHTML = SP.SERVICES.map(function (s) {
      const recommended = s.id === "parcel";
      return '' +
      '<label class="option-card' + (recommended ? " is-recommended" : "") + '">' +
        '<input type="radio" name="service" value="' + s.id + '"' + (s.id === state.service ? " checked" : "") + ">" +
        '<span class="option-card__head">' +
          '<span class="option-card__title">' + icon(s.icon, "", { size: 18 }) + " " + esc(s.title) + "</span>" +
        "</span>" +
        '<span class="option-card__desc">' + esc(s.desc) + "</span>" +
      "</label>";
    }).join("");

    /* origin / destination */
    const origins = [];
    SP.LOCATIONS.forEach(function (l) { if (origins.indexOf(l.city) === -1) origins.push(l.city); });
    $("#sOrigin").innerHTML = origins.sort().map(function (c) {
      return '<option value="' + esc(c) + '"' + (c === "Juba" ? " selected" : "") + ">" + esc(c) + "</option>";
    }).join("");

    $("#sDest").innerHTML = '<option value="">Select destination</option>' +
      SP.ZONES.map(function (z) {
        return '<optgroup label="' + esc(z.name) + '">' +
          z.destinations.map(function (d) { return '<option value="' + esc(d) + '"' + (d === "Addis Ababa" ? " selected" : "") + ">" + esc(d) + "</option>"; }).join("") +
          "</optgroup>";
      }).join("");

    /* drop-off location */
    $("#cLocation").innerHTML = '<option value="">Select location</option>' +
      SP.LOCATIONS.map(function (l) {
        return '<option value="' + esc(l.id) + '">' + esc(l.name) + " — " + esc(l.city) + "</option>";
      }).join("");

    /* package types */
    $("#pType").innerHTML = SP.PACKAGE_TYPES.map(function (p) {
      return '<option value="' + p.id + '"' + (p.id === "parcel" || p.id === "small" ? " selected" : "") + ">" + esc(p.label) + "</option>";
    }).join("");

    /* surcharges */
    $("#sendSurcharges").innerHTML = SP.SURCHARGES.map(function (s) {
      const amount = s.rate < 1 ? Math.round(s.rate * 100) + "%" : F.money(s.rate);
      return '' +
      '<label class="option-card" style="padding:var(--sp-3) var(--sp-4)">' +
        '<input type="checkbox" name="surcharges" value="' + s.id + '">' +
        '<span class="option-card__head">' +
          '<span class="option-card__title" style="font-size:var(--fs-sm)">' + esc(s.label) + "</span>" +
          '<span class="option-card__price">' + amount + "</span>" +
        "</span>" +
        '<span class="option-card__desc">' + esc(s.unit) + "</span>" +
      "</label>";
    }).join("");

    /* payment methods */
    $("#sendPayMethods").innerHTML = SP.PAYMENT_METHODS.map(function (m) {
      return '' +
      '<label class="option-card">' +
        '<input type="radio" name="payment" value="' + m.id + '"' + (m.id === "cash" ? " checked" : "") + ">" +
        '<span class="option-card__head">' +
          '<span class="option-card__title">' + icon(m.icon, "", { size: 18 }) + " " + esc(m.label) + "</span>" +
          '<span class="option-card__price">' + (m.fee ? "+" + F.money(m.fee) : "No fee") + "</span>" +
        "</span>" +
        '<span class="option-card__desc">' + esc(m.detail || m.note || "") + "</span>" +
      "</label>";
    }).join("");
  }

  /* ---------------------------------------------------------- field sets */
  function fieldsFor(step) {
    if (step === 1) return ["#sOrigin", "#sDest"];
    if (step === 2) {
      const mode = SP.getData($("#sendForm")).collect || "pickup";
      return mode === "pickup" ? ["#cAddr", "#cPhone"] : mode === "drop" ? ["#cLocation"] : [];
    }
    if (step === 3) return ["#sName", "#sPhone", "#rName", "#rPhone", "#rAddr", "#cDesc", "#cType", "#agree"];
    if (step === 4) return ["#pType", "#pWeight"];
    return [];
  }

  function validateStep(step) {
    const nodes = fieldsFor(step);
    let ok = true;
    nodes.forEach(function (sel) {
      const node = $(sel);
      if (!node) return;
      if (!SP.validateField(node)) ok = false;
    });
    /* surface the first failure */
    if (!ok) {
      const bad = nodes.map(function (s) { return $(s); }).filter(function (n) { return n && n.closest(".field")?.classList.contains("is-invalid"); })[0] ||
                  $(nodes[0]);
      if (bad) {
        bad.scrollIntoView({ behavior: "smooth", block: "center" });
        if (bad.focus) bad.focus({ preventScroll: true });
      }
      toast("Please complete the highlighted fields.", "error");
    }
    return ok;
  }

  /* --------------------------------------------------------- navigation */
  function goto(step) {
    state.step = Math.min(4, Math.max(1, step));
    $$(".wizard__panel").forEach(function (p) {
      p.classList.toggle("is-active", +p.dataset.panel === state.step);
    });
    $$(".wizard__step").forEach(function (li) {
      const n = +li.dataset.step;
      li.classList.toggle("is-active", n === state.step);
      li.classList.toggle("is-done", n < state.step);
    });
    $("#wizBack").hidden = state.step === 1;
    $("#wizNext").hidden = state.step === 4;
    $("#wizSubmit").hidden = state.step !== 4;
    state.max = Math.max(state.max, state.step);
    refreshQuote();
    const top = $(".wizard").getBoundingClientRect().top + window.scrollY - 100;
    if (window.scrollY > top) window.scrollTo({ top: top, behavior: "smooth" });
  }

  /* -------------------------------------------------------------- quote */
  function readBooking() {
    const d = SP.getData($("#sendForm"));
    const dims = { l: parseFloat(d.dimL) || 0, w: parseFloat(d.dimW) || 0, h: parseFloat(d.dimH) || 0 };
    return {
      service: d.service || state.service,
      origin: d.origin,
      destination: d.destination,
      collect: d.collect || "pickup",
      collectAddress: d.collectAddress,
      collectPhone: d.collectPhone,
      collectDate: d.collectDate,
      dropLocation: d.dropLocation,
      senderName: d.senderName,
      senderPhone: d.senderPhone,
      senderEmail: d.senderEmail,
      receiverName: d.receiverName,
      receiverPhone: d.receiverPhone,
      receiverEmail: d.receiverEmail,
      receiverAddress: d.receiverAddress,
      receiverAltPhone: d.receiverAltPhone,
      contents: d.contents,
      contentsCategory: d.contentsCategory,
      agree: d.agree,
      packageType: d.packageType,
      weight: parseFloat(d.weight) || 0.1,
      declaredValue: parseFloat(d.declaredValue) || 0,
      fragile: d.fragile,
      dims: dims,
      payment: d.payment || "cash",
      surcharges: $$("#sendForm input[name=surcharges]:checked").map(function (c) { return c.value; })
    };
  }

  function refreshQuote() {
    const b = readBooking();
    state.booking = b;

    /* zone note */
    const note = $("#zoneNote");
    if (b.origin && b.destination) {
      const zone = SP.rates.findZone(b.origin, b.destination);
      note.hidden = false;
      note.innerHTML = icon("info") +
        '<div class="alert__body"><strong>' + esc(zone.name) + "</strong> — " + esc(zone.desc) +
        ". Estimated transit " + esc(zone.transit) + " from " + F.money(zone.base) +
        " plus " + F.money(zone.perKg) + "/kg. " +
        (b.destination === "Juba" || b.origin === "Juba" ? "Domestic Juba routes are our busiest — book before 15:00 for same-day dispatch." : "") +
        "</div>";
    } else note.hidden = true;

    /* payment note */
    const payNote = $("#payNote");
    const pm = SP.PAYMENT_METHODS.filter(function (m) { return m.id === b.payment; })[0];
    if (pm) {
      payNote.hidden = false;
      payNote.innerHTML = icon(pm.icon) +
        '<div class="alert__body"><strong>' + esc(pm.label) + "</strong> — " +
        esc(pm.detail || pm.note || "") +
        (pm.fee ? " A fee of " + F.money(pm.fee) + " applies." : " No additional fee.") + "</div>";
    }

    if (b.origin && b.destination && b.weight) {
      state.quote = SP.rates.calculate({
        origin: b.origin,
        destination: b.destination,
        packageType: b.packageType,
        weight: b.weight,
        declaredValue: b.declaredValue,
        dims: b.dims,
        speed: b.service === "express" ? "express" : "standard",
        surcharges: b.surcharges
      });
    } else state.quote = null;

    paintSummary();
  }

  function paintSummary() {
    const b = state.booking || readBooking();
    const q = state.quote;
    const svc = SP.SERVICES.filter(function (s) { return s.id === b.service; })[0];
    const drop = SP.LOCATIONS.filter(function (l) { return l.id === b.dropLocation; })[0];

    const collect = b.collect === "pickup"
      ? (b.collectAddress || "Address to be confirmed")
      : b.collect === "drop"
        ? (drop ? drop.name : drop ? "" : "Choose a location")
        : "Courier to be arranged";

    const rows = [
      { i: "truck", l: "Collection", v: collect },
      { i: "map-pin", l: "Destination", v: b.destination || "—" },
      { i: "package", l: "Package", v: (b.packageType ? (SP.PACKAGE_TYPES.filter(function (p) { return p.id === b.packageType; })[0] || {}).label : "—") + " · " + b.weight + " kg" },
      { i: "user", l: "Recipient", v: b.receiverName || "—" },
      { i: "phone", l: "Contact", v: b.receiverPhone || "—" }
    ];

    $("#sendSummary").innerHTML = '' +
    '<div class="card card--pad">' +
      '<div class="flex items-center gap-3">' +
        '<span class="icon-box icon-box--gold" style="padding:0.6rem">' + icon("receipt") + "</span>" +
        "<div><strong>Shipment summary</strong><br><span class=\"text-sm text-muted\">" +
        (svc ? esc(svc.title) : "Standard parcel") + "</span></div>" +
      "</div>" +
      '<ul class="summary-list mt-4">' +
        rows.map(function (r) {
          return "<li><span>" + icon(r.i, "", { size: 16 }) + esc(r.l) + '</span><b title="' + esc(r.v) + '">' + esc(r.v) + "</b></li>";
        }).join("") +
      "</ul>" +
    "</div>" +

    (q
      ? '<div class="result">' +
          '<div class="text-xs fw-700 uppercase" style="letter-spacing:var(--ls-widest);color:var(--sp-gold-300)">Estimated total</div>' +
          '<div class="result__amount">' + F.money(q.total) + "</div>" +
          '<dl class="result__rows">' +
            q.lines.map(function (l) { return '<div class="result__row"><dt>' + esc(l.label) + "</dt><dd>" + F.money(l.amount) + "</dd></div>"; }).join("") +
            q.extras.map(function (e) { return '<div class="result__row"><dt>' + esc(e.label) + "</dt><dd>" + F.money(e.amount) + "</dd></div>"; }).join("") +
            '<div class="result__row"><dt>Service fee</dt><dd>' + F.money(q.serviceFee) + "</dd></div>" +
          "</dl>" +
          '<div class="result__total"><span class="result__total-label">Payable</span>' +
            '<span class="result__total-value">' + F.money(q.total) + "</span></div>" +
          '<p class="text-sm mt-4" style="color:var(--sp-navy-200)">Estimated delivery by <strong style="color:var(--sp-white)">' +
            F.date(q.arriveBy) + "</strong> · " + esc(q.transit.label) + "</p>" +
        "</div>"
      : '<div class="card card--pad card--soft"><p class="text-sm text-muted">' +
        icon("info") + " Choose an origin and destination to see your price. Final charges are confirmed when we weigh your parcel.</p></div>") +

    '<div class="card card--pad">' +
      '<h3 style="font-size:var(--fs-md)">What happens next</h3>' +
      '<ul class="check-list mt-3">' +
        "<li>" + icon("check-circle", "", { size: 18 }) + "<span>You receive a tracking number instantly.</span></li>" +
        "<li>" + icon("check-circle", "", { size: 18 }) + "<span>We confirm collection by SMS and WhatsApp.</span></li>" +
        "<li>" + icon("check-circle", "", { size: 18 }) + "<span>You follow every scan in Track &amp; Trace.</span></li>" +
        "<li>" + icon("check-circle", "", { size: 18 }) + "<span>The receiver signs for the parcel on delivery.</span></li>" +
      "</ul>" +
    "</div>";

    SP.hydrateIcons($("#sendSummary"));
  }

  /* ------------------------------------------------------------ booking */
  function buildShipment(b, q) {
    const tracking = SP.ship.nextTracking();
    const now = new Date();
    const service = SP.SERVICES.filter(function (s) { return s.id === b.service; })[0] || SP.SERVICES[0];
    const speed = b.service === "express" ? "express" : "standard";
    const ptype = SP.PACKAGE_TYPES.filter(function (p) { return p.id === b.packageType; })[0] || SP.PACKAGE_TYPES[1];

    const ship = {
      id: "SHP" + Date.now().toString().slice(-6),
      tracking: tracking,
      status: "pending",
      service: service.id,
      serviceLabel: service.title,
      speed: speed,
      origin: b.origin,
      destination: b.destination,
      zone: q.zone.id,
      collectMode: b.collect,
      sender: { name: b.senderName, phone: b.senderPhone, email: b.senderEmail || "", address: b.collectAddress || b.origin },
      receiver: {
        name: b.receiverName, phone: b.receiverPhone, email: b.receiverEmail || "",
        altPhone: b.receiverAltPhone || "", address: b.receiverAddress
      },
      contents: b.contents,
      contentsCategory: b.contentsCategory,
      packageType: ptype.id,
      weight: b.weight,
      chargeable: q.chargeable,
      dims: b.dims,
      declaredValue: b.declaredValue,
      fragile: b.fragile,
      surcharges: b.surcharges,
      payment: { method: b.payment, status: b.payment === "cash" ? "pending" : "pending", amount: q.total, paidAt: null },
      price: q.total,
      currency: SP.BRAND.currency,
      createdAt: now.toISOString(),
      eta: q.arriveBy,
      driverId: null,
      history: [
        {
          key: "created", label: "Shipment booked online", at: now.toISOString(),
          location: b.origin, note: "Booking confirmed via the Sudi-Post website. Awaiting parcel acceptance."
        }
      ]
    };

    SP.store.addShipment(ship);
    return ship;
  }

  function showConfirmation(ship, q) {
    const b = state.booking;
    const svc = SP.SERVICES.filter(function (s) { return s.id === ship.service; })[0];

    $("#sendForm").closest(".wizard").hidden = true;
    $("#sendAssure").hidden = true;
    $("#sendDone").hidden = false;

    const payMethod = SP.PAYMENT_METHODS.filter(function (m) { return m.id === ship.payment.method; })[0];

    $("#sendDoneInner").innerHTML = '' +
    '<div class="text-center">' +
      '<div class="done-mark">' + icon("check") + "</div>" +
      '<span class="eyebrow eyebrow--center" style="justify-content:center">Shipment booked</span>' +
      "<h1 style=\"margin-top:var(--sp-3)\">Thank you — your parcel is booked</h1>" +
      '<p class="lead mt-4">We have sent a confirmation to ' +
        (ship.sender.email ? "<strong>" + esc(ship.sender.email) + "</strong> " : "") +
        "and " + esc(ship.sender.phone) + ". Present this reference at handover.</p>" +
    "</div>" +

    '<div class="tracking-box">' +
      "<div><div class=\"tracking-box__label\">Your tracking number</div>" +
        '<div class="tracking-box__value">' + esc(ship.tracking) + "</div></div>" +
      '<button class="btn btn--gold" type="button" id="copyTracking">' + icon("clipboard") + "Copy</button>" +
    "</div>" +

    '<div class="grid grid--2" style="gap:var(--sp-5);align-items:start">' +
      '<div class="card card--pad">' +
        "<h2>What happens next</h2>" +
        '<ol class="ordered-list mt-4">' +
          "<li>Bring the parcel to a Sudi-Post location, or wait for your free pickup in Juba metro.</li>" +
          "<li>Our agent weighs and inspects it, then scans it in. Your status moves to <strong>Received</strong>.</li>" +
          "<li>" + (ship.collectMode === "pickup" ? "We collect from " + esc(ship.sender.address) + "." : "We confirm acceptance at the branch.") + "</li>" +
          "<li>Dispatch to " + esc(ship.destination) + ", arriving about <strong>" + F.date(ship.eta) + "</strong>.</li>" +
          "<li>The receiver signs for the parcel. You see the proof of delivery in Track &amp; Trace.</li>" +
        "</ol>" +
      "</div>" +

      '<div class="card card--pad">' +
        "<h2>Booking details</h2>" +
        '<dl class="dl mt-4">' +
          '<div class="dl__row"><dt>Tracking number</dt><dd class="mono">' + esc(ship.tracking) + "</dd></div>" +
          '<div class="dl__row"><dt>Service</dt><dd>' + esc(svc ? svc.title : ship.serviceLabel) + "</dd></div>" +
          '<div class="dl__row"><dt>Route</dt><dd>' + esc(ship.origin) + " → " + esc(ship.destination) + "</dd></div>" +
          '<div class="dl__row"><dt>Zone</dt><dd>' + esc(q.zone.name) + "</dd></div>" +
          '<div class="dl__row"><dt>Package</dt><dd>' + ship.weight + " kg (" + ship.chargeable + " kg chargeable)</dd></div>" +
          '<div class="dl__row"><dt>Contents</dt><dd>' + esc(ship.contents) + "</dd></div>" +
          '<div class="dl__row"><dt>Recipient</dt><dd>' + esc(ship.receiver.name) + "<br><span class=\"text-sm text-muted fw-400\">" + esc(ship.receiver.phone) + "</span></dd></div>" +
          '<div class="dl__row"><dt>Payment</dt><dd>' + esc(payMethod ? payMethod.label : ship.payment.method) + "</dd></div>" +
          '<div class="dl__row"><dt>Total payable</dt><dd>' + F.money(ship.price) + "</dd></div>" +
        "</dl>" +
        '<a class="btn btn--primary btn--block mt-5" href="payment.html?tracking=' + esc(ship.tracking) + '&amp;amount=' + ship.price + '">' +
          icon("credit-card") + "Pay now</a>" +
      "</div>" +
    "</div>" +

    '<div class="flex flex-wrap gap-3 mt-7" style="justify-content:center">' +
      '<a class="btn btn--primary btn--lg" href="track.html?tracking=' + esc(ship.tracking) + '">' + icon("search") + "Track this shipment</a>" +
      '<a class="btn btn--outline btn--lg" href="send.html">' + icon("plus") + "Book another parcel</a>" +
      '<a class="btn btn--ghost btn--lg" href="account.html">' + icon("user") + "View my shipments</a>" +
    "</div>" +

    '<p class="text-sm text-muted mt-6 text-center">Keep your tracking number. You can use it without an account ' +
      "to check progress at any time.</p>";

    SP.hydrateIcons($("#sendDoneInner"));
    $("#copyTracking").addEventListener("click", function () {
      copyText(ship.tracking).then(function (ok) {
        toast(ok ? "Tracking number copied." : "Copy failed — please note it manually.", ok ? "success" : "error");
      });
    });
    $("#sendDone").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* ------------------------------------------------------------ chrome */
  function assurance() {
    const tiles = [
      { i: "shield-check", t: "Insured in transit", d: "Every parcel is covered up to USD 5,000 at no extra cost." },
      { i: "eye", t: "Tracked at every scan", d: "One scan when we accept, one when we deliver. Nothing gets lost in between." },
      { i: "pen", t: "Signature on delivery", d: "The named recipient signs. We record the name and time." },
      { i: "refresh", t: "Free re-attempt", d: "If we cannot deliver, we re-attempt twice at no charge." }
    ];
    $("#sendAssureGrid").innerHTML = tiles.map(function (t, i) {
      return '' +
      '<div class="card service-card reveal" data-reveal-delay="' + i * 80 + '">' +
        '<span class="service-card__icon">' + icon(t.i) + "</span>" +
        '<h3 class="service-card__title" style="font-size:var(--fs-md)">' + esc(t.t) + "</h3>" +
        '<p class="service-card__desc">' + esc(t.d) + "</p>" +
      "</div>";
    }).join("");
  }

  function faqs() {
    const picks = [0, 2, 4, 7, 8];
    $("#sendFaq").innerHTML = picks.map(function (i, n) {
      const f = SP.FAQS[i];
      if (!f) return "";
      return '<details class="accordion__item"' + (n === 0 ? " open" : "") + "><summary>" + esc(f.q) +
        '</summary><div class="accordion__body"><p>' + esc(f.a) + "</p></div></details>";
    }).join("");
  }

  /* --------------------------------------------------------------- init */
  function init() {
    hydrateOptions();
    assurance();
    faqs();

    const form = $("#sendForm");
    SP.bindValidation(form);

    /* collection mode switching */
    $$('input[name="collect"]').forEach(function (r) {
      r.addEventListener("change", function () {
        const mode = SP.getData(form).collect;
        $("#pickupFields").hidden = mode !== "pickup";
        $("#dropFields").hidden = mode !== "drop";
        refreshQuote();
      });
    });
    $("#cLocation").addEventListener("change", function () {
      const l = SP.LOCATIONS.filter(function (x) { return x.id === $("#cLocation").value; })[0];
      $("#dropHours").textContent = l ? l.address + " · " + l.hours : "";
    });

    /* min pickup date = today */
    const today = new Date();
    $("#cDate").min = today.toISOString().slice(0, 10);

    /* live price + volumetric hint */
    form.addEventListener("change", function () { refreshQuote(); });
    ["#pL", "#pW", "#pH"].forEach(function (sel) {
      $(sel).addEventListener("input", function () {
        const b = readBooking();
        const v = SP.rates.volumetricWeight(b.dims);
        $("#volHint").textContent = v > b.weight
          ? "Volumetric weight " + v.toFixed(1) + " kg — higher than actual weight, so this will be charged."
          : "We charge on the greater of actual and volumetric weight.";
        refreshQuote();
      });
    });
    ["#pWeight", "#pValue"].forEach(function (sel) {
      $(sel).addEventListener("input", SP.debounce(refreshQuote, 250));
    });

    /* navigation */
    $("#wizNext").addEventListener("click", function () {
      if (validateStep(state.step)) goto(state.step + 1);
    });
    $("#wizBack").addEventListener("click", function () { goto(state.step - 1); });
    $$(".wizard__step").forEach(function (li) {
      li.addEventListener("click", function () {
        const n = +li.dataset.step;
        if (n <= state.max && n !== state.step) goto(n);
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      for (let s = 1; s <= 4; s++) {
        if (!validateStep(s)) { goto(s); return; }
      }
      if (!state.quote) { goto(1); toast("Choose an origin and destination first.", "error"); return; }

      const btn = $("#wizSubmit");
      SP.setLoading(btn, true);
      /* simulated acceptance — replace with POST /api/v1/shipments */
      setTimeout(function () {
        SP.setLoading(btn, false);
        const b = state.booking;
        const ship = buildShipment(b, state.quote);
        state.tracking = ship.tracking;
        showConfirmation(ship, state.quote);
        toast("Shipment " + ship.tracking + " booked successfully.", "success");
      }, 700);
    });

    /* deep links from other pages */
    const params = new URLSearchParams(window.location.search);
    if (params.get("service")) {
      const radio = $('#sendForm input[name="service"][value="' + params.get("service") + '"]');
      if (radio) { radio.checked = true; state.service = params.get("service"); }
    }
    ["origin", "destination", "type", "weight", "declared", "l", "w", "h"].forEach(function (k) {
      if (!params.get(k)) return;
      const map = { origin: "#sOrigin", destination: "#sDest", type: "#pType", weight: "#pWeight", declared: "#pValue", l: "#pL", w: "#pW", h: "#pH" };
      const node = $(map[k]);
      if (node) node.value = params.get(k);
    });
    if (params.get("pickup")) { const r = $('#sendForm input[name="collect"][value="pickup"]'); if (r) r.checked = true; }
    if (params.get("location")) {
      const r = $('#sendForm input[name="collect"][value="drop"]');
      if (r) r.checked = true;
      $("#dropFields").hidden = false;
      $("#pickupFields").hidden = true;
      $("#cLocation").value = params.get("location");
      const l = SP.LOCATIONS.filter(function (x) { return x.id === params.get("location"); })[0];
      if (l) { $("#sOrigin").value = l.city; $("#dropHours").textContent = l.address + " · " + l.hours; }
    }

    refreshQuote();
    SP.initReveal();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
