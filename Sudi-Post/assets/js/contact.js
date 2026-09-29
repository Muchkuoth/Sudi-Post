/* ==========================================================================
   SUDI-POST — Contact page
   ========================================================================== */
(function () {
  "use strict";
  const { icon, $, $$, esc, toast } = SP;

  const TOPICS = [
    { id: "quote", label: "Request a quote", icon: "receipt" },
    { id: "shipment", label: "Track or chase a parcel", icon: "package" },
    { id: "support", label: "Customer support", icon: "headset" },
    { id: "coverage", label: "Check coverage", icon: "map-pin" },
    { id: "business", label: "Business & partnerships", icon: "briefcase" },
    { id: "careers", label: "Careers", icon: "users" },
    { id: "feedback", label: "Feedback or complaint", icon: "message" },
    { id: "other", label: "Something else", icon: "info" }
  ];

  const DEPTS = [
    { label: "General enquiries", mail: "info@sudipost.com", icon: "mail" },
    { label: "Customer support", mail: "support@sudipost.com", icon: "headset" },
    { label: "Business & corporate", mail: "business@sudipost.com", icon: "briefcase" },
    { label: "Careers", mail: "careers@sudipost.com", icon: "users" }
  ];

  /* --------------------------------------------------------------- chrome */
  function contactCards() {
    const B = SP.BRAND;
    const cards = [
      { i: "phone", t: "Call us", v: B.phones.main, sub: "Mon–Fri 07:30–18:30, Sat 08:00–17:00", href: "tel:" + B.phones.main.replace(/\s/g, ""), cta: "Call now" },
      { i: "whatsapp", t: "WhatsApp", v: B.phones.main, sub: "Replies in minutes, 08:00–20:00", href: SP.waLink("Hello Sudi-Post, I have an enquiry."), cta: "Open chat", external: true, wa: true },
      { i: "mail", t: "Email us", v: B.emails.general, sub: "We reply within one business day", href: "mailto:" + B.emails.general, cta: "Write to us" },
      { i: "map-pin", t: "Visit the office", v: B.address.street, sub: B.address.city + ", " + B.address.country, href: "locations.html", cta: "Find a location" }
    ];
    $("#contactCards").innerHTML = cards.map(function (c, i) {
      return '' +
      '<a class="contact-card' + (c.wa ? " contact-card--whatsapp" : "") + '" href="' + esc(c.href) + '"' +
        (c.external ? ' target="_blank" rel="noopener"' : "") + ">" +
        '<span class="contact-card__icon">' + icon(c.i) + "</span>" +
        "<span>" +
          "<h3>" + esc(c.t) + "</h3>" +
          '<p class="fw-700" style="color:var(--sp-navy-800);margin-top:2px">' + esc(c.v) + "</p>" +
          "<p>" + esc(c.sub) + "</p>" +
        "</span>" +
      "</a>";
    }).join("");
  }

  function topicChips() {
    $("#topicChips").innerHTML = TOPICS.map(function (t) {
      return '<label class="chip"><input type="radio" name="topicRadio" value="' + t.id + '" class="visually-hidden">' +
        icon(t.icon, "", { size: 15 }) + esc(t.label) + "</label>";
    }).join("");

    $$("#topicChips input[name=topicRadio]").forEach(function (r) {
      r.addEventListener("change", function () {
        $("#topicValue").value = r.value;
        $("#topicValue").dispatchEvent(new Event("change"));
      });
    });
  }

  function hours() {
    $("#brandHours").innerHTML = SP.BRAND.hours.map(function (h) {
      return "<div><span>" + esc(h.day) + "</span><b>" + esc(h.open) + " – " + esc(h.close) + "</b></div>";
    }).join("");

    $("#deptList").innerHTML = DEPTS.map(function (d) {
      return "<li>" + icon(d.icon) + '<span><a href="mailto:' + esc(d.mail) + '">' + esc(d.mail) + "</a><br>" +
        '<span class="text-sm text-muted">' + esc(d.label) + "</span></span></li>";
    }).join("");
  }

  function faqs() {
    const picks = [0, 2, 5, 8];
    $("#contactFaq").innerHTML = picks.map(function (i, n) {
      const f = SP.FAQS[i];
      if (!f) return "";
      return '<details class="accordion__item"' + (n === 0 ? " open" : "") + "><summary>" + esc(f.q) +
        '</summary><div class="accordion__body"><p>' + esc(f.a) + "</p></div></details>";
    }).join("");
  }

  /* ------------------------------------------------------------------ form */
  function bindForm() {
    const form = $("#contactForm");
    if (!form) return;

    const CONSENT_ERR = "Please tick the box so we may reply to you.";

    /* The consent box reports inline, next to its own label, rather than in
       the field wrapper the generic validator would look for. */
    const consent = $("#kConsent");
    const consentErr = $("#kConsentErr");
    const consentOK = function () {
      if (consentErr) consentErr.textContent = consent && consent.checked ? "" : CONSENT_ERR;
      return !!(consent && consent.checked);
    };
    if (consent) consent.addEventListener("change", consentOK);

    function confirmation(message) {
      let done = $("#contactDone");
      if (!done) {
        done = document.createElement("div");
        done.id = "contactDone";
        done.className = "formset__done";
        form.parentNode.insertBefore(done, form.nextSibling);
      }
      done.innerHTML = icon("check-circle") + "<div><strong>Enquiry received</strong><p>" + esc(message) + "</p></div>";
      done.hidden = false;
      return done;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      if (!SP.validateForm(form) || !consentOK()) {
        toast("Please complete the highlighted fields.", "error");
        if (consent && !consent.checked) consent.focus({ preventScroll: true });
        return;
      }

      const d = SP.getData(form);
      SP.store.addMessage({
        name: d.name || "",
        email: d.email || "",
        phone: d.phone || "",
        topic: d.topic || "other",
        tracking: d.tracking || "",
        message: d.message || "",
        source: "contact"
      });

      confirmation("Thank you, " + (d.name || "") + ". Our team replies within one business day, Mon–Fri 07:30–18:30.");
      toast("Thanks — your enquiry is with our team.", "success");
      form.reset();
      if (consentErr) consentErr.textContent = "";
    });
  }

  /* ----------------------------------------------------------------- init */
  function init() {
    contactCards();
    topicChips();
    hours();
    faqs();
    bindForm();
    SP.initReveal();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
