/* NOVA ASSEMBLY — site interactions (base: VEA Games main.js) */
(function () {
  'use strict';

  /* screenshot / visual-test mode: ?flat disables entrance animations + smooth scroll */
  if (/[?&]flat/.test(location.search)) document.documentElement.classList.add('flat');

  /* ---------- Nav ---------- */
  var nav = document.querySelector('.nav');
  function onScroll() { if (nav) nav.classList.toggle('scrolled', window.scrollY > 40); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  var burger = document.querySelector('.burger');
  if (burger && nav) {
    burger.addEventListener('click', function () { nav.classList.toggle('open'); });
    nav.querySelectorAll('.nav-links a').forEach(function (a) { a.addEventListener('click', function () { nav.classList.remove('open'); }); });
  }

  /* Scroll-spy: underline the section in view */
  var spyLinks = nav ? Array.prototype.slice.call(nav.querySelectorAll('.nav-links a[href^="#"]')) : [];
  if (spyLinks.length && 'IntersectionObserver' in window) {
    var spyMap = {};
    spyLinks.forEach(function (a) { var s = document.getElementById(a.getAttribute('href').slice(1)); if (s) spyMap[s.id] = a; });
    var spyIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting && spyMap[e.target.id]) {
          spyLinks.forEach(function (x) { x.classList.remove('active'); });
          spyMap[e.target.id].classList.add('active');
        }
      });
    }, { threshold: 0.4 });
    Object.keys(spyMap).forEach(function (id) { spyIO.observe(document.getElementById(id)); });
  }

  /* ---------- Reveal on scroll ---------- */
  var reveals = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else { reveals.forEach(function (el) { el.classList.add('is-in'); }); }

  /* ---------- Hero reel: black veil -> video reveal -> soft loop ----------
     The page opens on pure black (the .vid-cover veil with a breathing Nova mark).
     Once the reel is genuinely PLAYING we fade the veil away (1.6s) and lift the
     foreground in. Near the end of each 52s pass a black dip (.loop-fade) hides
     the restart cut, so the loop reads as a fade-through-black rather than a jump. */
  var vhero = document.querySelector('[data-vhero]');
  if (vhero) {
    var video = document.getElementById('reel');
    var cover = vhero.querySelector('[data-vidcover]');
    var loopFade = vhero.querySelector('[data-loopfade]');
    var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var revealed = false;

    function revealContent() { vhero.classList.add('vh-ready'); }
    function hideCover() {
      if (revealed) return;
      revealed = true;
      revealContent();
      if (cover) cover.classList.add('hide');
    }

    if (video && !reduced) {
      var small = Math.min(window.innerWidth, window.innerHeight) < 720 || matchMedia('(max-width: 720px)').matches;
      video.src = 'assets/video/' + (small ? 'reel-540.mp4' : 'reel-1080.mp4');

      video.addEventListener('playing', hideCover);
      /* safety net: if autoplay is blocked or the network stalls, lift the
         foreground anyway and keep the elegant black veil as the backdrop */
      setTimeout(function () { if (!revealed) revealContent(); }, 3800);
      video.play && video.play().catch(function () { revealContent(); });

      /* soft loop: dip to black in the last ~0.7s, release after restart */
      if (loopFade) {
        video.addEventListener('timeupdate', function () {
          var d = video.duration;
          if (!d || !isFinite(d)) return;
          var t = video.currentTime;
          if (t > d - 0.7) loopFade.classList.add('on');
          else if (t < 1.2) loopFade.classList.remove('on');
        });
      }

      /* save bandwidth: pause the reel while the hero is off screen */
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (es) {
          es.forEach(function (e) {
            if (e.isIntersecting) { video.play().catch(function () {}); }
            else { video.pause(); }
          });
        }, { threshold: 0.12 }).observe(vhero);
      }
    } else {
      /* reduced motion: keep the black veil with the breathing mark, no video */
      revealContent();
    }
  }

  /* ---------- Desktop mouse-wheel panel glide (from the VEA site) ----------
     Discrete wheel clicks glide between panel stops; trackpads keep native
     momentum. No CSS scroll-snap on the page: proximity snap used to spring
     the wheel back on downward scrolls out of taller-than-viewport sections. */
  (function () {
    if (!document.querySelector('.vhero')) return;
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var GLIDE_MS = 600;
    var doc = document.documentElement;
    var gen = 0, gliding = false, glideTarget = 0, glideDir = 0, trackpadUntil = 0;
    var nowMs = function () { return (window.performance && performance.now) ? performance.now() : +new Date(); };

    function snapStops() {
      var vh = window.innerHeight, max = doc.scrollHeight - vh, out = [];
      document.querySelectorAll('.vhero, .section, .footer').forEach(function (el) {
        var r = el.getBoundingClientRect(), top = r.top + window.scrollY;
        var push = function (v) { out.push(Math.max(0, Math.min(max, Math.round(v)))); };
        push(top);
        /* sections taller than the viewport get evenly spaced intermediate
           stops (strides <= ~80% of vh) so every row of content is reachable
           with single comfortable clicks instead of one huge jump */
        if (r.height > vh + 2) {
          var span = r.height - vh;
          var steps = Math.max(1, Math.ceil(span / (vh * 0.8)));
          for (var k = 1; k <= steps; k++) push(top + span * k / steps);
        }
      });
      out.sort(function (a, b) { return a - b; });
      return out.filter(function (v, i) { return i === 0 || v !== out[i - 1]; });
    }

    function glideTo(target, dir) {
      var start = window.scrollY, dist = target - start;
      var id = ++gen;
      if (!dist) { gliding = false; return; }
      gliding = true; glideTarget = target; glideDir = dir;
      var t0 = null;
      var ease = function (p) { return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; };
      function step(ts) {
        if (id !== gen) return; /* superseded by a chained retarget */
        if (t0 === null) t0 = ts;
        var p = Math.min(1, (ts - t0) / GLIDE_MS);
        window.scrollTo({ top: start + dist * ease(p), left: 0, behavior: 'instant' });
        if (p < 1) requestAnimationFrame(step);
        else gliding = false;
      }
      requestAnimationFrame(step);
    }

    window.addEventListener('wheel', function (e) {
      if (e.ctrlKey) return;
      if (document.body && document.body.style.overflow === 'hidden') return;
      var now = nowMs();
      /* trackpad tells: horizontal component, tiny deltas, or small fractional
         deltas. High-res mouse wheels send large fractional deltas — treat those
         as wheel clicks so they glide too. Misreads are safe either way now
         that no CSS snap can bounce a native scroll. */
      if (e.deltaMode === 0 && (Math.abs(e.deltaX) > 0 || Math.abs(e.deltaY) < 30 || (e.deltaY % 1 !== 0 && Math.abs(e.deltaY) < 60))) {
        trackpadUntil = now + 1200; return;
      }
      if (now < trackpadUntil) return;
      var stops = snapStops();
      if (stops.length < 2) return;
      var dir = e.deltaY > 0 ? 1 : -1, target = null, i;
      /* chain while gliding the same way (each click advances one more stop);
         a reversed click retargets from wherever we are right now */
      var from = (gliding && dir === glideDir) ? glideTarget : window.scrollY;
      if (dir > 0) { for (i = 0; i < stops.length; i++) { if (stops[i] > from + 2) { target = stops[i]; break; } } }
      else { for (i = stops.length - 1; i >= 0; i--) { if (stops[i] < from - 2) { target = stops[i]; break; } } }
      if (target === null) { if (gliding) e.preventDefault(); return; }
      e.preventDefault();
      glideTo(target, dir);
    }, { passive: false });
  })();

  /* ---------- Year ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
