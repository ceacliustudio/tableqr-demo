/* Demo data for the screenshots (taken from a real WordPress + WooCommerce test site). Not part of the plugin. */
(function () {
  "use strict";
  function draw(kind, seed) {
    var c = document.createElement("canvas"); c.width = c.height = 600; var g = c.getContext("2d");
    g.fillStyle = {pizza: "#f3e3c9", drink: "#dfeef7", dessert: "#f4e6ef"}[kind]; g.fillRect(0, 0, 600, 600);
    var rnd = function (i) { var x = Math.sin(seed * 999 + i * 77.7) * 10000; return x - Math.floor(x); };
    var i, a, r;
    if (kind === "pizza") {
      g.fillStyle = "#c9873d"; g.beginPath(); g.arc(300, 300, 250, 0, 7); g.fill();
      g.fillStyle = "#c0392b"; g.beginPath(); g.arc(300, 300, 215, 0, 7); g.fill();
      g.fillStyle = "#f6d98b";
      for (i = 0; i < 26; i++) { a = rnd(i) * 6.28; r = rnd(i + 50) * 170; g.beginPath(); g.arc(300 + Math.cos(a) * r, 300 + Math.sin(a) * r, 26 + rnd(i + 9) * 18, 0, 7); g.fill(); }
      g.fillStyle = ["#8e1b1b", "#2e7d32", "#4e342e", "#f5f5f5"][seed % 4];
      for (i = 0; i < 14; i++) { a = rnd(i + 100) * 6.28; r = 40 + rnd(i + 150) * 150; g.beginPath(); g.arc(300 + Math.cos(a) * r, 300 + Math.sin(a) * r, 17, 0, 7); g.fill(); }
    } else if (kind === "drink") {
      g.fillStyle = "#ffffff"; g.globalAlpha = 0.8; g.fillRect(210, 120, 180, 380); g.globalAlpha = 1;
      g.fillStyle = ["#7b1e1e", "#e8b923", "#9fd3ec", "#f2c94c"][seed % 4]; g.fillRect(222, 200, 156, 288);
      g.fillStyle = "rgba(255,255,255,.35)"; g.fillRect(240, 210, 18, 260);
      g.strokeStyle = "#90a4ae"; g.lineWidth = 8; g.strokeRect(210, 120, 180, 380);
    } else {
      g.fillStyle = "#fff"; g.beginPath(); g.ellipse(300, 360, 230, 90, 0, 0, 7); g.fill();
      g.fillStyle = "#6d4c41"; g.fillRect(170, 220, 260, 130); g.fillStyle = "#f3e0c0"; g.fillRect(170, 255, 260, 30); g.fillRect(170, 305, 260, 25);
      g.fillStyle = "#5d4037"; for (i = 0; i < 40; i++) g.fillRect(170 + rnd(i) * 255, 220 + rnd(i + 3) * 10, 4, 4);
    }
    return c.toDataURL("image/png");
  }
  var IMG = [["pizza", 1], ["pizza", 2], ["pizza", 3], ["pizza", 4], ["drink", 0], ["drink", 1], ["drink", 2], ["drink", 3], ["dessert", 0]];
  var NOW = 1794089149;
  var MENU = {"categories": [{"id": 16, "name": "Pizza"}, {"id": 17, "name": "Drinks"}, {"id": 18, "name": "Desserts"}],
    "products": [
      {"id": 21, "name": "Margherita", "desc": "San Marzano tomatoes, fior di latte, basil, olive oil", "image": 0, "cats": [16], "price": 8.5, "instock": true, "options": [{"id": 22, "label": "Small 25 cm", "price": 8.5, "instock": true}, {"id": 23, "label": "Large 32 cm", "price": 12, "instock": true}]},
      {"id": 25, "name": "Diavola", "desc": "Spicy salami, mozzarella, chili oil", "image": 1, "cats": [16], "price": 10.5, "instock": true, "options": [{"id": 26, "label": "Small 25 cm", "price": 10.5, "instock": true}, {"id": 27, "label": "Large 32 cm", "price": 14, "instock": true}]},
      {"id": 29, "name": "Capricciosa", "desc": "Ham, mushrooms, artichokes, olives", "image": 2, "cats": [16], "price": 11, "instock": true, "options": [{"id": 30, "label": "Small 25 cm", "price": 11, "instock": true}, {"id": 31, "label": "Large 32 cm", "price": 14.5, "instock": true}]},
      {"id": 33, "name": "Quattro Formaggi", "desc": "Mozzarella, gorgonzola, parmesan, fontina", "image": 3, "cats": [16], "price": 11.5, "instock": true, "options": [{"id": 34, "label": "Small 25 cm", "price": 11.5, "instock": true}, {"id": 35, "label": "Large 32 cm", "price": 15, "instock": true}]},
      {"id": 37, "name": "Red wine (glass)", "desc": "Montepulciano d'Abruzzo", "image": 4, "cats": [17], "price": 5.5, "instock": true, "options": []},
      {"id": 39, "name": "Craft beer 0.5 l", "desc": "Local amber ale", "image": 5, "cats": [17], "price": 4.9, "instock": true, "options": []},
      {"id": 41, "name": "Sparkling water", "desc": "0.75 l bottle", "image": 6, "cats": [17], "price": 2.5, "instock": false, "options": []},
      {"id": 43, "name": "Homemade lemonade", "desc": "Lemon, mint, honey", "image": 7, "cats": [17], "price": 3.9, "instock": true, "options": []},
      {"id": 45, "name": "Tiramisu", "desc": "Mascarpone, espresso, cocoa", "image": 8, "cats": [18], "price": 5.9, "instock": true, "options": []}],
    "currency": {"symbol": "€", "decimals": 2, "dec": ".", "thousand": ",", "format": "%1$s%2$s"},
    "table": "Table 3", "open": true, "closed_msg": "", "allow_calls": true, "ask_name": false, "allow_notes": true};
  var BOARD = {"orders": [
      {"id": 46, "number": "46", "table": "Table 3", "name": "Table 3", "note": "Birthday - candle on the tiramisu please", "total": "€40.90", "status": "processing", "time": NOW - 24 * 60,
        "items": [{"name": "Margherita - Large 32 cm", "qty": 2, "note": "extra basil"}, {"name": "Red wine (glass)", "qty": 2, "note": ""}, {"name": "Tiramisu", "qty": 1, "note": ""}], "editurl": "#"},
      {"id": 47, "number": "47", "table": "Terrace 1", "name": "Terrace 1", "note": "", "total": "€18.30", "status": "processing", "time": NOW - 9 * 60,
        "items": [{"name": "Diavola - Small 25 cm", "qty": 1, "note": "not too spicy"}, {"name": "Homemade lemonade", "qty": 2, "note": ""}], "editurl": "#"},
      {"id": 48, "number": "48", "table": "Table 5", "name": "Table 5", "note": "", "total": "€19.90", "status": "processing", "time": NOW - 60,
        "items": [{"name": "Quattro Formaggi - Large 32 cm", "qty": 1, "note": ""}, {"name": "Craft beer 0.5 l", "qty": 1, "note": ""}], "editurl": "#"}],
    "calls": [{"id": "a1", "table": "Table 2", "type": "waiter", "time": NOW - 60}, {"id": "a2", "table": "Terrace 2", "type": "bill", "time": NOW - 120}], "now": NOW};

  MENU.products.forEach(function (p) { p.image = draw(IMG[p.image][0], IMG[p.image][1]); });
  window.MOCK = {menu: MENU, board: BOARD};
  // every call to the plugin API is answered with the demo data
  window.fetch = function (url, opt) {
    var body = /\/menu/.test(url) ? MENU : /\/board/.test(url) ? BOARD : /\/order/.test(url) ? {order_id: 49, number: "49", key: "k", total: 35.9}
      : /\/status/.test(url) ? {status: "processing", label: "Being prepared"} : {ok: true};
    return Promise.resolve({ok: true, status: 200, json: function () { return Promise.resolve(body); }});
  };
})();
