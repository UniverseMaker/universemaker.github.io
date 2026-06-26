/* D. PARK Journal — interactions + registry-driven rendering (vanilla JS, no build) */
(function () {
  var root = document.documentElement;

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
    if (e.target.closest("#navToggle")) document.querySelector("#mobileNav").classList.add("open");
    if (e.target.closest("#navClose")) document.querySelector("#mobileNav").classList.remove("open");
    if (e.target.closest("#printBtn")) window.print();
  });

  /* ---------------- Topbar date ---------------- */
  var d = document.querySelector("#today");
  if (d) {
    try { d.textContent = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "long" }); }
    catch (_) { d.textContent = new Date().toDateString(); }
  }

  /* ---------------- Reveal on scroll ---------------- */
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

  /* ============================================================
     Registry-driven rendering
     ============================================================ */
  var posts = window.ARTICLES_BY_RECENT || [];
  function base() { return document.body.getAttribute("data-base") || ""; }
  function pad(n) { return String(n).padStart(2, "0"); }
  function shortTitle(t) { return t.split(":")[0].trim(); }
  function coverEl(a, cls) {
    cls = cls || "";
    if (/^fill-/.test(a.cover)) return '<div class="ph ' + a.cover + ' fill-grid ' + cls + '"></div>';
    return '<img class="ph ' + cls + '" src="' + base() + a.cover + '" alt="" style="object-fit:cover;width:100%;height:100%;position:absolute;inset:0;">';
  }
  function card(a) {
    var cp = a.catClass ? "cat-pill " + a.catClass : "cat-pill";
    var ct = a.catClass ? "cat " + a.catClass : "cat";
    return '<a href="' + base() + a.path + '" class="post-card fade-up">' +
      '<div class="thumb">' + coverEl(a) + '<span class="' + cp + '">' + a.cat + '</span><span class="num">' + pad(a.id) + '</span></div>' +
      '<span class="' + ct + '">' + a.catLabel + '</span>' +
      '<h3>' + a.title + '</h3>' +
      '<p>' + a.deck + '</p>' +
      '<div class="meta"><span class="by">박대승</span><span class="dot-sep">' + a.read + ' 읽기</span></div>' +
      '</a>';
  }
  function listCard(a, last) {
    var ct = a.catClass ? "cat " + a.catClass : "cat";
    var coverDiv = /^fill-/.test(a.cover)
      ? '<div class="' + a.cover + ' fill-grid" style="position:absolute;inset:0;"></div>'
      : '<img src="' + base() + a.cover + '" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;">';
    return '<a href="' + base() + a.path + '" class="list-card"' + (last ? ' style="border-bottom:0;"' : '') + '>' +
      '<div class="thumb">' + coverDiv + '</div>' +
      '<div><span class="' + ct + '">' + a.catLabel + '</span><h4>' + shortTitle(a.title) + '</h4></div></a>';
  }
  function recentCard(a) {
    var cp = a.catClass ? "cat-pill " + a.catClass : "cat-pill";
    var ct = a.catClass ? "cat " + a.catClass : "cat";
    return '<a href="' + base() + a.path + '" class="recent-card fade-up">' +
      '<div class="thumb">' + coverEl(a) + '<span class="' + cp + '">' + a.cat + '</span></div>' +
      '<div class="rc-body"><span class="' + ct + '">' + a.catLabel + '</span>' +
      '<h4>' + shortTitle(a.title) + '</h4>' +
      '<div class="meta"><span class="by">박대승</span><span class="dot-sep">' + a.read + '</span></div></div></a>';
  }
  function setHTML(id, html) { var el = document.querySelector("#" + id); if (el) { el.innerHTML = html; return el; } return null; }

  /* ---- Homepage ---- */
  var latest = setHTML("latestGrid", posts.slice(0, 6).map(card).join(""));
  if (latest) observeReveal(latest);
  setHTML("tickerItems", posts.slice(0, 4).map(function (a) { return '<a href="' + base() + a.path + '">' + shortTitle(a.title) + '</a>'; }).join(""));
  setHTML("recentList", posts.slice(0, 3).map(function (a, i, arr) { return listCard(a, i === arr.length - 1); }).join("")); // legacy sidebar (홈에 없으면 no-op)
  var recRow = setHTML("recentRow", posts.slice(0, 3).map(recentCard).join(""));
  if (recRow) observeReveal(recRow);
  setHTML("footerArticles", posts.slice(0, 4).map(function (a) { return '<li><a href="' + base() + a.path + '">' + shortTitle(a.title) + '</a></li>'; }).join(""));

  /* ---- Subscribe form (정적 사이트 — 안내 메시지) ---- */
  var subForm = document.querySelector("#subscribeForm");
  if (subForm) {
    subForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var msg = document.querySelector("#subMsg");
      var input = subForm.querySelector("input");
      if (msg) msg.textContent = "구독해 주셔서 감사합니다! 알림 기능은 준비 중이라, 우선 dspark@daeseungpark.com 으로 새 글 소식을 보내드릴게요.";
      if (input) input.value = "";
    });
  }

  /* ---- Articles board page (12/page, 게시판식 페이지 이동) ---- */
  var board = document.querySelector("#boardGrid");
  if (board) {
    var PER = 12;
    function curPage() { var m = /page=(\d+)/.exec(location.hash); var p = m ? parseInt(m[1], 10) : 1; return p > 0 ? p : 1; }
    function totalPages() { return Math.max(1, Math.ceil(posts.length / PER)); }
    function renderBoard() {
      var tp = totalPages(); var p = Math.min(curPage(), tp);
      var slice = posts.slice((p - 1) * PER, (p - 1) * PER + PER);
      board.innerHTML = slice.map(card).join("");
      observeReveal(board);
      var cnt = document.querySelector("#boardCount");
      if (cnt) cnt.textContent = "총 " + posts.length + "편 · " + p + " / " + tp + " 페이지";
      var pager = document.querySelector("#pager");
      if (pager) {
        var h = "";
        h += '<a class="pg-btn' + (p <= 1 ? " disabled" : "") + '" href="#page=' + (p - 1) + '">‹ 이전</a>';
        for (var i = 1; i <= tp; i++) h += '<a class="pg-num' + (i === p ? " active" : "") + '" href="#page=' + i + '">' + i + '</a>';
        h += '<a class="pg-btn' + (p >= tp ? " disabled" : "") + '" href="#page=' + (p + 1) + '">다음 ›</a>';
        pager.innerHTML = h;
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    renderBoard();
    window.addEventListener("hashchange", renderBoard);
  }

  /* ---- Article page: 관련 글 + 이전/다음(게시판식) ---- */
  var artEl = document.querySelector("[data-article-id]");
  if (artEl) {
    var curId = parseInt(artEl.getAttribute("data-article-id"), 10);
    var rn = document.querySelector("#readNext");
    if (rn) {
      var others = posts.filter(function (a) { return a.id !== curId; }).slice(0, 2);
      rn.innerHTML = others.map(card).join("");
      observeReveal(rn);
    }
    var nav = document.querySelector("#postNav");
    if (nav) {
      var byId = {}; posts.forEach(function (a) { byId[a.id] = a; });
      var older = byId[curId - 1];   // 번호가 작을수록 이전(과거) 글
      var newer = byId[curId + 1];   // 번호가 클수록 다음(최신) 글
      var left = older
        ? '<a class="pn" href="' + base() + older.path + '"><span class="pn-dir">‹ 이전 글</span><span class="pn-t">' + shortTitle(older.title) + '</span></a>'
        : '<span class="pn empty"><span class="pn-dir">‹ 이전 글</span><span class="pn-t">없음</span></span>';
      var mid = '<a class="pn pn-list" href="' + base() + 'articles.html">목록</a>';
      var right = newer
        ? '<a class="pn pn-right" href="' + base() + newer.path + '"><span class="pn-dir">다음 글 ›</span><span class="pn-t">' + shortTitle(newer.title) + '</span></a>'
        : '<span class="pn pn-right empty"><span class="pn-dir">다음 글 ›</span><span class="pn-t">없음</span></span>';
      nav.innerHTML = left + mid + right;
    }
  }
})();
