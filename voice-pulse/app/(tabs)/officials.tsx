import { useEffect, useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Card, Text, TextInput } from 'react-native-paper';
import { ExternalLink, MapPin, Phone, Search } from 'lucide-react-native';
import { getOfficials } from '../../services/officials';
import { colors, layout, radii, shadows, spacing } from '../../theme';
import type { Official } from '../../types';

export default function OfficialsScreen() {
  const [officials, setOfficials] = useState<Official[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    void getOfficials().then((data) => {
      if (active) {
        setOfficials(data);
        setError('');
      }
    }).catch((cause: unknown) => {
      if (active) {
        setError(cause instanceof Error ? cause.message : 'Could not load officials.');
      }
    }).finally(() => {
      if (active) {
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
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
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}

        <TextInput
          mode="outlined"
          placeholder="Search by office or jurisdiction"
          value={query}
          onChangeText={setQuery}
          style={styles.search}
          outlineColor={colors.border}
          activeOutlineColor={colors.primary}
          accessibilityLabel="Search officials"
          left={<TextInput.Icon icon={({ size, color }) => <Search size={size} color={color} />} accessibilityLabel="Search" />}
        />

        {loading ? <Text style={styles.empty}>Loading officials...</Text> : null}
        {!loading && !error && filtered.length === 0 ? <Text style={styles.empty}>No officials match this search.</Text> : null}
        {filtered.map((official) => (
          <Card key={official.id} style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <View style={styles.nameBlock}>
                  <Text variant="titleMedium" style={styles.name}>{official.fullName}</Text>
                  <Text style={styles.office}>{official.officeTitle}</Text>
                </View>
                <Text style={styles.level}>{official.level}</Text>
              </View>
              <View style={styles.jurisdictionRow}>
                <MapPin size={15} color={colors.muted} />
                <Text style={styles.label}>{official.jurisdiction}</Text>
              </View>
              <View style={styles.contactRow}>
                {official.phone ? (
                  <Pressable
                    accessibilityRole="link"
                    accessibilityLabel={`Call ${official.fullName} at ${official.phone}`}
                    onPress={() => void Linking.openURL(`tel:${official.phone}`)}
                    style={styles.contactAction}
                  >
                    <Phone size={15} color={colors.primary} />
                    <Text style={styles.contactText}>{official.phone}</Text>
                  </Pressable>
                ) : null}
                {official.email ? (
                  <Pressable
                    accessibilityRole="link"
                    accessibilityLabel={`Email ${official.fullName}`}
                    onPress={() => void Linking.openURL(`mailto:${official.email}`)}
                    style={styles.contactAction}
                  >
                    <Text style={styles.contactText}>{official.email}</Text>
                  </Pressable>
                ) : null}
                {official.sourceUrl ? (
                  <Pressable
                    accessibilityRole="link"
                    accessibilityLabel={`Open official source for ${official.fullName}`}
                    onPress={() => void Linking.openURL(official.sourceUrl)}
                    style={styles.contactAction}
                  >
                    <ExternalLink size={15} color={colors.primary} />
                    <Text style={styles.sourceText}>Official website</Text>
                  </Pressable>
                ) : null}
              </View>
              {official.lastVerifiedOn ? <Text style={styles.verified}>Source checked {official.lastVerifiedOn}</Text> : null}
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
  content: {
    paddingBottom: 30,
  },
  error: {
    color: colors.warning,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  empty: {
    color: colors.muted,
    lineHeight: 21,
    marginVertical: spacing.md,
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
    marginBottom: spacing.sm,
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
    fontSize: 17,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  nameBlock: {
    flex: 1,
  },
  office: {
    marginTop: 4,
    color: colors.textSoft,
    lineHeight: 20,
  },
  jurisdictionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
  },
  label: {
    color: colors.textSoft,
    lineHeight: 20,
  },
  level: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: colors.primary,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.sm,
    overflow: 'hidden',
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
  },
  contactAction: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radii.sm,
  },
  contactText: {
    color: colors.primaryStrong,
    fontWeight: '600',
  },
  sourceText: {
    color: colors.primary,
    fontWeight: '700',
  },
  verified: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 4,
  },
});
