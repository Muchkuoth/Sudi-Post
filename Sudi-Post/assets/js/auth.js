/* ==========================================================================
   SUDI-POST — Login & registration
   Serves login.html and register.html (meta "scripts" decide which runs).
   ========================================================================== */
(function () {
  "use strict";
  const { icon, $, $$, esc, toast } = SP;

  const BENEFITS = [
    { i: "package", t: "Every shipment in one list", d: "Live status, ETA and location without phoning a branch." },
    { i: "bell", t: "Alerts that actually arrive", d: "Tracking number by SMS and WhatsApp at every milestone." },
    { i: "file-text", t: "Invoices you can hand over", d: "Download receipts, credit notes and statements as PDF." },
    { i: "map-pin", t: "Saved addresses", d: "Your pickup and drop-off points, ready for one-tap booking." },
    { i: "credit-card", t: "Card on file", d: "Pay once and stop re-entering details at the counter." },
    { i: "headset", t: "A human when it matters", d: "Escalation straight to your branch contact." }
  ];

  const DEMO = [
    { role: "customer", label: "Customer", email: "customer@sudipost.com", pass: "sudipost123", to: "account.html", note: "Joseph Loro" },
    { role: "admin", label: "Admin", email: "admin@sudipost.com", pass: "admin123", to: "admin.html", note: "Operations console" },
  ];

  /* Levels map 1:1 onto the .pw-strength.is-1 … is-4 states in the stylesheet. */
  const STRENGTH = [
    { min: 0, level: 0, label: "Use 8+ characters with a number and a capital letter." },
    { min: 3, level: 1, label: "Weak — add a number or a capital letter." },
    { min: 4, level: 2, label: "Fair — a symbol would make it stronger." },
    { min: 5, level: 3, label: "Good — add length to make it stronger." },
    { min: 7, level: 4, label: "Strong password." }
  ];
  const MIN_STRENGTH = 4;

  function scorePassword(v) {
    let s = 0;
    if (v.length >= 8) s += 2;
    if (v.length >= 12) s += 1;
    if (/[A-Z]/.test(v)) s += 1;
    if (/[0-9]/.test(v)) s += 1;
    if (/[^A-Za-z0-9]/.test(v)) s += 2;
    return s;
  }

  function alertBox(el, msg, kind) {
    if (!el) return;
    if (!msg) { el.hidden = true; el.innerHTML = ""; return; }
    el.hidden = false;
    el.className = "alert alert--" + (kind === "info" ? "info" : "danger");
    el.innerHTML = icon(kind === "info" ? "info" : "alert", "", { size: 20 }) +
      '<div class="alert__body">' + esc(msg) + "</div>";
    SP.hydrateIcons(el);
  }

  /* ------------------------------------------------------------- utilities */
  function homeFor(role) {
    return role === "admin" ? "admin.html" : role === "driver" ? "driver.html" : "account.html";
  }

  function wirePasswordToggles() {
    $$("[data-toggle-pass]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const input = document.getElementById(btn.getAttribute("data-toggle-pass"));
        if (!input) return;
        const show = input.type === "password";
        input.type = show ? "text" : "password";
        btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
        btn.classList.toggle("is-active", show);
        btn.innerHTML = icon(show ? "eye-off" : "eye");
      });
    });
  }

  /* ----------------------------------------------------------------- login */
  function initLogin() {
    if (SP.auth.current()) {
      const u = SP.auth.current();
      alertBox($("#loginAlert"), "You are already signed in as " + u.name + ".", "info");
    }

    $("#loginBenefits").innerHTML = BENEFITS.map(function (b) {
      return "<li>" + icon(b.i) + "<span><b>" + esc(b.t) + "</b><span>" + esc(b.d) + "</span></span></li>";
    }).join("");

    const q = SP.TESTIMONIALS[1] || SP.TESTIMONIALS[0];
    $("#loginQuote").innerHTML = "“" + esc(q.text) + "”<footer style=\"margin-top:var(--sp-3);color:var(--sp-navy-300)\">— " +
      esc(q.name) + ", " + esc(q.role) + "</footer>";

    /* The demo account list was removed from the markup, so #demoList is gone.
       Guarded rather than removed because the sign-in path still accepts the
       demo credentials typed manually. */
    const demoList = $("#demoList");
    if (demoList) {
      demoList.innerHTML = DEMO.map(function (d) {
        return "<li><span>" + esc(d.note) + "</span><span>" +
          "<code>" + esc(d.email) + "</code> " +
          '<button class="btn btn--outline btn--xs" type="button" data-demo="' + esc(d.role) + '">Sign in</button>' +
          "</span></li>";
      }).join("");
    }

    const form = $("#loginForm");
    SP.bindValidation(form);

    function signIn(email, password) {
      const alert = $("#loginAlert");
      alertBox(alert, "");
      const btn = $('button[type="submit"]', form);
      SP.setLoading(btn, true, "Signing in.");
      return SP.auth.login(email, password).then(function (user) {
        SP.setLoading(btn, false);
        const next = new URLSearchParams(location.search).get("next");
        const allowed = ["account.html", "admin.html", "driver.html", "send.html", "payment.html"];
        const dest = next && allowed.indexOf(next) > -1 ? next : homeFor(user.role);
        toast("Welcome back, " + user.name.split(" ")[0] + ".", "success");
        SP.redirect(dest);
        return user;
      }).catch(function (err) {
        SP.setLoading(btn, false);
        alertBox(alert, err.message, "error");
        const pw = $("#lPassword");
        pw.value = "";
        pw.focus();
      });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!SP.validateForm(form)) { alertBox($("#loginAlert"), "Please correct the highlighted fields.", "error"); return; }
      const d = SP.getData(form);
      signIn(d.email, d.password);
    });

    $$("[data-demo]").forEach(function (b) {
      b.addEventListener("click", function () {
        const d = DEMO.filter(function (x) { return x.role === b.getAttribute("data-demo"); })[0];
        if (!d) return;
        $("#lEmail").value = d.email;
        $("#lPassword").value = d.pass;
        signIn(d.email, d.pass);
      });
    });

    const forgot = $("#forgotBtn");
    if (forgot) {
      forgot.addEventListener("click", function () {
        const email = $("#lEmail").value.trim();
        if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
          alertBox($("#loginAlert"), "Enter your email address above first, then tap “Forgot password?”.", "info");
          $("#lEmail").focus();
          return;
        }
        /* simulated — replace with POST /api/v1/auth/forgot */
        alertBox($("#loginAlert"),
          "If an account exists for " + email + ", a reset link is on its way. Check spam, or call +211 927 100 141.",
          "info");
      });
    }

    wirePasswordToggles();
  }

  /* ------------------------------------------------------------- register */
  function initRegister() {
    $("#regBenefits").innerHTML = BENEFITS.map(function (b) {
      return "<li>" + icon(b.i) + "<span><b>" + esc(b.t) + "</b><span>" + esc(b.d) + "</span></span></li>";
    }).join("");

    const cities = [];
    SP.LOCATIONS.forEach(function (l) { if (cities.indexOf(l.city) === -1) cities.push(l.city); });
    cities.sort();
    $("#rCity").innerHTML = '<option value="">Select your city</option>' +
      cities.map(function (c) { return '<option value="' + esc(c) + '">' + esc(c) + "</option>"; }).join("");

    const pw = $("#rPassword");
    const bar = $("#rStrength");
    const text = $("#rStrengthText");
    pw.addEventListener("input", function () {
      const s = scorePassword(pw.value);
      const lvl = STRENGTH.filter(function (x) { return s >= x.min; }).pop();
      bar.className = "pw-strength" + (lvl.level ? " is-" + lvl.level : "");
      text.textContent = pw.value ? lvl.label : STRENGTH[0].label;
      $("#rConfirmErr").textContent = "";
    });

    const form = $("#regForm");
    SP.bindValidation(form);
    wirePasswordToggles();

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const alert = $("#regAlert");
      alertBox(alert, "");

      const d = SP.getData(form);
      if (d.password !== d.confirm) {
        $("#rConfirmErr").textContent = "Passwords do not match.";
        alertBox(alert, "The two passwords do not match.", "error");
        $("#rConfirm").focus();
        return;
      }
      if (scorePassword(d.password) < MIN_STRENGTH) {
        $("#rPasswordErr").textContent = "Please use at least 8 characters with a number and a capital letter.";
        alertBox(alert, "Please choose a stronger password.", "error");
        return;
      }
      if (!SP.validateForm(form)) { alertBox(alert, "Please complete the highlighted fields.", "error"); return; }

      const btn = $('button[type="submit"]', form);
      SP.setLoading(btn, true, "Creating account.");
      /* simulated — replace with POST /api/v1/auth/register */
      SP.auth.register({ name: d.name, email: d.email, phone: d.phone, city: d.city, password: d.password })
        .then(function (user) {
          SP.setLoading(btn, false);
          toast("Account created. Welcome, " + user.name.split(" ")[0] + ".", "success");
          SP.redirect("account.html?welcome=1");
        })
        .catch(function (err) {
          SP.setLoading(btn, false);
          alertBox(alert, err.message, "error");
          $("#rEmail").focus();
        });
    });
  }

  /* ----------------------------------------------------------------- init */
  function init() {
    if ($("#loginForm")) initLogin();
    if ($("#regForm")) initRegister();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
