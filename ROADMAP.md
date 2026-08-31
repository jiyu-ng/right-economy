# 옳은경제 로드맵 🗺️

> ⚠️ 옛 브랜드명은 **경제한입**이었다. 리브랜딩 후에도 이 제목이 남아 있었다(2026-08-31 정정).
> **`[ ]` 를 「안 됐다」로 읽지 말 것** — 아래 세 항목이 이미 끝났는데 「← 지유」로 남아 있었다.

자동 기능개선 잡(`scripts/auto-feature.sh`)이 이 목록에서 다음 할 일을 고른다.
처리하면 `[x]`로 체크하고, 새 아이디어는 자유롭게 추가.

## 우선순위: SEO · 수익화
- [x] 배포 도메인 (2026-08-31 실측): `astro.config` `site: 'https://right-economy.com'` · `robots.txt` 의 `Sitemap:` 도 같은 도메인 · **canonical 649/649 전부 right-economy.com**
- [x] AdSense 배선 (2026-08-31 실측): `consts.ts` 에 실제 client 값이 들어 있고 렌더된 HTML 에도 나온다. ⚠️ **배선 완료 ≠ 승인 완료** — 승인 상태는 코드로 못 본다
- [x] Search Console (2026-08-31 실측): `GSC_VERIFICATION` 실값 + 렌더 HTML 에 `google-site-verification` 메타태그 존재. ⚠️ **sitemap 제출·색인 상태는 콘솔 쪽이라 코드로 못 본다**
- [x] 글 간 내부 링크 / "관련 글" 섹션 (체류시간·색인↑)
- [x] 카테고리 페이지 (`/category/[name]`)
- [x] 태그 페이지 (`/tags/[tag]`)
- [x] RSS 피드 (`@astrojs/rss`)
- [x] BreadcrumbList JSON-LD (검색결과 경로 표시)
- [ ] 글별 OG 이미지 자동 생성

## 사용자 경험 · 성능
- [ ] 글 목록 검색/필터
- [x] 404 페이지
- [ ] 다크모드
- [ ] 폰트 로딩 최적화 (jsDelivr CDN → self-host 검토) — preconnect는 적용됨
- [ ] 접근성 점검 — 1차 완료(본문 바로가기·:focus-visible·prefers-reduced-motion). 남음: 색 대비·aria·시맨틱 태그

## 완료
- [x] SEO 기반: sitemap · robots.txt · Article/WebSite JSON-LD · AdSense/GSC 배선 (PR #19)
- [x] RSS 피드: `@astrojs/rss` + autodiscovery `<link>` 태그 (PR #?)

## 🔍 SEO 감사 — 이미 확인된 것 (다시 파지 말 것)

> 이 절은 **SEO 감사 슬롯이 같은 자리를 반복해서 파는 걸 막으려고** 있다.
> 2026-08-31 감사에서 아래 셋을 다시 팠고, **셋 다 이미 답이 있거나 내 측정 도구 문제**였다.

- **태그 페이지가 sitemap 에 330개 없다** → 🟢 **의도된 동작.** 글 2개 미만 태그는 thin content 라 sitemap 에서만 뺀다(페이지 자체는 생성·접근 가능). 2026-08-31 전수 검사에서 **양방향 위반 0** — 1개짜린데 포함된 것 0, 2개 이상인데 제외된 것 0. `S&P`·`S&P500` 이 빠진 것도 `&` 탓이 아니라 **글이 1개**라서다.
- **고아 페이지 2개(`/tags/S&P/` 등)** → 🟢 **오탐.** 링크는 `href="/tags/S&amp;P/"` 로 **올바르게 이스케이프**돼 있고 내 정규식이 `&amp;` 를 못 잡은 것이다. 라이브도 raw·인코딩 둘 다 200.
- **`dist/sitemap-0.xml` 이 없다** → 🟢 **오탐.** 저장소 밖에서 `grep` 을 돌렸다(`cd` 누락). 39KB 로 정상 존재.

📌 **SEO 감사에서 🔴 이 뜨면 대상보다 내 측정 도구를 먼저 의심한다.** 2026-08-29 감사에서도 622페이지 실측 🔴 2건이 **둘 다 파서 오탐**이었다. 같은 패턴이 두 번 반복됐다.
