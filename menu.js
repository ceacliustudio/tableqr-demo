/* TableQR – guest menu: browse, add to order, send, follow the status, call the waiter. */
(function () {
  "use strict";
  var C = window.TableQRConfig || {}, T = C.i18n || {}, app = document.getElementById("tq-app");
  var M = null, cat = 0, query = "", cart = [], KEY = "tableqr_" + (C.token || "").slice(0, 8);

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]; }); }
  function fold(s) { return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); }
  function money(n) {
    var c = M ? M.currency : {decimals: 2, dec: ".", thousand: ",", symbol: "", format: "%1$s%2$s"};
    var p = Number(n).toFixed(c.decimals).split(".");
    var s = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, c.thousand) + (p[1] ? c.dec + p[1] : "");
    return c.format.replace("%1$s", c.symbol).replace("%2$s", s).replace(/&nbsp;/g, " ");
  }
  function load(k, d) { try { return JSON.parse(localStorage.getItem(KEY + k)) || d; } catch (e) { return d; } }
  function store(k, v) { try { localStorage.setItem(KEY + k, JSON.stringify(v)); } catch (e) {} }
  function toast(msg) {
    var t = document.createElement("div"); t.className = "tq-toast"; t.textContent = msg; document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 3000);
  }
  function api(path, body) {
    var opt = body ? {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(body)} : {};
    var url = C.api + path + (body ? "" : (path.indexOf("?") < 0 ? "?" : "&") + "t=" + encodeURIComponent(C.token));
    return fetch(url, opt).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) throw new Error(j.message || T.error);
        return j;
      });
    });
  }
  function message(title, text) {
    app.innerHTML = '<div class="tq-msg"><h2>' + esc(title) + "</h2><p>" + esc(text || "") + "</p></div>";
  }

  // ------------------------------------------------------------ menu
  function product(id) { for (var i = 0; i < M.products.length; i++) if (M.products[i].id === id) return M.products[i]; return null; }
  function draw() {
    var q = fold(query), list = M.products.filter(function (p) {
      return (!cat || p.cats.indexOf(cat) >= 0) && (!q || fold(p.name + " " + p.desc).indexOf(q) >= 0);
    });
    var calls = M.allow_calls ? '<div class="tq-actions"><button data-call="waiter">🙋 ' + esc(T.waiter) + '</button><button data-call="bill">🧾 ' + esc(T.bill) + "</button></div>" : "";
    var mine = load("orders", []);
    app.innerHTML = calls + (mine.length ? '<div class="tq-mine" id="tq-mine"><b>' + esc(T.my_orders) + "</b>" +
        mine.map(function (o) { return '<div><span>#' + esc(o.number) + " · " + money(o.total) + '</span><span data-st="' + o.id + '">' + esc(o.label || "") + "</span></div>"; }).join("") + "</div>" : "") +
      (M.open ? "" : '<div class="tq-msg">' + esc(M.closed_msg) + "</div>") +
      '<input class="tq-search" id="tq-q" type="search" placeholder="' + esc(T.search) + '" value="' + esc(query) + '">' +
      '<nav class="tq-cats"><button data-cat="0" class="' + (cat ? "" : "on") + '">' + esc(T.all) + "</button>" +
      M.categories.map(function (c) { return '<button data-cat="' + c.id + '" class="' + (cat === c.id ? "on" : "") + '">' + esc(c.name) + "</button>"; }).join("") + "</nav>" +
      '<div class="tq-list">' + list.map(function (p) {
        return '<button class="tq-item" data-p="' + p.id + '"' + (p.instock && M.open ? "" : " disabled") + ">" +
          (p.image ? '<img src="' + esc(p.image) + '" alt="" loading="lazy">' : "") +
          '<span class="tq-info"><b>' + esc(p.name) + "</b>" + (p.desc ? "<small>" + esc(p.desc) + "</small>" : "") +
          '<span class="tq-price">' + (p.options.length > 1 ? "≥ " : "") + money(p.price) + (p.instock ? "" : " · " + esc(T.out)) + "</span></span>" +
          (p.instock && M.open ? '<span class="tq-plus">+</span>' : "") + "</button>";
      }).join("") + "</div>";
    drawBar();
    var qi = document.getElementById("tq-q");
    qi.oninput = function () { query = qi.value; var pos = qi.selectionStart; draw(); var n = document.getElementById("tq-q"); n.focus(); n.setSelectionRange(pos, pos); };
    refreshStatuses();
  }
  function drawBar() {
    var bar = document.getElementById("tq-bar");
    if (!bar) { bar = document.createElement("div"); bar.id = "tq-bar"; bar.className = "tq-bar"; document.body.appendChild(bar); }
    var n = cart.reduce(function (s, l) { return s + l.qty; }, 0), sum = cart.reduce(function (s, l) { return s + l.qty * l.price; }, 0);
    bar.style.display = n && M.open ? "" : "none";
    bar.innerHTML = '<button id="tq-open-cart"><span class="tq-count">' + n + "</span><span>" + esc(T.cart) + "</span><span>" + money(sum) + "</span></button>";
  }
  function saveCart() { store("cart", cart); drawBar(); }

  function sheet(html) {
    var s = document.createElement("div"); s.className = "tq-sheet"; s.innerHTML = "<div>" + html + "</div>";
    s.addEventListener("click", function (e) { if (e.target === s) s.remove(); });
    document.body.appendChild(s); return s;
  }

  function productSheet(p) {
    var opt = p.options.length === 1 ? p.options[0] : null, qty = 1;
    var s = sheet((p.image ? '<img class="tq-big" src="' + esc(p.image) + '" alt="">' : "") + "<h3>" + esc(p.name) + "</h3>" +
      (p.desc ? '<p style="color:var(--tq-muted);margin-top:0">' + esc(p.desc) + "</p>" : "") +
      (p.options.length > 1 ? "<div>" + p.options.map(function (o) {
        return '<button class="tq-opt" data-o="' + o.id + '"' + (o.instock ? "" : " disabled") + "><span>" + esc(o.label) + "</span><b>" + money(o.price) + (o.instock ? "" : " · " + esc(T.out)) + "</b></button>";
      }).join("") + "</div>" : "") +
      (M.allow_notes ? '<div class="tq-field"><input id="tq-inote" maxlength="200" placeholder="' + esc(T.item_note) + '"></div>' : "") +
      '<div class="tq-qty"><button data-q="-1">−</button><span id="tq-n">1</span><button data-q="1">+</button></div>' +
      '<button class="tq-main" id="tq-addit"></button><button class="tq-ghost" data-x>' + esc(T.close) + "</button>");
    function label() {
      var price = opt ? opt.price : (p.options.length ? null : p.price), b = s.querySelector("#tq-addit");
      b.disabled = price === null;
      b.textContent = price === null ? T.choose : T.add + " · " + money(price * qty);
    }
    label();
    s.addEventListener("click", function (e) {
      var o = e.target.closest("[data-o]"), q = e.target.closest("[data-q]");
      if (o) { opt = p.options.filter(function (x) { return String(x.id) === o.dataset.o; })[0]; s.querySelectorAll(".tq-opt").forEach(function (b) { b.classList.toggle("on", b === o); }); label(); }
      if (q) { qty = Math.max(1, Math.min(50, qty + Number(q.dataset.q))); s.querySelector("#tq-n").textContent = qty; label(); }
      if (e.target.closest("[data-x]")) s.remove();
      if (e.target.closest("#tq-addit") && !e.target.closest("#tq-addit").disabled) {
        var note = s.querySelector("#tq-inote") ? s.querySelector("#tq-inote").value.trim() : "";
        var line = {product_id: p.id, variation_id: opt && p.options.length ? opt.id : 0, name: p.name, option: opt && p.options.length > 1 ? opt.label : "",
          price: opt ? opt.price : p.price, qty: qty, note: note};
        var same = cart.filter(function (l) { return l.product_id === line.product_id && l.variation_id === line.variation_id && l.note === line.note; })[0];
        if (same) same.qty += qty; else cart.push(line);
        saveCart(); s.remove();
      }
    });
  }

  function cartSheet() {
    var s = sheet("");
    function render() {
      var sum = cart.reduce(function (t, l) { return t + l.qty * l.price; }, 0);
      s.firstChild.innerHTML = "<h3>" + esc(T.cart) + " · " + esc(M.table) + "</h3>" +
        (cart.length ? cart.map(function (l, i) {
          return '<div class="tq-line"><div class="tq-info"><b>' + esc(l.name) + "</b>" + (l.option ? "<small>" + esc(l.option) + "</small>" : "") +
            (l.note ? "<small>📝 " + esc(l.note) + "</small>" : "") + "<small>" + money(l.price * l.qty) + "</small></div>" +
            '<div class="tq-qty"><button data-d="' + i + '">−</button><span>' + l.qty + '</span><button data-i="' + i + '">+</button></div></div>';
        }).join("") : "<p>" + esc(T.empty) + "</p>") +
        '<div class="tq-sum"><span>' + esc(T.total) + "</span><span>" + money(sum) + "</span></div>" +
        (M.ask_name ? '<div class="tq-field"><label>' + esc(T.name) + '</label><input id="tq-name" maxlength="60" value="' + esc(load("name", "")) + '"></div>' : "") +
        (M.allow_notes ? '<div class="tq-field"><label>' + esc(T.note) + '</label><textarea id="tq-note" rows="2" maxlength="500"></textarea></div>' : "") +
        '<p style="color:var(--tq-muted);font-size:14px">' + esc(T.pay) + "</p>" +
        '<button class="tq-main" id="tq-send"' + (cart.length ? "" : " disabled") + ">" + esc(T.send) + '</button><button class="tq-ghost" data-x>' + esc(T.close) + "</button>";
    }
    render();
    s.addEventListener("click", function (e) {
      var d = e.target.closest("[data-d]"), inc = e.target.closest("[data-i]");
      if (d) { var l = cart[Number(d.dataset.d)]; l.qty--; if (l.qty < 1) cart.splice(Number(d.dataset.d), 1); saveCart(); render(); }
      if (inc) { cart[Number(inc.dataset.i)].qty = Math.min(50, cart[Number(inc.dataset.i)].qty + 1); saveCart(); render(); }
      if (e.target.closest("[data-x]")) s.remove();
      var send = e.target.closest("#tq-send");
      if (send && !send.disabled) {
        if (M.ask_name && !s.querySelector("#tq-name").value.trim()) { s.querySelector("#tq-name").focus(); return; }
        send.disabled = true; send.textContent = T.sending;
        var name = M.ask_name ? s.querySelector("#tq-name").value.trim() : "";
        if (name) store("name", name);
        api("/order", {t: C.token, name: name, note: s.querySelector("#tq-note") ? s.querySelector("#tq-note").value : "",
          items: cart.map(function (l) { return {product_id: l.product_id, variation_id: l.variation_id, qty: l.qty, note: l.note}; })})
          .then(function (r) {
            var mine = load("orders", []);
            mine.unshift({id: r.order_id, key: r.key, number: r.number, total: r.total, label: ""});
            store("orders", mine.slice(0, 10));
            cart = []; saveCart(); s.remove(); done(r);
          })
          .catch(function (err) { toast(err.message); send.disabled = false; send.textContent = T.send; });
      }
    });
  }

  function done(r) {
    var bar = document.getElementById("tq-bar"); if (bar) bar.style.display = "none";
    app.innerHTML = '<div class="tq-msg"><div class="tq-ok">✔</div><h2>' + esc(T.sent) + "</h2><p>" + esc(T.number) + ": <b>#" + esc(r.number) + "</b></p>" +
      "<p>" + esc(T.status) + ': <span class="tq-badge" data-st="' + r.order_id + '">…</span></p><p>' + esc(T.pay) + "</p>" +
      '<button class="tq-main" id="tq-again">' + esc(T.again) + "</button></div>";
    document.getElementById("tq-again").onclick = draw;
    refreshStatuses();
  }

  function refreshStatuses() {
    load("orders", []).slice(0, 5).forEach(function (o) {
      api("/status?o=" + o.id + "&k=" + encodeURIComponent(o.key)).then(function (r) {
        var mine = load("orders", []);
        mine.forEach(function (x) { if (x.id === o.id) x.label = r.label; });
        store("orders", mine);
        document.querySelectorAll('[data-st="' + o.id + '"]').forEach(function (el) { el.textContent = r.label; });
      }).catch(function () {});
    });
  }

  document.addEventListener("click", function (e) {
    if (!M) return;
    var c = e.target.closest("[data-cat]"), p = e.target.closest("[data-p]"), call = e.target.closest("[data-call]");
    if (c) { cat = Number(c.dataset.cat); draw(); }
    if (p && !p.disabled) productSheet(product(Number(p.dataset.p)));
    if (e.target.closest("#tq-open-cart")) cartSheet();
    if (call) {
      call.disabled = true;
      api("/call", {t: C.token, type: call.dataset.call}).then(function () { toast(T.called); })
        .catch(function (err) { toast(err.message); }).then(function () { setTimeout(function () { call.disabled = false; }, 30000); });
    }
  });

  if (!C.token) { message("⚠", T.invalid); return; }
  cart = load("cart", []);
  api("/menu").then(function (m) {
    M = m;
    document.getElementById("tq-table").textContent = m.table;
    // drop cart lines whose product disappeared from the menu
    cart = cart.filter(function (l) { return product(l.product_id); });
    draw();
    setInterval(refreshStatuses, 30000);
  }).catch(function (err) { message("⚠", err.message); });
})();
