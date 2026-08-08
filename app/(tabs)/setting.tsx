import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function SettingScreen() {
  const [school, setSchool] = useState('');
  const [gradeClass, setGradeClass] = useState('');

  // 1. 앱이 켜질 때 저장되어 있던 사용자 정보 불러오기
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const savedSchool = await AsyncStorage.getItem('@school_name');
      const savedGradeClass = await AsyncStorage.getItem('@grade_class');
      if (savedSchool) setSchool(savedSchool);
      if (savedGradeClass) setGradeClass(savedGradeClass);
    } catch (e) {
      console.log('데이터를 불러오는 중 에러가 발생했습니다.');
    }
  };

  // 2. 저장 버튼을 누를 때 스마트폰에 정보 저장하기
  const saveData = async () => {
    try {
      await AsyncStorage.setItem('@school_name', school);
      await AsyncStorage.setItem('@grade_class', gradeClass);
      Alert.alert('저장 완료', '설정값이 안전하게 저장되었습니다!');
    } catch (e) {
      Alert.alert('저장 실패', '저장하는 중에 문제가 발생했습니다.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>사용자 맞춤 설정</Text>
      <Text style={styles.desc}>학교와 학급 정보를 입력하여 나만의 맞춤형 앱을 만들어보세요.</Text>

      <View style={styles.card}>
        <Text style={styles.label}>학교 이름</Text>
        <TextInput
          style={styles.input}
          value={school}
          onChangeText={setSchool}
          placeholder="학교 이름을 입력하세요"
        />

        <Text style={styles.label}>학년 / 학급 / 학과</Text>
        <TextInput
          style={styles.input}
          value={gradeClass}
          onChangeText={setGradeClass}
          placeholder="예: 2학년 3반 스마트기기과"
        />

        <TouchableOpacity style={styles.saveButton} onPress={saveData}>
          <Text style={styles.saveButtonText}>설정 저장하기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F2F2F7', 
    padding: 20, 
    justifyContent: 'center' 
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
    marginBottom: 24 
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3A3A3C',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    fontSize: 15,
    color: '#1C1C1E',
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});