import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Share, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Chip, Text, TextInput } from 'react-native-paper';
import { Copy, Sparkles } from 'lucide-react-native';
import { getSavedDrafts, removeDraft, saveDraft, updateDraft } from '../lib/storage';
import BackButton from '../components/BackButton';
import { generateAdvocacyDraft } from '../services/ai';
import { getIssueById } from '../services/issues';
import { getOfficials } from '../services/officials';
import { useAuth } from '../lib/auth-context';
import { colors, layout, radii, shadows, spacing } from '../theme';
import type { Official } from '../types';

export default function AdvocacyScreen() {
  const router = useRouter();
  const { issueId } = useLocalSearchParams<{ issueId?: string }>();
  const issue = issueId ? getIssueById(issueId) : undefined;
  const { session, loading: authLoading, syncing } = useAuth();
  const [officials, setOfficials] = useState<Pick<Official, 'id' | 'fullName' | 'officeTitle' | 'jurisdiction' | 'email' | 'sourceUrl'>[]>([]);
  const [selectedOfficial, setSelectedOfficial] = useState('');
  const [officialQuery, setOfficialQuery] = useState('');
  const [personalPerspective, setPersonalPerspective] = useState('');
  const [requestedAction, setRequestedAction] = useState('');
  const [tone, setTone] = useState<'professional' | 'persuasive' | 'concise' | 'community-focused'>('professional');
  const [subject, setSubject] = useState('Student priorities on local civic issues');
  const [body, setBody] = useState('');
  const [drafts, setDrafts] = useState<{ id: string; subject: string; body: string; createdAt: string }[]>([]);
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [generationMessage, setGenerationMessage] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (authLoading || syncing) {
      return;
    }

    let active = true;
    setDrafts([]);
    setLoadError('');
    void Promise.all([
      getOfficials(),
      getSavedDrafts<{ id: string; subject: string; body: string; createdAt: string }>(),
    ]).then(([items, saved]) => {
      if (active) {
        setOfficials(items.map((item) => ({
          id: item.id,
          fullName: item.fullName,
          officeTitle: item.officeTitle,
          jurisdiction: item.jurisdiction,
          email: item.email,
          sourceUrl: item.sourceUrl,
        })));
        setSelectedOfficial((current) => current || items[0]?.id || '');
        setDrafts(saved);
      }
    }).catch((error: unknown) => {
      if (active) {
        setLoadError(error instanceof Error ? error.message : 'Could not load advocacy data.');
      }
    });
    return () => {
      active = false;
    };
  }, [session?.user.id, authLoading, syncing]);

  useEffect(() => {
    if (!issueId) {
      return;
    }

    if (!issue) {
      return;
    }

    setSubject(`Student perspective on ${issue.title}`);
    setBody(
      [
        'Dear [Official Name],',
        '',
        `I am writing to express concern about ${issue.title}.`,
        issue.summary,
        '',
        'I believe this topic deserves thoughtful attention, clear public information, and opportunities for residents to participate in decisions affecting the issue.',
        '',
        'Thank you for your time and service.',
      ].join('\n'),
    );
  }, [issueId]);

  const handleGenerate = async () => {
    setSaveError('');
    setSaveMessage('');
    setGenerationMessage('');
    setGenerating(true);
    const recipient = officials.find((official) => official.id === selectedOfficial);
    const userNotes = [
      personalPerspective.trim() ? `My concern: ${personalPerspective.trim()}` : '',
      requestedAction.trim() ? `What I am asking for: ${requestedAction.trim()}` : '',
    ].filter(Boolean).join('\n\n');
    try {
      const draft = await generateAdvocacyDraft({
        articleId: issueId ?? 'general-civic-issue',
        officialId: selectedOfficial,
        userNotes,
        issueTitle: issue?.title,
        issueSummary: issue?.summary,
        personalPerspective,
        requestedAction,
        tone,
        officialName: recipient?.fullName,
        officialOffice: recipient?.officeTitle,
        officialJurisdiction: recipient?.jurisdiction,
      });
      setSubject(draft.subject);
      setBody(draft.body);
      setGenerationMessage(draft.cached ? 'A local message template is ready. Configure the server AI route for generated messages.' : 'AI draft ready. Review the facts and edit it to match your views.');
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Could not generate the draft.');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    setSaveError('');
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(body);
      } else {
        await Share.share({ message: body });
      }
      setSaveMessage('Message copied or shared.');
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Could not copy the message.');
    }
  };

  const handleSave = async () => {
    setSaveError('');
    setSaveMessage('');
    const existingDraft = drafts.find((draft) => draft.id === editingDraftId);
    const item = {
      id: editingDraftId ?? `${Date.now()}`,
      subject: subject || 'Untitled draft',
      body: body || 'No message body yet.',
      createdAt: existingDraft?.createdAt ?? new Date().toISOString(),
      issueId: issueId ?? null,
    };

    try {
      if (editingDraftId) {
        await updateDraft(item);
      } else {
        await saveDraft(item);
      }
      const saved = await getSavedDrafts<typeof item>();
      setDrafts(saved);
      setEditingDraftId(null);
      setSaveMessage('Draft saved. You can return to it from this screen or your Dashboard.');
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Could not save this draft.');
    }
  };

  const handleDelete = async (draftId: string) => {
    setSaveError('');
    setSaveMessage('');
    try {
      await removeDraft<{ id: string }>((draft) => draft.id === draftId);
      const saved = await getSavedDrafts<{ id: string; subject: string; body: string; createdAt: string }>();
      setDrafts(saved);
      if (editingDraftId === draftId) {
        setEditingDraftId(null);
        setSubject('');
        setBody('');
      }
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Could not delete this draft.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.innerWidth}>
        <BackButton />
        <Text variant="headlineSmall" style={styles.heading}>Advocacy</Text>
        <Text style={styles.subtitle}>Draft and save a civic message.</Text>
        {loadError ? <Text accessibilityRole="alert" style={styles.error}>{loadError}</Text> : null}
        {saveError ? <Text accessibilityRole="alert" style={styles.error}>{saveError}</Text> : null}
        {saveMessage ? <Text accessibilityLiveRegion="polite" style={styles.success}>{saveMessage}</Text> : null}
        {generationMessage ? <Text accessibilityLiveRegion="polite" style={styles.generationMessage}>{generationMessage}</Text> : null}

        {issue ? (
          <Card style={styles.issueContextCard}>
            <Card.Content style={styles.cardContent}>
              <Text style={styles.contextKicker}>MESSAGE ABOUT</Text>
              <Text style={styles.issueContextTitle}>{issue.title}</Text>
              <Text numberOfLines={3} style={styles.issueContextSummary}>{issue.summary}</Text>
              <Button mode="text" onPress={() => router.push('/issues')} style={styles.changeIssueButton}>
                Choose another issue
              </Button>
            </Card.Content>
          </Card>
        ) : null}

        <TextInput
          label="What concerns you about this issue?"
          value={personalPerspective}
          onChangeText={setPersonalPerspective}
          mode="outlined"
          multiline
          style={styles.input}
        />
        <TextInput
          label="What would you like the official to consider?"
          value={requestedAction}
          onChangeText={setRequestedAction}
          mode="outlined"
          multiline
          style={styles.input}
        />

        <Text style={styles.sectionLabel}>Message tone</Text>
        <View style={styles.toneRow}>
          {([
            ['professional', 'Professional'],
            ['persuasive', 'Persuasive'],
            ['concise', 'Concise'],
            ['community-focused', 'Community-focused'],
          ] as const).map(([value, label]) => (
            <Chip
              key={value}
              selected={tone === value}
              showSelectedCheck={false}
              onPress={() => setTone(value)}
              style={[styles.toneChip, tone === value && styles.toneChipSelected]}
              textStyle={[styles.toneText, tone === value && styles.toneTextSelected]}
            >
              {label}
            </Chip>
          ))}
        </View>

        <TextInput label="Subject" value={subject} onChangeText={setSubject} mode="outlined" style={styles.input} />

        <TextInput
          label="Message body"
          value={body}
          onChangeText={setBody}
          multiline
          mode="outlined"
          style={styles.textArea}
        />

        <Button
          mode="contained"
          icon={({ size, color }) => <Sparkles size={size} color={color} />}
          contentStyle={styles.iconLabelContent}
          loading={generating}
          disabled={generating}
          onPress={() => void handleGenerate()}
          style={styles.primaryButton}
        >
          {generating ? 'Generating message…' : body ? 'Regenerate message' : 'Generate message'}
        </Button>

        <View style={styles.buttonRow}>
          <Button mode="outlined" icon={({ size, color }) => <Copy size={size} color={color} />} contentStyle={styles.iconLabelContent} onPress={() => void handleCopy()} style={styles.secondaryButton}>
            Copy message
          </Button>
          <Button mode="contained-tonal" onPress={() => void handleSave()} style={styles.secondaryButton}>
            {editingDraftId ? 'Update draft' : 'Save draft'}
          </Button>
        </View>

        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Target office</Text>
            <Text style={styles.selectedOffice}>
              {officials.find((official) => official.id === selectedOfficial)?.fullName ?? 'No official selected'}
            </Text>
            {officials.find((official) => official.id === selectedOfficial) ? (
              <Text style={styles.officeDetails}>
                {officials.find((official) => official.id === selectedOfficial)?.officeTitle} · {officials.find((official) => official.id === selectedOfficial)?.jurisdiction}
              </Text>
            ) : <Text style={styles.officeDetails}>You can continue without selecting a recipient.</Text>}
            <TextInput
              label="Find another official"
              value={officialQuery}
              onChangeText={setOfficialQuery}
              mode="outlined"
              autoCapitalize="words"
              accessibilityLabel="Find another official"
              style={styles.officialSearch}
            />
            {officialQuery.trim() ? (
              officials
                .filter((official) => `${official.fullName} ${official.officeTitle}`.toLowerCase().includes(officialQuery.trim().toLowerCase()))
                .slice(0, 8)
                .map((official) => (
                  <Button
                    key={official.id}
                    mode={selectedOfficial === official.id ? 'contained' : 'text'}
                    onPress={() => { setSelectedOfficial(official.id); setOfficialQuery(''); }}
                    style={styles.choiceButton}
                    labelStyle={styles.choiceButtonLabel}
                  >
                    {official.fullName} · {official.officeTitle}
                  </Button>
                ))
            ) : null}
            {officialQuery.trim() && !officials.some((official) => `${official.fullName} ${official.officeTitle}`.toLowerCase().includes(officialQuery.trim().toLowerCase())) ? (
              <Text style={styles.empty}>No officials match that search.</Text>
            ) : null}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Saved drafts</Text>
            {drafts.length === 0 ? (
              <Text style={styles.empty}>No saved drafts yet.</Text>
            ) : (
              drafts.map((draft) => (
                <View key={draft.id} style={styles.draftItem}>
                  <Text style={styles.draftTitle}>{draft.subject}</Text>
                  <Text style={styles.draftMeta}>{new Date(draft.createdAt).toLocaleDateString()}</Text>
                  <Text numberOfLines={4} style={styles.draftBody}>{draft.body}</Text>
                  <Button mode="text" onPress={() => { setEditingDraftId(draft.id); setSubject(draft.subject); setBody(draft.body); }}>
                    Edit draft
                  </Button>
                  <Button mode="text" onPress={() => void handleDelete(draft.id)}>
                    Delete draft
                  </Button>
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
    paddingBottom: 32,
    paddingTop: 18,
  },
  content: {
    paddingBottom: 32,
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
  input: {
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  textArea: {
    minHeight: 180,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  primaryButton: {
    borderRadius: radii.md,
    minHeight: 48,
    backgroundColor: colors.primary,
    marginBottom: spacing.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: 12,
    marginBottom: spacing.md,
  },
  secondaryButton: {
    borderRadius: radii.md,
    minHeight: 44,
    flexGrow: 1,
  },
  iconLabelContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  choiceButton: {
    marginTop: 8,
    alignItems: 'flex-start',
  },
  choiceButtonLabel: {
    color: colors.primary,
  },
  selectedOffice: {
    marginTop: 8,
    color: colors.text,
    fontWeight: '700',
  },
  officeDetails: {
    color: colors.textSoft,
    lineHeight: 20,
    marginTop: 4,
  },
  officialSearch: {
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
  },
  success: {
    color: colors.success,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  generationMessage: {
    color: colors.primaryStrong,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  issueContextCard: {
    marginBottom: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.borderStrong,
    borderWidth: 1,
    borderRadius: radii.md,
  },
  contextKicker: {
    color: colors.secondary,
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 5,
  },
  issueContextTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 23,
  },
  issueContextSummary: {
    color: colors.textSoft,
    lineHeight: 20,
    marginTop: 6,
  },
  changeIssueButton: {
    alignSelf: 'flex-start',
    marginLeft: -8,
    marginTop: 2,
  },
  sectionLabel: {
    color: colors.text,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  toneRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  toneChip: {
    minHeight: 36,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
  },
  toneChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  toneText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  toneTextSelected: {
    color: colors.onPrimary,
  },
  draftItem: {
    marginTop: 10,
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
    marginBottom: 4,
    fontSize: 12,
  },
  draftBody: {
    color: colors.textSoft,
    lineHeight: 20,
  },
  empty: {
    marginTop: 12,
    color: colors.muted,
    lineHeight: 20,
  },
});
