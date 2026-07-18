# Nicos Weg A1 目录映射（2026-07-18 抓取）

来源：德国之声（Deutsche Welle）免费德语课程 *Nicos Weg*，A1 级。

- 中文界面课程页：<https://learngerman.dw.com/zh/nicos-weg/c-47993645>
- 英文界面课程页（用于交叉核对）：<https://learngerman.dw.com/en/nicos-weg/c-36519789>

**抓取方式说明**：本次调研环境中的浏览器工具组（`mcp__Claude_Browser__*`）不可用（`ToolSearch` 未返回任何匹配项），改用 `Bash`（`curl`）直接请求页面 HTML。DW 站点为客户端渲染的 SPA，但服务端渲染（SSR）输出中内嵌了完整的 GraphQL 数据缓存（`window.__APOLLO_STATE__`），其中包含整门课程的章节分组（`groupName`）、每课短标题（德语原文 `shortTitle`）、每课主题（`learningTargetHeadline`）、每课语法点（`grammarDescription`）及每课页面 URL（`namedUrl`），与逐课打开页面人工查看的信息完全一致（已抽查 3 课核对，包括 `Ich heiße Emma` 的语法标签 "人称代词：ich、du" 在课程列表页与单课页面的内嵌数据中一致）。因此本文档为**结构化数据直接解析结果**，非人工逐页浏览摘录，但信息来源、准确度与浏览器方式等价，且同样只记录目录结构/知识点（事实信息），未复制任何课程正文讲解内容。

**重要更正**：任务描述中预估“约 13 章 76 课”，实际 DW 官方目录为：1 个开篇导入单元（Welcome，4 课）+ **18 个编号章节**（每章 4 课，共 72 课）+ 1 个结业测试（1 课），**合计 20 个分组、77 课**。中文页面章节标题与英文页面一一对应（见各章标题括号内英文），顺序、课数完全一致。

DW 的 *Nicos Weg* 课程页面本身是**单页应用**：所有 77 课的入口都列在同一个课程总览页（上面的中/英文课程页链接）内，按章节分组显示，**DW 并未给每一章单独分配 URL**——只有每一课有独立 URL。因此下文每章标题后不重复附章节 URL，只在文档开头给出课程总览页链接；每课后附的 URL 为该课的独立页面地址。

## 第开篇章 欢迎加入A1德语课！（Welcome to A1!）

- 0.1 《Hallo!》（https://learngerman.dw.com/zh/hallo/l-49566981）— 主题：问候（Greetings）；语法：正式与非正式用语（Informal and formal）
- 0.2 《Kein Problem!》（https://learngerman.dw.com/zh/kein-problem/l-49569865）— 主题：德语入门单词（Basic words in German）；语法：（无独立语法点，本课以对话/词汇为主）
- 0.3 《Tschüss!》（https://learngerman.dw.com/zh/tschüss/l-49592371）— 主题：道别（Saying goodbye）；语法：正式与非正式用语（Informal and formal）
- 0.4 《Von A bis Z》（https://learngerman.dw.com/zh/von-a-bis-z/l-49572682）— 主题：拼写（Spelling）；语法：（无独立语法点，本课以对话/词汇为主）

## 第1章 认识新朋友（Meeting people）

- 1.1 《Ich heiße Emma》（https://learngerman.dw.com/zh/ich-heiße-emma/l-49597228）— 主题：自我介绍（Introducing yourself）；语法：人称代词：ich、du（Personal pronouns: ich, du）
- 1.2 《Das ist Nico》（https://learngerman.dw.com/zh/das-ist-nico/l-49605510）— 主题：介绍他人（Introducing others）；语法：（无独立语法点，本课以对话/词汇为主）
- 1.3 《Woher kommst du?》（https://learngerman.dw.com/zh/woher-kommst-du/l-49608346）— 主题：姓名和家乡（Name and background）；语法：现在时变位（Conjugation: present tense）
- 1.4 《Nico hat ein Problem》（https://learngerman.dw.com/zh/nico-hat-ein-problem/l-49647618）— 主题：他人的信息（Finding out about other people）；语法：人称代词：er、sie （Personal pronouns: er, sie）

## 第2章 联系方式（Contact details）

- 2.1 《Zahlen von 1 bis 100》（https://learngerman.dw.com/zh/zahlen-von-1-bis-100/l-49653998）— 主题：数字1到100（Numbers from 1 to 100）；语法：数字11到19（Numbers from 11 to 19）
- 2.2 《Wichtige Nummern》（https://learngerman.dw.com/zh/wichtige-nummern/l-49717833）— 主题：重要的数字（Important numbers）；语法：（无独立语法点，本课以对话/词汇为主）
- 2.3 《Adressen》（https://learngerman.dw.com/zh/adressen/l-49720068）— 主题：提供个人信息（Providing personal information）；语法：特殊疑问句（W-questions）
- 2.4 《Auf dem Amt》（https://learngerman.dw.com/zh/auf-dem-amt/l-49752928）— 主题：正式用语（Formal address）；语法：大于100的数字（Numbers over 100）

## 第3章 社交圈（In company）

- 3.1 《Was machst du hier?》（https://learngerman.dw.com/zh/was-machst-du-hier/l-49739149）— 主题：建立联系（Social situations）；语法：（无独立语法点，本课以对话/词汇为主）
- 3.2 《Was trinkst du?》（https://learngerman.dw.com/zh/was-trinkst-du/l-49742616）— 主题：提供饮料（Offering drinks）；语法：名词：词性（Nouns: gender）
- 3.3 《Eine Pizza bitte! 》（https://learngerman.dw.com/zh/eine-pizza-bitte/l-49748051）— 主题：点餐（Placing an order）；语法：元音换音： e 变成 i（Vowel change: e to i）
- 3.4 《Zahlen bitte! 》（https://learngerman.dw.com/zh/zahlen-bitte/l-49755921）— 主题：付款（Paying the bill）；语法：（无独立语法点，本课以对话/词汇为主）

## 第4章 国家和语言（Around the world）

- 4.1 《Ich war schon in Berlin》（https://learngerman.dw.com/zh/ich-war-schon-in-berlin/l-49758929）— 主题：景点（Sightseeing attractions）；语法：过去时 sein（Simple past: sein）
- 4.2 《Wo liegt das?》（https://learngerman.dw.com/zh/wo-liegt-das/l-49759377）— 主题：地理位置（Geographic info）；语法：疑问句与陈述句（Questions and statements）
- 4.3 《In Europa》（https://learngerman.dw.com/zh/in-europa/l-49840848）— 主题：谈论各个国家（Speaking about countries）；语法：不定代词： man（Indefinite pronouns: man）
- 4.4 《Andere Länder》（https://learngerman.dw.com/zh/andere-länder/l-49786742）— 主题：语言（Languages）；语法：变位： sprechen（Conjugation: sprechen）

## 第5章 物品（Things）

- 5.1 《Was ist das?》（https://learngerman.dw.com/zh/was-ist-das/l-49788260）— 主题：说出物品名称（Naming objects）；语法：定冠词（Articles: definite）
- 5.2 《Wem gehört das?》（https://learngerman.dw.com/zh/wem-gehört-das/l-49801323）— 主题：询问物品（Asking about objects）；语法：不定冠词（Articles: indefinite）
- 5.3 《Ich habe kein …》（https://learngerman.dw.com/zh/ich-habe-kein/l-49813707）— 主题：说说你有（或是没有）的东西（What you (do not) have）；语法：句法：主语（Sentence construction: subject）
- 5.4 《Das Auto ist rot》（https://learngerman.dw.com/zh/das-auto-ist-rot/l-49824390）— 主题：描述物品（Naming objects）；语法：“sein”之后的形容词（Adjectives following "sein"）

## 第6章 居住（Living）

- 6.1 《So wohne ich》（https://learngerman.dw.com/zh/so-wohne-ich/l-49828899）— 主题：居住模式（Living arrangements）；语法：冠词（Articles）
- 6.2 《Meine Wohnung》（https://learngerman.dw.com/zh/meine-wohnung/l-49841628）— 主题：公寓里的房间（The rooms in an apartment）；语法：否定词： nicht（Negatives: nicht）
- 6.3 《Sofa, Sessel und Tisch》（https://learngerman.dw.com/zh/sofa-sessel-und-tisch/l-49849076）— 主题：形容摆设（Describing interiors）；语法：zu + 形容词（zu + adjective）
- 6.4 《Unser Haus》（https://learngerman.dw.com/zh/unser-haus/l-49849493）— 主题：说说这是谁的（Saying what is whose）；语法：物主冠词（Possessive determiners）

## 第7章 日期与时间（Days and times）

- 7.1 《Emmas Tag》（https://learngerman.dw.com/zh/emmas-tag/l-49854635）— 主题：叙述一天的活动（Talking about the day）；语法：时间：非正式语法（Time: 12-hour clock）
- 7.2 《Tageszeiten》（https://learngerman.dw.com/zh/tageszeiten/l-49861470）— 主题：叙述日程安排（Describing the day）；语法：可分动词（Separable verbs）
- 7.3 《Am Sonntag koche ich》（https://learngerman.dw.com/zh/am-sonntag-koche-ich/l-49865130）— 主题：休闲活动（Free time activities）；语法：介词：an （Prepositions of time: an）
- 7.4 《Emmas Wochenende》（https://learngerman.dw.com/zh/emmas-wochenende/l-49865435）— 主题：周末（The weekend）；语法：副词：时间顺序（Adverbs: sequence）

## 第8章 预约（Appointments）

- 8.1 《Wie spät ist es?》（https://learngerman.dw.com/zh/wie-spät-ist-es/l-49869214）— 主题：理解时间的表达方式（Understanding time and date）；语法：时间：正式用语（Time specification: 24-hour clock）
- 8.2 《Hast du morgen Zeit?》（https://learngerman.dw.com/zh/hast-du-morgen-zeit/l-49869265）— 主题：安排预约（Planning dates）；语法：序数词（Ordinal numbers）
- 8.3 《Wann spielen wir?》（https://learngerman.dw.com/zh/wann-spielen-wir/l-49927681）— 主题：约定时间（Making arrangements）；语法：变位：können（Conjugation: können）
- 8.4 《Zu spät!?》（https://learngerman.dw.com/zh/zu-spät/l-49931924）— 主题：迟到（Delays）；语法：过去时：haben（Simple past: haben）

## 第9章 各行各业（Working life）

- 9.1 《Ich bin Lehrerin》（https://learngerman.dw.com/zh/ich-bin-lehrerin/l-49940875）— 主题：说明职业（Talking about professions）；语法：构词：职业（Word formation: professions）
- 9.2 《Mein Beruf》（https://learngerman.dw.com/zh/mein-beruf/l-49941191）— 主题：描述工作内容（Describing activities）；语法：情态动词（Modal verbs）
- 9.3 《Wo ist der Aufzug?》（https://learngerman.dw.com/zh/wo-ist-der-aufzug/l-49942344）— 主题：楼层位置（Finding your way around a building）；语法：第三格（The dative）
- 9.4 《Traumberufe》（https://learngerman.dw.com/zh/traumberufe/l-49947955）— 主题：职业志向（Career hopes）；语法：情态动词： wollen（Modal verbs: wollen）

## 第10章 东南西北（Orientation）

- 10.1 《Wo ist der Bahnhof?》（https://learngerman.dw.com/zh/wo-ist-der-bahnhof/l-49960021）— 主题：生活和工作（Living and working）；语法：介词： bei 、von（Prepositions: bei, von）
- 10.2 《An der Ampel links》（https://learngerman.dw.com/zh/an-der-ampel-links/l-49950374）— 主题：描述路线（Giving directions）；语法：方位介词（Prepositions of place）
- 10.3 《Mit Bus und Bahn》（https://learngerman.dw.com/zh/mit-bus-und-bahn/l-49959118）— 主题：上班路线（Commuting to work）；语法：介词：mit（Prepositions: mit）
- 10.4 《Im Büro》（https://learngerman.dw.com/zh/im-büro/l-49965442）— 主题：办公室内的物品（Objects in the office）；语法：可变格介词（Two-case prepositions ）

## 第11章 饮食与娱乐（Eating and leisure）

- 11.1 《Lebensmittel》（https://learngerman.dw.com/zh/lebensmittel/l-50128493）— 主题：谈论饮食（Talking about food）；语法：否定：nicht/kein（Negation: nicht/kein）
- 11.2 《Ich mag (nicht)!》（https://learngerman.dw.com/zh/ich-mag-nicht/l-50134372）— 主题：饮食喜好（Eating preferences）；语法：比较级的变化（Comparative）
- 11.3 《Haushaltsarbeit》（https://learngerman.dw.com/zh/haushaltsarbeit/l-50136454）— 主题：对家务的喜好（Preferences at home）；语法：比较词：wie/als （Comparison: wie/als）
- 11.4 《Was macht dir Spaß?》（https://learngerman.dw.com/zh/was-macht-dir-spaß/l-50140326）— 主题：休闲活动（Leisure activities）；语法：gehen +不定式（gehen + infinitive）

## 第12章 食品（Food）

- 12.1 《Mengen und Preise》（https://learngerman.dw.com/zh/mengen-und-preise/l-50269553）— 主题：购买食品（Buying groceries）；语法：方位介词： in 、auf（Prepositions: in, auf）
- 12.2 《Was darf es sein?》（https://learngerman.dw.com/zh/was-darf-es-sein/l-50270006）— 主题：购物对话（Shopping conversations）；语法：（无独立语法点，本课以对话/词汇为主）
- 12.3 《Sonst noch etwas?》（https://learngerman.dw.com/zh/sonst-noch-etwas/l-50273716）— 主题：在集市上买菜（Shopping at the market）；语法：疑问词：wie viel（Question words: wie viel）
- 12.4 《Wie viel Mehl?》（https://learngerman.dw.com/zh/wie-viel-mehl/l-50276805）— 主题：看菜谱做菜（Following a recipe）；语法：指示（Instructions）

## 第13章 气候与假期（Weather and holiday）

- 13.1 《Wie war dein Urlaub?》（https://learngerman.dw.com/zh/wie-war-dein-urlaub/l-50284755）— 主题：谈论假期（Talking about vacations）；语法：完成时：助动词 “haben”（Present perfect with "haben"）
- 13.2 《Jahreszeiten》（https://learngerman.dw.com/zh/jahreszeiten/l-50310393）— 主题：季节的比较（Comparing the seasons）；语法：比较（Comparison）
- 13.3 《Der Ausflug》（https://learngerman.dw.com/zh/der-ausflug/l-50282849）— 主题：谈论过去（Talking about the past）；语法：完成时：助动词“sein”（Present perfect with "sein"）
- 13.4 《Wie wird das Wetter?》（https://learngerman.dw.com/zh/wie-wird-das-wetter/l-50286774）— 主题：说说天气怎么样（Talking about the weather）；语法：代词：es（Pronouns: es）

## 第14章 服饰（Clothing）

- 14.1 《Das ist jetzt modern》（https://learngerman.dw.com/zh/das-ist-jetzt-modern/l-50300255）— 主题：谈论服装（Talking about clothing）；语法：形容词变格（Adjective declension）
- 14.2 《Mein Lieblingspulli》（https://learngerman.dw.com/zh/mein-lieblingspulli/l-50289043）— 主题：描述服装（Describing clothing）；语法：疑问词welch-（Question words: welch-）
- 14.3 《Das passt gut!》（https://learngerman.dw.com/zh/das-passt-gut/l-50295519）— 主题：买衣服（Shopping for clothes）；语法：支配第三格宾语的动词（Verbs with a dative object）
- 14.4 《Schick!》（https://learngerman.dw.com/zh/schick/l-50300264）— 主题：休闲服装（Casual wear）；语法：（无独立语法点，本课以对话/词汇为主）

## 第15章 家庭（Family）

- 15.1 《Meine Familie》（https://learngerman.dw.com/zh/meine-familie/l-50300123）— 主题：谈论家庭（Talking about family）；语法：形容词变格（Adjective declension）
- 15.2 《Meine Eltern》（https://learngerman.dw.com/zh/meine-eltern/l-50303864）— 主题：介绍父母（Introducing parents）；语法：人称代词：第四格（Personal pronouns: accusative）
- 15.3 《Meine Tante》（https://learngerman.dw.com/zh/meine-tante/l-50323229）— 主题：职业选择（Career choices）；语法：物主冠词（The possessive determiner）
- 15.4 《Mein Bruder》（https://learngerman.dw.com/zh/mein-bruder/l-50327870）— 主题：谈论兄弟姐妹（Talking about siblings）；语法：情态动词：sollen （Modal verbs: sollen）

## 第16章 运动和健身（Sports and exercise）

- 16.1 《Von Kopf bis Fuß》（https://learngerman.dw.com/zh/von-kopf-bis-fuß/l-50316241）— 主题：运动类型（Sports）；语法：比较（Comparison）
- 16.2 《Bist du fit?》（https://learngerman.dw.com/zh/bist-du-fit/l-50330155）— 主题：运动和训练（Sports and training）；语法：时间状语：Wann...？（Time specification: Wann ...?）
- 16.3 《Fitness》（https://learngerman.dw.com/zh/fitness/l-50331125）— 主题：健身建议（Fitness tips）；语法：比较（Comparison）
- 16.4 《Ist das gesund?》（https://learngerman.dw.com/zh/ist-das-gesund/l-50357375）— 主题：谈论饮食（Talking about nutrition）；语法：祈使句：非正式用语（Imperative: informal）

## 第17章 健康（Health）

- 17.1 《Geht es dir gut?》（https://learngerman.dw.com/zh/geht-es-dir-gut/l-50382273）— 主题：谈论疾病（Talking about illnesses）；语法：müssen还是sollen？（Müssen or sollen?）
- 17.2 《Beim Arzt》（https://learngerman.dw.com/zh/beim-arzt/l-50382256）— 主题：诊所问诊（Checking in at the doctor's office）；语法：情态动词：dürfen（Modal verbs: dürfen）
- 17.3 《Gute Besserung!》（https://learngerman.dw.com/zh/gute-besserung/l-50417686）— 主题：询问病人（Inquiring about patients）；语法：现在完成时（Present perfect）
- 17.4 《Nehmen Sie …》（https://learngerman.dw.com/zh/nehmen-sie/l-50396933）— 主题：看医生（A visit to the doctor）；语法：介词：vor、nach（Prepositions: vor, nach）

## 第18章 新的家乡（Home）

- 18.1 《Meine Heimat》（https://learngerman.dw.com/zh/meine-heimat/l-50400079）— 主题：谈论家乡（Talking about home）；语法：形容词变格（Adjective declension）
- 18.2 《Leben in Deutschland》（https://learngerman.dw.com/zh/leben-in-deutschland/l-50402839）— 主题：想念的东西（To miss something）；语法：人称代词：第三格（Personal pronouns: dative）
- 18.3 《Anders als zu Hause》（https://learngerman.dw.com/zh/anders-als-zu-hause/l-50413148）— 主题：比较（Comparisons）；语法：（无独立语法点，本课以对话/词汇为主）
- 18.4 《Ich träume von …》（https://learngerman.dw.com/zh/ich-träume-von/l-50413216）— 主题：愿望和梦想（Hopes and dreams）；语法：第二虚拟式：愿望（Subjunctive: Wishes）

## 第结业章 结业测试（Final Test）

- 结业.1 《A1 结业考试》（https://learngerman.dw.com/zh/a1-结业考试/l-51334472）— 主题：学习成果测试（Check your knowledge）；语法：（无独立语法点，本课以对话/词汇为主）

---

来源：learngerman.dw.com（德国之声官方德语学习网站），仅记录目录结构与知识点范围（章节标题、每课标题、主题、语法点、URL 等事实信息），不复制课程正文讲解、例句、练习题等内容。

**缺失/未覆盖信息说明**：
- 未逐课打开全部 77 课页面查看内部练习题、视频文本等正文细节（按任务要求，仅需抽查 1-2 课确认字段格式，已完成抽查并核对一致，详见上方“抓取方式说明”）。
- 章节本身没有独立 URL 或章节简介文字，故未记录“章节描述”，仅有章节标题。
- 未记录每课的视频时长、音频/例句等媒体细节，仅记录目录结构信息（标题/主题/语法点/URL）。
- Final Test A1（结业测试）无语法标签、无独立章节序号，DW 原始分组字段为空字符串，故本文档归入“结业”章。