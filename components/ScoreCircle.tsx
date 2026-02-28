import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Circle as SvgCircle } from 'react-native-svg';
import Colors from '@/constants/colors';

interface ScoreCircleProps {
  score: number;
  maxScore?: number;
  size?: number;
  strokeWidth?: number;
}

export default function ScoreCircle({
  score,
  maxScore = 10,
  size = 100,
  strokeWidth = 8,
}: ScoreCircleProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / maxScore) * circumference;
  const center = size / 2;

  const getColor = () => {
    const ratio = score / maxScore;
    if (ratio >= 0.7) return Colors.success;
    if (ratio >= 0.4) return Colors.warning;
    return Colors.danger;
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <SvgCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={Colors.progressBg}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <SvgCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={getColor()}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
      <View style={styles.textContainer}>
        <Text style={[styles.score, { color: getColor() }]}>{score}</Text>
        <Text style={styles.maxScore}>/{maxScore}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  score: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
  },
  maxScore: {
    fontSize: 14,
    color: Colors.textTertiary,
    fontFamily: 'Inter_400Regular',
  },
});
