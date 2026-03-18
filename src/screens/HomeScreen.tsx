import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Button, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import { Folder, FileCode, Plus, Download } from 'lucide-react-native';

export default function HomeScreen() {
  const navigation = useNavigation();
  const [files, setFiles] = useState<string[]>([]);
  const [repoUrl, setRepoUrl] = useState('');

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    const dir = FileSystem.documentDirectory + 'projects/';
    const info = await FileSystem.getInfoAsync(dir);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    }
    const result = await FileSystem.readDirectoryAsync(dir);
    setFiles(result);
  };

  const handleOpenFile = (filename: string) => {
    navigation.navigate('Editor', { filename });
  };

  const handleClone = () => {
    // Implement clone logic or navigate to specialized screen
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
          <TouchableOpacity style={styles.fileItem} onPress={() => handleOpenFile(item)}>
            <FileCode size={24} color="#333" />
            <Text style={styles.fileName}>{item}</Text>
          </TouchableOpacity>
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
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
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
