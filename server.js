// A782 DIGITAL — backend. Node.js 18+ керек, басқа ешқандай пакет қажет емес.
// Іске қосу: ADMIN_PIN=1234 node server.js
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "data.json");
const PUBLIC_DIR = path.join(__dirname, "public");
const ADMIN_PIN = process.env.ADMIN_PIN || crypto.randomBytes(3).toString("hex");
const DEMO_PAY = process.env.DEMO_PAY !== "0";
const UA = "A782DIGITAL/2.0 (+https://t.me/Asxm_A782)";
const ICONS = ["gift", "users", "gem", "bolt", "trophy", "shield", "star", "user"];
const AVATAR_ICONS = ["user", "gem", "bolt", "cube", "trophy", "shield", "star"];

console.log("Admin PIN:", ADMIN_PIN, process.env.ADMIN_PIN ? "(ADMIN_PIN арқылы)" : "(кездейсоқ — ADMIN_PIN орнатыңыз)");

const L3 = (kk, ru, en) => ({ kk, ru, en });

function seed() {
  return {
    owner: {
      name: "A782 DIGITAL", handle: "@a782_asxm",
      tiktok: "https://www.tiktok.com/@a782_asxm", telegram: "https://t.me/Asxm_A782",
      kaspi: "", avatar: "", banner: "",
      bio: L3("Minecraft модпактары, шейдерлер, стримдер және дизайн.", "Модпаки Minecraft, шейдеры, стримы и дизайн.", "Minecraft modpacks, shaders, streams and design.")
    },
    stream: {
      live: false,
      title: L3("Minecraft survival — жаңа маусым", "Minecraft survival — новый сезон", "Minecraft survival — new season"),
      nextAt: "2026-11-10T20:00:00+05:00",
      schedule: [
        { day: "Mon", time: "20:00", topic: "Minecraft survival" },
        { day: "Wed", time: "20:00", topic: "Modpack night" },
        { day: "Sat", time: "19:00", topic: "Duo & build battle" }
      ]
    },
    server: { ip: "", version: "1.20.1" },
    wheelCost: 1,
    prizes: [
      { label: L3("+50 токен", "+50 токенов", "+50 tokens"), kind: "tokens", val: 50, weight: 30 },
      { label: L3("+1 билет", "+1 билет", "+1 ticket"), kind: "tickets", val: 1, weight: 30 },
      { label: L3("+100 алмаз", "+100 алмазов", "+100 diamonds"), kind: "diamonds", val: 100, weight: 8 },
      { label: L3("Купон 10%", "Купон 10%", "10% coupon"), kind: "coupon", val: 10, weight: 20 },
      { label: L3("+250 токен", "+250 токенов", "+250 tokens"), kind: "tokens", val: 250, weight: 7 },
      { label: L3("+2 билет", "+2 билета", "+2 tickets"), kind: "tickets", val: 2, weight: 5 }
    ],
    coupons: { A782: 10, WELCOME: 5 },
    giveaways: [
      { id: "g1", icon: "gift", title: L3("100 алмаз (Free Fire)", "100 алмазов (Free Fire)", "100 diamonds (Free Fire)"),
        desc: L3("Жеңімпазға ойын ID-і арқылы беріледі.", "Победитель получит по игровому ID.", "Winner receives by game ID."),
        prize: "100 алмаз", cost: 1, participants: [], winner: null },
      { id: "g2", icon: "users", title: L3("Менімен бірге Minecraft ойнау", "Игра в Minecraft со мной", "Play Minecraft with me"),
        desc: L3("2 сағат жеке серверде бірге ойнау.", "2 часа на приватном сервере вместе.", "2 hours on a private server together."),
        prize: "DUO сессия", cost: 1, participants: [], winner: null }
    ],
    products: [
      { id: "p1", cat: "over", name: L3("Стрим оверлейі", "Оверлей для стрима", "Stream overlay"), desc: L3("Оверлей, панельдер, сахна.", "Оверлей, панели, сцены.", "Overlay, panels, scenes."), price: 4500, type: "Overlay", img: "" },
      { id: "p2", cat: "design", name: L3("Лендинг шаблоны", "Шаблон лендинга", "Landing template"), desc: L3("HTML/CSS бейімделген лендинг.", "Адаптивный лендинг HTML/CSS.", "Responsive HTML/CSS landing."), price: 7900, type: "Template", img: "" },
      { id: "p3", cat: "pack", name: L3("Қыс текстуралары", "Зимние текстуры", "Winter textures"), desc: L3("16x қыс пакі.", "Пак 16x.", "16x winter pack."), price: 1500, type: "Resource pack", img: "" }
    ],
    modpacks: [
      { id: "m1", cat: "rpg", title: "A782 Ultimate RPG & Shaders", version: "1.20.1", loader: "Fabric", mods: 145, sizeMb: 380, downloads: 1420, rating: 4.9, file: "", keyMods: ["Distant Horizons", "Iris", "Better Combat"], desc: L3("Жаңа әлем және шейдерлер.", "Новый мир и шейдеры.", "New world and shaders.") },
      { id: "m2", cat: "pvp", title: "Cyber PvP & FPS Boost", version: "1.20.4", loader: "Fabric", mods: 42, sizeMb: 110, downloads: 3890, rating: 5, file: "", keyMods: ["Sodium", "Entity Culling"], desc: L3("FPS арттыратын топтама.", "Сборка для роста FPS.", "Pack for higher FPS.") }
    ],
    users: [],
    orders: [],
    sessions: {}
  };
}

let db = fs.existsSync(DATA_FILE) ? JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) : seed();
function saveDB() {
  const tmp = DATA_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DATA_FILE);
}
if (!fs.existsSync(DATA_FILE)) saveDB();

const uid = () => crypto.randomBytes(8).toString("hex");
const randCode = () => crypto.randomBytes(3).toString("hex").toUpperCase();
const hashPw = (pw, salt) => crypto.scryptSync(pw, salt, 64).toString("hex");
const str = (v, max = 200) => String(v ?? "").trim().slice(0, max);
const tr = (b, base) => {
  const kk = str(b[base + "_kk"], 300), ru = str(b[base + "_ru"], 300), en = str(b[base + "_en"], 300);
  return { kk: kk || en, ru: ru || kk, en: en || kk };
};
const safeUrl = v => (/^https?:\/\/[^\s]+$/.test(str(v, 500)) ? str(v, 500) : "");
const safeImg = v => {
  const s = str(v, 3000000);
  return /^https?:\/\//.test(s) || /^data:image\/(png|jpe?g|webp|gif);base64,/.test(s) ? s : "";
};
const upsert = (arr, item) => {
  const i = arr.findIndex(x => x.id === item.id);
  if (i >= 0) arr[i] = item; else arr.unshift(item);
};
function fail(status, code) {
  const e = new Error(code); e.status = status; e.code = code; throw e;
}
const pubUser = u => ({
  id: u.id, nick: u.nick, mc: u.mc, ff: u.ff, so2: u.so2, tg: u.tg, bio: u.bio,
  avatar: u.avatar, banner: u.banner, icon: u.icon,
  tickets: u.tickets, tokens: u.tokens, diamonds: u.diamonds, wins: u.wins
});
const pubGw = g => ({
  ...g,
  participants: g.participants.map(p => p.nick),
  winner: g.winner ? { name: g.winner.name, at: g.winner.at } : null
});
const pubData = () => ({
  owner: db.owner, stream: db.stream, server: db.server, wheelCost: db.wheelCost,
  prizes: db.prizes, coupons: db.coupons, demoPay: DEMO_PAY,
  giveaways: db.giveaways.map(pubGw), products: db.products, modpacks: db.modpacks
});

function readBody(req, limit = 64 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on("data", c => {
      size += c.length;
      if (size > limit) { req.destroy(); reject(Object.assign(new Error("too_large"), { status: 413, code: "too_large" })); }
      else chunks.push(c);
    });
    req.on("end", () => {
      if (!size) return resolve({});
      try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8"))); }
      catch { reject(Object.assign(new Error("invalid"), { status: 400, code: "invalid" })); }
    });
    req.on("error", reject);
  });
}
function send(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(body));
}

/* ---------- сессия және админ ---------- */
function userFrom(req) {
  const h = req.headers.authorization || "";
  const tok = h.startsWith("Bearer ") ? h.slice(7) : "";
  const id = tok && db.sessions[tok];
  return id ? db.users.find(u => u.id === id) || null : null;
}
const adminTokens = new Map();
function isAdmin(req) {
  const tok = req.headers["x-admin-token"];
  const exp = tok && adminTokens.get(tok);
  if (exp && exp > Date.now()) return true;
  if (tok) adminTokens.delete(tok);
  return false;
}
const pinHits = new Map();

/* ---------- Modrinth прокси (5 минут кэш) ---------- */
const mcCache = new Map();
async function cached(key, load) {
  const hit = mcCache.get(key);
  if (hit && Date.now() - hit.t < 5 * 60e3) return hit.v;
  const v = await load();
  mcCache.set(key, { t: Date.now(), v });
  return v;
}
async function upstream(url) {
  let r;
  try { r = await fetch(url, { headers: { "User-Agent": UA } }); }
  catch { fail(502, "upstream"); }
  if (!r.ok) fail(502, "upstream");
  return r.json();
}
async function mcSearch(sp) {
  const q = str(sp.get("q"), 80);
  const type = ["mod", "modpack", "resourcepack", "shader"].includes(sp.get("type")) ? sp.get("type") : "mod";
  const loader = ["fabric", "forge", "neoforge", "quilt"].includes(sp.get("loader")) ? sp.get("loader") : "";
  const version = /^[\d.]{3,10}$/.test(sp.get("version") || "") ? sp.get("version") : "";
  const sort = ["downloads", "follows", "newest", "updated"].includes(sp.get("sort")) ? sp.get("sort") : "downloads";
  const facets = [[`project_type:${type}`]];
  if (loader && (type === "mod" || type === "modpack")) facets.push([`categories:${loader}`]);
  if (version) facets.push([`versions:${version}`]);
  const url = `https://api.modrinth.com/v2/search?query=${encodeURIComponent(q)}&facets=${encodeURIComponent(JSON.stringify(facets))}&index=${q ? "relevance" : sort}&limit=20`;
  return cached(url, async () => {
    const d = await upstream(url);
    return { hits: d.hits.map(h => ({
      id: h.project_id, title: h.title, author: h.author, desc: h.description,
      icon: h.icon_url, downloads: h.downloads, license: h.license
    })) };
  });
}
async function mcVersions(id) {
  if (!/^[\w-]{1,64}$/.test(id || "")) fail(400, "invalid");
  const url = `https://api.modrinth.com/v2/project/${id}/version`;
  return cached(url, async () => {
    const vs = await upstream(url);
    return { versions: vs.slice(0, 12).map(v => ({
      name: v.name,
      games: (v.game_versions || []).slice(0, 4),
      loaders: v.loaders || [],
      file: ((v.files || []).find(f => f.primary) || (v.files || [])[0] || {}).url || ""
    })) };
  });
}

/* ---------- маршруттар ---------- */
async function route(req, url, user) {
  const p = url.pathname, m = req.method;
  const need = () => user || fail(401, "login_required");

  if (m === "GET" && p === "/api/data") return [200, pubData()];
  if (m === "GET" && p === "/api/mc/search") return [200, await mcSearch(url.searchParams)];
  if (m === "GET" && p === "/api/mc/versions") return [200, await mcVersions(url.searchParams.get("id"))];

  if (m === "POST" && p === "/api/register") {
    const b = await readBody(req);
    const email = str(b.email, 120).toLowerCase(), pw = String(b.password || ""), nick = str(b.nick, 24);
    if (!/^\S+@\S+\.\S+$/.test(email) || pw.length < 6 || !nick) fail(400, "invalid");
    if (db.users.some(x => x.email === email)) fail(409, "exists");
    const salt = crypto.randomBytes(16).toString("hex");
    const u = { id: uid(), email, salt, pass: hashPw(pw, salt), nick, mc: "", ff: "", so2: "", tg: "", bio: "",
      avatar: "", banner: "", icon: "user", tickets: 3, tokens: 0, diamonds: 0, wins: [], codes: {}, lastDaily: 0 };
    db.users.push(u);
    const token = crypto.randomBytes(32).toString("hex");
    db.sessions[token] = u.id;
    saveDB();
    return [200, { token, user: pubUser(u) }];
  }
  if (m === "POST" && p === "/api/login") {
    const b = await readBody(req);
    const u = db.users.find(x => x.email === str(b.email, 120).toLowerCase());
    if (!u) fail(401, "bad_login");
    const ok = crypto.timingSafeEqual(Buffer.from(hashPw(String(b.password || ""), u.salt), "hex"), Buffer.from(u.pass, "hex"));
    if (!ok) fail(401, "bad_login");
    const token = crypto.randomBytes(32).toString("hex");
    db.sessions[token] = u.id;
    saveDB();
    return [200, { token, user: pubUser(u) }];
  }
  if (m === "POST" && p === "/api/logout") {
    delete db.sessions[(req.headers.authorization || "").slice(7)];
    saveDB();
    return [200, { ok: true }];
  }
  if (m === "GET" && p === "/api/me") return [200, { user: pubUser(need()) }];
  if (m === "PUT" && p === "/api/me") {
    const u = need();
    const b = await readBody(req, 3 * 1024 * 1024);
    u.nick = str(b.nick, 24) || u.nick;
    u.mc = str(b.mc, 32); u.ff = str(b.ff, 32); u.so2 = str(b.so2, 32); u.tg = str(b.tg, 40); u.bio = str(b.bio, 200);
    if (b.avatar !== undefined) u.avatar = b.avatar === "" ? "" : (safeImg(b.avatar) || u.avatar);
    if (b.banner !== undefined) u.banner = b.banner === "" ? "" : (safeImg(b.banner) || u.banner);
    if (AVATAR_ICONS.includes(b.icon)) u.icon = b.icon;
    saveDB();
    return [200, { user: pubUser(u) }];
  }
  if (m === "POST" && p === "/api/me/daily") {
    const u = need();
    if (Date.now() - u.lastDaily < 864e5) fail(429, "daily_done");
    u.lastDaily = Date.now(); u.tickets++;
    saveDB();
    return [200, { user: pubUser(u) }];
  }
  if (m === "POST" && p === "/api/me/exchange") {
    const u = need();
    const b = await readBody(req);
    if (b.kind === "ticket") {
      if (u.tokens < 50) fail(400, "not_enough");
      u.tokens -= 50; u.tickets++;
    } else if (b.kind === "coupon") {
      if (u.tokens < 100) fail(400, "not_enough");
      u.tokens -= 100;
      const code = "EX-" + randCode();
      u.codes[code] = 10;
      u.wins.unshift({ id: uid(), title: { kk: "Купон 10%", ru: "Купон 10%", en: "10% coupon" }, code, date: new Date().toLocaleDateString("en-GB") });
    } else fail(400, "invalid");
    saveDB();
    return [200, { user: pubUser(u) }];
  }
  if (m === "POST" && p === "/api/wheel/spin") {
    const u = need();
    if (u.tickets < db.wheelCost) fail(400, "no_tickets");
    u.tickets -= db.wheelCost;
    const total = db.prizes.reduce((s, x) => s + x.weight, 0);
    let r = crypto.randomInt(total), idx = 0;
    for (let i = 0; i < db.prizes.length; i++) { r -= db.prizes[i].weight; if (r < 0) { idx = i; break; } }
    const pz = db.prizes[idx];
    let code = null;
    if (pz.kind === "tokens") u.tokens += pz.val;
    else if (pz.kind === "tickets") u.tickets += pz.val;
    else if (pz.kind === "diamonds") u.diamonds += pz.val;
    else if (pz.kind === "coupon") { code = "CP-" + randCode(); u.codes[code] = pz.val; }
    u.wins.unshift({ id: uid(), title: pz.label, code: code || "", date: new Date().toLocaleDateString("en-GB") });
    saveDB();
    return [200, { index: idx, prize: pz, code, user: pubUser(u) }];
  }

  const en = p.match(/^\/api\/giveaways\/([\w-]+)\/enter$/);
  if (m === "POST" && en) {
    const u = need();
    const g = db.giveaways.find(x => x.id === en[1]) || fail(404, "not_found");
    if (g.winner) fail(400, "ended");
    if (g.participants.some(x => x.uid === u.id)) fail(409, "already");
    if (u.tickets < g.cost) fail(400, "no_tickets");
    u.tickets -= g.cost;
    g.participants.push({ uid: u.id, nick: u.nick });
    saveDB();
    return [200, { user: pubUser(u) }];
  }

  if (m === "GET" && p === "/api/orders") {
    const u = need();
    return [200, { orders: db.orders.filter(o => o.userId === u.id) }];
  }
  if (m === "POST" && p === "/api/orders") {
    const u = need();
    const b = await readBody(req);
    const lines = []; let sub = 0;
    for (const it of (Array.isArray(b.items) ? b.items : []).slice(0, 30)) {
      const pr = db.products.find(x => x.id === it.id);
      if (!pr) continue;
      const q = Math.min(20, Math.max(1, parseInt(it.qty) || 1));
      lines.push({ id: pr.id, name: pr.name, qty: q, price: pr.price });
      sub += pr.price * q;
    }
    if (!lines.length) fail(400, "empty_cart");
    const code = str(b.coupon, 30).toUpperCase();
    let pct = 0, used = null;
    if (db.coupons[code]) pct = db.coupons[code];
    else if (u.codes[code]) { pct = u.codes[code]; used = code; }
    const disc = Math.round(sub * pct / 100);
    const method = b.method === "demo" && DEMO_PAY ? "demo" : "kaspi";
    const receipt = str(b.receipt, 80);
    if (method === "kaspi" && receipt.length < 3) fail(400, "receipt_required");
    const order = {
      id: "A782-" + randCode(), userId: u.id, nick: u.nick, date: new Date().toISOString(),
      items: lines, subtotal: sub, discount: disc, total: sub - disc,
      method, receipt, status: method === "demo" ? "paid" : "pending"
    };
    if (used) delete u.codes[used];
    db.orders.unshift(order);
    saveDB();
    return [201, order];
  }

  if (m === "POST" && p === "/api/admin/login") {
    const ip = req.socket.remoteAddress;
    const hit = pinHits.get(ip) || { n: 0, t: Date.now() };
    if (Date.now() - hit.t > 15 * 60e3) { hit.n = 0; hit.t = Date.now(); }
    if (hit.n >= 10) fail(429, "too_many");
    const b = await readBody(req);
    const pin = String(b.pin || "");
    const ok = pin.length === ADMIN_PIN.length && crypto.timingSafeEqual(Buffer.from(pin), Buffer.from(ADMIN_PIN));
    if (!ok) { hit.n++; pinHits.set(ip, hit); fail(403, "bad_pin"); }
    const tok = crypto.randomBytes(24).toString("hex");
    adminTokens.set(tok, Date.now() + 12 * 3600e3);
    return [200, { token: tok }];
  }
  if (p.startsWith("/api/admin/")) {
    if (!isAdmin(req)) fail(403, "admin_required");
    return adminRoute(req, m, p);
  }
  return [404, { error: "not_found" }];
}

async function adminRoute(req, m, p) {
  if (m === "PUT" && p === "/api/admin/site") {
    const b = await readBody(req, 3 * 1024 * 1024);
    const o = db.owner, s = db.stream;
    db.owner = {
      ...o,
      name: str(b.name, 60) || o.name,
      handle: str(b.handle, 40) || o.handle,
      tiktok: safeUrl(b.tiktok) || o.tiktok,
      telegram: safeUrl(b.telegram) || o.telegram,
      kaspi: str(b.kaspi, 40),
      avatar: safeImg(b.avatar) || o.avatar,
      banner: safeImg(b.banner) || o.banner,
      bio: tr(b, "bio")
    };
    db.stream = {
      ...s,
      live: !!b.live,
      title: tr(b, "stitle"),
      nextAt: str(b.nextAt, 40) || s.nextAt,
      schedule: str(b.sched, 2000).split("\n").map(x => x.split("|").map(y => y.trim())).filter(a => a[0]).slice(0, 20)
        .map(a => ({ day: (a[0] || "").slice(0, 20), time: (a[1] || "").slice(0, 10), topic: (a[2] || "").slice(0, 80) }))
    };
    db.server = { ip: str(b.ip, 80), version: str(b.version, 20) };
    db.wheelCost = Math.max(1, parseInt(b.wheelCost) || 1);
    saveDB();
    return [200, { ok: true }];
  }
  if (m === "POST" && p === "/api/admin/giveaways") {
    const b = await readBody(req);
    const title = tr(b, "title");
    if (!title.kk) fail(400, "title_required");
    upsert(db.giveaways, {
      id: uid(),
      icon: ICONS.includes(b.icon) ? b.icon : "gift",
      title, desc: tr(b, "desc"),
      prize: str(b.prize, 80),
      cost: Math.max(1, parseInt(b.cost) || 1),
      participants: [], winner: null
    });
    saveDB();
    return [200, { ok: true }];
  }
  if (m === "POST" && p === "/api/admin/products") {
    const b = await readBody(req, 3 * 1024 * 1024);
    const name = tr(b, "name");
    if (!name.kk) fail(400, "title_required");
    upsert(db.products, {
      id: uid(),
      cat: ["pack", "over", "design", "guide"].includes(b.cat) ? b.cat : "pack",
      name, desc: tr(b, "desc"),
      price: Math.max(0, parseInt(b.price) || 0),
      type: str(b.type, 30) || "Digital",
      img: safeImg(b.img)
    });
    saveDB();
    return [200, { ok: true }];
  }
  if (m === "POST" && p === "/api/admin/modpacks") {
    const b = await readBody(req);
    const title = str(b.title, 120);
    if (!title) fail(400, "title_required");
    upsert(db.modpacks, {
      id: uid(),
      cat: ["rpg", "pvp", "tech", "anime", "surv"].includes(b.cat) ? b.cat : "rpg",
      title,
      version: str(b.version, 20) || "1.20.1",
      loader: str(b.loader, 20) || "Fabric",
      mods: parseInt(b.mods) || 0,
      sizeMb: parseInt(b.sizeMb) || 0,
      downloads: 0, rating: 5,
      file: safeUrl(b.file),
      keyMods: str(b.keys, 400).split(",").map(x => x.trim()).filter(Boolean).slice(0, 12),
      desc: tr(b, "desc")
    });
    saveDB();
    return [200, { ok: true }];
  }
  const del = p.match(/^\/api\/admin\/(giveaways|products|modpacks)\/([\w-]+)$/);
  if (m === "DELETE" && del) {
    db[del[1]] = db[del[1]].filter(x => x.id !== del[2]);
    saveDB();
    return [200, { ok: true }];
  }
  const dr = p.match(/^\/api\/admin\/giveaways\/([\w-]+)\/draw$/);
  if (m === "POST" && dr) {
    const g = db.giveaways.find(x => x.id === dr[1]) || fail(404, "not_found");
    if (!g.participants.length) fail(400, "no_participants");
    const w = g.participants[crypto.randomInt(g.participants.length)];
    g.winner = { name: w.nick, at: new Date().toISOString() };
    const wu = db.users.find(u => u.id === w.uid);
    if (wu) wu.wins.unshift({ id: uid(), title: g.title, code: "G-" + randCode(), date: new Date().toLocaleDateString("en-GB") });
    saveDB();
    return [200, { winner: g.winner }];
  }
  const bal = p.match(/^\/api\/admin\/users\/([\w-]+)\/balance$/);
  if (m === "POST" && bal) {
    const b = await readBody(req);
    const u = db.users.find(x => x.id === bal[1]) || fail(404, "not_found");
    if (!["tickets", "tokens", "diamonds"].includes(b.field)) fail(400, "invalid");
    u[b.field] = Math.max(0, u[b.field] + (parseInt(b.delta) || 0));
    saveDB();
    return [200, { ok: true }];
  }
  const ost = p.match(/^\/api\/admin\/orders\/([\w-]+)\/status$/);
  if (m === "POST" && ost) {
    const b = await readBody(req);
    const o = db.orders.find(x => x.id === ost[1]) || fail(404, "not_found");
    if (!["paid", "pending"].includes(b.status)) fail(400, "invalid");
    o.status = b.status;
    saveDB();
    return [200, { ok: true }];
  }
  if (m === "GET" && p === "/api/admin/users") {
    return [200, { users: db.users.map(u => ({ id: u.id, email: u.email, nick: u.nick, tickets: u.tickets, tokens: u.tokens, diamonds: u.diamonds })) }];
  }
  if (m === "GET" && p === "/api/admin/orders") return [200, { orders: db.orders }];
  fail(404, "not_found");
}

/* ---------- статикалық файлдар және сервер ---------- */
const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml", ".ico": "image/x-icon"
};
function serveStatic(pathname, res) {
  const rel = pathname === "/" ? "/index.html" : decodeURIComponent(pathname);
  const full = path.normalize(path.join(PUBLIC_DIR, rel));
  if (!full.startsWith(PUBLIC_DIR)) { res.writeHead(403); return res.end(); }
  fs.readFile(full, (err, buf) => {
    if (err) { res.writeHead(404); return res.end("Not found"); }
    res.writeHead(200, { "Content-Type": MIME[path.extname(full)] || "application/octet-stream", "Cache-Control": "no-cache" });
    res.end(buf);
  });
}

http.createServer(async (req, res) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  const url = new URL(req.url, "http://localhost");
  if (!url.pathname.startsWith("/api/")) return serveStatic(url.pathname, res);
  try {
    const [status, out] = await route(req, url, userFrom(req));
    send(res, status, out);
  } catch (e) {
    const status = e.status || 500;
    if (status === 500) console.error(e);
    send(res, status, { error: status === 500 ? "generic" : (e.code || e.message) });
  }
}).listen(PORT, () => console.log(`A782 DIGITAL: http://localhost:${PORT}`));