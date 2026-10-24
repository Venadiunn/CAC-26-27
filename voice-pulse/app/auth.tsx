import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import BackButton from '../components/BackButton';
import { useAuth } from '../lib/auth-context';
import { colors, layout, radii, shadows, spacing } from '../theme';

export default function AuthScreen() {
  const { session, loading, syncing, syncError, isConfigured, configurationError, signIn, signUp, signOut, retryLocalSync } = useAuth();
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const submit = async () => {
    setBusy(true);
    setMessage('');
    setError('');
    try {
      if (mode === 'sign-in') {
        await signIn(email.trim(), password);
        setMessage('You are signed in.');
      } else {
        const hasSession = await signUp(email.trim(), password);
        setMessage(hasSession ? 'Your account is ready.' : 'Account created. Check your email to confirm before signing in.');
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Authentication failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    setBusy(true);
    setError('');
    try {
      await signOut();
      setMessage('You are signed out.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not sign out. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.innerWidth}>
        <BackButton />
        <Text variant="headlineSmall" style={styles.heading}>VOICE Pulse account</Text>
        <Text style={styles.subtitle}>Sign in to keep saved issues and drafts with your account.</Text>

        <View style={styles.formCard}>
          {!isConfigured ? <Text style={styles.error}>{configurationError}</Text> : null}
          {loading ? <ActivityIndicator color={colors.primary} /> : null}

          {session ? (
            <View>
              <Text style={styles.status}>Signed in as {session.user.email || 'your account'}</Text>
              {syncing ? <Text style={styles.status}>Importing existing local saves...</Text> : null}
              {syncError ? (
                <>
                  <Text style={styles.error}>Local data sync is incomplete. Your local data has been kept. {syncError}</Text>
                  <Button mode="outlined" onPress={() => void retryLocalSync().catch(() => undefined)} loading={busy} disabled={busy}>Retry sync</Button>
                </>
              ) : null}
              <Button mode="contained" onPress={() => void handleSignOut()} loading={busy} disabled={busy} style={styles.primaryButton}>Sign out</Button>
            </View>
          ) : (
            <View>
              <TextInput
                label="Email address"
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                accessibilityLabel="Email address"
                style={styles.input}
              />
              <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                mode="outlined"
                secureTextEntry
                autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
                accessibilityLabel="Password"
                style={styles.input}
              />
              {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
              {message ? <Text accessibilityLiveRegion="polite" style={styles.status}>{message}</Text> : null}
              <Button
                mode="contained"
                buttonColor={colors.primary}
                textColor={colors.onPrimary}
                onPress={() => void submit()}
                loading={busy}
                disabled={!isConfigured || loading || busy || !email.trim() || !password}
                style={[styles.primaryButton, (!isConfigured || loading || busy || !email.trim() || !password) && styles.disabledPrimaryButton]}
              >
                {mode === 'sign-in' ? 'Sign in' : 'Create account'}
              </Button>
              <Button mode="text" onPress={() => { setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in'); setError(''); setMessage(''); }} disabled={busy} style={styles.secondaryAction}>
                {mode === 'sign-in' ? 'Create an account' : 'Already have an account? Sign in'}
              </Button>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, justifyContent: 'center', paddingVertical: spacing.lg },
  innerWidth: { width: '100%', maxWidth: 520, alignSelf: 'center', padding: spacing.md },
  heading: { color: colors.text, fontWeight: '700', marginTop: spacing.md, fontSize: 28, lineHeight: 34 },
  subtitle: { color: colors.textSoft, lineHeight: 22, marginTop: 8, marginBottom: spacing.lg },
  formCard: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radii.lg, padding: spacing.lg, ...shadows.card },
  input: { marginBottom: spacing.md, backgroundColor: colors.surface, minHeight: 56 },
  primaryButton: { marginTop: spacing.md, marginBottom: spacing.sm, minHeight: 48, justifyContent: 'center', borderRadius: radii.md, backgroundColor: colors.primary },
  disabledPrimaryButton: { backgroundColor: colors.disabled },
  secondaryAction: { minHeight: 44, justifyContent: 'center' },
  status: { color: colors.success, lineHeight: 21, marginVertical: spacing.md },
  error: { color: colors.danger, lineHeight: 21, marginVertical: spacing.md },
});
