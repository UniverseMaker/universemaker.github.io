/* ============================================================
   D. PARK Journal — Article Registry (DB 없이 관리하는 단일 데이터 소스)
   새 글을 추가하려면: (1) articles/<slug>/index.html 생성,
   (2) 아래 배열에 항목 하나 추가. 그러면 홈·Articles·관련글이 자동 갱신된다.
   - id: 게시판 번호 (클수록 최신). 정렬·이전/다음 글 기준.
   - cover: 그라데이션 클래스("fill-1"~"fill-7") 또는 이미지 경로
            (예: "articles/<slug>/images/cover.jpg"). 루트 기준 경로로 적는다.
   - path: 글 폴더 (루트 기준, 끝에 / 포함)
   ============================================================ */
window.ARTICLES = [
  /* ── 블로그 (blog: "블로그") — 블로그 전용 id 블록 101~ (v102). 전체보기·#latestGrid·티커·푸터·landing·#boardCount 제외 ── */
  {
    id: 111, slug: "claude-session-switcher", path: "articles/claude-session-switcher/",
    title: "클로드 코드세션 스위처: 계정을 바꿔도 대화는 그대로다",
    deck: "Claude 계정을 여러 개 쓰면 계정을 바꿀 때마다 어제까지 쓰던 대화가 사이드바에서 사라진다. 서버가 막는다는 통념을 믿고 한동안 포기했지만, 직접 뜯어보니 대화 원문은 컴퓨터에 하나뿐이었고 계정 폴더에 있던 것은 그 파일을 가리키는 포인터일 뿐이었다. 그 발견 하나에서 출발해, 모든 대화를 모든 계정에 연결하고 컴퓨터 단위로 백업해 다른 PC로 옮기는 Windows 도구를 만들었다. 무엇을 하는 도구인지, 어디에 쓰는지, 그리고 만들면서 낸 사고에서 무엇을 배웠는지 적는다.",
    cat: "Dev · 노트", catClass: "dark", catLabel: "개발 도구",
    date: "2026-09-30", read: "18분", cover: "articles/claude-session-switcher/images/cover.svg",
    tags: ["Claude", "Claude Code", "세션관리", "백업", "개발도구"],
    blog: "블로그"
  },
  {
    id: 110, slug: "windows11-classic-context-menu", path: "articles/windows11-classic-context-menu/",
    title: "윈도우11 우클릭 시 “추가옵션보기”를 기본으로 설정하기",
    deck: "윈도우11의 간소화된 우클릭 메뉴 대신 예전 전체 메뉴(추가 옵션 보기)가 바로 뜨도록 레지스트리를 등록하는 명령어와, 원래대로 되돌리는 명령어.",
    cat: "Dev · 노트", catClass: "dark", catLabel: "Windows",
    date: "2025-09-03", read: "1분", cover: "fill-5",
    tags: ["Windows11", "우클릭메뉴", "레지스트리"],
    blog: "블로그"
  },
  {
    id: 109, slug: "git-submodule-branch-not-applied", path: "articles/git-submodule-branch-not-applied/",
    title: "(Git Error) Git submodule branch 적용불가 문제",
    deck: ".gitmodules에 branch를 지정해도 서브모듈에 적용되지 않을 때, git config로 강제 적용하고 확인한 뒤 git submodule update --remote로 업데이트하는 순서.",
    cat: "Dev · 노트", catClass: "dark", catLabel: "Git",
    date: "2025-08-20", read: "1분", cover: "fill-3",
    tags: ["Git", "서브모듈", "트러블슈팅"],
    blog: "블로그"
  },
  {
    id: 108, slug: "cpp-runtime-error-unable-to-open-xml", path: "articles/cpp-runtime-error-unable-to-open-xml/",
    title: "(C++ Error) terminate called after throwing an instance of 'std::runtime_error': Unable to open xml file",
    deck: "C++ 프로그램이 'Unable to open xml file' 런타임 에러로 종료될 때 확인할 것 — 필요한 폴더 디렉터리 구성과 해당 파일의 존재 여부.",
    cat: "Dev · 노트", catClass: "dark", catLabel: "C++",
    date: "2025-08-19", read: "1분", cover: "fill-1",
    tags: ["C++", "런타임에러", "트러블슈팅"],
    blog: "블로그"
  },
  {
    id: 107, slug: "ubuntu-server-cli-4k-font-size", path: "articles/ubuntu-server-cli-4k-font-size/",
    title: "Ubuntu Server Cli 모드 4K 고해상도 모니터 초간단 폰트크기 키우기",
    deck: "4K 모니터에서 Ubuntu Server 콘솔 글씨가 보이지 않을 만큼 작을 때, dpkg-reconfigure console-setup 한 번으로 폰트를 Terminus 16x32로 키우는 방법.",
    cat: "Dev · 노트", catClass: "dark", catLabel: "Linux",
    date: "2024-10-16", read: "1분", cover: "fill-4",
    tags: ["Ubuntu", "콘솔폰트", "4K"],
    blog: "블로그"
  },
  {
    id: 106, slug: "wordpress-cloudflare-too-many-redirects", path: "articles/wordpress-cloudflare-too-many-redirects/",
    title: "[WordPress] Cloudflare 적용 후 ERR_TOO_MANY_REDIRECTS 초간단 해결방법",
    deck: "스팸 댓글 때문에 Cloudflare를 적용했더니 로그인에서 ERR_TOO_MANY_REDIRECTS가 났다. 원인은 SSL 가변 모드에서 생기는 https와 http 사이의 루프 — 암호화 모드를 '전체'로 바꿔 해결한다.",
    cat: "Dev · 노트", catClass: "dark", catLabel: "WordPress",
    date: "2024-10-16", read: "3분", cover: "fill-2",
    tags: ["워드프레스", "Cloudflare", "SSL", "리다이렉트"],
    blog: "블로그"
  },
  {
    id: 105, slug: "docker-mattermost-connection-refused", path: "articles/docker-mattermost-connection-refused/",
    title: "[Docker] Mattermost 외부접속 불가: Connection Refused, Mattermost-preview",
    deck: "Docker로 띄운 mattermost-preview에 외부에서 접속하면 Connection Refused가 뜰 때, 컨테이너를 --add-host 옵션과 함께 새로 만들어 해결하는 방법.",
    cat: "Dev · 노트", catClass: "dark", catLabel: "Docker",
    date: "2024-05-23", read: "1분", cover: "fill-7",
    tags: ["Docker", "Mattermost", "트러블슈팅"],
    blog: "블로그"
  },
  {
    id: 104, slug: "openai-fine-tuning-data-format", path: "articles/openai-fine-tuning-data-format/",
    title: "OpenAI ChatGPT Fine-tuning Data Format / 학습데이터 작성 방법",
    deck: "OpenAI 파인튜닝용 학습데이터는 .jsonl 파일로 작성한다. 대화형, 프롬프트 쌍, 멀티턴(weight) 세 가지 형식의 예시와 Python으로 간단히 출력하는 코드.",
    cat: "AI · 노트", catClass: "", catLabel: "LLM",
    date: "2024-04-18", read: "2분", cover: "fill-6",
    tags: ["OpenAI", "파인튜닝", "JSONL", "학습데이터"],
    blog: "블로그"
  },
  {
    id: 103, slug: "ubuntu-apm-quick-install", path: "articles/ubuntu-apm-quick-install/",
    title: "Ubuntu APM 빠른설치 (Apache, PHP, MySQL)",
    deck: "우분투에 Apache, MySQL, PHP를 올리는 데 꼭 필요한 명령어만 순서대로 정리했다. MySQL 암호 설정 화면이 뜨지 않을 때와 PHP가 동작하지 않을 때의 처방까지.",
    cat: "Dev · 노트", catClass: "dark", catLabel: "Linux",
    date: "2024-04-18", read: "1분", cover: "fill-3",
    tags: ["Ubuntu", "Apache", "PHP", "MySQL"],
    blog: "블로그"
  },
  {
    id: 102, slug: "wordpress-multi-domain-single-site", path: "articles/wordpress-multi-domain-single-site/",
    title: "워드프레스 멀티도메인 사용 설정하기 / WordPress using Multi-domain with Single-site",
    deck: "워드프레스 사이트 하나에 도메인 여러 개를 연결하면 메인 도메인을 제외한 나머지에서는 이미지가 엑스박스로 뜬다. 리다이렉션 없이 각 도메인이 개별적으로 정상 작동하게 만드는 wp-config.php 설정.",
    cat: "Dev · 노트", catClass: "dark", catLabel: "WordPress",
    date: "2024-04-18", read: "3분", cover: "fill-1",
    tags: ["워드프레스", "멀티도메인", "wp-config"],
    blog: "블로그"
  },
  {
    id: 101, slug: "ai-last-invention-humanity-fate", path: "articles/ai-last-invention-humanity-fate/",
    title: "인류의 마지막 발명품: 인공지능 그리고 인류의 운명",
    deck: "닉 보스트롬은 인공지능이 인류가 만들어야 하는 마지막 발명품이 될 것이라고 했다. 약인공지능(ANI)에서 강인공지능(AGI), 초인공지능(ASI), 초월인공지능(ATI)으로 이어지는 네 단계와, 그 진화가 인류에게 던지는 질문을 정리한다.",
    cat: "AI · 칼럼", catClass: "", catLabel: "AI",
    date: "2023-12-25", read: "5분", cover: "fill-5",
    tags: ["인공지능", "AGI", "초인공지능", "기술적특이점"],
    blog: "블로그"
  },
  /* ── 일반 기고·특별기고 ── */
  {
    id: 23, slug: "ontology-schema-first-knowledge-graph", path: "articles/ontology-schema-first-knowledge-graph/",
    title: "데이터보다 스키마가 먼저다: 온톨로지가 지식그래프에 사 주는 네 가지",
    deck: "지식그래프를 만들자는 회의는 데이터 이야기로 시작하지만, 첫 커밋에 들어가는 것은 데이터가 아니라 사전이다. 무엇을 클래스라 부를지, 어떤 것을 관계로 볼지, 같은 개체를 같다고 판정할 키를 무엇으로 삼을지 — 데이터를 한 줄도 넣기 전에 정해야 하는 이 결정들은 회의만 길어지게 만드는 관료적 절차처럼 보인다. 그러나 국가주소정보 지식그래프를 국가 표준 온톨로지 위에 세우면서 나는 반대의 것을 배웠다. 스키마를 먼저 정하는 일은 지불이고, 그 대가로 사는 것이 분명히 있다는 것을.",
    cat: "Research · 회고", catClass: "red", catLabel: "연구 회고",
    date: "2026-09-01", read: "17분", cover: "articles/ontology-schema-first-knowledge-graph/images/cover.svg",
    tags: ["온톨로지", "지식그래프", "스키마설계", "SHACL", "환각방지"]
  },
  {
    id: 22, slug: "address-graph-disaster-perception-stack", path: "articles/address-graph-disaster-perception-stack/",
    title: "어디서 무슨 일이 일어났는가: 주소 지식그래프와 멀티모달 재난 인지를 하나의 스택으로",
    deck: "재난 현장의 언어는 주소로 들어온다. 그러나 판단은 영상과 센서로 이루어진다. 이 두 언어 사이에는 아무도 대신 메워 주지 않는 틈이 있다. 올해 나는 그 틈의 양쪽에 서는 소프트웨어 두 벌을 만들었다 — 주소를 좌표와 관계로 푸는 지식그래프, 그리고 네 갈래 모달리티를 한 백본에서 읽는 인지 API. 이 글은 그 둘을 하나의 스택으로 세우려 한 시도와, 아직 못 한 것들에 대한 기록이다.",
    cat: "Research · 회고", catClass: "red", catLabel: "연구 회고",
    date: "2026-08-31", read: "17분", cover: "articles/address-graph-disaster-perception-stack/images/cover.svg",
    tags: ["지식그래프", "재난AI", "멀티모달", "주소정보", "공간지능"]
  },
  {
    id: 21, slug: "genai-copyright-data-licensing", path: "articles/genai-copyright-data-licensing/",
    title: "학습이라는 이름의 채굴: 생성형 AI 저작권·데이터 라이선싱 전쟁",
    deck: "생성형 AI는 인류가 수백 년 쌓아 온 글과 그림과 코드를 삼켜 만들어졌다. 그 삼킴은 공정이용이라는 오래된 방패 뒤에 서 있다. 그러나 2025년, 법정과 시장은 방패의 크기를 다시 재기 시작했다. 소송과 15억 달러의 합의, 조용히 확산되는 라이선싱 딜, 웹의 문을 닫는 ‘콘텐츠 시그널’, 그리고 출처를 되묻는 기술 — 학습 데이터를 둘러싼 이 전쟁의 지형을 차분히 그려 본다.",
    cat: "Tech · 이슈", catClass: "", catLabel: "AI 정책",
    date: "2026-08-26", read: "15분", cover: "articles/genai-copyright-data-licensing/images/cover.svg",
    tags: ["저작권", "데이터라이선싱", "생성형AI", "공정이용"],
    feature: "특별기고"
  },
  {
    id: 20, slug: "ai-agent-reliability-evals", path: "articles/ai-agent-reliability-evals/",
    title: "데모는 되는데, 프로덕션에서 무너지는 이유",
    deck: "회의실 시연에서는 흠잡을 데 없던 AI 에이전트가, 막상 실전 트래픽 위에 올려놓으면 무너진다. 문제는 대개 모델의 지능이 아니라 신뢰성이다. 한 번 성공하는 것과 매번 성공하는 것은 전혀 다른 공학이기 때문이다. 이 글은 에이전트가 왜 무너지는지, 그것을 어떻게 평가(evals)하고, 무너져도 안전하도록 어떤 가드레일을 깔아야 하는지를 실전 배치의 관점에서 차분히 정리한다.",
    cat: "AI · 기술해설", catClass: "", catLabel: "AI 에이전트",
    date: "2026-08-25", read: "15분", cover: "articles/ai-agent-reliability-evals/images/cover.svg",
    tags: ["AI에이전트", "신뢰성", "평가", "가드레일"],
    feature: "특별기고"
  },
  {
    id: 19, slug: "reasoning-models-test-time-compute", path: "articles/reasoning-models-test-time-compute/",
    title: "더 키우기보다 더 생각하게: 추론형 LLM과 테스트타임 컴퓨트의 경제학",
    deck: "지난 몇 해 AI의 성장 공식은 단순했다. 더 큰 모델, 더 많은 데이터, 더 많은 학습 컴퓨트. 그런데 2024년 말부터 무게중심이 조용히 옮겨갔다. 모델을 키우는 대신 추론하는 순간에 더 오래 생각하게 만드는 쪽으로. 이 글은 그 전환의 배경과 원리, 그리고 토큰·지연·비용이 얽힌 새로운 경제학을 차분히 해부한다.",
    cat: "AI · 기술해설", catClass: "", catLabel: "AI 모델",
    date: "2026-08-24", read: "15분", cover: "articles/reasoning-models-test-time-compute/images/cover.svg",
    tags: ["추론모델", "테스트타임컴퓨트", "LLM", "추론비용"],
    feature: "특별기고"
  },
  {
    id: 18, slug: "rag-architectures-hallucination", path: "articles/rag-architectures-hallucination/",
    title: "검색이 지능을 구원하는 네 가지 방법 — Lexical·Semantic·Hybrid·Graph RAG와 환각의 해부",
    deck: "대형언어모델의 지식은 학습이 끝나는 순간 굳어 버린다. 검색증강생성(RAG)은 모델 바깥의 문서를 끌어와 그 빈틈을 메운다. Lexical·Semantic·Hybrid·Graph 네 검색 아키텍처를 원리부터 해부하고, 그것이 환각을 어떻게 줄이며 무엇이 여전히 남는지를 짚는다.",
    cat: "AI · 기술해설", catClass: "", catLabel: "RAG · 검색증강",
    date: "2026-07-27", read: "18분", cover: "articles/rag-architectures-hallucination/images/cover.svg",
    tags: ["RAG", "검색증강생성", "벡터검색", "GraphRAG", "환각"]
  },
  {
    id: 17, slug: "mcp-agent-interop-standard", path: "articles/mcp-agent-interop-standard/",
    title: "AI의 HTTP가 된 프로토콜: MCP와 상호운용성 표준 전쟁",
    deck: "챗봇이 ‘행동하는 에이전트’로 바뀌는 순간, 병목은 지능이 아니라 연결의 표준이 된다. Anthropic이 공개한 MCP가 사실상 표준이 되기까지, 그 구조와 정치학, 남은 보안 숙제를 해부한다.",
    cat: "AI · 기술해설", catClass: "", catLabel: "AI 에이전트",
    date: "2026-07-18", read: "14분", cover: "articles/mcp-agent-interop-standard/images/cover.svg",
    tags: ["MCP", "AI에이전트", "상호운용성", "Anthropic"],
    feature: "특별기고"
  },
  {
    id: 16, slug: "ai-datacenter-power-crunch", path: "articles/ai-datacenter-power-crunch/",
    title: "AI의 진짜 한계는 전기다",
    deck: "데이터센터 전력은 2024년 약 415 TWh에서 2030년 약 945 TWh로 6년 만에 두 배가 된다. 진짜 병목은 GPU가 아니라, 발전소에서 랙까지 전기를 미는 전력망이다.",
    cat: "Tech · 이슈", catClass: "", catLabel: "AI 인프라",
    date: "2026-07-17", read: "14분", cover: "articles/ai-datacenter-power-crunch/images/cover.svg",
    tags: ["데이터센터", "전력", "AI인프라", "전력망"],
    feature: "특별기고"
  },
  {
    id: 15, slug: "ai-circular-financing-bubble", path: "articles/ai-circular-financing-bubble/",
    title: "엔비디아에서 엔비디아로",
    deck: "엔비디아가 OpenAI에 최대 1,000억 달러를 투자한다. 공급자이자 고객이자 투자자인 한 회사를 도는 자금의 고리와 ‘버블’ 논쟁을, 엔지니어의 눈으로 차분히 뜯어본다.",
    cat: "Tech · 이슈", catClass: "", catLabel: "AI 산업",
    date: "2026-07-16", read: "14분", cover: "articles/ai-circular-financing-bubble/images/cover.svg",
    tags: ["엔비디아", "OpenAI", "AI버블", "순환투자"],
    feature: "특별기고"
  },
  {
    id: 14, slug: "abliterated-ai-safety", path: "articles/abliterated-ai-safety/",
    title: "거부를 지운 모델: Abliterated LLM의 위험과 존재 이유",
    deck: "언어모델의 ‘거부’는 가중치 속 한 방향으로 표현된다. 그 방향만 지운 무삭제 모델을 정상판과 나란히 시험한 기록, 그리고 위험과 필요 사이의 균형.",
    cat: "AI · 기술해설", catClass: "", catLabel: "AI 안전",
    date: "2026-07-10", read: "13분", cover: "articles/abliterated-ai-safety/images/03-abliterated-comply-drug.jpg",
    tags: ["AI안전", "Abliteration", "정렬", "LLM"]
  },
  {
    id: 1, slug: "prompt-engineering", path: "articles/prompt-engineering/",
    title: "프롬프트 엔지니어링의 과학: 언어모델 성능을 끌어올리는 설계 원리",
    deck: "같은 모델이라도 어떻게 묻느냐에 따라 답이 달라진다. 프롬프트를 ‘기교’가 아니라 ‘공학’으로 다루는 법.",
    cat: "AI · 기술해설", catClass: "", catLabel: "생성형 AI",
    date: "2026-06-05", read: "14분", cover: "fill-1",
    tags: ["프롬프트엔지니어링", "대형언어모델", "생성형AI"]
  },
  {
    id: 2, slug: "seq2seq-forecasting", path: "articles/seq2seq-forecasting/",
    title: "시계열을 번역하다: Seq2Seq로 미래를 예측하는 법",
    deck: "기계번역에 쓰이던 인코더–디코더 구조가 어떻게 수온과 전력 수요, 원전 발전량을 예측하게 되었나.",
    cat: "AI · 기술해설", catClass: "", catLabel: "시계열·딥러닝",
    date: "2026-06-09", read: "13분", cover: "assets/img/extracted/portfolio/seq2seq-gru-encoder-decoder-arch.png",
    tags: ["시계열예측", "Seq2Seq", "딥러닝"]
  },
  {
    id: 3, slug: "infection-curve", path: "articles/infection-curve/",
    title: "감염병의 곡선을 미리 그리다: 위상 지연을 줄인 예측 모델",
    deck: "급변하는 확진자 수를 며칠 늦게 따라가던 모델을, 어떻게 ‘제때’ 반응하게 만들었나.",
    cat: "Research · 회고", catClass: "red", catLabel: "연구 회고",
    date: "2026-06-13", read: "15분", cover: "assets/img/extracted/research/quarantine-iot-databroker-dashboard.png",
    tags: ["시계열예측", "감염병", "공공안전"]
  },
  {
    id: 4, slug: "edge-llm", path: "articles/edge-llm/",
    title: "GPU 없이 추론하는 언어모델: 현장을 위한 경량 LLM과 GeoLLM",
    deck: "서버도 GPU도 없는 지하시설물 현장에서, 언어모델은 어떻게 작동할 수 있을까.",
    cat: "AI · 기술해설", catClass: "", catLabel: "경량 LLM",
    date: "2026-06-17", read: "14분", cover: "assets/img/extracted/research/geollm-gis-homevalue-choropleth.png",
    tags: ["경량모델", "GeoLLM", "엣지AI"]
  },
  {
    id: 5, slug: "empathetic-chatbot", path: "articles/empathetic-chatbot/",
    title: "공감하는 기계: 감정 인식 헬스케어 챗봇을 설계하다",
    deck: "독거 중고령자의 마음을 읽는 챗봇. 다중 모델과 감정 인식으로 ‘대화의 질’을 끌어올린 기록.",
    cat: "Research · 회고", catClass: "red", catLabel: "연구 회고",
    date: "2026-06-21", read: "13분", cover: "assets/img/extracted/portfolio/multimodel-chatbot-patent-system-arch.png",
    tags: ["대화형AI", "감정인식", "디지털헬스케어"]
  },
  {
    id: 6, slug: "contactless-biosignals", path: "articles/contactless-biosignals/",
    title: "비접촉으로 생체신호를 읽다: 스마트미러와 실감 콘텐츠",
    deck: "카메라만으로 맥박을 측정하는 PPG, 그리고 사람을 알아보는 디지털 사이니지 이야기.",
    cat: "Research · 회고", catClass: "red", catLabel: "연구 회고",
    date: "2026-06-25", read: "12분", cover: "assets/img/extracted/portfolio/digital-signage-demo-photos.png",
    tags: ["PPG", "스마트미러", "실감콘텐츠"]
  },
  {
    id: 7, slug: "bert-medical-classification", path: "articles/bert-medical-classification/",
    title: "어느 과로 가야 할까: BERT로 건강상담 글을 분류하다",
    deck: "비대면 의료가 일상이 된 시대, 사람들은 병명 대신 증상을 문장으로 털어놓는다. 그 서툰 문장을 읽고 올바른 진료과로 안내하는 다섯 모델의 대결.",
    cat: "Research · 회고", catClass: "red", catLabel: "연구 회고",
    date: "2026-06-27", read: "13분", cover: "assets/img/extracted/portfolio/bert-health-model-comparison-chart.png",
    tags: ["헬스케어NLP", "BERT", "텍스트분류"]
  },
  {
    id: 8, slug: "data-augmentation-activation", path: "articles/data-augmentation-activation/",
    title: "데이터와 활성함수, 두 개의 작은 지렛대",
    deck: "모델을 키우지 않고도 신경망 성능을 끌어올리는 법 — 유의어 군집으로 데이터를 늘리고, 활성함수를 비대칭으로 조합하다.",
    cat: "AI · 기술해설", catClass: "", catLabel: "딥러닝",
    date: "2026-06-28", read: "14분", cover: "assets/img/extracted/portfolio/wordcluster-accuracy-heatmap.png",
    tags: ["데이터증강", "활성함수", "순환신경망"]
  },
  {
    id: 9, slug: "waterpipe-prediction", path: "articles/waterpipe-prediction/",
    title: "보이지 않는 관로를 예측하다: 불규칙 시계열과 앙상블·언어모델",
    deck: "도시의 발밑, 언제 터질지 모르는 상수도 관로. ‘언제 터질까’를 넘어 ‘무엇을 어떻게 고칠까’까지 하나의 시스템으로 이었다.",
    cat: "Research · 회고", catClass: "red", catLabel: "연구 회고",
    date: "2026-06-30", read: "14분", cover: "assets/img/extracted/portfolio/waterpipe-lstm-pipeline-diagram.png",
    tags: ["시계열예측", "도시인프라", "앙상블"]
  },
  {
    id: 10, slug: "parallel-simulation-ape", path: "articles/parallel-simulation-ape/",
    title: "시간이 곧 성능이다: 적응형 병렬처리로 시뮬레이션을 가속하다",
    deck: "대도시 규모의 교통 시뮬레이션은 정확해질수록 느려진다. AI가 부하를 예측해 24개 코어에 계산을 나눠 담는 APE의 기록.",
    cat: "AI · 기술해설", catClass: "", catLabel: "시스템·HPC",
    date: "2026-07-01", read: "12분", cover: "assets/img/extracted/research/ape-cpu-utilization-24core.png",
    tags: ["병렬처리", "시뮬레이션", "모빌리티"]
  },
  {
    id: 11, slug: "mmwave-georeferencing", path: "articles/mmwave-georeferencing/",
    title: "카메라 없이 지도 위에 사람을 그리다: mmWave 지리참조",
    deck: "밀리미터파 레이더는 사람을 영상이 아니라 한 무리의 ‘점’으로 본다. 평균 3.5cm 오차로 실내를 지리참조하고, 이를 경기장 규모로 키운 이야기.",
    cat: "Research · 회고", catClass: "red", catLabel: "연구 회고",
    date: "2026-07-03", read: "15분", cover: "assets/img/extracted/research/mmwave-localization-concept.png",
    tags: ["mmWave", "지리참조", "실내측위"]
  },
  {
    id: 12, slug: "geollm-knowledge-graph", path: "articles/geollm-knowledge-graph/",
    title: "지도를 읽는 언어모델: GeoLLM과 지식그래프",
    deck: "“가장 가까운 소각장이 어디냐”는 물음에 언어모델은 그럴듯하지만 틀린 답을 낸다. RAG·PostGIS·지식그래프로 그 빈틈을 메운 GeoLLM/GNLM 구축기.",
    cat: "AI · 기술해설", catClass: "", catLabel: "생성형 AI",
    date: "2026-07-04", read: "15분", cover: "assets/img/extracted/research/geollm-bot-demo-korean.png",
    tags: ["GeoLLM", "지식그래프", "RAG"]
  },
  {
    id: 13, slug: "llm-spatial-reasoning", path: "articles/llm-spatial-reasoning/",
    title: "LLM은 공간을 이해하는가: 7,650문항 공간추론 벤치마크",
    deck: "지도를 읽는 일은 사람에게 너무 당연하다. 6개 대형언어모델을 7,650문항으로 해부하며 ‘공간을 이해한다’는 말의 무게를 다시 쟀다.",
    cat: "Research · 회고", catClass: "red", catLabel: "연구 회고",
    date: "2026-07-05", read: "14분", cover: "fill-5",
    tags: ["LLM", "공간추론", "벤치마크"]
  }
];

/* 최신순(번호 큰 순) 정렬본 — 모든 화면이 이 기준을 공유한다. */
window.ARTICLES_BY_RECENT = window.ARTICLES.slice().sort(function (a, b) {
  return b.id - a.id;
});
