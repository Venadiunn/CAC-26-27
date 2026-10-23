import React from 'react';
import { Card, Text } from 'react-native-paper';

export type SummaryCardProps = {
  title: string;
  summary: string;
};

export default function SummaryCard({ title, summary }: SummaryCardProps) {
  return (
    <Card>
      <Card.Content>
        <Text variant="titleMedium">{title}</Text>
        <Text style={{ marginTop: 8 }}>{summary}</Text>
      </Card.Content>
    </Card>
  );
}
