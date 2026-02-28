import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Pressable,
  FlatList,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiRequest } from '@/lib/query-client';
import Colors from '@/constants/colors';

interface WorkshopRecord {
  id: number;
  topic_title: string;
  total_score: number;
  participants: string[];
  summary_report: string;
  created_at: string;
  completed_at: string;
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const [workshops, setWorkshops] = useState<WorkshopRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWorkshops = useCallback(async () => {
    try {
      const res = await apiRequest('GET', '/api/workshops');
      const data = await res.json();
      setWorkshops(data);
    } catch (error) {
      console.error('Failed to fetch workshops:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchWorkshops();
    }, [fetchWorkshops])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchWorkshops();
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

  const getScoreColor = (score: number) => {
    if (score >= 8) return Colors.success;
    if (score >= 5) return Colors.warning;
    return Colors.danger;
  };

  const renderWorkshop = ({ item }: { item: WorkshopRecord }) => {
    const participants: string[] = Array.isArray(item.participants) ? item.participants : [];
    const hasSummary = !!item.summary_report && item.summary_report.length > 0;
    const summaryPreview = item.summary_report
      ? item.summary_report.replace(/[#*\n]/g, ' ').trim().slice(0, 80)
      : '';

    return (
      <Pressable
        onPress={() => router.push(`/history-detail?id=${item.id}`)}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      >
        <View style={styles.cardTop}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.topic_title || '(未命名课题)'}
            </Text>
            {item.total_score > 0 && (
              <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(item.total_score) + '18' }]}>
                <Text style={[styles.scoreText, { color: getScoreColor(item.total_score) }]}>
                  {item.total_score}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={14} color={Colors.textTertiary} />
            <Text style={styles.metaText}>{formatDate(item.created_at)}</Text>
          </View>
        </View>

        {participants.length > 0 && (
          <View style={styles.participantsRow}>
            <Ionicons name="people-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.participantsText} numberOfLines={1}>
              {participants.join(', ')}
            </Text>
          </View>
        )}

        {hasSummary ? (
          <View style={styles.summaryRow}>
            <Ionicons name="document-text-outline" size={14} color={Colors.accent} />
            <Text style={styles.summaryPreview} numberOfLines={2}>
              {summaryPreview}...
            </Text>
          </View>
        ) : (
          <View style={styles.summaryRow}>
            <Ionicons name="document-text-outline" size={14} color={Colors.textTertiary} />
            <Text style={styles.noSummaryText}>暂无总结报告</Text>
          </View>
        )}

        <View style={styles.cardFooter}>
          <Text style={styles.viewDetail}>查看详情</Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.accent} />
        </View>
      </Pressable>
    );
  };

  const ListHeader = () => (
    <View style={styles.listHeader}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </Pressable>
        <Text style={styles.pageTitle}>历史研讨</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{workshops.length}</Text>
        </View>
      </View>
    </View>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="folder-open-outline" size={48} color={Colors.textTertiary} />
      <Text style={styles.emptyTitle}>暂无历史研讨</Text>
      <Text style={styles.emptyText}>完成一次研讨后，记录将自动保存在这里</Text>
      <Pressable
        onPress={() => router.replace('/')}
        style={({ pressed }) => [styles.emptyButton, pressed && styles.cardPressed]}
      >
        <Ionicons name="add-circle-outline" size={18} color={Colors.accent} />
        <Text style={styles.emptyButtonText}>开始新的研讨</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top + webTopInset }]}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ListHeader />
          <View style={styles.loadingInner}>
            <ActivityIndicator size="large" color={Colors.accent} />
            <Text style={styles.loadingText}>加载中...</Text>
          </View>
        </View>
      ) : (
        <FlatList
          data={workshops}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderWorkshop}
          ListHeaderComponent={<ListHeader />}
          ListEmptyComponent={<EmptyState />}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 20) },
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.accent} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surfaceSecondary,
  },
  loadingContainer: {
    flex: 1,
  },
  loadingInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textTertiary,
  },
  listContent: {
    padding: 0,
  },
  listHeader: {
    padding: 20,
    paddingBottom: 12,
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
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: Colors.text,
  },
  countBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: Colors.aiGlow,
    borderWidth: 1,
    borderColor: Colors.aiBorder,
  },
  countText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.accent,
  },
  card: {
    backgroundColor: Colors.cardBg,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 10,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  cardTop: {
    gap: 6,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
    lineHeight: 24,
  },
  scoreBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textTertiary,
  },
  participantsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  participantsText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingTop: 2,
  },
  summaryPreview: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  noSummaryText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textTertiary,
    fontStyle: 'italic',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  viewDetail: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: Colors.accent,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.aiGlow,
    borderWidth: 1,
    borderColor: Colors.aiBorder,
  },
  emptyButtonText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: Colors.accent,
  },
});
