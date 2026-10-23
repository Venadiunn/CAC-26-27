import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Chip, Text, TextInput } from 'react-native-paper';
import { getSavedArticles, removeSavedArticle, saveArticle } from '../../lib/storage';
import { ISSUE_CATEGORIES, searchIssues } from '../../services/issues';
import { getNews } from '../../services/news';
import { colors, layout, radii, shadows, spacing } from '../../theme';
import type { Article } from '../../types';

const categories = ['All', ...ISSUE_CATEGORIES];

export default function HomeScreen() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNews = async () => {
    setLoading(true);
    const feed = await getNews();
    setArticles(feed);
    setLoading(false);
  };

  const loadSaved = async () => {
    const saved = await getSavedArticles<Article>();
    setSavedIds(saved.map((item) => item.id));
  };

  useEffect(() => {
    void loadNews();
    void loadSaved();
  }, []);

  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      const matchesCategory =
        activeCategory === 'All' ||
        article.tags.some((tag) => tag.toLowerCase().includes(activeCategory.toLowerCase()));

      const matchesQuery =
        !query ||
        `${article.title} ${article.excerpt} ${article.sourceName}`
          .toLowerCase()
          .includes(query.toLowerCase());

      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, articles, query]);

  const featuredIssues = useMemo(() => {
    const issueCategory = activeCategory === 'All' ? undefined : activeCategory;
    return searchIssues(query, issueCategory ? { category: issueCategory } : {}).slice(0, 3);
  }, [activeCategory, query]);

  const toggleSave = async (article: Article) => {
    if (savedIds.includes(article.id)) {
      await removeSavedArticle<Article>((item) => item.id === article.id);
      setSavedIds((current) => current.filter((id) => id !== article.id));
      return;
    }

    await saveArticle(article);
    setSavedIds((current) => [article.id, ...current]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.innerWidth}>
        <Text variant="headlineMedium" style={styles.heading}>VOICE Pulse</Text>
        <Text style={styles.subtitle}>A student-first guide to understanding issues, officials, and local action.</Text>

        <Card style={styles.banner}>
          <Card.Content style={styles.bannerContent}>
            <Text variant="titleSmall" style={styles.bannerTitle}>Demo mode</Text>
            <Text style={styles.bannerText}>
              This feed uses demonstration civic data to preview the product experience and should not be treated as live reporting.
            </Text>
          </Card.Content>
        </Card>

        <View style={styles.ctaRow}>
          <Button mode="contained" onPress={() => router.push('/companion')} style={styles.primaryButton} labelStyle={styles.primaryButtonText}>
            Ask VOICE
          </Button>
          <Button mode="outlined" onPress={() => router.push('/issues')} style={styles.secondaryButton} labelStyle={styles.secondaryButtonText}>
            Browse issues
          </Button>
        </View>

        <TextInput
          mode="outlined"
          placeholder="Search issue topics"
          value={query}
          onChangeText={setQuery}
          style={styles.search}
          outlineColor={colors.border}
          activeOutlineColor={colors.primary}
          left={<TextInput.Icon icon="magnify" color={colors.muted} />}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {categories.map((category) => (
            <Chip
              key={category}
              selected={category === activeCategory}
              onPress={() => setActiveCategory(category)}
              style={[styles.chip, category === activeCategory && styles.chipSelected]}
              textStyle={[styles.chipText, category === activeCategory && styles.chipTextSelected]}
            >
              {category}
            </Chip>
          ))}
        </ScrollView>

        {featuredIssues.length > 0 ? (
          <Card style={styles.issueCard}>
            <Card.Content style={styles.cardContent}>
              <Text variant="titleMedium" style={styles.sectionTitle}>Issue spotlight</Text>
              {featuredIssues.map((issue) => (
                <View key={issue.id} style={styles.issueRow}>
                  <Text style={styles.issueTitle}>{issue.title}</Text>
                  <Text style={styles.issueSummary}>{issue.summary}</Text>
                  <Button
                    compact
                    mode="text"
                    onPress={() => router.push({ pathname: '/companion', params: { question: `Tell me more about ${issue.title}` } })}
                    labelStyle={styles.issueAction}
                  >
                    Ask VOICE
                  </Button>
                </View>
              ))}
            </Card.Content>
          </Card>
        ) : null}

        {loading ? (
          <Text style={styles.empty}>Loading civic stories...</Text>
        ) : filteredArticles.length === 0 ? (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium">No stories match this filter</Text>
              <Text style={styles.cardText}>Try another keyword or reset the category.</Text>
            </Card.Content>
          </Card>
        ) : (
          filteredArticles.map((article) => (
            <Card
              key={article.id}
              style={styles.card}
              onPress={() => router.push({ pathname: '/story/[id]', params: { id: article.id } })}
            >
              <Card.Content style={styles.cardContent}>
                <View style={styles.cardTopRow}>
                  <Text variant="titleMedium" style={styles.cardTitle}>{article.title}</Text>
                  <Button
                    compact
                    mode={savedIds.includes(article.id) ? 'contained' : 'text'}
                    onPress={() => void toggleSave(article)}
                    style={styles.saveButton}
                    labelStyle={styles.saveLabel}
                  >
                    {savedIds.includes(article.id) ? 'Saved' : 'Save'}
                  </Button>
                </View>

                <Text style={styles.meta}>{article.sourceName}</Text>
                <Text style={styles.meta}>{new Date(article.publishedAt).toLocaleDateString()}</Text>

                <Text style={styles.cardText}>{article.excerpt}</Text>

                <View style={styles.tagRow}>
                  {article.tags.slice(0, 3).map((tag) => (
                    <Chip key={`${article.id}-${tag}`} compact style={styles.tag} textStyle={styles.tagText}>
                      {tag}
                    </Chip>
                  ))}
                </View>
              </Card.Content>
            </Card>
          ))
        )}
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
    paddingBottom: 32,
    paddingTop: 18,
  },
  heading: {
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    marginBottom: spacing.lg,
    color: colors.textSoft,
    fontSize: 15,
    lineHeight: 22,
  },
  ctaRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: spacing.lg,
    flexWrap: 'wrap',
  },
  primaryButton: {
    borderRadius: 12,
    minHeight: 46,
    flex: 1,
    backgroundColor: colors.primary,
  },
  primaryButtonText: {
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  secondaryButton: {
    borderRadius: 12,
    minHeight: 46,
    flex: 1,
    borderColor: colors.primary,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontWeight: '700',
  },
  banner: {
    marginBottom: spacing.lg,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: '#dbe3ff',
    ...shadows.card,
  },
  bannerContent: {
    paddingVertical: 14,
  },
  bannerTitle: {
    color: colors.primaryStrong,
    fontWeight: '700',
  },
  bannerText: {
    marginTop: 6,
    color: colors.muted,
    lineHeight: 20,
  },
  search: {
    marginBottom: spacing.md,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 0,
  },
  searchInput: {
    fontSize: 15,
    color: colors.text,
  },
  chipRow: {
    paddingBottom: 6,
    marginBottom: spacing.lg,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#fff',
  },
  issueCard: {
    marginBottom: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: '#dbeafe',
    ...shadows.card,
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: '700',
    marginBottom: 8,
  },
  issueRow: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  issueTitle: {
    color: colors.text,
    fontWeight: '700',
    lineHeight: 22,
  },
  issueSummary: {
    marginTop: 6,
    color: colors.textSoft,
    lineHeight: 20,
  },
  issueAction: {
    color: colors.primary,
    fontWeight: '700',
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
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    width: '100%',
  },
  cardTitle: {
    flex: 1,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: colors.text,
  },
  saveButton: {
    alignSelf: 'flex-start',
    minWidth: 72,
  },
  saveLabel: {
    fontWeight: '600',
  },
  meta: {
    marginTop: 6,
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  cardText: {
    marginTop: 10,
    lineHeight: 22,
    color: colors.textSoft,
    fontSize: 15,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
    gap: 8,
  },
  tag: {
    marginRight: 6,
    marginBottom: 6,
    backgroundColor: colors.successSoft,
    borderRadius: 999,
  },
  tagText: {
    color: colors.success,
    fontWeight: '600',
    fontSize: 11,
  },
  empty: {
    color: colors.textSoft,
    marginTop: spacing.sm,
    fontSize: 15,
  },
});
