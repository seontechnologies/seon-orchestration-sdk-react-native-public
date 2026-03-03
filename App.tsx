/**
 * SEON Identity Verification — Sample App
 *
 * Demonstrates how to integrate seon-react-native-orchestration for
 * identity verification flows on iOS and Android.
 *
 * @format
 */

import React, { useState, useCallback } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import {
  initialize,
  startVerification,
  SeonVerificationStatus,
  SeonErrorCode,
  type SeonVerificationResult,
} from '@seontechnologies/seon-react-native-orchestration';

// ─── Regional base URLs ────────────────────────────────────────────────────────
const BASE_URLS = {
  EU: 'https://api.seon.io/orchestration-api/',
  US: 'https://api.us-east-1-main.seon.io/orchestration-api/',
  APAC: 'https://api.ap-southeast-1-main.seon.io/orchestration-api/',
};

type Region = keyof typeof BASE_URLS;
type AppState = 'idle' | 'initializing' | 'verifying' | 'done';

interface ResultDisplay {
  result: SeonVerificationResult;
  timestamp: Date;
}

// ─── Status metadata ───────────────────────────────────────────────────────────
const STATUS_META: Record<SeonVerificationStatus, { label: string; color: string; icon: string }> =
  {
    [SeonVerificationStatus.completedSuccess]: {
      label: 'Verification Passed',
      color: '#22C55E',
      icon: '✓',
    },
    [SeonVerificationStatus.completedPending]: {
      label: 'Pending Manual Review',
      color: '#F59E0B',
      icon: '⏳',
    },
    [SeonVerificationStatus.completedFailed]: {
      label: 'Verification Failed',
      color: '#EF4444',
      icon: '✗',
    },
    [SeonVerificationStatus.completed]: {
      label: 'Verification Completed',
      color: '#3B82F6',
      icon: '✓',
    },
    [SeonVerificationStatus.interruptedByUser]: {
      label: 'Cancelled by User',
      color: '#6B7280',
      icon: '↩',
    },
    [SeonVerificationStatus.missingLocationPermission]: {
      label: 'Location Permission Required',
      color: '#F97316',
      icon: '📍',
    },
    [SeonVerificationStatus.error]: {
      label: 'Error Occurred',
      color: '#DC2626',
      icon: '!',
    },
  };

// ─── RegionPill ────────────────────────────────────────────────────────────────
function RegionPill({
  region,
  selected,
  onPress,
}: {
  region: Region;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.regionPill, selected && styles.regionPillSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.regionPillText, selected && styles.regionPillTextSelected]}>
        {region}
      </Text>
    </TouchableOpacity>
  );
}

// ─── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [region, setRegion] = useState<Region>('EU');
  const [token, setToken] = useState('');
  const [language, setLanguage] = useState('en');
  const [appState, setAppState] = useState<AppState>('idle');
  const [statusMessage, setStatusMessage] = useState('Enter your token to begin');
  const [resultDisplay, setResultDisplay] = useState<ResultDisplay | null>(null);

  const handleVerification = useCallback(async () => {
    if (!token.trim()) {
      Alert.alert('Token Required', 'Please enter your session token to proceed.');
      return;
    }

    setAppState('initializing');
    setStatusMessage('Initializing SDK…');
    setResultDisplay(null);

    try {
      // Step 1: Initialize
      const initConfig = {
        baseUrl: BASE_URLS[region],
        token: token.trim(),
        language: language.trim() || 'en',
      };
      console.log('[SEON] initialize() called with:', JSON.stringify(initConfig));
      await initialize(initConfig);
      console.log('[SEON] initialize() succeeded');

      // Step 2: Start verification
      setAppState('verifying');
      setStatusMessage('Launching verification flow…');

      const result = await startVerification();

      setAppState('done');
      setResultDisplay({ result, timestamp: new Date() });
      setStatusMessage(STATUS_META[result.status]?.label ?? result.status);

      // Handle result
      switch (result.status) {
        case SeonVerificationStatus.completedSuccess:
          Alert.alert('Identity Verified', 'Your identity has been successfully verified.');
          break;
        case SeonVerificationStatus.completedPending:
          Alert.alert(
            'Under Review',
            'Your submission is under review. You will be notified once a decision is made.',
          );
          break;
        case SeonVerificationStatus.completedFailed:
          Alert.alert(
            'Verification Failed',
            'We could not verify your identity. Please try again or contact support.',
          );
          break;
        case SeonVerificationStatus.interruptedByUser:
          setAppState('idle');
          setStatusMessage('Verification cancelled. Tap below to try again.');
          setResultDisplay(null);
          break;
        case SeonVerificationStatus.missingLocationPermission:
          Alert.alert(
            'Location Required',
            'Location access is required for fraud prevention. Please enable it in your device settings.',
            [
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
              { text: 'Cancel' },
            ],
          );
          break;
        case SeonVerificationStatus.error:
          Alert.alert('Error', result.errorMessage || 'An unexpected error occurred.');
          break;
      }
    } catch (error: any) {
      console.log('[SEON] Error caught:', JSON.stringify({
        code: error?.code,
        message: error?.message,
        nativeStackAndroid: error?.nativeStackAndroid,
      }));
      setAppState('idle');
      const code: string = error?.code ?? '';
      let message = error?.message ?? 'An unexpected error occurred.';

      if (code === SeonErrorCode.E_NOT_INITIALIZED) {
        message = 'SDK not initialized. Please try again.';
      } else if (code === SeonErrorCode.E_INITIALIZATION_FAILED) {
        message = 'Initialization failed. Check your token and base URL.';
      } else if (code === SeonErrorCode.E_VERIFICATION_IN_PROGRESS) {
        message = 'A verification is already in progress.';
      }

      setStatusMessage('Failed. Check your configuration and try again.');
      Alert.alert('Error', message);
    }
  }, [region, token, language]);

  const isLoading = appState === 'initializing' || appState === 'verifying';
  const meta = resultDisplay ? STATUS_META[resultDisplay.result.status] : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLogo}>
          <Text style={styles.headerLogoText}>S</Text>
        </View>
        <View>
          <Text style={styles.headerTitle}>SEON Identity Verification</Text>
          <Text style={styles.headerSubtitle}>seon-react-native-orchestration</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Configuration Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Configuration</Text>

          <Text style={styles.fieldLabel}>Region</Text>
          <View style={styles.regionRow}>
            {(Object.keys(BASE_URLS) as Region[]).map((r) => (
              <RegionPill
                key={r}
                region={r}
                selected={region === r}
                onPress={() => !isLoading && setRegion(r)}
              />
            ))}
          </View>
          <Text style={styles.fieldHint}>{BASE_URLS[region]}</Text>

          <Text style={styles.fieldLabel}>
            Session Token <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, isLoading && styles.inputDisabled]}
            value={token}
            onChangeText={setToken}
            placeholder="Paste your workflow token here"
            placeholderTextColor={COLORS.placeholder}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            editable={!isLoading}
          />
          <Text style={styles.fieldHint}>
            Obtain this token from your backend after authenticating the user's session.
          </Text>

          <Text style={styles.fieldLabel}>Language</Text>
          <TextInput
            style={[styles.input, isLoading && styles.inputDisabled]}
            value={language}
            onChangeText={setLanguage}
            placeholder="en"
            placeholderTextColor={COLORS.placeholder}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={5}
            editable={!isLoading}
          />
          <Text style={styles.fieldHint}>
            ISO 639-1 code (e.g. en, de, fr). Defaults to device locale if empty.
          </Text>
        </View>

        {/* Status Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Status</Text>
          <View style={styles.statusRow}>
            {isLoading ? (
              <ActivityIndicator color={COLORS.primary} size="small" style={styles.statusIcon} />
            ) : (
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: meta ? meta.color : COLORS.neutral },
                ]}
              />
            )}
            <Text style={styles.statusMessage}>{statusMessage}</Text>
          </View>
        </View>

        {/* Result Card */}
        {resultDisplay && meta && (
          <View style={[styles.card, styles.resultCard, { borderLeftColor: meta.color }]}>
            <View style={styles.resultHeader}>
              <View style={[styles.resultIconBadge, { backgroundColor: meta.color }]}>
                <Text style={styles.resultIconText}>{meta.icon}</Text>
              </View>
              <View style={styles.resultHeaderText}>
                <Text style={styles.resultStatus}>{meta.label}</Text>
                <Text style={styles.resultTimestamp}>
                  {resultDisplay.timestamp.toLocaleTimeString()}
                </Text>
              </View>
            </View>

            <View style={styles.resultRow}>
              <Text style={styles.resultKey}>Status</Text>
              <Text style={styles.resultValue}>{resultDisplay.result.status}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultKey}>Platform</Text>
              <Text style={styles.resultValue}>
                {Platform.OS === 'ios' ? 'iOS' : 'Android'} {Platform.Version}
              </Text>
            </View>
            {resultDisplay.result.errorMessage && (
              <View style={styles.resultRow}>
                <Text style={styles.resultKey}>Error</Text>
                <Text style={[styles.resultValue, { color: '#DC2626' }]}>
                  {resultDisplay.result.errorMessage}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Text style={styles.infoBannerTitle}>Before you start</Text>
          <Text style={styles.infoBannerItem}>
            • Use a real physical device — the SDK detects simulators/emulators.
          </Text>
          <Text style={styles.infoBannerItem}>
            • Grant camera, microphone, and location permissions when prompted.
          </Text>
          <Text style={styles.infoBannerItem}>
            • Have a valid government-issued photo ID ready.
          </Text>
          <Text style={styles.infoBannerItem}>
            • Ensure a stable internet connection before starting.
          </Text>
        </View>
      </ScrollView>

      {/* CTA */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.ctaButton, isLoading && styles.ctaButtonDisabled]}
          onPress={handleVerification}
          disabled={isLoading}
          activeOpacity={0.85}
        >
          {isLoading ? (
            <View style={styles.ctaRow}>
              <ActivityIndicator color="#FFF" size="small" />
              <Text style={[styles.ctaText, { marginLeft: 10 }]}>
                {appState === 'initializing' ? 'Initializing…' : 'Verifying…'}
              </Text>
            </View>
          ) : (
            <Text style={styles.ctaText}>Start Verification</Text>
          )}
        </TouchableOpacity>

        {appState === 'done' && resultDisplay && (
          <TouchableOpacity
            style={styles.resetButton}
            onPress={() => {
              setAppState('idle');
              setResultDisplay(null);
              setStatusMessage('Enter your token to begin');
            }}
          >
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

// ─── Design tokens ─────────────────────────────────────────────────────────────
const COLORS = {
  primary: '#1E40AF',
  background: '#F1F5F9',
  card: '#FFFFFF',
  text: '#0F172A',
  subtext: '#64748B',
  placeholder: '#94A3B8',
  border: '#E2E8F0',
  neutral: '#CBD5E1',
};

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.primary },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerLogo: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLogoText: { color: '#FFF', fontSize: 22, fontWeight: '800' },
  headerTitle: { color: '#FFF', fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
  headerSubtitle: { color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 1 },
  scroll: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: 16, paddingBottom: 8 },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 8, marginTop: 4 },
  required: { color: '#EF4444' },
  regionRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  regionPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  regionPillSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  regionPillText: { fontSize: 13, fontWeight: '600', color: COLORS.subtext },
  regionPillTextSelected: { color: '#FFF' },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
  },
  inputDisabled: { opacity: 0.5 },
  fieldHint: { fontSize: 11, color: COLORS.subtext, marginTop: 5, marginBottom: 12, lineHeight: 16 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusIcon: { width: 20, height: 20 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusMessage: { flex: 1, fontSize: 14, color: COLORS.text, lineHeight: 20 },
  resultCard: { borderLeftWidth: 4 },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  resultIconBadge: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  resultIconText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  resultHeaderText: { flex: 1 },
  resultStatus: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  resultTimestamp: { fontSize: 12, color: COLORS.subtext, marginTop: 2 },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  resultKey: { fontSize: 12, color: COLORS.subtext, fontWeight: '500', flex: 1 },
  resultValue: { fontSize: 12, color: COLORS.text, fontWeight: '600', flex: 2, textAlign: 'right' },
  infoBanner: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  infoBannerTitle: { fontSize: 13, fontWeight: '700', color: COLORS.primary, marginBottom: 8 },
  infoBannerItem: { fontSize: 12, color: '#1E40AF', lineHeight: 20 },
  footer: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 8 : 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 8,
  },
  ctaButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  ctaButtonDisabled: { backgroundColor: COLORS.subtext, shadowOpacity: 0, elevation: 0 },
  ctaRow: { flexDirection: 'row', alignItems: 'center' },
  ctaText: { color: '#FFF', fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },
  resetButton: {
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  resetText: { color: COLORS.subtext, fontSize: 15, fontWeight: '600' },
});
