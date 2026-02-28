import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Polygon, Line, Circle, Text as SvgText } from 'react-native-svg';
import Colors from '@/constants/colors';

interface RadarChartProps {
  data: { [key: string]: number };
  labels: { [key: string]: string };
  size?: number;
  maxValue?: number;
  fillColor?: string;
  strokeColor?: string;
}

export default function RadarChart({
  data,
  labels,
  size = 240,
  maxValue = 10,
  fillColor = 'rgba(0, 188, 212, 0.2)',
  strokeColor = Colors.accent,
}: RadarChartProps) {
  const center = size / 2;
  const radius = size / 2 - 36;
  const keys = Object.keys(data);
  const numAxes = keys.length;
  const angleStep = (2 * Math.PI) / numAxes;

  const getPoint = (value: number, index: number) => {
    const angle = angleStep * index - Math.PI / 2;
    const r = (value / maxValue) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const dataPoints = keys.map((key, i) => getPoint(data[key] || 0, i));
  const dataPolygon = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        {gridLevels.map((level, li) => {
          const points = keys.map((_, i) => {
            const angle = angleStep * i - Math.PI / 2;
            const r = radius * level;
            return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
          }).join(' ');
          return (
            <Polygon
              key={`grid-${li}`}
              points={points}
              fill="none"
              stroke={Colors.border}
              strokeWidth={0.5}
            />
          );
        })}

        {keys.map((_, i) => {
          const angle = angleStep * i - Math.PI / 2;
          const endX = center + radius * Math.cos(angle);
          const endY = center + radius * Math.sin(angle);
          return (
            <Line
              key={`axis-${i}`}
              x1={center}
              y1={center}
              x2={endX}
              y2={endY}
              stroke={Colors.border}
              strokeWidth={0.5}
            />
          );
        })}

        <Polygon
          points={dataPolygon}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={2}
        />

        {dataPoints.map((p, i) => (
          <Circle
            key={`dot-${i}`}
            cx={p.x}
            cy={p.y}
            r={4}
            fill={strokeColor}
          />
        ))}

        {keys.map((key, i) => {
          const angle = angleStep * i - Math.PI / 2;
          const labelR = radius + 22;
          const lx = center + labelR * Math.cos(angle);
          const ly = center + labelR * Math.sin(angle);
          return (
            <SvgText
              key={`label-${i}`}
              x={lx}
              y={ly}
              fontSize={11}
              fill={Colors.textSecondary}
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {labels[key] || key}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
