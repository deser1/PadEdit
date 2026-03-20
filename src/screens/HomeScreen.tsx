import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Button, TextInput, Alert } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system/legacy';
import { FileCode, Plus, Trash2 } from 'lucide-react-native';
import { HomeScreenNavigationProp } from '../navigation/types';

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [files, setFiles] = useState<string[]>([]);
  const [repoUrl, setRepoUrl] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadFiles();
    }, [])
  );

  const loadFiles = async () => {
    const dir = (FileSystem.documentDirectory || '') + 'projects/';
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
              const fileUri = (FileSystem.documentDirectory || '') + 'projects/' + filename;
              await FileSystem.deleteAsync(fileUri, { idempotent: true });
              // Odśwież listę plików po usunięciu
              loadFiles();
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
        <Text style={styles.title}>PadEdit Projects</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
            <Text>Settings</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.actions}>
        <TextInput 
          style={styles.input} 
          placeholder="GitHub Repo URL" 
          value={repoUrl}
          onChangeText={setRepoUrl}
        />
        <Button title="Clone" onPress={handleClone} />
      </View>

      <View style={{ marginBottom: 20 }}>
        <Button title="Connect to FTP" onPress={() => navigation.navigate('Ftp')} />
      </View>

      <FlatList
        data={files}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <View style={styles.fileItemContainer}>
            <TouchableOpacity style={styles.fileItem} onPress={() => handleOpenFile(item)}>
              <FileCode size={24} color="#333" />
              <Text style={styles.fileName}>{item}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteFile(item)}>
              <Trash2 size={24} color="#e74c3c" />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No projects found. Create one or clone a repo.</Text>}
      />
      
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('Editor', { newFile: true })}>
        <Plus color="white" size={24} />
      </TouchableOpacity>
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
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
});
