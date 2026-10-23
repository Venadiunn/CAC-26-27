import React from 'react';
import { Card, Text } from 'react-native-paper';

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
        <Text variant="labelSmall" style={{ marginTop: 6, color: '#6b7280' }}>
          {source}
        </Text>
        {excerpt ? <Text style={{ marginTop: 8 }}>{excerpt}</Text> : null}
      </Card.Content>
    </Card>
  );
}
