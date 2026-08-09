import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { getSavedNews, toggleSaveNews } from '../../services/bookmark';
import { getAISelectedNews } from '../../services/news';

export default function NewsScreen() {
  const [newsList, setNewsList] = useState<any[]>([]);
  const [savedNews, setSavedNews] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedNewsUrl, setSelectedNewsUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchNews();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSavedNews();
    }, [])
  );

  const fetchNews = async () => {
    setLoading(true);
    try {
      const newsData = await getAISelectedNews();
      setNewsList(newsData || []);
    } catch (e) {
      console.log('뉴스 가져오기 실패', e);
    } finally {
      setLoading(false);
    }
  };

  const loadSavedNews = async () => {
    try {
      const savedData = await getSavedNews();
      setSavedNews(savedData || []);
    } catch (e) {
      console.log('저장된 뉴스 불러오기 실패', e);
    }
  };

  const isSavedArticle = (article: any) => {
    return savedNews.some(
      (item) => item.title === article.title || (item.url && item.url === article.url)
    );
  };

  const handleToggleBookmark = async (article: any) => {
    try {
      const updatedList = await toggleSaveNews(article);
      setSavedNews(updatedList);
    } catch (e) {
      console.log('북마크 업데이트 실패', e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📰 AI 추천 뉴스</Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>최신 뉴스를 가져오는 중...</Text>
        </View>
      ) : newsList.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>뉴스 데이터를 불러오지 못했습니다.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchNews}>
            <Text style={styles.retryButtonText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={newsList}
          keyExtractor={(_, index) => index.toString()}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => {
            const isSaved = isSavedArticle(item);

            return (
              <TouchableOpacity
                style={styles.newsCard}
                activeOpacity={0.7}
                onPress={() => {
                  if (item.url) {
                    setSelectedNewsUrl(item.url);
                  } else {
                    Alert.alert('알림', '뉴스 링크가 제공되지 않습니다.');
                  }
                }}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.categoryBadge}>{item.category || '주요뉴스'}</Text>
                  <TouchableOpacity
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    onPress={() => handleToggleBookmark(item)}
                  >
                    <Text style={styles.bookmarkIcon}>{isSaved ? '🔖' : '🏷️'}</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.newsTitle}>{item.title}</Text>
                <Text style={styles.newsSummary}>{item.summary}</Text>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* 뉴스 웹뷰 모달 */}
      <Modal
        visible={selectedNewsUrl !== null}
        animationType="slide"
        onRequestClose={() => setSelectedNewsUrl(null)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>
          <View style={styles.popupHeader}>
            <TouchableOpacity
              onPress={() => setSelectedNewsUrl(null)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>닫기 ✕</Text>
            </TouchableOpacity>
            <Text style={styles.popupTitle}>뉴스 보기</Text>
            <View style={{ width: 50 }} />
          </View>

          {selectedNewsUrl && (
            <WebView
              source={{ uri: selectedNewsUrl }}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#007AFF" />
                </View>
              )}
              style={{ flex: 1 }}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#8E8E93',
  },
  emptyText: {
    fontSize: 15,
    color: '#8E8E93',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  newsCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: '#E8F0FE',
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  bookmarkIcon: {
    fontSize: 18,
  },
  newsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 6,
  },
  newsSummary: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  popupHeader: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    backgroundColor: '#F9F9F9',
  },
  popupTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  closeButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});