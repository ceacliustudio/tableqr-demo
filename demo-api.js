/* TableQR live demo – answers the plugin API in the browser (no WordPress needed).
   Orders and calls are kept in this browser (localStorage), so an order sent from the guest page
   appears on the staff board of the same demo. */
(function () {
  "use strict";
  var M = window.MOCK || {}, MENU = M.menu, BASE = M.board;
  var K = {orders: "tqdemo_orders", calls: "tqdemo_calls", done: "tqdemo_done", seq: "tqdemo_seq"};
  function get(k, d) { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } }
  function put(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function now() { return Math.floor(Date.now() / 1000); }
  function money(n) { return "€" + Number(n).toFixed(2); }
  function product(id) { return MENU.products.filter(function (p) { return p.id === id; })[0]; }
  // the sample orders keep their age ("24 min ago") whenever the demo is opened
  var start = get("tqdemo_start", 0);
  if (!start) { start = now(); put("tqdemo_start", start); }
  var shift = now() - BASE.now;

  function board() {
    var done = get(K.done, []);
    var orders = BASE.orders.map(function (o) { var c = JSON.parse(JSON.stringify(o)); c.time = o.time + shift; return c; })
      .concat(get(K.orders, [])).filter(function (o) { return done.indexOf(String(o.id)) < 0; });
    var calls = BASE.calls.map(function (c) { return {id: c.id, table: c.table, type: c.type, time: c.time + shift}; })
      .concat(get(K.calls, [])).filter(function (c) { return done.indexOf("c" + c.id) < 0; });
    return {orders: orders, calls: calls, now: now()};
  }

  function order(body) {
    var items = [], total = 0;
    (body.items || []).forEach(function (it) {
      var p = product(it.product_id); if (!p) return;
      var opt = p.options.filter(function (o) { return o.id === it.variation_id; })[0];
      var price = opt ? opt.price : p.price;
      total += price * it.qty;
      items.push({name: p.name + (opt && p.options.length > 1 ? " - " + opt.label : ""), qty: it.qty, note: it.note || ""});
    });
    if (!items.length) throw new Error("Your order is empty.");
    var seq = get(K.seq, 48) + 1; put(K.seq, seq);
    var o = {id: seq, number: String(seq), table: MENU.table, name: MENU.table, note: body.note || "", total: money(total),
      status: "processing", time: now(), items: items, editurl: "#"};
    var list = get(K.orders, []); list.push(o); put(K.orders, list);
    return {order_id: seq, number: String(seq), key: "demo", total: Math.round(total * 100) / 100};
  }

  window.fetch = function (url, opt) {
    var body = {};
    try { body = opt && opt.body ? JSON.parse(opt.body) : {}; } catch (e) {}
    var res, status = 200;
    try {
      if (/\/board\/complete/.test(url)) { var d = get(K.done, []); d.push(String(body.id)); put(K.done, d); res = {ok: true}; }
      else if (/\/board\/dismiss/.test(url)) { var d2 = get(K.done, []); d2.push("c" + body.id); put(K.done, d2); res = {ok: true}; }
      else if (/\/board/.test(url)) res = board();
      else if (/\/menu/.test(url)) res = MENU;
      else if (/\/order/.test(url)) res = order(body);
      else if (/\/status/.test(url)) {
        var id = (url.match(/[?&]o=(\d+)/) || [])[1];
        var T = (window.TableQRConfig && window.TableQRConfig.i18n) || {};
        res = get(K.done, []).indexOf(String(id)) >= 0 ? {status: "completed", label: T.st_completed || "Served"}
          : {status: "processing", label: T.st_processing || "Being prepared"};
      }
      else if (/\/call/.test(url)) {
        var calls = get(K.calls, []);
        if (!calls.some(function (c) { return c.type === body.type && get(K.done, []).indexOf("c" + c.id) < 0; }))
          calls.push({id: "d" + Date.now(), table: MENU.table, type: body.type, time: now()});
        put(K.calls, calls); res = {ok: true};
      }
      else res = {ok: true};
    } catch (e) { status = 400; res = {message: e.message}; }
    return Promise.resolve({ok: status === 200, status: status, json: function () { return Promise.resolve(res); }});
  };

  window.TableQRDemoReset = function () {
    Object.keys(K).forEach(function (k) { try { localStorage.removeItem(K[k]); } catch (e) {} });
    try { Object.keys(localStorage).forEach(function (k) { if (/^tableqr_/.test(k)) localStorage.removeItem(k); }); } catch (e) {}
  };
})();
