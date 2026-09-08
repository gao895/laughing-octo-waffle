import type { EndingData } from "../types/gameTypes";

export const ENDINGS: Record<string, EndingData> = {
  GOOD: {
    type: "GOOD",
    title: "GOOD END",
    description:
      "全てのステージを正しく攻略し、主人公は現実世界へ戻った。\nしかしエンドロールの後、自宅の廊下には、異界と同じ照明が一つだけ存在していた。",
  },
  NORMAL: {
    type: "NORMAL",
    title: "NORMAL END",
    description:
      "脱出には成功した。しかし主人公には異変を見る能力が残ってしまった。\n日常の風景の中にも、時折、異変が見える。",
  },
  BAD: {
    type: "BAD",
    title: "BAD END",
    description: "間違いを繰り返した主人公は、やがて自分自身が「異変」になったことに気づいた。",
  },
};
