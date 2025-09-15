import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { GlassCard } from '../ui/GlassCard';
import { useAuth } from '../../contexts/AuthContext';
import { devLog, devError } from '../../utils/logger';

interface SignUpFormProps {
  onSignUpSuccess: (userData: any) => void;
  onSwitchToSignIn: () => void;
}

const SignUpForm: React.FC<SignUpFormProps> = ({ onSignUpSuccess, onSwitchToSignIn }) => {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const { signUp, isLoading } = useAuth();

  const handleSignUp = async () => {
    devLog('🔥 SIGNUP FORM BUTTON CLICKED - VERSION 2.0 🔥');

    if (!email.trim() || !firstName.trim() || !lastName.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      devLog('Starting user signup process', { email, firstName, lastName });
      devLog('About to call signUp function from useAuth hook');

      await signUp(email, firstName, lastName);

      devLog('User signup successful');

      Alert.alert(
        'Success!',
        'Account created successfully. You can now add contacts and sync with HubSpot.',
        [
          {
            text: 'OK',
            onPress: () => onSignUpSuccess({
              email,
              firstName,
              lastName
            })
          }
        ]
      );

    } catch (error) {
      devError('Signup failed', error instanceof Error ? error : new Error(String(error)));
      Alert.alert(
        'Signup Failed',
        error instanceof Error ? error.message : 'Unable to create account. Please try again.'
      );
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <GlassCard style={{ marginHorizontal: 16 }}>
        <Text style={styles.title}>
          Create Account
        </Text>

        <View style={styles.formContainer}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>First Name</Text>
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Enter your first name"
              placeholderTextColor="rgba(255,255,255,0.5)"
              style={styles.input}
              autoCapitalize="words"
              editable={!isLoading}
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Last Name</Text>
            <TextInput
              value={lastName}
              onChangeText={setLastName}
              placeholder="Enter your last name"
              placeholderTextColor="rgba(255,255,255,0.5)"
              style={styles.input}
              autoCapitalize="words"
              editable={!isLoading}
            />
          </View>

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
          </View>

          <TouchableOpacity
            onPress={handleSignUp}
            disabled={isLoading}
            style={[
              styles.signUpButton,
              isLoading ? styles.buttonDisabled : styles.buttonEnabled
            ]}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onSwitchToSignIn}
            disabled={isLoading}
            style={styles.switchButton}
          >
            <Text style={styles.switchButtonText}>
              Already have an account? Sign In
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.disclaimer}>
          By creating an account, you can sync your networking contacts with HubSpot CRM and access advanced networking features.
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
  signUpButton: {
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

export default SignUpForm;