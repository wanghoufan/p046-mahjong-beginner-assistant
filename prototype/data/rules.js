/* Runtime mirror of data/rules.json for file:// offline use (fetch/XHR is blocked on file://).
   【双份维护警示 / DUAL-MAINTENANCE WARNING】data/rules.js 是运行期真源（页面实际加载的那份），data/rules.json 是规范记录源（QA/开发查看用）。改数据必须同步两处：任何一边改动都要在另一边写入同样内容，保持两边 JSON 内容等价，否则会出现「QA 看 json 对、线上跑 js 错」。 data/rules.js is the runtime truth the page loads; data/rules.json is the record source. Update BOTH files together and keep them JSON-equivalent. */
window.P046_RULES = {
  "_sync_warning": "【双份维护警示 / DUAL-MAINTENANCE WARNING】data/rules.js 是运行期真源（页面实际加载的那份），data/rules.json 是规范记录源（QA/开发查看用）。改数据必须同步两处：任何一边改动都要在另一边写入同样内容，保持两边 JSON 内容等价，否则会出现「QA 看 json 对、线上跑 js 错」。 data/rules.js is the runtime truth the page loads; data/rules.json is the record source. Update BOTH files together and keep them JSON-equivalent.",
  "version": "1.2",
  "date": "2026-10-09",
  "note": "Norm from docs/plan/P046-V1.2/rules/rule-profiles.json. IDs, semantics and sources kept stable. evidence_grade is a display-only field derived from plan §4 source strength. 只收录海南一个玩法档（其余地区玩法已在本轮全部移除）。",
  "profiles": [
    {
      "id": "HN_FAN_REFERENCE",
      "name": "海南常见“有番”玩法（资料参考版）",
      "region": "海南",
      "region_key": "hainan",
      "status": "CROSS_REPORTED_NOT_UNIFIED",
      "evidence_grade": "B",
      "tile_count": 144,
      "tile_family": [
        "W",
        "P",
        "S",
        "Z",
        "F"
      ],
      "allow_chi": true,
      "win_structure": "通常4组+1对，另有七对、十三幺等特殊牌型",
      "win_gate": "常见说法：有番可点炮胡、无番可自摸；二五八做眼、座位对应花牌、特定风/箭牌刻子等可构成番",
      "source_ids": [
        "R-HN-PRIMARY",
        "R-HN-CROSS",
        "R-HN-ENCYC"
      ],
      "caveat": "不是覆盖海口、文昌、琼海等所有牌桌的官方统一标准。精确番种及胡法遵循桌规；“当花又当眼”术语证据不足，不作为可判定规则",
      "example_ids": [
        "E04",
        "E05",
        "E06",
        "E07"
      ]
    }
  ],
  "sources": [
    {
      "id": "R-HN-PRIMARY",
      "url": "https://www.sohu.com/a/77655029_362100"
    },
    {
      "id": "R-HN-CROSS",
      "url": "https://www.sohu.com/a/355201965_120435448"
    },
    {
      "id": "R-HN-ENCYC",
      "url": "https://www.newton.com.tw/wiki/海南麻將"
    }
  ]
};
