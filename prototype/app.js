/* P046 麻将小白助手 — 本地离线交互原型逻辑
   完全离线：不使用 fetch/XHR、不请求远程资源。数据来自 window.P046_RULES /
   window.P046_EXAMPLES（data/*.js，file:// 下可直接 <script> 加载），
   文案全部由 window.P046_I18N 驱动，不做 inline 中英判断。 */
(function () {
  "use strict";

  var RULES = window.P046_RULES;
  var EXAMPLES = window.P046_EXAMPLES;
  var I18N = window.P046_I18N;

  var TERM_ORDER = ["eye", "run", "triplet", "pong", "chi", "kong", "ready", "flower", "missingSuit", "winTypes", "fan", "flowerEye", "seats"];
  var HOME_QUESTIONS = ["whenCanWin", "whyCannotWin"];
  /* 座位模型：四个人（名字）坐定后固定不动，每局变的只有「谁是庄家」。
     座位 0=下(我) 1=右(我的下家) 2=上(对家) 3=左(上家)，物理位置永不改变。
     方位标签跟着庄家走：庄家=东，沿下家方向依次 南、西、北。 */
  var WIND_AT_DEALER = ["东", "南", "西", "北"];
  var SEAT_POS = ["s", "e", "n", "w"];
  /* 方位 → 生效花对应表：座次表与条件二共用 SEAT_FLOWERS，避免两处各写一份。
     东→春梅 南→夏兰 西→秋竹 北→冬菊。 */
  var SEAT_FLOWERS = [
    { wind: "东", windCode: "Z1", flowers: ["F1", "F5"] },
    { wind: "南", windCode: "Z2", flowers: ["F2", "F6"] },
    { wind: "西", windCode: "Z3", flowers: ["F3", "F7"] },
    { wind: "北", windCode: "Z4", flowers: ["F4", "F8"] }
  ];
  function seatFlowers(wind) {
    for (var i = 0; i < SEAT_FLOWERS.length; i++) { if (SEAT_FLOWERS[i].wind === wind) return SEAT_FLOWERS[i].flowers; }
    return [];
  }
  /* 座次表座位卡上的花牌改文字渲染用：牌面只留一个汉字（花牌本就以汉字为牌面），
     与语言无关；无障碍/alt 仍走 tileAlt 的本地化名称。判例页其它牌图不受影响。 */
  var FLOWER_CHAR = { F1: "春", F2: "夏", F3: "秋", F4: "冬", F5: "梅", F6: "兰", F7: "竹", F8: "菊" };
  var SEAT_FLASH_MS = 1600;
  var STATE_META = {
    can: { cls: "can", icon: "\u25CF" },
    cannot: { cls: "cannot", icon: "\u25B2" },
    conditional: { cls: "conditional", icon: "\u25C6" },
    insufficient: { cls: "insufficient", icon: "\u25A0" }
  };

  /* FR-05 IA split: 每个问题页只渲染自己那一类案例，按数据 `state` 字段分派 ——
      「什么情况下能胡」页只吃 state "can"，「为什么不能胡」页只吃其余全部，
      两页交集恒为空（一个案例只属于一页）。命名常量 + 工具函数做分派，
      模板里绝不散写 E01..E16。 */
  var WIN_STATE = "can";
  function examplesByState(key) {
    return EXAMPLES.examples.filter(function (e) { return e.state === key; });
  }
  function examplesExceptState(key) {
    return EXAMPLES.examples.filter(function (e) { return e.state !== key; });
  }
  function idsOf(list) { return list.map(function (e) { return e.id; }); }
  /* 能胡页案例区 ＝ {state === "can"}；不能胡页案例池 ＝ 其余全部再去掉纯讲概念的 E16
    （E16 只讲「眼是什么」，不是一张不能胡的牌，只留在牌例列表）。 */
  var CONCEPT_IDS = ["E16"];
  var WIN_IDS = idsOf(examplesByState(WIN_STATE));
  var CANT_WIN_IDS = idsOf(examplesExceptState(WIN_STATE).filter(function (e) { return CONCEPT_IDS.indexOf(e.id) < 0; }));
  /* 不能胡页内部仍按数据 `status` 归进现有三类；空类别整节不出现。 */
  var CANT_WIN_GROUPS = [
    { titleKey: "catStructure", textKey: "catStructureText", statuses: ["WAITING", "STRUCTURE_INVALID"] },
    { titleKey: "catGate", textKey: "catGateText", statuses: ["STRUCTURE_VALID", "VARIANT_GATE_FAILED", "FAN_NOT_SHOWN"] },
    { titleKey: "catInsufficient", textKey: "catInsufficientText", statuses: ["SCORE_REQUIRED", "VARIANT_NOT_FIXED"] }
  ];
  /* The eye is a topic, not a four-state bucket: its members are curated by the
      UX contract (E02 has the eye, E16 shows the eye is a pair not similar numbers,
      E03 has no pair). Declared once as a named constant, not inline in a template. */
  var STRUCTURE_DEMO_ID = "E02";
  var QUESTION_SCREENS = { whatIsFan: "qFan", whatIsEye: "qEye", whenCanWin: "qWin", whyCannotWin: "qCantWin" };

  /* ------------------------------ state ------------------------------ */
  var state = {
    theme: "SYSTEM",
    lang: "FOLLOW_SYSTEM",
    stack: [{ screen: "home", params: {} }],
    search: "",
    selectedExample: null,
    speedProfile: "HN_FAN_REFERENCE",
    expanded: {},
    details: {},
    favorites: {},
    scroll: {},
    viewed: [],
    seat: { names: [null, null, null, null], dealer: null, round: 1, dir: 1 },
    seatMsg: null,
    seatFlash: false
  };

  /* --------------------------- persistence --------------------------- */
  function readPref(k, fallback) {
    try { var v = localStorage.getItem(k); return v === null ? fallback : v; } catch (e) { return fallback; }
  }
  function writePref(k, v) {
    try { localStorage.setItem(k, v); } catch (e) { /* prototype: ignore */ }
  }
  function saveSeat() {
    writePref("p046.seat", JSON.stringify({ n: state.seat.names, d: state.seat.dealer, r: state.seat.round, w: state.seat.dir }));
  }
  function loadSeat() {
    var raw = readPref("p046.seat", null);
    if (!raw) return;
    try {
      var o = JSON.parse(raw);
      if (!o || typeof o !== "object") return;
      if (Array.isArray(o.n) && o.n.length === 4) {
        state.seat.names = o.n.map(function (x) { return typeof x === "string" ? x.slice(0, 24) : null; });
      }
      state.seat.dealer = (typeof o.d === "number" && o.d >= 0 && o.d < 4) ? Math.floor(o.d) : null;
      state.seat.round = (typeof o.r === "number" && o.r >= 1) ? Math.floor(o.r) : 1;
      state.seat.dir = (o.w === -1) ? -1 : 1;
    } catch (e) { /* prototype: ignore */ }
  }
  function seatDefaultName(slot) {
    var d = T().seatDefaults;
    return (d && d[slot]) || "";
  }
  function seatNameOf(slot) {
    var n = state.seat.names[slot];
    return (n === null || n === undefined || n === "") ? seatDefaultName(slot) : n;
  }
  /* 显示用名字：没填就回落到中性占位「座位 N」，绝不臆测「我是谁」 */
  function seatNameDisplay(slot) {
    var nm = seatNameOf(slot);
    if (nm) return nm;
    return (T().ui.seatPlaceholder || "").replace("{n}", String(slot + 1));
  }
  function hasDealer() {
    return state.seat.dealer !== null && state.seat.dealer !== undefined;
  }
  function seatWind(slot) {
    var base = hasDealer() ? state.seat.dealer : 0;
    return WIND_AT_DEALER[((slot - base) % 4 + 4) % 4];
  }
  var seatFlashTimer = null;
  function flashDealer() {
    state.seatFlash = true;
    if (seatFlashTimer) window.clearTimeout(seatFlashTimer);
    seatFlashTimer = window.setTimeout(function () {
      state.seatFlash = false;
      if (currentTop().screen === "seatmap") render();
    }, SEAT_FLASH_MS);
  }
  /* 轮转方向：1 ＝ 逆时针（往下家，默认），-1 ＝ 顺时针；非法值一律回 1。 */
  function seatDir() {
    return state.seat.dir === -1 ? -1 : 1;
  }
  function seatDoneText() {
    if (!state.seatMsg) return "";
    return T().ui.seatDoneMsg
      .replace("{n}", function () { return String(state.seatMsg.round); })
      .replace("{name}", function () { return seatNameDisplay(state.seatMsg.slot); });
  }
  function refreshSeatNames() {
    var dv = document.querySelector(".seat-dealer-name");
    if (dv) dv.textContent = hasDealer() ? seatNameDisplay(state.seat.dealer) : T().ui.seatDealerUnset;
    var msgEl = document.querySelector(".simnote");
    if (msgEl && state.seatMsg) msgEl.textContent = seatDoneText();
  }

  /* --------------------------- detection ---------------------------- */
  function detectSystemLang() {
    var raw = (navigator.language || (navigator.languages && navigator.languages[0]) || "zh-CN");
    var lc = String(raw).toLowerCase();
    if (lc.indexOf("zh") === 0) return { lang: "zh-CN", supported: true, raw: raw };
    if (lc.indexOf("en") === 0) return { lang: "en", supported: true, raw: raw };
    return { lang: "zh-CN", supported: false, raw: raw };
  }
  function effLang() {
    var want = (state.lang === "FOLLOW_SYSTEM") ? detectSystemLang().lang : state.lang;
    /* Unsupported or corrupted stored preference must never blank the app:
       fall back to the system language, and then to zh-CN. */
    if (want && I18N[want]) return want;
    var sys = detectSystemLang().lang;
    return (sys && I18N[sys]) ? sys : "zh-CN";
  }
  function systemDark() {
    return !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
  }
  function effTheme() {
    if (state.theme === "SYSTEM") return systemDark() ? "dark" : "light";
    return state.theme === "DARK" ? "dark" : "light";
  }
  function T() { return I18N[effLang()] || I18N["zh-CN"]; }

  /* ----------------------------- helpers ----------------------------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  /* Tile alt-text word tables live in i18n.js (tileNames); app.js never branches on language. */
  function tileAlt(code) {
    var tn = T().tileNames;
    if (!tn) return code;
    if (/^[WPS]\d$/.test(code)) {
      var n = parseInt(code.slice(1), 10);
      var num = (tn.num && tn.num[n]) || String(n);
      var suit = tn.suit[code.charAt(0)] || code.charAt(0);
      return num + (tn.suitSep || "") + suit;
    }
    if (tn.z && tn.z[code]) return tn.z[code];
    if (tn.f && tn.f[code]) return tn.f[code] + (tn.flowerSuffix || "");
    return code;
  }
  /* 花牌（F1–F8）：牌图里画着橙框和贴底的小字，小白看不懂。
     改成「牌面＋居中大字」，字占牌面约九成，深浅色自适应（样式见 app.css .tile--text）；
     春夏秋冬梅兰竹菊八个字由 FLOWER_CHAR 提供，其它牌仍用牌图。 */
  function isFlower(code) { return /^F\d$/.test(code); }
  function tileImg(code, cls) {
    var extra = cls ? " " + cls : "";
    if (isFlower(code)) {
      return '<span class="tile tile--text' + extra + '" role="img" aria-label="' + esc(tileAlt(code)) + '">' + esc(FLOWER_CHAR[code] || code) + '</span>';
    }
    return '<img class="tile' + extra + '" src="assets/tiles/' + code + '.png" alt="' + esc(tileAlt(code)) + '">';
  }
  function tilesRow(codes, cls) {
    return '<div class="tiles">' + codes.map(function (c) { return tileImg(c, cls); }).join("") + "</div>";
  }
  function profileById(id) { for (var i = 0; i < RULES.profiles.length; i++) { if (RULES.profiles[i].id === id) return RULES.profiles[i]; } return null; }
  function exampleById(id) { for (var i = 0; i < EXAMPLES.examples.length; i++) { if (EXAMPLES.examples[i].id === id) return EXAMPLES.examples[i]; } return null; }
  function examplesByIds(ids) {
    return ids.map(exampleById).filter(function (e) { return !!e; });
  }
  function focusExampleItem(id) {
    var el = document.getElementById("ex-item-" + id);
    if (!el) return;
    if (el.scrollIntoView) { try { el.scrollIntoView({ block: "nearest" }); } catch (e) { el.scrollIntoView(); } }
  }
  function profilesOfRegion(regionKey) { return RULES.profiles.filter(function (p) { return p.region_key === regionKey; }); }
  function exText(ex) {
    var t = T().examples[ex.id] || {};
    return { title: t.title || ex.title, why: t.why || ex.explanation, gap: t.gap || ex.next_condition, verdict: t.verdict };
  }
  function profText(p) {
    var t = T().profiles[p.id] || {};
    return { name: t.name || p.name, region: t.region || p.region, win_structure: t.win_structure || p.win_structure, win_gate: t.win_gate || p.win_gate, caveat: t.caveat || p.caveat };
  }
  function gradeText(g) { return T().grades[g] || g; }
  function stateLabel(s) { return T().states[s] || s; }
  function markViewed(kind, id) {
    var key = kind + ":" + id;
    state.viewed = state.viewed.filter(function (x) { return x !== key; });
    state.viewed.unshift(key);
    if (state.viewed.length > 12) state.viewed.length = 12;
  }

  /* De-jargon: user-layer names/labels. Internal IDs, versions, evidence grades and
     source codes live only in the collapsed "想较真" secondary area. */
  function profDisplay(p) {
    if (!p) return "";
    var pt = T().profiles[p.id];
    return (pt && pt.short_name) || profText(p).name;
  }
  function seatLabel(code) { return (T().seats && T().seats[code]) || code; }
  /* 大屏只用单字方位（东/南/西/北 · East/South/West/North），比座次表的「东位」更省空间、更远可辨。 */
  function tableWindChar(wind) { var w = T().tableWinds; return (w && w[wind]) || wind; }
  function suitLabel(code) { var s = T().suits; return (s && s[code]) || code; }
  function exampleSituation(ex) {
    var t = T();
    var prof = profileById(ex.profile_id);
    var region = prof
      ? (t.regions[prof.region_key] || (t.profiles[prof.id] && t.profiles[prof.id].region) || "")
      : t.ui.situationGeneric;
    var ctx = ex.context || {};
    var parts = [region];
    if (ctx.seat) parts.push(seatSituationSeat(ctx.seat));
    if (ctx.declared_missing_suit) parts.push(t.ui.missingSuitShort + suitLabel(ctx.declared_missing_suit));
    var srcShort = { self_draw: t.ui.selfdrawShort, ordinary_discard: t.ui.discardShort };
    if (ctx.last_tile_source && srcShort[ctx.last_tile_source]) parts.push(srcShort[ctx.last_tile_source]);
    return parts.filter(function (x) { return !!x; }).join(" \u00B7 ");
  }
  function metaDisclosure(key, titleText, rows) {
    var open = !!state.details[key];
    var bodyId = "meta-" + String(key).replace(/[^A-Za-z0-9_-]/g, "-");
    var inner = rows.map(function (r) {
      return '<div class="kv"><div class="kv__k">' + esc(r[0]) + '</div><div class="kv__v">' + r[1] + '</div></div>';
    }).join("");
    return '<div class="meta' + (open ? " meta--open" : "") + '">' +
      '<button class="meta__head" data-act="details" data-key="' + esc(key) + '" aria-expanded="' + (open ? "true" : "false") + '" aria-controls="' + esc(bodyId) + '">' +
        '<span class="meta__caret" aria-hidden="true">' + (open ? "\u25BE" : "\u25B8") + '</span>' +
        '<span class="meta__title">' + esc(titleText) + '</span>' +
      '</button>' +
      (open ? '<div class="meta__body" id="' + esc(bodyId) + '">' + inner + '</div>' : "") +
    '</div>';
  }

  /* --------------------------- navigation ---------------------------- */
  function roundTable(opts) {
    opts = opts || {};
    var t = T();
    var dsel = hasDealer();
    var cells = [0, 1, 2, 3].map(function (slot) {
      var pos = SEAT_POS[slot];
      var wind = seatWind(slot);
      var dealerSeat = dsel && slot === state.seat.dealer;
      var nm = seatNameOf(slot);
      var ph = (t.ui.seatPlaceholder || "").replace("{n}", String(slot + 1));
      var nameHtml = opts.editable
        ? '<input class="seat__name" data-act="seat-name" data-slot="' + slot + '" type="text" maxlength="16" value="' + esc(nm) + '" placeholder="' + esc(ph) + '" aria-label="' + esc(t.ui.seatNameLabel + " " + seatLabel(wind)) + '">'
        : '<div class="seat__name seat__name--static">' + esc(seatNameDisplay(slot)) + '</div>';
      var pickAttr = opts.editable ? ' data-act="seat-pick-dealer" data-slot="' + slot + '" aria-label="' + esc(t.ui.seatPickAria) + '"' : "";
      /* 这个位子生效的两朵花直接画在座位卡上，跟着方位（庄家轮转）一起跳；
         小白第一时间就能对着人说出「你这个位子认哪两朵花」，不用去别处查表。 */
      var fl = seatFlowers(wind);
      var flowerHtml = fl.length
        ? '<div class="seat__flowers">' + fl.map(function (c) {
            if (opts.textFlowers) {
              return '<span class="tile tile--text tile--seatflower" role="img" aria-label="' + esc(tileAlt(c)) + '">' + esc(FLOWER_CHAR[c] || c) + '</span>';
            }
            return tileImg(c, "tile--seatflower");
          }).join("") + '</div>'
        : "";
      return '<div class="seat seat--' + pos + (dealerSeat ? " seat--dealer" : "") + (dealerSeat && opts.flash ? " seat--flash" : "") + (opts.editable ? " seat--pick" : "") + '"' + pickAttr + '>' +
        '<div class="seat__wind">' + esc(seatLabel(wind)) + '</div>' +
        (dealerSeat ? '<div class="seat__tag">' + esc(t.ui.seatDealerTag) + '</div>' : "") +
        nameHtml +
        flowerHtml +
      '</div>';
    }).join("");
    return '<div class="roundtable">' +
      '<div class="roundtable__legend small">' + esc(t.ui.seatLegend) + '</div>' +
      '<div class="roundtable__grid">' + cells +
        '<div class="roundtable__center">' +
          '<div class="roundtable__r">' + esc(t.ui.seatRound.replace("{n}", String(state.seat.round))) + '</div>' +
          '<div class="roundtable__hint">' + esc(t.ui.seatCenter) + '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function seatSituationSeat(code) {
    var t = T();
    return seatLabel(code) + (code === "东" ? t.ui.seatAsDealer : "");
  }

  function seatJumpBtn(code) {
    var t = T();
    var label = (code === "东" ? t.ui.seatJumpDealer : t.ui.seatJump).replace("{wind}", seatLabel(code));
    return '<button class="seatlink" data-act="seatmap" data-seat-focus="dealer">' + esc(label) + '</button>';
  }

  /* --------------------------- navigation ---------------------------- */
  function keyOf(top) { return top.screen + ":" + (top.params && (top.params.id || top.params.region || "") || ""); }
  function currentTop() { return state.stack[state.stack.length - 1]; }
  function go(screen, params, opts) {
    state.scroll[keyOf(currentTop())] = window.scrollY || 0;
    params = params || {};
    if (opts && opts.replace) state.stack[state.stack.length - 1] = { screen: screen, params: params };
    else state.stack.push({ screen: screen, params: params });
    render();
    window.scrollTo(0, 0);
  }
  function back() {
    if (state.stack.length > 1) {
      state.scroll[keyOf(currentTop())] = window.scrollY || 0;
      state.stack.pop();
      render();
      var top = currentTop();
      window.scrollTo(0, state.scroll[keyOf(top)] || 0);
    }
  }

  /* ------------------------------ chrome ----------------------------- */
  function shell(title, backable, content) {
    var t = T();
    return '' +
      '<div class="topbar">' +
        '<button class="iconbtn ' + (backable ? "" : "iconbtn--hidden") + '" data-act="back" aria-label="' + esc(t.ui.back) + '">\u2190</button>' +
        '<div class="topbar__title">' + esc(title) + '</div>' +
        '<button class="iconbtn" data-act="settings" aria-label="' + esc(t.ui.settings) + '">\u2699</button>' +
      '</div>' +
      '<main class="page">' + content + '</main>';
  }

  /* ------------------------------ screens ---------------------------- */
  var screens = {};

  /* 首页极简化：除品牌头外，只留「常见问题」与「小工具」两块，设置仍在右上角。
     搜索栏、看全部牌例入口、3 分钟速看、最近浏览一律不再出现在首页。 */
  screens.home = function () {
    var t = T();
    var questions = HOME_QUESTIONS.map(function (k) {
      var item = t.questions[k];
      return '<button class="listitem" data-act="question" data-q="' + esc(k) + '">' +
        '<div class="listitem__title">' + esc(item.title) + '</div>' +
        '<div class="listitem__sub">' + esc(item.desc) + '</div>' +
      '</button>';
    }).join("");

    var content = '' +
      '<div class="brand">' +
        '<div class="brand__logo"><img src="assets/brand/ic_logo_foreground.png" alt="' + esc(t.ui.appName) + '"></div>' +
        '<div><div class="brand__name">' + esc(t.ui.appName) + '</div><div class="brand__tag">' + esc(t.ui.tagline) + '</div></div>' +
      '</div>' +
      '<div class="section-title">' + esc(t.ui.sectionQuestions) + '</div>' +
      questions +
      '<div class="section-title">' + esc(t.ui.sectionTools) + '</div>' +
      '<button class="listitem" data-act="seatmap">' +
        '<div class="listitem__title">' + esc(t.ui.seatEntry) + '</div>' +
        '<div class="listitem__sub">' + esc(t.ui.seatEntrySub) + '</div>' +
      '</button>';
    return shell(t.ui.appName, false, content);
  };

  screens.profile = function (p) {
    var t = T();
    var prof = profileById(p.id);
    if (!prof) return shell(t.ui.appName, true, '<div class="notice">\u2014</div>');
    markViewed("profile", prof.id);
    var pt = profText(prof);
    var low = prof.evidence_grade === "C";
    var fav = !!state.favorites[prof.id];

    var exampleItems = (prof.example_ids || []).map(function (id) {
      var e = exampleById(id); if (!e) return "";
      var et = exText(e);
      return '<button class="listitem" data-act="example" data-example="' + esc(id) + '">' +
        '<div class="listitem__title">' + esc(et.title) + '</div>' +
        '<div class="listitem__sub">' + esc(stateLabel(e.state)) + " \u00B7 " + esc(e.tile_count + t.ui.tilesSuffix) + '</div>' +
      '</button>';
    }).join("");

    var termChips = ["eye", "run", "triplet", "pong", "kong", "flower", "missingSuit", "winTypes"].map(function (id) {
      return '<button class="chip" data-act="term" data-term="' + esc(id) + '">' + esc(t.terms[id].name) + '</button>';
    }).join("");

    var content = '' +
      '<div class="card">' +
        '<div class="card__title">' + esc(profDisplay(prof)) + '</div>' +
        '<div class="small mt8">' + esc(t.regions[prof.region_key]) + '</div>' +
      '</div>' +
      (low ? '<div class="graycard">' + esc(t.ui.lowConfidence) + '</div>' : "") +
      '<div class="card">' +
        '<div class="kv"><div class="kv__k">' + esc(t.ui.tileCount) + '</div><div class="kv__v">' + esc(prof.tile_count) + '</div></div>' +
        '<div class="kv"><div class="kv__k">' + esc(t.ui.allowChi) + '</div><div class="kv__v">' + esc(prof.allow_chi ? t.ui.allowed : t.ui.notAllowed) + '</div></div>' +
        '<div class="kv"><div class="kv__k">' + esc(t.ui.winStructure) + '</div><div class="kv__v">' + esc(pt.win_structure) + '</div></div>' +
        '<div class="kv"><div class="kv__k">' + esc(t.ui.winGate) + '</div><div class="kv__v">' + esc(pt.win_gate) + '</div></div>' +
      '</div>' +
      '<button class="bigbtn bigbtn--ghost" data-act="speedview" data-profile="' + esc(prof.id) + '">' + esc(t.ui.profileSpeedview) + '</button>' +
      '<div class="section-title">' + esc(t.ui.askThreeTitle) + '</div>' +
      '<div class="card">' +
        '<div class="kv"><div class="kv__k">1</div><div class="kv__v">' + esc(t.ui.askThree1) + '</div></div>' +
        '<div class="kv"><div class="kv__k">2</div><div class="kv__v">' + esc(t.ui.askThree2) + '</div></div>' +
        '<div class="kv"><div class="kv__k">3</div><div class="kv__v">' + esc(t.ui.askThree3) + '</div></div>' +
        '<button class="bigbtn ' + (fav ? "bigbtn--primary" : "bigbtn--ghost") + ' mt8" data-act="fav" data-profile="' + esc(prof.id) + '">' + esc(fav ? t.ui.collected : t.ui.collect) + '</button>' +
        '<div class="small mt8">' + esc(t.ui.collectNote) + '</div>' +
      '</div>' +
      '<div class="section-title">' + esc(t.ui.profileExamples) + '</div>' +
      (exampleItems || '<div class="notice">' + esc(t.ui.noProfileExample) + '</div>') +
      '<div class="section-title">' + esc(t.ui.profileTerms) + '</div>' +
      '<div class="chiprow">' + termChips + '</div>' +
      '<div class="spacer"></div>';
    return shell(profDisplay(prof), true, content);
  };

  screens.speedview = function (p) {
    var t = T();
    var prof = profileById(p.id || state.speedProfile) || RULES.profiles[0];
    state.speedProfile = prof.id;
    var pt = profText(prof);
    var body = '' +
      '<div class="card">' +
        '<div class="card__title">' + esc(profDisplay(prof)) + '</div>' +
        '<div class="kv"><div class="kv__k">' + esc(t.ui.tileCount) + '</div><div class="kv__v">' + esc(prof.tile_count) + '</div></div>' +
        '<div class="kv"><div class="kv__k">' + esc(t.ui.allowChi) + '</div><div class="kv__v">' + esc(prof.allow_chi ? t.ui.allowed : t.ui.notAllowed) + '</div></div>' +
        '<div class="kv"><div class="kv__k">' + esc(t.ui.winStructure) + '</div><div class="kv__v">' + esc(pt.win_structure) + '</div></div>' +
        '<div class="kv"><div class="kv__k">' + esc(t.ui.winGate) + '</div><div class="kv__v">' + esc(pt.win_gate) + '</div></div>' +
        '<div class="kv"><div class="kv__k">' + esc(t.ui.caveat) + '</div><div class="kv__v">' + esc(pt.caveat) + '</div></div>' +
      '</div>' +
      '<div class="card">' +
        '<div class="card__title">' + esc(t.ui.profileExamples) + '</div>' +
        '<div class="small">' + esc(t.ui.hand) + '</div>' +
        tilesRow(["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8", "W9", "P1", "P1", "P1", "S2", "S2"]) +
        '<div class="small mt8">' + esc(t.quotes.levelHand) + '</div>' +
      '</div>' +
      (prof.evidence_grade === "C" ? '<div class="graycard"><div class="graycard__title">' + esc(t.ui.lowConfidence) + '</div>' + esc(pt.caveat) + '</div>' : "") +
      '<div class="spacer"></div>' +
      '<button class="bigbtn bigbtn--ghost" data-act="profile" data-profile="' + esc(prof.id) + '">' + esc(t.ui.speedToProfile) + '</button>';
    return shell(t.ui.speedTitle, true, body);
  };

  /* --- S5: question routing entry (3 questions + term-glossary entry only) --- */
  screens.questions = function () {
    var t = T();
    var cards = HOME_QUESTIONS.map(function (k) {
      var item = t.questions[k];
      return '<button class="listitem" data-act="question" data-q="' + esc(k) + '">' +
        '<div class="listitem__title">' + esc(item.title) + '</div>' +
        '<div class="listitem__sub">' + esc(item.desc) + '</div>' +
      '</button>';
    }).join("");
    var termsEntry = '<button class="listitem" data-act="terms">' +
      '<div class="listitem__title">' + esc(t.ui.termsEntry) + '</div>' +
      '<div class="listitem__sub">' + esc(t.ui.termsEntrySub) + '</div>' +
    '</button>';
    var allEntry = '<button class="listitem" data-act="examples">' +
      '<div class="listitem__title">' + esc(t.ui.allExamples) + '</div>' +
      '<div class="listitem__sub">' + esc(t.ui.allExamplesSub) + '</div>' +
    '</button>';
    return shell(t.ui.sectionQuestions, true,
      '<div class="notice">' + esc(t.ui.qRoutingScope) + '</div>' +
      '<div class="section-title">' + esc(t.ui.sectionQuestions) + '</div>' + cards +
      '<div class="section-title">' + esc(t.ui.sectionTerms) + '</div>' + termsEntry +
      '<div class="section-title">' + esc(t.ui.exampleList) + '</div>' + allEntry);
  };

  /* --- S6: full term glossary (moved off the questions page; question pages link here) --- */
  screens.terms = function () {
    var t = T();
    var recentIds = state.viewed.filter(function (x) { return x.indexOf("term:") === 0; })
      .map(function (x) { return x.slice(5); }).slice(0, 4);
    var recent = "";
    if (recentIds.length) {
      recent = '<div class="section-title">' + esc(t.ui.searchRecent) + '</div>' +
        recentIds.map(function (id) {
          var tt = t.terms[id]; if (!tt) return "";
          return '<button class="listitem" data-act="term" data-term="' + esc(id) + '"><div class="listitem__title">' + esc(tt.name) + '</div></button>';
        }).join("");
    }
    var terms = TERM_ORDER.map(function (id) {
      return '<button class="listitem" data-act="term" data-term="' + esc(id) + '"><div class="listitem__title">' + esc(t.terms[id].name) + '</div><div class="listitem__sub">' + esc(t.terms[id].desc) + '</div></button>';
    }).join("");
    return shell(t.ui.sectionTerms, true,
      '<div class="section-title">' + esc(t.ui.sectionTerms) + '</div>' +
      terms + recent);
  };

  screens.seatmap = function () {
    var t = T();
    var s = state.seat;
    var dealerName = hasDealer() ? seatNameDisplay(s.dealer) : t.ui.seatDealerUnset;
    var msg = seatDoneText();

    var content = '' +
      '<div class="seatpage">' +
        '<button class="bigbtn bigbtn--primary" data-act="tablemode">' + esc(t.ui.tableEntry) + '</button>' +
        '<div class="notice mt16">' + esc(t.ui.seatIntro) + '</div>' +
        '<div class="card mt16">' +
          '<div class="card__title">' + esc(t.ui.seatRound.replace("{n}", String(s.round))) + '</div>' +
          '<div class="kv"><div class="kv__k">' + esc(t.ui.seatDealerLabel) + '</div><div class="kv__v seat-dealer-name">' + esc(dealerName) + '</div></div>' +
          '<div class="small mt8">' + esc(t.ui.seatRuleNote) + '</div>' +
        '</div>' +
        roundTable({ editable: true, flash: state.seatFlash, textFlowers: true }) +
        '<div class="small mt8" style="text-align:center">' + esc(t.ui.seatPickHint) + '</div>' +
        '<button class="bigbtn bigbtn--primary seat-next-btn mt8" data-act="seat-next">' + esc(t.ui.seatNextBtn) + '</button>' +
        (msg ? '<div class="simnote mt8" role="status">' + esc(msg) + '</div>' : "") +
        '<button class="bigbtn bigbtn--ghost mt8" data-act="seat-reset">' + esc(t.ui.seatReset) + '</button>' +
        '<button class="bigbtn bigbtn--ghost mt8" data-act="seat-dir">' + esc(seatDir() === 1 ? t.ui.seatDirCCW : t.ui.seatDirCW) + '</button>' +
        '<div class="notice mt16">' + esc(t.ui.seatBoundary) + '</div>' +
      '</div>';
    return shell(t.ui.seatTitle, true, content);
  };

  /* --- 牌桌大屏（投屏用）：只加这一屏，别的页面不动 ---
     一屏 100dvh 放下：顶部局数/庄家大字 → 2×2 四座占满剩余 → 底部「下一局」常驻。
     与座次表共用同一份 state.seat / SEAT_FLOWERS，点座位＝设庄家（局数归 1），点下一局＝轮转＋1；
     只做展示＋点庄家＋下一局，放不下名字输入/方向开关/重置等与投屏无关的东西。 */
  screens.tablemode = function (p, backable) {
    var t = T();
    var dealerName = hasDealer() ? seatNameDisplay(state.seat.dealer) : t.ui.seatDealerUnset;
    var roundLine = t.ui.tableRoundDealer
      .replace("{n}", function () { return String(state.seat.round); })
      .replace("{name}", function () { return dealerName; });
    var cells = [0, 1, 2, 3].map(function (slot) {
      var wind = seatWind(slot);
      var dealerSeat = hasDealer() && slot === state.seat.dealer;
      var fl = seatFlowers(wind);
      var flowerHtml = fl.length
        ? '<div class="tseat__flowers">' + fl.map(function (c) { return tileImg(c, "tseat__flower"); }).join("") + '</div>'
        : "";
      return '<button class="tseat' + (dealerSeat ? " tseat--dealer" : "") + '" data-act="seat-pick-dealer" data-slot="' + slot + '" aria-label="' + esc(t.ui.seatPickAria) + '">' +
        '<div class="tseat__wind">' + esc(tableWindChar(wind)) + '</div>' +
        (dealerSeat ? '<div class="tseat__tag">' + esc(t.ui.seatDealerTag) + '</div>' : "") +
        '<div class="tseat__name">' + esc(seatNameDisplay(slot)) + '</div>' +
        flowerHtml +
      '</button>';
    }).join("");
    return '' +
      '<div class="topbar">' +
        '<button class="iconbtn ' + (backable ? "" : "iconbtn--hidden") + '" data-act="back" aria-label="' + esc(t.ui.back) + '">\u2190</button>' +
        '<div class="topbar__title">' + esc(t.ui.tableTitle) + '</div>' +
        '<span class="iconbtn iconbtn--hidden" aria-hidden="true"></span>' +
      '</div>' +
      '<main class="tpage">' +
        '<div class="ttop">' + esc(roundLine) + '</div>' +
        '<div class="tgrid">' + cells + '</div>' +
        '<button class="bigbtn bigbtn--primary tnext" data-act="seat-next">' + esc(t.ui.seatNextBtn) + '</button>' +
      '</main>';
  };

  /* --- 四个问题页（qFan / qWin / qCantWin / qEye）：全展开 · 零术语 · 零跳转 ---
     不用手风琴、不放任何跳转按钮；每个案例直接摊开：
     一句大白话结论 → 牌图 → 为什么（术语就地用大白话解释）。 */
  function renderExampleFlat(ex) {
    var t = T();
    var et = exText(ex);
    var meta = STATE_META[ex.state] || STATE_META.conditional;
    var ctx = ex.context || {};
    var handHtml = '<div class="tiles">' + ex.hand.map(function (c) { return tileImg(c); }).join("") + '</div>';
    var flowerHtml = ctx.bonus_flower
      ? '<div class="flowerbox"><div class="flowerbox__label">' + esc(t.ui.flowerArea) + '</div>' + tilesRow([ctx.bonus_flower]) + '</div>'
      : "";
    var meldsHtml = "";
    if (ctx.open_melds && ctx.open_melds.length) {
      var codes = ctx.open_melds.join(",").split(",").filter(Boolean);
      meldsHtml = '<div class="mt8"><div class="small">' + esc(t.ui.openMelds) + '</div>' + tilesRow(codes) + '</div>';
    }
    var seatHtml = ctx.seat
      ? '<div class="small mt8">' + esc(t.ui.seatYou.replace("{wind}", seatSituationSeat(ctx.seat))) + '</div>'
      : "";
    var verdict = et.verdict || stateLabel(ex.state);
    return '<div class="example-flat" id="ex-item-' + esc(ex.id) + '">' +
      '<div class="conclusion conclusion--' + meta.cls + '"><span class="conclusion__icon">' + meta.icon + '</span><span>' + esc(verdict) + '</span></div>' +
      '<div class="small">' + esc(et.title) + '</div>' +
      '<div class="small mt8">' + esc(t.ui.hand) + '</div>' + handHtml +
      flowerHtml + meldsHtml + seatHtml +
      '<div class="section-title" style="margin:14px 4px 6px">' + esc(t.ui.why) + '</div>' +
      '<div>' + esc(et.why) + '</div>' +
    '</div>';
  }
  function flatList(list) { return list.map(renderExampleFlat).join(""); }
  function flatExamples(ids) { return flatList(examplesByIds(ids)); }
  function trioBox(label, codes, numLine) {
    return '<div class="pairbox">' +
      '<div class="pairbox__label">' + esc(label) + '</div>' +
      tilesRow(codes) +
      (numLine ? '<div class="small mt8">' + esc(numLine) + '</div>' : "") +
    '</div>';
  }

  /* --- A: 什么情况下能胡 —— 一页到底，四条条件＋「能胡」案例摊开 --- */
  screens.qWin = function () {
    var t = T();
    var demo = exampleById(STRUCTURE_DEMO_ID);
    var eyePair = demo ? demo.hand.slice(-2) : ["S2", "S2"];

    var structure = '<div class="card">' +
      '<div>' + esc(t.qwin.structureText) + '</div>' +
      '<div class="small mt8">' + esc(t.qwin.structureDemoLabel) + '</div>' +
      (demo ? tilesRow(demo.hand) : "") +
      '<div class="small mt8">' + esc(t.qwin.termRun) + '</div>' +
      '<div class="small mt8">' + esc(t.qwin.termTriplet) + '</div>' +
      '<div class="small mt8">' + esc(t.qwin.termPair) + '</div>' +
      '<div class="notice mt8">' + esc(t.qwin.eyeEnding) + '</div>' +
    '</div>';

    var eye = '<div class="card">' +
      '<div>' + esc(t.qwin.eyeText) + '</div>' +
      '<div class="small mt8">' + esc(t.qwin.eyePairLabel) + '</div>' +
      tilesRow(eyePair) +
    '</div>';

    /* 独立小节「先搞懂一件事：番」：四条条件全靠番，先在这里把①是什么／②有什么用／③怎么来
       用大白话讲一遍；完整定义仍唯一位于 qFan 页 + 术语词条 fan。 */
    var fanPrereq = '<div class="card">' +
      '<div class="small">' + esc(t.qwin.fanWhatLabel) + '</div>' +
      '<div>' + esc(t.qwin.fanWhatText) + '</div>' +
      '<div class="small mt8">' + esc(t.qwin.fanUseLabel) + '</div>' +
      '<div>' + esc(t.qwin.fanUseText) + '</div>' +
      '<div class="small mt8">' + esc(t.qwin.fanFromLabel) + '</div>' +
      '<div>' + esc(t.qwin.fanFromText) + '</div>' +
      '<div class="small mt8">' + esc(t.qwin.fanTilesLabel) + '</div>' +
      tilesRow(t.terms.fan.tiles) +
      '<div class="notice mt8">' + esc(t.qwin.fanBoundary) + '</div>' +
    '</div>';

    /* 条件一：牌面 2/5/8 × 花色 万/筒/条 ＝ 9 组，单行横向滚动（左右滑）；
       每卡「X做眼」标签＋一对牌图，标签自带数字，不再重复「数字：X」。 */
    var C1_SUITS = ["W", "P", "S"];
    var C1_FACES = [2, 5, 8];
    var c1Boxes = C1_SUITS.map(function (suitKey, r) {
      return C1_FACES.map(function (face, c) {
        var idx = r * 3 + c + 1;
        return trioBox(t.qwin["c1Label" + idx], [suitKey + face, suitKey + face], "");
      }).join("");
    }).join("");
    var c1SuitLine = t.qwin.c1SuitRow
      .replace("{suits}", C1_SUITS.map(function (k) { return t.suits[k]; }).join(" / "));

    var cond1 = '<div class="card">' +
      '<div class="card__title">' + esc(t.qwin.c1Title) + '</div>' +
      '<div class="small mt8">' + esc(t.qwin.c1Text) + '</div>' +
      '<div class="small mt8">' + esc(c1SuitLine) + '</div>' +
      '<div class="c1grid mt8">' + c1Boxes + '</div>' +
      '<div class="notice mt8">' + esc(t.qwin.c1Fan) + '</div>' +
    '</div>';

    /* 条件二：四个位子 × 各自对应的花，一行一个位子全画出（四张风牌 ＋ 八朵花）。
       对应关系取自 SEAT_FLOWERS，保证两处一致。 */
    var c2Rows = SEAT_FLOWERS.map(function (row) {
      var seatName = seatLabel(row.wind) + (row.wind === "东" ? t.ui.seatAsDealer : "");
      var flowerCells = row.flowers.map(function (code) {
        var fn = (t.tileNames && t.tileNames.f && t.tileNames.f[code]) || tileAlt(code);
        return '<div class="c2flower">' + tileImg(code) +
          '<div class="c2flower__name">' + esc(fn) + '</div></div>';
      }).join("");
      return '<div class="c2row">' +
        '<div class="c2row__seat">' + tileImg(row.windCode) +
          '<div class="c2row__main">' +
            '<div class="c2row__name">' + esc(seatName) + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="c2row__flowers">' + flowerCells + '</div>' +
      '</div>';
    }).join("");

    var cond2 = '<div class="card">' +
      '<div class="card__title">' + esc(t.qwin.c2Title) + '</div>' +
      '<div class="small mt8">' + esc(t.qwin.c2Text) + '</div>' +
      '<div class="flowerbox">' +
        '<div class="flowerbox__label">' + esc(t.qwin.c2Label) + '</div>' +
        '<div class="c2grid">' + c2Rows + '</div>' +
      '</div>' +
      '<div class="small mt8">' + esc(t.qwin.c2Note) + '</div>' +
    '</div>';

    /* 条件三：风牌 4 组（东/南/西/北）＋ 箭牌 3 组（中/发/白）＝ 7 组，全部画出。
       分组网格：风牌一组、箭牌一组，每组内最多 4 列 / 3 列，窄屏自动降列不横溢。 */
    var C3_GROUPS = [
      { titleKey: "c3WindTitle", codes: ["Z1", "Z2", "Z3", "Z4"], start: 1 },
      { titleKey: "c3DragonTitle", codes: ["Z5", "Z6", "Z7"], start: 5 }
    ];
    var c3GroupsHtml = C3_GROUPS.map(function (g) {
      var boxes = g.codes.map(function (code, i) {
        return trioBox(t.qwin["c3Label" + (g.start + i)], [code, code, code], "");
      }).join("");
      return '<div class="c3group">' +
        '<div class="c1row__suit">' + esc(t.qwin[g.titleKey]) + '</div>' +
        '<div class="c3grid">' + boxes + '</div>' +
      '</div>';
    }).join("");

    var cond3 = '<div class="card">' +
      '<div class="card__title">' + esc(t.qwin.c3Title) + '</div>' +
      '<div class="small mt8">' + esc(t.qwin.c3Text) + '</div>' +
      '<div class="mt8">' + c3GroupsHtml + '</div>' +
      '<div class="small mt8">' + esc(t.qwin.c3Note) + '</div>' +
    '</div>';

    var cond4 = '<div class="card">' +
      '<div class="card__title">' + esc(t.qwin.c4Title) + '</div>' +
      '<div class="small mt8">' + esc(t.qwin.c4Text) + '</div>' +
      '<div class="sidebyside mt8">' +
        '<div class="pairbox"><div class="pairbox__label">' + esc(t.qwin.c4YesLabel) + '</div>' + tilesRow(["S2", "S2"]) +
          '<div class="small mt8">' + esc(t.qwin.c4YesText) + '</div></div>' +
        '<div class="pairbox"><div class="pairbox__label">' + esc(t.qwin.c4NoLabel) + '</div>' + tilesRow(["S3", "S3"]) +
          '<div class="small mt8">' + esc(t.qwin.c4NoText) + '</div></div>' +
      '</div>' +
      '<div class="small mt8">' + esc(t.qwin.dianpaoText) + '</div>' +
      '<div class="small mt8">' + esc(t.qwin.zimoText) + '</div>' +
    '</div>';

    return shell(t.questions.whenCanWin.title, true,
      '<div class="notice">' + esc(t.qwin.intro) + '</div>' +
      '<div class="section-title">' + esc(t.qwin.structureTitle) + '</div>' +
      structure +
      '<div class="section-title">' + esc(t.qwin.eyeTitle) + '</div>' +
      eye +
      '<div class="section-title">' + esc(t.qwin.fanTitle) + '</div>' +
      fanPrereq +
      '<div class="section-title">' + esc(t.qwin.condTitle) + '</div>' +
      '<div class="section-hint">' + esc(t.qwin.condScope) + '</div>' +
      cond1 + cond2 + cond3 + cond4 +
      '<div class="subsection-head">' +
        '<div class="subsection-head__eyebrow">' + esc(t.qwin.examplesEyebrow) + '</div>' +
        '<div class="subsection-head__title">' + esc(t.qwin.examplesTitle) + '</div>' +
      '</div>' +
      '<div class="section-hint">' + esc(t.qwin.examplesScope) + '</div>' +
      '<div class="subsection-body">' + flatExamples(WIN_IDS) + '</div>' +
      '<div class="spacer"></div>');
  };

  /* --- B: 为什么不能胡（结构/条件/依据不足三类，全部摊开） --- */
  screens.qCantWin = function () {
    var t = T();
    /* 开场小节「零」：13 张与 14 张的基础对照（纯讲解，判例由下面三类分派）。 */
    var basics = '<div class="section-title">' + esc(t.qcant.baseTitle) + '</div>' +
      '<div class="section-hint">' + esc(t.qcant.baseText) + '</div>';
    /* 案例池只取「非能胡」的那一批（与能胡页互斥），再按数据 `status` 归三类；
       没有案例的小节整节不出现（不留空壳）。 */
    var cantPool = examplesByIds(CANT_WIN_IDS);
    var groups = CANT_WIN_GROUPS.map(function (g) {
      var list = cantPool.filter(function (e) { return g.statuses.indexOf(e.status) >= 0; });
      if (!list.length) return "";
      return '<div class="section-title">' + esc(t.qcant[g.titleKey]) + '</div>' +
        '<div class="section-hint">' + esc(t.qcant[g.textKey]) + '</div>' +
        flatList(list);
    }).join("");
    return shell(t.questions.whyCannotWin.title, true,
      basics +
      groups +
      '<div class="spacer"></div>');
  };

  /* --- D: 什么是番（番的定义页；全展开、零跳转、零手风琴） --- */
  screens.qFan = function () {
    var t = T();
    var what = '<div class="card">' +
      '<div>' + esc(t.qfan.whatText) + '</div>' +
      '<div class="small mt8">' + esc(t.qfan.whatTilesLabel) + '</div>' +
      tilesRow(t.terms.fan.tiles) +
    '</div>';
    var use = '<div class="card">' +
      '<div>' + esc(t.qfan.useText) + '</div>' +
      '<div class="sidebyside mt8">' +
        '<div class="pairbox"><div class="pairbox__label">' + esc(t.qfan.useYesLabel) + '</div>' +
          '<div class="small">' + esc(t.qfan.useYesText) + '</div></div>' +
        '<div class="pairbox"><div class="pairbox__label">' + esc(t.qfan.useNoLabel) + '</div>' +
          '<div class="small">' + esc(t.qfan.useNoText) + '</div></div>' +
      '</div>' +
      '<div class="small mt8">' + esc(t.qfan.useScoreText) + '</div>' +
    '</div>';
    var from = '<div class="card">' +
      '<div>' + esc(t.qfan.fromText) + '</div>' +
      '<ul class="bullets mt8">' +
        '<li>' + esc(t.qfan.from1) + '</li>' +
        '<li>' + esc(t.qfan.from2) + '</li>' +
        '<li>' + esc(t.qfan.from3) + '</li>' +
      '</ul>' +
    '</div>';
    return shell(t.questions.whatIsFan.title, true,
      '<div class="notice">' + esc(t.qfan.intro) + '</div>' +
      '<div class="section-title">' + esc(t.qfan.whatTitle) + '</div>' + what +
      '<div class="section-title">' + esc(t.qfan.useTitle) + '</div>' + use +
      '<div class="section-title">' + esc(t.qfan.fromTitle) + '</div>' + from +
      '<div class="spacer"></div>');
  };

  /* --- C: 什么是眼（有眼/无眼对照＋与眼相关的案例，全部摊开） --- */
  screens.qEye = function () {
    var t = T();
    var hasEye = exampleById("E02");
    var noEye = exampleById("E03");
    var compare = '<div class="sidebyside">' +
      '<div class="pairbox"><div class="pairbox__label">' + esc(t.qeye.hasEyeTitle) + '</div>' +
        (hasEye ? tilesRow(hasEye.hand.slice(-2)) : "") +
        '<div class="small mt8">' + esc(t.qeye.hasEyeText) + '</div></div>' +
      '<div class="pairbox"><div class="pairbox__label">' + esc(t.qeye.noEyeTitle) + '</div>' +
        (noEye ? tilesRow(noEye.hand.slice(-2)) : "") +
        '<div class="small mt8">' + esc(t.qeye.noEyeText) + '</div></div>' +
    '</div>';
    return shell(t.questions.whatIsEye.title, true,
      '<div class="notice">' + esc(t.qeye.intro) + '</div>' +
      '<div class="section-title">' + esc(t.qeye.compareTitle) + '</div>' + compare +
      '<div class="spacer"></div>');
  };

  screens.term = function (p) {
    var t = T();
    var def = t.terms[p.id];
    if (!def) return shell(t.ui.termsTitle, true, '<div class="notice">\u2014</div>');
    markViewed("term", p.id);
    var body;
    if (def.roundTable) {
      body = '' +
        '<div class="card">' +
          '<div class="card__title">' + esc(def.name) + '</div>' +
          '<div>' + esc(def.desc) + '</div>' +
          (def.tiles && def.tiles.length ? '<div class="spacer"></div>' + tilesRow(def.tiles) : "") +
        '</div>' +
        roundTable({ editable: false }) +
        '<div class="card">' +
          '<ul class="bullets">' + (def.lines || []).map(function (ln) { return '<li>' + esc(ln) + '</li>'; }).join("") + '</ul>' +
          '<div class="small mt8">' + esc(def.note) + '</div>' +
        '</div>' +
        '<div class="notice">' + esc(t.ui.seatBoundary) + '</div>' +
        '<button class="bigbtn bigbtn--ghost mt8" data-act="seatmap">' + esc(def.openSeat || t.ui.termOpenSeat) + '</button>';
    } else if (def.unverified) {
      body = '' +
        '<div class="graycard">' +
          '<div class="graycard__title">' + esc(t.ui.unverifiedTerm) + '</div>' +
          esc(def.desc) +
        '</div>' +
        '<div class="card">' +
          '<div class="card__title">' + esc(def.name) + '</div>' +
          '<div class="flowerbox"><div class="flowerbox__label">' + esc(t.ui.flowerArea) + '</div>' + tilesRow(def.tiles) + '</div>' +
          '<div class="spacer"></div>' +
          '<div class="small">' + esc(t.terms.eye.name) + '</div>' +
          tilesRow(def.pair) +
          '<div class="small mt8">' + esc(t.ui.flowerEyeExplain) + '</div>' +
        '</div>';
    } else {
      var cls = "";
      var tiles = def.tiles;
      var highlight = def.highlight;
      var tilesHtml = '<div class="tiles">' + tiles.map(function (c) {
        var warn = highlight && c.charAt(0) === highlight ? "tile--warn" : "";
        return tileImg(c, warn);
      }).join("") + '</div>';
      body = '' +
        '<div class="card">' +
          '<div class="card__title">' + esc(def.name) + '</div>' +
          '<div>' + esc(def.desc) + '</div>' +
          '<div class="spacer"></div>' + tilesHtml +
          (def.lines && def.lines.length ? '<ul class="bullets mt8">' + def.lines.map(function (ln) { return '<li>' + esc(ln) + '</li>'; }).join("") + '</ul>' : "") +
          (def.note ? '<div class="small mt8">' + esc(def.note) + '</div>' : "") +
        '</div>';
    }
    return shell(def.name, true, body);
  };

  screens.examples = function (p) {
    var t = T();
    if (p.id) state.selectedExample = p.id;
    var q = state.search.trim().toLowerCase();
    var list = EXAMPLES.examples.filter(function (e) {
      if (!q) return true;
      return (e.id + " " + exText(e).title).toLowerCase().indexOf(q) >= 0;
    });
    var listHtml = renderExampleAccordion(list);

    var hint = "";
    if (!state.selectedExample) hint = '<div class="notice">' + esc(t.ui.examplePick) + '</div>';

    var body = '' +
      '<div class="searchbar"><span class="searchbar__icon">\u2315</span><input id="searchInput" data-act="search" type="text" value="' + esc(state.search) + '" placeholder="' + esc(t.ui.searchPlaceholder) + '" aria-label="' + esc(t.ui.searchTitle) + '"></div>' +
      '<div class="section-title">' + esc(t.ui.exampleList) + '</div>' + listHtml +
      hint;
    return shell(t.ui.exampleList, true, body);
  };

  function renderExampleAccordion(list) {
    var t = T();
    if (!list.length) return '<div class="notice">' + esc(t.ui.exampleNoMatch) + '</div>';
    return list.map(function (e) {
      var open = state.selectedExample === e.id;
      var headId = "ex-head-" + e.id;
      var bodyId = "ex-body-" + e.id;
      return '<div class="example-item' + (open ? " example-item--open" : "") + '" id="ex-item-' + esc(e.id) + '">' +
        '<button class="example-head" id="' + esc(headId) + '" data-act="example-toggle" data-example="' + esc(e.id) + '" aria-expanded="' + (open ? "true" : "false") + '" aria-controls="' + esc(bodyId) + '">' +
          '<span class="example-head__caret" aria-hidden="true">' + (open ? "\u25BE" : "\u25B8") + '</span>' +
          '<span class="example-head__main">' +
            '<span class="listitem__title">' + esc(exText(e).title) + '</span>' +
            '<span class="listitem__sub">' + esc(stateLabel(e.state)) + " \u00B7 " + esc(e.tile_count + t.ui.tilesSuffix) + '</span>' +
          '</span>' +
        '</button>' +
        (open ? '<div class="example-body" id="' + esc(bodyId) + '" role="region" aria-labelledby="' + esc(headId) + '">' + renderExampleDetail(e) + '</div>' : "") +
      '</div>';
    }).join("");
  }

  function renderExampleDetail(ex) {
    var t = T();
    var et = exText(ex);
    var meta = STATE_META[ex.state] || STATE_META.conditional;
    markViewed("example", ex.id);
    var ctx = ex.context || {};

    var handHtml = '<div class="tiles">' + ex.hand.map(function (c) {
      var warn = (ctx.declared_missing_suit && c.charAt(0) === ctx.declared_missing_suit) ? "tile--warn" : "";
      return tileImg(c, warn);
    }).join("") + '</div>';

    var flowerHtml = "";
    if (ctx.bonus_flower) {
      flowerHtml = '<div class="flowerbox"><div class="flowerbox__label">' + esc(t.ui.flowerArea) + '</div>' + tilesRow([ctx.bonus_flower]) + '</div>';
    }

    var meldsHtml = "";
    if (ctx.open_melds && ctx.open_melds.length) {
      var codes = ctx.open_melds.join(",").split(",").filter(Boolean);
      meldsHtml = '<div class="mt8"><div class="small">' + esc(t.ui.openMelds) + '</div>' + tilesRow(codes) + '</div>';
    }

    var srcOutcome = { self_draw: t.ui.selfdrawOutcome, ordinary_discard: t.ui.discardOutcome };
    var premiseRows = [];
    if (ctx.seat) premiseRows.push([t.ui.seat, seatLabel(ctx.seat)]);
    if (ctx.declared_missing_suit) premiseRows.push([t.ui.missingSuit, suitLabel(ctx.declared_missing_suit)]);
    if (ctx.last_tile_source) premiseRows.push([t.ui.lastTileSource, srcOutcome[ctx.last_tile_source] || t.ui.ruleUnknown]);
    if (ctx.missing_suit_rule) premiseRows.push([t.ui.missingSuitRuleLabel, (t.ruleValues && t.ruleValues[ctx.missing_suit_rule]) || t.ui.ruleUnknown]);
    if (ctx.bonus_flower) premiseRows.push([t.ui.flowerArea, tileAlt(ctx.bonus_flower)]);
    var premiseHtml = premiseRows.map(function (r) {
      return '<div class="kv"><div class="kv__k">' + esc(r[0]) + '</div><div class="kv__v">' + esc(r[1]) + '</div></div>';
    }).join("");
    var prof = profileById(ex.profile_id);

    var expandKey = ex.id;
    var open = !!state.expanded[expandKey];

    /* 「想较真」折叠区只留对用户有用的诚实边界（人话）；
       内部编号 / 状态码 / 来源编号 / 证据等级一律不对用户展示。 */
    var caveatText = prof ? profText(prof).caveat : "";
    var metaRows = [[t.ui.caveat, esc(caveatText || t.ui.lowConfidence)]];

    return '' +
      '<div class="card">' +
        '<div class="small">' + esc(exampleSituation(ex)) + '</div>' +
        (ctx.seat ? seatJumpBtn(ctx.seat) : "") +
        '<div class="conclusion conclusion--' + meta.cls + '"><span class="conclusion__icon">' + meta.icon + '</span><span>' + esc(et.verdict || stateLabel(ex.state)) + '</span></div>' +
        '<div class="small">' + esc(t.ui.hand) + '</div>' + handHtml +
        flowerHtml + meldsHtml +
        '<div class="section-title" style="margin:14px 4px 6px">' + esc(t.ui.why) + '</div><div>' + esc(et.why) + '</div>' +
        '<div class="section-title" style="margin:14px 4px 6px">' + esc(t.ui.gap) + '</div><div>' + esc(et.gap) + '</div>' +
      '</div>' +
      (premiseRows.length ? '<div class="card"><div class="card__title">' + esc(t.ui.premise) + '</div>' + premiseHtml + '</div>' : "") +
      '<div class="card">' +
        '<button class="bigbtn bigbtn--ghost" data-act="expand" data-example="' + esc(ex.id) + '">' + esc(t.ui.levelHand + " / " + t.ui.levelRegion) + (open ? " \u2212" : " +") + '</button>' +
        (open ? '<div class="mt8"><div class="small">' + esc(t.ui.levelHand) + '</div><div>' + esc(t.quotes.levelHand) + '</div><div class="small mt8">' + esc(t.ui.levelRegion) + '</div><div>' + esc(t.quotes.levelRegion) + '</div></div>' : "") +
      '</div>' +
      metaDisclosure("example:" + ex.id, t.ui.verifyTitle, metaRows);
  }

  screens.settings = function () {
    var t = T();
    var det = detectSystemLang();
    var themeNow = effTheme() === "dark" ? t.ui.dark : t.ui.light;
    var langNow = ({ "zh-CN": t.ui.zhCN, "en": t.ui.enUS })[effLang()] || t.ui.zhCN;

    function themed(val, label, code) {
      return '<button class="radio ' + (state.theme === val ? "radio--active" : "") + '" data-act="set-theme" data-val="' + val + '"><span class="radio__dot"></span><span class="radio__label">' + esc(label) + '</span><span class="radio__code">' + esc(code) + '</span></button>';
    }
    function langed(val, label, code) {
      return '<button class="radio ' + (state.lang === val ? "radio--active" : "") + '" data-act="set-lang" data-val="' + val + '"><span class="radio__dot"></span><span class="radio__label">' + esc(label) + '</span><span class="radio__code">' + esc(code) + '</span></button>';
    }

    var probe = det.raw + " \u2192 " + (det.lang === "en" ? "en" : "zh-CN") + (det.supported ? "" : " (" + t.ui.fallbackUsed + ")");

    var content = '' +
      '<div class="section-title">' + esc(t.ui.appearance) + '</div>' +
      '<div class="seg">' +
        themed("LIGHT", t.ui.light, "LIGHT") +
        themed("DARK", t.ui.dark, "DARK") +
        themed("SYSTEM", t.ui.system, "SYSTEM") +
      '</div>' +
      '<div class="card mt16"><div class="kv"><div class="kv__k">' + esc(t.ui.effectiveTheme) + '</div><div class="kv__v">' + esc(themeNow) + '</div></div></div>' +
      '<div class="simnote">' + esc(t.ui.noteTheme) + '</div>' +

      '<div class="section-title">' + esc(t.ui.language) + '</div>' +
      '<div class="seg">' +
        langed("FOLLOW_SYSTEM", t.ui.followSystem, "FOLLOW_SYSTEM") +
        langed("zh-CN", t.ui.zhCN, "zh-CN") +
        langed("en", t.ui.enUS, "en") +
      '</div>' +
      '<div class="card mt16">' +
        '<div class="kv"><div class="kv__k">' + esc(t.ui.effectiveLang) + '</div><div class="kv__v">' + esc(langNow) + '</div></div>' +
        '<div class="kv"><div class="kv__k">' + esc(t.ui.systemProbe) + '</div><div class="kv__v">' + esc(probe) + '</div></div>' +
      '</div>' +
      '<div class="simnote">' + esc(t.ui.noteLang) + '</div>' +
      '<div class="spacer"></div>' +
      '<div class="simnote">' + esc(t.ui.notePersist) + '</div>' +
      '<div class="spacer"></div>' +
      '<div class="notice">' + esc(t.ui.changeLangHint) + '</div>' +
      '<div class="spacer"></div>' +
      '<button class="bigbtn bigbtn--ghost" data-act="about">' + esc(t.ui.about) + '</button>';
    return shell(t.ui.settings, true, content);
  };

  screens.about = function () {
    var t = T();
    var srcs = RULES.sources.map(function (s) {
      var label = s.id; try { label = s.id + " \u00B7 " + new URL(s.url).host; } catch (e) {}
      var online = navigator.onLine;
      return '<div class="kv"><div class="kv__k">' + esc(s.id) + '</div><div class="kv__v"><a class="srclink ' + (online ? "" : "srclink--off") + '" href="' + esc(s.url) + '" target="_blank" rel="noopener noreferrer">' + esc(label) + '</a></div></div>';
    }).join("");
    var content = '' +
      '<div class="card"><div>' + esc(t.ui.aboutBody) + '</div></div>' +
      '<div class="graycard">' + esc(t.ui.aboutNonGamble) + '</div>' +
      '<div class="card"><div class="card__title">' + esc(t.ui.aboutSources) + '</div>' +
        '<div class="small">' + esc(gradeText("A")) + '</div>' +
        '<div class="small">' + esc(gradeText("B")) + '</div>' +
        '<div class="small">' + esc(gradeText("C")) + '</div>' +
        '<div class="spacer"></div>' + srcs +
      '</div>' +
      '<div class="card"><div class="kv"><div class="kv__k">' + esc(t.ui.aboutVersion) + '</div><div class="kv__v">' + esc(t.ui.versionValue) + '</div></div></div>';
    return shell(t.ui.about, true, content);
  };

  /* ------------------------------ render ----------------------------- */
  function applyRootAttrs() {
    var theme = effTheme();
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.setAttribute("lang", T().htmlLang);
  }

  function render() {
    applyRootAttrs();
    var top = currentTop();
    var fn = screens[top.screen] || screens.home;
    var backable = state.stack.length > 1;
    var appEl = document.getElementById("app");
    appEl.innerHTML = fn(top.params || {}, backable);
    appEl.className = "app" + (top.screen === "tablemode" ? " app--table" : "");
  }

  /* ------------------------------ events ----------------------------- */
  function handleAct(act, el) {
    switch (act) {
      case "back": back(); break;
      case "settings": pushScreen("settings"); break;
      case "about": pushScreen("about"); break;
      case "questions": pushScreen("questions"); break;
      case "profile": pushScreen("profile", { id: el.getAttribute("data-profile") }); break;
      case "example": {
        var navId = el.getAttribute("data-example");
        state.selectedExample = navId;
        pushScreen("examples", { id: navId });
        focusExampleItem(navId);
        break;
      }
      case "example-toggle": {
        var togId = el.getAttribute("data-example");
        if (state.selectedExample === togId) {
          state.selectedExample = null;
          render();
        } else {
          state.selectedExample = togId;
          render();
          focusExampleItem(togId);
        }
        break;
      }
      case "term": pushScreen("term", { id: el.getAttribute("data-term") }); break;
      case "speedview": state.speedProfile = el.getAttribute("data-profile") || state.speedProfile; pushScreen("speedview", { id: state.speedProfile }); break;
      case "fav": {
        var pid = el.getAttribute("data-profile");
        state.favorites[pid] = !state.favorites[pid];
        render();
        break;
      }
      case "expand": {
        var eid = el.getAttribute("data-example");
        state.expanded[eid] = !state.expanded[eid];
        render();
        break;
      }
      case "details": {
        var dk = el.getAttribute("data-key");
        state.details[dk] = !state.details[dk];
        render();
        break;
      }
      case "set-theme": {
        state.theme = el.getAttribute("data-val");
        writePref("p046.theme", state.theme);
        render();
        break;
      }
      case "set-lang": {
        state.lang = el.getAttribute("data-val");
        writePref("p046.lang", state.lang);
        render();
        break;
      }
      case "terms": pushScreen("terms"); break;
      case "tablemode": pushScreen("tablemode"); break;
      case "seatmap": {
        if (el.getAttribute("data-seat-focus") === "dealer") flashDealer();
        pushScreen("seatmap");
        break;
      }
      case "seat-pick-dealer": {
        var psi = parseInt(el.getAttribute("data-slot"), 10);
        if (!isNaN(psi) && psi >= 0 && psi < 4) {
          state.seat.dealer = psi;
          state.seat.round = 1;
          state.seatMsg = null;
          saveSeat();
          flashDealer();
          render();
        }
        break;
      }
      case "seat-dir": {
        state.seat.dir = seatDir() === 1 ? -1 : 1;
        saveSeat();
        render();
        break;
      }
      case "seat-next": {
        if (!hasDealer()) {
          state.seat.dealer = 0;
          state.seat.round = 1;
          state.seatMsg = { round: 1, slot: 0 };
        } else {
          state.seat.dealer = (state.seat.dealer + seatDir() + 4) % 4;
          state.seat.round = state.seat.round + 1;
          state.seatMsg = { round: state.seat.round, slot: state.seat.dealer };
        }
        saveSeat();
        flashDealer();
        render();
        break;
      }
      case "seat-reset": {
        state.seat.round = 1;
        state.seatMsg = null;
        saveSeat();
        render();
        break;
      }
      case "examples": pushScreen("examples", {}); break;
      case "question": {
        var qk = el.getAttribute("data-q");
        if (QUESTION_SCREENS[qk]) { pushScreen(QUESTION_SCREENS[qk], {}); break; }
        var qItem = T().questions[qk];
        if (qItem && qItem.termId) pushScreen("term", { id: qItem.termId });
        break;
      }
      default: break;
    }
  }
  function pushScreen(screen, params, replaceTop) {
    if (replaceTop) {
      state.scroll[keyOf(currentTop())] = window.scrollY || 0;
      state.stack[state.stack.length - 1] = { screen: screen, params: params || {} };
      render();
      window.scrollTo(0, 0);
    } else {
      go(screen, params);
    }
  }

  /* ---------------------- PWA: SW + 更新提示 -------------------------- */
  function showUpdateNotice(msg) {
    if (!msg || document.getElementById("swNotice")) return;
    var el = document.createElement("div");
    el.id = "swNotice";
    el.className = "notice";
    el.setAttribute("role", "status");
    el.style.position = "fixed";
    el.style.left = "16px";
    el.style.right = "16px";
    el.style.top = "calc(env(safe-area-inset-top, 0px) + 12px)";
    el.style.zIndex = "300";
    el.style.boxShadow = "0 6px 20px rgba(0,0,0,.18)";
    el.textContent = msg;
    document.body.appendChild(el);
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    if (!/^https?:$/.test(window.location.protocol)) return; /* file:// 双击打开不注册 */
    var hadController = !!navigator.serviceWorker.controller;
    var refreshing = false;
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("./sw.js").then(function (reg) {
        reg.addEventListener("updatefound", function () {
          var nw = reg.installing;
          if (!nw) return;
          nw.addEventListener("statechange", function () {
            if (nw.state === "installed" && navigator.serviceWorker.controller) {
              showUpdateNotice(T().ui.swUpdated);
            }
          });
        });
      }).catch(function () {});
    });
    navigator.serviceWorker.addEventListener("controllerchange", function () {
      /* 新版本 SW 已接管：先把「已自动更新」提示显示出来，再自动刷新一次页面，
         让用户立刻拿到新资源，不必自己去清缓存或反复重开（发新版后用户看不到新版就是这个原因）。
         仅在「本来就有旧 SW 在控制」时才刷新，避免首次访问白刷一次；refreshing 防重入成环。 */
      if (!hadController || refreshing) return;
      refreshing = true;
      showUpdateNotice(T().ui.swUpdated);
      window.setTimeout(function () { window.location.reload(); }, 900);
    });
  }

  /* ------------------------------- boot ------------------------------ */
  function boot() {
    state.theme = readPref("p046.theme", "SYSTEM");
    state.lang = readPref("p046.lang", "FOLLOW_SYSTEM");
    loadSeat();

    var t = T();
    var sn = document.getElementById("splashName");
    var st = document.getElementById("splashTag");
    var snote = document.getElementById("splashNote");
    if (sn) sn.textContent = t.ui.appName;
    if (st) st.textContent = t.ui.tagline;
    if (snote) snote.textContent = t.ui.splashNote;

    render();

    window.setTimeout(function () {
      var sp = document.getElementById("splash");
      if (sp) { sp.style.transition = "opacity .3s"; sp.style.opacity = "0"; window.setTimeout(function () { if (sp.parentNode) sp.parentNode.removeChild(sp); }, 320); }
    }, 1200);

    document.getElementById("app").addEventListener("click", function (e) {
      var el = e.target.closest("[data-act]");
      if (!el) return;
      var act = el.getAttribute("data-act");
      if (act === "search") return;
      handleAct(act, el);
    });
    document.getElementById("app").addEventListener("input", function (e) {
      var nameEl = e.target.closest("[data-act='seat-name']");
      if (nameEl) {
        var si = parseInt(nameEl.getAttribute("data-slot"), 10);
        if (!isNaN(si) && si >= 0 && si < 4) {
          state.seat.names[si] = String(nameEl.value).slice(0, 24);
          saveSeat();
        }
        return;
      }
      var el = e.target.closest("[data-act='search']");
      if (!el) return;
      state.search = el.value;
      render();
      var inp = document.getElementById("searchInput");
      if (inp) { inp.focus(); var v = inp.value; try { inp.setSelectionRange(v.length, v.length); } catch (err) {} }
    });
    document.getElementById("app").addEventListener("change", function (e) {
      var nameEl = e.target.closest("[data-act='seat-name']");
      if (!nameEl) return;
      var si = parseInt(nameEl.getAttribute("data-slot"), 10);
      if (isNaN(si) || si < 0 || si > 3) return;
      var v = String(nameEl.value).slice(0, 24);
      state.seat.names[si] = v.trim() ? v : null;
      nameEl.value = seatNameOf(si);
      saveSeat();
      refreshSeatNames();
    });

    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").addEventListener) {
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () {
        if (state.theme === "SYSTEM") render();
      });
    }
    if (window.addEventListener) {
      window.addEventListener("languagechange", function () { if (state.lang === "FOLLOW_SYSTEM") render(); });
    }
    if (window.addEventListener) {
      window.addEventListener("online", function () { render(); });
      window.addEventListener("offline", function () { render(); });
    }

    registerServiceWorker();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
