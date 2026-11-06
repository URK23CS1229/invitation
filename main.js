/* =====================================================================
   Pink Lotus Engagement Invitation — behaviour
   1 fill text from config · 2 floral arch · 3 envelope opening
   4 music · 5 falling petals · 6 sparkles · 7 scroll reveal · 8 countdown
   ===================================================================== */
(function () {
  "use strict";

  var cfg = window.INVITE || {};
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var wait = function (ms) { return new Promise(function (r) { setTimeout(r, reduceMotion ? Math.min(ms, 200) : ms); }); };
  var SVGNS = "http://www.w3.org/2000/svg";

  /* ---------- 1. Fill every [data-key] from config.js (Tamil / English) ---------- */
  var EN = window.INVITE_EN || {};
  var lang = "ta";
  try { lang = localStorage.getItem("invite-lang") === "en" ? "en" : "ta"; } catch (e) {}
  var taTitle = document.title;
  function t(key) {
    if (lang === "en" && EN[key] != null) return EN[key];
    return cfg[key] == null ? "" : cfg[key];
  }
  function applyLang(next) {
    lang = next;
    try { localStorage.setItem("invite-lang", lang); } catch (e) {}
    document.documentElement.lang = lang;
    document.title = lang === "en" && EN.pageTitle ? EN.pageTitle : taTitle;
    $$("[data-key]").forEach(function (el) { el.textContent = t(el.getAttribute("data-key")); });
    $$(".lang-switch button").forEach(function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-lang") === lang ? "true" : "false");
    });
    var label = $("#openBtn .open-label");
    $("#seal").setAttribute("aria-label", label ? label.textContent : "");
    var cd = $("#countdown");
    if (cd && cd.classList.contains("is-done")) $(".countdown-label", cd).textContent = t("countdownDone");
  }
  $$(".lang-switch button").forEach(function (b) {
    b.addEventListener("click", function () { applyLang(b.getAttribute("data-lang")); });
  });
  applyLang(lang);
  $$(".seal-initials-l").forEach(function (el) {
    el.textContent = (cfg.initial1 || "") + " · " + (cfg.initial2 || "");
  });
  $$(".seal-initials").forEach(function (t) {
    t.textContent = (cfg.initial1 || "") + " " + (cfg.initial2 || "");
  });
  $("#mapBtn").href = cfg.mapUrl || "#";

  /* ---------- 1b. Lotus-pond video first, then the envelope floats in ---------- */
  var introVideo = $("#introVideo");
  (function videoIntro() {
    var VIDEO_MS = reduceMotion ? 300 : 2500;  // how long the video plays alone
    var done = false;
    function ready() { if (!done) { done = true; document.body.classList.add("is-ready"); } }
    if (introVideo) {
      var p = introVideo.play();
      if (p && p.catch) p.catch(function () {});           // autoplay blocked → poster image shows
      introVideo.addEventListener("playing", function () { setTimeout(ready, VIDEO_MS); }, { once: true });
      introVideo.addEventListener("error", ready);
    }
    setTimeout(ready, VIDEO_MS + 2000);                     // safety: never wait forever on slow internet
  })();

  /* ---------- 2. Floral arch: flowers placed along the arch path ---------- */
  (function buildArch() {
    var path = $("#archPath"), group = $("#archFlowers");
    if (!path || !path.getTotalLength) return;
    var len = path.getTotalLength();
    var count = 30;

    function addAt(dist, href, w, h, cls, delay, fixedAng) {
      var p = path.getPointAtLength(dist);
      var q = path.getPointAtLength(Math.min(len, dist + 1));
      var ang = fixedAng != null ? fixedAng : Math.atan2(q.y - p.y, q.x - p.x) * 180 / Math.PI;
      var outer = document.createElementNS(SVGNS, "g");
      outer.setAttribute("transform", "translate(" + p.x.toFixed(1) + " " + p.y.toFixed(1) + ") rotate(" + ang.toFixed(1) + ")");
      var inner = document.createElementNS(SVGNS, "g");
      if (cls) { inner.setAttribute("class", cls); inner.style.animationDelay = delay + "s"; }
      var use = document.createElementNS(SVGNS, "use");
      use.setAttribute("href", href);
      use.setAttribute("x", -w / 2); use.setAttribute("y", -h / 2);
      use.setAttribute("width", w); use.setAttribute("height", h);
      inner.appendChild(use); outer.appendChild(inner); group.appendChild(outer);
    }
    function jasmine(dist) {
      var p = path.getPointAtLength(dist);
      [[-3, -2], [3, -2], [0, 3]].forEach(function (o) {
        var c = document.createElementNS(SVGNS, "circle");
        c.setAttribute("cx", (p.x + o[0]).toFixed(1)); c.setAttribute("cy", (p.y + o[1]).toFixed(1));
        c.setAttribute("r", "2.6"); c.setAttribute("fill", "#fffdf6");
        c.setAttribute("stroke", "#d9bf86"); c.setAttribute("stroke-width", ".6");
        group.appendChild(c);
      });
    }

    for (var i = 0; i <= count; i++) {
      var d = len * (0.03 + 0.94 * i / count);
      if (Math.abs(d - len / 2) < len * 0.05) continue; // keep the top free for the big lotus
      if (i % 2 === 0) addAt(d, "#lotus", 26, 18, "arch-flower", -(i * 0.3));
      else { addAt(d, "#lotus-leaf", 18, 8, null); jasmine(d); }
    }
    addAt(len / 2, "#lotus", 70, 49, "arch-flower", 0);           // crown lotus
    addAt(len * 0.005, "#lotus-bud", 16, 32, null, 0, -8);                // feet
    addAt(len * 0.995, "#lotus-bud", 16, 32, null, 0, 8);
  })();

  /* ---------- 3. Envelope opening sequence ---------- */
  var intro = $("#intro"), invite = $("#invite"), letter = $("#letter");
  var openBtn = $("#openBtn"), seal = $("#seal"), envelope = $("#envelope");
  var opened = false;

  function openInvitation() {
    if (opened) return;
    opened = true;
    startMusic();                       // must run inside the tap → no autoplay blocking
    intro.classList.add("is-opening");

    wait(420)
      .then(function () { intro.classList.add("is-seal-broken"); return wait(500); })
      .then(function () { intro.classList.add("is-flap-open"); return wait(480); })
      .then(function () { intro.classList.add("is-flap-behind"); return wait(380); })
      .then(function () { intro.classList.add("is-letter-out"); return wait(1250); })
      .then(function () {
        // zoom the card so it fills the screen
        var r = letter.getBoundingClientRect();
        var vw = window.innerWidth, vh = window.innerHeight;
        var dx = vw / 2 - (r.left + r.width / 2);
        var dy = vh / 2 - (r.top + r.height / 2);
        var s = Math.max(vw / r.width, vh / r.height) * 1.08;
        letter.style.transform = "translate(" + dx + "px," + dy + "px) translateY(-58%) scale(" + s + ")";
        letter.style.opacity = "0";
        intro.classList.add("is-zooming");
        return wait(450);
      })
      .then(function () {
        window.scrollTo(0, 0);
        document.body.classList.remove("is-locked");
        invite.setAttribute("aria-hidden", "false");
        invite.classList.add("is-visible");
        $("#musicBtn").classList.add("is-shown");
        intro.classList.add("is-gone");
        startCountdown();
        return wait(1100);
      })
      .then(function () {
        intro.style.display = "none";
        if (introVideo) introVideo.pause();
        $$(".hero .reveal").forEach(function (el) { el.classList.add("is-in"); });
      });
  }
  openBtn.addEventListener("click", openInvitation);
  seal.addEventListener("click", openInvitation);
  envelope.addEventListener("click", openInvitation);

  /* ---------- 4. Background music (starts only after a tap) ---------- */
  var audio = $("#bgm"), musicBtn = $("#musicBtn");
  var targetVol = typeof cfg.musicVolume === "number" ? cfg.musicVolume : 0.55;
  var wantMusic = false, fadeRaf = 0;
  audio.src = cfg.music || "";

  function fadeTo(vol, ms, done) {
    cancelAnimationFrame(fadeRaf);
    var from = audio.volume, t0 = performance.now();
    (function step(now) {
      var k = Math.min(1, (now - t0) / ms);
      audio.volume = from + (vol - from) * k;
      if (k < 1) fadeRaf = requestAnimationFrame(step); else if (done) done();
    })(t0);
  }
  function setBtn(on) { musicBtn.setAttribute("aria-pressed", on ? "true" : "false"); }
  function startMusic() {
    if (!audio.src) return;
    wantMusic = true;
    audio.volume = 0;
    var p = audio.play();
    setBtn(true);
    if (p && p.then) p.then(function () { fadeTo(targetVol, 2500); }).catch(function () { wantMusic = false; setBtn(false); });
    else fadeTo(targetVol, 2500);
  }
  function stopMusic() {
    wantMusic = false; setBtn(false);
    fadeTo(0, 400, function () { audio.pause(); });
  }
  musicBtn.addEventListener("click", function () { if (wantMusic) stopMusic(); else startMusic(); });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) { audio.pause(); }
    else if (wantMusic) { audio.play().catch(function () {}); }
  });

  /* ---------- 5. Falling lotus petals (one light canvas) ---------- */
  (function petals() {
    var canvas = $("#petals");
    if (reduceMotion || !canvas.getContext) { canvas.remove(); return; }
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, list = [], running = true;

    // draw one petal once, then re-use it as an image (fast on phones)
    var tex = document.createElement("canvas");
    tex.width = 60; tex.height = 100;
    var t = tex.getContext("2d");
    var g = t.createLinearGradient(0, 0, 0, 100);
    g.addColorStop(0, "#d6547f"); g.addColorStop(.55, "#f2a7bf"); g.addColorStop(1, "#fff0f4");
    t.fillStyle = g;
    t.beginPath(); t.moveTo(30, 2);
    t.bezierCurveTo(56, 30, 58, 70, 30, 98);
    t.bezierCurveTo(2, 70, 4, 30, 30, 2);
    t.fill();
    t.strokeStyle = "rgba(255,255,255,.55)"; t.lineWidth = 1.4;
    t.beginPath(); t.moveTo(30, 14); t.lineTo(30, 88); t.stroke();

    function resize() {
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var want = W < 600 ? 14 : 24;
      while (list.length < want) list.push(make(true));
      list.length = want;
    }
    function make(anyY) {
      var size = 10 + Math.random() * 14;
      return {
        x: Math.random() * W, y: anyY ? Math.random() * H : -40,
        s: size, vy: 0.35 + Math.random() * 0.55, sway: 0.6 + Math.random() * 1.2,
        ph: Math.random() * Math.PI * 2, rot: Math.random() * 6.28, vr: (Math.random() - .5) * 0.02,
        flip: Math.random() * 6.28, vf: 0.01 + Math.random() * 0.02, a: 0.55 + Math.random() * 0.4
      };
    }
    var last = performance.now();
    function frame(now) {
      if (!running) return;
      var dt = Math.min(3, (now - last) / 16.67); last = now;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < list.length; i++) {
        var p = list[i];
        p.ph += 0.012 * dt; p.y += p.vy * dt; p.x += Math.sin(p.ph) * p.sway * 0.5 * dt;
        p.rot += p.vr * dt; p.flip += p.vf * dt;
        if (p.y > H + 40) list[i] = make(false);
        ctx.save();
        ctx.globalAlpha = p.a;
        ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.scale(Math.cos(p.flip), 1);
        ctx.drawImage(tex, -p.s * .3, -p.s * .5, p.s * .6, p.s);
        ctx.restore();
      }
      requestAnimationFrame(frame);
    }
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", function () {
      running = !document.hidden;
      if (running) { last = performance.now(); requestAnimationFrame(frame); }
    });
    resize(); requestAnimationFrame(frame);
  })();

  /* ---------- 6. Golden sparkles ---------- */
  if (!reduceMotion) {
    $$(".frame, .intro").forEach(function (box) {
      var n = box.classList.contains("intro") ? 10 : 8;
      for (var i = 0; i < n; i++) {
        var s = document.createElement("span");
        s.className = "spark";
        s.setAttribute("aria-hidden", "true");
        s.style.left = (5 + Math.random() * 90) + "%";
        s.style.top = (4 + Math.random() * 92) + "%";
        s.style.setProperty("--s", (7 + Math.random() * 9).toFixed(1) + "px");
        s.style.setProperty("--d", (2.4 + Math.random() * 2.6).toFixed(2) + "s");
        s.style.setProperty("--delay", (Math.random() * 4).toFixed(2) + "s");
        box.appendChild(s);
      }
    });
  }

  /* ---------- 7. Fade-in on scroll ---------- */
  $$(".panel").forEach(function (panel) {
    $$(".reveal", panel).forEach(function (el, i) { el.style.setProperty("--rd", (i * 0.12).toFixed(2) + "s"); });
  });
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && invite.classList.contains("is-visible")) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -5% 0px" });
    $$(".details .reveal, .closing .reveal").forEach(function (el) { io.observe(el); });
  } else {
    $$(".reveal").forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- 8. Countdown ---------- */
  var cdTimer = 0;
  function startCountdown() {
    var box = $("#countdown");
    var target = new Date(cfg.eventStartISO).getTime();
    if (!box || isNaN(target)) { if (box) box.style.display = "none"; return; }
    function pad(n) { return n < 10 ? "0" + n : "" + n; }
    function tick() {
      var diff = target - Date.now();
      if (diff <= 0) {
        box.classList.add("is-done");
        $(".countdown-label", box).textContent = t("countdownDone");
        clearInterval(cdTimer); return;
      }
      var s = Math.floor(diff / 1000);
      $("#cdDays").textContent = Math.floor(s / 86400);
      $("#cdHours").textContent = pad(Math.floor(s % 86400 / 3600));
      $("#cdMins").textContent = pad(Math.floor(s % 3600 / 60));
      $("#cdSecs").textContent = pad(s % 60);
    }
    tick(); cdTimer = setInterval(tick, 1000);
  }
})();
