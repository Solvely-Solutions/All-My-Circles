import React, { useState } from 'react';
import { Pressable, Text, StyleSheet, View, Alert } from 'react-native';
import { Upload, Settings, Check } from 'lucide-react-native';
import { CRMConnectModal } from '../modals/CRMConnectModal';
import { CRMPushModal } from '../modals/CRMPushModal';
import type { Contact } from '../../types/contact';
import type { CRMConnection } from '../../types/crm';
import { crmService } from '../../services/crmService';

interface CRMActionButtonProps {
  contacts: Contact[];
  variant?: 'primary' | 'secondary' | 'icon';
  size?: 'small' | 'medium' | 'large';
  showSetupButton?: boolean; // Show "Connect CRM" even when no connections exist
  hideWhenNoConnection?: boolean; // Hide completely when no connections exist
}

export function CRMActionButton({ 
  contacts, 
  variant = 'primary', 
  size = 'medium',
  showSetupButton = false,
  hideWhenNoConnection = false
}: CRMActionButtonProps) {
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showPushModal, setShowPushModal] = useState(false);
  const [connections, setConnections] = useState<CRMConnection[]>([]);

  const activeConnections = crmService.getActiveConnections();

  // Don't render if no connections and hideWhenNoConnection is true
  if (hideWhenNoConnection && activeConnections.length === 0) {
    return null;
  }

  // Don't render setup button if no connections and showSetupButton is false
  if (!showSetupButton && activeConnections.length === 0) {
    return null;
  }

  const handlePress = () => {
    if (activeConnections.length === 0) {
      // No CRM connections, show setup modal
      setShowConnectModal(true);
    } else {
      // Has connections, show push modal
      setConnections(activeConnections);
      setShowPushModal(true);
    }
  };

  const handleConnectionSuccess = (connection: CRMConnection) => {
    setConnections([...crmService.getActiveConnections()]);
    setShowConnectModal(false);
    // Automatically open push modal after connection
    setTimeout(() => setShowPushModal(true), 300);
  };

  const handlePushSuccess = (result: any) => {
    setShowPushModal(false);
    // Success handled by the modal
  };

  const getButtonStyle = () => {
    const baseStyle = [styles.button];
    
    if (variant === 'primary') {
      baseStyle.push(styles.primaryButton);
    } else if (variant === 'secondary') {
      baseStyle.push(styles.secondaryButton);
    } else {
      baseStyle.push(styles.iconButton);
    }

    if (size === 'small') {
      baseStyle.push(styles.buttonSmall);
    } else if (size === 'large') {
      baseStyle.push(styles.buttonLarge);
    }

    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle = [styles.buttonText];
    
    if (variant === 'primary') {
      baseStyle.push(styles.primaryButtonText);
    } else {
      baseStyle.push(styles.secondaryButtonText);
    }

    if (size === 'small') {
      baseStyle.push(styles.textSmall);
    } else if (size === 'large') {
      baseStyle.push(styles.textLarge);
    }

    return baseStyle;
  };

  const renderIcon = () => {
    const iconSize = size === 'small' ? 14 : size === 'large' ? 20 : 16;
    const iconColor = variant === 'primary' ? '#93c5fd' : 'rgba(255,255,255,0.8)';
    
    return <Upload size={iconSize} color={iconColor} />;
  };

  const getButtonText = () => {
    if (variant === 'icon') return null;
    
    if (activeConnections.length === 0) {
      return 'Connect CRM';
    }
    
    if (contacts.length === 1) {
      return 'Push to CRM';
    }
    
    return `Push ${contacts.length} to CRM`;
  };

  return (
    <>
      <Pressable
        style={getButtonStyle()}
        onPress={handlePress}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={getButtonText() || 'CRM Actions'}
      >
        <View style={styles.buttonContent}>
          {renderIcon()}
          {getButtonText() && (
            <Text style={getTextStyle()}>{getButtonText()}</Text>
          )}
        </View>
      </Pressable>

      <CRMConnectModal
        visible={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        onSuccess={handleConnectionSuccess}
      />

      <CRMPushModal
        visible={showPushModal}
        contacts={contacts}
        onClose={() => setShowPushModal(false)}
        onSuccess={handlePushSuccess}
      />
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  primaryButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderColor: 'rgba(59, 130, 246, 0.4)',
    borderWidth: 1,
  },
  secondaryButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
  },
  iconButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  buttonSmall: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  buttonLarge: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  buttonText: {
    fontWeight: '500',
    textAlign: 'center',
  },
  primaryButtonText: {
    color: '#93c5fd',
  },
  secondaryButtonText: {
    color: 'rgba(255,255,255,0.8)',
  },
  textSmall: {
    fontSize: 12,
  },
  textLarge: {
    fontSize: 16,
  },
});