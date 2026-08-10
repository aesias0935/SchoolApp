import SharedGroupPreferences from 'react-native-shared-group-preferences';

const APP_GROUP = 'group.com.aesias.SchoolApp';

interface TodoItem {
  id: string;
  title: string;
  completed: boolean;
}

/**
 * 앱에서 할 일이 추가/수정/삭제/체크될 때마다 이 함수를 호출합니다.
 */
export const updateHomeWidgetData = async (todos: TodoItem[]) => {
  try {
    // 1. 달성률 계산
    const total = todos.length;
    const completedCount = todos.filter((t) => t.completed).length;
    const progressRate = total > 0 ? Math.round((completedCount / total) * 100) : 0;

    // 2. 미완료된 할 일 우선으로 최대 4개 추출
    const pendingTodos = todos.filter((t) => !t.completed);
    const displayTodos = pendingTodos.length > 0 
      ? pendingTodos.slice(0, 4).map((t) => t.title)
      : todos.slice(0, 4).map((t) => t.title);

    // 3. Swift UserDefaults 키 이름과 동일하게 데이터 저장
    await SharedGroupPreferences.setItem('progressRate', progressRate, APP_GROUP);
    await SharedGroupPreferences.setItem('todos', displayTodos, APP_GROUP);

    console.log('위젯 데이터 업데이트 완료:', { progressRate, displayTodos });
  } catch (error) {
    console.error('위젯 데이터 업데이트 실패:', error);
  }
};