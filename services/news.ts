import { RawNewsItem, summarizeAndSelectNews } from './gemini';

export const getAISelectedNews = async () => {
  try {
    // 1단계: 구글 뉴스 RSS 불러오기
    const response = await fetch('https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko');
    
    if (!response.ok) {
      throw new Error(`[구글 뉴스 서버 에러] 상태 코드: ${response.status}`);
    }

    const xmlText = await response.text();
    const items: RawNewsItem[] = [];
    const itemMatches = xmlText.match(/<item>[\s\S]*?<\/item>/g) || [];

    for (const itemXml of itemMatches.slice(0, 15)) {
      const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/);
      const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/);

      if (titleMatch && linkMatch) {
        items.push({
          title: titleMatch[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim(),
          description: '',
          link: linkMatch[1].trim(),
        });
      }
    }

    if (items.length === 0) {
      throw new Error('[파싱 에러] 구글 뉴스에서 기사를 읽어오지 못했습니다.');
    }

    // 2단계: Gemini AI 요약 호출
    const selectedNews = await summarizeAndSelectNews(items);
    return Array.isArray(selectedNews) ? selectedNews : [];

  } catch (error: any) {
    console.error('🔥 news.ts 상세 에러 원인:', error?.message || error);
    return [];
  }
};