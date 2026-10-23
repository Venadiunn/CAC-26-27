import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import { getSavedArticles, getSavedDrafts, getSavedIssues } from '../../lib/storage';
import type { IssueRecord } from '../../services/issues';
import { colors, layout, radii, shadows, spacing } from '../../theme';
import type { Article } from '../../types';

export default function DashboardScreen() {
  const router = useRouter();
  const [savedArticles, setSavedArticles] = useState<Article[]>([]);
  const [savedIssues, setSavedIssues] = useState<IssueRecord[]>([]);
  const [drafts, setDrafts] = useState<{ id: string; subject: string; body: string; createdAt: string }[]>([]);

  const loadDashboard = async () => {
    const [articles, issues, availableDrafts] = await Promise.all([
      getSavedArticles<Article>(),
      getSavedIssues<IssueRecord>(),
      getSavedDrafts<{ id: string; subject: string; body: string; createdAt: string }>(),
    ]);

    setSavedArticles(articles);
    setSavedIssues(issues);
    setDrafts(availableDrafts);
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.innerWidth}>
        <Text variant="headlineSmall" style={styles.heading}>Dashboard</Text>
        <Text style={styles.subtitle}>Your saved civic actions and draft messages.</Text>

        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Saved articles</Text>
            {savedArticles.length === 0 ? (
              <Text style={styles.empty}>No saved articles yet.</Text>
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
            <Text variant="titleMedium" style={styles.sectionTitle}>Saved issues</Text>
            {savedIssues.length === 0 ? (
              <Text style={styles.empty}>No saved issues yet.</Text>
            ) : (
              savedIssues.map((issue) => (
                <Button
                  key={issue.id}
                  mode="text"
                  onPress={() => router.push({ pathname: '/issues/[id]', params: { id: issue.id } })}
                  style={styles.rowButton}
                  labelStyle={styles.rowButtonLabel}
                >
                  {issue.title}
                </Button>
              ))
            )}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Drafts</Text>
            {drafts.length === 0 ? (
              <Text style={styles.empty}>No drafts saved yet.</Text>
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
    marginTop: 12,
    color: colors.muted,
    lineHeight: 20,
  },
  draftItem: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
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
