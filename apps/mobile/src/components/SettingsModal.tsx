import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  FlatList,
} from 'react-native';
import { X, Globe, Database, Trash2, RefreshCcw, Clock, FileText, Bug } from 'lucide-react-native';
import { getSetting, setSetting } from '@/repositories/SettingsRepository';
import { getStandbyPosts, resetSyncForManualRetry } from '@/repositories/PostRepository';
import { SYNC_POLLING_INTERVAL, COLORS } from '@/constants';
import { DEFAULT_FREQUENCY_CHAIN } from '@/services/FrequencyService';
import { syncManager } from '@/services/SyncManager';
import { MediaCacheService } from '@/services/MediaCacheService';
import { BackupService } from '@/services/BackupService';
import { logger } from '@/services/LogService';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SettingsModal = ({ visible, onClose }: SettingsModalProps) => {
  const [apifyToken, setApifyToken] = useState('');
  const [frequencyChain, setFrequencyChain] = useState('');
  const [isClearing, setIsClearing] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [standbyCount, setStandbyCount] = useState(0);
  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState(logger.getLogs());

  const loadStandbyCount = async () => {
    try {
      const standby = await getStandbyPosts();
      setStandbyCount(standby.length);
    } catch (e) {
      console.error('Failed to load standby count:', e);
    }
  };

  useEffect(() => {
    if (visible) {
      getSetting('apify_api_token').then((val) => setApifyToken(val || ''));
      getSetting('frequency_chain').then((val) => setFrequencyChain(val || DEFAULT_FREQUENCY_CHAIN.join(', ')));
      loadStandbyCount();
    }
  }, [visible]);

  useEffect(() => {
    if (showLogs) {
      const unsubscribe = logger.subscribe(() => {
        setLogs([...logger.getLogs()]);
      });
      return unsubscribe;
    }
  }, [showLogs]);

  const handleSave = async () => {
    await setSetting('apify_api_token', apifyToken);
    await setSetting('frequency_chain', frequencyChain);
    onClose();
  };

  const handleClearCache = async () => {
    Alert.alert(
      'Clear Media Cache?',
      'All downloaded images and videos will be removed. They will be background-downloaded again when you view them in the feed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setIsClearing(true);
            try {
              await MediaCacheService.clearCache();
            } finally {
              setIsClearing(false);
            }
          },
        },
      ],
    );
  };

  const handleManualRecovery = async () => {
    if (standbyCount === 0) {
      Alert.alert('Manual Recovery', 'No captures are currently in standby.');
      return;
    }

    setIsRecovering(true);
    try {
      const standbyPosts = await getStandbyPosts();
      const currentToken = await getSetting('apify_api_token');
      if (!currentToken) throw new Error('Apify API Token not configured');

      logger.log(`[Recovery] Querying Apify for ${standbyPosts.length} standby items...`);

      setStandbyCount(standbyPosts.length);

      let recovered = 0;
      let failed = 0;

      for (const p of standbyPosts) {
        try {
          await resetSyncForManualRetry([p.id]);
          recovered++;
        } catch (e) {
          failed++;
        }
      }

      syncManager.triggerSync();

      Alert.alert(
        'Recovery Triggered',
        `${recovered} captures have been queued for processing. They will appear in the feed as they finish.`,
      );
      loadStandbyCount();
    } catch (e: any) {
      Alert.alert('Recovery Failed', e.message || 'Check your connection and webhook URL.');
    } finally {
      setIsRecovering(false);
    }
  };

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      await BackupService.exportDatabase();
    } finally {
      setIsBackingUp(false);
    }
  };

  if (showLogs) {
    return (
      <Modal visible={visible} animationType="slide" transparent onRequestClose={() => setShowLogs(false)}>
        <View style={styles.overlay}>
          <View style={[styles.container, styles.card, { padding: 0 }]}>
            <View style={[styles.header, { padding: 20, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }]}>
              <Text style={styles.title}>System Logs</Text>
              <View style={{ flexDirection: 'row', gap: 15 }}>
                <TouchableOpacity onPress={() => logger.clear()}>
                  <Trash2 size={20} color={COLORS.error} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowLogs(false)}>
                  <X size={24} color={COLORS.dark} />
                </TouchableOpacity>
              </View>
            </View>
            <FlatList
              data={logs}
              keyExtractor={(_, index) => index.toString()}
              contentContainerStyle={{ padding: 20 }}
              renderItem={({ item }) => (
                <View style={[styles.logItem, item.level === 'error' && styles.logItemError]}>
                  <Text style={styles.logTime}>{new Date(item.timestamp).toLocaleTimeString()}</Text>
                  <Text style={[styles.logLevel, item.level === 'error' && { color: COLORS.error }]}>{item.level.toUpperCase()}</Text>
                  <Text style={styles.logMessage}>{item.message}</Text>
                  {item.data && (
                    <Text style={styles.logData}>{JSON.stringify(item.data, null, 2)}</Text>
                  )}
                </View>
              )}
              ListEmptyComponent={<Text style={styles.emptyLogs}>No logs recorded yet.</Text>}
            />
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.title}>Configuration</Text>
              <TouchableOpacity onPress={onClose}>
                <X size={24} color={COLORS.dark} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              <View style={styles.content}>
                {/* API Settings */}
                <Text style={styles.label}>Apify API Token</Text>
                <View style={styles.inputContainer}>
                  <Globe size={18} color={COLORS.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="apify_api_..."
                    value={apifyToken}
                    onChangeText={setApifyToken}
                    autoCapitalize="none"
                    autoCorrect={false}
                    secureTextEntry
                  />
                </View>

                <View style={styles.sectionDivider} />
                <Text style={styles.label}>Frequency Levels Chain</Text>
                <View style={[styles.inputContainer, styles.textAreaContainer]}>
                  <Clock size={18} color={COLORS.textSecondary} style={[styles.inputIcon, { marginTop: 12 }]} />
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="1 day, 2 days, 1 week..."
                    value={frequencyChain}
                    onChangeText={setFrequencyChain}
                    multiline
                    numberOfLines={3}
                  />
                </View>
                <Text style={styles.helpText}>
                  Define the levels for "More" and "Less" buttons. Must be in increasing order.
                  Units: days, weeks, months, years.
                </Text>

                {/* Storage Settings */}
                <View style={styles.sectionDivider} />
                <Text style={styles.label}>Media Management</Text>
                <TouchableOpacity
                  style={styles.dangerActionBtn}
                  onPress={handleClearCache}
                  disabled={isClearing}
                >
                  <Database size={18} color={COLORS.error} style={styles.inputIcon} />
                  <Text style={styles.dangerActionText}>
                    {isClearing ? 'Clearing...' : 'Clear Media Cache'}
                  </Text>
                  <Trash2 size={16} color={COLORS.error} style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>
                <Text style={styles.helpText}>
                  Clearing the cache frees up local storage. Media is automatically re-downloaded when
                  needed.
                </Text>

                {/* Sync Recovery */}
                <View style={styles.sectionDivider} />
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Sync Recovery</Text>
                  {standbyCount > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{standbyCount}</Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  style={[styles.actionBtn, standbyCount === 0 && styles.disabledBtn]}
                  onPress={handleManualRecovery}
                  disabled={isRecovering || standbyCount === 0}
                >
                  <RefreshCcw
                    size={18}
                    color={standbyCount > 0 ? COLORS.secondary : COLORS.textSecondary}
                    style={[styles.inputIcon, isRecovering && styles.rotate]}
                  />
                  <Text style={[styles.actionBtnText, standbyCount === 0 && styles.disabledText]}>
                    {isRecovering ? 'Processing...' : 'Retry Standby Captures'}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.helpText}>
                  {standbyCount > 0
                    ? `There are ${standbyCount} captures in standby after failing to process. Tap to retry them.`
                    : 'All captures are processing normally or are fully synced. Manual recovery can fix stuck processing tasks.'}
                </Text>

                {/* Data Management */}
                <View style={styles.sectionDivider} />
                <Text style={styles.label}>Data Management</Text>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={handleBackup}
                  disabled={isBackingUp}
                >
                  <Database size={18} color={COLORS.primary} style={styles.inputIcon} />
                  <Text style={styles.actionBtnText}>
                    {isBackingUp ? 'Exporting...' : 'Backup Data'}
                  </Text>
                </TouchableOpacity>

                {/* Logs */}
                <View style={styles.sectionDivider} />
                <Text style={styles.label}>Debugging</Text>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => setShowLogs(true)}
                >
                  <Bug size={18} color={COLORS.textSecondary} style={styles.inputIcon} />
                  <Text style={[styles.actionBtnText, { color: COLORS.textSecondary }]}>
                    View System Logs
                  </Text>
                </TouchableOpacity>

                <View style={styles.sectionDivider} />

                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                  <Text style={styles.saveBtnText}>Save Settings</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  actionBtn: {
    alignItems: 'center',
    backgroundColor: '#f5f3ff',
    borderColor: '#e0e7ff',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  actionBtnText: {
    color: COLORS.secondary,
    fontSize: 14,
    fontWeight: '600',
  },
  badge: {
    alignItems: 'center',
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    elevation: 5,
    maxHeight: '90%',
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10, // Ensure it fits on screen
  },
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    gap: 12,
  },
  dangerActionBtn: {
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderColor: '#fee2e2',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dangerActionText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledBtn: {
    backgroundColor: '#f9fafb',
    borderColor: '#f3f4f6',
  },
  disabledText: {
    color: '#9ca3af',
  },
  emptyLogs: {
    color: '#9ca3af',
    fontStyle: 'italic',
    marginTop: 20,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  helpText: {
    color: '#6b7280',
    fontSize: 12,
    lineHeight: 18,
  },
  input: {
    color: '#111827',
    flex: 1,
    fontSize: 14,
    paddingVertical: 12,
  },
  inputContainer: {
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  label: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  labelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  logData: {
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    color: '#475569',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 10,
    marginTop: 4,
    padding: 4,
  },
  logItem: {
    borderBottomColor: '#f1f5f9',
    borderBottomWidth: 1,
    marginBottom: 8,
    paddingBottom: 8,
  },
  logItemError: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
    borderRadius: 8,
    borderWidth: 1,
    padding: 8,
  },
  logLevel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 2,
  },
  logMessage: {
    color: '#1e293b',
    fontSize: 13,
  },
  logTime: {
    color: '#94a3b8',
    fontSize: 10,
    marginBottom: 2,
  },
  overlay: {
    backgroundColor: COLORS.overlay,
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  rotate: {
    // Note: React Native doesn't support rotation animation in styles alone easily without Animated.
    // For now, it will just stay static but we could add animation later if needed.
  },
  saveBtn: {
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    marginTop: 12,
    padding: 16,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  sectionDivider: {
    backgroundColor: '#f3f4f6',
    height: 1,
    marginVertical: 4,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  textAreaContainer: {
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
  },
});
