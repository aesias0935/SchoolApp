import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// 수원하이텍마이스터고 맞춤형 목록
const SCHOOL_LIST = ['수원하이텍마이스터고등학교'];
const GRADE_LIST = ['1학년', '2학년', '3학년'];
const CLASS_LIST = ['1반', '2반', '3반', '4반', '5반', '6반', '7반', '8반'];
const MAJOR_LIST = ['정밀기계과', '자동화시스템과', '전기전자제어과'];

export default function SettingScreen() {
  const [isRegistered, setIsRegistered] = useState(false); // 설정 완료 여부

  // 입력 데이터 상태
  const [name, setName] = useState('');
  const [school, setSchool] = useState('');
  const [grade, setGrade] = useState('');
  const [classNum, setClassNum] = useState('');
  const [major, setMajor] = useState('');

  // 모달 제어용 상태
  const [modalVisible, setModalVisible] = useState(false);
  const [currentType, setCurrentType] = useState<'school' | 'grade' | 'class' | 'major' | null>(null);

  // 설정 화면으로 돌아올 때마다 데이터 불러오기 검사
  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [])
  );

  const loadUserData = async () => {
    try {
      const savedName = await AsyncStorage.getItem('@user_name');
      const savedSchool = await AsyncStorage.getItem('@school_name');
      const savedGrade = await AsyncStorage.getItem('@grade');
      const savedClassNum = await AsyncStorage.getItem('@class_num');
      const savedMajor = await AsyncStorage.getItem('@major');

      if (savedSchool && savedName) {
        setIsRegistered(true); // 이미 정보가 있으면 설정 완료 화면 표시
        setName(savedName);
        setSchool(savedSchool);
        setGrade(savedGrade || '');
        setClassNum(savedClassNum || '');
        setMajor(savedMajor || '');
      } else {
        setIsRegistered(false); // 정보가 없으면 최초 입력 화면 표시
      }
    } catch (e) {
      console.log('데이터 불러오기 실패');
    }
  };

  const saveData = async () => {
    if (!name.trim()) {
      Alert.alert('알림', '이름을 입력해주세요!');
      return;
    }
    if (!school || !grade || !classNum || !major) {
      Alert.alert('알림', '모든 학교 정보를 선택해주세요!');
      return;
    }

    try {
      await AsyncStorage.setItem('@user_name', name);
      await AsyncStorage.setItem('@school_name', school);
      await AsyncStorage.setItem('@grade', grade);
      await AsyncStorage.setItem('@class_num', classNum);
      await AsyncStorage.setItem('@major', major);
      
      const fullClassInfo = `${grade} ${classNum} ${major}`.trim();
      await AsyncStorage.setItem('@grade_class', fullClassInfo);

      setIsRegistered(true);
      Alert.alert('저장 완료', '맞춤 설정이 성공적으로 저장되었습니다!');
    } catch (e) {
      Alert.alert('저장 실패', '문제가 발생했습니다.');
    }
  };

  // 정보 초기화 (다시 수정 모드로 진입)
  const resetData = async () => {
    Alert.alert('정보 수정', '내 정보를 다시 설정하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { 
        text: '예', 
        onPress: async () => {
          await AsyncStorage.clear();
          setIsRegistered(false);
          setName('');
          setSchool('');
          setGrade('');
          setClassNum('');
          setMajor('');
        }
      }
    ]);
  };

  const openModal = (type: 'school' | 'grade' | 'class' | 'major') => {
    setCurrentType(type);
    setModalVisible(true);
  };

  const getListData = () => {
    switch (currentType) {
      case 'school': return SCHOOL_LIST;
      case 'grade': return GRADE_LIST;
      case 'class': return CLASS_LIST;
      case 'major': return MAJOR_LIST;
      default: return [];
    }
  };

  const handleSelect = (item: string) => {
    if (currentType === 'school') setSchool(item);
    if (currentType === 'grade') setGrade(item);
    if (currentType === 'class') setClassNum(item);
    if (currentType === 'major') setMajor(item);
    setModalVisible(false);
  };

  // 1. 이미 설정을 마친 경우: 일반 설정 메뉴판 화면
  if (isRegistered) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.headerTitle}>설정</Text>
        
        <View style={styles.profileCard}>
          <Text style={styles.profileName}>{name} 님</Text>
          <Text style={styles.profileDetail}>{school}</Text>
          <Text style={styles.profileDetailSub}>{grade} {classNum} {major}</Text>
          
          <TouchableOpacity style={styles.editButton} onPress={resetData}>
            <Text style={styles.editButtonText}>내 정보 수정하기</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.menuCard}>
          <Text style={styles.menuTitle}>앱 환경 설정</Text>
          <View style={styles.menuItem}>
            <Text style={styles.menuText}>푸시 알림 받기</Text>
            <Text style={styles.menuSubText}>켜짐</Text>
          </View>
          <View style={styles.menuItem}>
            <Text style={styles.menuText}>앱 버전</Text>
            <Text style={styles.menuSubText}>v1.0.0</Text>
          </View>
        </View>
      </ScrollView>
    );
  }

  // 2. 처음 앱을 켰거나 정보가 없는 경우: 최초 정보 입력 화면
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.headerTitle}>사용자 맞춤 설정</Text>
      <Text style={styles.desc}>항목을 터치하여 내 정보를 간편하게 선택하세요.</Text>

      <View style={styles.card}>
        
        {/* 이름 입력 */}
        <Text style={styles.label}>이름</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="예: 홍길동"
          placeholderTextColor="#8E8E93"
        />

        {/* 학교 선택 */}
        <Text style={styles.label}>학교 이름</Text>
        <TouchableOpacity style={styles.selectBox} onPress={() => openModal('school')}>
          <Text style={[styles.selectText, !school && styles.placeholderText]}>
            {school || '학교를 선택하세요'}
          </Text>
        </TouchableOpacity>

        {/* 학년 선택 */}
        <Text style={styles.label}>학년</Text>
        <TouchableOpacity style={styles.selectBox} onPress={() => openModal('grade')}>
          <Text style={[styles.selectText, !grade && styles.placeholderText]}>
            {grade || '학년을 선택하세요'}
          </Text>
        </TouchableOpacity>

        {/* 반 선택 */}
        <Text style={styles.label}>학급 (반)</Text>
        <TouchableOpacity style={styles.selectBox} onPress={() => openModal('class')}>
          <Text style={[styles.selectText, !classNum && styles.placeholderText]}>
            {classNum || '반을 선택하세요'}
          </Text>
        </TouchableOpacity>

        {/* 학과 선택 */}
        <Text style={styles.label}>학과</Text>
        <TouchableOpacity style={styles.selectBox} onPress={() => openModal('major')}>
          <Text style={[styles.selectText, !major && styles.placeholderText]}>
            {major || '학과를 선택하세요'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveButton} onPress={saveData}>
          <Text style={styles.saveButtonText}>설정 저장하기</Text>
        </TouchableOpacity>
      </View>

      {/* 선택 목록 모달 팝업 */}
      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>항목 선택</Text>
            <FlatList
              data={getListData()}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalItem} onPress={() => handleSelect(item)}>
                  <Text style={styles.modalItemText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
    paddingTop: 50,
    paddingBottom: 40,
  },
  headerTitle: { 
    fontSize: 24, 
    fontWeight: '800', 
    color: '#1C1C1E', 
    marginBottom: 6,
    textAlign: 'center'
  },
  desc: { 
    fontSize: 14, 
    color: '#8E8E93', 
    textAlign: 'center', 
    marginBottom: 20 
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  profileDetail: {
    fontSize: 15,
    color: '#3A3A3C',
    fontWeight: '600',
  },
  profileDetailSub: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
    marginBottom: 16,
  },
  editButton: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  editButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 10,
    marginLeft: 4,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  menuText: {
    fontSize: 15,
    color: '#1C1C1E',
  },
  menuSubText: {
    fontSize: 15,
    color: '#8E8E93',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3A3A3C',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    fontSize: 15,
    color: '#1C1C1E',
  },
  selectBox: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    justifyContent: 'center',
  },
  selectText: {
    fontSize: 15,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  placeholderText: {
    color: '#8E8E93',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '50%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 15,
    color: '#1C1C1E',
  },
  modalItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
    alignItems: 'center',
  },
  modalItemText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  closeButton: {
    backgroundColor: '#E5E5EA',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 15,
  },
  closeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3A3A3C',
  },
});