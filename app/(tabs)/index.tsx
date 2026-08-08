import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// 종례 및 수업 시간표 기준 정의
const PERIOD_TIMES = [
  { period: 1, start: '08:50', end: '09:40' },
  { period: 2, start: '09:50', end: '10:40' },
  { period: 3, start: '10:50', end: '11:40' },
  { period: 4, start: '11:50', end: '12:40' },
  { period: 5, start: '13:40', end: '14:30' },
  { period: 6, start: '14:40', end: '15:30' },
  { period: 7, start: '15:40', end: '16:30' },
];

export default function HomeScreen() {
  const router = useRouter();

  const [school, setSchool] = useState('수원하이텍마이스터고등학교');
  const [gradeClass, setGradeClass] = useState('정보 입력 필요');
  const [userName, setUserName] = useState('학생');

  // 목표 관련 상태
  const [dailyTodos, setDailyTodos] = useState<any[]>([]);
  const [newDailyText, setNewDailyText] = useState('');
  
  const [longTermGoals, setLongTermGoals] = useState<any[]>([]);
  const [newLongTermText, setNewLongTermText] = useState('');

  // 실시간 타이머 및 현재/다음 교시 상태
  const [statusTitle, setStatusTitle] = useState('수업 시간이 아닙니다');
  const [statusTimer, setStatusTimer] = useState('');
  const [nextSubjectInfo, setNextSubjectInfo] = useState('');

  // 다가오는 일정 상태
  const [nextEvent, setNextEvent] = useState<{ dateStr: string; title: string } | null>(null);

  // 화면에 들어올 때 데이터 로드
  useFocusEffect(
    useCallback(() => {
      loadUserDataAndCheckDate();
      loadNextEvent();
    }, [])
  );

  const loadUserDataAndCheckDate = async () => {
    try {
      const savedSchool = await AsyncStorage.getItem('@school_name');
      const savedGrade = await AsyncStorage.getItem('@grade');
      const savedClassNum = await AsyncStorage.getItem('@class_num');
      const savedMajor = await AsyncStorage.getItem('@major');
      const savedName = await AsyncStorage.getItem('@user_name');
      
      if (savedSchool) setSchool(savedSchool);
      
      if (savedGrade && savedClassNum) {
        const cleanGrade = savedGrade.replace(/[^0-9]/g, '');
        const cleanClass = savedClassNum.replace(/[^0-9]/g, '');
        const cleanMajor = savedMajor ? savedMajor.replace(/[()]/g, '') : '소프트웨어과';

        setGradeClass(`${cleanGrade}학년 ${cleanClass}반 (${cleanMajor})`);
      }

      if (savedName) setUserName(savedName);

      const todayStr = new Date().toISOString().split('T')[0];
      const lastLoginDate = await AsyncStorage.getItem('@last_login_date');
      const savedDailyTodos = await AsyncStorage.getItem('@daily_todos');

      if (savedDailyTodos) {
        const parsedTodos = JSON.parse(savedDailyTodos);
        if (lastLoginDate !== todayStr) {
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

      const savedLongTerm = await AsyncStorage.getItem('@longterm_goals');
      if (savedLongTerm) {
        setLongTermGoals(JSON.parse(savedLongTerm));
      }
    } catch (e) {
      console.log('데이터 로드 실패');
    }
  };

  // 가장 가까운 다가오는 일정 불러오기 함수
  const loadNextEvent = async () => {
    try {
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      
      const savedEvents = await AsyncStorage.getItem('@calendar_events');
      if (savedEvents) {
        const eventsMap: Record<string, string[]> = JSON.parse(savedEvents);
        const futureDates = Object.keys(eventsMap)
          .filter((dateStr) => dateStr >= todayStr)
          .sort();

        if (futureDates.length > 0) {
          const nearestDate = futureDates[0];
          const titles = eventsMap[nearestDate];
          if (titles && titles.length > 0) {
            setNextEvent({ dateStr: nearestDate, title: titles[0] });
            return;
          }
        }
      }
      setNextEvent(null);
    } catch (e) {
      console.log('일정 불러오기 실패', e);
    }
  };

  // 실시간 타이머 및 현재/다음 교시 계산 (1초마다 갱신)
  useEffect(() => {
    const updateTimerAndSchedule = async () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMin = now.getMinutes();
      const currentTotalMin = currentHour * 60 + currentMin;

      const dayIndex = now.getDay(); // 1: 월 ~ 5: 금
      if (dayIndex < 1 || dayIndex > 5) {
        setStatusTitle('☕ 주말입니다. 편안한 휴식 되세요!');
        setStatusTimer('');
        setNextSubjectInfo('월요일에 만나요!');
        return;
      }

      const dayMap: Record<number, string> = { 1: '월', 2: '화', 3: '수', 4: '목', 5: '금' };
      const currentDayStr = dayMap[dayIndex];

      const savedSchedule = await AsyncStorage.getItem('@current_week_schedule');
      const scheduleMap = savedSchedule ? JSON.parse(savedSchedule) : {
        '월': [], '화': [], '수': [], '목': [], '금': []
      };

      const subjects = scheduleMap[currentDayStr] || [];

      let foundTitle = '방과후 / 일과 종료';
      let foundTimer = '';
      let nextSub = '다음 일정 없음';

      for (let i = 0; i < PERIOD_TIMES.length; i++) {
        const p = PERIOD_TIMES[i];
        const [startH, startM] = p.start.split(':').map(Number);
        const [endH, endM] = p.end.split(':').map(Number);
        
        const startTotalMin = startH * 60 + startM;
        const endTotalMin = endH * 60 + endM;
        const currentSubName = subjects[i] || `${p.period}교시`;

        if (currentTotalMin >= startTotalMin && currentTotalMin <= endTotalMin) {
          const leftMin = endTotalMin - currentTotalMin;
          foundTitle = `🔥 현재 ${p.period}교시 (${currentSubName})`;
          foundTimer = `종료까지 ${leftMin}분 남음`;

          if (i < subjects.length - 1) {
            nextSub = `다음: ${i + 2}교시 (${subjects[i + 1]})`;
          } else {
            nextSub = '오늘의 마지막 수업입니다!';
          }
          break;
        } else if (i < PERIOD_TIMES.length - 1) {
          const [nextStartH, nextStartM] = PERIOD_TIMES[i + 1].start.split(':').map(Number);
          const nextStartTotalMin = nextStartH * 60 + nextStartM;

          if (currentTotalMin > endTotalMin && currentTotalMin < nextStartTotalMin) {
            const leftMin = nextStartTotalMin - currentTotalMin;
            foundTitle = `☕ 쉬는 시간 (${p.period}교시 쉬는 중)`;
            foundTimer = `${p.period + 1}교시까지 ${leftMin}분 전`;
            nextSub = `다음: ${i + 2}교시 (${subjects[i + 1]})`;
            break;
          }
        }
      }

      setStatusTitle(foundTitle);
      setStatusTimer(foundTimer);
      setNextSubjectInfo(nextSub);
    };

    updateTimerAndSchedule();
    const timer = setInterval(updateTimerAndSchedule, 1000);
    return () => clearInterval(timer);
  }, []);

  const saveDailyToStorage = async (newTodos: typeof dailyTodos) => {
    setDailyTodos(newTodos);
    await AsyncStorage.setItem('@daily_todos', JSON.stringify(newTodos));
  };

  const saveLongTermToStorage = async (newGoals: typeof longTermGoals) => {
    setLongTermGoals(newGoals);
    await AsyncStorage.setItem('@longterm_goals', JSON.stringify(newGoals));
  };

  const toggleDailyTodo = (id: number) => {
    const updated = dailyTodos.map(item => item.id === id ? { ...item, completed: !item.completed } : item);
    saveDailyToStorage(updated);
  };

  const toggleLongTermGoal = (id: number) => {
    const updated = longTermGoals.map(item => item.id === id ? { ...item, completed: !item.completed } : item);
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
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>{userName} 님의 홈</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText} numberOfLines={1} ellipsizeMode="tail">
            {school} · {gradeClass}
          </Text>
        </View>
      </View>

      {/* 1. 실시간 교시 및 남은 시간 카드 */}
      <View style={styles.liveCard}>
        <Text style={styles.liveTitle}>{statusTitle}</Text>
        {statusTimer !== '' && <Text style={styles.liveTimer}>{statusTimer}</Text>}
        <View style={styles.divider} />
        <View style={styles.rowBetweenNoMargin}>
          <Text style={styles.nextSubText}>{nextSubjectInfo}</Text>
          <TouchableOpacity onPress={() => router.push('/schedule')}>
            <Text style={styles.fullScheduleLink}>전체 시간표 ➔</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. 전체 장기 목표 달성률 요약 카드 */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.cardTitle}>🎯 전체 장기 목표 달성률</Text>
            <Text style={styles.cardSubText}>자격증 및 취업 목표 요약</Text>
          </View>
          <Text style={[styles.percentText, { color: '#34C759' }]}>{longTermPercent}%</Text>
        </View>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${longTermPercent}%`, backgroundColor: '#34C759' }]} />
        </View>
        <Text style={styles.previewText}>달성한 목표: {longTermGoals.filter(i => i.completed).length} / {longTermGoals.length}개</Text>
      </View>

      {/* 3. 오늘 하루 목표 달성률 요약 카드 */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.cardTitle}>📅 오늘 하루 목표 달성률</Text>
            <Text style={styles.cardSubText}>오늘 완료한 할일 요약</Text>
          </View>
          <Text style={styles.percentText}>{dailyPercent}%</Text>
        </View>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${dailyPercent}%` }]} />
        </View>
        <Text style={styles.previewText}>완료된 항목: {dailyTodos.filter(i => i.completed).length} / {dailyTodos.length}개</Text>
      </View>

      {/* 4. 📌 가장 가까운 일정 카드 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📌 다가오는 일정</Text>
        {nextEvent ? (
          <View style={styles.eventInfoBox}>
            <Text style={styles.eventDate}>{nextEvent.dateStr}</Text>
            <Text style={styles.eventText}>{nextEvent.title}</Text>
          </View>
        ) : (
          <Text style={styles.noEventText}>등록된 다가오는 일정이 없습니다.</Text>
        )}
      </View>

      {/* 5. 📝 오늘 하루 할 일 상세 리스트 섹션 */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionHeaderTitle}>📝 오늘 하루 할 일 관리</Text>
        
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={newDailyText}
            onChangeText={setNewDailyText}
            placeholder="새로운 하루 목표 입력"
            placeholderTextColor="#8E8E93"
          />
          <TouchableOpacity style={styles.addButton} onPress={addDailyTodo}>
            <Text style={styles.addButtonText}>추가</Text>
          </TouchableOpacity>
        </View>

        {dailyTodos.length === 0 ? (
          <Text style={styles.noEventText}>등록된 오늘 할 일이 없습니다.</Text>
        ) : (
          dailyTodos.map(item => (
            <View key={item.id} style={styles.todoRowItem}>
              <TouchableOpacity 
                style={styles.todoMainTouch} 
                onPress={() => toggleDailyTodo(item.id)}
              >
                <View style={[styles.checkbox, item.completed && styles.checkboxChecked]}>
                  {item.completed && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={[styles.todoText, item.completed && styles.todoTextCompleted]}>{item.text}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.deleteButton} onPress={() => deleteDailyTodo(item.id)}>
                <Text style={styles.deleteButtonText}>삭제</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      {/* 6. 🎯 장기 목표 상세 리스트 섹션 */}
      <View style={[styles.sectionContainer, { marginTop: 10 }]}>
        <Text style={styles.sectionHeaderTitle}>🎯 전체 장기 목표 관리</Text>
        
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={newLongTermText}
            onChangeText={setNewLongTermText}
            placeholder="새로운 장기 목표 입력"
            placeholderTextColor="#8E8E93"
          />
          <TouchableOpacity style={[styles.addButton, { backgroundColor: '#34C759' }]} onPress={addLongTermGoal}>
            <Text style={styles.addButtonText}>추가</Text>
          </TouchableOpacity>
        </View>

        {longTermGoals.length === 0 ? (
          <Text style={styles.noEventText}>등록된 장기 목표가 없습니다.</Text>
        ) : (
          longTermGoals.map(item => (
            <View key={item.id} style={styles.todoRowItem}>
              <TouchableOpacity 
                style={styles.todoMainTouch} 
                onPress={() => toggleLongTermGoal(item.id)}
              >
                <View style={[styles.checkbox, item.completed && styles.checkboxCheckedGreen]}>
                  {item.completed && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={[styles.todoText, item.completed && styles.todoTextCompleted]}>{item.text}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.deleteButton} onPress={() => deleteLongTermGoal(item.id)}>
                <Text style={styles.deleteButtonText}>삭제</Text>
              </TouchableOpacity>
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
  
  headerContainer: {
    marginBottom: 16,
    marginTop: 10,
  },
  headerTitle: { 
    fontSize: 22, 
    fontWeight: '800', 
    color: '#1C1C1E', 
    marginBottom: 6 
  },
  badge: { 
    backgroundColor: '#E5E5EA', 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderRadius: 8,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  badgeText: { 
    fontSize: 12, 
    fontWeight: '600', 
    color: '#3A3A3C' 
  },
  
  liveCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  liveTitle: { fontSize: 17, fontWeight: '800', color: '#34C759', marginBottom: 4 },
  liveTimer: { fontSize: 14, fontWeight: '600', color: '#FFFFFF', marginBottom: 8 },
  divider: { height: 1, backgroundColor: '#3A3A3C', marginVertical: 10 },
  rowBetweenNoMargin: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nextSubText: { fontSize: 13, fontWeight: '600', color: '#AEAEB2' },
  fullScheduleLink: { fontSize: 13, fontWeight: '700', color: '#0A84FF' },

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
  
  eventInfoBox: {
    backgroundColor: '#E8F2FF',
    padding: 14,
    borderRadius: 12,
    marginTop: 6,
  },
  eventDate: { fontSize: 12, fontWeight: '600', color: '#007AFF', marginBottom: 4 },
  eventText: { fontSize: 16, fontWeight: '700', color: '#1C1C1E' },
  noEventText: { fontSize: 14, color: '#8E8E93', textAlign: 'center', marginVertical: 10 },

  // 하단 리스트 및 관리 섹션 스타일
  sectionContainer: {
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
  sectionHeaderTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 14,
  },
  todoRowItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingVertical: 10, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F2F2F7' 
  },
  todoMainTouch: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#C7C7CC', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  checkboxChecked: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  checkboxCheckedGreen: { backgroundColor: '#34C759', borderColor: '#34C759' },
  checkmark: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  todoText: { fontSize: 15, color: '#1C1C1E', flex: 1 },
  todoTextCompleted: { color: '#8E8E93', textDecorationLine: 'line-through' },
  deleteButton: { backgroundColor: '#FF3B30', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginLeft: 8 },
  deleteButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  input: { flex: 1, backgroundColor: '#F2F2F7', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, fontSize: 14, color: '#1C1C1E', marginRight: 8 },
  addButton: { backgroundColor: '#007AFF', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  addButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
});