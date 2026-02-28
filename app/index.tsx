import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  Pressable,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import { useWorkshop } from '@/contexts/WorkshopContext';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { resetWorkshop } = useWorkshop();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  const handleNewSession = () => {
    resetWorkshop();
    router.push('/stage1');
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[Colors.primary, Colors.primaryLight, Colors.secondary]}
        style={[styles.headerGradient, { paddingTop: insets.top + webTopInset + 40 }]}
      >
        <View style={styles.headerContent}>
          <View style={styles.logoRow}>
            <View style={styles.logoCircle}>
              <Ionicons name="sparkles" size={24} color={Colors.accent} />
            </View>
          </View>
          <Text style={styles.heroTitle}>AI 行动学习催化师</Text>
          <Text style={styles.heroSubtitle}>
            智能引导团队研讨，激发深层思考，打破认知盲区
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.body}
        contentContainerStyle={[styles.bodyContent, { paddingBottom: insets.bottom + 34 + 20 }]}
      >
        <Pressable
          onPress={handleNewSession}
          style={({ pressed }) => [
            styles.startButton,
            pressed && styles.pressed,
          ]}
        >
          <LinearGradient
            colors={[Colors.accent, Colors.accentDark]}
            style={styles.startButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="add-circle-outline" size={24} color="#FFFFFF" />
            <Text style={styles.startButtonText}>开始新的研讨</Text>
          </LinearGradient>
        </Pressable>

        <View style={styles.featureGrid}>
          <FeatureCard
            icon="create-outline"
            title="智能选题"
            description="AI 6维度评估课题质量，精准拦截低质课题"
          />
          <FeatureCard
            icon="warning-outline"
            title="事前验尸"
            description="AI 风险预警，提前识别研讨中的关键盲区"
          />
          <FeatureCard
            icon="chatbubbles-outline"
            title="提问风暴"
            description="5F 维度实时分析，AI 补位影子提问"
          />
          <FeatureCard
            icon="rocket-outline"
            title="行动落地"
            description="黄金问题提炼，可执行计划一键生成"
          />
        </View>

        <Pressable
          onPress={() => router.push('/history')}
          style={({ pressed }) => [
            styles.historyButton,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.historyLeft}>
            <View style={styles.historyIconContainer}>
              <Ionicons name="time-outline" size={22} color={Colors.accent} />
            </View>
            <View style={styles.historyTextGroup}>
              <Text style={styles.historyTitle}>历史研讨</Text>
              <Text style={styles.historyDescription}>查看过往研讨记录、总结报告和行动计划</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
        </Pressable>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>关于行动学习</Text>
          <Text style={styles.infoText}>
            行动学习是一种通过解决真实业务问题来促进个人和组织学习的方法。
            本工具利用 AI 技术替代部分催化师角色，帮助团队更高效地进行问题诊断、
            提问风暴和行动计划制定。
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.featureCard}>
      <View style={styles.featureIconContainer}>
        <Ionicons name={icon} size={22} color={Colors.accent} />
      </View>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surfaceSecondary,
  },
  headerGradient: {
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  headerContent: {
    alignItems: 'center',
  },
  logoRow: {
    marginBottom: 16,
  },
  logoCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 188, 212, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 188, 212, 0.3)',
  },
  heroTitle: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    color: Colors.textOnDark,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textOnDarkSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 20,
    gap: 20,
  },
  startButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 16,
  },
  startButtonText: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureCard: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.aiGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  featureTitle: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  historyLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  historyIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.aiGlow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.aiBorder,
  },
  historyTextGroup: {
    flex: 1,
    gap: 2,
  },
  historyTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
  },
  historyDescription: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
  infoCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  infoTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    lineHeight: 22,
  },
});
