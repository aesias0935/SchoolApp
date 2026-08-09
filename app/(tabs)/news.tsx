import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getAISelectedNews } from '../../services/news';

interface NewsArticle {
  id: number;
  title: string;
  summary: string;
  category: string;
  press: string; // 👈 출처 필드 추가
  url: string;
}

export default function NewsScreen() {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const isFetching = useRef(false); // React Strict Mode 및 중복 요청 방지

  const fetchNews = async () => {
    if (isFetching.current) return;
    isFetching.current = true;

    setLoading(true);
    const data = await getAISelectedNews();
    setNews(data);
    setLoading(false);

    isFetching.current = false;
  };

  useEffect(() => {
    fetchNews();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>AI가 최신 뉴스 5개를 분석하고 있어요...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>📰 AI 헤드라인 뉴스</Text>
      <FlatList
        data={news}
        keyExtractor={(item, index) => (item.id ? item.id.toString() : index.toString())}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => Linking.openURL(item.url)}>
            {/* 카테고리 & 출처 영역 */}
            <View style={styles.headerRow}>
              <Text style={styles.categoryBadge}>{item.category || '주요뉴스'}</Text>
              <Text style={styles.pressText}>{item.press || '주요 언론사'}</Text>
            </View>

            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.summary}>{item.summary}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 15, color: '#666' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, marginTop: 40 },
  
  // 뉴스 카드 스타일
  card: { backgroundColor: '#f8f9fa', padding: 16, borderRadius: 12, marginBottom: 12 },
  
  // 카테고리와 출처 한 줄 배치
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: '#e8f0fe',
    color: '#0066cc',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  pressText: {
    fontSize: 12,
    color: '#70757a',
    fontWeight: '500',
  },
  
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 6, color: '#333' },
  summary: { fontSize: 14, color: '#666', lineHeight: 20 },
});