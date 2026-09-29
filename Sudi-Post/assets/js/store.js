/* ==========================================================================
   SUDI-POST — Storage, Session & Data Access
   --------------------------------------------------------------------------
   Thin persistence layer over localStorage. When the REST API goes live,
   replace the internals of SP.API (in data.js) and SP.store so that views
   keep calling the same functions. Nothing in the UI touches localStorage.
   ========================================================================== */
(function (global) {
  "use strict";

  const NS = "sudipost:v1:";
  const memory = {};          // fallback when localStorage is blocked

  function available() {
    try {
      const k = NS + "__t";
      localStorage.setItem(k, "1");
      localStorage.removeItem(k);
      return true;
    } catch (e) { return false; }
  }
  const HAS_LS = available();

  function raw(key) {
    return HAS_LS ? localStorage.getItem(NS + key) : (key in memory ? memory[key] : null);
  }
  function write(key, value) {
    const s = JSON.stringify(value);
    if (HAS_LS) { try { localStorage.setItem(NS + key, s); } catch (e) { memory[key] = s; } }
    else memory[key] = s;
  }
  function wipe(key) {
    if (HAS_LS) { try { localStorage.removeItem(NS + key); } catch (e) {} }
    delete memory[key];
  }

  const store = {
    get: function (key, fallback) {
      try {
        const v = raw(key);
        return v === null ? fallback : JSON.parse(v);
      } catch (e) { return fallback; }
    },
    set: function (key, value) { write(key, value); return value; },
    remove: wipe,
    available: HAS_LS,

    /* ---------------- Shipments ---------------- */
    /* Seed records are the source of truth. A local record whose tracking
       matches a seed is a *shadow* that overrides it (driver/admin updates);
       any other local record is a genuinely new shipment. */
    listShipments: function () {
      const custom = store.get("shipments", []);
      return SP.API.getShipments().then(function (seed) {
        const merged = seed.map(function (s) {
          const key = SP.ship.normaliseTracking(s.tracking);
          const shadow = custom.filter(function (c) { return SP.ship.normaliseTracking(c.tracking) === key; })[0];
          return shadow ? Object.assign({}, s, shadow) : s;
        });
        const seedKeys = {};
        seed.forEach(function (s) { seedKeys[SP.ship.normaliseTracking(s.tracking)] = true; });
        const fresh = custom.filter(function (c) { return !seedKeys[SP.ship.normaliseTracking(c.tracking)]; });
        return merged.concat(fresh);
      });
    },
    getShipment: function (tracking) {
      const custom = store.get("shipments", []);
      const key = SP.ship.normaliseTracking(tracking);
      const local = custom.filter(function (s) { return SP.ship.normaliseTracking(s.tracking) === key; })[0];
      if (local) return Promise.resolve(local);
      return SP.API.getShipment(tracking);
    },
    addShipment: function (shipment) {
      const list = store.get("shipments", []);
      list.unshift(shipment);
      store.set("shipments", list);
      return shipment;
    },
    updateShipment: function (tracking, patch) {
      const key = SP.ship.normaliseTracking(tracking);
      const custom = store.get("shipments", []);
      let updated = null;
      const next = custom.map(function (s) {
        if (SP.ship.normaliseTracking(s.tracking) !== key) return s;
        updated = Object.assign({}, s, patch);
        return updated;
      });
      store.set("shipments", next);
      if (updated) return Promise.resolve(updated);

      const seed = SP.SHIPMENTS.filter(function (s) { return SP.ship.normaliseTracking(s.tracking) === key; })[0];
      if (seed) {
        const merged = Object.assign({}, seed, patch);
        const shadow = custom.filter(function (s) { return SP.ship.normaliseTracking(s.tracking) !== key; });
        shadow.unshift(merged);
        store.set("shipments", shadow);
        return Promise.resolve(merged);
      }
      return Promise.resolve(null);
    },
    resetAll: function () {
      ["shipments", "customers", "invoices", "payments", "addresses", "pickups", "messages", "notifications", "session", "users", "pod"].forEach(wipe);
    },

    /* ---------------- Addresses & pickups ---------------- */
    /* ---- invoices: seed data plus locally applied payment overrides ---- */
    listInvoices: function () {
      const patches = store.get("invoicePatches", {});
      return SP.INVOICES.map(function (i) {
        return patches[i.id] ? Object.assign({}, i, patches[i.id]) : i;
      });
    },
    getInvoice: function (id) {
      const key = String(id || "").toUpperCase();
      return store.listInvoices().filter(function (i) { return i.id.toUpperCase() === key; })[0] || null;
    },
    patchInvoice: function (id, patch) {
      const patches = store.get("invoicePatches", {});
      const key = String(id || "").toUpperCase();
      const found = SP.INVOICES.filter(function (i) { return i.id.toUpperCase() === key; })[0];
      if (!found) return null;
      patches[found.id] = Object.assign({}, patches[found.id], patch);
      store.set("invoicePatches", patches);
      return Object.assign({}, found, patches[found.id]);
    },

    listAddresses: function () { return store.get("addresses", []); },
    addAddress: function (a) {
      const list = store.get("addresses", []);
      a.id = "A-" + Date.now();
      list.unshift(a);
      store.set("addresses", list);
      return a;
    },
    removeAddress: function (id) {
      store.set("addresses", store.get("addresses", []).filter(function (a) { return a.id !== id; }));
    },
    listPickups: function () { return store.get("pickups", []); },
    addPickup: function (p) {
      const list = store.get("pickups", []);
      p.id = "PU-" + Date.now();
      p.requestedAt = new Date().toISOString();
      p.status = "requested";
      list.unshift(p);
      store.set("pickups", list);
      return p;
    },

    /* ---------------- Notifications & messages ---------------- */
    listNotifications: function () { return store.get("notifications", []); },
    pushNotification: function (n) {
      const list = store.get("notifications", []);
      n.id = "N-" + Date.now();
      n.at = new Date().toISOString();
      n.read = false;
      list.unshift(n);
      store.set("notifications", list.slice(0, 40));
      return n;
    },
    markNotificationsRead: function () {
      store.set("notifications", store.listNotifications().map(function (n) { return Object.assign({}, n, { read: true }); }));
    },
    listMessages: function () { return store.get("messages", []); },
    addMessage: function (m) {
      const list = store.get("messages", []);
      m.id = "M-" + Date.now();
      m.at = new Date().toISOString();
      m.status = "new";
      list.unshift(m);
      store.set("messages", list);
      return m;
    }
  };

  /* =======================================================================
     AUTH — demo authentication. Replace with real tokens (JWT) from the API.
     ======================================================================= */
  const DEMO_USERS = [
    { id: "U-1", role: "customer", name: "Joseph Loro", email: "customer@sudipost.com", password: "sudipost123", phone: "+211977112233", customerId: "C-1001", company: "", city: "Juba" },
    { id: "U-2", role: "admin",    name: "Sudi-Post Admin", email: "admin@sudipost.com", password: "admin123",    phone: "+211927100141", customerId: "", company: "Sudi-Post", city: "Juba" },
    { id: "U-4", role: "customer", name: "Nadia Elman",  email: "business@sudipost.com",password: "sudipost123", phone: "+211977667788", customerId: "C-1006", company: "South Sun Retail", city: "Juba" }
  ];

  const auth = {
    DEMO: DEMO_USERS,
    register: function (data) {
      const users = store.get("users", DEMO_USERS.slice());
      const email = String(data.email || "").toLowerCase().trim();
      if (users.some(function (u) { return u.email === email; })) {
        return Promise.reject(new Error("An account with this email already exists."));
      }
      const user = {
        id: "U-" + (users.length + 1),
        role: "customer",
        name: data.name,
        email: email,
        password: data.password,
        phone: data.phone || "",
        company: data.company || "",
        city: data.city || "Juba",
        customerId: "C-" + (2000 + users.length),
        createdAt: new Date().toISOString()
      };
      users.push(user);
      store.set("users", users);
      store.set("session", { userId: user.id, at: new Date().toISOString() });
      return Promise.resolve(publicUser(user));
    },
    login: function (email, password, role) {
      const users = store.get("users", DEMO_USERS.slice());
      const mail = String(email || "").toLowerCase().trim();
      const user = users.filter(function (u) { return u.email === mail; })[0];
      if (!user) return Promise.reject(new Error("We could not find an account with that email address."));
      if (user.password !== password) return Promise.reject(new Error("Incorrect password. Please try again."));
      if (role && user.role !== role) {
        return Promise.reject(new Error("This account does not have access to the " + role + " portal."));
      }
      store.set("session", { userId: user.id, role: user.role, at: new Date().toISOString() });
      return Promise.resolve(publicUser(user));
    },
    loginDemo: function (role) {
      const users = store.get("users", DEMO_USERS.slice());
      const user = users.filter(function (u) { return u.role === role; })[0];
      if (!user) return Promise.reject(new Error("Demo account unavailable."));
      return auth.login(user.email, user.password, role);
    },
    logout: function () { wipe("session"); },
    session: function () { return store.get("session", null); },
    current: function () {
      const s = auth.session();
      if (!s) return null;
      const users = store.get("users", DEMO_USERS.slice());
      const user = users.filter(function (u) { return u.id === s.userId; })[0];
      return user ? publicUser(user) : null;
    },
    update: function (patch) {
      const s = auth.session();
      if (!s) return null;
      const users = store.get("users", DEMO_USERS.slice());
      let updated = null;
      const next = users.map(function (u) {
        if (u.id !== s.userId) return u;
        updated = Object.assign({}, u, patch);
        return updated;
      });
      store.set("users", next);
      return publicUser(updated);
    },
    changePassword: function (current, next) {
      const s = auth.session();
      if (!s) return Promise.reject(new Error("Not signed in."));
      const users = store.get("users", DEMO_USERS.slice());
      const user = users.filter(function (u) { return u.id === s.userId; })[0];
      if (!user || user.password !== current) return Promise.reject(new Error("Current password is incorrect."));
      return auth.update({ password: next });
    }
  };

  function publicUser(u) {
    if (!u) return null;
    return {
      id: u.id, role: u.role, name: u.name, email: u.email, phone: u.phone,
      company: u.company, city: u.city, customerId: u.customerId, driverId: u.driverId,
      initials: (u.name || "?").split(" ").map(function (p) { return p.charAt(0); }).join("").slice(0, 2).toUpperCase()
    };
  }

  function initials(name) {
    return String(name || "?").split(/\s+/).map(function (p) { return p.charAt(0); })
      .join("").slice(0, 2).toUpperCase();
  }

  global.SP.store = store;
  global.SP.auth = auth;
  global.SP.initials = initials;
})(window);
