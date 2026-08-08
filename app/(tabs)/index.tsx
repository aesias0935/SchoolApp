import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const [school, setSchool] = useState('수원하이텍마이스터고등학교');
  const [gradeClass, setGradeClass] = useState('정보 입력 필요');
  const [userName, setUserName] = useState('학생');

  // 1. 오늘 하루 목표 리스트 상태
  const [dailyTodos, setDailyTodos] = useState([
    { id: 1, text: '전공 실습 일지 작성하기', completed: true },
    { id: 2, text: '방과후 자율학습 참여', completed: false },
  ]);
  const [newDailyText, setNewDailyText] = useState('');

  // 2. 전체(장기) 목표 리스트 상태
  const [longTermGoals, setLongTermGoals] = useState([
    { id: 1, text: '컴퓨터활용능력 2급 자격증 취득', completed: false },
    { id: 2, text: '졸업 포트폴리오 초안 완성', completed: true },
  ]);
  const [newLongTermText, setNewLongTermText] = useState('');

  // 3. 모달 제어 상태 ('daily' | 'longterm' | null)
  const [activeModal, setActiveModal] = useState<'daily' | 'longterm' | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadUserDataAndCheckDate();
    }, [])
  );

  const loadUserDataAndCheckDate = async () => {
    try {
      const savedSchool = await AsyncStorage.getItem('@school_name');
      const savedGradeClass = await AsyncStorage.getItem('@grade_class');
      const savedName = await AsyncStorage.getItem('@user_name');
      
      if (savedSchool) setSchool(savedSchool);
      if (savedGradeClass) setGradeClass(savedGradeClass);
      if (savedName) setUserName(savedName);

      // --- 날짜 변경 체크 및 하루 목표 자동 초기화 로직 ---
      const todayStr = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
      const lastLoginDate = await AsyncStorage.getItem('@last_login_date');
      const savedDailyTodos = await AsyncStorage.getItem('@daily_todos');

      if (savedDailyTodos) {
        const parsedTodos = JSON.parse(savedDailyTodos);
        if (lastLoginDate !== todayStr) {
          // 날짜가 바뀌었으므로 하루 목표의 체크 상태를 모두 false로 초기화!
          const resetTodos = parsedTodos.map((item: any) => ({ ...item, completed: false }));
          setDailyTodos(resetTodos);
          await AsyncStorage.setItem('@daily_todos', JSON.stringify(resetTodos));
          await AsyncStorage.setItem('@last_login_date', todayStr);
        } else {
          setDailyTodos(parsedTodos);
        }
      } else {
        await AsyncStorage.setItem('@last_login_date', todayStr);
      }

      // 장기 목표 불러오기
      const savedLongTerm = await AsyncStorage.getItem('@longterm_goals');
      if (savedLongTerm) {
        setLongTermGoals(JSON.parse(savedLongTerm));
      }

    } catch (e) {
      console.log('데이터 불러오기 실패');
    }
  };

  // 저장 헬퍼 함수
  const saveDailyToStorage = async (newTodos: typeof dailyTodos) => {
    setDailyTodos(newTodos);
    await AsyncStorage.setItem('@daily_todos', JSON.stringify(newTodos));
  };

  const saveLongTermToStorage = async (newGoals: typeof longTermGoals) => {
    setLongTermGoals(newGoals);
    await AsyncStorage.setItem('@longterm_goals', JSON.stringify(newGoals));
  };

  const toggleDailyTodo = (id: number) => {
    const updated = dailyTodos.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    saveDailyToStorage(updated);
  };

  const toggleLongTermGoal = (id: number) => {
    const updated = longTermGoals.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    saveLongTermToStorage(updated);
  };

  const addDailyTodo = () => {
    if (!newDailyText.trim()) return;
    const updated = [...dailyTodos, { id: Date.now(), text: newDailyText, completed: false }];
    saveDailyToStorage(updated);
    setNewDailyText('');
  };

  const addLongTermGoal = () => {
    if (!newLongTermText.trim()) return;
    const updated = [...longTermGoals, { id: Date.now(), text: newLongTermText, completed: false }];
    saveLongTermToStorage(updated);
    setNewLongTermText('');
  };

  // 목표 삭제 함수
  const deleteDailyTodo = (id: number) => {
    const updated = dailyTodos.filter(item => item.id !== id);
    saveDailyToStorage(updated);
  };

  const deleteLongTermGoal = (id: number) => {
    const updated = longTermGoals.filter(item => item.id !== id);
    saveLongTermToStorage(updated);
  };

  const calculatePercent = (list: { completed: boolean }[]) => {
    if (list.length === 0) return 0;
    const completedCount = list.filter(item => item.completed).length;
    return Math.round((completedCount / list.length) * 100);
  };

  const dailyPercent = calculatePercent(dailyTodos);
  const longTermPercent = calculatePercent(longTermGoals);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      
      {/* 상단 헤더 */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>{userName} 님의 홈</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{school} · {gradeClass}</Text>
        </View>
      </View>

      {/* 1. 전체 장기 목표 요약 카드 */}
      <TouchableOpacity 
        style={styles.card} 
        activeOpacity={0.8} 
        onPress={() => setActiveModal('longterm')}
      >
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.cardTitle}>🎯 전체 장기 목표 달성률</Text>
            <Text style={styles.cardSubText}>터치하여 자격증 및 취업 목표 관리</Text>
          </View>
          <Text style={[styles.percentText, { color: '#34C759' }]}>{longTermPercent}%</Text>
        </View>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${longTermPercent}%`, backgroundColor: '#34C759' }]} />
        </View>
        <Text style={styles.previewText}>
          달성한 목표: {longTermGoals.filter(i => i.completed).length} / {longTermGoals.length}개
        </Text>
      </TouchableOpacity>

      {/* 2. 오늘 하루 목표 요약 카드 */}
      <TouchableOpacity 
        style={styles.card} 
        activeOpacity={0.8} 
        onPress={() => setActiveModal('daily')}
      >
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.cardTitle}>📅 오늘 하루 목표 달성률</Text>
            <Text style={styles.cardSubText}>터치하여 상세 관리 및 추가하기</Text>
          </View>
          <Text style={styles.percentText}>{dailyPercent}%</Text>
        </View>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${dailyPercent}%` }]} />
        </View>
        <Text style={styles.previewText}>
          완료된 항목: {dailyTodos.filter(i => i.completed).length} / {dailyTodos.length}개
        </Text>
      </TouchableOpacity>

      {/* 팝업 모달창 (하루 목표 / 장기 목표 공용) */}
      <Modal visible={activeModal !== null} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            <Text style={styles.modalTitle}>
              {activeModal === 'daily' ? '📅 오늘 하루 목표 상세 관리' : '🎯 전체 장기 목표 상세 관리'}
            </Text>
            
            {/* 목록 표시 + 삭제 버튼 */}
            <ScrollView style={styles.modalListContainer}>
              {(activeModal === 'daily' ? dailyTodos : longTermGoals).map(item => (
                <View key={item.id} style={styles.todoRowItem}>
                  <TouchableOpacity 
                    style={styles.todoMainTouch} 
                    onPress={() => activeModal === 'daily' ? toggleDailyTodo(item.id) : toggleLongTermGoal(item.id)}
                  >
                    <View style={[
                      styles.checkbox, 
                      item.completed && (activeModal === 'daily' ? styles.checkboxChecked : styles.checkboxCheckedGreen)
                    ]}>
                      {item.completed && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <Text style={[styles.todoText, item.completed && styles.todoTextCompleted]}>
                      {item.text}
                    </Text>
                  </TouchableOpacity>

                  {/* 삭제 버튼 */}
                  <TouchableOpacity 
                    style={styles.deleteButton} 
                    onPress={() => activeModal === 'daily' ? deleteDailyTodo(item.id) : deleteLongTermGoal(item.id)}
                  >
                    <Text style={styles.deleteButtonText}>삭제</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            {/* 입력창 */}
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={activeModal === 'daily' ? newDailyText : newLongTermText}
                onChangeText={activeModal === 'daily' ? setNewDailyText : setNewLongTermText}
                placeholder={activeModal === 'daily' ? '새로운 하루 목표 입력' : '새로운 장기 목표 입력'}
                placeholderTextColor="#8E8E93"
              />
              <TouchableOpacity 
                style={[styles.addButton, activeModal === 'longterm' && { backgroundColor: '#34C759' }]} 
                onPress={activeModal === 'daily' ? addDailyTodo : addLongTermGoal}
              >
                <Text style={styles.addButtonText}>추가</Text>
              </TouchableOpacity>
            </View>

            {/* 닫기 버튼 */}
            <TouchableOpacity style={styles.closeButton} onPress={() => setActiveModal(null)}>
              <Text style={styles.closeButtonText}>닫기</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  contentContainer: { padding: 20, paddingBottom: 40 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 10,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#1C1C1E' },
  badge: { backgroundColor: '#E5E5EA', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#3A3A3C' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1C1C1E', marginBottom: 2 },
  cardSubText: { fontSize: 12, color: '#8E8E93' },
  percentText: { fontSize: 18, fontWeight: '800', color: '#007AFF' },
  progressBarBackground: { height: 8, backgroundColor: '#E5E5EA', borderRadius: 4, overflow: 'hidden', marginBottom: 10 },
  progressBarFill: { height: '100%', backgroundColor: '#007AFF', borderRadius: 4 },
  previewText: { fontSize: 13, color: '#8E8E93', fontWeight: '500' },
  
  // 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalListContainer: {
    maxHeight: 250,
    marginBottom: 15,
  },
  todoRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  todoMainTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#C7C7CC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  checkboxCheckedGreen: { backgroundColor: '#34C759', borderColor: '#34C759' },
  checkmark: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  todoText: { fontSize: 15, color: '#1C1C1E', flex: 1 },
  todoTextCompleted: { color: '#8E8E93', textDecorationLine: 'line-through' },
  deleteButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  deleteButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  input: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    fontSize: 14,
    color: '#1C1C1E',
    marginRight: 8,
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  closeButton: {
    backgroundColor: '#E5E5EA',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 5,
  },
  closeButtonText: { fontSize: 15, fontWeight: '700', color: '#3A3A3C' },
});