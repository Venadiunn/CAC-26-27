import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Chip, Text, TextInput } from 'react-native-paper';
import { Search } from 'lucide-react-native';
import BackButton from '../../components/BackButton';
import { ISSUE_CATEGORIES, searchIssues } from '../../services/issues';
import { colors, layout, radii, shadows, spacing } from '../../theme';

export default function IssueBrowserScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [sortMode, setSortMode] = useState<'relevance' | 'title'>('relevance');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const levelOptions = useMemo(
    () => ['All', 'Local', 'County', 'State', 'Federal', 'School or district'],
    [],
  );

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      try {
        setError('');
        setLoading(false);
      } catch {
        setError('Unable to load the issue catalog right now.');
        setLoading(false);
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [query, selectedCategory, selectedLevel, sortMode]);

  const visibleIssues = useMemo(() => {
    const filters = {
      category: selectedCategory === 'All' ? undefined : selectedCategory,
      governmentLevel: selectedLevel === 'All' ? undefined : selectedLevel,
    };

    const results = searchIssues(query, filters);
    if (sortMode === 'title') {
      return [...results].sort((a, b) => a.title.localeCompare(b.title));
    }

    return results;
  }, [query, selectedCategory, selectedLevel, sortMode]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.innerWidth}>
        <BackButton />
        <Text variant="headlineSmall" style={styles.heading}>Issue browser</Text>
        <Text style={styles.subtitle}>Explore Missouri civic issues by category, level, and topic.</Text>

        <Button
          mode="contained"
          onPress={() => {
            setQuery('');
            setSelectedCategory('All');
            setSelectedLevel('All');
            setSortMode('relevance');
          }}
          style={styles.primaryButton}
        >
          Reset filters
        </Button>

        <TextInput
          mode="outlined"
          placeholder="Search issue titles, keywords, or policy questions"
          value={query}
          onChangeText={setQuery}
          accessibilityLabel="Search issue titles, keywords, or policy questions"
          style={styles.search}
          left={<TextInput.Icon icon={({ size, color }) => <Search size={size} color={color} />} accessibilityLabel="Search" />}
        />

        <View style={styles.filterGroup}>
          <Text style={styles.sectionLabel}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {['All', ...ISSUE_CATEGORIES].map((category) => (
              <Chip
                key={category}
                selected={category === selectedCategory}
                showSelectedCheck={false}
                onPress={() => setSelectedCategory(category)}
                style={[styles.chip, category === selectedCategory && styles.chipSelected]}
                textStyle={[styles.chipText, category === selectedCategory && styles.chipTextSelected]}
              >
                {category}
              </Chip>
            ))}
          </ScrollView>
        </View>

        <View style={styles.filterGroup}>
          <Text style={styles.sectionLabel}>Government level</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {levelOptions.map((level) => (
              <Chip
                key={level}
                selected={level === selectedLevel}
                showSelectedCheck={false}
                onPress={() => setSelectedLevel(level)}
                style={[styles.chip, level === selectedLevel && styles.chipSelected]}
                textStyle={[styles.chipText, level === selectedLevel && styles.chipTextSelected]}
              >
                {level}
              </Chip>
            ))}
          </ScrollView>
        </View>

        <View style={styles.sortRow}>
          <Text style={styles.sectionLabel}>Sort</Text>
          <Button mode={sortMode === 'relevance' ? 'contained' : 'text'} onPress={() => setSortMode('relevance')} compact>
            Relevance
          </Button>
          <Button mode={sortMode === 'title' ? 'contained' : 'text'} onPress={() => setSortMode('title')} compact>
            Title
          </Button>
        </View>

        {loading ? (
          <Card style={styles.placeholderCard}>
            <Card.Content>
              <Text style={styles.empty}>Loading issue catalog…</Text>
            </Card.Content>
          </Card>
        ) : error ? (
          <Card style={styles.placeholderCard}>
            <Card.Content>
              <Text style={styles.empty}>{error}</Text>
            </Card.Content>
          </Card>
        ) : visibleIssues.length === 0 ? (
          <Card style={styles.placeholderCard}>
            <Card.Content>
              <Text variant="titleMedium">No issues match this search</Text>
              <Text style={styles.empty}>Try another keyword, reset the category, or choose a broader government level.</Text>
            </Card.Content>
          </Card>
        ) : (
          visibleIssues.map((issue) => (
            <Card
              key={issue.id}
              style={styles.card}
              onPress={() => router.push({ pathname: '/issues/[id]', params: { id: issue.id } })}
            >
              <Card.Content style={styles.cardContent}>
                <View style={styles.cardTopRow}>
                  <Text variant="titleMedium" style={styles.issueTitle}>{issue.title}</Text>
                </View>
                <Text style={styles.category}>{issue.category}</Text>
                <Text style={styles.summary}>{issue.summary}</Text>
                <View style={styles.metaRow}>
                  {issue.governmentLevels.slice(0, 2).map((level) => (
                    <Chip key={`${issue.id}-${level}`} compact style={styles.metaChip} textStyle={styles.metaChipText}>
                      {level}
                    </Chip>
                  ))}
                </View>
                <Text style={styles.keywords}>{issue.keywords.slice(0, 3).join(' • ')}</Text>
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
    paddingBottom: 32,
  },
  innerWidth: {
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
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
  primaryButton: {
    marginBottom: spacing.md,
    borderRadius: 12,
    minHeight: 46,
  },
  search: {
    marginBottom: spacing.md,
    borderRadius: 14,
    backgroundColor: colors.surface,
  },
  filterGroup: {
    marginBottom: spacing.md,
  },
  sectionLabel: {
    color: colors.text,
    fontWeight: '700',
    marginBottom: 8,
  },
  chipRow: {
    paddingBottom: 4,
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
    color: colors.onPrimary,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.md,
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
    alignItems: 'center',
    width: '100%',
  },
  issueTitle: {
    color: colors.text,
    fontWeight: '700',
    lineHeight: 24,
  },
  category: {
    marginTop: 8,
    color: colors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontSize: 11,
  },
  summary: {
    marginTop: 10,
    color: colors.textSoft,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  metaChip: {
    backgroundColor: colors.successSoft,
    borderRadius: 999,
  },
  metaChipText: {
    color: colors.success,
    fontWeight: '600',
    fontSize: 11,
  },
  keywords: {
    marginTop: 12,
    color: colors.muted,
    lineHeight: 20,
  },
  placeholderCard: {
    marginTop: spacing.sm,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  empty: {
    marginTop: 8,
    color: colors.muted,
    lineHeight: 20,
  },
});
