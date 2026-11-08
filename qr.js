/*!
 * TableQR – small QR Code generator (byte mode, error correction level M, versions 1–10).
 * Written for this plugin, no external service is called. MIT License.
 * Usage: TableQR.svg("https://example.com/?tableqr=abc", 4) -> SVG markup string.
 */
(function (root) {
  "use strict";

  // Error correction level M: [ec codewords per block, [blocks, data codewords per block], ...]
  var BLOCKS = [null,
    [10, [1, 16]], [16, [1, 28]], [26, [1, 44]], [18, [2, 32]], [24, [2, 43]],
    [16, [4, 27]], [18, [4, 31]], [22, [2, 38], [2, 39]], [22, [3, 36], [2, 37]], [26, [4, 43], [1, 44]]];
  var ALIGN = [null, [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]];

  // ---------- Galois field GF(256), polynomial 0x11D
  var EXP = new Array(512), LOG = new Array(256);
  (function () {
    var x = 1;
    for (var i = 0; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 0x100) x ^= 0x11D; }
    for (i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
  })();
  function gmul(a, b) { return a && b ? EXP[LOG[a] + LOG[b]] : 0; }

  function rsGenerator(n) {
    var g = [1];
    for (var i = 0; i < n; i++) {
      var next = new Array(g.length + 1).fill(0);
      for (var j = 0; j < g.length; j++) { next[j] ^= g[j]; next[j + 1] ^= gmul(g[j], EXP[i]); }
      g = next;
    }
    return g; // g[0] = 1 (highest degree first)
  }
  function rsRemainder(data, n) {
    var gen = rsGenerator(n), res = data.concat(new Array(n).fill(0));
    for (var i = 0; i < data.length; i++) {
      var c = res[i];
      if (c) for (var j = 0; j < gen.length; j++) res[i + j] ^= gmul(gen[j], c);
    }
    return res.slice(data.length);
  }

  function utf8(s) {
    var out = [], b = unescape(encodeURIComponent(s));
    for (var i = 0; i < b.length; i++) out.push(b.charCodeAt(i));
    return out;
  }
  function dataCapacity(v) {
    var spec = BLOCKS[v], n = 0;
    for (var i = 1; i < spec.length; i++) n += spec[i][0] * spec[i][1];
    return n;
  }

  function encode(text) {
    var bytes = utf8(text), v;
    for (v = 1; v <= 10; v++) {
      var lenBits = v < 10 ? 8 : 16;
      if (4 + lenBits + bytes.length * 8 <= dataCapacity(v) * 8) break;
    }
    if (v > 10) throw new Error("Text too long for QR");
    var cap = dataCapacity(v), bits = [];
    function put(val, len) { for (var i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1); }
    put(4, 4);                                   // byte mode
    put(bytes.length, v < 10 ? 8 : 16);
    bytes.forEach(function (b) { put(b, 8); });
    put(0, Math.min(4, cap * 8 - bits.length));  // terminator
    while (bits.length % 8) bits.push(0);
    var data = [];
    for (var i = 0; i < bits.length; i += 8) {
      var b = 0;
      for (var j = 0; j < 8; j++) b = (b << 1) | bits[i + j];
      data.push(b);
    }
    for (var pad = 0; data.length < cap; pad ^= 1) data.push(pad ? 0x11 : 0xEC);

    // split into blocks, add error correction, interleave
    var spec = BLOCKS[v], ecLen = spec[0], blocks = [], pos = 0;
    for (i = 1; i < spec.length; i++)
      for (var k = 0; k < spec[i][0]; k++) { var d = data.slice(pos, pos + spec[i][1]); pos += spec[i][1]; blocks.push({d: d, e: rsRemainder(d, ecLen)}); }
    var out = [], maxD = Math.max.apply(null, blocks.map(function (x) { return x.d.length; }));
    for (i = 0; i < maxD; i++) blocks.forEach(function (x) { if (i < x.d.length) out.push(x.d[i]); });
    for (i = 0; i < ecLen; i++) blocks.forEach(function (x) { out.push(x.e[i]); });
    return {version: v, codewords: out};
  }

  function build(text) {
    var enc = encode(text), v = enc.version, size = v * 4 + 17;
    var m = [], fn = [];
    for (var r = 0; r < size; r++) { m.push(new Array(size).fill(0)); fn.push(new Array(size).fill(false)); }
    function set(x, y, dark) { m[y][x] = dark ? 1 : 0; fn[y][x] = true; }

    function finder(cx, cy) {
      for (var dy = -4; dy <= 4; dy++) for (var dx = -4; dx <= 4; dx++) {
        var x = cx + dx, y = cy + dy, d = Math.max(Math.abs(dx), Math.abs(dy));
        if (x >= 0 && x < size && y >= 0 && y < size) set(x, y, d !== 2 && d !== 4);
      }
    }
    finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
    for (var i = 8; i < size - 8; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }  // timing
    var al = ALIGN[v];
    for (var a = 0; a < al.length; a++) for (var b = 0; b < al.length; b++) {
      if ((a === 0 && b === 0) || (a === 0 && b === al.length - 1) || (a === al.length - 1 && b === 0)) continue;
      for (var dy2 = -2; dy2 <= 2; dy2++) for (var dx2 = -2; dx2 <= 2; dx2++)
        set(al[a] + dx2, al[b] + dy2, Math.max(Math.abs(dx2), Math.abs(dy2)) !== 1);
    }
    function drawFormat(mask) {
      var data = (0 << 3) | mask, rem = data;            // level M = 00
      for (var i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
      var bits = ((data << 10) | rem) ^ 0x5412;
      var bit = function (i) { return ((bits >>> i) & 1) === 1; };
      for (i = 0; i <= 5; i++) set(8, i, bit(i));
      set(8, 7, bit(6)); set(8, 8, bit(7)); set(7, 8, bit(8));
      for (i = 9; i < 15; i++) set(14 - i, 8, bit(i));
      for (i = 0; i < 8; i++) set(size - 1 - i, 8, bit(i));
      for (i = 8; i < 15; i++) set(8, size - 15 + i, bit(i));
      set(8, size - 8, true);                            // dark module
    }
    drawFormat(0);  // reserve
    if (v >= 7) {
      var rem = v;
      for (i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25);
      var vb = (v << 12) | rem;
      for (i = 0; i < 18; i++) {
        var dark = ((vb >>> i) & 1) === 1, p = size - 11 + (i % 3), q = Math.floor(i / 3);
        set(p, q, dark); set(q, p, dark);
      }
    }

    // place data bits in the zigzag order
    var cw = enc.codewords, bi = 0;
    for (var right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (var vert = 0; vert < size; vert++) for (var j = 0; j < 2; j++) {
        var x = right - j, upward = ((right + 1) & 2) === 0, y = upward ? size - 1 - vert : vert;
        if (!fn[y][x]) {
          if (bi < cw.length * 8) m[y][x] = (cw[bi >>> 3] >>> (7 - (bi & 7))) & 1;
          bi++;
        }
      }
    }

    var MASKS = [
      function (x, y) { return (x + y) % 2 === 0; }, function (x, y) { return y % 2 === 0; },
      function (x) { return x % 3 === 0; }, function (x, y) { return (x + y) % 3 === 0; },
      function (x, y) { return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; },
      function (x, y) { return (x * y) % 2 + (x * y) % 3 === 0; },
      function (x, y) { return ((x * y) % 2 + (x * y) % 3) % 2 === 0; },
      function (x, y) { return ((x + y) % 2 + (x * y) % 3) % 2 === 0; }];
    function applyMask(k) {
      for (var y = 0; y < size; y++) for (var x = 0; x < size; x++) if (!fn[y][x] && MASKS[k](x, y)) m[y][x] ^= 1;
    }
    function penalty() {
      var p = 0, x, y, run, dark = 0;
      for (var pass = 0; pass < 2; pass++) for (y = 0; y < size; y++) {
        run = 1;
        for (x = 1; x <= size; x++) {
          var same = x < size && (pass ? m[x][y] === m[x - 1][y] : m[y][x] === m[y][x - 1]);
          if (same) run++; else { if (run >= 5) p += run - 2; run = 1; }
        }
      }
      for (y = 0; y < size - 1; y++) for (x = 0; x < size - 1; x++) {
        var c = m[y][x];
        if (c === m[y][x + 1] && c === m[y + 1][x] && c === m[y + 1][x + 1]) p += 3;
      }
      var pat1 = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0], pat2 = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1];
      for (y = 0; y < size; y++) for (x = 0; x + 11 <= size; x++) {
        var h1 = true, h2 = true, v1 = true, v2 = true;
        for (var k = 0; k < 11; k++) {
          if (m[y][x + k] !== pat1[k]) h1 = false; if (m[y][x + k] !== pat2[k]) h2 = false;
          if (m[x + k][y] !== pat1[k]) v1 = false; if (m[x + k][y] !== pat2[k]) v2 = false;
        }
        p += 40 * (h1 + h2 + v1 + v2);
      }
      for (y = 0; y < size; y++) for (x = 0; x < size; x++) dark += m[y][x];
      p += Math.floor(Math.abs(dark * 20 - size * size * 10) / (size * size)) * 10;
      return p;
    }
    var best = 0, bestP = Infinity;
    for (var k = 0; k < 8; k++) {
      applyMask(k); drawFormat(k);
      var pk = penalty();
      if (pk < bestP) { bestP = pk; best = k; }
      applyMask(k);
    }
    applyMask(best); drawFormat(best);
    return m;
  }

  function svg(text, quiet) {
    var m = build(text), n = m.length, q = quiet == null ? 4 : quiet, d = "";
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) if (m[y][x]) d += "M" + (x + q) + " " + (y + q) + "h1v1h-1z";
    var s = n + 2 * q;
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + s + " " + s + '" shape-rendering="crispEdges">' +
      '<rect width="100%" height="100%" fill="#fff"/><path d="' + d + '" fill="#000"/></svg>';
  }

  root.TableQR = {matrix: build, svg: svg};
})(typeof window !== "undefined" ? window : this);
