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
    date: "2026-06-09", read: "13분", cover: "fill-6",
    tags: ["시계열예측", "Seq2Seq", "딥러닝"]
  },
  {
    id: 3, slug: "infection-curve", path: "articles/infection-curve/",
    title: "감염병의 곡선을 미리 그리다: 위상 지연을 줄인 예측 모델",
    deck: "급변하는 확진자 수를 며칠 늦게 따라가던 모델을, 어떻게 ‘제때’ 반응하게 만들었나.",
    cat: "Research · 회고", catClass: "red", catLabel: "연구 회고",
    date: "2026-06-13", read: "15분", cover: "fill-3",
    tags: ["시계열예측", "감염병", "공공안전"]
  },
  {
    id: 4, slug: "edge-llm", path: "articles/edge-llm/",
    title: "GPU 없이 추론하는 언어모델: 현장을 위한 경량 LLM과 GeoLLM",
    deck: "서버도 GPU도 없는 지하시설물 현장에서, 언어모델은 어떻게 작동할 수 있을까.",
    cat: "AI · 기술해설", catClass: "", catLabel: "경량 LLM",
    date: "2026-06-17", read: "14분", cover: "fill-7",
    tags: ["경량모델", "GeoLLM", "엣지AI"]
  },
  {
    id: 5, slug: "empathetic-chatbot", path: "articles/empathetic-chatbot/",
    title: "공감하는 기계: 감정 인식 헬스케어 챗봇을 설계하다",
    deck: "독거 중고령자의 마음을 읽는 챗봇. 다중 모델과 감정 인식으로 ‘대화의 질’을 끌어올린 기록.",
    cat: "Research · 회고", catClass: "red", catLabel: "연구 회고",
    date: "2026-06-21", read: "13분", cover: "fill-5",
    tags: ["대화형AI", "감정인식", "디지털헬스케어"]
  },
  {
    id: 6, slug: "contactless-biosignals", path: "articles/contactless-biosignals/",
    title: "비접촉으로 생체신호를 읽다: 스마트미러와 실감 콘텐츠",
    deck: "카메라만으로 맥박을 측정하는 PPG, 그리고 사람을 알아보는 디지털 사이니지 이야기.",
    cat: "Research · 회고", catClass: "red", catLabel: "연구 회고",
    date: "2026-06-25", read: "12분", cover: "fill-2",
    tags: ["PPG", "스마트미러", "실감콘텐츠"]
  }
];

/* 최신순(번호 큰 순) 정렬본 — 모든 화면이 이 기준을 공유한다. */
window.ARTICLES_BY_RECENT = window.ARTICLES.slice().sort(function (a, b) {
  return b.id - a.id;
});
