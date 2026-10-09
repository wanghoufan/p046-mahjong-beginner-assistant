/* P046 麻将小白助手 — Service Worker
   离线优先：安装时预缓存全部同源资源；导航请求 network-first（在线取新、离线回退缓存），
   静态资源 cache-first。仅处理同源 GET；跨域与写请求一律放行不拦截。 */
"use strict";

var SW_VERSION = "p046-v4";
var CACHE_NAME = "p046-" + SW_VERSION;

var PRECACHE = [
  "./",
  "./index.html",
  "./app.css",
  "./app.js",
  "./i18n.js",
  "./manifest.webmanifest",
  "./data/rules.js",
  "./data/examples.js",
  "./assets/brand/ic_logo_foreground.png",
  "./assets/brand/icon-192.png",
  "./assets/brand/icon-512.png",
  "./assets/brand/apple-touch-icon.png",
  "./assets/brand/favicon.png",
  "./assets/tiles/F1.png",
  "./assets/tiles/F2.png",
  "./assets/tiles/F3.png",
  "./assets/tiles/F4.png",
  "./assets/tiles/F5.png",
  "./assets/tiles/F6.png",
  "./assets/tiles/F7.png",
  "./assets/tiles/F8.png",
  "./assets/tiles/P1.png",
  "./assets/tiles/P2.png",
  "./assets/tiles/P3.png",
  "./assets/tiles/P4.png",
  "./assets/tiles/P5.png",
  "./assets/tiles/P6.png",
  "./assets/tiles/P7.png",
  "./assets/tiles/P8.png",
  "./assets/tiles/P9.png",
  "./assets/tiles/S1.png",
  "./assets/tiles/S2.png",
  "./assets/tiles/S3.png",
  "./assets/tiles/S4.png",
  "./assets/tiles/S5.png",
  "./assets/tiles/S6.png",
  "./assets/tiles/S7.png",
  "./assets/tiles/S8.png",
  "./assets/tiles/S9.png",
  "./assets/tiles/W1.png",
  "./assets/tiles/W2.png",
  "./assets/tiles/W3.png",
  "./assets/tiles/W4.png",
  "./assets/tiles/W5.png",
  "./assets/tiles/W6.png",
  "./assets/tiles/W7.png",
  "./assets/tiles/W8.png",
  "./assets/tiles/W9.png",
  "./assets/tiles/Z1.png",
  "./assets/tiles/Z2.png",
  "./assets/tiles/Z3.png",
  "./assets/tiles/Z4.png",
  "./assets/tiles/Z5.png",
  "./assets/tiles/Z6.png",
  "./assets/tiles/Z7.png"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(PRECACHE);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (key) {
        if (key !== CACHE_NAME) return caches.delete(key);
        return null;
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function (event) {
  var req = event.request;
  if (req.method !== "GET") return;

  var url;
  try { url = new URL(req.url); } catch (e) { return; }
  if (url.origin !== self.location.origin) return;

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE_NAME).then(function (cache) { cache.put(req, copy); });
        return res;
      }).catch(function () {
        return caches.match(req).then(function (cached) {
          return cached || caches.match("./index.html");
        });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(function (cached) {
      if (cached) return cached;
      return fetch(req).then(function (res) {
        if (res && res.ok && res.type === "basic") {
          var copy = res.clone();
          caches.open(CACHE_NAME).then(function (cache) { cache.put(req, copy); });
        }
        return res;
      }).catch(function () {
        return caches.match(req);
      });
    })
  );
});
