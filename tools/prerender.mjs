/* =============================================================================
   D. PARK Journal — 완전 정적화(프리렌더) 생성기
   -----------------------------------------------------------------------------
   목적: main.js 가 런타임에 빈 컨테이너로 주입하던 목록·상세·홈·공용 크롬(네비/
   퀵링크/티커/푸터)을, 빌드 시점에 HTML 로 "구워 넣어" 비-JS 크롤러도 실제 콘텐츠와
   내부 링크를 수집할 수 있게 한다. 로직 발산을 막기 위해 **main.js 를 그대로 실행**해
   렌더된 컨테이너의 innerHTML 을 정적으로 써 넣는다(가장 충실한 방식).

   방식(jsdom):
     1) 각 HTML 을 jsdom 으로 로드(스크립트 미자동로드).
     2) 브라우저 API shim(matchMedia·IntersectionObserver·scrollTo·rAF) 주입.
     3) 페이지가 참조하는 <script src> 들을 순서대로 읽어 window.eval 로 실행
        (data.js → content-*.js/notices.js → articles.js → main.js).
        이때 소스에 프리렌더 마커가 없으므로 main.js 가 평소처럼 전부 렌더한다.
     4) 렌더된 DOM 에서 대상 컨테이너의 innerHTML 을 추출.
     5) 원본 HTML 문자열에 **해당 컨테이너만 국소 치환**(문자열 수술)하고
        <html data-prerendered="1"> 마커를 남긴다. head·본문 등 나머지는 바이트 불변.
     * main.js 는 로드 시 이 마커를 보면 초기 렌더를 건너뛰고 상호작용만 바인딩한다.

   재실행: 데이터가 바뀌면 다시 돌리면 된다(idempotent). 실행 전 기존 마커/구운 내용을
   벗겨 깨끗한 상태에서 다시 렌더하므로 몇 번을 돌려도 같은 결과가 된다.

   실행법 (v75 폴더에서):
       npm install jsdom            # 최초 1회 (node_modules 는 배포 대상 아님)
       node tools/prerender.mjs     # 전체 페이지 프리렌더
   ============================================================================= */

import { JSDOM, VirtualConsole } from "jsdom";
import { readFileSync, writeFileSync } from "node:fs";
import { globSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");        // v75 폴더 루트
const SITE_ORIGIN = "https://daeseungpark.com/";

/* ---- 프리렌더 대상 페이지 수집 ---------------------------------------------
   랜딩(landing.html: 자기완결형)과 works/detail.html(쿼리형 레거시 라우터)은 제외. */
function collectPages() {
  const rootPages = [
    "index.html", "articles.html", "portfolio.html", "research.html",
    "activity.html", "notices.html", "works.html", "profile.html", "profile_full.html",
  ];
  const detail = [
    ...globSync("works/*/index.html", { cwd: ROOT }),
    ...globSync("notices/*/index.html", { cwd: ROOT }),
    ...globSync("articles/*/index.html", { cwd: ROOT }),
  ].map((p) => p.split(path.sep).join("/"));
  return [...rootPages, ...detail];
}

/* ---- 대상 컨테이너 정의 -----------------------------------------------------
   sel   : jsdom 렌더 DOM 에서 innerHTML 을 읽을 CSS 선택자
   sig   : 원본 HTML 문자열에서 이 요소의 여는 태그를 찾는 고유 시그니처
   mode  : "inner"(기본, innerHTML 치환) | "promo"(hidden 제거) | "footer"(id=contact 보장)
   컨테이너가 그 페이지에 없으면 자동 skip. */
const CONTAINERS = [
  // 공용 크롬(모든 페이지) — 비-JS 크롤러 내부 링크 확보
  { sel: ".tb-links",         sig: 'class="tb-links"' },
  { sel: ".main-nav",         sig: 'class="main-nav"' },
  { sel: "#mobileNav",        sig: 'id="mobileNav"' },
  { sel: "footer.site-footer", sig: 'class="site-footer', mode: "footer" },
  { sel: "#tickerItems",      sig: 'id="tickerItems"' },
  // 홈
  { sel: "#latestGrid",       sig: 'id="latestGrid"' },
  { sel: "#homeFeature",      sig: 'id="homeFeature"' },
  { sel: "#homeActivity",     sig: 'id="homeActivity"' },
  { sel: "#homePortfolio",    sig: 'id="homePortfolio"' },
  { sel: "#homeProjects",     sig: 'id="homeProjects"' },
  { sel: "#homePromo",        sig: 'id="homePromo"',  mode: "promo" },
  { sel: "#homePromo2",       sig: 'id="homePromo2"', mode: "promo" },
  // works.html
  { sel: "#pubList",          sig: 'id="pubList"' },
  { sel: "#patentList",       sig: 'id="patentList"' },
  { sel: "#softwareList",     sig: 'id="softwareList"' },
  { sel: "#worksCount",       sig: 'id="worksCount"' },
  // portfolio.html
  { sel: "#pfFilter",         sig: 'id="pfFilter"' },
  { sel: "#portfolioGrid",    sig: 'id="portfolioGrid"' },
  // research.html
  { sel: "#projectList",      sig: 'id="projectList"' },
  { sel: "#projectCount",     sig: 'id="projectCount"' },
  // activity.html
  { sel: "#galleryGrid",      sig: 'id="galleryGrid"' },
  // notices.html
  { sel: "#noticeBoard",      sig: 'id="noticeBoard"' },
  { sel: "#noticeCount",      sig: 'id="noticeCount"' },
  { sel: "#noticePager",      sig: 'id="noticePager"' },
  // articles.html (기고문 게시판)
  { sel: "#boardFilter",      sig: 'id="boardFilter"' },
  { sel: "#boardGrid",        sig: 'id="boardGrid"' },
  { sel: "#boardCount",       sig: 'id="boardCount"' },
  { sel: "#pager",            sig: 'id="pager"' },
  // profile / profile_full
  { sel: "#profilePubs",      sig: 'id="profilePubs"' },
  { sel: "#profilePatents",   sig: 'id="profilePatents"' },
  { sel: "#profileSoftware",  sig: 'id="profileSoftware"' },
  { sel: "#profileProjects",  sig: 'id="profileProjects"' },
  { sel: "#profileRecentWork", sig: 'id="profileRecentWork"' },
  // 상세
  { sel: "#workDetail",       sig: 'id="workDetail"' },
  { sel: "#noticeDetail",     sig: 'id="noticeDetail"' },
  // 기고문 페이지의 관련글·이전/다음(공용 크롬 성격 — 본문은 미변경)
  { sel: "#readNext",         sig: 'id="readNext"' },
  { sel: "#postNav",          sig: 'id="postNav"' },
];

/* 히어로 통계는 [data-stat] <b> 의 텍스트만 갱신(index.html 전용) */
const STAT_KEYS = ["publications", "patents-sw", "projects"];

/* ===========================================================================
   SEO 다국어(i18n) head 주입 — hreflang · og:locale:alternate · JSON-LD inLanguage
   ---------------------------------------------------------------------------
   KO/EN 미러가 1:1 페어이므로 각 페이지 head 에 상호 hreflang(ko/en/x-default)과
   상대 언어 og:locale:alternate 를 넣고, JSON-LD inLanguage 를 언어에 맞게 맞춘다.
   마커 주석(<!-- seo-i18n:start/end -->)으로 감싸 재실행 시 벗겨내고 재삽입(idempotent).
   =========================================================================== */
const SEO_BASE = "https://daeseungpark.com";

/* relPath → KO canonical 경로. index.html→"/", foo.html→"/foo.html",
   works/<slug>/index.html→"/works/<slug>/" 등(디렉터리 상세는 후행 슬래시). */
function koPathOf(relPath) {
  if (relPath === "index.html") return "/";
  if (relPath.endsWith("/index.html")) return "/" + relPath.slice(0, relPath.length - "index.html".length);
  return "/" + relPath;
}
function hreflangLines(koPath) {
  const ko = SEO_BASE + koPath;
  const en = SEO_BASE + "/en" + koPath; // "/"→"/en/", "/foo.html"→"/en/foo.html"
  return [
    '<link rel="alternate" hreflang="ko" href="' + ko + '">',
    '<link rel="alternate" hreflang="en" href="' + en + '">',
    '<link rel="alternate" hreflang="x-default" href="' + ko + '">',
  ];
}
function stripSeoBlock(html) {
  return html.replace(/\n?<!-- seo-i18n:start -->[\s\S]*?<!-- seo-i18n:end -->/g, "");
}
/* seo 블록 = hreflang 3종 + og:locale:alternate(상대 언어) */
function seoBlock(koPath, lang) {
  const alt = lang === "ko" ? "en_US" : "ko_KR";
  return ["<!-- seo-i18n:start -->"]
    .concat(hreflangLines(koPath))
    .concat(['<meta property="og:locale:alternate" content="' + alt + '">', "<!-- seo-i18n:end -->"])
    .join("\n");
}
/* JSON-LD 의 inLanguage 를 언어에 맞게 설정(스크립트 블록 단위, idempotent) */
function setJsonLdLang(html, lang) {
  return html.replace(/(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/g, (m, a, body, c) => {
    let b = body;
    if (/"inLanguage"\s*:/.test(b)) b = b.replace(/"inLanguage"\s*:\s*"[^"]*"/g, '"inLanguage":"' + lang + '"');
    else b = b.replace(/(\{"@context":"https:\/\/schema\.org",)/, '$1"inLanguage":"' + lang + '",');
    return a + b + c;
  });
}
/* canonical 뒤에 seo 블록 삽입 + JSON-LD inLanguage 교정 */
function injectSeoI18n(html, koPath, lang) {
  html = stripSeoBlock(html);
  const block = seoBlock(koPath, lang);
  const canRe = /(<link rel="canonical"[^>]*>)/;
  if (canRe.test(html)) html = html.replace(canRe, "$1\n" + block);
  return setJsonLdLang(html, lang);
}
/* landing.html 처럼 canonical/og:locale 이 아예 없는 자기완결형 페이지용 —
   canonical(자기) + hreflang + og:locale(자기) + alternate 를 한 블록으로 주입 */
function injectStandaloneSeo(absPath, koPath, lang) {
  let html;
  try { html = readFileSync(absPath, "utf8"); } catch { return { done: false }; }
  const original = html;
  html = stripSeoBlock(html);
  const selfHref = lang === "ko" ? SEO_BASE + koPath : SEO_BASE + "/en" + koPath;
  const selfLocale = lang === "ko" ? "ko_KR" : "en_US";
  const altLocale = lang === "ko" ? "en_US" : "ko_KR";
  const block = ["<!-- seo-i18n:start -->", '<link rel="canonical" href="' + selfHref + '">']
    .concat(hreflangLines(koPath))
    .concat([
      '<meta property="og:locale" content="' + selfLocale + '">',
      '<meta property="og:locale:alternate" content="' + altLocale + '">',
      "<!-- seo-i18n:end -->",
    ]).join("\n");
  const descRe = /(<meta name="description"[^>]*>)/;
  const titleRe = /(<title>[\s\S]*?<\/title>)/;
  if (descRe.test(html)) html = html.replace(descRe, "$1\n" + block);
  else if (titleRe.test(html)) html = html.replace(titleRe, "$1\n" + block);
  else return { done: false };
  const changed = html !== original;
  if (changed) writeFileSync(absPath, html, "utf8");
  return { done: true, changed };
}

/* ---- 브라우저 API shim ------------------------------------------------------ */
function installShims(win) {
  win.matchMedia = function () {
    return {
      matches: false, media: "", onchange: null,
      addListener() {}, removeListener() {},
      addEventListener() {}, removeEventListener() {}, dispatchEvent() { return false; },
    };
  };
  class IO { constructor() {} observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } }
  win.IntersectionObserver = IO;
  win.scrollTo = function () {};
  win.scroll = function () {};
  if (!win.requestAnimationFrame) win.requestAnimationFrame = function () { return 0; };
  if (!win.cancelAnimationFrame) win.cancelAnimationFrame = function () {};
}

/* ---- <script src> 순서대로 읽어 로컬 파일 경로로 해석 ------------------------ */
function scriptPaths(html, fileDir) {
  const re = /<script\s+src="([^"]+)"><\/script>/g;
  const out = [];
  let m;
  while ((m = re.exec(html)) !== null) {
    out.push(path.resolve(fileDir, m[1]));
  }
  return out;
}

/* ---- 문자열 수술: 시그니처가 속한 요소의 여는 태그를 찾아 범위 계산 ---------- */
function locateElement(html, sig) {
  const sigIdx = html.indexOf(sig);
  if (sigIdx < 0) return null;
  const tagStart = html.lastIndexOf("<", sigIdx);
  if (tagStart < 0) return null;
  const nameMatch = /^<([a-zA-Z][a-zA-Z0-9]*)/.exec(html.slice(tagStart));
  if (!nameMatch) return null;
  const tag = nameMatch[1];
  const openEnd = html.indexOf(">", sigIdx);
  if (openEnd < 0) return null;
  const openTag = html.slice(tagStart, openEnd + 1);
  // 같은 태그의 중첩을 세며 대응하는 닫는 태그 위치 탐색
  const openRe = new RegExp("<" + tag + "(\\s|>|/)", "gi");
  const closeRe = new RegExp("</" + tag + "\\s*>", "gi");
  let depth = 1;
  let cursor = openEnd + 1;
  while (depth > 0) {
    openRe.lastIndex = cursor;
    closeRe.lastIndex = cursor;
    const o = openRe.exec(html);
    const c = closeRe.exec(html);
    if (!c) return null; // malformed
    if (o && o.index < c.index) { depth++; cursor = o.index + 1; }
    else { depth--; cursor = c.index + (c[0].length); if (depth === 0) return { tagStart, openEnd, openTag, tag, closeStart: c.index }; }
  }
  return null;
}

function withMarker(openTag) {
  if (/\sdata-prerendered=/.test(openTag)) return openTag; // 이미 있음
  return openTag.replace(/>$/, ' data-prerendered="1">');
}

function spliceContainer(html, spec, innerHTML) {
  const loc = locateElement(html, spec.sig);
  if (!loc) return { html, done: false };
  let openTag = loc.openTag;
  if (spec.mode === "footer") {
    if (!/\sid="contact"/.test(openTag)) openTag = openTag.replace(/>$/, ' id="contact">');
  }
  if (spec.mode === "promo") {
    openTag = openTag.replace(/\shidden(?=[\s>])/, "");
  }
  openTag = withMarker(openTag);
  const next = html.slice(0, loc.tagStart) + openTag + innerHTML + html.slice(loc.closeStart);
  return { html: next, done: true };
}

/* ---- 기존 프리렌더 흔적 제거(idempotent 를 위해 렌더 전에 깨끗이) ----------
   data-prerendered 마커만 제거한다. 컨테이너 내부의 이전 구운 내용은 main.js 가
   렌더 시 innerHTML 로 덮어쓰므로 그대로 두어도 무방하지만, 추출 정확도를 위해
   마커 제거로 main.js 가 정상 렌더하도록만 보장한다. */
function stripMarkers(html) {
  return html.replace(/\sdata-prerendered="1"/g, "");
}

/* ---- 한 페이지 프리렌더 ----------------------------------------------------- */
function prerenderPage(relPath) {
  const absPath = path.join(ROOT, relPath);
  const original = readFileSync(absPath, "utf8");
  const cleanSource = stripMarkers(original);

  // jsdom URL: 루트 기준 경로로 location 을 맞춰 nav active/쿼리(없음)가 정확히 계산되게
  const url = SITE_ORIGIN + relPath;
  const fileDir = path.dirname(absPath);

  const virtualConsole = new VirtualConsole();
  const consoleErrors = [];
  virtualConsole.on("jsdomError", (e) => consoleErrors.push(e.message || String(e)));

  const dom = new JSDOM(cleanSource, {
    url,
    runScripts: "dangerously",
    pretendToBeVisual: true,
    virtualConsole,
  });
  const win = dom.window;
  installShims(win);

  // 페이지가 참조하는 스크립트를 순서대로 실행(외부 자동로드 없이 수동 eval)
  for (const sp of scriptPaths(cleanSource, fileDir)) {
    let code;
    try { code = readFileSync(sp, "utf8"); }
    catch { continue; }
    win.eval(code);
  }

  const doc = win.document;

  // 대상 컨테이너 추출 → 원본 문자열에 국소 치환
  let out = cleanSource;
  const baked = [];
  for (const spec of CONTAINERS) {
    const el = doc.querySelector(spec.sel);
    if (!el) continue;
    if (!out.includes(spec.sig)) continue; // 원본에 없으면 skip
    const inner = el.innerHTML;
    const r = spliceContainer(out, spec, inner);
    if (r.done) { out = r.html; baked.push(spec.sel); }
  }

  // 히어로 통계(index.html): [data-stat] 텍스트 갱신
  if (out.includes('data-stat="publications"')) {
    for (const key of STAT_KEYS) {
      const el = doc.querySelector('[data-stat="' + key + '"]');
      if (!el) continue;
      const val = el.textContent;
      out = out.replace(
        new RegExp('(data-stat="' + key.replace(/[-]/g, "\\-") + '"[^>]*>)([^<]*)(</b>)'),
        '$1' + val + '$3'
      );
    }
    baked.push("[data-stat]");
  }

  // SEO 다국어 head 주입(hreflang · og:locale:alternate · JSON-LD inLanguage=ko)
  out = injectSeoI18n(out, koPathOf(relPath), "ko");

  // <html> 에 프리렌더 마커
  out = out.replace(/<html(\s[^>]*)?>/, (mm, attrs) => {
    attrs = attrs || "";
    if (/\sdata-prerendered=/.test(attrs)) return mm;
    return "<html" + attrs + ' data-prerendered="1">';
  });

  dom.window.close();

  const changed = out !== original;
  if (changed) writeFileSync(absPath, out, "utf8");
  return { relPath, baked, changed, errors: consoleErrors };
}

/* ---- main ------------------------------------------------------------------- */
function run() {
  const pages = collectPages();
  let totalBaked = 0;
  let errorCount = 0;
  const rows = [];
  for (const p of pages) {
    let res;
    try { res = prerenderPage(p); }
    catch (e) { console.error("FAIL", p, e.message); errorCount++; continue; }
    totalBaked += res.baked.length;
    if (res.errors.length) { errorCount += res.errors.length; res.errors.forEach((m) => console.error("  jsdomError@" + p + ":", m)); }
    rows.push(`${res.changed ? "✓" : "·"} ${p}  [${res.baked.length}] ${res.baked.join(", ")}`);
  }
  console.log(rows.join("\n"));
  console.log(`\n프리렌더 완료: ${pages.length} 페이지, 구운 컨테이너 ${totalBaked}개, 오류 ${errorCount}건`);

  // 자기완결형 랜딩(프리렌더 대상 아님) — KO landing.html 에 SEO 다국어 head 주입
  const lr = injectStandaloneSeo(path.join(ROOT, "landing.html"), "/landing.html", "ko");
  console.log("landing.html SEO i18n: " + (lr.done ? (lr.changed ? "적용" : "변경없음") : "건너뜀(head 앵커 없음)"));

  if (errorCount) process.exitCode = 1;
}

run();
