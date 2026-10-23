import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Text, TextInput } from 'react-native-paper';
import { askCompanion, generateArticleSummary } from '../services/ai';
import { getIssueById, type IssueRecord } from '../services/issues';
import { getArticleById } from '../services/news';
import { colors, layout, radii, shadows, spacing } from '../theme';
import type { Article } from '../types';

export default function CompanionScreen() {
  const { articleId, issueId, question } = useLocalSearchParams<{ articleId?: string; issueId?: string; question?: string }>();
  const [draft, setDraft] = useState(question ?? 'How does a bill become law in Missouri?');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [article, setArticle] = useState<Article | null>(null);
  const [issue, setIssue] = useState<IssueRecord | null>(null);

  useEffect(() => {
    void (async () => {
      if (articleId) {
        const item = await getArticleById(articleId);
        setArticle(item ?? null);
      }

      if (issueId) {
        const item = getIssueById(issueId);
        setIssue(item ?? null);
        if (item && !question) {
          setDraft(`What should I know about ${item.title}?`);
        }
      }
    })();
  }, [articleId, issueId, question]);

  const handleSubmit = async () => {
    if (!draft.trim()) {
      return;
    }

    setLoading(true);
    const answer = await askCompanion(draft, article ?? issue ?? undefined);
    setResponse(answer.answer);
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.innerWidth}>
        <Text variant="headlineSmall" style={styles.heading}>Civic companion</Text>
        <Text style={styles.subtitle}>Ask plain-language questions about civic processes and local issues.</Text>

        {article || issue ? (
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <Text variant="titleMedium" style={styles.cardTitle}>Current context</Text>
              <Text style={styles.cardText}>{article?.title ?? issue?.title ?? 'General civic issue'}</Text>
              {article ? (
                <Button
                  mode="text"
                  onPress={async () => {
                    const summary = await generateArticleSummary(article);
                    setResponse(`${summary.overview}\n\n• ${summary.bullets.join('\n• ')}`);
                  }}
                  labelStyle={styles.linkText}
                >
                  Generate summary context
                </Button>
              ) : issue ? (
                <Button
                  mode="text"
                  onPress={() => setResponse(`Issue summary: ${issue.summary}. Questions to investigate: ${issue.policyQuestions.join(' ')}`)}
                  labelStyle={styles.linkText}
                >
                  Show issue summary
                </Button>
              ) : null}
            </Card.Content>
          </Card>
        ) : null}

        <TextInput
          label="Ask a civic question"
          value={draft}
          onChangeText={setDraft}
          multiline
          mode="outlined"
          style={styles.input}
        />

        <Button mode="contained" loading={loading} onPress={() => void handleSubmit()} style={styles.primaryButton}>
          Ask VOICE
        </Button>

        <Card style={styles.responseCard}>
          <Card.Content style={styles.cardContent}>
            <Text variant="titleMedium" style={styles.cardTitle}>Response</Text>
            <Text style={styles.responseText}>{response || 'Your answer will appear here.'}</Text>
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
    paddingBottom: 32,
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
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    color: colors.text,
    fontWeight: '700',
  },
  cardText: {
    marginTop: 8,
    color: colors.textSoft,
    lineHeight: 22,
  },
  linkText: {
    color: colors.primary,
    fontWeight: '600',
  },
  input: {
    marginBottom: spacing.md,
    minHeight: 100,
    backgroundColor: colors.surface,
  },
  primaryButton: {
    borderRadius: 12,
    minHeight: 46,
    backgroundColor: colors.primary,
  },
  responseCard: {
    marginTop: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  responseText: {
    marginTop: 12,
    lineHeight: 22,
    color: colors.textSoft,
  },
});
