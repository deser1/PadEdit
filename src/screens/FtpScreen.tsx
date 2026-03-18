import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView } from 'react-native';

export default function FtpScreen() {
  const [host, setHost] = useState('');
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [logs, setLogs] = useState('Ready to connect...');

  const log = (msg: string) => setLogs(prev => prev + '\n' + msg);

  const handleConnect = () => {
    if (!host || !user || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    log(`Connecting to ${host}...`);
    // Mock connection
    setTimeout(() => {
      setIsConnected(true);
      log('Connected successfully (Mock).');
      log('Listing files...');
      setTimeout(() => {
        log('- index.html\n- style.css\n- script.js');
      }, 500);
    }, 1000);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    log('Disconnected.');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>FTP Connection</Text>
      
      {!isConnected ? (
        <View style={styles.form}>
          <TextInput 
            style={styles.input} 
            placeholder="FTP Host (e.g., ftp.example.com)" 
            value={host} 
            onChangeText={setHost} 
          />
          <TextInput 
            style={styles.input} 
            placeholder="Username" 
            value={user} 
            onChangeText={setUser} 
          />
          <TextInput 
            style={styles.input} 
            placeholder="Password" 
            secureTextEntry 
            value={password} 
            onChangeText={setPassword} 
          />
          <Button title="Connect" onPress={handleConnect} />
        </View>
      ) : (
        <View style={styles.connected}>
          <Text style={styles.success}>Connected to {host}</Text>
          <Button title="Disconnect" onPress={handleDisconnect} color="red" />
          <View style={styles.fileList}>
            <Text style={styles.fileHeader}>Remote Files:</Text>
            <Text>- index.html</Text>
            <Text>- style.css</Text>
            <Text>- script.js</Text>
          </View>
        </View>
      )}

      <Text style={styles.logsHeader}>Logs:</Text>
      <Text style={styles.logs}>{logs}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  form: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  connected: {
    marginBottom: 20,
  },
  success: {
    color: 'green',
    fontSize: 18,
    marginBottom: 10,
  },
  fileList: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
  },
  fileHeader: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  logsHeader: {
    fontSize: 18,
    marginTop: 20,
  },
  logs: {
    fontFamily: 'monospace',
    backgroundColor: '#eee',
    padding: 10,
    marginTop: 10,
    minHeight: 100,
  },
});
