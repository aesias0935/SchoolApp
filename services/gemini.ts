export interface RawNewsItem {
  title: string;
  description: string;
  link: string;
  press?: string; 
}

export interface NewsArticle {
  id: number;
  title: string;
  summary: string;
  category: string;
  url: string;
  press: string;
}

export const summarizeAndSelectNews = async (rawNewsList: RawNewsItem[]): Promise<NewsArticle[]> => {
  try {
    const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;

    if (!apiKey) {
      console.error('❌ .env 파일의 EXPO_PUBLIC_GROQ_API_KEY를 찾을 수 없습니다.');
      return [];
    }

    if (!rawNewsList || rawNewsList.length === 0) {
      return [];
    }

    // JSON 객체 스키마를 명확히 지정하여 response_format과 동기화
    const prompt = `
당신은 전문 뉴스 큐레이터입니다. 아래 제공된 뉴스 목록 중 오늘 가장 중요한 뉴스 5개를 선별하고 요약해 주세요.

[요청 사항]
1. 가장 가치 있는 뉴스 5개만 선별하세요.
2. 각 뉴스마다 핵심 내용을 2줄 이내로 요약해 주세요.
3. 기사 제목, 내용, 원문 링크를 바탕으로 언론사 이름을 추론/추출하여 "press"에 적어주세요. 알 수 없다면 "주요 뉴스"라고 적으세요.
4. 반드시 "articles" 키를 가진 JSON 객체 형태로만 응답하세요.

[응답 JSON 스키마]
{
  "articles": [
    {
      "id": 1,
      "title": "뉴스 제목",
      "summary": "핵심 내용 요약 (2줄 이내)",
      "category": "카테고리(IT/경제/사회 등)",
      "press": "언론사 이름",
      "url": "원문 링크"
    }
  ]
}

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
        temperature: 0.3, // 일관된 JSON 출력을 위해 낮은 temperature 권장
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Groq API 에러 응답:', errorData);
      return [];
    }

    const data = await response.json();
    let resultText = data.choices?.[0]?.message?.content;

    if (!resultText) return [];

    // Markdown 코드 블록이 포함되어 올 경우 제거
    resultText = resultText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim();

    const parsedData = JSON.parse(resultText);
    
    let articles: NewsArticle[] = [];
    if (Array.isArray(parsedData)) {
      articles = parsedData;
    } else if (parsedData.articles && Array.isArray(parsedData.articles)) {
      articles = parsedData.articles;
    } else if (parsedData.news && Array.isArray(parsedData.news)) {
      articles = parsedData.news;
    } else {
      const firstKey = Object.keys(parsedData)[0];
      if (firstKey && Array.isArray(parsedData[firstKey])) {
        articles = parsedData[firstKey];
      }
    }

    // Raw 데이터에 이미 press가 있던 경우 복원 및 id 재정렬 보정
    return articles.map((item, index) => {
      const rawMatch = rawNewsList.find(r => r.link === item.url || r.title === item.title);
      return {
        ...item,
        id: item.id || index + 1,
        press: rawMatch?.press || item.press || '주요 뉴스',
      };
    });

  } catch (error) {
    console.error('❌ 뉴스 요약 처리 중 에러 발생:', error);
    return [];
  }
};