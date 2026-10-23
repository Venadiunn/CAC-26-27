import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Card, Text, TextInput } from 'react-native-paper';
import { getOfficials } from '../../services/officials';
import { colors, layout, radii, shadows, spacing } from '../../theme';
import type { Official } from '../../types';

export default function OfficialsScreen() {
  const [officials, setOfficials] = useState<Official[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    void (async () => {
      const data = await getOfficials();
      setOfficials(data);
    })();
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return officials;
    }

    return officials.filter((official) =>
      `${official.fullName} ${official.officeTitle} ${official.jurisdiction}`
        .toLowerCase()
        .includes(normalized),
    );
  }, [officials, query]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.innerWidth}>
        <Text variant="headlineSmall" style={styles.heading}>Officials</Text>
        <Text style={styles.subtitle}>Find the right office for local and state civic action.</Text>

        <TextInput
          mode="outlined"
          placeholder="Search by office or jurisdiction"
          value={query}
          onChangeText={setQuery}
          style={styles.search}
          outlineColor={colors.border}
          activeOutlineColor={colors.primary}
          left={<TextInput.Icon icon="magnify" color={colors.muted} />}
        />

        {filtered.map((official) => (
          <Card key={official.id} style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <Text variant="titleMedium" style={styles.name}>{official.fullName}</Text>
              <Text style={styles.label}>{official.officeTitle}</Text>
              <Text style={styles.label}>{official.jurisdiction}</Text>
              <Text style={styles.level}>{official.level}</Text>
              {official.email ? <Text style={styles.detail}>Email: {official.email}</Text> : null}
              {official.phone ? <Text style={styles.detail}>Phone: {official.phone}</Text> : null}
              <Text style={styles.detail}>Official source: {official.sourceUrl}</Text>
            </Card.Content>
          </Card>
        ))}
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
    paddingBottom: 30,
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
  card: {
    marginTop: 14,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  cardContent: {
    padding: 16,
  },
  name: {
    fontWeight: '700',
    color: colors.text,
  },
  label: {
    marginTop: 6,
    color: colors.textSoft,
  },
  level: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  detail: {
    marginTop: 8,
    color: colors.muted,
    lineHeight: 18,
  },
});
