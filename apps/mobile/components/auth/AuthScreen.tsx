import React, { useState } from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import SignUpForm from './SignUpForm';
import SignInForm from './SignInForm';
import { CirclesLogo } from '../CirclesLogo';

const AuthScreen: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(true);
  const { height } = Dimensions.get('window');

  const handleAuthSuccess = (userData: any) => {
    // Auth success is already handled by the AuthContext in the forms
    console.log('Auth success:', userData);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Background */}
      <LinearGradient
        colors={['#1e3a8a', '#3730a3', '#581c87']}
        style={styles.gradient}
      />

      {/* Content */}
      <View style={[styles.content, { minHeight: height }]}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <CirclesLogo size={80} />
          <Text style={styles.title}>
            All My Circles
          </Text>
          <Text style={styles.subtitle}>
            Professional Networking & CRM Integration
          </Text>
        </View>

        {/* Auth Forms */}
        {isSignUp ? (
          <SignUpForm
            onSignUpSuccess={handleAuthSuccess}
            onSwitchToSignIn={() => setIsSignUp(false)}
          />
        ) : (
          <SignInForm
            onSignInSuccess={handleAuthSuccess}
            onSwitchToSignUp={() => setIsSignUp(true)}
          />
        )}

        {/* HubSpot Integration Notice */}
        <View style={styles.noticeContainer}>
          <Text style={styles.noticeText}>
            🔗 Seamlessly sync with HubSpot CRM
          </Text>
          <Text style={styles.noticeText}>
            📱 Offline-first networking contact management
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 16,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 8,
  },
  noticeContainer: {
    marginTop: 32,
    paddingHorizontal: 16,
  },
  noticeText: {
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    fontSize: 14,
    marginVertical: 2,
  },
});

export default AuthScreen;