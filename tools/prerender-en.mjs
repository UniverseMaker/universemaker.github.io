/* =============================================================================
   D. PARK Journal — 영문 미러(/en/) 정적 생성기
   -----------------------------------------------------------------------------
   목적: 한국어 정적 사이트를 그대로 `/en/` 하위에 영문으로 복제한다. 로직 발산을 막기
   위해 **main.js 를 lang='en' 컨텍스트로 실행**(경로에 /en/ 세그먼트 → LANG='en')해
   나브·푸터·티커·목록·상세 등 JS 주입 영역을 영문으로 baked 하고, main.js 가 만지지
   않는 정적 본문(홈 히어로/섹션·서브 페이지 히어로·기고문 머리말)은 사전(staticHtml)
   기준으로 DOM 치환한다. head(title/description/og/twitter)와 <html lang> 도 영문화한다.

   방식(jsdom):
     1) KO HTML 로드(프리렌더 마커 제거 → main.js 가 다시 렌더).
     2) 브라우저 shim + window.I18N_EN 주입(assets/js/i18n-en.js 와 동일 객체).
     3) 페이지의 <script src> 를 순서대로 실행(data.js → content/notices → articles → main.js).
        경로가 /en/ 이므로 main.js 는 EN 모드로 렌더한다.
     4) 정적 본문/head 를 사전으로 치환, 자산 경로(css/js/img)를 /en/ 기준 상위(../)로 보정.
     5) <html data-prerendered="1"> 마커를 남기고 문서 전체를 직렬화해 /en/<path> 로 기록.

   장문 산문(기고문 본문·works 상세 structure/contribution)은 이번 단계에서 번역하지 않고
   한국어 원문을 유지하되, 상단에 "Full text in Korean" 안내 배너를 삽입한다(v76~ 순차 번역).

   실행법 (v75 폴더에서):
       node tools/prerender.mjs      # (선행) 한국어 루트 프리렌더 — 토글까지 baked
       node tools/prerender-en.mjs   # 영문 미러 생성 (idempotent)
   ============================================================================= */

import { JSDOM, VirtualConsole } from "jsdom";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { globSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SITE_ORIGIN = "https://daeseungpark.com/";
const I18N = JSON.parse(readFileSync(path.join(__dirname, "i18n-en.json"), "utf8"));
const SH = I18N.staticHtml;

/* ---- 런타임 자산 i18n-en.js 생성(사전과 항상 동기화) ---------------------- */
function writeI18nAsset() {
  const banner = "/* AUTO-GENERATED from tools/i18n-en.json by tools/prerender-en.mjs — do not edit by hand. */\n";
  const js = banner + "window.I18N_EN = " + JSON.stringify(I18N) + ";\n";
  writeFileSync(path.join(ROOT, "assets/js/i18n-en.js"), js, "utf8");
}

/* ---- 대상 페이지 ------------------------------------------------------------ */
function collectPages() {
  const rootPages = [
    "index.html", "profile.html", "profile_full.html", "articles.html",
    "portfolio.html", "works.html", "research.html", "activity.html", "notices.html",
  ];
  const detail = [
    ...globSync("works/*/index.html", { cwd: ROOT }),
    ...globSync("notices/*/index.html", { cwd: ROOT }),
    ...globSync("articles/*/index.html", { cwd: ROOT }),
  ].map((p) => p.split(path.sep).join("/"));
  return [...rootPages, ...detail];
}

/* ---- shim + marker strip --------------------------------------------------- */
function installShims(win) {
  win.matchMedia = function () { return { matches: false, media: "", onchange: null, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent() { return false; } }; };
  class IO { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } }
  win.IntersectionObserver = IO;
  win.scrollTo = function () {}; win.scroll = function () {};
  if (!win.requestAnimationFrame) win.requestAnimationFrame = function () { return 0; };
  if (!win.cancelAnimationFrame) win.cancelAnimationFrame = function () {};
}
function stripMarkers(html) { return html.replace(/\sdata-prerendered="1"/g, ""); }
function scriptPaths(html, fileDir) {
  const re = /<script\s+src="([^"]+)"><\/script>/g; const out = []; let m;
  while ((m = re.exec(html)) !== null) out.push({ rel: m[1], abs: path.resolve(fileDir, m[1]) });
  return out;
}

/* ---- 자산 경로 보정 (/en/ 는 KO 트리보다 한 단계 깊음 → 공유 루트 자산으로 되돌림) ---
   페이지 내부 링크(.html·디렉터리)는 /en/ 안에서 상대구조가 동일하므로 그대로 둔다.
   자산(css/js/img/pdf 등)만 KO 페이지 위치 기준으로 절대경로를 구해 EN 위치에서의
   상대경로로 다시 쓴다(예: 루트 → ../assets, works/slug → ../../../assets). */
const ASSET_EXT = /\.(css|js|mjs|png|jpe?g|svg|webp|gif|ico|pdf|apk|zip|mp4|webm|json|csv|xlsx?|docx?|pptx?)(\?|#|$)/i;
function isAssetUrl(u) {
  if (!u) return false;
  if (/^(https?:|\/\/|mailto:|tel:|data:|javascript:|#)/i.test(u)) return false;
  if (u.charAt(0) === "/") return false;
  if (/(^|\/)assets\//.test(u)) return true;
  return ASSET_EXT.test(u);
}
function rewriteAssetUrl(u, koDir, enDir) {
  const koAbs = path.posix.normalize(path.posix.join("/", koDir, u));
  return path.posix.relative("/" + enDir, koAbs) || u;
}
/* main.js 가 assetBase() 로 이미 EN 상대경로를 넣은 JS 주입 컨테이너는 건드리지 않는다.
   그 밖(head·정적 본문)의 자산만 KO 위치 기준으로 재계산해 /en/ 상대경로로 보정한다. */
const INJECTED = [
  ".tb-links", ".main-nav", "#mobileNav", "footer.site-footer", "#tickerItems",
  "#latestGrid", "#homeFeature", "#homeActivity", "#homePortfolio", "#homeProjects", "#homePromo", "#homePromo2",
  "#pubList", "#patentList", "#softwareList", "#pfFilter", "#portfolioGrid",
  "#projectList", "#galleryGrid", "#noticeBoard", "#noticeDetail",
  "#boardFilter", "#boardGrid",
  "#profilePubs", "#profilePatents", "#profileSoftware", "#profileProjects", "#profilePortfolio", "#profileRecentWork",
  "#workDetail", "#readNext", "#postNav",
].join(",");
function rewriteAssets(doc, koDir, enDir) {
  const attrOf = (el) => (el.tagName === "LINK" || el.tagName === "A") ? "href" : "src";
  doc.querySelectorAll("img[src], script[src], link[href], source[src], a[href]").forEach((el) => {
    if (el.closest(INJECTED)) return;   // 주입 컨테이너 내부 = 이미 EN 경로(assetBase)
    const attr = attrOf(el);
    const u = el.getAttribute(attr);
    if (isAssetUrl(u)) el.setAttribute(attr, rewriteAssetUrl(u, koDir, enDir));
  });
}

/* ---- head 영문화 ----------------------------------------------------------- */
function setMeta(doc, key, val, content) {
  if (content == null) return;
  const el = doc.querySelector('meta[' + key + '="' + val + '"]');
  if (el) el.setAttribute("content", content);
}
function enUrl(u) { return u ? u.replace(/^(https?:\/\/[^\/]+)\//, "$1/en/") : u; }

/* ---- SEO 다국어(i18n): hreflang · og:locale:alternate · JSON-LD inLanguage ---- */
const SEO_BASE = "https://daeseungpark.com";
function koPathOf(relPath) {
  if (relPath === "index.html") return "/";
  if (relPath.endsWith("/index.html")) return "/" + relPath.slice(0, relPath.length - "index.html".length);
  return "/" + relPath;
}
function addEnSeoI18n(doc, koPath) {
  const head = doc.querySelector("head");
  if (!head) return;
  // 재생성 대비 기존 alternate/locale:alternate 제거(EN 은 매 실행 새로 생성되나 방어적으로)
  head.querySelectorAll('link[rel="alternate"][hreflang], meta[property="og:locale:alternate"]').forEach((e) => e.remove());
  const koHref = SEO_BASE + koPath;
  const enHref = SEO_BASE + "/en" + koPath;
  const mkLink = (hl, href) => { const l = doc.createElement("link"); l.setAttribute("rel", "alternate"); l.setAttribute("hreflang", hl); l.setAttribute("href", href); return l; };
  const nodes = [mkLink("ko", koHref), mkLink("en", enHref), mkLink("x-default", koHref)];
  const altMeta = doc.createElement("meta"); altMeta.setAttribute("property", "og:locale:alternate"); altMeta.setAttribute("content", "ko_KR"); nodes.push(altMeta);
  const can = head.querySelector('link[rel="canonical"]');
  if (can) { const anchor = can.nextSibling; nodes.forEach((n) => can.parentNode.insertBefore(n, anchor)); }
  else nodes.forEach((n) => head.appendChild(n));
  // JSON-LD inLanguage → "en" (KO 원문에서 "ko" 였던 것을 교정)
  head.querySelectorAll('script[type="application/ld+json"]').forEach((s) => {
    let b = s.textContent;
    if (/"inLanguage"\s*:/.test(b)) b = b.replace(/"inLanguage"\s*:\s*"[^"]*"/g, '"inLanguage":"en"');
    else b = b.replace(/(\{"@context":"https:\/\/schema\.org",)/, '$1"inLanguage":"en",');
    s.textContent = b;
  });
}
/* 자기완결형 en/landing.html (prerender-en 대상 아님) 문자열 주입 */
function injectEnLandingSeo() {
  const abs = path.join(ROOT, "en", "landing.html");
  let html;
  try { html = readFileSync(abs, "utf8"); } catch { return { done: false }; }
  const original = html;
  html = html.replace(/\n?<!-- seo-i18n:start -->[\s\S]*?<!-- seo-i18n:end -->/g, "");
  const koPath = "/landing.html";
  const block = ["<!-- seo-i18n:start -->",
    '<link rel="canonical" href="' + SEO_BASE + "/en" + koPath + '">',
    '<link rel="alternate" hreflang="ko" href="' + SEO_BASE + koPath + '">',
    '<link rel="alternate" hreflang="en" href="' + SEO_BASE + "/en" + koPath + '">',
    '<link rel="alternate" hreflang="x-default" href="' + SEO_BASE + koPath + '">',
    '<meta property="og:locale" content="en_US">',
    '<meta property="og:locale:alternate" content="ko_KR">',
    "<!-- seo-i18n:end -->"].join("\n");
  const descRe = /(<meta name="description"[^>]*>)/;
  const titleRe = /(<title>[\s\S]*?<\/title>)/;
  if (descRe.test(html)) html = html.replace(descRe, "$1\n" + block);
  else if (titleRe.test(html)) html = html.replace(titleRe, "$1\n" + block);
  else return { done: false };
  const changed = html !== original;
  if (changed) writeFileSync(abs, html, "utf8");
  return { done: true, changed };
}
function translateHead(doc, cfg) {
  doc.documentElement.setAttribute("lang", "en");
  if (cfg.title) { const t = doc.querySelector("title"); if (t) t.textContent = cfg.title; }
  setMeta(doc, "name", "description", cfg.desc);
  setMeta(doc, "property", "og:description", cfg.desc);
  setMeta(doc, "name", "twitter:description", cfg.desc);
  if (cfg.ogTitle) { setMeta(doc, "property", "og:title", cfg.ogTitle); setMeta(doc, "name", "twitter:title", cfg.ogTitle); }
  setMeta(doc, "property", "og:locale", "en_US");
  const can = doc.querySelector('link[rel="canonical"]'); if (can) can.setAttribute("href", enUrl(can.getAttribute("href")));
  const ogu = doc.querySelector('meta[property="og:url"]'); if (ogu) ogu.setAttribute("content", enUrl(ogu.getAttribute("content")));
}

/* ---- 공통 크롬(모든 페이지) 정적 영문화 ----------------------------------- */
function translateChrome(doc) {
  const set = (sel, attr, v) => { const e = doc.querySelector(sel); if (e) e.setAttribute(attr, v); };
  set("#themeToggle", "aria-label", "Toggle theme");
  set("#navToggle", "aria-label", "Menu");
  set("#navClose", "aria-label", "Close");
  const vp = doc.querySelector(".nav-actions a.btn-x"); if (vp) vp.textContent = "View profile";
  doc.querySelectorAll(".pager").forEach((p) => p.setAttribute("aria-label", I18N.mainJsLabels.ariaPager));
  const bf = doc.querySelector("#boardFilter"); if (bf) bf.setAttribute("aria-label", (SH["articles.html"] && SH["articles.html"].ariaCategoryFilter) || "Category filter");
}

/* ---- 정적 텍스트 헬퍼 ------------------------------------------------------ */
function setText(doc, sel, txt) { if (txt == null) return; const e = doc.querySelector(sel); if (e) e.textContent = txt; }
function setLeadingText(doc, sel, txt) { // 첫 텍스트 노드만 교체(자식 svg 보존)
  if (txt == null) return; const e = doc.querySelector(sel); if (!e) return;
  let tn = null; for (const n of e.childNodes) { if (n.nodeType === 3 && n.nodeValue.trim()) { tn = n; break; } }
  if (tn) tn.nodeValue = txt + " "; else e.insertBefore(doc.createTextNode(txt + " "), e.firstChild);
}
function secHead(doc, sel, h2, sub, more) {
  const sec = doc.querySelector(sel); if (!sec) return;
  const h = sec.querySelector(".section-head h2"); if (h && h2) h.textContent = h2;
  const s = sec.querySelector(".section-head .sub"); if (s && sub) s.textContent = sub;
  const m = sec.querySelector(".more"); if (m && more) m.textContent = more;
}
function pageHero(doc, S) {
  const cr = doc.querySelector(".page-hero .crumb");
  if (cr && S.crumb) {
    const rest = S.crumb.replace(/^Home\s*\/\s*/, "");
    const a = cr.querySelector("a");
    while (cr.firstChild) cr.removeChild(cr.firstChild);
    if (a) { cr.appendChild(a); cr.appendChild(doc.createTextNode(" / " + rest)); }
    else cr.textContent = S.crumb;
  }
  setText(doc, ".page-hero h1", S.h1);
  setText(doc, ".page-hero .lead", S.lead);
}
const KO_NOTICE = '이 글의 본문은 한국어로 제공됩니다 · Full text in Korean';
function bannerHTML(txt) { return '<div class="ko-notice" role="note">' + (txt || KO_NOTICE) + '</div>'; }

/* ---- 페이지별 정적 본문 영문화 -------------------------------------------- */
function translateIndex(doc) {
  const S = SH["index.html"];
  setText(doc, ".feat-large .inner p", S.heroLargeP);
  setLeadingText(doc, ".feat-large .inner .cta", S.heroLargeCta);
  setText(doc, ".feat-medium .inner h3", S.heroMediumH3);
  setText(doc, ".feat-medium .inner p", S.heroMediumP);
  setLeadingText(doc, ".feat-medium .inner .cta", S.heroMediumCta);
  const smalls = doc.querySelectorAll(".feat-small-row .feat-small");
  if (smalls[0]) { const h = smalls[0].querySelector("h3"); if (h) h.textContent = S.heroSmall1H3; const p = smalls[0].querySelector("p"); if (p) p.textContent = S.heroSmall1P; }
  if (smalls[1]) { const h = smalls[1].querySelector("h3"); if (h) h.textContent = S.heroSmall2H3; const p = smalls[1].querySelector("p"); if (p) p.textContent = S.heroSmall2P; }
  secHead(doc, "#articles", S.sectionLatest, S.subLatest, S.moreViewAll);
  secHead(doc, "#feature", S.sectionFeatured, S.subFeatured, S.moreViewAll);
  secHead(doc, "#homeActivitySec", S.sectionActivity, S.subActivity, S.moreViewAll);
  secHead(doc, "#homePortfolioSec", S.sectionPortfolio, S.subPortfolio, S.moreViewAll);
  secHead(doc, "#homeProjectsSec", S.sectionProjects, S.subProjects, S.moreViewAll);
  setText(doc, "#about .about-main h2", S.aboutH2);
  const leads = doc.querySelectorAll("#about .about-main p.lead-serif");
  if (leads[0]) leads[0].textContent = S.aboutLead1;
  if (leads[1]) leads[1].textContent = S.aboutLead2;
  const ab = doc.querySelector("#about .about-main a.btn-x"); if (ab) ab.textContent = S.aboutBtn;
  setText(doc, "#about .about-author p.text-muted-x", S.authorInterests);
  setText(doc, "#about .topics-side h4", S.topicsH4);
  doc.querySelectorAll("#about .topic-list a").forEach((a) => { const t = a.textContent.trim(); if (S.topics[t]) a.textContent = S.topics[t]; });
}
function translateSectionTitles(doc, map) { // 텍스트 기준 h2 치환
  doc.querySelectorAll(".section-head h2, section h2").forEach((h) => { const t = h.textContent.trim(); if (map[t]) h.textContent = map[t]; });
}
function translateSubpage(doc, page) {
  const S = SH[page]; if (S) pageHero(doc, S);
  if (page === "works.html") translateSectionTitles(doc, { "논문": S.sectionPublications, "특허": S.sectionPatents, "소프트웨어": S.sectionSoftware });
  if (page === "research.html") translateSectionTitles(doc, { "연구 과제": S.sectionProjects });
  if (page === "notices.html") {
    const si = doc.querySelector("#noticeSearchInput"); if (si) { si.setAttribute("placeholder", S.searchPlaceholder); si.setAttribute("aria-label", S.ariaSearch); }
    const sb = doc.querySelector("#noticeSearch button"); if (sb) sb.textContent = S.searchButton;
  }
}
function translateArticleDetail(doc, slug) {
  const a = (I18N.articles && I18N.articles[slug]) || {};
  const catPill = doc.querySelector(".art-head .cat-pill");
  if (catPill) { const t = catPill.textContent.trim(); catPill.textContent = (I18N.categories.articleCat[t]) || a.cat || t; }
  if (a.title) setText(doc, ".art-head h1", a.title);
  if (a.deck) { const d = doc.querySelector(".art-head .deck"); if (d) d.textContent = a.deck; }
  const nameB = doc.querySelector(".art-byline .who b"); if (nameB) nameB.textContent = "Daeseung Park";
  const sumTag = doc.querySelector(".summary-box .tag"); if (sumTag) sumTag.textContent = "1-min summary";
  const prose = doc.querySelector(".prose");
  if (prose) prose.insertAdjacentHTML("beforebegin", bannerHTML());
  return a;
}

/* ---- 한 페이지 처리 --------------------------------------------------------- */
function renderEnPage(relPath) {
  const absPath = path.join(ROOT, relPath);
  const original = readFileSync(absPath, "utf8");
  const source = stripMarkers(original);
  const fileDir = path.dirname(absPath);
  const koDir = path.posix.dirname(relPath) === "." ? "" : path.posix.dirname(relPath);
  const enDir = "en" + (koDir ? "/" + koDir : "");
  const url = SITE_ORIGIN + "en/" + relPath;

  const virtualConsole = new VirtualConsole();
  const errors = [];
  virtualConsole.on("jsdomError", (e) => errors.push(e.message || String(e)));

  const dom = new JSDOM(source, { url, runScripts: "dangerously", pretendToBeVisual: true, virtualConsole });
  const win = dom.window;
  installShims(win);
  win.I18N_EN = I18N;
  for (const sp of scriptPaths(source, fileDir)) {
    let code; try { code = readFileSync(sp.abs, "utf8"); } catch { continue; }
    win.eval(code);
  }
  const doc = win.document;

  /* ---- 정적 본문 영문화 ---- */
  translateChrome(doc);
  const isArticle = /^articles\/[^/]+\/index\.html$/.test(relPath);
  const isWork = /^works\/[^/]+\/index\.html$/.test(relPath);
  const isNotice = /^notices\/[^/]+\/index\.html$/.test(relPath);
  const rootPage = path.posix.dirname(relPath) === "." ? relPath : null;

  let headCfg = {};
  if (rootPage === "index.html") {
    translateIndex(doc);
    headCfg = { desc: SH["index.html"].metaDescription };
  } else if (rootPage) {
    translateSubpage(doc, rootPage);
    const S = SH[rootPage] || {};
    const fallbackDesc = { "activity.html": "A photo record of Daeseung Park's conferences, demos, and events.", "notices.html": "Announcements, notices, and usage guides from the Daeseung Park journal.", "profile.html": "Daeseung Park — AI & software systems engineer at KAIST. Full profile: career, publications, patents, software, and research projects.", "profile_full.html": "The complete profile of Daeseung Park — career, education, publications, patents, software, projects, awards, and certifications." };
    headCfg = { desc: S.metaDescription || fallbackDesc[rootPage] };
    if (rootPage === "profile.html" || rootPage === "profile_full.html") {
      const host = doc.querySelector(".page-hero .container-x") || doc.querySelector("section .container-x");
      if (host) host.insertAdjacentHTML("beforeend", bannerHTML());
    }
  } else if (isArticle) {
    const slug = relPath.split("/")[1];
    const a = translateArticleDetail(doc, slug);
    headCfg = { title: a.title ? a.title + " - Daeseung Park Journal" : null, ogTitle: a.title, desc: a.deck };
  } else if (isWork) {
    const titleEl = doc.querySelector(".wd-title");
    const firstSum = doc.querySelector(".wd-summary p") || doc.querySelector(".wd-abstract");
    const ogTitle = titleEl ? titleEl.textContent.trim() : null;
    let desc = firstSum ? firstSum.textContent.trim().replace(/\s+/g, " ") : null;
    if (desc && desc.length > 200) desc = desc.slice(0, 197).replace(/\s+\S*$/, "") + "…";
    headCfg = { title: ogTitle ? ogTitle + " - Daeseung Park Journal" : null, ogTitle, desc };
  } else if (isNotice) {
    const nt = doc.querySelector(".notice-title");
    const t = nt ? nt.textContent.trim() : null;
    headCfg = { title: t ? t + " - Daeseung Park Journal" : null, ogTitle: t, desc: t };
  }

  translateHead(doc, headCfg);

  /* ---- SEO 다국어 head 주입(hreflang · og:locale:alternate · JSON-LD inLanguage=en) ---- */
  addEnSeoI18n(doc, koPathOf(relPath));

  /* ---- i18n-en.js 주입(main.js 앞) ---- */
  const scripts = Array.from(doc.querySelectorAll("script[src]"));
  const mainScript = scripts.find((s) => /main\.js(\?|$)/.test(s.getAttribute("src") || ""));
  if (mainScript && !doc.querySelector('script[src*="i18n-en.js"]')) {
    const s = doc.createElement("script");
    // main.js 의 KO-상대 경로(예: ../../assets/js/main.js)를 그대로 물려받아
    // 파일명만 교체 → rewriteAssets 가 main.js 와 동일하게 /assets 로 보정.
    // (예전 고정값 "assets/js/i18n-en.js" 는 하위 상세페이지에서 잘못된 경로로 404 발생)
    const mainSrc = mainScript.getAttribute("src") || "assets/js/main.js";
    s.setAttribute("src", mainSrc.replace(/main\.js(\?[^"]*)?$/, "i18n-en.js"));
    mainScript.parentNode.insertBefore(s, mainScript);
  }

  /* ---- 자산 경로 보정 ---- */
  rewriteAssets(doc, koDir, enDir);

  /* ---- 프리렌더 마커(런타임 재렌더 스킵) ---- */
  doc.documentElement.setAttribute("data-prerendered", "1");

  /* ---- 기록 ---- */
  const outAbs = path.join(ROOT, "en", relPath);
  mkdirSync(path.dirname(outAbs), { recursive: true });
  writeFileSync(outAbs, "<!DOCTYPE html>\n" + doc.documentElement.outerHTML + "\n", "utf8");
  win.close();
  return { relPath, errors };
}

/* ---- main ------------------------------------------------------------------- */
function run() {
  writeI18nAsset();
  const pages = collectPages();
  let ok = 0, errCount = 0;
  for (const p of pages) {
    try { const r = renderEnPage(p); ok++; if (r.errors.length) { errCount += r.errors.length; r.errors.forEach((m) => console.error("  jsdomError@en/" + p + ":", m)); } }
    catch (e) { console.error("FAIL en/" + p, e.message); errCount++; }
  }
  const lr = injectEnLandingSeo();
  console.log("en/landing.html SEO i18n: " + (lr.done ? (lr.changed ? "적용" : "변경없음") : "건너뜀(head 앵커 없음)"));
  console.log("영문 미러 생성 완료: /en/ 아래 " + ok + " 페이지, 오류 " + errCount + "건 (assets/js/i18n-en.js 갱신)");
  if (errCount) process.exitCode = 1;
}
run();
