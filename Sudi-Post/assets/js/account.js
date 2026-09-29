/* ==========================================================================
   SUDI-POST — Customer account portal
   ========================================================================== */
(function () {
  "use strict";
  const { icon, $, $$, esc, toast, statusBadge, paymentBadge, money, today, openModal, closeAllModals, validateForm, bindValidation, getData, setLoading } = SP;
  const F = SP.fmt;

  const TITLES = {
    overview: "Overview", shipments: "My shipments", pickups: "Pickup requests",
    invoices: "Invoices", addresses: "Saved addresses", messages: "Messages", settings: "Profile & settings"
  };

  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  let user = null;
  let allShipments = [];

  /* ---------------------------------------------------------------- gating */
  function gate() {
    user = SP.auth.current();
    if (user && user.role !== "customer") {
      const home = user.role === "admin" ? "admin.html" : "driver.html";
      SP.redirect(home);
      return false;
    }
    if (!user) {
      $("#acGate").hidden = false;
      return false;
    }
    $("#acApp").hidden = false;
    return true;
  }

  /* ------------------------------------------------------------- rendering */
  function mine() {
    if (!user.customerId) return allShipments;
    const own = allShipments.filter(function (s) { return s.customerId === user.customerId; });
    return own.length ? own : allShipments;
  }

  function invoices() {
    return SP.store.listInvoices().filter(function (i) { return i.customer === user.name; });
  }

  function statCard(label, value, sub, ico, tone) {
    return '' +
    '<div class="app-card">' +
      '<div class="flex items-center justify-between gap-3">' +
        '<span class="app-card__sub">' + esc(label) + "</span>" +
        '<span class="icon-box icon-box--sm icon-box--' + (tone || "soft") + '">' + icon(ico, "", { size: 17 }) + "</span>" +
      "</div>" +
      '<div class="app-card__title mt-2" style="font-size:var(--fs-2xl);line-height:1.1">' + esc(value) + "</div>" +
      (sub ? '<div class="app-card__sub mt-1">' + esc(sub) + "</div>" : "") +
    "</div>";
  }

  function stats() {
    const list = mine();
    const active = list.filter(function (s) { return s.status !== "delivered" && s.status !== "returned"; });
    const delivered = list.filter(function (s) { return s.status === "delivered"; });
    const spend = list.reduce(function (a, s) { return a + (Number(s.cost) || 0); }, 0);
    const unpaid = invoices().filter(function (i) { return i.status !== "paid"; });

    $("#acStats").innerHTML = [
      statCard("Total shipments", String(list.length), "All time", "package", "navy"),
      statCard("In transit", String(active.length), active.length ? "Moving right now" : "Nothing moving", "truck", "gold"),
      statCard("Delivered", String(delivered.length), delivered.length ? "Completed" : "None yet", "check-circle", "success"),
      statCard("Outstanding", money(unpaid.reduce(function (a, i) { return a + i.amount; }, 0)), unpaid.length + " unpaid invoice" + (unpaid.length === 1 ? "" : "s"), "wallet", unpaid.length ? "danger" : "success")
    ].join("") + '<div class="app-card"><span class="app-card__sub">Lifetime spend</span>' +
      '<div class="app-card__title mt-2" style="font-size:var(--fs-2xl);line-height:1.1">' + money(spend) + "</div>" +
      '<div class="app-card__sub mt-1">≈ ' + F.usd(spend) + " USD</div></div>";
  }

  function dataRow(title, sub, end) {
    return '' +
    '<div class="data-row">' +
      '<div class="data-row__main"><div class="data-row__title">' + title + "</div>" +
        '<div class="data-row__sub">' + sub + "</div></div>" +
      '<div class="data-row__end">' + (end || "") + "</div>" +
    "</div>";
  }

  function recent() {
    const list = mine().slice().sort(function (a, b) {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }).slice(0, 5);

    if (!list.length) {
      $("#acRecent").innerHTML = '<div class="empty-state"><span class="empty-state__icon">' + icon("package") +
        '</span><h3>No shipments yet</h3><p>Book your first parcel and it will appear here with live tracking.</p>' +
        '<a class="btn btn--gold" href="send.html">' + icon("send") + "Send a parcel</a></div>";
      return;
    }

    $("#acRecent").innerHTML = list.map(function (s) {
      return dataRow(
        '<span class="mono">' + esc(s.tracking) + "</span>",
        esc(s.origin) + " → " + esc(s.destination) + " · " + esc(s.receiver.name),
        statusBadge(s.status)
      );
    }).join("");
  }

  function statusChart() {
    const list = mine();
    const counts = {};
    list.forEach(function (s) { counts[s.status] = (counts[s.status] || 0) + 1; });
    const keys = Object.keys(SP.STATUSES).filter(function (k) { return counts[k]; });
    if (!keys.length) {
      $("#acStatusChart").innerHTML = '<p class="text-sm text-muted">No shipments to chart yet.</p>';
      return;
    }
    const max = Math.max.apply(null, keys.map(function (k) { return counts[k]; }));
    $("#acStatusChart").innerHTML = keys.map(function (k) {
      const s = SP.STATUSES[k];
      const pct = Math.round((counts[k] / max) * 100);
      return '' +
      '<div class="chart__row">' +
        '<span class="chart__label">' + esc(s.label) + "</span>" +
        '<span class="chart__track"><span class="chart__fill" style="width:' + pct + '%"></span></span>' +
        '<span class="chart__val">' + counts[k] + "</span>" +
      "</div>";
    }).join("");
  }

  function spendChart() {
    const list = mine();
    if (!list.length) {
      $("#acSpendChart").innerHTML = '<p class="text-sm text-muted">No spend to chart yet.</p>';
      return;
    }
    const now = new Date();
    const buckets = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({ label: MONTHS[d.getMonth()], y: d.getFullYear(), m: d.getMonth(), total: 0 });
    }
    list.forEach(function (s) {
      const d = new Date(s.createdAt);
      const hit = buckets.filter(function (b) { return b.y === d.getFullYear() && b.m === d.getMonth(); })[0];
      if (hit) hit.total += Number(s.cost) || 0;
    });
    const max = Math.max.apply(null, buckets.map(function (b) { return b.total; })) || 1;
    $("#acSpendChart").innerHTML = buckets.map(function (b) {
      const pct = b.total ? Math.max(4, Math.round((b.total / max) * 100)) : 0;
      return '' +
      '<div class="chart__row">' +
        '<span class="chart__label">' + esc(b.label) + "</span>" +
        '<span class="chart__track"><span class="chart__fill chart__fill--gold" style="width:' + pct + '%"></span></span>' +
        '<span class="chart__val">' + (b.total ? Math.round(b.total / 1000) + "k" : "—") + "</span>" +
      "</div>";
    }).join("");
  }

  /* ------------------------------------------------------------- shipments */
  function shipmentList() {
    const q = ($("#acShipSearch").value || "").toLowerCase().trim();
    const status = $("#acShipStatus").value;
    const sort = $("#acShipSort").value;

    let list = mine().slice();
    if (q) {
      list = list.filter(function (s) {
        return [s.tracking, s.receiver.name, s.origin, s.destination, s.service]
          .join(" ").toLowerCase().indexOf(q) > -1;
      });
    }
    if (status) list = list.filter(function (s) { return s.status === status; });

    list.sort(function (a, b) {
      if (sort === "old") return new Date(a.createdAt) - new Date(b.createdAt);
      if (sort === "status") return String(a.status).localeCompare(String(b.status));
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    if (!list.length) {
      $("#acShipList").innerHTML = '<div class="empty-state"><span class="empty-state__icon">' + icon("search") +
        '</span><h3>No matching shipments</h3><p>Try a different search term, or clear the status filter.</p>' +
        '<a class="btn btn--outline" href="send.html">' + icon("plus") + "Create a shipment</a></div>";
      return;
    }

    $("#acShipList").innerHTML = list.map(function (s) {
      const stepIdx = SP.ship.stepIndex(s.status);
      const total = SP.TRACK_STEPS.length;
      const pct = Math.round((stepIdx / (total - 1)) * 100);
      return '' +
      '<div class="data-row" style="align-items:flex-start">' +
        '<div class="data-row__main">' +
          '<div class="data-row__title mono">' + esc(s.tracking) + "</div>" +
          '<div class="data-row__sub">' + esc(s.origin) + " → " + esc(s.destination) +
            " · to " + esc(s.receiver.name) + "</div>" +
          '<div class="progress progress--navy mt-2" style="max-width:260px"><span class="progress__bar" style="width:' + pct + '%"></span></div>' +
          '<div class="data-row__sub mt-1">' + esc(SP.ship.statusLabel ? SP.ship.statusLabel(s.status) : (SP.STATUSES[s.status] || {}).label || s.status) +
            (s.estimatedDelivery ? " · ETA " + esc(F.date(s.estimatedDelivery)) : "") + "</div>" +
        "</div>" +
        '<div class="data-row__end">' +
          "<div>" + statusBadge(s.status) + "</div>" +
          '<div class="data-row__sub mt-1">' + money(s.cost) + "</div>" +
          '<div class="flex gap-1 mt-2" style="justify-content:flex-end">' +
            '<a class="btn btn--outline btn--xs" href="track.html?n=' + encodeURIComponent(s.tracking) + '">Track</a>' +
            '<a class="btn btn--outline btn--xs" href="payment.html?invoice=' + encodeURIComponent(invoiceFor(s)) + '">Invoice</a>' +
          "</div>" +
        "</div>" +
      "</div>";
    }).join("");
  }

  function invoiceFor(shipment) {
    const hit = SP.store.listInvoices().filter(function (i) { return i.shipment === shipment.tracking; })[0];
    return hit ? hit.id : "";
  }

  /* --------------------------------------------------------------- pickups */
  function pickups() {
    const list = SP.store.listPickups();
    if (!list.length) {
      $("#acPickList").innerHTML = '<div class="empty-state"><span class="empty-state__icon">' + icon("truck") +
        '</span><h3>No pickup requests</h3><p>Use the form above and your driver will collect from the saved address.</p></div>';
      return;
    }
    $("#acPickList").innerHTML = list.slice().reverse().map(function (p) {
      return dataRow(
        esc(p.label || "Collection"),
        esc(p.address) + " · " + esc(p.window || "Any time"),
        '<span class="badge badge--' + (p.status === "done" ? "success" : "info") + '">' +
          esc(p.status === "done" ? "Completed" : "Scheduled") + "</span>" +
        '<div class="data-row__sub mt-1">' + esc(F.date(p.date)) + "</div>"
      );
    }).join("");
  }

  /* -------------------------------------------------------------- invoices */
  function invoiceRows() {
    let list = invoices();
    const f = $("#acInvFilter").value;
    if (f) list = list.filter(function (i) { return i.status === f; });

    if (!list.length) {
      $("#acInvRows").innerHTML = '<tr><td colspan="6"><div class="empty-state"><span class="empty-state__icon">' +
        icon("receipt") + '</span><h3>No invoices</h3><p>Invoices appear here as soon as a shipment is booked.</p></div></td></tr>';
      return;
    }

    $("#acInvRows").innerHTML = list.map(function (i) {
      return '' +
      "<tr>" +
        '<td class="table__primary mono">' + esc(i.id) + "</td>" +
        "<td>" + esc(F.date(i.issued)) + "</td>" +
        '<td class="mono">' + esc(i.shipment) + "</td>" +
        "<td>" + paymentBadge(i.status) + "</td>" +
        '<td class="num">' + esc(money(i.amount)) + "</td>" +
        '<td class="num"><a class="btn btn--outline btn--xs" href="payment.html?invoice=' +
          encodeURIComponent(i.id) + '">' + (i.status === "paid" ? "View" : "Pay") + "</a></td>" +
      "</tr>";
    }).join("");
  }

  function statement() {
    const list = invoices();
    const paid = list.filter(function (i) { return i.status === "paid"; });
    const due = list.filter(function (i) { return i.status !== "paid"; });
    const sum = function (a) { return a.reduce(function (t, i) { return t + i.amount; }, 0); };

    openModal('' +
      '<div class="invoice-doc">' +
        '<div class="invoice-doc__head">' +
          "<div><strong>Sudi-Post</strong><br><span class=\"text-sm text-muted\">" + esc(SP.BRAND.tagline || "") + "</span></div>" +
          "<div class=\"text-right\"><div class=\"mono text-sm\">" + esc(today()) + "</div>" +
            "<div class=\"text-sm\">" + esc(user.name) + "</div>" +
            '<div class="text-sm text-muted">' + esc(user.email) + "</div></div>" +
        "</div>" +
        '<div class="table-wrap mt-4"><table class="table table--compact">' +
          "<thead><tr><th>Invoice</th><th>Shipment</th><th>Date</th><th>Status</th><th class=\"num\">Amount</th></tr></thead><tbody>" +
          list.map(function (i) {
            return "<tr><td class=\"mono\">" + esc(i.id) + '</td><td class="mono">' + esc(i.shipment) +
              "</td><td>" + esc(F.date(i.issued)) + "</td><td>" + paymentBadge(i.status) +
              '</td><td class="num">' + esc(money(i.amount)) + "</td></tr>";
          }).join("") +
          "</tbody></table></div>" +
        '<div class="invoice-doc__total"><span>Invoices paid (' + paid.length + ")</span><span>" + esc(money(sum(paid))) + "</span></div>" +
        '<div class="invoice-doc__total" style="border-top:none;padding-top:0"><span>Outstanding (' + due.length + ")</span><span>" +
          esc(money(sum(due))) + "</span></div>" +
        '<div class="invoice-doc__total"><span>Total billed</span><span>' + esc(money(sum(list))) + "</span></div>" +
        '<p class="text-xs text-muted mt-4">Statement generated ' + esc(today()) +
          ". Figures are held in this browser only.</p>" +
      "</div>",
      { title: "Account statement", subtitle: user.name + " · " + today(),
        footer: '<button class="btn btn--outline" type="button" data-modal-close>Close</button>' +
          '<button class="btn btn--gold" type="button" data-print>Print / save PDF</button>' }
    );
  }

  /* ------------------------------------------------------------- addresses */
  function addresses() {
    const list = SP.store.listAddresses();
    if (!list.length) {
      $("#acAddrList").innerHTML = '<div class="app-card"><div class="empty-state"><span class="empty-state__icon">' +
        icon("pin") + '</span><h3>No saved addresses</h3><p>Add one and it will pre-fill the send form and pickup requests.</p></div></div>';
      return;
    }
    $("#acAddrList").innerHTML = list.map(function (a) {
      return '' +
      '<div class="app-card">' +
        '<div class="app-card__head" style="margin-bottom:var(--sp-2)">' +
          "<div><h3 class=\"app-card__title\">" + esc(a.label) +
            (a.isDefault ? ' <span class="badge badge--gold">Default</span>' : "") + "</h3>" +
            '<span class="app-card__sub">' + esc(a.city) + "</span></div>" +
          '<button class="btn btn--ghost btn--sm" type="button" data-del-addr="' + esc(a.id) + '" aria-label="Delete ' +
            esc(a.label) + '">' + icon("trash", "", { size: 18 }) + "</button>" +
        "</div>" +
        '<p class="text-sm" style="color:var(--sp-grey-700);line-height:var(--lh-snug)">' + esc(a.line) + "</p>" +
        '<p class="text-sm text-muted mt-2">' + icon("phone", "", { size: 14 }) + " " + esc(a.phone) + "</p>" +
      "</div>";
    }).join("");

    $$("[data-del-addr]").forEach(function (b) {
      b.addEventListener("click", function () {
        const id = b.getAttribute("data-del-addr");
        const a = SP.store.listAddresses().filter(function (x) { return x.id === id; })[0];
        if (!a) return;
        if (!confirm("Delete the address “" + a.label + "”? This cannot be undone.")) return;
        SP.store.removeAddress(id);
        addresses();
        counts();
        toast("Address deleted.", "success");
      });
    });
  }

  /* -------------------------------------------------------------- messages */
  function messages() {
    const list = SP.store.listMessages();
    if (!list.length) {
      $("#acMsgList").innerHTML = '<div class="empty-state"><span class="empty-state__icon">' + icon("message") +
        '</span><h3>No enquiries yet</h3><p>Send us a message and the reply will be tracked here.</p>' +
        '<a class="btn btn--gold" href="contact.html">' + icon("plus") + "New enquiry</a></div>";
      return;
    }
    $("#acMsgList").innerHTML = list.slice().reverse().map(function (m) {
      return '' +
      '<div class="data-row" style="align-items:flex-start">' +
        '<div class="data-row__main">' +
          '<div class="data-row__title">' + esc(m.topic || "General") + "</div>" +
          '<div class="data-row__sub">' + esc(today(m.at)) + " · ref " + esc(m.id) + "</div>" +
          '<div class="text-sm mt-2" style="color:var(--sp-grey-700);white-space:pre-wrap">' + esc(m.message) + "</div>" +
        "</div>" +
        '<div class="data-row__end"><span class="badge badge--info">Replied</span></div>' +
      "</div>";
    }).join("");
  }

  /* ---------------------------------------------------------------- header */
  function header() {
    const initials = String(user.name || "?").split(/\s+/).map(function (w) { return w.charAt(0); })
      .slice(0, 2).join("");
    $("#acAvatar").textContent = initials;
    $("#acName").textContent = user.name;
    $("#acCustomerId").textContent = user.customerId ? "Customer " + user.customerId : user.role;
    $("#acToday").textContent = today();
  }

  function counts() {
    const map = {
      shipments: mine().length,
      pickups: SP.store.listPickups().length,
      invoices: invoices().filter(function (i) { return i.status !== "paid"; }).length,
      addresses: SP.store.listAddresses().length,
      messages: SP.store.listMessages().length
    };
    Object.keys(map).forEach(function (k) {
      const n = $('[data-count="' + k + '"]');
      if (n) n.textContent = String(map[k]);
    });
  }

  /* ------------------------------------------------------------------ views */
  function show(view) {
    const target = TITLES[view] ? view : "overview";
    $$(".app__view").forEach(function (p) {
      const on = p.getAttribute("data-view") === target;
      p.hidden = !on;
    });
    $$(".app__nav-link").forEach(function (b) {
      b.classList.toggle("is-active", b.getAttribute("data-view") === target);
    });
    $("#acViewTitle").textContent = TITLES[target];
    if (history.replaceState) history.replaceState(null, "", "#" + target);
    closeSidebar();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function refresh() {
    header();
    counts();
    stats();
    recent();
    statusChart();
    spendChart();
    shipmentList();
    pickups();
    invoiceRows();
    addresses();
    messages();
  }

  /* SP.store.listShipments() is async (it goes through the API seam) */
  function load() {
    return SP.store.listShipments().then(function (list) {
      allShipments = list || [];
      refresh();
    }).catch(function () {
      allShipments = [];
      refresh();
      toast("Could not load shipments. Showing what is stored locally.", "error");
    });
  }

  /* --------------------------------------------------------------- sidebar */
  function openSidebar() {
    $("#acSidebar").classList.add("is-open");
    $("#acScrim").classList.add("is-open");
    $("#acBurger").setAttribute("aria-expanded", "true");
    document.body.classList.add("is-locked");
  }
  function closeSidebar() {
    const sb = $("#acSidebar");
    if (!sb) return;
    sb.classList.remove("is-open");
    const sc = $("#acScrim");
    if (sc) sc.classList.remove("is-open");
    const b = $("#acBurger");
    if (b) b.setAttribute("aria-expanded", "false");
    document.body.classList.remove("is-locked");
  }

  /* ----------------------------------------------------------------- forms */
  function initForms() {
    const cities = [];
    SP.LOCATIONS.forEach(function (l) { if (cities.indexOf(l.city) === -1) cities.push(l.city); });
    cities.sort();
    $("#aCity").innerHTML = '<option value="">Select city</option>' +
      cities.map(function (c) { return '<option value="' + esc(c) + '">' + esc(c) + "</option>"; }).join("");

    const fillAddrSelect = function () {
      const list = SP.store.listAddresses();
      $("#pAddr").innerHTML = list.length
        ? list.map(function (a) {
            return '<option value="' + esc(a.label) + '|' + esc(a.line) + '">' + esc(a.label) + " — " + esc(a.city) + "</option>";
          }).join("")
        : '<option value="">No saved addresses — add one under Addresses</option>';
    };
    fillAddrSelect();

    const todayISO = new Date().toISOString().slice(0, 10);
    $("#pDate").min = todayISO;
    $("#pDate").value = todayISO;

    $("#acShipStatus").innerHTML = '<option value="">All statuses</option>' +
      Object.keys(SP.STATUSES).map(function (k) {
        return '<option value="' + esc(k) + '">' + esc(SP.STATUSES[k].label) + "</option>";
      }).join("");

    $("#acInvFilter").innerHTML = '<option value="">All invoices</option>' +
      Object.keys(SP.PAYMENT_STATUSES).map(function (k) {
        return '<option value="' + esc(k) + '">' + esc(SP.PAYMENT_STATUSES[k].label) + "</option>";
      }).join("");

    ["#acShipSearch", "#acShipStatus", "#acShipSort"].forEach(function (sel) {
      const node = $(sel);
      node.addEventListener(node.tagName === "INPUT" ? "input" : "change", shipmentList);
    });
    $("#acInvFilter").addEventListener("change", invoiceRows);
    $("#acInvStatement").addEventListener("click", statement);

    /* profile */
    const pf = $("#acProfileForm");
    $("#uName").value = user.name || "";
    $("#uEmail").value = user.email || "";
    $("#uPhone").value = user.phone || "";
    $("#uCompany").value = user.company || "";
    bindValidation(pf);
    pf.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validateForm(pf)) { toast("Please correct the highlighted fields.", "error"); return; }
      const d = getData(pf);
      SP.auth.update({ name: d.name, email: d.email, phone: d.phone, company: d.company });
      const prefs = store_set_prefs(d);
      user = SP.auth.current();
      refresh();
      toast(prefs ? "Profile and notification preferences saved." : "Profile saved.", "success");
    });

    function store_set_prefs(d) {
      SP.store.set("prefs:" + user.id, {
        email: !!d.nEmail, sms: !!d.nSms, whatsapp: !!d.nWa, news: !!d.nNews
      });
      return true;
    }

    /* password */
    const pw = $("#acPassForm");
    bindValidation(pw);
    pw.addEventListener("submit", function (e) {
      e.preventDefault();
      const d = getData(pw);
      if (d.new !== d.confirm) {
        $("#uNew2Err").textContent = "Passwords do not match.";
        toast("The two passwords do not match.", "error");
        return;
      }
      if (!validateForm(pw)) { toast("Please correct the highlighted fields.", "error"); return; }
      const btn = $('button[type="submit"]', pw);
      setLoading(btn, true, "Updating.");
      /* Replace with PATCH /api/v1/account/password */
      SP.auth.changePassword(d.old, d.new)
        .then(function () {
          setLoading(btn, false);
          pw.reset();
          setTimeout(initForms, 0);
          toast("Password updated.", "success");
        })
        .catch(function (err) {
          setLoading(btn, false);
          $("#uOldErr").textContent = err.message;
          toast(err.message, "error");
        });
    });

    /* addresses */
    const af = $("#acAddrForm");
    bindValidation(af);
    af.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validateForm(af)) { toast("Please correct the highlighted fields.", "error"); return; }
      const d = getData(af);
      SP.store.addAddress({
        label: d.label, city: d.city, line: d.line, phone: d.phone, isDefault: !!d.isDefault
      });
      af.reset();
      addresses();
      counts();
      fillAddrSelect();
      toast("Address saved.", "success");
    });

    /* pickups */
    const kf = $("#acPickForm");
    bindValidation(kf);
    kf.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!SP.store.listAddresses().length) {
        toast("Add a saved address first, under Addresses.", "error");
        show("addresses");
        return;
      }
      if (!validateForm(kf)) { toast("Please correct the highlighted fields.", "error"); return; }
      const d = getData(kf);
      const parts = String(d.address).split("|");
      const btn = $('button[type="submit"]', kf);
      setLoading(btn, true, "Requesting.");
      /* simulated — replace with POST /api/v1/pickups */
      setTimeout(function () {
        setLoading(btn, false);
        SP.store.addPickup({
          ref: "PK-" + Date.now().toString().slice(-6),
          label: parts[0], address: parts[1],
          date: d.date, window: d.window, type: d.type, notes: d.notes,
          status: "scheduled", at: new Date().toISOString()
        });
        kf.reset();
        $("#pDate").value = todayISO;
        pickups();
        counts();
        toast("Collection requested. Your driver will confirm shortly.", "success");
      }, 600);
    });

    /* logout + reset */
    $("#acLogout").addEventListener("click", function () {
      if (!confirm("Sign out of Sudi-Post?")) return;
      SP.auth.logout();
      SP.redirect("login.html");
    });

    $("#acReset").addEventListener("click", function () {
      if (!confirm("Clear all locally stored data and restore the demo seed? This cannot be undone.")) return;
      SP.store.resetAll();
      toast("Local data reset. Reloading…", "success");
      setTimeout(function () { location.reload(); }, 800);
    });
  }

  /* ------------------------------------------------------------------ init */
  function init() {
    if (!gate()) return;

    $$("[data-view]").forEach(function (b) {
      if (b.tagName === "BUTTON") b.addEventListener("click", function () { show(b.getAttribute("data-view")); });
    });
    $("#acBurger").addEventListener("click", openSidebar);
    $("#acScrim").addEventListener("click", closeSidebar);

    initForms();

    const hash = (location.hash || "").replace("#", "");
    show(TITLES[hash] ? hash : "overview");

    if (new URLSearchParams(location.search).get("welcome")) {
      toast("Welcome to Sudi-Post, " + user.name.split(" ")[0] + ".", "success");
    }

    load().then(function () {
      const view = new URLSearchParams(location.search).get("view");
      if (view && TITLES[view]) show(view);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
