import { AppState, AppStateStatus } from 'react-native';
import SharedGroupPreferences from 'react-native-shared-group-preferences';
import { endLiveActivity, startLiveActivity } from './liveActivity';

const APP_GROUP = 'group.com.aesias.SchoolApp';

// 교시별 시간 기준 (분 단위: hour * 60 + min)
const PERIOD_TIMES = [
  { period: '1교시', start: 9 * 60 + 0, end: 9 * 60 + 50 },
  { period: '2교시', start: 10 * 60 + 0, end: 10 * 60 + 50 },
  { period: '3교시', start: 11 * 60 + 0, end: 11 * 60 + 50 },
  { period: '4교시', start: 12 * 60 + 0, end: 12 * 60 + 50 },
  { period: '5교시', start: 13 * 60 + 50, end: 14 * 60 + 40 },
  { period: '6교시', start: 14 * 60 + 50, end: 15 * 60 + 40 },
  { period: '7교시', start: 15 * 60 + 50, end: 16 * 60 + 40 },
];

/**
 * 컴시간알리미 서버에서 실제 오늘 시간표 가져오기
 */
export const fetchTodaySchedule = async (schoolName: string, grade: string, classNum: string) => {
  try {
    const gradeInt = parseInt(grade.replace(/[^0-9]/g, ''), 10);
    const classInt = parseInt(classNum.replace(/[^0-9]/g, ''), 10);

    // 컴시간 파싱 백엔드 API 호출 (실제 운영 중인 URL로 교체)
    const response = await fetch(
      `https://your-comtime-api.com/timetable?school=${encodeURIComponent(schoolName)}&grade=${gradeInt}&class=${classInt}`
    );
    
    if (!response.ok) throw new Error('시간표 데이터를 불러올 수 없습니다.');

    const data = await response.json();
    // 컴시간에서 넘어온 오늘자 교시별 과목 배열 (예: ["수학", "영어", ...])
    return data.todaySubjects as string[];
  } catch (error) {
    console.error('컴시간 데이터 연동 에러:', error);
    return [];
  }
};

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * 저장된 학교/학년/반 정보를 자동으로 읽어와 시간표 동기화까지 한 번에 처리
 */
export const syncSavedTimetableToWidget = async () => {
  try {
    const school = await AsyncStorage.getItem('@school_name');
    const grade = await AsyncStorage.getItem('@grade');
    const classNum = await AsyncStorage.getItem('@class_num');

    if (!school || !grade || !classNum) {
      console.log('설정된 학교/학년/반 정보가 없습니다.');
      return;
    }

    // 1. 실제 시간표 파싱
    const todaySchedule = await fetchTodaySchedule(school, grade, classNum);
    // 2. App Group 및 위젯 동기화
    await syncTimetableToWidget(todaySchedule);
  } catch (error) {
    console.error('저장된 정보 기반 시간표 동기화 실패:', error);
  }
};

/**
 * 3. 현재 시간 기준 교시 계산 후 App Group 전달 및 Live Activity 실행
 */
export const syncTimetableToWidget = async (todaySchedule: string[]) => {
  try {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    let currentPeriod = '수업 없음';
    let subject = '쉬는 시간 / 방과후';
    let remainingMinutes = 0;
    let isClassTime = false;

    for (let i = 0; i < PERIOD_TIMES.length; i++) {
      const p = PERIOD_TIMES[i];
      if (currentMinutes >= p.start && currentMinutes < p.end) {
        currentPeriod = p.period;
        subject = todaySchedule[i] || '자율 학습';
        remainingMinutes = p.end - currentMinutes;
        isClassTime = true;
        break;
      }
    }

    const timetableData = {
      currentPeriod,
      subject,
      remainingMinutes,
    };

    // 1) App Group에 공유 저장
    await SharedGroupPreferences.setItem('timetableData', timetableData, APP_GROUP);

    // 2) 수업 시간일 때 잠금화면 Live Activity 실행/갱신, 아닐 경우 종료
    if (isClassTime) {
      await startLiveActivity(timetableData);
    } else {
      await endLiveActivity();
    }

    console.log('실제 시간표 데이터 및 Live Activity 동기화 완료:', timetableData);
  } catch (error) {
    console.error('위젯 데이터 동기화 에러:', error);
  }
};

/**
 * 앱 상태(포그라운드 전환) 감지 및 주기적 갱신 리스너 등록
 */
export const registerTimetableAutoRefresh = () => {
  // 1. 앱이 백그라운드에서 포그라운드로 돌아올 때 자동 동기화
  const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      console.log('앱 포그라운드 전환: 시간표 데이터 재동기화 실행');
      syncSavedTimetableToWidget();
    }
  });

  // 2. 앱이 켜져 있는 동안 1분마다 남은 시간 갱신
  const intervalId = setInterval(() => {
    syncSavedTimetableToWidget();
  }, 60 * 1000);

  // 해제용 cleanup 함수 반환
  return () => {
    subscription.remove();
    clearInterval(intervalId);
  };
};