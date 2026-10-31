import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const source = readFileSync(
  new URL("../assets/gallery.js", import.meta.url),
  "utf8",
);
class NodeStub {
  constructor() {
    this.items = [];
    this.dataset = {};
    this.events = {};
    this.attributes = {};
    this.hidden = true;
    this.textContent = "";
    this.src = "";
    this.parentElement = null;
    this.contentDocument = {
      events: {},
      querySelector: () => ({ tagName: "CANVAS" }),
      addEventListener(type, handler) {
        this.events[type] = handler;
      },
    };
  }
  addEventListener(type, handler) {
    this.events[type] = handler;
  }
  append(child) {
    if (child.parentElement)
      child.parentElement.items = child.parentElement.items.filter(
        (item) => item !== child,
      );
    child.parentElement = this;
    this.items.push(child);
  }
  replaceChildren(...children) {
    this.items = children;
  }
  querySelectorAll() {
    return this.items;
  }
  setAttribute(key, value) {
    this.attributes[key] = value;
  }
}
const scene = (id) => ({
  id,
  title: id,
  path: "scenes/jiangxue/" + id + ".html",
  model: "GPT-6",
  tools: ["WebGL"],
  status: "prototype",
});
const scenes = [scene("original"), scene("alternate")];
const poem = {
  id: "jiangxue",
  title: "江雪",
  author: "柳宗元",
  dynasty: "唐",
  form: "诗",
  excerpt: "千山鸟飞绝，万径人踪灭。",
  visualBrief: "寒江独钓",
  scenes,
  transcription: {
    text: ["千山鸟飞绝，万径人踪灭。", "孤舟蓑笠翁，独钓寒江雪。"],
    warning: "待版本校勘",
  },
  sourceNote: "电子转录",
  sources: [],
};

async function setup(search, catalogue = [poem]) {
  const ids = [
    "gallery-empty",
    "gallery-frame",
    "gallery-message",
    "gallery-recover",
    "gallery-fullscreen",
    "gallery-stage",
    "gallery-title",
    "gallery-author",
    "gallery-verse",
    "gallery-detail",
    "gallery-count",
    "gallery-current",
    "gallery-prev",
    "gallery-next",
    "gallery-arrows",
    "gallery-standalone",
    "gallery-options",
    "gallery-scene-title",
    "gallery-brief",
    "gallery-poem",
    "gallery-source",
    "gallery-reading",
    "gallery-copy",
  ];
  const nodes = Object.fromEntries(ids.map((id) => ["#" + id, new NodeStub()]));
  const arrowHome = new NodeStub();
  arrowHome.append(nodes["#gallery-arrows"]);
  const document = {
    title: "",
    events: {},
    fullscreenElement: null,
    body: new NodeStub(),
    querySelector: (key) => nodes[key],
    createElement: () => new NodeStub(),
    addEventListener(type, handler) {
      this.events[type] = handler;
    },
    async exitFullscreen() {
      this.fullscreenElement = null;
      this.events.fullscreenchange();
    },
  };
  nodes["#gallery-stage"].requestFullscreen = async () => {
    document.fullscreenElement = nodes["#gallery-stage"];
    document.events.fullscreenchange();
  };
  const url = "https://example.test/Poetic-Realms/gallery.html" + search;
  const history = {
    url: "",
    replaceState(_a, _b, path) {
      this.url = String(path);
    },
  };
  const load = async () => {
    if (catalogue instanceof Error) throw catalogue;
    return catalogue;
  };
  runInNewContext(source, {
    document,
    history,
    location: { href: url, search },
    URL,
    URLSearchParams,
    PoeticRealmsData: { load },
    PoeticRealmsClipboard: { handleCopyClick() {}, toast() {} },
    setTimeout,
    clearTimeout,
    window: { setTimeout },
    console: { error() {} },
    IntersectionObserver: class {
      observe() {}
    },
  });
  await new Promise((resolve) => setImmediate(resolve));
  return { nodes, history, document, arrowHome };
}

const { nodes, history, document, arrowHome } = await setup(
  "?poem=jiangxue&scene=alternate",
);
const frame = nodes["#gallery-frame"],
  options = nodes["#gallery-options"];
assert.equal(options.items.length, 2);
assert.equal(
  frame.src,
  scenes[1].path,
  "deep link selects the requested version",
);
assert.equal(options.items[1].attributes["aria-pressed"], "true");
assert(history.url.includes("scene=alternate"));
nodes["#gallery-prev"].events.click();
assert.equal(frame.src, scenes[0].path);
nodes["#gallery-next"].events.click();
assert.equal(frame.src, scenes[1].path);
options.items[0].events.click();
assert.equal(frame.src, scenes[0].path);
assert.equal(nodes["#gallery-standalone"].href, scenes[0].path);
frame.events.load();
assert.equal(frame.hidden, false);
assert.equal(nodes["#gallery-empty"].hidden, true);
assert.equal(
  nodes["#gallery-poem"].items[1].textContent,
  poem.transcription.text[1],
);

await nodes["#gallery-fullscreen"].events.click();
assert.equal(document.fullscreenElement, nodes["#gallery-stage"]);
assert.equal(nodes["#gallery-arrows"].parentElement, document.fullscreenElement);
assert.equal(nodes["#gallery-arrows"].hidden, false);
assert.equal(nodes["#gallery-fullscreen"].textContent, "退出全屏 ⤢");
assert.equal(nodes["#gallery-fullscreen"].attributes["aria-label"], "退出全屏欣赏");
nodes["#gallery-next"].events.click();
assert.equal(frame.src, scenes[1].path, "fullscreen next button switches version");
assert.equal(nodes["#gallery-fullscreen"].hidden, false, "exit remains available while loading");
frame.events.load();

function key(key, options = {}) {
  return {
    key,
    prevented: false,
    stopped: false,
    preventDefault() { this.prevented = true; },
    stopPropagation() { this.stopped = true; },
    ...options,
  };
}
const previous = key("ArrowLeft");
frame.contentDocument.events.keydown(previous);
assert.equal(frame.src, scenes[0].path, "iframe focus retains fullscreen navigation");
assert(previous.prevented && previous.stopped);
frame.events.load();
const next = key("ArrowRight");
document.events.keydown(next);
assert.equal(frame.src, scenes[1].path);
assert(next.prevented && next.stopped);
const modified = key("ArrowLeft", { ctrlKey: true });
document.events.keydown(modified);
assert.equal(modified.prevented, false);
const editing = key("ArrowLeft", { target: { closest: () => ({}) } });
frame.contentDocument.events.keydown(editing);
assert.equal(editing.prevented, false);
frame.contentDocument.querySelector = () => null;
frame.events.load();
assert.equal(nodes["#gallery-fullscreen"].hidden, false, "failed version still allows fullscreen exit");
await nodes["#gallery-fullscreen"].events.click();
assert.equal(document.fullscreenElement, null);
assert.equal(nodes["#gallery-arrows"].parentElement, arrowHome);
assert.equal(nodes["#gallery-fullscreen"].textContent, "全屏欣赏 ⤢");
const ordinary = key("ArrowLeft");
document.events.keydown(ordinary);
assert.equal(ordinary.prevented, false, "ordinary scene keyboard controls are preserved");

const missing = await setup("?poem=unknown");
assert.equal(missing.nodes["#gallery-recover"].hidden, false);
assert.equal(missing.nodes["#gallery-frame"].src, "");
const invalid = await setup("?poem=../../private");
assert.equal(invalid.nodes["#gallery-recover"].hidden, false);
const empty = await setup("?poem=jiangxue", [{ ...poem, scenes: [] }]);
assert.equal(
  empty.nodes["#gallery-reading"].hidden,
  false,
  "unbuilt poems still show the full text",
);
assert.equal(empty.nodes["#gallery-recover"].hidden, false);
const failed = await setup("?poem=jiangxue", Error("offline"));
assert.equal(failed.nodes["#gallery-recover"].hidden, false);
console.log(
  "PASS gallery: version switching, fullscreen controls and iframe keyboard navigation, deep links, full text and loading failure",
);
