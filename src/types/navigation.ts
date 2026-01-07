import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

// Root Stack
export type RootStackParamList = {
  '(auth)/sign-in': undefined;
  '(auth)/sign-up': undefined;
  '(auth)/magic-link': undefined;
  '(onboarding)/welcome': undefined;
  '(onboarding)/mood-setup': undefined;
  '(onboarding)/biometric': undefined;
  '(tabs)': undefined;
  'entry/new': { promptId?: string };
  'entry/[id]': { id: string };
  paywall: undefined;
  search: undefined;
};

// Tab Stack
export type TabStackParamList = {
  index: undefined;
  journal: undefined;
  insights: undefined;
  chat: undefined;
  settings: undefined;
};

// Navigation Props
export type RootStackNavigationProp<T extends keyof RootStackParamList> = NativeStackNavigationProp<
  RootStackParamList,
  T
>;

export type RootStackRouteProp<T extends keyof RootStackParamList> = RouteProp<
  RootStackParamList,
  T
>;

export type TabStackNavigationProp<T extends keyof TabStackParamList> = NativeStackNavigationProp<
  TabStackParamList,
  T
>;

export type TabStackRouteProp<T extends keyof TabStackParamList> = RouteProp<TabStackParamList, T>;