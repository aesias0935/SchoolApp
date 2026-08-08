import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function CalendarScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>학사 일정 캘린더</Text>
      <Text style={styles.desc}>시험 일정, 자격증 접수일, 현장실습 날짜를 모아보는 공간입니다.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F2F2F7', padding: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#1C1C1E', marginBottom: 8 },
  desc: { fontSize: 14, color: '#8E8E93', textAlign: 'center' },
});