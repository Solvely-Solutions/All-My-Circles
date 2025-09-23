import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { GlassCard } from '../ui/GlassCard';
import { useAuth } from '../../contexts/AuthContext';
import { devLog, devError } from '../../utils/logger';

interface SignInFormProps {
  onSignInSuccess: (userData: any) => void;
  onSwitchToSignUp: () => void;
}

const SignInForm: React.FC<SignInFormProps> = ({ onSignInSuccess, onSwitchToSignUp }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, isLoading } = useAuth();

  const handleSignIn = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (!password.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    try {
      devLog('Starting user signin process', { email });

      await signIn(email.trim(), password.trim());

      devLog('User signin successful');

      Alert.alert(
        'Welcome Back!',
        'Signed in successfully.',
        [
          {
            text: 'OK',
            onPress: () => onSignInSuccess({ email })
          }
        ]
      );

    } catch (error) {
      devError('Signin failed', error instanceof Error ? error : new Error(String(error)));
      Alert.alert(
        'Sign In Failed',
        error instanceof Error ? error.message : 'Unable to sign in. Please try again.'
      );
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <GlassCard style={{ marginHorizontal: 16 }}>
        <Text style={styles.title}>
          Welcome Back
        </Text>

        <View style={styles.formContainer}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor="rgba(255,255,255,0.5)"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
            <Text style={styles.helpText}>
              Enter the email you used to sign up
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleSignIn}
            disabled={isLoading}
            style={[
              styles.signInButton,
              isLoading ? styles.buttonDisabled : styles.buttonEnabled
            ]}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onSwitchToSignUp}
            disabled={isLoading}
            style={styles.switchButton}
          >
            <Text style={styles.switchButtonText}>
              Don't have an account? Sign Up
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.disclaimer}>
          Sign in to access your networking contacts and HubSpot CRM integration.
        </Text>
      </GlassCard>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 24,
  },
  formContainer: {
    gap: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
    fontSize: 16,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    fontSize: 16,
  },
  helpText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginTop: 4,
  },
  signInButton: {
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 24,
  },
  buttonEnabled: {
    backgroundColor: '#3B82F6',
  },
  buttonDisabled: {
    backgroundColor: '#6B7280',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 18,
  },
  switchButton: {
    paddingVertical: 8,
    marginTop: 16,
  },
  switchButtonText: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    fontSize: 16,
  },
  disclaimer: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 16,
  },
});

export default SignInForm;