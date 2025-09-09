/**
 * Helper functions for working with images in the app
 */

// Type for image sources
export type ImageSource = {
  uri: string;
} | number;

/**
 * Get image source for a given image name in assets/images
 */
export function getImageSource(imageName: string): ImageSource {
  // Map of available images in assets/images
  const imageMap: Record<string, any> = {
    'react-logo': require('../assets/images/react-logo.png'),
    'icon': require('../assets/images/icon.png'),
    'adaptive-icon': require('../assets/images/adaptive-icon.png'),
    'favicon': require('../assets/images/favicon.png'),
    'partial-react-logo': require('../assets/images/partial-react-logo.png'),
    'splash-icon': require('../assets/images/splash-icon.png'),
    'IMG_0294': require('../assets/images/IMG_0294_optimized.png'),
    'user-photo': require('../assets/images/IMG_0294_optimized.png'), // Alias for easier reference
  };

  return imageMap[imageName] || require('../assets/images/icon.png'); // fallback
}

/**
 * Generate a placeholder avatar with initials
 */
export function getAvatarPlaceholder(name: string, size: number = 40): string {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  
  // Generate a simple colored background based on name
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
  const colorIndex = name.length % colors.length;
  const bgColor = colors[colorIndex];
  
  // Return a simple SVG data URI
  return `data:image/svg+xml;base64,${btoa(`
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${bgColor}" rx="${size/4}"/>
      <text x="50%" y="50%" font-family="Arial" font-size="${size/3}" font-weight="bold" 
            fill="white" text-anchor="middle" dominant-baseline="central">${initials}</text>
    </svg>
  `)}`;
}

/**
 * Check if a string is a valid image URL
 */
export function isImageUrl(url: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url);
}