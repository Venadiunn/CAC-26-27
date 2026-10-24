import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { AuthProvider } from '../lib/auth-context';
import { colors } from '../theme';

export default function RootLayout() {
  return (
    <PaperProvider
      theme={{
        version: 3,
        isV3: true,
        colors: {
          primary: colors.primary,
          onPrimary: colors.onPrimary,
          primaryContainer: colors.surfaceAlt,
          onPrimaryContainer: colors.primary,
          secondary: colors.secondary,
          onSecondary: colors.onSecondary,
          secondaryContainer: colors.secondarySoft,
          onSecondaryContainer: colors.secondaryStrong,
          tertiary: colors.primaryHover,
          background: colors.background,
          onBackground: colors.text,
          surface: colors.surface,
          onSurface: colors.text,
          surfaceVariant: colors.surfaceAlt,
          onSurfaceVariant: colors.textSoft,
          outline: colors.border,
          outlineVariant: colors.borderStrong,
          error: colors.danger,
          onError: colors.onPrimary,
          surfaceDisabled: colors.disabled,
          onSurfaceDisabled: colors.onDisabled,
        },
        roundness: 12,
      }}
    >
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </AuthProvider>
    </PaperProvider>
  );
}
