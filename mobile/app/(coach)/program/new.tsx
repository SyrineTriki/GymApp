import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ProgramForm } from '../../../components/ProgramForm';

export default function NewProgram() {
  const { athleteId } = useLocalSearchParams<{ athleteId?: string }>();
  return <ProgramForm mode="new" initialAthleteId={athleteId} />;
}
