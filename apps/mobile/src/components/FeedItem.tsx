import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Animated,
  TextInput,
  Modal,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import {
  TapGestureHandler,
  LongPressGestureHandler,
  State,
  GestureHandlerRootView,
  TapGestureHandlerStateChangeEvent,
  LongPressGestureHandlerStateChangeEvent,
} from 'react-native-gesture-handler';
import {
  Volume2,
  VolumeX,
  Play,
  MoreHorizontal,
  CheckCircle2,
  DownloadCloud,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  Check,
  StickyNote,
  User,
  RefreshCw,
  RotateCw,
  Undo2,
  CalendarOff,
  Plus,
} from 'lucide-react-native';
import { TagPickerModal } from './TagPickerModal';
import { MediaCacheService } from '@/services/MediaCacheService';
import { syncManager } from '@/services/SyncManager';
import { formatDaysToFrequency, getFrequencyChain, parseFrequencyToDays } from '@/services/FrequencyService';
import {
  Post,
  MediaItem,
  markPostAsReviewed,
  updatePostNote,
  updatePostTitle,
  moveToTrash,
  resetPostForRedownload,
  unmarkPostAsReviewed,
  updatePostFrequency,
  updatePostInterval,
  updatePostTags,
} from '@/repositories/PostRepository';
import { COLORS } from '@/constants';

const { width } = Dimensions.get('window');

interface FeedItemProps {
  post: Post;
  onProcessed?: () => void; // Deprecated, kept for backward compat if needed or complex cases
  onUpdate?: (id: number, changes: Partial<Post>) => void;
  onRemove?: (id: number) => void;
  isHistory?: boolean;
  isVisible?: boolean;
  onLabelClick?: (label: string) => void;
}

export const FeedItem = React.memo(({ post, onProcessed, onUpdate, onRemove, isHistory, isVisible, onLabelClick }: FeedItemProps) => {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [isUpdating, setIsUpdating] = useState(false);
  const [retrySeed, setRetrySeed] = useState(0);

  // Unified Editing Mode
  const [isEditing, setIsEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState(post.title || '');
  const [noteDraft, setNoteDraft] = useState(post.content || '');
  const [showOriginalCaption, setShowOriginalCaption] = useState(false);
  const [draftInterval, setDraftInterval] = useState(post.sm2_interval);

  // Menu State
  const [menuVisible, setMenuVisible] = useState(false);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [mediaAspectRatio, setMediaAspectRatio] = useState(1);
  const [showFreqModal, setShowFreqModal] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [freqChain, setFreqChain] = useState<string[]>([]);

  const isSimpleNote = !post.instagramUrl;

  const saveTimeout = useRef<NodeJS.Timeout | null>(null);
  const freqSaveTimeout = useRef<NodeJS.Timeout | null>(null);
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  // Track if we need to blur properly
  const titleInputRef = useRef<TextInput>(null);
  const noteInputRef = useRef<TextInput>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    // Only overwrite drafts if the user isn't currently editing.
    // This prevents background sync refreshes from wiping out what the user is typing.
    if (!isEditing) {
      setTitleDraft(post.title || '');
      setNoteDraft(post.content || '');
      setDraftInterval(post.sm2_interval);
    }
  }, [post.title, post.content, post.sm2_interval, isEditing]);

  useEffect(() => {
    if (post.isProcessed === 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.4,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      pulseAnim.setValue(1);
    }

    const prepareMedia = async () => {
      if (post.tags) {
        try {
          setTags(JSON.parse(post.tags).sort((a: string, b: string) => a.toLowerCase().localeCompare(b.toLowerCase())));
        } catch (e) { }
      }

      if (post.sync_status === 'restricted') {
        setLoading(false);
        return;
      }

      if (!post.mediaData) {
        setLoading(false);
        return;
      }
      try {
        const data: MediaItem[] = JSON.parse(post.mediaData);
        // Pre-fetch all media to get dimensions or ensure local availability
        const cachedData = await Promise.all(
          data.map(async (item) => {
            const localUri = await MediaCacheService.ensureMediaCached(item.url);
            return {
              ...item,
              localUri,
            };
          }),
        );

        let initialRatio = 1;
        if (cachedData.length > 0) {
          const firstItem = cachedData[0];
          const uriToCheck = firstItem.type === 'video'
            ? (firstItem.localThumbnailUri || firstItem.thumbnail)
            : (firstItem.localUri || firstItem.url);

          if (uriToCheck) {
            initialRatio = await new Promise<number>((resolve) => {
              Image.getSize(
                uriToCheck,
                (w, h) => resolve(w && h ? w / h : 1),
                () => resolve(1)
              );
            });
          }
        }

        if (isMounted.current) {
          if (initialRatio !== 1) setMediaAspectRatio(initialRatio);
          setMedia(cachedData);
        }
      } catch (e) {
        console.error('JSON Parse error for post media', e);
      } finally {
        if (isMounted.current) setLoading(false);
      }
    };
    prepareMedia();
    getFrequencyChain().then(setFreqChain);
  }, [post.mediaData, post.isProcessed, post.tags, pulseAnim, retrySeed]);

  const handlePersist = useCallback(async () => {
    let hasChanged = false;
    if (titleDraft !== post.title) {
      await updatePostTitle(post.id, titleDraft);
      hasChanged = true;
    }
    if (noteDraft !== post.content) {
      await updatePostNote(post.id, noteDraft);
      hasChanged = true;
    }

    if (hasChanged) {
      if (onUpdate) {
        onUpdate(post.id, {
          title: titleDraft !== post.title ? titleDraft : undefined,
          content: noteDraft !== post.content ? noteDraft : undefined,
        });
      } else {
        onProcessed?.();
      }
    }
  }, [post.id, post.title, post.content, titleDraft, noteDraft, onUpdate, onProcessed]);

  // Debounced save while editing
  useEffect(() => {
    if (isEditing) {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => {
        handlePersist();
      }, 1500);
    }
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, [titleDraft, noteDraft, isEditing, handlePersist]);

  const handleUpdateFrequency = async (direction: 'more' | 'less') => {
    setIsUpdating(true);
    try {
      const next = await updatePostFrequency(post.id, direction);
      if (isMounted.current) {
        setDraftInterval(next);
        if (onUpdate) {
          onUpdate(post.id, { sm2_interval: next });
        } else {
          onProcessed?.();
        }
      }
    } catch (e) {
      console.error('Failed to update frequency', e);
    } finally {
      if (isMounted.current) setIsUpdating(false);
    }
  };

  const handleSelectFrequency = async (freqString: string) => {
    const days = parseFrequencyToDays(freqString);
    setIsUpdating(true);
    setShowFreqModal(false);
    try {
      await updatePostInterval(post.id, days);
      if (isMounted.current) {
        setDraftInterval(days);
        if (onUpdate) {
          onUpdate(post.id, { sm2_interval: days });
        } else {
          onProcessed?.();
        }
      }
    } catch (e) {
      console.error('Failed to set manual frequency', e);
    } finally {
      if (isMounted.current) setIsUpdating(false);
    }
  };

  const handleUpdateTags = async (newTags: string[]) => {
    setTags(newTags.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))); // Optimistic update
    try {
      await updatePostTags(post.id, newTags);
      if (onUpdate) {
        onUpdate(post.id, { tags: JSON.stringify(newTags) });
      }
    } catch (e) {
      console.error('Failed to update tags', e);
      // Revert if needed, but for now we trust optimistic
    }
  };

  const handleReviewed = async () => {
    if (post.isProcessed === 0 && !isSimpleNote) return;
    setIsUpdating(true);
    try {
      if (isHistory) {
        await unmarkPostAsReviewed(post.id);
        // If unmarking from history, it might disappear from history tab, so remove
        onRemove ? onRemove(post.id) : onProcessed?.();
      } else {
        await markPostAsReviewed(post.id, draftInterval);
        onRemove ? onRemove(post.id) : onProcessed?.();
      }
    } catch (e) {
      console.error('Failed to toggle review status', e);
    } finally {
      if (isMounted.current) setIsUpdating(false);
    }
  };

  const handleReRender = () => {
    setLoading(true);
    setMedia([]); // Clear current media to force fresh render
    setRetrySeed((prev) => prev + 1);
    setMenuVisible(false);
  };

  const handleReDownload = async () => {
    try {
      setIsUpdating(true);
      await resetPostForRedownload(post.id);
      syncManager.triggerSync(); // Trigger sync immediately
      onProcessed?.(); // Hard reload needed here probably
      if (isMounted.current) setMenuVisible(false);
    } catch (e) {
      console.error('Failed to trigger re-download', e);
    } finally {
      if (isMounted.current) setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!isConfirmingDelete) {
      setIsConfirmingDelete(true);
      return;
    }
    try {
      await moveToTrash(post.id);
      if (isMounted.current) {
        setIsConfirmingDelete(false);
        setMenuVisible(false);
      }
      onRemove ? onRemove(post.id) : onProcessed?.();
    } catch (e) {
      console.error('Failed to delete post', e);
    }
  };

  const onDoubleTap = (event: any) => {
    if (event.nativeEvent.state === State.ACTIVE) {
      handleReviewed();
    }
  };

  const renderMedia = ({ item, index }: { item: MediaItem; index: number }) => {
    const source = { uri: item.localUri || item.url };
    const posterSource = item.type === 'video'
      ? (item.localThumbnailUri ? { uri: item.localThumbnailUri } : (item.thumbnail ? { uri: item.thumbnail } : undefined))
      : undefined;

    if (item.type === 'video') {
      return (
        <InstagramVideo
          source={source}
          posterSource={posterSource}
          isVisible={isVisible && index === activeMediaIndex}
          onAspectRatio={(ratio) => {
            if (Math.abs(mediaAspectRatio - ratio) > 0.05) setMediaAspectRatio(ratio);
          }}
          aspectRatio={mediaAspectRatio}
          onDoubleTap={handleReviewed}
        />
      );
    }
    return (
      <TapGestureHandler
        onHandlerStateChange={(e) => {
          if (e.nativeEvent.state === State.ACTIVE) handleReviewed();
        }}
        numberOfTaps={2}
      >
        <View style={[styles.mediaContainer, { aspectRatio: mediaAspectRatio }]}>
          <Image source={source} style={styles.media} resizeMode="cover" />
        </View>
      </TapGestureHandler>
    );
  };

  const onBlurWrapper = () => {
    setTimeout(() => {
      if (!titleInputRef.current?.isFocused() && !noteInputRef.current?.isFocused()) {
        setIsEditing(false);
        handlePersist();
      }
    }, 100);
  };

  return (
    <View style={styles.container}>
      {/* 1. Header (Dynamic Based on Content Type) */}
      <View style={[styles.igHeader, isSimpleNote && styles.noteHeader]}>
        <View style={styles.igUserInfo}>
          {isSimpleNote ? (
            <View style={styles.noteIconWrapper}>
              <StickyNote size={18} color="#2563eb" />
              <Text style={styles.noteBadgeText}>Note</Text>
            </View>
          ) : (
            <>
              <View style={styles.igAvatarPlaceholder}>
                {post.profile_image ? (
                  <Image
                    key={post.profile_image}
                    source={{ uri: post.profile_image }}
                    style={styles.igAvatar}
                  />
                ) : (
                  <User size={18} color="#94a3b8" />
                )}
              </View>
              <Text style={styles.igUsername}>{post.username || 'instagram_user'}</Text>
            </>
          )}
        </View>
        <TouchableOpacity
          style={styles.menuTrigger}
          onPress={() => {
            setMenuVisible(!menuVisible);
            if (menuVisible) setIsConfirmingDelete(false);
          }}
        >
          <MoreHorizontal size={20} color="#262626" />
        </TouchableOpacity>

        {menuVisible && (
          <View style={styles.dropdownMenu}>
            <TouchableOpacity
              style={[styles.menuItem, isConfirmingDelete && styles.menuItemConfirm]}
              onPress={handleDelete}
            >
              <Text style={[styles.menuItemText, isConfirmingDelete && styles.menuItemTextConfirm]}>
                {isConfirmingDelete ? 'Are you sure?' : 'Delete'}
              </Text>
            </TouchableOpacity>
            {!isConfirmingDelete && (
              <>
                <TouchableOpacity style={styles.menuItem} onPress={handleReRender}>
                  <View style={styles.menuItemContent}>
                    <RefreshCw size={16} color="#525252" />
                    <Text style={styles.menuItemTextNormal}>Re-render</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={handleReDownload}>
                  <View style={styles.menuItemContent}>
                    <RotateCw size={16} color="#525252" />
                    <Text style={styles.menuItemTextNormal}>Re-download</Text>
                  </View>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>

      {/* 2. Media Carousel (Only for IG links) */}
      {!isSimpleNote && (
        <View style={styles.mediaWrapper}>
          {post.sync_status === 'restricted' ? (
            <View style={[styles.mediaPlaceholder, styles.errorBox]}>
              <EyeOff size={48} color={COLORS.error} />
              <Text style={{ color: '#64748b', fontSize: 13, marginTop: 12, textAlign: 'center', paddingHorizontal: 40, lineHeight: 20 }}>
                <Text style={{ color: COLORS.error, fontWeight: 'bold' }}>Restricted Content</Text> - This post cannot be downloaded due to Instagram privacy settings.
              </Text>
              <TouchableOpacity
                style={{
                  marginTop: 20,
                  backgroundColor: '#fef2f2',
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#fee2e2'
                }}
                onPress={handleDelete}
              >
                <Text style={{ color: COLORS.error, fontWeight: '700' }}>Delete Capture</Text>
              </TouchableOpacity>
            </View>
          ) : post.isProcessed === 0 && (!post.mediaData || post.mediaData === '[]') ? (
            <Animated.View
              style={[styles.mediaPlaceholder, styles.processingBox, { opacity: pulseAnim }]}
            >
              <DownloadCloud size={40} color="#94a3b8" />
              <Text style={styles.processingTitle}>Syncing Media...</Text>
              <ActivityIndicator size="small" color="#94a3b8" style={{ marginTop: 12 }} />
            </Animated.View>
          ) : loading ? (
            <View style={[styles.mediaPlaceholder, styles.loadingBox]}>
              <ActivityIndicator color="#000" />
            </View>
          ) : media.length > 0 ? (
            <View>
              <FlatList
                data={media}
                renderItem={renderMedia}
                style={{ aspectRatio: mediaAspectRatio }}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(_, index) => index.toString()}
                decelerationRate="fast"
                snapToInterval={width}
                onScroll={(e) => {
                  const offset = e.nativeEvent.contentOffset.x;
                  setActiveMediaIndex(Math.round(offset / width));
                }}
              />
              {media.length > 1 && (
                <View style={styles.paginationContainer}>
                  {media.map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.paginationDot,
                        i === activeMediaIndex && styles.paginationDotActive,
                      ]}
                    />
                  ))}
                </View>
              )}
              {post.isProcessed === 0 && (
                <View style={styles.syncOverlay}>
                  <View style={{ backgroundColor: 'rgba(0,0,0,0.6)', padding: 8, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Refreshing...</Text>
                  </View>
                </View>
              )}
            </View>
          ) : (
            <View style={[styles.mediaPlaceholder, styles.errorBox]}>
              <Text style={styles.errorText}>Media not available</Text>
            </View>
          )}
        </View>
      )}

      {/* 3. Refactored Review Bar (16px Padding) */}
      {/* Structure: Done | Current frequency | Less | More */}
      <View style={styles.reviewBar}>
        <TouchableOpacity
          style={[
            styles.doneBtn,
            isHistory && styles.doneBtnSuccess,
            (post.isProcessed === 0 || (isSimpleNote && isHistory)) && styles.doneBtnLocked,
          ]}
          onPress={handleReviewed}
          disabled={isUpdating || (post.isProcessed === 0 && !isSimpleNote)}
        >
          {isUpdating ? (
            <ActivityIndicator size="small" color={COLORS.background} />
          ) : isHistory ? (
            <Undo2 size={18} color={COLORS.background} />
          ) : (
            <Check size={18} color={COLORS.background} strokeWidth={3} />
          )}
          <Text style={styles.doneBtnText}>{isHistory ? 'Undo' : 'Done'}</Text>
        </TouchableOpacity>

        <View style={styles.rightActionsGroup}>
          <TouchableOpacity
            style={styles.freqDisplayContainer}
            onPress={() => setShowFreqModal(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.freqLabel}>
              {formatDaysToFrequency(draftInterval)}
            </Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <View style={styles.stepControls}>
            <TouchableOpacity
              style={styles.stepBtnIcon}
              onPress={() => handleUpdateFrequency('more')}
              disabled={isUpdating}
            >
              <ChevronDown size={22} color="#64748b" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.stepBtnIcon}
              onPress={() => handleUpdateFrequency('less')}
              disabled={isUpdating}
            >
              <ChevronUp size={22} color="#64748b" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 4. Caption Area (30px Padding) */}
      <View style={styles.captionArea}>
        {isEditing ? (
          <TextInput
            ref={titleInputRef}
            style={[styles.postTitle, styles.inputReset]}
            value={titleDraft}
            onChangeText={setTitleDraft}
            onBlur={onBlurWrapper}
            placeholder="Title"
          />
        ) : (
          <TouchableOpacity onPress={() => setIsEditing(true)}>
            <Text style={styles.postTitle}>{titleDraft || 'Untitled Capture'}</Text>
          </TouchableOpacity>
        )}

        {isEditing ? (
          <View style={styles.editorContainer}>
            <TextInput
              ref={noteInputRef}
              style={[styles.noteContent, styles.noteInput, styles.inputReset]}
              value={noteDraft}
              onChangeText={setNoteDraft}
              multiline
              onBlur={onBlurWrapper}
              placeholder="Capture your thoughts..."
              placeholderTextColor="#94a3b8"
            />

            {post.instagram_caption ? (
              <View style={styles.originalCaptionSection}>
                <TouchableOpacity
                  style={styles.captionToggle}
                  onPress={() => setShowOriginalCaption(!showOriginalCaption)}
                >
                  <Text style={styles.captionToggleText}>
                    {showOriginalCaption
                      ? 'Hide Original Caption'
                      : 'Show Original Caption (Reference)'}
                  </Text>
                  {showOriginalCaption ? (
                    <EyeOff size={14} color="#8e8e8e" />
                  ) : (
                    <Eye size={14} color="#8e8e8e" />
                  )}
                </TouchableOpacity>

                {showOriginalCaption && (
                  <View style={styles.originalCaptionCard}>
                    <Text style={styles.originalCaptionText}>{post.instagram_caption}</Text>
                  </View>
                )}
              </View>
            ) : null}
          </View>
        ) : (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setIsEditing(true)}
            style={styles.noteDisplay}
          >
            <Text style={styles.noteContent}>
              {noteDraft || (
                <Text style={styles.placeholderText}>Tap to add a note or edit content...</Text>
              )}
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.labelPillsRow}>
          {tags.map((tag, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.pill}
              onPress={() => onLabelClick?.(tag)}
            >
              <Text style={styles.pillText}>{tag}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.pill, styles.addTagPill]}
            onPress={() => setShowTagPicker(true)}
          >
            <Plus size={12} color={COLORS.primary} style={styles.addTagIcon} />
            <Text style={styles.addTagText}>Add Tag</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footerInfo}>
          <Text style={styles.reviewTimeline}>
            {isHistory ? 'Next review in' : 'Review due in'} {formatDaysToFrequency(post.sm2_interval)}
          </Text>
        </View>
      </View>

      {/* Frequency Quick Select Modal */}
      <Modal
        visible={showFreqModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFreqModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFreqModal(false)}
        >
          <View style={styles.popupContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.popupTitle}>Quick Select Frequency</Text>
            <View style={styles.quickFreqGrid}>
              {freqChain.map((freq) => (
                <TouchableOpacity
                  key={freq}
                  style={[
                    styles.quickFreqChip,
                    parseFrequencyToDays(freq) === draftInterval && styles.quickFreqChipActive
                  ]}
                  onPress={() => handleSelectFrequency(freq)}
                >
                  <Text style={[
                    styles.quickFreqChipText,
                    parseFrequencyToDays(freq) === draftInterval && styles.quickFreqChipTextActive
                  ]}>
                    {freq}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.removeFreqBtn}
              onPress={async () => {
                setIsUpdating(true);
                setShowFreqModal(false);

                try {
                  await updatePostInterval(post.id, 0);
                  if (isMounted.current) {
                    setDraftInterval(0);
                    if (onUpdate) {
                      onUpdate(post.id, { sm2_interval: 0 });
                    } else {
                      onProcessed?.();
                    }
                  }
                } catch (e) {
                  console.error('Failed to remove frequency', e);
                } finally {
                  if (isMounted.current) setIsUpdating(false);
                }
              }}
            >
              <CalendarOff size={18} color="#ef4444" />
              <Text style={styles.removeFreqText}>Remove Schedule (Deactivate)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.doneBtn, { marginTop: 24 }]}
              onPress={() => setShowFreqModal(false)}
            >
              <Text style={styles.modalDoneBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Tag Picker Modal */}
      < TagPickerModal
        visible={showTagPicker}
        onClose={() => setShowTagPicker(false)}
        selectedTags={tags}
        onTagsChange={handleUpdateTags}
      />
    </View >
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginBottom: 24,
  },
  removeFreqBtn: {
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 12,
  },
  removeFreqText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
  mediaWrapper: {
    backgroundColor: '#000',
    width: width,
  },
  mediaContainer: {
    backgroundColor: '#000',
    justifyContent: 'center',
    overflow: 'hidden',
    width: width,
  },
  media: {
    height: '100%',
    width: '100%',
  },
  mediaPlaceholder: {
    width: width,
    aspectRatio: 1, // Placeholders remain square
    backgroundColor: '#f8fafc',
  },
  // 1. IG Header (16px)
  noteHeader: {
    backgroundColor: '#f8fafc',
    borderBottomColor: '#f1f5f9',
    borderBottomWidth: 1,
  },
  noteIconWrapper: {
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  noteBadgeText: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
    textTransform: 'uppercase',
  },
  noteDisplay: {
    backgroundColor: '#fff',
    minHeight: 120,
    paddingVertical: 12,
  },
  igHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 100,
  },
  igUserInfo: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  igAvatarPlaceholder: {
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
    borderRadius: 16,
    borderWidth: 0.5,
    height: 32,
    justifyContent: 'center',
    marginRight: 10,
    overflow: 'hidden',
    width: 32,
  },
  igAvatar: {
    height: '100%',
    width: '100%',
  },
  igUsername: {
    color: '#262626',
    fontSize: 14,
    fontWeight: '700',
  },
  menuTrigger: {
    padding: 4,
  },
  dropdownMenu: {
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 8,
    minWidth: 160,
    padding: 4,
    position: 'absolute',
    right: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    top: 50,
    zIndex: 1000,
  },
  menuItem: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuItemConfirm: {
    backgroundColor: '#ef4444',
  },
  menuItemText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  menuItemTextConfirm: {
    color: '#fff',
  },
  menuItemTextNormal: {
    color: '#171717',
    fontSize: 14,
    fontWeight: '500',
  },
  menuItemContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  // 2. Media Carousel (0px)
  processingBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingTitle: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 12,
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  // --- Video Overlays ---
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
  },
  pauseIconContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 32,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  muteIndicator: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    bottom: 16,
    height: 40,
    justifyContent: 'center',
    position: 'absolute',
    right: 16,
    width: 40,
  },
  paginationContainer: {
    position: 'absolute',
    bottom: -20, // Move dots slightly below the media like modern IG
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
    gap: 4,
  },
  paginationDot: {
    backgroundColor: '#cbd5e1',
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  paginationDotActive: {
    backgroundColor: COLORS.secondary,
    width: 8,
  },
  syncOverlay: {
    left: 20,
    position: 'absolute',
    top: 20,
    zIndex: 10,
  },
  // --- 3. Review Bar (16px) ---
  reviewBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rightActionsGroup: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  doneBtn: {
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    elevation: 2,
    flexDirection: 'row',
    gap: 6,
    height: 42,
    justifyContent: 'center',
    paddingHorizontal: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  doneBtnSuccess: {
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
  },
  doneBtnLocked: {
    backgroundColor: '#e2e8f0',
    elevation: 0,
    shadowOpacity: 0,
  },
  doneBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  freqDisplayContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  freqLabel: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '800',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  divider: {
    backgroundColor: '#e2e8f0',
    height: 24,
    width: 1,
  },
  stepControls: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  stepBtnIcon: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderRadius: 10,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  // --- 4. Caption Area (30px) ---
  captionArea: {
    paddingBottom: 24,
    paddingHorizontal: 30,
  },
  postTitle: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
    marginBottom: 6,
    margin: 0,
    padding: 0,
  },
  noteContent: {
    color: '#334155',
    fontSize: 15,
    lineHeight: 22,
    margin: 0,
    padding: 0,
  },
  inputReset: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  placeholderText: {
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  editorContainer: {
    marginBottom: 12,
  },
  noteInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  originalCaptionSection: {
    borderTopColor: '#f1f5f9',
    borderTopWidth: 1,
    marginTop: 14,
    paddingTop: 10,
  },
  captionToggle: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 6,
  },
  captionToggleText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },
  originalCaptionCard: {
    backgroundColor: '#f8fafc',
    borderLeftColor: '#cbd5e1',
    borderLeftWidth: 3,
    borderRadius: 10,
    marginTop: 10,
    padding: 12,
  },
  originalCaptionText: {
    color: '#475569',
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  labelPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  pill: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 12,
    borderWidth: 0.5,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  addTagPill: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    borderWidth: 1,
    flexDirection: 'row',
  },
  pillText: {
    color: '#3c4043',
    fontSize: 11,
    fontWeight: '500',
  },
  addTagIcon: {
    marginRight: 4,
  },
  addTagText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '500',
  },
  footerInfo: {
    alignItems: 'flex-end',
    marginTop: 20,
  },
  reviewTimeline: {
    color: '#94a3b8',
    fontSize: 11,
    fontStyle: 'italic',
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    flex: 1,
    justifyContent: 'center',
  },
  popupContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    elevation: 20,
    maxWidth: 340,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    width: '85%',
  },
  popupTitle: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 20,
    textAlign: 'center',
  },
  quickFreqGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  quickFreqChip: {
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 80,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  quickFreqChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  quickFreqChipText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
  },
  quickFreqChipTextActive: {
    color: '#fff',
  },
  modalDoneBtnText: {
    color: COLORS.background,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
});

// --- Instagram Video Component ---

const InstagramVideo = ({
  source,
  isVisible,
  onAspectRatio,
  aspectRatio = 1,
  onDoubleTap,
  posterSource,
}: {
  source: any;
  isVisible?: boolean;
  onAspectRatio?: (ratio: number) => void;
  aspectRatio?: number;
  onDoubleTap?: () => void;
  posterSource?: any;
}) => {
  const videoRef = useRef<Video>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [showMuteIndicator, setShowMuteIndicator] = useState(false);
  const muteAnim = useRef(new Animated.Value(0)).current;

  // Virtualization State
  const [showVideo, setShowVideo] = useState(false);
  const [thumbnail, setThumbnail] = useState(posterSource);
  const settleTimeout = useRef<NodeJS.Timeout | null>(null);

  // Refs for gesture handlers
  const singleTapRef = useRef(null);
  const doubleTapRef = useRef(null);

  // 1. Settle-to-Play Logic
  useEffect(() => {
    if (isVisible) {
      if (settleTimeout.current) clearTimeout(settleTimeout.current);
      settleTimeout.current = setTimeout(() => {
        setShowVideo(true);
      }, 250); // 250ms delay to ensure user stopped scrolling
    } else {
      if (settleTimeout.current) clearTimeout(settleTimeout.current);
      setShowVideo(false);
      setIsPaused(false); // Reset pause state when scrolling away
    }
  }, [isVisible]);

  // 2. Playback Control
  useEffect(() => {
    if (showVideo) {
      if (!isPaused) {
        videoRef.current?.playAsync();
      } else {
        videoRef.current?.pauseAsync();
      }
    }
  }, [showVideo, isPaused]);

  // 3. Thumbnail Generation (Lazy)
  useEffect(() => {
    let active = true;
    const generateIfNeeded = async () => {
      if (!thumbnail && source?.uri) {
        // Only generate if we don't have a thumbnail (posterSource was undefined)
        const generatedUri = await MediaCacheService.ensureThumbnailCached(source.uri);
        if (active && generatedUri) {
          setThumbnail({ uri: generatedUri });
        }
      }
    };
    generateIfNeeded();
    return () => { active = false; };
  }, [source?.uri, thumbnail]);

  const toggleMute = () => {
    setIsMuted(!isMuted);
    setShowMuteIndicator(true);
    muteAnim.setValue(1);
    Animated.timing(muteAnim, {
      toValue: 0,
      duration: 1000,
      useNativeDriver: true,
    }).start(() => setShowMuteIndicator(false));
  };

  const handleLongPress = (event: LongPressGestureHandlerStateChangeEvent) => {
    if (event.nativeEvent.state === State.ACTIVE) {
      setIsPaused(true);
    } else if (
      event.nativeEvent.state === State.END ||
      event.nativeEvent.state === State.CANCELLED
    ) {
      setIsPaused(false);
    }
  };

  const onDoubleTapHandler = (event: TapGestureHandlerStateChangeEvent) => {
    if (event.nativeEvent.state === State.ACTIVE && onDoubleTap) {
      onDoubleTap();
    }
  };

  const onSingleTapHandler = (event: TapGestureHandlerStateChangeEvent) => {
    if (event.nativeEvent.state === State.ACTIVE) {
      toggleMute();
    }
  };

  return (
    <LongPressGestureHandler onHandlerStateChange={handleLongPress} minDurationMs={300}>
      <View style={[styles.mediaContainer, { aspectRatio }]}>
        <TapGestureHandler
          ref={doubleTapRef}
          numberOfTaps={2}
          onHandlerStateChange={onDoubleTapHandler}
        >
          <View style={StyleSheet.absoluteFill}>
            <TapGestureHandler
              ref={singleTapRef}
              numberOfTaps={1}
              waitFor={doubleTapRef}
              onHandlerStateChange={onSingleTapHandler}
            >
              <View style={StyleSheet.absoluteFill}>
                {showVideo ? (
                  <Video
                    ref={videoRef}
                    style={styles.media}
                    source={source}
                    resizeMode={ResizeMode.COVER}
                    isLooping
                    isMuted={isMuted}
                    shouldPlay={true} // Controlled by mounting + playAsync in effect
                    usePoster={true}
                    posterSource={thumbnail}
                    posterStyle={{ resizeMode: 'cover' }}
                    onReadyForDisplay={(event) => {
                      if (onAspectRatio) {
                        const ratio = event.naturalSize.width / event.naturalSize.height;
                        onAspectRatio(ratio);
                      }
                    }}
                    onError={(e) => console.log("Video Error:", e)}
                  />
                ) : (
                  <View style={StyleSheet.absoluteFill}>
                    <Image
                      source={thumbnail || { uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=' }} // Transparent placeholder
                      style={styles.media}
                      resizeMode="cover"
                    />
                    {/* Play Icon Overlay for Thumbnails */}
                    <View style={styles.videoOverlay}>
                      <View style={[styles.pauseIconContainer, { backgroundColor: 'rgba(0,0,0,0.3)', width: 48, height: 48 }]}>
                        <Play size={24} color={COLORS.background} fill={COLORS.background} style={{ marginLeft: 2 }} />
                      </View>
                    </View>
                  </View>
                )}

                {/* Hold to Pause Indicator */}
                {isPaused && (
                  <View style={styles.videoOverlay}>
                    <View style={styles.pauseIconContainer}>
                      <Play size={40} color={COLORS.background} fill={COLORS.background} style={{ marginLeft: 4 }} />
                    </View>
                  </View>
                )}

                {/* Mute/Unmute Indicator */}
                {showMuteIndicator && (
                  <Animated.View style={[styles.muteIndicator, { opacity: muteAnim }]}>
                    {isMuted ? <VolumeX size={24} color={COLORS.background} /> : <Volume2 size={24} color={COLORS.background} />}
                  </Animated.View>
                )}
              </View>
            </TapGestureHandler>
          </View>
        </TapGestureHandler>
      </View>
    </LongPressGestureHandler>
  );
};
