import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  Dimensions,
  ActivityIndicator,
  Platform,
  ScrollView,
  TextInput,
} from 'react-native';
// Conditional native module imports
const CameraModule = Platform.OS !== 'web' ? require('expo-camera') : null;
const ImagePickerModule = Platform.OS !== 'web' ? require('expo-image-picker') : null;
const MediaLibraryModule = Platform.OS !== 'web' ? require('expo-media-library') : null;
const ImageManipulatorModule = Platform.OS !== 'web' ? require('expo-image-manipulator') : null;

// Extract exports for non-web platforms
const CameraView = CameraModule?.CameraView;
const useCameraPermissions = CameraModule?.useCameraPermissions;
const ImagePicker = ImagePickerModule;
const MediaLibrary = MediaLibraryModule;
const ImageManipulator = ImageManipulatorModule;
import { X as XIcon, Camera as CameraIcon, Image as ImageIcon, CheckCircle, TestTube } from 'lucide-react-native';
import { getImageSource } from '../utils/imageHelpers';
import { processImageWithOcr } from '../services/ocrService';
import { sanitizeContactData } from '../utils/sanitization';
import { devError } from '../utils/config';
import { SafeComponent } from './ErrorBoundary';

interface NameBadgeScannerProps {
  visible: boolean;
  onClose: () => void;
  onContactExtracted: (contactData: {
    name: string;
    company?: string;
    title?: string;
    email?: string;
    phone?: string;
  }) => void;
}

const { width, height } = Dimensions.get('window');

function NameBadgeScannerCore({ visible, onClose, onContactExtracted }: NameBadgeScannerProps) {
  // Use camera permissions only on native platforms
  const cameraHook = Platform.OS !== 'web' && useCameraPermissions ? useCameraPermissions() : [null, null];
  const [permission, requestPermission] = cameraHook;
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const [showManualAssignment, setShowManualAssignment] = useState(false);
  const [fieldAssignments, setFieldAssignments] = useState({
    name: '',
    company: '',
    title: '',
    email: '',
    phone: ''
  });
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const cameraRef = useRef<typeof CameraView>(null);

  useEffect(() => {
    if (visible && !permission?.granted) {
      requestPermission();
    }
  }, [visible]);

  const takePicture = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not Available', 'Camera is not available on web platform.');
      return;
    }
    
    if (cameraRef.current) {
      try {
        setIsProcessing(true);
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
        
        await processImage(photo.uri);
      } catch (error) {
        devError('Error taking picture', error instanceof Error ? error : new Error(String(error)));
        Alert.alert('Error', 'Failed to take picture. Please try again.');
        setIsProcessing(false);
      }
    }
  };

  const pickImage = async () => {
    if (Platform.OS === 'web' || !ImagePicker) {
      Alert.alert('Not Available', 'Image picker is not available on web platform.');
      return;
    }
    
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setIsProcessing(true);
        await processImage(result.assets[0].uri);
      }
    } catch (error) {
      devError('Error picking image', error instanceof Error ? error : new Error(String(error)));
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const testWithDemoImage = async () => {
    try {
      setIsProcessing(true);
      // Get the demo image from assets
      const demoImageSource = getImageSource('user-photo');
      
      // For local assets, we need to resolve the require() to a URI
      let demoUri;
      if (typeof demoImageSource === 'number') {
        // This is a bundled asset, we need to get its URI
        const assetModule = demoImageSource;
        // For now, we'll show a demo with sample text since we can't easily OCR bundled assets
        setExtractedText("John Doe\nSenior Software Engineer\nTech Solutions Inc\njohn.doe@techsolutions.com\n+1 (555) 123-4567");
        setShowManualAssignment(true);
        setIsProcessing(false);
        return;
      }
      
      await processImage(demoImageSource.uri);
    } catch (error) {
      devError('Error testing with demo image', error instanceof Error ? error : new Error(String(error)));
      Alert.alert('Error', 'Failed to test with demo image.');
      setIsProcessing(false);
    }
  };

  const processImage = async (imageUri: string) => {
    try {
      let finalImageUri = imageUri;
      
      // Only manipulate image on native platforms
      if (Platform.OS !== 'web' && ImageManipulator) {
        const manipulatedImage = await ImageManipulator.manipulateAsync(
          imageUri,
          [
            { resize: { width: 1200 } }, // Higher resolution for better OCR
          ],
          {
            compress: 0.9, // Higher quality
            format: ImageManipulator.SaveFormat.JPEG,
          }
        );
        finalImageUri = manipulatedImage.uri;
      }

      const ocrResult = await processImageWithOcr(finalImageUri);
      
      if (ocrResult.success && ocrResult.extractedText.trim()) {
        setExtractedText(ocrResult.extractedText);
        // Reset assignments and show manual assignment
        setFieldAssignments({
          name: '',
          company: '',
          title: '',
          email: '',
          phone: ''
        });
        setShowManualAssignment(true);
        setIsProcessing(false);
      } else {
        Alert.alert(
          'No Text Found',
          ocrResult.error || 'Could not extract any text from the image. Please try a clearer photo.',
          [{ text: 'OK', onPress: () => setIsProcessing(false) }]
        );
      }
    } catch (error) {
      devError('Error processing image in scanner', error instanceof Error ? error : new Error(String(error)));
      Alert.alert('Error', 'Failed to process image. Please try again.');
      setIsProcessing(false);
    }
  };


  const extractContactInfo = (text: string) => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    
    // Filter out obvious non-contact info (catchphrases, taglines, etc.)
    const isRelevantLine = (line: string) => {
      const lowerLine = line.toLowerCase();
      
      // Skip very short lines (likely fragments)
      if (line.length < 2) return false;
      
      // Skip obvious catchphrases and marketing text
      const marketingPhrases = [
        'innovation', 'excellence', 'solutions', 'success', 'leading', 'trusted',
        'premier', 'professional', 'quality', 'service', 'experience', 'expert',
        'committed', 'dedicated', 'passion', 'vision', 'mission', 'values',
        'future', 'tomorrow', 'today', 'since', 'established', 'founded',
        'your', 'our', 'we', 'us', 'you', 'the best', 'world class',
        'connecting', 'building', 'creating', 'delivering', 'providing'
      ];
      
      const hasMarketingPhrase = marketingPhrases.some(phrase => lowerLine.includes(phrase));
      if (hasMarketingPhrase && !line.includes('@') && !/\d{3}/.test(line)) return false;
      
      // Skip lines that look like taglines (often contain specific words)
      if (/\b(making|building|creating|connecting|delivering|providing|enabling|empowering)\b/i.test(line) && line.length > 20) return false;
      
      // Skip URLs and website addresses (unless they contain company name)
      if (/www\.|\.com|\.org|\.net|http/i.test(line) && !line.includes('@')) return false;
      
      // Skip conference/event information
      if (/\b(conference|summit|expo|event|attendee|speaker|session)\b/i.test(line)) return false;
      
      return true;
    };

    const relevantLines = lines.filter(isRelevantLine);
    
    // Smart field detection with confidence scoring
    const fieldCandidates: {
      name: Array<{ text: string; confidence: number; line: number }>;
      company: Array<{ text: string; confidence: number; line: number }>;
      title: Array<{ text: string; confidence: number; line: number }>;
      email: Array<{ text: string; confidence: number; line: number }>;
      phone: Array<{ text: string; confidence: number; line: number }>;
    } = {
      name: [],
      company: [],
      title: [],
      email: [],
      phone: []
    };

    relevantLines.forEach((line, index) => {
      const lineUpper = line.toUpperCase();
      
      // Email detection (very high confidence) - only extract the email part
      const emailMatch = line.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
      if (emailMatch) {
        fieldCandidates.email.push({ text: emailMatch[0], confidence: 0.95, line: index });
      }
      
      // Phone detection (high confidence) - clean format
      const phoneMatch = line.match(/(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/);
      if (phoneMatch) {
        fieldCandidates.phone.push({ text: phoneMatch[0], confidence: 0.9, line: index });
      }
      
      // Name detection (stricter validation)
      let nameConfidence = 0;
      
      // Must be reasonable name format
      const namePattern = /^[A-Z][a-z]+(?:\s+[A-Z][a-z]*\.?)*(?:\s+[A-Z][a-z]+)*$/;
      if (!namePattern.test(line)) nameConfidence = 0;
      else {
        if (index === 0) nameConfidence += 0.4; // First line bonus
        if (lineUpper === line && line.length > 4 && line.length < 30) nameConfidence += 0.3; // All caps, reasonable length
        if (/^[A-Z][a-z]+ [A-Z][a-z]+$/.test(line)) nameConfidence += 0.5; // Perfect First Last pattern
        if (line.split(' ').length === 2) nameConfidence += 0.2; // Two words bonus
        if (line.split(' ').length > 3) nameConfidence -= 0.3; // Too many words penalty
        
        // Penalize if it looks like a title or company
        if (/\b(Inc|LLC|Corp|Ltd|Company|Technologies|Solutions|Systems|Labs)\b/i.test(line)) nameConfidence -= 0.5;
        if (/\b(Manager|Director|Engineer|CEO|CTO|President)\b/i.test(line)) nameConfidence -= 0.4;
      }
      
      if (nameConfidence > 0.4) {
        fieldCandidates.name.push({ text: line, confidence: Math.min(nameConfidence, 0.9), line: index });
      }
      
      // Title detection (must contain job-related keywords)
      const titlePatterns = [
        /\b(CEO|CTO|CFO|COO|VP|Vice President|President|Director|Manager|Lead|Senior|Principal|Staff|Associate|Specialist|Analyst|Engineer|Developer|Designer|Architect|Consultant|Coordinator)\b/i,
        /\b(Software|Hardware|Product|Marketing|Sales|Operations|Finance|Human Resources|HR|Engineering|Design|Research|Data|Security|DevOps)\s+(Engineer|Manager|Director|Lead|Specialist|Analyst)\b/i,
        /\b(Head of|Chief)\s+\w+/i,
        /\bDr\.\s+[A-Z]/i
      ];
      
      let titleConfidence = 0;
      let hasJobKeyword = false;
      
      titlePatterns.forEach(pattern => {
        if (pattern.test(line)) {
          titleConfidence += 0.4;
          hasJobKeyword = true;
        }
      });
      
      // Only consider as title if it has job-related keywords
      if (hasJobKeyword) {
        if (index > 0 && index < 4) titleConfidence += 0.2; // Position bonus
        if (line.length < 50) titleConfidence += 0.1; // Reasonable length bonus
        if (line.length > 60) titleConfidence -= 0.3; // Too long penalty
        
        if (titleConfidence > 0.3) {
          fieldCandidates.title.push({ text: line, confidence: titleConfidence, line: index });
        }
      }
      
      // Company detection (stricter validation)
      let companyConfidence = 0;
      
      // Must not be a person's name or title
      if (namePattern.test(line)) companyConfidence -= 0.5;
      if (titlePatterns.some(pattern => pattern.test(line))) companyConfidence -= 0.4;
      
      // Positive indicators for company
      if (line.includes('Inc') || line.includes('LLC') || line.includes('Corp') || line.includes('Ltd')) companyConfidence += 0.5;
      if (line.includes('Technologies') || line.includes('Solutions') || line.includes('Systems') || line.includes('Labs')) companyConfidence += 0.4;
      if (/\b(Company|Group|Partners|Enterprises|Industries|Services)\b/i.test(line)) companyConfidence += 0.3;
      
      // Position and length factors
      if (index > 0 && index < 4) companyConfidence += 0.2;
      if (line.length > 8 && line.length < 40) companyConfidence += 0.1;
      if (line.length > 50) companyConfidence -= 0.2;
      
      // Must have some positive indicators
      if (companyConfidence > 0.3) {
        fieldCandidates.company.push({ text: line, confidence: companyConfidence, line: index });
      }
    });

    // Select best candidate for each field with minimum confidence thresholds
    const getBestCandidate = (candidates, minConfidence = 0) => {
      const validCandidates = candidates.filter(c => c.confidence > minConfidence);
      if (validCandidates.length === 0) return '';
      return validCandidates.sort((a, b) => b.confidence - a.confidence)[0].text;
    };

    return {
      name: getBestCandidate(fieldCandidates.name, 0.4),
      company: getBestCandidate(fieldCandidates.company, 0.3),
      title: getBestCandidate(fieldCandidates.title, 0.3),
      email: getBestCandidate(fieldCandidates.email, 0.8),
      phone: getBestCandidate(fieldCandidates.phone, 0.8),
      candidates: fieldCandidates,
      filteredLines: relevantLines // Show what lines were considered
    };
  };

  const handleConfirmContact = () => {
    const rawContactData = extractContactInfo(extractedText);
    const sanitizedData = sanitizeContactData(rawContactData);
    onContactExtracted(sanitizedData);
    handleClose();
  };

  const handleClose = () => {
    setShowPreview(false);
    setShowManualAssignment(false);
    setExtractedText('');
    setIsProcessing(false);
    setEditingField(null);
    setEditingText('');
    setFieldAssignments({
      name: '',
      company: '',
      title: '',
      email: '',
      phone: ''
    });
    onClose();
  };

  const assignLineToField = (line: string, fieldType: string) => {
    setFieldAssignments(prev => ({
      ...prev,
      [fieldType]: line
    }));
  };

  const removeFieldAssignment = (fieldType: string) => {
    setFieldAssignments(prev => ({
      ...prev,
      [fieldType]: ''
    }));
  };

  const startEditingField = (fieldType: string) => {
    setEditingField(fieldType);
    setEditingText(fieldAssignments[fieldType]);
  };

  const saveEditingField = () => {
    if (editingField && editingText.trim()) {
      setFieldAssignments(prev => ({
        ...prev,
        [editingField]: editingText.trim()
      }));
    }
    setEditingField(null);
    setEditingText('');
  };

  const cancelEditingField = () => {
    setEditingField(null);
    setEditingText('');
  };

  const handleSaveManualContact = () => {
    const rawContactData = {
      name: fieldAssignments.name,
      company: fieldAssignments.company,
      title: fieldAssignments.title,
      email: fieldAssignments.email,
      phone: fieldAssignments.phone
    };
    const sanitizedData = sanitizeContactData(rawContactData);
    onContactExtracted(sanitizedData);
    handleClose();
  };

  if (!visible) return null;

  if (!permission) {
    return visible ? (
      <View style={[styles.container, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1500 }]}>
        <Text style={styles.loadingText}>Loading camera...</Text>
      </View>
    ) : null;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1500 }]}>
        <Text style={styles.errorText}>Camera access is required to scan name badges</Text>
        <Pressable style={styles.closeButton} onPress={requestPermission}>
          <Text style={styles.closeButtonText}>Grant Permission</Text>
        </Pressable>
        <Pressable style={styles.closeButton} onPress={handleClose}>
          <Text style={styles.closeButtonText}>Close</Text>
        </Pressable>
      </View>
    );
  }

  if (showManualAssignment) {
    const lines = extractedText.split('\n').map(line => line.trim()).filter(line => line);
    const assignedLines = Object.values(fieldAssignments).filter(Boolean);
    
    return (
      <View style={[styles.previewContainer, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1500 }]}>
        <View style={styles.previewHeader}>
          <Text style={styles.previewTitle}>Assign Contact Fields</Text>
          <Pressable onPress={handleClose} style={styles.closeIconButton}>
            <XIcon size={24} color="white" />
          </Pressable>
        </View>

          <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.assignmentContainer}>
            <Text style={styles.instructionText}>
              Tap a line below, then tap a field to assign it:
            </Text>

            {/* Field Containers */}
            <View style={styles.fieldsGrid}>
              {[
                { key: 'name', label: 'Name', color: '#3b82f6' },
                { key: 'title', label: 'Title', color: '#10b981' },
                { key: 'company', label: 'Company', color: '#f59e0b' },
                { key: 'email', label: 'Email', color: '#ef4444' },
                { key: 'phone', label: 'Phone', color: '#8b5cf6' }
              ].map(field => (
                <View key={field.key} style={[styles.fieldContainer, { borderColor: field.color }]}>
                  <Text style={[styles.fieldTitle, { color: field.color }]}>{field.label}</Text>
                  <View style={styles.fieldContent}>
                    {fieldAssignments[field.key] ? (
                      <Pressable 
                        onPress={() => startEditingField(field.key)}
                        style={styles.assignedLine}
                      >
                        <Text style={styles.assignedText}>{fieldAssignments[field.key]}</Text>
                        <View style={styles.fieldActions}>
                          <Text style={styles.editHint}>tap to edit</Text>
                          <Pressable 
                            onPress={() => removeFieldAssignment(field.key)}
                            style={styles.removeButton}
                          >
                            <XIcon size={16} color="#ef4444" />
                          </Pressable>
                        </View>
                      </Pressable>
                    ) : (
                      <Pressable 
                        onPress={() => startEditingField(field.key)}
                        style={styles.emptyFieldContainer}
                      >
                        <Text style={styles.emptyFieldText}>Tap to enter text</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              ))}
            </View>

            {/* Available Lines */}
            <View style={styles.linesSection}>
              <Text style={styles.linesSectionTitle}>Detected Text Lines:</Text>
              <View style={styles.availableLines}>
                {lines.map((line, index) => {
                  const isAssigned = assignedLines.includes(line);
                  return (
                    <Pressable
                      key={index}
                      style={[
                        styles.availableLine,
                        isAssigned && styles.assignedAvailableLine
                      ]}
                      onPress={() => {
                        if (!isAssigned) {
                          // Show field selection for this line
                          Alert.alert(
                            'Assign to Field',
                            `Assign "${line}" to:`,
                            [
                              { text: 'Name', onPress: () => assignLineToField(line, 'name') },
                              { text: 'Title', onPress: () => assignLineToField(line, 'title') },
                              { text: 'Company', onPress: () => assignLineToField(line, 'company') },
                              { text: 'Email', onPress: () => assignLineToField(line, 'email') },
                              { text: 'Phone', onPress: () => assignLineToField(line, 'phone') },
                              { text: 'Cancel', style: 'cancel' }
                            ]
                          );
                        }
                      }}
                      disabled={isAssigned}
                    >
                      <Text style={[
                        styles.availableLineText,
                        isAssigned && styles.assignedLineText
                      ]}>
                        {line}
                        {isAssigned && <Text style={styles.assignedLabel}> ✓ assigned</Text>}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

              <View style={styles.assignmentActions}>
                <Pressable 
                  style={[
                    styles.saveContactButton,
                    !fieldAssignments.name && styles.saveButtonDisabled
                  ]} 
                  onPress={handleSaveManualContact}
                  disabled={!fieldAssignments.name}
                >
                  <Text style={[
                    styles.saveContactButtonText,
                    !fieldAssignments.name && styles.saveButtonTextDisabled
                  ]}>
                    Save Contact
                  </Text>
                </Pressable>
                <Pressable style={styles.retryButton} onPress={() => setShowManualAssignment(false)}>
                  <Text style={styles.retryButtonText}>Scan Again</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        
        {/* Text Input Overlay */}
        {editingField !== null && (
          <View style={styles.editModalOverlay}>
            <View style={styles.editModalContainer}>
              <Text style={styles.editModalTitle}>Edit {editingField}</Text>
              <TextInput
                style={styles.editTextInput}
                value={editingText}
                onChangeText={setEditingText}
                placeholder={`Enter ${editingField}...`}
                placeholderTextColor="rgba(255,255,255,0.5)"
                multiline
                autoFocus
                selectionColor="#3b82f6"
              />
              <View style={styles.editModalActions}>
                <Pressable 
                  style={styles.editCancelButton} 
                  onPress={cancelEditingField}
                >
                  <Text style={styles.editCancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable 
                  style={[
                    styles.editSaveButton,
                    !editingText.trim() && styles.editSaveButtonDisabled
                  ]} 
                  onPress={saveEditingField}
                  disabled={!editingText.trim()}
                >
                  <Text style={[
                    styles.editSaveButtonText,
                    !editingText.trim() && styles.editSaveButtonTextDisabled
                  ]}>Save</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  }

  if (showPreview) {
    const contactData = extractContactInfo(extractedText);
    const lines = extractedText.split('\n').map(line => line.trim()).filter(line => line);
    
    return (
      <View style={[styles.previewContainer, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1500 }]}>
        <View style={styles.previewHeader}>
          <Text style={styles.previewTitle}>Confirm Contact Info</Text>
          <Pressable onPress={handleClose} style={styles.closeIconButton}>
            <XIcon size={24} color="white" />
          </Pressable>
        </View>

        <View style={styles.contactPreview}>
          <CheckCircle size={32} color="#10b981" style={styles.successIcon} />
          <Text style={styles.confirmSubtitle}>Review and correct the detected fields:</Text>
          
          <View style={styles.fieldsContainer}>
            {/* Name Field */}
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Name:</Text>
              <Text style={styles.fieldValue}>{contactData.name || 'Not detected'}</Text>
              {contactData.candidates?.name?.length > 1 && (
                <Text style={styles.alternativeCount}>+{contactData.candidates.name.length - 1} alternatives</Text>
              )}
            </View>

            {/* Title Field */}
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Title:</Text>
              <Text style={styles.fieldValue}>{contactData.title || 'Not detected'}</Text>
              {contactData.candidates?.title?.length > 1 && (
                <Text style={styles.alternativeCount}>+{contactData.candidates.title.length - 1} alternatives</Text>
              )}
            </View>

            {/* Company Field */}
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Company:</Text>
              <Text style={styles.fieldValue}>{contactData.company || 'Not detected'}</Text>
              {contactData.candidates?.company?.length > 1 && (
                <Text style={styles.alternativeCount}>+{contactData.candidates.company.length - 1} alternatives</Text>
              )}
            </View>

            {/* Email Field */}
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Email:</Text>
              <Text style={styles.fieldValue}>{contactData.email || 'Not detected'}</Text>
              {contactData.email && <Text style={styles.confidenceHigh}>High confidence</Text>}
            </View>

            {/* Phone Field */}
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Phone:</Text>
              <Text style={styles.fieldValue}>{contactData.phone || 'Not detected'}</Text>
              {contactData.phone && <Text style={styles.confidenceHigh}>High confidence</Text>}
            </View>
          </View>

          <View style={styles.previewActions}>
            <Pressable style={styles.confirmButton} onPress={handleConfirmContact}>
              <Text style={styles.confirmButtonText}>Save Contact</Text>
            </Pressable>
            <Pressable style={styles.editButton} onPress={() => {
              // TODO: Add edit mode for field alternatives
            }}>
              <Text style={styles.editButtonText}>Edit Fields</Text>
            </Pressable>
            <Pressable style={styles.retryButton} onPress={() => setShowPreview(false)}>
              <Text style={styles.retryButtonText}>Scan Again</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.rawTextContainer}>
          <Text style={styles.rawTextLabel}>Detected Text:</Text>
          <View style={styles.linesContainer}>
            {lines.map((line, index) => {
              const isFiltered = !contactData.filteredLines?.includes(line);
              return (
                <Text 
                  key={index} 
                  style={[
                    styles.rawTextLine, 
                    isFiltered && styles.filteredLine
                  ]}
                >
                  {index + 1}. {line}
                  {isFiltered && <Text style={styles.filteredLabel}> (filtered)</Text>}
                </Text>
              );
            })}
          </View>
          <Text style={styles.filterInfo}>
            Lines marked as filtered were excluded from contact detection (catchphrases, marketing text, etc.)
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.cameraContainer, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1500 }]}>
      {isProcessing && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.processingText}>Processing name badge...</Text>
        </View>
      )}

      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
      />
      
      {/* Camera Overlay - positioned absolutely */}
      <View style={styles.cameraOverlay}>
        {/* Header */}
        <View style={styles.cameraHeader}>
          <Pressable onPress={handleClose} style={styles.closeIconButton}>
            <XIcon size={24} color="white" />
          </Pressable>
          <Text style={styles.cameraTitle}>Scan Name Badge</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Scanning Frame */}
        <View style={styles.scanningArea}>
          <View style={styles.scanningFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
            <Text style={styles.scanningText}>
              Position name badge within frame
            </Text>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.cameraControls}>
          <Pressable style={styles.galleryButton} onPress={pickImage}>
            <ImageIcon size={24} color="white" />
          </Pressable>
          
          <Pressable 
            style={[styles.captureButton, isProcessing && styles.captureButtonDisabled]} 
            onPress={takePicture}
            disabled={isProcessing}
          >
            <CameraIcon size={32} color="white" />
          </Pressable>
          
          <Pressable style={styles.demoButton} onPress={testWithDemoImage}>
            <TestTube size={24} color="white" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export function NameBadgeScanner(props: NameBadgeScannerProps) {
  return (
    <SafeComponent componentName="NameBadgeScanner">
      <NameBadgeScannerCore {...props} />
    </SafeComponent>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1220',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: '#374151',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  cameraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  closeIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  scanningArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanningFrame: {
    width: width * 0.8,
    height: height * 0.4,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#3b82f6',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  scanningText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  cameraControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  galleryButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  demoButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(59,130,246,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(59,130,246,0.5)',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'white',
  },
  captureButtonDisabled: {
    backgroundColor: '#6b7280',
    borderColor: '#9ca3af',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  processingText: {
    color: 'white',
    fontSize: 18,
    marginTop: 20,
    fontWeight: '500',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#0b1220',
    paddingTop: 60,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  previewTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  contactPreview: {
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 40,
  },
  successIcon: {
    marginBottom: 20,
  },
  contactInfo: {
    alignItems: 'center',
    marginBottom: 40,
    width: '100%',
  },
  contactName: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  contactDetail: {
    color: '#9ca3af',
    fontSize: 16,
    marginBottom: 4,
    textAlign: 'center',
  },
  previewActions: {
    width: '100%',
    gap: 12,
  },
  confirmButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  confirmSubtitle: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  fieldsContainer: {
    width: '100%',
    marginBottom: 32,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  fieldLabel: {
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: '600',
    width: 80,
  },
  fieldValue: {
    color: 'white',
    fontSize: 14,
    flex: 1,
    marginLeft: 12,
  },
  alternativeCount: {
    color: '#3b82f6',
    fontSize: 12,
    fontStyle: 'italic',
  },
  confidenceHigh: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '500',
  },
  editButton: {
    backgroundColor: 'rgba(59,130,246,0.2)',
    borderWidth: 1,
    borderColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '500',
  },
  rawTextContainer: {
    margin: 20,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  rawTextLabel: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  linesContainer: {
    gap: 4,
  },
  rawTextLine: {
    color: 'white',
    fontSize: 13,
    lineHeight: 18,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  filteredLine: {
    color: '#6b7280',
    opacity: 0.7,
  },
  filteredLabel: {
    color: '#ef4444',
    fontSize: 11,
    fontStyle: 'italic',
  },
  filterInfo: {
    color: '#9ca3af',
    fontSize: 11,
    marginTop: 8,
    fontStyle: 'italic',
    lineHeight: 14,
  },
  // Manual Assignment Styles - Liquid Glass Design
  scrollContainer: {
    flex: 1,
  },
  assignmentContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  instructionText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
    fontWeight: '500',
  },
  fieldsGrid: {
    gap: 16,
    marginBottom: 32,
  },
  fieldContainer: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    minHeight: 80,
    // Glass morphism effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  fieldTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  fieldContent: {
    flex: 1,
    justifyContent: 'center',
  },
  assignedLine: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    // Subtle inner glow
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  assignedText: {
    color: 'white',
    fontSize: 14,
    flex: 1,
    fontWeight: '500',
  },
  removeButton: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(239,68,68,0.2)',
  },
  emptyFieldText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    fontWeight: '400',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  linesSection: {
    flex: 1,
    marginBottom: 28,
  },
  linesSectionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  availableLines: {
    gap: 12,
  },
  availableLine: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    // Glass effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  assignedAvailableLine: {
    backgroundColor: 'rgba(59,130,246,0.15)',
    borderColor: 'rgba(59,130,246,0.3)',
    opacity: 0.8,
  },
  availableLineText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  assignedLineText: {
    color: 'rgba(255,255,255,0.5)',
  },
  assignedLabel: {
    color: '#10b981',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  fieldActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editHint: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    fontStyle: 'italic',
  },
  emptyFieldContainer: {
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  // Text Input Modal Styles
  editModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 1000,
  },
  editModalContainer: {
    backgroundColor: 'rgba(11,18,32,0.95)',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    // Glass effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 16,
  },
  editModalTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  editTextInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    color: 'white',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    minHeight: 100,
    textAlignVertical: 'top',
    fontWeight: '500',
  },
  editModalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  editCancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  editCancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  editSaveButton: {
    flex: 1,
    backgroundColor: 'rgba(59,130,246,0.9)',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.3)',
  },
  editSaveButtonDisabled: {
    backgroundColor: 'rgba(75,85,99,0.5)',
    borderColor: 'rgba(75,85,99,0.3)',
  },
  editSaveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  editSaveButtonTextDisabled: {
    color: 'rgba(255,255,255,0.4)',
  },
  assignmentActions: {
    gap: 14,
  },
  saveContactButton: {
    backgroundColor: 'rgba(59,130,246,0.9)',
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.3)',
    // Glass button effect
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  saveButtonDisabled: {
    backgroundColor: 'rgba(75,85,99,0.5)',
    borderColor: 'rgba(75,85,99,0.3)',
    shadowColor: '#000',
    shadowOpacity: 0.1,
  },
  saveContactButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  saveButtonTextDisabled: {
    color: 'rgba(255,255,255,0.4)',
  },
});