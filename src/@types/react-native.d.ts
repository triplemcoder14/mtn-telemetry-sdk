declare module 'react-native' {
  import * as React from 'react';

  export type AppStateStatus = 'active' | 'background' | 'inactive' | string;

  export interface AppStateSubscription {
    remove?: () => void;
  }

  export const AppState: {
    currentState: AppStateStatus;
    addEventListener(
      type: 'change',
      listener: (state: AppStateStatus) => void
    ): AppStateSubscription;
  };

  export interface PressableProps {
    onPress?: (...args: any[]) => void;
    accessibilityLabel?: string;
    children?: React.ReactNode;
    [key: string]: any;
  }

  export const Pressable: React.ComponentType<PressableProps>;
}
