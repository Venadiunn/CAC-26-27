import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Card, Text, TextInput } from 'react-native-paper';
import { Landmark, Megaphone, MessageCircle, RotateCcw, ScrollText, Send, Users, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, layout, radii, shadows, spacing } from '../../theme';

type HelperMessage = {
  id: string;
  role: 'user' | 'notice';
  text: string;
  time: string;
};

const NOT_CONNECTED_MESSAGE = 'Thanks for sharing your question. Civic Helper is not connected to an AI service yet, so nothing was sent. Your message stays on this device.';

const suggestions = [
  { label: 'Explain a current civic issue', Icon: ScrollText },
  { label: 'How does my state government work?', Icon: Landmark },
  { label: 'Who represents my community?', Icon: Users },
  { label: 'How can I advocate for change?', Icon: Megaphone },
];

const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export default function CivicHelperScreen() {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<HelperMessage[]>([]);

  const canSend = draft.trim().length > 0;

  const handleSend = () => {
    const text = draft.trim();
    if (!text) {
      return;
    }

    const now = new Date();
    const userMessage: HelperMessage = { id: `${now.getTime()}-user`, role: 'user', text, time: formatTime(now) };
    setMessages((current) => {
      const next = [...current, userMessage];
      if (!current.some((message) => message.role === 'notice')) {
        next.push({ id: `${now.getTime()}-notice`, role: 'notice', text: NOT_CONNECTED_MESSAGE, time: formatTime(now) });
      }
      return next;
    });
    setDraft('');
  };

  const handleNewConversation = () => {
    setMessages([]);
    setDraft('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.innerWidth}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <MessageCircle size={22} color={colors.primary} />
          </View>
          <View style={styles.headerText}>
            <View style={styles.titleRow}>
              <Text variant="headlineSmall" style={styles.heading}>Civic Helper</Text>
              <View style={styles.statusChip}>
                <Text style={styles.statusChipText}>Civic assistant</Text>
              </View>
            </View>
            <Text style={styles.subtitle}>A place to understand civic issues and discover ways to participate in your community.</Text>
          </View>
        </View>

        <ScrollView
          style={styles.conversation}
          contentContainerStyle={styles.conversationContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {messages.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Card.Content style={styles.emptyContent}>
                <View style={styles.emptyIcon}>
                  <MessageCircle size={28} color={colors.secondary} />
                </View>
                <Text variant="titleLarge" style={styles.emptyTitle}>How can I help you understand your community?</Text>
                <Text style={styles.emptyText}>Explore civic issues, learn how government works, and discover ways to make your voice heard.</Text>
                <Text style={styles.suggestionLabel}>Try asking</Text>
                <View style={styles.suggestionGrid}>
                  {suggestions.map(({ label, Icon }) => (
                    <Pressable
                      key={label}
                      accessibilityRole="button"
                      accessibilityLabel={`Use suggestion: ${label}`}
                      onPress={() => setDraft(label)}
                      style={({ pressed }) => [styles.suggestionChip, pressed && styles.suggestionChipPressed]}
                    >
                      <Icon size={16} color={colors.primary} />
                      <Text style={styles.suggestionText}>{label}</Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={styles.prototypeNote}>Suggestions fill the composer below. AI responses are not connected yet.</Text>
              </Card.Content>
            </Card>
          ) : (
            <>
              {messages.map((message) => (
                <View key={message.id} style={message.role === 'user' ? styles.userRow : styles.noticeRow}>
                  <View style={message.role === 'user' ? styles.userBubble : styles.noticeBubble}>
                    {message.role === 'notice' ? <Text style={styles.noticeLabel}>CIVIC HELPER</Text> : null}
                    <Text style={message.role === 'user' ? styles.userText : styles.noticeText}>{message.text}</Text>
                    <Text style={message.role === 'user' ? styles.userTime : styles.noticeTime}>{message.time}</Text>
                  </View>
                </View>
              ))}
            </>
          )}
        </ScrollView>

        <View style={[styles.composerArea, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
          {messages.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Start a new conversation"
              onPress={handleNewConversation}
              style={({ pressed }) => [styles.newConversation, pressed && styles.suggestionChipPressed]}
            >
              <RotateCcw size={14} color={colors.primary} />
              <Text style={styles.newConversationText}>New conversation</Text>
            </Pressable>
          ) : null}
          <View style={styles.composer}>
            <TextInput
              mode="outlined"
              placeholder="Ask a civic question…"
              value={draft}
              onChangeText={setDraft}
              multiline
              accessibilityLabel="Civic question message input"
              style={styles.input}
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
              right={draft ? (
                <TextInput.Icon
                  icon={({ size, color }) => <X size={size} color={color} />}
                  accessibilityLabel="Clear message"
                  onPress={() => setDraft('')}
                />
              ) : undefined}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Send message"
              accessibilityState={{ disabled: !canSend }}
              onPress={handleSend}
              disabled={!canSend}
              style={({ pressed }) => [
                styles.sendButton,
                !canSend && styles.sendButtonDisabled,
                pressed && canSend && styles.sendButtonPressed,
              ]}
            >
              <Send size={20} color={canSend ? colors.onPrimary : colors.onDisabled} />
            </Pressable>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  innerWidth: {
    flex: 1,
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  heading: {
    color: colors.text,
    fontWeight: '700',
  },
  statusChip: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusChipText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 6,
    color: colors.textSoft,
    lineHeight: 21,
    maxWidth: 560,
  },
  conversation: {
    flex: 1,
  },
  conversationContent: {
    paddingBottom: spacing.md,
  },
  emptyCard: {
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: radii.pill,
    backgroundColor: colors.secondarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    color: colors.text,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 30,
    maxWidth: 460,
  },
  emptyText: {
    marginTop: spacing.sm,
    color: colors.textSoft,
    lineHeight: 21,
    textAlign: 'center',
    maxWidth: 480,
  },
  suggestionLabel: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    color: colors.secondary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  suggestionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  suggestionChip: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    maxWidth: 320,
  },
  suggestionChipPressed: {
    backgroundColor: colors.surfaceAlt,
  },
  suggestionText: {
    color: colors.primary,
    fontWeight: '600',
    lineHeight: 19,
    flexShrink: 1,
  },
  prototypeNote: {
    marginTop: spacing.lg,
    color: colors.subtle,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 420,
  },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: spacing.sm,
  },
  noticeRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: spacing.sm,
  },
  userBubble: {
    maxWidth: '85%',
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    borderBottomRightRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  userText: {
    color: colors.onPrimary,
    lineHeight: 21,
  },
  userTime: {
    marginTop: 4,
    color: colors.borderStrong,
    fontSize: 10,
    alignSelf: 'flex-end',
  },
  noticeBubble: {
    maxWidth: '85%',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderBottomLeftRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    ...shadows.card,
  },
  noticeLabel: {
    color: colors.secondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  noticeText: {
    color: colors.textSoft,
    lineHeight: 21,
  },
  noticeTime: {
    marginTop: 4,
    color: colors.subtle,
    fontSize: 10,
  },
  composerArea: {
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  newConversation: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.xs,
    borderRadius: radii.sm,
  },
  newConversationText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    maxHeight: 140,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  sendButtonPressed: {
    backgroundColor: colors.primaryHover,
  },
  sendButtonDisabled: {
    backgroundColor: colors.disabled,
  },
});
