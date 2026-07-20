import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, Modal, FlatList,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { AuthService, CoachPayload } from '../../services/auth.service';
import { StyledInput } from '../../components/StyledInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { colors, radius, font } from '../../constants/theme';

type Role = 'athlete' | 'coach';
type Step = 'role' | 'details' | 'verify';

const DAYS   = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
const MONTHS = [
  { label: 'January', value: '01' }, { label: 'February', value: '02' },
  { label: 'March',   value: '03' }, { label: 'April',    value: '04' },
  { label: 'May',     value: '05' }, { label: 'June',     value: '06' },
  { label: 'July',    value: '07' }, { label: 'August',   value: '08' },
  { label: 'September', value: '09' }, { label: 'October', value: '10' },
  { label: 'November',  value: '11' }, { label: 'December', value: '12' },
];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: currentYear - 1923 }, (_, i) =>
  String(currentYear - 14 - i)
);

interface DropdownProps {
  label: string;
  value: string;
  placeholder: string;
  options: { label: string; value: string }[];
  onSelect: (v: string) => void;
  error?: string;
  flex?: number;
}

function Dropdown({ label, value, placeholder, options, onSelect, error, flex = 1 }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);

  return (
    <View style={[ddStyles.container, { flex }]}>
      {!!label && <Text style={ddStyles.label}>{label}</Text>}
      <TouchableOpacity
        style={[ddStyles.trigger, !!error && ddStyles.triggerError]}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
      >
        <Text style={selected ? ddStyles.valueText : ddStyles.placeholder}>
          {selected ? selected.label : placeholder}
        </Text>
        <Text style={ddStyles.chevron}>▾</Text>
      </TouchableOpacity>
      {!!error && <Text style={ddStyles.errorText}>{error}</Text>}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={ddStyles.overlay} onPress={() => setOpen(false)} activeOpacity={1}>
          <View style={ddStyles.sheet}>
            <Text style={ddStyles.sheetTitle}>{label || placeholder}</Text>
            <FlatList
              data={options}
              keyExtractor={item => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[ddStyles.option, item.value === value && ddStyles.optionActive]}
                  onPress={() => { onSelect(item.value); setOpen(false); }}
                >
                  <Text style={[ddStyles.optionText, item.value === value && ddStyles.optionTextActive]}>
                    {item.label}
                  </Text>
                  {item.value === value && <Text style={ddStyles.optionCheck}>✓</Text>}
                </TouchableOpacity>
              )}
              style={{ maxHeight: 320 }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const ddStyles = StyleSheet.create({
  container: { gap: 6 },
  label: { fontSize: font.sm, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6 },
  trigger: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface2, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, height: 48, paddingHorizontal: 14 },
  triggerError: { borderColor: colors.error },
  valueText: { color: colors.text, fontSize: font.base },
  placeholder: { color: colors.textHint, fontSize: font.base },
  chevron: { color: colors.textMuted, fontSize: 12 },
  errorText: { fontSize: 12, color: colors.error },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  sheetTitle: { fontSize: font.base, fontWeight: '700', color: colors.text, marginBottom: 12 },
  option: { paddingVertical: 14, paddingHorizontal: 4, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border },
  optionActive: { backgroundColor: colors.accentDim, borderRadius: radius.sm },
  optionText: { fontSize: font.base, color: colors.textMuted },
  optionTextActive: { color: colors.accent, fontWeight: '700' },
  optionCheck: { color: colors.accent, fontWeight: '700' },
});

function Toast({ visible, message }: { visible: boolean; message: string }) {
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.delay(1400),
        Animated.timing(translateY, { toValue: -100, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  return (
    <Animated.View style={[toastStyles.toast, { transform: [{ translateY }] }]} pointerEvents="none">
      <Text style={toastStyles.icon}>✅</Text>
      <Text style={toastStyles.text}>{message}</Text>
    </Animated.View>
  );
}

const toastStyles = StyleSheet.create({
  toast: {
    position: 'absolute', top: 0, left: 16, right: 16, zIndex: 100,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.success,
    borderRadius: radius.md, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10,
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 8,
  },
  icon: { fontSize: 18 },
  text: { color: colors.text, fontSize: font.sm, fontWeight: '600', flex: 1 },
});

interface FormState {
  name: string; email: string; password: string;
  dobDay: string; dobMonth: string; dobYear: string;
  years_of_experience: string; bio: string;
}

interface FormErrors {
  name?: string; email?: string; password?: string;
  dob?: string; years_of_experience?: string; bio?: string;
}

interface CertFile { uri: string; name: string; mimeType: string; }

function validateForm(values: FormState, role: Role): FormErrors {
  const errors: FormErrors = {};
  if (!values.name.trim()) errors.name = 'Name is required.';
  else if (values.name.trim().length < 2) errors.name = 'At least 2 characters.';

  if (!values.email.trim()) errors.email = 'Email is required.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.email = 'Enter a valid email.';

  if (!values.password) errors.password = 'Password is required.';
  else if (values.password.length < 8) errors.password = 'At least 8 characters.';
  else if (!/[A-Z]/.test(values.password)) errors.password = 'Add at least one uppercase letter.';
  else if (!/\d/.test(values.password)) errors.password = 'Add at least one number.';

  if (!values.dobDay || !values.dobMonth || !values.dobYear) {
    errors.dob = 'Please select your full date of birth.';
  } else {
    const dob = new Date(`${values.dobYear}-${values.dobMonth}-${values.dobDay}`);
    if (isNaN(dob.getTime())) {
      errors.dob = 'Invalid date.';
    } else {
      const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 3600 * 1000));
      if (age < 14) errors.dob = 'You must be at least 14 years old.';
    }
  }

  if (role === 'coach') {
    if (values.years_of_experience) {
      const n = Number(values.years_of_experience);
      if (isNaN(n) || n < 0) errors.years_of_experience = 'Must be 0 or more.';
      else if (n > 60) errors.years_of_experience = 'Must be 60 or less.';
    }
    if (values.bio.length > 500) errors.bio = 'Maximum 500 characters.';
  }
  return errors;
}

function passwordStrength(pw: string): { label: string; color: string } {
  if (!pw) return { label: '', color: colors.border };
  if (pw.length < 8) return { label: 'Too short', color: colors.error };
  if (!/[A-Z]/.test(pw) || !/\d/.test(pw)) return { label: 'Almost there', color: colors.warning };
  return { label: 'Strong', color: colors.success };
}

export default function RegisterScreen() {
  const router = useRouter();
  const [step, setStep]               = useState<Step>('role');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [loading, setLoading]         = useState(false);
  const [serverError, setServerError] = useState('');
  const [certFile, setCertFile]       = useState<CertFile | null>(null);
  const [touched, setTouched]         = useState<Partial<Record<string, boolean>>>({});
  const [verifyCode, setVerifyCode]   = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [showToast, setShowToast]     = useState(false);

  const [form, setForm] = useState<FormState>({
    name: '', email: '', password: '',
    dobDay: '', dobMonth: '', dobYear: '',
    years_of_experience: '', bio: '',
  });

  const errors = selectedRole ? validateForm(form, selectedRole) : {};

  function setField(field: keyof FormState, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }
  function touch(field: string) {
    setTouched(t => ({ ...t, [field]: true }));
  }
  function visibleError(field: keyof FormErrors): string | undefined {
    return touched[field] ? (errors as FormErrors)[field] : undefined;
  }

  const dobForBackend = form.dobYear && form.dobMonth && form.dobDay
    ? `${form.dobYear}-${form.dobMonth}-${form.dobDay}` : '';

  async function submit() {
    setTouched({ name: true, email: true, password: true, dob: true,
      ...(selectedRole === 'coach' ? { years_of_experience: true, bio: true } : {}) });

    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    setServerError('');
    try {
      if (selectedRole === 'athlete') {
        await AuthService.sendAthleteCode({
          name: form.name, email: form.email,
          password: form.password, date_of_birth: dobForBackend,
        });
      } else {
        const payload: CoachPayload = {
          name: form.name, email: form.email,
          password: form.password, date_of_birth: dobForBackend,
          years_of_experience: form.years_of_experience ? Number(form.years_of_experience) : undefined,
          bio: form.bio || undefined,
          certification: certFile ?? undefined,
        };
        await AuthService.sendCoachCode(payload);
      }
      setRegisteredEmail(form.email);
      setStep('verify');
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  async function submitVerification() {
    if (!verifyCode.trim()) {
      setVerifyError('Please enter the 6-digit code.');
      return;
    }
    setVerifyLoading(true);
    setVerifyError('');
    try {
      await AuthService.verifyCode(registeredEmail, verifyCode.trim());
      setShowToast(true);
      setTimeout(() => {
        router.replace('/(auth)/login');
      }, 1600);
    } catch (err: unknown) {
      setVerifyError(err instanceof Error ? err.message : 'Invalid or expired code.');
    } finally {
      setVerifyLoading(false);
    }
  }

  async function resendVerificationCode() {
    try {
      await AuthService.resendCode(registeredEmail);
      Alert.alert('Code sent', 'A new verification code has been sent to your email.');
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  async function pickCertification() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png'],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (!asset.mimeType) { Alert.alert('Invalid file', 'Only PDF, JPEG, or PNG.'); return; }
      if (asset.size && asset.size > 5 * 1024 * 1024) { Alert.alert('Too large', 'Max 5 MB.'); return; }
      setCertFile({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType });
    } catch { Alert.alert('Error', 'Could not pick file.'); }
  }

  const pwStrength = passwordStrength(form.password);

  return (
    <KeyboardAvoidingView
      style={styles.shell}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {step === 'role' && (
          <View style={styles.card}>
            <View style={styles.brand}>
              <Text style={styles.brandIcon}>⚡</Text>
              <Text style={styles.brandName}>GymApp</Text>
            </View>
            <Text style={styles.cardTitle}>Join the community</Text>
            <Text style={styles.cardSub}>Choose how you'll use GymApp to get started.</Text>

            <View style={styles.roleGrid}>
              {(['athlete', 'coach'] as Role[]).map(role => (
                <TouchableOpacity
                  key={role}
                  style={[styles.roleCard, selectedRole === role && styles.roleCardActive]}
                  onPress={() => setSelectedRole(role)}
                  activeOpacity={0.75}
                >
                  {selectedRole === role && (
                    <View style={styles.roleCheck}><Text style={styles.roleCheckText}>✓</Text></View>
                  )}
                  <Text style={styles.roleEmoji}>{role === 'athlete' ? '🏃' : '🏋️'}</Text>
                  <Text style={styles.roleLabel}>{role === 'athlete' ? 'Athlete' : 'Coach'}</Text>
                  <Text style={styles.roleDesc}>
                    {role === 'athlete'
                      ? 'Track workouts, connect with coaches, and crush your goals.'
                      : 'Build your client base, create programs, grow your business.'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <PrimaryButton
              label={`Continue as ${selectedRole === 'athlete' ? 'Athlete' : selectedRole === 'coach' ? 'Coach' : '…'}`}
              onPress={() => { if (selectedRole) setStep('details'); }}
              disabled={!selectedRole}
            />
            <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={styles.switchWrap}>
              <Text style={styles.switchText}>Already have an account? <Text style={styles.switchLink}>Log in</Text></Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 'details' && (
          <View style={styles.card}>
            <TouchableOpacity onPress={() => { setStep('role'); setServerError(''); }} style={styles.backBtn}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>

            <View style={styles.brand}>
              <Text style={styles.brandIcon}>⚡</Text>
              <Text style={styles.brandName}>GymApp</Text>
            </View>
            <Text style={styles.cardTitle}>{selectedRole === 'athlete' ? 'Athlete' : 'Coach'} registration</Text>
            <Text style={styles.cardSub}>All fields marked * are required.</Text>

            <StyledInput label="Full name *" placeholder="Jane Doe"
              value={form.name} onChangeText={v => setField('name', v)}
              onBlur={() => touch('name')} error={visibleError('name')}
              autoComplete="name" containerStyle={styles.field} />

            <StyledInput label="Email address *" placeholder="jane@example.com"
              value={form.email} onChangeText={v => setField('email', v)}
              onBlur={() => touch('email')} error={visibleError('email')}
              keyboardType="email-address" autoComplete="email" containerStyle={styles.field} />

            <StyledInput label="Password *" placeholder="Min. 8 chars, 1 uppercase, 1 number"
              value={form.password} onChangeText={v => setField('password', v)}
              onBlur={() => touch('password')} error={visibleError('password')}
              isPassword containerStyle={styles.field} />

            {form.password.length > 0 && (
              <View style={styles.strengthRow}>
                <View style={[styles.strengthBar, { backgroundColor: pwStrength.color }]} />
                <Text style={[styles.strengthLabel, { color: pwStrength.color }]}>{pwStrength.label}</Text>
              </View>
            )}

            <View style={styles.field}>
              <Text style={styles.dobLabel}>Date of birth *</Text>
              <View style={styles.dobRow}>
                <Dropdown
                  label="" placeholder="Day"
                  value={form.dobDay}
                  options={DAYS.map(d => ({ label: d, value: d }))}
                  onSelect={v => { setField('dobDay', v); touch('dob'); }}
                  error={!form.dobDay && touched['dob'] ? ' ' : undefined}
                  flex={1}
                />
                <Dropdown
                  label="" placeholder="Month"
                  value={form.dobMonth}
                  options={MONTHS}
                  onSelect={v => { setField('dobMonth', v); touch('dob'); }}
                  error={!form.dobMonth && touched['dob'] ? ' ' : undefined}
                  flex={2}
                />
                <Dropdown
                  label="" placeholder="Year"
                  value={form.dobYear}
                  options={YEARS.map(y => ({ label: y, value: y }))}
                  onSelect={v => { setField('dobYear', v); touch('dob'); }}
                  error={!form.dobYear && touched['dob'] ? ' ' : undefined}
                  flex={1.5}
                />
              </View>
              {visibleError('dob') && (
                <Text style={styles.dobError}>{visibleError('dob')}</Text>
              )}
            </View>

            {selectedRole === 'coach' && (
              <>
                <View style={styles.sectionDivider}>
                  <Text style={styles.sectionLabel}>Coach details <Text style={styles.optional}>(optional)</Text></Text>
                </View>

                <StyledInput label="Years of experience" placeholder="e.g. 5"
                  value={form.years_of_experience} onChangeText={v => setField('years_of_experience', v)}
                  onBlur={() => touch('years_of_experience')} error={visibleError('years_of_experience')}
                  keyboardType="numeric" containerStyle={styles.field} />

                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Bio</Text>
                  <StyledInput label="" placeholder="Tell athletes about your coaching style…"
                    value={form.bio} onChangeText={v => setField('bio', v)}
                    onBlur={() => touch('bio')} error={visibleError('bio')}
                    multiline numberOfLines={4} hint={`${form.bio.length}/500`} />
                </View>

                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Certification document</Text>
                  {certFile ? (
                    <View style={styles.filePreview}>
                      <Text style={styles.fileIcon}>✅</Text>
                      <Text style={styles.fileName} numberOfLines={1}>{certFile.name}</Text>
                      <TouchableOpacity onPress={() => setCertFile(null)}>
                        <Text style={styles.fileRemove}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity style={styles.fileDrop} onPress={pickCertification} activeOpacity={0.75}>
                      <Text style={styles.fileIcon}>📄</Text>
                      <Text style={styles.fileDropText}>Tap to upload</Text>
                      <Text style={styles.fileFormats}>PDF, JPEG, PNG — max 5 MB</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}

            {!!serverError && (
              <View style={styles.alertError}>
                <Text style={styles.alertText}>⚠️ {serverError}</Text>
              </View>
            )}

            <PrimaryButton label="Create account" onPress={submit} loading={loading} style={styles.submitBtn} />

            <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={styles.switchWrap}>
              <Text style={styles.switchText}>Already have an account? <Text style={styles.switchLink}>Log in</Text></Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 'verify' && (
          <View style={styles.card}>
            <Text style={styles.successIcon}>📧</Text>
            <Text style={styles.cardTitle}>Check your email</Text>
            <Text style={styles.cardSub}>
              We sent a 6-digit code to{'\n'}
              <Text style={{ color: colors.text, fontWeight: '700' }}>{registeredEmail}</Text>
              {'\n\n'}Enter it below to verify your account.
            </Text>

            <StyledInput
              label="Verification code"
              placeholder="000000"
              value={verifyCode}
              onChangeText={text => setVerifyCode(text.replace(/[^0-9]/g, '').slice(0, 6))}
              error={verifyError || undefined}
              keyboardType="number-pad"
              autoComplete="one-time-code"
              containerStyle={styles.field}
            />

            <PrimaryButton
              label="Verify"
              onPress={submitVerification}
              loading={verifyLoading}
              style={styles.submitBtn}
            />

            <TouchableOpacity onPress={resendVerificationCode} style={styles.switchWrap}>
              <Text style={styles.switchText}>
                Didn't receive it?{' '}
                <Text style={styles.switchLink}>Resend code</Text>
              </Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>

      <Toast visible={showToast} message="Account verified! Redirecting to login…" />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 20, paddingVertical: 40 },

  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 24 },

  brand: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 },
  brandIcon: { fontSize: 20 },
  brandName: { fontSize: 17, fontWeight: '800', color: colors.text, letterSpacing: -0.4 },

  cardTitle: { fontSize: font.xl, fontWeight: '800', color: colors.text, letterSpacing: -0.6, marginBottom: 6 },
  cardSub: { fontSize: font.sm, color: colors.textMuted, marginBottom: 24, lineHeight: 20 },

  roleGrid: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  roleCard: { flex: 1, backgroundColor: colors.surface2, borderWidth: 2, borderColor: colors.border, borderRadius: radius.md, padding: 16, position: 'relative', gap: 6 },
  roleCardActive: { borderColor: colors.accent, backgroundColor: colors.accentDim },
  roleCheck: { position: 'absolute', top: 8, right: 8, width: 20, height: 20, backgroundColor: colors.accent, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  roleCheckText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  roleEmoji: { fontSize: 26 },
  roleLabel: { fontSize: font.base, fontWeight: '700', color: colors.text },
  roleDesc: { fontSize: 11, color: colors.textMuted, lineHeight: 16 },

  field: { marginBottom: 16 },
  fieldLabel: { fontSize: font.sm, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 },

  dobLabel: { fontSize: font.sm, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
  dobRow: { flexDirection: 'row', gap: 8 },
  dobError: { fontSize: 12, color: colors.error, marginTop: 4 },

  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, marginTop: -8 },
  strengthBar: { flex: 1, height: 3, borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontWeight: '600' },

  sectionDivider: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16, marginBottom: 16 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
  optional: { fontWeight: '400', textTransform: 'none', letterSpacing: 0 },

  fileDrop: { borderWidth: 2, borderColor: colors.border, borderStyle: 'dashed', borderRadius: radius.md, padding: 24, alignItems: 'center', gap: 4 },
  fileDropText: { fontSize: font.base, color: colors.textMuted, fontWeight: '600' },
  fileFormats: { fontSize: 11, color: colors.textHint },
  filePreview: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, padding: 12 },
  fileIcon: { fontSize: 22 },
  fileName: { flex: 1, fontSize: font.sm, color: colors.text },
  fileRemove: { fontSize: 14, color: colors.textMuted, paddingHorizontal: 6 },

  alertError: { backgroundColor: 'rgba(248,113,113,0.1)', borderWidth: 1, borderColor: 'rgba(248,113,113,0.3)', borderRadius: radius.sm, padding: 12, marginBottom: 16 },
  alertText: { color: colors.error, fontSize: font.sm, lineHeight: 20 },

  submitBtn: { marginTop: 8 },
  switchWrap: { marginTop: 16, alignItems: 'center' },
  switchText: { fontSize: font.sm, color: colors.textMuted },
  switchLink: { color: colors.accent, fontWeight: '700' },

  backBtn: { marginBottom: 20 },
  backText: { color: colors.textMuted, fontSize: font.sm },

  successIcon: { fontSize: 56, marginBottom: 16, textAlign: 'center' },
});
