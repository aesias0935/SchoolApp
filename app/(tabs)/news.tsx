import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function NewsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>학교 공지사항 & 뉴스</Text>
      <Text style={styles.desc}>마이스터고 주요 소식과 공지사항이 표시될 공간입니다.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F2F2F7', padding: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#1C1C1E', marginBottom: 8 },
  desc: { fontSize: 14, color: '#8E8E93', textAlign: 'center' },
});