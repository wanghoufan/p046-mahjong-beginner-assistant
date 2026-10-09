# HANDOFF｜P046 麻将小白助手｜Phase 2 开发中（PWA 路线）

> 本文件是**活文档**，阶段状态以本文件为准（`PROJECT_PHASE`／`PLAN_GATE` 以此为准；`docs/pm/PRODUCT_PLAN_V1.0.md` 正文里的 `PLAN`／`IN_PROGRESS` 是 builder 落稿当时的**自评快照**，已被 planner R3 终审与本文件取代）。

- Captured at（2026-10-09 12:50；PWA 转段更新于 2026-10-09）：
- **审批证据归档（Human Gate 通过依据，不再重复要求验收）**：用户于 2026-10-09 经 task-manager 明确确认——①当前 HTML 交互原型**已正式验收通过**，不需要再次展示或申请原型审批；②最终产品形式由 Android 原生 APP **改为 HTML/PWA**；③授权连续推进：归档审批→更新状态→PWA 工程化→核心流程验证→交付可访问网址＋二维码＋安装说明＋测试结果→用户最终成品签收。本条即原始审批证据；旧文档中的 `WAITING_HUMAN_APPROVAL` 状态已 superseded，不得据此重复要求验收。
- PROJECT_PHASE：**DEVELOP**
- PLAN_VERSION：`docs/pm/PRODUCT_PLAN_V1.1.md`（PWA 路线＋海南单地区最小同步；V1.0 保留为历史版本）
- PLAN_READINESS_SCORE：**96 / 100**（planner R3 对 V1.0 的判定；V1.1 为 V1.0 的最小同步修订——技术路线 Android→PWA、地区 5→1、标语 C1，不改需求本质与已验收交互，故**不再开 planner 复评轮**，与用户「不重复审批」指令一致）
- PLAN_GATE：**APPROVED**（Human Gate 已过：原型验收＋PWA 路线授权，见上条证据）
- DEV_BASELINE：**`prototype/` 当前 HEAD（已验收 HTML 基线＋PWA 工程化）＋ `PRODUCT_PLAN_V1.1`＋`UX_CONTRACT_V1.1`＋`docs/qa/PWA验收-V1.md`**（2026-10-09 锁定）
- **PWA 交付记录（2026-10-09）**：builder 落盘 manifest.webmanifest＋sw.js（`p046-v1`）＋图标集（192/512 maskable/180/32，逐尺寸校验）＋index.html head（manifest/theme-color/苹果图标）＋标题去原型后缀＋README；编排者实测：线上加载/manifest/SW注册接管/55请求预缓存/断网可用/更新接线/360px零溢出/页面跳转/图标/数据等价/零外链/42牌图/中英无报错——**除需真机三项外全过**；生产网址 **https://p046-mahjong-guide.vercel.app/index.html**（Vercel，houfan 账号 p046-mahjong-guide 项目）；二维码＋安装说明＋测试结果见 `temp/pwa-deliver/`（待用户取走，不入库）。
- **真机覆盖缺口（诚实记录）**：安卓 Chrome 真机受阻（当时设备用户正在使用＋网络限速 ~0.5KB/s，已清场）；iPhone Safari／添加到主屏幕无设备覆盖。**三项转由用户扫码在自己手机上走一遍＝最终成品签收**。
- 剩 P0：**0**。用户签收：**待签收**（凭交付网址＋二维码＋安装说明＋测试结果）。
- CHANGE_REQUEST：NONE（路线变更来自用户直接指令，非 Change C 流程；Phase 1 未批即转段，无需重开）
- **技术路线变更**：最终形态 HTML/PWA；**取消 Android、Kotlin、Compose、Gradle、APK、应用商店相关任务**（Freeze 草案中的 M3/ColorScheme/品牌 token 映射等 Android 专属条目作废，以当前 HTML 实测样式为准）
- Stage ID：Phase 2 开发中 → 把已验收 HTML 工程化为可正式使用的 PWA
- 剩 P0：**0**（planner R3：`P0_COUNT=0`、`BLOCKING_P1_COUNT=0`、`UNRESOLVED_DEFECT_COUNT=0`）
- 当前 Task：**Phase 1 已收工**。累计 supervisor 打回 **0/2**（故未升 senior-expert）。
- 执行链/Session：（codebuddy / codex / opencode 通道直调；无真 resume 链。codebuddy 与 P045 派工全程**串行排队**，未干预 P045）
- 未闭环评审意见：**无**。planner R1 的 9 条缺项（B-01～B-07＋N-01/N-02）已全部闭环并经 R3 验收。
- 产品验收：（Phase1 未开始；`docs/qa/产品验收追踪矩阵.template.md` 待 Phase2 启用。**云端交接结果未登记为 Android QA PASS**）
- 用户签收：触发依据＝**发布类型 `首次发布`** → 收尾须用户签收，签收前状态记 `OPEN`；当前 **待签收**（Phase2 收尾时触发）
- docs 落盘清单（本轮新增）：
  - `docs/review/RESEARCH_REVIEW_V1.0_R1_2026-10-09.md`（规则交叉验证＋牌例审查，PASS）
  - `docs/pm/PRODUCT_PLAN_V1.0.md`（正式 Product Plan，57 条 AC／50 条关键 AC）
  - `docs/pm/UX_CONTRACT_V1.0.md`（交互契约）
  - `docs/pm/DESIGN_FREEZE_V1.0.draft.md`（**Freeze 状态 `PENDING_HUMAN_2`，非 PASS**）
  - `docs/pm/PLAN_REVIEW_V1.0_R1.md` / `_R2.md` / `_R3.md`（planner 三轮把关）
  - `docs/pm/evidence/prototype/`（README ＋ 已批 MagicPath 原型 3 份屏幕快照 PDF＋SHA-256）
  - `docs/handoff/HANDOFF.md`（本文件）
  - `docs/model/*.jsonl`（任务账本／派工账本／TM Episode 账本，均已删 `_example` 行）
  - `docs/plan/P046-V1.2/`（云端交接包，**只读引用，未修改**；65/65 sha256 复算一致）
- **2026-10-09 用户实测反馈后的产品范围变更（用户直接指令，尚未回写 Plan）**：
  - 指令原文要点：「其他所有地区的全部取消，只留海南的」「所有结构上的地区全部取消」「我是小白，点进去'什么情况下能胡'就要有所有的情况、所有的案例，不要术语，不要让我再去别的地方找术语解释」「点进去之后单页不允许收缩、折叠，或者还要跳转」「2258……把 258 三种条件都给我画出来」；标语选 **C1**；折叠范围选 **D2**。
  - 已落地（原型，Phase 1 授权例外）：玩法档只留 `HN_FAN_REFERENCE`（删 SC/CQ/GD/MCR）；判例删 E08–E15，保留 **E01–E07 + E16（8 例）**；删地区入口/地区列表/地区详情/地区对比/地区切换；标语改「**海南麻将，一看就懂。**」/「**Hainan Mahjong, Made Simple.**」（中文名/英文名不变）；`什么情况下能胡`/`为什么不能胡`/`什么是眼` 三屏**去掉手风琴、去掉页内跳转按钮、术语就地解释、全部摊开**；`什么情况下能胡` 页海南四条条件**逐条配真实牌图**（258 三种全画＝二/五/八、座位对应花牌、风箭刻子、有番点炮胡 vs 没番只能自摸）。
  - 新增「我的座次」屏（东南西方位＋庄家位＋逐局顺移＋localStorage），术语区补「方位与庄家」。
  - TM 自测（浏览器实测 + 静态核对）：地区残留 0；`rules.js/.json`、`examples.js/.json` **双份等价**；三屏 `details=0`、页内跳转按钮 `=0`、开发词汇与原始枚举 0 命中；中英双语言 + 深色模式正常、**无横向溢出**、控制台无报错；8 例全可达。
  - TM 另修一个真缺陷：`localStorage` 语言值非法时 `T()` 返回 undefined 导致**整页白屏**（`app.js` `effLang()`/`T()` 加回退，不支持语言统一回退 `zh-CN`），已复测通过。
  - **未回写**（下一步必做）：`docs/pm/PRODUCT_PLAN_V1.0.md` 仍是多地区版本（UF-01/UF-05/UF-06、AC-26/AC-27/AC-44、KA-1/4/5/6、slogan、E08–E16 映射表等），`UX_CONTRACT_V1.0.md` L32 与 `DESIGN_FREEZE_V1.0.draft.md` L12 仍写旧标语/地区入口。**须走 Plan 修订 → planner 复评 → 再回 Human Gate**（Phase 1 未批准，属修订不是 Change C）。
- 下一步（Next Single Action）：builder 并行两包——①PWA 工程化（manifest/SW/图标/离线/更新/移动端，零视觉改动）；②最小文档同步（PRODUCT_PLAN_V1.1＋UX_CONTRACT＋验收项，解决旧多地区/旧 Android 冲突；不新增角色/Gate/审批）。完成后编排者亲自验证核心流程并交付。
- 人要拍什么板：
  1. ~~是否进入第二阶段~~（已授权，见审批证据归档）。
  2. 首次发布的**最终成品签收**（Phase2 收尾时：凭交付网址＋二维码＋安装说明＋测试结果签收）。
  - **不得再问**：中文名「麻将小白助手」／英文名「Mahjong Quick Guide」、图标、启动画面、C 方案、**底部 0 Tab**、设置右上角、品牌三色 `#087454`/`#F3F8F4`/`#10211C`、普通配色微调、「当花又当眼」释义（已定性不可核实，走灰态）。
- permission_request：（无）
- 收尾记一笔：文档与账本已对齐；`docs/pm/evidence/prototype/` 为归档证据非临时文件；无临时文件残留（派工书在系统临时目录，不在本仓）；Design Freeze 仍 `PENDING_HUMAN_2`，待 Human 2 正式锁定。**未 commit、未 push**（用户未授权）。

## 关键链接
- 正式原型（已获用户认可）：`https://designs.magicpath.ai/v1/smooth-field-4409`（实测标题「麻将规则速查 C方案 · 可点击交互原型 V1」，头部品牌名已是「麻将小白助手」）
- 流程图：`https://www.tldraw.com/f/qnGzaU1AK2jOwt1LqGZr2`
- 离线牌例预览（无需联网）：`docs/plan/P046-V1.2/examples/示例预览.html`

## 恢复读盘（全体系唯一顺序）
1. `AGENTS.md`；2. 角色卡；3. 根 `USER_MODEL_OVERRIDE.md`；4. 本 HANDOFF；5. 根 `经验一句话.md`；6. 任务目标放最后。

---

# 小交接｜开发暂停（2026-10-09 晚，用户指令"开发先到这里暂时结束"）

## 一、当前工作进展
- **线上 PWA 已发布**：`https://p046-mahjong-guide.vercel.app/index.html`（Vercel，houfan 账号 `p046-mahjong-guide` 项目，`vercel deploy ./prototype --prod --yes` 即可重发）。SW 当前 `p046-v4`， manifest＋图标集（192/512/180/32）齐全。
- **原型内容（只留海南，8 判例 E01–E07＋E16）**：首页只剩常见问题（什么情况下能胡／为什么不能胡）＋小工具；三问题页全展开零跳转零折叠；**「什么情况下能胡」页已全站去横向滚动（2026-10-09 晚，用户反馈后改）**：条件一 258 九组改 **3 列×3 行**（第一排万 2/5/8、第二排筒 2/5/8、第三排条 2/5/8）、条件二改 **单位子单列竖排**（四位×各两朵花）、条件三改 **两列**（风牌 4 组／箭牌 3 组）；**花牌（春夏秋冬梅兰竹菊）改「牌面＋居中大字」渲染，去掉牌图自带橙色方框与贴底小字，字占牌面约九成**（`tileImg()` 对 F1–F8 输出 `.tile--text` span，不动 PNG）；座次表（四空位＋点选庄家＋方向开关沉底＋完成按钮紧跟圆桌＋花纯 44px 大字无框）＋牌桌大屏（一屏无竖滚）。
- **本轮验证证据（2026-10-09 晚，去横滚＋花牌改文字）**：无头 Chrome 同源探针在 320/360/390 三档宽度、zh-CN 与 en 双语言下实测——`docScrollWidth == clientWidth`、`horizontalOverflow=false`、超视口元素数组为空；`c1grid` 三列等宽、`c2grid` 单列、`c3grid` 两列；`.tile--text` 牌 9 个、首个为「春」。线上复验（`https://p046-mahjong-guide.vercel.app/index.html` →「什么情况下能胡」）通过：三条件均无横向滚动、花牌为居中大字无橙框。改动文件：`prototype/app.js`（新增 `isFlower()`，`tileImg()` 分支）、`prototype/app.css`（`.c1grid/.c2grid/.c3grid` 改 grid＋新增 `.tile--text` 系列）、`prototype/i18n.js`（`c1SuitRow` 中英文案去掉「左右滑」提示）、`prototype/sw.js`（`SW_VERSION` `p046-v2`→`p046-v3`）。零回归 grep 全 0（开发词汇/悬空引用/海南玩法/外地区/模糊标题/外链）、42 牌图、`node --check` 通过。
- **「用户看不到新版」根因与修复（2026-10-09 晚，用户反馈）**：部署本身已生效（线上 `sw.js`=p046-v4、`app.js` 含新代码，`curl` 可证），用户看不到是 **Service Worker 缓存**（静态资源 cache-first，旧 SW 会继续吐旧 `app.js/app.css`）。已修：`app.js` `registerServiceWorker()` 的 `controllerchange` 在「原有旧 SW 控制」时叠加 `window.location.reload()`（`refreshing` 防重入、首次访问不白刷），`.notice` 文案「发现新版本，已自动更新。」与实际行为一致；`SW_VERSION` 同步 `p046-v3`→`p046-v4`。此后发新版用户一次自动刷新即到位，无需手动清缓存。**注意**：本次用户端仍需**手动重开一次/强刷**才能拿到 v4（自动刷新代码本身在 v4 里）。
- **文档**：`PRODUCT_PLAN_V1.1`、`UX_CONTRACT_V1.1`、`docs/qa/PWA验收-V1.md` 已落盘；Design Freeze=`FROZEN`；`PLAN_GATE=APPROVED`，`PROJECT_PHASE=DEVELOP`。
- **账本**：`docs/model/TASK-MODEL-LOG.jsonl` 到 T25、`DISPATCH-LOG.jsonl` 同步，`check-ledger.mjs` 为 `LEDGER-OK（含 WARN：模型名不在脚本已知表，属脚本表陈旧，非错误）`。
- **交付物**：`temp/pwa-deliver/`（网址二维码.png、安装说明.md、测试结果.md、note12pro-座次表.png）。**git 全仓未 commit（仅 1 个 bootstrap 提交），用户未授权 commit/push，不得擅自提交。**
- **真机**：Note 12 Pro（Skill 已锁定，见 `~/.config/android-device-target-lock/`）adb 实测座次表渲染通过；**iPhone Safari、添加到主屏幕两项无设备覆盖，待用户签收**。

## 二、下一步任务（按序）
1. 等用户手机签收（iPhone Safari 打开＋添加到主屏幕＋断网重进），回「过」即最终成品签收，回问题则按新反馈迭代。
2. 若用户提新反馈：走 builder 单轮（派工书放 `/tmp/p046-pwa/`，禁 `cd`，见下节规矩），编排者浏览器复验（参考历次 `BUILDER_*_DONE` 验收动作），记账，`vercel --prod` 重发。
3. 签收后：按用户指令决定是否 commit/push、是否清理 `temp/`（交付物用户取走后再清）。

## 三、注意事项与规矩（违反会被用户骂）
1. **角色红线**：你是编排者（task-manager），只派工、不下场写代码。builder 主用 `opencode-go/deepseek-v4-flash`（opencode 通道），备用 `codebuddy/deepseek-v4.1-flash`。此前 T16–T19、T25 有 TM 直驱记录（已记 `executed_by`），属例外不为例；用户已当面点名过一次。
2. **opencode 通道两坑**：①派工脚本先 `cd` 到仓库根，brief 里**禁一切 `cd`**（触发 external_directory 自动拒整轮作废，T21 翻过一次）；②codebuddy 与 P045 串行，禁并发。
3. **改动铁律**：只改 `prototype/app.js|app.css|i18n.js`；不改 `data/*` 判据、不改 `docs/plan/P046-V1.2/` 只读包、不建 Android 工程、不 git；中英双语文案齐全、英文不溢出。
4. **零回归 grep（每轮必跑）**：开发词汇（资料原句/依次类推/依据与限定/…）0、悬空引用（上面那四条）0、「海南玩法」0、外地区 0、模糊标题（这手牌现在胡不了/先别急着说能胡）0、预设「我」0、unknown/null/undefined 0、42 牌图、零外链。
5. **说话方式**：对用户极简（结论＋证据＋下一步），不解释、不铺垫；有分歧先给推荐项，用 A/B/C 决策格式一次问全；汇报带三行心跳（目标/剩 P0/下一步）。