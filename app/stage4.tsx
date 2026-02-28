import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetch } from 'expo/fetch';
import { getApiUrl, apiRequest } from '@/lib/query-client';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import {
  useWorkshop,
  ActionItem,
  generateId,
} from '@/contexts/WorkshopContext';
import StageProgress from '@/components/StageProgress';
import AICard from '@/components/AICard';
import LoadingDots from '@/components/LoadingDots';

export default function Stage4Screen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const {
    topic,
    evaluation,
    goldenQuestions,
    questions,
    reflections,
    setReflections,
    actionPlan,
    addActionItem,
    updateActionItem,
    removeActionItem,
    summaryReport,
    setSummaryReport,
    resetWorkshop,
  } = useWorkshop();

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleAddAction = () => {
    addActionItem({
      id: generateId(),
      owner: '',
      action: '',
      deadline: '',
    });
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const saveWorkshop = async (report: string) => {
    try {
      const uniqueAuthors = [...new Set(questions.map(q => q.author).filter(a => a !== 'AI'))];
      await apiRequest('POST', '/api/workshops', {
        topicTitle: topic.title,
        topicBackground: topic.background,
        topicPainPoints: topic.painPoints,
        topicTriedActions: topic.triedActions,
        totalScore: evaluation?.totalScore || 0,
        goldenQuestions: goldenQuestions.map(q => q.text),
        participants: uniqueAuthors,
        reflections,
        actionPlan: actionPlan.map(a => ({ owner: a.owner, action: a.action, deadline: a.deadline })),
        summaryReport: report,
      });
      setIsSaved(true);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Save workshop error:', error);
    }
  };

  const handleGenerateSummary = async () => {
    setIsGenerating(true);
    setSummaryReport('');
    setIsSaved(false);

    try {
      const baseUrl = getApiUrl();
      const response = await fetch(`${baseUrl}api/generate-summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          topic,
          goldenQuestions: goldenQuestions.map(q => q.text),
          reflections,
          actionPlan,
        }),
      });

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              fullContent += parsed.content;
              setSummaryReport(fullContent);
            }
          } catch {}
        }
      }

      if (fullContent) {
        await saveWorkshop(fullContent);
      }
    } catch (error) {
      console.error('Summary error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBackToHome = () => {
    resetWorkshop();
    router.replace('/');
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + webTopInset }]}>
      <StageProgress currentStage={4} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color={Colors.text} />
          </Pressable>
          <Text style={styles.pageTitle}>认知重构 & 行动计划</Text>
        </View>

        {goldenQuestions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="star" size={18} color={Colors.warning} />
              <Text style={styles.sectionTitle}>黄金问题</Text>
            </View>
            {goldenQuestions.map((q, i) => (
              <View key={q.id} style={styles.goldenCard}>
                <View style={styles.goldenNumber}>
                  <Text style={styles.goldenNumberText}>{i + 1}</Text>
                </View>
                <Text style={styles.goldenText}>{q.text}</Text>
              </View>
            ))}
          </View>
        )}

        {goldenQuestions.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="star-outline" size={36} color={Colors.textTertiary} />
            <Text style={styles.emptyText}>
              尚未选择黄金问题，请返回上一步在提问列表中标记
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bulb-outline" size={18} color={Colors.accent} />
            <Text style={styles.sectionTitle}>四层次认知重构</Text>
          </View>

          <View style={styles.reflectionCard}>
            <ReflectionField
              label="1. 我看到了什么？（事实层）"
              placeholder="记录在研讨中观察到的客观事实和数据..."
            />
            <ReflectionField
              label="2. 我感受到了什么？（感受层）"
              placeholder="记录你在整个过程中的情感体验..."
            />
            <ReflectionField
              label="3. 我学到了什么？（认知层）"
              placeholder="这次研讨改变了你的哪些认知或假设..."
            />
            <ReflectionField
              label="4. 我将如何行动？（行动层）"
              placeholder="基于以上反思，你接下来打算怎么做..."
            />
          </View>

          <View style={styles.notesField}>
            <Text style={styles.notesLabel}>综合反思笔记</Text>
            <TextInput
              style={styles.notesInput}
              value={reflections}
              onChangeText={setReflections}
              placeholder="记录你的核心反思和心智模式的变化..."
              placeholderTextColor={Colors.textTertiary}
              multiline
              textAlignVertical="top"
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="list-outline" size={18} color={Colors.accent} />
            <Text style={styles.sectionTitle}>行动计划</Text>
          </View>

          {actionPlan.map((item) => (
            <ActionItemCard
              key={item.id}
              item={item}
              onUpdate={(updates) => updateActionItem(item.id, updates)}
              onRemove={() => removeActionItem(item.id)}
            />
          ))}

          <Pressable
            onPress={handleAddAction}
            style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
          >
            <Ionicons name="add-circle-outline" size={18} color={Colors.accent} />
            <Text style={styles.addButtonText}>新增行动项</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Pressable
            onPress={handleGenerateSummary}
            disabled={isGenerating}
            style={({ pressed }) => [
              styles.generateButton,
              pressed && styles.pressed,
            ]}
          >
            {isGenerating ? (
              <View style={styles.genRow}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.generateButtonText}>AI 生成中...</Text>
              </View>
            ) : (
              <View style={styles.genRow}>
                <Ionicons name="sparkles" size={20} color="#FFFFFF" />
                <Text style={styles.generateButtonText}>生成总结报告</Text>
              </View>
            )}
          </Pressable>

          {isGenerating && !summaryReport && (
            <AICard title="AI 正在生成总结报告...">
              <LoadingDots />
            </AICard>
          )}

          {!!summaryReport && (
            <AICard title="研讨总结报告">
              <Text style={styles.reportText}>{summaryReport}</Text>
            </AICard>
          )}

          {isSaved && (
            <View style={styles.savedBanner}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
              <Text style={styles.savedText}>研讨记录已自动保存</Text>
            </View>
          )}
        </View>

        <Pressable
          onPress={handleBackToHome}
          style={({ pressed }) => [styles.homeButton, pressed && styles.pressed]}
        >
          <Ionicons name="home-outline" size={18} color={Colors.accent} />
          <Text style={styles.homeButtonText}>返回首页</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function ReflectionField({ label, placeholder }: { label: string; placeholder: string }) {
  const [text, setText] = useState('');
  return (
    <View style={rfStyles.container}>
      <Text style={rfStyles.label}>{label}</Text>
      <TextInput
        style={rfStyles.input}
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textTertiary}
        multiline
        textAlignVertical="top"
      />
    </View>
  );
}

const rfStyles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.inputBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.text,
    minHeight: 60,
  },
});

function ActionItemCard({
  item,
  onUpdate,
  onRemove,
}: {
  item: ActionItem;
  onUpdate: (updates: Partial<ActionItem>) => void;
  onRemove: () => void;
}) {
  return (
    <View style={aiStyles.card}>
      <View style={aiStyles.topRow}>
        <Text style={aiStyles.cardTitle}>
          {item.owner || item.action ? `${item.owner || '...'} - ${item.action || '...'}` : '新行动项'}
        </Text>
        <Pressable onPress={onRemove}>
          <Ionicons name="trash-outline" size={18} color={Colors.danger} />
        </Pressable>
      </View>
      <View style={aiStyles.fields}>
        <View style={aiStyles.fieldRow}>
          <Text style={aiStyles.fieldLabel}>责任人</Text>
          <TextInput
            style={aiStyles.fieldInput}
            value={item.owner}
            onChangeText={(t) => onUpdate({ owner: t })}
            placeholder="输入责任人姓名"
            placeholderTextColor={Colors.textTertiary}
          />
        </View>
        <View style={aiStyles.fieldRow}>
          <Text style={aiStyles.fieldLabel}>具体行动</Text>
          <TextInput
            style={aiStyles.fieldInput}
            value={item.action}
            onChangeText={(t) => onUpdate({ action: t })}
            placeholder="描述具体的行动任务"
            placeholderTextColor={Colors.textTertiary}
          />
        </View>
        <View style={aiStyles.fieldRow}>
          <Text style={aiStyles.fieldLabel}>截止日期</Text>
          <TextInput
            style={aiStyles.fieldInput}
            value={item.deadline}
            onChangeText={(t) => onUpdate({ deadline: t })}
            placeholder="如：2026-03-15"
            placeholderTextColor={Colors.textTertiary}
          />
        </View>
      </View>
    </View>
  );
}

const aiStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
    flex: 1,
  },
  fields: {
    gap: 8,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fieldLabel: {
    width: 64,
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
  },
  fieldInput: {
    flex: 1,
    height: 38,
    backgroundColor: Colors.inputBg,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
  },
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surfaceSecondary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 20,
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
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: Colors.text,
    flex: 1,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    color: Colors.text,
  },
  goldenCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: Colors.warningLight,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  goldenNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.warning,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goldenNumberText: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
  },
  goldenText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: Colors.text,
    lineHeight: 22,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textTertiary,
    textAlign: 'center',
  },
  reflectionCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  notesField: {
    gap: 6,
  },
  notesLabel: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
  },
  notesInput: {
    backgroundColor: Colors.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.text,
    minHeight: 80,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.aiBorder,
    borderStyle: 'dashed',
    backgroundColor: Colors.aiGlow,
  },
  addButtonText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: Colors.accent,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  generateButton: {
    backgroundColor: Colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  genRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  generateButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
  },
  reportText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.text,
    lineHeight: 22,
  },
  homeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.accent,
    backgroundColor: Colors.surface,
  },
  homeButtonText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.accent,
  },
  savedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.successLight,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  savedText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: Colors.success,
  },
});
