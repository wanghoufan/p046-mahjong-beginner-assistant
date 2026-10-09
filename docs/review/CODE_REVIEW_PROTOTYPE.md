
# CODE REVIEW｜Phase 1 HTML 交互原型复核

- Task：派工｜code-reviewer｜Phase 1 HTML 交互原型复核（`prototype/`）
- Commit：未 commit（工作区未跟踪状态；仅本地核验，未做任何写操作/commit/push）
- Reviewer：code-reviewer（codebuddy/glm-5.3-flash，独立 Session）
- Result：**PASS**（0×P0，1×P1，5×P2；P1 建议在 Human 2 前顺手修掉，不阻塞）

> 复核方式：全部结论为独立实测（读源码＋脚本比对＋sha256 复算），**不采信** `prototype/README.md` 自述；README 自述与实测不符处已在下文指出（本次未发现虚假自述）。

## 一、按派工书 11 条复核点逐条结论

### 1. 离线性 —— PASS
- `index.html` / `app.css` / `app.js` / `i18n.js` 四文件 grep `http`、`fetch`、`XMLHttpRequest`、`@import`、`import`：**0 命中**（仅注释里提到"无 fetch"字样）。仅 `data/*.js` 数据文件含来源 URL（作为数据显示，不发起请求）。
- `file://` 方案自洽性：`data/*.js` 经 `<script>` 注入 `window.P046_RULES` / `window.P046_EXAMPLES`（`prototype/index.html:22-23`），绕过 `file://` CORS，方案成立。
- **镜像一致性实测**：脚本解析比对 `rules.js` ≡ `rules.json`、`examples.js` ≡ `examples.json`，**逐字节 JSON 等价（双双 true）**，当前无漂移。
- **与权威真源比对**：`prototype/data/examples.json` vs `docs/plan/P046-V1.2/examples/visual-examples.json` —— 16 条判例的 **id/status/hand/title/explanation/next_condition/context 全部一致**；差异仅为原型**新增只读派生字段** `state`（四态）、`tile_count`、`note`（符合 README 声明）。`rules.json` vs `rule-profiles.json` 同理（新增 `evidence_grade`/`region_key`/`example_ids`）。

### 2. 真实牌图 —— PASS
- `assets/tiles/` 恰 **42 张**（W1-9/P1-9/S1-9=27 ＋ Z1-7=7 ＋ F1-8=8）。
- 全部牌面（手牌/术语/速看示例/问题页对照/花牌区）统一走 `tileImg()` → `<img src="assets/tiles/...png">`（`app.js:110-115`）。emoji 码点扫描（U+1F000–1F02B、U+1F300–1F9FF）四文件 **0 命中**；无「123万」文字占位分支。
- `app.js` 中仅有的"牌面文字"是 `tileAlt()` 的**无障碍 alt 文本**（`app.js:98-108`），不渲染为可见牌面，合规。

### 3. 16 条判例四态逐例核对 —— PASS（四态归类与 Plan 一致，明确回答见下）
逐例对照 `docs/pm/PRODUCT_PLAN_V1.0.md` Data/API 逐例验收表（以 Plan 为权威真源）：

| 判例 | Plan：status → 四态 | 原型 `data/examples.js` 实测 | 一致 |
|---|---|---|---|
| E01 | WAITING → 未满足额外条件 | conditional | ✅ |
| E02 | STRUCTURE_VALID → 未满足额外条件 | conditional | ✅ |
| E03 | STRUCTURE_INVALID → 不能胡 | cannot | ✅ |
| E04 | QUALIFIED_CONDITIONAL → 能胡 | can | ✅ |
| E05 | FAN_NOT_SHOWN → 未满足额外条件 | conditional | ✅ |
| E06 | QUALIFIED_CONDITIONAL → 能胡 | can | ✅ |
| E07 | FAN_NOT_SHOWN → 未满足额外条件 | conditional | ✅ |
| E08 | VARIANT_GATE_FAILED → 不能胡 | cannot | ✅ |
| E09 | QUALIFIED_CONDITIONAL → 能胡 | can | ✅ |
| E10 | QUALIFIED_CONDITIONAL → 能胡 | can | ✅ |
| E11 | QUALIFIED_CONDITIONAL → 能胡 | can | ✅ |
| E12 | VARIANT_GATE_FAILED → 不能胡 | cannot | ✅ |
| E13 | QUALIFIED_CONDITIONAL → 能胡 | can | ✅ |
| E14 | SCORE_REQUIRED → 依据不足 | insufficient | ✅ |
| E15 | VARIANT_NOT_FIXED → 依据不足 | insufficient | ✅ |
| E16 | STRUCTURE_VALID → 未满足额外条件 | conditional | ✅ |

**★ 派工书第 3 条要求明确回答：FAN_NOT_SHOWN（E05/E07）→「未满足额外条件」（琥珀态）、SCORE_REQUIRED（E14）→「依据不足」（灰态），与 Plan 映射表完全一致。** builder 在 `prototype/README.md` §6 自述的"派工摘要表头与权威真源有一处口径差异、已按 Plan 处理"经核实属实且处理正确。

分条关键语义实测（全部正确）：
- **E01** 13 张：文案「尚缺『眼』；不得说成『14 张结构成立』」（`i18n.js:224`），结论条=未满足额外条件（琥珀）✅
- **E03** 14 张不合法：「当前已是 14 张，绝不可说『再摸一张就胡』」（`i18n.js:226`），结论条=不能胡 ✅
- **E14**：文案含「已选 MCR1998 国标，不得要求重新选玩法」「V1 不提供算分器…维持『依据不足』灰态」（`i18n.js:237`），灰态 ✅
- **E15**：「版本未定走灰态」（`i18n.js:238`），insufficient 灰态 ✅
- **E02/E16**：`STRUCTURE_VALID` 专属注脚「通用结构成立，不代表任何地区都能胡」（`app.js:651-652`）✅
- **E08**：`declared_missing_suit=S` → 手牌中**全部条牌**加 `tile--warn` 高亮（`app.js:610-613`，E08 手牌 S2、S2 均高亮）✅
- **E11/E12**：`ctx.last_tile_source` 存在时渲染「同一 14 张结构」并列卡：自摸→可胡（绿）/普通点炮→不胡（红）双结论条（`app.js:642-649`）✅
- **E04～E07**：花牌经 `flowerbox`（标注「花牌区（手牌之外）」）画在 14 张手牌之外（`app.js:615-618`）；座风（东/南）与眼（手牌内成对牌）同屏可见（premiseRows＋hand）✅。E04 `bonus_flower=null`（无花牌、有座风）与 Plan context 一致 ✅
- 16 条**全部可点开**：`screens.examples` 全列表＋`renderExampleAccordion` 手风琴（`app.js:583-601`），`data/*.js` 16 条齐全 ✅

### 4. 「当花又当眼」—— PASS
- 术语 `flowerEye.unverified=true`（`i18n.js:221`）→ 术语页走灰态卡「该说法暂无法核实」（`app.js:530-543`）＋ 花牌区（F1）vs 眼（S3,S3）图解 ＋ `flowerEyeExplain`「花牌另放、不参与手牌组合；『眼』是两张相同的牌组成的一对，两者是两码事」。
- 未编造定义：desc 仅「该说法暂无法核实，不作为可判定规则」；「什么是眼」问题页另有 `distinguishTitle/Text`「眼是结构，二五八眼是额外条件」图解（`i18n.js:168-169`），与 Plan KA-7 / R-3 口径一致。✅

### 5. 布局 —— PASS
- 零底部 Tab：全代码无 tabbar/bottomnav 元素（grep 0 命中）；导航唯一为 `shell()` 的 topbar。
- 设置齿轮在每屏 topbar **右上**（`app.js:186`）✅；C 方案双入口（`entrygrid`：按地区 / 我是小白，`app.js:240-251`）✅；搜索框在首页置顶（brand 头之下第一控件，`app.js:237-239`）✅。

### 6. 主题三态 —— PASS
- 默认 `SYSTEM`（`app.js:45`、boot 读默认 `"SYSTEM"` `app.js:874`）。
- `SYSTEM` 真用 `matchMedia('(prefers-color-scheme: dark)')`（`app.js:78-80`）且注册 change 监听、**仅当 `state.theme==="SYSTEM"` 时重渲染**（`app.js:908-912`）→ 手动 LIGHT/DARK 不随系统变 ✅。
- CSS 语义 Token：`app.css` 浅/深两套 Token 值与 `DESIGN_FREEZE_V1.0.draft.md` §2 逐值比对一致（#087454/#F3F8F4/#10211C 品牌三色未动；primaryContainer、background、surface、outline、四态 conclusion、focusRing、disabled 38%/12%、pressed 12% 全部对上）。例外见 P2-3（`.tile` 两处硬编码色）与 P2-4（splash 背景色与 Freeze §4 有出入）。

### 7. 语言三选 —— PASS（含 1×P1）
- 三选 `FOLLOW_SYSTEM`（默认）/简体中文/English（`app.js:739-741`）；文案集中走 `i18n.js` 双语字典，`app.js` 不做整体中英分支。
- 不支持语言统一回退 zh-CN（`detectSystemLang` `app.js:67-73`）；设置页**显示当前实际判定结果**：`当前生效语言`＋`系统判定 probe`（raw → 映射 + 回退标注，`app.js:714-725, 743-745`）✅。
- 切换语言/主题仅写偏好＋重渲染当前栈（`app.js:844-849`），`state.search/selectedExample/expanded/favorites/stack` 全部保留 → **不清空业务状态** ✅（设置页亦有明示文案）。
- **P1-1**：`app.js` 残留 3 处内联中英分支（详见 Findings），违反「禁到处 if 中文 else 英文」的集中字典口径。

### 8. 持久化 —— PASS
- 主题/语言写 `localStorage`（`p046.theme`/`p046.lang`），boot 读回（`app.js:873-875`）；重开保持 ✅。
- 界面标注「原型模拟：使用 localStorage 保存」（`i18n.js:92`）✅，未宣称真机已验证。

### 9. 模拟标识 —— PASS
- `noteTheme`/`noteLang`/`notePersist` 三条均以「原型模拟：」开头（`i18n.js:90-92`）✅。
- 启动画面标注「原型模拟：真实 APP 用 Android 系统 SplashScreen API」（`i18n.js:99`，splash 底部常显）✅。

### 10. 边界 —— PASS
- `prototype/` 内 **0 个** `.kt`/`.gradle`/`.kts`（find 实测）。
- `docs/plan/P046-V1.2/` **65/65 sha256 复算一致**（按 `handoff/ASSET_MANIFEST.json` 全量重算，路径相对 `docs/plan/P046-V1.2/`）→ 交接包未被改动。
- `docs/pm/` 三份正文（PRODUCT_PLAN_V1.0 / UX_CONTRACT_V1.0 / DESIGN_FREEZE_V1.0.draft）：mtime（11:48–12:39）均早于原型产出（13:35–14:11），且仓库仅 1 个 bootstrap commit、无法做 diff 基线——以 mtime＋HANDOFF 12:50 归档时间为据判定**未见改动**（注：此为间接证据，非哈希级证明）。

### 11. 不得越界 —— PASS
- 无判牌/万能判牌引擎：全部结论来自 `data/examples.js` 静态 `state` 字段直读渲染，无任何牌型解析/组合搜索代码；无手工录牌、无任意牌张输入 ✅。
- 不确定规则全部灰态：「当花又当眼」（unverified）、E14（insufficient）、E15（insufficient）、重庆档案 C 级（badge--low＋caveat）均未给出确定性胡牌结论 ✅。

## 二、P0 / P1 Findings

- **P1-1｜app.js:349、app.js:387、app.js:697｜内联中英分支残留（违反文案集中字典口径）**
  - 问题：三处 `effLang() === "en" ? "Allowed" : "可以"` / `"Not allowed" : "不能"` 直接写在渲染逻辑里（profile 页 allowChi 值、速看页 allowChi 值、compare 页 `yes()`），未走 `P046_I18N` 字典；另 `tileAlt()`（app.js:98-108）把 CN_NUM/Z_CN/Z_EN/F_CN/F_EN 词表硬编码在 app.js 而非 i18n.js。对照派工书第 7 条「禁到处 if 中文 else 英文」与 AC-48 方向，属口径违规（范围有限、非"到处"，故 P1 不打回）。
  - 建议：在 i18n.js 两语言 `ui` 下补 `allowed`/`notAllowed` 两个键，三处改引字典；牌名 alt 词表迁入 i18n.js（或单独 `tile-names` 字典）。改动约 15 行，零行为变化。
  - P1（建议 Human 2 前顺手修；不阻塞过审）。

## 三、P2 / P3 Backlog Findings

- **P2-1｜app.js:630｜E15「缺门规则」显示原始值 `"unknown"`**
  - `ctx.missing_suit_rule` 未做本地化映射，中文界面显示「缺门规则：unknown」。建议：值 `unknown` → 映射为「未确定（走灰态）」/ "Unknown (grey state)"。
- **P2-2｜app.js:627,631｜context 原始中文值直出，英文界面未本地化**
  - `ctx.seat="东"/"南"`、`ctx.bonus_flower` 的 alt（经 `tileAlt` 已双语，OK）但 premise 行座风值直接显示「东」，en 界面下不本地化。建议 Phase2 将 context 枚举值纳入字典映射。
- **P2-3｜app.css:160｜`.tile` 两处硬编码色 `#fff`/`#d9e3dc`**
  - 牌图白底可解释（牌面物理为白），但未用语义 Token 且 DARK 下边框色不随主题。建议改为 `--color-surface`/`--color-outline` 或新增 `--color-tile-face`/`--color-tile-border` Token（须走 Design Freeze 的"日常配色微调自决"口径，不改品牌三色）。
- **P2-4｜app.css:98-107｜启动画面背景与 Design Freeze §4 有出入**
  - Freeze §4 规定真机 splash＝纯色浅/深背景（#F3F8F4 / #10211C）＋中央 logo；原型 splash 用品牌绿 `var(--color-primary)` 底＋白字。原型已在界面标注「原型模拟」，但 Human 2 对照时易被误读为最终 splash 设计。建议：要么改原型 splash 为浅/深双底，要么在 README §4 明确「splash 配色以 Freeze §4 为准，原型绿底仅占位」。
- **P2-5｜prototype/data/*.js ↔ *.json 双份维护存在结构性漂移风险**
  - 当前逐字节一致（实测），但两份手工维护、无机器校验，后续改 `.json` 忘同步 `.js` 会出现「QA 看 json 对、线上跑 js 错」。建议：加一条一行校验脚本（node 解析两份比对输出 PASS/FAIL）挂进 QA 自检；或由脚本从 `.json` 生成 `.js`（单一真源）。
- **P3-1｜app.js:26-30｜「为什么不能胡」问题页无 E01（13 张等待）**
  - `CANT_WIN_GROUPS` 三类过滤器不含 `WAITING`，E01 仅可经 S7 全列表/搜索到达。Plan 未强制（E01 四态=未满足额外条件，非不能胡），但 UF-03「区分 13 张等待与 14 张不合法」的对照在该问题页不完整。建议 Phase2 由 Planner/UX 裁定是否在「结构就不成立」小类补充 13 张等待对照。
- **P3-2｜app.js:620-624｜E04–E07 明牌区与手牌重复展示 P1P1P1**
  - 数据与 canonical 一致（hand 14 张已含明碰 111 筒，context.open_melds 又列 P1P1P1），渲染层同时画两处导致视觉重复。Plan 规定「不得改牌张」，原型照搬无误；建议 Phase2 在数据契约层澄清「hand 是否应扣除明牌」。

## 四、不合格项清单

- 无 P0；无阻断性 P1。P1-1（3 处内联中英分支）为唯一 P1，修复成本低，建议随下轮小改处理。

## 五、复核方法与证据备注

- sha256 复算：Python hashlib 按 `docs/plan/P046-V1.2/handoff/ASSET_MANIFEST.json` 全量 65 条重算，65/65 一致（首报全 MISMATCH 为复核脚本自身的 dict 迭代 bug，已修正后复验，特此留痕）。
- 数据一致性：Node 脚本解析比对 4 份 data 文件 + 2 份 canonical JSON。
- 码点扫描：perl Unicode 扫描四文件，无麻将牌字符/Emoji。
- 未改任何代码、未改需求文档、未 commit/push。
