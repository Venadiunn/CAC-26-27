import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Text, TextInput } from 'react-native-paper';
import BackButton from '../components/BackButton';
import { askCompanion, explainIssue, generateArticleSummary } from '../services/ai';
import { getIssueById, type IssueRecord } from '../services/issues';
import { getArticleById } from '../services/news';
import { colors, layout, radii, shadows, spacing } from '../theme';
import type { Article } from '../types';

export default function CompanionScreen() {
  const router = useRouter();
  const { articleId, issueId, question, feature } = useLocalSearchParams<{ articleId?: string; issueId?: string; question?: string; feature?: string }>();
  const [draft, setDraft] = useState(question ?? 'How does a bill become law in Missouri?');
  const [response, setResponse] = useState('');
  const [responseLabel, setResponseLabel] = useState('');
  const [responseSections, setResponseSections] = useState<{ title: string; content: string }[]>([]);
  const [responseCaution, setResponseCaution] = useState('');
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
    setResponse('');
    setResponseSections([]);
    setResponseCaution('');
    try {
      if (feature === 'explain' && issue) {
        const explanation = await explainIssue(issue, draft);
        setResponseSections(explanation.sections);
        setResponseCaution(explanation.caution);
        setResponseLabel('AI issue explanation');
        return;
      }

      const answer = await askCompanion(draft, article ?? issue ?? undefined);
      setResponse(answer.answer);
      setResponseLabel(answer.cached ? 'Catalog-grounded response' : 'AI response');
    } catch (error) {
      setResponse(error instanceof Error ? error.message : 'The companion could not answer right now. You can still explore the issue sources below.');
      setResponseLabel('AI unavailable');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.innerWidth}>
        <BackButton />
        <Text variant="headlineSmall" style={styles.heading}>{feature === 'explain' ? 'Understand this issue' : 'Civic companion'}</Text>
        <Text style={styles.subtitle}>
          {feature === 'explain' ? 'Explore the issue context, trade-offs, and questions that need verification.' : 'Ask plain-language questions about civic processes and local issues.'}
        </Text>

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
                    setResponseLabel('Article summary');
                  }}
                  labelStyle={styles.linkText}
                >
                  Generate summary context
                </Button>
              ) : issue ? (
                <Button
                  mode="text"
                  onPress={() => { setResponse(`Issue summary: ${issue.summary}. Questions to investigate: ${issue.policyQuestions.join(' ')}`); setResponseLabel('Issue catalog'); }}
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

        <Button mode="contained" loading={loading} disabled={loading} onPress={() => void handleSubmit()} style={styles.primaryButton}>
          {loading ? 'Thinking…' : responseLabel === 'AI unavailable' ? 'Retry explanation' : feature === 'explain' ? 'Explain this issue' : 'Ask VOICE'}
        </Button>

        <Card style={styles.responseCard}>
          <Card.Content style={styles.cardContent}>
            <Text variant="titleMedium" style={styles.cardTitle}>Response</Text>
            {responseLabel ? <Text style={styles.responseLabel}>{responseLabel}</Text> : null}
            {responseSections.length > 0 ? responseSections.map((section) => (
              <View key={section.title} style={styles.responseSection}>
                <Text style={styles.responseSectionTitle}>{section.title}</Text>
                <Text style={styles.responseText}>{section.content}</Text>
              </View>
            )) : <Text style={styles.responseText}>{response || 'Your answer will appear here.'}</Text>}
            {responseCaution ? <Text style={styles.caution}>{responseCaution}</Text> : null}
          </Card.Content>
        </Card>

        {feature === 'explain' && issue && responseSections.length > 0 ? (
          <View style={styles.followupActions}>
            <Button mode="contained" onPress={() => router.push({ pathname: '/advocacy', params: { issueId: issue.id } })} style={styles.primaryButton}>
              Draft a message
            </Button>
            <Button mode="outlined" onPress={() => router.push({ pathname: '/issues/[id]', params: { id: issue.id } })} style={styles.secondaryButton}>
              Return to issue
            </Button>
          </View>
        ) : null}
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
  content: {
    paddingBottom: 32,
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
  responseSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  responseSectionTitle: {
    color: colors.text,
    fontWeight: '700',
  },
  caution: {
    color: colors.muted,
    lineHeight: 20,
    fontSize: 13,
    marginTop: spacing.md,
  },
  followupActions: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  primaryButton: {
    borderRadius: radii.md,
    minHeight: 48,
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    minHeight: 46,
    borderColor: colors.primary,
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
  responseLabel: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radii.sm,
    overflow: 'hidden',
    color: colors.primaryStrong,
    backgroundColor: colors.surfaceAlt,
    fontSize: 11,
    fontWeight: '700',
  },
});
