/* =============================================================================
   D. PARK Journal — 다국어 sitemap.xml 생성기 (KO + EN 통합, 정석 hreflang)
   -----------------------------------------------------------------------------
   각 페어(koPath)마다 KO(/…)·EN(/en/…) 두 <url> 을 내보내고, 두 항목 모두에
   동일한 xhtml:link rel="alternate" hreflang="ko|en|x-default" 대체 링크를 넣는다
   (Google 권장 양방향 다국어 사이트맵). 자산이 파일시스템에 실재하는 페이지만 수집.

   포함 정책:
     - 루트 인덱스/서브페이지(EN 미러 존재) + works/<slug>/ + notices/<id>/ + articles/<slug>/
       + landing.html  → 전부 KO·EN 페어(hreflang 3종).
     - works/detail.html(레거시 쿼리 라우터) → 기존대로 KO 단독 URL(대체 링크 없음).
   프로필 전체이력(profile_full.html)도 자기-canonical·EN 미러가 있어 페어로 포함.

   실행: node tools/gen-sitemap.mjs   (루트 sitemap.xml 재생성, idempotent)
   ============================================================================= */
import { writeFileSync, existsSync } from "node:fs";
import { globSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const BASE = "https://daeseungpark.com";
const LASTMOD = "2026-07-27";

/* 페어 대상 koPath 목록(순서 = 사이트맵 노출 순서) */
function collectPairedPaths() {
  /* sitemap 제외 목록(파일은 실재하나 색인에서 뺌). profile_full.html은 상세 전체이력
     내부 전용 페이지라 KO·EN 모두 사이트맵에서 제외(재생성해도 다시 안 들어감). */
  const EXCLUDE = new Set(["/profile_full.html"]);
  const roots = [
    "/", "/profile.html", "/profile_full.html", "/articles.html", "/portfolio.html",
    "/works.html", "/research.html", "/activity.html", "/notices.html", "/landing.html",
  ].filter((p) => !EXCLUDE.has(p)).filter((p) => {
    if (p === "/") return existsSync(path.join(ROOT, "index.html"));
    return existsSync(path.join(ROOT, p.slice(1)));
  });
  const dirToPath = (rel) => "/" + rel.replace(/index\.html$/, "").split(path.sep).join("/");
  const works = globSync("works/*/index.html", { cwd: ROOT }).map(dirToPath).sort();
  const notices = globSync("notices/*/index.html", { cwd: ROOT }).map(dirToPath).sort();
  const articles = globSync("articles/*/index.html", { cwd: ROOT }).map(dirToPath).sort();
  return [...roots, ...works, ...notices, ...articles];
}

function metaFor(koPath) {
  if (koPath === "/") return { changefreq: "weekly", priority: "1.0" };
  if (koPath === "/landing.html") return { changefreq: "monthly", priority: "0.7" };
  if (/^\/[^/]+\.html$/.test(koPath)) return { changefreq: "weekly", priority: "0.8" };
  return { changefreq: "monthly", priority: "0.6" }; // 상세(디렉터리)
}

/* 한 페어에서 KO·EN 두 <url> 문자열 생성(둘 다 동일 alternate 3종 포함) */
function pairUrls(koPath) {
  const koHref = BASE + koPath;
  const enHref = BASE + "/en" + koPath;
  const { changefreq, priority } = metaFor(koPath);
  const alts = [
    '    <xhtml:link rel="alternate" hreflang="ko" href="' + koHref + '"/>',
    '    <xhtml:link rel="alternate" hreflang="en" href="' + enHref + '"/>',
    '    <xhtml:link rel="alternate" hreflang="x-default" href="' + koHref + '"/>',
  ].join("\n");
  const one = (loc) =>
    "  <url>\n" +
    "    <loc>" + loc + "</loc>\n" +
    alts + "\n" +
    "    <lastmod>" + LASTMOD + "</lastmod>\n" +
    "    <changefreq>" + changefreq + "</changefreq>\n" +
    "    <priority>" + priority + "</priority>\n" +
    "  </url>";
  return [one(koHref), one(enHref)];
}

/* 대체 링크 없는 단독 URL(레거시 detail.html 등) */
function soloUrl(loc, changefreq, priority) {
  return "  <url>\n" +
    "    <loc>" + loc + "</loc>\n" +
    "    <lastmod>" + LASTMOD + "</lastmod>\n" +
    "    <changefreq>" + changefreq + "</changefreq>\n" +
    "    <priority>" + priority + "</priority>\n" +
    "  </url>";
}

function run() {
  const paired = collectPairedPaths();
  const koBlocks = [];
  const enBlocks = [];
  for (const p of paired) {
    const [ko, en] = pairUrls(p);
    koBlocks.push(ko);
    enBlocks.push(en);
  }
  const extra = [];
  if (existsSync(path.join(ROOT, "works", "detail.html"))) {
    extra.push(soloUrl(BASE + "/works/detail.html", "monthly", "0.3")); // 레거시 라우터(기존대로)
  }
  // KO 전부 → EN 전부 → 레거시 순
  const body = [...koBlocks, ...enBlocks, ...extra].join("\n");
  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n' +
    '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
    body + "\n" +
    "</urlset>\n";
  writeFileSync(path.join(ROOT, "sitemap.xml"), xml, "utf8");
  const total = koBlocks.length + enBlocks.length + extra.length;
  console.log("sitemap.xml 재생성: 페어 " + paired.length + "개 → KO " + koBlocks.length +
    " + EN " + enBlocks.length + " + 단독 " + extra.length + " = 총 " + total + " URL");
}
run();
