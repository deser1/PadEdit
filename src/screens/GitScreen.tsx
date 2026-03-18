import React, { useState } from 'react';
import { View, Text, Button, TextInput, StyleSheet, ScrollView } from 'react-native';
import * as GitService from '../services/GitService';

export default function GitScreen() {
  const [output, setOutput] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [token, setToken] = useState('');

  const log = (msg: string) => setOutput(prev => prev + '\n' + msg);

  const handleInit = async () => {
    try {
      await GitService.initRepo();
      log('Repo initialized');
    } catch (e) {
      log('Error init: ' + e);
    }
  };

  const handleStatus = async () => {
    try {
      const status = await GitService.status('.');
      log('Status: ' + status);
    } catch (e) {
      log('Error status: ' + e);
    }
  };

  const handleAdd = async () => {
    try {
      await GitService.addFile('.');
      log('Added all files');
    } catch (e) {
      log('Error add: ' + e);
    }
  };

  const handleCommit = async () => {
    try {
      await GitService.commit(commitMessage);
      log('Committed: ' + commitMessage);
      setCommitMessage('');
    } catch (e) {
      log('Error commit: ' + e);
    }
  };

  const handlePush = async () => {
    try {
      await GitService.pushRepo(token);
      log('Pushed to remote');
    } catch (e) {
      log('Error push: ' + e);
    }
  };

  const handlePull = async () => {
    try {
      await GitService.pullRepo();
      log('Pulled from remote');
    } catch (e) {
      log('Error pull: ' + e);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Git Operations</Text>
      
      <View style={styles.section}>
        <Button title="Initialize Repo" onPress={handleInit} />
        <Button title="Check Status" onPress={handleStatus} />
        <Button title="Add All Changes" onPress={handleAdd} />
      </View>

      <View style={styles.section}>
        <TextInput 
          placeholder="Commit Message" 
          value={commitMessage} 
          onChangeText={setCommitMessage} 
          style={styles.input} 
        />
        <Button title="Commit" onPress={handleCommit} />
      </View>

      <View style={styles.section}>
        <TextInput 
          placeholder="GitHub Token" 
          secureTextEntry 
          value={token} 
          onChangeText={setToken} 
          style={styles.input} 
        />
        <Button title="Push" onPress={handlePush} />
        <Button title="Pull" onPress={handlePull} />
      </View>

      <Text style={styles.outputHeader}>Output:</Text>
      <Text style={styles.output}>{output}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  outputHeader: {
    fontSize: 18,
    marginTop: 10,
  },
  output: {
    fontFamily: 'monospace',
    backgroundColor: '#eee',
    padding: 10,
    minHeight: 100,
    marginBottom: 50,
  },
});
