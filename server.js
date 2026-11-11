// A782 DIGITAL — backend v3. Node.js 18+, басқа пакет қажет емес.
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "data.json");
const PUBLIC_DIR = path.join(__dirname, "public");
const ADMIN_PIN = process.env.ADMIN_PIN || crypto.randomBytes(3).toString("hex");
// Configure ONLY in Render Environment. Fail closed when no owner email is configured.
const ADMIN_EMAIL = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
const isOwnerAccount = u => !!(u && ADMIN_EMAIL && /^[^\s@]+@gmail\.com$/.test(ADMIN_EMAIL) && String(u.email || "").trim().toLowerCase() === ADMIN_EMAIL);
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
 "VIP-FREE": { icon:"sparkles", color:"#8be9fd", perks: L3("7 күн ULTRA Studio|500 таңдаулы файл/ойын|9 профиль түсі және 5 жылдам сілтеме", "7 дней ULTRA Studio|До 500 избранных|9 тем и 5 быстрых ссылок", "7 days ULTRA Studio|500 saved items|9 themes and 5 shortcuts") },
 "VIP-PLUS": { icon:"star", color:"#48d5ff", perks: L3("60 таңдаулы сақта|3 профиль түсі және статус|1 жылдам сілтеме", "60 сохранённых|3 темы и статус|1 быстрый переход", "60 saved items|3 themes and status|1 quick link") },
 "VIP-PRO": { icon:"gem", color:"#b18cff", perks: L3("160 таңдаулы сақта|6 түс және профиль ұраны|3 жылдам сілтеме", "160 сохранённых|6 тем и подпись профиля|3 быстрых перехода", "160 saved items|6 themes and headline|3 shortcuts") },
 "VIP-ULTRA": { icon:"crown", color:"#ffc76d", perks: L3("500 таңдаулы сақта|9 эксклюзив түс және статус|5 жылдам сілтеме, ULTRA дизайн", "500 сохранённых|9 эксклюзивных тем и статус|5 быстрых ссылок, ULTRA стиль", "500 saved items|9 exclusive themes and status|5 shortcuts, ULTRA style") }
};
const tierOf = (plan) => VIP_TIERS.includes(plan?.tier) ? plan.tier : VIP_TIERS.includes(plan?.name?.toUpperCase()) ? plan.name.toUpperCase() : "VIP-PLUS";
// Practical Premium capabilities are checked on the server, never just in the UI.
const VIP_CAPS = {
  standard: {limit:12, presets:[], shortcuts:0},
  "VIP-PLUS": {limit:60, presets:["cyan","ocean","mint"], shortcuts:1},
  "VIP-PRO": {limit:160, presets:["cyan","ocean","mint","violet","rose","ember"], shortcuts:3},
  "VIP-ULTRA": {limit:500, presets:["cyan","ocean","mint","violet","rose","ember","gold","aurora","obsidian"], shortcuts:5}
};
const SHORTCUTS=["home","mc","store","streams","vip","me"];
const SITE_COPY_KEYS = [
  "seasonLabel", "homeTitle", "homeLead", "giveawayTitle", "giveawayLead",
  "reelTitle", "reelLead", "minecraftTitle", "minecraftLead",
  "streamsTitle", "streamsLead", "storeTitle", "storeLead", "premiumTitle", "premiumLead"
];
const PALETTES = ["cobalt", "aurora", "glacier"];
const VIP_MOTIFS = ["glacier", "aurora", "prism", "solstice"];
const DEFAULT_APPEARANCE = {
  palette:"cobalt", defaultTheme:"dark", snow:"light", aurora:true, motion:"enhanced",
  spinSound:true, soundVolume:24, logoText:"A", logoImage:"", heroImage:"", copy:{}
};
const VIP_DESIGN_DEFAULTS = {
  "VIP-FREE": {
    title:"FREE", motif:"glacier", accent:"#83ddff", highlight:"#c6f4ff",
    description:L3("7 күнге ULTRA мүмкіндіктерін аш.", "7 дней возможностей ULTRA.", "Unlock ULTRA features for seven days.")
  },
  "VIP-PLUS": {
    title:"PLUS", motif:"aurora", accent:"#55e8bd", highlight:"#75bbff",
    description:L3("Жеке түстер, статус және сүйікті дүниелерің бір жерде.", "Свои цвета, статус и избранное в одном месте.", "Your colors, status, and saved items in one place.")
  },
  "VIP-PRO": {
    title:"PRO", motif:"prism", accent:"#bb93ff", highlight:"#ff9fd6",
    description:L3("Профиль ұранын қосып, жиі қолданатын бөлімдеріңді ретте.", "Добавь подпись профиля и настрой быстрые переходы.", "Add a profile headline and arrange your shortcuts.")
  },
  "VIP-ULTRA": {
    title:"ULTRA", motif:"solstice", accent:"#ffbd57", highlight:"#fff0ba",
    description:L3("Барлық палитра, ең үлкен таңдаулылар жинағы және бес жылдам сілтеме.", "Все палитры, самая большая коллекция и пять быстрых ссылок.", "Every palette, the largest saved collection, and five shortcuts.")
  }
};
const vipPublicPlan = p => ({...p, tier:tierOf(p), ...VIP_META[tierOf(p)]});


function seed() {
  return {
    appearance: structuredClone(DEFAULT_APPEARANCE),
    vipDesigns: structuredClone(VIP_DESIGN_DEFAULTS),
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
let dirty = false;
let storageBlocked = false;
let requestQueue = Promise.resolve();
const RARITIES = ["Common", "Rare", "Epic", "Legendary", "Mythic"];
function migrateWheel() {
  if (!db.wheelRevision) db.wheelRevision = 1;
  if (!db.spinReceipts) db.spinReceipts = {};
  const weights = db.prizes.map(p => Math.max(0, Number(p.weight) || 0));
  const total = weights.reduce((a,b) => a+b, 0);
  const raw = weights.map(w => total ? w / total * 10000 : 0);
  const points = raw.map(Math.floor);
  if (total) {
    const order = raw.map((v,i) => i).sort((a,b) => (raw[b]-points[b])-(raw[a]-points[a]));
    for (let n = 10000-points.reduce((a,b)=>a+b,0), i=0; i<n; i++) points[order[i%order.length]]++;
  }
  db.prizes.forEach((p,i) => {
    p.id ||= 'legacy-prize-' + i;
    if (!Number.isInteger(p.chanceBps)) p.chanceBps = points[i];
    if (!RARITIES.includes(p.rarity)) p.rarity = p.chanceBps <= 100 ? 'Legendary' : p.chanceBps <= 900 ? 'Epic' : p.chanceBps <= 2000 ? 'Rare' : 'Common';
  });
}
function validChances(prizes) {
  return prizes.length > 0 && prizes.every(p => Number.isInteger(p.chanceBps) && p.chanceBps >= 0 && p.chanceBps <= 10000) && prizes.reduce((a,p)=>a+p.chanceBps,0) === 10000;
}
function pickPrizeIndex(prizes, roll = crypto.randomInt(10000)) {
  for (let i=0; i<prizes.length; i++) { roll -= prizes[i].chanceBps; if(roll<0)return i; }
  fail(503, 'invalid_chances');
}


function migrate() {
  const s = seed();
  for (const k of Object.keys(s)) if (db[k] === undefined) db[k] = s[k];
  migrateWheel();
  db.owner.name = normalizeBrand(db.owner.name);
  const storedAppearance = db.appearance && typeof db.appearance === "object" ? db.appearance : {};
  db.appearance = { ...s.appearance, ...storedAppearance };
  if (!db.appearance.copy || typeof db.appearance.copy !== "object") db.appearance.copy = {};
  const storedDesigns = db.vipDesigns && typeof db.vipDesigns === "object" ? db.vipDesigns : {};
  db.vipDesigns = Object.fromEntries(VIP_TIERS.map(tier => [
    tier, { ...s.vipDesigns[tier], ...storedDesigns[tier] }
  ]));
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
  if (!j.record || !j.record.owner || !Array.isArray(j.record.users)) throw new Error("JSONBin record is invalid; refusing to overwrite");
  db = j.record;
  migrate();
  remoteReady = true;
  console.log("JSONBin-нен деректер жүктелді");
}

// All API requests run through one transaction queue. No delayed writes can
// overtake a spin, balance update, login or admin edit. Deploy ONE instance.
function saveDB() { dirty = true; }
async function saveVipNow() { dirty = true; }
async function commitDB() {
  if (!REMOTE) {
    const tmp = DATA_FILE + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(db, null, 2), {mode:0o600});
    fs.renameSync(tmp, DATA_FILE);
    return;
  }
  if (!remoteReady || storageBlocked) fail(503, "storage_failed");
  try {
    const response = await fetch(`https://api.jsonbin.io/v3/b/${JB_ID}`, {
      method: "PUT", signal: AbortSignal.timeout(15000),
      headers: { "Content-Type": "application/json", "X-Master-Key": JB_KEY },
      body: JSON.stringify(db)
    });
    if (!response.ok) throw new Error("storage_failed");
  } catch (error) {
    // A lost response may mean the write succeeded. Freeze writes until restart
    // reloads authoritative JSONBin state; NEVER reroll an uncertain result.
    storageBlocked = true;
    fail(503, "storage_failed");
  }
}
async function transaction(req, url, body) {
  if (req.method === "GET") return route(req, url, userFrom(req));
  if (storageBlocked) fail(503, "storage_failed");
  const before = structuredClone(db);
  dirty = false;
  try {
    const result = await route(req, url, userFrom(req), body);
    if (dirty) await commitDB();
    return result;
  } catch (error) { db = before; throw error; }
  finally { dirty = false; }
}

const uid = () => crypto.randomBytes(8).toString("hex");
const randCode = () => crypto.randomBytes(3).toString("hex").toUpperCase();
const hashPw = (pw, salt) => crypto.scryptSync(pw, salt, 64).toString("hex");
const str = (v, max = 200) => String(v ?? "").trim().slice(0, max);
const tr = (b, base, max = 400) => ({ kk: str(b[base + "_kk"], max), ru: str(b[base + "_ru"], max), en: str(b[base + "_en"], max) });
function normalizeBrand(value) {
  const name = str(value, 60).replace(/\s+/g, " ");
  if (!name || /^[aа][\s_-]*782[\s_-]*digi?tal$/iu.test(name)) return "A782 DIGITAL";
  return name;
}
function translatedText(value, max) {
  return Object.fromEntries(["kk", "ru", "en"].map(lang => [lang, str(value?.[lang], max)]));
}
function imageUrl(value) {
  const input = str(value, 500);
  if (!input) return "";
  try {
    const url = new URL(input);
    if (url.protocol === "https:" && !url.username && !url.password) return url.href;
  } catch {}
  fail(400, "invalid_image_url");
}
function appearanceConfig(body) {
  if (!PALETTES.includes(body.palette) || !["dark","light"].includes(body.defaultTheme) ||
      !["off","light","full"].includes(body.snow) || !["off","soft","enhanced"].includes(body.motion) ||
      typeof body.aurora !== "boolean" || typeof body.spinSound !== "boolean" ||
      !Number.isInteger(body.soundVolume) || body.soundVolume < 0 || body.soundVolume > 60) {
    fail(400, "invalid_appearance");
  }
  const copy = Object.fromEntries(SITE_COPY_KEYS.map(key => [
    key, translatedText(body.copy?.[key], key.endsWith("Lead") ? 320 : 100)
  ]));
  return {
    palette:body.palette, defaultTheme:body.defaultTheme, snow:body.snow, motion:body.motion,
    aurora:body.aurora, spinSound:body.spinSound, soundVolume:body.soundVolume,
    logoText:str(body.logoText, 3) || "A", logoImage:imageUrl(body.logoImage),
    heroImage:imageUrl(body.heroImage), copy
  };
}
function vipDesignConfig(tier, design) {
  if (!design || typeof design !== "object" || !VIP_MOTIFS.includes(design.motif) ||
      typeof design.accent !== "string" || typeof design.highlight !== "string" ||
      !/^#[0-9a-f]{6}$/i.test(design.accent) || !/^#[0-9a-f]{6}$/i.test(design.highlight)) {
    fail(400, "invalid_vip_design");
  }
  const defaults = VIP_DESIGN_DEFAULTS[tier];
  const description = translatedText(design.description, 220);
  for (const lang of ["kk","ru","en"]) {
    if (!description[lang]) description[lang] = defaults.description[lang];
  }
  return {
    title:str(design.title, 26) || defaults.title, motif:design.motif,
    accent:design.accent.toLowerCase(), highlight:design.highlight.toLowerCase(), description
  };
}
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
const vipCaps = u => VIP_CAPS[activeVip(u)?.visualTier || "standard"];
const publicLibrary = u => Array.isArray(u.library) ? u.library.filter(x=>x && typeof x === "object" && ["product","modpack","game","modrinth","curseforge"].includes(x.kind) && /^[\w-]{1,80}$/.test(String(x.id||""))).slice(0,500) : [];
const pubUser = u => ({
  id: u.id, isOwner: isOwnerAccount(u), vip: activeVip(u), vipPrefs:u.vipPrefs||{}, library:publicLibrary(u), libraryLimit:vipCaps(u).limit, vipTrialUsed:!!u.vipTrialUsed || db.orders.some(o=>o.type==="vip-trial"&&o.userId===u.id), nick: u.nick, mc: u.mc, ff: u.ff, so2: u.so2, tg: u.tg, bio: u.bio,
  avatar: u.avatar, banner: u.banner, icon: u.icon,
  tickets: u.tickets, tokens: u.tokens, diamonds: u.diamonds, wins: u.wins
});
const pubGw = g => ({ ...g, participants: g.participants.map(p => p.nick), winner: g.winner ? { name: g.winner.name, at: g.winner.at } : null });
const pubData = () => ({
  vipPlans: db.vipPlans.filter(p => p.active && VIP_TIERS.includes(tierOf(p)) && p.tier).map(vipPublicPlan).sort((a,b)=>VIP_TIERS.indexOf(a.tier)-VIP_TIERS.indexOf(b.tier)), owner: db.owner, stream: db.stream, server: db.server, wheelCost: db.wheelCost,
  appearance: db.appearance, vipDesigns: db.vipDesigns, minecraftSources:minecraftCatalog.sources,
  prizes: db.prizes, wheelRevision: db.wheelRevision, coupons: db.coupons, demoPay: DEMO_PAY, games: db.games,
  giveaways: db.giveaways.map(pubGw), products: db.products, modpacks: db.modpacks
});
function parseSchedule(txt) {
  return str(txt, 3000).split("\n").map(l => l.split("|").map(x => x.trim()))
    .filter(a => a.length >= 5 && /^[0-6]$/.test(a[0]))
    .slice(0, 20)
    .map(a => ({ day: +a[0], time: a[1].slice(0, 5), topic: { kk: a[2].slice(0, 120), ru: a[3].slice(0, 120), en: a[4].slice(0, 120) } }));
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    function finish(error, body) {
      clearTimeout(deadline);
      req.off("data", onData);
      req.off("end", onEnd);
      req.off("close", onClose);
      req.off("error", onClose);
      if (error) reject(error);
      else resolve(body);
    }
    function rejectBody(status, code) {
      finish(Object.assign(new Error(code), { status, code }));
    }
    function onClose() { rejectBody(400, "request_closed"); }
    function onData(chunk) {
      size += chunk.length;
      if (size > limit) {
        rejectBody(413, "too_large");
        req.resume();
        return;
      }
      chunks.push(chunk);
    }
    function onEnd() {
      if (!size) return finish(null, {});
      try {
        const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
        if (!body || typeof body !== "object" || Array.isArray(body)) return rejectBody(400, "invalid");
        finish(null, body);
      } catch { rejectBody(400, "invalid"); }
    }
    const deadline = setTimeout(() => {
      rejectBody(408, "request_timeout");
      req.resume();
    }, 10000);
    if (req.aborted || req.destroyed) return onClose();
    req.once("close", onClose);
    req.once("error", onClose);
    req.once("end", onEnd);
    req.on("data", onData);
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
  const grant = tok && adminTokens.get(tok);
  const user = userFrom(req);
  if (grant && grant.exp > Date.now() && isOwnerAccount(user) && grant.userId === user.id) return true;
  if (tok) adminTokens.delete(tok);
  return false;
}
const pinHits = new Map();

const {createMinecraftCatalog} = require("./minecraft");
const minecraftCatalog = createMinecraftCatalog({
  curseForgeKey:String(process.env.CURSEFORGE_API_KEY || "").trim(),
  userAgent:UA
});

async function route(req, url, user, body) {
  const p = url.pathname, m = req.method;
  const need = () => user || fail(401, "login_required");

  if (m === "GET" && p === "/api/data") return [200, pubData()];
  if (m === "GET" && p === "/api/mc/search") return [200, await minecraftCatalog.search(url.searchParams)];
  if (m === "GET" && p === "/api/mc/versions") return [200, await minecraftCatalog.versions(url.searchParams)];
  if (m === "GET" && p === "/api/mc/meta") return [200, await minecraftCatalog.metadata(url.searchParams)];

  if (m === "POST" && p === "/api/register") {
    const b = body;
    const email = str(b.email, 120).toLowerCase(), pw = String(b.password || ""), nick = str(b.nick, 24);
    if (!/^\S+@\S+\.\S+$/.test(email) || pw.length < 6 || !nick) fail(400, "invalid");
    if (db.users.some(x => x.email === email)) fail(409, "exists");
    // Reserve the configured owner address: it must have been registered before ADMIN_EMAIL is set.
    if (ADMIN_EMAIL && email === ADMIN_EMAIL) fail(403, "owner_registration_disabled");
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
    const b = body;
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
    const b = body;
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
    const b = body;
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
    const u = need(), b = body;
    const requestId = b.requestId;
    if (typeof requestId !== 'string' || !/^[a-zA-Z0-9_-]{16,100}$/.test(requestId)) fail(400, "request_id_required");
    const key = u.id + ':' + requestId;
    const old = db.spinReceipts[key];
    if (old) return [200, {...old, user: pubUser(u), replayed:true, cooldownMs:Math.max(0,6500-(Date.now()-(u.lastSpinAt||0)))}];
    if (Date.now() - (u.lastSpinAt || 0) < 6500) fail(409, "spin_busy");
    if (!validChances(db.prizes)) fail(503, "invalid_chances");
    if (u.tickets < db.wheelCost) fail(400, "no_tickets");
    const idx = pickPrizeIndex(db.prizes);
    const pz = structuredClone(db.prizes[idx]);
    if (!['tokens','tickets','diamonds','coupon'].includes(pz.kind) || !Number.isFinite(pz.val) || pz.val < 0) fail(503, 'invalid_prize');
    u.tickets -= db.wheelCost;
    let code = null;
    if (pz.kind === 'coupon') { code = 'CP-' + randCode(); (u.codes ||= {})[code] = pz.val; }
    else u[pz.kind] = (Number(u[pz.kind]) || 0) + pz.val;
    const winId = uid();
    (u.wins ||= []).unshift({id:winId, title:pz.label, prizeId:pz.id, requestId, code:code||'', date:new Date().toLocaleDateString('en-GB')});
    u.lastSpinAt = Date.now();
    const receipt = {index:idx, prize:pz, code, winId, requestId, revision:db.wheelRevision};
    db.spinReceipts[key] = receipt;
    saveDB();
    return [200, {...receipt, user:pubUser(u), cooldownMs:6500}];
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

  // Library works without VIP at a smaller limit, and remains intact when VIP expires.
  if (m === "POST" && p === "/api/library") {
    const u = need(), b = body;
    const kind = str(b.kind,20), id = str(b.id,80);
    const collections = {product:"products",modpack:"modpacks",game:"games"};
    const dbKey = Object.hasOwn(collections,kind)?collections[kind]:null;
    const catalog = kind==="modrinth" || kind==="curseforge";
    const validId = kind==="curseforge"?/^[1-9]\d{0,9}$/:/^[\w-]{1,80}$/;
    if (!validId.test(id) || (!catalog && (!dbKey || !db[dbKey].some(x=>x.id===id)))) fail(400,"invalid");
    u.library = publicLibrary(u);
    const pos = u.library.findIndex(x=>x.kind===kind && x.id===id);
    if (b.save === false) { if(pos>=0)u.library.splice(pos,1); }
    else if (pos<0) {
      if (u.library.length >= vipCaps(u).limit) fail(403,"library_limit");
      const type=["mod","modpack","resourcepack","shader"].includes(b.type)?b.type:"mod";
      u.library.push(catalog
        ? {kind,id,title:str(b.title,120)||(kind==="curseforge"?"CurseForge":"Modrinth"),type}
        : {kind,id});
    }
    await saveVipNow();
    return [200,{user:pubUser(u)}];
  }
  if (m === "POST" && p === "/api/vip/preferences") {
    const u=need(), vip=activeVip(u);
    if(!vip) fail(403,"vip_required");
    const caps=vipCaps(u), b=body;
    const preset=str(b.preset,24);
    if(!caps.presets.includes(preset)) fail(400,"invalid");
    const statusEmoji=str(b.statusEmoji,24);
    if(!["✦","⚡","🎮","🚀","💎","👑","🌌","🛡️","🎨","✨"].includes(statusEmoji)) fail(400,"invalid");
    const status=str(b.status,32), headline=str(b.headline,70);
    // All user input is still escaped in the browser before inserting into HTML.
    if(status.length>32 || headline.length>70)fail(400,"invalid");
    const shortcuts=Array.isArray(b.shortcuts)?b.shortcuts:[];
    if(shortcuts.length>caps.shortcuts || shortcuts.some(x=>!SHORTCUTS.includes(x)) || new Set(shortcuts).size!==shortcuts.length)fail(400,"invalid");
    u.vipPrefs={preset,statusEmoji,status,headline:vip.visualTier==="VIP-PLUS"?"":headline,shortcuts};
    await saveVipNow();
    return [200,{user:pubUser(u)}];
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
    const b = body;
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
    const b = body;
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
    if (!isOwnerAccount(user)) fail(403, "admin_required");
    const ip = req.socket.remoteAddress;
    const hit = pinHits.get(ip) || { n: 0, t: Date.now() };
    if (Date.now() - hit.t > 15 * 60e3) { hit.n = 0; hit.t = Date.now(); }
    if (hit.n >= 10) fail(429, "too_many");
    const b = body;
    const pin = String(b.pin || "");
    const ok = pin.length === ADMIN_PIN.length && crypto.timingSafeEqual(Buffer.from(pin), Buffer.from(ADMIN_PIN));
    if (!ok) { hit.n++; pinHits.set(ip, hit); fail(403, "bad_pin"); }
    const tok = crypto.randomBytes(24).toString("hex");
    adminTokens.set(tok, { userId: user.id, exp: Date.now() + 12 * 3600e3 });
    return [200, { token: tok }];
  }
  if (p.startsWith("/api/admin/")) {
    if (!isAdmin(req)) fail(403, "admin_required");
    return adminRoute(req, m, p, body);
  }
  return [404, { error: "not_found" }];
}

async function adminRoute(req, m, p, body) {
  if (m === "PUT" && p === "/api/admin/appearance") {
    const appearance = appearanceConfig(body);
    db.owner.name = normalizeBrand(body.name || db.owner.name);
    db.appearance = appearance;
    saveDB();
    return [200, {ok:true, appearance}];
  }
  if (m === "POST" && p === "/api/admin/coupons") {
    const code = str(body.code, 30).toUpperCase();
    if (!/^[A-Z0-9-]{2,30}$/.test(code) || /^(CP|EX)-/.test(code) ||
        !Number.isInteger(body.percent) || body.percent < 1 || body.percent > 100) {
      fail(400, "invalid_coupon");
    }
    db.coupons[code] = body.percent;
    saveDB();
    return [200, {ok:true}];
  }
  const removeCoupon = p.match(/^\/api\/admin\/coupons\/([A-Z0-9-]{2,30})$/);
  if (m === "DELETE" && removeCoupon) {
    if (!Object.hasOwn(db.coupons, removeCoupon[1])) fail(404, "not_found");
    delete db.coupons[removeCoupon[1]];
    saveDB();
    return [200, {ok:true}];
  }
  if (m === 'PUT' && p === '/api/admin/wheel-chances') {
    const b = body;
    if (b.revision !== db.wheelRevision) fail(409, 'chances_changed');
    if (!Array.isArray(b.prizes) || b.prizes.length !== db.prizes.length || new Set(b.prizes.map(x=>x?.id)).size !== db.prizes.length) fail(400,'invalid_chances');
    const updated = db.prizes.map(pz => {
      const row = b.prizes.find(x=>x?.id===pz.id);
      if (!row || typeof row.percent !== 'number' || !Number.isFinite(row.percent) || row.percent<0 || row.percent>100 || Math.abs(row.percent*100-Math.round(row.percent*100))>1e-7 || !RARITIES.includes(row.rarity)) fail(400,'invalid_chances');
      return {...pz, chanceBps:Math.round(row.percent*100), rarity:row.rarity};
    });
    if (!validChances(updated)) fail(400, 'chances_total');
    db.prizes = updated; db.wheelRevision++; saveDB();
    return [200,{ok:true, revision:db.wheelRevision}];
  }
  if (m === 'POST' && p === '/api/admin/wheel-prizes') {
    const b = body;
    if (!['tokens','tickets','diamonds','coupon'].includes(b.kind) || !Number.isInteger(b.val) || b.val<1 || b.val>1000000 || (b.kind==='coupon' && b.val>100) || !RARITIES.includes(b.rarity)) fail(400,'invalid_prize');
    const label=tr(b,'label',120);
    if (!label.kk || !label.ru || !label.en) fail(400,'title_required');
    const prize = {label, kind:b.kind, val:b.val, rarity:b.rarity};
    if (b.id) {
      if (b.revision !== db.wheelRevision) fail(409, "chances_changed");
      const current = db.prizes.find(entry => entry.id === b.id);
      if (!current) fail(404, "not_found");
      Object.assign(current, prize);
    } else {
      db.prizes.push({id:uid(), weight:0, chanceBps:0, ...prize});
    }
    db.wheelRevision++;
    saveDB();
    return [200, {ok:true, revision:db.wheelRevision}];
  }
  const removePrize = p.match(/^\/api\/admin\/wheel-prizes\/([\w-]+)$/);
  if (m === "DELETE" && removePrize) {
    const prize = db.prizes.find(entry => entry.id === removePrize[1]);
    if (!prize) fail(404, "not_found");
    if (prize.chanceBps !== 0) fail(400, "prize_chance_not_zero");
    db.prizes = db.prizes.filter(entry => entry.id !== prize.id);
    db.wheelRevision++;
    saveDB();
    return [200, {ok:true, revision:db.wheelRevision}];
  }

  if (m === "PUT" && p === "/api/admin/site") {
    const b = body;
    const o = db.owner, s = db.stream;
    db.owner = {
      ...o,
      name: normalizeBrand(b.name || o.name),
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
    const b = body;
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
    const b = body;
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
    const b = body;
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
    const b = body;
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
    const b = body;
    const u = db.users.find(x => x.id === bal[1]) || fail(404, "not_found");
    if (!["tickets", "tokens", "diamonds"].includes(b.field)) fail(400, "invalid");
    u[b.field] = Math.max(0, u[b.field] + (parseInt(b.delta) || 0));
    saveDB();
    return [200, { ok: true }];
  }
  if (m === "GET" && p === "/api/admin/vip-plans") {
    return [200, {plans:db.vipPlans.map(plan => ({...plan, design:db.vipDesigns[tierOf(plan)]}))}];
  }
  if (m === "POST" && p === "/api/admin/vip-plans") {
    const b = body;
    const old = db.vipPlans.find(x => x.id === b.id);
    if (!old) fail(404,"not_found");
    const tier = tierOf(old);
    if (!VIP_TIERS.includes(tier)) fail(400,"invalid");
    const price = Number(b.price), durationDays = Number(b.durationDays);
    if (!Number.isSafeInteger(price) || price<0 || price>10000000 || !Number.isSafeInteger(durationDays) || durationDays<0 || durationDays>36500) fail(400,"invalid");
    if (b.design !== undefined) db.vipDesigns[tier] = vipDesignConfig(tier, b.design);
    // The free trial keeps its existing entitlement and duration.
    old.name=tier; old.tier=tier; old.price=tier==="VIP-FREE"?0:price;
    old.durationDays=tier==="VIP-FREE"?7:durationDays;
    old.active=b.active!==false;
    await saveVipNow();
    return [200,{plan:{...vipPublicPlan(old), design:db.vipDesigns[tier]}}];
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
    const b = body;
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
    // Public catalogs never hold the database queue while waiting on a provider.
    const isCatalogRead = req.method === "GET" &&
      ["/api/mc/search", "/api/mc/versions", "/api/mc/meta"].includes(url.pathname);
    if (isCatalogRead) {
      const [status, out] = await route(req, url, null);
      if (!res.destroyed) send(res, status, out);
      return;
    }

    // A slow or interrupted upload must not hold the database queue.
    const body = req.method === "POST" || req.method === "PUT"
      ? await readBody(req, req.method === "PUT" && url.pathname === "/api/me" ? 80 * 1024 : 100 * 1024)
      : undefined;
    const job = requestQueue.then(() => {
      if (req.aborted || res.destroyed) return null;
      return transaction(req, url, body);
    });
    requestQueue = job.catch(() => {});
    const result = await job;
    if (result && !res.destroyed) send(res, ...result);
  } catch (e) {
    const status = e.status || 500;
    if (status === 500) console.error(e);
    if (res.destroyed) return;
    if (status === 408 || status === 413) res.setHeader("Connection", "close");
    send(res, status, { error: status === 500 ? "generic" : (e.code || e.message) });
  }
});

loadDB()
  .then(() => server.listen(PORT, () => console.log(`A782 DIGITAL: порт ${PORT}`)))
  .catch(e => { console.error("Жүктеу қатесі: іске қосу тоқтатылды", e.message); process.exitCode=1; });
