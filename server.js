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
    users: [], orders: [], sessions: {}
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
const pubUser = u => ({
  id: u.id, nick: u.nick, mc: u.mc, ff: u.ff, so2: u.so2, tg: u.tg, bio: u.bio,
  avatar: u.avatar, banner: u.banner, icon: u.icon,
  tickets: u.tickets, tokens: u.tokens, diamonds: u.diamonds, wins: u.wins
});
const pubGw = g => ({ ...g, participants: g.participants.map(p => p.nick), winner: g.winner ? { name: g.winner.name, at: g.winner.at } : null });
const pubData = () => ({
  owner: db.owner, stream: db.stream, server: db.server, wheelCost: db.wheelCost,
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
