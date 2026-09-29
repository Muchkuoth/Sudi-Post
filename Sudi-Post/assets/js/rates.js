/* ==========================================================================
   SUDI-POST — Luggage Rate Calculator + Payment Handoff
   --------------------------------------------------------------------------
   Fixed tariff: 1 KG = 23,000 SSP. The customer enters only the weight and
   the total is calculated for them.

   Payment rule: pressing PAY NOW opens a payment intent and moves the
   session to "pending". It never sets "paid". Only a payment provider
   confirmation can do that (SP.createPaymentSession). See the status notes
   in payPanel below.
   ========================================================================== */
(function () {
  "use strict";
  const { icon, $, esc, debounce, toast } = SP;
  const F = SP.fmt;

  const L = SP.luggage;
  let session = null;   /* SP payment session for the current total */
  let quote = null;     /* current SP.rates.luggage() result */

  /* ------------------------------------------------------ weight chips -- */
  function buildChips() {
    const host = $("#weightChips");
    if (!host) return;
    host.innerHTML = L.table.map(function (kg) {
      const total = SP.rates.luggage(kg).total;
      return '' +
      '<button class="weight-chip" type="button" data-kg="' + kg + '">' +
        '<span class="weight-chip__kg">' + kg + " KG</span>" +
        '<span class="weight-chip__price">' + F.money(total) + "</span>" +
      "</button>";
    }).join("");

    host.addEventListener("click", function (e) {
      const btn = e.target.closest("[data-kg]");
      if (!btn) return;
      $("#weight").value = btn.getAttribute("data-kg");
      sync(true);
      $("#weight").focus();
    });
  }

  /* --------------------------------------------------------- price card -- */
  function paintQuote(q) {
    $("#calcResult").innerHTML = '' +
    '<div class="result result--luggage">' +
      '<div class="text-xs fw-700 uppercase" style="letter-spacing:var(--ls-widest);color:var(--sp-gold-300)">Total</div>' +
      '<div class="result__amount" data-total>' + F.money(q.total) + "</div>" +
      '<div class="text-sm" style="color:var(--sp-navy-200)">≈ ' + F.usd(q.total) +
        " at " + F.money(SP.BRAND.usdRate) + " = US$ 1</div>" +

      '<dl class="result__rows mt-5">' +
        '<div class="result__row"><dt>Luggage weight</dt><dd>' + q.chargeable + " kg</dd></div>" +
        '<div class="result__row"><dt>Fixed rate</dt><dd>' + F.money(q.perKg) + " SSP / kg</dd></div>" +
        '<div class="result__row"><dt>Calculation</dt><dd>' + q.chargeable + " × " + F.money(q.perKg) + "</dd></div>" +
      "</dl>" +

      '<div class="result__total">' +
        '<span class="result__total-label">Total payable</span>' +
        '<span class="result__total-value">' + F.money(q.total) + "</span>" +
      "</div>" +

      '<p class="text-xs text-muted mt-4">' + esc(L.note) + "</p>" +
    "</div>";

    /* the payment step only appears once there is a total */
    const panel = $("#payPanel");
    panel.hidden = false;
    if (!session || session.amount !== q.total) {
      session = SP.createPaymentSession({ amount: q.total, weight: q.chargeable });
    }
    paintPayment();
    SP.hydrateIcons($("#calcResult"));
    SP.hydrateIcons(panel);
  }

  /* ------------------------------------------------------ payment panel -- */
  function methods() {
    return SP.PAYMENT_METHODS.map(function (m) {
      return '' +
      '<label class="pay-method">' +
        '<input type="radio" name="payMethod" value="' + esc(m.id) + '">' +
        '<span class="pay-method__logo">' + esc(m.logo) + "</span>" +
        '<span class="pay-method__text">' +
          '<span class="pay-method__label">' + esc(m.label) + "</span>" +
          '<span class="pay-method__desc">' + esc(m.desc) + "</span>" +
        "</span>" +
      "</label>";
    }).join("");
  }

  function statusBlock(s) {
    const v = SP.payStateView(s.status);
    return '' +
    '<div class="paystate paystate--' + v.tone + '" data-state="' + s.status + '">' +
      '<div class="paystate__top">' +
        '<span class="paystate__icon">' + icon(v.icon, "", { size: 20 }) + "</span>" +
        '<div>' +
          '<div class="paystate__label">' + esc(v.label) + "</div>" +
          '<div class="paystate__blurb">' + esc(v.blurb) + "</div>" +
        "</div>" +
      "</div>" +
      '<dl class="paystate__meta">' +
        "<dt>Reference</dt><dd class=\"mono\">" + esc(s.ref) + "</dd>" +
        "<dt>Amount</dt><dd>" + F.money(s.amount) + "</dd>" +
        "<dt>Method</dt><dd>" + esc(methodLabel(s.method)) + "</dd>" +
        (s.providerRef ? "<dt>Provider ref</dt><dd class=\"mono\">" + esc(s.providerRef) + "</dd>" : "") +
      "</dl>" +
    "</div>";
  }

  function methodLabel(id) {
    const m = SP.PAYMENT_METHODS.filter(function (x) { return x.id === id; })[0];
    return m ? m.label : "Not chosen yet";
  }

  function paintPayment() {
    const s = session;
    if (!s) return;
    const host = $("#payPanel");

    let body = "";

    /* ---- the status is always on screen once a payment has been started ----
       Fresh quotes show no status (nothing is pending yet). From the moment
       the customer presses PAY NOW, every state is stated explicitly:
       pending, paid, failed, or pending/unpaid if they walked away. */
    const attempted = s.history.length > 1;
    if (attempted) {
      body += '<div class="card card--pad" data-statuscard>' + statusBlock(s) +
        (s.status === "failed"
          ? '<p class="text-xs text-muted mt-3">' + esc(s.failure || "") + " Nothing was taken from your account.</p>"
          : "") +
      "</div>";
    }

    /* ---- choose a method, then pay ---- */
    if (s.canPayNow()) {
      body += '' +
      '<div class="card card--pad' + (attempted ? " mt-4" : "") + '">' +
        '<h3 style="font-size:var(--fs-md)">Choose Payment Method</h3>' +
        '<fieldset class="mt-4" style="border:0;padding:0">' +
          '<legend class="visually-hidden">Payment method</legend>' +
          '<div class="pay-methods">' + methods() + "</div>" +
        "</fieldset>" +
        '<button class="btn btn--gold btn--lg btn--block mt-5" type="button" id="payNowBtn">' +
          icon("lock") + "PAY NOW · " + F.money(s.amount) +
        "</button>" +
        '<div class="shield-note">' +
          '<span class="shield-badge">' +
            '<svg class="shield-badge__shape" viewBox="0 0 60 70" aria-hidden="true" focusable="false">' +
              '<path d="M30 1 59 9v22c0 17-12 30-29 38C13 61 1 48 1 31V9Z" fill="currentColor"/>' +
            "</svg>" +
            '<img class="shield-badge__img" src="assets/img/logo.jpg" alt="Sudi-Post" ' +
              'width="34" height="34" loading="lazy" decoding="async">' +
          "</span>" +
          '<p class="shield-note__text"><i data-icon="shield-check"></i> Pressing Pay Now sends the payment ' +
            "to the provider. It does not mark your order as paid.</p>" +
        "</div>" +
      "</div>";

      if (s.method) {
        const sel = host.querySelector('input[name=payMethod][value="' + s.method + '"]');
        if (sel) sel.checked = true;
      }
    }

    /* ---- waiting on the provider ---- */
    if (s.awaitingProvider()) {
      body += '' +
      '<div class="card card--pad mt-4">' +
        '<p class="text-sm">Waiting for the payment provider to confirm. This page will not mark the order ' +
          "Paid on its own — the status above only changes when the provider replies.</p>" +
        '<button class="btn btn--outline btn--block mt-4" type="button" id="abandonBtn">' +
          icon("x") + "I closed the payment page without paying</button>" +
      "</div>" +

      gatewayBlock("The provider has not replied yet. When it does, the status above updates.");
    }

    /* ---- money confirmed -> paid, receipt + tracking issued ---- */
    if (s.isPaid()) {
      body += '' +
      '<div class="card card--pad mt-4 paystate-card--paid">' +
        '<div class="receipt-grid">' +
          '<div class="receipt-grid__item"><span>Receipt</span><strong class="mono">' + esc(s.receipt) + "</strong></div>" +
          '<div class="receipt-grid__item"><span>Tracking number</span><strong class="mono">' + esc(s.tracking) + "</strong></div>" +
        "</div>" +
        '<a class="btn btn--gold btn--block mt-4" href="track.html?no=' + encodeURIComponent(s.tracking) + '">' +
          icon("search") + "Track this shipment</a>" +
        '<button class="btn btn--outline btn--block mt-3" type="button" id="copyReceiptBtn">' +
          icon("clipboard") + "Copy receipt details</button>" +
      "</div>";
    }

    host.innerHTML = body;
    SP.hydrateIcons(host);

    /* wire the controls for the current state */
    const payBtn = $("#payNowBtn");
    if (payBtn) {
      payBtn.addEventListener("click", function () {
        const picked = host.querySelector('input[name=payMethod]:checked');
        const id = picked ? picked.getAttribute("value") : session.method;
        if (!id) { toast("Choose a payment method to continue.", "error"); return; }
        session.selectMethod(id);
        const r = session.payNow(id);
        if (!r.ok) { toast("Could not start the payment: " + r.reason, "error"); return; }
        toast("Payment sent to the provider. Status: Pending.", "info");
        paintPayment();
      });
    }

    const ab = $("#abandonBtn");
    if (ab) {
      ab.addEventListener("click", function () {
        session.customerAbandoned();
        toast("Checkout closed. Status: Pending / Unpaid. Nothing was charged.", "info");
        paintPayment();
      });
    }

    const cp = $("#copyReceiptBtn");
    if (cp) {
      cp.addEventListener("click", function () {
        const text = [
          "SUDI-POST PAYMENT RECEIPT",
          "Reference: " + session.ref,
          "Receipt: " + session.receipt,
          "Tracking: " + session.tracking,
          "Amount: " + F.money(session.amount) + " (" + session.weight + " kg)",
          "Method: " + methodLabel(session.method),
          "Provider ref: " + session.providerRef,
          "Confirmed: " + F.dateTime(session.paidAt),
          "— Sudi-Post, " + SP.BRAND.phones.main
        ].join("\n");
        SP.copyText(text).then(function (ok) {
          toast(ok ? "Receipt copied." : "Could not copy automatically.", ok ? "success" : "error");
        });
      });
    }

    wireGateway();
  }

  /* ----------------------------------------------------------- gateway --- */
  /* Stands in for the payment provider. In production these two buttons are
     replaced by the provider's webhook / callback (see SP.API). They are the
     only path from Pending to Paid or Failed, which is the whole point. */
  function gatewayBlock(hint) {
    return '' +
    '<div class="card card--pad mt-4 pay-gateway" data-gateway>' +
      '<div class="pay-gateway__head">' +
        '<span class="pay-gateway__tag">Payment provider</span>' +
        '<span class="text-xs text-muted">simulated — no live gateway connected</span>' +
      "</div>" +
      '<p class="text-sm mt-3">' + esc(hint) + "</p>" +
      '<div class="pay-gateway__actions mt-4">' +
        '<button class="btn btn--outline" type="button" data-provider="ok">' +
          icon("check-circle") + "Provider confirms payment</button>" +
        '<button class="btn btn--ghost" type="button" data-provider="no">' +
          icon("x") + "Provider declines payment</button>" +
      "</div>" +
    "</div>";
  }

  function wireGateway() {
    const box = document.querySelector("[data-gateway]");
    if (!box) return;
    box.addEventListener("click", function (e) {
      const btn = e.target.closest("[data-provider]");
      if (!btn) return;
      const ok = btn.getAttribute("data-provider") === "ok";
      const r = session.providerConfirm({
        ok: ok,
        providerRef: ok ? "PRV-" + Date.now().toString(36).slice(-4).toUpperCase() : null,
        reason: ok ? null : "The provider declined this payment."
      });
      if (!r.ok) { toast("Ignored: " + r.reason, "error"); return; }
      if (ok) {
        toast("Provider confirmed. Payment is now Paid.", "success");
      } else {
        toast("Provider declined. Payment Failed — nothing charged.", "error");
      }
      paintPayment();
    });
  }

  /* ------------------------------------------------------ published rate -- */
  function fullRateTable() {
    const host = $("#fullRateTable");
    if (!host) return;
    host.innerHTML = '' +
    '<div class="rate-row rate-row__head"><span>Weight</span><span class="text-right">Price</span></div>' +
    L.table.map(function (kg) {
      const q = SP.rates.luggage(kg);
      return '' +
      '<div class="rate-row rate-row--luggage">' +
        '<span><span class="rate-row__zone">' + kg + " KG</span>" +
        '<span class="rate-row__type">' + kg + " × " + F.money(L.perKg) + "</span></span>" +
        '<span class="rate-row__std">' + F.money(q.total) + "</span>" +
      "</div>";
    }).join("");

    const fn = $("#rateFootnote");
    if (fn) {
      fn.textContent = "Every kilogram costs " + F.money(L.perKg) +
        " SSP on every route we serve. Fractional kilograms are charged pro rata, so 3.5 KG = 80,500 SSP. " +
        "The calculator total is the full amount payable — no surcharges are added.";
    }
  }

  /* --------------------------------------------------- payment explainer -- */
  function payFlow() {
    const host = $("#payFlow");
    if (!host) return;
    const steps = [
      { icon: "package", title: "Enter your weight", body: "Type the weight in kilograms. The total is worked out for you at 23,000 SSP per kilogram." },
      { icon: "credit-card", title: "Choose a method, press PAY NOW", body: "Pick Mobile Money, card, bank transfer or cash on delivery, then press PAY NOW." },
      { icon: "clock", title: "Status becomes Pending", body: "We have sent the payment to the provider. The status is Pending — it is not paid yet." },
      { icon: "shield-check", title: "Provider confirms the money", body: "Only when the payment provider confirms receipt do we mark the order Paid. A decline shows Failed." }
    ];
    host.innerHTML = steps.map(function (s, i) {
      return '' +
      '<li class="payflow__step">' +
        '<span class="payflow__num">' + (i + 1) + "</span>" +
        '<span class="payflow__icon">' + icon(s.icon) + "</span>" +
        '<span class="payflow__body">' +
          '<span class="payflow__title">' + esc(s.title) + "</span>" +
          '<span class="payflow__text">' + esc(s.body) + "</span>" +
        "</span>" +
      "</li>";
    }).join("");
  }

  function faqs() {
    const host = $("#ratesFaq");
    if (!host) return;
    const picks = [2, 3, 0, 4];
    host.innerHTML = picks.map(function (i, n) {
      const f = SP.FAQS[i];
      if (!f) return "";
      return '<details class="accordion__item"' + (n === 0 ? " open" : "") + "><summary>" + esc(f.q) +
        '</summary><div class="accordion__body"><p>' + esc(f.a) + "</p></div></details>";
    }).join("");
  }

  /* --------------------------------------------------------------- sync -- */
  function sync(immediate) {
    const raw = $("#weight").value;
    const w = parseFloat(raw);
    if (!isFinite(w) || w <= 0) return;

    const min = L.min, max = L.max;
    if (w < min || w > max) {
      const err = $("#weightErr");
      if (err) err.textContent = "Enter a weight between " + min + " kg and " + max + " kg.";
      $("#weight").classList.add("is-invalid");
      return;
    }
    const err = $("#weightErr");
    if (err) err.textContent = "";
    $("#weight").classList.remove("is-invalid");

    quote = SP.rates.luggage(w);
    paintQuote(quote);
  }

  /* --------------------------------------------------------------- init -- */
  function init() {
    if (!$("#calcForm")) return;
    buildChips();
    fullRateTable();
    payFlow();
    faqs();

    const onInput = debounce(function () { sync(); }, 180);
    $("#weight").addEventListener("input", onInput);
    $("#weight").addEventListener("change", function () { sync(); });
    $("#calcForm").addEventListener("submit", function (e) { e.preventDefault(); sync(); });

    /* the price is correct the moment the page loads */
    sync();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
