/* ==========================================================================
   SUDI-POST — Admin / operations console
   ========================================================================== */
(function () {
  "use strict";
  const { icon, $, $$, esc, toast, statusBadge, paymentBadge, money, today, openModal } = SP;
  const F = SP.fmt;

  const TITLES = {
    dashboard: "Dashboard", shipments: "Shipments", pickups: "Pickup requests",
    routes: "Routes & schedule", locations: "Locations", customers: "Customers",
    drivers: "Drivers", invoices: "Invoices", pricing: "Pricing",
    reports: "Reports", content: "Content & news"
  };

  const DONUT_COLOURS = ["#9BD3D6", "#0B6C73", "#0A5A60", "#647689", "#0E7C6B", "#C2761F", "#A3342A", "#4E6072", "#D6EFF0"];

  const PERFORMANCE = [
    { metric: "On-time delivery", target: 92, actual: 94.6, unit: "%" },
    { metric: "First re-attempt success", target: 80, actual: 84.2, unit: "%" },
    { metric: "Same-day Juba metro", target: 90, actual: 93.1, unit: "%" },
    { metric: "Proof of delivery captured", target: 100, actual: 100, unit: "%" },
    { metric: "Invoice collection", target: 88, actual: 81.5, unit: "%" },
    { metric: "Complaints closed in 48h", target: 95, actual: 97.3, unit: "%" }
  ];

  let user = null;
  let shipments = [];

  /* ---------------------------------------------------------------- gating */
  function gate() {
    user = SP.auth.current();
    if (!user || user.role !== "admin") {
      $("#adGate").hidden = false;
      return false;
    }
    $("#adApp").hidden = false;
    return true;
  }

  /* -------------------------------------------------------------- utilities */
  function branchName(id) {
    const l = SP.LOCATIONS.filter(function (x) { return x.id === id; })[0];
    return l ? l.name.replace("Sudi-Post ", "") : (id || "—");
  }

  function download(name, text) {
    const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function csv(rows) {
    return rows.map(function (r) {
      return r.map(function (c) {
        const v = String(c === null || c === undefined ? "" : c);
        return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
      }).join(",");
    }).join("\r\n");
  }

  function kpi(label, value, sub, ico, tone) {
    return '' +
    '<div class="app-card">' +
      '<div class="flex items-center justify-between gap-3">' +
        '<span class="app-card__sub">' + esc(label) + "</span>" +
        '<span class="icon-box icon-box--sm icon-box--' + (tone || "soft") + '">' + icon(ico, "", { size: 17 }) + "</span>" +
      "</div>" +
      '<div class="app-card__title mt-2" style="font-size:var(--fs-2xl);line-height:1.1">' + esc(value) + "</div>" +
      '<div class="app-card__sub mt-1">' + esc(sub) + "</div>" +
    "</div>";
  }

  function bar(label, value, max, gold) {
    const pct = max ? Math.max(2, Math.round((value / max) * 100)) : 0;
    return '' +
    '<div class="chart__row">' +
      '<span class="chart__label">' + esc(label) + "</span>" +
      '<span class="chart__track"><span class="chart__fill' + (gold ? " chart__fill--gold" : "") +
        '" style="width:' + pct + '%"></span></span>' +
      '<span class="chart__val">' + esc(String(value)) + "</span>" +
    "</div>";
  }

  /* -------------------------------------------------------------- dashboard */
  function kpis() {
    const active = shipments.filter(function (s) { return s.status !== "delivered" && s.status !== "returned"; });
    const delivered = shipments.filter(function (s) { return s.status === "delivered"; });
    const revenue = shipments.reduce(function (a, s) { return a + (Number(s.cost) || 0); }, 0);
    const unpaid = SP.store.listInvoices().filter(function (i) { return i.status !== "paid"; });
    const onTime = delivered.length
      ? Math.round((delivered.filter(function (s) { return s.status === "delivered"; }).length / Math.max(1, delivered.length)) * 1000) / 10
      : 0;

    $("#adKpis").innerHTML = [
      kpi("Open shipments", String(active.length), "In the network now", "package", "navy"),
      kpi("Delivered", String(delivered.length), "All time", "check-circle", "success"),
      kpi("Freight collected", money(revenue), "≈ " + F.usd(revenue) + " USD", "wallet", "gold"),
      kpi("Unpaid invoices", String(unpaid.length), money(unpaid.reduce(function (a, i) { return a + i.amount; }, 0)) + " outstanding", "receipt", unpaid.length ? "danger" : "success"),
      kpi("Active drivers", String(SP.DRIVERS.filter(function (d) { return d.status === "active"; }).length), "of " + SP.DRIVERS.length + " on the roster", "truck", "info"),
      kpi("Branches", String(SP.LOCATIONS.length), SP.LOCATIONS.filter(function (l) { return l.pickup; }).length + " accept collections", "building", "soft"),
      kpi("On-time rate", onTime + "%", "Target 92%", "target", "success"),
      kpi("Open exceptions", String(exceptions().length), "Need action today", "alert", exceptions().length ? "warning" : "success")
    ].join("");
  }

  function exceptions() {
    return shipments.filter(function (s) {
      if (s.status === "delayed") return true;
      if (s.status === "returned") return true;
      if (s.estimatedDelivery) {
        return new Date(s.estimatedDelivery) < new Date() && s.status !== "delivered";
      }
      return false;
    });
  }

  function volumeChart() {
    const rows = SP.MONTHLY_VOLUME;
    const totals = rows.map(function (r) { return r.standard + r.express; });
    const max = Math.max.apply(null, totals);
    $("#adVolumeChart").innerHTML = rows.map(function (r, i) {
      const pct = Math.max(4, Math.round((totals[i] / max) * 100));
      return '' +
      '<div class="chart__row">' +
        '<span class="chart__label">' + esc(r.month) + "</span>" +
        '<span class="chart__track"><span class="chart__fill" style="width:' + pct + '%"></span></span>' +
        '<span class="chart__val">' + esc(String(totals[i])) + "</span>" +
      "</div>";
    }).join("") +
    '<p class="text-xs text-muted mt-3">Peak month ' + esc(rows[rows.length - 1].month) + " at " +
      esc(String(totals[totals.length - 1])) + " consignments. Standard share " +
      esc(Math.round((rows[rows.length - 1].standard / totals[totals.length - 1]) * 100)) + "%.</p>";
  }

  function statusDonut() {
    const counts = {};
    shipments.forEach(function (s) { counts[s.status] = (counts[s.status] || 0) + 1; });
    const keys = Object.keys(counts);
    const total = shipments.length || 1;
    if (!keys.length) {
      $("#adStatusDonut").innerHTML = '<p class="text-sm text-muted">No shipments loaded.</p>';
      return;
    }
    let acc = 0;
    const stops = keys.map(function (k, i) {
      const from = acc;
      acc += (counts[k] / total) * 100;
      return DONUT_COLOURS[i % DONUT_COLOURS.length] + " " + from.toFixed(1) + "% " + acc.toFixed(1) + "%";
    }).join(", ");

    const top = keys.sort(function (a, b) { return counts[b] - counts[a]; })[0];

    $("#adStatusDonut").innerHTML = '' +
    '<div class="donut__chart" style="border-radius:50%;background:conic-gradient(' + stops + ')">' +
      '<div class="donut__center"><div class="donut__value">' + shipments.length + "</div>" +
        '<div class="donut__label">Shipments</div></div>' +
    "</div>" +
    '<ul class="donut__legend">' + keys.map(function (k, i) {
      return "<li><i style=\"background:" + DONUT_COLOURS[i % DONUT_COLOURS.length] + '"></i>' +
        "<span>" + esc(SP.STATUSES[k] ? SP.STATUSES[k].label : k) + "</span><b>" + counts[k] + "</b></li>";
    }).join("") + "</ul>" +
    '<p class="text-xs text-muted mt-4">Largest group: <strong>' +
      esc(SP.STATUSES[top] ? SP.STATUSES[top].label : top) + "</strong>.</p>";
  }

  function exceptionList() {
    const list = exceptions();
    if (!list.length) {
      $("#adExceptions").innerHTML = '<div class="empty-state"><span class="empty-state__icon">' + icon("check-circle") +
        '</span><h3>Nothing needs attention</h3><p>No delayed, returned or overdue shipments right now.</p></div>';
      return;
    }
    $("#adExceptions").innerHTML = list.slice(0, 8).map(function (s) {
      const late = s.estimatedDelivery && new Date(s.estimatedDelivery) < new Date();
      return '' +
      '<div class="data-row">' +
        '<div class="data-row__main">' +
          '<div class="data-row__title mono">' + esc(s.tracking) + "</div>" +
          '<div class="data-row__sub">' + esc(s.origin) + " → " + esc(s.destination) + " · " + esc(s.receiver.name) + "</div>" +
        "</div>" +
        '<div class="data-row__end">' +
          (late ? '<span class="badge badge--danger">Past ETA</span>' : statusBadge(s.status)) +
          '<div class="data-row__sub mt-1">ETA ' + esc(F.date(s.estimatedDelivery)) + "</div>" +
        "</div>" +
      "</div>";
    }).join("");
  }

  function departures() {
    const todayName = new Date().toLocaleDateString("en-GB", { weekday: "long" });
    const todays = SP.CORRIDOR_SCHEDULE.filter(function (r) { return r.day === todayName; });
    const rows = todays.length ? todays : SP.CORRIDOR_SCHEDULE.slice(0, 3);
    $("#adDepartures").innerHTML = rows.map(function (r) {
      return '' +
      '<div class="data-row">' +
        '<div class="data-row__main">' +
          '<div class="data-row__title">' + esc(r.depart) + "</div>" +
          '<div class="data-row__sub">' + esc(r.day) + " · " + esc(r.note) + "</div>" +
        "</div>" +
        '<div class="data-row__end"><div class="data-row__title mono">' + esc(r.time) + "</div>" +
          (r.day === todayName ? '<span class="badge badge--success">Today</span>' : "") + "</div>" +
      "</div>";
    }).join("") +
    '<p class="text-xs text-muted mt-3">Today is <strong>' + esc(todayName) + "</strong>. " +
      (todays.length ? "One scheduled departure." : "No scheduled departure today — next is " +
        esc(SP.CORRIDOR_SCHEDULE[0].day) + " at " + esc(SP.CORRIDOR_SCHEDULE[0].time) + ".") + "</p>";
  }

  /* -------------------------------------------------------------- shipments */
  function shipTable() {
    const q = ($("#adShipSearch").value || "").toLowerCase().trim();
    const status = $("#adShipStatus").value;
    const branch = $("#adShipBranch").value;

    let list = shipments.slice();
    if (q) {
      list = list.filter(function (s) {
        return [s.tracking, s.sender.name, s.receiver.name, s.origin, s.destination, s.currentLocation]
          .join(" ").toLowerCase().indexOf(q) > -1;
      });
    }
    if (status) list = list.filter(function (s) { return s.status === status; });
    if (branch) list = list.filter(function (s) { return s.branchId === branch; });
    list.sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });

    if (!list.length) {
      $("#adShipRows").innerHTML = '<tr><td colspan="8"><div class="empty-state"><h3>No matching shipments</h3>' +
        "<p>Adjust the search or filters.</p></div></td></tr>";
      return;
    }

    $("#adShipRows").innerHTML = list.map(function (s) {
      return "<tr>" +
        '<td class="table__primary mono">' + esc(s.tracking) + "</td>" +
        "<td>" + esc(s.sender.name) + "</td>" +
        "<td>" + esc(s.origin) + " → " + esc(s.destination) + "</td>" +
        "<td>" + esc(branchName(s.branchId)) + "</td>" +
        "<td>" + statusBadge(s.status) + "</td>" +
        "<td>" + paymentBadge(s.payment ? s.payment.status : "pending") + "</td>" +
        '<td class="num">' + esc(money(s.cost)) + "</td>" +
        '<td class="num"><button class="btn btn--outline btn--xs" type="button" data-ship="' + esc(s.tracking) + '">Open</button></td>' +
      "</tr>";
    }).join("");

    $$("[data-ship]").forEach(function (b) {
      b.addEventListener("click", function () { shipmentModal(b.getAttribute("data-ship")); });
    });
  }

  function shipmentModal(tracking) {
    const s = shipments.filter(function (x) { return x.tracking === tracking; })[0];
    if (!s) return;
    const steps = SP.TRACK_STEPS.map(function (k) {
      const done = (s.history || []).some(function (h) { return h.key === k; });
      const current = s.status === k;
      const hit = (s.history || []).filter(function (h) { return h.key === k; })[0];
      return '' +
      '<li class="timeline__item' + (done ? " is-done" : "") + (current ? " is-current" : "") + '">' +
        '<span class="timeline__marker">' + icon(done ? "check" : "clock", "", { size: 19 }) + "</span>" +
        '<div class="timeline__content">' +
          '<div class="timeline__title">' + esc((SP.STATUSES[k] || {}).label || k) + "</div>" +
          (hit ? '<div class="text-sm text-muted">' + esc(F.dateTime(hit.at)) + " · " + esc(hit.location) + "</div>" +
            '<div class="text-sm mt-1">' + esc(hit.note) + "</div>" : '<div class="text-sm text-muted">Not yet reached</div>') +
        "</div>" +
      "</li>";
    }).join("");

    openModal('' +
      '<div class="flex items-center justify-between gap-3" style="flex-wrap:wrap">' +
        "<h3 class=\"mono\">" + esc(s.tracking) + "</h3>" + statusBadge(s.status) +
      "</div>" +
      '<div class="table-wrap mt-4"><table class="table table--compact"><tbody>' +
        "<tr><td>Sender</td><td>" + esc(s.sender.name) + " · " + esc(s.sender.city) + "</td></tr>" +
        "<tr><td>Receiver</td><td>" + esc(s.receiver.name) + " · " + esc(s.receiver.city) + "</td></tr>" +
        "<tr><td>Route</td><td>" + esc(s.origin) + " → " + esc(s.destination) + "</td></tr>" +
        "<tr><td>Service</td><td>" + esc(s.service) + " · " + esc(s.type) + "</td></tr>" +
        "<tr><td>Weight</td><td>" + esc(s.weight) + " kg · chargeable " + esc(s.chargeable) + " kg</td></tr>" +
        "<tr><td>Branch</td><td>" + esc(branchName(s.branchId)) + "</td></tr>" +
        "<tr><td>Driver</td><td>" + esc(SP.driverById ? (SP.driverById(s.driverId) || {}).name || s.driverId : s.driverId) + "</td></tr>" +
        "<tr><td>Freight</td><td>" + esc(money(s.cost)) + " · " + paymentBadge(s.payment ? s.payment.status : "pending") + "</td></tr>" +
        "<tr><td>ETA</td><td>" + esc(F.date(s.estimatedDelivery)) + "</td></tr>" +
        "<tr><td>Current location</td><td>" + esc(s.currentLocation) + "</td></tr>" +
      "</tbody></table></div>" +
      '<h4 class="mt-5">History</h4><ul class="timeline mt-3">' + steps + "</ul>",
      { title: "Shipment detail", wide: true,
        footer: '<a class="btn btn--outline" href="track.html?n=' + encodeURIComponent(s.tracking) + '">Public tracking page</a>' +
          '<button class="btn btn--outline" type="button" data-modal-close>Close</button>' +
          '<button class="btn btn--gold" type="button" onclick="window.print()">Print</button>' }
    );
  }

  /* ---------------------------------------------------------------- pickups */
  function pickups() {
    const list = SP.store.listPickups();
    if (!list.length) {
      $("#adPickList").innerHTML = '<div class="empty-state"><span class="empty-state__icon">' + icon("truck") +
        '</span><h3>No pickup requests</h3><p>Requests booked through the customer portal appear here.</p></div>';
      return;
    }
    $("#adPickList").innerHTML = list.slice().reverse().map(function (p) {
      return '' +
      '<div class="data-row" style="align-items:flex-start">' +
        '<div class="data-row__main">' +
          '<div class="data-row__title mono">' + esc(p.ref) + "</div>" +
          '<div class="data-row__sub">' + esc(p.label) + " — " + esc(p.address) + "</div>" +
          '<div class="data-row__sub">' + esc(F.date(p.date)) + " · " + esc(p.window) + " · " + esc(p.type) + "</div>" +
          (p.notes ? '<div class="text-sm mt-1">' + esc(p.notes) + "</div>" : "") +
        "</div>" +
        '<div class="data-row__end">' +
          '<span class="badge badge--' + (p.status === "done" ? "success" : "info") + '">' +
            esc(p.status === "done" ? "Completed" : "Scheduled") + "</span>" +
        "</div>" +
      "</div>";
    }).join("");
  }

  /* ----------------------------------------------------------------- routes */
  function routes() {
    $("#adRouteRows").innerHTML = SP.CORRIDOR_SCHEDULE.map(function (r) {
      return "<tr>" +
        "<td>" + esc(r.day) + "</td>" +
        '<td class="table__primary">' + esc(r.depart) + "</td>" +
        '<td class="mono">' + esc(r.time) + "</td>" +
        '<td class="text-sm text-muted">' + esc(r.note) + "</td>" +
      "</tr>";
    }).join("");

    const rows = SP.ZONES.map(function (z) {
      const load = shipments.filter(function (s) { return s.zoneId === z.id; }).length;
      return { label: z.name, value: load, cap: Math.max(12, load * 2) };
    });
    const max = Math.max.apply(null, rows.map(function (r) { return r.cap; }).concat([1]));
    $("#adZoneChart").innerHTML = rows.map(function (r) {
      const pct = Math.max(2, Math.round((r.value / max) * 100));
      return '' +
      '<div class="chart__row">' +
        '<span class="chart__label">' + esc(r.label) + "</span>" +
        '<span class="chart__track"><span class="chart__fill" style="width:' + pct + '%"></span></span>' +
        '<span class="chart__val">' + r.value + "</span>" +
      "</div>";
    }).join("");
  }

  /* -------------------------------------------------------------- locations */
  function locations() {
    const q = ($("#adLocSearch").value || "").toLowerCase().trim();
    const list = SP.LOCATIONS.filter(function (l) {
      return !q || [l.name, l.city, l.country, l.type].join(" ").toLowerCase().indexOf(q) > -1;
    });
    if (!list.length) {
      $("#adLocRows").innerHTML = '<tr><td colspan="6"><div class="empty-state"><h3>No matching locations</h3></div></td></tr>';
      return;
    }
    $("#adLocRows").innerHTML = list.map(function (l) {
      return "<tr>" +
        '<td class="table__primary">' + esc(l.name) + "</td>" +
        "<td>" + esc(l.type) + "</td>" +
        "<td>" + esc(l.city) + ", " + esc(l.country) + "</td>" +
        '<td class="text-sm">' + esc((l.services || []).join(", ")) + "</td>" +
        '<td class="mono text-sm">' + esc(l.phone) + "</td>" +
        "<td>" + (l.weekend ? '<span class="badge badge--success">Yes</span>' : '<span class="badge badge--none">No</span>') + "</td>" +
      "</tr>";
    }).join("");
  }

  /* -------------------------------------------------------------- customers */
  function customers() {
    const q = ($("#adCustSearch").value || "").toLowerCase().trim();
    const list = SP.CUSTOMERS.filter(function (c) {
      return !q || [c.name, c.email, c.city, c.type].join(" ").toLowerCase().indexOf(q) > -1;
    });
    if (!list.length) {
      $("#adCustRows").innerHTML = '<tr><td colspan="6"><div class="empty-state"><h3>No matching customers</h3></div></td></tr>';
      return;
    }
    $("#adCustRows").innerHTML = list.map(function (c) {
      return "<tr>" +
        '<td class="table__primary">' + esc(c.name) + (c.verified ? ' <span class="badge badge--success">Verified</span>' : "") + "</td>" +
        "<td>" + esc(c.type) + "</td>" +
        "<td>" + esc(c.city) + "</td>" +
        '<td class="num">' + esc(String(c.shipments)) + "</td>" +
        '<td class="num">' + esc(money(c.spent)) + "</td>" +
        '<td class="text-sm"><a href="mailto:' + esc(c.email) + '">' + esc(c.email) + "</a><br>" +
          '<a class="mono" href="tel:' + esc(String(c.phone).replace(/\s/g, "")) + '">' + esc(c.phone) + "</a></td>" +
      "</tr>";
    }).join("");
  }

  /* ---------------------------------------------------------------- drivers */
  function drivers() {
    $("#adDriverCards").innerHTML = SP.DRIVERS.map(function (d) {
      const tone = d.status === "active" ? "success" : d.status === "onbreak" ? "warning" : "danger";
      const label = d.status === "active" ? "On duty" : d.status === "onbreak" ? "On break" : "Off duty";
      return '' +
      '<div class="app-card">' +
        '<div class="flex items-center gap-3">' +
          '<span class="avatar avatar--gold">' + esc(d.name.split(" ").map(function (w) { return w.charAt(0); }).join("")) + "</span>" +
          "<div><div class=\"app-card__title\">" + esc(d.name) + "</div>" +
            '<div class="app-card__sub mono">' + esc(d.id) + " · " + esc(branchName(d.branch)) + "</div></div>" +
          '<span class="badge badge--' + tone + ' ms-auto">' + esc(label) + "</span>" +
        "</div>" +
        '<div class="data-row mt-3"><div class="data-row__main">' +
          '<div class="data-row__title">' + esc(d.vehicle) + "</div>" +
          '<div class="data-row__sub">' + esc(String(d.completed)) + " completed · " +
            esc(String(d.assigned)) + " assigned today</div></div>" +
          '<div class="data-row__end"><strong>' + esc(String(d.rating)) + "★</strong></div>" +
        "</div>" +
        '<div class="flex gap-2 mt-3">' +
          '<a class="btn btn--outline btn--sm" href="driver.html">Open route</a>' +
          '<a class="btn btn--outline btn--sm" href="tel:' + esc(String(d.phone).replace(/\s/g, "")) + '">' + icon("phone", "", { size: 15 }) + "Call</a>" +
        "</div>" +
      "</div>";
    }).join("");
  }

  /* --------------------------------------------------------------- invoices */
  function invoices() {
    const status = $("#adInvStatus").value;
    let list = SP.store.listInvoices();
    if (status) list = list.filter(function (i) { return i.status === status; });
    list.sort(function (a, b) { return new Date(b.issued) - new Date(a.issued); });

    if (!list.length) {
      $("#adInvRows").innerHTML = '<tr><td colspan="7"><div class="empty-state"><h3>No matching invoices</h3></div></td></tr>';
      return;
    }
    $("#adInvRows").innerHTML = list.map(function (i) {
      return "<tr>" +
        '<td class="table__primary mono">' + esc(i.id) + "</td>" +
        "<td>" + esc(i.customer) + "</td>" +
        '<td class="mono text-sm">' + esc(i.shipment) + "</td>" +
        "<td>" + esc(F.date(i.issued)) + "</td>" +
        "<td>" + paymentBadge(i.status) + "</td>" +
        '<td class="text-sm">' + esc(i.method || "—") + "</td>" +
        '<td class="num">' + esc(money(i.amount)) + "</td>" +
      "</tr>";
    }).join("");
  }

  /* ---------------------------------------------------------------- pricing */
  function pricing() {
    $("#adZoneRows").innerHTML = SP.ZONES.map(function (z) {
      return "<tr>" +
        '<td class="table__primary">' + esc(z.name) + "</td>" +
        '<td class="text-sm text-muted">' + esc(z.desc) + "</td>" +
        '<td class="num">' + esc(money(z.base)) + "</td>" +
        '<td class="num">' + esc(money(z.perKg)) + "</td>" +
        "<td>" + esc(z.transit) + "</td>" +
        '<td class="text-sm">' + esc((z.destinations || []).length) + " destinations</td>" +
      "</tr>";
    }).join("");

    $("#adSpeedRows").innerHTML = SP.SERVICES_SPEEDS.map(function (s) {
      return "<tr><td>" + esc(s.label) + "</td>" +
        '<td class="num">×' + esc(String(s.mult)) + "</td>" +
        '<td class="text-sm text-muted">' + esc(s.desc) + "</td></tr>";
    }).join("");

    $("#adSurRows").innerHTML = SP.SURCHARGES.map(function (s) {
      const amount = s.unit.indexOf("declared") > -1 || s.unit.indexOf("freight") > -1
        ? (s.rate * 100).toFixed(0) + "%"
        : money(s.rate);
      return "<tr><td>" + esc(s.label) + "</td>" +
        '<td class="text-sm text-muted">' + esc(s.unit) + "</td>" +
        '<td class="num">' + esc(amount) + "</td></tr>";
    }).join("");
  }

  /* ---------------------------------------------------------------- reports */
  function reports() {
    const invoices = SP.store.listInvoices();
    const paid = invoices.filter(function (i) { return i.status === "paid"; });
    const collected = paid.reduce(function (a, i) { return a + i.amount; }, 0);
    const avg = paid.length ? Math.round(collected / paid.length) : 0;

    $("#adReportKpis").innerHTML = [
      kpi("Invoices issued", String(invoices.length), "All time", "receipt", "soft"),
      kpi("Invoices paid", String(paid.length), Math.round((paid.length / Math.max(1, invoices.length)) * 100) + "% of issued", "check-circle", "success"),
      kpi("Collected", money(collected), "≈ " + F.usd(collected) + " USD", "wallet", "gold"),
      kpi("Average invoice", money(avg), "Per paid invoice", "chart", "info")
    ].join("");

    const rows = SP.ZONES.map(function (z) {
      const list = SP.store.listInvoices().filter(function (i) {
        const s = SP.SHIPMENTS.filter(function (x) { return x.tracking === i.shipment; })[0];
        return s && s.zoneId === z.id;
      });
      return { label: z.name, value: list.reduce(function (a, i) { return a + i.amount; }, 0) };
    });
    const max = Math.max.apply(null, rows.map(function (r) { return r.value; }).concat([1]));
    $("#adRevenueChart").innerHTML = rows.map(function (r) {
      return bar(r.label, Math.round(r.value / 1000) + "k", Math.round(max / 1000) || 1, true);
    }).join("") + '<p class="text-xs text-muted mt-3">Figures in thousands of SSP, from invoices visible in this browser.</p>';

    $("#adPerfRows").innerHTML = PERFORMANCE.map(function (p) {
      const delta = Math.round((p.actual - p.target) * 10) / 10;
      const good = delta >= 0;
      return "<tr>" +
        "<td>" + esc(p.metric) + "</td>" +
        '<td class="num">' + esc(String(p.target) + p.unit) + "</td>" +
        '<td class="num">' + esc(String(p.actual) + p.unit) + "</td>" +
        '<td><span class="badge badge--' + (good ? "success" : "danger") + '">' +
          (good ? "+" : "") + esc(String(delta) + " " + p.unit) + "</span></td>" +
      "</tr>";
    }).join("");
  }

  /* ---------------------------------------------------------------- content */
  function content() {
    $("#adNewsRows").innerHTML = SP.NEWS.map(function (n) {
      return "<tr>" +
        "<td>" + esc(F.date(n.date)) + "</td>" +
        '<td class="table__primary">' + esc(n.title) + "</td>" +
        "<td>" + esc(n.category) + "</td>" +
        '<td class="text-sm text-muted">' + esc(n.author) + "</td>" +
      "</tr>";
    }).join("");

    const msgs = SP.store.listMessages();
    if (!msgs.length) {
      $("#adMessages").innerHTML = '<div class="empty-state"><h3>No enquiries</h3>' +
        "<p>Contact and business form submissions appear here.</p></div>";
      return;
    }
    $("#adMessages").innerHTML = msgs.slice().reverse().map(function (m) {
      return '' +
      '<div class="data-row" style="align-items:flex-start">' +
        '<div class="data-row__main">' +
          '<div class="data-row__title">' + esc(m.topic || "general") + " · " + esc(m.name) + "</div>" +
          '<div class="data-row__sub">' + esc(today(m.at)) + " · " + esc(m.email || "") + "</div>" +
          '<div class="text-sm mt-2" style="white-space:pre-wrap">' + esc(m.message) + "</div>" +
        "</div>" +
        '<div class="data-row__end"><span class="badge badge--info">Open</span></div>' +
      "</div>";
    }).join("");
  }

  /* ------------------------------------------------------------------ views */
  function show(view) {
    const target = TITLES[view] ? view : "dashboard";
    $$(".app__view").forEach(function (p) { p.hidden = p.getAttribute("data-view") !== target; });
    $$(".app__nav-link").forEach(function (b) {
      b.classList.toggle("is-active", b.getAttribute("data-view") === target);
    });
    $("#adViewTitle").textContent = TITLES[target];
    if (history.replaceState) history.replaceState(null, "", "#" + target);
    closeSidebar();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function closeSidebar() {
    const sb = $("#adSidebar");
    if (sb) sb.classList.remove("is-open");
    const sc = $("#adScrim");
    if (sc) sc.classList.remove("is-open");
    const b = $("#adBurger");
    if (b) b.setAttribute("aria-expanded", "false");
    document.body.classList.remove("is-locked");
  }

  function counts() {
    const map = {
      shipments: shipments.length,
      pickups: SP.store.listPickups().length,
      customers: SP.CUSTOMERS.length,
      drivers: SP.DRIVERS.length,
      invoices: SP.store.listInvoices().filter(function (i) { return i.status !== "paid"; }).length
    };
    Object.keys(map).forEach(function (k) {
      const n = $('[data-count="' + k + '"]');
      if (n) n.textContent = String(map[k]);
    });
  }

  function renderAll() {
    kpis();
    volumeChart();
    statusDonut();
    exceptionList();
    departures();
    shipTable();
    pickups();
    routes();
    locations();
    customers();
    drivers();
    invoices();
    pricing();
    reports();
    content();
    counts();
  }

  /* ------------------------------------------------------------------ init */
  function init() {
    if (!gate()) return;

    $("#adAvatar").textContent = user.name.split(" ").map(function (w) { return w.charAt(0); }).slice(0, 2).join("");
    $("#adName").textContent = user.name;
    $("#adRole").textContent = "Operations · " + user.email;
    $("#adToday").textContent = today();

    $$("[data-view]").forEach(function (b) {
      if (b.tagName === "BUTTON") b.addEventListener("click", function () { show(b.getAttribute("data-view")); });
    });
    $("#adBurger").addEventListener("click", function () {
      $("#adSidebar").classList.add("is-open");
      $("#adScrim").classList.add("is-open");
      this.setAttribute("aria-expanded", "true");
      document.body.classList.add("is-locked");
    });
    $("#adScrim").addEventListener("click", closeSidebar);

    $("#adShipStatus").innerHTML = '<option value="">All statuses</option>' +
      Object.keys(SP.STATUSES).map(function (k) {
        return '<option value="' + esc(k) + '">' + esc(SP.STATUSES[k].label) + "</option>";
      }).join("");
    $("#adShipBranch").innerHTML = '<option value="">All branches</option>' +
      SP.LOCATIONS.map(function (l) { return '<option value="' + esc(l.id) + '">' + esc(l.name) + "</option>"; }).join("");
    $("#adInvStatus").innerHTML = '<option value="">All invoices</option>' +
      Object.keys(SP.PAYMENT_STATUSES).map(function (k) {
        return '<option value="' + esc(k) + '">' + esc(SP.PAYMENT_STATUSES[k].label) + "</option>";
      }).join("");

    ["#adShipSearch", "#adLocSearch", "#adCustSearch"].forEach(function (sel) {
      $(sel).addEventListener("input", function () {
        if (sel === "#adShipSearch") shipTable();
        if (sel === "#adLocSearch") locations();
        if (sel === "#adCustSearch") customers();
      });
    });
    $("#adShipStatus").addEventListener("change", shipTable);
    $("#adShipBranch").addEventListener("change", shipTable);
    $("#adInvStatus").addEventListener("change", invoices);

    $("#adShipExport").addEventListener("click", function () {
      download("sudipost-shipments.csv", csv([["Tracking", "Sender", "Receiver", "Origin", "Destination", "Branch", "Status", "Payment", "Freight SSP"]].concat(
        shipments.map(function (s) {
          return [s.tracking, s.sender.name, s.receiver.name, s.origin, s.destination,
            branchName(s.branchId), s.status, s.payment ? s.payment.status : "pending", s.cost];
        })
      )));
      toast("Shipments exported.", "success");
    });

    $("#adInvExport").addEventListener("click", function () {
      download("sudipost-invoices.csv", csv([["Invoice", "Customer", "Shipment", "Issued", "Due", "Status", "Method", "Amount SSP"]].concat(
        SP.store.listInvoices().map(function (i) {
          return [i.id, i.customer, i.shipment, i.issued, i.due, i.status, i.method, i.amount];
        })
      )));
      toast("Invoices exported.", "success");
    });

    $("#adLocExport").addEventListener("click", function () {
      download("sudipost-locations.csv", csv([["Name", "Type", "City", "Country", "Phone", "Email", "Services"]].concat(
        SP.LOCATIONS.map(function (l) {
          return [l.name, l.type, l.city, l.country, l.phone, l.email, (l.services || []).join(" | ")];
        })
      )));
      toast("Locations exported.", "success");
    });

    $("#adLogout").addEventListener("click", function () {
      if (!confirm("Sign out of the operations console?")) return;
      SP.auth.logout();
      SP.redirect("login.html");
    });

    const hash = (location.hash || "").replace("#", "");
    show(TITLES[hash] ? hash : "dashboard");

    SP.store.listShipments().then(function (list) {
      shipments = list || [];
      renderAll();
    }).catch(function () {
      shipments = SP.SHIPMENTS.slice();
      renderAll();
      toast("Working from seed data — the store could not be read.", "error");
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
