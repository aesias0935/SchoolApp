import AsyncStorage from '@react-native-async-storage/async-storage';

export interface NewsArticle {
  id: number;
  title: string;
  summary: string;
  category: string;
  press: string;
  url: string;
}

const BOOKMARK_KEY = '@saved_news_list';

// 저장된 뉴스 목록 불러오기
export const getSavedNews = async (): Promise<NewsArticle[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(BOOKMARK_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error('저장된 뉴스 불러오기 실패:', e);
    return [];
  }
};

// 뉴스 저장/해제 토글 함수
export const toggleSaveNews = async (article: NewsArticle): Promise<NewsArticle[]> => {
  try {
    const currentSaved = await getSavedNews();
    const isAlreadySaved = currentSaved.some((item) => item.title === article.title);

    let updatedList: NewsArticle[];
    if (isAlreadySaved) {
      // 이미 저장되어 있으면 제거
      updatedList = currentSaved.filter((item) => item.title !== article.title);
    } else {
      // 저장 안 되어 있으면 추가
      updatedList = [article, ...currentSaved];
    }

    await AsyncStorage.setItem(BOOKMARK_KEY, JSON.stringify(updatedList));
    return updatedList;
  } catch (e) {
    console.error('뉴스 저장 상태 변경 실패:', e);
    return [];
  }
};