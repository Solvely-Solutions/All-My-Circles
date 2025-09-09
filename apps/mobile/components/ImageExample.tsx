import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';

export function ImageExample() {
  return (
    <View style={styles.container}>
      {/* Method 1: Static import (recommended for bundled images) */}
      <Image
        source={require('../assets/images/react-logo.png')}
        style={styles.staticImage}
        contentFit="cover"
      />

      {/* Method 2: Dynamic import using expo-image */}
      <Image
        source={{ uri: '../assets/images/icon.png' }}
        style={styles.dynamicImage}
        contentFit="contain"
      />

      {/* Method 3: Remote image from URL */}
      <Image
        source={{ uri: 'https://picsum.photos/200/200' }}
        style={styles.remoteImage}
        contentFit="cover"
        placeholder={{ blurhash: 'L6PZfSjE.AyE_3t7t7R**0o#DgR4' }}
      />

      {/* Method 4: Base64 image */}
      <Image
        source={{ uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==' }}
        style={styles.base64Image}
        contentFit="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 20,
    alignItems: 'center',
  },
  staticImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  dynamicImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  remoteImage: {
    width: 120,
    height: 120,
    borderRadius: 15,
  },
  base64Image: {
    width: 50,
    height: 50,
    borderRadius: 5,
  },
});