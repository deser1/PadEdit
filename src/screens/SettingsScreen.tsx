import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, TextInput, Button, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [useAi, setUseAi] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [aiProvider, setAiProvider] = useState('openai'); // 'openai' lub 'anthropic'

  useEffect(() => {
    const loadSettings = async () => {
      const savedTheme = await AsyncStorage.getItem('settings_dark_theme');
      const savedUseAi = await AsyncStorage.getItem('settings_use_ai');
      const savedApiKey = await AsyncStorage.getItem('settings_api_key');
      const savedProvider = await AsyncStorage.getItem('settings_ai_provider');
      
      if (savedTheme) setIsDarkTheme(savedTheme === 'true');
      if (savedUseAi) setUseAi(savedUseAi === 'true');
      if (savedApiKey) setApiKey(savedApiKey);
      if (savedProvider) setAiProvider(savedProvider);
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    try {
      await AsyncStorage.setItem('settings_dark_theme', isDarkTheme.toString());
      await AsyncStorage.setItem('settings_use_ai', useAi.toString());
      await AsyncStorage.setItem('settings_api_key', apiKey);
      await AsyncStorage.setItem('settings_ai_provider', aiProvider);
      Alert.alert('Sukces', 'Ustawienia zapisane');
    } catch (e) {
      Alert.alert('Błąd', 'Nie udało się zapisać ustawień');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ustawienia</Text>

      <View style={styles.option}>
        <Text style={styles.label}>Ciemny motyw</Text>
        <Switch value={isDarkTheme} onValueChange={setIsDarkTheme} />
      </View>

      <View style={styles.option}>
        <Text style={styles.label}>Włącz asystenta AI</Text>
        <Switch value={useAi} onValueChange={setUseAi} />
      </View>

      {useAi && (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Dostawca AI</Text>
          <View style={styles.providerRow}>
            <Button 
              title="OpenAI" 
              color={aiProvider === 'openai' ? '#007bff' : '#ccc'} 
              onPress={() => setAiProvider('openai')} 
            />
            <View style={{ width: 10 }} />
            <Button 
              title="Anthropic" 
              color={aiProvider === 'anthropic' ? '#007bff' : '#ccc'} 
              onPress={() => setAiProvider('anthropic')} 
            />
          </View>

          <Text style={[styles.label, { marginTop: 15 }]}>Klucz API</Text>
          <TextInput
            style={styles.input}
            placeholder="Wprowadź klucz API"
            value={apiKey}
            onChangeText={setApiKey}
            secureTextEntry
          />
        </View>
      )}

      <Button title="Zapisz ustawienia" onPress={handleSave} />
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
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  providerRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    backgroundColor: '#fff',
  },
});
