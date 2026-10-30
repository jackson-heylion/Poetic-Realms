/* 馆藏目录的唯一入口：只请求一次 data/poems.json，目录页与放映厅共用。 */
(function (root) {
  "use strict";

  var cache = null;
  var pending = null;

  function load() {
    if (cache) return Promise.resolve(cache);
    if (pending) return pending;
    pending = fetch("data/poems.json")
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (data) {
        if (!Array.isArray(data.poems)) throw new Error("目录格式错误");
        cache = data.poems;
        pending = null;
        return cache;
      })
      .catch(function (err) {
        pending = null;
        throw err;
      });
    return pending;
  }

  function find(id) {
    if (!cache) return null;
    for (var i = 0; i < cache.length; i++) if (cache[i].id === id) return cache[i];
    return null;
  }

  root.PoeticRealmsData = Object.freeze({ load: load, find: find });
})(globalThis);
