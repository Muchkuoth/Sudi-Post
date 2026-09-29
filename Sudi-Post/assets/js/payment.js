/* ==========================================================================
   SUDI-POST — Payment / checkout
   Provider-neutral: no gateway SDK is loaded. The simulated flow in
   confirm() marks exactly where a real PSP integration would go.
   ========================================================================== */
(function () {
  "use strict";
  const { icon, $, $$, esc, toast, paymentBadge, money, today, validateForm, bindValidation, getData, setLoading } = SP;
  const F = SP.fmt;

  const STEPS = ["Review", "Method", "Confirm", "Receipt"];
  let invoice = null;
  let method = null;

  /* ------------------------------------------------------ per-method forms
     Markup is written out literally (rather than generated from a field list)
     so the ids are static and the build audit can verify them. */
  const FIELDS = {
    "mobile-money": {
      hint: "You will receive a prompt on your phone. Keep it open until it confirms.",
      html:
        '<div class="field"><label class="label" for="mmPhone">Mobile money number <span class="req">*</span></label>' +
          '<input class="input" type="tel" id="mmPhone" name="phone" placeholder="+211 9XX XXX XXX" ' +
          'data-rules="required|phone" aria-describedby="mmPhoneErr"><div class="field-error" id="mmPhoneErr"></div></div>' +
        '<div class="field"><label class="label" for="mmNetwork">Network <span class="req">*</span></label>' +
          '<select class="select" id="mmNetwork" name="network" data-rules="required" aria-describedby="mmNetworkErr">' +
          "<option>MTN Mobile Money</option><option>Orange Money</option><option>TeleMoney</option>" +
          '</select><div class="field-error" id="mmNetworkErr"></div></div>'
    },
    card: {
      hint: "We never store your full card number — only the last four digits appear on the receipt.",
      html:
        '<div class="field span-2"><label class="label" for="cName">Name on card <span class="req">*</span></label>' +
          '<input class="input" type="text" id="cName" name="cardname" placeholder="As printed on the card" ' +
          'data-rules="required|minlen:3" aria-describedby="cNameErr"><div class="field-error" id="cNameErr"></div></div>' +
        '<div class="field span-2"><label class="label" for="cNumber">Card number <span class="req">*</span></label>' +
          '<input class="input" type="text" id="cNumber" name="cardnumber" placeholder="4111 1111 1111 1111" inputmode="numeric" ' +
          'data-rules="required|digits:12" aria-describedby="cNumberErr"><div class="field-error" id="cNumberErr"></div></div>' +
        '<div class="field"><label class="label" for="cExp">Expiry (MM/YY) <span class="req">*</span></label>' +
          '<input class="input" type="text" id="cExp" name="expiry" placeholder="09/28" inputmode="numeric" ' +
          'data-rules="required|minlen:5" aria-describedby="cExpErr"><div class="field-error" id="cExpErr"></div></div>' +
        '<div class="field"><label class="label" for="cCvc">Security code <span class="req">*</span></label>' +
          '<input class="input" type="text" id="cCvc" name="cvc" placeholder="123" inputmode="numeric" autocomplete="off" ' +
          'data-rules="required|digits:3|maxlen:4" aria-describedby="cCvcErr"><div class="field-error" id="cCvcErr"></div></div>'
    },
    bank: {
      hint: "Transfer using the details below, then return here and confirm. Verification can take up to one business day.",
      html:
        '<div class="field span-2"><label class="label" for="bRef">Payment reference <span class="req">*</span></label>' +
          '<input class="input" type="text" id="bRef" name="ref" placeholder="Bank reference or transfer note" ' +
          'data-rules="required|minlen:4" aria-describedby="bRefErr"><div class="field-error" id="bRefErr"></div></div>'
    },
    cash: {
      hint: "Pay at the branch, then bring the receipt to the counter and we will mark the invoice paid.",
      html:
        '<div class="field"><label class="label" for="cBranch">Branch <span class="req">*</span></label>' +
          '<select class="select" id="cBranch" name="branch" data-rules="required" aria-describedby="cBranchErr">' +
          "<option>Juba Head Office</option><option>Juba City Centre</option>" +
          "<option>Juba International Airport</option><option>Addis Ababa Branch</option>" +
          '</select><div class="field-error" id="cBranchErr"></div></div>' +
        '<div class="field"><label class="label" for="cWhen">When will you pay? <span class="req">*</span></label>' +
          '<select class="select" id="cWhen" name="when" data-rules="required" aria-describedby="cWhenErr">' +
          "<option>Today</option><option>Tomorrow</option><option>Within the next 3 days</option>" +
          '</select><div class="field-error" id="cWhenErr"></div></div>'
    },
    cod: {
      hint: "The recipient pays the delivery agent in cash. A collection fee may apply on some routes.",
      html:
        '<div class="field"><label class="label" for="codName">Who will pay on delivery? <span class="req">*</span></label>' +
          '<input class="input" type="text" id="codName" name="payername" placeholder="Recipient name" ' +
          'data-rules="required|minlen:2" aria-describedby="codNameErr"><div class="field-error" id="codNameErr"></div></div>' +
        '<div class="field"><label class="label" for="codPhone">Their phone number <span class="req">*</span></label>' +
          '<input class="input" type="tel" id="codPhone" name="payerphone" placeholder="+251 9XX XXX XXX" ' +
          'data-rules="required|phone" aria-describedby="codPhoneErr"><div class="field-error" id="codPhoneErr"></div></div>'
    }
  };

  const LOGOS = { "mobile-money": "MM", card: "CARD", bank: "BANK", cash: "CASH", cod: "COD" };

  /* --------------------------------------------------------------- invoice */
  function pickInvoice() {
    const q = new URLSearchParams(location.search);
    const wanted = q.get("invoice");
    const shipment = q.get("shipment");
    const list = SP.store.listInvoices();

    if (wanted) {
      const hit = list.filter(function (i) { return i.id.toUpperCase() === wanted.toUpperCase(); })[0];
      if (hit) return hit;
    }
    if (shipment) {
      const hit = list.filter(function (i) { return i.shipment === shipment; })[0];
      if (hit) return hit;
    }
    const user = SP.auth.current();
    const own = user && user.name ? list.filter(function (i) { return i.customer === user.name; }) : [];
    const pool = own.length ? own : list;
    return pool.filter(function (i) { return i.status !== "paid"; })[0] || pool[0] || null;
  }

  /* ------------------------------------------------------------- rendering */
  function steps(active) {
    $("#paySteps").innerHTML = STEPS.map(function (label, i) {
      const cls = i < active ? "pay-step is-done" : i === active ? "pay-step is-active" : "pay-step";
      const num = i < active ? icon("check", "", { size: 13 }) : String(i + 1);
      return '' +
      '<span class="' + cls + '" role="listitem">' +
        '<span class="pay-step__num">' + num + "</span><span>" + esc(label) + "</span>" +
      "</span>" +
      (i < STEPS.length - 1 ? '<span class="pay-step__line"></span>' : "");
    }).join("");
  }

  function summary() {
    if (!invoice) {
      $("#paySummary").innerHTML = '<div class="empty-state"><p>No invoice selected.</p></div>';
      return;
    }
    const ship = SP.SHIPMENTS.filter(function (s) { return s.tracking === invoice.shipment; })[0];
    $("#paySummary").innerHTML = '' +
    '<div class="app-card__head"><h2 class="app-card__title">Invoice summary</h2>' + paymentBadge(invoice.status) + "</div>" +
    '<div class="data-row"><div class="data-row__main">' +
      '<div class="data-row__title mono">' + esc(invoice.id) + "</div>" +
      '<div class="data-row__sub">Issued ' + esc(F.date(invoice.issued)) + " · due " + esc(F.date(invoice.due)) + "</div>" +
    "</div></div>" +
    (ship
      ? '<div class="data-row"><div class="data-row__main">' +
        '<div class="data-row__title">Shipment</div>' +
        '<div class="data-row__sub mono">' + esc(ship.tracking) + " · " + esc(ship.origin) + " → " + esc(ship.destination) + "</div>" +
        '<div class="data-row__sub">' + esc(ship.service) + " · " + esc(ship.weight) + " kg</div>" +
      "</div></div>"
      : "") +
    '<div class="invoice-doc__total" style="margin-top:var(--sp-3);padding-top:var(--sp-3)">' +
      "<span>Amount due</span><span>" + esc(money(invoice.amount)) + "</span></div>" +
    '<div class="text-xs text-muted mt-2">≈ ' + esc(F.usd(invoice.amount)) + " USD at today's rate</div>" +
    (invoice.status === "paid"
      ? '<div class="alert alert--success mt-4"><span>' + icon("check") + '</span><div class="alert__body">This invoice is already paid' +
        (invoice.receipt ? " — receipt " + esc(invoice.receipt) : "") + ".</div></div>"
      : '<div class="alert alert--info mt-4"><span>' + icon("info") + '</span><div class="alert__body">Paying this invoice does not ' +
        "automatically release the parcel. Freight is released once payment clears.</div></div>");
  }

  function methods() {
    $("#payMethods").innerHTML = SP.PAYMENT_METHODS.map(function (m) {
      return '' +
      '<label class="pay-method">' +
        '<input type="radio" name="method" value="' + esc(m.id) + '">' +
        '<span class="pay-method__logo">' + esc(LOGOS[m.id] || m.logo) + "</span>" +
        "<span><span class=\"pay-method__name\">" + esc(m.label) + "</span>" +
        '<span class="pay-method__desc">' + esc(m.desc) + "</span></span>" +
      "</label>";
    }).join("");

    $$("#payMethods input").forEach(function (r) {
      r.addEventListener("change", function () {
        method = r.value;
        detail();
        $("#payBtnAmount").textContent = money(invoice.amount);
        alert("");
      });
    });
  }

  function cardFormatting() {
    const number = $("#cNumber");
    const expiry = $("#cExp");
    number.addEventListener("input", function () {
      const digits = number.value.replace(/\D/g, "").slice(0, 19);
      number.value = digits.replace(/(.{4})/g, "$1 ").trim();
      number.setCustomValidity(luhnOk(digits) || digits.length < 12 ? "" : "That card number does not look right.");
    });
    expiry.addEventListener("input", function () {
      const d = expiry.value.replace(/\D/g, "").slice(0, 4);
      expiry.value = d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d;
    });
  }

  function luhnOk(digits) {
    if (digits.length < 12) return false;
    let sum = 0;
    let alt = false;
    for (let i = digits.length - 1; i >= 0; i--) {
      let n = Number(digits.charAt(i));
      if (alt) { n *= 2; if (n > 9) n -= 9; }
      sum += n;
      alt = !alt;
    }
    return sum % 10 === 0;
  }

  function detail() {
    const box = $("#payDetail");
    if (!method) { box.hidden = true; return; }
    const cfg = FIELDS[method];
    box.hidden = false;
    $("#payDetailHint").textContent = cfg.hint;
    $("#payFields").innerHTML = cfg.html + (method === "bank" ? bankBox() : "");
    SP.bindValidation($("#payForm"));
    if (method === "card") cardFormatting();
  }

  function bankBox() {
    return '' +
    '<div class="card card--soft card--pad span-2" style="margin-top:var(--sp-2)">' +
      '<p class="text-xs uppercase fw-800" style="letter-spacing:var(--ls-widest);color:var(--sp-grey-500)">Transfer to</p>' +
      '<p class="mono text-sm mt-2" style="line-height:1.9">' +
        "Sudi-Post PLC<br>Bank of Juba — Current Account<br>" +
        "Account: <strong>0001 2345 6789 0</strong><br>" +
        "Reference: <strong>" + esc(invoice ? invoice.id : "INV-…") + "</strong>" +
      "</p>" +
      '<button class="btn btn--outline btn--sm mt-3" type="button" id="bankCopy">' + icon("file-text") + "Copy details</button>" +
    "</div>";
  }



  function alert(msg, kind) {
    const box = $("#payAlert");
    if (!msg) { box.innerHTML = ""; return; }
    box.innerHTML = '<div class="alert alert--' + (kind || "danger") + '" style="margin-bottom:var(--sp-4)">' +
      icon(kind === "success" ? "check-circle" : kind === "info" ? "info" : "alert") +
      '<div class="alert__body">' + esc(msg) + "</div></div>";
    box.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  /* ------------------------------------------------------------- processing */
  function confirm(e) {
    e.preventDefault();
    if (!method) { alert("Choose a payment method to continue."); return; }
    if (!SP.validateForm($("#payForm"))) { alert("Please complete the highlighted fields."); toast("Check the highlighted fields.", "error"); return; }
    if (invoice && invoice.status === "paid") { alert("This invoice is already paid."); return; }

    steps(2);
    const form = $("#payForm");
    const btn = $("#paySubmit");
    form.hidden = true;
    $("#payProcessing").hidden = false;
    $("#payProcessingMsg").textContent = method === "bank"
      ? "Waiting for the bank confirmation…"
      : "Confirm with your provider. This normally takes a few seconds.";
    setLoading(btn, true, "Processing.");

    const bar = $("#payProgressBar");
    let pct = 12;
    const tick = setInterval(function () {
      /* stop short of 100%: the bar is NOT a payment, and completion is the
         provider's decision, not ours */
      pct = Math.min(70, pct + Math.round(Math.random() * 8));
      bar.style.width = pct + "%";
    }, 320);

    /* The Pay button only opens a payment intent. It must never mark the
       invoice paid on its own -- a timeout here used to auto-settle, which
       wrongly told customers their money had arrived. The status now stays
       "pending" until the provider confirms (see openPending).

       In production: POST /api/v1/payments, then clear this state from the
       provider's webhook callback. */
    setTimeout(function () {
      clearInterval(tick);
      openPending();
    }, 1400);
  }

  /* ------------------------------------------------- awaiting the provider */
  function openPending() {
    if (invoice) {
      invoice = SP.store.patchInvoice(invoice.id, { status: "pending" });
    }
    steps(2);
    $("#payProcessing").hidden = true;
    $("#paySuccess").hidden = true;
    $("#payPending").hidden = false;
    $("#payPendingState").innerHTML = statusHtml("pending");
    SP.hydrateIcons($("#payPending"));
    summary();
    toast("Payment sent to the provider. Status: Pending.", "info");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function statusHtml(status) {
    const v = SP.payStateView(status);
    return '<div class="paystate paystate--' + v.tone + '" data-state="' + status + '">' +
      '<div class="paystate__top">' +
        '<span class="paystate__icon">' + icon(v.icon, "", { size: 20 }) + "</span>" +
        "<div>" +
          '<div class="paystate__label">' + esc(v.label) + "</div>" +
          '<div class="paystate__blurb">' + esc(v.blurb) + "</div>" +
        "</div>" +
      "</div>" +
      '<dl class="paystate__meta">' +
        "<dt>Invoice</dt><dd class=\"mono\">" + esc(invoice ? invoice.id : "—") + "</dd>" +
        "<dt>Amount</dt><dd>" + esc(money(invoice ? invoice.amount : 0)) + "</dd>" +
        "<dt>Method</dt><dd>" + esc(labelFor(method)) + "</dd>" +
      "</dl>" +
    "</div>";
  }

  /* Provider declined, or the customer walked away without paying. Neither
     is a success, and neither may be recorded as one. */
  function providerDeclined() {
    if (invoice) invoice = SP.store.patchInvoice(invoice.id, { status: "failed" });
    reopen("Payment failed", "The provider declined the payment. Nothing was taken from your account. You can choose another method and try again.", "danger");
    toast("Payment failed — nothing was charged.", "error");
  }

  function customerAbandoned() {
    if (invoice) invoice = SP.store.patchInvoice(invoice.id, { status: "unpaid" });
    reopen("Payment pending / unpaid", "You closed the payment page before paying. No money has been received, so nothing was charged. You can pay any time with the same reference.", "warning");
    toast("Checkout closed. Status: Pending / Unpaid.", "info");
  }

  function reopen(title, body, kind) {
    $("#payPending").hidden = true;
    $("#payProcessing").hidden = true;
    $("#paySuccess").hidden = true;
    $("#payForm").hidden = false;
    steps(kind === "danger" ? 3 : 1);
    alert(title + " — " + body, kind);
    summary();
  }


  /* Called ONLY from the provider confirmation. Never from a timer or the
     customer's click on Pay. */
  function settle() {
    const receipt = "RCP-2026-" + Math.floor(1000 + Math.random() * 8999);
    const paidAt = new Date().toISOString();

    if (invoice) {
      invoice = SP.store.patchInvoice(invoice.id, {
        status: "paid", method: labelFor(method), receipt: receipt, paidAt: paidAt
      });
    }

    const ship = SP.SHIPMENTS.filter(function (s) { return invoice && s.tracking === invoice.shipment; })[0];
    if (ship) {
      SP.store.updateShipment(ship.tracking, {
        payment: { status: "paid", method: method, receipt: receipt, paidAt: paidAt }
      });
    }

    SP.store.pushNotification({
      title: "Payment received",
      body: money(invoice.amount) + " for " + invoice.id + " · receipt " + receipt,
      at: paidAt, read: false
    });

    steps(3);
    $("#payProcessing").hidden = true;
    $("#payPending").hidden = true;
    $("#paySuccess").hidden = false;
    $("#paySuccessMsg").innerHTML = "Thank you. <strong>" + esc(money(invoice.amount)) +
      "</strong> for invoice <span class=\"mono\">" + esc(invoice.id) + "</span> has been received." +
      (method === "bank" ? " This will show as cleared once the bank confirms, usually within one business day." : "");
    $("#payReceipt").innerHTML = receiptHtml(receipt);
    $("#payInvoiceLink").setAttribute("href", "account.html?view=invoices");
    summary();
    toast("Payment received. Receipt " + receipt + ".", "success");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function labelFor(id) {
    const m = SP.PAYMENT_METHODS.filter(function (x) { return x.id === id; })[0];
    return m ? m.label : "Unknown";
  }

  function receiptHtml(receipt) {
    return '' +
    '<div class="flex items-center justify-between gap-3" style="flex-wrap:wrap">' +
      "<strong>Receipt " + esc(receipt) + "</strong>" +
      '<span class="receipt-stamp">' + icon("check", "", { size: 13 }) + "Paid</span>" +
    "</div>" +
    '<div class="table-wrap mt-4"><table class="table table--compact"><tbody>' +
      "<tr><td>Invoice</td><td class=\"mono\">" + esc(invoice.id) + "</td></tr>" +
      "<tr><td>Shipment</td><td class=\"mono\">" + esc(invoice.shipment) + "</td></tr>" +
      "<tr><td>Method</td><td>" + esc(labelFor(method)) + "</td></tr>" +
      "<tr><td>Date</td><td>" + esc(F.dateTime(new Date().toISOString())) + "</td></tr>" +
      "<tr><td>Status</td><td>" + paymentBadge("paid") + "</td></tr>" +
    "</tbody></table></div>" +
    '<div class="invoice-doc__total"><span>Amount paid</span><span>' + esc(money(invoice.amount)) + "</span></div>" +
    '<p class="text-xs text-muted mt-3">Keep this reference for any query about this payment.</p>';
  }

  /* ------------------------------------------------------------------ init */
  function init() {
    invoice = pickInvoice();
    steps(0);
    summary();

    if (invoice && invoice.status === "paid") {
      steps(3);
      $("#payForm").hidden = true;
      $("#paySuccess").hidden = false;
      method = String(invoice.method || "").toLowerCase().replace(/[^a-z]/g, "") ||
        (invoice.method === "Cash" ? "cash" : "bank");
      $("#paySuccessMsg").innerHTML = "This invoice was already paid" +
        (invoice.receipt ? " — receipt <span class=\"mono\">" + esc(invoice.receipt) + "</span>" : "") + ".";
      $("#payReceipt").innerHTML = receiptHtml(invoice.receipt || "—");
      return;
    }

    methods();
    const form = $("#payForm");
    form.hidden = false;
    bindValidation(form);
    form.addEventListener("submit", confirm);

    $("#payPrint").addEventListener("click", function () { window.print(); });

    /* The only route from pending to paid. Deliberately wired to the
       provider, not to the Pay button. */
    $("#payConfirmOk").addEventListener("click", function () {
      $("#payGatewayHint").textContent = "Confirming with the provider…";
      SP.hydrateIcons($("#payGateway"));
      setTimeout(function () { settle(); }, 500);
    });
    $("#payConfirmNo").addEventListener("click", providerDeclined);
    $("#payAbandon").addEventListener("click", customerAbandoned);

    document.addEventListener("click", function (e) {
      const copy = e.target.closest("#bankCopy");
      if (!copy) return;
      const text = "Sudi-Post PLC\nBank of Juba — Current Account\nAccount: 0001 2345 6789 0\nReference: " + invoice.id;
      if (SP.copyText) { SP.copyText(text); toast("Bank details copied.", "success"); }
      else { toast("Copy failed — please select the text manually.", "error"); }
    });

    const pre = new URLSearchParams(location.search).get("method");
    if (pre && FIELDS[pre]) {
      const radio = $('#payMethods input[value="' + pre + '"]');
      if (radio) { radio.checked = true; method = pre; detail(); }
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
