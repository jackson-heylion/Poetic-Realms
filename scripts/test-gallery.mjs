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
    this.contentDocument = { querySelector: () => ({ tagName: "CANVAS" }) };
  }
  addEventListener(type, handler) {
    this.events[type] = handler;
  }
  append(child) {
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
  const document = {
    title: "",
    body: new NodeStub(),
    querySelector: (key) => nodes[key],
    createElement: () => new NodeStub(),
    addEventListener() {},
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
  return { nodes, history };
}

const { nodes, history } = await setup("?poem=jiangxue&scene=alternate");
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
  "PASS gallery: version switching, deep link, full text, invalid links, unbuilt poem and loading failure",
);
