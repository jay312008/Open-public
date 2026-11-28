import React, { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { AppBackground } from '@/components/AppBackground';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { StudentAvatar } from '@/components/StudentAvatar';
import { useTheme } from '@/theme/ThemeContext';
import { useApp } from '@/store/AppContext';
import { CommunityPost } from '@/types/models';

const FEED_TABS = ['For You', 'Following', 'Saved', 'Groups'] as const;
const POST_TAGS = ['Study Note', 'Question', 'Exam Tip', 'Formula', 'Past Paper'] as const;

export default function CommunityScreen() {
  const { colors, isDark } = useTheme();
  const {
    profile,
    posts,
    groups,
    createPost,
    toggleLikePost,
    toggleBookmarkPost,
    addCommentToPost,
    deletePost,
    toggleJoinGroup,
    createStudyGroup,
    toggleFollowUser,
  } = useApp();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<(typeof FEED_TABS)[number]>('For You');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [repostedIds, setRepostedIds] = useState<string[]>([]);

  // Twitter-style Compose Modal
  const [composerModalOpen, setComposerModalOpen] = useState(false);
  const [composerText, setComposerText] = useState('');
  const [composerTag, setComposerTag] = useState<(typeof POST_TAGS)[number]>('Study Note');
  const [composerImage, setComposerImage] = useState<string | undefined>();

  // Thread / Replies Modal
  const [activePostIdForComments, setActivePostIdForComments] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState('');

  // Create Study Group state
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [grpName, setGrpName] = useState('');
  const [grpSubject, setGrpSubject] = useState('Mathematics');
  const [grpDesc, setGrpDesc] = useState('');
  const [grpPrivate, setGrpPrivate] = useState(true);
  const [grpSearch, setGrpSearch] = useState('');

  const activePostForComments = useMemo(
    () => posts.find((p) => p.id === activePostIdForComments) ?? null,
    [posts, activePostIdForComments]
  );

  const hairline = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(37,29,58,0.09)';
  const feedBg = 'transparent';

  const pickImage = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.7,
      });
      if (!res.canceled && res.assets[0]) {
        setComposerImage(res.assets[0].uri);
      }
    } catch {
      Alert.alert('Photo Picker', 'Could not open the image picker on this browser.');
    }
  };

  const handlePublish = () => {
    if (!composerText.trim() && !composerImage) return;
    createPost(
      composerText.trim() || 'Shared a study note image',
      composerTag,
      composerImage
    );
    setComposerText('');
    setComposerImage(undefined);
    setComposerTag('Study Note');
    setComposerModalOpen(false);
  };

  const toggleRepost = (postId: string) => {
    setRepostedIds((prev) =>
      prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId]
    );
  };

  const handleSendReply = () => {
    if (!activePostForComments || !commentDraft.trim()) return;
    addCommentToPost(activePostForComments.id, commentDraft.trim());
    setCommentDraft('');
  };

  const handleShare = (post: CommunityPost) => {
    Share.share({
      message: `${post.authorName} (@${post.authorUsername}) on LearnyMol: "${post.content}"`,
    }).catch(() => {});
  };

  const handlePostMenu = (post: CommunityPost) => {
    if (post.authorId === profile.id) {
      Alert.alert('Post Options', 'Manage your post', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete Post', style: 'destructive', onPress: () => deletePost(post.id) },
      ]);
    } else {
      const isFollowing = profile.following.includes(post.authorId);
      Alert.alert(`@${post.authorUsername}`, 'Choose an action', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isFollowing ? `Unfollow @${post.authorUsername}` : `Follow @${post.authorUsername}`,
          onPress: () => toggleFollowUser(post.authorId),
        },
        {
          text: 'Report Post',
          style: 'destructive',
          onPress: () => Alert.alert('Reported', 'Thank you. This post has been flagged for moderation review.'),
        },
      ]);
    }
  };

  const filteredPosts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return posts.filter((p) => {
      if (activeTab === 'Following') {
        if (!profile.following.includes(p.authorId) && p.authorId !== profile.id) return false;
      } else if (activeTab === 'Saved') {
        if (!p.bookmarks.includes(profile.id)) return false;
      }
      if (q) {
        return (
          p.content.toLowerCase().includes(q) ||
          p.authorName.toLowerCase().includes(q) ||
          p.authorUsername.toLowerCase().includes(q) ||
          (p.subjectTag ?? '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [posts, activeTab, searchQuery, profile.following, profile.id]);

  const filteredGroups = useMemo(() => {
    const q = grpSearch.trim().toLowerCase();
    return groups.filter(
      (g) =>
        !q ||
        g.name.toLowerCase().includes(q) ||
        g.subject.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q)
    );
  }, [groups, grpSearch]);

  const handleCreateGroup = () => {
    if (!grpName.trim()) {
      Alert.alert('Group Name Required', 'Please enter a name for your study group.');
      return;
    }
    createStudyGroup({
      name: grpName.trim(),
      subject: grpSubject.trim() || 'General',
      description: grpDesc.trim() || 'Focused exam revision and peer support.',
      isPrivate: grpPrivate,
      billingMode: 'personal',
    });
    setGrpName('');
    setGrpDesc('');
    setShowCreateGroup(false);
  };

  const renderHighlightedText = (text: string) => {
    const parts = text.split(/(#[a-zA-Z0-9_]+|@[a-zA-Z0-9_]+)/g);
    return (
      <Text style={[styles.tweetBody, { color: colors.text }]}>
        {parts.map((part, i) =>
          part.startsWith('#') || part.startsWith('@') ? (
            <Text key={i} style={{ color: '#FF6B4A', fontWeight: '700' }}>
              {part}
            </Text>
          ) : (
            <Text key={i}>{part}</Text>
          )
        )}
      </Text>
    );
  };

  const charsLeft = 280 - composerText.length;

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* X / Twitter-Style Top Bar */}
        <View style={[styles.topBar, { backgroundColor: feedBg, borderBottomColor: hairline }]}>
          <AnimatedPressable onPress={() => router.push('/(tabs)/profile')} style={styles.topAvatarBtn}>
            <StudentAvatar avatarId={profile.avatarEmoji} bgColor={profile.avatarBg} size={34} />
          </AnimatedPressable>

          <View style={styles.topTitleWrap}>
            <Text style={[styles.topTitle, { color: colors.text }]}>Community</Text>
          </View>

          <View style={styles.topActions}>
            <AnimatedPressable
              onPress={() => setSearchOpen((v) => !v)}
              style={[styles.topIconBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.05)' }]}
              accessibilityLabel="Search posts"
            >
              <Ionicons name={searchOpen ? 'close' : 'search'} size={18} color={colors.text} />
            </AnimatedPressable>
            <AnimatedPressable
              onPress={() => router.push('/groups' as never)}
              style={[styles.topIconBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.05)' }]}
              accessibilityLabel="Open AI Study Groups"
            >
              <Ionicons name="people-outline" size={19} color={colors.text} />
            </AnimatedPressable>
          </View>
        </View>

        {/* Expandable Search Bar */}
        {searchOpen && (
          <View style={[styles.searchStrip, { backgroundColor: feedBg, borderBottomColor: hairline }]}>
            <View style={[styles.searchPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9' }]}>
              <Ionicons name="search" size={16} color={colors.textMuted} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search study notes, #tags, or @students..."
                placeholderTextColor={colors.textMuted}
                style={[styles.searchInput, { color: colors.text }]}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <AnimatedPressable onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                </AnimatedPressable>
              )}
            </View>
          </View>
        )}

        {/* Authentic X / Twitter Underline Tab Bar */}
        <View style={[styles.tabBar, { backgroundColor: feedBg, borderBottomColor: hairline }]}>
          {FEED_TABS.map((tab) => {
            const active = activeTab === tab;
            return (
              <AnimatedPressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={styles.tabItem}
              >
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: active ? colors.text : colors.textMuted,
                      fontWeight: active ? '800' : '600',
                    },
                  ]}
                >
                  {tab}
                </Text>
                {active && <View style={[styles.tabUnderline, { backgroundColor: '#FF6B4A' }]} />}
              </AnimatedPressable>
            );
          })}
        </View>

        <ScrollView
          style={{ flex: 1, backgroundColor: feedBg }}
          contentContainerStyle={styles.feedContent}
          showsVerticalScrollIndicator={false}
        >
          {activeTab !== 'Groups' ? (
            <>
              {/* Quick Inline Tweet Prompt Row (taps to open full Twitter composer) */}
              <AnimatedPressable
                onPress={() => setComposerModalOpen(true)}
                style={[styles.inlinePromptRow, { borderBottomColor: hairline }]}
              >
                <StudentAvatar avatarId={profile.avatarEmoji} bgColor={profile.avatarBg} size={40} />
                <Text style={[styles.inlinePromptPlaceholder, { color: colors.textMuted }]}>
                  What are you studying today?
                </Text>
                <View style={styles.inlinePromptBtn}>
                  <Text style={styles.inlinePromptBtnText}>Post</Text>
                </View>
              </AnimatedPressable>

              {/* Hairline-Separated Twitter Timeline */}
              {filteredPosts.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <Ionicons name="chatbubbles-outline" size={40} color={colors.textMuted} />
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>
                    {activeTab === 'Saved'
                      ? 'No Bookmarked Posts Yet'
                      : activeTab === 'Following'
                        ? 'Your Following Feed Is Quiet'
                        : 'No Matching Study Posts'}
                  </Text>
                  <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                    {activeTab === 'Saved'
                      ? 'Tap the bookmark icon on any helpful study note to save it here.'
                      : 'Follow fellow students or share a study tip to start the conversation.'}
                  </Text>
                </View>
              ) : (
                filteredPosts.map((post) => {
                  const isLiked = post.likes.includes(profile.id);
                  const isBookmarked = post.bookmarks.includes(profile.id);
                  const isReposted = repostedIds.includes(post.id);
                  const repostCount = (post.likes.length > 0 ? Math.floor(post.likes.length / 2) : 0) + (isReposted ? 1 : 0);

                  return (
                    <View
                      key={post.id}
                      style={[styles.tweetRow, { borderBottomColor: hairline }]}
                    >
                      {/* Left Avatar Column */}
                      <AnimatedPressable
                        onPress={() => router.push(`/profile/${post.authorUsername}` as never)}
                        style={styles.tweetLeft}
                      >
                        <StudentAvatar
                          avatarId={post.authorAvatar}
                          size={44}
                        />
                      </AnimatedPressable>

                      {/* Right Content Column */}
                      <View style={styles.tweetRight}>
                        {/* Header: Name + Verified + @handle · time + Menu */}
                        <View style={styles.tweetHeader}>
                          <AnimatedPressable
                            onPress={() => router.push(`/profile/${post.authorUsername}` as never)}
                            style={styles.tweetAuthorLine}
                          >
                            <Text style={[styles.authorName, { color: colors.text }]} numberOfLines={1}>
                              {post.authorName}
                            </Text>
                            <Ionicons name="checkmark-circle" size={14} color="#FF6B4A" />
                            <Text style={[styles.authorMeta, { color: colors.textMuted }]} numberOfLines={1}>
                              @{post.authorUsername} · {post.createdAt}
                            </Text>
                          </AnimatedPressable>
                          <AnimatedPressable
                            onPress={() => handlePostMenu(post)}
                            style={styles.moreBtn}
                            accessibilityLabel="Post options"
                          >
                            <Ionicons name="ellipsis-horizontal" size={17} color={colors.textMuted} />
                          </AnimatedPressable>
                        </View>

                        {/* Subtle Academic Topic Pill */}
                        {post.subjectTag ? (
                          <View style={styles.tagLine}>
                            <View
                              style={[
                                styles.topicChip,
                                { backgroundColor: isDark ? 'rgba(255,107,74,0.16)' : '#FFEDE8' },
                              ]}
                            >
                              <Text style={{ color: '#FF6B4A', fontSize: 11, fontWeight: '700' }}>
                                {post.subjectTag}
                              </Text>
                            </View>
                          </View>
                        ) : null}

                        {/* Post Body */}
                        {renderHighlightedText(post.content)}

                        {/* Optional Media Image */}
                        {post.imageUri && (
                          <Image
                            source={{ uri: post.imageUri }}
                            style={[styles.tweetMedia, { borderColor: hairline }]}
                            resizeMode="cover"
                          />
                        )}

                        {/* Authentic 5-Icon X / Twitter Action Bar */}
                        <View style={styles.actionBar}>
                          {/* 1. Reply */}
                          <AnimatedPressable
                            onPress={() => setActivePostIdForComments(post.id)}
                            style={styles.actionBtn}
                          >
                            <Ionicons name="chatbubble-outline" size={17} color={colors.textMuted} />
                            <Text style={[styles.actionCount, { color: colors.textMuted }]}>
                              {post.comments.length > 0 ? post.comments.length : ''}
                            </Text>
                          </AnimatedPressable>

                          {/* 2. Repost */}
                          <AnimatedPressable
                            onPress={() => toggleRepost(post.id)}
                            style={styles.actionBtn}
                          >
                            <Ionicons
                              name="repeat"
                              size={19}
                              color={isReposted ? '#00BA7C' : colors.textMuted}
                            />
                            <Text
                              style={[
                                styles.actionCount,
                                { color: isReposted ? '#00BA7C' : colors.textMuted },
                              ]}
                            >
                              {repostCount > 0 ? repostCount : ''}
                            </Text>
                          </AnimatedPressable>

                          {/* 3. Like */}
                          <AnimatedPressable
                            onPress={() => toggleLikePost(post.id)}
                            style={styles.actionBtn}
                          >
                            <Ionicons
                              name={isLiked ? 'heart' : 'heart-outline'}
                              size={18}
                              color={isLiked ? '#F91880' : colors.textMuted}
                            />
                            <Text
                              style={[
                                styles.actionCount,
                                { color: isLiked ? '#F91880' : colors.textMuted },
                              ]}
                            >
                              {post.likes.length > 0 ? post.likes.length : ''}
                            </Text>
                          </AnimatedPressable>

                          {/* 4. Bookmark */}
                          <AnimatedPressable
                            onPress={() => toggleBookmarkPost(post.id)}
                            style={styles.actionBtn}
                          >
                            <Ionicons
                              name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                              size={17}
                              color={isBookmarked ? '#FF6B4A' : colors.textMuted}
                            />
                          </AnimatedPressable>

                          {/* 5. Share */}
                          <AnimatedPressable
                            onPress={() => handleShare(post)}
                            style={styles.actionBtn}
                          >
                            <Ionicons name="share-outline" size={18} color={colors.textMuted} />
                          </AnimatedPressable>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </>
          ) : (
            /* GROUPS (Twitter Communities Style) */
            <View style={{ padding: 14, gap: 12 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <AnimatedPressable
                  onPress={() => setShowCreateGroup((v) => !v)}
                  style={[styles.groupPrimaryBtn, { backgroundColor: '#FF6B4A', flex: 1 }]}
                >
                  <Ionicons name={showCreateGroup ? 'close' : 'add'} size={18} color="#FFFFFF" />
                  <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13.5 }}>
                    {showCreateGroup ? 'Cancel' : 'New Study Group'}
                  </Text>
                </AnimatedPressable>
                <AnimatedPressable
                  onPress={() => router.push('/groups' as never)}
                  style={[styles.groupPrimaryBtn, { backgroundColor: colors.surfaceMuted, flex: 1 }]}
                >
                  <Ionicons name="people" size={16} color={colors.text} />
                  <Text style={{ color: colors.text, fontWeight: '800', fontSize: 13.5 }}>
                    Full Groups Hub
                  </Text>
                </AnimatedPressable>
              </View>

              {showCreateGroup && (
                <View style={[styles.groupForm, { borderColor: hairline, backgroundColor: colors.surface }]}>
                  <Text style={{ color: colors.text, fontSize: 15, fontWeight: '800' }}>Create Study Group</Text>
                  <TextInput
                    value={grpName}
                    onChangeText={setGrpName}
                    placeholder="Group name (e.g. GCE Physics Squad)"
                    placeholderTextColor={colors.textMuted}
                    style={[styles.formInput, { color: colors.text, borderColor: hairline }]}
                  />
                  <TextInput
                    value={grpSubject}
                    onChangeText={setGrpSubject}
                    placeholder="Subject (e.g. Physics, Biology)"
                    placeholderTextColor={colors.textMuted}
                    style={[styles.formInput, { color: colors.text, borderColor: hairline }]}
                  />
                  <TextInput
                    value={grpDesc}
                    onChangeText={setGrpDesc}
                    placeholder="Short study goal..."
                    placeholderTextColor={colors.textMuted}
                    style={[styles.formInput, { color: colors.text, borderColor: hairline }]}
                  />
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <AnimatedPressable
                      onPress={() => setGrpPrivate(true)}
                      style={[
                        styles.visBtn,
                        { backgroundColor: grpPrivate ? '#FF6B4A' : colors.surfaceMuted },
                      ]}
                    >
                      <Ionicons name="lock-closed" size={14} color={grpPrivate ? '#FFFFFF' : colors.text} />
                      <Text style={{ color: grpPrivate ? '#FFFFFF' : colors.text, fontWeight: '800', fontSize: 12 }}>
                        Private (AI)
                      </Text>
                    </AnimatedPressable>
                    <AnimatedPressable
                      onPress={() => setGrpPrivate(false)}
                      style={[
                        styles.visBtn,
                        { backgroundColor: !grpPrivate ? '#FF6B4A' : colors.surfaceMuted },
                      ]}
                    >
                      <Ionicons name="globe-outline" size={14} color={!grpPrivate ? '#FFFFFF' : colors.text} />
                      <Text style={{ color: !grpPrivate ? '#FFFFFF' : colors.text, fontWeight: '800', fontSize: 12 }}>
                        Public
                      </Text>
                    </AnimatedPressable>
                  </View>
                  <AnimatedPressable
                    onPress={handleCreateGroup}
                    style={[styles.groupPrimaryBtn, { backgroundColor: colors.mintDark }]}
                  >
                    <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 14 }}>Create Group</Text>
                  </AnimatedPressable>
                </View>
              )}

              <View style={[styles.searchPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9' }]}>
                <Ionicons name="search" size={16} color={colors.textMuted} />
                <TextInput
                  value={grpSearch}
                  onChangeText={setGrpSearch}
                  placeholder="Search study groups..."
                  placeholderTextColor={colors.textMuted}
                  style={[styles.searchInput, { color: colors.text }]}
                />
              </View>

              {filteredGroups.map((g) => (
                <AnimatedPressable
                  key={g.id}
                  onPress={() => router.push(`/community/group/${g.id}` as never)}
                  style={[styles.groupRow, { borderColor: hairline, backgroundColor: colors.surface }]}
                >
                  <View style={[styles.groupIcon, { backgroundColor: isDark ? 'rgba(255,107,74,0.18)' : '#FFEDE8' }]}>
                    <Ionicons name={g.isPrivate ? 'lock-closed' : 'people'} size={20} color="#FF6B4A" />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ color: colors.text, fontSize: 15, fontWeight: '800' }}>{g.name}</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600' }}>
                      {g.subject} · {g.memberCount} members · {g.isPrivate ? 'Private' : 'Public'}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 13 }} numberOfLines={2}>
                      {g.description}
                    </Text>
                  </View>
                  <AnimatedPressable
                    onPress={() => toggleJoinGroup(g.id)}
                    style={[
                      styles.followPill,
                      {
                        backgroundColor: g.joined ? 'transparent' : colors.text,
                        borderColor: hairline,
                        borderWidth: g.joined ? 1.5 : 0,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: g.joined ? colors.text : colors.surface,
                        fontSize: 12.5,
                        fontWeight: '800',
                      }}
                    >
                      {g.joined ? 'Joined' : 'Join'}
                    </Text>
                  </AnimatedPressable>
                </AnimatedPressable>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Floating Twitter / X Compose Button */}
        {activeTab !== 'Groups' && (
          <AnimatedPressable
            onPress={() => setComposerModalOpen(true)}
            style={styles.fab}
            accessibilityLabel="Create new post"
          >
            <Ionicons name="add" size={28} color="#FFFFFF" />
          </AnimatedPressable>
        )}

        {/* Full Twitter-Style Compose Modal */}
        <Modal
          visible={composerModalOpen}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setComposerModalOpen(false)}
        >
          <SafeAreaView style={[styles.modalSafe, { backgroundColor: colors.background }]}>
            <KeyboardAvoidingView
              style={{ flex: 1 }}
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
              <View style={[styles.modalHeader, { borderBottomColor: hairline }]}>
                <AnimatedPressable onPress={() => setComposerModalOpen(false)}>
                  <Text style={{ color: colors.text, fontSize: 15.5, fontWeight: '600' }}>Cancel</Text>
                </AnimatedPressable>
                <AnimatedPressable
                  onPress={handlePublish}
                  style={[
                    styles.publishBtn,
                    {
                      backgroundColor:
                        composerText.trim() || composerImage ? '#FF6B4A' : 'rgba(255,107,74,0.45)',
                    },
                  ]}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 14.5 }}>Post</Text>
                </AnimatedPressable>
              </View>

              <ScrollView style={{ flex: 1, padding: 16 }}>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <StudentAvatar avatarId={profile.avatarEmoji} bgColor={profile.avatarBg} size={42} />
                  <View style={{ flex: 1, gap: 10 }}>
                    <View style={styles.tagSelectorRow}>
                      {POST_TAGS.map((tag) => {
                        const sel = composerTag === tag;
                        return (
                          <AnimatedPressable
                            key={tag}
                            onPress={() => setComposerTag(tag)}
                            style={[
                              styles.tagOption,
                              {
                                backgroundColor: sel
                                  ? '#FF6B4A'
                                  : isDark
                                    ? 'rgba(255,255,255,0.08)'
                                    : '#F1F5F9',
                              },
                            ]}
                          >
                            <Text
                              style={{
                                color: sel ? '#FFFFFF' : colors.textSecondary,
                                fontSize: 11.5,
                                fontWeight: '700',
                              }}
                            >
                              {tag}
                            </Text>
                          </AnimatedPressable>
                        );
                      })}
                    </View>

                    <TextInput
                      value={composerText}
                      onChangeText={(t) => setComposerText(t.slice(0, 280))}
                      placeholder="Share a study tip, question, or #GCE revision note..."
                      placeholderTextColor={colors.textMuted}
                      multiline
                      autoFocus
                      style={[styles.modalTextInput, { color: colors.text }]}
                    />

                    {composerImage && (
                      <View style={styles.previewWrap}>
                        <Image source={{ uri: composerImage }} style={styles.previewImg} />
                        <AnimatedPressable
                          onPress={() => setComposerImage(undefined)}
                          style={styles.removeImgBtn}
                        >
                          <Ionicons name="close" size={16} color="#FFFFFF" />
                        </AnimatedPressable>
                      </View>
                    )}
                  </View>
                </View>
              </ScrollView>

              <View style={[styles.composerFooter, { borderTopColor: hairline }]}>
                <AnimatedPressable onPress={pickImage} style={styles.footerIconBtn}>
                  <Ionicons name="image-outline" size={22} color="#FF6B4A" />
                  <Text style={{ color: '#FF6B4A', fontWeight: '700', fontSize: 13 }}>Add Photo</Text>
                </AnimatedPressable>
                <Text
                  style={{
                    color: charsLeft < 30 ? colors.coral : colors.textMuted,
                    fontSize: 13,
                    fontWeight: '700',
                  }}
                >
                  {charsLeft}
                </Text>
              </View>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </Modal>

        {/* Twitter-Style Thread & Replies Modal */}
        <Modal
          visible={Boolean(activePostForComments)}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setActivePostIdForComments(null)}
        >
          <SafeAreaView style={[styles.modalSafe, { backgroundColor: colors.background }]}>
            <KeyboardAvoidingView
              style={{ flex: 1 }}
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
              <View style={[styles.modalHeader, { borderBottomColor: hairline }]}>
                <AnimatedPressable
                  onPress={() => setActivePostIdForComments(null)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                >
                  <Ionicons name="arrow-back" size={21} color={colors.text} />
                  <Text style={{ color: colors.text, fontSize: 17, fontWeight: '800' }}>Post</Text>
                </AnimatedPressable>
              </View>

              {activePostForComments && (
                <ScrollView style={{ flex: 1 }}>
                  {/* Parent Post */}
                  <View style={[styles.threadParent, { borderBottomColor: hairline }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <StudentAvatar avatarId={activePostForComments.authorAvatar} size={44} />
                      <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Text style={[styles.authorName, { color: colors.text }]}>
                            {activePostForComments.authorName}
                          </Text>
                          <Ionicons name="checkmark-circle" size={14} color="#FF6B4A" />
                        </View>
                        <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                          @{activePostForComments.authorUsername} · {activePostForComments.createdAt}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.threadParentBody, { color: colors.text }]}>
                      {activePostForComments.content}
                    </Text>
                    <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: '600' }}>
                      {activePostForComments.comments.length} Replies · {activePostForComments.likes.length} Likes
                    </Text>
                  </View>

                  {/* Replies List */}
                  {activePostForComments.comments.length === 0 ? (
                    <View style={styles.emptyWrap}>
                      <Text style={{ color: colors.textMuted, fontSize: 14 }}>
                        No replies yet. Be the first to answer!
                      </Text>
                    </View>
                  ) : (
                    activePostForComments.comments.map((c) => (
                      <View key={c.id} style={[styles.replyRow, { borderBottomColor: hairline }]}>
                        <StudentAvatar avatarId={c.authorAvatar} size={36} />
                        <View style={{ flex: 1, gap: 3 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={{ color: colors.text, fontWeight: '800', fontSize: 14 }}>
                              {c.authorName}
                            </Text>
                            <Text style={{ color: colors.textMuted, fontSize: 12 }}>{c.createdAt}</Text>
                          </View>
                          <Text style={{ color: colors.text, fontSize: 14.5, lineHeight: 20 }}>
                            {c.content}
                          </Text>
                        </View>
                      </View>
                    ))
                  )}
                </ScrollView>
              )}

              {/* Sticky Reply Input Bar */}
              <View style={[styles.replyBar, { borderTopColor: hairline }]}>
                <StudentAvatar avatarId={profile.avatarEmoji} bgColor={profile.avatarBg} size={34} />
                <TextInput
                  value={commentDraft}
                  onChangeText={setCommentDraft}
                  placeholder="Post your reply..."
                  placeholderTextColor={colors.textMuted}
                  style={[styles.replyInput, { color: colors.text }]}
                  returnKeyType="send"
                  onSubmitEditing={handleSendReply}
                />
                <AnimatedPressable
                  onPress={handleSendReply}
                  style={[
                    styles.publishBtn,
                    { backgroundColor: commentDraft.trim() ? '#FF6B4A' : 'rgba(255,107,74,0.45)' },
                  ]}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13.5 }}>Reply</Text>
                </AnimatedPressable>
              </View>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  topAvatarBtn: { padding: 2 },
  topTitleWrap: { flex: 1, alignItems: 'center' },
  topTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  topIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchStrip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    position: 'relative',
  },
  tabLabel: { fontSize: 14 },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    width: 48,
    height: 3,
    borderRadius: 999,
  },
  feedContent: { paddingBottom: 110 },
  inlinePromptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  inlinePromptPlaceholder: { flex: 1, fontSize: 15, fontWeight: '500' },
  inlinePromptBtn: {
    backgroundColor: '#FF6B4A',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 999,
  },
  inlinePromptBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13.5 },
  tweetRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tweetLeft: { paddingTop: 2 },
  tweetRight: { flex: 1, gap: 6 },
  tweetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  tweetAuthorLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    flexShrink: 1,
  },
  authorName: { fontSize: 15, fontWeight: '800', flexShrink: 0 },
  authorMeta: { fontSize: 13.5, flexShrink: 1 },
  moreBtn: { padding: 4 },
  tagLine: { flexDirection: 'row' },
  topicChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  tweetBody: { fontSize: 15.5, lineHeight: 22 },
  tweetMedia: {
    width: '100%',
    height: 200,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 4,
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingRight: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  actionCount: { fontSize: 12.5, fontWeight: '600' },
  fab: {
    position: 'absolute',
    right: 18,
    bottom: 92,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF6B4A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B4A',
    shadowOpacity: 0.38,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 28,
    gap: 8,
  },
  emptyTitle: { fontSize: 17, fontWeight: '800', textAlign: 'center' },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  groupPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 999,
  },
  groupForm: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
  },
  visBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 999,
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  groupIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
  },
  modalSafe: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  publishBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 999,
  },
  tagSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagOption: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  modalTextInput: {
    fontSize: 17,
    lineHeight: 24,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  previewWrap: { position: 'relative', marginTop: 8 },
  previewImg: { width: '100%', height: 190, borderRadius: 14 },
  removeImgBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerIconBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  threadParent: {
    padding: 16,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  threadParentBody: { fontSize: 17.5, lineHeight: 25 },
  replyRow: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  replyInput: { flex: 1, fontSize: 15, paddingVertical: 6 },
});
