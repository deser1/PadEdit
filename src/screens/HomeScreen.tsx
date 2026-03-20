import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Button, TextInput, Alert, Modal } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system/legacy';
import { FileCode, Plus, Trash2, Folder, Terminal } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HomeScreenNavigationProp } from '../navigation/types';

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [files, setFiles] = useState<string[]>([]);
  const [repoUrl, setRepoUrl] = useState('');
  const [currentWorkspace, setCurrentWorkspace] = useState('projects');
  const [workspaces, setWorkspaces] = useState<string[]>(['projects']);
  const [isWorkspaceModalVisible, setIsWorkspaceModalVisible] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadWorkspaces();
      loadFiles(currentWorkspace);
    }, [currentWorkspace])
  );

  const loadWorkspaces = async () => {
    try {
      const savedWorkspaces = await AsyncStorage.getItem('workspaces');
      if (savedWorkspaces) {
        setWorkspaces(JSON.parse(savedWorkspaces));
      } else {
        await AsyncStorage.setItem('workspaces', JSON.stringify(['projects']));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const createWorkspace = async () => {
    if (!newWorkspaceName.trim()) return;
    const cleanName = newWorkspaceName.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    
    if (workspaces.includes(cleanName)) {
      Alert.alert('Błąd', 'Workspace o takiej nazwie już istnieje');
      return;
    }

    try {
      const newWorkspaces = [...workspaces, cleanName];
      await AsyncStorage.setItem('workspaces', JSON.stringify(newWorkspaces));
      
      const dir = (FileSystem.documentDirectory || '') + cleanName + '/';
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
      
      setWorkspaces(newWorkspaces);
      setCurrentWorkspace(cleanName);
      setIsWorkspaceModalVisible(false);
      setNewWorkspaceName('');
    } catch (e) {
      Alert.alert('Błąd', 'Nie udało się utworzyć workspace');
    }
  };

  const loadFiles = async (workspace: string) => {
    const dir = (FileSystem.documentDirectory || '') + workspace + '/';
    const info = await FileSystem.getInfoAsync(dir);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    }
    const result = await FileSystem.readDirectoryAsync(dir);
    setFiles(result);
  };

  const handleDeleteFile = (filename: string) => {
    Alert.alert(
      "Usuń plik",
      `Czy na pewno chcesz usunąć plik ${filename}?`,
      [
        {
          text: "Anuluj",
          style: "cancel"
        },
        { 
          text: "Usuń", 
          onPress: async () => {
            try {
              const fileUri = (FileSystem.documentDirectory || '') + currentWorkspace + '/' + filename;
              await FileSystem.deleteAsync(fileUri, { idempotent: true });
              loadFiles(currentWorkspace);
            } catch (error) {
              Alert.alert("Błąd", "Nie udało się usunąć pliku");
              console.error(error);
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  const handleOpenFile = (filename: string) => {
    navigation.navigate('Editor', { filename });
  };

  const handleClone = () => {
    console.log('Cloning repo:', repoUrl);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>PadEdit</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => navigation.navigate('Ftp')} style={styles.iconButton}>
            <Folder color="#007bff" size={24} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('SshTerminal')} style={styles.iconButton}>
            <Terminal color="#007bff" size={24} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Editor', { newFile: true })} style={styles.iconButton}>
            <Plus color="#007bff" size={24} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.workspaceContainer}>
        <Text style={styles.sectionTitle}>Workspace:</Text>
        <View style={styles.workspaceSelector}>
          <FlatList
            data={workspaces}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => item}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={[styles.workspaceTab, currentWorkspace === item && styles.workspaceTabActive]}
                onPress={() => setCurrentWorkspace(item)}
              >
                <Text style={[styles.workspaceTabText, currentWorkspace === item && styles.workspaceTabTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity onPress={() => setIsWorkspaceModalVisible(true)} style={styles.addWorkspaceBtn}>
            <Plus size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 10 }]}>Pliki ({currentWorkspace})</Text>
      <FlatList
        data={files}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <View style={styles.fileItemContainer}>
            <TouchableOpacity 
              style={styles.fileItem} 
              onPress={() => navigation.navigate('Editor', { filename: item, workspace: currentWorkspace } as any)}
            >
              <FileCode color="#333" size={24} style={styles.fileIcon} />
              <Text style={styles.fileName}>{item}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.deleteButton} 
              onPress={() => handleDeleteFile(item)}
            >
              <Trash2 color="#ff4444" size={20} />
            </TouchableOpacity>
          </View>
        )}
      />

      <Modal visible={isWorkspaceModalVisible} animationType="fade" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nowy Workspace</Text>
            <TextInput
              style={styles.input}
              placeholder="Nazwa projektu"
              value={newWorkspaceName}
              onChangeText={setNewWorkspaceName}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 }}>
              <Button title="Anuluj" color="#888" onPress={() => setIsWorkspaceModalVisible(false)} />
              <Button title="Utwórz" onPress={createWorkspace} />
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
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 8,
    marginRight: 10,
    borderRadius: 4,
    backgroundColor: 'white',
  },
  fileItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
    overflow: 'hidden',
  },
  fileItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  deleteButton: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff0f0',
  },
  fileName: {
    marginLeft: 10,
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    color: '#888',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: 15,
  },
  workspaceContainer: {
    marginBottom: 10,
  },
  workspaceSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f1f1',
    borderRadius: 8,
    padding: 5,
  },
  workspaceTab: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 5,
  },
  workspaceTabActive: {
    backgroundColor: '#007bff',
  },
  workspaceTabText: {
    color: '#555',
    fontWeight: '600',
  },
  workspaceTabTextActive: {
    color: '#fff',
  },
  addWorkspaceBtn: {
    padding: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  fileIcon: {
    marginRight: 10,
  },
});
