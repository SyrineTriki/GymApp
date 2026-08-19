import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ProgramForm } from '../../../components/ProgramForm';

export default function EditProgram() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ProgramForm mode="edit" programId={id} />;
}
