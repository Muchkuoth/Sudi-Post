/* ==========================================================================
   SUDI-POST — Operating network map
   --------------------------------------------------------------------------
   Dependency-free SVG map of the four countries Sudi-Post operates in:
   South Sudan, Ethiopia, Uganda and Kenya. Nothing else is drawn: the
   projection box is the exact bounding box of those four outlines, so the
   viewport can never show a fifth country.

   Country outlines live in SP.COUNTRY_NETWORK (assets/js/map-network.js) and
   are pre-projected into the same viewBox, so landmasses, branch markers and
   the Juba->Addis corridor all share one coordinate space.

   No tiles, no network calls, no tracking scripts — important for users on
   metered or slow mobile connections.

   Interaction: drag to pan; wheel, pinch, keyboard or the on-map buttons to
   zoom. Panning and zoom are clamped so the map can never be dragged away
   from the four-country extent or zoomed past MAX_ZOOM.

   Usage: SP.map.render(hostEl, { activeId, visible, route, interactive, onSelect })
   ========================================================================== */
(function (global) {
  "use strict";

  var NET = global.SP.COUNTRY_NETWORK;

  var MIN_LON = NET.bbox[0], MIN_LAT = NET.bbox[1];
  var MAX_LON = NET.bbox[2], MAX_LAT = NET.bbox[3];
  var W = NET.viewBox[0], H = NET.viewBox[1];

  /* equirectangular projection with a cos(lat) aspect correction, fitted to the
     four-country bounding box. Identical maths to the build-time projector, so
     runtime markers land exactly on the baked outlines. */
  var KX = Math.cos(((MIN_LAT + MAX_LAT) / 2) * Math.PI / 180);
  var SCALE = Math.min(W / ((MAX_LON - MIN_LON) * KX), H / (MAX_LAT - MIN_LAT));
  var OFF_X = (W - (MAX_LON - MIN_LON) * KX * SCALE) / 2;
  var OFF_Y = (H - (MAX_LAT - MIN_LAT) * SCALE) / 2;

  var X = function (lon) { return (lon - MIN_LON) * KX * SCALE + OFF_X; };
  var Y = function (lat) { return OFF_Y + (MAX_LAT - lat) * SCALE; };

  var BOX = { lon0: MIN_LON, lon1: MAX_LON, lat0: MAX_LAT, lat1: MIN_LAT, w: W, h: H };

  /* draw order: South Sudan last so the home market sits on top of its borders */
  var ORDER = ["ETH", "KEN", "UGA", "SSD"];

  /* Juba -> Addis road/air corridor (both ends inside the footprint) */
  var CORRIDOR = [
    [31.5713, 4.8594], [31.6106, 4.8656], [32.0333, 3.6667], [33.5833, 4.7667],
    [34.9, 7.2], [36.2, 8.4], [37.4, 8.9], [38.74, 9.03]
  ];

  var MIN_ZOOM = 1, MAX_ZOOM = 5, ZOOM_STEP = 1.6;

  /* Rubber-band margin allowed on every edge, as a fraction of the viewport.
     Without it a map that exactly fills the viewport (zoom 1, the default view)
     has nowhere to pan to and could not be dragged at all. */
  var OVERSCROLL = 0.18;

  var esc = function (s) { return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;"); };

  function defs(id) {
    return "<defs>" +
      '<pattern id="' + id + '-grid" width="48" height="48" patternUnits="userSpaceOnUse">' +
        '<path d="M48 0H0V48" fill="none" class="map-grid" vector-effect="non-scaling-stroke"/>' +
      "</pattern>" +
      '<radialGradient id="' + id + '-bg" cx="42%" cy="34%" r="78%">' +
        '<stop offset="0" stop-color="#062744"/>' +
        '<stop offset="1" stop-color="#03172F"/>' +
      "</radialGradient>" +
    "</defs>";
  }

  /* Landmasses are painted twice: a fill pass, then a stroke-only pass, so
     borders shared between two countries read as one clean line. */
  function basemap(id, withRoute) {
    var layers = [
      '<rect width="' + W + '" height="' + H + '" fill="url(#' + id + '-bg)"/>',
      '<rect width="' + W + '" height="' + H + '" fill="url(#' + id + '-grid)"/>'
    ];

    ORDER.forEach(function (code) {
      NET.countries[code].paths.forEach(function (d) {
        layers.push('<path d="' + d + '" class="map-land map-land--' +
          (code === "SSD" ? "home" : "partner") + '"/>');
      });
    });

    if (withRoute) {
      layers.push('<polyline class="map-route" points="' + CORRIDOR.map(function (p) {
        return X(p[0]).toFixed(1) + "," + Y(p[1]).toFixed(1);
      }).join(" ") + '"/>');
    }

    ORDER.forEach(function (code) {
      NET.countries[code].paths.forEach(function (d) {
        layers.push('<path d="' + d + '" class="map-border"/>');
      });
    });

    return layers.join("");
  }

  /* Labels sit in their own counter-scaled group so country names stay legible
     at every zoom level instead of ballooning with the landmasses. */
  function labels() {
    return '<g class="map-labels">' + ORDER.map(function (code) {
      var c = NET.countries[code];
      return '<g class="map-label__fix" transform="scale(1)">' +
        '<text x="' + X(c.labelAt[0]).toFixed(1) + '" y="' + Y(c.labelAt[1]).toFixed(1) +
        '" class="map-label map-label--' + (code === "SSD" ? "home" : "partner") + '">' +
        esc(c.name) + "</text></g>";
    }).join("") +
    '<g class="map-label__fix" transform="scale(1)"><g class="map-route-ends">' +
      '<circle cx="' + X(CORRIDOR[0][0]).toFixed(1) + '" cy="' + Y(CORRIDOR[0][1]).toFixed(1) + '" r="3.4" class="map-endpoint"/>' +
      '<circle cx="' + X(CORRIDOR[7][0]).toFixed(1) + '" cy="' + Y(CORRIDOR[7][1]).toFixed(1) + '" r="3.4" class="map-endpoint"/>' +
    "</g></g></g>";
  }

  /**
   * render(host, options)
   * options: { activeId, visible:Set|array|function, route:boolean, interactive:boolean, onSelect }
   */
  function render(host, options) {
    var o = options || {};
    var id = "spmap" + Math.random().toString(36).slice(2, 8);
    var visible = o.visible;
    var pan = o.interactive !== false;

    var markers = SP.LOCATIONS.map(function (l) {
      var x = X(l.lon).toFixed(1), y = Y(l.lat).toFixed(1);
      var shown = !visible || (typeof visible === "function" ? visible(l) : visible.indexOf(l) > -1);
      var isActive = o.activeId === l.id;
      var cls = "map-marker" + (l.isHead ? " is-hq" : "") + (l.partner ? " is-partner" : "") +
        (isActive ? " is-active" : "") + (shown ? "" : " is-dim");
      var label = (l.isHead || isActive)
        ? '<text class="map-marker__label" x="9" y="4">' + esc(l.city) + "</text>" : "";
      /* three nested groups: outer = position (attribute), middle = counter-scale
         (attribute, written by applyView), inner = hover animation (CSS) */
      return '<g class="' + cls + '" data-marker="' + esc(l.id) + '" transform="translate(' + x + " " + y + ')"' +
        (pan ? ' role="button" tabindex="0"' : "") +
        ' aria-label="' + esc(l.name + ", " + l.city) + '">' +
        '<g class="map-marker__fix">' +
          '<g class="map-marker__hit">' +
            '<circle class="map-marker__pulse" cx="0" cy="0" r="9"/>' +
            '<circle class="map-marker__dot" cx="0" cy="0" r="5.5"/>' + label +
          "</g>" +
        "</g>" +
      "</g>";
    }).join("");

    host.innerHTML =
      '<svg class="map-svg" viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="xMidYMid meet"' +
        (pan ? ' tabindex="0" role="img" aria-label="Interactive map of Kenya, Uganda, Ethiopia and South Sudan. ' +
          "Use the arrow keys to pan and the plus or minus keys to zoom." : ' role="presentation" focusable="false"') +
        ">" +
        defs(id) +
        '<g class="map-viewport">' +
          basemap(id, o.route !== false) +
          labels() +
          '<g class="map-markers">' + markers + "</g>" +
        "</g>" +
      "</svg>" +
      (pan
        ? '<div class="map-ctrl" role="group" aria-label="Map zoom controls">' +
            '<button type="button" class="map-ctrl__btn" data-map="in" aria-label="Zoom in">+</button>' +
            '<button type="button" class="map-ctrl__btn" data-map="out" aria-label="Zoom out">&minus;</button>' +
            '<button type="button" class="map-ctrl__btn" data-map="reset" aria-label="Reset map view">&#8634;</button>' +
          "</div>" +
          '<p class="map-hint">Drag to pan &middot; scroll or pinch to zoom</p>'
        : "");

    if (o.interactive === false) return;

    Array.prototype.forEach.call(host.querySelectorAll("[data-marker]"), function (g) {
      var fire = function () { o.onSelect(g.getAttribute("data-marker"), g); };
      g.addEventListener("click", fire);
      g.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fire(); }
      });
    });

    if (pan) enablePanZoom(host);
  }

  /* ------------------------------------------------------------------ pan/zoom */
  function enablePanZoom(host) {
    var svg = host.querySelector(".map-svg");
    var viewport = host.querySelector(".map-viewport");
    var fixes = host.querySelectorAll(".map-marker__fix, .map-label__fix");
    if (!svg || !viewport) return;

    var view = { k: 1, x: 0, y: 0 };
    var pointers = new Map();
    var drag = null;
    var moved = false;
    var pinch = null;

    /* viewBox units per rendered CSS pixel */
    function unitsPerPx() {
      var rect = svg.getBoundingClientRect();
      return rect.width ? W / rect.width : 1;
    }

    /* Keep the map from being dragged away: panning may overshoot each edge by
       OVERSCROLL of the viewport, and the far edge stays reachable at every
       zoom so no part of the four-country footprint can be locked out. */
    function clamp() {
      var ox = W * OVERSCROLL, oy = H * OVERSCROLL;
      view.x = Math.min(ox, Math.max(W - W * view.k - ox, view.x));
      view.y = Math.min(oy, Math.max(H - H * view.k - oy, view.y));
    }

    function apply() {
      viewport.setAttribute("transform",
        "translate(" + view.x.toFixed(2) + " " + view.y.toFixed(2) + ") scale(" + view.k.toFixed(4) + ")");
      /* keep markers and labels at a constant on-screen size */
      var inv = (1 / view.k).toFixed(4);
      Array.prototype.forEach.call(fixes, function (g) { g.setAttribute("transform", "scale(" + inv + ")"); });
    }

    function zoomTo(k, px, py) {
      var next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, k));
      if (next === view.k) return;
      view.x = px - (px - view.x) * (next / view.k);
      view.y = py - (py - view.y) * (next / view.k);
      view.k = next;
      clamp();
      apply();
    }

    function zoomCentre(mult) {
      zoomTo(view.k * mult, W / 2, H / 2);
    }

    function reset() {
      view.k = 1; view.x = 0; view.y = 0;
      apply();
    }

    /* ---- drag to pan ---- */
    svg.addEventListener("pointerdown", function (e) {
      pointers.set(e.pointerId, e);
      if (pointers.size === 1) {
        drag = { id: e.pointerId, px: e.clientX, py: e.clientY };
        moved = false;
        svg.classList.add("is-dragging");
        /* capture keeps the drag alive outside the element, but throws for
           synthetic or already-released pointer ids — never fatal here */
        try { if (svg.setPointerCapture) svg.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      } else if (pointers.size === 2) {
        drag = null;
        var pts = Array.from(pointers.values());
        pinch = Math.hypot(pts[0].clientX - pts[1].clientX, pts[0].clientY - pts[1].clientY) || 1;
      }
    });

    svg.addEventListener("pointermove", function (e) {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, e);

      if (pointers.size >= 2) {
        var pts = Array.from(pointers.values());
        var d = Math.hypot(pts[0].clientX - pts[1].clientX, pts[0].clientY - pts[1].clientY) || 1;
        var rect = svg.getBoundingClientRect();
        var cx = (pts[0].clientX + pts[1].clientX) / 2 - rect.left;
        var cy = (pts[0].clientY + pts[1].clientY) / 2 - rect.top;
        var u = unitsPerPx();
        if (pinch) zoomTo(view.k * (d / pinch), cx * u, cy * u);
        pinch = d;
        moved = true;
        return;
      }

      if (!drag || e.pointerId !== drag.id) return;
      var upp = unitsPerPx();
      var dx = (e.clientX - drag.px) * upp, dy = (e.clientY - drag.py) * upp;
      if (Math.abs(e.clientX - drag.px) > 3 || Math.abs(e.clientY - drag.py) > 3) moved = true;
      drag.px = e.clientX; drag.py = e.clientY;
      view.x += dx; view.y += dy;
      clamp();
      apply();
    });

    function endPointer(e) {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinch = null;
      if (pointers.size === 0) {
        drag = null;
        svg.classList.remove("is-dragging");
        /* The browser fires a trailing click for the gesture we just ended, and the
           capture-phase guard below must swallow that one. Releasing the flag on the
           next tick means the visitor's next deliberate click still reaches a marker
           instead of being eaten by the drag that preceded it. */
        setTimeout(function () { moved = false; }, 0);
      }
    }
    /* pointerup/cancel only — pointerleave would abort a drag that has already
       left the element, which is the normal case when capture is active */
    svg.addEventListener("pointerup", endPointer);
    svg.addEventListener("pointercancel", endPointer);
    svg.addEventListener("lostpointercapture", endPointer);

    /* a drag must not fire the marker underneath it */
    svg.addEventListener("click", function (e) {
      if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; }
    }, true);

    /* ---- wheel zoom ---- */
    svg.addEventListener("wheel", function (e) {
      e.preventDefault();
      var rect = svg.getBoundingClientRect();
      var u = unitsPerPx();
      var mult = Math.pow(0.999, e.deltaY);
      zoomTo(view.k * mult, (e.clientX - rect.left) * u, (e.clientY - rect.top) * u);
    }, { passive: false });

    /* ---- keyboard ---- */
    svg.addEventListener("keydown", function (e) {
      var step = 60 / view.k;
      var handled = true;
      switch (e.key) {
        case "ArrowLeft":  view.x += step; break;
        case "ArrowRight": view.x -= step; break;
        case "ArrowUp":    view.y += step; break;
        case "ArrowDown":  view.y -= step; break;
        case "+": case "=": zoomCentre(ZOOM_STEP); break;
        case "-": case "_": zoomCentre(1 / ZOOM_STEP); break;
        case "0": reset(); break;
        default: handled = false;
      }
      if (!handled) return;
      e.preventDefault();
      clamp();
      apply();
    });

    /* ---- on-map buttons ---- */
    Array.prototype.forEach.call(host.querySelectorAll("[data-map]"), function (btn) {
      btn.addEventListener("click", function () {
        var a = btn.getAttribute("data-map");
        if (a === "in") zoomCentre(ZOOM_STEP);
        else if (a === "out") zoomCentre(1 / ZOOM_STEP);
        else reset();
      });
    });

    apply();
  }

  var SP = global.SP || (global.SP = {});
  SP.map = {
    BOX: BOX,
    X: X,
    Y: Y,
    corridor: CORRIDOR,
    countries: ORDER.map(function (c) { return NET.countries[c].name; }),
    render: render,
    directionsUrl: function (l) {
      return "https://www.google.com/maps/dir/?api=1&destination=" + l.lat + "," + l.lon;
    },
    searchUrl: function (l) {
      return "https://www.google.com/maps/search/?api=1&query=" + l.lat + "," + l.lon;
    },
    /* shareable link that does not require a map provider */
    geoLink: function (l) {
      return "geo:" + l.lat + "," + l.lon + "?q=" + l.lat + "," + l.lon + "(" + encodeURIComponent(l.name + ", " + l.city) + ")";
    }
  };
})(window);
