# DESIGN_FREEZE V1.0（草案 draft）｜P046 麻将小白助手

> **Freeze 状态：`FROZEN`（2026-10-09 用户正式确认 HTML 原型通过验收；原 PENDING_HUMAN_2 关闭）。** 当前 HTML 即唯一视觉与交互基线；Android 专属条目（M3/ColorScheme/Gradle/APK/商店）随路线变更作废，不再执行。
> 本文件是**草案（draft）**，不是冻结结论，也不是 Gate PASS。它汇总已由云端产出的视觉/品牌/组件/牌图约束，供 Human 2（原型审批）与 Design Freeze 正式锁定时使用。
> 上游真源：`PRODUCT_PLAN_V1.0.md`、`UX_CONTRACT_V1.0.md`、`docs/plan/P046-V1.2/` 交接包（brand/、tiles/、§2、§8）。
> **本草案不声称** Android QA 通过、不声称原型已 Freeze、不声称商标检索通过或 Google Play 同名无冲突。

## 1. 视觉方向（C 方案 + 已确认品牌资产）

- **选定方向**：C 方案——**双入口首页（地区入口＋问题入口）、底部 0 Tab、设置在右上角、规则对比从具体玩法详情进入**。（由用户在云端阶段认可，非本轮新选。）
- **品牌气质**：翡翠绿 + 象牙白 + 金色提示，扁平、干净、亲和，面向新手。
- **正式命名**：中文「**麻将小白助手**」，英文「**Mahjong Quick Guide**」；标语「各地玩法，一看就懂。」/「Local Rules, Made Simple.」。
- **旧文案作废**：MagicPath 旧稿头部「麻将一看懂」仅为临时文案，**正式原型必须使用「麻将小白助手」**（AC-23）。

## 2. 浅/深双套语义 Token（冻结候选）

- **品牌色（已确认，不得擅改）**：主品牌绿 `#087454`；浅底 `#F3F8F4`；深底 `#10211C`。
- **已落地资源**：`brand/android/res/values/p046_brand_colors.xml`（splash 背景 `#F3F8F4`、品牌绿 `#087454`）与 `values-night/p046_brand_colors.xml`（splash 背景 `#10211C`、品牌绿 `#087454`）。
- **令牌体系（R2 已填实全部候选值，语义角色 → 值；按 Material 3 `ColorScheme` 映射，供 Human 2 可视化确认）**：

  | 语义 Token（M3 角色） | LIGHT | DARK | 说明 |
  |---|---|---|---|
  | `color.brand.primary`（primary） | `#087454` | `#087454` | 品牌主色（**已确认，不变**） |
  | `color.onPrimary` | `#FFFFFF` | `#FFFFFF` | 品牌色上的文字/图标 |
  | `color.primaryContainer` / `onPrimaryContainer` | `#A8EFCB` / `#00210F` | `#0E3B2A` / `#A8EFCB` | 强调容器/其上前景 |
  | `color.background`（background） | `#F3F8F4` | `#10211C` | 页面底色（**已确认，与 splash 一致**） |
  | `color.onBackground` | `#10211C` | `#E2EAE4` | 底色上的正文 |
  | `color.surface` | `#FFFFFF` | `#1A2B25` | 卡片面（LIGHT 纯白 / DARK 抬升卡面） |
  | `color.onSurface` | `#10211C` | `#E2EAE4` | **surface 上的正文（前景/背景配对）** |
  | `color.surfaceVariant` / `onSurfaceVariant` | `#DCE7DF` / `#414A45` | `#3F4A44` / `#BFC9C3` | 次级面/次级文字 |
  | `color.outline` | `#717A74` | `#89938C` | 分隔线/边框 |
  | `color.conclusion.can`（能胡 ＋ `onConclusion.can`） | `#DCF2E6` / `#0B5A3C` | `#0E3B2A` / `#7FD8AC` | 四态「能胡」容器/文字·图标 |
  | `color.conclusion.cannot`（不能胡 ＋ `onConclusion.cannot`） | `#FCEBEA` / `#B3261E` | `#521A17` / `#FFB4AB` | 四态「不能胡」容器/文字·图标 |
  | `color.conclusion.conditional`（未满足额外条件 ＋ `onConclusion.conditional`） | `#FBEFD3` / `#7A4E00` | `#4A3400` / `#F5C451` | 四态「未满足额外条件」容器/文字·图标 |
  | `color.conclusion.insufficient`（依据不足灰态 ＋ `onConclusion.insufficient`） | `#E7ECE8` / `#4A5650` | `#29332D` / `#C2CCC6` | **低置信灰态色**（容器/文字·图标） |
  | `color.disabled`（disabled 状态） | `onSurface@38%` / 容器 `onSurface@12%` | 同左 | 禁用文字/图标与禁用容器 |
  | `color.focusRing`（focus 状态） | `#087454` | `#7FD8AC` | 键盘/无障碍焦点描边 |
  | `color.pressedOverlay`（pressed 状态） | `primary@12%` | `primary@12%` | 按压态叠加层 |

  > **使用状态说明（B-05）**：四态条＝容器色＋`onConclusion.*` 文字/图标色（**不单靠颜色**，同时带文字标签）；`disabled`＝`onSurface@38%`（文字/图标）＋`onSurface@12%`（容器）；`focus`＝`#087454`/`#7FD8AC` 描边环；`pressed`＝`primary@12%` 叠加。四结论角色的**状态文字/图标颜色**即上表 `onConclusion.*`。
  > **取值来源与自决口径（B-05）**：仅 `#087454`/`#F3F8F4`/`#10211C` 为品牌已确认色（**保持不动**）；其余角色为**从 C 原型语义到 Material 3 `ColorScheme` 的明确映射候选**（原型存档仅 PDF 快照、未取得源码色值，故按 M3 角色系统给出可比对具体值）。**日常配色微调由本链自决**（不把零碎选色丢给用户）；草案仍为 `PENDING_HUMAN_2`，**候选具体化 ≠ 提前 Freeze PASS**。
  > **可读性复核办法（B-05）**：以 WCAG 对比度计算核对——**正文 `onSurface`/`onBackground` ≥ 4.5:1，大文本与图标及 `onConclusion.*` ≥ 3:1**；在浅/深两态各出截图与对比度核算表作为证据。**本轮只给办法与候选值，不声称已运行通过**（真机核验留 Phase2）。
- 主题三态 `LIGHT`/`DARK`/`SYSTEM`（默认 `SYSTEM`）；沉浸式阅读页遵守用户所选主题，不强制另一态。
- 组件与配色**不自研基础主题引擎**，复用 Jetpack Compose Material 3 `ColorScheme`（AC-41）。

## 3. 启动画面规则

- 采用 **Android 系统 SplashScreen API**：纯色浅/深背景（`#F3F8F4` / `#10211C`）+ 中央 logo（`p046_splash_icon`，VectorDrawable），尽快进入首页。
- **不新增独立欢迎页、不强制停留**；不得设计假等待页（AC-28/FR-25）。
- 系统启动色由 `@color/p046_splash_background` 提供，浅深目录分别取值；`postSplashScreenTheme` 复用项目正式 App 主题（**不覆盖现有主题文件**，由 Builder 合入）。
- **冷启动/重启主题一致性规则（B-06，硬约束）**：splash 背景取**当前生效主题**，不是设备外观无条件值：
  - 主题＝`LIGHT`（手动）即使设备深色 → splash 用 `#F3F8F4`，首页保持 `LIGHT`；
  - 主题＝`DARK`（手动）即使设备浅色 → splash 用 `#10211C`，首页保持 `DARK`；
  - 主题＝`SYSTEM` → splash 与首页**跟随设备外观**，Splash→首页**无闪错色**。
  - **持久化读取边界**：主题选择须在**首帧（splash 渲染）之前**读取生效，避免先渲染错误底色再切换。
  - **真机验收步骤**：三组冷启动录屏（Splash→首页）＋重启后主题仍为所选；分别改设备外观/语言验证两个开关独立（AC-56）。**本轮不声称已实现或已通过**——`values-night` 仅声明了系统跟随资源，冲突判据为本轮补齐的规格。
- **注意**：系统启动资源与品牌（`#F3F8F4`/`#10211C`/logo）**已定、不得改动**；本节只补规则，不改资源。
- `brand/previews/splash-preview-light.png` / `splash-preview-dark.png` 为**审美预览样张，非 Android 系统实际截屏**。

## 4. 命名与图标最终四项——待冻结状态

| 项 | 当前值 | 状态 |
|---|---|---|
| 最终中文名 | 麻将小白助手 | **已由用户在上游确认**；待 Human 2 / Design Freeze 正式锁定 |
| 最终英文名 | Mahjong Quick Guide | **已由用户在上游确认**；待 Freeze 锁定 |
| 最终图标 | 翡翠绿底＋象牙白麻将牌＋「胡」字＋金色光芒；两层 adaptive icon（前景/背景）＋ monochrome | **已由用户在上游确认**；待 Freeze 锁定（含真机安全区验证 AC-28） |
| 最终启动画面 | 系统 SplashScreen 纯色浅/深底＋中央 logo | **已由用户在上游确认**；待 Freeze 锁定 |

- **未完成最终拍板时，开发阶段不得自行决定名称/图标/启动画面**（FR-26 / `app-brand-assets.md` §3.2）。本四项虽已在上游确认，仍须经 **Human 2 将 BRAND Freeze 正式落定**后方可视为冻结（AC-40）。**无 BRAND Freeze 即 Freeze 不成立。**
- **本轮如实记录**：四项均已由用户确认，**未伪造新一轮 A/B/C Human 1 审批**（见 `PRODUCT_PLAN_V1.0.md`「APP 品牌资产方向」节，AC-38）。
- 资源清单（可直接实现）：
  - `brand/android/res/drawable/p046_adaptive_fg.xml`（108dp 矢量前景，含「胡」字轮廓，不依赖设备字体）
  - `brand/android/res/drawable/p046_adaptive_mono.xml`
  - `brand/android/res/drawable/p046_splash_icon.xml`
  - `brand/android/res/drawable/ic_launcher_background.xml`
  - `brand/android/res/mipmap-anydpi-v26/ic_launcher.xml`（background/foreground/monochrome 三层）
  - `brand/android/res/values*/p046_brand_colors.xml`
  - `brand/icons/play-store-512.png`（512×512，首版品牌稿；发布前核商店图标政策）
  - `brand/previews/品牌与六屏展示概念图.png`、`AI品牌概念图.png`、`splash-preview-light.png`、`splash-preview-dark.png`
- **已知待验项**：`p046_adaptive_fg.xml` 金色光芒笔画最远点约 38.5dp，超出 66dp 安全区（半径约 33dp），圆形遮罩下可能裁切——**真机必验（AC-28）**；如影响辨识，缩放前景矢量（不动品牌色与构图）。另 PNG 为 192×272px，UI 限制放大倍数避免发虚（RR1 P2-4/P2-5）。

## 5. 原型证据（归档位置 · revision · 证据清单）

- **归档位置（B-07）**：`docs/pm/evidence/prototype/`（由编排者于 2026-10-09 归档，满足交接包 §1「不能只引用链接不归档资产」）。
- **原型身份**：MagicPath `https://designs.magicpath.ai/v1/smooth-field-4409`
  - 正式入库 revision：**`459123263147245568`**（云端仅同步正式展示名后的最新构建；导航与交互不改）。
  - project=`458973763359367168`，component=`458974093736292352`；原批准无 Tab revision=`458976192389869568`。
- **归档证据清单**（`docs/pm/evidence/prototype/README.md` ＋ 3 份 PDF 快照，含 SHA-256）：
  - `magicpath-C原型-首页快照.pdf` — SHA-256 `c323896999e2bfb690caf3d60892c479ba2e8038af46b167f71616faa8a443ed`
  - `magicpath-C原型-海南地区页快照.pdf` — SHA-256 `8d0cbf9cb6f46908f68651800e18219910fe4959b4016e287ee678652ecb2847`
  - `magicpath-C原型-设置页快照.pdf` — SHA-256 `4374e763bd5076baf808f307c781877b8263069af2cf0b504b97d89d2295f604`
  - README 实测观察：头部已是「麻将小白助手」（非旧「麻将一看懂」）、C 双入口、底部 0 Tab、设置右上角、玩法详情内含「与其他地区规则对比」入口、设置页含外观三态＋语言三项。
- tldraw 用户流程图：`https://www.tldraw.com/f/qnGzaU1AK2jOwt1LqGZr2`
- **证据分级（三者必须分开记，B-07）**：
  - **已有输入**：上述 PDF 屏幕快照 ＋ README 实测观察（作为交互/视觉真源已归档）。
  - **待运行验证（Phase2 真机 QA）**：真实牌图渲染（原型牌位用 🀄 字符占位，非 42 张真实牌图）、真机 `SYSTEM` 跟随、`FOLLOW_SYSTEM` 回退 `zh-CN`、持久化重启、图标安全区。
  - **待 Human 2**：Design Freeze 正式锁定（当前 `PENDING_HUMAN_2`）与品牌四项最终拍板。
- **如实限制（不得美化）**：MagicPath 为**托管设计工具**，本轮**未取得工程源码导出**；归档为**当前线上 revision 的屏幕快照**，源码级归档需用户在 MagicPath 侧导出后补入，或在 Human 2 以「线上 revision＋快照」为准。
- **证据边界**：MagicPath 为 **React 交互/视觉真源**，**不是** Compose APK；实现需在 Compose 中重新落地。原型内主题/语言切换为**原型内模拟**，**不得**写成真机 `SYSTEM` 跟随或 `FOLLOW_SYSTEM` 回退已通过。本轮**不得**把 MagicPath 或云端测试结果登记为 Android QA PASS，也**不得**写任何 Freeze PASS（AC-39/AC-57）。

## 6. 组件与布局约束

- 平台/栈：Kotlin + Jetpack Compose + Material 3 + Android 官方字符串资源；Runtime/Compose BOM 由 Reuse Audit 确认。
- 布局：首页双入口（地区/问题）＋ 右上角设置 ＋ **底部 0 Tab**（不得加回底部栏）。
- 组件复用：Material 3 组件优先（卡片/列表/单选/对话框）；主题与 i18n 基础设施不自研（AC-41）。
- **组件交互状态（B-05，采用 §2 Token）**：按钮/列表项/单选/卡片的 **`disabled`＝`onSurface@38%`（文字/图标）＋`onSurface@12%`（容器）**、**`focus`＝`#087454`（LIGHT）/`#7FD8AC`（DARK）描边环**、**`pressed`＝`primary@12%` 叠加**；来源链接离线置灰仍可读。所有状态**同时满足对比度**（disabled 不计入正文对比度要求）。
- 主题/语言设置入口统一在 S9 设置页；三态与语言三选、默认值、回退、持久化、切换不丢状态见 `UX_CONTRACT_V1.0.md` §9；**主题（SYSTEM）与语言（FOLLOW_SYSTEM）两个跟随开关独立**（B-06）。
- 结论四态条组件统一（容器色＋`onConclusion.*` 文字/图标，**颜色+文字双编码；状态文字/图标颜色即 `onConclusion.*`**，色盲友好）；牌面组件统一（真实 PNG + 无障碍标签）。

## 7. 42 张牌图使用规范（编号/牌名/复制数约束不得擅改）

- 素材：`tiles/png/`（**恰 42 种**），命名与含义：
  - `W1`–`W9`＝一万至九万；`P1`–`P9`＝一筒至九筒；`S1`–`S9`＝一条至九条；`Z1`–`Z7`＝东南西北中发白；`F1`–`F8`＝春夏秋冬梅兰竹菊。
- **硬约束**：
  1. **不得未经对照改变万/筒/条编号、牌名或复制数约束**（`tiles/牌面图例.md`）。
  2. 每种牌在真实牌墙中**最多 4 张**；手牌数量为 **13 或 14**；**花牌置于手牌之外单独展示**（AC-24）。
  3. 不得用 Emoji 或「123万」文本替换真实牌面资产（交接包 §7）。
  4. 正式 UI 可据 PNG 绘制/优化矢量牌面，但**编号与牌名语义不得变**；扩展图资须自制，**避免授权不明第三方图库**。
- 与示例数据的关系：`examples/visual-examples.json` 的 E01~E16 与 `examples/示例预览.html`（`../tiles/png/*.png` 相对路径、离线可用）为设计/QA 查看真源。

## 8. 主题/语言与品牌资产的 Freeze 关联（供 Design Freeze 正式锁定时核）

- 待 Freeze 冻结项：①浅/深双套语义 Token（**R2 已填实候选值，待人工确认**）；②主题切换规则（**含冷启动一致性 B-06**）；③支持语言集与兜底规则；④文案资源与布局原则；⑤已批原型与证据（**归档见 §5**）；⑥**BRAND Freeze（最终四项）**。
- **B-06 规格补齐**：主题 `SYSTEM`（外观）与语言 `FOLLOW_SYSTEM`（语言）**独立**；手动项不随设备变；冷启动 Splash 取当前生效主题、持久化值首帧前读取（详见 §3）。
- 关联 AC：AC-11~AC-16、AC-28~AC-35、AC-37、AC-38~AC-40、AC-41、AC-55、AC-56。
- **本草案状态**：`PENDING_HUMAN_2`。**未经用户在原型的正式确认，不得标记 Freeze=PASS。** 候选 Token 具体化（B-05）**不等于** Freeze PASS；原型归档（B-07）**不等于** Freeze 或 QA PASS。
