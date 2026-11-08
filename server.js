// A782 DIGITAL — backend v3. Node.js 18+, басқа пакет қажет емес.
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "data.json");
const PUBLIC_DIR = path.join(__dirname, "public");
const ADMIN_PIN = process.env.ADMIN_PIN || crypto.randomBytes(3).toString("hex");
const DEMO_PAY = process.env.DEMO_PAY !== "0";
const JB_ID = process.env.JSONBIN_ID, JB_KEY = process.env.JSONBIN_KEY;
const REMOTE = !!(JB_ID && JB_KEY);
const UA = "A782DIGITAL/3.0 (+https://t.me/Asxm_A782)";
const ICONS = ["gift", "users", "gem", "bolt", "trophy", "shield", "star", "swords", "cube", "flame", "gamepad"];
const AVATARS = ["user", "gem", "bolt", "cube", "trophy", "shield", "star", "swords"];
const P_CATS = ["pack", "over", "design", "guide"];
const M_CATS = ["rpg", "pvp", "tech", "anime", "surv"];

console.log("Деректер:", REMOTE ? "JSONBin" : "data.json");

const L3 = (kk, ru, en) => ({ kk, ru, en });
const VIP_TIERS = ["VIP-FREE", "VIP-PLUS", "VIP-PRO", "VIP-ULTRA"];
const VIP_META = {
 "VIP-FREE": { icon:"sparkles", color:"#8be9fd", perks: L3("ULTRA-ның 7 күндік толық дизайны|ULTRA рамкасы мен жарқылы|Бір аккаунтқа бір рет", "7 дней полного дизайна ULTRA|Рамка и сияние ULTRA|Один раз на аккаунт", "7 days of full ULTRA visuals|ULTRA frame and effects|Once per account") },
 "VIP-PLUS": { icon:"star", color:"#48d5ff", perks: L3("Көгілдір VIP белгі|Жарқыраған аватар жақтауы|Профильдің ерекше түсі", "Голубой VIP-значок|Светящаяся рамка|Цветной профиль", "Cyan VIP badge|Glowing avatar frame|Custom profile color") },
 "VIP-PRO": { icon:"gem", color:"#b18cff", perks: L3("PLUS мүмкіндіктері|Күлгін голографиялық жақтау|Қозғалатын профиль фоны", "Возможности PLUS|Фиолетовая голографическая рамка|Анимированный фон", "Everything in PLUS|Purple holographic frame|Animated profile background") },
 "VIP-ULTRA": { icon:"crown", color:"#ffc76d", perks: L3("PRO мүмкіндіктері|Алтын ULTRA аурасы|Профильдегі ерекше бөлшектер", "Возможности PRO|Золотая аура ULTRA|Особые частицы профиля", "Everything in PRO|Golden ULTRA aura|Premium profile particles") }
};
const tierOf = (plan) => VIP_TIERS.includes(plan?.tier) ? plan.tier : VIP_TIERS.includes(plan?.name?.toUpperCase()) ? plan.name.toUpperCase() : "VIP-PLUS";
const vipPublicPlan = p => ({...p, tier:tierOf(p), ...VIP_META[tierOf(p)]});


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
        { day: 0, time: "20:00", topic: L3("Minecraft survival", "Minecraft survival", "Minecraft survival") },
        { day: 2, time: "20:00", topic: L3("Модпак түні", "Ночь модпаков", "Modpack night") },
        { day: 5, time: "19:00", topic: L3("Дуэт және құрылыс", "Дуэт и стройка", "Duo and building") }
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
        desc: L3("Жеңімпазға ойын ID-і арқылы беріледі.", "Победитель получит по игровому ID.", "The winner receives by game ID."),
        prize: L3("100 алмаз", "100 алмазов", "100 diamonds"), cost: 1, participants: [], winner: null },
      { id: "g2", icon: "users", title: L3("Менімен бірге Minecraft ойнау", "Игра в Minecraft со мной", "Play Minecraft with me"),
        desc: L3("2 сағат жеке серверде бірге ойнау.", "2 часа на приватном сервере вместе.", "2 hours on a private server together."),
        prize: L3("Дуэт сессиясы", "Сессия вдвоём", "Duo session"), cost: 1, participants: [], winner: null }
    ],
    products: [
      { id: "p1", cat: "over", name: L3("Стрим оверлейі", "Оверлей для стрима", "Stream overlay"),
        desc: L3("Оверлей, панельдер, сахна.", "Оверлей, панели, сцены.", "Overlay, panels, scenes."), price: 4500, img: "" },
      { id: "p2", cat: "design", name: L3("Лендинг шаблоны", "Шаблон лендинга", "Landing template"),
        desc: L3("HTML/CSS бейімделген лендинг.", "Адаптивный лендинг HTML/CSS.", "Responsive HTML/CSS landing."), price: 7900, img: "" },
      { id: "p3", cat: "pack", name: L3("Қыс текстуралары", "Зимние текстуры", "Winter textures"),
        desc: L3("16x қыс пакі.", "Пак 16x.", "16x winter pack."), price: 1500, img: "" }
    ],
    modpacks: [
      { id: "m1", cat: "rpg", title: "A782 Ultimate RPG & Shaders", version: "1.20.1", loader: "Fabric", mods: 145, sizeMb: 380,
        downloads: 1420, rating: 4.9, file: "", keyMods: ["Distant Horizons", "Iris", "Better Combat"],
        desc: L3("Жаңа әлем және шейдерлер.", "Новый мир и шейдеры.", "New world and shaders.") },
      { id: "m2", cat: "pvp", title: "Cyber PvP & FPS Boost", version: "1.20.4", loader: "Fabric", mods: 42, sizeMb: 110,
        downloads: 3890, rating: 5, file: "", keyMods: ["Sodium", "Entity Culling"],
        desc: L3("FPS арттыратын топтама.", "Сборка для роста FPS.", "Pack for higher FPS.") }
    ],
    games: [
      { id: "so2", name: "Standoff 2", icon: "swords", status: "soon", link: "",
        desc: L3("Standoff 2 ойыншыларының жеке чаты.", "Отдельный чат игроков Standoff 2.", "A dedicated Standoff 2 players chat.") },
      { id: "roblox", name: "Roblox", icon: "gamepad", status: "soon", link: "",
        desc: L3("Roblox ойыншыларының жеке чаты.", "Отдельный чат игроков Roblox.", "A dedicated Roblox players chat.") },
      { id: "ff", name: "Free Fire", icon: "flame", status: "soon", link: "",
        desc: L3("Free Fire ойыншыларының жеке чаты.", "Отдельный чат игроков Free Fire.", "A dedicated Free Fire players chat.") },
      { id: "brawl", name: "Brawl Stars", icon: "star", status: "soon", link: "",
        desc: L3("Brawl Stars ойыншыларының жеке чаты.", "Отдельный чат игроков Brawl Stars.", "A dedicated Brawl Stars players chat.") },
      { id: "coc", name: "Clash of Clans", icon: "shield", status: "soon", link: "",
        desc: L3("Clash of Clans ойыншыларының жеке чаты.", "Отдельный чат игроков Clash of Clans.", "A dedicated Clash of Clans players chat.") },
      { id: "mc", name: "Minecraft", icon: "cube", status: "live", link: "",
        desc: L3("Minecraft ойыншыларының жеке чаты.", "Отдельный чат игроков Minecraft.", "A dedicated Minecraft players chat.") }
    ],
    vipPlans: [
      {id:"vip-free",tier:"VIP-FREE",name:"VIP-FREE",price:0,durationDays:7,active:true},
      {id:"vip-plus",tier:"VIP-PLUS",name:"VIP-PLUS",price:0,durationDays:30,active:true},
      {id:"vip-pro",tier:"VIP-PRO",name:"VIP-PRO",price:0,durationDays:30,active:true},
      {id:"vip-ultra",tier:"VIP-ULTRA",name:"VIP-ULTRA",price:0,durationDays:30,active:true}
    ], users: [], orders: [], sessions: {}
  };
}

let db = seed();
let remoteReady = !REMOTE;
let saveTimer = null;

function migrate() {
  const s = seed();
  for (const k of Object.keys(s)) if (db[k] === undefined) db[k] = s[k];
  if (!db.owner.bio || typeof db.owner.bio !== "object") db.owner.bio = s.owner.bio;
  if (!db.stream.title || typeof db.stream.title !== "object") db.stream.title = s.stream.title;
  if (!Array.isArray(db.stream.schedule) || db.stream.schedule.some(x => typeof x.day !== "number")) db.stream.schedule = s.stream.schedule;
  if (!Array.isArray(db.vipPlans)) db.vipPlans = [];
  // Existing VIP plans and orders are retained; only missing fixed tiers are added.
  for (const template of s.vipPlans) {
    let current = db.vipPlans.find(p => p.id === template.id || p.tier === template.tier || String(p.name||"").toUpperCase() === template.tier);
    if (!current) db.vipPlans.push({...template});
    else { current.tier = template.tier; current.name = template.name; if(template.tier === "VIP-FREE") {current.price=0;current.durationDays=7;} }
  }
  if (!Array.isArray(db.games)) db.games = [];
  for (const game of s.games) {
    const existing = db.games.find(x => x.id === game.id || x.name === game.name);
    if (!existing) db.games.push(game);
  }
}

async function loadDB() {
  if (!REMOTE) {
    if (fs.existsSync(DATA_FILE)) db = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    migrate();
    return;
  }
  const r = await fetch(`https://api.jsonbin.io/v3/b/${JB_ID}/latest`, { headers: { "X-Master-Key": JB_KEY } });
  if (!r.ok) throw new Error("JSONBin " + r.status);
  const j = await r.json();
  if (j.record && j.record.owner) db = j.record;
  migrate();
  remoteReady = true;
  console.log("JSONBin-нен деректер жүктелді");
}

function saveDB() {
  if (!REMOTE) {
    const tmp = DATA_FILE + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
    fs.renameSync(tmp, DATA_FILE);
    return;
  }
  if (!remoteReady) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    fetch(`https://api.jsonbin.io/v3/b/${JB_ID}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-Master-Key": JB_KEY },
      body: JSON.stringify(db)
    }).then(r => { if (!r.ok) console.error("JSONBin сақтау қатесі:", r.status); })
      .catch(e => console.error("JSONBin сақтау қатесі:", e.message));
  }, 500);
}

// VIP changes must be confirmed by persistent storage before reporting success.
async function saveVipNow() {
  if (!REMOTE) { saveDB(); return; }
  if (!remoteReady) fail(503, "storage_failed");
  clearTimeout(saveTimer);
  saveTimer = null;
  try {
    const response = await fetch(`https://api.jsonbin.io/v3/b/${JB_ID}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-Master-Key": JB_KEY },
      body: JSON.stringify(db)
    });
    if (!response.ok) {
      console.error("VIP JSONBin сақтау қатесі:", response.status);
      fail(503, "storage_failed");
    }
  } catch (error) {
    console.error("VIP сақтау қатесі:", error.message);
    fail(503, "storage_failed");
  }
}

const uid = () => crypto.randomBytes(8).toString("hex");
const randCode = () => crypto.randomBytes(3).toString("hex").toUpperCase();
const hashPw = (pw, salt) => crypto.scryptSync(pw, salt, 64).toString("hex");
const str = (v, max = 200) => String(v ?? "").trim().slice(0, max);
const tr = (b, base, max = 400) => ({ kk: str(b[base + "_kk"], max), ru: str(b[base + "_ru"], max), en: str(b[base + "_en"], max) });
const safeUrl = v => (/^https?:\/\/\S+$/.test(str(v, 500)) ? str(v, 500) : "");
const safeImg = v => {
  const s = str(v, 70000);
  if (/^https:\/\/\S+$/.test(s)) return s;
  if (/^data:image\/(png|jpe?g|webp);base64,/.test(s)) return s;
  return "";
};
const upsert = (arr, item) => {
  const i = arr.findIndex(x => x.id === item.id);
  if (i >= 0) arr[i] = { ...arr[i], ...item }; else arr.unshift(item);
};
function fail(status, code) { const e = new Error(code); e.status = status; e.code = code; throw e; }
const activeVip = u => {
 if (!u.vip || (u.vip.expiresAt !== null && !(Date.parse(u.vip.expiresAt) > Date.now()))) return null;
 const tier = u.vip.tier || tierOf(db.vipPlans.find(p=>p.id===u.vip.planId)||{name:u.vip.name});
 return {...u.vip,tier,visualTier:tier==="VIP-FREE"?"VIP-ULTRA":tier};
};
const pubUser = u => ({
  id: u.id, vip: activeVip(u), vipTrialUsed:!!u.vipTrialUsed || db.orders.some(o=>o.type==="vip-trial"&&o.userId===u.id), nick: u.nick, mc: u.mc, ff: u.ff, so2: u.so2, tg: u.tg, bio: u.bio,
  avatar: u.avatar, banner: u.banner, icon: u.icon,
  tickets: u.tickets, tokens: u.tokens, diamonds: u.diamonds, wins: u.wins
});
const pubGw = g => ({ ...g, participants: g.participants.map(p => p.nick), winner: g.winner ? { name: g.winner.name, at: g.winner.at } : null });
const pubData = () => ({
  vipPlans: db.vipPlans.filter(p => p.active && VIP_TIERS.includes(tierOf(p)) && p.tier).map(vipPublicPlan).sort((a,b)=>VIP_TIERS.indexOf(a.tier)-VIP_TIERS.indexOf(b.tier)), owner: db.owner, stream: db.stream, server: db.server, wheelCost: db.wheelCost,
  prizes: db.prizes, coupons: db.coupons, demoPay: DEMO_PAY, games: db.games,
  giveaways: db.giveaways.map(pubGw), products: db.products, modpacks: db.modpacks
});
function parseSchedule(txt) {
  return str(txt, 3000).split("\n").map(l => l.split("|").map(x => x.trim()))
    .filter(a => a.length >= 5 && /^[0-6]$/.test(a[0]))
    .slice(0, 20)
    .map(a => ({ day: +a[0], time: a[1].slice(0, 5), topic: { kk: a[2].slice(0, 120), ru: a[3].slice(0, 120), en: a[4].slice(0, 120) } }));
}

function readBody(req, limit = 100 * 1024) {
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
  try { r = await fetch(url, { headers: { "User-Agent": UA } }); } catch { fail(502, "upstream"); }
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
    return { hits: d.hits.map(h => ({ id: h.project_id, title: h.title, author: h.author, desc: h.description, icon: h.icon_url, downloads: h.downloads, license: h.license })) };
  });
}
async function mcVersions(id) {
  if (!/^[\w-]{1,64}$/.test(id || "")) fail(400, "invalid");
  const url = `https://api.modrinth.com/v2/project/${id}/version`;
  return cached(url, async () => {
    const vs = await upstream(url);
    return { versions: vs.slice(0, 12).map(v => ({
      name: v.name, games: (v.game_versions || []).slice(0, 4), loaders: v.loaders || [],
      file: ((v.files || []).find(f => f.primary) || (v.files || [])[0] || {}).url || ""
    })) };
  });
}

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
    const b = await readBody(req, 80 * 1024);
    u.nick = str(b.nick, 24) || u.nick;
    u.mc = str(b.mc, 32); u.ff = str(b.ff, 32); u.so2 = str(b.so2, 32); u.tg = str(b.tg, 40); u.bio = str(b.bio, 200);
    if (b.avatar !== undefined) u.avatar = b.avatar === "" ? "" : (safeImg(b.avatar) || u.avatar);
    if (b.banner !== undefined) u.banner = b.banner === "" ? "" : (safeImg(b.banner) || u.banner);
    if (AVATARS.includes(b.icon)) u.icon = b.icon;
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
      u.wins.unshift({ id: uid(), title: L3("Купон 10%", "Купон 10%", "10% coupon"), code, date: new Date().toLocaleDateString("en-GB") });
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

  if (m === "POST" && p === "/api/vip/trial") {
    const u = need();
    const free = db.vipPlans.find(x => tierOf(x)==="VIP-FREE" && x.active);
    if (!free) fail(400,"not_found");
    // Both the flag and historical grant are checked against old accounts.
    if (u.vipTrialUsed || db.orders.some(o => o.type === "vip-trial" && o.userId === u.id)) fail(409,"trial_used");
    if (activeVip(u)) fail(409,"vip_active");
    const now = Date.now();
    u.vipTrialUsed = true;
    u.vip = { planId: free.id, name:"VIP-FREE", tier:"VIP-FREE", startedAt:new Date(now).toISOString(), expiresAt:new Date(now+7*86400000).toISOString(), trial:true };
    db.orders.unshift({id:"TRIAL-"+randCode(),type:"vip-trial",userId:u.id,planId:free.id,planName:"VIP-FREE",nick:u.nick,date:new Date(now).toISOString(),total:0,status:"paid",approvedAt:new Date(now).toISOString()});
    await saveVipNow();
    return [200,{user:pubUser(u)}];
  }
  if (m === "POST" && p === "/api/vip/orders") {
    const u = need();
    const b = await readBody(req);
    const plan = db.vipPlans.find(x => x.id === b.planId && x.active);
    if (!plan || tierOf(plan)==="VIP-FREE") fail(404, "not_found");
    if (!(plan.price > 0)) fail(400,"price_not_set");
    const order = { id: "VIP-" + randCode(), type: "vip", planId: plan.id,
      planName: plan.name, tier:tierOf(plan), durationDays: plan.durationDays, userId: u.id,
      nick: u.nick, date: new Date().toISOString(), items: [],
      subtotal: plan.price, discount: 0, total: plan.price,
      method: "telegram", receipt: "", status: "pending" };
    db.orders.unshift(order); saveDB();
    return [201, { order, telegram: db.owner.telegram || "https://t.me/Asxm_A782" }];
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
    const method = ["kaspi", "telegram", "demo"].includes(b.method) ? b.method : "telegram";
    if (method === "demo" && !DEMO_PAY) fail(400, "invalid");
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
    const b = await readBody(req);
    const o = db.owner, s = db.stream;
    db.owner = {
      ...o,
      name: str(b.name, 60) || o.name,
      handle: str(b.handle, 40) || o.handle,
      tiktok: safeUrl(b.tiktok) || o.tiktok,
      telegram: safeUrl(b.telegram) || o.telegram,
      kaspi: str(b.kaspi, 40),
      avatar: b.avatar === undefined ? o.avatar : safeImg(b.avatar),
      banner: b.banner === undefined ? o.banner : safeImg(b.banner),
      bio: tr(b, "bio", 200)
    };
    db.stream = {
      ...s,
      live: !!b.live,
      title: tr(b, "stitle", 120),
      nextAt: str(b.nextAt, 40) || s.nextAt,
      schedule: parseSchedule(b.sched)
    };
    db.server = { ip: str(b.ip, 80), version: str(b.version, 20) };
    db.wheelCost = Math.max(1, parseInt(b.wheelCost) || 1);
    saveDB();
    return [200, { ok: true }];
  }
  if (m === "POST" && p === "/api/admin/giveaways") {
    const b = await readBody(req);
    const title = tr(b, "title", 120);
    if (!title.kk && !title.ru && !title.en) fail(400, "title_required");
    const old = db.giveaways.find(x => x.id === str(b.id, 40));
    upsert(db.giveaways, {
      id: old ? old.id : uid(),
      icon: ICONS.includes(b.icon) ? b.icon : "gift",
      title, desc: tr(b, "desc", 300), prize: tr(b, "prize", 120),
      cost: Math.max(1, parseInt(b.cost) || 1),
      participants: old ? old.participants : [], winner: old ? old.winner : null
    });
    saveDB();
    return [200, { ok: true }];
  }
  if (m === "POST" && p === "/api/admin/products") {
    const b = await readBody(req);
    const name = tr(b, "name", 120);
    if (!name.kk && !name.ru && !name.en) fail(400, "title_required");
    const old = db.products.find(x => x.id === str(b.id, 40));
    upsert(db.products, {
      id: old ? old.id : uid(),
      cat: P_CATS.includes(b.cat) ? b.cat : "pack",
      name, desc: tr(b, "desc", 300),
      price: Math.max(0, parseInt(b.price) || 0),
      img: safeImg(b.img) || (old ? old.img : "")
    });
    saveDB();
    return [200, { ok: true }];
  }
  if (m === "POST" && p === "/api/admin/modpacks") {
    const b = await readBody(req);
    const title = str(b.title, 120);
    if (!title) fail(400, "title_required");
    const old = db.modpacks.find(x => x.id === str(b.id, 40));
    upsert(db.modpacks, {
      id: old ? old.id : uid(),
      cat: M_CATS.includes(b.cat) ? b.cat : "rpg",
      title,
      version: str(b.version, 20) || "1.20.1",
      loader: str(b.loader, 20) || "Fabric",
      mods: parseInt(b.mods) || 0,
      sizeMb: parseInt(b.sizeMb) || 0,
      downloads: old ? old.downloads : 0,
      rating: old ? old.rating : 5,
      file: safeUrl(b.file),
      keyMods: str(b.keys, 400).split(",").map(x => x.trim()).filter(Boolean).slice(0, 12),
      desc: tr(b, "desc", 300)
    });
    saveDB();
    return [200, { ok: true }];
  }
  if (m === "POST" && p === "/api/admin/games") {
    const b = await readBody(req);
    const name = str(b.name, 40);
    if (!name) fail(400, "title_required");
    const old = db.games.find(x => x.id === str(b.id, 40));
    upsert(db.games, {
      id: old ? old.id : uid(),
      name,
      icon: ICONS.includes(b.icon) ? b.icon : "gamepad",
      status: b.status === "live" ? "live" : "soon",
      link: safeUrl(b.link),
      desc: tr(b, "desc", 200)
    });
    saveDB();
    return [200, { ok: true }];
  }
  const del = p.match(/^\/api\/admin\/(giveaways|products|modpacks|games)\/([\w-]+)$/);
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
  if (m === "GET" && p === "/api/admin/vip-plans") return [200, { plans: db.vipPlans }];
  if (m === "POST" && p === "/api/admin/vip-plans") {
    const b = await readBody(req);
    const old = db.vipPlans.find(x => x.id === b.id);
    if (!old) fail(404,"not_found");
    const tier = tierOf(old);
    if (!VIP_TIERS.includes(tier)) fail(400,"invalid");
    const price = Number(b.price), durationDays = Number(b.durationDays);
    if (!Number.isSafeInteger(price) || price<0 || price>10000000 || !Number.isSafeInteger(durationDays) || durationDays<1 || durationDays>36500) fail(400,"invalid");
    // FREE is always seven days, free, and one-time. The admin cannot accidentally alter that.
    old.name=tier; old.tier=tier; old.price=tier==="VIP-FREE"?0:price;
    old.durationDays=tier==="VIP-FREE"?7:durationDays;
    old.active=b.active!==false;
    await saveVipNow();
    return [200,{plan:vipPublicPlan(old)}];
  }
  const vpDel = p.match(/^\/api\/admin\/vip-plans\/([\w-]+)$/);
  if (m === "DELETE" && vpDel) {
    const plan = db.vipPlans.find(x=>x.id===vpDel[1]) || fail(404,"not_found");
    plan.active=false; await saveVipNow(); return [200,{ok:true}];
  }
  const vipGrant = p.match(/^\/api\/admin\/vip-orders\/([\w-]+)\/approve$/);
  if (m === "POST" && vipGrant) {
    const o = db.orders.find(x => x.id === vipGrant[1] && x.type === "vip") || fail(404, "not_found");
    const u = db.users.find(x => x.id === o.userId) || fail(404, "not_found");
    // A legacy VIP order may already be marked paid without a VIP grant.
    // Reconcile it exactly once. Do not re-grant already approved or expired orders.
    if (o.approvedAt) return [200, { ok: true, user: pubUser(u), alreadyApproved: true }];
    const days = o.durationDays;
    if (!Number.isSafeInteger(days) || days < 0 || days > 36500) fail(400, "invalid");
    const now = Date.now(), prev = activeVip(u);
    const start = prev && prev.expiresAt === null ? null : Math.max(now, prev ? Date.parse(prev.expiresAt) || now : now);
    u.vip = { planId:o.planId, name:o.planName, tier:o.tier||tierOf(db.vipPlans.find(p=>p.id===o.planId)||{name:o.planName}), startedAt:new Date(now).toISOString(), expiresAt: days === 0 || start === null ? null : new Date(start + days * 86400000).toISOString() };
    o.status = "paid"; o.approvedAt = new Date().toISOString();
    await saveVipNow(); return [200, { ok: true, user: pubUser(u) }];
  }
  const ost = p.match(/^\/api\/admin\/orders\/([\w-]+)\/status$/);
  if (m === "POST" && ost) {
    const b = await readBody(req);
    const o = db.orders.find(x => x.id === ost[1]) || fail(404, "not_found");
    if (!["paid", "pending"].includes(b.status)) fail(400, "invalid");
    if (o.type === "vip") fail(400, "invalid");
    o.status = b.status;
    saveDB();
    return [200, { ok: true }];
  }
  if (m === "GET" && p === "/api/admin/users") {
    return [200, { users: db.users.map(u => ({ id: u.id, email: u.email, nick: u.nick, vip: activeVip(u), tickets: u.tickets, tokens: u.tokens, diamonds: u.diamonds })) }];
  }
  if (m === "GET" && p === "/api/admin/orders") return [200, { orders: db.orders }];
  fail(404, "not_found");
}

const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml", ".ico": "image/x-icon"
};
function serveStatic(pathname, res) {
  const rel = pathname === "/" ? "/index.html" : decodeURIComponent(pathname);
  const full = path.resolve(PUBLIC_DIR, "." + rel);
  const relative = path.relative(PUBLIC_DIR, full);
  if (relative.startsWith("..") || path.isAbsolute(relative)) { res.writeHead(403); return res.end(); }
  fs.readFile(full, (err, buf) => {
    if (err) { res.writeHead(404); return res.end("Not found"); }
    res.writeHead(200, { "Content-Type": MIME[path.extname(full)] || "application/octet-stream", "Cache-Control": "no-cache" });
    res.end(buf);
  });
}

const server = http.createServer(async (req, res) => {
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
});

loadDB()
  .catch(e => { console.error("Жүктеу қатесі:", e.message); migrate(); })
  .then(() => server.listen(PORT, () => console.log(`A782 DIGITAL: порт ${PORT}`)));
