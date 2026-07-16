// 发音系统课：10 课，从字母到语调
// item 格式: { de, ipa?, zh?, tip? } — 自动带 🔊/慢速/🎤 按钮
export const PRON_LESSONS = [
  {
    id: 'p01',
    title: '第1课 · 字母表与拼读总则',
    sub: '德语的好消息：见词能读',
    sections: [
      {
        p: '先说一个好消息：德语和英语不同，拼写和发音的对应关系非常规律。学完这 10 课的规则，你看到任何生词基本都能正确读出来——这也是为什么德语词典一般不标音标。',
      },
      {
        h: '德语字母表（26 + 4）',
        p: '德语用 26 个拉丁字母，外加 3 个变元音 ä ö ü 和 1 个特殊字母 ß（读作 Eszett，相当于 ss）。先听每个字母的"名字"（就像英语字母歌里 A B C 的读法），字母名字在拼名字、报邮箱时会用到。',
        items: [
          { de: 'A, B, C, D, E, F, G', zh: '字母名：ah, beh, tseh, deh, eh, eff, geh', tip: 'C 读"tseh"，G 读"geh"（硬音）' },
          { de: 'H, I, J, K, L, M, N', zh: '字母名：hah, ih, jott, kah, ell, emm, enn', tip: 'J 的名字是 "jott"' },
          { de: 'O, P, Q, R, S, T', zh: '字母名：oh, peh, kuh, err, ess, teh' },
          { de: 'U, V, W, X, Y, Z', zh: '字母名：uh, fau, weh, iks, ypsilon, tsett', tip: 'V 叫 "fau"，W 叫 "weh"，Z 叫 "tsett"——和英语完全不同！' },
          { de: 'Ä, Ö, Ü, ß', zh: '变元音和 Eszett', tip: 'ß 只出现在词中/词尾，永远不在词首' },
        ],
      },
      {
        h: '三条拼读总则',
        p: '① 德语单词基本"怎么写就怎么读"，几乎每个字母都要发音（不像英语有大量不发音字母）。\n② 名词首字母永远大写——看到句子中间的大写词，那就是名词。\n③ 重音通常落在第一个音节（详见第 10 课）。',
        tip: '学习方法：每条示范先听 2 遍（可点"慢"），再点 🎤 跟读。识别结果标绿说明机器听懂了你的发音。',
      },
      {
        h: '先试试跟读',
        items: [
          { de: 'Hallo!', ipa: '[haˈloː]', zh: '你好！' },
          { de: 'Guten Tag!', ipa: '[ˌɡuːtn̩ ˈtaːk]', zh: '你好！（白天问候）' },
          { de: 'Danke schön!', ipa: '[ˈdaŋkə ʃøːn]', zh: '非常感谢！' },
        ],
      },
    ],
  },
  {
    id: 'p02',
    title: '第2课 · 长元音与短元音',
    sub: 'a e i o u 的两种读法',
    sections: [
      {
        p: '德语的 5 个元音 a e i o u 都有"长""短"两种读法，而且长短能区分词义，必须读准。判断规则很简单：',
      },
      {
        h: '怎么判断长短？',
        p: '读长音的三种情况：① 元音后面只跟 1 个辅音（如 Name）；② 元音后有 h（h 不发音，只表示拉长，如 fahren）；③ 元音双写（如 Boot），以及 ie 永远读长音 [iː]。\n读短音：元音后面跟 2 个或更多辅音（如 kommen、Bett）。',
        tip: '长音要拉够长度（约短音的两倍），嘴型紧张；短音急促放松。这是中国学习者最容易忽略的一点。',
      },
      {
        h: 'a：长 [aː] vs 短 [a]',
        items: [
          { de: 'Name', ipa: '[ˈnaːmə]', zh: '名字', tip: '长 a，嘴张大' },
          { de: 'fahren', ipa: '[ˈfaːʁən]', zh: '行驶（ah = 长a）' },
          { de: 'Mann', ipa: '[man]', zh: '男人', tip: '双 n → 短 a，干脆利落' },
        ],
      },
      {
        h: 'e：长 [eː] vs 短 [ɛ] vs 弱化 [ə]',
        p: '注意：非重读音节（尤其词尾 -e、-en）里的 e 读成很轻的 [ə]，一带而过。',
        items: [
          { de: 'leben', ipa: '[ˈleːbn̩]', zh: '生活', tip: '第一个 e 长音（嘴角向两边咧），词尾 -en 弱化' },
          { de: 'essen', ipa: '[ˈɛsn̩]', zh: '吃', tip: '双 s → 短 e，像"哎"但更短' },
          { de: 'gehen', ipa: '[ˈɡeːən]', zh: '走（eh = 长e）' },
        ],
      },
      {
        h: 'i：长 [iː] vs 短 [ɪ]',
        items: [
          { de: 'Kino', ipa: '[ˈkiːno]', zh: '电影院', tip: '长 i' },
          { de: 'bitte', ipa: '[ˈbɪtə]', zh: '请', tip: '双 t → 短 i，比"衣"松' },
          { de: 'sieben', ipa: '[ˈziːbn̩]', zh: '七', tip: 'ie 永远读长 [iː]' },
        ],
      },
      {
        h: 'o：长 [oː] vs 短 [ɔ]',
        items: [
          { de: 'Brot', ipa: '[bʁoːt]', zh: '面包', tip: '长 o，嘴唇拢圆' },
          { de: 'kommen', ipa: '[ˈkɔmən]', zh: '来', tip: '双 m → 短 o' },
          { de: 'wohnen', ipa: '[ˈvoːnən]', zh: '居住（oh = 长o）' },
        ],
      },
      {
        h: 'u：长 [uː] vs 短 [ʊ]',
        items: [
          { de: 'gut', ipa: '[ɡuːt]', zh: '好', tip: '长 u，像"乌"拉长' },
          { de: 'Mutter', ipa: '[ˈmʊtɐ]', zh: '妈妈', tip: '双 t → 短 u' },
          { de: 'Uhr', ipa: '[uːɐ̯]', zh: '钟表（uh = 长u）' },
        ],
      },
      {
        h: '对比跟读',
        items: [
          { de: 'Stadt – Staat', zh: '城市（短a）– 国家（长a）', tip: '经典对比：长短不同，意思完全不同' },
          { de: 'offen – Ofen', zh: '开着的（短o）– 烤箱（长o）' },
        ],
      },
    ],
  },
  {
    id: 'p03',
    title: '第3课 · 变元音 ä ö ü',
    sub: '德语最有特色的三个音',
    sections: [
      {
        p: '这三个带两点的元音叫"变元音"（Umlaut），是德语的招牌发音。它们同样分长短。掌握口型是关键：',
      },
      {
        h: 'ä：嘴张开说"哎"',
        p: '长 ä [ɛː] 类似"哎"拉长；短 ä [ɛ] 和短 e 完全一样。对中国人来说 ä 最简单。',
        items: [
          { de: 'Käse', ipa: '[ˈkɛːzə]', zh: '奶酪', tip: '长 ä' },
          { de: 'Mädchen', ipa: '[ˈmɛːtçən]', zh: '女孩' },
          { de: 'Männer', ipa: '[ˈmɛnɐ]', zh: '男人们', tip: '短 ä' },
        ],
      },
      {
        h: 'ö：说"哎"的舌位 + "喔"的嘴型',
        p: '诀窍：先发长 e [eː]（嘴角咧开），保持舌头不动，慢慢把嘴唇拢成圆形——出来的就是 ö。有点像普通话"约(yuē)"里去掉 y 的音，但嘴更圆。',
        items: [
          { de: 'schön', ipa: '[ʃøːn]', zh: '美的', tip: '长 ö' },
          { de: 'hören', ipa: '[ˈhøːʁən]', zh: '听' },
          { de: 'zwölf', ipa: '[tsvœlf]', zh: '十二', tip: '短 ö，更松' },
          { de: 'können', ipa: '[ˈkœnən]', zh: '能够' },
        ],
      },
      {
        h: 'ü：就是拼音的 ü（"鱼"）',
        p: '好消息：德语 ü 和普通话"鱼 yú"的韵母几乎一样！长 ü [yː] 拉长，短 ü [ʏ] 短促放松。',
        items: [
          { de: 'über', ipa: '[ˈyːbɐ]', zh: '在…上方', tip: '长 ü，=拼音 ü 拉长' },
          { de: 'Tür', ipa: '[tyːɐ̯]', zh: '门' },
          { de: 'fünf', ipa: '[fʏnf]', zh: '五', tip: '短 ü' },
          { de: 'Glück', ipa: '[ɡlʏk]', zh: '幸福；运气' },
        ],
      },
      {
        h: '对比训练（重要！）',
        p: '很多词只差一个变音符，意思完全不同：',
        items: [
          { de: 'schon – schön', zh: '已经 – 美的', tip: 'o 圆唇靠后，ö 圆唇靠前' },
          { de: 'Bruder – Brüder', zh: '兄弟（单数）– 兄弟（复数）', tip: '复数常靠变元音区分！' },
          { de: 'Mutter – Mütter', zh: '妈妈 – 妈妈们' },
        ],
      },
    ],
  },
  {
    id: 'p04',
    title: '第4课 · 双元音 ei au eu ie',
    sub: 'ei 读"艾"，eu 读"奥伊"',
    sections: [
      {
        p: '两个元音连写常常合成一个"双元音"。德语只有三个真正的双元音，非常好记；另外 ie 不是双元音，它就是长 i。',
      },
      {
        h: 'ei / ai → [ae]，像"艾"',
        p: '注意！ei 读"艾"不读"诶"——这是初学者最常见的错误。记住 nein（不）读"nain"。',
        items: [
          { de: 'nein', ipa: '[naen]', zh: '不' },
          { de: 'eins, zwei, drei', zh: '一、二、三', tip: '数数就能记住 ei 的读法' },
          { de: 'Wein', ipa: '[vaen]', zh: '葡萄酒' },
          { de: 'Mai', ipa: '[mae]', zh: '五月', tip: 'ai 同音' },
        ],
      },
      {
        h: 'au → [ao]，像"傲"',
        items: [
          { de: 'Haus', ipa: '[haos]', zh: '房子' },
          { de: 'Frau', ipa: '[fʁao]', zh: '女士；妻子' },
          { de: 'kaufen', ipa: '[ˈkaofn̩]', zh: '买' },
        ],
      },
      {
        h: 'eu / äu → [ɔø]，像"奥伊"连读',
        p: '快速把"哦"滑向"以"（圆唇）。Deutsch（德语）这个词本身就含这个音。',
        items: [
          { de: 'Deutsch', ipa: '[dɔøtʃ]', zh: '德语' },
          { de: 'heute', ipa: '[ˈhɔøtə]', zh: '今天' },
          { de: 'neun', ipa: '[nɔøn]', zh: '九' },
          { de: 'Häuser', ipa: '[ˈhɔøzɐ]', zh: '房子（复数）', tip: 'äu 和 eu 同音' },
        ],
      },
      {
        h: 'ie → 长 [iː]（不是双元音）',
        items: [
          { de: 'Liebe', ipa: '[ˈliːbə]', zh: '爱' },
          { de: 'vier', ipa: '[fiːɐ̯]', zh: '四' },
          { de: 'Wie bitte?', zh: '请再说一遍？' },
        ],
      },
      {
        h: '易混对比',
        items: [
          { de: 'ein – nein – neun', zh: '一个 – 不 – 九', tip: 'ei 读"艾"，eu 读"奥伊"，别混！' },
          { de: 'Wien – Wein', zh: '维也纳（长i）– 葡萄酒（"艾"）', tip: 'ie vs ei，写法容易看混' },
        ],
      },
    ],
  },
  {
    id: 'p05',
    title: '第5课 · s 家族：s ss ß sch sp st',
    sub: '一个字母的五副面孔',
    sections: [
      {
        h: 's 在元音前 → 浊音 [z]（像蜜蜂嗡嗡）',
        p: '这和英语相反！德语的 s 在元音前要振动声带，读 [z]。',
        items: [
          { de: 'Sonne', ipa: '[ˈzɔnə]', zh: '太阳', tip: '声带振动的 z' },
          { de: 'lesen', ipa: '[ˈleːzn̩]', zh: '阅读' },
          { de: 'Sie sind', zh: '您是', tip: '两个词的 s 都是浊音' },
        ],
      },
      {
        h: 'ss / ß → 清音 [s]',
        p: 'ss 和 ß 发音相同，都是普通的 s 音。区别只在拼写：短元音后写 ss，长元音/双元音后写 ß。',
        items: [
          { de: 'essen', ipa: '[ˈɛsn̩]', zh: '吃', tip: '短 e + ss' },
          { de: 'Straße', ipa: '[ˈʃtʁaːsə]', zh: '街道', tip: '长 a + ß' },
          { de: 'heißen', ipa: '[ˈhaesn̩]', zh: '叫（名字）', tip: '双元音 + ß' },
        ],
      },
      {
        h: 'sch → [ʃ]，像"什"',
        p: '嘴唇向前撅，比汉语"什"更用力。',
        items: [
          { de: 'Schule', ipa: '[ˈʃuːlə]', zh: '学校' },
          { de: 'schön', ipa: '[ʃøːn]', zh: '美的' },
          { de: 'Tisch', ipa: '[tɪʃ]', zh: '桌子' },
        ],
      },
      {
        h: '词首 sp- / st- → [ʃp] / [ʃt]',
        p: '重要规则：sp 和 st 出现在词（或词干）开头时，s 要读成 sch！所以 Sport 读"什波特"，不读"斯波特"。',
        items: [
          { de: 'sprechen', ipa: '[ˈʃpʁɛçn̩]', zh: '说话', tip: 'schp-' },
          { de: 'Sport', ipa: '[ʃpɔʁt]', zh: '体育' },
          { de: 'Student', ipa: '[ʃtuˈdɛnt]', zh: '大学生', tip: 'scht-' },
          { de: 'verstehen', ipa: '[fɛɐ̯ˈʃteːən]', zh: '理解', tip: '词干 stehen 开头，仍读 scht' },
        ],
      },
      {
        h: '综合跟读',
        items: [
          { de: 'Ich spreche ein bisschen Deutsch.', zh: '我会说一点德语。' },
          { de: 'Die Straße ist schön.', zh: '这条街很美。' },
        ],
      },
    ],
  },
  {
    id: 'p06',
    title: '第6课 · ch 的两种读法与 -ig',
    sub: '德语最难也最有味道的音',
    sections: [
      {
        p: 'ch 是德语的标志性发音，有两种读法，规则完全由前面的元音决定：',
      },
      {
        h: '"轻 ch" [ç]：在 e i ä ö ü ei eu 及辅音后',
        p: '发音方法：摆出说"衣"的口型，然后只送气不出声，气流从舌面和硬腭之间摩擦而出——像小声说"嘻"但没有声带振动。普通话"西"的声母接近这个音。',
        items: [
          { de: 'ich', ipa: '[ɪç]', zh: '我', tip: '最重要的一个词！不要读成"ish"或"ik"' },
          { de: 'nicht', ipa: '[nɪçt]', zh: '不' },
          { de: 'sprechen', ipa: '[ˈʃpʁɛçn̩]', zh: '说' },
          { de: 'Milch', ipa: '[mɪlç]', zh: '牛奶', tip: '辅音 l 之后 → 轻ch' },
          { de: 'München', ipa: '[ˈmʏnçn̩]', zh: '慕尼黑' },
        ],
      },
      {
        h: '"重 ch" [x]：在 a o u au 后',
        p: '像清嗓子时喉咙后部的摩擦音，接近汉语"喝 h"但摩擦更强。',
        items: [
          { de: 'Buch', ipa: '[buːx]', zh: '书' },
          { de: 'auch', ipa: '[aox]', zh: '也' },
          { de: 'Nacht', ipa: '[naxt]', zh: '夜晚' },
          { de: 'kochen', ipa: '[ˈkɔxn̩]', zh: '做饭' },
        ],
      },
      {
        h: '词尾 -ig → [ɪç]（读得像 -ich）',
        items: [
          { de: 'zwanzig', ipa: '[ˈtsvantsɪç]', zh: '二十' },
          { de: 'richtig', ipa: '[ˈʁɪçtɪç]', zh: '正确的' },
          { de: 'billig', ipa: '[ˈbɪlɪç]', zh: '便宜的' },
        ],
      },
      {
        h: '特例：chs → [ks]；词首 Ch',
        items: [
          { de: 'sechs', ipa: '[zɛks]', zh: '六', tip: 'chs 读 ks，像 x' },
          { de: 'China', zh: '中国', tip: '标准德语读 [ˈçiːna]（轻ch）' },
        ],
      },
      {
        h: '两种 ch 交替训练',
        items: [
          { de: 'ich – auch – nicht – Buch', zh: '我 – 也 – 不 – 书', tip: '轻-重-轻-重' },
          { de: 'Ich koche auch nicht.', zh: '我也不做饭。' },
        ],
      },
    ],
  },
  {
    id: 'p07',
    title: '第7课 · w v z j qu 与英语的"假朋友"',
    sub: '长得像英语，读法不一样',
    sections: [
      {
        p: '这几个字母拼写和英语一样，读法却不同，是发音"事故高发区"：',
      },
      {
        h: 'w → [v]（英语 v 的音）',
        items: [
          { de: 'Wasser', ipa: '[ˈvasɐ]', zh: '水', tip: '上齿轻咬下唇' },
          { de: 'wir', ipa: '[viːɐ̯]', zh: '我们' },
          { de: 'wie', ipa: '[viː]', zh: '如何' },
        ],
      },
      {
        h: 'v → 本族词读 [f]，外来词读 [v]',
        items: [
          { de: 'Vater', ipa: '[ˈfaːtɐ]', zh: '爸爸', tip: '读 f！' },
          { de: 'viel', ipa: '[fiːl]', zh: '许多' },
          { de: 'vier', ipa: '[fiːɐ̯]', zh: '四' },
          { de: 'Vase', ipa: '[ˈvaːzə]', zh: '花瓶', tip: '外来词读 v' },
        ],
      },
      {
        h: 'z → [ts]，像"次"',
        p: '德语 z 永远读 [ts]，干脆利落，绝不读英语的 [z]。',
        items: [
          { de: 'Zeit', ipa: '[tsaet]', zh: '时间' },
          { de: 'zehn', ipa: '[tseːn]', zh: '十' },
          { de: 'Zug', ipa: '[tsuːk]', zh: '火车' },
        ],
      },
      {
        h: 'j → [j]，像"耶"的开头',
        items: [
          { de: 'ja', ipa: '[jaː]', zh: '是的' },
          { de: 'Januar', ipa: '[ˈjanuaːɐ̯]', zh: '一月' },
          { de: 'Jahr', ipa: '[jaːɐ̯]', zh: '年' },
        ],
      },
      {
        h: 'qu → [kv]',
        items: [
          { de: 'Qualität', ipa: '[kvaliˈtɛːt]', zh: '质量', tip: 'k+v 连读' },
          { de: 'bequem', ipa: '[bəˈkveːm]', zh: '舒适的' },
        ],
      },
      {
        h: '词尾清化：b d g → p t k',
        p: '词尾（或音节尾）的 b d g 要读成对应的清音 p t k：Tag 读 [taːk]，und 读 [ʊnt]，halb 读 [halp]。',
        items: [
          { de: 'Tag', ipa: '[taːk]', zh: '天', tip: '词尾 g → k' },
          { de: 'und', ipa: '[ʊnt]', zh: '和', tip: '词尾 d → t' },
          { de: 'Abend', ipa: '[ˈaːbn̩t]', zh: '晚上' },
        ],
      },
    ],
  },
  {
    id: 'p08',
    title: '第8课 · r 的读法',
    sub: '小舌音没那么可怕',
    sections: [
      {
        p: '德语 r 有两种情况：辅音 r（要发摩擦音）和元音化的 r（几乎变成"啊"）。搞清楚什么时候用哪种，比死磕小舌颤音更重要。',
      },
      {
        h: '辅音 r [ʁ]：在元音前',
        p: '标准德语用"小舌摩擦音"：舌根后缩靠近小舌，让气流摩擦——很像轻轻漱口的声音，或者用喉咙发"喝"时加上声带振动。练习：含一小口水仰头漱口，记住那个位置。发不好也不用焦虑，用汉语"喝"的位置带出摩擦即可，德国人听得懂。',
        items: [
          { de: 'rot', ipa: '[ʁoːt]', zh: '红色' },
          { de: 'Reise', ipa: '[ˈʁaezə]', zh: '旅行' },
          { de: 'Brot', ipa: '[bʁoːt]', zh: '面包', tip: '辅音后的 r 也要发出来' },
          { de: 'trinken', ipa: '[ˈtʁɪŋkn̩]', zh: '喝' },
        ],
      },
      {
        h: '元音化 r [ɐ]：词尾 -er 和长元音后',
        p: '词尾的 -er 读成轻轻的"啊"[ɐ]（不发 r 音！）；长元音后的 r 也弱化成 [ɐ̯]。所以 Mutter 结尾是"塔-啊"合起来的感觉，绝不是英语的"ter"。',
        items: [
          { de: 'Mutter', ipa: '[ˈmʊtɐ]', zh: '妈妈', tip: '-er = 轻"啊"' },
          { de: 'aber', ipa: '[ˈaːbɐ]', zh: '但是' },
          { de: 'Uhr', ipa: '[uːɐ̯]', zh: '钟', tip: '长元音 + r → 弱化' },
          { de: 'der, wir, nur', zh: '这个、我们、只', tip: '都是弱化 r' },
        ],
      },
      {
        h: '对比训练',
        items: [
          { de: 'Rose – Ohr', zh: '玫瑰（辅音r）– 耳朵（弱化r）' },
          { de: 'fahren – fährt', zh: '开车（r 在元音前发音）– 他开车（r 弱化）' },
          { de: 'Der Bruder trinkt Wasser.', zh: '哥哥在喝水。', tip: '一句话里两种 r 都有' },
        ],
      },
    ],
  },
  {
    id: 'p09',
    title: '第9课 · 其余辅音：h pf ng nk tsch -tion',
    sub: '扫清最后的拼读死角',
    sections: [
      {
        h: 'h：词首送气，元音后不发音',
        p: '词首的 h 像汉语"哈"正常发音；但元音后的 h 完全不发音，只表示前面元音读长音。',
        items: [
          { de: 'Haus', ipa: '[haos]', zh: '房子', tip: '词首 h 发音' },
          { de: 'gehen', ipa: '[ˈɡeːən]', zh: '走', tip: 'h 不发音，e 读长' },
          { de: 'Wohnung', ipa: '[ˈvoːnʊŋ]', zh: '住房' },
        ],
      },
      {
        h: 'pf：p 和 f 快速连发',
        items: [
          { de: 'Apfel', ipa: '[ˈapfl̩]', zh: '苹果', tip: '先爆破 p 立刻滑到 f' },
          { de: 'Pfund', ipa: '[pfʊnt]', zh: '磅' },
        ],
      },
      {
        h: 'ng [ŋ] / nk [ŋk]',
        p: 'ng 像"唱歌"的后鼻音，g 不单独发音；nk 是后鼻音+k。',
        items: [
          { de: 'singen', ipa: '[ˈzɪŋən]', zh: '唱歌', tip: '没有 g 的爆破音！' },
          { de: 'danke', ipa: '[ˈdaŋkə]', zh: '谢谢' },
          { de: 'Hunger', ipa: '[ˈhʊŋɐ]', zh: '饥饿' },
        ],
      },
      {
        h: 'tsch [tʃ]：像"吃"',
        items: [
          { de: 'Deutschland', ipa: '[ˈdɔøtʃlant]', zh: '德国' },
          { de: 'Tschüss!', ipa: '[tʃʏs]', zh: '再见！（口语）' },
        ],
      },
      {
        h: '外来词后缀 -tion [tsi̯oːn]',
        p: '-tion 读"齐翁"，重音在 o 上。',
        items: [
          { de: 'Information', ipa: '[ɪnfɔʁmaˈtsi̯oːn]', zh: '信息' },
          { de: 'Station', ipa: '[ʃtaˈtsi̯oːn]', zh: '车站' },
        ],
      },
      {
        h: 'x / ks / chs → [ks]，y → [y]',
        items: [
          { de: 'Taxi', ipa: '[ˈtaksi]', zh: '出租车' },
          { de: 'sechs', ipa: '[zɛks]', zh: '六' },
          { de: 'typisch', ipa: '[ˈtyːpɪʃ]', zh: '典型的', tip: 'y 读 ü' },
        ],
      },
    ],
  },
  {
    id: 'p10',
    title: '第10课 · 词重音与句子语调',
    sub: '让你的德语"像德语"',
    sections: [
      {
        p: '单个音都读对了，重音和语调不对，德国人还是会觉得"怪"。好在德语重音规则很清楚：',
      },
      {
        h: '规则一：重音通常在第一个音节',
        items: [
          { de: 'ARbeiten', zh: '工作（重音在 AR）' },
          { de: 'DEUTSCHland', zh: '德国' },
          { de: 'MORgen', zh: '早晨' },
        ],
      },
      {
        h: '规则二：可分前缀重读，不可分前缀不重读',
        p: '可分前缀（an- auf- ein- mit- aus-…）永远重读；不可分前缀（be- ge- er- ver- ent-…）永远不重读，重音落在词干上。这条规则以后学可分动词时非常有用。',
        items: [
          { de: 'ANfangen', zh: '开始（可分，重音在前缀）' },
          { de: 'AUFstehen', zh: '起床' },
          { de: 'verSTEhen', zh: '理解（不可分，重音在词干）' },
          { de: 'beZAHlen', zh: '付款' },
        ],
      },
      {
        h: '规则三：外来词重音常靠后',
        items: [
          { de: 'Stu-DENT', zh: '大学生' },
          { de: 'Universi-TÄT', zh: '大学' },
          { de: 'Informati-ON', zh: '信息' },
        ],
      },
      {
        h: '句子语调',
        p: '① 陈述句：句尾降调 ↘\n② 是非疑问句（能用 ja/nein 回答的）：句尾升调 ↗\n③ 特殊疑问句（W- 开头的）：句尾降调 ↘（和英语不同，别习惯性上扬！）',
        items: [
          { de: 'Ich lerne Deutsch.', zh: '我在学德语。（降调 ↘）' },
          { de: 'Lernst du Deutsch?', zh: '你在学德语吗？（升调 ↗）' },
          { de: 'Was lernst du?', zh: '你在学什么？（降调 ↘）' },
        ],
      },
      {
        h: '毕业跟读：把学到的都用上',
        items: [
          { de: 'Guten Morgen! Wie geht es Ihnen?', zh: '早上好！您好吗？' },
          { de: 'Ich heiße Wang und komme aus China.', zh: '我姓王，来自中国。' },
          { de: 'Ich spreche ein bisschen Deutsch, aber ich lerne jeden Tag.', zh: '我会说一点德语，但我每天都在学。' },
        ],
        tip: '恭喜完成发音课！以后遇到任何生词，都可以回来查这 10 课的规则。',
      },
    ],
  },
];
