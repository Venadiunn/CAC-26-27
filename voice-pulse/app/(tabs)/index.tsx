import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Chip, Text, TextInput } from 'react-native-paper';
import { ArrowRight, Compass, Search, Sparkles } from 'lucide-react-native';
import { ISSUE_CATEGORIES, searchIssues } from '../../services/issues';
import { colors, layout, radii, shadows, spacing } from '../../theme';

const categories = ['All', ...ISSUE_CATEGORIES];

export default function HomeScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const featuredIssues = useMemo(() => {
    const issueCategory = activeCategory === 'All' ? undefined : activeCategory;
    return searchIssues(query, issueCategory ? { category: issueCategory } : {}).slice(0, 3);
  }, [activeCategory, query]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.innerWidth}>
        <Text style={styles.eyebrow}>MISSOURI CIVIC ENGAGEMENT</Text>
        <Text variant="headlineMedium" style={styles.heading}>VOICE Pulse</Text>
        <Text style={styles.subtitle}>Understand public issues, find the officials who shape them, and make your perspective heard.</Text>

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
          accessibilityLabel="Search civic issue topics"
          accessibilityHint="Filters the issue spotlight and civic issues"
          style={styles.search}
          outlineColor={colors.border}
          activeOutlineColor={colors.primary}
          left={<TextInput.Icon icon={({ size, color }) => <Search size={size} color={color} />} accessibilityLabel="Search" />}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {categories.map((category) => (
            <Chip
              key={category}
              selected={category === activeCategory}
              showSelectedCheck={false}
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
            <Card.Content style={styles.spotlightContent}>
              <View style={styles.spotlightHeader}>
                <View style={styles.spotlightHeadingGroup}>
                  <View style={styles.spotlightIcon}>
                    <Compass size={20} color={colors.primary} />
                  </View>
                  <View style={styles.spotlightHeadingText}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>Issue spotlight</Text>
                    <Text style={styles.spotlightSubtitle}>A place to start exploring civic questions.</Text>
                  </View>
                </View>
                <Button
                  mode="text"
                  onPress={() => router.push('/issues')}
                  style={styles.allIssuesButton}
                  contentStyle={styles.allIssuesButtonContent}
                  labelStyle={styles.allIssuesLabel}
                >
                  All issues
                </Button>
              </View>

              {featuredIssues[0] ? (
                <View style={styles.featuredIssue}>
                  <Text style={styles.issueKicker}>{featuredIssues[0].category}</Text>
                  <Text style={styles.featuredIssueTitle}>{featuredIssues[0].title}</Text>
                  <Text numberOfLines={3} style={styles.issueSummary}>{featuredIssues[0].summary}</Text>
                  <View style={styles.featuredActions}>
                    <Button
                      mode="contained"
                      icon={({ size, color }) => <Sparkles size={size} color={color} />}
                      contentStyle={styles.iconLabelContent}
                      onPress={() => router.push({ pathname: '/companion', params: { issueId: featuredIssues[0].id, question: featuredIssues[0].title, feature: 'explain' } })}
                      style={styles.featuredPrimaryAction}
                    >
                      Understand issue
                    </Button>
                    <Button
                      mode="text"
                      onPress={() => router.push({ pathname: '/issues/[id]', params: { id: featuredIssues[0].id } })}
                      labelStyle={styles.issueAction}
                    >
                      Issue details
                    </Button>
                  </View>
                </View>
              ) : null}

              <View style={styles.secondaryIssues}>
                {featuredIssues.slice(1).map((issue) => (
                  <Pressable
                    key={issue.id}
                    accessibilityRole="link"
                    accessibilityLabel={`Explore ${issue.title}`}
                    onPress={() => router.push({ pathname: '/issues/[id]', params: { id: issue.id } })}
                    style={styles.secondaryIssueRow}
                  >
                    <View style={styles.secondaryIssueText}>
                      <Text style={styles.secondaryIssueCategory}>{issue.category}</Text>
                      <Text numberOfLines={1} style={styles.secondaryIssueTitle}>{issue.title}</Text>
                      <Text numberOfLines={2} style={styles.secondaryIssueSummary}>{issue.summary}</Text>
                    </View>
                    <ArrowRight size={18} color={colors.primary} />
                  </Pressable>
                ))}
              </View>
            </Card.Content>
          </Card>
        ) : (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text style={styles.emptyTitle}>No issues match your search</Text>
              <Text style={styles.emptyText}>Try a different topic or choose another category.</Text>
            </Card.Content>
          </Card>
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
    fontWeight: '800',
    color: colors.text,
    fontSize: 38,
    lineHeight: 44,
    marginBottom: 8,
  },
  eyebrow: {
    color: colors.secondary,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 16,
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: spacing.lg,
    color: colors.textSoft,
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 620,
  },
  ctaRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: spacing.lg,
    flexWrap: 'wrap',
  },
  primaryButton: {
    borderRadius: radii.md,
    minHeight: 48,
    flex: 1,
    minWidth: 150,
    backgroundColor: colors.primary,
  },
  primaryButtonText: {
    fontWeight: '700',
    letterSpacing: 0.2,
    color: colors.onPrimary,
  },
  secondaryButton: {
    borderRadius: radii.md,
    minHeight: 48,
    flex: 1,
    minWidth: 150,
    borderColor: colors.primary,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontWeight: '700',
  },
  search: {
    marginBottom: spacing.md,
    borderRadius: radii.md,
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
    borderRadius: radii.md,
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
    color: colors.onPrimary,
  },
  issueCard: {
    marginBottom: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.card,
  },
  spotlightContent: {
    padding: spacing.md,
  },
  spotlightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  allIssuesButton: {
    flexShrink: 0,
    minWidth: 84,
    minHeight: 44,
    marginRight: -spacing.xs,
  },
  allIssuesButtonContent: {
    minWidth: 84,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  allIssuesLabel: {
    color: colors.primary,
    fontWeight: '700',
    textAlign: 'center',
    marginHorizontal: 0,
    includeFontPadding: false,
  },
  spotlightHeadingGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  spotlightIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spotlightHeadingText: {
    flex: 1,
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: '700',
    lineHeight: 22,
  },
  spotlightSubtitle: {
    marginTop: 2,
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  featuredIssue: {
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  featuredIssueTitle: {
    color: colors.text,
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '800',
    maxWidth: 640,
  },
  featuredActions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  featuredPrimaryAction: {
    minHeight: 44,
    borderRadius: radii.md,
  },
  iconLabelContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryIssues: {
    marginTop: spacing.sm,
  },
  secondaryIssueRow: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  secondaryIssueText: {
    flex: 1,
  },
  secondaryIssueCategory: {
    color: colors.primary,
    textTransform: 'uppercase',
    fontSize: 10,
    lineHeight: 15,
    fontWeight: '700',
  },
  secondaryIssueTitle: {
    marginTop: 2,
    color: colors.text,
    fontWeight: '700',
    lineHeight: 20,
  },
  secondaryIssueSummary: {
    marginTop: 2,
    color: colors.muted,
    lineHeight: 18,
    fontSize: 12,
  },
  issueKicker: {
    color: colors.primary,
    textTransform: 'uppercase',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
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
  emptyCard: {
    borderRadius: radii.md,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    color: colors.text,
    fontWeight: '700',
  },
  emptyText: {
    color: colors.muted,
    lineHeight: 20,
    marginTop: 4,
  },
});
