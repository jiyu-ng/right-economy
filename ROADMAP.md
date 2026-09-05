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

- **`<img>` 691개에 alt 가 비어 있다** → 🟢 **의도된 동작이고 고치면 안 된다.** 전부 헤더 로고
  (`/mascot/logo.png`) 하나다. 링크 구조가 `<a class="logo"><img alt=""><span>옳은경제</span></a>` 라
  **옆 텍스트가 이미 링크 이름을 읽어준다.** alt 를 채우면 스크린리더가 "옳은경제 옳은경제"로 중복 낭독한다.
  장식 이미지에 `alt=""` 는 WAI-ARIA 권장 처리다.
- **고아 글(어디서도 링크 안 되는 posts)** → 🟢 **0건** (2026-09-04, dist 191편 전수).
  측정: 모든 dist HTML 에서 `/posts/<slug>/` 링크를 수집해 자기 자신 제외 후 inbound 0 인 글을 셈.
- **h1 이 0개인 페이지 1건** → 🟢 `google9722f43dfe1b8a63.html` (구글 소유확인 파일). 정상.


- **JSON-LD 의 `@type` 이 696개 전부 비어 있다** → 🟢 **오탐.** 최상위가 `@context` + **`@graph` 배열**
  구조라 최상위에 `@type` 이 없는 게 정상이다. `@graph` 를 펼쳐 세면 Article 194 · BreadcrumbList 695 ·
  CollectionPage 498 · ItemList 499 · Organization 196 이고 **Article 필수 필드 누락 0건**
  (headline·datePublished·author·publisher·image·mainEntityOfPage·dateModified 전부 존재).
- **`<title>` 이 65자를 넘는 글 2건** → 🟢 **오탐.** raw HTML 을 세서 `&#39;` (5자) 를 1자로 안 셌다.
  실제 렌더 길이는 73→57 · 67→51 로 **둘 다 60자 이내**다. 📌 **문자 수를 셀 땐 엔티티를 먼저 푼다.**
- **sitemap 과 실제 페이지 대조** → 🟢 **완전 일치** (2026-09-05, dist 699 HTML).
  `sitemap URL 362 = robots meta 가 index 인 페이지 362`, **sitemap 에 실린 noindex 0 · index 인데 누락 0.**
  ⚠️ 첫 측정에서 **양쪽이 똑같이 154** 로 나왔는데 그게 일치가 아니라 **고장**이었다 — sitemap 은
  퍼센트 인코딩(`%EA%B2%BD…`)이고 파일명은 한글이라 `unquote` 없이 대조했다. **A/B 가 완벽히 같으면
  일치가 아니라 도구 고장을 먼저 의심한다.**

📌 **2026-09-05 감사 결론: 실질 이슈 0건.** 메타태그(중복 title 0 · 중복 description 0 · 누락 1건은
구글 소유확인 파일) · canonical(698/699, 상대경로 0) · OG·트위터 이미지(698) · JSON-LD · sitemap 정합
전부 통과. **이 슬롯에서 뜬 🔴 3건이 전부 측정 도구 문제였다** — 세 번째 반복이다.

- **heading 계층** → 🟢 **건너뛴 페이지 0건** (2026-09-05, dist 706 전수). `h2→h4` 같은 도약 없음.
- **신규 글이 고아로 시작하나** → 🟢 **아니다.** 발행 당일 글 3편의 inbound가 각 **12·15·23**
  (다른 글·태그·카테고리·홈에서 자동으로 걸린다). posts 196편 전체 고아 **0건**.
  📌 신규 글은 유입이 늦어 고아처럼 보이기 쉬운데, **링크 구조상 발행 즉시 붙는다.**
- 🔴 **`dist/cards/` 32MB 를 「이미지 최적화 대상」으로 착각하지 말 것** (2026-09-05 실측).
  ```
  cards 아래 HTML        0개
  sitemap 포함           0개
  글 본문에서 임베드      0개   ← SEO/LCP 경로에 아예 없음
  ```
  인스타 발행용 호스팅 자산이다([[project_econ_instagram_publish]]). **dist 40MB 중 32MB가 여기라
  「사이트가 무겁다」로 읽히지만 방문자는 한 장도 안 받는다.** 본문 이미지는 글당 png 1(헤더 로고)
  + svg 155(본문 도표)뿐이다. 측정: `dist/posts/**` 에서 `src="/cards/…"` 수집 → 0건.

📌 **SEO 감사에서 🔴 이 뜨면 대상보다 내 측정 도구를 먼저 의심한다.** 2026-08-29 감사에서도 622페이지 실측 🔴 2건이 **둘 다 파서 오탐**이었다. 같은 패턴이 두 번 반복됐다.
