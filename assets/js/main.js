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
  /* (푸터 기고문 목록은 renderFooter() 가 직접 렌더 — 아래 SITE 블록 참조) */

  /* ---- Homepage preview sections (config-driven; render only if containers present) ---- */
  (function renderHomePreviews() {
    var Wc = window.WORKS, WSc = window.WORKS_SORTED;
    function g(sel) { return document.querySelector(sel); }
    function esc0(s) { return String(s == null ? "" : s); }

    // 1) 주요 활동 — 4 gallery thumbs (hidden 제외, newest-first) → activity.html
    var haEl = g("#homeActivity");
    if (haEl && Wc && Wc.gallery) {
      var gl = Wc.gallery.filter(function (x) { return !x.hidden; }).slice().sort(function (a, b) {
        function k(x) { var m = String(x.date || "").split("."); return parseInt(m[0] || "0", 10) * 100 + parseInt(m[1] || "0", 10); }
        return k(b) - k(a);
      }).slice(0, 4);
      haEl.className = "home-activity-grid";
      haEl.innerHTML = gl.map(function (gitem) {
        return '<a class="ha-card fade-up" href="' + base() + 'activity.html">' +
          '<div class="ha-thumb"><img src="' + base() + gitem.src + '" alt="' + esc0(gitem.title) + '" loading="lazy"></div>' +
          '<div class="ha-cap"><b>' + esc0(gitem.title) + '</b><span>' + esc0(gitem.tag || "") + (gitem.date ? ' · ' + esc0(gitem.date) : '') + '</span></div></a>';
      }).join("");
      observeReveal(haEl);
    }

    // 2) 포트폴리오 — 3 newest pfCards → portfolio.html
    var hpEl = g("#homePortfolio");
    if (hpEl && WSc && WSc.portfolio) {
      hpEl.innerHTML = WSc.portfolio.slice(0, 3).map(pfCard).join("");
      observeReveal(hpEl);
    }

    // 3) 최근 연구 과제 — 4 newest projRows → research.html
    var hjEl = g("#homeProjects");
    if (hjEl && WSc && WSc.projects) {
      hjEl.innerHTML = WSc.projects.slice(0, 4).map(projRow).join("");
      observeReveal(hjEl);
    }
  })();

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

  /* ============================================================
     SITE config → 상단 메뉴 · 퀵링크 (data.js 한 곳만 고치면 전 페이지 반영)
     ============================================================ */
  var SITE = window.SITE;
  function isExt(h) { return /^(https?:|mailto:|tel:)/.test(h || ""); }
  function linkHref(it) { if (it.key) return (SITE.links[it.key] || "#"); return isExt(it.href) ? it.href : base() + it.href; }

  /* 푸터를 단일 JS 컴포넌트로 렌더 — 모든 페이지가 동일한 푸터를 갖는다 */
  function renderFooter(){
    var ft = document.querySelector("footer.site-footer");
    if (!ft || !SITE) return;
    ft.id = "contact";
    var L = SITE.links, F = SITE.footer;
    var nav = F.nav.map(function(n){ var h = /^https?:/.test(n.href)?n.href:base()+n.href; return '<li><a href="'+h+'">'+n.label+'</a></li>'; }).join("");
    // 기고문: 5 most-recent from registry
    var posts = (window.ARTICLES_BY_RECENT||[]).slice(0,5);
    var arts = posts.map(function(a){ return '<li><a href="'+base()+a.path+'">'+(a.title.split(":")[0].trim())+'</a></li>'; }).join("");
    ft.innerHTML =
     '<div class="container-x"><div class="footer-grid">'+
       '<div><div class="footer-brand">'+F.brand+'</div><p style="max-width:34ch;">'+F.blurb+'</p>'+
         '<div class="social" style="margin-top:16px;">'+
           '<a href="'+L.github+'" target="_blank" rel="noopener" aria-label="GitHub">GH</a>'+
           '<a href="'+L.orcid+'" target="_blank" rel="noopener" aria-label="ORCID">iD</a>'+
           '<a href="mailto:'+L.emailPrimary+'" aria-label="Email">@</a>'+
         '</div></div>'+
       '<div><h6>둘러보기</h6><ul>'+nav+'</ul></div>'+
       '<div><h6>기고문</h6><ul>'+arts+'</ul></div>'+
       '<div><h6>Contact</h6><ul>'+
         '<li><a href="mailto:'+L.emailPrimary+'">'+L.emailPrimary+'</a></li>'+
         '<li><a href="mailto:'+L.emailKaist+'">'+L.emailKaist+'</a></li>'+
         '<li><a href="tel:'+L.phoneKR.replace(/\s/g,"")+'">Phone (KR) '+L.phoneKR+'</a></li>'+
         '<li><a href="tel:'+L.phoneUS.replace(/\s/g,"")+'">Phone (US) '+L.phoneUS+'</a></li>'+
         '<li>KAIST, Daejeon, Korea</li>'+
       '</ul></div>'+
     '</div>'+
     '<div class="footer-bottom"><span>© 2026 Daeseung Park. All rights reserved.</span><span>Designed &amp; built as a personal journal for Daeseung Park.</span></div>'+
     '</div>';
  }

  if (SITE) {
    var atRoot = base() === "";
    var curFile = (location.pathname.split("/").pop() || "index.html");
    var tb = document.querySelector(".tb-links");
    if (tb) tb.innerHTML = SITE.quicklinks.map(function (q) {
      var h = linkHref(q), ext = !!q.key || isExt(q.href || "");
      return '<a href="' + h + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '>' + q.label + '</a>';
    }).join("");
    var mn = document.querySelector(".main-nav");
    if (mn) mn.innerHTML = SITE.nav.map(function (n) {
      var h = linkHref(n), act = (atRoot && n.match === curFile) ? ' class="active"' : '';
      return '<a href="' + h + '"' + act + '>' + n.label + '</a>';
    }).join("");
    var mnav = document.querySelector("#mobileNav");
    if (mnav) {
      var closeBtn = mnav.querySelector(".close");
      mnav.innerHTML = ""; if (closeBtn) mnav.appendChild(closeBtn);
      SITE.nav.forEach(function (n) {
        var a = document.createElement("a"); a.href = linkHref(n); a.textContent = n.label; mnav.appendChild(a);
      });
    }
    renderFooter();

    var promoEl = document.querySelector("#homePromo");
    if (promoEl) {
      var pm = SITE.promo;
      if (pm && pm.enabled) {
        var ph = /^https?:/.test(pm.href) ? pm.href : base() + pm.href;
        promoEl.querySelector(".container-x").innerHTML =
          '<a class="paper-promo fade-up" href="' + ph + '">' +
            '<span class="pp-badge">' + pm.badge + '</span>' +
            '<span class="pp-text">' + pm.text + (pm.soon ? ' <span class="pp-soon">' + pm.soon + '</span>' : '') + '</span>' +
            '<span class="pp-cta">' + (pm.cta || '자세히 →') + '</span>' +
          '</a>';
        promoEl.hidden = false;
        observeReveal(promoEl);
      } else {
        promoEl.hidden = true;
      }
    }

    /* 두 번째 홈 배너 (비검열 AI) — 버튼 2개(기고문 내부 / UI 외부) */
    var promo2El = document.querySelector("#homePromo2");
    if (promo2El) {
      var p2 = SITE.promo2;
      if (p2 && p2.enabled) {
        var btns = (p2.buttons || []).map(function (b) {
          var ext = b.external || /^https?:/.test(b.href);
          var bh = ext ? b.href : base() + b.href;
          var cls = ext ? "pp-btn solid" : "pp-btn ghost";
          return '<a class="' + cls + '" href="' + bh + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '>' + b.label + '</a>';
        }).join("");
        promo2El.querySelector(".container-x").innerHTML =
          '<div class="paper-promo ai-promo fade-up">' +
            '<span class="pp-badge">' + p2.badge + '</span>' +
            '<span class="pp-text">' + p2.text + '</span>' +
            '<span class="pp-actions">' + btns + '</span>' +
          '</div>';
        promo2El.hidden = false;
        observeReveal(promo2El);
      } else {
        promo2El.hidden = true;
      }
    }
  }

  /* ============================================================
     WORKS config → 논문/특허/SW 목록 · 포트폴리오 · 상세페이지 렌더
     ============================================================ */
  var W = window.WORKS, WS = window.WORKS_SORTED, WB = window.WORK_BY_SLUG;
  function esc(s) { return String(s == null ? "" : s); }
  function kindClass(k) { k = k || ""; if (/SCIE/.test(k)) return "scie"; if (/KCI/.test(k)) return "kci"; if (/특허/.test(k)) return "pat"; if (/SW/.test(k)) return "sw"; return ""; }
  function extLinkOf(w) { var l = w.links || {}; if (l.doi) return "https://doi.org/" + l.doi; if (l.url) return l.url; if (l.kipris) return l.kipris; return ""; }
  function workRow(w) {
    var detail = base() + "works/" + w.slug + "/";
    var ext = extLinkOf(w);
    return '<div class="work-row">' +
      '<span class="work-badge ' + kindClass(w.kind) + '">' + esc(w.kind) + '</span>' +
      '<div class="work-main">' +
        '<a class="work-title" href="' + detail + '">' + esc(w.title) + '</a>' +
        (w.titleEn ? '<div class="work-en">' + esc(w.titleEn) + '</div>' : '') +
        '<div class="work-meta">' + esc(w.venue) + ' · ' + esc(w.date) + (w.role ? ' · <b>' + esc(w.role) + '</b>' : '') + '</div>' +
      '</div>' +
      '<div class="work-links"><a class="wl-detail" href="' + detail + '">상세</a>' +
        (ext ? '<a class="wl-ext" href="' + ext + '" target="_blank" rel="noopener">원문 ↗</a>' : '') +
      '</div></div>';
  }
  function renderPubs(el) {
    var groups = [["SCIE", "SCIE 논문"], ["KCI", "KCI 논문"], ["국제학술", "국제 학술대회"], ["국내학술", "국내 학술대회"]];
    el.innerHTML = groups.map(function (g) {
      var items = WS.publications.filter(function (w) { return w.kind === g[0]; });
      if (!items.length) return "";
      return '<h3 class="work-group">' + g[1] + ' <span>(' + items.length + ')</span></h3>' + items.map(workRow).join("");
    }).join("");
  }
  function pfCard(w) {
    var href = base() + "works/" + w.slug + "/";
    var cov = w.cover ? '<img src="' + base() + w.cover + '" alt="" loading="lazy">' : '<div class="pf-fill"></div>';
    return '<a class="pf-card fade-up" href="' + href + '">' +
      '<div class="pf-thumb">' + cov + '<span class="pf-cat">' + esc(w.cat) + '</span></div>' +
      '<div class="pf-body"><h3>' + esc(w.title) + '</h3>' +
      '<div class="pf-meta">' + esc(w.period || "") + (w.org ? ' · ' + esc(w.org) : '') + '</div>' +
      '<p>' + esc((w.desc && w.desc[0]) || "") + '</p>' +
      '<div class="pf-tags">' + (w.tags || []).map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') + '</div>' +
      '</div></a>';
  }

  function projRow(p){
    var meta = (p.orgs || []).slice();
    if (p.period) meta.push(p.period);
    if (p.budget) meta.push(p.budget);
    if (p.no) meta.push(p.no);
    return '<div class="proj-row2"><div class="proj-org">'+esc(p.funder)+'</div>'+
      '<div class="proj-main"><div class="proj-title">'+esc(p.title)+'</div>'+
      '<div class="proj-meta">'+meta.map(esc).join(' · ')+'</div>'+
      (p.desc?'<p class="proj-desc">'+esc(p.desc)+'</p>':'')+'</div></div>';
  }
  function pfRow(w){ var d=base()+"works/"+w.slug+"/"; return '<a class="work-row" href="'+d+'"><span class="work-badge sw">'+esc(w.cat)+'</span><div class="work-main"><span class="work-title">'+esc(w.title)+'</span><div class="work-meta">'+[w.period,w.org].filter(Boolean).map(esc).join(' · ')+'</div></div><span class="work-links"><span class="wl-detail">상세</span></span></a>'; }

  // Works listing page (works.html)
  var pubList = document.querySelector("#pubList"); if (pubList && WS) renderPubs(pubList);
  var patList = document.querySelector("#patentList"); if (patList && WS) patList.innerHTML = WS.patents.map(workRow).join("");
  var swList = document.querySelector("#softwareList"); if (swList && WS) swList.innerHTML = WS.software.map(workRow).join("");
  var wc = document.querySelector("#worksCount");
  if (wc && W) wc.textContent = "논문 " + W.publications.length + " · 특허 " + W.patents.length + " · 소프트웨어 " + W.software.length;

  // Portfolio page (portfolio.html) + profile portfolio container
  var pfGrid = document.querySelector("#portfolioGrid");
  if (pfGrid && WS) { pfGrid.innerHTML = WS.portfolio.map(pfCard).join(""); observeReveal(pfGrid); }

  // Activity gallery page (activity.html)
  var gg = document.querySelector("#galleryGrid");
  if (gg && W && W.gallery) {
    var glist = W.gallery.filter(function(g){ return !g.hidden; }).slice().sort(function(a,b){
      function k(x){ var m=String(x.date||'').split('.'); return parseInt(m[0]||'0',10)*100 + parseInt(m[1]||'0',10); }
      return k(b) - k(a);
    });
    gg.innerHTML = glist.map(function(g){
    return '<figure class="gal-card fade-up"><div class="gal-thumb"><img src="'+base()+g.src+'" alt="'+esc(g.title)+'" loading="lazy"></div>'+
      '<figcaption><b>'+esc(g.title)+'</b><span class="gal-meta">'+esc(g.tag||'')+(g.date?' · '+esc(g.date):'')+'</span><p>'+esc(g.desc||'')+'</p></figcaption></figure>';
  }).join(""); observeReveal(gg);
    var LB = document.createElement('div'); LB.id='lightbox'; LB.className='lightbox';
    LB.innerHTML='<button class="lb-close" aria-label="닫기">✕</button><button class="lb-prev" aria-label="이전">‹</button><img class="lb-img" alt=""><button class="lb-next" aria-label="다음">›</button><div class="lb-cap"></div>';
    document.body.appendChild(LB);
    var idx=0; var imgs=glist;
    function show(i){ idx=(i+imgs.length)%imgs.length; var g=imgs[idx]; LB.querySelector('.lb-img').src=base()+g.src; LB.querySelector('.lb-cap').innerHTML='<b>'+esc(g.title)+'</b> '+esc(g.desc||''); LB.classList.add('open'); }
    gg.querySelectorAll('.gal-card').forEach(function(c,i){ c.style.cursor='zoom-in'; c.addEventListener('click',function(e){ e.preventDefault(); show(i); }); });
    LB.addEventListener('click',function(e){ if(e.target===LB||e.target.classList.contains('lb-close')) LB.classList.remove('open'); if(e.target.classList.contains('lb-prev')) show(idx-1); if(e.target.classList.contains('lb-next')) show(idx+1); });
    document.addEventListener('keydown',function(e){ if(!LB.classList.contains('open'))return; if(e.key==='Escape')LB.classList.remove('open'); if(e.key==='ArrowLeft')show(idx-1); if(e.key==='ArrowRight')show(idx+1); });
  }

  // Notices page (notices.html) — board(list) + detail
  var NOT = window.NOTICES;
  if (NOT) {
    var notList = NOT.slice().sort(function(a,b){ return b.id - a.id; });
    var noticeDetail = document.querySelector("#noticeDetail");
    var noticeBoard = document.querySelector("#noticeBoard");
    var _nd = document.querySelector("#noticeDetail"); var qid = (_nd && _nd.getAttribute("data-id")) || (location.search.match(/[?&]id=(\d+)/)||[])[1];
    qid = qid ? parseInt(qid, 10) : null;

    if (noticeDetail && qid != null) {
      var n = notList.filter(function(x){ return x.id === qid; })[0];
      var wrap = document.querySelector("#noticeBoardWrap") || noticeBoard;
      if (wrap) wrap.style.display = "none";
      if (!n) {
        noticeDetail.innerHTML = '<p style="text-align:center;color:var(--muted);padding:60px 0;">공지를 찾을 수 없습니다. <a href="'+base()+'notices.html">← 목록</a></p>';
      } else {
        var files = (n.files||[]).map(function(f){ return '<a class="wd-file" href="'+f.url+'" target="_blank" rel="noopener">⬇ '+esc(f.name)+'</a>'; }).join('');
        var body = esc(n.body).split("\n").map(function(l){ return '<p>'+l+'</p>'; }).join('');
        document.title = n.title + " — D. PARK Journal";
        noticeDetail.innerHTML =
          '<div class="notice-detail-head"><div class="notice-head"><span class="notice-cat">'+esc(n.category||'공지')+'</span><span class="notice-date">'+esc(n.date)+'</span></div>'+
          '<h1 class="notice-title">'+esc(n.title)+'</h1></div>'+
          '<div class="notice-body">'+body+'</div>'+
          (files?'<div class="wd-files">'+files+'</div>':'')+
          '<p style="margin-top:28px;"><a class="notice-src" href="'+base()+'notices.html">← 목록</a></p>';
      }
    } else if (noticeBoard) {
      var NPER = 10;
      var nCurPage = function(){ var m = /page=(\d+)/.exec(location.hash); var p = m ? parseInt(m[1],10) : 1; return p > 0 ? p : 1; };
      var nTotalPages = function(){ return Math.max(1, Math.ceil(notList.length / NPER)); };
      var renderNoticeBoard = function(){
        var tp = nTotalPages(); var p = Math.min(nCurPage(), tp);
        var slice = notList.slice((p-1)*NPER, (p-1)*NPER + NPER);
        var headRow = '<div class="notice-row notice-head-row"><span class="n-cat">분류</span><span class="n-title">제목</span><span class="n-date">날짜</span></div>';
        noticeBoard.innerHTML = headRow + slice.map(function(n){
          return '<a class="notice-row" href="'+base()+'notices/'+n.id+'/">'+
            '<span class="n-cat">'+esc(n.category||'공지')+'</span>'+
            '<span class="n-title">'+esc(n.title)+'</span>'+
            '<span class="n-date">'+esc(n.date)+'</span></a>';
        }).join("");
        var cnt = document.querySelector("#noticeCount");
        if (cnt) cnt.textContent = "총 " + notList.length + "건 · " + p + " / " + tp + " 페이지";
        var pager = document.querySelector("#noticePager");
        if (pager) {
          var h = "";
          h += '<a class="pg-btn'+(p<=1?" disabled":"")+'" href="#page='+(p-1)+'">‹ 이전</a>';
          for (var i=1; i<=tp; i++) h += '<a class="pg-num'+(i===p?" active":"")+'" href="#page='+i+'">'+i+'</a>';
          h += '<a class="pg-btn'+(p>=tp?" disabled":"")+'" href="#page='+(p+1)+'">다음 ›</a>';
          pager.innerHTML = h;
        }
      };
      renderNoticeBoard();
      window.addEventListener("hashchange", renderNoticeBoard);
    }
  }

  // Profile page — config 기반 섹션 (컨테이너가 있으면 렌더)
  var pPub = document.querySelector("#profilePubs"); if (pPub && WS) renderPubs(pPub);
  var pPat = document.querySelector("#profilePatents"); if (pPat && WS) pPat.innerHTML = WS.patents.map(workRow).join("");
  var pSw = document.querySelector("#profileSoftware"); if (pSw && WS) pSw.innerHTML = WS.software.map(workRow).join("");
  var pPf = document.querySelector("#profilePortfolio"); if (pPf && WS) pPf.innerHTML = WS.portfolio.slice(0, 6).map(pfCard).join("");

  // Projects (연구 과제) — works.html list + count, profile first-8
  var projList = document.querySelector("#projectList"); if (projList && WS && WS.projects) projList.innerHTML = WS.projects.map(projRow).join("");
  var projCount = document.querySelector("#projectCount"); if (projCount && WS && WS.projects) projCount.textContent = "총 " + WS.projects.length + "개 과제";
  var pProj = document.querySelector("#profileProjects"); if (pProj && WS && WS.projects) pProj.innerHTML = WS.projects.slice(0, 8).map(projRow).join("");

  // Profile 최근 과업 (portfolio as list rows)
  var pRecentWork = document.querySelector("#profileRecentWork"); if (pRecentWork && WS) pRecentWork.innerHTML = WS.portfolio.map(pfRow).join("");

  /* ---- Works detail page (works/detail.html?slug=...) ---- */
  var detailEl = document.querySelector("#workDetail");
  if (detailEl && WB) {
    var _wd = document.querySelector("#workDetail"); var slug = (_wd && _wd.getAttribute("data-slug")) || (location.search.match(/slug=([^&]+)/)||[])[1]; slug = slug?decodeURIComponent(slug):"";
    var w = WB[slug];
    if (w) {
      var extra = (window.WORK_CONTENT || {})[slug] || {};
      w = Object.assign({}, w, extra);
      if (extra.figs) w.figs = (WB[slug].figs || []).concat(extra.figs);
    }
    if (!w) {
      detailEl.innerHTML = '<p style="text-align:center;color:var(--muted);padding:60px 0;">항목을 찾을 수 없습니다. <a href="' + base() + 'works.html">목록으로</a></p>';
    } else {
      var ext = extLinkOf(w), l = w.links || {};
      var catLabelMap = { publications: "논문", patents: "특허", software: "소프트웨어", portfolio: "포트폴리오" };
      var links = [];
      if (l.doi) links.push('<a class="btn-x" href="https://doi.org/' + l.doi + '" target="_blank" rel="noopener">DOI 원문 ↗</a>');
      if (l.url) links.push('<a class="btn-x" href="' + l.url + '" target="_blank" rel="noopener">링크 ↗</a>');
      if (l.kipris) links.push('<a class="btn-x" href="' + l.kipris + '" target="_blank" rel="noopener">KIPRIS 검색 ↗</a>');
      if (l.code) links.push('<a class="btn-x btn-ghost" href="' + l.code + '" target="_blank" rel="noopener">코드 ↗</a>');
      if (l.article) links.push('<a class="btn-x btn-ghost" href="' + base() + l.article + '">관련 기고문 읽기 →</a>');
      var dl = (w.files || []).map(function (f) { return '<a class="wd-file" href="' + f.url + '" target="_blank" rel="noopener">⬇ ' + esc(f.name) + '</a>'; }).join('');
      var coverHtml = (w.cover && !/^fill-/.test(w.cover)) ? '<div class="wd-cover"><img src="' + base() + w.cover + '" alt="' + esc(w.title) + '"></div>' : '';
      var figs = (w.figs || []).map(function (f) {
        return '<figure class="wd-fig"><div class="wd-figbox"><img src="' + base() + f.src + '" alt="' + esc(f.cap) + '"></div><figcaption>' + esc(f.cap) + '</figcaption></figure>';
      }).join("");
      var table = "";
      if (w.table) {
        table = '<table class="wd-table"><thead><tr>' + w.table.head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join("") + '</tr></thead><tbody>' +
          w.table.rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + esc(c) + '</td>'; }).join("") + '</tr>'; }).join("") + '</tbody></table>';
      }
      var body = (w.sum || (w.desc || [])).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join("");
      document.title = w.title + " — D. PARK Journal";
      detailEl.innerHTML =
        '<div class="crumb"><a href="' + base() + 'index.html">Home</a> / <a href="' + base() + 'works.html">논문·특허·SW</a> / ' + catLabelMap[w._cat] + '</div>' +
        '<span class="work-badge ' + kindClass(w.kind) + '" style="margin-bottom:14px;">' + esc(w.kind || w.cat) + '</span>' +
        '<h1 class="wd-title">' + esc(w.title) + '</h1>' +
        (w.titleEn ? '<p class="wd-en">' + esc(w.titleEn) + '</p>' : '') +
        '<div class="wd-meta">' + [w.venue, w.date, w.role, w.period, w.org].filter(Boolean).map(esc).join(' · ') + '</div>' +
        (w.authors ? '<div class="wd-authors"><b>저자</b> ' + esc(w.authors) + '</div>' : '') +
        coverHtml +
        (figs ? '<div class="wd-figs">' + figs + '</div>' : '') +
        (w.abstract ? '<div class="wd-abstract"><span class="wd-abs-tag">' + (w.abstractVerbatim ? '초록 Abstract' : '요약 Summary') + '</span>' + esc(w.abstract) + '</div>' : '') +
        '<div class="wd-summary">' + body + '</div>' +
        (w.structure ? '<h4 class="wd-h4">구조 · 설계</h4><p class="wd-block">' + esc(w.structure) + '</p>' : '') +
        (w.goals ? '<h4 class="wd-h4">설계 목표</h4><p class="wd-block">' + esc(w.goals) + '</p>' : '') +
        (w.why ? '<div class="wd-why"><h4>왜 중요한가</h4><p>' + esc(w.why) + '</p>' + (w.contribution ? '<h4 class="wd-h4">기여</h4><p class="wd-block">' + esc(w.contribution) + '</p>' : '') + '</div>' : '') +
        (table ? '<h4 class="wd-h4">주요 결과</h4>' + table : '') +
        (links.length ? '<div class="wd-links">' + links.join("") + '</div>' : '') +
        (dl ? '<div class="wd-files"><h4 class="wd-h4">다운로드</h4>' + dl + '</div>' : '') +
        '<div style="margin-top:32px;"><a href="' + base() + 'works.html">← 전체 목록</a></div>';
    }
  }
})();

/* ==========================================================================
   AI Trial widget — 비검열 AI 플로팅 위젯 (REMOVABLE, self-contained)
   · 데이터: window.SITE.aiTrial (data.js) — enabled:false 면 아무것도 안 함
   · 우측하단 플로팅 버튼 + (넓은 화면) PC 미니 대화창(iframe)
   · 상단 메뉴 접힘(햄버거)·터치: 버튼 클릭 → 새 탭으로 챗 UI 바로 이동
   · 기고문(article[data-article-id]) 페이지에는 플로팅 버튼 미표시
   · 완전 제거: 이 블록 + data.js SITE.aiTrial + quicklinks "Abliterated AI" 항목만 지우면 흔적 0
   ========================================================================== */
(function () {
  var cfg = window.SITE && window.SITE.aiTrial;
  if (!cfg || !cfg.enabled || !cfg.chatUrl) return;
  var URL = cfg.chatUrl;

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
  var st = document.createElement('style'); st.id = 'aiTrialStyle'; st.textContent = css;
  document.head.appendChild(st);

  /* 기고문 페이지에는 플로팅 버튼을 띄우지 않는다 */
  if (document.querySelector('article[data-article-id]')) return;

  /* 상단 메뉴가 접혀 햄버거로 바뀐 상태(=좁은 화면)면 외부링크로 전환.
     클릭 시점에 판정하므로 리사이즈에도 즉시 따라온다. 터치 기기도 외부링크. */
  function useExternal() {
    var tog = document.querySelector('.nav-toggle');
    if (tog && getComputedStyle(tog).display !== 'none') return true;   // 햄버거 보임 = 메뉴 접힘
    return ('ontouchstart' in window) && window.matchMedia('(pointer: coarse)').matches;
  }

  var btn = document.createElement('button');
  btn.id = 'aiTrialBtn'; btn.type = 'button';
  btn.setAttribute('aria-label', cfg.aria || '비검열 AI 시범 서비스');
  btn.innerHTML = '<span class="ai-ic">🔓</span><span class="ai-tx">' + (cfg.btn || '비검열 AI') + '</span><span class="ai-b">β</span>';
  document.body.appendChild(btn);

  function openFull() { window.open(URL, '_blank', 'noopener'); }

  var panel = null;
  function buildPanel() {
    panel = document.createElement('div'); panel.id = 'aiTrialPanel';
    panel.innerHTML =
      '<div class="ai-head">' +
        '<span class="ai-ti"><b>Abliterated AI</b><span class="ai-badge">β 실험</span></span>' +
        '<span class="ai-actions">' +
          '<a class="ai-open" href="' + URL + '" target="_blank" rel="noopener" title="새 창에서 열기">새 창 ↗</a>' +
          '<button type="button" class="ai-x" data-act="close" title="닫기" aria-label="닫기">✕</button>' +
        '</span>' +
      '</div>' +
      '<div class="ai-body">' +
        '<iframe title="Abliterated AI Chat" src="' + URL + '" loading="lazy"></iframe>' +
      '</div>';
    document.body.appendChild(panel);
    panel.addEventListener('click', function (e) {
      var a = e.target.closest('[data-act]'); if (!a) return;
      if (a.getAttribute('data-act') === 'full') openFull();
      else hidePanel();
    });
  }
  function showPanel() { if (!panel) buildPanel(); requestAnimationFrame(function () { panel.classList.add('open'); }); btn.classList.add('active'); }
  function hidePanel() { if (panel) panel.classList.remove('open'); btn.classList.remove('active'); }

  btn.addEventListener('click', function () {
    if (useExternal()) { openFull(); return; }
    if (panel && panel.classList.contains('open')) hidePanel(); else showPanel();
  });
  /* 미니창이 열린 채 화면을 좁히면(메뉴 접힘) 닫아 둔다 — 다시 누르면 외부링크로 열림 */
  window.addEventListener('resize', function () {
    if (panel && panel.classList.contains('open') && useExternal()) hidePanel();
  });
})();
