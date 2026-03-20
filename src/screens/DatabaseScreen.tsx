import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LogOut, Play, Settings as SettingsIcon } from 'lucide-react-native';
import axios from 'axios';

export default function DatabaseScreen() {
  const [dbType, setDbType] = useState<'mysql' | 'mssql' | 'oracle'>('mysql');
  const [host, setHost] = useState('');
  const [port, setPort] = useState('3306');
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [database, setDatabase] = useState('');
  const [apiUrl, setApiUrl] = useState('http://192.168.1.100:3000'); // Domyślny lokalny adres API
  const [showSettings, setShowSettings] = useState(false);
  
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[] | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const loadCredentials = async () => {
      try {
        const savedType = await AsyncStorage.getItem('db_type') as any;
        const savedHost = await AsyncStorage.getItem('db_host');
        const savedPort = await AsyncStorage.getItem('db_port');
        const savedUser = await AsyncStorage.getItem('db_user');
        const savedPassword = await AsyncStorage.getItem('db_password');
        const savedDatabase = await AsyncStorage.getItem('db_database');
        const savedApiUrl = await AsyncStorage.getItem('db_api_url');
        
        if (savedType) setDbType(savedType);
        if (savedHost) setHost(savedHost);
        if (savedPort) setPort(savedPort);
        if (savedUser) setUser(savedUser);
        if (savedPassword) setPassword(savedPassword);
        if (savedDatabase) setDatabase(savedDatabase);
        if (savedApiUrl) setApiUrl(savedApiUrl);
      } catch (error) {}
    };
    loadCredentials();
  }, []);

  const handleConnect = async () => {
    if (!host || !user || !password) {
      Alert.alert('Błąd', 'Wypełnij wymagane pola (Host, Użytkownik, Hasło)');
      return;
    }
    
    try {
      await AsyncStorage.setItem('db_type', dbType);
      await AsyncStorage.setItem('db_host', host);
      await AsyncStorage.setItem('db_port', port);
      await AsyncStorage.setItem('db_user', user);
      await AsyncStorage.setItem('db_password', password);
      await AsyncStorage.setItem('db_database', database);
      await AsyncStorage.setItem('db_api_url', apiUrl);
    } catch (error) {}

    setIsLoading(true);
    setErrorMsg('');
    
    try {
      const response = await axios.post(`${apiUrl}/api/test-connection`, {
        type: dbType,
        host,
        port,
        user,
        password,
        database
      });

      if (response.data.success) {
        setIsConnected(true);
      }
    } catch (error: any) {
      Alert.alert('Błąd połączenia', error.response?.data?.error || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setResults(null);
    setQuery('');
    setErrorMsg('');
  };

  const executeQuery = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    setErrorMsg('');
    
    try {
      const response = await axios.post(`${apiUrl}/api/query`, {
        type: dbType,
        host,
        port,
        user,
        password,
        database,
        query
      });

      if (response.data.success) {
        setResults(response.data.data);
      }
    } catch (error: any) {
      setErrorMsg(error.response?.data?.error || error.message);
      setResults(null);
    } finally {
      setIsLoading(false);
    }
  };

  const renderTable = () => {
    if (!results || results.length === 0) return <Text style={{padding: 10}}>Brak wyników</Text>;
    
    const columns = Object.keys(results[0]);
    
    return (
      <ScrollView horizontal style={styles.tableScroll}>
        <View>
          <View style={styles.tableRowHeader}>
            {columns.map(col => (
              <Text key={col} style={styles.tableCellHeader}>{col}</Text>
            ))}
          </View>
          {results.map((row, index) => (
            <View key={index} style={styles.tableRow}>
              {columns.map(col => (
                <Text key={col} style={styles.tableCell}>{String(row[col])}</Text>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      {!isConnected ? (
        <ScrollView contentContainerStyle={styles.formContainer}>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20}}>
            <Text style={[styles.title, {marginBottom: 0}]}>Klient Bazy Danych</Text>
            <TouchableOpacity onPress={() => setShowSettings(!showSettings)}>
              <SettingsIcon color="#007bff" size={24} />
            </TouchableOpacity>
          </View>
          
          {showSettings && (
            <View style={styles.settingsBox}>
              <Text style={{fontWeight: 'bold', marginBottom: 5}}>Adres API Proxy:</Text>
              <TextInput 
                style={styles.input} 
                value={apiUrl} 
                onChangeText={setApiUrl} 
                placeholder="http://twój-adres-ip:3000" 
              />
              <Text style={{fontSize: 12, color: '#666'}}>
                Ze względów architektonicznych i bezpieczeństwa urządzenia mobilne nie łączą się bezpośrednio z portami baz danych TCP. Wymagany jest uruchomiony skrypt Node.js API.
              </Text>
            </View>
          )}

          <View style={styles.typeSelector}>
            {(['mysql', 'mssql', 'oracle'] as const).map(type => (
              <TouchableOpacity 
                key={type} 
                style={[styles.typeButton, dbType === type && styles.typeButtonActive]}
                onPress={() => {
                  setDbType(type);
                  if (type === 'mysql') setPort('3306');
                  if (type === 'mssql') setPort('1433');
                  if (type === 'oracle') setPort('1521');
                }}
              >
                <Text style={[styles.typeText, dbType === type && styles.typeTextActive]}>
                  {type.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput style={styles.input} placeholder="Host (IP lub domena)" value={host} onChangeText={setHost} />
          <TextInput style={styles.input} placeholder="Port" value={port} onChangeText={setPort} keyboardType="numeric" />
          <TextInput style={styles.input} placeholder="Użytkownik" value={user} onChangeText={setUser} />
          <TextInput style={styles.input} placeholder="Hasło" secureTextEntry value={password} onChangeText={setPassword} />
          <TextInput style={styles.input} placeholder="Nazwa bazy (opcjonalnie)" value={database} onChangeText={setDatabase} />
          
          <Button title={isLoading ? "Łączenie..." : "Połącz z serwerem"} onPress={handleConnect} disabled={isLoading} />
        </ScrollView>
      ) : (
        <View style={styles.dbContainer}>
          <View style={styles.header}>
            <Text style={styles.headerText}>{dbType.toUpperCase()} | {user}@{host}</Text>
            <TouchableOpacity onPress={handleDisconnect} style={styles.disconnectBtn}>
              <LogOut size={20} color="white" />
              <Text style={styles.disconnectText}>Rozłącz</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.queryContainer}>
            <TextInput 
              style={styles.queryInput} 
              placeholder="Wpisz zapytanie SQL (np. SELECT * FROM users)..." 
              value={query} 
              onChangeText={setQuery}
              multiline
              textAlignVertical="top"
            />
            <TouchableOpacity style={styles.runButton} onPress={executeQuery} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="white" /> : <Play color="white" size={24} />}
            </TouchableOpacity>
          </View>

          {errorMsg ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>Wyniki zapytania:</Text>
            {renderTable()}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  formContainer: { padding: 20, flexGrow: 1, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  typeSelector: { flexDirection: 'row', marginBottom: 20, justifyContent: 'space-between' },
  typeButton: { flex: 1, padding: 10, borderWidth: 1, borderColor: '#007bff', alignItems: 'center', marginHorizontal: 2, borderRadius: 5 },
  typeButtonActive: { backgroundColor: '#007bff' },
  typeText: { color: '#007bff', fontWeight: 'bold' },
  typeTextActive: { color: '#fff' },
  settingsBox: { backgroundColor: '#f0f0f0', padding: 15, borderRadius: 5, marginBottom: 20, borderWidth: 1, borderColor: '#ddd' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 12, marginBottom: 15, borderRadius: 5, backgroundColor: '#f9f9f9' },
  dbContainer: { flex: 1, backgroundColor: '#f0f2f5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#34495e', padding: 10 },
  headerText: { color: '#fff', fontWeight: 'bold' },
  disconnectBtn: { flexDirection: 'row', backgroundColor: '#e74c3c', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 5, alignItems: 'center' },
  disconnectText: { color: 'white', marginLeft: 5 },
  queryContainer: { flexDirection: 'row', padding: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#ddd' },
  queryInput: { flex: 1, height: 80, borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10, fontFamily: 'monospace', backgroundColor: '#fafafa' },
  runButton: { width: 60, height: 80, backgroundColor: '#2ecc71', borderRadius: 5, marginLeft: 10, justifyContent: 'center', alignItems: 'center' },
  errorBox: { margin: 10, padding: 10, backgroundColor: '#ffebee', borderWidth: 1, borderColor: '#ffcdd2', borderRadius: 5 },
  errorText: { color: '#c62828' },
  resultsContainer: { flex: 1, margin: 10, backgroundColor: '#fff', borderRadius: 5, elevation: 2 },
  resultsTitle: { padding: 10, fontWeight: 'bold', borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: '#f8f9fa' },
  tableScroll: { flex: 1 },
  tableRowHeader: { flexDirection: 'row', backgroundColor: '#e9ecef', borderBottomWidth: 2, borderBottomColor: '#dee2e6' },
  tableCellHeader: { padding: 10, width: 120, fontWeight: 'bold', color: '#495057' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eee' },
  tableCell: { padding: 10, width: 120, color: '#333' }
});