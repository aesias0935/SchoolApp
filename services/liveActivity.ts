import { NativeModules, Platform } from 'react-native';

// iOS Native 모듈 참조 (Expo Config Plugin / Native Bridge 연동용)
const { ActivityModule } = NativeModules;

export interface TimetableActivityAttributes {
  schoolName: string;
}

export interface TimetableActivityState {
  currentPeriod: string;
  subject: string;
  remainingMinutes: number;
}

/**
 * 1. Live Activity 시작 (수업 시작 시 또는 앱 진입 시)
 */
export const startLiveActivity = async (state: TimetableActivityState, schoolName: string = '학교') => {
  if (Platform.OS !== 'ios') return;

  try {
    if (ActivityModule && ActivityModule.startActivity) {
      await ActivityModule.startActivity({
        schoolName,
        ...state,
      });
      console.log('Live Activity 시작 성공');
    } else {
      console.log('iOS ActivityModule이 로드되지 않았습니다 (시뮬레이터/네이티브 빌드 확인 필요)');
    }
  } catch (error) {
    console.error('Live Activity 시작 실패:', error);
  }
};

/**
 * 2. Live Activity 내용 업데이트 (다음 교시/남은 시간 변경 시)
 */
export const updateLiveActivity = async (state: TimetableActivityState) => {
  if (Platform.OS !== 'ios') return;

  try {
    if (ActivityModule && ActivityModule.updateActivity) {
      await ActivityModule.updateActivity(state);
      console.log('Live Activity 업데이트 성공');
    }
  } catch (error) {
    console.error('Live Activity 업데이트 실패:', error);
  }
};

/**
 * 3. Live Activity 종료 (하교 후 / 주말 / 수업 종료 시)
 */
export const endLiveActivity = async () => {
  if (Platform.OS !== 'ios') return;

  try {
    if (ActivityModule && ActivityModule.endActivity) {
      await ActivityModule.endActivity();
      console.log('Live Activity 종료 성공');
    }
  } catch (error) {
    console.error('Live Activity 종료 실패:', error);
  }
};