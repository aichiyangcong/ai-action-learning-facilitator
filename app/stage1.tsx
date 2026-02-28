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
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetch } from 'expo/fetch';
import { getApiUrl } from '@/lib/query-client';
import Colors from '@/constants/colors';
import { useWorkshop, TopicEvaluation } from '@/contexts/WorkshopContext';
import StageProgress from '@/components/StageProgress';
import AICard from '@/components/AICard';
import ScoreCircle from '@/components/ScoreCircle';
import RadarChart from '@/components/RadarChart';
import LoadingDots from '@/components/LoadingDots';

const dimensionLabels: { [key: string]: string } = {
  focus: '聚焦性',
  resultOriented: '结果导向',
  singleIssue: '单一议题',
  uncertainty: '未知性',
  controllability: '可控性',
  learning: '学习性',
};

export default function Stage1Screen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const {
    topic,
    setTopic,
    evaluation,
    setEvaluation,
    setCurrentStage,
  } = useWorkshop();

  const [title, setTitle] = useState(topic.title || '');
  const [background, setBackground] = useState(topic.background || '');
  const [painPoints, setPainPoints] = useState(topic.painPoints || '');
  const [triedActions, setTriedActions] = useState(topic.triedActions || '');
  const [isEvaluating, setIsEvaluating] = useState(false);

  const canSubmit = title.trim() && background.trim() && painPoints.trim();

  const handleEvaluate = async () => {
    if (!canSubmit) return;
    setIsEvaluating(true);
    setEvaluation(null);

    const topicData = {
      title: title.trim(),
      background: background.trim(),
      painPoints: painPoints.trim(),
      triedActions: triedActions.trim(),
    };
    setTopic(topicData);

    try {
      const baseUrl = getApiUrl();
      const response = await fetch(`${baseUrl}api/evaluate-topic`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify(topicData),
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
            if (parsed.content) fullContent += parsed.content;
          } catch {}
        }
      }

      const jsonMatch = fullContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const evalData: TopicEvaluation = JSON.parse(jsonMatch[0]);
        setEvaluation(evalData);
      }
    } catch (error) {
      console.error('Evaluation error:', error);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleConfirmTopic = () => {
    setTopic({
      title: title.trim(),
      background: background.trim(),
      painPoints: painPoints.trim(),
      triedActions: triedActions.trim(),
    });
    setCurrentStage(2);
    router.push('/stage2');
  };

  const handleFillMock = () => {
    setTitle('如何通过流程优化提升销售团队的客户跟进效率');
    setBackground(
      '我们是一家B2B企业的销售部门，目前有30人的销售团队。过去半年客户跟进效率持续下降，平均响应时间从24小时增长到72小时，客户满意度下降了15%。',
    );
    setPainPoints(
      '销售人员花费大量时间在内部流程审批上，客户信息分散在多个系统中，缺乏统一的跟进标准和优先级机制。',
    );
    setTriedActions(
      '尝试过引入CRM系统，但团队使用率不足40%。也试过每周例会跟进，但效果有限。',
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + webTopInset }]}>
      <StageProgress currentStage={1} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.titleRow}>
          <Text style={styles.pageTitle}>课题提报</Text>
          <Pressable onPress={handleFillMock} style={styles.mockButton}>
            <Ionicons name="flash-outline" size={14} color={Colors.accent} />
            <Text style={styles.mockButtonText}>填充示例</Text>
          </Pressable>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>课题名称 *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="请输入您要探讨的核心课题"
            placeholderTextColor={Colors.textTertiary}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>背景现状 *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={background}
            onChangeText={setBackground}
            placeholder="描述当前的业务背景和现状"
            placeholderTextColor={Colors.textTertiary}
            multiline
            textAlignVertical="top"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>核心痛点 *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={painPoints}
            onChangeText={setPainPoints}
            placeholder="最让您头疼的具体问题是什么"
            placeholderTextColor={Colors.textTertiary}
            multiline
            textAlignVertical="top"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>已尝试行动</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={triedActions}
            onChangeText={setTriedActions}
            placeholder="您已经尝试过哪些解决方案"
            placeholderTextColor={Colors.textTertiary}
            multiline
            textAlignVertical="top"
          />
        </View>

        <Pressable
          onPress={handleEvaluate}
          disabled={!canSubmit || isEvaluating}
          style={({ pressed }) => [
            styles.evaluateButton,
            !canSubmit && styles.buttonDisabled,
            pressed && styles.pressed,
          ]}
        >
          {isEvaluating ? (
            <View style={styles.evaluatingRow}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.buttonText}>AI 正在评估...</Text>
            </View>
          ) : (
            <View style={styles.evaluatingRow}>
              <Ionicons name="sparkles" size={18} color="#FFFFFF" />
              <Text style={styles.buttonText}>AI 质量评估</Text>
            </View>
          )}
        </Pressable>

        {isEvaluating && !evaluation && (
          <AICard title="AI 正在分析课题质量...">
            <LoadingDots />
            <Text style={styles.loadingHint}>正在进行6维度深度评估</Text>
          </AICard>
        )}

        {evaluation && (
          <>
            <AICard title="AI 质量评估报告">
              <View style={styles.scoreSection}>
                <ScoreCircle score={evaluation.totalScore} />
                <Text style={styles.scoreLabel}>综合评分</Text>
              </View>

              <View style={styles.radarSection}>
                <RadarChart
                  data={evaluation.dimensions}
                  labels={dimensionLabels}
                  maxValue={10}
                />
              </View>

              <View style={styles.dimensionList}>
                {Object.entries(evaluation.dimensions).map(([key, value]) => (
                  <View key={key} style={styles.dimensionRow}>
                    <Text style={styles.dimensionLabel}>{dimensionLabels[key]}</Text>
                    <View style={styles.dimensionBar}>
                      <View
                        style={[
                          styles.dimensionFill,
                          {
                            width: `${(value / 10) * 100}%`,
                            backgroundColor:
                              value >= 7 ? Colors.success : value >= 4 ? Colors.warning : Colors.danger,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.dimensionValue}>{value}</Text>
                  </View>
                ))}
              </View>
            </AICard>

            {evaluation.suggestions.length > 0 && (
              <AICard title="优化建议" variant="warning">
                {evaluation.suggestions.map((suggestion, i) => (
                  <View key={i} style={styles.suggestionRow}>
                    <Ionicons name="alert-circle" size={16} color={Colors.warning} />
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                  </View>
                ))}
              </AICard>
            )}

            {evaluation.examples.length > 0 && (
              <AICard title="同类优质课题参考">
                {evaluation.examples.map((example, i) => (
                  <View key={i} style={styles.exampleCard}>
                    <Text style={styles.exampleTitle}>{example.title}</Text>
                    <Text style={styles.exampleDesc}>{example.description}</Text>
                  </View>
                ))}
              </AICard>
            )}

            <View style={styles.actionRow}>
              <Pressable
                onPress={handleEvaluate}
                style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
              >
                <Ionicons name="refresh-outline" size={18} color={Colors.accent} />
                <Text style={styles.secondaryButtonText}>重新评估</Text>
              </Pressable>
              <Pressable
                onPress={handleConfirmTopic}
                style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
              >
                <Text style={styles.primaryButtonText}>确认提交</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </Pressable>
            </View>
          </>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: Colors.text,
  },
  mockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.aiGlow,
    borderWidth: 1,
    borderColor: Colors.aiBorder,
  },
  mockButtonText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: Colors.accent,
  },
  formGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
  },
  input: {
    backgroundColor: Colors.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.text,
  },
  textArea: {
    minHeight: 80,
    paddingTop: 12,
  },
  evaluateButton: {
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
  buttonDisabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  evaluatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
  },
  loadingHint: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    marginTop: 4,
  },
  scoreSection: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  scoreLabel: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
    marginTop: 8,
  },
  radarSection: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  dimensionList: {
    gap: 10,
    marginTop: 8,
  },
  dimensionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dimensionLabel: {
    width: 65,
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
  },
  dimensionBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.progressBg,
  },
  dimensionFill: {
    height: 6,
    borderRadius: 3,
  },
  dimensionValue: {
    width: 24,
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
    textAlign: 'right',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  suggestionText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.text,
    lineHeight: 20,
  },
  exampleCard: {
    backgroundColor: 'rgba(0, 188, 212, 0.06)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  exampleTitle: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.accent,
    marginBottom: 4,
  },
  exampleDesc: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.accent,
    backgroundColor: Colors.surface,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.accent,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.accent,
  },
  primaryButtonText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
  },
});
