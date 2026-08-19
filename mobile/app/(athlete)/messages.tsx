import React from 'react';
import { ConversationsListScreen } from '../../components/ConversationsListScreen';
import { colors } from '../../constants/theme';

export default function AthleteMessages() {
  return <ConversationsListScreen accent={colors.teal} secondaryAccent={colors.violet} basePath="/(athlete)/chat" />;
}
