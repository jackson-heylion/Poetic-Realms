/* 原生控件与指针手势；暂停和不可见状态均不维持绘制循环。 */
/** @typedef {object} PointerPosition
 * @property {number} x 指针横坐标，单位 CSS 像素。
 * @property {number} y 指针纵坐标，单位 CSS 像素。
 */
/** @typedef {object} HostVisibilityMessage
 * @property {"poetic-realms-visibility"} type 展厅可见性事件名称。
 * @property {boolean} visible 该场景在宿主中是否可见。
 */
function bindControls() {
  const pause=document.getElementById("pause");
  const poem=document.getElementById("poem");
  const restore=document.getElementById("restore");
  const pointers=new Map();
  let pinch=0;
  const updatePause=() => {
    pause.textContent=stats.paused ? "继续" : "暂停";
    pause.setAttribute("aria-pressed",String(stats.paused));
  };
  const setQuiet=(quiet) => {
    document.body.classList.toggle("is-quiet",quiet);
    restore.hidden=!quiet;
    document.getElementById("quiet").setAttribute("aria-pressed",String(quiet));
    if (quiet) restore.focus();
    else document.getElementById("quiet").focus();
  };
  pause.addEventListener("click",() => {
    stats.paused=!stats.paused;
    updatePause();
    if (stats.paused) stop();
    else wake();
  });
  document.getElementById("reset").addEventListener("click",() => {
    goal.yaw=0; goal.pitch=0; goal.distance=8;
    reflectionDirty=true;
    wake();
  });
  document.getElementById("quality").addEventListener("change",(event) => {
    const quality=event.currentTarget.value;
    if (!["low","normal","high"].includes(quality)) return;
    stats.quality=quality;
    applyQuality();
  });
  document.getElementById("quiet").addEventListener("click",() => setQuiet(true));
  restore.addEventListener("click",() => setQuiet(false));
  document.getElementById("read").addEventListener("click",() => poem.showModal());
  document.getElementById("close-poem").addEventListener("click",() => poem.close());
  poem.addEventListener("click",(event) => {
    const rect=poem.getBoundingClientRect();
    if (event.clientX<rect.left || event.clientX>rect.right || event.clientY<rect.top || event.clientY>rect.bottom) poem.close();
  });
  setTimeout(() => document.getElementById("gesture").classList.add("expired"),8500);
  reducedMotion.addEventListener("change",(event) => {
    if (event.matches) {
      stats.paused=true;
      stop();
      updatePause();
    }
  });
  updatePause();

  canvas.addEventListener("pointerdown",(event) => {
    canvas.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId,{ x:event.clientX,y:event.clientY });
    document.getElementById("gesture").classList.add("expired");
  });
  canvas.addEventListener("pointermove",(event) => {
    const position=pointers.get(event.pointerId);
    if (!position) return;
    if (pointers.size===1) {
      goal.yaw=clamp(goal.yaw-(event.clientX-position.x)*.0017,-.40,.40);
      goal.pitch=clamp(goal.pitch+(event.clientY-position.y)*.0007,-.11,.11);
    }
    position.x=event.clientX; position.y=event.clientY;
    if (pointers.size===2) {
      const [a,b]=[...pointers.values()];
      const span=Math.hypot(a.x-b.x,a.y-b.y);
      if (pinch && span>1) goal.distance=clamp(goal.distance*pinch/span,5.5,13);
      pinch=span;
    }
    reflectionDirty=true;
    wake();
  });
  const release=(event) => {
    pointers.delete(event.pointerId);
    if (pointers.size<2) pinch=0;
  };
  for (const name of ["pointerup","pointercancel","lostpointercapture"]) canvas.addEventListener(name,release);
  canvas.addEventListener("wheel",(event) => {
    event.preventDefault();
    goal.distance=clamp(goal.distance+event.deltaY*.004,5.5,13);
    reflectionDirty=true;
    wake();
  },{passive:false});
  addEventListener("keydown",(event) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key==="Escape" && !poem.open) { setQuiet(false); return; }
    if (poem.open || !(event.target instanceof Element) || event.target.closest("button,select,input,textarea,a") || event.target.isContentEditable) return;
    if (event.key===" ") { event.preventDefault(); pause.click(); }
    if (event.key.toLowerCase()==="r") document.getElementById("reset").click();
    if (event.key.toLowerCase()==="h") setQuiet(!document.body.classList.contains("is-quiet"));
  });
  addEventListener("resize",resize);
  addEventListener("pagehide",stop);
  addEventListener("pageshow",wake);
  document.addEventListener("visibilitychange",() => {
    if (document.hidden) stop();
    else { reflectionDirty=true; wake(); }
  });
  addEventListener("message",(event) => {
    if (event.source!==parent || event.origin!==location.origin) return;
    const payload=event.data;
    if (!payload || payload.type!=="poetic-realms-visibility" || typeof payload.visible!=="boolean") return;
    /** @type {HostVisibilityMessage} */
    const message={type:"poetic-realms-visibility",visible:payload.visible};
    hostVisible=message.visible;
    if (hostVisible) { reflectionDirty=true; wake(); }
    else stop();
  });
  canvas.addEventListener("webglcontextlost",(event) => {
    event.preventDefault();
    stats.contextLost=true;
    fail("显卡连接暂时中断，正在等待浏览器恢复。若未恢复，可重新载入。");
  });
  canvas.addEventListener("webglcontextrestored",() => {
    failed=false;
    stats.contextLost=false;
    document.getElementById("error").hidden=true;
    applyQuality();
  });
}
