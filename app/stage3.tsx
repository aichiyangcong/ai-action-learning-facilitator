import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  Pressable,
  FlatList,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { getApiUrl, apiRequest } from '@/lib/query-client';
import Colors from '@/constants/colors';
import {
  useWorkshop,
  Question,
  generateId,
} from '@/contexts/WorkshopContext';
import StageProgress from '@/components/StageProgress';
import RadarChart from '@/components/RadarChart';
import AICard from '@/components/AICard';
import LoadingDots from '@/components/LoadingDots';

const categoryColors: Record<string, string> = {
  fact: '#3B82F6',
  feeling: '#EC4899',
  finding: '#F59E0B',
  future: '#10B981',
  focus: '#8B5CF6',
};

const categoryLabels: Record<string, string> = {
  fact: '事实',
  feeling: '感受',
  finding: '分析',
  future: '行动',
  focus: '聚焦',
};

const radarLabels: Record<string, string> = {
  fact: '事实类',
  feeling: '感受类',
  finding: '分析类',
  future: '行动类',
  focus: '聚焦类',
};

interface ShadowQuestionData {
  text: string;
  category: string;
  categoryLabel: string;
}

export default function Stage3Screen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const inputRef = useRef<TextInput>(null);
  const {
    topic,
    questions,
    addQuestion,
    updateQuestion,
    radarData,
    updateRadarData,
    setCurrentStage,
  } = useWorkshop();

  const [inputText, setInputText] = useState('');
  const [isClassifying, setIsClassifying] = useState(false);
  const [shadowQuestions, setShadowQuestions] = useState<ShadowQuestionData[]>([]);
  const [missingAlert, setMissingAlert] = useState('');
  const [isLoadingShadow, setIsLoadingShadow] = useState(false);
  const [showRadar, setShowRadar] = useState(true);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const initialLoadDone = useRef(false);

  useEffect(() => {
    if (questions.length === 0 && !initialLoadDone.current) {
      initialLoadDone.current = true;
      loadMockQuestions();
    }
  }, []);

  const loadMockQuestions = () => {
    const mockQuestions: Omit<Question, 'id'>[] = [
      { text: '目前客户跟进的平均响应时间具体是多少？', author: '张明', category: 'fact', categoryLabel: '事实类', isGolden: false, isShadow: false, adopted: true },
      { text: '销售团队每天花在审批流程上的时间占比是多少？', author: '李华', category: 'fact', categoryLabel: '事实类', isGolden: false, isShadow: false, adopted: true },
      { text: '客户满意度下降15%的数据来源是哪个季度的调研？', author: '王芳', category: 'fact', categoryLabel: '事实类', isGolden: false, isShadow: false, adopted: true },
      { text: '如果现在不解决这个问题，最糟糕的情况会怎样？', author: '赵强', category: 'finding', categoryLabel: '分析类', isGolden: false, isShadow: false, adopted: true },
      { text: '是否考虑过让客户参与到流程设计中来？', author: '刘洋', category: 'future', categoryLabel: '行动类', isGolden: false, isShadow: false, adopted: true },
      { text: '问题的根本原因是流程问题还是人的问题？', author: '张明', category: 'focus', categoryLabel: '聚焦类', isGolden: false, isShadow: false, adopted: true },
    ];

    mockQuestions.forEach(q => {
      addQuestion({ ...q, id: generateId() });
    });

    setTimeout(() => updateRadarData(), 100);
  };

  const handleSubmitQuestion = async () => {
    if (!inputText.trim() || isClassifying) return;
    setIsClassifying(true);

    const questionText = inputText.trim();
    setInputText('');

    try {
      const res = await apiRequest('POST', '/api/classify-question', {
        question: questionText,
        topicContext: topic.title,
      });
      const classification = await res.json();

      const newQuestion: Question = {
        id: generateId(),
        text: questionText,
        author: '我',
        category: classification.category || 'fact',
        categoryLabel: classification.categoryLabel || '事实类',
        isGolden: false,
        isShadow: false,
        adopted: true,
      };

      addQuestion(newQuestion);
      updateRadarData();

      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.error('Classification error:', error);
      addQuestion({
        id: generateId(),
        text: questionText,
        author: '我',
        category: 'fact',
        categoryLabel: '事实类',
        isGolden: false,
        isShadow: false,
        adopted: true,
      });
      updateRadarData();
    } finally {
      setIsClassifying(false);
    }
  };

  const handleGenerateShadowQuestions = async () => {
    setIsLoadingShadow(true);
    setShadowQuestions([]);
    setMissingAlert('');

    try {
      const res = await apiRequest('POST', '/api/shadow-questions', {
        topicContext: topic.title + ' ' + topic.painPoints,
        radarData,
        existingQuestions: questions.map(q => q.text),
      });
      const result = await res.json();

      setMissingAlert(result.missingAlert || '');
      setShadowQuestions(result.questions || []);
    } catch (error) {
      console.error('Shadow questions error:', error);
    } finally {
      setIsLoadingShadow(false);
    }
  };

  const handleAdoptShadowQuestion = (sq: ShadowQuestionData) => {
    const newQ: Question = {
      id: generateId(),
      text: sq.text,
      author: 'AI',
      category: sq.category as Question['category'],
      categoryLabel: sq.categoryLabel,
      isGolden: false,
      isShadow: true,
      adopted: true,
    };
    addQuestion(newQ);
    setShadowQuestions(prev => prev.filter(s => s.text !== sq.text));
    updateRadarData();

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleRejectShadowQuestion = (sq: ShadowQuestionData) => {
    setShadowQuestions(prev => prev.filter(s => s.text !== sq.text));
  };

  const handleToggleGolden = (id: string) => {
    const q = questions.find(qq => qq.id === id);
    if (q) {
      updateQuestion(id, { isGolden: !q.isGolden });
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  const handleEnterSelectMode = () => {
    setIsSelectMode(true);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleCancelSelect = () => {
    setIsSelectMode(false);
  };

  const handleConfirmAndNext = () => {
    setCurrentStage(4);
    router.push('/stage4');
  };

  const goldenCount = questions.filter(q => q.isGolden).length;

  const renderQuestion = ({ item }: { item: Question }) => (
    <Pressable
      onPress={isSelectMode ? () => handleToggleGolden(item.id) : undefined}
      style={[
        styles.questionCard,
        isSelectMode && item.isGolden && styles.questionCardSelected,
      ]}
    >
      <View style={styles.questionHeader}>
        <View style={styles.authorRow}>
          {isSelectMode && (
            <View style={[
              styles.checkbox,
              item.isGolden && styles.checkboxChecked,
            ]}>
              {item.isGolden && (
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              )}
            </View>
          )}
          <View style={[
            styles.authorAvatar,
            item.isShadow && styles.aiAvatar,
          ]}>
            <Text style={styles.authorInitial}>
              {item.author === 'AI' ? 'AI' : item.author[0]}
            </Text>
          </View>
          <Text style={styles.authorName}>{item.author}</Text>
          {item.isShadow && (
            <View style={styles.aiTag}>
              <Ionicons name="sparkles" size={10} color={Colors.accent} />
              <Text style={styles.aiTagText}>AI</Text>
            </View>
          )}
        </View>
        {!isSelectMode && (
          <Pressable onPress={() => handleToggleGolden(item.id)}>
            <Ionicons
              name={item.isGolden ? 'star' : 'star-outline'}
              size={22}
              color={item.isGolden ? Colors.warning : Colors.textTertiary}
            />
          </Pressable>
        )}
      </View>
      <Text style={styles.questionText}>{item.text}</Text>
      <View style={styles.questionFooter}>
        <View style={[
          styles.categoryTag,
          { backgroundColor: categoryColors[item.category] + '18' },
        ]}>
          <View style={[
            styles.categoryDot,
            { backgroundColor: categoryColors[item.category] },
          ]} />
          <Text style={[
            styles.categoryText,
            { color: categoryColors[item.category] },
          ]}>
            {item.categoryLabel}
          </Text>
        </View>
        {item.isGolden && !isSelectMode && (
          <View style={styles.goldenIndicator}>
            <Ionicons name="star" size={12} color={Colors.warning} />
          </View>
        )}
      </View>
    </Pressable>
  );

  const ListHeader = () => (
    <View style={styles.listHeader}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </Pressable>
        <Text style={styles.pageTitle}>提问风暴</Text>
      </View>

      {showRadar && (
        <View style={styles.radarCard}>
          <View style={styles.radarHeader}>
            <Ionicons name="analytics-outline" size={18} color={Colors.accent} />
            <Text style={styles.radarTitle}>5F 维度分布</Text>
            <Pressable onPress={() => setShowRadar(false)}>
              <Ionicons name="chevron-up" size={20} color={Colors.textTertiary} />
            </Pressable>
          </View>
          <RadarChart data={radarData} labels={radarLabels} />
          <View style={styles.legendRow}>
            {Object.entries(categoryLabels).map(([key, label]) => (
              <View key={key} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: categoryColors[key] }]} />
                <Text style={styles.legendText}>{label}({radarData[key as keyof typeof radarData] || 0})</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {!showRadar && (
        <Pressable onPress={() => setShowRadar(true)} style={styles.radarToggle}>
          <Ionicons name="analytics-outline" size={16} color={Colors.accent} />
          <Text style={styles.radarToggleText}>展开雷达图</Text>
          <Ionicons name="chevron-down" size={16} color={Colors.textTertiary} />
        </Pressable>
      )}

      <Pressable
        onPress={handleGenerateShadowQuestions}
        disabled={isLoadingShadow}
        style={({ pressed }) => [
          styles.shadowButton,
          pressed && styles.pressed,
        ]}
      >
        <Ionicons name="sparkles" size={16} color={Colors.accent} />
        <Text style={styles.shadowButtonText}>
          {isLoadingShadow ? 'AI 正在分析盲区...' : 'AI 盲区检测 & 影子提问'}
        </Text>
      </Pressable>

      {isLoadingShadow && (
        <AICard title="AI 正在检测思维盲区...">
          <LoadingDots />
        </AICard>
      )}

      {!!missingAlert && (
        <AICard title="盲区预警" variant="warning">
          <Text style={styles.alertText}>{missingAlert}</Text>
        </AICard>
      )}

      {shadowQuestions.length > 0 && (
        <AICard title="AI 影子提问">
          {shadowQuestions.map((sq, i) => (
            <View key={i} style={styles.shadowCard}>
              <Text style={styles.shadowText}>{sq.text}</Text>
              <View style={[
                styles.categoryTag,
                { backgroundColor: categoryColors[sq.category] + '18', marginTop: 8 },
              ]}>
                <View style={[
                  styles.categoryDot,
                  { backgroundColor: categoryColors[sq.category] },
                ]} />
                <Text style={[
                  styles.categoryText,
                  { color: categoryColors[sq.category] },
                ]}>
                  {sq.categoryLabel}
                </Text>
              </View>
              <View style={styles.shadowActions}>
                <Pressable
                  onPress={() => handleAdoptShadowQuestion(sq)}
                  style={[styles.shadowActionBtn, styles.adoptBtn]}
                >
                  <Ionicons name="checkmark" size={16} color={Colors.success} />
                  <Text style={styles.adoptText}>采用</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleRejectShadowQuestion(sq)}
                  style={[styles.shadowActionBtn, styles.rejectBtn]}
                >
                  <Ionicons name="close" size={16} color={Colors.danger} />
                  <Text style={styles.rejectText}>不采用</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </AICard>
      )}

      <View style={styles.questionsHeader}>
        <Text style={styles.questionsTitle}>
          提问列表 ({questions.length})
        </Text>
        {isSelectMode ? (
          <View style={styles.selectModeBadge}>
            <Ionicons name="star" size={12} color={Colors.warning} />
            <Text style={styles.selectModeBadgeText}>
              已选 {goldenCount} 个
            </Text>
          </View>
        ) : (
          goldenCount > 0 && (
            <View style={styles.goldenBadge}>
              <Ionicons name="star" size={12} color={Colors.warning} />
              <Text style={styles.goldenBadgeText}>{goldenCount} 个黄金问题</Text>
            </View>
          )
        )}
      </View>

      {isSelectMode && (
        <View style={styles.selectHint}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.accent} />
          <Text style={styles.selectHintText}>
            点击问题卡片选择黄金问题，选好后点击底部"确认并进入下一步"
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top + webTopInset }]}>
      <StageProgress currentStage={3} />

      <FlatList
        data={[...questions].reverse()}
        keyExtractor={(item) => item.id}
        renderItem={renderQuestion}
        ListHeaderComponent={<ListHeader />}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + (isSelectMode ? 140 : 120) }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      />

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, Platform.OS === 'web' ? 34 : 10) }]}>
        {isSelectMode ? (
          <View style={styles.selectBar}>
            <Pressable
              onPress={handleCancelSelect}
              style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
            >
              <Text style={styles.cancelButtonText}>取消</Text>
            </Pressable>
            <Pressable
              onPress={handleConfirmAndNext}
              disabled={goldenCount === 0}
              style={({ pressed }) => [
                styles.confirmButton,
                goldenCount === 0 && styles.confirmButtonDisabled,
                pressed && goldenCount > 0 && styles.pressed,
              ]}
            >
              <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
              <Text style={styles.confirmButtonText}>
                确认并进入下一步 ({goldenCount})
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.inputRow}>
              <TextInput
                ref={inputRef}
                style={styles.textInput}
                value={inputText}
                onChangeText={setInputText}
                placeholder="输入你的提问... AI 将实时分类"
                placeholderTextColor={Colors.textTertiary}
                onSubmitEditing={handleSubmitQuestion}
                blurOnSubmit={false}
                returnKeyType="send"
              />
              <Pressable
                onPress={() => {
                  handleSubmitQuestion();
                  inputRef.current?.focus();
                }}
                disabled={!inputText.trim() || isClassifying}
                style={[
                  styles.sendButton,
                  (!inputText.trim() || isClassifying) && styles.sendButtonDisabled,
                ]}
              >
                {isClassifying ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="send" size={18} color="#FFFFFF" />
                )}
              </Pressable>
            </View>
            <Pressable
              onPress={handleEnterSelectMode}
              style={({ pressed }) => [styles.selectGoldenButton, pressed && styles.pressed]}
            >
              <Ionicons name="star" size={16} color={Colors.warning} />
              <Text style={styles.selectGoldenText}>选择黄金问题并进入下一步</Text>
              <Ionicons name="arrow-forward" size={14} color={Colors.warning} />
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surfaceSecondary,
  },
  listContent: {
    padding: 0,
  },
  listHeader: {
    padding: 20,
    gap: 12,
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
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: Colors.text,
  },
  radarCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  radarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  radarTitle: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
  },
  radarToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 12,
    backgroundColor: Colors.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  radarToggleText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: Colors.accent,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
  shadowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.aiBorder,
    backgroundColor: Colors.aiGlow,
  },
  shadowButtonText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.accent,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  alertText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: Colors.text,
    lineHeight: 22,
  },
  shadowCard: {
    backgroundColor: 'rgba(0, 188, 212, 0.06)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  shadowText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.text,
    lineHeight: 22,
  },
  shadowActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  shadowActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  adoptBtn: {
    backgroundColor: Colors.successLight,
  },
  rejectBtn: {
    backgroundColor: Colors.dangerLight,
  },
  adoptText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: Colors.success,
  },
  rejectText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: Colors.danger,
  },
  questionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  questionsTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
  },
  goldenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: Colors.warningLight,
  },
  goldenBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: Colors.warning,
  },
  selectModeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: Colors.warningLight,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  selectModeBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.warning,
  },
  selectHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.aiGlow,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.aiBorder,
  },
  selectHintText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.accent,
    lineHeight: 20,
  },
  questionCard: {
    backgroundColor: Colors.cardBg,
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  questionCardSelected: {
    borderColor: Colors.warning,
    borderWidth: 2,
    backgroundColor: '#FFFBEB',
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  checkboxChecked: {
    backgroundColor: Colors.warning,
    borderColor: Colors.warning,
  },
  authorAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiAvatar: {
    backgroundColor: Colors.aiGlow,
    borderWidth: 1,
    borderColor: Colors.aiBorder,
  },
  authorInitial: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textSecondary,
  },
  authorName: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
  },
  aiTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: Colors.aiGlow,
    borderWidth: 1,
    borderColor: Colors.aiBorder,
  },
  aiTagText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.accent,
  },
  questionText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.text,
    lineHeight: 22,
    marginBottom: 8,
  },
  questionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  categoryText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  goldenIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.warningLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textInput: {
    flex: 1,
    height: 44,
    backgroundColor: Colors.inputBg,
    borderRadius: 22,
    paddingHorizontal: 18,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  selectGoldenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.warningLight,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  selectGoldenText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.warning,
  },
  selectBar: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.warning,
    shadowColor: Colors.warning,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonDisabled: {
    opacity: 0.4,
  },
  confirmButtonText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
  },
});
