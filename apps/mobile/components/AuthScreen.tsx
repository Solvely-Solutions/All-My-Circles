import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Pressable, 
  StyleSheet, 
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator 
} from 'react-native';
import { Circle, Mail, Lock, Eye, EyeOff, User } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { devError } from '../utils/config';
import { apiService } from '../services/apiService';

function CirclesLogo({ size = 32, color = "white" }) {
  const multiplier = size / 200; // Base size ratio from the large version
  
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
                left: circleX + borderWidth * 2,
                top: circleY + borderWidth * 2,
                width: circle.size - borderWidth * 4,
                height: circle.size - borderWidth * 4,
                borderRadius: (circle.size - borderWidth * 4) / 2,
                backgroundColor: 'transparent',
                borderWidth: 0.5,
                borderColor: color,
                opacity: 0.4,
              }} />
            )}
          </View>
        );
      })}
    </View>
  );
}

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const { signIn, signUp, isLoading } = useAuth();

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) return;
    
    try {
      await signIn(email, password);
    } catch (error) {
      // Handle error (in real app)
      devError('Sign in error', error instanceof Error ? error : new Error(String(error)));
    }
  };

  const handleSignUp = async () => {
    if (!email.trim() || !password.trim() || !firstName.trim() || !lastName.trim()) return;
    
    setIsRegistering(true);
    try {
      const deviceInfo = {
        platform: Platform.OS,
        model: 'Unknown', // Simplified since we removed expo-device
        osVersion: Platform.Version?.toString() || 'Unknown'
      };
      
      // Use our updated AuthContext signUp function with mock deviceId
      await signUp(email.trim(), firstName.trim(), lastName.trim());
    } catch (error) {
      devError('Sign up error', error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsRegistering(false);
    }
  };

  const handleDemoLogin = () => {
    setEmail('demo@circles.app');
    setPassword('demo123');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logo}>
              <CirclesLogo size={42} color="white" />
            </View>
            <Text style={styles.title}>All My Circles</Text>
            <Text style={styles.subtitle}>Connect. Network. Convert.</Text>
          </View>

          {/* Login/Signup Form */}
          <View style={styles.formContainer}>
            <View style={styles.glassCard}>
              <Text style={styles.formTitle}>
                {isSignUp ? 'Create Account' : 'Welcome back'}
              </Text>
              <Text style={styles.formSubtitle}>
                {isSignUp ? 'Join All My Circles' : 'Sign in to access your contacts'}
              </Text>

              {/* Name inputs for signup */}
              {isSignUp && (
                <>
                  <View style={styles.inputGroup}>
                    <View style={styles.inputContainer}>
                      <User size={18} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="First Name"
                        placeholderTextColor="rgba(255,255,255,0.5)"
                        value={firstName}
                        onChangeText={setFirstName}
                        autoCapitalize="words"
                        autoCorrect={false}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <View style={styles.inputContainer}>
                      <User size={18} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Last Name"
                        placeholderTextColor="rgba(255,255,255,0.5)"
                        value={lastName}
                        onChangeText={setLastName}
                        autoCapitalize="words"
                        autoCorrect={false}
                      />
                    </View>
                  </View>
                </>
              )}

              {/* Email Input */}
              <View style={styles.inputGroup}>
                <View style={styles.inputContainer}>
                  <Mail size={18} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <View style={styles.inputContainer}>
                  <Lock size={18} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    {showPassword ? (
                      <EyeOff size={18} color="rgba(255,255,255,0.7)" />
                    ) : (
                      <Eye size={18} color="rgba(255,255,255,0.7)" />
                    )}
                  </Pressable>
                </View>
              </View>

              {/* Sign In/Sign Up Button */}
              <Pressable
                style={[
                  styles.signInButton, 
                  (isSignUp 
                    ? (!email.trim() || !password.trim() || !firstName.trim() || !lastName.trim())
                    : (!email.trim() || !password.trim())
                  ) && styles.signInButtonDisabled
                ]}
                onPress={isSignUp ? handleSignUp : handleSignIn}
                disabled={
                  isLoading || isRegistering || 
                  (isSignUp 
                    ? (!email.trim() || !password.trim() || !firstName.trim() || !lastName.trim())
                    : (!email.trim() || !password.trim())
                  )
                }
              >
                {(isLoading || isRegistering) ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.signInButtonText}>
                    {isSignUp ? 'Create Account' : 'Sign In'}
                  </Text>
                )}
              </Pressable>

              {/* Demo Button - only show for sign in */}
              {!isSignUp && (
                <Pressable
                  style={styles.demoButton}
                  onPress={handleDemoLogin}
                  disabled={isLoading || isRegistering}
                >
                  <Text style={styles.demoButtonText}>Try Demo Account</Text>
                </Pressable>
              )}

              {/* Toggle between Sign In and Sign Up */}
              <Pressable
                style={styles.toggleButton}
                onPress={() => {
                  setIsSignUp(!isSignUp);
                  // Clear form when switching
                  setEmail('');
                  setPassword('');
                  setFirstName('');
                  setLastName('');
                }}
                disabled={isLoading || isRegistering}
              >
                <Text style={styles.toggleButtonText}>
                  {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Footer - removed since we have signup integrated */}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1220',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    color: 'white',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  glassCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderRadius: 24,
    padding: 32,
  },
  formTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  formSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    height: '100%',
  },
  eyeIcon: {
    padding: 4,
  },
  signInButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 1)',
    borderRadius: 16,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  signInButtonDisabled: {
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    borderColor: 'rgba(59, 130, 246, 0.4)',
  },
  signInButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  demoButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoButtonText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    paddingBottom: 32,
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
  },
  signUpButton: {
    backgroundColor: 'rgba(34, 197, 94, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 1)',
    borderRadius: 16,
    height: 48,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleButton: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  toggleButtonText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
});