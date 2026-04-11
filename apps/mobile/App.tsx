import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ShareIntentProvider, useShareIntentContext } from '@/context/ShareIntentContext';
import { FeedScreen } from '@/screens/FeedScreen';
import { CaptureModal } from '@/components/CaptureModal';
import { initDb } from '@/db';
import { COLORS } from '@/constants';

const MainLayout = ({ isCapture }: { isCapture?: boolean }) => {
  const { hasShareIntent, value, resetShareIntent } = useShareIntentContext();

  useEffect(() => {
    if (isCapture) {
      console.log(
        '[MainLayout] Running in Capture Mode. hasIntent:',
        hasShareIntent,
        'value:',
        value,
      );
    }
  }, [isCapture, hasShareIntent, value]);

  /**
   * If we are in CaptureActivity (isCapture is true), we MUST show either
   * the CaptureModal or a loading state. We never show the FeedScreen here.
   */
  if (isCapture) {
    return (
      <View style={styles.shareOverlay}>
        <StatusBar style="dark" />
        {hasShareIntent ? (
          <CaptureModal shareValue={value || ''} onClose={resetShareIntent} isShareIntent={true} />
        ) : (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Waiting for share intent...</Text>
            {/* Fail-safe button for debugging */}
            <TouchableOpacity
              style={{ marginTop: 20, padding: 10, backgroundColor: '#eee', borderRadius: 8 }}
              onPress={() =>
                console.log('Current state - hasIntent:', hasShareIntent, 'value:', value)
              }
            >
              <Text style={{ color: '#666' }}>Log State</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  // Normal app flow
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <FeedScreen />
    </View>
  );
};

export default function App(props: any) {
  useEffect(() => {
    console.log('[App] Initial Props:', props);
    initDb().catch((err) => {
      console.error('CRITICAL: DB Init Error:', err);
    });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ShareIntentProvider>
          <MainLayout isCapture={props?.isCapture} />
        </ShareIntentProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent', // Root should be transparent for CaptureActivity
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    flex: 1,
    justifyContent: 'center', // Slight white overlay while loading
  },
  loadingText: {
    color: '#666',
    fontSize: 14,
    marginTop: 12,
  },
  shareOverlay: {
    backgroundColor: 'transparent',
    flex: 1,
  },
});
