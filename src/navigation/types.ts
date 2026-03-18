import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

export type RootStackParamList = {
  Home: undefined;
  Editor: { filename?: string; newFile?: boolean };
  Git: undefined;
  Ftp: undefined;
  Settings: undefined;
};

export type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;
export type EditorScreenRouteProp = RouteProp<RootStackParamList, 'Editor'>;
export type EditorScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Editor'>;
