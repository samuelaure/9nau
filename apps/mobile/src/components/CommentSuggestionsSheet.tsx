import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Clipboard,
  ToastAndroid,
  Platform,
} from 'react-native';
import { X, Copy, Check, MessageSquare } from 'lucide-react-native';
import { COLORS } from '@/constants';

interface CommentSuggestionsSheetProps {
  visible: boolean;
  onClose: () => void;
  brandName: string;
  suggestions: string[];
}

export const CommentSuggestionsSheet: React.FC<CommentSuggestionsSheetProps> = ({
  visible,
  onClose,
  brandName,
  suggestions,
}) => {
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    Clipboard.setString(text);
    setCopiedIndex(index);
    
    if (Platform.OS === 'android') {
      ToastAndroid.show('Copied to clipboard', ToastAndroid.SHORT);
    }
    
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerTitle}>
              <MessageSquare size={20} color={COLORS.primary} />
              <Text style={styles.titleText}>Suggestions for {brandName}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={24} color="#5f6368" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <Text style={styles.infoText}>
              These comments were generated based on {brandName}'s voice DNA and strategy. Tap to copy.
            </Text>

            {suggestions.map((suggestion, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.suggestionCard}
                onPress={() => copyToClipboard(suggestion, index)}
              >
                <Text style={styles.suggestionText}>{suggestion}</Text>
                <View style={styles.copyIcon}>
                  {copiedIndex === index ? (
                    <Check size={16} color={COLORS.success} />
                  ) : (
                    <Copy size={16} color="#94a3b8" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#202124',
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  infoText: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 20,
    lineHeight: 18,
  },
  suggestionCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    position: 'relative',
  },
  suggestionText: {
    fontSize: 14,
    color: '#1e293b',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 20,
    paddingRight: 24,
  },
  copyIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  doneBtn: {
    marginHorizontal: 20,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    color: '#475569',
    fontSize: 15,
    fontWeight: '700',
  },
});
