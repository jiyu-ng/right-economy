// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import remarkCjkFriendly from 'remark-cjk-friendly';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// 글별 publishedDate를 읽어 sitemap <lastmod>에 채운다. 하루 2회 발행되는
// 사이트라 정확한 갱신일이 검색엔진 크롤 우선순위·신선도 판단에 도움을 준다.
// (의존성 없이 frontmatter만 가볍게 파싱 — 빌드 시 1회 실행)
//
// 글 상세뿐 아니라 허브 페이지(홈·카테고리·태그)도 lastmod를 채운다.
// 이 페이지들은 새 글이 발행될 때마다 목록이 바뀌므로, 가장 최근에 묶인
// 글의 발행일을 lastmod로 주면 검색엔진이 "허브가 갱신됐다"는 신선도 신호를
// 받아 재크롤 우선순위를 높인다. (경로별 최신 발행일을 누적해서 계산)
const POSTS_DIR = fileURLToPath(new URL('./src/content/posts', import.meta.url));
const lastmodByPath = new Map();

// 경로에 대해 더 최근 날짜면 갱신 (허브는 여러 글이 매핑되므로 max를 취함)
const bumpLastmod = (path, date) => {
  const prev = lastmodByPath.get(path);
  if (!prev || date > prev) lastmodByPath.set(path, date);
};

for (const file of readdirSync(POSTS_DIR)) {
  if (!file.endsWith('.md')) continue;
  const slug = file.replace(/\.md$/, '');
  const raw = readFileSync(`${POSTS_DIR}/${file}`, 'utf8');
  const m = raw.match(/^publishedDate:\s*"?(\d{4}-\d{2}-\d{2})"?/m);
  if (!m) continue;
  const date = m[1];

  // 글 상세
  bumpLastmod(`/posts/${slug}/`, date);
  // 홈(전체 목록)
  bumpLastmod('/', date);

  // 카테고리 허브 — 키는 디코드된(사람이 읽는) 경로로 저장하고, serialize에서
  // sitemap URL 경로를 디코드해 대조한다. Astro의 URL 인코딩 방식과 무관하게 매칭.
  const cat = raw.match(/^category:\s*"?([^"\n]+?)"?\s*$/m);
  if (cat) bumpLastmod(`/category/${cat[1].trim()}/`, date);

  // 태그 허브 — tags: ["a", "b"] 배열을 파싱해 각 태그 페이지에 반영
  const tagsRaw = raw.match(/^tags:\s*\[([^\]]*)\]/m);
  if (tagsRaw) {
    for (const t of tagsRaw[1].split(',')) {
      const tag = t.trim().replace(/^["']|["']$/g, '');
      if (tag) bumpLastmod(`/tags/${tag}/`, date);
    }
  }
}

// 로컬 SVG(/images/...)의 고유 크기를 viewBox/width·height에서 읽어온다.
// 빌드 시 1회 파일을 읽어 캐시(같은 이미지 여러 글에 재사용). 못 읽으면 null.
const PUBLIC_DIR = fileURLToPath(new URL('./public', import.meta.url));
const svgDimCache = new Map();
function svgIntrinsicSize(src) {
  if (typeof src !== 'string' || !src.startsWith('/') || !src.toLowerCase().endsWith('.svg')) {
    return null;
  }
  if (svgDimCache.has(src)) return svgDimCache.get(src);
  let dim = null;
  try {
    const head = readFileSync(PUBLIC_DIR + src, 'utf8').slice(0, 800);
    // width="720" height="430" 우선, 없으면 viewBox의 3·4번째 값(가로·세로)
    let m = head.match(/<svg[^>]*\bwidth="(\d+(?:\.\d+)?)"[^>]*\bheight="(\d+(?:\.\d+)?)"/i);
    if (!m) {
      const vb = head.match(/viewBox="\s*[\d.-]+\s+[\d.-]+\s+([\d.]+)\s+([\d.]+)/i);
      if (vb) m = [null, vb[1], vb[2]];
    }
    if (m) dim = { width: Math.round(Number(m[1])), height: Math.round(Number(m[2])) };
  } catch {
    // 파일이 없거나 읽기 실패 → 크기 주입 생략(안전)
  }
  svgDimCache.set(src, dim);
  return dim;
}

// 본문 이미지 로딩·안정성 최적화(rehype): 글마다 시각자료 2~4개가 들어가는데
// 마크다운 렌더 결과 <img>에는 loading/decoding/크기 속성이 없다.
// - 첫 이미지는 LCP 후보라 eager, 나머지는 lazy로 초기 로드 부담을 줄이고
//   모든 이미지에 decoding="async"로 디코딩이 메인 스레드를 막지 않게 한다.
// - 로컬 SVG는 고유 width/height를 채워, 이미지가 로드되기 전에도 브라우저가
//   자리를 미리 잡게 해 레이아웃 시프트(CLS)를 없앤다. CSS(width:100%;height:auto)가
//   실제 표시 크기를 정하므로 값은 종횡비 계산용으로만 쓰인다.
// (unist 등 외부 의존성 없이 hast 트리를 직접 순회)
function rehypeImgLoading() {
  return (tree) => {
    let seen = 0;
    const walk = (node) => {
      if (node.type === 'element' && node.tagName === 'img') {
        node.properties = node.properties || {};
        // 작성자가 명시한 값은 존중하고, 없을 때만 기본값을 채운다.
        if (node.properties.decoding == null) node.properties.decoding = 'async';
        if (node.properties.loading == null) {
          node.properties.loading = seen === 0 ? 'eager' : 'lazy';
        }
        // 크기 미지정 시 로컬 SVG 고유 크기 주입(CLS 방지). 한쪽이라도 있으면 존중.
        if (node.properties.width == null && node.properties.height == null) {
          const dim = svgIntrinsicSize(node.properties.src);
          if (dim) {
            node.properties.width = dim.width;
            node.properties.height = dim.height;
          }
        }
        seen += 1;
      }
      if (node.children) for (const child of node.children) walk(child);
    };
    walk(tree);
  };
}

// https://astro.build/config
export default defineConfig({
  // Cloudflare Pages + 커스텀 도메인: https://right-economy.com/ (루트 서빙, base 없음)
  // repo = right-economy/right-economy.github.io. (2026-08-18 GitHub Pages→Cloudflare Pages 이전, 색인 문제 해결)
  site: 'https://right-economy.com',
  markdown: {
    // 한국어 등 CJK 문자 옆의 볼드/이탤릭이 깨지는 CommonMark 이슈 해결.
    // 예: **자산배분(Asset Allocation)**이라고 처럼 닫는 ** 뒤에 한글이 바로
    // 붙어도 정상 볼드 처리 (CommonMark 기본은 리터럴 ** 로 새어나옴).
    remarkPlugins: [remarkCjkFriendly],
    rehypePlugins: [rehypeImgLoading],
  },
  integrations: [
    // 빌드 시 sitemap-index.xml + sitemap-0.xml 자동 생성 (검색엔진 색인용)
    // 글 상세·허브(홈·카테고리·태그) URL에 발행일을 <lastmod>로 넣어 신선도 신호.
    sitemap({
      serialize(item) {
        // sitemap URL 경로를 디코드해 lastmodByPath(디코드 키)와 대조.
        const path = decodeURIComponent(new URL(item.url).pathname);
        const lastmod = lastmodByPath.get(path);
        if (lastmod) item.lastmod = lastmod;
        return item;
      },
    }),
  ],
});
