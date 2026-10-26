# 古诗词逐篇文本审校索引（2026-10-26）

> 范围：Poetic Realms 首批 126 篇。此档是**逐篇原文来源与数字转录校核清单**，不是已完成纸本文献逐字对勘的校定本。`poems.json.textReview` 均为 `待版本校勘`。

## 当前可量化进度

- 数字电子全文：**126/126**。
- 每篇可查来源链接：**126/126**。
- 规范化摘句与社区语料精准匹配：**84**，需要人工比对的近似匹配：**0**。
- 从逐篇网页文本定位并录入：**42**，其中五篇同时有社区语料近似匹配证据。
- 逐字校验权威纸本、指定版本、校勘记与典籍卷页：**0/126**（不能用电子文本匹配代替古籍版本校定）。
- 本次审查的数字语料采用 `chinese-poetry/chinese-poetry` 中的唐诗、宋词、诗经、楚辞及蒙学诗文选本，对摘句应用简繁字形转换与标点忽略比较。自动校核记录见 `data/source-audit.json`。单篇文献入口为维基文库等，部分缺可靠卷次。

## 应优先解决的异文与归属

| 作品 | 校勘疑点 | 当前处理 |
| --- | --- | --- |
| 滕王阁序 | 正仓院707年抄本名句见“孤雾”；后世通行“孤鹜”，另有四韵/八韵等差异 | 展示通行“孤鹜”，标注抄本差异；后续做多版本对照 |
| 别董大二首·其一 | “千里黄云”与电子《全唐诗》“十里黄云” | 暂录通行“千里”，记异文 |
| 晚春 | 《游城南十六首》篇次；“草树”与“草木” | 暂录“草树”并注明《千家诗》别录 |
| 菩萨蛮·书江西造口壁 | “毕竟东流去”与电子词库“毕竟江流去” | 暂录“东流去”，待核版本 |
| 如梦令·常记溪亭日暮 | “沉醉”与“沈醉” | 暂录“沉醉”，不将单纯字形差视为定本差 |
| 醉花阴·薄雾浓云愁永昼 | “东篱把酒/把洒”“人比/人似黄花瘦” | 暂录通行“把酒”“人比”，明确语料可能有讹字 |
| 泊船瓜洲 | “春风又绿江南岸”与《王临川集》网上电子本“自绿” | 目录摘句暂保留通行“又绿”，全文采用所查“自绿”，原文校勘待核 |
| 桃花庵歌 | 桃花“庵里/庵下”，碑刻与流传文本 | 采用在线碑刻转录“庵里”，保留异文 |
| 夜宿山寺 | 作者与题名存在争议，李白归属不能视作定论 | `attributionStatus: disputed`，教学务必提示 |
| 乡村四月 | 翁卷《西岩集》与《千家诗》另一署名 | 保留翁卷通行归属，记录异署 |
| 晓出净慈寺送林子方 | 网上转录有作者争议资料 | 暂录杨万里，待查《诚斋集》卷次 |
| 宿新市徐公店 | 二首篇次；“树头新绿/花落”等 | 目录补记为其一，留变体 |
| 采桑子·轻舟短棹西湖好 | 颍州西湖 ≠ 杭州西湖 | 已在场景注释中警示地望，不把两湖混同 |
| 念奴娇·赤壁怀古 | 苏轼怀古赤壁 ≠ 史实三国赤壁战场 | 历史再现场景不得混同 |

## 逐篇来源索引

标识说明：**电子摘句匹配**只说明在社区电子底本中定位句子，**网页底本**仅说明从可查网页摘录/比对，**近似匹配**表示电子语料有异文。下面提供原文链接；真正的纸本校勘尚未完成。

### 先秦

| 作者 | 篇名（原文链接） | 数字核对级别 | 底本校勘 |
|---|---|---|---|
| 佚名 | [蒹葭](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E8%AF%97%E7%BB%8F/shijing.json) | 电子摘句匹配 | 待版本校勘 |
| 佚名 | [桃夭](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E8%AF%97%E7%BB%8F/shijing.json) | 电子摘句匹配 | 待版本校勘 |
| 屈原 | [九歌·湘夫人](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E6%A5%9A%E8%BE%9E/chuci.json) | 电子摘句匹配 | 待版本校勘 |

### 两汉

| 作者 | 篇名（原文链接） | 数字核对级别 | 底本校勘 |
|---|---|---|---|
| 佚名 | [江南](https://zh.wikisource.org/wiki/%E6%B1%9F%E5%8D%97_(%E6%BC%A2%E6%A8%82%E5%BA%9C)) | 网页底本 | 待版本校勘 |
| 曹操 | [观沧海](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E6%9B%B9%E6%93%8D%E8%AF%97%E9%9B%86/caocao.json) | 电子摘句匹配 | 待版本校勘 |

### 魏晋

| 作者 | 篇名（原文链接） | 数字核对级别 | 底本校勘 |
|---|---|---|---|
| 陶渊明 | [归园田居·其一](https://zh.wikisource.org/wiki/%E6%AD%B8%E5%9C%92%E7%94%B0%E5%B1%85) | 网页底本 | 待版本校勘 |
| 陶渊明 | [饮酒·其五](https://zh.wikisource.org/wiki/%E9%A3%B2%E9%85%92%E4%BA%8C%E5%8D%81%E9%A6%96) | 网页底本 | 待版本校勘 |

### 南北朝

| 作者 | 篇名（原文链接） | 数字核对级别 | 底本校勘 |
|---|---|---|---|
| 佚名 | [敕勒歌](https://zh.wikisource.org/wiki/%E6%95%95%E5%8B%92%E6%AD%8C) | 网页底本 | 待版本校勘 |
| 吴均 | [山中杂诗三首·其一](https://zh.wikisource.org/wiki/%E5%90%B3%E6%9C%9D%E8%AB%8B%E9%9B%86) | 网页底本 | 待版本校勘 |
| 谢灵运 | [登池上楼](https://zh.wikisource.org/wiki/%E7%99%BB%E6%B1%A0%E4%B8%8A%E6%A8%93) | 网页底本 | 待版本校勘 |

### 唐

| 作者 | 篇名（原文链接） | 数字核对级别 | 底本校勘 |
|---|---|---|---|
| 王勃 | [滕王阁序](https://zh.wikisource.org/wiki/%E6%BB%95%E7%8E%8B%E9%96%A3%E5%BA%8F) | 网页底本 | 待版本校勘 |
| 李白 | [望庐山瀑布·其二](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E5%85%A8%E5%94%90%E8%AF%97/poet.tang.8000.json) | 电子摘句匹配 | 待版本校勘 |
| 李白 | [早发白帝城](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E8%92%99%E5%AD%A6/tangshisanbaishou.json) | 电子摘句匹配 | 待版本校勘 |
| 李白 | [黄鹤楼送孟浩然之广陵](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E8%92%99%E5%AD%A6/tangshisanbaishou.json) | 电子摘句匹配 | 待版本校勘 |
| 李白 | [独坐敬亭山](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E5%85%A8%E5%94%90%E8%AF%97/poet.tang.8000.json) | 电子摘句匹配 | 待版本校勘 |
| 李白 | [渡荆门送别](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E8%92%99%E5%AD%A6/tangshisanbaishou.json) | 电子摘句匹配 | 待版本校勘 |
| 李白 | [峨眉山月歌](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E5%85%A8%E5%94%90%E8%AF%97/poet.tang.8000.json) | 电子摘句匹配 | 待版本校勘 |
| 李白 | [夜宿山寺](https://zh.wikisource.org/wiki/%E5%A4%9C%E5%AE%BF%E5%B1%B1%E5%AF%BA)（作者存疑） | 网页底本 | 待版本校勘 |
| 李白 | [梦游天姥吟留别](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E8%92%99%E5%AD%A6/tangshisanbaishou.json) | 电子摘句匹配 | 待版本校勘 |
| 李白 | [蜀道难](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E5%85%A8%E5%94%90%E8%AF%97/poet.tang.1000.json) | 电子摘句匹配 | 待版本校勘 |
| 杜甫 | [绝句](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E5%85%A8%E5%94%90%E8%AF%97/poet.tang.11000.json) | 电子摘句匹配 | 待版本校勘 |
| 杜甫 | [绝句二首·其一](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E5%85%A8%E5%94%90%E8%AF%97/poet.tang.11000.json) | 电子摘句匹配 | 待版本校勘 |
| 杜甫 | [春夜喜雨](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E5%85%A8%E5%94%90%E8%AF%97/poet.tang.11000.json) | 电子摘句匹配 | 待版本校勘 |
| 杜甫 | [登高](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E8%92%99%E5%AD%A6/tangshisanbaishou.json) | 电子摘句匹配 | 待版本校勘 |
| 杜甫 | [望岳](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E5%85%A8%E5%94%90%E8%AF%97/poet.tang.10000.json) | 电子摘句匹配 | 待版本校勘 |
| 杜甫 | [江畔独步寻花·其六](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E5%85%A8%E5%94%90%E8%AF%97/poet.tang.11000.json) | 电子摘句匹配 | 待版本校勘 |
| 杜甫 | [旅夜书怀](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E8%92%99%E5%AD%A6/tangshisanbaishou.json) | 电子摘句匹配 | 待版本校勘 |
| 杜甫 | [登岳阳楼](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E8%92%99%E5%AD%A6/tangshisanbaishou.json) | 电子摘句匹配 | 待版本校勘 |
| 王维 | [山居秋暝](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E5%85%A8%E5%94%90%E8%AF%97/poet.tang.6000.json) | 电子摘句匹配 | 待版本校勘 |
| 王维 | [鹿柴](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E5%85%A8%E5%94%90%E8%AF%97/poet.tang.6000.json) | 电子摘句匹配 | 待版本校勘 |
| 王维 | [竹里馆](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E5%85%A8%E5%94%90%E8%AF%97/poet.tang.6000.json) | 电子摘句匹配 | 待版本校勘 |
| 王维 | [鸟鸣涧](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E5%85%A8%E5%94%90%E8%AF%97/poet.tang.6000.json) | 电子摘句匹配 | 待版本校勘 |
| 王维 | [使至塞上](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E5%85%A8%E5%94%90%E8%AF%97/poet.tang.6000.json) | 电子摘句匹配 | 待版本校勘 |
| 王维 | [终南山](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E5%85%A8%E5%94%90%E8%AF%97/poet.tang.6000.json) | 电子摘句匹配 | 待版本校勘 |
| 王维 | [送元二使安西](https://zh.wikisource.org/wiki/%E6%B8%AD%E5%9F%8E%E6%9B%B2) | 网页底本 | 待版本校勘 |
| 王维 | [渭川田家](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E5%85%A8%E5%94%90%E8%AF%97/poet.tang.5000.json) | 电子摘句匹配 | 待版本校勘 |
| 孟浩然 | [春晓](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E5%85%A8%E5%94%90%E8%AF%97/poet.tang.7000.json) | 电子摘句匹配 | 待版本校勘 |
| 孟浩然 | [宿建德江](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E8%92%99%E5%AD%A6/tangshisanbaishou.json) | 电子摘句匹配 | 待版本校勘 |
| 孟浩然 | [过故人庄](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E8%92%99%E5%AD%A6/tangshisanbaishou.json) | 电子摘句匹配 | 待版本校勘 |
| 孟浩然 | [望洞庭湖赠张丞相](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E5%85%A8%E5%94%90%E8%AF%97/poet.tang.7000.json) | 电子摘句匹配 | 待版本校勘 |
| 白居易 | [忆江南·江南好](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E5%85%A8%E5%94%90%E8%AF%97/poet.tang.49000.json) | 电子摘句匹配 | 待版本校勘 |
| 白居易 | [钱塘湖春行](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E5%85%A8%E5%94%90%E8%AF%97/poet.tang.23000.json) | 电子摘句匹配 | 待版本校勘 |
| 白居易 | [暮江吟](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E5%85%A8%E5%94%90%E8%AF%97/poet.tang.23000.json) | 电子摘句匹配 | 待版本校勘 |
| 白居易 | [大林寺桃花](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E5%85%A8%E5%94%90%E8%AF%97/poet.tang.22000.json) | 电子摘句匹配 | 待版本校勘 |
| 白居易 | [赋得古原草送别](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E8%92%99%E5%AD%A6/tangshisanbaishou.json) | 电子摘句匹配 | 待版本校勘 |
| 柳宗元 | [江雪](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E5%85%A8%E5%94%90%E8%AF%97/poet.tang.18000.json) | 电子摘句匹配 | 待版本校勘 |
| 柳宗元 | [渔翁](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E5%85%A8%E5%94%90%E8%AF%97/poet.tang.18000.json) | 电子摘句匹配 | 待版本校勘 |
| 刘禹锡 | [望洞庭](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E5%85%A8%E5%94%90%E8%AF%97/poet.tang.19000.json) | 电子摘句匹配 | 待版本校勘 |
| 刘禹锡 | [竹枝词二首·其一](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E5%85%A8%E5%94%90%E8%AF%97/poet.tang.19000.json) | 电子摘句匹配 | 待版本校勘 |
| 刘禹锡 | [乌衣巷](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E5%85%A8%E5%94%90%E8%AF%97/poet.tang.19000.json) | 电子摘句匹配 | 待版本校勘 |
| 刘禹锡 | [浪淘沙·其一](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E5%85%A8%E5%94%90%E8%AF%97/poet.tang.2000.json) | 电子摘句匹配 | 待版本校勘 |
| 张继 | [枫桥夜泊](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E8%92%99%E5%AD%A6/tangshisanbaishou.json) | 电子摘句匹配 | 待版本校勘 |
| 张志和 | [渔歌子·西塞山前白鹭飞](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E5%85%A8%E5%94%90%E8%AF%97/poet.tang.16000.json) | 电子摘句匹配 | 待版本校勘 |
| 贺知章 | [咏柳](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E5%85%A8%E5%94%90%E8%AF%97/poet.tang.5000.json) | 电子摘句匹配 | 待版本校勘 |
| 杜牧 | [山行](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E5%85%A8%E5%94%90%E8%AF%97/poet.tang.28000.json) | 电子摘句匹配 | 待版本校勘 |
| 杜牧 | [江南春](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E8%92%99%E5%AD%A6/qianjiashi.json) | 电子摘句匹配 | 待版本校勘 |
| 杜牧 | [泊秦淮](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E8%92%99%E5%AD%A6/tangshisanbaishou.json) | 电子摘句匹配 | 待版本校勘 |
| 杜牧 | [秋夕](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E8%92%99%E5%AD%A6/tangshisanbaishou.json) | 电子摘句匹配 | 待版本校勘 |
| 李商隐 | [夜雨寄北](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E8%92%99%E5%AD%A6/tangshisanbaishou.json) | 电子摘句匹配 | 待版本校勘 |
| 李商隐 | [乐游原](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E5%85%A8%E5%94%90%E8%AF%97/poet.tang.29000.json) | 电子摘句匹配 | 待版本校勘 |
| 王昌龄 | [出塞二首·其一](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E5%85%A8%E5%94%90%E8%AF%97/poet.tang.6000.json) | 电子摘句匹配 | 待版本校勘 |
| 王昌龄 | [从军行七首·其四](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E5%85%A8%E5%94%90%E8%AF%97/poet.tang.6000.json) | 电子摘句匹配 | 待版本校勘 |
| 王之涣 | [登鹳雀楼](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E8%92%99%E5%AD%A6/tangshisanbaishou.json) | 电子摘句匹配 | 待版本校勘 |
| 王之涣 | [凉州词二首·其一](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E5%85%A8%E5%94%90%E8%AF%97/poet.tang.13000.json) | 电子摘句匹配 | 待版本校勘 |
| 崔颢 | [黄鹤楼](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E8%92%99%E5%AD%A6/tangshisanbaishou.json) | 电子摘句匹配 | 待版本校勘 |
| 岑参 | [白雪歌送武判官归京](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E8%92%99%E5%AD%A6/tangshisanbaishou.json) | 电子摘句匹配 | 待版本校勘 |
| 高适 | [别董大二首·其一](https://zh.wikisource.org/wiki/別董大) | 网页底本 | 待版本校勘 |
| 韦应物 | [滁州西涧](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E5%85%A8%E5%94%90%E8%AF%97/poet.tang.9000.json) | 电子摘句匹配 | 待版本校勘 |
| 王建 | [十五夜望月寄杜郎中](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E5%85%A8%E5%94%90%E8%AF%97/poet.tang.16000.json) | 电子摘句匹配 | 待版本校勘 |
| 韩愈 | [早春呈水部张十八员外·其一](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E5%85%A8%E5%94%90%E8%AF%97/poet.tang.18000.json) | 电子摘句匹配 | 待版本校勘 |
| 韩愈 | [晚春](https://zh.wikisource.org/wiki/晚春_(韓愈)) | 网页底本 | 待版本校勘 |

### 宋

| 作者 | 篇名（原文链接） | 数字核对级别 | 底本校勘 |
|---|---|---|---|
| 苏轼 | [饮湖上初晴后雨二首·其二](https://zh.wikisource.org/wiki/%E6%9D%B1%E5%9D%A1%E5%85%A8%E9%9B%86/%E5%8D%B7004) | 网页底本 | 待版本校勘 |
| 苏轼 | [题西林壁](https://zh.wikisource.org/wiki/%E9%A1%8C%E8%A5%BF%E6%9E%97%E5%A3%81_(%E8%98%87%E8%BB%BE)) | 网页底本 | 待版本校勘 |
| 苏轼 | [惠崇春江晚景二首·其一](https://zh.wikisource.org/wiki/%E6%83%A0%E5%B4%87%E6%98%A5%E6%B1%9F%E6%99%9A%E6%99%AF) | 网页底本 | 待版本校勘 |
| 苏轼 | [六月二十七日望湖楼醉书五绝·其一](https://zh.wikisource.org/wiki/%E6%9D%B1%E5%9D%A1%E5%85%A8%E9%9B%86/%E5%8D%B7003) | 网页底本 | 待版本校勘 |
| 苏轼 | [念奴娇·赤壁怀古](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E5%AE%8B%E8%AF%8D/ci.song.1000.json) | 电子摘句匹配 | 待版本校勘 |
| 苏轼 | [定风波·莫听穿林打叶声](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E5%AE%8B%E8%AF%8D/ci.song.1000.json) | 电子摘句匹配 | 待版本校勘 |
| 苏轼 | [水调歌头·明月几时有](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E5%AE%8B%E8%AF%8D/ci.song.1000.json) | 电子摘句匹配 | 待版本校勘 |
| 苏轼 | [浣溪沙·游蕲水清泉寺](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E5%AE%8B%E8%AF%8D/ci.song.1000.json) | 电子摘句匹配 | 待版本校勘 |
| 辛弃疾 | [西江月·夜行黄沙道中](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E5%AE%8B%E8%AF%8D/ci.song.11000.json) | 电子摘句匹配 | 待版本校勘 |
| 辛弃疾 | [青玉案·元夕](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E5%AE%8B%E8%AF%8D/ci.song.11000.json) | 电子摘句匹配 | 待版本校勘 |
| 辛弃疾 | [破阵子·为陈同甫赋壮词以寄之](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E5%AE%8B%E8%AF%8D/ci.song.11000.json) | 电子摘句匹配 | 待版本校勘 |
| 辛弃疾 | [菩萨蛮·书江西造口壁](https://zh.wikisource.org/wiki/菩薩蠻_(辛棄疾)/書江西造口壁) | 网页底本 | 待版本校勘 |
| 辛弃疾 | [清平乐·村居](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E5%AE%8B%E8%AF%8D/ci.song.11000.json) | 电子摘句匹配 | 待版本校勘 |
| 李清照 | [如梦令·常记溪亭日暮](https://zh.wikisource.org/wiki/如夢令_(李清照)/如夢令_(常記溪亭日暮)) | 网页底本 | 待版本校勘 |
| 李清照 | [如梦令·昨夜雨疏风骤](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E5%AE%8B%E8%AF%8D/ci.song.6000.json) | 电子摘句匹配 | 待版本校勘 |
| 李清照 | [声声慢·寻寻觅觅](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E5%AE%8B%E8%AF%8D/ci.song.6000.json) | 电子摘句匹配 | 待版本校勘 |
| 李清照 | [醉花阴·薄雾浓云愁永昼](https://zh.wikisource.org/wiki/醉花陰_(李清照)) | 网页底本 | 待版本校勘 |
| 欧阳修 | [采桑子·轻舟短棹西湖好](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E5%AE%8B%E8%AF%8D/ci.song.0.json) | 电子摘句匹配 | 待版本校勘 |
| 欧阳修 | [蝶恋花·庭院深深深几许](https://zh.wikisource.org/wiki/%E6%AD%90%E9%99%BD%E4%BF%AE%E9%9B%86/%E5%8D%B7131) | 网页底本 | 待版本校勘 |
| 晏殊 | [浣溪沙·一曲新词酒一杯](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E5%AE%8B%E8%AF%8D/ci.song.0.json) | 电子摘句匹配 | 待版本校勘 |
| 柳永 | [望海潮·东南形胜](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E5%AE%8B%E8%AF%8D/ci.song.0.json) | 电子摘句匹配 | 待版本校勘 |
| 柳永 | [雨霖铃·寒蝉凄切](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E5%AE%8B%E8%AF%8D/ci.song.0.json) | 电子摘句匹配 | 待版本校勘 |
| 范仲淹 | [苏幕遮·怀旧](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E5%AE%8B%E8%AF%8D/ci.song.0.json) | 电子摘句匹配 | 待版本校勘 |
| 范仲淹 | [渔家傲·秋思](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E5%AE%8B%E8%AF%8D/ci.song.0.json) | 电子摘句匹配 | 待版本校勘 |
| 范仲淹 | [岳阳楼记](https://zh.wikisource.org/wiki/%E8%8C%83%E6%96%87%E6%AD%A3%E5%85%AC%E9%9B%86/%E5%8D%B707) | 网页底本 | 待版本校勘 |
| 杨万里 | [晓出净慈寺送林子方](https://zh.wikisource.org/wiki/%E6%9B%89%E5%87%BA%E6%B7%A8%E6%85%88%E5%AF%BA%E9%80%81%E6%9E%97%E5%AD%90%E6%96%B9) | 网页底本 | 待版本校勘 |
| 杨万里 | [小池](https://zh.wikisource.org/wiki/%E5%B0%8F%E6%B1%A0) | 网页底本 | 待版本校勘 |
| 杨万里 | [宿新市徐公店二首·其一](https://zh.wikisource.org/wiki/%E5%AE%BF%E6%96%B0%E5%B8%82%E5%BE%90%E5%85%AC%E5%BA%97%E4%BA%8C%E9%A6%96) | 网页底本 | 待版本校勘 |
| 杨万里 | [舟过安仁](https://www.arteducation.com.tw/shiwenv_975bf39b1456.html) | 网页底本 | 待版本校勘 |
| 陆游 | [游山西村](https://zh.wikisource.org/wiki/%E9%81%8A%E5%B1%B1%E8%A5%BF%E6%9D%91) | 网页底本 | 待版本校勘 |
| 陆游 | [临安春雨初霁](https://zh.wikisource.org/wiki/%E8%87%A8%E5%AE%89%E6%98%A5%E9%9B%A8%E5%88%9D%E9%9C%BD) | 网页底本 | 待版本校勘 |
| 陆游 | [卜算子·咏梅](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E5%AE%8B%E8%AF%8D/ci.song.9000.json) | 电子摘句匹配 | 待版本校勘 |
| 王安石 | [泊船瓜洲](https://zh.wikisource.org/wiki/%E6%B3%8A%E8%88%B9%E7%93%9C%E6%B4%B2) | 网页底本 | 待版本校勘 |
| 王安石 | [书湖阴先生壁二首·其一](https://zh.wikisource.org/wiki/%E6%9B%B8%E6%B9%96%E9%99%B0%E5%85%88%E7%94%9F%E5%A3%81) | 网页底本 | 待版本校勘 |
| 王安石 | [梅花](https://zh.wikisource.org/wiki/%E6%A2%85%E8%8A%B1_(%E7%8E%8B%E5%AE%89%E7%9F%B3)) | 网页底本 | 待版本校勘 |
| 朱熹 | [春日](https://zh.wikisource.org/wiki/%E6%98%A5%E6%97%A5_(%E6%9C%B1%E7%86%B9)) | 网页底本 | 待版本校勘 |
| 朱熹 | [观书有感二首·其一](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E8%92%99%E5%AD%A6/qianjiashi.json) | 电子摘句匹配 | 待版本校勘 |
| 林升 | [题临安邸](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E8%92%99%E5%AD%A6/qianjiashi.json) | 电子摘句匹配 | 待版本校勘 |
| 叶绍翁 | [游园不值](https://zh.wikisource.org/wiki/%E9%81%8A%E5%9C%92%E4%B8%8D%E5%80%BC) | 网页底本 | 待版本校勘 |
| 翁卷 | [乡村四月](https://zh.wikisource.org/wiki/%E9%84%89%E6%9D%91%E5%9B%9B%E6%9C%88) | 网页底本 | 待版本校勘 |
| 赵师秀 | [约客](https://zh.wikisource.org/wiki/%E7%B4%84%E5%AE%A2) | 网页底本 | 待版本校勘 |
| 秦观 | [鹊桥仙·纤云弄巧](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E5%AE%8B%E8%AF%8D/ci.song.3000.json) | 电子摘句匹配 | 待版本校勘 |
| 秦观 | [踏莎行·郴州旅舍](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E5%AE%8B%E8%AF%8D/ci.song.3000.json) | 电子摘句匹配 | 待版本校勘 |
| 周邦彦 | [苏幕遮·燎沉香](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E5%AE%8B%E8%AF%8D/ci.song.4000.json) | 电子摘句匹配 | 待版本校勘 |
| 姜夔 | [扬州慢·淮左名都](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E5%AE%8B%E8%AF%8D/ci.song.12000.json) | 电子摘句匹配 | 待版本校勘 |

### 元

| 作者 | 篇名（原文链接） | 数字核对级别 | 底本校勘 |
|---|---|---|---|
| 马致远 | [天净沙·秋思](https://zh.wikisource.org/wiki/%E5%A4%A9%E6%B7%A8%E6%B2%99%C2%B7%E7%A7%8B%E6%80%9D) | 网页底本 | 待版本校勘 |
| 白朴 | [天净沙·秋](https://zh.wikisource.org/wiki/%E5%A4%A9%E6%B7%A8%E6%B2%99_(%E7%99%BD%E6%A8%B8)) | 网页底本 | 待版本校勘 |
| 张养浩 | [山坡羊·潼关怀古](https://zh.wikisource.org/wiki/%E5%B1%B1%E5%9D%A1%E7%BE%8A_%E6%BD%BC%E9%97%9C%E6%87%B7%E5%8F%A4) | 网页底本 | 待版本校勘 |

### 明

| 作者 | 篇名（原文链接） | 数字核对级别 | 底本校勘 |
|---|---|---|---|
| 唐寅 | [桃花庵歌](https://zh.wikisource.org/wiki/%E6%A1%83%E8%8A%B1%E5%BA%B5%E6%AD%8C) | 网页底本 | 待版本校勘 |
| 杨慎 | [临江仙·滚滚长江东逝水](https://zh.wikisource.org/wiki/%E8%87%A8%E6%B1%9F%E4%BB%99_(%E6%A5%8A%E6%85%8E)) | 网页底本 | 待版本校勘 |

### 清

| 作者 | 篇名（原文链接） | 数字核对级别 | 底本校勘 |
|---|---|---|---|
| 纳兰性德 | [长相思·山一程](https://github.com/chinese-poetry/chinese-poetry/blob/master/%E7%BA%B3%E5%85%B0%E6%80%A7%E5%BE%B7/%E7%BA%B3%E5%85%B0%E6%80%A7%E5%BE%B7%E8%AF%97%E9%9B%86.json) | 电子摘句匹配 | 待版本校勘 |
| 高鼎 | [村居](https://zh.wikisource.org/wiki/%E6%9D%91%E5%B1%85_(%E9%AB%98%E9%BC%8E)) | 网页底本 | 待版本校勘 |
| 袁枚 | [所见](https://zh.wikisource.org/wiki/%E6%89%80%E8%A6%8B(%E8%A2%81%E6%9E%9A)) | 网页底本 | 待版本校勘 |
| 郑燮 | [竹石](https://zh.wikisource.org/wiki/%E7%AB%B9%E7%9F%B3) | 网页底本 | 待版本校勘 |
| 龚自珍 | [己亥杂诗·其五](https://zh.wikisource.org/wiki/%E5%B7%B1%E4%BA%A5%E9%9B%9C%E8%A9%A9) | 网页底本 | 待版本校勘 |

## 后续真正的文献校勘工作

1. 对每篇选定有书目坐标的可靠底本（古籍集部刻本、影印本或有版本交代的整理本），记录书名、卷、页、出版或藏本标识。现在部分数据只有在线来源，**不应擅自填入卷次**。
2. 与本库 `transcription.text` 逐句校对，保留异文、底本读法与选择理由；对于正仓院抄本《滕王阁序》等必须保存不同版本而不是覆写抄本。
3. 对作者有争议的作品添加多种归属及证据，不直接出具“李白确作”等教学断言。
4. 正式完成并复核一篇后，记录校勘者、复核者、日期、所据底本，才把 `textReview` 改为 `已版本校勘`。推荐追加 `editionRecord` 字段而不是仅凭一个 URL 升级。
5. 全文与题名的简繁字形原样存储，展示时可以做轻量字形转换，但**严禁把简繁映射结果解释成历史版本差异**。

## 数据文件

- [首批馆藏与全文](../data/poems.json)
- [电子语料比对证据](../data/source-audit.json)
- [文本与来源数据规范](CATALOG_RULES.md)

声明：以公开古代原作为基础进行研究；维基文库编辑页面、第三方现代翻译或注解本身可能受各自许可制约，复制衍生内容时需另核许可。
