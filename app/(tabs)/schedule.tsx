import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const DAYS = ['월', '화', '수', '목', '금'];

export default function ScheduleScreen() {
  const [weekType, setWeekType] = useState<'current' | 'next'>('current'); // 이번주 / 다음주 선택
  const [selectedDay, setSelectedDay] = useState('월');
  
  // 이번주 시간표 데이터 & 다음주 시간표 데이터 상태 분리
  const [currentWeekSchedule, setCurrentWeekSchedule] = useState<Record<string, string[]>>({
    '월': [], '화': [], '수': [], '목': [], '금': []
  });
  const [nextWeekSchedule, setNextWeekSchedule] = useState<Record<string, string[]>>({
    '월': [], '화': [], '수': [], '목': [], '금': []
  });

  // 수정 모달 상태
  const [modalVisible, setModalVisible] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadSchedules();
    }, [])
  );

  const loadSchedules = async () => {
    try {
      // 1. 이번주 시간표 로드
      const savedCurrent = await AsyncStorage.getItem('@current_week_schedule');
      if (savedCurrent) {
        setCurrentWeekSchedule(JSON.parse(savedCurrent));
      } else {
        const defaultSched = {
          '월': ['전공기초실습', '전공기초실습', '프로그래밍', '프로그래밍', '수학', '영어', '체육'],
          '화': ['자료구조', '자료구조', '운영체제', '운영체제', '국어', '한국사', '창체'],
          '수': ['웹프로그래밍', '웹프로그래밍', '데이터베이스', '데이터베이스', '영어', '수학', '미술'],
          '목': ['모바일앱개발', '모바일앱개발', '네트워크보안', '네트워크보안', '국어', '과학', '음악'],
          '금': ['프로젝트실습', '프로젝트실습', '프로젝트실습', '취업역량강화', '진로', '동아리', '동아리'],
        };
        setCurrentWeekSchedule(defaultSched);
        await AsyncStorage.setItem('@current_week_schedule', JSON.stringify(defaultSched));
      }

      // 2. 다음주 시간표 로드
      const savedNext = await AsyncStorage.getItem('@next_week_schedule');
      if (savedNext) {
        setNextWeekSchedule(JSON.parse(savedNext));
      } else {
        const defaultNextSched = {
          '월': ['소프트웨어공학', '소프트웨어공학', '알고리즘', '알고리즘', '수학', '영어', '자율'],
          '화': ['네트워크', '네트워크', '임베디드시스', '임베디드시스', '국어', '사회', '창체'],
          '수': ['응용프로그래밍', '응용프로그래밍', '빅데이터기초', '빅데이터기초', '영어', '수학', '체육'],
          '목': ['클라우드컴퓨팅', '클라우드컴퓨팅', '정보보안', '정보보안', '국어', '과학', '음악'],
          '금': ['캡스톤디자인', '캡스톤디자인', '캡스톤디자인', '취업특강', '진로', '동아리', '동아리'],
        };
        setNextWeekSchedule(defaultNextSched);
        await AsyncStorage.setItem('@next_week_schedule', JSON.stringify(defaultNextSched));
      }
    } catch (e) {
      console.log('시간표 로드 실패');
    }
  };

  // 수정 모달 오픈
  const openEditModal = (index: number, currentSubject: string) => {
    setEditIndex(index);
    setEditText(currentSubject);
    setModalVisible(true);
  };

  // 과목 저장
  const saveSubject = async () => {
    if (editIndex === null) return;

    if (weekType === 'current') {
      const updatedList = [...(currentWeekSchedule[selectedDay] || [])];
      updatedList[editIndex] = editText;
      const newMap = { ...currentWeekSchedule, [selectedDay]: updatedList };
      setCurrentWeekSchedule(newMap);
      await AsyncStorage.setItem('@current_week_schedule', JSON.stringify(newMap));
    } else {
      const updatedList = [...(nextWeekSchedule[selectedDay] || [])];
      updatedList[editIndex] = editText;
      const newMap = { ...nextWeekSchedule, [selectedDay]: updatedList };
      setNextWeekSchedule(newMap);
      await AsyncStorage.setItem('@next_week_schedule', JSON.stringify(newMap));
    }

    setModalVisible(false);
    Alert.alert('완료', '시간표가 수정되었습니다.');
  };

  const activeScheduleMap = weekType === 'current' ? currentWeekSchedule : nextWeekSchedule;
  const currentSubjects = activeScheduleMap[selectedDay] || [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      
      {/* 상단 타이틀 */}
      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>🏫 전체 학교 시간표</Text>
        <Text style={styles.headerSub}>수원하이텍마이스터고등학교</Text>
      </View>

      {/* 이번주 / 다음주 선택 탭 */}
      <View style={styles.weekTabRow}>
        <TouchableOpacity 
          style={[styles.weekTabButton, weekType === 'current' && styles.weekTabActive]}
          onPress={() => setWeekType('current')}
        >
          <Text style={[styles.weekTabText, weekType === 'current' && styles.weekTabTextActive]}>이번주 시간표</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.weekTabButton, weekType === 'next' && styles.weekTabActive]}
          onPress={() => setWeekType('next')}
        >
          <Text style={[styles.weekTabText, weekType === 'next' && styles.weekTabTextActive]}>다음주 시간표</Text>
        </TouchableOpacity>
      </View>

      {/* 요일 선택 탭 (월~금) */}
      <View style={styles.dayTabRow}>
        {DAYS.map(day => (
          <TouchableOpacity
            key={day}
            style={[styles.dayButton, selectedDay === day && styles.dayButtonActive]}
            onPress={() => setSelectedDay(day)}
          >
            <Text style={[styles.dayButtonText, selectedDay === day && styles.dayButtonTextActive]}>
              {day}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 선택한 주/요일의 시간표 리스트 */}
      <View style={styles.scheduleCard}>
        <Text style={styles.tableTitle}>
          {weekType === 'current' ? '📌 이번주' : '📌 다음주'} {selectedDay}요일 과목 (터치하여 수정)
        </Text>
        
        {currentSubjects.map((subject, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.periodRow}
            onPress={() => openEditModal(index, subject)}
          >
            <View style={styles.periodBadge}>
              <Text style={styles.periodBadgeText}>{index + 1}교시</Text>
            </View>
            <Text style={styles.subjectText}>{subject || '공강'}</Text>
            <Text style={styles.editText}>수정</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 과목 수정 모달 */}
      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editIndex !== null ? `${editIndex + 1}교시 과목 수정` : ''}</Text>
            <TextInput
              style={styles.input}
              value={editText}
              onChangeText={setEditText}
              placeholder="과목명을 입력하세요"
              placeholderTextColor="#8E8E93"
            />
            <View style={styles.modalButtonRow}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={saveSubject}>
                <Text style={styles.confirmButtonText}>저장</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  contentContainer: { padding: 20, paddingBottom: 40 },
  
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1C1C1E', marginBottom: 4 },
  headerSub: { fontSize: 13, color: '#8E8E93', fontWeight: '600' },

  weekTabRow: {
    flexDirection: 'row',
    backgroundColor: '#E5E5EA',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  weekTabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  weekTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  weekTabText: { fontSize: 14, fontWeight: '700', color: '#8E8E93' },
  weekTabTextActive: { color: '#1C1C1E' },
  
  dayTabRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dayButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 3,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  dayButtonActive: { backgroundColor: '#007AFF' },
  dayButtonText: { fontSize: 15, fontWeight: '700', color: '#3A3A3C' },
  dayButtonTextActive: { color: '#FFFFFF' },
  
  scheduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  tableTitle: { fontSize: 13, fontWeight: '700', color: '#8E8E93', marginBottom: 14 },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  periodBadge: {
    backgroundColor: '#E5E5EA',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 12,
  },
  periodBadgeText: { fontSize: 12, fontWeight: '700', color: '#3A3A3C' },
  subjectText: { fontSize: 15, fontWeight: '600', color: '#1C1C1E', flex: 1 },
  editText: { fontSize: 13, color: '#007AFF', fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, width: '100%', maxWidth: 340 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1C1C1E', marginBottom: 15, textAlign: 'center' },
  input: { backgroundColor: '#F2F2F7', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, fontSize: 16, color: '#1C1C1E', marginBottom: 20 },
  modalButtonRow: { flexDirection: 'row', justifyContent: 'space-between' },
  cancelButton: { flex: 1, backgroundColor: '#E5E5EA', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginRight: 6 },
  cancelButtonText: { fontSize: 15, fontWeight: '600', color: '#3A3A3C' },
  confirmButton: { flex: 1, backgroundColor: '#007AFF', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginLeft: 6 },
  confirmButtonText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});