import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Menu,
  LayoutGrid,
  Clock,
  Trash2,
  X,
  RotateCcw,
  Trash,
  Settings,
  Tag as TagIcon,
  Plus,
  Inbox,
  Archive,
  Pencil,
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { FeedItem } from '@/components/FeedItem';
import { SettingsModal } from '@/components/SettingsModal';
import { CaptureModal } from '@/components/CaptureModal';
import { LabelManagementModal } from '@/components/LabelManagementModal';
import {
  getDuePosts,
  getReviewedPosts,
  getDeletedPosts,
  getAllTags,
  Post,
  untrashPost,
  deletePost,
  getUnscheduledPosts,
  getPostsByTag,
} from '@/repositories/PostRepository';
import { Label, getAllLabels } from '@/repositories/LabelRepository';
import { syncManager } from '@/services/SyncManager';
import { COLORS } from '@/constants';

type FeedTab = 'due' | 'reviewed' | 'trash' | 'unscheduled' | 'label';
const { width } = Dimensions.get('window');

export const FeedScreen = () => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<FeedTab>('due');
  const [posts, setPosts] = useState<Post[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [viewableItems, setViewableItems] = useState<Set<number>>(new Set());
  const [manualCaptureVisible, setManualCaptureVisible] = useState(false);
  const [labels, setLabels] = useState<Label[]>([]);
  const [labelsModalVisible, setLabelsModalVisible] = useState(false);

  // Pagination State
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 20;

  // Animation values for Sidebar
  const sidebarOffset = useSharedValue(-width * 0.85);
  const overlayOpacity = useSharedValue(0);

  const toggleSidebar = () => {
    const nextState = !sidebarVisible;
    setSidebarVisible(nextState);
    sidebarOffset.value = withSpring(nextState ? 0 : -width * 0.85, {
      damping: 20,
      stiffness: 90,
    });
    overlayOpacity.value = withTiming(nextState ? 1 : 0, { duration: 300 });
  };

  /**
   * Loads posts with pagination support.
   * @param isLoadMore If true, appends to existing list. If false, resets list.
   */
  const loadFeed = useCallback(async (isLoadMore = false) => {
    // Prevent loading if already loading more or if no more items
    if (isLoadMore && (isLoadingMore || !hasMore)) return;

    try {
      if (isLoadMore) {
        setIsLoadingMore(true);
      } else {
        // If refreshing or changing tabs, we might want to set refreshing state externally or just load
        // We'll trust the caller to handle UI loading states (like onRefresh)
      }

      // Calculate offset based on current posts length if loading more, else 0
      const currentOffset = isLoadMore ? posts.length : 0;

      let data: Post[] = [];
      if (activeTab === 'due') {
        data = await getDuePosts(selectedTag, LIMIT, currentOffset);
      } else if (activeTab === 'reviewed') {
        data = await getReviewedPosts(selectedTag, LIMIT, currentOffset);
      } else if (activeTab === 'trash') {
        data = await getDeletedPosts(LIMIT, currentOffset);
      } else if (activeTab === 'unscheduled') {
        data = await getUnscheduledPosts(selectedTag, LIMIT, currentOffset);
      } else if (activeTab === 'label' && selectedTag) {
        data = await getPostsByTag(selectedTag, LIMIT, currentOffset);
      }

      if (isLoadMore) {
        setPosts((prev) => [...prev, ...data]);
      } else {
        setPosts(data);
      }

      // Check if we reached the end
      if (data.length < LIMIT) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      // Always refresh tags/labels on initial load (not on load more to save bandwidth/perf)
      if (!isLoadMore) {
        const [tags, allLabels] = await Promise.all([getAllTags(), getAllLabels()]);
        setAvailableTags(tags);
        setLabels(allLabels);
      }
    } catch (error) {
      console.error('Failed to load feed:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [activeTab, selectedTag, posts.length, hasMore, isLoadingMore]);

  // Initial Load & Tab Change
  // We use a separate effect to trigger the "Reset" load when tab/tag changes
  useEffect(() => {
    // Reset state before loading
    setHasMore(true);
    // We don't necessarily need to clear posts immediately to avoid flash, but consistent behavior is better
    // loadFeed(false) will overwrite posts.
    loadFeed(false);
  }, [activeTab, selectedTag]);

  // Sync subscription
  useEffect(() => {
    syncManager.triggerSync(15000);
    const unsubscribe = syncManager.subscribe(() => {
      // On sync complete, we refresh the list (resetting to top) to show new items
      // This is the safest way to ensure consistency
      loadFeed(false);
    });
    return () => {
      unsubscribe();
      syncManager.stop();
    };
  }, []); // Only on mount

  const onRefresh = async () => {
    setRefreshing(true);
    await syncManager.performSync();
    await loadFeed(false);
    setRefreshing(false);
  };

  const handleUntrash = async (id: number) => {
    await untrashPost(id);
    // Remove locally to avoid full reload
    setPosts(current => current.filter(p => p.id !== id));
  };

  const handlePermanentDelete = async (id: number) => {
    await deletePost(id);
    setPosts(current => current.filter(p => p.id !== id));
  };

  // Called by FeedItem when it changes state (e.g. marked as done)
  // We reload to ensure list consistency, but we could optimize to remove locally.
  // For 'reviewed' -> 'done', it disappears from 'due' list.
  // Ideally we remove it from the list locally.
  const handlePostProcessed = useCallback(() => {
    // For simplicity and correctness, we reload the feed. 
    // To preserve scroll, we might want to avoid full reload, but if an item moves tabs, it should vanish.
    // If we have many items, a full reload (page 0) is annoying.
    // Let's try to just reload page 0 or just trigger a refresh.
    // For now, re-fetch the current set? No, complexity.
    // Standard approach: Reload text. 
    loadFeed(false);
  }, [loadFeed]);


  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'due':
        return 'To Review';
      case 'reviewed':
        return 'History';
      case 'trash':
        return 'Trash';
      case 'unscheduled':
        return 'Archive';
      case 'label':
        return selectedTag || 'Label';
      default:
        return '9naŭ';
    }
  };

  const handleLabelSelect = useCallback((labelName: string) => {
    setSelectedTag(labelName);
    setActiveTab('label');
    setSidebarVisible(false); // Close sidebar directly
    sidebarOffset.value = withSpring(-width * 0.85);
    overlayOpacity.value = withTiming(0);
  }, [sidebarOffset, overlayOpacity]);

  const handleTabChange = (tab: FeedTab) => {
    setActiveTab(tab);
    if (tab !== 'label') {
      setSelectedTag(null);
    }
    toggleSidebar();
  };

  // Reanimated Styles
  const sidebarStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: sidebarOffset.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
    display: overlayOpacity.value === 0 ? 'none' : 'flex',
  }));

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    const ids = new Set<number>(viewableItems.map((item: any) => item.item.id));
    setViewableItems(ids);
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 40,
  }).current;

  const renderFooter = () => {
    if (!isLoadingMore) return <View style={{ height: 50 }} />;
    return (
      <View style={styles.loaderFooter}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Sidebar Overlay */}
      <Animated.View style={[styles.overlay, overlayStyle]}>
        <TouchableOpacity style={styles.overlayFill} activeOpacity={1} onPress={toggleSidebar} />
      </Animated.View>

      {/* Sidebar Surface */}
      <Animated.View style={[styles.sidebar, sidebarStyle, { paddingTop: insets.top }]}>
        <View style={styles.sidebarHeader}>
          <View style={styles.logoBadge}>
            <Text style={styles.sidebarLogo}>naŭ</Text>
          </View>
          <TouchableOpacity onPress={toggleSidebar}>
            <X size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.sidebarContent}>
          <ScrollView contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.sidebarItem, activeTab === 'due' && styles.sidebarItemActive]}
              onPress={() => handleTabChange('due')}
            >
              <LayoutGrid size={22} color={activeTab === 'due' ? COLORS.secondary : '#4b5563'} />
              <Text
                style={[
                  styles.sidebarItemText,
                  activeTab === 'due' && { color: COLORS.secondary, fontWeight: '800' },
                ]}
              >
                To Review
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sidebarItem, activeTab === 'reviewed' && styles.sidebarItemActive]}
              onPress={() => handleTabChange('reviewed')}
            >
              <Clock size={22} color={activeTab === 'reviewed' ? COLORS.secondary : '#4b5563'} />
              <Text
                style={[
                  styles.sidebarItemText,
                  activeTab === 'reviewed' && { color: COLORS.secondary, fontWeight: '800' },
                ]}
              >
                History
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sidebarItem, activeTab === 'unscheduled' && styles.sidebarItemActive]}
              onPress={() => handleTabChange('unscheduled')}
            >
              <Archive size={22} color={activeTab === 'unscheduled' ? COLORS.secondary : '#4b5563'} />
              <Text
                style={[
                  styles.sidebarItemText,
                  activeTab === 'unscheduled' && { color: COLORS.secondary, fontWeight: '800' },
                ]}
              >
                Archive
              </Text>
            </TouchableOpacity>

            <View style={styles.sidebarDivider} />
            <View style={styles.sidebarSectionHeader}>
              <Text style={styles.sidebarSectionTitle}>LABELS</Text>
            </View>

            {labels.map((label) => (
              <TouchableOpacity
                key={label.id}
                style={[
                  styles.sidebarItem,
                  activeTab === 'label' && selectedTag === label.name && styles.sidebarItemActive,
                ]}
                onPress={() => handleLabelSelect(label.name)}
              >
                <TagIcon
                  size={22}
                  color={
                    activeTab === 'label' && selectedTag === label.name ? COLORS.secondary : '#4b5563'
                  }
                />
                <Text
                  style={[
                    styles.sidebarItemText,
                    activeTab === 'label' &&
                    selectedTag === label.name && { color: COLORS.secondary, fontWeight: '800' },
                  ]}
                >
                  {label.name}
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.sidebarItem}
              onPress={() => {
                setLabelsModalVisible(true);
                toggleSidebar();
              }}
            >
              <Pencil size={22} color="#4b5563" />
              <Text style={styles.sidebarItemText}>Edit labels</Text>
            </TouchableOpacity>
            <View style={styles.sidebarDivider} />
          </ScrollView>
        </View>

        <View style={styles.sidebarFooter}>
          <TouchableOpacity
            style={[styles.sidebarItem, activeTab === 'trash' && styles.sidebarItemActive]}
            onPress={() => handleTabChange('trash')}
          >
            <Trash2 size={22} color={activeTab === 'trash' ? COLORS.error : '#4b5563'} />
            <Text
              style={[
                styles.sidebarItemText,
                activeTab === 'trash' && { color: COLORS.error, fontWeight: '800' },
              ]}
            >
              Trash
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sidebarItem}
            onPress={() => {
              setSettingsVisible(true);
              toggleSidebar();
            }}
          >
            <Settings size={22} color="#4b5563" />
            <Text style={styles.sidebarItemText}>Settings</Text>
          </TouchableOpacity>
        </View>
      </Animated.View >

      {/* Top Bar */}
      < View style={[styles.topBar, { paddingTop: insets.top + 10 }]} >
        <TouchableOpacity style={styles.topBarSide} onPress={toggleSidebar}>
          <Menu size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.logo}>{getHeaderTitle()}</Text>
        <View style={styles.topBarSide} />
      </View >

      {activeTab !== 'trash' && availableTags.length > 0 && (
        <View style={styles.tagBarContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tagScroll}
          >
            <TouchableOpacity
              onPress={() => setSelectedTag(null)}
              style={[styles.tagChip, !selectedTag && styles.tagChipActive]}
            >
              <Text style={[styles.tagChipText, !selectedTag && styles.tagChipTextActive]}>
                All
              </Text>
            </TouchableOpacity>
            {availableTags.map((tag) => (
              <TouchableOpacity
                key={tag}
                onPress={() => setSelectedTag(tag)}
                style={[styles.tagChip, selectedTag === tag && styles.tagChipActive]}
              >
                <TagIcon
                  size={12}
                  color={selectedTag === tag ? '#fff' : '#64748b'}
                  style={{ marginRight: 4 }}
                />
                <Text style={[styles.tagChipText, selectedTag === tag && styles.tagChipTextActive]}>
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {
        activeTab === 'trash' ? (
          <FlatList
            key="trash-list"
            data={posts}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.trashCard}>
                <View style={styles.trashInfo}>
                  <Text style={styles.trashTitle}>{item.title || 'Untitled Capture'}</Text>
                  <Text style={styles.trashDate}>Deleted on {item.deleted_at}</Text>
                </View>
                <View style={styles.trashActions}>
                  <TouchableOpacity style={styles.untrashBtn} onPress={() => handleUntrash(item.id)}>
                    <RotateCcw size={18} color="#16a34a" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.permaDeleteBtn}
                    onPress={() => handlePermanentDelete(item.id)}
                  >
                    <Trash size={18} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Trash2 size={48} color="#e2e8f0" />
                <Text style={styles.emptyText}>Trash is empty</Text>
              </View>
            }
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            onEndReached={() => loadFeed(true)}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews={true}
          />
        ) : (
          <FlatList
            key="feed-list"
            data={posts}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <FeedItem
                post={item}
                onUpdate={(id, changes) => {
                  setPosts((current) =>
                    current.map((p) => (p.id === id ? { ...p, ...changes } : p))
                  );
                }}
                onRemove={(id) => {
                  setPosts((current) => current.filter((p) => p.id !== id));
                }}
                onProcessed={handlePostProcessed} // Keep as fallback for complex reloads
                isHistory={activeTab === 'reviewed'}
                isVisible={viewableItems.has(item.id)}
                onLabelClick={handleLabelSelect}
              />
            )}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            ListEmptyComponent={
              <View style={styles.empty}>
                <LayoutGrid size={48} color="#e2e8f0" />
                <Text style={styles.emptyText}>No captures yet</Text>
                <Text style={styles.emptySubText}>
                  Share an Instagram post or Reel to Learning Loop to see it here.
                </Text>
              </View>
            }
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            onEndReached={() => loadFeed(true)}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews={true}
          />
        )
      }

      {
        settingsVisible && (
          <SettingsModal visible={settingsVisible} onClose={() => setSettingsVisible(false)} />
        )
      }

      {
        manualCaptureVisible && (
          <CaptureModal
            shareValue=""
            onClose={() => {
              setManualCaptureVisible(false);
              loadFeed(false);
            }}
            isShareIntent={false}
          />
        )
      }

      {/* Floating Action Button */}
      {
        activeTab === 'due' && (
          <TouchableOpacity
            style={[styles.fab, { bottom: insets.bottom + 20 }]}
            onPress={() => setManualCaptureVisible(true)}
            activeOpacity={0.8}
          >
            <Plus size={28} color="#fff" />
          </TouchableOpacity>
        )
      }

      {
        labelsModalVisible && (
          <LabelManagementModal
            visible={labelsModalVisible}
            onClose={() => setLabelsModalVisible(false)}
            onLabelsChanged={() => loadFeed(false)}
          />
        )
      }
    </View >
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    flex: 1,
  },
  empty: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    marginTop: 100,
    padding: 40,
  },
  emptySubText: {
    color: '#6b7280',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyText: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
  },
  fab: {
    alignItems: 'center',
    backgroundColor: '#7c7cff',
    borderRadius: 30,
    elevation: 8,
    height: 60,
    justifyContent: 'center',
    position: 'absolute',
    right: 20,
    shadowColor: '#7c7cff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    width: 60,
    zIndex: 999,
  },
  loaderFooter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  logo: {
    color: '#3b0764',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  logoBadge: {
    backgroundColor: '#3b0764',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1000,
  },
  overlayFill: {
    flex: 1,
  },
  permaDeleteBtn: {
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 8,
  },
  sidebar: {
    backgroundColor: '#fff',
    bottom: 0,
    elevation: 10,
    left: 0,
    paddingHorizontal: 20,
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    top: 0,
    width: width * 0.85,
    zIndex: 1001,
  },
  sidebarContent: {
    flex: 1,
    paddingTop: 20,
  },
  sidebarDivider: {
    backgroundColor: '#f3f4f6',
    height: 1,
    marginVertical: 8,
  },
  sidebarFooter: {
    borderTopColor: '#f3f4f6',
    borderTopWidth: 1,
    paddingBottom: 40,
    paddingTop: 10,
  },
  sidebarHeader: {
    alignItems: 'center',
    borderBottomColor: '#f3f4f6',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 30,
  },
  sidebarItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 15,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 15,
  },
  sidebarItemActive: {
    backgroundColor: '#f5f3ff',
    borderRadius: 12,
  },
  sidebarItemText: {
    color: '#4b5563',
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  sidebarLogo: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -1,
  },
  sidebarSectionHeader: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sidebarSectionTitle: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tagBarContainer: {
    backgroundColor: '#fff',
    borderBottomColor: '#f1f5f9',
    borderBottomWidth: 1,
  },
  tagChip: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagChipActive: {
    backgroundColor: '#3b0764',
    borderColor: '#3b0764',
  },
  tagChipText: {
    color: '#4b5563',
    fontSize: 12,
    fontWeight: '600',
  },
  tagChipTextActive: {
    color: '#fff',
  },
  tagScroll: {
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  topBar: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomColor: '#f3f4f6',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 15,
    paddingHorizontal: 16,
  },
  topBarSide: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    width: 40,
  },
  trashActions: {
    flexDirection: 'row',
    gap: 15,
  },
  trashCard: {
    alignItems: 'center',
    borderBottomColor: '#f1f5f9',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  trashDate: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
  },
  trashInfo: {
    flex: 1,
  },
  trashTitle: {
    color: '#1e293b',
    fontSize: 16,
    fontWeight: '700',
  },
  untrashBtn: {
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    padding: 8,
  },
});
