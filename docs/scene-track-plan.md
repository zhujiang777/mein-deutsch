# 生存场景线课程表（track: 'scene'）

面向目标：用户 2026 年秋冬去德国交换，交换前学完本线即可应对基本生存场景。
每课遵循场景循环模板：scene 对话（8-12 句，A1 词汇封顶）→ 词块 teach（4-6 个整块表达，不是单词）→ observe 归纳 1 个语言现象（浅尝即止，不系统讲语法）→ 检索练习 10-15 题（choice/listenChoice/assemble/dictation 打字/fill）→ reproduce 复述 2-3 句最有用的话 → roleplay 扮演用户角色收尾。

设计原则：
- 词块优先于语法：目标是"整句能脱口而出"，语法解释一句话带过，指向语法主线对应课
- 对话必须是真实场景里真的会发生的对话（含德国文化细节：Stimmt so 小费、Pfand 押金瓶、店员先打招呼等）
- 每课 vocabRefs 标注植入的词表词，供复现引擎使用
- 用户角色的台词是训练重点，reproduce/roleplay 都围绕它

## 首批 6 课（Phase C 第 1 批）

### S1 打招呼与自我介绍 Kennenlernen
交换生到宿舍/教室第一天与人认识。词块：Ich heiße… / Ich komme aus China / Ich studiere… / Freut mich! / Und du?
observe：du vs Sie 的选择。roleplay：向新室友介绍自己。

### S2 咖啡馆点单 Im Café
点咖啡和蛋糕、问价、买单、小费。词块：Ich hätte gern… / Was kostet…? / Zahlen, bitte! / Stimmt so.
observe：hätte gern 比 möchte 更礼貌（不展开虚拟式）。roleplay：完整点单到结账。

### S3 超市购物 Im Supermarkt
找商品、问位置、称重水果、Pfand、结账袋子。词块：Wo finde ich…? / Haben Sie…? / Eine Tüte, bitte. / mit Karte zahlen
observe：疑问句动词提前（指向语法主线疑问句课）。roleplay：问店员找三样东西。

### S4 问路与公交 Nach dem Weg fragen
问路、理解指路（links/rechts/geradeaus）、买票、问几路车。词块：Entschuldigung, wo ist…? / Wie komme ich zu…? / Welcher Bus fährt zu…? / Muss ich umsteigen?
observe：zu + Dativ 的高频缩合 zum/zur（不展开三格系统）。roleplay：问路到火车站。

### S5 大学场景 An der Uni
注册报到、问教室、请老师说慢点、请求重复。词块：Ich bin Austauschstudent(in) / Wo ist Raum…? / Können Sie das bitte wiederholen? / Sprechen Sie bitte langsamer!
observe：Können Sie…? 礼貌请求句式。roleplay：到国际办公室报到。

### S6 看医生与药店 Beim Arzt
预约、描述症状（头疼/发烧/感冒）、药店买药。词块：Ich habe einen Termin / Mein Kopf tut weh / Ich habe Fieber / Haben Sie etwas gegen…?
observe：wehtun 的"部位 + tut weh"结构。roleplay：向医生描述感冒症状。

## 第二批 S7-S11（已上线，commit ce47954）
S7 租房与宿舍（看房、报修）；S8 银行开户与手机卡；S9 餐厅聚餐（预订、推荐、过敏）；S10 紧急情况（丢东西、报警、求助）；**S11 户籍登记 Anmeldung**（到 Bürgeramt 约 Termin、带材料、登记住址、拿 Meldebescheinigung——用户确认焦点为 Anmeldung 而非 Ausländerbehörde 居留）。

## 单元组织
scene 线每 3 课一个 unit：
- unit s-a "初来乍到"（S1-S3）
- unit s-b "出行与校园"（S4-S6）
- unit s-c "安顿下来"（S7-S9）
- unit s-d "办事与应急"（S10-S11，仅 2 课，可后续补第 3 课）
每 unit 配对标来源卡：链接 Nicos Weg 对应生活场景课时（待 docs/nicos-weg-map.md 完成后由 Fable 填）。
