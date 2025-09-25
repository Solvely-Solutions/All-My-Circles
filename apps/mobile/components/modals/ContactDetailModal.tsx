import React from 'react';
import { View, Text, ScrollView, Pressable, Modal, StyleSheet, Alert } from 'react-native';
import Animated, { SlideInUp } from 'react-native-reanimated';
import {
  X as XIcon,
  Star as StarIcon,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  Users,
  Tag as TagIcon,
  Calendar,
  Trash2,
} from 'lucide-react-native';
import { Contact } from '../../types/contact';

interface ContactDetailModalProps {
  contact: Contact | null;
  visible: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStar: () => void;
  onContactUpdate?: (updatedContact: Contact) => void;
}

export function ContactDetailModal({ 
  contact, 
  visible, 
  onClose, 
  onEdit, 
  onDelete, 
  onStar,
  onContactUpdate
}: ContactDetailModalProps) {
  if (!contact || !visible) return null;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };


  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <Animated.View 
          entering={SlideInUp.duration(300)}
          style={styles.detailModal}
        >
          {/* Header */}
          <View style={styles.detailHeader}>
            <Pressable 
              onPress={onClose} 
              style={styles.closeButton}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Close contact details"
              accessibilityHint="Returns to the contact list"
            >
              <XIcon size={24} color="white" />
            </Pressable>
            <View style={styles.detailActions}>
              <Pressable 
                onPress={onStar} 
                style={styles.actionButton}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={contact.starred ? "Remove from starred" : "Add to starred"}
                accessibilityHint={contact.starred ? "Removes this contact from your starred list" : "Adds this contact to your starred list"}
              >
                <StarIcon 
                  size={20} 
                  color={contact.starred ? "white" : "rgba(255,255,255,0.7)"} 
                  fill={contact.starred ? "white" : "transparent"} 
                />
              </Pressable>
              <Pressable 
                onPress={onEdit} 
                style={styles.actionButton}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Edit contact"
                accessibilityHint="Opens the edit form for this contact"
              >
                <Text style={styles.actionButtonText}>Edit</Text>
              </Pressable>
            </View>
          </View>

          <ScrollView style={styles.detailContent} showsVerticalScrollIndicator={false}>
            {/* Profile Section */}
            <View style={styles.profileSection}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{getInitials(contact.name)}</Text>
                </View>
                {contact.starred && (
                  <View style={styles.starBadge}>
                    <StarIcon size={14} color="#fbbf24" fill="#fbbf24" />
                  </View>
                )}
              </View>
              <Text style={styles.detailName}>{contact.name}</Text>
              {(contact.title || contact.company) && (
                <View style={styles.titleContainer}>
                  {contact.title && <Text style={styles.titleText}>{contact.title}</Text>}
                  {contact.title && contact.company && <Text style={styles.separatorText}> at </Text>}
                  {contact.company && <Text style={styles.companyText}>{contact.company}</Text>}
                </View>
              )}
              {(contact as any).city && (
                <View style={styles.locationRow}>
                  <MapPin size={16} color="rgba(59, 130, 246, 0.8)" />
                  <Text style={styles.locationText}>
                    {(contact as any).city}{(contact as any).country ? `, ${(contact as any).country}` : ''}
                  </Text>
                </View>
              )}
            </View>

            {/* Contact Information */}
            {contact.identifiers?.length > 0 && (
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Contact Information</Text>
                <View style={styles.identifiersGrid}>
                  {contact.identifiers.map((identifier, index) => (
                    <View key={index} style={styles.identifierCard}>
                      <View style={styles.identifierIcon}>
                        {identifier.type === 'email' && <Mail size={18} color="rgba(59, 130, 246, 0.9)" />}
                        {identifier.type === 'phone' && <Phone size={18} color="rgba(34, 197, 94, 0.9)" />}
                        {identifier.type === 'linkedin' && <ArrowRight size={18} color="rgba(0, 119, 181, 0.9)" />}
                        {identifier.type === 'url' && <ArrowRight size={18} color="rgba(168, 85, 247, 0.9)" />}
                      </View>
                      <View style={styles.identifierContent}>
                        <Text style={styles.identifierLabel}>
                          {identifier.type === 'email' ? 'Email' : 
                           identifier.type === 'phone' ? 'Phone' :
                           identifier.type === 'linkedin' ? 'LinkedIn' : 'Website'}
                        </Text>
                        <Text style={styles.identifierValue}>{identifier.value}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}


            {/* Groups */}
            {contact.groups?.length > 0 && (
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Groups</Text>
                <View style={styles.groupsContainer}>
                  {contact.groups.map((group, index) => (
                    <View key={index} style={styles.groupBadge}>
                      <Users size={12} color="rgba(255,255,255,0.8)" />
                      <Text style={styles.groupBadgeText}>{group}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Tags */}
            {contact.tags?.length > 0 && (
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Tags</Text>
                <View style={styles.tagsContainer}>
                  {contact.tags.map((tag, index) => (
                    <View key={index} style={styles.tagBadge}>
                      <TagIcon size={12} color="rgba(255,255,255,0.8)" />
                      <Text style={styles.tagBadgeText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Notes */}
            {contact.note && (
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Notes</Text>
                <View style={styles.notesContainer}>
                  <Text style={styles.notesText}>{contact.note}</Text>
                </View>
              </View>
            )}

            {/* Interaction History */}
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Last Interaction</Text>
              <View style={styles.interactionRow}>
                <Calendar size={16} color="rgba(255,255,255,0.7)" />
                <Text style={styles.interactionText}>
                  {new Date(contact.lastInteraction).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.detailFooter}>
            <Pressable 
              onPress={onDelete}
              style={[styles.footerButton, styles.deleteButton]}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Delete contact"
              accessibilityHint="Permanently removes this contact from your list"
            >
              <Trash2 size={16} color="rgba(220, 38, 38, 1)" />
              <Text style={styles.deleteButtonText}>Delete Contact</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
    paddingTop: 50,
  },
  modalBackdrop: {
    flex: 1,
  },
  detailModal: {
    backgroundColor: 'rgba(31, 41, 55, 0.95)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    height: '100%',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeButton: {
    padding: 12,
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  detailContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(59, 130, 246, 0.6)',
  },
  avatarText: {
    color: 'white',
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: 1,
  },
  starBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: 'rgba(251, 191, 36, 0.9)',
    borderRadius: 12,
    padding: 6,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  detailName: {
    color: 'white',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  titleText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 17,
    fontWeight: '500',
  },
  separatorText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 17,
    fontWeight: '400',
  },
  companyText: {
    color: 'rgba(59, 130, 246, 0.9)',
    fontSize: 17,
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  locationText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 15,
    fontWeight: '500',
  },
  detailSection: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  identifiersGrid: {
    gap: 12,
  },
  identifierCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  identifierIcon: {
    marginRight: 16,
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  identifierContent: {
    flex: 1,
  },
  identifierLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  identifierValue: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    fontWeight: '500',
  },
  groupsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  groupBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  groupBadgeText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    fontWeight: '500',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  tagBadgeText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    fontWeight: '500',
  },
  notesContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
  },
  notesText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    lineHeight: 20,
  },
  interactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  interactionText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  detailFooter: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  deleteButton: {
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.3)',
  },
  deleteButtonText: {
    color: 'rgba(220, 38, 38, 1)',
    fontSize: 14,
    fontWeight: '500',
  },
  enrichmentContainer: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  enrichButton: {
    width: '100%',
  },
});