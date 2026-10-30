/** 独立场景的可交互运行状态。 */
export interface SceneState {
  /** 诗词视点：灯下近景或连营远望。 */
  view: "lamp" | "camp";
  /** 动态火焰、旌旗和烟尘是否播放。 */
  playing: boolean;
  /** 宿主展厅是否允许当前场景绘制。 */
  visible: boolean;
  /** 已播放的场景时间，单位秒。 */
  elapsed: number;
  /** 从灯下到连营镜头的当前插值，范围 0–1。 */
  blend: number;
  /** 画质档位：0 流畅、1 标准、2 精细。 */
  quality: number;
  /** 水平环顾角，单位弧度。 */
  yaw: number;
  /** 垂直环顾角，单位弧度。 */
  pitch: number;
  /** 沿视线推近的距离，单位场景米。 */
  zoom: number;
  /** 暂停状态下是否需要重画视点或设置。 */
  dirty: boolean;
  /** 图形资源是否发生不可恢复错误。 */
  failed: boolean;
}
