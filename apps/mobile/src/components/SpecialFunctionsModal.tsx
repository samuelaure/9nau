import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { X, Zap, ChevronRight, ChevronDown } from 'lucide-react-native';
import { COLORS } from '@/constants';
import { workspacesService, NauBrand } from '@/services/WorkspacesService';

export type SpecialAction = 'PROACTIVE_COMMENT' | 'REACTIVE_COMMENT' | 'INSPO_BASE' | 'REPLICATE' | 'REPOST';

export interface SelectedBrandAction {
  brandId: string;
  brandName: string;
  actions: SpecialAction[];
}

interface SpecialFunctionsModalProps {
  visible: boolean;
  onClose: () => void;
  selectedActions: SelectedBrandAction[];
  onActionsChange: (actions: SelectedBrandAction[]) => void;
}


const AVAILABLE_ACTIONS: { id: SpecialAction; name: string; description: string; phase: number }[] = [
  { id: 'PROACTIVE_COMMENT', name: 'Add Profile (Proactive)', description: 'Monitor this profile for new posts', phase: 3 },
  { id: 'REACTIVE_COMMENT', name: 'Generate Comment (Reactive)', description: 'Generate AI response for this post', phase: 3 },
  { id: 'INSPO_BASE', name: 'Add to Inspo Base', description: 'Save hook/theming for later', phase: 7 },
  { id: 'REPLICATE', name: 'Mark for Replication', description: 'Queued to adapt into your brand', phase: 7 },
  { id: 'REPOST', name: 'Queue Repost', description: 'Schedule for cross-posting', phase: 7 },
];

export const SpecialFunctionsModal: React.FC<SpecialFunctionsModalProps> = ({
  visible,
  onClose,
  selectedActions,
  onActionsChange,
}) => {
  const [brands, setBrands] = React.useState<NauBrand[]>([]);
  const [loadingBrands, setLoadingBrands] = React.useState(false);
  const [expandedBrand, setExpandedBrand] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!visible) return;
    setLoadingBrands(true);
    workspacesService.fetchBrands().then((fetched) => {
      setBrands(fetched);
      if (fetched.length > 0 && !expandedBrand) setExpandedBrand(fetched[0].id);
    }).finally(() => setLoadingBrands(false));
  }, [visible]);

  const toggleAction = (brandId: string, brandName: string, actionId: SpecialAction) => {
    const existingBrand = selectedActions.find(a => a.brandId === brandId);
    
    let newSelected: SelectedBrandAction[];
    if (existingBrand) {
      const hasAction = existingBrand.actions.includes(actionId);
      const newActions = hasAction 
        ? existingBrand.actions.filter(a => a !== actionId)
        : [...existingBrand.actions, actionId];
      
      if (newActions.length === 0) {
        newSelected = selectedActions.filter(a => a.brandId !== brandId);
      } else {
        newSelected = selectedActions.map(a => 
          a.brandId === brandId ? { ...a, actions: newActions } : a
        );
      }
    } else {
      newSelected = [...selectedActions, { brandId, brandName, actions: [actionId] }];
    }
    
    onActionsChange(newSelected);
  };

  const isActionSelected = (brandId: string, actionId: SpecialAction) => {
    return selectedActions.find(a => a.brandId === brandId)?.actions.includes(actionId) || false;
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerTitle}>
              <Zap size={20} color={COLORS.primary} fill={COLORS.primary} />
              <Text style={styles.titleText}>Special Functions</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={24} color="#5f6368" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <Text style={styles.sectionLabel}>Apply to Brands</Text>
            {loadingBrands && (
              <ActivityIndicator size="small" color={COLORS.primary} style={{ marginBottom: 16 }} />
            )}
            {!loadingBrands && brands.length === 0 && (
              <Text style={[styles.sectionLabel, { textTransform: 'none', color: '#94a3b8', fontSize: 13, fontWeight: '400' }]}>
                No brands found. Set your naŭ User ID in Settings.
              </Text>
            )}
            {brands.map(brand => (
              <View key={brand.id} style={styles.brandCard}>
                <TouchableOpacity 
                  style={styles.brandHeader}
                  onPress={() => setExpandedBrand(expandedBrand === brand.id ? null : brand.id)}
                >
                  <View style={styles.brandInfo}>
                    <View style={[styles.brandDot, { backgroundColor: COLORS.primary }]} />
                    <Text style={styles.brandName}>{brand.name}</Text>
                    {selectedActions.find(a => a.brandId === brand.id) && (
                      <View style={styles.brandBadge}>
                        <Text style={styles.brandBadgeText}>
                          {selectedActions.find(a => a.brandId === brand.id)?.actions.length}
                        </Text>
                      </View>
                    )}
                  </View>
                  {expandedBrand === brand.id ? <ChevronDown size={20} color="#9ca3af" /> : <ChevronRight size={20} color="#9ca3af" />}
                </TouchableOpacity>

                {expandedBrand === brand.id && (
                  <View style={styles.actionsList}>
                    {AVAILABLE_ACTIONS.map(action => (
                      <TouchableOpacity 
                        key={action.id} 
                        style={styles.actionRow}
                        onPress={() => toggleAction(brand.id, brand.name, action.id)}
                      >
                        <View style={styles.actionInfo}>
                          <Text style={styles.actionName}>{action.name}</Text>
                          <Text style={styles.actionDesc}>{action.description}</Text>
                        </View>
                        <Switch
                          value={isActionSelected(brand.id, action.id)}
                          onValueChange={() => toggleAction(brand.id, brand.name, action.id)}
                          trackColor={{ false: '#f1f3f4', true: COLORS.primary + '40' }}
                          thumbColor={isActionSelected(brand.id, action.id) ? COLORS.primary : '#fff'}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            ))}

            <View style={styles.footerInfo}>
              <Text style={styles.infoText}>
                Selected actions will be processed after saving the capture.
              </Text>
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
            <Text style={styles.doneBtnText}>Apply</Text>
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
    maxHeight: '85%',
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
    fontSize: 18,
    fontWeight: '700',
    color: '#202124',
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  brandCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  brandHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  brandInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  brandName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  brandBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  brandBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  actionsList: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#f1f3f4',
    backgroundColor: '#fff',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  actionInfo: {
    flex: 1,
    paddingRight: 10,
  },
  actionName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  actionDesc: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  comingSoon: {
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  comingSoonText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#94a3b8',
  },
  footerInfo: {
    marginTop: 10,
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
  },
  infoText: {
    fontSize: 12,
    color: '#0369a1',
    lineHeight: 18,
    textAlign: 'center',
  },
  doneBtn: {
    marginHorizontal: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  doneBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
