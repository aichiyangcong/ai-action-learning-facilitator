import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetch } from 'expo/fetch';
import { getApiUrl } from '@/lib/query-client';
import Colors from '@/constants/colors';
import { useWorkshop } from '@/contexts/WorkshopContext';
import StageProgress from '@/components/StageProgress';
import AICard from '@/components/AICard';
import LoadingDots from '@/components/LoadingDots';

export default function Stage2Screen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const {
    topic,
    preMortem,
    setPreMortem,
    setCurrentStage,
  } = useWorkshop();

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!preMortem && topic.title) {
      loadPreMortem();
    }
  }, []);

  const loadPreMortem = async () => {
    setIsLoading(true);
    try {
      const baseUrl = getApiUrl();
      const response = await fetch(`${baseUrl}api/pre-mortem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({ topic }),
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
        setPreMortem(JSON.parse(jsonMatch[0]));
      }
    } catch (error) {
      console.error('Pre-mortem error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartStorm = () => {
    setCurrentStage(3);
    router.push('/stage3');
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + webTopInset }]}>
      <StageProgress currentStage={2} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color={Colors.text} />
          </Pressable>
          <Text style={styles.pageTitle}>研讨开场</Text>
        </View>

        <View style={styles.topicCard}>
          <View style={styles.topicHeader}>
            <Ionicons name="document-text-outline" size={20} color={Colors.accent} />
            <Text style={styles.topicLabel}>确定课题</Text>
          </View>
          <Text style={styles.topicTitle}>{topic.title || '未设置课题'}</Text>
          <Text style={styles.topicDetail}>{topic.background}</Text>
          <View style={styles.topicMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="alert-circle-outline" size={14} color={Colors.danger} />
              <Text style={styles.metaLabel}>痛点</Text>
            </View>
            <Text style={styles.metaText}>{topic.painPoints}</Text>
          </View>
        </View>

        {isLoading && (
          <AICard title="AI 正在进行事前验尸分析...">
            <LoadingDots />
            <Text style={styles.loadingHint}>基于课题信息预测潜在风险</Text>
          </AICard>
        )}

        {preMortem && (
          <>
            <View style={styles.warningCard}>
              <View style={styles.warningHeader}>
                <View style={styles.warningIconCircle}>
                  <Ionicons name="warning" size={24} color={Colors.danger} />
                </View>
                <Text style={styles.warningTitle}>AI 事前验尸预警</Text>
              </View>
              <Text style={styles.warningText}>{preMortem.warning}</Text>
            </View>

            <AICard title="风险因素">
              {preMortem.riskFactors.map((factor, i) => (
                <View key={i} style={styles.riskRow}>
                  <View style={styles.riskDot} />
                  <Text style={styles.riskText}>{factor}</Text>
                </View>
              ))}
            </AICard>

            <AICard title="建议研讨重点">
              {preMortem.focusAreas.map((area, i) => (
                <View key={i} style={styles.focusRow}>
                  <View style={styles.focusNumber}>
                    <Text style={styles.focusNumberText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.focusText}>{area}</Text>
                </View>
              ))}
            </AICard>
          </>
        )}

        <Pressable
          onPress={handleStartStorm}
          style={({ pressed }) => [styles.startButton, pressed && styles.pressed]}
        >
          <View style={styles.startButtonInner}>
            <Ionicons name="chatbubbles" size={24} color="#FFFFFF" />
            <Text style={styles.startButtonText}>开始提问风暴</Text>
            <Text style={styles.startButtonSub}>进入团队协作提问环节</Text>
          </View>
        </Pressable>
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
  topicCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  topicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  topicLabel: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.accent,
  },
  topicTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: Colors.text,
    marginBottom: 8,
    lineHeight: 26,
  },
  topicDetail: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  topicMeta: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  metaLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.danger,
  },
  metaText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  loadingHint: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    marginTop: 4,
  },
  warningCard: {
    backgroundColor: '#1C0E0E',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  warningIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#FECACA',
  },
  warningText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#FCA5A5',
    lineHeight: 24,
  },
  riskRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  riskDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.danger,
    marginTop: 5,
  },
  riskText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.text,
    lineHeight: 20,
  },
  focusRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  focusNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.aiGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusNumberText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: Colors.accent,
  },
  focusText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.text,
    lineHeight: 20,
  },
  startButton: {
    backgroundColor: Colors.accent,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
    marginTop: 8,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  startButtonInner: {
    alignItems: 'center',
    paddingVertical: 28,
    gap: 8,
  },
  startButtonText: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
  },
  startButtonSub: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.7)',
  },
});
