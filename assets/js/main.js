/* D. PARK Journal — interactions + registry-driven rendering (vanilla JS, no build) */
(function () {
  var root = document.documentElement;

  /* ---------------- Prerender guard ----------------
     tools/prerender.mjs 가 각 페이지의 목록·상세·홈·공용 크롬(네비/푸터/티커)을
     빌드 시점에 HTML로 구워 넣고 <html data-prerendered="1"> 표시를 남긴다.
     PRE=true 면 로드 시 초기 콘텐츠 주입(render*)을 전부 건너뛰고, 이미 있는
     DOM 위에 이벤트/동작(테마·필터·페이지네이션·라이트박스·티커링크·딥링크)만
     바인딩한다 → 로드 시 이중 렌더 0. PRE=false(로컬 개발 등)면 기존대로 JS가 렌더.
     프리렌더 마커가 없는 컨테이너/딥링크(?cat=·#page=)에서는 필요 시 국소 재렌더. */
  var PRE = root.getAttribute("data-prerendered") === "1";

  /* ---------------- i18n (language-aware layer) ----------------
     경로 첫 세그먼트가 'en' 이면 영문('en'), 아니면 국문('ko'). 영문 페이지는
     assets/js/i18n-en.js(window.I18N_EN)를 main.js 보다 먼저 로드한다. 'ko' 이거나
     사전이 없으면 EN=false → 아래 모든 렌더가 기존 한국어 동작으로 폴백한다(회귀 0). */
  var LANG = (function () { var s = location.pathname.split("/").filter(Boolean); return s[0] === "en" ? "en" : "ko"; })();
  var I18N = (LANG === "en" && window.I18N_EN) ? window.I18N_EN : null;
  var EN = !!I18N;

  /* 한국어 UI 라벨(현행값) — EN 이면 사전(mainJsLabels)으로 덮어써 LB 로 통일 사용 */
  var KO_LABELS = {
    byline: "박대승", readSuffix: "읽기", readMinute: "분",
    boardCount: "총 {n}편 · {p} / {tp} 페이지",
    pagerPrev: "‹ 이전", pagerNext: "다음 ›",
    postNavPrev: "‹ 이전 글", postNavNext: "다음 글 ›", postNavNone: "없음", postNavList: "목록",
    boardEmpty: "해당 조건의 기고문이 없습니다.",
    filterAll: "전체", filterFeatured: "특별기고",
    pubGroupSCIE: "SCIE 논문", pubGroupKCI: "KCI 논문", pubGroupIntlConf: "국제 학술대회", pubGroupDomConf: "국내 학술대회",
    workRowDetails: "상세", workRowFullText: "원문 ↗",
    worksCount: "논문 {p} · 특허 {t} · 소프트웨어 {s}",
    projectCount: "총 {n}개 과제",
    detailCrumbWorks: "논문·특허·SW",
    catLabelPublication: "논문", catLabelPatent: "특허", catLabelSoftware: "소프트웨어", catLabelPortfolio: "포트폴리오",
    linkIeeeXplore: "IEEE Xplore ↗", linkDoi: "DOI 원문 ↗", linkUrl: "링크 ↗", linkDemo: "데모 ↗", linkKipris: "KIPRIS 검색 ↗", linkCode: "코드 ↗", linkArticle: "관련 기고문 읽기 →",
    labelAuthors: "저자", labelAbstract: "초록 Abstract", labelSummary: "요약 Summary",
    labelStructure: "구조 · 설계", labelGoals: "설계 목표", labelWhy: "왜 중요한가", labelContribution: "기여", labelKeyResults: "주요 결과", labelDownloads: "다운로드",
    detailBackAll: "← 전체 목록", detailBackList: "목록", detailNotFound: "항목을 찾을 수 없습니다.",
    promoDefaultCta: "자세히 →",
    footerBrowse: "둘러보기", footerArticles: "기고문",
    footerBottomRight: "Designed & built as a personal journal for Daeseung Park.",
    subscribeMsg: "구독해 주셔서 감사합니다! 알림 기능은 준비 중이라, 우선 dspark@daeseungpark.com 으로 새 글 소식을 보내드릴게요.",
    noticePosted: "작성일 : ", noticeBackList: "← 목록", noticeNotFound: "공지를 찾을 수 없습니다.", noticeDefaultCategory: "공지",
    noticeDocTitleSuffix: " — D. PARK Journal",
    noticeHeadTitle: "제목", noticeHeadDate: "작성일", noticeHeadFile: "첨부파일", noticeEmpty: "검색 결과가 없습니다.",
    noticeCount: "총 {n}건 · {p} / {tp} 페이지",
    lightboxClose: "닫기", lightboxPrev: "이전", lightboxNext: "다음",
    aiPanelOpenNewWindow: "새 창에서 열기", aiPanelNewWindow: "새 창 ↗", aiPanelClose: "닫기", aiPanelBadge: "β 실험", aiPanelAriaFallback: "비검열 AI 시범",
    dateLocale: "ko-KR",
    kindIntlConf: "국제학술", kindDomConf: "국내학술", ariaPager: "페이지 이동"
  };
  var LB = EN ? Object.assign({}, KO_LABELS, I18N.mainJsLabels) : KO_LABELS;
  function tpl(s, m) { return String(s == null ? "" : s).replace(/\{(\w+)\}/g, function (_, k) { return m[k] != null ? m[k] : ""; }); }

  /* ---- 데이터 번역 접근자 (EN 일 때만 사전 매핑, 아니면 원본 KO 필드) ---- */
  function slugOfPost(a) { var m = /articles\/([^\/]+)\//.exec(a.path || ""); return m ? m[1] : ""; }
  function artF(a, f) { if (EN && I18N.articles) { var e = I18N.articles[slugOfPost(a)]; if (e && e[f] != null) return e[f]; } return a[f]; }
  function featLabel(f) { if (EN && I18N.categories.articleFeature[f]) return I18N.categories.articleFeature[f]; return f; }
  function readFull(a) { if (EN) { var n = String(a.read || "").replace(/\s*분\s*$/, "").trim(); return n + " " + LB.readMinute + " " + LB.readSuffix; } return a.read + " " + LB.readSuffix; }
  function readShort(a) { if (EN) { var n = String(a.read || "").replace(/\s*분\s*$/, "").trim(); return n + " " + LB.readMinute; } return a.read; }
  function artCatDisp(c) { if (EN && I18N.categories.articleCat[c]) return I18N.categories.articleCat[c]; return c; }
  function wGrp(w) { return { publications: "publications", patents: "patents", software: "software", portfolio: "portfolio" }[w._cat]; }
  function wF(w, f) { if (EN) { var g = wGrp(w); if (g && I18N[g] && I18N[g][w.slug] && I18N[g][w.slug][f] != null) return I18N[g][w.slug][f]; } return w[f]; }
  function trVenue(v) {
    if (!EN || !v) return v;
    var out = v, vo = I18N.venueOrgNames || {}, vh = (I18N.categories && I18N.categories.venueHelpers) || {};
    Object.keys(vo).forEach(function (k) { out = out.split(k).join(vo[k]); });
    Object.keys(vh).forEach(function (k) { out = out.split(k).join(vh[k]); });
    out = out.split("발표번호").join("Paper No.").split("제주, 오션스위츠 제주호텔").join("Jeju, Ocean Suites Jeju Hotel").split("춘계학술대회").join("Spring Conference").split("하계종합학술대회").join("Summer Conference").split("하계학술대회").join("Summer Conference");
    return out;
  }
  function wTitle(w) { if (EN) { if (w._cat === "publications") return w.titleEn || w.title; if (w._cat === "patents" && w.titleEn) return w.titleEn; return wF(w, "title") || w.title; } return w.title; }
  function wRole(w) { if (EN && I18N.categories.roles[w.role]) return I18N.categories.roles[w.role]; return w.role; }
  function kindLabel(k) { if (!EN || !k) return k; var kn = I18N.categories.kinds || {}; if (kn[k]) return kn[k]; if (k === "국제학술") return LB.kindIntlConf; if (k === "국내학술") return LB.kindDomConf; return k; }
  function galKey(g) { var m = /([^\/]+)\.[a-z0-9]+$/i.exec(g.src || ""); return m ? m[1] : ""; }
  function gF(g, f) { if (EN && I18N.gallery) { var e = I18N.gallery[galKey(g)]; if (e && e[f] != null) return e[f]; } return g[f]; }
  function nF(n, f) { if (EN && I18N.notices) { var e = I18N.notices[n.id]; if (e && e[f] != null) return e[f]; } return n[f]; }
  function pjF(p, f) { if (EN && I18N.projects) { var e = I18N.projects[p.slug]; if (e && e[f] != null) return e[f]; } return p[f]; }

  /* ---- KO ↔ EN 대응 URL (토글) ---- */
  function counterpartHref() {
    var p = location.pathname.replace(/index\.html$/, "");
    if (LANG === "en") { return p.replace(/^\/en(\/|$)/, "/") || "/"; }
    return "/en" + (p === "/" ? "/" : p);
  }
  function langToggleHTML() {
    var other = counterpartHref();
    var label = LANG === "ko" ? "English" : "한국어";
    return '<a href="' + other + '" class="tb-lang-link" aria-label="Language">' + label + '</a>';
  }

  /* ---------------- Google Analytics (gtag.js) — REMOVABLE ----------------
     단일 소스: id는 data.js의 SITE.analytics.ga 에서 온다. 끄려면 그 값을 ""로
     비우거나 이 블록을 지우면 된다. main.js가 모든 페이지(루트·articles/·works/·notices/)
     에서 로드되므로 전 페이지에 자동 적용된다. 중복 주입은 플래그로 방지한다. */
  (function initGA() {
    var ga = window.SITE && window.SITE.analytics && window.SITE.analytics.ga;
    if (!ga) return;                       // config 비면 아무것도 안 함
    if (window.__gaInjected) return;       // 이중 주입 방지
    window.__gaInjected = true;
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + ga;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag("js", new Date());
    gtag("config", ga);
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
    if (e.target.closest("#navToggle")) document.querySelector("#mobileNav").classList.add("open");
    if (e.target.closest("#navClose")) document.querySelector("#mobileNav").classList.remove("open");
    if (e.target.closest("#printBtn")) window.print();
  });

  /* ---------------- Topbar date ---------------- */
  var d = document.querySelector("#today");
  if (d) {
    try { d.textContent = new Date().toLocaleDateString(LB.dateLocale, { year: "numeric", month: "long", day: "numeric", weekday: "long" }); }
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
  /* 자산(이미지) 경로: EN 페이지는 KO 트리보다 한 단계 깊으므로(/en/…) 공유 루트
     자산을 가리키려면 base() 에 ../ 를 한 번 더 붙인다. KO 는 그대로(회귀 0).
     ※ 내부 페이지 링크는 base() 를 그대로 쓴다(EN 트리 안에서 상대구조 동일). */
  function assetBase() { return base() + (LANG === "en" ? "../" : ""); }
  function pad(n) { return String(n).padStart(2, "0"); }
  function shortTitle(t) { return t.split(":")[0].trim(); }
  function clip(t, n) { t = String(t); return t.length > n ? t.slice(0, n).replace(/\s+$/, "") + "…" : t; }
  function coverEl(a, cls) {
    cls = cls || "";
    if (/^fill-/.test(a.cover)) return '<div class="ph ' + a.cover + ' fill-grid ' + cls + '"></div>';
    return '<img class="ph ' + cls + '" src="' + assetBase() + a.cover + '" alt="" style="object-fit:cover;width:100%;height:100%;position:absolute;inset:0;">';
  }
  function card(a) {
    var cp = a.catClass ? "cat-pill " + a.catClass : "cat-pill";
    var ct = a.catClass ? "cat " + a.catClass : "cat";
    return '<a href="' + base() + a.path + '" class="post-card fade-up">' +
      '<div class="thumb">' + coverEl(a) + '<span class="' + cp + '">' + artCatDisp(a.cat) + '</span><span class="num">' + pad(a.id) + '</span></div>' +
      '<span class="' + ct + '">' + artF(a, "catLabel") + '</span>' +
      '<h3>' + artF(a, "title") + '</h3>' +
      '<p>' + artF(a, "deck") + '</p>' +
      '<div class="meta"><span class="by">' + LB.byline + '</span><span class="dot-sep">' + readFull(a) + '</span></div>' +
      '</a>';
  }
  function listCard(a, last) {
    var ct = a.catClass ? "cat " + a.catClass : "cat";
    var coverDiv = /^fill-/.test(a.cover)
      ? '<div class="' + a.cover + ' fill-grid" style="position:absolute;inset:0;"></div>'
      : '<img src="' + assetBase() + a.cover + '" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;">';
    return '<a href="' + base() + a.path + '" class="list-card"' + (last ? ' style="border-bottom:0;"' : '') + '>' +
      '<div class="thumb">' + coverDiv + '</div>' +
      '<div><span class="' + ct + '">' + artF(a, "catLabel") + '</span><h4>' + shortTitle(artF(a, "title")) + '</h4></div></a>';
  }
  function recentCard(a) {
    var cp = a.catClass ? "cat-pill " + a.catClass : "cat-pill";
    var ct = a.catClass ? "cat " + a.catClass : "cat";
    return '<a href="' + base() + a.path + '" class="recent-card fade-up">' +
      '<div class="thumb">' + coverEl(a) + '<span class="' + cp + '">' + artCatDisp(a.cat) + '</span></div>' +
      '<div class="rc-body"><span class="' + ct + '">' + artF(a, "catLabel") + '</span>' +
      '<h4>' + shortTitle(artF(a, "title")) + '</h4>' +
      '<div class="meta"><span class="by">' + LB.byline + '</span><span class="dot-sep">' + readShort(a) + '</span></div></div></a>';
  }
  function featureCard(a) {
    var ct = a.catClass ? "cat " + a.catClass : "cat";
    return '<a href="' + base() + a.path + '" class="feature-card fade-up">' +
      '<div class="feature-thumb">' + coverEl(a) + '<span class="feature-badge">' + featLabel(a.feature) + '</span></div>' +
      '<div class="feature-body">' +
      '<span class="' + ct + '">' + artCatDisp(a.cat) + '</span>' +
      '<h3>' + artF(a, "title") + '</h3>' +
      '<p>' + artF(a, "deck") + '</p>' +
      '<div class="meta"><span class="by">' + LB.byline + '</span><span class="dot-sep">' + a.date + '</span></div>' +
      '</div></a>';
  }
  function setHTML(id, html) { var el = document.querySelector("#" + id); if (el) { el.innerHTML = html; return el; } return null; }

  /* ---- Homepage ---- */
  /* 최신 기고 그리드: 특별기획(feature) 글은 제외 — 특별기획은 아래 #homeFeature 섹션에 따로 노출되므로 중복 방지 */
  if (!PRE) {
    var latest = setHTML("latestGrid", posts.filter(function (a) { return !a.feature; }).slice(0, 6).map(card).join(""));
    if (latest) observeReveal(latest);
    setHTML("tickerItems", posts.slice(0, 6).map(function (a) { return '<a href="' + base() + a.path + '">' + clip(shortTitle(artF(a, "title")), 30) + '</a>'; }).join(""));
    setHTML("recentList", posts.slice(0, 3).map(function (a, i, arr) { return listCard(a, i === arr.length - 1); }).join("")); // legacy sidebar (홈에 없으면 no-op)
    var feat = setHTML("homeFeature", posts.filter(function (a) { return a.feature; }).map(featureCard).join(""));
    if (feat) observeReveal(feat);
  }
  /* (푸터 기고문 목록은 renderFooter() 가 직접 렌더 — 아래 SITE 블록 참조) */

  /* ---- Homepage hero stats — config에서 자동 계산 (works.html와 동일한 소스 배열) ----
     .stat-line(홈)에서만 동작. WORKS 필드가 없으면 하드코딩 폴백 텍스트를 그대로 둔다(fail-safe). */
  (function renderHeroStats() {
    if (PRE) return;
    var W = window.WORKS;
    if (!W || !document.querySelector(".stat-line")) return;
    function put(sel, n) {
      var el = document.querySelector('[data-stat="' + sel + '"]');
      if (el && typeof n === "number" && !isNaN(n)) el.textContent = n;
    }
    if (W.publications) put("publications", W.publications.length);
    if (W.patents && W.software) put("patents-sw", W.patents.length + W.software.length);
    if (W.projects) put("projects", W.projects.length);
  })();

  /* ---- Homepage preview sections (config-driven; render only if containers present) ---- */
  (function renderHomePreviews() {
    if (PRE) return;
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
          '<div class="ha-thumb"><img src="' + assetBase() + gitem.src + '" alt="' + esc0(gF(gitem, "title")) + '" loading="lazy"></div>' +
          '<div class="ha-cap"><b>' + esc0(gF(gitem, "title")) + '</b><span>' + esc0(gF(gitem, "tag") || "") + (gitem.date ? ' · ' + esc0(gitem.date) : '') + '</span></div></a>';
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
      if (msg) msg.textContent = LB.subscribeMsg;
      if (input) input.value = "";
    });
  }

  /* ---- Articles board page (12/page, 게시판식 페이지 이동 + 카테고리 칩 필터) ---- */
  var board = document.querySelector("#boardGrid");
  if (board) {
    var PER = 12;
    var FEATURE_FILTER = "__feature", ALL_FILTER = "__all", FEATURE_LABEL = LB.filterFeatured;
    /* data.js SITE.articles.showFeatureInAll 로 '전체보기'의 특별기고 노출을 토글:
       false(기본) → 전체/카테고리 목록에는 특별기고 제외, [특별기고] 칩에서만 노출
       true        → 전체/카테고리 목록에도 특별기고 함께 노출 (특별기고 칩은 항상 특별기고만) */
    function showFeatureInAll() {
      var opt = (window.SITE && window.SITE.articles) || {};
      return !!opt.showFeatureInAll;
    }
    var activeFilter = ALL_FILTER;
    /* URL 쿼리 ?cat= 로 초기 선택 칩 결정: cat=feature → 특별기고(__feature).
       카테고리명(공백 등 URL 인코딩 포함)과 일치하면 그 카테고리 칩을 초기 선택.
       파라미터가 없거나 인식 불가하면 기존대로 '전체'(__all). */
    (function () {
      var m = /[?&]cat=([^&#]*)/.exec(location.search);
      if (!m) return;
      var val = "";
      try { val = decodeURIComponent(m[1].replace(/\+/g, " ")); } catch (e) { val = m[1]; }
      if (val === "feature" || val === FEATURE_FILTER) activeFilter = FEATURE_FILTER;
      else if (val && posts.some(function (a) { return a.cat === val; })) activeFilter = val;
    })();
    /* 현재 칩 + 토글 정책에 따라 걸러진 목록 */
    function filteredPosts() {
      var showAll = showFeatureInAll();
      if (activeFilter === FEATURE_FILTER) return posts.filter(function (a) { return a.feature; });
      if (activeFilter === ALL_FILTER) return posts.filter(function (a) { return showAll || !a.feature; });
      return posts.filter(function (a) { return a.cat === activeFilter && (showAll || !a.feature); });
    }
    /* 칩: 전체 + 카테고리(첫 등장 순) + 특별기고.
       카테고리 칩은 '현재 정책상 전체보기에 실제 노출되는 글 집합'에서만 추출한다:
       showFeatureInAll:false → 비-feature 글의 cat만(그래서 feature 전용 cat은 칩이 안 생김),
       showFeatureInAll:true  → 전체 글(feature 포함)의 cat. */
    var filterEl = document.querySelector("#boardFilter");
    if (filterEl) {
      var chipSource = posts.filter(function (a) { return showFeatureInAll() || !a.feature; });
      var cats = [];
      chipSource.forEach(function (a) { if (a.cat && cats.indexOf(a.cat) < 0) cats.push(a.cat); });
      function chipHTML(filter, label) {
        var on = activeFilter === filter;
        return '<button class="pf-chip' + (on ? ' is-active' : '') + '" type="button" data-filter="' + esc(filter) + '" aria-pressed="' + (on ? 'true' : 'false') + '">' + esc(label) + '</button>';
      }
      var chips = [chipHTML(ALL_FILTER, LB.filterAll)]
        .concat(cats.map(function (c) { return chipHTML(c, artCatDisp(c)); }))
        .concat([chipHTML(FEATURE_FILTER, FEATURE_LABEL)]);
      /* 프리렌더 시 기본(전체) 칩은 이미 구워져 있으므로 재주입 생략.
         딥링크(?cat=)로 활성 칩이 전체가 아니면 칩을 다시 그려 active 상태를 맞춘다. */
      if (!PRE || activeFilter !== ALL_FILTER) filterEl.innerHTML = chips.join("");
      filterEl.addEventListener("click", function (e) {
        var btn = e.target.closest(".pf-chip");
        if (!btn) return;
        activeFilter = btn.getAttribute("data-filter");
        filterEl.querySelectorAll(".pf-chip").forEach(function (b) {
          var on = b === btn;
          b.classList.toggle("is-active", on);
          b.setAttribute("aria-pressed", on ? "true" : "false");
        });
        location.hash = "page=1"; // 칩 전환 시 1페이지로
        renderBoard();            // 해시가 이미 page=1 이어서 hashchange 미발생하는 경우 대비
      });
    }
    function curPage() { var m = /page=(\d+)/.exec(location.hash); var p = m ? parseInt(m[1], 10) : 1; return p > 0 ? p : 1; }
    function totalPages(n) { return Math.max(1, Math.ceil(n / PER)); }
    function renderBoard() {
      var list = filteredPosts();
      var tp = totalPages(list.length); var p = Math.min(curPage(), tp);
      var slice = list.slice((p - 1) * PER, (p - 1) * PER + PER);
      board.innerHTML = slice.length
        ? slice.map(card).join("")
        : '<p class="text-muted-x" style="grid-column:1/-1;text-align:center;padding:48px 10px;">' + LB.boardEmpty + '</p>';
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
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    /* 프리렌더면 기본 상태(전체·1페이지)는 이미 구워져 있으니 초기 렌더 생략.
       딥링크(?cat=)·페이지 해시(#page=N)가 기본과 다르면 국소 재렌더. */
    if (!PRE || activeFilter !== ALL_FILTER || curPage() !== 1) renderBoard();
    window.addEventListener("hashchange", renderBoard);
  }

  /* ---- Article page: 관련 글 + 이전/다음(게시판식) ---- */
  var artEl = document.querySelector("[data-article-id]");
  if (artEl && !PRE) {
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
        ? '<a class="pn" href="' + base() + older.path + '"><span class="pn-dir">' + LB.postNavPrev + '</span><span class="pn-t">' + shortTitle(artF(older, "title")) + '</span></a>'
        : '<span class="pn empty"><span class="pn-dir">' + LB.postNavPrev + '</span><span class="pn-t">' + LB.postNavNone + '</span></span>';
      var mid = '<a class="pn pn-list" href="' + base() + 'articles.html">' + LB.postNavList + '</a>';
      var right = newer
        ? '<a class="pn pn-right" href="' + base() + newer.path + '"><span class="pn-dir">' + LB.postNavNext + '</span><span class="pn-t">' + shortTitle(artF(newer, "title")) + '</span></a>'
        : '<span class="pn pn-right empty"><span class="pn-dir">' + LB.postNavNext + '</span><span class="pn-t">' + LB.postNavNone + '</span></span>';
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
    var arts = posts.map(function(a){ return '<li><a href="'+base()+a.path+'">'+(shortTitle(artF(a,"title")))+'</a></li>'; }).join("");
    ft.innerHTML =
     '<div class="container-x"><div class="footer-grid">'+
       '<div><div class="footer-brand">'+F.brand+'</div><p style="max-width:34ch;">'+F.blurb+'</p>'+
         '<div class="social" style="margin-top:16px;">'+
           '<a href="'+L.github+'" target="_blank" rel="noopener" aria-label="GitHub">GH</a>'+
           '<a href="'+L.orcid+'" target="_blank" rel="noopener" aria-label="ORCID">iD</a>'+
           '<a href="mailto:'+L.emailPrimary+'" aria-label="Email">@</a>'+
         '</div></div>'+
       '<div><h6>'+LB.footerBrowse+'</h6><ul>'+nav+'</ul></div>'+
       '<div><h6>'+LB.footerArticles+'</h6><ul class="ft-arts">'+arts+'</ul></div>'+
       '<div><h6>Contact</h6><ul>'+
         '<li><a href="mailto:'+L.emailPrimary+'">'+L.emailPrimary+'</a></li>'+
         '<li><a href="mailto:'+L.emailKaist+'">'+L.emailKaist+'</a></li>'+
         '<li><a href="tel:'+L.phoneKR.replace(/\s/g,"")+'">Phone (KR) '+L.phoneKR+'</a></li>'+
         '<li><a href="tel:'+L.phoneUS.replace(/\s/g,"")+'">Phone (US) '+L.phoneUS+'</a></li>'+
         '<li>KAIST, Daejeon, Korea</li>'+
       '</ul></div>'+
     '</div>'+
     '<div class="footer-bottom"><span>© 2026 Daeseung Park. All rights reserved.</span><span>'+LB.footerBottomRight+'</span></div>'+
     '</div>';
  }

  if (SITE && !PRE) {
    var atRoot = base() === "";
    var curFile = (location.pathname.split("/").pop() || "index.html");
    var tb = document.querySelector(".tb-links");
    if (tb) tb.innerHTML = SITE.quicklinks.map(function (q) {
      var h = linkHref(q), ext = !!q.key || isExt(q.href || "");
      return '<a href="' + h + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '>' + q.label + '</a>';
    }).join("") + langToggleHTML();
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
        var pmBadge = EN && I18N.site.promoBadge ? I18N.site.promoBadge : pm.badge;
        var pmText = EN && I18N.site.promoText ? I18N.site.promoText : pm.text;
        var pmCta = EN && I18N.site.promoCta ? I18N.site.promoCta : (pm.cta || LB.promoDefaultCta);
        promoEl.querySelector(".container-x").innerHTML =
          '<a class="paper-promo fade-up" href="' + ph + '">' +
            '<span class="pp-badge">' + pmBadge + '</span>' +
            '<span class="pp-text">' + pmText + (pm.soon ? ' <span class="pp-soon">' + pm.soon + '</span>' : '') + '</span>' +
            '<span class="pp-cta">' + pmCta + '</span>' +
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
          var lbl = b.label;
          if (EN) lbl = ext ? (I18N.site.promo2BtnUse || lbl) : (I18N.site.promo2BtnArticle || lbl);
          return '<a class="' + cls + '" href="' + bh + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '>' + lbl + '</a>';
        }).join("");
        var p2Badge = EN && I18N.site.promo2Badge ? I18N.site.promo2Badge : p2.badge;
        var p2Text = EN && I18N.site.promo2Text ? I18N.site.promo2Text : p2.text;
        promo2El.querySelector(".container-x").innerHTML =
          '<div class="paper-promo ai-promo fade-up">' +
            '<span class="pp-badge">' + p2Badge + '</span>' +
            '<span class="pp-text">' + p2Text + '</span>' +
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
  function extLinkOf(w) { var l = w.links || {}; if (l.doi) return "https://doi.org/" + l.doi; if (l.ieee) return l.ieee; if (l.url) return l.url; if (l.kipris) return l.kipris; return ""; }
  function workRow(w) {
    var detail = base() + "works/" + w.slug + "/";
    var ext = extLinkOf(w);
    var titleMain = wTitle(w);
    var enLine = EN ? w.title : w.titleEn;
    return '<div class="work-row">' +
      '<span class="work-badge ' + kindClass(w.kind) + '">' + esc(kindLabel(w.kind)) + '</span>' +
      '<div class="work-main">' +
        '<a class="work-title" href="' + detail + '">' + esc(titleMain) + '</a>' +
        (enLine ? '<div class="work-en">' + esc(enLine) + '</div>' : '') +
        '<div class="work-meta">' + esc(trVenue(wF(w, "venue"))) + ' · ' + esc(wF(w, "date")) + (w.role ? ' · <b>' + esc(wRole(w)) + '</b>' : '') + (w.impactFactor ? ' <span class="work-if" title="Impact Factor · JCR 2025">IF ' + esc(w.impactFactor) + '</span>' : '') + '</div>' +
      '</div>' +
      '<div class="work-links"><a class="wl-detail" href="' + detail + '">' + LB.workRowDetails + '</a>' +
        (ext ? '<a class="wl-ext" href="' + ext + '" target="_blank" rel="noopener">' + LB.workRowFullText + '</a>' : '') +
      '</div></div>';
  }
  function renderPubs(el) {
    var groups = [["SCIE", LB.pubGroupSCIE], ["KCI", LB.pubGroupKCI], ["국제학술", LB.pubGroupIntlConf], ["국내학술", LB.pubGroupDomConf]];
    el.innerHTML = groups.map(function (g) {
      var items = WS.publications.filter(function (w) { return w.kind === g[0]; });
      if (!items.length) return "";
      return '<h3 class="work-group">' + g[1] + ' <span>(' + items.length + ')</span></h3>' + items.map(workRow).join("");
    }).join("");
  }
  function pfCard(w) {
    var href = base() + "works/" + w.slug + "/";
    var cov = !w.cover ? '<div class="pf-fill"></div>'
      : /^fill-/.test(w.cover) ? '<div class="ph ' + w.cover + ' fill-grid"></div>'
      : '<img src="' + assetBase() + w.cover + '" alt="" loading="lazy">';
    var pfDesc = wF(w, "desc");
    var catDisp = (EN && I18N.categories.portfolioCat[w.cat]) ? I18N.categories.portfolioCat[w.cat] : w.cat;
    return '<a class="pf-card fade-up" href="' + href + '" data-cat="' + esc(w.cat) + '">' +
      '<div class="pf-thumb">' + cov + '<span class="pf-cat">' + esc(catDisp) + '</span></div>' +
      '<div class="pf-body"><h3>' + esc(wF(w, "title")) + '</h3>' +
      '<div class="pf-meta">' + esc(wF(w, "period") || "") + (w.org ? ' · ' + esc(wF(w, "org")) : '') + '</div>' +
      '<p>' + esc((pfDesc && pfDesc[0]) || "") + '</p>' +
      '<div class="pf-tags">' + (wF(w, "tags") || []).map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') + '</div>' +
      '</div></a>';
  }

  function projRow(p){
    var meta = (pjF(p, "orgs") || []).slice();
    if (p.period) meta.push(p.period);
    if (p.budget) meta.push(p.budget);
    if (p.no) meta.push(p.no);
    return '<div class="proj-row2"><div class="proj-org">'+esc(pjF(p, "funder"))+'</div>'+
      '<div class="proj-main"><div class="proj-title">'+esc(pjF(p, "title"))+'</div>'+
      '<div class="proj-meta">'+meta.map(esc).join(' · ')+'</div>'+
      (pjF(p, "desc")?'<p class="proj-desc">'+esc(pjF(p, "desc"))+'</p>':'')+'</div></div>';
  }
  function pfRow(w){ var d=base()+"works/"+w.slug+"/"; var cd=(EN&&I18N.categories.portfolioCat[w.cat])?I18N.categories.portfolioCat[w.cat]:w.cat; return '<a class="work-row" href="'+d+'"><span class="work-badge sw">'+esc(cd)+'</span><div class="work-main"><span class="work-title">'+esc(wF(w,"title"))+'</span><div class="work-meta">'+[wF(w,"period"),wF(w,"org")].filter(Boolean).map(esc).join(' · ')+'</div></div><span class="work-links"><span class="wl-detail">'+LB.workRowDetails+'</span></span></a>'; }

  // Works listing page (works.html)
  var pubList = document.querySelector("#pubList"); if (pubList && WS && !PRE) renderPubs(pubList);
  var patList = document.querySelector("#patentList"); if (patList && WS && !PRE) patList.innerHTML = WS.patents.map(workRow).join("");
  var swList = document.querySelector("#softwareList"); if (swList && WS && !PRE) swList.innerHTML = WS.software.map(workRow).join("");
  var wc = document.querySelector("#worksCount");
  if (wc && W && !PRE) wc.textContent = tpl(LB.worksCount, { p: W.publications.length, t: W.patents.length, s: W.software.length });

  // Portfolio page (portfolio.html) + profile portfolio container
  var pfGrid = document.querySelector("#portfolioGrid");
  if (pfGrid && WS) {
    if (!PRE) { pfGrid.innerHTML = WS.portfolio.map(pfCard).join(""); observeReveal(pfGrid); }
    // 카테고리 필터 칩 (portfolio.html) — 존재하는 cat만, "전체" + 각 카테고리
    var pfFilter = document.querySelector("#pfFilter");
    if (pfFilter) {
      if (!PRE) {
        var cats = [];
        WS.portfolio.forEach(function (w) { if (w.cat && cats.indexOf(w.cat) < 0) cats.push(w.cat); });
        var chips = ['<button class="pf-chip is-active" type="button" data-filter="__all" aria-pressed="true">' + LB.filterAll + '</button>']
          .concat(cats.map(function (c) {
            var cd = (EN && I18N.categories.portfolioCat[c]) ? I18N.categories.portfolioCat[c] : c;
            return '<button class="pf-chip" type="button" data-filter="' + esc(c) + '" aria-pressed="false">' + esc(cd) + '</button>';
          }));
        pfFilter.innerHTML = chips.join("");
      }
      pfFilter.addEventListener("click", function (e) {
        var btn = e.target.closest(".pf-chip");
        if (!btn) return;
        var f = btn.getAttribute("data-filter");
        pfFilter.querySelectorAll(".pf-chip").forEach(function (b) {
          var on = b === btn;
          b.classList.toggle("is-active", on);
          b.setAttribute("aria-pressed", on ? "true" : "false");
        });
        pfGrid.querySelectorAll(".pf-card").forEach(function (card) {
          var show = (f === "__all") || (card.getAttribute("data-cat") === f);
          card.style.display = show ? "" : "none";
        });
      });
    }
  }

  // Activity gallery page (activity.html)
  var gg = document.querySelector("#galleryGrid");
  if (gg && W && W.gallery) {
    var glist = W.gallery.filter(function(g){ return !g.hidden; }).slice().sort(function(a,b){
      function k(x){ var m=String(x.date||'').split('.'); return parseInt(m[0]||'0',10)*100 + parseInt(m[1]||'0',10); }
      return k(b) - k(a);
    });
    if (!PRE) { gg.innerHTML = glist.map(function(g){
    return '<figure class="gal-card fade-up"><div class="gal-thumb"><img src="'+assetBase()+g.src+'" alt="'+esc(gF(g,"title"))+'" loading="lazy"></div>'+
      '<figcaption><b>'+esc(gF(g,"title"))+'</b><span class="gal-meta">'+esc(gF(g,"tag")||'')+(g.date?' · '+esc(g.date):'')+'</span><p>'+esc(gF(g,"desc")||'')+'</p></figcaption></figure>';
  }).join(""); observeReveal(gg); }
    var LBX = document.createElement('div'); LBX.id='lightbox'; LBX.className='lightbox';
    LBX.innerHTML='<button class="lb-close" aria-label="'+LB.lightboxClose+'">✕</button><button class="lb-prev" aria-label="'+LB.lightboxPrev+'">‹</button><img class="lb-img" alt=""><button class="lb-next" aria-label="'+LB.lightboxNext+'">›</button><div class="lb-cap"></div>';
    document.body.appendChild(LBX);
    var idx=0; var imgs=glist;
    function show(i){ idx=(i+imgs.length)%imgs.length; var g=imgs[idx]; LBX.querySelector('.lb-img').src=assetBase()+g.src; LBX.querySelector('.lb-cap').innerHTML='<b>'+esc(gF(g,"title"))+'</b> '+esc(gF(g,"desc")||''); LBX.classList.add('open'); }
    gg.querySelectorAll('.gal-card').forEach(function(c,i){ c.style.cursor='zoom-in'; c.addEventListener('click',function(e){ e.preventDefault(); show(i); }); });
    LBX.addEventListener('click',function(e){ if(e.target===LBX||e.target.classList.contains('lb-close')) LBX.classList.remove('open'); if(e.target.classList.contains('lb-prev')) show(idx-1); if(e.target.classList.contains('lb-next')) show(idx+1); });
    document.addEventListener('keydown',function(e){ if(!LBX.classList.contains('open'))return; if(e.key==='Escape')LBX.classList.remove('open'); if(e.key==='ArrowLeft')show(idx-1); if(e.key==='ArrowRight')show(idx+1); });
  }

  // Notices page (notices.html) — board(list) + detail
  var NOT = window.NOTICES;
  if (NOT) {
    var notList = NOT.slice().sort(function(a,b){ return b.id - a.id; });
    var noticeDetail = document.querySelector("#noticeDetail");
    var noticeBoard = document.querySelector("#noticeBoard");
    var _nd = document.querySelector("#noticeDetail"); var qid = (_nd && _nd.getAttribute("data-id")) || (location.search.match(/[?&]id=(\d+)/)||[])[1];
    qid = qid ? parseInt(qid, 10) : null;

    if (noticeDetail && qid != null && !PRE) {
      var n = notList.filter(function(x){ return x.id === qid; })[0];
      var wrap = document.querySelector("#noticeBoardWrap") || noticeBoard;
      if (wrap) wrap.style.display = "none";
      if (!n) {
        noticeDetail.innerHTML = '<p style="text-align:center;color:var(--muted);padding:60px 0;">'+LB.noticeNotFound+' <a href="'+base()+'notices.html">'+LB.noticeBackList+'</a></p>';
      } else {
        var files = (n.files||[]).map(function(f){ return '<a class="wd-file" href="'+f.url+'" target="_blank" rel="noopener">⬇ '+esc(f.name)+'</a>'; }).join('');
        var body = esc(nF(n,"body")).split("\n").map(function(l){ return '<p>'+l+'</p>'; }).join('');
        document.title = nF(n,"title") + LB.noticeDocTitleSuffix;
        noticeDetail.innerHTML =
          '<div class="notice-detail-head"><div class="notice-head"><span class="notice-cat">'+esc(nF(n,"category")||LB.noticeDefaultCategory)+'</span><span class="notice-date">'+LB.noticePosted+esc(n.date)+'</span></div>'+
          '<h1 class="notice-title">'+esc(nF(n,"title"))+'</h1></div>'+
          '<div class="notice-body">'+body+'</div>'+
          (files?'<div class="wd-files">'+files+'</div>':'')+
          '<p style="margin-top:28px;"><a class="notice-src" href="'+base()+'notices.html">'+LB.noticeBackList+'</a></p>';
      }
    } else if (noticeBoard) {
      var NPER = 10;
      // No = descending display number over the full list (newest = highest)
      var noMap = {}; notList.forEach(function(n, i){ noMap[n.id] = notList.length - i; });
      var nQuery = "";
      var nCurPage = function(){ var m = /page=(\d+)/.exec(location.hash); var p = m ? parseInt(m[1],10) : 1; return p > 0 ? p : 1; };
      var nFiltered = function(){
        if (!nQuery) return notList;
        var q = nQuery.toLowerCase();
        return notList.filter(function(n){ return String(nF(n,"title")||"").toLowerCase().indexOf(q) !== -1; });
      };
      var renderNoticeBoard = function(){
        var list = nFiltered();
        var tp = Math.max(1, Math.ceil(list.length / NPER));
        var p = Math.min(nCurPage(), tp);
        var slice = list.slice((p-1)*NPER, (p-1)*NPER + NPER);
        var headRow = '<div class="notice-row notice-head-row"><span class="n-no">No</span><span class="n-title">'+LB.noticeHeadTitle+'</span><span class="n-date">'+LB.noticeHeadDate+'</span><span class="n-file">'+LB.noticeHeadFile+'</span></div>';
        var rows = slice.map(function(n){
          var hasFile = !!(n.files && n.files.length);
          return '<a class="notice-row" href="'+base()+'notices/'+n.id+'/">'+
            '<span class="n-no">'+noMap[n.id]+'</span>'+
            '<span class="n-title"><span class="notice-cat">'+esc(nF(n,"category")||LB.noticeDefaultCategory)+'</span>'+esc(nF(n,"title"))+'</span>'+
            '<span class="n-date">'+esc(n.date)+'</span>'+
            '<span class="n-file">'+(hasFile?'📎':'–')+'</span></a>';
        }).join("");
        if (!slice.length) rows = '<div class="notice-empty">'+LB.noticeEmpty+'</div>';
        noticeBoard.innerHTML = headRow + rows;
        var cnt = document.querySelector("#noticeCount");
        if (cnt) cnt.textContent = tpl(LB.noticeCount, { n: list.length, p: p, tp: tp });
        var pager = document.querySelector("#noticePager");
        if (pager) {
          var h = "";
          h += '<a class="pg-btn'+(p<=1?" disabled":"")+'" href="#page='+(p-1)+'">'+LB.pagerPrev+'</a>';
          for (var i=1; i<=tp; i++) h += '<a class="pg-num'+(i===p?" active":"")+'" href="#page='+i+'">'+i+'</a>';
          h += '<a class="pg-btn'+(p>=tp?" disabled":"")+'" href="#page='+(p+1)+'">'+LB.pagerNext+'</a>';
          pager.innerHTML = h;
        }
      };
      if (!PRE || nCurPage() !== 1) renderNoticeBoard();
      window.addEventListener("hashchange", renderNoticeBoard);
      var sForm = document.querySelector("#noticeSearch");
      var sInput = document.querySelector("#noticeSearchInput");
      if (sForm && sInput) {
        sForm.addEventListener("submit", function(e){
          e.preventDefault();
          nQuery = sInput.value.trim();
          if (nCurPage() !== 1) { location.hash = "page=1"; } // hashchange -> re-render on page 1
          else { renderNoticeBoard(); }
        });
      }
    }
  }

  // Profile page — config 기반 섹션 (컨테이너가 있으면 렌더)
  var pPub = document.querySelector("#profilePubs"); if (pPub && WS && !PRE) renderPubs(pPub);
  var pPat = document.querySelector("#profilePatents"); if (pPat && WS && !PRE) pPat.innerHTML = WS.patents.map(workRow).join("");
  var pSw = document.querySelector("#profileSoftware"); if (pSw && WS && !PRE) pSw.innerHTML = WS.software.map(workRow).join("");
  var pPf = document.querySelector("#profilePortfolio"); if (pPf && WS && !PRE) pPf.innerHTML = WS.portfolio.slice(0, 6).map(pfCard).join("");

  // Projects (연구 과제) — works.html list + count, profile first-8
  var projList = document.querySelector("#projectList"); if (projList && WS && WS.projects && !PRE) projList.innerHTML = WS.projects.map(projRow).join("");
  var projCount = document.querySelector("#projectCount"); if (projCount && WS && WS.projects && !PRE) projCount.textContent = tpl(LB.projectCount, { n: WS.projects.length });
  var pProj = document.querySelector("#profileProjects"); if (pProj && WS && WS.projects && !PRE) pProj.innerHTML = WS.projects.slice(0, 8).map(projRow).join("");

  // Profile 최근 과업 (portfolio as list rows)
  var pRecentWork = document.querySelector("#profileRecentWork"); if (pRecentWork && WS && !PRE) pRecentWork.innerHTML = WS.portfolio.map(pfRow).join("");

  /* ---- Works detail page (works/detail.html?slug=...) ---- */
  var detailEl = document.querySelector("#workDetail");
  if (detailEl && WB && !PRE) {
    var _wd = document.querySelector("#workDetail"); var slug = (_wd && _wd.getAttribute("data-slug")) || (location.search.match(/slug=([^&]+)/)||[])[1]; slug = slug?decodeURIComponent(slug):"";
    var w = WB[slug];
    if (w) {
      var extra = (window.WORK_CONTENT || {})[slug] || {};
      w = Object.assign({}, w, extra);
      if (extra.figs) w.figs = (WB[slug].figs || []).concat(extra.figs);
    }
    if (!w) {
      detailEl.innerHTML = '<p style="text-align:center;color:var(--muted);padding:60px 0;">' + LB.detailNotFound + ' <a href="' + base() + 'works.html">' + LB.detailBackList + '</a></p>';
    } else {
      var ext = extLinkOf(w), l = w.links || {};
      var catLabelMap = { publications: LB.catLabelPublication, patents: LB.catLabelPatent, software: LB.catLabelSoftware, portfolio: LB.catLabelPortfolio };
      var links = [];
      if (l.ieee) links.push('<a class="btn-x" href="' + l.ieee + '" target="_blank" rel="noopener">' + LB.linkIeeeXplore + '</a>');
      if (l.doi) links.push('<a class="btn-x" href="https://doi.org/' + l.doi + '" target="_blank" rel="noopener">' + LB.linkDoi + '</a>');
      if (l.url) links.push('<a class="btn-x" href="' + l.url + '" target="_blank" rel="noopener">' + LB.linkUrl + '</a>');
      if (l.demo) links.push('<a class="btn-x" href="' + l.demo + '" target="_blank" rel="noopener">' + LB.linkDemo + '</a>');
      if (l.kipris) links.push('<a class="btn-x" href="' + l.kipris + '" target="_blank" rel="noopener">' + LB.linkKipris + '</a>');
      if (l.code) links.push('<a class="btn-x btn-ghost" href="' + l.code + '" target="_blank" rel="noopener">' + LB.linkCode + '</a>');
      if (l.article) links.push('<a class="btn-x btn-ghost" href="' + base() + l.article + '">' + LB.linkArticle + '</a>');
      var dl = (w.files || []).map(function (f) { return '<a class="wd-file" href="' + f.url + '" target="_blank" rel="noopener">⬇ ' + esc(f.name) + '</a>'; }).join('');
      var titleMain = wTitle(w);
      var enLine = EN ? w.title : w.titleEn;   // EN: 한국어 원제를 부제로, KO: 영문 원제를 부제로
      var coverHtml = (w.cover && !/^fill-/.test(w.cover)) ? '<div class="wd-cover"><img src="' + assetBase() + w.cover + '" alt="' + esc(titleMain) + '"></div>' : '';
      var figCaps = EN ? (wF(w, "figs") || null) : null;
      var figs = (w.figs || []).map(function (f, i) {
        var cap = (figCaps && figCaps[i] != null) ? figCaps[i] : f.cap;
        return '<figure class="wd-fig"><div class="wd-figbox"><img src="' + assetBase() + f.src + '" alt="' + esc(cap) + '"></div><figcaption>' + esc(cap) + '</figcaption></figure>';
      }).join("");
      var tbl = EN ? (wF(w, "table") || w.table) : w.table;
      var table = "";
      if (tbl) {
        table = '<table class="wd-table"><thead><tr>' + tbl.head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join("") + '</tr></thead><tbody>' +
          tbl.rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + esc(c) + '</td>'; }).join("") + '</tr>'; }).join("") + '</tbody></table>';
      }
      var sumArr = EN ? (wF(w, "sum") || wF(w, "desc") || w.sum || w.desc || []) : (w.sum || w.desc || []);
      var body = sumArr.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join("");
      var whyTxt = EN ? (wF(w, "why") || (w.abstractVerbatim ? "" : w.why)) : w.why;
      /* EN: 논문 원문 초록(verbatim)만 그대로 노출, 비-verbatim 국문 요약은 영문 sum 으로 대체(생략) */
      var showAbstract = w.abstract && (!EN || w.abstractVerbatim);
      /* 한국어 장문 산문(structure/goals/contribution)이 남는가 → 안내 배너 */
      var koProse = EN && (w.structure || w.goals || w.contribution);
      var banner = koProse ? '<div class="ko-notice" role="note">이 글의 상세 본문(구조·설계·기여)은 한국어로 제공됩니다 · Detailed sections below are in Korean</div>' : '';
      document.title = titleMain + " — D. PARK Journal";
      detailEl.innerHTML =
        '<div class="crumb"><a href="' + base() + 'index.html">Home</a> / <a href="' + base() + 'works.html">' + LB.detailCrumbWorks + '</a> / ' + catLabelMap[w._cat] + '</div>' +
        '<span class="work-badge ' + kindClass(w.kind) + '" style="margin-bottom:14px;">' + esc(w.kind ? kindLabel(w.kind) : ((EN && I18N.categories.portfolioCat[w.cat]) ? I18N.categories.portfolioCat[w.cat] : w.cat)) + '</span>' +
        '<h1 class="wd-title">' + esc(titleMain) + '</h1>' +
        (enLine ? '<p class="wd-en">' + esc(enLine) + '</p>' : '') +
        (w.award ? '<div class="wd-award">🏆 ' + esc(EN ? (wF(w, "award") || w.award) : w.award) + '</div>' : '') +
        '<div class="wd-meta">' + [trVenue(wF(w, "venue")), wF(w, "date"), wRole(w), wF(w, "period"), wF(w, "org")].filter(Boolean).map(esc).join(' · ') + (w.impactFactor ? ' <span class="work-if" title="Impact Factor · JCR 2025">IF ' + esc(w.impactFactor) + '</span> <span class="wd-if-src">JCR 2025</span>' : '') + '</div>' +
        (w.authors ? '<div class="wd-authors"><b>' + LB.labelAuthors + '</b> ' + esc(w.authors) + '</div>' : '') +
        banner +
        coverHtml +
        (figs ? '<div class="wd-figs">' + figs + '</div>' : '') +
        (showAbstract ? '<div class="wd-abstract"><span class="wd-abs-tag">' + (w.abstractVerbatim ? LB.labelAbstract : LB.labelSummary) + '</span>' + esc(w.abstract) + '</div>' : '') +
        '<div class="wd-summary">' + body + '</div>' +
        (w.structure ? '<h4 class="wd-h4">' + LB.labelStructure + '</h4><p class="wd-block">' + esc(w.structure) + '</p>' : '') +
        (w.goals ? '<h4 class="wd-h4">' + LB.labelGoals + '</h4><p class="wd-block">' + esc(w.goals) + '</p>' : '') +
        (whyTxt ? '<div class="wd-why"><h4>' + LB.labelWhy + '</h4><p>' + esc(whyTxt) + '</p>' + (w.contribution ? '<h4 class="wd-h4">' + LB.labelContribution + '</h4><p class="wd-block">' + esc(w.contribution) + '</p>' : '') + '</div>' : '') +
        (table ? '<h4 class="wd-h4">' + LB.labelKeyResults + '</h4>' + table : '') +
        (links.length ? '<div class="wd-links">' + links.join("") + '</div>' : '') +
        (dl ? '<div class="wd-files"><h4 class="wd-h4">' + LB.labelDownloads + '</h4>' + dl + '</div>' : '') +
        '<div style="margin-top:32px;"><a href="' + base() + 'works.html">' + LB.detailBackAll + '</a></div>';
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
  /* 언어 인식(이 IIFE는 별도 스코프) */
  var _LANG = location.pathname.split("/").filter(Boolean)[0] === "en" ? "en" : "ko";
  var _I18N = (_LANG === "en" && window.I18N_EN) ? window.I18N_EN : null;
  function _ml(k, ko) { return (_I18N && _I18N.mainJsLabels && _I18N.mainJsLabels[k]) || ko; }
  function _st(k, ko) { return (_I18N && _I18N.site && _I18N.site[k]) || ko; }

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
  btn.setAttribute('aria-label', _st('aiTrialAria', cfg.aria || '비검열 AI 시범 서비스'));
  btn.innerHTML = '<span class="ai-ic">🔓</span><span class="ai-tx">' + _st('aiTrialBtn', cfg.btn || '비검열 AI') + '</span><span class="ai-b">β</span>';
  document.body.appendChild(btn);

  function openFull() { window.open(URL, '_blank', 'noopener'); }

  var panel = null;
  function buildPanel() {
    panel = document.createElement('div'); panel.id = 'aiTrialPanel';
    panel.innerHTML =
      '<div class="ai-head">' +
        '<span class="ai-ti"><b>Abliterated AI</b><span class="ai-badge">' + _ml('aiPanelBadge', 'β 실험') + '</span></span>' +
        '<span class="ai-actions">' +
          '<a class="ai-open" href="' + URL + '" target="_blank" rel="noopener" title="' + _ml('aiPanelOpenNewWindow', '새 창에서 열기') + '">' + _ml('aiPanelNewWindow', '새 창 ↗') + '</a>' +
          '<button type="button" class="ai-x" data-act="close" title="' + _ml('aiPanelClose', '닫기') + '" aria-label="' + _ml('aiPanelClose', '닫기') + '">✕</button>' +
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
