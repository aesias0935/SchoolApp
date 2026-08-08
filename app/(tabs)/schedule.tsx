import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';


export default function ScheduleScreen() {
  const router = useRouter();

  // 학교 및 학년/반 정보 상태
  const [schoolInfo, setSchoolInfo] = useState({
    school: '수원하이텍마이스터고등학교',
    grade: '2',
    classNum: '8',
    major: '전기전자제어과',
  });

  // 이번주 요일 탭 상태 ('월', '화', '수', '목', '금')
  const [selectedDay, setSelectedDay] = useState('월');

  // 요일별 시간표 데이터 상태
  const [scheduleMap, setScheduleMap] = useState<Record<string, string[]>>({
    '월': [], '화': [], '수': [], '목': [], '금': []
  });

  // 1. 저장된 사용자 정보 및 NEIS 시간표 불러오기
// 화면에 진입할 때마다(설정 변경 후 돌아올 때 포함) 사용자 정보와 시간표를 새로 불러옴
  useFocusEffect(
    useCallback(() => {
      loadInfoAndSchedule();
    }, [])
  );
const loadInfoAndSchedule = async () => {
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

      // 💡 핵심: 학년이나 반이 바뀔 수 있으므로, 캐시를 바로 쓰기보다 
      // 최신 학년/반 정보로 NEIS API를 강제로 다시 호출해서 덮어씌우는 것이 안전합니다.
      await fetchNeisSchedule(gradeClean, classClean);

    } catch (e) {
      console.log('시간표 초기화 실패:', e);
    }
  };
  // 2. NEIS API 호출 및 파싱 함수
  const fetchNeisSchedule = async (grade: string, classNum: string) => {
    try {
      // TODO: 교육청 코드 및 학교 코드가 정해져 있다면 아래에 입력하세요.
      // 기본값 예시: 경기도교육청 (J10), 수원하이텍마이스터고 (7530756 등)
      // 표준 개방 포털 인증키가 있다면 KEY 파라미터에 넣을 수 있습니다 (없으면 샘플키 'sample' 사용 가능)
      const ATPT_OFCDC_SC_CODE = 'J10'; // 경기도교육청 예시
      const SD_SCHUL_CODE = '7530756';   // 학교 코드 예시
      const currentYear = new Date().getFullYear().toString();

      const url = `https://open.neis.go.kr/hub/hiTimetable?KEY=sample&Type=json&ATPT_OFCDC_SC_CODE=${ATPT_OFCDC_SC_CODE}&SD_SCHUL_CODE=${SD_SCHUL_CODE}&AY=${currentYear}&SEM=1&GRADE=${grade}&CLASS_NM=${classNum}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data && data.hiTimetable) {
        const rows = data.hiTimetable[1].row;
        const newMap = parseNeisSchedule(rows);

        setScheduleMap(newMap);
        await AsyncStorage.setItem('@current_week_schedule', JSON.stringify(newMap));
      }
    } catch (error) {
      console.log('NEIS API 연동 실패 (오프라인 모드 또는 인증키 확인 필요):', error);
    }
  };

  // 3. NEIS 낱개 데이터를 요일별/교시별 배열로 변환하는 파서
  const parseNeisSchedule = (rows: any[]) => {
    const map: Record<string, string[]> = { '월': [], '화': [], '수': [], '목': [], '금': [] };
    
    rows.forEach(row => {
      const ymd = row.ALL_TI_YMD; // 예: "20260608"
      if (!ymd) return;
      const year = parseInt(ymd.substring(0, 4));
      const month = parseInt(ymd.substring(4, 6)) - 1;
      const day = parseInt(ymd.substring(6, 8));
      
      const dateObj = new Date(year, month, day);
      const dayIndex = dateObj.getDay(); // 1: 월 ~ 5: 금
      const dayMapName: Record<number, string> = { 1: '월', 2: '화', 3: '수', 4: '목', 5: '금' };
      const targetDayStr = dayMapName[dayIndex];
      
      if (targetDayStr) {
        const periodNum = parseInt(row.PERIO) - 1; // 1교시 -> 인덱스 0
        if (!map[targetDayStr]) map[targetDayStr] = [];
        map[targetDayStr][periodNum] = row.ITRT_CNTNT; // 과목명
      }
    });

    // 1~7교시 빈 칸 메우기
    Object.keys(map).forEach(day => {
      for (let i = 0; i < 7; i++) {
        if (!map[day][i]) {
          map[day][i] = '수업 없음';
        }
      }
    });

    return map;
  };

  const currentSubjects = scheduleMap[selectedDay] || [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      
      {/* 상단 타이틀 및 뒤로가기 */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>〈 홈으로</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>전체 시간표</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* 학교 정보 카드 */}
      <View style={styles.infoCard}>
        <Text style={styles.infoCardTitle}>🏫 학교 시간표 실시간 연동</Text>
        <Text style={styles.infoCardSub}>
          {schoolInfo.school} {schoolInfo.grade}학년 {schoolInfo.classNum}반 ({schoolInfo.major})
        </Text>
      </View>

      {/* 요일 탭 버튼 (월~금) */}
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

      {/* 선택된 요일의 시간표 리스트 */}
      <View style={styles.scheduleCard}>
        <Text style={styles.scheduleCardHeader}>📌 이번주 {selectedDay}요일 시간표</Text>
        
        {currentSubjects.length === 0 ? (
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