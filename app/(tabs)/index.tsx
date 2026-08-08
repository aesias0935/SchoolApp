import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const [school, setSchool] = useState('마이스터고등학교');
  const [gradeClass, setGradeClass] = useState('정보 입력 필요');
  const [todos, setTodos] = useState([
    { id: 1, text: 'CNC 밀링 실습 보고서 제출', completed: true },
    { id: 2, text: '방과후 자율학습 신청하기', completed: false },
    { id: 3, text: '전공 자격증 기출문제 1회 풀기', completed: false },
  ]);

  // 메인 화면으로 돌아올 때마다 설정된 사용자 정보 불러오기
  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [])
  );

  const loadUserData = async () => {
    try {
      const savedSchool = await AsyncStorage.getItem('@school_name');
      const savedGradeClass = await AsyncStorage.getItem('@grade_class');
      if (savedSchool) setSchool(savedSchool);
      if (savedGradeClass) setGradeClass(savedGradeClass);
    } catch (e) {
      console.log('데이터를 불러오는 중 에러가 발생했습니다.');
    }
  };

  const toggleTodo = (id: number) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      
      {/* 상단 헤더 (학교 및 학급 정보 연동) */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>HOME</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{school} · {gradeClass}</Text>
        </View>
      </View>

      {/* 오늘의 목표 달성률 */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.cardTitle}>오늘의 목표 달성률</Text>
          <Text style={styles.percentText}>65%</Text>
        </View>
        <View style={styles.progressBarBackground}>
          <View style={styles.progressBarFill} />
        </View>
      </View>

      {/* 실시간 진행 중인 수업 카드 */}
      <View style={styles.classCard}>
        <View style={styles.rowBetween}>
          <View style={styles.liveBadge}>
            <Text style={styles.liveBadgeText}>실시간 진행 중</Text>
          </View>
          <Text style={styles.timeRemaining}>18분 남음</Text>
        </View>
        <Text style={styles.currentClassTitle}>마이크로프로세서 응용 (3교시)</Text>
        <View style={styles.divider} />
        <Text style={styles.nextClassText}>다음 수업: 취업 역량 강화 특강 (4교시)</Text>
      </View>

      {/* 오늘의 할 일 리스트 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>오늘의 할 일 리스트</Text>
        {todos.map(todo => (
          <TouchableOpacity 
            key={todo.id} 
            style={styles.todoItem} 
            onPress={() => toggleTodo(todo.id)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, todo.completed && styles.checkboxChecked]}>
              {todo.completed && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={[styles.todoText, todo.completed && styles.todoTextCompleted]}>
              {todo.text}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  badge: {
    backgroundColor: '#E5E5EA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3A3A3C',
  },
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
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  percentText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 12,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    width: '65%',
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  classCard: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  liveBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  liveBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  timeRemaining: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  currentClassTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 12,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 10,
  },
  nextClassText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
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
  checkboxChecked: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  todoText: {
    fontSize: 15,
    color: '#1C1C1E',
  },
  todoTextCompleted: {
    color: '#8E8E93',
    textDecorationLine: 'line-through',
  },
});