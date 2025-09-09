import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { getAvatarPlaceholder } from '../utils/imageHelpers';

interface ContactAvatarProps {
  name: string;
  imageUri?: string;
  size?: number;
  style?: any;
}

export function ContactAvatar({ 
  name, 
  imageUri, 
  size = 40,
  style 
}: ContactAvatarProps) {
  const avatarSize = { width: size, height: size, borderRadius: size / 2 };
  
  // If we have a custom image URI, use it
  if (imageUri) {
    return (
      <Image
        source={{ uri: imageUri }}
        style={[styles.avatar, avatarSize, style]}
        contentFit="cover"
        placeholder={{ blurhash: 'L6PZfSjE.AyE_3t7t7R**0o#DgR4' }}
      />
    );
  }
  
  // Otherwise, generate a placeholder with initials
  return (
    <Image
      source={{ uri: getAvatarPlaceholder(name, size) }}
      style={[styles.avatar, avatarSize, style]}
      contentFit="cover"
    />
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
});