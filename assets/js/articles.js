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
  {
    id: 17, slug: "mcp-agent-interop-standard", path: "articles/mcp-agent-interop-standard/",
    title: "AI의 HTTP가 된 프로토콜: MCP와 상호운용성 표준 전쟁",
    deck: "챗봇이 ‘행동하는 에이전트’로 바뀌는 순간, 병목은 지능이 아니라 연결의 표준이 된다. Anthropic이 공개한 MCP가 사실상 표준이 되기까지, 그 구조와 정치학, 남은 보안 숙제를 해부한다.",
    cat: "AI · 기술해설", catClass: "", catLabel: "AI 에이전트",
    date: "2026-07-18", read: "14분", cover: "articles/mcp-agent-interop-standard/images/cover.svg",
    tags: ["MCP", "AI에이전트", "상호운용성", "Anthropic"],
    feature: "특별기획"
  },
  {
    id: 16, slug: "ai-datacenter-power-crunch", path: "articles/ai-datacenter-power-crunch/",
    title: "AI의 진짜 한계는 전기다",
    deck: "데이터센터 전력은 2024년 약 415 TWh에서 2030년 약 945 TWh로 6년 만에 두 배가 된다. 진짜 병목은 GPU가 아니라, 발전소에서 랙까지 전기를 미는 전력망이다.",
    cat: "Tech · 이슈", catClass: "", catLabel: "AI 인프라",
    date: "2026-07-17", read: "14분", cover: "articles/ai-datacenter-power-crunch/images/cover.svg",
    tags: ["데이터센터", "전력", "AI인프라", "전력망"],
    feature: "특별기획"
  },
  {
    id: 15, slug: "ai-circular-financing-bubble", path: "articles/ai-circular-financing-bubble/",
    title: "엔비디아에서 엔비디아로",
    deck: "엔비디아가 OpenAI에 최대 1,000억 달러를 투자한다. 공급자이자 고객이자 투자자인 한 회사를 도는 자금의 고리와 ‘버블’ 논쟁을, 엔지니어의 눈으로 차분히 뜯어본다.",
    cat: "Tech · 이슈", catClass: "", catLabel: "AI 산업",
    date: "2026-07-16", read: "14분", cover: "articles/ai-circular-financing-bubble/images/cover.svg",
    tags: ["엔비디아", "OpenAI", "AI버블", "순환투자"],
    feature: "특별기획"
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
