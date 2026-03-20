import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SSHClient, { PtyType } from '@dylankenneally/react-native-ssh-sftp';
import { LogOut } from 'lucide-react-native';
import { WebView } from 'react-native-webview';

export default function SshTerminalScreen() {
  const [host, setHost] = useState('');
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState('Gotowy do połączenia z SSH...\n');
  const [command, setCommand] = useState('');
  
  const sshRef = useRef<SSHClient | null>(null);
  const webViewRef = useRef<WebView>(null);

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

  const xtermHtml = React.useMemo(() => `
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/xterm@5.3.0/css/xterm.css" />
        <script src="https://cdn.jsdelivr.net/npm/xterm@5.3.0/lib/xterm.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/xterm-addon-fit@0.8.0/lib/xterm-addon-fit.js"></script>
        <style>
          body, html { margin: 0; padding: 0; height: 100%; background-color: #000; overflow: hidden; }
          #terminal { height: 100%; width: 100%; }
        </style>
      </head>
      <body>
        <div id="terminal"></div>
        <script>
          const term = new Terminal({
            cursorBlink: true,
            theme: { background: '#000000' },
            fontFamily: 'monospace'
          });
          const fitAddon = new FitAddon.FitAddon();
          term.loadAddon(fitAddon);
          term.open(document.getElementById('terminal'));
          fitAddon.fit();

          window.addEventListener('resize', () => {
            fitAddon.fit();
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'resize',
              cols: term.cols,
              rows: term.rows
            }));
          });

          term.onData(e => {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'data', data: e }));
          });

          window.addEventListener('message', event => {
            try {
              const msg = JSON.parse(event.data);
              if (msg.type === 'write') {
                term.write(msg.data);
              }
            } catch(e) {}
          });
          
          setTimeout(() => {
             fitAddon.fit();
             window.ReactNativeWebView.postMessage(JSON.stringify({
               type: 'resize',
               cols: term.cols,
               rows: term.rows
             }));
          }, 500);
        </script>
      </body>
    </html>
  `, []);

  const log = (msg: string) => {
    // Legacy log funkcja, jeśli byśmy chcieli coś wyświetlić (obecnie ignorowana na rzecz xterm)
  };

  const writeToXterm = (data: string) => {
    if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({ type: 'write', data }));
    }
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
          writeToXterm(event);
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
    // Funkcja wywoływana, gdybyśmy chcieli ręcznie wpisać komendę z zewnątrz
    // Ale w Xtermie znaki lecą automatycznie.
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'data') {
        if (sshRef.current) {
          sshRef.current.writeToShell(data.data);
        }
      }
    } catch (e) {
      console.error(e);
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
          
          <View style={styles.webViewContainer}>
            <WebView
              ref={webViewRef}
              originWhitelist={['*']}
              source={{ html: xtermHtml }}
              onMessage={handleWebViewMessage}
              scrollEnabled={false}
              bounces={false}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  formContainer: {
    padding: 20,
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#fff',
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
  webViewContainer: {
    flex: 1,
    backgroundColor: '#000',
  }
});