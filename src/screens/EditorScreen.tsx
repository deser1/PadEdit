import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert, Modal, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { WebView } from 'react-native-webview';
import CodeEditor, { CodeEditorHandle } from '../components/CodeEditor';
import { Save, GitBranch, Terminal, Settings, Keyboard, X, Play, ClipboardPaste } from 'lucide-react-native';
import { EditorScreenRouteProp, EditorScreenNavigationProp } from '../navigation/types';
import * as Clipboard from 'expo-clipboard';
import hljs from 'highlight.js';

interface OpenFile {
  filename: string;
  content: string;
  language: string;
}

export default function EditorScreen() {
  const route = useRoute<EditorScreenRouteProp>();
  const navigation = useNavigation<EditorScreenNavigationProp>();
  const { filename: routeFilename, newFile, workspace } = route.params || {};
  const currentWorkspace = workspace || 'projects';
  
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  
  const [theme, setTheme] = useState<'vs-dark' | 'vs-light'>('vs-dark');
  const [isAiModalVisible, setIsAiModalVisible] = useState(false);
  const [isSaveModalVisible, setIsSaveModalVisible] = useState(false);
  const [isRunModalVisible, setIsRunModalVisible] = useState(false);
  const [runLogs, setRunLogs] = useState<string[]>([]);
  const [newFilename, setNewFilename] = useState('untitled.js');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const editorRef = useRef<CodeEditorHandle>(null);

  const activeFile = activeIndex >= 0 && activeIndex < openFiles.length ? openFiles[activeIndex] : null;

  const keyboardSymbols = ['Tab', '{', '}', '(', ')', '[', ']', '<', '>', ';', ':', "'", '"', '=', '+', '-', '*', '/', '\\', '|', '&', '!', '$', '#', '@', '%', '^', '_'];

  useEffect(() => {
    if (routeFilename) {
      const existingIndex = openFiles.findIndex(f => f.filename === routeFilename);
      if (existingIndex >= 0) {
        setActiveIndex(existingIndex);
      } else {
        loadFile(routeFilename);
      }
    } else if (openFiles.length === 0) {
      // Domyślny pusty plik
      setOpenFiles([{ filename: '', content: '// Write your code here...', language: 'javascript' }]);
      setActiveIndex(0);
    }
  }, [routeFilename]);

  const loadFile = async (file: string) => {
    try {
      const content = await FileSystem.readAsStringAsync((FileSystem.documentDirectory || '') + currentWorkspace + '/' + file);
      const lang = detectLanguage(file, content);
      
      setOpenFiles(prev => {
        const newFiles = [...prev, { filename: file, content, language: lang }];
        setActiveIndex(newFiles.length - 1);
        return newFiles;
      });
      
      setTimeout(() => {
        editorRef.current?.insertText(''); 
      }, 500);
    } catch (e) {
      Alert.alert('Error', 'Failed to load file');
    }
  };

  const closeFile = (index: number) => {
    setOpenFiles(prev => {
      const newFiles = [...prev];
      newFiles.splice(index, 1);
      if (newFiles.length === 0) {
        newFiles.push({ filename: '', content: '// Write your code here...', language: 'javascript' });
        setActiveIndex(0);
      } else if (activeIndex >= newFiles.length) {
        setActiveIndex(newFiles.length - 1);
      } else if (activeIndex === index) {
        setActiveIndex(Math.max(0, index - 1));
      }
      return newFiles;
    });
  };

  const updateActiveFileContent = (newContent: string) => {
    if (activeIndex >= 0) {
      setOpenFiles(prev => {
        const newFiles = [...prev];
        newFiles[activeIndex] = { ...newFiles[activeIndex], content: newContent };
        return newFiles;
      });
    }
  };

  const detectLanguage = (file: string, fileContent?: string) => {
    const ext = file.split('.').pop()?.toLowerCase();
    let detectedLang = 'plaintext';
    switch (ext) {
      case 'js': detectedLang = 'javascript'; break;
      case 'ts': detectedLang = 'typescript'; break;
      case 'jsx': detectedLang = 'javascript'; break;
      case 'tsx': detectedLang = 'typescript'; break;
      case 'py': detectedLang = 'python'; break;
      case 'html': detectedLang = 'html'; break;
      case 'css': detectedLang = 'css'; break;
      case 'json': detectedLang = 'json'; break;
      case 'java': detectedLang = 'java'; break;
      case 'cpp': case 'cc': case 'c': detectedLang = 'cpp'; break;
      case 'cs': detectedLang = 'csharp'; break;
      case 'php': detectedLang = 'php'; break;
      case 'rb': detectedLang = 'php'; break;
      case 'go': detectedLang = 'go'; break;
      case 'rs': detectedLang = 'rust'; break;
      case 'sql': detectedLang = 'sql'; break;
      case 'xml': detectedLang = 'xml'; break;
      case 'md': detectedLang = 'markdown'; break;
    }

    if (detectedLang === 'plaintext' && fileContent) {
        try {
            const result = hljs.highlightAuto(fileContent.substring(0, 1000));
            if (result.language) {
                const langMap: Record<string, string> = {
                    'js': 'javascript',
                    'ts': 'typescript',
                    'py': 'python',
                    'cs': 'csharp',
                };
                detectedLang = langMap[result.language] || result.language;
            }
        } catch (e) {}
    }
    return detectedLang;
  };

  const handleSave = async () => {
    if (!activeFile) return;
    if (activeFile.filename) {
      Alert.alert(
        'Nadpisz plik',
        `Czy na pewno chcesz nadpisać plik ${activeFile.filename}?`,
        [
          { text: 'Anuluj', style: 'cancel' },
          { 
            text: 'Nadpisz', 
            onPress: async () => {
              try {
                await FileSystem.writeAsStringAsync((FileSystem.documentDirectory || '') + currentWorkspace + '/' + activeFile.filename, activeFile.content);
                Alert.alert('Sukces', 'Plik został nadpisany');
              } catch (e) {
                Alert.alert('Błąd', 'Nie udało się zapisać pliku');
              }
            }
          }
        ]
      );
    } else {
      setNewFilename('untitled.js');
      setIsSaveModalVisible(true);
    }
  };

  const handleSaveToProjects = async () => {
    if (!activeFile) return;
    setIsSaveModalVisible(false);
    try {
      await FileSystem.writeAsStringAsync((FileSystem.documentDirectory || '') + currentWorkspace + '/' + newFilename, activeFile.content);
      setOpenFiles(prev => {
        const newFiles = [...prev];
        newFiles[activeIndex] = { ...newFiles[activeIndex], filename: newFilename, language: detectLanguage(newFilename, activeFile.content) };
        return newFiles;
      });
      Alert.alert('Sukces', `Plik zapisany w ${currentWorkspace}`);
    } catch (e) {
      Alert.alert('Błąd', 'Nie udało się zapisać pliku');
    }
  };

  const handleSaveToDevice = async () => {
    if (!activeFile) return;
    setIsSaveModalVisible(false);
    if (Platform.OS === 'android') {
      try {
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (permissions.granted) {
          const ext = newFilename.split('.').pop()?.toLowerCase();
          let mimeType = 'text/plain';
          if (ext === 'html') mimeType = 'text/html';
          else if (ext === 'json') mimeType = 'application/json';
          else if (ext === 'js') mimeType = 'application/javascript';
          else if (ext === 'css') mimeType = 'text/css';
          
          const uri = await FileSystem.StorageAccessFramework.createFileAsync(permissions.directoryUri, newFilename, mimeType);
          await FileSystem.writeAsStringAsync(uri, activeFile.content);
          Alert.alert('Sukces', 'Plik zapisany na urządzeniu');
        }
      } catch (e) {
        Alert.alert('Błąd', 'Nie udało się zapisać pliku na urządzeniu');
      }
    } else {
      try {
        const tempUri = FileSystem.cacheDirectory + newFilename;
        await FileSystem.writeAsStringAsync(tempUri, activeFile.content);
        await Sharing.shareAsync(tempUri);
      } catch (e) {
        Alert.alert('Błąd', 'Nie udało się udostępnić pliku');
      }
    }
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim() || !activeFile) return;

    try {
      const useAi = await AsyncStorage.getItem('settings_use_ai');
      if (useAi !== 'true') {
        Alert.alert('Błąd', 'Asystent AI jest wyłączony w ustawieniach.');
        return;
      }

      const apiKey = await AsyncStorage.getItem('settings_api_key');
      const provider = await AsyncStorage.getItem('settings_ai_provider') || 'openai';

      if (!apiKey) {
        Alert.alert('Błąd', 'Brak klucza API. Ustaw go w ustawieniach.');
        return;
      }

      setIsAiLoading(true);
      let generatedCode = '';
      
      const systemPrompt = `You are an expert programmer. 
Context: The user is currently editing a file named "${activeFile.filename}" in language "${activeFile.language}".
Here is the current full content of the file:
\`\`\`${activeFile.language}
${activeFile.content}
\`\`\`

Based on the user's prompt, output ONLY the raw code that should be appended or inserted. Do not include markdown formatting like \`\`\`js or \`\`\` unless specifically asked. Do not explain the code.`;

      if (provider === 'openai') {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: aiPrompt }
            ]
          })
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        generatedCode = data.choices[0].message.content;
      } else if (provider === 'anthropic') {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1000,
            system: systemPrompt,
            messages: [
              { role: 'user', content: aiPrompt }
            ]
          })
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        generatedCode = data.content[0].text;
      } else if (provider === 'gemini') {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            system_instruction: {
              parts: { text: systemPrompt }
            },
            contents: [
              { parts: [{ text: aiPrompt }] }
            ]
          })
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        if (data.candidates && data.candidates.length > 0) {
          generatedCode = data.candidates[0].content.parts[0].text;
        } else {
          throw new Error('Brak odpowiedzi od modelu Gemini');
        }
      }

      setIsAiModalVisible(false);
      updateActiveFileContent(activeFile.content + '\n' + generatedCode);
      setAiPrompt('');
    } catch (error: any) {
      Alert.alert('Błąd AI', error.message || 'Wystąpił problem podczas komunikacji z API.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleGetSelectionForAi = async () => {
    if (editorRef.current) {
      const selectedText = await editorRef.current.getSelectedText();
      if (selectedText) {
        setAiPrompt(prev => prev ? `${prev}\n\nAnalizuj ten kod:\n${selectedText}` : `Analizuj ten kod:\n${selectedText}`);
      } else {
        Alert.alert('Info', 'Nie zaznaczono żadnego tekstu w edytorze.');
      }
    }
  };

  const handlePaste = async () => {
    const text = await Clipboard.getStringAsync();
    if (text && editorRef.current) {
      editorRef.current.pasteText(text);
    }
  };

  const handleInsertSymbol = (symbol: string) => {
    if (symbol === 'Tab') {
      editorRef.current?.insertText('\t');
    } else {
      editorRef.current?.insertText(symbol);
    }
  };

  const handleRunCode = () => {
    if (!activeFile) return;
    setRunLogs([]);
    setIsRunModalVisible(true);
  };

  const executeCodeHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <script src="https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js"></script>
    </head>
    <body>
      <script>
        const sendLog = (type, ...args) => {
          const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
          window.ReactNativeWebView.postMessage(JSON.stringify({ type, msg }));
        };
        console.log = (...args) => sendLog('log', ...args);
        console.error = (...args) => sendLog('error', ...args);
        console.warn = (...args) => sendLog('warn', ...args);

        window.onerror = function(message, source, lineno, colno, error) {
          sendLog('error', message);
        };

        async function run() {
          const code = decodeURIComponent("${encodeURIComponent(activeFile?.content || '')}");
          const lang = "${activeFile?.language || 'javascript'}";
          
          sendLog('log', '--- Uruchamianie skryptu ---');
          
          try {
            if (lang === 'javascript' || lang === 'typescript') {
              // Prosta emulacja dla JS
              const result = eval(code);
              if (result !== undefined) sendLog('log', 'Wyjście:', result);
            } else if (lang === 'python') {
              sendLog('log', 'Ładowanie środowiska Python (Pyodide)...');
              let pyodide = await loadPyodide();
              
              // Przekierowanie sys.stdout
              pyodide.runPython(\`
                import sys
                import io
                sys.stdout = io.StringIO()
              \`);
              
              await pyodide.runPythonAsync(code);
              
              const stdout = pyodide.runPython("sys.stdout.getvalue()");
              if (stdout) sendLog('log', stdout);
            } else {
              sendLog('error', 'Nieobsługiwany język dla lokalnego wykonania: ' + lang);
            }
          } catch (e) {
            sendLog('error', e.toString());
          }
          sendLog('log', '--- Zakończono ---');
        }
        
        // Wait a bit for Pyodide to be ready if needed, or just run
        run();
      </script>
    </body>
    </html>
  `;

  if (!activeFile) return <View style={styles.container} />;

  return (
    <View style={styles.container}>
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {openFiles.map((file, index) => (
            <TouchableOpacity 
              key={`${index}-${file.filename}`}
              style={[styles.tab, activeIndex === index && styles.activeTab]}
              onPress={() => setActiveIndex(index)}
            >
              <Text style={[styles.tabText, activeIndex === index && styles.activeTabText]}>
                {file.filename || 'untitled'}
              </Text>
              <TouchableOpacity onPress={() => closeFile(index)} style={styles.closeTabButton}>
                <X size={14} color={activeIndex === index ? "#007bff" : "#666"} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.toolbar}>
        <TouchableOpacity onPress={handleSave} style={styles.toolButton}>
          <Save color="#333" size={24} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handlePaste} style={styles.toolButton}>
          <ClipboardPaste color="#333" size={24} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleRunCode} style={styles.toolButton}>
          <Play color="#333" size={24} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setIsAiModalVisible(true)} style={styles.toolButton}>
          <Terminal color="#333" size={24} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => editorRef.current?.focus()} style={styles.toolButton}>
          <Keyboard color="#333" size={24} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Git')} style={styles.toolButton}>
          <GitBranch color="#333" size={24} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.toolButton}>
          <Settings color="#333" size={24} />
        </TouchableOpacity>
      </View>
      
      <CodeEditor 
        key={`editor-${activeIndex}`}
        ref={editorRef}
        initialCode={activeFile.content} 
        language={activeFile.language} 
        onChange={updateActiveFileContent} 
        theme={theme}
      />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.keyboardToolbar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="always">
            {keyboardSymbols.map((symbol) => (
              <TouchableOpacity key={symbol} style={styles.symbolButton} onPress={() => handleInsertSymbol(symbol)}>
                <Text style={styles.symbolText}>{symbol}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={isAiModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Asystent AI</Text>
            <TouchableOpacity onPress={handleGetSelectionForAi} style={styles.selectionButton}>
              <Text style={styles.selectionButtonText}>Pobierz zaznaczony tekst z edytora</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.aiInput}
              placeholder="Opisz co chcesz zrobić lub o co zapytać..."
              value={aiPrompt}
              onChangeText={setAiPrompt}
              multiline
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setIsAiModalVisible(false)} style={styles.cancelButton}>
                <Text>Anuluj</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAiGenerate} style={styles.generateButton} disabled={isAiLoading}>
                <Text style={{color: 'white'}}>{isAiLoading ? 'Wysyłanie...' : 'Wyślij zapytanie'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={isSaveModalVisible} animationType="fade" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Zapisz nowy plik</Text>
            <TextInput
              style={[styles.aiInput, { height: 50 }]}
              placeholder="Nazwa pliku (np. index.js)"
              value={newFilename}
              onChangeText={setNewFilename}
            />
            <View style={{ flexDirection: 'column', gap: 10 }}>
              <TouchableOpacity onPress={handleSaveToProjects} style={[styles.generateButton, { backgroundColor: '#28a745' }]}>
                <Text style={{color: 'white', textAlign: 'center'}}>Zapisz w {currentWorkspace}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveToDevice} style={[styles.generateButton, { backgroundColor: '#007bff' }]}>
                <Text style={{color: 'white', textAlign: 'center'}}>Wybierz folder w telefonie</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIsSaveModalVisible(false)} style={[styles.cancelButton, { marginTop: 10 }]}>
                <Text style={{textAlign: 'center'}}>Anuluj</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={isRunModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { height: '80%', width: '100%', padding: 0 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 15, backgroundColor: '#f1f1f1', borderTopLeftRadius: 10, borderTopRightRadius: 10 }}>
              <Text style={{ fontWeight: 'bold', fontSize: 16 }}>Terminal ({activeFile.language})</Text>
              <TouchableOpacity onPress={() => setIsRunModalVisible(false)}>
                <X size={20} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ flex: 1, backgroundColor: '#1e1e1e', padding: 10 }}>
              {runLogs.map((log, i) => (
                <Text key={i} style={{ color: log.startsWith('[error]') ? '#ff5555' : '#00ff00', fontFamily: 'monospace', marginBottom: 5 }}>
                  {log}
                </Text>
              ))}
            </ScrollView>
            
            {isRunModalVisible && (
              <View style={{ height: 0, width: 0, opacity: 0 }}>
                <WebView
                  originWhitelist={['*']}
                  source={{ html: executeCodeHtml }}
                  onMessage={(event) => {
                    try {
                      const data = JSON.parse(event.nativeEvent.data);
                      setRunLogs(prev => [...prev, data.type === 'error' ? `[error] ${data.msg}` : data.msg]);
                    } catch (e) {
                      setRunLogs(prev => [...prev, `[system] ${event.nativeEvent.data}`]);
                    }
                  }}
                  javaScriptEnabled={true}
                />
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRightWidth: 1,
    borderRightColor: '#ddd',
    backgroundColor: '#eaeaea',
  },
  activeTab: {
    backgroundColor: '#fff',
    borderBottomWidth: 2,
    borderBottomColor: '#007bff',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#007bff',
    fontWeight: 'bold',
  },
  closeTabButton: {
    marginLeft: 8,
    padding: 2,
  },
  toolbar: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    justifyContent: 'space-around',
  },
  toolButton: {
    padding: 8,
  },
  keyboardToolbar: {
    height: 50,
    backgroundColor: '#f0f0f0',
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    flexDirection: 'row',
    alignItems: 'center',
  },
  symbolButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 40,
  },
  symbolText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  selectionButton: {
    backgroundColor: '#e9ecef',
    padding: 8,
    borderRadius: 5,
    marginBottom: 10,
    alignItems: 'center',
  },
  selectionButtonText: {
    color: '#007bff',
    fontSize: 14,
    fontWeight: '500',
  },
  aiInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    height: 100,
    marginBottom: 20,
    borderRadius: 5,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    padding: 10,
    marginRight: 10,
  },
  generateButton: {
    padding: 10,
    backgroundColor: '#007bff',
    borderRadius: 5,
  },
});
