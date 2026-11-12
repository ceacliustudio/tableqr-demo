/* Demo data for the screenshots (taken from a real WordPress + WooCommerce test site). Not part of the plugin. */
(function () {
  "use strict";
  // real food photos (Abby's Pizza, used with the owner's permission)
  var NOW = 1794089149;
  var MENU = {"categories": [{"id": 16, "name": "Pizza"}, {"id": 17, "name": "Pasta & salads"}, {"id": 18, "name": "Desserts"}],
    "products": [
      {"id": 21, "name": "Margherita", "desc": "San Marzano tomatoes, fior di latte, basil, olive oil", "image": 0, "cats": [16], "price": 8.5, "instock": true, "options": [{"id": 22, "label": "Small 25 cm", "price": 8.5, "instock": true}, {"id": 23, "label": "Large 32 cm", "price": 12, "instock": true}]},
      {"id": 25, "name": "Diavola", "desc": "Spicy salami, mozzarella, chili", "image": 1, "cats": [16], "price": 10.5, "instock": true, "options": [{"id": 26, "label": "Small 25 cm", "price": 10.5, "instock": true}, {"id": 27, "label": "Large 32 cm", "price": 14, "instock": true}]},
      {"id": 29, "name": "Capricciosa", "desc": "Ham, mushrooms, olives, salami", "image": 2, "cats": [16], "price": 11, "instock": true, "options": [{"id": 30, "label": "Small 25 cm", "price": 11, "instock": true}, {"id": 31, "label": "Large 32 cm", "price": 14.5, "instock": true}]},
      {"id": 33, "name": "Quattro Formaggi", "desc": "Mozzarella, gorgonzola, parmesan, fontina", "image": 3, "cats": [16], "price": 11.5, "instock": true, "options": [{"id": 34, "label": "Small 25 cm", "price": 11.5, "instock": true}, {"id": 35, "label": "Large 32 cm", "price": 15, "instock": true}]},
      {"id": 37, "name": "Napoli", "desc": "Tomato, mozzarella, anchovies, oregano", "image": 4, "cats": [16], "price": 10, "instock": true, "options": [{"id": 38, "label": "Small 25 cm", "price": 10, "instock": true}, {"id": 39, "label": "Large 32 cm", "price": 13.5, "instock": true}]},
      {"id": 41, "name": "Spaghetti Carbonara", "desc": "Guanciale, egg yolk, pecorino, black pepper", "image": 5, "cats": [17], "price": 9.9, "instock": true, "options": []},
      {"id": 43, "name": "Penne Pomodoro e Basilico", "desc": "Tomato sauce, basil, parmesan", "image": 6, "cats": [17], "price": 8.5, "instock": true, "options": []},
      {"id": 45, "name": "Caesar salad", "desc": "Grilled chicken, romaine, croutons, Caesar dressing", "image": 7, "cats": [17], "price": 8.9, "instock": true, "options": []},
      {"id": 47, "name": "Tuna salad", "desc": "Tuna, greens, tomatoes, olives, corn", "image": 8, "cats": [17], "price": 8.9, "instock": false, "options": []},
      {"id": 49, "name": "Tiramisu", "desc": "Mascarpone, espresso, cocoa", "image": 9, "cats": [18], "price": 5.9, "instock": true, "options": []},
      {"id": 51, "name": "Lava cake with ice cream", "desc": "Warm chocolate cake, vanilla ice cream", "image": 10, "cats": [18], "price": 6.5, "instock": true, "options": []}],
    "currency": {"symbol": "€", "decimals": 2, "dec": ".", "thousand": ",", "format": "%1$s%2$s"},
    "table": "Table 3", "open": true, "closed_msg": "", "allow_calls": !/[?&]lite=1/.test(location.search), "ask_name": false, "allow_notes": true};
  var BOARD = {"orders": [
      {"id": 46, "number": "46", "table": "Table 3", "name": "Table 3", "note": "Birthday - candle on the tiramisu please", "total": "€39.80", "status": "processing", "time": NOW - 24 * 60,
        "items": [{"name": "Margherita - Large 32 cm", "qty": 2, "note": "extra basil"}, {"name": "Spaghetti Carbonara", "qty": 1, "note": ""}, {"name": "Tiramisu", "qty": 1, "note": ""}], "editurl": "#"},
      {"id": 47, "number": "47", "table": "Terrace 1", "name": "Terrace 1", "note": "", "total": "€19.40", "status": "processing", "time": NOW - 9 * 60,
        "items": [{"name": "Diavola - Small 25 cm", "qty": 1, "note": "not too spicy"}, {"name": "Caesar salad", "qty": 1, "note": "dressing on the side"}], "editurl": "#"},
      {"id": 48, "number": "48", "table": "Table 5", "name": "Table 5", "note": "", "total": "€21.50", "status": "processing", "time": NOW - 60,
        "items": [{"name": "Quattro Formaggi - Large 32 cm", "qty": 1, "note": ""}, {"name": "Lava cake with ice cream", "qty": 1, "note": ""}], "editurl": "#"}],
    "calls": [{"id": "a1", "table": "Table 2", "type": "waiter", "time": NOW - 60}, {"id": "a2", "table": "Terrace 2", "type": "bill", "time": NOW - 120}], "now": NOW};

  MENU.products.forEach(function (p) { p.image = "img/" + p.image + ".jpg"; });
  window.MOCK = {menu: MENU, board: BOARD};
  // every call to the plugin API is answered with the demo data
  window.fetch = function (url, opt) {
    var body = /\/menu/.test(url) ? MENU : /\/board/.test(url) ? BOARD : /\/order/.test(url) ? {order_id: 49, number: "49", key: "k", total: 35.9}
      : /\/status/.test(url) ? {status: "processing", label: "Being prepared"} : {ok: true};
    return Promise.resolve({ok: true, status: 200, json: function () { return Promise.resolve(body); }});
  };
})();
