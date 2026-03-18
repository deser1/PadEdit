import React, { useState } from 'react';
import { View, Text, Switch, StyleSheet, TextInput, Button } from 'react-native';

export default function SettingsScreen() {
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [useAi, setUseAi] = useState(false);
  const [apiKey, setApiKey] = useState('');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.option}>
        <Text style={styles.label}>Dark Theme</Text>
        <Switch value={isDarkTheme} onValueChange={setIsDarkTheme} />
      </View>

      <View style={styles.option}>
        <Text style={styles.label}>Enable AI Engine (Paid)</Text>
        <Switch value={useAi} onValueChange={setUseAi} />
      </View>

      {useAi && (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>AI API Key</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter API Key"
            value={apiKey}
            onChangeText={setApiKey}
            secureTextEntry
          />
        </View>
      )}

      <Button title="Save Settings" onPress={() => alert('Settings Saved')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  label: {
    fontSize: 18,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
});
