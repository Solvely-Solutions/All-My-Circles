interface CirclesLogoProps {
  size?: number;
  color?: string;
  className?: string;
}

export function CirclesLogo({ size = 200, color = "#3b82f6", className = "" }: CirclesLogoProps) {
  const multiplier = size / 200; // Base size ratio
  
  // Circle definitions matching the app's sophisticated design
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
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      {circles.map((circle, index) => {
        const circleX = (size * circle.x) / 100 - circle.size / 2;
        const circleY = (size * circle.y) / 100 - circle.size / 2;
        const borderWidth = Math.max(0.5, circle.size * 0.02);
        
        return (
          <div key={index}>
            {/* Glass fill layer */}
            <div 
              className="absolute rounded-full"
              style={{
                left: circleX,
                top: circleY,
                width: circle.size,
                height: circle.size,
                backgroundColor: color,
                opacity: circle.opacity * 0.12,
                filter: circle.hasGlow ? `drop-shadow(0 ${circle.size * 0.05}px ${circle.size * 0.1}px ${color}30)` : 'none',
              }}
            />
            
            {/* Border outline */}
            <div 
              className="absolute rounded-full border"
              style={{
                left: circleX,
                top: circleY,
                width: circle.size,
                height: circle.size,
                borderWidth: borderWidth,
                borderColor: color,
                opacity: circle.opacity * 0.6,
              }}
            />
            
            {/* Inner glow for primary circle */}
            {circle.hasGlow && (
              <div 
                className="absolute rounded-full border"
                style={{
                  left: circleX + borderWidth * 2,
                  top: circleY + borderWidth * 2,
                  width: circle.size - borderWidth * 4,
                  height: circle.size - borderWidth * 4,
                  borderWidth: 0.5,
                  borderColor: color,
                  opacity: 0.4,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}