import React from 'react';
import { Card, Text } from 'react-native-paper';
import { colors } from '../theme';

export type OfficialCardProps = {
  name: string;
  office: string;
  email?: string;
};

export default function OfficialCard({ name, office, email }: OfficialCardProps) {
  return (
    <Card style={{ marginBottom: 12 }}>
      <Card.Content>
        <Text variant="titleMedium">{name}</Text>
        <Text style={{ marginTop: 6 }}>{office}</Text>
        {email ? <Text style={{ marginTop: 6, color: colors.textSoft }}>{email}</Text> : null}
      </Card.Content>
    </Card>
  );
}
