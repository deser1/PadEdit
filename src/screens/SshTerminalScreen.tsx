import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SSHClient, { PtyType } from '@dylankenneally/react-native-ssh-sftp';
import { LogOut } from 'lucide-react-native';

export default function SshTerminalScreen() {
  const [host, setHost] = useState('');
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState('Gotowy do połączenia z SSH...\n');
  const [command, setCommand] = useState('');
  
  const sshRef = useRef<SSHClient | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const loadCredentials = async () => {
      try {
        const savedHost = await AsyncStorage.getItem('ssh_host');
        const savedUser = await AsyncStorage.getItem('ssh_user');
        const savedPassword = await AsyncStorage.getItem('ssh_password');
        
        if (savedHost) setHost(savedHost);
        if (savedUser) setUser(savedUser);
        if (savedPassword) setPassword(savedPassword);
      } catch (error) {
        console.error('Błąd podczas wczytywania danych SSH:', error);
      }
    };
    loadCredentials();

    return () => {
      handleDisconnect();
    };
  }, []);

  const log = (msg: string) => {
    setLogs(prev => prev + msg + '\n');
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleConnect = async () => {
    if (!host || !user || !password) {
      Alert.alert('Błąd', 'Wypełnij wszystkie pola');
      return;
    }
    
    try {
      await AsyncStorage.setItem('ssh_host', host);
      await AsyncStorage.setItem('ssh_user', user);
      await AsyncStorage.setItem('ssh_password', password);
    } catch (error) {}

    setIsLoading(true);
    log(`Łączenie z ${user}@${host}...`);
    
    try {
      const client = await SSHClient.connectWithPassword(host, 22, user, password);
      
      // Rozpocznij sesję shell
      await client.startShell(PtyType.VANILLA);
      
      // Nasłuchuj danych ze strumienia
      client.on('Shell', (event: any) => {
        if (event && typeof event === 'string') {
          // Usuwamy nadmiarowe znaki powrotu karetki
          setLogs(prev => prev + event.replace(/\r\n/g, '\n'));
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      });

      log('Połączono pomyślnie.');
      setIsConnected(true);
      sshRef.current = client;
    } catch (err: any) {
      log(`Błąd krytyczny: ${err.message}`);
      Alert.alert('Błąd połączenia', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    if (sshRef.current) {
      try {
        sshRef.current.closeShell();
        sshRef.current.disconnect();
      } catch (e) {}
      sshRef.current = null;
    }
    setIsConnected(false);
    log('Rozłączono.');
  };

  const handleSendCommand = async () => {
    if (!command.trim() || !sshRef.current) return;
    
    const cmdToSend = command;
    setCommand(''); // Wyczyść pole natychmiast
    
    try {
      await sshRef.current.writeToShell(cmdToSend + '\n');
    } catch (err: any) {
      log(`[Błąd wykonania]: ${err.message}`);
    }
  };

  return (
    <View style={styles.container}>
      {!isConnected ? (
        <View style={styles.formContainer}>
          <Text style={styles.title}>Zdalny Terminal (SSH)</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Host (np. 192.168.1.10)" 
            value={host} 
            onChangeText={setHost} 
          />
          <TextInput 
            style={styles.input} 
            placeholder="Użytkownik" 
            value={user} 
            onChangeText={setUser} 
          />
          <TextInput 
            style={styles.input} 
            placeholder="Hasło" 
            secureTextEntry 
            value={password} 
            onChangeText={setPassword} 
          />
          <Button title={isLoading ? "Łączenie..." : "Połącz"} onPress={handleConnect} disabled={isLoading} />
        </View>
      ) : (
        <View style={styles.terminalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerText}>{user}@{host}</Text>
            <TouchableOpacity onPress={handleDisconnect} style={styles.disconnectBtn}>
              <LogOut size={20} color="white" />
              <Text style={styles.disconnectText}>Rozłącz</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            ref={scrollViewRef} 
            style={styles.logsContainer}
            contentContainerStyle={{ flexGrow: 1 }}
          >
            <Text style={styles.logsText}>{logs}</Text>
          </ScrollView>
          
          <View style={styles.inputRow}>
            <TextInput 
              style={styles.commandInput} 
              placeholder="Wpisz komendę..." 
              value={command} 
              onChangeText={setCommand}
              onSubmitEditing={handleSendCommand}
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor="#888"
            />
            <TouchableOpacity style={styles.sendButton} onPress={handleSendCommand}>
              <Text style={styles.sendButtonText}>Wyślij</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  formContainer: {
    padding: 20,
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    marginBottom: 15,
    borderRadius: 5,
    backgroundColor: '#f9f9f9',
  },
  terminalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#333',
    padding: 10,
  },
  headerText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  disconnectBtn: {
    flexDirection: 'row',
    backgroundColor: '#e74c3c',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    alignItems: 'center',
  },
  disconnectText: {
    color: 'white',
    marginLeft: 5,
  },
  logsContainer: {
    flex: 1,
    padding: 10,
  },
  logsText: {
    color: '#00ff00',
    fontFamily: 'monospace',
    fontSize: 14,
  },
  inputRow: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#222',
  },
  commandInput: {
    flex: 1,
    backgroundColor: '#111',
    color: '#fff',
    padding: 10,
    borderRadius: 5,
    fontFamily: 'monospace',
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007bff',
    paddingHorizontal: 15,
    borderRadius: 5,
    marginLeft: 10,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});