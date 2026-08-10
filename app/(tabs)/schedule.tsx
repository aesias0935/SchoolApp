import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// 📌 기존 comci-parser 제거 후 서비스 모듈 연동
import { syncSavedTimetableToWidget } from '../../services/comtime';

export default function ScheduleScreen() {
  const router = useRouter();

  const [schoolInfo, setSchoolInfo] = useState({
    school: '수원하이텍마이스터고등학교',
    grade: '2',
    classNum: '8',
    major: '전기전자제어과',
  });

  const [selectedDay, setSelectedDay] = useState('월');
  const [loading, setLoading] = useState<boolean>(false);
  const [scheduleMap, setScheduleMap] = useState<Record<string, string[]>>({
    '월': [], '화': [], '수': [], '목': [], '금': []
  });

  useFocusEffect(
    useCallback(() => {
      loadInfoAndSchedule();
    }, [])
  );

  const loadInfoAndSchedule = async () => {
    setLoading(true);
    try {
      const savedSchool = await AsyncStorage.getItem('@school_name');
      const savedGrade = await AsyncStorage.getItem('@grade');
      const savedClassNum = await AsyncStorage.getItem('@class_num');
      const savedMajor = await AsyncStorage.getItem('@major');

      const gradeClean = savedGrade ? savedGrade.replace(/[^0-9]/g, '') : '2';
      const classClean = savedClassNum ? savedClassNum.replace(/[^0-9]/g, '') : '8';
      const majorClean = savedMajor ? savedMajor.replace(/[()]/g, '') : '전기전자제어과';
      const schoolClean = savedSchool || '수원하이텍마이스터고등학교';

      setSchoolInfo({
        school: schoolClean,
        grade: gradeClean,
        classNum: classClean,
        major: majorClean,
      });

      // 1. 저장되어 있는 주간 시간표 데이터 로드
      const savedSchedule = await AsyncStorage.getItem('@current_week_schedule');
      if (savedSchedule) {
        setScheduleMap(JSON.parse(savedSchedule));
      }

      // 2. 시간표 & 위젯 최신 데이터 동기화 함수 호출
      await syncSavedTimetableToWidget();

      // 동기화 후 업데이트된 스토리지 재로드
      const updatedSchedule = await AsyncStorage.getItem('@current_week_schedule');
      if (updatedSchedule) {
        setScheduleMap(JSON.parse(updatedSchedule));
      }
    } catch (e) {
      console.log('시간표 초기화 실패:', e);
    } finally {
      setLoading(false);
    }
  };

  const currentSubjects = scheduleMap[selectedDay] || [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>〈 홈으로</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>전체 시간표</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoCardTitle}>🏫 컴시간알리미 실시간 연동</Text>
        <Text style={styles.infoCardSub}>
          {schoolInfo.school} {schoolInfo.grade}학년 {schoolInfo.classNum}반 ({schoolInfo.major})
        </Text>
      </View>

      <View style={styles.dayTabContainer}>
        {['월', '화', '수', '목', '금'].map(day => (
          <TouchableOpacity
            key={day}
            style={[styles.dayTab, selectedDay === day && styles.dayTabActive]}
            onPress={() => setSelectedDay(day)}
          >
            <Text style={[styles.dayTabText, selectedDay === day && styles.dayTabTextActive]}>
              {day}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.scheduleCard}>
        <Text style={styles.scheduleCardHeader}>📌 이번주 {selectedDay}요일 시간표</Text>
        
        {loading ? (
          <ActivityIndicator size="small" color="#007AFF" style={{ paddingVertical: 20 }} />
        ) : currentSubjects.length === 0 ? (
          <Text style={styles.emptyText}>등록된 시간표 정보가 없습니다.</Text>
        ) : (
          currentSubjects.map((subject, index) => (
            <View key={index} style={styles.periodRow}>
              <View style={styles.periodBadge}>
                <Text style={styles.periodBadgeText}>{index + 1}교시</Text>
              </View>
              <Text style={styles.subjectText}>{subject}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  contentContainer: { padding: 20, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 10 },
  backButton: { fontSize: 16, fontWeight: '600', color: '#007AFF' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1C1C1E' },
  infoCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, marginBottom: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  infoCardTitle: { fontSize: 16, fontWeight: '700', color: '#1C1C1E', marginBottom: 4 },
  infoCardSub: { fontSize: 13, color: '#8E8E93', fontWeight: '500' },
  dayTabContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  dayTab: { flex: 1, backgroundColor: '#E5E5EA', paddingVertical: 12, alignItems: 'center', marginHorizontal: 4, borderRadius: 12 },
  dayTabActive: { backgroundColor: '#007AFF' },
  dayTabText: { fontSize: 15, fontWeight: '600', color: '#3A3A3C' },
  dayTabTextActive: { color: '#FFFFFF' },
  scheduleCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  scheduleCardHeader: { fontSize: 15, fontWeight: '700', color: '#1C1C1E', marginBottom: 14 },
  periodRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  periodBadge: { backgroundColor: '#E5E5EA', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginRight: 14 },
  periodBadgeText: { fontSize: 13, fontWeight: '700', color: '#3A3A3C' },
  subjectText: { fontSize: 15, fontWeight: '600', color: '#1C1C1E', flex: 1 },
  emptyText: { textAlign: 'center', color: '#8E8E93', paddingVertical: 20, fontSize: 14 },
});