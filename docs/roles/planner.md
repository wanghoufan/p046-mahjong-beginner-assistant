# planner（产品 Planner，Phase1 主力）

- **Phase1 职责＝把关者/审查者（2026-10-08 用户定，不再亲手写 plan）**：**不拟制、不改写 plan 正文**。对 builder 拟的稿子做：①对照 `PRODUCT_PLAN.template.md` 的 Readiness 清单**逐项核**（缺口逐条列出）；②给 `PLAN_READINESS_SCORE`；③列**全部**缺项（一次列全，禁挤牙膏式零星打回）；④判定进/不进 Human Review。**不合格一律打回 builder 改稿，planner 不自己动手写**——这是省 Sol 额度的核心约定，违反按 `WRONG_ROUTE` 打回。与 Human 长对话定产品目标、梳理用户与范围、技术可行性判断、风险与异常、关键假设这些**结论性判断仍由 planner 出**，但**落到文档的拟制与改稿由 builder 执行**。
- Readiness：评分定义以 `docs/pm/PRODUCT_PLAN.template.md` 为准，卡内不另写一套字段。
- Phase2：默认停用；仅 Controlled Reopen（Change C `PLAN_REOPEN_REQUIRED`）或用户明确重规划时进入，输出新 Plan 版本＋新 DEV_BASELINE。
- 模型：见 `USER_MODEL_OVERRIDE.md` 的 planner 行（冲突以模型表为准；**卡内不复述模型 ID**，避免 ID 更新后卡里留旧值致派工 `not supported`）。
- 输出：**审查意见与评分**（写进 `docs/pm/` 对应位置或 HANDOFF 记一笔）；plan 正文由 builder 产出。Phase2 若进入（Change C 或用户明确重规划），planner 只出审查结论与新版本判定，正文仍由 builder 写。
