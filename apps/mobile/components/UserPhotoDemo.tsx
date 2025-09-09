import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { getImageSource } from '../utils/imageHelpers';

export function UserPhotoDemo() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Image Demo</Text>
      
      {/* Method 1: Direct require (recommended) */}
      <View style={styles.imageContainer}>
        <Image
          source={require('../assets/images/IMG_0294_optimized.png')}
          style={styles.image}
          contentFit="cover"
          placeholder={{ blurhash: 'L6PZfSjE.AyE_3t7t7R**0o#DgR4' }}
        />
        <Text style={styles.caption}>Direct require</Text>
      </View>

      {/* Method 2: Using helper function */}
      <View style={styles.imageContainer}>
        <Image
          source={getImageSource('user-photo')}
          style={styles.image}
          contentFit="cover"
          placeholder={{ blurhash: 'L6PZfSjE.AyE_3t7t7R**0o#DgR4' }}
        />
        <Text style={styles.caption}>Using helper function</Text>
      </View>

      {/* Method 3: Circular avatar style */}
      <View style={styles.imageContainer}>
        <Image
          source={getImageSource('IMG_0294')}
          style={styles.avatarImage}
          contentFit="cover"
          placeholder={{ blurhash: 'L6PZfSjE.AyE_3t7t7R**0o#DgR4' }}
        />
        <Text style={styles.caption}>Avatar style</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#0b1220',
    alignItems: 'center',
    gap: 30,
  },
  title: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  imageContainer: {
    alignItems: 'center',
    gap: 10,
  },
  image: {
    width: 200,
    height: 150,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  caption: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '500',
  },
});