import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import { Bookmark, FileText, Newspaper, UserRound } from 'lucide-react-native';
import { useAuth } from '../../lib/auth-context';
import { getSavedArticles, getSavedDrafts, getSavedIssues, removeSavedIssue } from '../../lib/storage';
import type { IssueRecord } from '../../services/issues';
import { colors, layout, radii, shadows, spacing } from '../../theme';
import type { Article } from '../../types';

export default function DashboardScreen() {
  const router = useRouter();
  const { session, loading: authLoading, syncing, syncError } = useAuth();
  const [savedArticles, setSavedArticles] = useState<Article[]>([]);
  const [savedIssues, setSavedIssues] = useState<IssueRecord[]>([]);
  const [drafts, setDrafts] = useState<{ id: string; subject: string; body: string; createdAt: string }[]>([]);
  const [loadError, setLoadError] = useState('');

  const removeUnavailableIssue = async (issueId: string) => {
    try {
      await removeSavedIssue<IssueRecord>((issue) => issue.id === issueId);
      setSavedIssues((current) => current.filter((issue) => issue.id !== issueId));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Could not remove this saved issue.');
    }
  };

  useEffect(() => {
    if (authLoading || syncing) {
      return;
    }

    let active = true;
    setSavedArticles([]);
    setSavedIssues([]);
    setDrafts([]);
    setLoadError('');
    void Promise.all([
      getSavedArticles<Article>(),
      getSavedIssues<IssueRecord>(),
      getSavedDrafts<{ id: string; subject: string; body: string; createdAt: string }>(),
    ]).then(([articles, issues, availableDrafts]) => {
      if (active) {
        setSavedArticles(articles);
        setSavedIssues(issues);
        setDrafts(availableDrafts);
      }
    }).catch((error: unknown) => {
      if (active) {
        setLoadError(error instanceof Error ? error.message : 'Could not load saved content.');
      }
    });

    return () => {
      active = false;
    };
  }, [session?.user.id, authLoading, syncing]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.innerWidth}>
        <Text variant="headlineSmall" style={styles.heading}>Dashboard</Text>
        <Text style={styles.subtitle}>Your saved civic actions and draft messages.</Text>
        <View style={styles.accountRow}>
          <View style={styles.accountCopy}>
            <Text style={styles.accountTitle}>{session ? 'Your account' : 'Keep your work together'}</Text>
            <Text style={styles.accountDescription}>
              {session ? 'Your saved issues and drafts are linked to your account.' : 'Your saves stay on this device. Sign in to sync them with your account.'}
            </Text>
          </View>
          <Button icon={({ size, color }) => <UserRound size={size} color={color} />} mode="outlined" onPress={() => router.push('/auth')} style={styles.accountButton}>
            {session ? 'Account' : 'Sign in'}
          </Button>
        </View>
        {syncError ? <Text accessibilityRole="alert" style={styles.error}>Some local saves are not synced yet. They remain on this device. {syncError}</Text> : null}
        {loadError ? <Text accessibilityRole="alert" style={styles.error}>{loadError}</Text> : null}

        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.sectionHeading}>
              <Newspaper size={18} color={colors.primary} />
              <Text variant="titleMedium" style={styles.sectionTitle}>Saved articles</Text>
              <Text style={styles.count}>{savedArticles.length}</Text>
            </View>
            {savedArticles.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.empty}>No saved articles yet.</Text>
                <Text style={styles.emptyDetail}>Save a story from Home to keep it here for later.</Text>
                <Button mode="text" onPress={() => router.replace('/')} style={styles.emptyAction}>Explore Home</Button>
              </View>
            ) : (
              savedArticles.map((article) => (
                <Button
                  key={article.id}
                  mode="text"
                  onPress={() => router.push({ pathname: '/story/[id]', params: { id: article.id } })}
                  style={styles.rowButton}
                  labelStyle={styles.rowButtonLabel}
                >
                  {article.title}
                </Button>
              ))
            )}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.sectionHeading}>
              <Bookmark size={18} color={colors.primary} />
              <Text variant="titleMedium" style={styles.sectionTitle}>Saved issues</Text>
              <Text style={styles.count}>{savedIssues.length}</Text>
            </View>
            {savedIssues.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.empty}>No saved issues yet.</Text>
                <Text style={styles.emptyDetail}>Browse civic topics and save the issues you want to follow.</Text>
                <Button mode="text" onPress={() => router.push('/issues')} style={styles.emptyAction}>Browse issues</Button>
              </View>
            ) : (
              savedIssues.map((issue) => (
                <View key={issue.id} style={styles.savedIssueRow}>
                  {issue.catalogMissing ? (
                    <>
                      <Text style={styles.empty}>{issue.title}</Text>
                      <Button mode="text" onPress={() => void removeUnavailableIssue(issue.id)}>Remove saved record</Button>
                    </>
                  ) : (
                    <Button
                      mode="text"
                      onPress={() => router.push({ pathname: '/issues/[id]', params: { id: issue.id } })}
                      style={styles.rowButton}
                      labelStyle={styles.rowButtonLabel}
                    >
                      {issue.title}
                    </Button>
                  )}
                </View>
              ))
            )}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.sectionHeading}>
              <FileText size={18} color={colors.primary} />
              <Text variant="titleMedium" style={styles.sectionTitle}>Drafts</Text>
              <Text style={styles.count}>{drafts.length}</Text>
            </View>
            {drafts.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.empty}>No drafts saved yet.</Text>
                <Text style={styles.emptyDetail}>Start with an issue and turn your perspective into a message.</Text>
                <Button mode="text" onPress={() => router.push('/advocacy')} style={styles.emptyAction}>Start a draft</Button>
              </View>
            ) : (
              drafts.map((draft) => (
                <View key={draft.id} style={styles.draftItem}>
                  <Text style={styles.draftTitle}>{draft.subject || 'Untitled draft'}</Text>
                  <Text style={styles.draftMeta}>{new Date(draft.createdAt).toLocaleDateString()}</Text>
                  <Text numberOfLines={3} style={styles.draftBody}>{draft.body}</Text>
                </View>
              ))
            )}
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  innerWidth: {
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: 30,
    paddingTop: 18,
  },
  content: {
    paddingBottom: 28,
  },
  accountButton: {
    alignSelf: 'center',
    flexShrink: 0,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
  },
  accountCopy: {
    flex: 1,
  },
  accountTitle: {
    color: colors.text,
    fontWeight: '700',
  },
  accountDescription: {
    marginTop: 4,
    color: colors.textSoft,
    lineHeight: 19,
  },
  error: {
    color: colors.warning,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  heading: {
    color: colors.text,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 6,
    marginBottom: spacing.lg,
    color: colors.textSoft,
    lineHeight: 22,
  },
  card: {
    marginBottom: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  cardContent: {
    padding: 16,
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: '700',
    flex: 1,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  count: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
  rowButton: {
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  rowButtonLabel: {
    color: colors.primary,
    textAlign: 'left',
  },
  empty: {
    marginTop: spacing.sm,
    color: colors.text,
    fontWeight: '600',
    lineHeight: 20,
  },
  emptyDetail: {
    marginTop: 4,
    color: colors.muted,
    lineHeight: 19,
  },
  emptyState: {
    alignItems: 'flex-start',
  },
  emptyAction: {
    marginLeft: -8,
    marginTop: 2,
  },
  draftItem: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  savedIssueRow: {
    marginTop: 8,
  },
  draftTitle: {
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  draftMeta: {
    color: colors.muted,
    marginBottom: 6,
    fontSize: 12,
  },
  draftBody: {
    color: colors.textSoft,
    lineHeight: 20,
  },
});
