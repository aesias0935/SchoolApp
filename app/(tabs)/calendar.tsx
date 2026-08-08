import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function CalendarScreen() {
  const now = new Date();
  
  // 🌟 현재 보고 있는 연도와 월을 상태로 관리
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1);

  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const [eventsMap, setEventsMap] = useState<Record<string, string[]>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [newEventText, setNewEventText] = useState('');

  // 화면에 들어올 때 일정 불러오기
  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const savedEvents = await AsyncStorage.getItem('@calendar_events');
      if (savedEvents) {
        setEventsMap(JSON.parse(savedEvents));
      }
    } catch (e) {
      console.log('일정 불러오기 실패', e);
    }
  };

  // 일정 추가
  const addEvent = async () => {
    if (!newEventText.trim() || !selectedDate) return;

    const updatedEvents = { ...eventsMap };
    if (!updatedEvents[selectedDate]) {
      updatedEvents[selectedDate] = [];
    }
    updatedEvents[selectedDate].push(newEventText);

    setEventsMap(updatedEvents);
    await AsyncStorage.setItem('@calendar_events', JSON.stringify(updatedEvents));
    setNewEventText('');
  };

  // 일정 삭제
  const deleteEvent = async (dateStr: string, index: number) => {
    const updatedEvents = { ...eventsMap };
    updatedEvents[dateStr].splice(index, 1);
    
    if (updatedEvents[dateStr].length === 0) {
      delete updatedEvents[dateStr];
    }

    setEventsMap(updatedEvents);
    await AsyncStorage.setItem('@calendar_events', JSON.stringify(updatedEvents));
  };

  // 🌟 이전 달로 이동
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentYear(currentYear - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  // 🌟 다음 달로 이동
  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentYear(currentYear + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // 월의 날짜 배열 생성
  const getDaysInMonth = (year: number, month: number) => {
    const date = new Date(year, month - 1, 1);
    const days = [];
    const firstDayIndex = date.getDay();
    const totalDays = new Date(year, month, 0).getDate();

    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    for (let i = 1; i <= totalDays; i++) {
      const monthStr = String(month).padStart(2, '0');
      const dayStr = String(i).padStart(2, '0');
      const dateString = `${year}-${monthStr}-${dayStr}`;
      days.push({ day: i, dateString });
    }
    return days;
  };

  const days = getDaysInMonth(currentYear, currentMonth);

  // 🌟 현재 보고 있는 월에 속하고 일정이 있는 날짜들만 필터링하여 정렬
  const currentMonthEvents = Object.keys(eventsMap)
    .filter((dateStr) => dateStr.startsWith(`${currentYear}-${String(currentMonth).padStart(2, '0')}`))
    .sort();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* 탭 화면용 상단 타이틀 */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>📅 캘린더</Text>
      </View>
      <Text style={styles.subTitle}>날짜를 터치하여 일정을 추가하거나 관리하세요.</Text>

      {/* 캘린더 카드 */}
      <View style={styles.calendarCard}>
        
        {/* 🌟 월 변경 헤더 (화살표 네비게이션) */}
        <View style={styles.monthNavRow}>
          <TouchableOpacity onPress={handlePrevMonth} style={styles.navButton}>
            <Text style={styles.navButtonText}>◀</Text>
          </TouchableOpacity>
          <Text style={styles.monthTitle}>{currentYear}년 {currentMonth}월</Text>
          <TouchableOpacity onPress={handleNextMonth} style={styles.navButton}>
            <Text style={styles.navButtonText}>▶</Text>
          </TouchableOpacity>
        </View>

        {/* 요일 헤더 */}
        <View style={styles.weekDayRow}>
          {['일', '월', '화', '수', '목', '금', '토'].map((wd, idx) => (
            <Text key={idx} style={[styles.weekDayText, idx === 0 && { color: '#FF3B30' }, idx === 6 && { color: '#007AFF' }]}>
              {wd}
            </Text>
          ))}
        </View>

        {/* 날짜 그리드 */}
        <View style={styles.daysGrid}>
          {days.map((item, index) => {
            if (!item) {
              return <View key={`empty-${index}`} style={styles.dayCellEmpty} />;
            }
            
            const isToday = item.dateString === todayStr;
            const hasEvent = eventsMap[item.dateString] && eventsMap[item.dateString].length > 0;

            return (
              <TouchableOpacity
                key={item.dateString}
                style={[
                  styles.dayCell,
                  hasEvent && styles.dayCellWithEvent,
                  isToday && styles.todayCell
                ]}
                onPress={() => {
                  setSelectedDate(item.dateString);
                  setModalVisible(true);
                }}
              >
                <Text style={[
                  styles.dayText,
                  hasEvent && styles.dayTextWithEvent,
                  isToday && styles.todayText
                ]}>
                  {item.day}
                </Text>
                {hasEvent && <View style={[styles.eventDot, isToday && styles.todayEventDot]} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 현재 보고 있는 월의 일정 리스트 카드 */}
      <View style={styles.scheduleListCard}>
        <Text style={styles.sectionTitle}>📌 {currentMonth}월 일정 모아보기</Text>
        {currentMonthEvents.length > 0 ? (
          currentMonthEvents.map((dateStr) => (
            <View key={dateStr} style={styles.scheduleItemGroup}>
              <Text style={styles.scheduleDateLabel}>{dateStr}</Text>
              {eventsMap[dateStr].map((title, idx) => (
                <View key={idx} style={styles.scheduleItemRow}>
                  <Text style={styles.scheduleItemText}>• {title}</Text>
                </View>
              ))}
            </View>
          ))
        ) : (
          <Text style={styles.noScheduleText}>{currentMonth}월에 등록된 일정이 없습니다.</Text>
        )}
      </View>

      {/* 일정 관리 모달창 */}
      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>📌 {selectedDate} 일정 관리</Text>
            
            {/* 기존 등록된 일정 목록 */}
            <ScrollView style={styles.eventListContainer}>
              {selectedDate && eventsMap[selectedDate] && eventsMap[selectedDate].length > 0 ? (
                eventsMap[selectedDate].map((eventTitle, index) => (
                  <View key={index} style={styles.eventRow}>
                    <Text style={styles.eventText}>• {eventTitle}</Text>
                    <TouchableOpacity 
                      style={styles.deleteButton} 
                      onPress={() => deleteEvent(selectedDate, index)}
                    >
                      <Text style={styles.deleteButtonText}>삭제</Text>
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <Text style={styles.noEventText}>등록된 일정이 없습니다.</Text>
              )}
            </ScrollView>

            {/* 새로운 일정 입력 */}
            <TextInput
              style={styles.input}
              placeholder="새로운 일정 입력 (예: 수행평가)"
              placeholderTextColor="#8E8E93"
              value={newEventText}
              onChangeText={setNewEventText}
            />

            <TouchableOpacity style={styles.addButton} onPress={addEvent}>
              <Text style={styles.addButtonText}>일정 추가하기</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeButton} onPress={() => {
              setModalVisible(false);
              setNewEventText('');
              loadEvents();
            }}>
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
  contentContainer: { padding: 20, paddingBottom: 40, paddingTop: 60 },
  headerRow: { marginBottom: 4 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#1C1C1E' },
  subTitle: { fontSize: 13, color: '#8E8E93', marginBottom: 20 },

  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 20,
  },
  
  // 🌟 월 네비게이션 스타일
  monthNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  navButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
  },

  weekDayRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  weekDayText: { fontSize: 13, fontWeight: '600', color: '#8E8E93', width: '14%', textAlign: 'center' },
  
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCellEmpty: { width: '14%', aspectRatio: 1, marginVertical: 4 },
  dayCell: {
    width: '14%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
    borderRadius: 10,
    backgroundColor: '#FAFAFC',
    position: 'relative',
  },
  dayCellWithEvent: {
    backgroundColor: '#E8F2FF',
  },
  todayCell: {
    backgroundColor: '#007AFF',
  },
  dayText: { fontSize: 14, color: '#3A3A3C', fontWeight: '500' },
  dayTextWithEvent: { color: '#007AFF', fontWeight: '700' },
  todayText: { color: '#FFFFFF', fontWeight: '800' },
  
  eventDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#007AFF',
    position: 'absolute',
    bottom: 5,
  },
  todayEventDot: {
    backgroundColor: '#FFFFFF',
  },

  // 하단 일정 리스트 카드 스타일
  scheduleListCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1C1C1E', marginBottom: 12 },
  scheduleItemGroup: { marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F2F2F7', paddingBottom: 8 },
  scheduleDateLabel: { fontSize: 13, fontWeight: '600', color: '#007AFF', marginBottom: 4 },
  scheduleItemRow: { paddingLeft: 4, marginVertical: 2 },
  scheduleItemText: { fontSize: 14, color: '#3A3A3C' },
  noScheduleText: { fontSize: 13, color: '#8E8E93', textAlign: 'center', marginVertical: 10 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '60%' },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#1C1C1E', marginBottom: 16, textAlign: 'center' },
  eventListContainer: { maxHeight: 150, marginBottom: 15 },
  eventRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  eventText: { fontSize: 15, color: '#1C1C1E', flex: 1 },
  noEventText: { textAlign: 'center', color: '#8E8E93', marginVertical: 20, fontSize: 14 },
  deleteButton: { backgroundColor: '#FF3B30', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  deleteButtonText: { color: '#FFFFFF', fontSize: 11, fontWeight: '600' },
  input: { backgroundColor: '#F2F2F7', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, fontSize: 14, color: '#1C1C1E', marginBottom: 10 },
  addButton: { backgroundColor: '#007AFF', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginBottom: 8 },
  addButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  closeButton: { backgroundColor: '#E5E5EA', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  closeButtonText: { fontSize: 14, fontWeight: '700', color: '#3A3A3C' },
});