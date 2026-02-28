import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Pressable,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiRequest } from '@/lib/query-client';
import Colors from '@/constants/colors';

interface WorkshopDetail {
  id: number;
  topic_title: string;
  topic_background: string;
  topic_pain_points: string;
  topic_tried_actions: string;
  total_score: number;
  golden_questions: string[];
  participants: string[];
  reflections: string;
  action_plan: { owner: string; action: string; deadline: string }[];
  summary_report: string;
  created_at: string;
  completed_at: string;
}

export default function HistoryDetailScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const { id } = useLocalSearchParams<{ id: string }>();
  const [workshop, setWorkshop] = useState<WorkshopDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    try {
      const res = await apiRequest('GET', `/api/workshops/${id}`);
      const data = await res.json();
      setWorkshop(data);
    } catch (error) {
      console.error('Failed to fetch workshop detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hour = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hour}:${min}`;
  };

  if (loading) {
    return (
      <View style={[styles.root, styles.center, { paddingTop: insets.top + webTopInset }]}>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  if (!workshop) {
    return (
      <View style={[styles.root, styles.center, { paddingTop: insets.top + webTopInset }]}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.textTertiary} />
        <Text style={styles.loadingText}>未找到研讨记录</Text>
        <Pressable onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>返回列表</Text>
        </Pressable>
      </View>
    );
  }

  const goldenQuestions: string[] = Array.isArray(workshop.golden_questions) ? workshop.golden_questions : [];
  const participants: string[] = Array.isArray(workshop.participants) ? workshop.participants : [];
  const actionPlan: { owner: string; action: string; deadline: string }[] = Array.isArray(workshop.action_plan) ? workshop.action_plan : [];

  return (
    <View style={[styles.root, { paddingTop: insets.top + webTopInset }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 20) }]}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color={Colors.text} />
          </Pressable>
          <Text style={styles.pageTitle}>研讨详情</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.topicTitle}>{workshop.topic_title}</Text>
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={14} color={Colors.textTertiary} />
            <Text style={styles.metaText}>{formatDate(workshop.created_at)}</Text>
            {workshop.total_score > 0 && (
              <>
                <View style={styles.metaDot} />
                <Ionicons name="star" size={14} color={Colors.warning} />
                <Text style={styles.metaText}>评分 {workshop.total_score}/10</Text>
              </>
            )}
          </View>
        </View>

        {participants.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="people-outline" size={18} color={Colors.accent} />
              <Text style={styles.cardTitle}>参与人员</Text>
            </View>
            <View style={styles.chipsRow}>
              {participants.map((p, i) => (
                <View key={i} style={styles.chip}>
                  <Text style={styles.chipText}>{p}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {(!!workshop.topic_background || !!workshop.topic_pain_points) && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="information-circle-outline" size={18} color={Colors.accent} />
              <Text style={styles.cardTitle}>课题信息</Text>
            </View>
            {!!workshop.topic_background && (
              <View style={styles.infoBlock}>
                <Text style={styles.infoLabel}>背景现状</Text>
                <Text style={styles.infoValue}>{workshop.topic_background}</Text>
              </View>
            )}
            {!!workshop.topic_pain_points && (
              <View style={styles.infoBlock}>
                <Text style={styles.infoLabel}>核心痛点</Text>
                <Text style={styles.infoValue}>{workshop.topic_pain_points}</Text>
              </View>
            )}
            {!!workshop.topic_tried_actions && (
              <View style={styles.infoBlock}>
                <Text style={styles.infoLabel}>已尝试行动</Text>
                <Text style={styles.infoValue}>{workshop.topic_tried_actions}</Text>
              </View>
            )}
          </View>
        )}

        {goldenQuestions.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="star" size={18} color={Colors.warning} />
              <Text style={styles.cardTitle}>黄金问题</Text>
            </View>
            {goldenQuestions.map((q, i) => (
              <View key={i} style={styles.goldenItem}>
                <View style={styles.goldenNumber}>
                  <Text style={styles.goldenNumberText}>{i + 1}</Text>
                </View>
                <Text style={styles.goldenText}>{q}</Text>
              </View>
            ))}
          </View>
        )}

        {!!workshop.reflections && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="bulb-outline" size={18} color={Colors.accent} />
              <Text style={styles.cardTitle}>反思记录</Text>
            </View>
            <Text style={styles.bodyText}>{workshop.reflections}</Text>
          </View>
        )}

        {actionPlan.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="list-outline" size={18} color={Colors.accent} />
              <Text style={styles.cardTitle}>行动计划</Text>
            </View>
            {actionPlan.map((item, i) => (
              <View key={i} style={styles.actionItem}>
                <View style={styles.actionRow}>
                  <Text style={styles.actionLabel}>责任人</Text>
                  <Text style={styles.actionValue}>{item.owner || '-'}</Text>
                </View>
                <View style={styles.actionRow}>
                  <Text style={styles.actionLabel}>行动</Text>
                  <Text style={styles.actionValue}>{item.action || '-'}</Text>
                </View>
                <View style={styles.actionRow}>
                  <Text style={styles.actionLabel}>截止</Text>
                  <Text style={styles.actionValue}>{item.deadline || '-'}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {!!workshop.summary_report && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="document-text-outline" size={18} color={Colors.accent} />
              <Text style={styles.cardTitle}>总结报告</Text>
            </View>
            <Text style={styles.bodyText}>{workshop.summary_report}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surfaceSecondary,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textTertiary,
  },
  backLink: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  backLinkText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: Colors.accent,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  pageTitle: {
    flex: 1,
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: Colors.text,
  },
  section: {
    gap: 8,
  },
  topicTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: Colors.text,
    lineHeight: 28,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textTertiary,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.textTertiary,
    marginHorizontal: 4,
  },
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.surfaceTertiary,
  },
  chipText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: Colors.text,
  },
  infoBlock: {
    gap: 4,
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.text,
    lineHeight: 22,
  },
  goldenItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: Colors.warningLight,
    borderRadius: 12,
    padding: 12,
  },
  goldenNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.warning,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goldenNumberText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
  },
  goldenText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.text,
    lineHeight: 22,
  },
  bodyText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.text,
    lineHeight: 24,
  },
  actionItem: {
    backgroundColor: Colors.surfaceTertiary,
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionLabel: {
    width: 48,
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textSecondary,
  },
  actionValue: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.text,
  },
});
