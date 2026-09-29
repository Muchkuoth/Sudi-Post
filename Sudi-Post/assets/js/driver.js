/* ==========================================================================
   SUDI-POST — Driver route app
   Mobile-first, single column, works with a weak connection: the manifest is
   held in memory and every action is queued locally, then flushed.
   ========================================================================== */
(function () {
  "use strict";
  const { icon, $, $$, esc, toast, money, today, openModal, copyText } = SP;
  const F = SP.fmt;

  let user = null;
  let me = null;
  let stops = [];
  let queue = [];
  let online = true;

  /* ---------------------------------------------------------------- gating */
  function gate() {
    user = SP.auth.current();
    if (!user || user.role !== "driver") {
      $("#drGate").hidden = false;
      return false;
    }
    $("#drApp").hidden = false;
    return true;
  }

  /* -------------------------------------------------------------- manifest */
  function buildManifest() {
    const all = SP.SHIPMENTS.filter(function (s) {
      return s.driverId === (me ? me.id : firstDriverId()) && s.status !== "delivered" && s.status !== "returned";
    });
    const pool = all.length ? all : SP.SHIPMENTS.filter(function (s) {
      return s.status === "transit" || s.status === "outfordeliv" || s.status === "processing";
    });

    stops = pool.map(function (s, i) {
      return {
        seq: i + 1,
        tracking: s.tracking,
        status: s.status,
        receiver: s.receiver,
        sender: s.sender,
        city: s.receiver.city,
        address: s.receiver.address,
        phone: s.receiver.phone,
        cod: Number(s.cod) || 0,
        parcels: s.weight > 20 ? 3 : s.weight > 5 ? 2 : 1,
        weight: s.weight,
        service: s.service,
        note: s.type === "document" ? "Documents — signature required" : "",
        attempts: 0,
        done: false,
        failed: false,
        collected: 0,
        at: null
      };
    });
  }

  /* ------------------------------------------------------------- rendering */
  function summary() {
    const done = stops.filter(function (s) { return s.done; });
    const failed = stops.filter(function (s) { return s.failed; });
    const remaining = stops.length - done.length - failed.length;
    const cash = done.reduce(function (a, s) { return a + (s.collected || 0); }, 0);

    const card = function (label, value, sub, ico, tone) {
      return '' +
      '<div class="app-card" style="padding:var(--sp-4)">' +
        '<div class="flex items-center justify-between gap-2">' +
          '<span class="app-card__sub">' + esc(label) + "</span>" +
          '<span class="icon-box icon-box--sm icon-box--' + (tone || "soft") + '">' + icon(ico, "", { size: 16 }) + "</span>" +
        "</div>" +
        '<div class="app-card__title mt-1" style="font-size:var(--fs-xl)">' + esc(value) + "</div>" +
        '<div class="app-card__sub mt-1">' + esc(sub) + "</div>" +
      "</div>";
    };

    $("#drSummary").innerHTML = [
      card("Stops left", String(remaining), stops.length + " on the manifest", "package", "navy"),
      card("Delivered", String(done.length), done.length ? "Proof captured" : "None yet", "check-circle", "success"),
      card("Failed", String(failed.length), failed.length ? "Return to depot" : "None", "alert", failed.length ? "danger" : "soft"),
      card("Cash collected", money(cash), "Hand in at depot", "wallet", "gold")
    ].join("");

    const pct = stops.length ? Math.round(((done.length + failed.length) / stops.length) * 100) : 0;
    $("#drProgress").textContent = (done.length + failed.length) + " / " + stops.length;
    const bar = $(".progress__bar");
    if (bar) bar.style.width = pct + "%";
  }

  function endSummary() {
    const done = stops.filter(function (s) { return s.done; });
    const failed = stops.filter(function (s) { return s.failed; });
    const cash = done.reduce(function (a, s) { return a + (s.collected || 0); }, 0);
    const parcels = done.reduce(function (a, s) { return a + s.parcels; }, 0);

    $("#drEndSummary").innerHTML = '' +
    '<div class="data-row"><div class="data-row__main"><div class="data-row__title">Delivered</div>' +
      '<div class="data-row__sub">' + done.length + " stops · " + parcels + " parcels</div></div>" +
      '<div class="data-row__end">' + icon("check-circle", "", { size: 22 }) + "</div></div>" +
    '<div class="data-row"><div class="data-row__main"><div class="data-row__title">Failed attempts</div>' +
      '<div class="data-row__sub">' + failed.length + " to return to the depot</div></div>" +
      '<div class="data-row__end">' + icon("alert", "", { size: 22 }) + "</div></div>" +
    '<div class="data-row"><div class="data-row__main"><div class="data-row__title">Cash to hand in</div>' +
      '<div class="data-row__sub">' + esc(F.money ? F.money(cash) : money(cash)) + "</div></div>" +
      '<div class="data-row__end">' + icon("wallet", "", { size: 22 }) + "</div></div>" +
    (queue.length
      ? '<div class="alert alert--warning mt-3">' + icon("upload") +
        '<div class="alert__body">' + queue.length + " update" + (queue.length === 1 ? "" : "s") +
        " waiting to sync.</div></div>"
      : '<div class="alert alert--success mt-3">' + icon("cloud") +
        '<div class="alert__body">Everything is synced.</div></div>');
  }

  function stopCard(stop) {
    const state = stop.done ? "is-done" : stop.failed ? "is-failed" : "";
    const cls = stop.done ? "badge--success" : stop.failed ? "badge--danger" :
      stop.status === "outfordeliv" ? "badge--gold" : "badge--info";
    const label = stop.done ? "Delivered" : stop.failed ? "Failed" :
      stop.status === "outfordeliv" ? "Out for delivery" : "In transit";

    return '' +
    '<div class="route-card" data-stop="' + esc(stop.tracking) + '">' +
      '<div class="route-card__head">' +
        "<div>" +
          '<div class="route-card__code">Stop ' + stop.seq + " · " + esc(stop.tracking) + "</div>" +
          '<div class="text-sm text-muted mt-1">' + esc(stop.service) + " · " + stop.parcels +
            " parcel" + (stop.parcels === 1 ? "" : "s") + " · " + esc(String(stop.weight)) + " kg</div>" +
        "</div>" +
        '<span class="badge badge--' + cls + '">' + esc(label) + "</span>" +
      "</div>" +

      '<div class="route-card__stop">' +
        '<span class="route-card__stop-icon">' + icon("map-pin") + "</span>" +
        '<div class="min-w-0">' +
          '<div class="fw-700" style="color:var(--sp-navy-800)">' + esc(stop.receiver.name) + "</div>" +
          '<div class="text-sm" style="color:var(--sp-grey-700)">' + esc(stop.address) + ", " + esc(stop.city) + "</div>" +
          '<a class="customer-box__phone" href="tel:' + esc(String(stop.phone).replace(/\s/g, "")) + '">' +
            icon("phone", "", { size: 16 }) + esc(stop.phone) + "</a>" +
          (stop.note ? '<div class="text-xs mt-2" style="color:var(--sp-warning)">' + icon("alert", "", { size: 14 }) + " " +
            esc(stop.note) + "</div>" : "") +
          (stop.cod ? '<div class="badge badge--warning mt-2">Collect ' + esc(money(stop.cod)) + "</div>" : "") +
        "</div>" +
      "</div>" +

      (stop.done
        ? '<div class="alert alert--success mt-3">' + icon("check-circle") +
          '<div class="alert__body">Delivered at ' + esc(F.time(stop.at)) + " · signature and photo captured" +
          (stop.collected ? " · " + esc(money(stop.collected)) + " collected" : "") + "</div></div>"
        : stop.failed
          ? '<div class="alert alert--danger mt-3">' + icon("alert") +
            '<div class="alert__body">Attempt ' + stop.attempts + " failed. Returning to depot.</div></div>"
          : '<div class="route-card__actions">' +
              '<a class="btn btn--outline btn--sm" target="_blank" rel="noopener" href="' + esc(navUrl(stop)) + '">' +
                icon("navigation") + "Navigate</a>" +
              '<a class="btn btn--outline btn--sm" href="tel:' + esc(String(stop.phone).replace(/\s/g, "")) + '">' +
                icon("phone") + "Call</a>" +
            "</div>" +
            '<button class="btn btn--gold btn--block mt-2" type="button" data-deliver="' + esc(stop.tracking) + '">' +
              icon("package") + "Deliver parcel</button>") +

      (stop.failed
        ? '<button class="btn btn--outline btn--block mt-2" type="button" data-retry="' + esc(stop.tracking) + '">' +
          icon("undo") + "Retry attempt</button>"
        : "") +
    "</div>";
  }

  function renderStops() {
    if (!stops.length) {
      $("#drStops").innerHTML = '<div class="route-card"><div class="empty-state">' +
        '<span class="empty-state__icon">' + icon("check-circle") + "</span>" +
        "<h3>Manifest clear</h3><p>No stops assigned to you right now. Check back before the next departure.</p></div></div>";
      return;
    }
    $("#drStops").innerHTML = stops.map(stopCard).join("");

    $$("[data-deliver]").forEach(function (b) {
      b.addEventListener("click", function () { deliverModal(b.getAttribute("data-deliver")); });
    });
    $$("[data-retry]").forEach(function (b) {
      b.addEventListener("click", function () {
        const s = find(b.getAttribute("data-retry"));
        if (!s) return;
        s.failed = false;
        s.attempts = 0;
        push("retry", { tracking: s.tracking });
        renderStops();
        summary();
        toast("Stop reopened for another attempt.", "success");
      });
    });

    const next = stops.filter(function (s) { return !s.done && !s.failed; })[0];
    $("#drBar").hidden = !next;
    if (next) $("#drNextLabel").textContent = "Stop " + next.seq;
  }

  function find(tracking) {
    return stops.filter(function (s) { return s.tracking === tracking; })[0];
  }

  /* OpenStreetMap deep link — no API key, no third-party script */
  function navUrl(stop) {
    const q = encodeURIComponent(stop.address + ", " + stop.city);
    return "https://www.openstreetmap.org/search?query=" + q;
  }

  /* ------------------------------------------------------------ sync queue */
  function push(kind, payload) {
    queue.push({ kind: kind, payload: payload, at: new Date().toISOString() });
    SP.store.set("driverQueue", queue);
    setOnlineText();
  }

  function setOnlineText() {
    const n = queue.length;
    const el = $("#drOnline");
    el.textContent = !online
      ? "Offline. " + n + " update" + (n === 1 ? "" : "s") + " will sync when you reconnect."
      : n
        ? n + " update" + (n === 1 ? "" : "s") + " waiting to sync."
        : "Connected. Location and delivery updates are syncing normally.";
    el.parentNode.className = online ? "gps-note" : "gps-note alert alert--warning";
  }

  function flush() {
    if (!queue.length) return;
    /* Simulated — replace with a single batched POST /api/v1/driver/sync.
       Signature and photo are data URLs; in production upload them as
       multipart form data rather than inlining them in a JSON body. */
    const batch = queue.slice();
    setTimeout(function () {
      batch.forEach(function (item) {
        if (item.kind !== "deliver") return;
        SP.store.updateShipment(item.payload.tracking, {
          status: "delivered",
          pod: {
            receiver: item.payload.receiver,
            at: item.payload.at,
            signature: item.payload.signature || null,
            photo: item.payload.photo || null,
            collected: item.payload.collected
          }
        });
      });
      queue = [];
      SP.store.set("driverQueue", queue);
      setOnlineText();
      endSummary();
    }, 500);
  }

  /* --------------------------------------------------------- deliver modal */
  function deliverModal(tracking) {
    const s = find(tracking);
    if (!s) return;

    let signature = null;
    let photo = null;

    const body =
      '<div class="customer-box">' +
        '<div class="customer-box__name">' + esc(s.receiver.name) + "</div>" +
        '<div class="customer-box__addr">' + esc(s.address) + ", " + esc(s.city) + "</div>" +
        '<div class="pkg-summary"><div><b>' + s.parcels + "</b>parcel" + (s.parcels === 1 ? "" : "s") + "</div>" +
          "<div><b>" + esc(String(s.weight)) + " kg</b>" + esc(s.service) + "</div>" +
          (s.cod ? '<div><b>' + esc(money(s.cod)) + "</b>to collect</div>" : "") + "</div>" +
      "</div>" +

      '<h4 class="mt-5">1. Who received it?</h4>' +
      '<div class="field"><label class="label" for="podName">Name of recipient <span class="req">*</span></label>' +
        '<input class="input" type="text" id="podName" value="' + esc(s.receiver.name) + '" data-rules="required" ' +
        'aria-describedby="podNameErr"><div class="field-error" id="podNameErr"></div></div>' +
      '<div class="check mt-3"><input type="checkbox" id="podSelf"><span>Delivered to the named recipient' +
        (s.receiver.name ? " (" + esc(s.receiver.name) + ")" : "") + "</span></div>" +

      (s.cod
        ? '<h4 class="mt-5">2. Cash collected</h4>' +
          '<div class="field"><label class="label" for="podCash">Amount received <span class="req">*</span></label>' +
            '<input class="input" type="number" id="podCash" inputmode="numeric" value="' + esc(String(s.cod)) + '" ' +
            'data-rules="required|min:' + s.cod + '" aria-describedby="podCashErr">' +
            '<div class="field-hint">Expected ' + esc(money(s.cod)) + ". Enter 0 if the recipient could not pay.</div>" +
            '<div class="field-error" id="podCashErr"></div></div>'
        : "") +

      '<h4 class="mt-5">' + (s.cod ? "3" : "2") + '. Signature</h4>' +
      '<p class="text-sm text-muted mb-3">Ask the recipient to sign in the box below.</p>' +
      '<div class="sign-pad" id="podPad">' +
        '<canvas id="podCanvas" width="640" height="240" aria-label="Signature pad"></canvas>' +
        '<span class="sign-pad__line"></span><span class="sign-pad__label">Sign here</span>' +
        '<button class="btn btn--outline btn--xs sign-pad__clear" type="button" data-clear-pad>Clear</button>' +
      "</div>" +

      '<h4 class="mt-5">' + (s.cod ? "4" : "3") + '. Photo of the parcel</h4>' +
      '<label class="photo-drop" for="podPhoto" id="podDrop">' +
        icon("camera") + "<strong>Tap to take or choose a photo</strong>" +
        "<small>Proof that the parcel was handed over</small>" +
      "</label>" +
      '<input type="file" id="podPhoto" accept="image/*" capture="environment" class="visually-hidden">' +
      '<div class="photo-preview" id="podPreview"></div>' +

      '<label class="check mt-5"><input type="checkbox" id="podFailed"><span>' +
        "I could not deliver — record a failed attempt instead</span></label>" +
      '<div class="field mt-3" id="podReasonBox" hidden>' +
        '<label class="label" for="podReason">Why not? <span class="req">*</span></label>' +
        '<select class="select" id="podReason" data-rules="required" aria-describedby="podReasonErr">' +
          "<option value=\"\">Select a reason</option>" +
          "<option>Recipient not available</option><option>Address not found</option>" +
          "<option>Refused by recipient</option><option>Cash not available</option>" +
          "<option>Parcel refused — damaged</option><option>Other</option>" +
        '</select><div class="field-error" id="podReasonErr"></div></div>';

    openModal(body, {
      title: "Proof of delivery",
      subtitle: "Stop " + s.seq + " · " + s.tracking,
      wide: true,
      onClose: null,
      footer:
        '<button class="btn btn--outline" type="button" data-modal-close>Cancel</button>' +
        '<button class="btn btn--gold" type="button" id="podSave">' + icon("check") + "Confirm delivery</button>"
    });

    SP.bindValidation($(".modal"));

    /* signature pad */
    const canvas = $("#podCanvas");
    if (canvas && canvas.getContext) {
      const ctx = canvas.getContext("2d");
      ctx.lineWidth = 2.4;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#16202B";
      let drawing = false;

      const pos = function (e) {
        const r = canvas.getBoundingClientRect();
        const p = e.touches ? e.touches[0] : e;
        return { x: (p.clientX - r.left) * (canvas.width / r.width), y: (p.clientY - r.top) * (canvas.height / r.height) };
      };
      const start = function (e) { e.preventDefault(); drawing = true; const p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); };
      const move = function (e) {
        if (!drawing) return;
        e.preventDefault();
        const p = pos(e);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        signature = canvas.toDataURL("image/png");
      };
      const end = function () { drawing = false; };

      canvas.addEventListener("mousedown", start);
      canvas.addEventListener("mousemove", move);
      window.addEventListener("mouseup", end);
      canvas.addEventListener("touchstart", start, { passive: false });
      canvas.addEventListener("touchmove", move, { passive: false });
      canvas.addEventListener("touchend", end);
    }

    const clear = $("[data-clear-pad]");
    if (clear) {
      clear.addEventListener("click", function () {
        const c = $("#podCanvas");
        c.getContext("2d").clearRect(0, 0, c.width, c.height);
        signature = null;
      });
    }

    const file = $("#podPhoto");
    file.addEventListener("change", function () {
      const f = file.files && file.files[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = function (ev) {
        photo = String(ev.target.result).slice(0, 400000);
        const prev = $("#podPreview");
        prev.style.display = "block";
        prev.innerHTML = '<img src="' + photo + '" alt="Photo of the delivered parcel">';
      };
      reader.readAsDataURL(f);
    });

    const failed = $("#podFailed");
    failed.addEventListener("change", function () {
      $("#podReasonBox").hidden = !failed.checked;
    });

    $("#podSave").addEventListener("click", function () {
      const modal = $(".modal");
      const name = $("#podName").value.trim();

      if (failed.checked) {
        if (!SP.validateField($("#podReason"))) { toast("Select a reason for the failed attempt.", "error"); return; }
        complete(s, { failed: true, reason: $("#podReason").value });
        return;
      }

      if (!name) { $("#podNameErr").textContent = "Enter who took the parcel."; toast("Enter the recipient's name.", "error"); return; }
      if (!signature) { toast("A signature is required for proof of delivery.", "error"); $("#podPad").scrollIntoView({ behavior: "smooth", block: "center" }); return; }

      let collected = 0;
      const cashInput = $("#podCash");
      if (cashInput) {
        collected = Number(cashInput.value) || 0;
        if (collected < s.cod) {
          $("#podCashErr").textContent = "That is less than the " + money(s.cod) + " due.";
          toast("Cash collected does not match the amount due.", "error");
          return;
        }
      }

      complete(s, {
        failed: false, receiver: name, signature: signature, photo: photo, collected: collected
      });
      void modal;
    });
  }

  function complete(stop, result) {
    const at = new Date().toISOString();

    if (result.failed) {
      stop.failed = true;
      stop.attempts += 1;
      push("failed", { tracking: stop.tracking, reason: result.reason, at: at });
      toast("Failed attempt recorded for " + stop.tracking + ".", "error");
    } else {
      stop.done = true;
      stop.at = at;
      stop.collected = result.collected || 0;
      push("deliver", {
        tracking: stop.tracking, receiver: result.receiver, at: at,
        signature: result.signature, photo: result.photo, collected: stop.collected
      });
      toast("Delivered to " + result.receiver + ". Proof captured.", "success");
    }

    SP.closeAllModals();
    renderStops();
    summary();
    endSummary();
    flush();
  }

  /* ------------------------------------------------------------------ init */
  function init() {
    if (!gate()) return;

    me = SP.DRIVERS.filter(function (d) { return d.id === (user.driverId || firstDriverId()); })[0] || SP.DRIVERS[0];
    queue = SP.store.get("driverQueue", []);
    buildManifest();

    $("#drWho").textContent = me.name + " · " + me.vehicle + " · " + me.id;
    $("#drStatus").innerHTML = '<span class="dot"></span>' + (me.status === "active" ? "On duty" : "On break");
    $("#drCallAll").addEventListener("click", function () { location.href = "tel:" + SP.BRAND.phones.support.replace(/\s/g, ""); });

    $("#drNext").addEventListener("click", function () {
      const next = stops.filter(function (s) { return !s.done && !s.failed; })[0];
      if (!next) { toast("Manifest clear — nothing left to deliver.", "success"); return; }
      const card = $('[data-stop="' + next.tracking + '"]');
      if (card) card.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    $("#drLogout").addEventListener("click", function () {
      if (!confirm("Sign out of the driver app?")) return;
      flush();
      SP.auth.logout();
      SP.redirect("login.html");
    });

    $("#drEndShift").addEventListener("click", function () {
      const open = stops.filter(function (s) { return !s.done && !s.failed; });
      if (open.length && !confirm(open.length + " stop" + (open.length === 1 ? " is" : "s are") +
        " still outstanding. End the shift anyway?")) return;
      flush();
      const done = stops.filter(function (s) { return s.done; }).length;
      const cash = stops.reduce(function (a, s) { return a + (s.collected || 0); }, 0);
      openModal('' +
        '<div class="text-center">' +
          '<span class="icon-box icon-box--lg icon-box--success mx-auto">' + icon("check-circle") + "</span>" +
          "<h3 class=\"mt-4\">Shift ended</h3>" +
          '<p class="text-muted mt-2">Hand in your device at the depot and give the cashier ' +
            "<strong>" + esc(money(cash)) + "</strong> against " + done + " delivered stop" +
            (done === 1 ? "" : "s") + ".</p>" +
          '<div class="card card--soft card--pad mt-5" style="text-align:left">' +
            '<p class="text-xs mono" id="drShiftRef">' + esc("SH-" + Date.now().toString().slice(-8)) + "</p>" +
            '<button class="btn btn--outline btn--sm mt-3" type="button" id="drCopyRef">Copy shift reference</button>' +
          "</div>" +
        "</div>",
        { title: "Shift summary", footer: '<a class="btn btn--gold" href="login.html">Sign out</a>' }
      );
      const copy = $("#drCopyRef");
      if (copy) {
        copy.addEventListener("click", function () {
          const ref = $("#drShiftRef").textContent;
          if (copyText) { copyText(ref); toast("Shift reference copied.", "success"); }
        });
      }
    });

    window.addEventListener("online", function () { online = true; setOnlineText(); flush(); });
    window.addEventListener("offline", function () { online = false; setOnlineText(); });
    online = navigator.onLine !== false;

    renderStops();
    summary();
    endSummary();
    setOnlineText();

    if (queue.length) flush();

    setInterval(function () {
      const clock = $("#drStatus");
      if (clock) clock.title = "Last checked " + F.time(new Date().toISOString());
    }, 30000);
  }

  /* Fallback for a driver session with no driverId: use the first driver on
     record rather than a hardcoded id, so records can be removed safely. */
  function firstDriverId() {
    var list = SP.DRIVERS || [];
    return list.length ? list[0].id : "";
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();