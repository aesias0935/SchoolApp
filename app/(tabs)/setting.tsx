import { syncSavedTimetableToWidget } from '@/services/comtime';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import SharedGroupPreferences from 'react-native-shared-group-preferences';
import { WebView } from 'react-native-webview';
import { getSavedNews, toggleSaveNews } from '../../services/bookmark';

const APP_GROUP = 'group.com.aesias.SchoolApp';
const SCHOOL_LIST = ['수원하이텍마이스터고등학교'];
const GRADE_LIST = ['1학년', '2학년', '3학년'];
const CLASS_LIST = ['1반', '2반', '3반', '4반', '5반', '6반', '7반', '8반'];
const MAJOR_LIST = ['정밀기계과', '자동화시스템과', '전기전자제어과'];

export default function SettingScreen() {
  const [isRegistered, setIsRegistered] = useState(false);

  const [name, setName] = useState('');
  const [school, setSchool] = useState('');
  const [grade, setGrade] = useState('');
  const [classNum, setClassNum] = useState('');
  const [major, setMajor] = useState('');

  const [savedNews, setSavedNews] = useState<any[]>([]);
  const [newsListModalVisible, setNewsListModalVisible] = useState(false);

  // 📌 선택된 뉴스 URL 상태
  const [selectedNewsUrl, setSelectedNewsUrl] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [currentType, setCurrentType] = useState<'school' | 'grade' | 'class' | 'major' | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadUserData();
      loadSavedNewsData();
    }, [])
  );

  const loadUserData = async () => {
    try {
      const savedName = await AsyncStorage.getItem('@user_name');
      const savedSchool = await AsyncStorage.getItem('@school_name');
      const savedGrade = await AsyncStorage.getItem('@grade');
      const savedClassNum = await AsyncStorage.getItem('@class_num');
      const savedMajor = await AsyncStorage.getItem('@major');

      if (savedSchool && savedName) {
        setIsRegistered(true);
        setName(savedName);
        setSchool(savedSchool);
        setGrade(savedGrade || '');
        setClassNum(savedClassNum || '');
        setMajor(savedMajor || '');
      } else {
        setIsRegistered(false);
      }
    } catch (e) {
      console.log('데이터 불러오기 실패');
    }
  };

  const loadSavedNewsData = async () => {
    try {
      const savedData = await getSavedNews();
      setSavedNews(savedData || []);
    } catch (e) {
      console.log('뉴스 데이터 불러오기 실패', e);
    }
  };

  const handleRemoveBookmark = async (article: any) => {
    try {
      const updated = await toggleSaveNews(article);
      setSavedNews(updated);
    } catch (e) {
      console.log('뉴스 삭제 실패', e);
    }
  };

const saveData = async () => {
  if (!name.trim()) {
    Alert.alert('알림', '이름을 입력해주세요!');
    return;
  }
  if (!school || !grade || !classNum || !major) {
    Alert.alert('알림', '모든 학교 정보를 선택해주세요!');
    return;
  }

  try {
    await AsyncStorage.setItem('@user_name', name);
    await AsyncStorage.setItem('@school_name', school);
    await AsyncStorage.setItem('@grade', grade);
    await AsyncStorage.setItem('@class_num', classNum);
    await AsyncStorage.setItem('@major', major);

    const fullClassInfo = `${grade} ${classNum} ${major}`.trim();
    await AsyncStorage.setItem('@grade_class', fullClassInfo);

    // 📌 App Group 프로필 데이터 공유
    await SharedGroupPreferences.setItem(
      'userProfile',
      { name, school, grade, classNum, major },
      APP_GROUP
    );

    // 📌 컴시간 시간표 동기화 실행
    await syncSavedTimetableToWidget();

    setIsRegistered(true);
    Alert.alert('저장 완료', '맞춤 설정이 성공적으로 저장되었습니다!');
  } catch (e) {
    Alert.alert('저장 실패', '문제가 발생했습니다.');
  }
};

  const resetData = async () => {
    Alert.alert('정보 수정', '내 정보를 다시 설정하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '예',
        onPress: async () => {
          await AsyncStorage.multiRemove([
            '@user_name',
            '@school_name',
            '@grade',
            '@class_num',
            '@major',
            '@grade_class',
          ]);

          // 📌 App Group 데이터 초기화
          await SharedGroupPreferences.setItem('userProfile', null, APP_GROUP);

          setIsRegistered(false);
          setName('');
          setSchool('');
          setGrade('');
          setClassNum('');
          setMajor('');
        },
      },
    ]);
  };

  const openModal = (type: 'school' | 'grade' | 'class' | 'major') => {
    setCurrentType(type);
    setModalVisible(true);
  };

  const getListData = () => {
    switch (currentType) {
      case 'school':
        return SCHOOL_LIST;
      case 'grade':
        return GRADE_LIST;
      case 'class':
        return CLASS_LIST;
      case 'major':
        return MAJOR_LIST;
      default:
        return [];
    }
  };

  const handleSelect = (item: string) => {
    if (currentType === 'school') setSchool(item);
    if (currentType === 'grade') setGrade(item);
    if (currentType === 'class') setClassNum(item);
    if (currentType === 'major') setMajor(item);
    setModalVisible(false);
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {isRegistered ? (
          <>
            <Text style={styles.headerTitle}>설정</Text>

            {/* 프로필 카드 */}
            <View style={styles.profileCard}>
              <Text style={styles.profileName}>{name} 님</Text>
              <Text style={styles.profileDetail}>{school}</Text>
              <Text style={styles.profileDetailSub}>
                {grade} {classNum} {major}
              </Text>

              <TouchableOpacity style={styles.editButton} onPress={resetData}>
                <Text style={styles.editButtonText}>내 정보 수정하기</Text>
              </TouchableOpacity>
            </View>

            {/* 저장한 뉴스 메뉴 카드 */}
            <TouchableOpacity style={styles.menuCard} onPress={() => setNewsListModalVisible(true)}>
              <View style={styles.menuRow}>
                <View style={styles.menuLeft}>
                  <Text style={styles.menuIcon}>📰</Text>
                  <Text style={styles.menuText}>저장한 뉴스</Text>
                </View>
                <View style={styles.menuRight}>
                  <Text style={styles.countBadge}>{savedNews.length}개</Text>
                  <Text style={styles.arrowText}>❯</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* 앱 환경 설정 카드 */}
            <View style={[styles.menuCard, { marginTop: 12 }]}>
              <Text style={styles.menuTitle}>앱 환경 설정</Text>
              <View style={styles.menuItem}>
                <Text style={styles.menuText}>푸시 알림 받기</Text>
                <Text style={styles.menuSubText}>켜짐</Text>
              </View>
              <View style={styles.menuItem}>
                <Text style={styles.menuText}>앱 버전</Text>
                <Text style={styles.menuSubText}>v1.0.0</Text>
              </View>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.headerTitle}>사용자 맞춤 설정</Text>
            <Text style={styles.desc}>항목을 터치하여 내 정보를 간편하게 선택하세요.</Text>

            <View style={styles.card}>
              <Text style={styles.label}>이름</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="예: 홍길동"
                placeholderTextColor="#8E8E93"
              />

              <Text style={styles.label}>학교 이름</Text>
              <TouchableOpacity style={styles.selectBox} onPress={() => openModal('school')}>
                <Text style={[styles.selectText, !school && styles.placeholderText]}>
                  {school || '학교를 선택하세요'}
                </Text>
              </TouchableOpacity>

              <Text style={styles.label}>학년</Text>
              <TouchableOpacity style={styles.selectBox} onPress={() => openModal('grade')}>
                <Text style={[styles.selectText, !grade && styles.placeholderText]}>
                  {grade || '학년을 선택하세요'}
                </Text>
              </TouchableOpacity>

              <Text style={styles.label}>학급 (반)</Text>
              <TouchableOpacity style={styles.selectBox} onPress={() => openModal('class')}>
                <Text style={[styles.selectText, !classNum && styles.placeholderText]}>
                  {classNum || '반을 선택하세요'}
                </Text>
              </TouchableOpacity>

              <Text style={styles.label}>학과</Text>
              <TouchableOpacity style={styles.selectBox} onPress={() => openModal('major')}>
                <Text style={[styles.selectText, !major && styles.placeholderText]}>
                  {major || '학과를 선택하세요'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveButton} onPress={saveData}>
                <Text style={styles.saveButtonText}>설정 저장하기</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      {/* 📌 저장한 뉴스 목록 모달 (단일 모달 내부에서 목록 <-> 웹뷰 전환) */}
      <Modal
        visible={newsListModalVisible}
        animationType="slide"
        onRequestClose={() => {
          if (selectedNewsUrl) {
            setSelectedNewsUrl(null);
          } else {
            setNewsListModalVisible(false);
          }
        }}
      >
        <SafeAreaView style={styles.savedNewsContainer}>
          {/* A. 뉴스가 선택되었을 때 -> 웹뷰 화면 표시 */}
          {selectedNewsUrl ? (
            <View style={{ flex: 1 }}>
              <View style={styles.popupHeader}>
                <TouchableOpacity
                  onPress={() => setSelectedNewsUrl(null)}
                  style={styles.popupCloseButton}
                >
                  <Text style={styles.popupCloseText}>‹ 목록으로</Text>
                </TouchableOpacity>
                <Text style={styles.popupTitle}>뉴스 보기</Text>
                <View style={{ width: 60 }} />
              </View>

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
            </View>
          ) : (
            /* B. 뉴스가 선택되지 않았을 때 -> 목록 화면 표시 */
            <>
              <View style={styles.savedNewsHeader}>
                <Text style={styles.savedNewsTitle}>🔖 저장한 뉴스 목록</Text>
                <TouchableOpacity onPress={() => setNewsListModalVisible(false)}>
                  <Text style={styles.closeModalText}>닫기</Text>
                </TouchableOpacity>
              </View>

              {savedNews.length === 0 ? (
                <View style={styles.emptyCenter}>
                  <Text style={styles.emptyText}>저장된 뉴스가 없습니다.</Text>
                </View>
              ) : (
                <FlatList
                  data={savedNews}
                  keyExtractor={(_, index) => index.toString()}
                  contentContainerStyle={{ padding: 16 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.newsCard}
                      activeOpacity={0.7}
                      onPress={() => {
                        if (item.url) {
                          setSelectedNewsUrl(item.url);
                        } else {
                          Alert.alert('알림', '연결 가능한 뉴스 링크가 없습니다.');
                        }
                      }}
                    >
                      <View style={styles.newsCardHeader}>
                        <Text style={styles.categoryBadge}>{item.category || '주요뉴스'}</Text>
                        <TouchableOpacity onPress={() => handleRemoveBookmark(item)}>
                          <Text style={styles.deleteText}>삭제 🗑️</Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.newsTitle}>{item.title}</Text>
                      <Text style={styles.newsSummary}>{item.summary}</Text>
                    </TouchableOpacity>
                  )}
                />
              )}
            </>
          )}
        </SafeAreaView>
      </Modal>

      {/* 학교/학년/반/학과 선택 모달 */}
      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>항목 선택</Text>
            <FlatList
              data={getListData()}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalItem} onPress={() => handleSelect(item)}>
                  <Text style={styles.modalItemText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  contentContainer: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1C1C1E',
    marginBottom: 6,
    textAlign: 'center',
  },
  desc: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  profileDetail: {
    fontSize: 15,
    color: '#3A3A3C',
    fontWeight: '600',
  },
  profileDetailSub: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
    marginBottom: 16,
  },
  editButton: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  editButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countBadge: {
    fontSize: 13,
    fontWeight: '700',
    color: '#007AFF',
    marginRight: 6,
  },
  arrowText: {
    fontSize: 14,
    color: '#C7C7CC',
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 10,
    marginLeft: 4,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  menuText: {
    fontSize: 15,
    color: '#1C1C1E',
  },
  menuSubText: {
    fontSize: 15,
    color: '#8E8E93',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3A3A3C',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    fontSize: 15,
    color: '#1C1C1E',
  },
  selectBox: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    justifyContent: 'center',
  },
  selectText: {
    fontSize: 15,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  placeholderText: {
    color: '#8E8E93',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '50%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 15,
    color: '#1C1C1E',
  },
  modalItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
    alignItems: 'center',
  },
  modalItemText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  closeButton: {
    backgroundColor: '#E5E5EA',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 15,
  },
  closeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3A3A3C',
  },

  savedNewsContainer: { flex: 1, backgroundColor: '#FFF' },
  savedNewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  savedNewsTitle: { fontSize: 18, fontWeight: '700', color: '#1C1C1E' },
  closeModalText: { fontSize: 16, color: '#007AFF', fontWeight: '600' },
  emptyCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#8E8E93', fontSize: 15 },
  newsCard: { backgroundColor: '#F8F9FA', padding: 16, borderRadius: 12, marginBottom: 12 },
  newsCardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  categoryBadge: {
    backgroundColor: '#E8F0FE',
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  deleteText: { fontSize: 12, color: '#FF3B30', fontWeight: '600' },
  newsTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6, color: '#1C1C1E' },
  newsSummary: { fontSize: 14, color: '#666', lineHeight: 20 },

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
  popupCloseButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  popupCloseText: {
    fontSize: 15,
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