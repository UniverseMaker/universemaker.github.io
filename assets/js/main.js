/* D. PARK Journal — interactions only (full-static / prerendered).
   모든 페이지는 빌드 시점에 콘텐츠·크롬(네비/푸터/티커/홈목록/상세)이 HTML로 구워져 있다.
   이 스크립트는 데이터 파일(data.js·articles.js·content-*·notices.js·i18n-en.js) 없이,
   baked DOM 위에 상호작용만 바인딩한다: 테마 토글, 스크롤 등장, 진행바, 구독폼,
   기고 게시판 필터·페이지네이션, 포트폴리오 필터, 공지 검색·페이지네이션, 활동 라이트박스,
   Google Analytics, 그리고 우측하단 AI Trial 위젯(별도 IIFE). */
(function () {
  var root = document.documentElement;

  /* ---------------- 인라인 상수 (구 data.js 참조 대체) ---------------- */
  var GA_ID = "G-1MMKKGR3MF";                       // Google Analytics 측정 ID
  var AI_CHAT_URL = "https://ai.daeseungpark.com/chat/"; // (AI 위젯 IIFE에서도 동일 상수 사용)
  var SHOW_FEATURE_IN_ALL = false;                  // 전체보기에 특별기고 노출 여부(기본 false)

  /* ---------------- 언어 + UI 라벨 ---------------- */
  var LANG = (function () { var s = location.pathname.split("/").filter(Boolean); return s[0] === "en" ? "en" : "ko"; })();
  var EN = LANG === "en";
  var LB = EN ? {
    pagerPrev: "‹ Prev", pagerNext: "Next ›",
    boardCount: "{n} articles · {p} / {tp} pages", boardEmpty: "No articles match this filter.",
    noticeCount: "{n} notices · {p} / {tp} pages", noticeEmpty: "No results found.",
    subscribeMsg: "Thanks for subscribing! Notifications aren't ready yet, so for now we'll email new-post updates to dspark@daeseungpark.com.",
    dateLocale: "en-US",
    lightboxClose: "Close", lightboxPrev: "Previous", lightboxNext: "Next",
    navDrawer: "Site menu", lightboxDialog: "Photo viewer",
    galleryOpen: "Open larger view: {t}",
    skipToContent: "Skip to main content"
  } : {
    pagerPrev: "‹ 이전", pagerNext: "다음 ›",
    boardCount: "총 {n}편 · {p} / {tp} 페이지", boardEmpty: "해당 조건의 기고문이 없습니다.",
    noticeCount: "총 {n}건 · {p} / {tp} 페이지", noticeEmpty: "검색 결과가 없습니다.",
    subscribeMsg: "구독해 주셔서 감사합니다! 알림 기능은 준비 중이라, 우선 dspark@daeseungpark.com 으로 새 글 소식을 보내드릴게요.",
    dateLocale: "ko-KR",
    lightboxClose: "닫기", lightboxPrev: "이전", lightboxNext: "다음",
    navDrawer: "사이트 메뉴", lightboxDialog: "사진 크게 보기",
    galleryOpen: "{t} 사진 크게 보기",
    skipToContent: "본문으로 건너뛰기"
  };
  function tpl(s, m) { return String(s == null ? "" : s).replace(/\{(\w+)\}/g, function (_, k) { return m[k] != null ? m[k] : ""; }); }
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  /* ---------------- Google Analytics (gtag.js) ----------------
     EN 프리렌더 페이지엔 gtag <script>가 이미 baked 되어 있다 → 중복 로드 방지 위해
     스크립트가 없을 때만 주입하고, 설정(config)은 항상 1회만 실행(플래그 가드). */
  (function initGA() {
    if (!GA_ID || window.__gaInit) return;
    window.__gaInit = true;
    if (!document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) {
      var s = document.createElement("script");
      s.async = true; s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
      document.head.appendChild(s);
    }
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag("js", new Date());
    gtag("config", GA_ID);
  })();

  /* ---------------- 스킵 링크 (WCAG 2.4.1 Bypass Blocks · Level A) ----------------
     상단바 퀵링크 11 + 메인 네비 9 + 티커 6 ≈ 26개를 지나야 본문에 닿는다.
     baked HTML 214개를 건드리지 않기 위해 여기서 주입한다 — 라이트박스·AI 위젯이
     이미 같은 방식으로 body 에 요소를 넣는 선례가 있다(273·444행).
     ⚠️ landing.html · en/landing.html 2개는 main.js 를 로드하지 않으므로 적용되지 않는다
        (자기완결형 단일 HTML, 별도 인라인 추가가 필요 — 이번엔 손대지 않았다).
     대상 선정: `<main>`(성과물 상세 153) → 티커 다음 형제(기고 상세 44 등) → 폴백.
     `tabindex="-1"` 을 붙이는 이유: 링크로 이동만 하면 스크롤은 되지만 포커스가
     본문으로 옮겨가지 않아 다음 Tab 이 다시 헤더로 돌아간다. */
  (function initSkipLink() {
    if (document.querySelector(".skip-link")) return;
    var ticker = document.querySelector(".ticker");
    var next = ticker ? ticker.nextElementSibling : null;
    if (next && /^(SCRIPT|STYLE|LINK|TEMPLATE|NOSCRIPT)$/.test(next.tagName)) next = null;
    var target = document.querySelector("main") || next ||
      document.querySelector(".page-hero, .prof-hero, .hero, article, .wd-wrap");
    if (!target || !document.body) return;
    if (!target.id) target.id = "content";
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
    var a = document.createElement("a");
    a.className = "skip-link";
    a.href = "#" + target.id;
    a.textContent = LB.skipToContent;
    document.body.insertBefore(a, document.body.firstChild);
  })();

  /* ---------------- Theme ---------------- */
  var KEY = "dpark-theme";
  function applyTheme(t) {
    root.setAttribute("data-theme", t);
    var ic = document.querySelector("#themeIcon");
    if (ic) ic.textContent = t === "dark" ? "☀" : "☾";
  }
  var saved = localStorage.getItem(KEY);
  var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(saved || (prefersDark ? "dark" : "light"));
  document.addEventListener("click", function (e) {
    if (e.target.closest("#themeToggle")) {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next); localStorage.setItem(KEY, next);
    }
    if (e.target.closest("#navToggle")) setMobileNav(true);
    if (e.target.closest("#navClose")) setMobileNav(false);
    if (e.target.closest("#printBtn")) window.print();
  });

  /* ---------------- Mobile nav drawer: 상태·ARIA·포커스 ----------------
     닫힘 상태는 CSS 에서 visibility:hidden 으로 tab 순서에서 빠지지만(style.css),
     `#navToggle` 의 aria-expanded 와 드로어의 aria-hidden 은 속성이라 JS 만이 갱신할 수 있다.
     열 때는 드로어 안(✕ 버튼)으로 포커스를 옮기고, 닫을 때는 열었던 버튼으로 되돌린다.
     baked HTML(214파일)을 건드리지 않으려고 초기 속성도 여기서 심는다. */
  var navToggleEl = document.querySelector("#navToggle");
  var mobileNavEl = document.querySelector("#mobileNav");
  function setMobileNav(open) {
    if (!mobileNavEl) return;
    mobileNavEl.classList.toggle("open", !!open);
    mobileNavEl.setAttribute("aria-hidden", open ? "false" : "true");
    /* aria-modal 은 노출돼 있는 동안에만 참이어야 한다(닫힌 채 true 면 AT 가 본문을 무시할 수 있다). */
    if (open) mobileNavEl.setAttribute("aria-modal", "true"); else mobileNavEl.removeAttribute("aria-modal");
    if (navToggleEl) navToggleEl.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) {
      /* ⚠️ 방금 `.open` 을 붙였을 뿐이어서 이 시점의 계산된 visibility 는 아직 hidden 이고,
         visibility:hidden 요소는 focus() 를 받지 못한다(실측: 같은 태스크에서 호출하면 무반응).
         스타일이 반영된 다음 프레임으로 미뤄야 포커스가 실제로 드로어 안으로 들어간다. */
      var target = mobileNavEl.querySelector("#navClose") || mobileNavEl.querySelector("a");
      if (target) requestAnimationFrame(function () { requestAnimationFrame(function () { target.focus(); }); });
    } else if (navToggleEl) {
      navToggleEl.focus();
    }
  }
  if (mobileNavEl) {
    mobileNavEl.setAttribute("aria-hidden", "true");
    if (!mobileNavEl.getAttribute("role")) mobileNavEl.setAttribute("role", "dialog");
    if (!mobileNavEl.getAttribute("aria-label")) mobileNavEl.setAttribute("aria-label", LB.navDrawer);
    if (navToggleEl) {
      navToggleEl.setAttribute("aria-expanded", "false");
      navToggleEl.setAttribute("aria-controls", "mobileNav");
    }
    /* Escape 로 닫기 — 드로어가 열려 있을 때만 반응한다. */
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && mobileNavEl.classList.contains("open")) { e.preventDefault(); setMobileNav(false); }
    });
    /* 드로어는 position:fixed; inset:0 으로 화면 전체를 덮는다. 마지막 링크에서 Tab 을 누르면
       오버레이 뒤의 본문으로 포커스가 넘어가 다시 "보이지 않는 포커스"가 되므로 드로어 안에서 순환시킨다. */
    mobileNavEl.addEventListener("keydown", function (e) {
      if (e.key !== "Tab") return;
      var f = mobileNavEl.querySelectorAll("a[href], button:not([disabled])");
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    /* 드로어 안 링크를 누르면 같은 페이지 앵커일 수 있으니 상태를 닫힘으로 정리한다. */
    mobileNavEl.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        mobileNavEl.classList.remove("open");
        mobileNavEl.setAttribute("aria-hidden", "true");
        if (navToggleEl) navToggleEl.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------------- Topbar date ---------------- */
  var d = document.querySelector("#today");
  if (d) {
    try { d.textContent = new Date().toLocaleDateString(LB.dateLocale, { year: "numeric", month: "long", day: "numeric", weekday: "long" }); }
    catch (_) { d.textContent = new Date().toDateString(); }
  }

  /* ---------------- Reveal on scroll (필수: .fade-up 는 .in 이 붙기 전 opacity:0) ---------------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
  }, { threshold: 0.12 });
  function observeReveal(scope) {
    (scope || document).querySelectorAll(".fade-up:not(.in)").forEach(function (el) { io.observe(el); });
  }
  observeReveal();

  /* ---------------- Reading progress ---------------- */
  var bar = document.querySelector("#progress");
  if (bar) {
    window.addEventListener("scroll", function () {
      var h = document.documentElement;
      bar.style.width = Math.max(0, Math.min(1, h.scrollTop / (h.scrollHeight - h.clientHeight))) * 100 + "%";
    }, { passive: true });
  }

  /* ---------------- Subscribe form (정적 사이트 — 안내 메시지) ---------------- */
  var subForm = document.querySelector("#subscribeForm");
  if (subForm) {
    subForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var msg = document.querySelector("#subMsg");
      var input = subForm.querySelector("input");
      if (msg) msg.textContent = LB.subscribeMsg;
      if (input) input.value = "";
    });
  }

  /* ============================================================
     Articles board (articles.html) — 카테고리 칩 필터 + 게시판 페이지네이션
     baked DOM 의 전체 카드(18편, data-cat / data-feature 속성 보유)를 show/hide.
     ============================================================ */
  var board = document.querySelector("#boardGrid");
  if (board) {
    var PER = 12;
    var FEATURE_FILTER = "__feature", ALL_FILTER = "__all";
    var cards = Array.prototype.slice.call(board.querySelectorAll(".post-card"));
    var activeFilter = ALL_FILTER;
    /* ?cat= 딥링크: feature → 특별기고 칩, 카테고리명 일치 → 그 칩, 그 외/없음 → 전체 */
    (function () {
      var m = /[?&]cat=([^&#]*)/.exec(location.search);
      if (!m) return;
      var val = ""; try { val = decodeURIComponent(m[1].replace(/\+/g, " ")); } catch (e) { val = m[1]; }
      if (val === "feature" || val === FEATURE_FILTER) activeFilter = FEATURE_FILTER;
      else if (val && cards.some(function (c) { return c.getAttribute("data-cat") === val; })) activeFilter = val;
    })();
    function isFeature(c) { return c.getAttribute("data-feature") === "1"; }
    function matches(c) {
      if (activeFilter === FEATURE_FILTER) return isFeature(c);
      if (activeFilter === ALL_FILTER) return SHOW_FEATURE_IN_ALL || !isFeature(c);
      return c.getAttribute("data-cat") === activeFilter && (SHOW_FEATURE_IN_ALL || !isFeature(c));
    }
    var filterEl = document.querySelector("#boardFilter");
    if (filterEl) {
      filterEl.querySelectorAll(".pf-chip").forEach(function (b) {
        var on = b.getAttribute("data-filter") === activeFilter;
        b.classList.toggle("is-active", on); b.setAttribute("aria-pressed", on ? "true" : "false");
      });
      filterEl.addEventListener("click", function (e) {
        var btn = e.target.closest(".pf-chip"); if (!btn) return;
        activeFilter = btn.getAttribute("data-filter");
        filterEl.querySelectorAll(".pf-chip").forEach(function (b) {
          var on = b === btn; b.classList.toggle("is-active", on); b.setAttribute("aria-pressed", on ? "true" : "false");
        });
        if (/page=\d+/.test(location.hash) && location.hash !== "#page=1") location.hash = "page=1";
        else renderBoard(false);
      });
    }
    function curPage() { var m = /page=(\d+)/.exec(location.hash); var p = m ? parseInt(m[1], 10) : 1; return p > 0 ? p : 1; }
    function totalPages(n) { return Math.max(1, Math.ceil(n / PER)); }
    function renderBoard(skipScroll) {
      var list = cards.filter(matches);
      var tp = totalPages(list.length); var p = Math.min(curPage(), tp);
      var start = (p - 1) * PER;
      cards.forEach(function (c) { c.style.display = "none"; });
      list.slice(start, start + PER).forEach(function (c) { c.style.display = ""; });
      var emptyEl = board.querySelector(".board-empty");
      if (!list.length) {
        if (!emptyEl) { emptyEl = document.createElement("p"); emptyEl.className = "board-empty text-muted-x"; emptyEl.style.cssText = "grid-column:1/-1;text-align:center;padding:48px 10px;"; board.appendChild(emptyEl); }
        emptyEl.textContent = LB.boardEmpty; emptyEl.style.display = "";
      } else if (emptyEl) { emptyEl.style.display = "none"; }
      observeReveal(board);
      var cnt = document.querySelector("#boardCount");
      if (cnt) cnt.textContent = tpl(LB.boardCount, { n: list.length, p: p, tp: tp });
      var pager = document.querySelector("#pager");
      if (pager) {
        var h = "";
        h += '<a class="pg-btn' + (p <= 1 ? " disabled" : "") + '" href="#page=' + (p - 1) + '">' + LB.pagerPrev + '</a>';
        for (var i = 1; i <= tp; i++) h += '<a class="pg-num' + (i === p ? " active" : "") + '" href="#page=' + i + '">' + i + '</a>';
        h += '<a class="pg-btn' + (p >= tp ? " disabled" : "") + '" href="#page=' + (p + 1) + '">' + LB.pagerNext + '</a>';
        pager.innerHTML = h;
      }
      if (!skipScroll) window.scrollTo({ top: 0, behavior: "smooth" });
    }
    renderBoard(true); // 초기: baked 는 18편 전부 → 필터·1페이지로 축소 (스크롤 억제)
    window.addEventListener("hashchange", function () { renderBoard(false); });
  }

  /* ============================================================
     Portfolio (portfolio.html) — 카테고리 칩 필터 (baked pf-card 의 data-cat show/hide)
     ============================================================ */
  var pfGrid = document.querySelector("#portfolioGrid");
  var pfFilter = document.querySelector("#pfFilter");
  if (pfGrid && pfFilter) {
    pfFilter.addEventListener("click", function (e) {
      var btn = e.target.closest(".pf-chip"); if (!btn) return;
      var f = btn.getAttribute("data-filter");
      pfFilter.querySelectorAll(".pf-chip").forEach(function (b) {
        var on = b === btn; b.classList.toggle("is-active", on); b.setAttribute("aria-pressed", on ? "true" : "false");
      });
      pfGrid.querySelectorAll(".pf-card").forEach(function (card) {
        var show = (f === "__all") || (card.getAttribute("data-cat") === f);
        card.style.display = show ? "" : "none";
      });
    });
  }

  /* ============================================================
     Activity gallery (activity.html) — 라이트박스 (baked 갤러리 DOM 이미지로 구성)
     ============================================================ */
  var gg = document.querySelector("#galleryGrid");
  if (gg) {
    var galCards = Array.prototype.slice.call(gg.querySelectorAll(".gal-card"));
    var imgs = galCards.map(function (c) {
      var img = c.querySelector(".gal-thumb img") || c.querySelector("img");
      var t = c.querySelector("figcaption b"); var p = c.querySelector("figcaption p");
      return { src: img ? img.getAttribute("src") : "", title: t ? t.textContent : "", desc: p ? p.textContent : "" };
    });
    var LBX = document.querySelector("#lightbox"); // EN 페이지는 baked → 재사용
    if (!LBX) {
      LBX = document.createElement("div"); LBX.id = "lightbox"; LBX.className = "lightbox";
      LBX.innerHTML = '<button class="lb-close" aria-label="' + LB.lightboxClose + '">✕</button><button class="lb-prev" aria-label="' + LB.lightboxPrev + '">‹</button><img class="lb-img" alt=""><button class="lb-next" aria-label="' + LB.lightboxNext + '">›</button><div class="lb-cap"></div>';
      document.body.appendChild(LBX);
    }
    /* 라이트박스를 대화상자로 노출 — 스크린리더가 모달임을 알 수 있게 한다.
       (KO 는 위에서 새로 만들고 EN 은 baked 라 어느 경로든 여기서 속성을 통일한다.) */
    LBX.setAttribute("role", "dialog");
    if (!LBX.getAttribute("aria-label")) LBX.setAttribute("aria-label", LB.lightboxDialog);
    LBX.setAttribute("aria-hidden", "true");

    var idx = 0;
    var lastFocus = null;   // 닫을 때 포커스를 되돌릴 원래 요소
    function show(i) {
      if (!imgs.length) return;
      idx = (i + imgs.length) % imgs.length; var g = imgs[idx];
      LBX.querySelector(".lb-img").src = g.src;
      LBX.querySelector(".lb-cap").innerHTML = "<b>" + esc(g.title) + "</b> " + esc(g.desc);
      var wasOpen = LBX.classList.contains("open");
      LBX.classList.add("open");
      LBX.setAttribute("aria-hidden", "false");
      LBX.setAttribute("aria-modal", "true");
      if (!wasOpen) {
        lastFocus = document.activeElement;
        var cb = LBX.querySelector(".lb-close");
        if (cb) cb.focus();
      }
    }
    function closeLB() {
      if (!LBX.classList.contains("open")) return;
      LBX.classList.remove("open");
      LBX.setAttribute("aria-hidden", "true");
      LBX.removeAttribute("aria-modal");
      if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
      lastFocus = null;
    }
    /* 카드 진입점은 하나(open)로 두고 클릭·키보드가 모두 이 함수를 쓴다(로직 중복 금지). */
    galCards.forEach(function (c, i) {
      c.style.cursor = "zoom-in";
      /* baked HTML 에 이미 tabindex/role/aria-label 이 있지만, 누락된 페이지가 있어도
         키보드로 도달할 수 있도록 방어적으로 보강한다. */
      if (!c.hasAttribute("tabindex")) c.setAttribute("tabindex", "0");
      if (!c.getAttribute("role")) c.setAttribute("role", "button");
      if (!c.getAttribute("aria-label")) {
        var tb = c.querySelector("figcaption b");
        c.setAttribute("aria-label", tpl(LB.galleryOpen, { t: tb ? tb.textContent : "" }));
      }
      c.addEventListener("click", function (e) { e.preventDefault(); show(i); });
      c.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") { e.preventDefault(); show(i); }
      });
    });
    LBX.addEventListener("click", function (e) {
      if (e.target === LBX || e.target.classList.contains("lb-close")) closeLB();
      if (e.target.classList.contains("lb-prev")) show(idx - 1);
      if (e.target.classList.contains("lb-next")) show(idx + 1);
    });
    document.addEventListener("keydown", function (e) {
      if (!LBX.classList.contains("open")) return;
      if (e.key === "Escape") closeLB();
      if (e.key === "ArrowLeft") show(idx - 1);
      if (e.key === "ArrowRight") show(idx + 1);
    });
  }

  /* ============================================================
     Notices (notices.html) — 제목 검색 + 게시판 페이지네이션 (baked 행 show/hide)
     상세(notices/<id>/)는 별도 정적 페이지 → 여기선 목록만 처리(#noticeBoard 존재 시).
     ============================================================ */
  var noticeBoard = document.querySelector("#noticeBoard");
  if (noticeBoard) {
    var NPER = 10;
    var rows = Array.prototype.slice.call(noticeBoard.querySelectorAll(".notice-row:not(.notice-head-row)"));
    var nQuery = "";
    function nCurPage() { var m = /page=(\d+)/.exec(location.hash); var p = m ? parseInt(m[1], 10) : 1; return p > 0 ? p : 1; }
    function nFiltered() {
      if (!nQuery) return rows;
      var q = nQuery.toLowerCase();
      return rows.filter(function (r) { var t = r.querySelector(".n-title"); return (t ? t.textContent : "").toLowerCase().indexOf(q) !== -1; });
    }
    function renderNoticeBoard() {
      var list = nFiltered();
      var tp = Math.max(1, Math.ceil(list.length / NPER)); var p = Math.min(nCurPage(), tp);
      var start = (p - 1) * NPER;
      rows.forEach(function (r) { r.style.display = "none"; });
      list.slice(start, start + NPER).forEach(function (r) { r.style.display = ""; });
      var emptyEl = noticeBoard.querySelector(".notice-empty");
      if (!list.length) {
        if (!emptyEl) { emptyEl = document.createElement("div"); emptyEl.className = "notice-empty"; noticeBoard.appendChild(emptyEl); }
        emptyEl.textContent = LB.noticeEmpty; emptyEl.style.display = "";
      } else if (emptyEl) { emptyEl.style.display = "none"; }
      var cnt = document.querySelector("#noticeCount");
      if (cnt) cnt.textContent = tpl(LB.noticeCount, { n: list.length, p: p, tp: tp });
      var pager = document.querySelector("#noticePager");
      if (pager) {
        var h = "";
        h += '<a class="pg-btn' + (p <= 1 ? " disabled" : "") + '" href="#page=' + (p - 1) + '">' + LB.pagerPrev + '</a>';
        for (var i = 1; i <= tp; i++) h += '<a class="pg-num' + (i === p ? " active" : "") + '" href="#page=' + i + '">' + i + '</a>';
        h += '<a class="pg-btn' + (p >= tp ? " disabled" : "") + '" href="#page=' + (p + 1) + '">' + LB.pagerNext + '</a>';
        pager.innerHTML = h;
      }
    }
    renderNoticeBoard();
    window.addEventListener("hashchange", renderNoticeBoard);
    var sForm = document.querySelector("#noticeSearch");
    var sInput = document.querySelector("#noticeSearchInput");
    if (sForm && sInput) {
      sForm.addEventListener("submit", function (e) {
        e.preventDefault();
        nQuery = sInput.value.trim();
        if (nCurPage() !== 1) { location.hash = "page=1"; } // hashchange → 1페이지 재렌더
        else { renderNoticeBoard(); }
      });
    }
  }
})();

/* ==========================================================================
   AI Trial widget — 비검열 AI 플로팅 위젯 (self-contained, REMOVABLE)
   · 우측하단 플로팅 버튼 + (넓은 화면) PC 미니 대화창(iframe)
   · 상단 메뉴 접힘(햄버거)·터치: 버튼 클릭 → 새 탭으로 챗 UI 바로 이동
   · 기고문(article[data-article-id]) 페이지에는 버튼 미표시
   · EN 프리렌더 페이지엔 style/button 이 이미 baked → 중복 생성 방지, 재사용 후 핸들러만 바인딩
   ========================================================================== */
(function () {
  var URL = "https://ai.daeseungpark.com/chat/";
  var EN = location.pathname.split("/").filter(Boolean)[0] === "en";
  var L = EN
    ? { badge: "β experiment", close: "Close", newWin: "New window ↗", openNew: "Open in new window", btn: "Uncensored AI", aria: "Use the uncensored AI preview" }
    : { badge: "β 실험", close: "닫기", newWin: "새 창 ↗", openNew: "새 창에서 열기", btn: "비검열 AI", aria: "비검열 AI 시범 서비스 사용" };

  var css = [
    '#aiTrialBtn{position:fixed;right:22px;bottom:22px;z-index:940;display:inline-flex;align-items:center;gap:8px;padding:12px 18px;border:0;border-radius:999px;cursor:pointer;font-family:"Pretendard",system-ui,sans-serif;font-weight:700;font-size:.92rem;color:#fff;background:linear-gradient(135deg,#5b6cff,#8b5bff);box-shadow:0 8px 24px rgba(70,70,140,.35);transition:transform .2s,box-shadow .2s,opacity .2s;}',
    '#aiTrialBtn:hover{transform:translateY(-2px);box-shadow:0 12px 30px rgba(70,70,140,.45);}',
    '#aiTrialBtn.active{opacity:.5;}',
    '#aiTrialBtn .ai-ic{font-size:1.05rem;line-height:1;}',
    '#aiTrialBtn .ai-b{font-size:.6rem;font-weight:800;background:rgba(255,255,255,.28);padding:2px 6px;border-radius:999px;letter-spacing:.5px;}',
    '#aiTrialPanel{position:fixed;right:22px;bottom:84px;z-index:945;width:380px;max-width:calc(100vw - 32px);height:560px;max-height:calc(100vh - 120px);background:var(--bg,#fff);border:1px solid var(--line,#e6e6e6);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,.28);opacity:0;transform:translateY(12px) scale(.98);pointer-events:none;transition:opacity .22s,transform .22s;}',
    '#aiTrialPanel.open{opacity:1;transform:none;pointer-events:auto;}',
    '#aiTrialPanel .ai-head{display:flex;align-items:center;justify-content:space-between;padding:10px 8px 10px 14px;border-bottom:1px solid var(--line,#e6e6e6);}',
    '#aiTrialPanel .ai-ti{font-family:"Pretendard",system-ui,sans-serif;font-size:.9rem;color:var(--ink,#15171a);}',
    '#aiTrialPanel .ai-badge{font-size:.64rem;color:#7b83ff;border:1px solid #7b83ff;border-radius:999px;padding:1px 6px;margin-left:5px;}',
    '#aiTrialPanel .ai-actions{display:flex;gap:2px;}',
    '#aiTrialPanel .ai-x{border:0;background:transparent;cursor:pointer;font-size:1rem;line-height:1;padding:6px 9px;border-radius:8px;color:var(--ink,#15171a);opacity:.65;}',
    '#aiTrialPanel .ai-x:hover{opacity:1;background:rgba(125,125,140,.14);}',
    '#aiTrialPanel .ai-body{position:relative;flex:1;min-height:0;background:var(--bg,#fff);}',
    '#aiTrialPanel .ai-open{font-family:"Pretendard",system-ui,sans-serif;font-size:.78rem;font-weight:700;color:#7b83ff;padding:6px 10px;border-radius:8px;text-decoration:none;white-space:nowrap;}',
    '#aiTrialPanel .ai-open:hover{background:rgba(125,125,140,.14);}',
    '#aiTrialPanel iframe{position:relative;width:100%;height:100%;border:0;display:block;background:var(--bg,#fff);}',
    '@media (max-width:640px){#aiTrialBtn{right:16px;bottom:16px;padding:11px 15px;font-size:.86rem;}}'
  ].join('');
  if (!document.getElementById('aiTrialStyle')) {
    var st = document.createElement('style'); st.id = 'aiTrialStyle'; st.textContent = css;
    document.head.appendChild(st);
  }

  /* 기고문 페이지에는 플로팅 버튼을 띄우지 않는다 */
  if (document.querySelector('article[data-article-id]')) return;

  /* 상단 메뉴가 접혀 햄버거로 바뀐 상태(=좁은 화면)면 외부링크로 전환. 터치 기기도 외부. */
  function useExternal() {
    var tog = document.querySelector('.nav-toggle');
    if (tog && getComputedStyle(tog).display !== 'none') return true;
    return ('ontouchstart' in window) && window.matchMedia('(pointer: coarse)').matches;
  }

  var btn = document.getElementById('aiTrialBtn'); // EN baked → 재사용, 없으면 생성
  if (!btn) {
    btn = document.createElement('button');
    btn.id = 'aiTrialBtn'; btn.type = 'button';
    btn.setAttribute('aria-label', L.aria);
    btn.innerHTML = '<span class="ai-ic">🔓</span><span class="ai-tx">' + L.btn + '</span><span class="ai-b">β</span>';
    document.body.appendChild(btn);
  }

  function openFull() { window.open(URL, '_blank', 'noopener'); }

  var panel = null;
  function buildPanel() {
    panel = document.createElement('div'); panel.id = 'aiTrialPanel';
    panel.innerHTML =
      '<div class="ai-head">' +
        '<span class="ai-ti"><b>Abliterated AI</b><span class="ai-badge">' + L.badge + '</span></span>' +
        '<span class="ai-actions">' +
          '<a class="ai-open" href="' + URL + '" target="_blank" rel="noopener" title="' + L.openNew + '">' + L.newWin + '</a>' +
          '<button type="button" class="ai-x" data-act="close" title="' + L.close + '" aria-label="' + L.close + '">✕</button>' +
        '</span>' +
      '</div>' +
      '<div class="ai-body">' +
        '<iframe title="Abliterated AI Chat" src="' + URL + '" loading="lazy"></iframe>' +
      '</div>';
    document.body.appendChild(panel);
    panel.addEventListener('click', function (e) {
      var a = e.target.closest('[data-act]'); if (!a) return;
      hidePanel();
    });
  }
  function showPanel() { if (!panel) buildPanel(); requestAnimationFrame(function () { panel.classList.add('open'); }); btn.classList.add('active'); }
  function hidePanel() { if (panel) panel.classList.remove('open'); btn.classList.remove('active'); }

  btn.addEventListener('click', function () {
    if (useExternal()) { openFull(); return; }
    if (panel && panel.classList.contains('open')) hidePanel(); else showPanel();
  });
  window.addEventListener('resize', function () {
    if (panel && panel.classList.contains('open') && useExternal()) hidePanel();
  });
})();
