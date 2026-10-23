import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Text, TextInput } from 'react-native-paper';
import { getSavedDrafts, saveDraft } from '../lib/storage';
import { generateAdvocacyDraft } from '../services/ai';
import { getIssueById } from '../services/issues';
import { getOfficials } from '../services/officials';
import { colors, layout, radii, shadows, spacing } from '../theme';

export default function AdvocacyScreen() {
  const { issueId } = useLocalSearchParams<{ issueId?: string }>();
  const [officials, setOfficials] = useState<{ id: string; fullName: string }[]>([]);
  const [selectedOfficial, setSelectedOfficial] = useState('');
  const [subject, setSubject] = useState('Student priorities on local civic issues');
  const [body, setBody] = useState('');
  const [drafts, setDrafts] = useState<{ id: string; subject: string; body: string; createdAt: string }[]>([]);

  useEffect(() => {
    void (async () => {
      const items = await getOfficials();
      setOfficials(items.map((item) => ({ id: item.id, fullName: item.fullName })));
      if (items[0]) {
        setSelectedOfficial(items[0].id);
      }

      const saved = await getSavedDrafts<{ id: string; subject: string; body: string; createdAt: string }>();
      setDrafts(saved);
    })();
  }, []);

  useEffect(() => {
    if (!issueId) {
      return;
    }

    const issue = getIssueById(issueId);
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
    const draft = await generateAdvocacyDraft({
      articleId: issueId ?? 'demo-issue',
      officialId: selectedOfficial,
      userNotes: body,
      issueTitle: issueId ? getIssueById(issueId)?.title : undefined,
    });

    setSubject(draft.subject);
    setBody(draft.body);
  };

  const handleSave = async () => {
    const item = {
      id: `${Date.now()}`,
      subject: subject || 'Untitled draft',
      body: body || 'No message body yet.',
      createdAt: new Date().toISOString(),
    };

    await saveDraft(item);
    const saved = await getSavedDrafts<{ id: string; subject: string; body: string; createdAt: string }>();
    setDrafts(saved);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.innerWidth}>
        <Text variant="headlineSmall" style={styles.heading}>Advocacy</Text>
        <Text style={styles.subtitle}>Draft and save a civic message.</Text>

        <TextInput label="Subject" value={subject} onChangeText={setSubject} mode="outlined" style={styles.input} />

        <TextInput
          label="Message body"
          value={body}
          onChangeText={setBody}
          multiline
          mode="outlined"
          style={styles.textArea}
        />

        <Button mode="contained" onPress={() => void handleGenerate()} style={styles.primaryButton}>
          Generate draft
        </Button>

        <View style={styles.buttonRow}>
          <Button mode="contained-tonal" onPress={() => void handleSave()} style={styles.secondaryButton}>
            Save draft
          </Button>
        </View>

        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Target office</Text>
            {officials.map((official) => (
              <Button
                key={official.id}
                mode={selectedOfficial === official.id ? 'contained' : 'text'}
                onPress={() => setSelectedOfficial(official.id)}
                style={styles.choiceButton}
                labelStyle={styles.choiceButtonLabel}
              >
                {official.fullName}
              </Button>
            ))}
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
    borderRadius: 12,
    minHeight: 46,
    backgroundColor: colors.primary,
  },
  buttonRow: {
    marginTop: 12,
    marginBottom: spacing.md,
  },
  secondaryButton: {
    borderRadius: 12,
    minHeight: 46,
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
