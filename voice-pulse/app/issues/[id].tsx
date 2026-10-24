import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Chip, Text } from 'react-native-paper';
import BackButton from '../../components/BackButton';
import { getSavedIssues, removeSavedIssue, saveIssue } from '../../lib/storage';
import { useAuth } from '../../lib/auth-context';
import { getIssueById, type IssueRecord } from '../../services/issues';
import { colors, layout, radii, shadows, spacing } from '../../theme';

export default function IssueDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session, loading: authLoading, syncing } = useAuth();
  const [issue, setIssue] = useState<IssueRecord | null>(null);
  const [saved, setSaved] = useState(false);
  const [storageError, setStorageError] = useState('');

  useEffect(() => {
    if (authLoading || syncing) {
      return;
    }

    let active = true;
    setSaved(false);
    setStorageError('');
    void (async () => {
      const selected = id ? getIssueById(id) : undefined;
      setIssue(selected ?? null);

      try {
        const savedIssues = await getSavedIssues<IssueRecord>();
        if (active) {
          setSaved(savedIssues.some((item) => item.id === id));
        }
      } catch (error) {
        if (active) {
          setStorageError(error instanceof Error ? error.message : 'Could not load saved status.');
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [id, session?.user.id, authLoading, syncing]);

  if (!issue) {
    return (
      <View style={styles.emptyState}>
        <BackButton />
        <Text variant="headlineMedium">Issue not found</Text>
      </View>
    );
  }

  const toggleSave = async () => {
    setStorageError('');
    try {
      if (saved) {
        await removeSavedIssue<IssueRecord>((item) => item.id === issue.id);
        setSaved(false);
        return;
      }

      await saveIssue(issue);
      setSaved(true);
    } catch (error) {
      setStorageError(error instanceof Error ? error.message : 'Could not update saved issue.');
    }
  };

  const whyItMatters = [
    `This issue affects ${issue.affectedGroups.join(', ') || 'Missouri residents'}.`,
    `It is relevant in ${issue.governmentLevels.join(', ') || 'a public policy context'}.`,
    `It connects to broader civic questions around fairness, public accountability, access, and community participation.`,
  ].join(' ');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.innerWidth}>
        <BackButton />
        <Text variant="headlineMedium" style={styles.heading}>{issue.title}</Text>
        <Text style={styles.category}>{issue.category}</Text>

        <View style={styles.actionRow}>
          <Button mode="contained" buttonColor={saved ? colors.secondary : colors.primary} onPress={() => void toggleSave()} style={styles.primaryButton}>
            {saved ? 'Saved issue' : 'Save issue'}
          </Button>
          <Button mode="outlined" onPress={() => router.push({ pathname: '/companion', params: { issueId: issue.id, question: issue.title, feature: 'explain' } })} style={styles.secondaryButton}>
            Understand this issue
          </Button>
        </View>
        {storageError ? <Text accessibilityRole="alert" style={styles.error}>{storageError}</Text> : null}

        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Overview</Text>
            <Text style={styles.bodyText}>{issue.summary}</Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Why this matters</Text>
            <Text style={styles.bodyText}>{whyItMatters}</Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Questions to investigate</Text>
            {issue.policyQuestions.map((question) => (
              <Text key={question} style={styles.listItem}>• {question}</Text>
            ))}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Government levels</Text>
            <View style={styles.chipRow}>
              {issue.governmentLevels.length > 0 ? (
                issue.governmentLevels.map((level) => (
                  <Chip key={`${issue.id}-${level}`} compact style={styles.chip} textStyle={styles.chipText}>
                    {level}
                  </Chip>
                ))
              ) : (
                <Text style={styles.absenceText}>No specific government level is assigned in the current catalog.</Text>
              )}
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Source references</Text>
            {issue.sources.length > 0 ? (
              issue.sources.map((source) => (
                <Button
                  key={`${issue.id}-${source.name}`}
                  mode="text"
                  onPress={() => void Linking.openURL(source.url)}
                  labelStyle={styles.linkText}
                  style={styles.sourceButton}
                >
                  {source.name}
                </Button>
              ))
            ) : (
              <Text style={styles.absenceText}>No source links have been added for this issue in the current dataset.</Text>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Grounding notes</Text>
            <Text style={styles.bodyText}>This catalog provides neutral issue framing, search terms, and source references. It does not claim a legislative outcome, a verified statistic, or an agency responsibility that is not explicitly described in the available sources.</Text>
            <Text style={styles.caption}>Unanswered questions remain visible instead of being treated as facts.</Text>
          </Card.Content>
        </Card>

        <Button
          mode="contained-tonal"
          onPress={() => router.push({ pathname: '/advocacy', params: { issueId: issue.id } })}
          style={styles.draftButton}
        >
          Draft a message to an official
        </Button>

        <Link href="/issues" style={styles.backLink}>Back to issue browser</Link>
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
  error: {
    color: colors.warning,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  category: {
    marginTop: 8,
    color: colors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontSize: 11,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
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
  bodyText: {
    marginTop: 10,
    lineHeight: 22,
    color: colors.textSoft,
  },
  listItem: {
    marginTop: 10,
    lineHeight: 22,
    color: colors.textSoft,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  chip: {
    backgroundColor: colors.successSoft,
    borderRadius: 999,
  },
  chipText: {
    color: colors.success,
    fontWeight: '600',
    fontSize: 11,
  },
  sourceButton: {
    alignItems: 'flex-start',
    marginTop: 8,
  },
  linkText: {
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'left',
  },
  caption: {
    marginTop: 12,
    color: colors.muted,
    lineHeight: 20,
  },
  absenceText: {
    marginTop: 10,
    color: colors.muted,
    lineHeight: 20,
  },
  draftButton: {
    borderRadius: 12,
    minHeight: 46,
    marginBottom: spacing.md,
  },
  backLink: {
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '700',
  },
});
