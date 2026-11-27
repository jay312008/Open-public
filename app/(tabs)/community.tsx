import React, { useState } from 'react';
import {
  Alert,
  Image,
  Modal,
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
import { BrandHeader } from '@/components/BrandHeader';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { useTheme } from '@/theme/ThemeContext';
import { useApp } from '@/store/AppContext';
import { CommunityPost } from '@/types/models';

const FEED_TABS = ['For You', 'Groups', 'Following', 'Saved'] as const;

export default function CommunityScreen() {
  const { colors } = useTheme();
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
  } = useApp();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<(typeof FEED_TABS)[number]>('For You');
  const [composerText, setComposerText] = useState('');
  const [composerImage, setComposerImage] = useState<string | undefined>();
  const [composerModalOpen, setComposerModalOpen] = useState(false);
  const [activePostForComments, setActivePostForComments] = useState<CommunityPost | null>(null);
  const [commentDraft, setCommentDraft] = useState('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [grpName, setGrpName] = useState('');
  const [grpSubject, setGrpSubject] = useState('Mathematics');
  const [grpDesc, setGrpDesc] = useState('');
  const [grpPrivate, setGrpPrivate] = useState(true);
  const [grpBilling, setGrpBilling] = useState<'personal' | 'group_pool' | 'sponsored'>('personal');

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
      composerText.trim() || 'Shared a study image 📸',
      'Study Note',
      composerImage
    );
    setComposerText('');
    setComposerImage(undefined);
    setComposerModalOpen(false);
  };

  const filteredPosts = posts.filter((p) => {
    if (activeTab === 'Following') {
      return profile.following.includes(p.authorId) || p.authorId === profile.id;
    }
    if (activeTab === 'Saved') {
      return p.bookmarks.includes(profile.id);
    }
    return true;
  });

  const handleShare = (post: CommunityPost) => {
    Share.share({
      message: `${post.authorName} on LearnyMol: "${post.content}"`,
    }).catch(() => {});
  };

  const handleReport = () => {
    Alert.alert('Reported', 'Thank you. This post has been flagged for moderation review.');
  };

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <BrandHeader />

        {/* Rounded Feed Tabs */}
        <View style={styles.tabsRow}>
          {FEED_TABS.map((tab) => {
            const active = activeTab === tab;
            return (
              <AnimatedPressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[
                  styles.tabPill,
                  {
                    backgroundColor: active ? colors.coral : colors.surface,
                    borderColor: active ? colors.coral : colors.border,
                  },
                ]}
              >
                <Text
                  style={[styles.tabText, { color: active ? '#FFFFFF' : colors.text }]}
                  numberOfLines={1}
                >
                  {tab}
                </Text>
              </AnimatedPressable>
            );
          })}
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Compact Inline Post Composer */}
          {activeTab !== 'Groups' && (
            <View
              style={[
                styles.composerCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={[styles.avatarSm, { backgroundColor: profile.avatarBg }]}>
                <Text style={{ fontSize: 18 }}>{profile.avatarEmoji}</Text>
              </View>
              <TextInput
                value={composerText}
                onChangeText={setComposerText}
                placeholder="Share a study note, tip, or question..."
                placeholderTextColor={colors.textMuted}
                style={[styles.composerInput, { color: colors.text }]}
              />
              <AnimatedPressable onPress={pickImage} style={styles.composerIconBtn}>
                <Ionicons name="image-outline" size={20} color={colors.textSecondary} />
              </AnimatedPressable>
              <AnimatedPressable
                onPress={handlePublish}
                style={[styles.postMiniBtn, { backgroundColor: colors.coral }]}
              >
                <Text style={styles.postMiniText}>Post</Text>
              </AnimatedPressable>
            </View>
          )}

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

          {/* GROUPS TAB */}
          {activeTab === 'Groups' ? (
            <View style={{ gap: 12 }}>
              <AnimatedPressable
                onPress={() => setShowCreateGroup((v) => !v)}
                style={[
                  styles.postCard,
                  {
                    backgroundColor: colors.mintDark,
                    borderColor: colors.mintDark,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    paddingVertical: 13,
                  },
                ]}
              >
                <Ionicons name={showCreateGroup ? 'close' : 'add-circle-outline'} size={19} color="#FFFFFF" />
                <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 14.5 }}>
                  {showCreateGroup ? 'Cancel' : 'Create Study Group'}
                </Text>
              </AnimatedPressable>

              {showCreateGroup && (
                <View style={[styles.postCard, { backgroundColor: colors.surface, borderColor: colors.border, gap: 10 }]}>
                  <Text style={[styles.groupTitle, { color: colors.text }]}>New AI Study Group</Text>
                  <TextInput
                    value={grpName}
                    onChangeText={setGrpName}
                    placeholder="Group name (e.g. GCE Physics A-Level Squad)"
                    placeholderTextColor={colors.textMuted}
                    style={[
                      styles.composerInput,
                      {
                        color: colors.text,
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: 12,
                        paddingHorizontal: 12,
                        paddingVertical: 9,
                      },
                    ]}
                  />
                  <TextInput
                    value={grpSubject}
                    onChangeText={setGrpSubject}
                    placeholder="Subject (e.g. Physics, Biology, Economics)"
                    placeholderTextColor={colors.textMuted}
                    style={[
                      styles.composerInput,
                      {
                        color: colors.text,
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: 12,
                        paddingHorizontal: 12,
                        paddingVertical: 9,
                      },
                    ]}
                  />
                  <TextInput
                    value={grpDesc}
                    onChangeText={setGrpDesc}
                    placeholder="Short study goal..."
                    placeholderTextColor={colors.textMuted}
                    style={[
                      styles.composerInput,
                      {
                        color: colors.text,
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: 12,
                        paddingHorizontal: 12,
                        paddingVertical: 9,
                      },
                    ]}
                  />
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {[
                      { label: '🔒 Private (AI Enabled)', value: true },
                      { label: '🌍 Public (Peer-Only)', value: false },
                    ].map((opt) => (
                      <AnimatedPressable
                        key={opt.label}
                        onPress={() => setGrpPrivate(opt.value)}
                        style={{
                          flex: 1,
                          paddingVertical: 9,
                          borderRadius: 999,
                          alignItems: 'center',
                          backgroundColor: grpPrivate === opt.value ? colors.coral : colors.surfaceMuted,
                        }}
                      >
                        <Text
                          style={{
                            color: grpPrivate === opt.value ? '#FFFFFF' : colors.text,
                            fontSize: 12,
                            fontWeight: '800',
                          }}
                        >
                          {opt.label}
                        </Text>
                      </AnimatedPressable>
                    ))}
                  </View>
                  {grpPrivate && (
                    <View style={{ gap: 6 }}>
                      <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '700' }}>
                        AI Credit Billing Mode (up to 5 AI Teachers):
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        {(
                          [
                            { id: 'personal', label: 'Personal' },
                            { id: 'group_pool', label: 'Group Pool' },
                            { id: 'sponsored', label: 'Sponsored' },
                          ] as const
                        ).map((b) => (
                          <AnimatedPressable
                            key={b.id}
                            onPress={() => setGrpBilling(b.id)}
                            style={{
                              flex: 1,
                              paddingVertical: 7,
                              borderRadius: 999,
                              alignItems: 'center',
                              backgroundColor: grpBilling === b.id ? colors.purple : colors.surfaceMuted,
                            }}
                          >
                            <Text
                              style={{
                                color: grpBilling === b.id ? '#FFFFFF' : colors.text,
                                fontSize: 11.5,
                                fontWeight: '800',
                              }}
                            >
                              {b.label}
                            </Text>
                          </AnimatedPressable>
                        ))}
                      </View>
                    </View>
                  )}
                  <AnimatedPressable
                    onPress={() => {
                      if (!grpName.trim()) return;
                      const created = createStudyGroup({
                        name: grpName,
                        subject: grpSubject,
                        description: grpDesc,
                        isPrivate: grpPrivate,
                        aiTeacherIds: grpPrivate ? ['t-gce-math'] : [],
                        billingMode: grpBilling,
                      });
                      setGrpName('');
                      setGrpDesc('');
                      setShowCreateGroup(false);
                      router.push(`/community/group/${created.id}`);
                    }}
                    style={{
                      backgroundColor: grpName.trim() ? colors.mintDark : colors.surfaceMuted,
                      paddingVertical: 12,
                      borderRadius: 999,
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{
                        color: grpName.trim() ? '#FFFFFF' : colors.textMuted,
                        fontWeight: '800',
                        fontSize: 14,
                      }}
                    >
                      Create & Open Group
                    </Text>
                  </AnimatedPressable>
                </View>
              )}

              {groups.map((grp) => (
                <AnimatedPressable
                  key={grp.id}
                  onPress={() => router.push(`/community/group/${grp.id}`)}
                  style={[
                    styles.postCard,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                >
                  <View style={styles.rowBetween}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.groupTitle, { color: colors.text }]}>{grp.name}</Text>
                      <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                        {grp.subject} · {grp.memberCount} members · {grp.isPrivate ? '🔒 Private' : '🌍 Public'}
                        {grp.isPrivate && grp.aiEnabled ? ' · 🤖 AI' : ''}
                      </Text>
                    </View>
                    <AnimatedPressable
                      onPress={() => toggleJoinGroup(grp.id)}
                      style={[
                        styles.joinBtn,
                        {
                          backgroundColor: grp.joined ? colors.surfaceMint : colors.coral,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: grp.joined ? colors.mintDark : '#FFFFFF',
                          fontSize: 12,
                          fontWeight: '800',
                        }}
                      >
                        {grp.joined ? 'Joined' : 'Join'}
                      </Text>
                    </AnimatedPressable>
                  </View>
                  <Text style={[styles.postBody, { color: colors.textSecondary }]}>
                    {grp.description}
                  </Text>
                </AnimatedPressable>
              ))}
            </View>
          ) : filteredPosts.length === 0 ? (
            <View
              style={[
                styles.postCard,
                { backgroundColor: colors.surface, borderColor: colors.border, alignItems: 'center', paddingVertical: 28 },
              ]}
            >
              <Ionicons name="chatbubbles-outline" size={32} color={colors.textMuted} />
              <Text style={[styles.groupTitle, { color: colors.text, marginTop: 8 }]}>
                Nothing here yet
              </Text>
              <Text style={[styles.metaText, { color: colors.textSecondary, textAlign: 'center' }]}>
                {activeTab === 'Saved'
                  ? 'Bookmark helpful study notes to find them quickly here.'
                  : 'Follow classmates or share your first study note above!'}
              </Text>
            </View>
          ) : (
            filteredPosts.map((post) => {
              const liked = post.likes.includes(profile.id);
              const saved = post.bookmarks.includes(profile.id);
              const isOwn = post.authorId === profile.id;

              return (
                <View
                  key={post.id}
                  style={[
                    styles.postCard,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                >
                  <View style={styles.postHeader}>
                    <AnimatedPressable
                      onPress={() => router.push(`/profile/${post.authorUsername}`)}
                      style={styles.authorRow}
                    >
                      <View style={[styles.avatarSm, { backgroundColor: post.authorBg }]}>
                        <Text style={{ fontSize: 18 }}>{post.authorAvatar}</Text>
                      </View>
                      <View>
                        <Text style={[styles.authorName, { color: colors.text }]}>
                          {post.authorName}
                        </Text>
                        <Text style={[styles.metaText, { color: colors.textMuted }]}>
                          @{post.authorUsername} · {post.createdAt}
                        </Text>
                      </View>
                    </AnimatedPressable>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      {post.subjectTag && (
                        <View style={[styles.tagPill, { backgroundColor: colors.surfaceMint }]}>
                          <Text style={[styles.tagText, { color: colors.mintDark }]}>
                            {post.subjectTag}
                          </Text>
                        </View>
                      )}
                      <AnimatedPressable
                        onPress={() => (isOwn ? deletePost(post.id) : handleReport())}
                      >
                        <Ionicons
                          name={isOwn ? 'trash-outline' : 'flag-outline'}
                          size={16}
                          color={colors.textMuted}
                        />
                      </AnimatedPressable>
                    </View>
                  </View>

                  <Text style={[styles.postBody, { color: colors.text }]}>{post.content}</Text>

                  {post.imageUri && (
                    <Image source={{ uri: post.imageUri }} style={styles.postImg} />
                  )}

                  <View style={[styles.actionsRow, { borderTopColor: colors.borderSubtle }]}>
                    <AnimatedPressable
                      onPress={() => toggleLikePost(post.id)}
                      style={styles.actionBtn}
                    >
                      <Ionicons
                        name={liked ? 'heart' : 'heart-outline'}
                        size={19}
                        color={liked ? colors.coral : colors.textSecondary}
                      />
                      <Text style={[styles.actionCount, { color: colors.textSecondary }]}>
                        {post.likes.length}
                      </Text>
                    </AnimatedPressable>

                    <AnimatedPressable
                      onPress={() => setActivePostForComments(post)}
                      style={styles.actionBtn}
                    >
                      <Ionicons name="chatbubble-outline" size={18} color={colors.textSecondary} />
                      <Text style={[styles.actionCount, { color: colors.textSecondary }]}>
                        {post.comments.length}
                      </Text>
                    </AnimatedPressable>

                    <AnimatedPressable onPress={() => handleShare(post)} style={styles.actionBtn}>
                      <Ionicons name="share-social-outline" size={18} color={colors.textSecondary} />
                    </AnimatedPressable>

                    <AnimatedPressable
                      onPress={() => toggleBookmarkPost(post.id)}
                      style={styles.actionBtn}
                    >
                      <Ionicons
                        name={saved ? 'bookmark' : 'bookmark-outline'}
                        size={18}
                        color={saved ? colors.coral : colors.textSecondary}
                      />
                    </AnimatedPressable>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Coral Floating Create-Post Button */}
        <AnimatedPressable
          onPress={() => setComposerModalOpen(true)}
          style={[styles.fab, { backgroundColor: colors.coral }]}
          accessibilityLabel="Create post"
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </AnimatedPressable>

        {/* Full Create Post Modal */}
        <Modal visible={composerModalOpen} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
              <View style={styles.rowBetween}>
                <Text style={[styles.groupTitle, { color: colors.text }]}>Create Study Post</Text>
                <AnimatedPressable onPress={() => setComposerModalOpen(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </AnimatedPressable>
              </View>
              <TextInput
                value={composerText}
                onChangeText={setComposerText}
                placeholder="Write notes, ask a question, or share a formula..."
                placeholderTextColor={colors.textMuted}
                multiline
                style={[styles.modalTextarea, { color: colors.text, borderColor: colors.border }]}
              />
              <View style={styles.rowBetween}>
                <AnimatedPressable onPress={pickImage} style={styles.actionBtn}>
                  <Ionicons name="image-outline" size={20} color={colors.coral} />
                  <Text style={{ color: colors.coral, fontWeight: '700' }}>Add Photo</Text>
                </AnimatedPressable>
                <AnimatedPressable
                  onPress={handlePublish}
                  style={[styles.joinBtn, { backgroundColor: colors.coral, paddingHorizontal: 22 }]}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>Publish</Text>
                </AnimatedPressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* Comments Modal */}
        <Modal visible={Boolean(activePostForComments)} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
              <View style={styles.rowBetween}>
                <Text style={[styles.groupTitle, { color: colors.text }]}>Comments</Text>
                <AnimatedPressable onPress={() => setActivePostForComments(null)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </AnimatedPressable>
              </View>
              <ScrollView style={{ maxHeight: 260 }}>
                {(
                  posts.find((p) => p.id === activePostForComments?.id)?.comments ?? []
                ).map((c) => (
                  <View key={c.id} style={styles.commentRow}>
                    <Text style={{ fontSize: 18 }}>{c.authorAvatar}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.authorName, { color: colors.text }]}>
                        {c.authorName} · <Text style={{ color: colors.textMuted, fontWeight: '400' }}>{c.createdAt}</Text>
                      </Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{c.content}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
              <View style={styles.commentInputRow}>
                <TextInput
                  value={commentDraft}
                  onChangeText={setCommentDraft}
                  placeholder="Write a reply..."
                  placeholderTextColor={colors.textMuted}
                  style={[styles.commentInput, { color: colors.text, borderColor: colors.border }]}
                />
                <AnimatedPressable
                  onPress={() => {
                    if (activePostForComments && commentDraft.trim()) {
                      addCommentToPost(activePostForComments.id, commentDraft);
                      setCommentDraft('');
                    }
                  }}
                  style={[styles.postMiniBtn, { backgroundColor: colors.coral }]}
                >
                  <Text style={styles.postMiniText}>Send</Text>
                </AnimatedPressable>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  tabsRow: { flexDirection: 'row', paddingHorizontal: 14, gap: 6, marginBottom: 10 },
  tabPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
  },
  tabText: { fontSize: 12, fontWeight: '700' },
  scroll: { paddingHorizontal: 16, paddingBottom: 120, gap: 12 },
  composerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  avatarSm: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerInput: { flex: 1, fontSize: 13.5, paddingVertical: 6 },
  composerIconBtn: { padding: 6 },
  postMiniBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  postMiniText: { color: '#FFFFFF', fontSize: 12.5, fontWeight: '800' },
  previewWrap: { position: 'relative', borderRadius: 16, overflow: 'hidden' },
  previewImg: { width: '100%', height: 160, borderRadius: 16 },
  removeImgBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  postCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  postHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  authorName: { fontSize: 14, fontWeight: '800' },
  metaText: { fontSize: 11.5 },
  tagPill: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999 },
  tagText: { fontSize: 10.5, fontWeight: '800' },
  postBody: { fontSize: 14, lineHeight: 20 },
  postImg: { width: '100%', height: 190, borderRadius: 14 },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, padding: 4 },
  actionCount: { fontSize: 12.5, fontWeight: '600' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  groupTitle: { fontSize: 16, fontWeight: '800' },
  joinBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 98,
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 20,
    paddingBottom: 34,
    gap: 14,
  },
  modalTextarea: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: 14,
  },
  commentRow: { flexDirection: 'row', gap: 10, paddingVertical: 8 },
  commentInputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  commentInput: { flex: 1, borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
});
