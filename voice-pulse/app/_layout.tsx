import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { colors } from '../theme';

export default function RootLayout() {
  return (
    <PaperProvider
      theme={{
        version: 3,
        isV3: true,
        colors: {
          primary: colors.primary,
          accent: colors.primary,
          background: colors.background,
          surface: colors.surface,
          text: colors.text,
          onSurface: colors.text,
          outline: colors.border,
        },
        roundness: 16,
      }}
    >
      <Stack screenOptions={{ headerShown: false }} />
    </PaperProvider>
  );
}
