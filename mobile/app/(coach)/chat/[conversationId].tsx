import React from 'react';
import { ChatThreadScreen } from '../../../components/ChatThreadScreen';
import { colors } from '../../../constants/theme';

export default function CoachChatThread() {
  return <ChatThreadScreen accent={colors.amber} />;
}
