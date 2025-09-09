import React from 'react';
import { View } from 'react-native';

interface CirclesLogoProps {
  size?: number;
  color?: string;
}

export function CirclesLogo({ size = 32, color = "white" }: CirclesLogoProps) {
  const multiplier = size / 200;
  
  // Circle definitions based on the sophisticated web version
  const circles = [
    // Large primary circle
    { size: 80 * multiplier, x: 45, y: 40, opacity: 1, hasGlow: true },
    // Medium circles  
    { size: 60 * multiplier, x: 65, y: 65, opacity: 0.9, hasGlow: false },
    { size: 55 * multiplier, x: 25, y: 70, opacity: 0.85, hasGlow: false },
    // Small accent circles
    { size: 35 * multiplier, x: 75, y: 35, opacity: 0.7, hasGlow: false },
    { size: 40 * multiplier, x: 20, y: 25, opacity: 0.75, hasGlow: false },
    { size: 28 * multiplier, x: 85, y: 80, opacity: 0.6, hasGlow: false },
    // Micro circles for organic feel
    { size: 20 * multiplier, x: 55, y: 15, opacity: 0.5, hasGlow: false },
    { size: 18 * multiplier, x: 10, y: 55, opacity: 0.45, hasGlow: false },
    { size: 22 * multiplier, x: 90, y: 55, opacity: 0.55, hasGlow: false },
  ];
  
  return (
    <View style={{ 
      width: size, 
      height: size, 
      position: 'relative'
    }}>
      {/* Render all circles */}
      {circles.map((circle, index) => {
        const circleX = (size * circle.x) / 100 - circle.size / 2;
        const circleY = (size * circle.y) / 100 - circle.size / 2;
        const borderWidth = Math.max(0.5, circle.size * 0.02);
        
        return (
          <View key={index}>
            {/* Glass fill layer */}
            <View style={{
              position: 'absolute',
              left: circleX,
              top: circleY,
              width: circle.size,
              height: circle.size,
              borderRadius: circle.size / 2,
              backgroundColor: color,
              opacity: circle.opacity * 0.12,
              shadowColor: circle.hasGlow ? color : 'transparent',
              shadowOffset: { width: 0, height: circle.size * 0.05 },
              shadowOpacity: 0.3,
              shadowRadius: circle.size * 0.1,
            }} />
            
            {/* Border outline */}
            <View style={{
              position: 'absolute', 
              left: circleX,
              top: circleY,
              width: circle.size,
              height: circle.size,
              borderRadius: circle.size / 2,
              borderWidth: borderWidth,
              borderColor: color,
              opacity: circle.opacity * 0.6,
            }} />
            
            {/* Inner glow for primary circle */}
            {circle.hasGlow && (
              <View style={{
                position: 'absolute',
                left: circleX + borderWidth,
                top: circleY + borderWidth,
                width: circle.size - borderWidth * 2,
                height: circle.size - borderWidth * 2,
                borderRadius: (circle.size - borderWidth * 2) / 2,
                backgroundColor: color,
                opacity: 0.15,
              }} />
            )}
          </View>
        );
      })}
    </View>
  );
}