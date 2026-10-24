import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import BackButton from '../../components/BackButton';
import { getSavedArticles, removeSavedArticle, saveArticle } from '../../lib/storage';
import { missouriHouseOfficials } from '../../services/officials';
import { generateArticleSummary } from '../../services/ai';
import { getArticleById } from '../../services/news';
import { colors, layout, radii, shadows, spacing } from '../../theme';
import type { Article } from '../../types';

export default function StoryDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void (async () => {
      const selected = id ? await getArticleById(id) : undefined;
      setArticle(selected ?? null);

      const savedArticles = await getSavedArticles<Article>();
      setSaved(savedArticles.some((item) => item.id === id));
    })();
  }, [id]);

  if (!article) {
    return (
      <View style={styles.emptyState}>
        <BackButton />
        <Text variant="headlineMedium">Story not found</Text>
      </View>
    );
  }

  const toggleSave = async () => {
    if (saved) {
      await removeSavedArticle<Article>((item) => item.id === article.id);
      setSaved(false);
      return;
    }

    await saveArticle(article);
    setSaved(true);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.innerWidth}>
        <BackButton />
        <Text variant="headlineMedium" style={styles.heading}>{article.title}</Text>
        <Text style={styles.meta}>{article.sourceName}</Text>
        <Text style={styles.meta}>{new Date(article.publishedAt).toLocaleDateString()}</Text>

        <View style={styles.actionRow}>
          <Button mode="contained" buttonColor={saved ? colors.secondary : colors.primary} onPress={() => void toggleSave()} style={styles.primaryButton}>
            {saved ? 'Saved' : 'Save article'}
          </Button>
          <Button mode="outlined" onPress={() => void Linking.openURL(article.sourceUrl)} style={styles.secondaryButton}>
            Original source
          </Button>
        </View>

        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Key issue</Text>
            <Text style={styles.bodyText}>{article.excerpt}</Text>
          </Card.Content>
        </Card>

        <Button
          mode="contained-tonal"
          onPress={async () => {
            const result = await generateArticleSummary(article);
            setSummary(`${result.overview}\n\n• ${result.bullets.join('\n• ')}`);
          }}
          style={styles.summaryButton}
        >
          Generate AI summary
        </Button>

        {summary ? (
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <Text variant="titleMedium" style={styles.sectionTitle}>AI-generated summary</Text>
              <Text style={styles.bodyText}>{summary}</Text>
              <Text style={styles.caption}>This is an educational summary, not a substitute for the original reporting or official government material.</Text>
            </Card.Content>
          </Card>
        ) : null}

        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Relevant officials</Text>
            {missouriHouseOfficials.slice(0, 2).map((official) => (
              <Text key={official.id} style={styles.listItem}>
                {official.fullName} — {official.officeTitle}
              </Text>
            ))}
          </Card.Content>
        </Card>

        <View style={styles.footerRow}>
          <Button
            mode="contained"
            onPress={() => router.push({ pathname: '/companion', params: { articleId: article.id, question: article.title } })}
            style={styles.primaryButton}
          >
            Ask AI about this article
          </Button>
        </View>

        <Link href="/advocacy" style={styles.link}>Create an advocacy message</Link>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    width: '100%',
    alignItems: 'stretch',
    paddingBottom: 32,
  },
  innerWidth: {
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: 18,
    paddingBottom: 32,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  heading: {
    color: colors.text,
    fontWeight: '700',
  },
  meta: {
    marginTop: 6,
    color: colors.muted,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    flexWrap: 'wrap',
  },
  primaryButton: {
    borderRadius: 12,
    minHeight: 46,
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    borderRadius: 12,
    minHeight: 46,
    borderColor: colors.primary,
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
  sectionTitle: {
    color: colors.text,
    fontWeight: '700',
  },
  bodyText: {
    marginTop: 10,
    lineHeight: 22,
    color: colors.textSoft,
  },
  caption: {
    marginTop: 12,
    color: colors.muted,
    lineHeight: 20,
  },
  summaryButton: {
    marginBottom: spacing.md,
    borderRadius: 12,
  },
  listItem: {
    marginTop: 8,
    color: colors.textSoft,
    lineHeight: 20,
  },
  footerRow: {
    marginTop: 8,
  },
  link: {
    marginTop: spacing.md,
    color: colors.primary,
    textAlign: 'center',
    fontWeight: '600',
  },
});
