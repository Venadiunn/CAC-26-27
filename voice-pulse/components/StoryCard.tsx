import React from 'react';
import { Card, Text } from 'react-native-paper';
import { colors } from '../theme';

export type StoryCardProps = {
  title: string;
  source: string;
  excerpt?: string;
};

export default function StoryCard({ title, source, excerpt }: StoryCardProps) {
  return (
    <Card style={{ marginBottom: 12 }}>
      <Card.Content>
        <Text variant="titleMedium">{title}</Text>
        <Text variant="labelSmall" style={{ marginTop: 6, color: colors.muted }}>
          {source}
        </Text>
        {excerpt ? <Text style={{ marginTop: 8 }}>{excerpt}</Text> : null}
      </Card.Content>
    </Card>
  );
}
