/* TableQR admin: live board (polling) and QR cards for printing. */
(function () {
  "use strict";
  var A = window.TableQRAdmin || {}, T = A.i18n || {};

  // QR cards on the "Print QR codes" tab
  document.querySelectorAll(".tq-qr[data-url]").forEach(function (el) {
    try { el.innerHTML = window.TableQR.svg(el.dataset.url, 2); } catch (e) { el.textContent = e.message; }
  });

  // @pro-start live board
  var ordersEl = document.getElementById("tq-orders"), callsEl = document.getElementById("tq-calls");
  if (!ordersEl) return;

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]; }); }
  function api(path, body) {
    return fetch(A.api + path, {method: body ? "POST" : "GET", credentials: "same-origin",
      headers: {"X-WP-Nonce": A.nonce, "Content-Type": "application/json"}, body: body ? JSON.stringify(body) : undefined})
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); });
  }

  // sound: browsers allow it only after a click on the page
  var audio = null, seen = null;
  document.getElementById("tq-sound").addEventListener("click", function () {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    audio.resume(); beep(); this.textContent = T.soundon;
  });
  function beep() {
    if (!audio) return;
    [0, 0.25].forEach(function (d) {
      var o = audio.createOscillator(), g = audio.createGain();
      o.frequency.value = 880; o.connect(g); g.connect(audio.destination);
      g.gain.setValueAtTime(0.25, audio.currentTime + d); g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + d + 0.2);
      o.start(audio.currentTime + d); o.stop(audio.currentTime + d + 0.22);
    });
  }

  function mins(now, t) { return Math.max(0, Math.round((now - t) / 60)); }

  function render(r) {
    callsEl.innerHTML = r.calls.length ? r.calls.map(function (c) {
      return '<div class="tq-call tq-call-' + esc(c.type) + '"><b>' + esc(c.table) + "</b> " + esc(T[c.type] || c.type) +
        ' <small>' + mins(r.now, c.time) + " " + esc(T.ago) + '</small><button class="button" data-dismiss="' + esc(c.id) + '">' + esc(T.done) + "</button></div>";
    }).join("") : '<p class="description">' + esc(T.nocalls) + "</p>";
    ordersEl.innerHTML = r.orders.length ? r.orders.map(function (o) {
      var late = mins(r.now, o.time) >= 20;
      return '<div class="tq-order' + (late ? " tq-late" : "") + '"><div class="tq-order-head"><b>' + esc(o.table) + "</b><span>#" + esc(o.number) +
        " · " + mins(r.now, o.time) + " " + esc(T.ago) + "</span></div>" +
        (o.name && o.name !== o.table ? '<div class="description">' + esc(o.name) + "</div>" : "") +
        "<ul>" + o.items.map(function (i) { return "<li><b>" + esc(i.qty) + " ×</b> " + esc(i.name) + (i.note ? '<br><em>' + esc(T.note) + ": " + esc(i.note) + "</em>" : "") + "</li>"; }).join("") + "</ul>" +
        (o.note ? '<p class="tq-onote">' + esc(o.note) + "</p>" : "") +
        '<div class="tq-order-foot"><span>' + esc(o.total) + '</span><a href="' + esc(o.editurl) + '">' + esc(T.open) + "</a>" +
        '<button class="button button-primary" data-complete="' + o.id + '">' + esc(T.served) + "</button></div></div>";
    }).join("") : '<p class="description">' + esc(T.none) + "</p>";
    // a sound for anything new since the last refresh
    var ids = r.orders.map(function (o) { return "o" + o.id; }).concat(r.calls.map(function (c) { return "c" + c.id; }));
    if (seen && ids.some(function (id) { return seen.indexOf(id) < 0; })) beep();
    seen = ids;
  }

  function refresh() {
    api("/board").then(function (r) { render(r); document.getElementById("tq-status").textContent = new Date().toLocaleTimeString(); })
      .catch(function () { document.getElementById("tq-status").textContent = T.error; });
  }
  document.addEventListener("click", function (e) {
    var c = e.target.closest("[data-complete]"), d = e.target.closest("[data-dismiss]");
    if (c) { c.disabled = true; api("/board/complete", {id: Number(c.dataset.complete)}).then(refresh, refresh); }
    if (d) { d.disabled = true; api("/board/dismiss", {id: d.dataset.dismiss}).then(refresh, refresh); }
  });
  refresh();
  setInterval(refresh, 10000);
  // @pro-end
})();
