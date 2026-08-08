import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  // 예시 데이터 (나중에 DB나 상태관리로 연결할 부분입니다)
  const goalProgress = 0.65; // 65% 달성
  const currentClass = "마이크로프로세서 응용 (3교시)";
  const timeLeft = "18분 남음";
  const nextClass = "취업 역량 강화 특강 (4교시)";
  
  const todos = [
    { id: '1', title: 'CNC 밀링 실습 보고서 제출', done: true },
    { id: '2', title: '방과후 자율학습 신청하기', done: false },
    { id: '3', title: '전공 자격증 기출문제 1회 풀기', done: false },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* 1. 상단: 목표 달성률 프로그레스 바 */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.cardTitle}>오늘의 목표 달성률</Text>
          <Text style={styles.percentText}>{Math.round(goalProgress * 100)}%</Text>
        </View>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${goalProgress * 100}%` }]} />
        </View>
      </View>

      {/* 2. 중앙: 현재 시간표 & 남은 시간 / 다음 시간표 */}
      <View style={styles.highlightCard}>
        <View style={styles.rowBetween}>
          <Text style={styles.badge}>실시간 진행 중</Text>
          <Text style={styles.timeLeftText}>{timeLeft}</Text>
        </View>
        <Text style={styles.currentClassText}>{currentClass}</Text>
        <View style={styles.divider} />
        <Text style={styles.nextClassLabel}>다음 수업</Text>
        <Text style={styles.nextClassText}>{nextClass}</Text>
      </View>

      {/* 3. 하단: 오늘 할 일 (To-Do List) */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>오늘의 할 일 리스트</Text>
        {todos.map((item) => (
          <View key={item.id} style={styles.todoItem}>
            <Ionicons 
              name={item.done ? "checkbox" : "square-outline"} 
              size={22} 
              color={item.done ? "#34C759" : "#8E8E93"} 
            />
            <Text style={[styles.todoText, item.done && styles.todoDoneText]}>
              {item.title}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// 스타일링 (애플 감성의 깔끔한 여백과 둥근 모서리)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  highlightCard: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
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
  },
  progressBarBackground: {
    height: 10,
    backgroundColor: '#E5E5EA',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 5,
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    color: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 12,
    fontWeight: '600',
    overflow: 'hidden',
  },
  timeLeftText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  currentClassText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginVertical: 4,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginVertical: 12,
  },
  nextClassLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  nextClassText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 2,
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  todoText: {
    marginLeft: 12,
    fontSize: 15,
    color: '#3A3A3C',
  },
  todoDoneText: {
    textDecorationLine: 'line-through',
    color: '#8E8E93',
  },
});