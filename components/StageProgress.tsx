import React from 'react';
import { View, StyleSheet, Text, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';

interface StageProgressProps {
  currentStage: number;
  onStagePress?: (stage: number) => void;
}

const stages = [
  { label: '选题', icon: 'create-outline' as const },
  { label: '诊断', icon: 'warning-outline' as const },
  { label: '提问', icon: 'chatbubbles-outline' as const },
  { label: '行动', icon: 'rocket-outline' as const },
];

export default function StageProgress({ currentStage, onStagePress }: StageProgressProps) {
  return (
    <View style={styles.container}>
      {stages.map((stage, index) => {
        const stageNum = index + 1;
        const isActive = stageNum === currentStage;
        const isCompleted = stageNum < currentStage;
        const isLast = index === stages.length - 1;

        return (
          <React.Fragment key={stageNum}>
            <Pressable
              onPress={() => onStagePress?.(stageNum)}
              style={[
                styles.step,
                isActive && styles.stepActive,
                isCompleted && styles.stepCompleted,
              ]}
            >
              <View style={[
                styles.circle,
                isActive && styles.circleActive,
                isCompleted && styles.circleCompleted,
              ]}>
                {isCompleted ? (
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                ) : (
                  <Ionicons
                    name={stage.icon}
                    size={14}
                    color={isActive ? '#FFFFFF' : Colors.textTertiary}
                  />
                )}
              </View>
              <Text style={[
                styles.label,
                isActive && styles.labelActive,
                isCompleted && styles.labelCompleted,
              ]}>
                {stage.label}
              </Text>
            </Pressable>
            {!isLast && (
              <View style={[
                styles.connector,
                isCompleted && styles.connectorCompleted,
              ]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    ...(Platform.OS === 'web' ? { paddingTop: 67 + 12 } : {}),
  },
  step: {
    alignItems: 'center',
    gap: 4,
  },
  stepActive: {},
  stepCompleted: {},
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleActive: {
    backgroundColor: Colors.accent,
  },
  circleCompleted: {
    backgroundColor: Colors.success,
  },
  label: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontFamily: 'Inter_500Medium',
  },
  labelActive: {
    color: Colors.accent,
    fontFamily: 'Inter_600SemiBold',
  },
  labelCompleted: {
    color: Colors.success,
  },
  connector: {
    width: 40,
    height: 2,
    backgroundColor: Colors.borderLight,
    marginHorizontal: 4,
    marginBottom: 18,
  },
  connectorCompleted: {
    backgroundColor: Colors.success,
  },
});
