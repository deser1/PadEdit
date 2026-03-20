import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert, Modal, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import CodeEditor, { CodeEditorHandle } from '../components/CodeEditor';
import { Save, GitBranch, Terminal, Settings, Keyboard } from 'lucide-react-native';
import { EditorScreenRouteProp, EditorScreenNavigationProp } from '../navigation/types';
import hljs from 'highlight.js';

export default function EditorScreen() {
  const route = useRoute<EditorScreenRouteProp>();
  const navigation = useNavigation<EditorScreenNavigationProp>();
  const { filename: routeFilename, newFile } = route.params || {};
  const [currentFilename, setCurrentFilename] = useState(routeFilename || '');
  const [code, setCode] = useState('// Write your code here...');
  const [language, setLanguage] = useState('javascript');
  const [theme, setTheme] = useState<'vs-dark' | 'vs-light'>('vs-dark');
  const [isAiModalVisible, setIsAiModalVisible] = useState(false);
  const [isSaveModalVisible, setIsSaveModalVisible] = useState(false);
  const [newFilename, setNewFilename] = useState(currentFilename || 'untitled.js');
  const [aiPrompt, setAiPrompt] = useState('');
  const editorRef = useRef<CodeEditorHandle>(null);

  const keyboardSymbols = ['Tab', '{', '}', '(', ')', '[', ']', '<', '>', ';', ':', "'", '"', '=', '+', '-', '*', '/', '\\', '|', '&', '!', '$', '#', '@', '%', '^', '_'];

  useEffect(() => {
    if (routeFilename) {
      setCurrentFilename(routeFilename);
      setNewFilename(routeFilename);
      loadFile(routeFilename);
    } else {
      setCode('// Write your code here...');
      setLanguage('javascript');
      setCurrentFilename('');
    }
  }, [routeFilename]);

  const loadFile = async (file: string) => {
    try {
      const content = await FileSystem.readAsStringAsync((FileSystem.documentDirectory || '') + 'projects/' + file);
      setCode(content);
      detectLanguage(file, content);
      
      // Force update to editor after a short delay to ensure WebView is ready
      setTimeout(() => {
        editorRef.current?.insertText(''); // Trigger a non-destructive change to wake up the editor
      }, 500);
    } catch (e) {
      Alert.alert('Error', 'Failed to load file');
    }
  };

  const detectLanguage = (file: string, fileContent?: string) => {
    // 1. Try to detect by extension first (fastest and usually most accurate)
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

    // 2. If extension didn't give a clear answer, try analyzing content
    if (detectedLang === 'plaintext' && fileContent) {
        try {
            // highlight.js can auto-detect language based on code syntax
            const result = hljs.highlightAuto(fileContent.substring(0, 1000)); // Only analyze first 1000 chars for performance
            if (result.language) {
                // Map highlight.js languages to monaco languages if needed
                const langMap: Record<string, string> = {
                    'js': 'javascript',
                    'ts': 'typescript',
                    'py': 'python',
                    'cs': 'csharp',
                    // add more mappings if hljs returns abbreviations
                };
                detectedLang = langMap[result.language] || result.language;
            }
        } catch (e) {
            console.warn('Language auto-detection failed', e);
        }
    }

    setLanguage(detectedLang);
  };

  const handleSave = async () => {
    if (currentFilename) {
      Alert.alert(
        'Nadpisz plik',
        `Czy na pewno chcesz nadpisać plik ${currentFilename}?`,
        [
          { text: 'Anuluj', style: 'cancel' },
          { 
            text: 'Nadpisz', 
            onPress: async () => {
              try {
                await FileSystem.writeAsStringAsync((FileSystem.documentDirectory || '') + 'projects/' + currentFilename, code);
                Alert.alert('Sukces', 'Plik został nadpisany');
              } catch (e) {
                Alert.alert('Błąd', 'Nie udało się zapisać pliku');
              }
            }
          }
        ]
      );
    } else {
      setIsSaveModalVisible(true);
    }
  };

  const handleSaveToProjects = async () => {
    setIsSaveModalVisible(false);
    try {
      await FileSystem.writeAsStringAsync((FileSystem.documentDirectory || '') + 'projects/' + newFilename, code);
      setCurrentFilename(newFilename);
      Alert.alert('Sukces', 'Plik zapisany w projektach aplikacji');
    } catch (e) {
      Alert.alert('Błąd', 'Nie udało się zapisać pliku');
    }
  };

  const handleSaveToDevice = async () => {
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
          await FileSystem.writeAsStringAsync(uri, code);
          Alert.alert('Sukces', 'Plik zapisany na urządzeniu');
        }
      } catch (e) {
        Alert.alert('Błąd', 'Nie udało się zapisać pliku na urządzeniu');
      }
    } else {
      try {
        const tempUri = FileSystem.cacheDirectory + newFilename;
        await FileSystem.writeAsStringAsync(tempUri, code);
        await Sharing.shareAsync(tempUri);
      } catch (e) {
        Alert.alert('Błąd', 'Nie udało się udostępnić pliku');
      }
    }
  };

  const handleAiGenerate = () => {
    // Mock AI generation
    setIsAiModalVisible(false);
    const mockCode = `\n// Generated by AI for: ${aiPrompt}\nfunction aiGenerated() {\n  console.log("AI Magic!");\n}`;
    setCode(prev => prev + mockCode);
  };

  const handleInsertSymbol = (symbol: string) => {
    if (symbol === 'Tab') {
      editorRef.current?.insertText('\t');
    } else {
      editorRef.current?.insertText(symbol);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <TouchableOpacity onPress={handleSave} style={styles.toolButton}>
          <Save color="#333" size={24} />
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
        key={currentFilename || 'new'}
        ref={editorRef}
        initialCode={code} 
        language={language} 
        onChange={setCode} 
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
            <Text style={styles.modalTitle}>AI Code Generator (Paid Feature)</Text>
            <TextInput
              style={styles.aiInput}
              placeholder="Describe what you want..."
              value={aiPrompt}
              onChangeText={setAiPrompt}
              multiline
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setIsAiModalVisible(false)} style={styles.cancelButton}>
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAiGenerate} style={styles.generateButton}>
                <Text style={{color: 'white'}}>Generate</Text>
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
                <Text style={{color: 'white', textAlign: 'center'}}>Zapisz w projektach aplikacji</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
