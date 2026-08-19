import React from 'react';
import { ConversationsListScreen } from '../../../components/ConversationsListScreen';
import { colors } from '../../../constants/theme';

export default function CoachMessages() {
  return <ConversationsListScreen accent={colors.amber} secondaryAccent={colors.violet} basePath="/(coach)/chat" />;
}
