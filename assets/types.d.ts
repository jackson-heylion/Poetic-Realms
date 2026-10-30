/** 单个独立诗境的登记信息。 */
export interface Scene {
  /** 同篇诗文内稳定且唯一的版本标识。 */
  id: string;
  /** 展示给读者的场景名称。 */
  title: string;
  /** 仓库根目录起算的独立 HTML 相对路径。 */
  path: string;
  /** 实际参与创作或续作的模型名称。 */
  model: string;
  /** 实际使用的渲染工具与版本。 */
  tools: string[];
  /** 原型或经过验收的发布状态。 */
  status: "prototype" | "published";
  /** 场景意象与艺术加工说明；旧版本可缺省。 */
  description?: string;
}
/** 一条可核对的诗文电子文本出处。 */
export interface TextSource {
  /** 电子转录或参考整理的来源类别。 */
  kind: string;
  /** 来源中的篇名。 */
  work: string;
  /** 可访问的 HTTPS 原文地址。 */
  url: string;
  /** 语料库名称；文献型来源可缺省。 */
  source?: string;
  /** 书目、卷次或作品集名称；未知时缺省。 */
  collection?: string;
}
/** 尚需与具名底本校勘的电子全文。 */
export interface Transcription {
  /** 按原数据保留的正文段落。 */
  text: string[];
  /** 转录文本的语料定位路径或原文链接。 */
  sourcePath: string;
  /** 电子匹配或在线文本整理方式。 */
  mode: "digital-exact-match" | "online-text-reviewed";
  /** 该电子文本的版本与校勘局限。 */
  warning: string;
}
/** 馆藏唯一数据源中的一篇诗文。 */
export interface Poem {
  /** 跨页面、跨版本保持稳定的作品标识。 */
  id: string;
  /** 作品完整标题。 */
  title: string;
  /** 原作作者。 */
  author: string;
  /** 作者所属朝代。 */
  dynasty: string;
  /** 诗、词、曲或文等体裁。 */
  form: string;
  /** 用作策展入口的原文摘句。 */
  excerpt: string;
  /** 作品可支持的景观意象。 */
  categories: string[];
  /** 场景制作的工程工作量等级。 */
  hardness: "H1" | "H2" | "H3" | "H4" | "H5";
  /** 由原文意象提炼的画面说明。 */
  visualBrief: string;
  /** 具名版本的实际校勘状态。 */
  textReview: string;
  /** 整篇诗文是否已有可用诗境。 */
  sceneStatus: "available" | "prototype" | "published";
  /** 历史兼容路径；新登记版本通常为空。 */
  scenePath: string | null;
  /** 旧版创作模型字段；新版信息在 scenes 中。 */
  model: string | null;
  /** 旧版工具字段；新版信息在 scenes 中。 */
  tools: string[];
  /** GitHub 协作编号；没有关联时为空。 */
  issueNumber: number | null;
  /** 可追溯的原文出处。 */
  sources: TextSource[];
  /** 文本来源的核对程度。 */
  sourceStatus: string;
  /** 版本异文、来源限制及待查事项。 */
  sourceNote: string;
  /** 保留原始字形和标点的电子全文。 */
  transcription: Transcription;
  /** 同篇诗文已登记的独立三维作品。 */
  scenes: Scene[];
}
/** 静态馆藏目录文件的根结构。 */
export interface Catalogue {
  /** 馆藏数据契约版本，当前为 3。 */
  schemaVersion: number;
  /** 全部收录的诗文。 */
  poems: Poem[];
}
/** 放映厅选中的一篇诗文及其演绎版本。 */
export interface Exhibit {
  /** 当前诗境对应的文学作品。 */
  poem: Poem;
  /** 当前加载的独立三维版本。 */
  scene: Scene;
}
/** 展厅向独立诗境发送的可见状态；旧版本可以忽略。 */
export interface SceneVisibilityMessage {
  /** 固定协议名称，避免误处理其他窗口消息。 */
  type: "poetic-realms-visibility";
  /** iframe 与展厅视口相交且页面处于前台时为真。 */
  visible: boolean;
}
