import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import HomeScreen from '../screens/HomeScreen';
import EditorScreen from '../screens/EditorScreen';
import GitScreen from '../screens/GitScreen';
import SettingsScreen from '../screens/SettingsScreen';
import FtpScreen from '../screens/FtpScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'PadEdit' }} />
        <Stack.Screen name="Editor" component={EditorScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Git" component={GitScreen} options={{ title: 'Git Operations' }} />
        <Stack.Screen name="Ftp" component={FtpScreen} options={{ title: 'FTP Connection' }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
