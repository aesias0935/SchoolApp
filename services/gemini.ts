export interface RawNewsItem {
  title: string;
  description: string;
  link: string;
  // 필요 시 네이버/Google News API 등에서 받아온 언론사명이 있다면 여기에 포함
  press?: string; 
}

export interface NewsArticle {
  id: number;
  title: string;
  summary: string;
  category: string;
  url: string;
  press: string; // 👈 출처(언론사) 필드 추가
}

export const summarizeAndSelectNews = async (rawNewsList: RawNewsItem[]): Promise<NewsArticle[]> => {
  try {
    const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;

    if (!apiKey) {
      console.error('❌ .env 파일의 EXPO_PUBLIC_GROQ_API_KEY를 찾을 수 없습니다.');
      return [];
    }

    const prompt = `
당신은 뉴스 큐레이터입니다. 아래 제공된 뉴스 목록 중 오늘 가장 중요한 뉴스 5개를 선별해 주세요.

[요청 사항]
1. 가장 가치 있는 뉴스 5개만 선별하세요.
2. 각 뉴스마다 핵심 내용을 2줄 이내로 요약해 주세요.
3. 기사 제목이나 내용, 원문 링크를 바탕으로 해당 뉴스의 '출처(언론사 이름, 예: 연합뉴스, 조선일보, TechCrunch 등)'를 추론하거나 추출하여 "press" 항목에 적어주세요. 언론사를 알 수 없다면 "주요 뉴스"라고 적으세요.
4. 반드시 아래 JSON 배열 포맷으로만 응답하세요.

[JSON 포맷]
[
  {
    "id": 1,
    "title": "뉴스 제목",
    "summary": "AI 요약 내용 (2줄)",
    "category": "카테고리(IT/경제/사회 등)",
    "press": "언론사 이름",
    "url": "원문 링크"
  }
]

[뉴스 데이터]
${JSON.stringify(rawNewsList)}
`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Groq API 에러 응답:', errorData);
      return [];
    }

    const data = await response.json();
    const resultText = data.choices?.[0]?.message?.content;

    if (!resultText) return [];

    const parsedData = JSON.parse(resultText);
    
    let articles: NewsArticle[] = [];
    if (Array.isArray(parsedData)) articles = parsedData;
    else if (parsedData.news) articles = parsedData.news;
    else if (parsedData.articles) articles = parsedData.articles;
    else articles = Object.values(parsedData)[0] as NewsArticle[];

    return articles;
  } catch (error) {
    console.error('❌ 뉴스 요약 처리 중 에러 발생:', error);
    return [];
  }
};