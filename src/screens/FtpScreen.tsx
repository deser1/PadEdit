import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView, TouchableOpacity, FlatList, ActivityIndicator, Switch } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Folder, FileCode, ArrowLeft, LogOut } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import JSFTP from 'jsftp';
import SSHClient from '@dylankenneally/react-native-ssh-sftp';
import * as FileSystem from 'expo-file-system/legacy';
import { Buffer } from 'buffer';

export default function FtpScreen() {
  const navigation = useNavigation<any>();
  const [host, setHost] = useState('');
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [isSftp, setIsSftp] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [logs, setLogs] = useState('Gotowy do połączenia...\n');
  const [currentPath, setCurrentPath] = useState('/');
  const [files, setFiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const ftpRef = useRef<any>(null);
  const sftpRef = useRef<SSHClient | null>(null);

  // Wczytywanie zapisanych danych przy starcie
  useEffect(() => {
    const loadCredentials = async () => {
      try {
        const savedHost = await AsyncStorage.getItem('ftp_host');
        const savedUser = await AsyncStorage.getItem('ftp_user');
        const savedPassword = await AsyncStorage.getItem('ftp_password');
        const savedIsSftp = await AsyncStorage.getItem('ftp_is_sftp');
        
        if (savedHost) setHost(savedHost);
        if (savedUser) setUser(savedUser);
        if (savedPassword) setPassword(savedPassword);
        if (savedIsSftp) setIsSftp(savedIsSftp === 'true');
      } catch (error) {
        console.error('Błąd podczas wczytywania danych FTP:', error);
      }
    };
    loadCredentials();
  }, []);

  // MOCK DATA - ponieważ React Native (szczególnie w Expo Go) nie obsługuje natywnie gniazd TCP (Node.js net/tls)
  // niezbędnych do prawdziwego FTP bez zewnętrznego serwera proxy lub tworzenia natywnego modułu (co wymaga prebuilda).
  const mockFileSystem: any = {
    '/': [
      { name: 'public_html', type: 'd' },
      { name: 'config', type: 'd' },
      { name: '.htaccess', type: '-' },
    ],
    '/public_html': [
      { name: 'index.html', type: '-' },
      { name: 'style.css', type: '-' },
      { name: 'app.js', type: '-' },
      { name: 'images', type: 'd' },
    ],
    '/config': [
      { name: 'settings.json', type: '-' },
      { name: 'database.php', type: '-' },
    ],
    '/public_html/images': [
      { name: 'logo.png', type: '-' }
    ]
  };

  const log = (msg: string) => setLogs(prev => prev + msg + '\n');

  // Blokowanie cofania, gdy połączono (aby nie rozłączyło przypadkiem)
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity 
          onPress={() => {
            if (isConnected) {
              Alert.alert(
                "Połączono z FTP",
                "Czy na pewno chcesz wyjść? Połączenie zostanie przerwane.",
                [
                  { text: "Anuluj", style: "cancel" },
                  { text: "Rozłącz i wyjdź", onPress: () => { handleDisconnect(); navigation.goBack(); } }
                ]
              );
            } else {
              navigation.goBack();
            }
          }}
          style={{ marginLeft: 16 }}
        >
          <ArrowLeft color="#000" size={24} />
        </TouchableOpacity>
      ),
      gestureEnabled: !isConnected // Blokada gestu cofania na iOS
    });
  }, [navigation, isConnected]);

  const handleConnect = async () => {
    if (!host || !user || !password) {
      Alert.alert('Błąd', 'Wypełnij wszystkie pola');
      return;
    }
    
    // Zapisywanie danych przed próbą połączenia
    try {
      await AsyncStorage.setItem('ftp_host', host);
      await AsyncStorage.setItem('ftp_user', user);
      await AsyncStorage.setItem('ftp_password', password);
      await AsyncStorage.setItem('ftp_is_sftp', isSftp.toString());
    } catch (error) {
      console.error('Błąd podczas zapisywania danych FTP:', error);
    }

    setIsLoading(true);
    log(`Łączenie z ${host} przez ${isSftp ? 'SFTP' : 'FTP'}...`);
    
    try {
      if (isSftp) {
        const client = await SSHClient.connectWithPassword(host, 22, user, password);
        await client.connectSFTP();
        log('Połączono pomyślnie przez SFTP.');
        setIsConnected(true);
        sftpRef.current = client;
        loadDirectory('/');
      } else {
        const ftp = new JSFTP({
          host: host,
          user: user,
          pass: password,
          port: 21,
        });

        ftp.on('error', (err: any) => {
          log(`Błąd FTP: ${err.message || err}`);
          setIsLoading(false);
        });

        ftp.auth(user, password, (err: any) => {
          if (err) {
            log(`Błąd autoryzacji: ${err.message}`);
            setIsLoading(false);
            Alert.alert('Błąd połączenia', err.message);
            return;
          }

          log('Połączono pomyślnie przez FTP.');
          setIsConnected(true);
          ftpRef.current = ftp;
          loadDirectory('/');
        });
      }
    } catch (err: any) {
      log(`Błąd krytyczny: ${err.message}`);
      setIsLoading(false);
      Alert.alert('Błąd', `Nie udało się zainicjować klienta ${isSftp ? 'SFTP' : 'FTP'}. ${err.message}`);
    }
  };

  const handleDisconnect = () => {
    if (isSftp && sftpRef.current) {
      sftpRef.current.disconnect();
      sftpRef.current = null;
    } else if (ftpRef.current) {
      try {
        ftpRef.current.raw('QUIT', (err: any, data: any) => {
          log('Rozłączono z serwerem FTP.');
        });
        ftpRef.current.destroy();
      } catch (e) {}
      ftpRef.current = null;
    }
    setIsConnected(false);
    setFiles([]);
    setCurrentPath('/');
    log('Rozłączono.');
  };

  const loadDirectory = async (path: string) => {
    setIsLoading(true);
    log(`Pobieranie listy plików dla ${path}...`);
    
    if (isSftp && sftpRef.current) {
      try {
        const res = await sftpRef.current.sftpLs(path);
        setIsLoading(false);
        setCurrentPath(path);
        
        const parsedFiles = res.map((file: any) => ({
          name: file.filename,
          type: file.isDirectory ? 'd' : '-',
          size: file.fileSize
        })).filter((f: any) => f.name !== '.' && f.name !== '..');
        
        parsedFiles.sort((a: any, b: any) => {
          if (a.type === 'd' && b.type !== 'd') return -1;
          if (a.type !== 'd' && b.type === 'd') return 1;
          return a.name.localeCompare(b.name);
        });
        
        setFiles(parsedFiles);
        log(`Pobrano katalog ${path}. Znaleziono ${parsedFiles.length} elementów.`);
      } catch (err: any) {
        setIsLoading(false);
        log(`Błąd pobierania katalogu SFTP: ${err.message}`);
        Alert.alert('Błąd', `Nie można odczytać katalogu: ${err.message}`);
      }
    } else if (ftpRef.current) {
      ftpRef.current.ls(path, (err: any, res: any) => {
        setIsLoading(false);
        
        if (err) {
          log(`Błąd pobierania katalogu: ${err.message}`);
          Alert.alert('Błąd', `Nie można odczytać katalogu: ${err.message}`);
          return;
        }
        
        setCurrentPath(path);
        
        const parsedFiles = res.map((file: any) => ({
          name: file.name,
          type: file.type === 1 ? 'd' : '-',
          size: file.size
        }));
        
        parsedFiles.sort((a: any, b: any) => {
          if (a.type === 'd' && b.type !== 'd') return -1;
          if (a.type !== 'd' && b.type === 'd') return 1;
          return a.name.localeCompare(b.name);
        });
        
        setFiles(parsedFiles);
        log(`Pobrano katalog ${path}. Znaleziono ${parsedFiles.length} elementów.`);
      });
    }
  };

  const navigateUp = () => {
    if (currentPath === '/') return;
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    const newPath = parts.length === 0 ? '/' : '/' + parts.join('/');
    loadDirectory(newPath);
  };

  const handleFilePress = async (file: any) => {
    if (file.type === 'd') {
      const newPath = currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`;
      loadDirectory(newPath);
    } else {
      if (!ftpRef.current && !sftpRef.current) return;
      
      const filePath = currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`;
      Alert.alert('Pobieranie', `Pobieranie pliku ${file.name}...`);
      setIsLoading(true);
      
      if (isSftp && sftpRef.current) {
        try {
          // Pobieramy jako plik tymczasowy, lub w react-native-ssh-sftp można podać ścieżkę lokalną
          // Zakładamy, że funkcja sftpDownload zwraca tekst lub wymaga lokalnej ścieżki
          const localPath = `${FileSystem.cacheDirectory}${file.name}`;
          await sftpRef.current.sftpDownload(filePath, localPath);
          const content = await FileSystem.readAsStringAsync(localPath);
          
          setIsLoading(false);
          log(`Pobrano plik ${file.name} (SFTP).`);
          
          navigation.navigate('Editor', { 
            filename: file.name, 
            newFile: true,
          });
        } catch (err: any) {
          setIsLoading(false);
          log(`Błąd pobierania SFTP: ${err.message}`);
          Alert.alert('Błąd', 'Nie można pobrać pliku.');
        }
      } else if (ftpRef.current) {
        let str = '';
        ftpRef.current.get(filePath, (err: any, socket: any) => {
          if (err) {
            setIsLoading(false);
            Alert.alert('Błąd', 'Nie można pobrać pliku.');
            return;
          }

          socket.on('data', (d: any) => {
            str += d.toString();
          });

          socket.on('close', (err: any) => {
            setIsLoading(false);
            if (err) {
              log('Błąd podczas zamykania połączenia transferu.');
            } else {
              log(`Pobrano plik ${file.name}.`);
              navigation.navigate('Editor', { 
                filename: file.name, 
                newFile: true,
              });
            }
          });
          
          socket.resume();
        });
      }
    }
  };

  const renderFileItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.fileItem} onPress={() => handleFilePress(item)}>
      {item.type === 'd' ? (
        <Folder size={24} color="#f1c40f" />
      ) : (
        <FileCode size={24} color="#3498db" />
      )}
      <Text style={styles.fileName}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {!isConnected ? (
        <ScrollView style={styles.formContainer}>
          <Text style={styles.title}>Połączenie FTP</Text>
          <View style={styles.form}>
            <TextInput 
              style={styles.input} 
              placeholder="Host FTP (np. ftp.domena.pl)" 
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
            <View style={styles.switchContainer}>
              <Text>Użyj SFTP (Port 22)</Text>
              <Switch value={isSftp} onValueChange={setIsSftp} />
            </View>
            <Button title={isLoading ? "Łączenie..." : "Połącz"} onPress={handleConnect} disabled={isLoading} />
          </View>
          <Text style={styles.logsHeader}>Logi operacji:</Text>
          <Text style={styles.logs}>{logs}</Text>
        </ScrollView>
      ) : (
        <View style={styles.fileManager}>
          <View style={styles.fmHeader}>
            <View style={styles.pathContainer}>
              <Text style={styles.pathText} numberOfLines={1} ellipsizeMode="head">
                {host}: {currentPath}
              </Text>
            </View>
            <TouchableOpacity onPress={handleDisconnect} style={styles.disconnectBtn}>
              <LogOut size={20} color="white" />
              <Text style={styles.disconnectText}>Rozłącz</Text>
            </TouchableOpacity>
          </View>

          {currentPath !== '/' && (
            <TouchableOpacity style={styles.upButton} onPress={navigateUp}>
              <Folder size={24} color="#f1c40f" />
              <Text style={styles.fileName}>..</Text>
            </TouchableOpacity>
          )}

          {isLoading ? (
            <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 20 }} />
          ) : (
            <FlatList
              data={files}
              keyExtractor={(item) => item.name}
              renderItem={renderFileItem}
              ListEmptyComponent={<Text style={styles.emptyText}>Pusty katalog</Text>}
            />
          )}
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
    padding: 12,
    marginBottom: 15,
    borderRadius: 5,
    backgroundColor: '#f9f9f9',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  logsHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  logs: {
    fontFamily: 'monospace',
    backgroundColor: '#1e1e1e',
    color: '#00ff00',
    padding: 10,
    borderRadius: 5,
    minHeight: 150,
    fontSize: 12,
  },
  fileManager: {
    flex: 1,
  },
  fmHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f1f1',
    padding: 10,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  pathContainer: {
    flex: 1,
    marginRight: 10,
  },
  pathText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  disconnectBtn: {
    flexDirection: 'row',
    backgroundColor: '#e74c3c',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 5,
    alignItems: 'center',
  },
  disconnectText: {
    color: 'white',
    marginLeft: 5,
    fontWeight: 'bold',
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  upButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fafafa',
  },
  fileName: {
    marginLeft: 15,
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 30,
    color: '#888',
    fontStyle: 'italic',
  }
});
