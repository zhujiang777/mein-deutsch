// 应试板块的数据层。产品形态见 docs/product-shape.md 第 6 条决策。
//
// 应试是三层，材料来源刻意不同：
//   每日小测 —— 当天的今日文章现出的 2 道判断对错（不在这个文件里，由 AI 随文章生成）
//   阶段测验 —— 这里的 EXAM_TASKS，全是没见过的新材料，每走完 5 格串联一次
//   毕业模考 —— 还是这里的 EXAM_TASKS，只是按 part + teil 串成整套
//
// 所以模考不是另一套数据，是同一套数据的另一种取用方式。别为它再建一张表。
//
// ⚠️ items[] 里写的必须是 js/exercises.js 的 renderExercise 能直接吃的对象。
// 题干字段名是 **prompt** 不是 q —— renderChoice 读的是 item.prompt，
// 而 js/ui.js 的 renderQuiz 读的是 ex.q，两套并存，写错了题干就是空白。
import { EXAM_CELLS } from './panorama.js';

/**
 * 11 格的权威口径。已按官方模考平台 bfu.goethe.de/a1_sd1/ 逐模块核实（2026-07）。
 * count/points 是官方题量与分值：一组题就得出满这个数，不能随手写三道充数
 * （tests/exam-data.test.mjs 会拦）。plays 是听力播放次数上限。
 */
export const EXAM_PARTS = EXAM_CELLS.map(cell => ({
  id: cell.id,
  part: cell.id[0] === 'H' ? 'hoeren' : cell.id[0] === 'L' ? 'lesen'
    : cell.id[0] === 'S' ? 'schreiben' : 'sprechen',
  teil: cell.teil,
  count: cell.count || 0,
  points: cell.points || 0,
  plays: cell.plays || 0,
  status: cell.status,
}));

const PART_BY_ID = new Map(EXAM_PARTS.map(part => [part.id, part]));
export function examPart(cellId) {
  return PART_BY_ID.get(cellId) || null;
}

/**
 * 阶段测验与模考的题库。第 5b 步开始填，现在是空的。
 *
 * 一条的形状：
 * {
 *   id: 'x-l3-01',            // x- 前缀，和 li- / rp- / u1l1 / v1 都不撞车
 *   cellId: 'L3',
 *   titleZh: '看三块告示牌，判断说法对不对',
 *   source: { kind: 'inline' }                       // 自带极短原创正文
 *         | { kind: 'reading', id: 'r03' }           // 精读原文原样铺出来
 *         | { kind: 'listening', id: 'li-b01', range: [2, 7] },
 *   stimulus: [{ layout: 'aushang', de, zh, newLemmas: [] }],   // inline 时才有
 *   prereq: { afterCell: 10, skills: ['nicht-kein'], sourceDone: true },
 *   skills: ['read-scan'],    // 组级默认，喂 recordAnswer；必须是课程里已存在的标签
 *   items: [{ type:'choice', prompt, options, a, explain, evidence?, skills? }],
 * }
 */
/**
 * 材料一律原创，不抄真题原文 —— 题型结构是公开的，题目自己出。
 * 语言守 A1 红线：无从句（weil/dass/wenn）、无第二格介词、无被动、
 * 过去时只有 war/hatte。
 *
 * stimulus 分两级，对应真考试的两种版面：
 *   task.stimulus —— 整组共用一份材料（L1：一封信配 5 句判断）
 *   item.stimulus —— 每道题自带一块牌子（L3：5 块告示牌各判一句）
 */
const RF = ['Richtig', 'Falsch'];

export const EXAM_TASKS = [
  /* ---------- L1 · 短信 / 邮件 / 通知 · 判断对错 ---------- */
  {
    id: 'x-l1-01',
    cellId: 'L1',
    titleZh: '读一封朋友的邮件，判断五句话对不对',
    subZh: 'Goethe A1 阅读第一部分 · 5 题 5 分',
    source: { kind: 'inline' },
    prereq: { afterCell: 5, skills: ['time-informal'] },
    skills: ['time-informal', 'separable-verbs'],
    stimulus: [{
      layout: 'mail',
      title: 'E-Mail von Lena',
      de: 'Hallo Ben,\nam Samstag habe ich Zeit. Wir können zusammen ins Kino gehen.\n'
        + 'Der Film beginnt um halb acht. Ich hole dich um sieben Uhr ab.\n'
        + 'Die Karte kostet neun Euro. Bitte bring das Geld mit.\nBis Samstag!\nLena',
      zh: '你好 Ben，\n周六我有空。我们可以一起去看电影。\n电影七点半开始。我七点来接你。\n'
        + '票九欧。请把钱带上。\n周六见！\nLena',
    }],
    items: [
      { type: 'choice', prompt: 'Lena und Ben gehen am Samstag ins Kino.', options: RF, a: 0,
        explain: '第 2 句 Wir können zusammen ins Kino gehen，时间在第 1 句 am Samstag。',
        skills: ['modal-koennen-wollen'] },
      { type: 'choice', prompt: 'Der Film beginnt um acht Uhr.', options: RF, a: 1,
        explain: 'halb acht 是七点半，不是八点 —— 德语的 halb 指「差半小时到下一个整点」。',
        skills: ['time-informal'] },
      { type: 'choice', prompt: 'Lena kommt um sieben Uhr zu Ben.', options: RF, a: 0,
        explain: 'Ich hole dich um sieben Uhr ab（abholen 是可分动词，ab 甩到句末）。',
        skills: ['separable-verbs'] },
      { type: 'choice', prompt: 'Die Karte kostet neunzehn Euro.', options: RF, a: 1,
        explain: 'neun 是 9，neunzehn 才是 19 —— 听力和阅读都爱在这两个词上设陷阱。',
        skills: ['numbers-1-20'] },
      { type: 'choice', prompt: 'Ben muss Geld mitbringen.', options: RF, a: 0,
        explain: 'Bitte bring das Geld mit 是命令式，等于「你得带钱」。',
        skills: ['imperative-du'] },
    ],
  },
  {
    id: 'x-l1-02',
    cellId: 'L1',
    titleZh: '读一条请假短信，判断五句话对不对',
    subZh: 'Goethe A1 阅读第一部分 · 5 题 5 分',
    source: { kind: 'inline' },
    prereq: { afterCell: 10, skills: ['nicht-kein'] },
    skills: ['nicht-kein', 'symptoms'],
    stimulus: [{
      layout: 'mail',
      title: 'Nachricht an die Lehrerin',
      de: 'Hallo Frau Weber,\nich bin heute krank. Ich habe Fieber und Halsschmerzen.\n'
        + 'Ich kann nicht zum Deutschkurs kommen.\nMeine Freundin Mia bringt Ihnen meine Hausaufgaben.\n'
        + 'Am Montag bin ich wieder da.\nViele Grüße, Ana',
      zh: '您好 Weber 老师，\n我今天生病了。我发烧、嗓子疼。\n我不能来上德语课。\n'
        + '我朋友 Mia 会把我的作业带给您。\n周一我就回来了。\n此致，Ana',
    }],
    items: [
      { type: 'choice', prompt: 'Ana ist heute krank.', options: RF, a: 0,
        explain: '第 1 句 ich bin heute krank，直接给出。', skills: ['sein-sg'] },
      { type: 'choice', prompt: 'Ana kommt heute zum Deutschkurs.', options: RF, a: 1,
        explain: 'Ich kann nicht zum Deutschkurs kommen —— nicht 否定的是整个动作。',
        skills: ['nicht-kein'] },
      { type: 'choice', prompt: 'Ana hat Kopfschmerzen.', options: RF, a: 1,
        explain: '信里是 Halsschmerzen（嗓子疼），不是 Kopfschmerzen（头疼）。同一个词尾 -schmerzen，前面那半才是答案。',
        skills: ['symptoms'] },
      { type: 'choice', prompt: 'Mia bringt der Lehrerin die Hausaufgaben.', options: RF, a: 0,
        explain: 'bringt Ihnen —— Ihnen 是第三格的「给您」，指的就是 Frau Weber。',
        skills: ['pronoun-dativ'] },
      { type: 'choice', prompt: 'Ana kommt am Dienstag wieder.', options: RF, a: 1,
        explain: 'Am Montag bin ich wieder da，是周一不是周二。', skills: ['prep-time-an-um'] },
    ],
  },
  {
    id: 'x-l1-03',
    cellId: 'L1',
    titleZh: '读楼道里的一张通知，判断五句话对不对',
    subZh: 'Goethe A1 阅读第一部分 · 5 题 5 分',
    source: { kind: 'inline' },
    prereq: { afterCell: 15, skills: ['prep-time-an-um'] },
    skills: ['prep-time-an-um', 'kein-basic'],
    stimulus: [{
      layout: 'aushang',
      title: 'Aushang im Hausflur',
      de: 'Liebe Nachbarn,\nam Dienstag gibt es von neun bis zwölf Uhr keinen Strom.\n'
        + 'Der Aufzug fährt an diesem Tag auch nicht.\nBitte nehmen Sie die Treppe.\n'
        + 'Danke!\nIhr Hausmeister',
      zh: '各位邻居：\n周二九点到十二点停电。\n那天电梯也不运行。\n请走楼梯。\n谢谢！\n你们的管理员',
    }],
    items: [
      { type: 'choice', prompt: 'Am Dienstag gibt es am Vormittag keinen Strom.', options: RF, a: 0,
        explain: 'von neun bis zwölf Uhr 正是上午。es gibt keinen … 是「没有…」的固定说法。',
        skills: ['es-impersonal'] },
      { type: 'choice', prompt: 'Um elf Uhr funktioniert der Strom.', options: RF, a: 1,
        explain: '十一点落在 9–12 这段里，还在停电。判断题最常考的就是「某个点在不在这个区间里」。',
        skills: ['prep-time-an-um'] },
      { type: 'choice', prompt: 'Der Aufzug fährt am Dienstag normal.', options: RF, a: 1,
        explain: 'fährt … auch nicht —— nicht 在句末否定整句。', skills: ['nicht-kein'] },
      { type: 'choice', prompt: 'Die Nachbarn sollen die Treppe nehmen.', options: RF, a: 0,
        explain: 'Bitte nehmen Sie die Treppe 是 Sie 的命令式：动词提到最前，Sie 跟在后面。',
        skills: ['imperative-du'] },
      { type: 'choice', prompt: 'Der Aushang ist für die Nachbarn.', options: RF, a: 0,
        explain: '抬头 Liebe Nachbarn 就是收件人。读通知先看抬头和落款，能省一半时间。',
        skills: ['plural'] },
    ],
  },

  /* ---------- L3 · 告示牌 Aushang · 判断对错 ---------- */
  {
    id: 'x-l3-01',
    cellId: 'L3',
    titleZh: '五块街上的牌子，各判断一句话',
    subZh: 'Goethe A1 阅读第三部分 · 5 题 5 分 · 每题换一块牌子',
    source: { kind: 'inline' },
    prereq: { afterCell: 5, skills: [] },
    skills: ['prep-time-an-um'],
    items: [
      { type: 'choice', a: 1, options: RF,
        stimulus: { layout: 'sign', title: 'An der Bäckerei', de: 'Heute geschlossen.\nAb Montag sind wir wieder für Sie da.', zh: '今日休息。周一起恢复营业。' },
        prompt: 'Sie möchten heute Brot kaufen. Die Bäckerei ist offen.',
        explain: 'geschlossen = 关门。牌子上只要出现 geschlossen，今天就别去了。' },
      { type: 'choice', a: 1, options: RF,
        stimulus: { layout: 'sign', title: 'Praxis Dr. Klein', de: 'Mo, Di, Do  8–12 Uhr\nMi  15–18 Uhr', zh: '周一、二、四 8–12 点；周三 15–18 点' },
        prompt: 'Sie wollen am Mittwoch um neun Uhr zum Arzt gehen. Das geht.',
        explain: '周三只有下午 15–18 点。看这种时间表，先找「星期」再找「点」，顺序反了就会掉坑。',
        skills: ['prep-time-an-um'] },
      { type: 'choice', a: 0, options: RF,
        stimulus: { layout: 'sign', title: 'Im Supermarkt', de: 'Angebot heute:\nÄpfel — 1 Kilo nur 1,50 €', zh: '今日特价：苹果每公斤仅 1.50 欧' },
        prompt: 'Ein Kilo Äpfel kostet heute weniger als zwei Euro.',
        explain: '1,50 € 小于 2 €。weniger als 是比较级说法，A1 只要求会认，不要求变词尾。',
        skills: ['comparative'] },
      { type: 'choice', a: 0, options: RF,
        stimulus: { layout: 'sign', title: 'Am Bahnhof', de: 'Aufzug kaputt.\nBitte nehmen Sie die Treppe.', zh: '电梯故障。请走楼梯。' },
        prompt: 'Sie können den Aufzug heute nicht benutzen.',
        explain: 'kaputt = 坏了。牌子上出现 kaputt / außer Betrieb，就是「这东西现在用不了」。',
        skills: ['modal-koennen-wollen'] },
      { type: 'choice', a: 0, options: RF,
        stimulus: { layout: 'sign', title: 'Im Schwimmbad', de: 'Kinder unter 6 Jahren schwimmen frei.', zh: '六岁以下儿童免费游泳。' },
        prompt: 'Ihr Kind ist fünf Jahre alt. Es zahlt nichts.',
        explain: 'unter 6 = 不到六岁，五岁在范围里。frei 在告示牌上常常是「免费」，不是「空着」。',
        skills: ['numbers-1-20'] },
    ],
  },
  {
    id: 'x-l3-02',
    cellId: 'L3',
    titleZh: '五块学校和宿舍的牌子，各判断一句话',
    subZh: 'Goethe A1 阅读第三部分 · 5 题 5 分 · 每题换一块牌子',
    source: { kind: 'inline' },
    prereq: { afterCell: 10, skills: ['modal-duerfen'] },
    skills: ['modal-duerfen'],
    items: [
      { type: 'choice', a: 0, options: RF,
        stimulus: { layout: 'sign', title: 'Am Schwarzen Brett', de: 'Deutschkurs A1\nbeginnt am 3. September\num 9 Uhr, Raum 12', zh: 'A1 德语课 9 月 3 日 9 点开始，12 号教室' },
        prompt: 'Der Kurs beginnt im September.',
        explain: 'am 3. September —— 日期里的序数词后面那个词就是月份。',
        skills: ['ordinal-date'] },
      { type: 'choice', a: 1, options: RF,
        stimulus: { layout: 'sign', title: 'Im Treppenhaus', de: 'Bitte hier nicht rauchen!', zh: '此处请勿吸烟！' },
        prompt: 'Hier dürfen Sie rauchen.',
        explain: 'nicht rauchen 是禁止。dürfen 问的是「允不允许」，牌子已经说了不允许。',
        skills: ['modal-duerfen'] },
      { type: 'choice', a: 1, options: RF,
        stimulus: { layout: 'sign', title: 'Waschküche', de: 'Waschmaschine bitte nur bis 22 Uhr benutzen.', zh: '洗衣机请只在 22 点前使用。' },
        prompt: 'Um 23 Uhr können Sie noch waschen.',
        explain: 'bis 22 Uhr 是上限，23 点已经超了。bis 这个词在告示牌上几乎每次都是考点。',
        skills: ['prep-time-an-um'] },
      { type: 'choice', a: 0, options: RF,
        stimulus: { layout: 'sign', title: 'Am Büro', de: 'Freitag nur bis 13 Uhr geöffnet.', zh: '周五仅营业至 13 点。' },
        prompt: 'Am Freitagnachmittag ist das Büro zu.',
        explain: 'bis 13 Uhr 之后就关门，下午自然是 zu（关着）。geöffnet ↔ zu / geschlossen 是一对。' },
      { type: 'choice', a: 0, options: RF,
        stimulus: { layout: 'sign', title: 'Am Hauseingang', de: 'Fahrräder bitte vor das Haus stellen.', zh: '自行车请停在楼前。' },
        prompt: 'Sie sollen Ihr Fahrrad nicht ins Haus bringen.',
        explain: 'vor das Haus stellen = 停到楼外。这里是「往哪儿放」，所以用第四格 das Haus。',
        skills: ['location-dativ'] },
    ],
  },
  {
    id: 'x-l3-03',
    cellId: 'L3',
    titleZh: '五块出门在外的牌子，各判断一句话',
    subZh: 'Goethe A1 阅读第三部分 · 5 题 5 分 · 每题换一块牌子',
    source: { kind: 'inline' },
    prereq: { afterCell: 15, skills: ['numbers-tens'] },
    skills: ['numbers-tens'],
    items: [
      { type: 'choice', a: 0, options: RF,
        stimulus: { layout: 'sign', title: 'Anzeige am Bahnhof', de: 'Zug nach Hamburg\nheute von Gleis 5', zh: '开往汉堡的列车今日从 5 号站台发车' },
        prompt: 'Der Zug nach Hamburg fährt von Gleis fünf.',
        explain: '牌子上的数字和句子里的数字词要对上：5 = fünf。', skills: ['numbers-1-20'] },
      { type: 'choice', a: 0, options: RF,
        stimulus: { layout: 'sign', title: 'Im Laden', de: 'Bitte an Kasse 2 bezahlen.', zh: '请到 2 号收银台付款。' },
        prompt: 'Sie sollen an Kasse zwei bezahlen.',
        explain: 'Bitte … bezahlen 是礼貌的要求，等于 sollen。', skills: ['modal-muessen-sollen'] },
      { type: 'choice', a: 1, options: RF,
        stimulus: { layout: 'sign', title: 'Am Restaurant', de: 'Warme Küche\n12–14 Uhr und 18–21 Uhr', zh: '热菜供应：12–14 点、18–21 点' },
        prompt: 'Um 16 Uhr bekommen Sie hier ein warmes Essen.',
        explain: '16 点落在两个时段中间，正好没有热菜。两段时间的牌子，考的就是中间那个缺口。',
        skills: ['prep-time-an-um'] },
      { type: 'choice', a: 1, options: RF,
        stimulus: { layout: 'sign', title: 'Am Museum', de: 'Montag geschlossen.\nDi–So 10–18 Uhr', zh: '周一闭馆。周二至周日 10–18 点' },
        prompt: 'Am Montag können Sie ins Museum gehen.',
        explain: 'Montag geschlossen 就是周一不开。', skills: ['modal-koennen-wollen'] },
      { type: 'choice', a: 0, options: RF,
        stimulus: { layout: 'sign', title: 'An der Bushaltestelle', de: 'Am Wochenende fährt der Bus alle 30 Minuten.', zh: '周末公交每 30 分钟一班。' },
        prompt: 'Am Sonntag kommt der Bus alle halbe Stunde.',
        explain: '周日属于 Wochenende；30 Minuten 就是 halbe Stunde。这道题要连着换两次说法。',
        skills: ['numbers-tens'] },
    ],
  },

  /* ---------- H2 · 公共广播 Durchsagen · 判断对错 · 只播一遍 ---------- */
  // 全场唯一只播一遍的部分，也是最难的一段。真考试就是这个规则，界面上不给第二次机会——
  // 练习时能听十遍，考场上只有一遍，那练的就不是同一件事。
  // 广播的套路固定：一句 Achtung/Liebe Kunden 起头，中间一句是答案，末句是要求你做什么。
  {
    id: 'x-h2-01',
    cellId: 'H2',
    titleZh: '四条车站与商场广播，判断对错',
    subZh: 'Goethe A1 听力第二部分 · 4 题 4 分 · 每条只播一遍',
    source: { kind: 'inline' },
    prereq: { afterCell: 8, skills: ['nicht-kein'] },
    skills: ['nicht-kein', 'prep-time-an-um'],
    items: [
      { type: 'choice', plays: 1, options: RF, a: 0,
        audioText: 'Achtung bitte! Der Zug nach Hamburg fährt heute nicht von Gleis drei. Er fährt von Gleis sieben.',
        prompt: 'Der Zug nach Hamburg fährt von Gleis sieben.',
        explain: '第一个数字被 nicht 否定掉，真正的站台在下一句。广播最爱用这个结构，听到 nicht 就要等后面那句。',
        skills: ['nicht-kein'] },
      { type: 'choice', plays: 1, options: RF, a: 1,
        audioText: 'Liebe Kunden, wir schließen in zehn Minuten. Bitte kommen Sie jetzt zur Kasse.',
        prompt: 'Sie haben noch eine Stunde Zeit zum Einkaufen.',
        explain: 'in zehn Minuten 是十分钟后，不是一小时。Minuten / Stunde 是这类题最常换的一对。',
        skills: ['numbers-tens'] },
      { type: 'choice', plays: 1, options: RF, a: 1,
        audioText: 'Der Flug nach Wien kommt heute eine Stunde später. Bitte warten Sie hier.',
        prompt: 'Der Flug nach Wien geht pünktlich.',
        explain: 'eine Stunde später 就是不准点。陈述句用的是完全不同的词（pünktlich），只能靠意思判。',
        skills: ['comparative'] },
      { type: 'choice', plays: 1, options: RF, a: 0,
        audioText: 'Guten Morgen! Der Deutschkurs A1 ist heute nicht in Raum vier. Wir treffen uns in der Bibliothek.',
        prompt: 'Der Kurs ist heute in der Bibliothek.',
        explain: '同样是「先否定再给正确信息」。in der Bibliothek 是第三格，说的是「在哪儿」。',
        skills: ['location-dativ'] },
    ],
  },
  {
    id: 'x-h2-02',
    cellId: 'H2',
    titleZh: '再来四条日常广播，判断对错',
    subZh: 'Goethe A1 听力第二部分 · 4 题 4 分 · 每条只播一遍',
    source: { kind: 'inline' },
    prereq: { afterCell: 16, skills: ['time-formal'] },
    skills: ['time-formal'],
    items: [
      { type: 'choice', plays: 1, options: RF, a: 0,
        audioText: 'Nächste Station: Hauptbahnhof. Bitte steigen Sie hier aus für die Linie eins.',
        prompt: 'Der nächste Halt ist der Hauptbahnhof.',
        explain: 'Station 和 Halt 是同一件事的两个说法。广播里说 A，题目里写 B，这是常态。',
        skills: ['separable-verbs'] },
      { type: 'choice', plays: 1, options: RF, a: 1,
        audioText: 'Heute Abend gibt es im dritten Stock Kaffee und Kuchen für alle Kunden. Der Kaffee ist frei.',
        prompt: 'Der Kaffee kostet zwei Euro.',
        explain: 'frei 在这里是「免费」。广播里没出现过任何价钱，凡是凭空多出来的数字都要警觉。',
        skills: ['es-impersonal'] },
      { type: 'choice', plays: 1, options: RF, a: 1,
        audioText: 'Liebe Gäste, das Schwimmbad schließt heute schon um achtzehn Uhr. Bitte gehen Sie um Viertel vor sechs aus dem Wasser.',
        prompt: 'Das Schwimmbad ist heute bis zwanzig Uhr offen.',
        explain: 'achtzehn Uhr = 18 点。schon 这个字本身就在提示「比平常早」。',
        skills: ['time-formal'] },
      { type: 'choice', plays: 1, options: RF, a: 0,
        audioText: 'Achtung bitte! Die Bibliothek schließt in fünf Minuten. Bitte bringen Sie Ihre Bücher zur Information.',
        prompt: 'Sie sollen die Bücher zur Information bringen.',
        explain: '广播的最后一句几乎总是「请你做什么」，那一句就是这类题的答案来源。',
        skills: ['imperative-du'] },
    ],
  },

  /* ---------- H3 · 电话留言 · 三选一 · 播两遍 ---------- */
  // 留言的套路也固定：报家门 → 说事 → 常常带一个「改期 / 改地点」的转折。
  // 所以陷阱几乎永远在那个被否定掉的第一个信息上。
  {
    id: 'x-h3-01',
    cellId: 'H3',
    titleZh: '五条电话留言，听完选答案',
    subZh: 'Goethe A1 听力第三部分 · 5 题 5 分 · 每条最多听两遍',
    source: { kind: 'inline' },
    prereq: { afterCell: 12, skills: ['time-informal'] },
    skills: ['time-informal', 'appointment'],
    items: [
      { type: 'choice', plays: 2,
        audioText: 'Hallo, hier ist Anna. Wir treffen uns morgen nicht um sieben. Ich komme erst um acht. Bis dann!',
        prompt: 'Wann kommt Anna?', options: ['um sieben', 'um acht', 'um neun'], a: 1,
        explain: 'erst um acht —— erst 是「要到…才」，它后面那个时间才是真的。',
        skills: ['time-informal'] },
      { type: 'choice', plays: 2,
        audioText: 'Guten Tag, Praxis Doktor Weber. Ihr Termin am Dienstag geht leider nicht. Können Sie am Mittwoch um zehn Uhr kommen?',
        prompt: 'Wann soll der Patient kommen?',
        options: ['am Mittwoch um zehn', 'am Dienstag um zehn', 'am Mittwoch um zwei'], a: 0,
        explain: '旧时间被 geht leider nicht 取消，新时间在问句里。三个选项各错一个字段，是这类题的标准做法。',
        skills: ['appointment'] },
      { type: 'choice', plays: 2,
        audioText: 'Hier ist Papa. Ich bin noch im Büro. Bitte kauf Brot und Milch. Das Geld liegt auf dem Tisch.',
        prompt: 'Was soll das Kind kaufen?',
        options: ['Brot und Käse', 'nur Milch', 'Brot und Milch'], a: 2,
        explain: '两样东西都要，选项里那两个「只对一半」的最容易上当。',
        skills: ['imperative-du'] },
      { type: 'choice', plays: 2,
        audioText: 'Hallo Lisa, hier ist Tom. Mein Zug kommt später. Ich bin erst um halb elf am Bahnhof. Kannst du mich abholen?',
        prompt: 'Wann ist Tom am Bahnhof?',
        options: ['um 10.30 Uhr', 'um 11.30 Uhr', 'um 10 Uhr'], a: 0,
        explain: 'halb elf = 10:30（差半小时到 11）。德语的 halb 说的是「到下一个整点还差半小时」，中文习惯正好相反。',
        skills: ['time-informal'] },
      { type: 'choice', plays: 2,
        audioText: 'Guten Tag, hier ist die Sprachschule. Ihr Kurs beginnt nicht am Montag. Wir fangen am Donnerstag an. Der Raum ist Nummer neun.',
        prompt: 'Wann beginnt der Kurs?',
        options: ['am Montag', 'am Donnerstag', 'am Dienstag'], a: 1,
        explain: 'anfangen 是可分动词：fangen … an，动词的意思要听到句末才完整。',
        skills: ['separable-verbs'] },
    ],
  },
  {
    id: 'x-h3-02',
    cellId: 'H3',
    titleZh: '再来五条电话留言，听完选答案',
    subZh: 'Goethe A1 听力第三部分 · 5 题 5 分 · 每条最多听两遍',
    source: { kind: 'inline' },
    prereq: { afterCell: 20, skills: ['modal-koennen-wollen'] },
    skills: ['modal-koennen-wollen', 'numbers-tens'],
    items: [
      { type: 'choice', plays: 2,
        audioText: 'Hallo, hier ist Frau Klein von der Wohnung. Ich komme am Freitag um vier Uhr. Bitte sind Sie zu Hause.',
        prompt: 'Wann kommt Frau Klein?',
        options: ['am Freitag um vier', 'am Freitag um vierzehn Uhr', 'am Donnerstag um vier'], a: 0,
        explain: 'vier ≠ vierzehn。这两个词只差一个词尾，是听力里最贵的一对。',
        skills: ['numbers-tens'] },
      { type: 'choice', plays: 2,
        audioText: 'Hier ist das Restaurant Anna. Ihr Tisch für Samstag ist reserviert. Wir haben aber nur einen Tisch für vier Personen, nicht für sechs.',
        prompt: 'Für wie viele Personen ist der Tisch?',
        options: ['für sechs', 'für vier', 'für zwei'], a: 1,
        explain: 'aber 之后是转折，nicht für sechs 把原来的人数否掉了。',
        skills: ['reservation'] },
      { type: 'choice', plays: 2,
        audioText: 'Hallo Max, wir gehen morgen ins Schwimmbad. Bring bitte ein Handtuch und zehn Euro mit.',
        prompt: 'Was soll Max mitbringen?',
        options: ['nur Geld', 'ein Handtuch und Geld', 'ein Buch'], a: 1,
        explain: 'mitbringen 的 mit 甩到了句末，要听完才知道是「带来」不是「带走」。',
        skills: ['separable-verbs'] },
      { type: 'choice', plays: 2,
        audioText: 'Guten Tag, hier ist die Autowerkstatt. Ihr Auto ist fertig. Sie können es heute bis achtzehn Uhr abholen.',
        prompt: 'Bis wann kann man das Auto abholen?',
        options: ['bis 18 Uhr', 'bis 8 Uhr', 'bis 20 Uhr'], a: 0,
        explain: 'acht / achtzehn 又一次。24 小时制的整点在留言里几乎必考。',
        skills: ['time-formal'] },
      { type: 'choice', plays: 2,
        audioText: 'Hallo, hier ist Nina. Ich bin krank und kann heute nicht zum Sport kommen. Wir sehen uns nächste Woche.',
        prompt: 'Warum kommt Nina nicht?',
        options: ['Sie ist krank.', 'Sie hat keine Zeit.', 'Sie ist im Urlaub.'], a: 0,
        explain: 'A1 不用从句说原因，两句并排就是因果：Ich bin krank. Ich kann nicht kommen.',
        skills: ['modal-koennen-wollen'] },
    ],
  },

  /* ---------- L2 · 两个来源，选 a 还是 b ---------- */
  // 官方 Lesen Teil 2：给一个处境，配两条广告，判断哪一条能满足它。
  // 这类题考的不是读懂全文，是**扫读找那一条对不上的信息** —— 所以每对广告里
  // 一定有一条在某个具体的点上（时间 / 年龄 / 价钱 / 星期）不合，讲解就点那一处。
  {
    id: 'x-l2-01',
    cellId: 'L2',
    titleZh: '五个处境，各在两条广告里选一条',
    subZh: 'Goethe A1 阅读第二部分 · 5 题 5 分 · 只有一条合你的需求',
    source: { kind: 'inline' },
    prereq: { afterCell: 10, skills: ['prep-time-an-um'] },
    skills: ['prep-time-an-um'],
    items: [
      { type: 'choice', options: ['Anzeige a', 'Anzeige b'], a: 0,
        prompt: 'Sie suchen ein Zimmer für ein Semester in Leipzig.',
        stimulus: [
          { layout: 'sign', title: 'a', de: 'Zimmer in Leipzig, 18 m²\n320 € warm · nur für Studenten\nfrei ab 1. Oktober', zh: 'a｜莱比锡房间 18 平米，含暖气 320 欧，仅限学生，10 月 1 日起可入住' },
          { layout: 'sign', title: 'b', de: 'Schönes Hotelzimmer in Leipzig\n65 € pro Nacht\nmit Frühstück', zh: 'b｜莱比锡酒店房间，每晚 65 欧，含早餐' },
        ],
        explain: '一个学期要住的是长租房，不是按晚算的酒店。看到 pro Nacht 就该排除。',
        skills: ['renting'] },
      { type: 'choice', options: ['Anzeige a', 'Anzeige b'], a: 1,
        prompt: 'Sie möchten am Sonntag Brot kaufen.',
        stimulus: [
          { layout: 'sign', title: 'a', de: 'Bäckerei Klein\nMo–Sa 6–18 Uhr\nSonntag geschlossen', zh: 'a｜Klein 面包房，周一至周六 6–18 点，周日休息' },
          { layout: 'sign', title: 'b', de: 'Bäckerei am Markt\ntäglich 7–12 Uhr\nauch am Sonntag', zh: 'b｜集市面包房，每天 7–12 点，周日也开' },
        ],
        explain: 'Mo–Sa 已经把周日排除了；auch am Sonntag 是 b 那条唯一要看的信息。',
        skills: ['prep-time-an-um'] },
      { type: 'choice', options: ['Anzeige a', 'Anzeige b'], a: 0,
        prompt: 'Ihr Sohn ist acht Jahre alt. Er möchte schwimmen lernen.',
        stimulus: [
          { layout: 'sign', title: 'a', de: 'Schwimmkurs für Kinder\nvon 6 bis 10 Jahren\nSamstag 10 Uhr', zh: 'a｜儿童游泳班，6–10 岁，周六 10 点' },
          { layout: 'sign', title: 'b', de: 'Schwimmkurs für Erwachsene\nDi und Do 19 Uhr', zh: 'b｜成人游泳班，周二、周四 19 点' },
        ],
        explain: '八岁落在 6 bis 10 里。Kinder / Erwachsene 是这对广告的分水岭。',
        skills: ['numbers-1-20'] },
      { type: 'choice', options: ['Anzeige a', 'Anzeige b'], a: 1,
        prompt: 'Sie arbeiten bis 17 Uhr und suchen einen Deutschkurs.',
        stimulus: [
          { layout: 'sign', title: 'a', de: 'Deutschkurs A1\nMo–Fr 9–12 Uhr', zh: 'a｜A1 德语班，周一至周五 9–12 点' },
          { layout: 'sign', title: 'b', de: 'Deutschkurs A1\nMo und Mi 18–20 Uhr', zh: 'b｜A1 德语班，周一、周三 18–20 点' },
        ],
        explain: '上到 17 点，只有 18 点以后的课上得了。这类题的钥匙永远是那个时间点。',
        skills: ['kurs-anmeldung'] },
      { type: 'choice', options: ['Anzeige a', 'Anzeige b'], a: 0,
        prompt: 'Sie möchten mit dem Fahrrad zur Arbeit fahren. Sie haben wenig Geld.',
        stimulus: [
          { layout: 'sign', title: 'a', de: 'Fahrrad zu verkaufen\n60 Euro · fährt gut', zh: 'a｜自行车出售，60 欧，车况好' },
          { layout: 'sign', title: 'b', de: 'Neues E-Bike\nnur 1200 Euro', zh: 'b｜全新电动自行车，仅 1200 欧' },
        ],
        explain: 'wenig Geld 是需求里的关键词，1200 欧对不上。nur 这个字在广告里不代表便宜。',
        skills: ['numbers-large'] },
    ],
  },
  {
    id: 'x-l2-02',
    cellId: 'L2',
    titleZh: '再来五个处境，各在两条广告里选一条',
    subZh: 'Goethe A1 阅读第二部分 · 5 题 5 分 · 只有一条合你的需求',
    source: { kind: 'inline' },
    prereq: { afterCell: 15, skills: ['modal-koennen-wollen'] },
    skills: ['modal-koennen-wollen'],
    items: [
      { type: 'choice', options: ['Anzeige a', 'Anzeige b'], a: 1,
        prompt: 'Sie haben Zahnschmerzen. Heute ist Freitag und Sie brauchen sofort einen Termin.',
        stimulus: [
          { layout: 'sign', title: 'a', de: 'Zahnarzt Dr. Berg\nMo–Do 9–17 Uhr\nnur mit Termin', zh: 'a｜Berg 牙医，周一至周四 9–17 点，需预约' },
          { layout: 'sign', title: 'b', de: 'Zahnarzt Dr. Mai\nFr 8–14 Uhr\nauch ohne Termin', zh: 'b｜Mai 牙医，周五 8–14 点，无需预约' },
        ],
        explain: '需求里有两个条件：今天是周五、马上要看。a 两条都不满足。',
        skills: ['appointment'] },
      { type: 'choice', options: ['Anzeige a', 'Anzeige b'], a: 0,
        prompt: 'Sie holen eine Freundin vom Bahnhof ab und suchen einen Parkplatz.',
        stimulus: [
          { layout: 'sign', title: 'a', de: 'Parkhaus am Bahnhof\nerste Stunde frei', zh: 'a｜火车站停车楼，第一小时免费' },
          { layout: 'sign', title: 'b', de: 'Parkplatz am Stadion\nnur bei Fußballspielen', zh: 'b｜体育场停车场，仅比赛日开放' },
        ],
        explain: 'nur bei … 是广告里最常见的限制条件，读到 nur 就要停一下。',
        skills: ['separable-verbs'] },
      { type: 'choice', options: ['Anzeige a', 'Anzeige b'], a: 1,
        prompt: 'Sie möchten Deutsch sprechen üben. Grammatik lernen Sie schon im Kurs.',
        stimulus: [
          { layout: 'sign', title: 'a', de: 'Grammatikkurs\nalle Regeln von A bis Z', zh: 'a｜语法班，从头到尾讲规则' },
          { layout: 'sign', title: 'b', de: 'Sprechtreff\njeden Mittwoch 18 Uhr\neinfach kommen und reden', zh: 'b｜口语角，每周三 18 点，来了就说' },
        ],
        explain: '需求句的后半句「语法我已经在学了」就是用来排除 a 的。',
        skills: ['modal-koennen-wollen'] },
      { type: 'choice', options: ['Anzeige a', 'Anzeige b'], a: 1,
        prompt: 'Sie suchen am Samstagabend einen Tisch für acht Personen.',
        stimulus: [
          { layout: 'sign', title: 'a', de: 'Café Sonne\n20 Plätze\nnur bis 18 Uhr geöffnet', zh: 'a｜太阳咖啡馆，20 个座位，仅营业至 18 点' },
          { layout: 'sign', title: 'b', de: 'Restaurant Anna\ngroße Gruppen willkommen\ntäglich bis 23 Uhr', zh: 'b｜Anna 餐厅，欢迎大团体，每天营业至 23 点' },
        ],
        explain: 'a 的座位数够，但 18 点就关门，晚上去不了。位子够 ≠ 时间对得上。',
        skills: ['reservation'] },
      { type: 'choice', options: ['Anzeige a', 'Anzeige b'], a: 0,
        prompt: 'Ihr Handy ist kaputt. Sie brauchen es morgen wieder.',
        stimulus: [
          { layout: 'sign', title: 'a', de: 'Handy-Service\nReparatur in 24 Stunden', zh: 'a｜手机维修，24 小时内修好' },
          { layout: 'sign', title: 'b', de: 'Handy-Shop\nneue Handys ab 199 Euro', zh: 'b｜手机店，新机 199 欧起' },
        ],
        explain: '要的是「修好原来那台」，不是买新的。Reparatur 这个词就是答案。',
        skills: ['repair-report'] },
    ],
  },

  /* ---------- S1 · 填表格 Formular ---------- */
  {
    id: 'x-s1-01',
    cellId: 'S1',
    titleZh: '读一段介绍，替朋友填报名表',
    subZh: 'Goethe A1 写作第一部分 · 5 个空 5 分 · 答案全在上面那段话里',
    source: { kind: 'inline' },
    prereq: { afterCell: 10, skills: ['ordinal-date'] },
    skills: ['kurs-anmeldung', 'ordinal-date'],
    stimulus: [{
      layout: 'mail',
      title: 'Information',
      de: 'Ihre Freundin Mai Nguyen kommt aus Vietnam und möchte einen Deutschkurs machen.\n'
        + 'Sie ist am 12. Mai 1999 geboren. Sie wohnt in der Gartenstraße 8 in Leipzig.\n'
        + 'Mai ist Studentin.',
      zh: '你的朋友 Mai Nguyen 来自越南，想报一个德语班。\n她 1999 年 5 月 12 日出生，住在莱比锡花园街 8 号。\nMai 是学生。',
    }],
    items: [
      { type: 'fill', prompt: 'Anmeldung Deutschkurs — Familienname:', hint: '姓', a: ['Nguyen'],
        explain: '德语表格里 Familienname 是姓、Vorname 是名。Mai Nguyen 里 Nguyen 才是姓。' },
      { type: 'fill', prompt: 'Vorname:', hint: '名', a: ['Mai'],
        explain: '写在前面的 Mai 是名字。填表最常丢分的就是姓名颠倒。' },
      { type: 'fill', prompt: 'Geburtsdatum:', hint: 'TT.MM.JJJJ', a: ['12.05.1999', '12.5.1999', '12. Mai 1999', '12.05.99'],
        explain: '德语日期是「日.月.年」：12. Mai 1999 → 12.05.1999。和中文顺序正好相反。',
        skills: ['ordinal-date'] },
      { type: 'fill', prompt: 'Straße und Hausnummer:', hint: 'z. B. Hauptstraße 3', a: ['Gartenstraße 8', 'Gartenstrasse 8', 'Gartenstr. 8'],
        explain: '德语地址是「街名在前、门牌号在后」，和英语相反。' },
      { type: 'fill', prompt: 'Beruf:', hint: '职业', a: ['Studentin', 'Student'],
        explain: 'Mai 是女生，所以写 Studentin。职业的阴性形式加 -in，考试会看。' },
    ],
  },
  {
    id: 'x-s1-02',
    cellId: 'S1',
    titleZh: '读一段介绍，替朋友办图书馆借书证',
    subZh: 'Goethe A1 写作第一部分 · 5 个空 5 分 · 答案全在上面那段话里',
    source: { kind: 'inline' },
    prereq: { afterCell: 15, skills: ['numbers-large'] },
    skills: ['anmeldung', 'numbers-large'],
    stimulus: [{
      layout: 'mail',
      title: 'Information',
      de: 'Ihr Freund Omar Haddad kommt aus Marokko. Er ist Koch und arbeitet in München.\n'
        + 'Er wohnt am Rosenweg 21 in 80331 München. Er ist am 3. Februar 1994 geboren.\n'
        + 'Omar möchte eine Karte für die Bibliothek.',
      zh: '你的朋友 Omar Haddad 来自摩洛哥。他是厨师，在慕尼黑工作。\n'
        + '他住在慕尼黑玫瑰路 21 号，邮编 80331。他 1994 年 2 月 3 日出生。\nOmar 想办一张图书馆的卡。',
    }],
    items: [
      { type: 'fill', prompt: 'Bibliothek — Familienname:', hint: '姓', a: ['Haddad'],
        explain: 'Omar 是名，Haddad 是姓。' },
      { type: 'fill', prompt: 'Beruf:', hint: '职业', a: ['Koch'],
        explain: 'Er ist Koch —— 说职业时德语不加冠词，直接 Ich bin Koch。' },
      { type: 'fill', prompt: 'Postleitzahl:', hint: '5 位数字', a: ['80331'],
        explain: '德国邮编是 5 位数字，写在城市名前面：80331 München。',
        skills: ['numbers-large'] },
      { type: 'fill', prompt: 'Wohnort:', hint: '城市', a: ['München', 'Muenchen'],
        explain: 'Wohnort 问的是「住在哪座城市」，不是街道。' },
      { type: 'fill', prompt: 'Geburtsdatum:', hint: 'TT.MM.JJJJ', a: ['03.02.1994', '3.2.1994', '3. Februar 1994', '03.02.94'],
        explain: '3. Februar 1994 → 03.02.1994。二月是 02。', skills: ['ordinal-date'] },
    ],
  },

  /* ---------- S2 · 短信写作 · 离线自评 ---------- */
  // 全场唯一一道机器判不了的题。这一版是自评：写完看范文，对着三条标准自己打勾。
  // 三条标准就是官方的给分维度（要点写全 / 有称呼与结尾 / 语言在 A1 范围内）。
  // 接 AI 批改是它的下一版，不是它的前提 —— 写作不该变成「联网才能练」。
  {
    id: 'x-s2-01',
    cellId: 'S2',
    titleZh: '给老师写一条请假短信',
    subZh: 'Goethe A1 写作第二部分 · 约 30 词 10 分 · 写完看范文自评',
    source: { kind: 'inline' },
    prereq: { afterCell: 12, skills: ['nicht-kein'] },
    skills: ['nicht-kein', 'symptoms'],
    items: [{
      type: 'write',
      minWords: 25,
      prompt: 'Sie sind krank und können nicht zum Deutschkurs kommen. Schreiben Sie eine Nachricht an Ihre Lehrerin, Frau Berg.',
      points: [
        { de: 'Warum schreiben Sie?', zh: '你为什么写这条消息？' },
        { de: 'Wie lange sind Sie krank?', zh: '你要病多久？' },
        { de: 'Was machen Sie mit den Hausaufgaben?', zh: '作业怎么办？' },
      ],
      model: {
        de: 'Liebe Frau Berg,\nich bin krank und kann heute nicht zum Kurs kommen. Ich habe Fieber.\n'
          + 'Ich bleibe drei Tage zu Hause. Meine Freundin bringt mir die Hausaufgaben.\n'
          + 'Am Montag bin ich wieder da.\nViele Grüße\nLi',
        zh: '亲爱的 Berg 老师：\n我生病了，今天不能来上课。我发烧。\n我要在家待三天。我朋友会把作业带给我。\n周一我就回来了。\n此致\nLi',
      },
      explain: '三个要点各一到两句就够。真考试扣分最多的不是语法，是漏掉某个要点、或者忘了写称呼和结尾。',
    }],
  },
  {
    id: 'x-s2-02',
    cellId: 'S2',
    titleZh: '约朋友周六去看电影',
    subZh: 'Goethe A1 写作第二部分 · 约 30 词 10 分 · 写完看范文自评',
    source: { kind: 'inline' },
    prereq: { afterCell: 18, skills: ['prep-time-an-um'] },
    skills: ['prep-time-an-um', 'verabredung'],
    items: [{
      type: 'write',
      minWords: 25,
      prompt: 'Sie möchten am Samstag mit Ihrem Freund Tom ins Kino gehen. Schreiben Sie ihm eine Nachricht.',
      points: [
        { de: 'Wann und wo treffen Sie sich?', zh: '什么时候、在哪儿见？' },
        { de: 'Welcher Film?', zh: '看哪部电影？' },
        { de: 'Was soll Tom mitbringen?', zh: 'Tom 要带什么？' },
      ],
      model: {
        de: 'Hallo Tom,\nam Samstag läuft ein guter Film im Kino Palast. Er beginnt um acht Uhr.\n'
          + 'Wir treffen uns um halb acht vor dem Kino. Bitte bring Geld für die Karte mit.\n'
          + 'Bis Samstag!\nAnna',
        zh: '你好 Tom：\n周六 Palast 影院有一部好电影。八点开场。\n我们七点半在影院门口见。请带上买票的钱。\n周六见！\nAnna',
      },
      explain: '给朋友写用 Hallo + Bis bald 就行，不用 Liebe Frau …。三个要点里「带什么」最容易漏。',
    }],
  },

  /* ---------- H1 · 日常短对话 · 三选一 · 播两遍 ---------- */
  {
    id: 'x-h1-01',
    cellId: 'H1',
    titleZh: '路上的六段短对话，听完选答案',
    subZh: 'Goethe A1 听力第一部分 · 6 题 6 分 · 每段最多听两遍',
    source: { kind: 'inline' },
    prereq: { afterCell: 5, skills: [] },
    skills: ['time-informal', 'location-dativ'],
    items: [
      { type: 'choice', plays: 2, audioText: 'Entschuldigung, wann fährt der nächste Bus zum Bahnhof? Um Viertel nach drei.',
        prompt: 'Wann fährt der Bus?', options: ['Um 3.15 Uhr', 'Um 3.45 Uhr', 'Um 4.15 Uhr'], a: 0,
        explain: 'Viertel nach drei = 三点过一刻 = 3:15。nach 是「过」，vor 才是「差」。',
        skills: ['time-informal'] },
      { type: 'choice', plays: 2, audioText: 'Zwei Fahrkarten nach Köln, bitte. Das macht achtzehn Euro.',
        prompt: 'Was kosten die Fahrkarten?', options: ['8 Euro', '18 Euro', '80 Euro'], a: 1,
        explain: 'achtzehn = 18。acht(8) / achtzehn(18) / achtzig(80) 三个词只差词尾，听力里必考。',
        skills: ['numbers-tens'] },
      { type: 'choice', plays: 2, audioText: 'Fährt dieser Zug nach Dresden? Nein, der Zug nach Dresden fährt von Gleis neun.',
        prompt: 'Von welchem Gleis fährt der Zug nach Dresden?', options: ['Gleis 9', 'Gleis 5', 'Gleis 19'], a: 0,
        explain: 'neun = 9，neunzehn 才是 19。答案在 Nein 之后 —— 听力里先否定再给正确信息是最常见的套路。',
        skills: ['numbers-1-20'] },
      { type: 'choice', plays: 2, audioText: 'Wie komme ich zum Museum? Gehen Sie hier links und dann geradeaus.',
        prompt: 'Wohin muss die Frau zuerst gehen?', options: ['nach rechts', 'geradeaus', 'nach links'], a: 2,
        explain: '先 links 再 geradeaus。问的是 zuerst（首先），所以选左。', skills: ['directions'] },
      { type: 'choice', plays: 2, audioText: 'Ist der Platz hier frei? Nein, tut mir leid, hier sitzt meine Freundin.',
        prompt: 'Ist der Platz frei?', options: ['Ja, er ist frei.', 'Nein, da sitzt schon jemand.', 'Das sagt der Mann nicht.'], a: 1,
        explain: 'Nein + tut mir leid 已经答完了，后半句是理由。', skills: ['nicht-kein'] },
      { type: 'choice', plays: 2, audioText: 'Wo kann ich hier parken? Vor dem Supermarkt gibt es einen Parkplatz.',
        prompt: 'Wo ist der Parkplatz?', options: ['hinter dem Bahnhof', 'neben der Schule', 'vor dem Supermarkt'], a: 2,
        explain: 'vor dem Supermarkt —— 三个选项都是「介词 + 第三格」，只有名词不一样，听的时候盯名词。',
        skills: ['location-dativ'] },
    ],
  },
  {
    id: 'x-h1-02',
    cellId: 'H1',
    titleZh: '买东西和吃饭的六段短对话，听完选答案',
    subZh: 'Goethe A1 听力第一部分 · 6 题 6 分 · 每段最多听两遍',
    source: { kind: 'inline' },
    prereq: { afterCell: 10, skills: ['akk-review'] },
    skills: ['akk-review', 'numbers-tens'],
    items: [
      { type: 'choice', plays: 2, audioText: 'Was möchten Sie trinken? Einen Tee mit Zitrone, bitte.',
        prompt: 'Was bestellt die Frau?', options: ['einen Kaffee', 'einen Tee', 'ein Wasser'], a: 1,
        explain: 'einen Tee —— einen 是第四格阳性，点单时几乎每次都出现。', skills: ['akk-masc-only'] },
      { type: 'choice', plays: 2, audioText: 'Haben Sie diese Schuhe auch in Größe vierzig? Moment, ich schaue nach. Nein, nur in einundvierzig.',
        prompt: 'Welche Größe gibt es?', options: ['Größe 40', 'Größe 39', 'Größe 41'], a: 2,
        explain: 'einundvierzig = 41。德语两位数是「个位 und 十位」，先说的是个位，正好和中文反着。',
        skills: ['numbers-compound'] },
      { type: 'choice', plays: 2, audioText: 'Das macht zusammen sieben Euro zwanzig. Hier sind zehn Euro.',
        prompt: 'Wie viel Geld gibt der Kunde?', options: ['7,20 Euro', '2,80 Euro', '10 Euro'], a: 2,
        explain: '账单是 7,20，但客人给的是 10。问的是「给了多少」，不是「多少钱」。',
        skills: ['numbers-tens'] },
      { type: 'choice', plays: 2, audioText: 'Einen Tisch für vier Personen um acht Uhr, bitte. Das geht, kein Problem.',
        prompt: 'Für wie viele Personen ist der Tisch?', options: ['für acht', 'für vier', 'für zwei'], a: 1,
        explain: '句子里有两个数字：vier 是人数，acht 是时间。选项故意把时间也放进来。',
        skills: ['reservation'] },
      { type: 'choice', plays: 2, audioText: 'Entschuldigung, wo finde ich die Milch? Die Milch ist hinten rechts.',
        prompt: 'Wo ist die Milch?', options: ['hinten rechts', 'vorne links', 'neben dem Brot'], a: 0,
        explain: 'hinten rechts。方位词常常两两成对出现，听到前一个就要准备好后一个。',
        skills: ['sequence-adverbs'] },
      { type: 'choice', plays: 2, audioText: 'Zahlen Sie bar oder mit Karte? Mit Karte, bitte.',
        prompt: 'Wie bezahlt der Kunde?', options: ['mit Karte', 'bar', 'mit dem Handy'], a: 0,
        explain: '问句给了两个选项，答句只重复其中一个 —— 这类题答案永远在后半句。',
        skills: ['split-bill'] },
    ],
  },
  {
    id: 'x-h1-03',
    cellId: 'H1',
    titleZh: '约时间和上课的六段短对话，听完选答案',
    subZh: 'Goethe A1 听力第一部分 · 6 题 6 分 · 每段最多听两遍',
    source: { kind: 'inline' },
    prereq: { afterCell: 15, skills: ['time-formal'] },
    skills: ['time-formal', 'appointment'],
    items: [
      { type: 'choice', plays: 2, audioText: 'Wann haben wir morgen Deutsch? Von zehn bis halb zwölf.',
        prompt: 'Wann endet der Deutschkurs?', options: ['um 11.30 Uhr', 'um 10 Uhr', 'um 12 Uhr'], a: 0,
        explain: 'halb zwölf = 11:30（差半小时到 12）。问的是「结束」，所以取 bis 后面那个。',
        skills: ['time-informal'] },
      { type: 'choice', plays: 2, audioText: 'Guten Tag, ich möchte einen Termin bei Doktor Schmidt. Können Sie am Donnerstag um neun?',
        prompt: 'Wann ist der Termin?', options: ['am Dienstag um neun', 'am Donnerstag um neun', 'am Donnerstag um zehn'], a: 1,
        explain: 'Dienstag 和 Donnerstag 开头都是 D，听力里最容易混。听到 Do- 就是周四。',
        skills: ['appointment'] },
      { type: 'choice', plays: 2, audioText: 'Wo ist der Kurs heute? Nicht in Raum zwölf, heute sind wir in Raum sieben.',
        prompt: 'In welchem Raum ist der Kurs heute?', options: ['Raum 12', 'Raum 17', 'Raum 7'], a: 2,
        explain: '第一个数字被 nicht 否定掉了，真正的答案在后半句。', skills: ['nicht-kein'] },
      { type: 'choice', plays: 2, audioText: 'Hast du am Wochenende Zeit? Am Samstag nicht, aber am Sonntag gern.',
        prompt: 'Wann hat die Frau Zeit?', options: ['am Samstag', 'am Sonntag', 'am Wochenende nicht'], a: 1,
        explain: 'aber 是转折信号：听到 aber，答案就在它后面。', skills: ['conj-coord'] },
      { type: 'choice', plays: 2, audioText: 'Wie lange dauert die Prüfung? Fünfundsechzig Minuten.',
        prompt: 'Wie lange dauert die Prüfung?', options: ['65 Minuten', '15 Minuten', '55 Minuten'], a: 0,
        explain: 'fünfundsechzig = 5 + 60 = 65。fünfzehn(15) / fünfundfünfzig(55) 都是干扰项。',
        skills: ['numbers-compound'] },
      { type: 'choice', plays: 2, audioText: 'Ich kann heute nicht kommen. Ich bin krank. Gute Besserung! Dann bis nächste Woche.',
        prompt: 'Warum kommt der Mann nicht?', options: ['Er hat keine Zeit.', 'Er ist krank.', 'Er ist im Urlaub.'], a: 1,
        explain: 'A1 不用从句说原因，直接两句并排：Ich kann nicht kommen. Ich bin krank.',
        skills: ['modal-koennen-wollen'] },
    ],
  },
];

const TASK_BY_ID = new Map(EXAM_TASKS.map(task => [task.id, task]));
export function findExamTask(id) {
  return TASK_BY_ID.get(id) || null;
}
export function tasksForCell(cellId) {
  return EXAM_TASKS.filter(task => task.cellId === cellId);
}
