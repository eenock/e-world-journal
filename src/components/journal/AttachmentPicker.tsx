// Fixed AttachmentPicker.tsx
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Image,
    Alert,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadAttachment, deleteAttachment, getPublicUrl } from '@/lib/supabase';
import * as Haptics from 'expo-haptics';

interface Attachment {
    id: string;
    uri: string;
    type: 'image';
    uploading?: boolean;
    storagePath?: string;
}

interface AttachmentPickerProps {
    userId: string;
    attachments: Attachment[];
    onAttachmentsChange: (attachments: Attachment[]) => void;
    maxAttachments?: number;
}

export const AttachmentPicker: React.FC<AttachmentPickerProps> = ({
    userId,
    attachments,
    onAttachmentsChange,
    maxAttachments = 5,
}) => {
    const [isUploading, setIsUploading] = useState(false);

    const requestPermissions = async (type: 'camera' | 'library') => {
        if (type === 'camera') {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'Permission Required',
                    'Please enable camera access to take photos.'
                );
                return false;
            }
        } else {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'Permission Required',
                    'Please enable photo library access to select images.'
                );
                return false;
            }
        }
        return true;
    };

    const pickImage = async (source: 'camera' | 'library') => {
        if (attachments.length >= maxAttachments) {
            Alert.alert('Limit Reached', `You can only add up to ${maxAttachments} images.`);
            return;
        }

        const hasPermission = await requestPermissions(source);
        if (!hasPermission) return;

        try {
            const result = source === 'camera'
                ? await ImagePicker.launchCameraAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: true,
                    aspect: [4, 3],
                    quality: 0.8,
                })
                : await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: true,
                    aspect: [4, 3],
                    quality: 0.8,
                });

            if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];
                await handleImageUpload(asset.uri);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Failed to pick image');
        }
    };

    const handleImageUpload = async (uri: string) => {
        const tempId = `temp-${Date.now()}`;
        const tempAttachment: Attachment = {
            id: tempId,
            uri,
            type: 'image',
            uploading: true,
        };

        // Add temporary attachment locally first
        const currentAttachments = [...attachments, tempAttachment];
        onAttachmentsChange(currentAttachments);
        setIsUploading(true);

        try {
            // Get file info
            const filename = uri.split('/').pop() || 'image.jpg';
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : 'image/jpeg';

            // Upload to Supabase Storage
            const data = await uploadAttachment(userId, {
                uri,
                name: filename,
                type,
            });

            // Update the temp attachment to remove uploading
            const updatedAttachments = currentAttachments.map((att) =>
                att.id === tempId
                    ? { ...att, uploading: false, storagePath: data.path }
                    : att
            );

            // Create the final attachment with public URL
            const newAttachment: Attachment = {
                id: data.path,
                uri: getPublicUrl(data.path),
                type: 'image',
                storagePath: data.path,
            };

            // Replace temp with new
            onAttachmentsChange(
                updatedAttachments.filter((att) => att.id !== tempId).concat(newAttachment)
            );
        } catch (error) {
            console.error('Upload error:', error);
            Alert.alert('Upload Failed', 'Failed to upload image');

            // Remove failed upload
            onAttachmentsChange(attachments.filter((att) => att.id !== tempId));
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemoveAttachment = async (attachment: Attachment) => {
        Alert.alert('Remove Image', 'Are you sure you want to remove this image?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Remove',
                style: 'destructive',
                onPress: async () => {
                    try {
                        // Delete from storage if it has a storage path
                        if (attachment.storagePath) {
                            await deleteAttachment(attachment.storagePath);
                        }

                        onAttachmentsChange(
                            attachments.filter((att) => att.id !== attachment.id)
                        );
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    } catch (error) {
                        console.error('Delete error:', error);
                        Alert.alert('Error', 'Failed to remove image');
                    }
                },
            },
        ]);
    };

    const showPickerOptions = () => {
        Alert.alert('Add Photo', 'Choose how to add a photo', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Take Photo',
                onPress: () => pickImage('camera'),
            },
            {
                text: 'Choose from Library',
                onPress: () => pickImage('library'),
            },
        ]);
    };

    return (
        <View style={styles.container}>
            {/* Attachments Grid */}
            {attachments.length > 0 && (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.attachmentsList}
                >
                    {attachments.map((attachment) => (
                        <View key={attachment.id} style={styles.attachmentItem}>
                            {attachment.uploading ? (
                                <View style={styles.uploadingOverlay}>
                                    <ActivityIndicator color="#fff" />
                                </View>
                            ) : (
                                <Pressable
                                    style={styles.removeButton}
                                    onPress={() => handleRemoveAttachment(attachment)}
                                >
                                    <Text style={styles.removeIcon}>✕</Text>
                                </Pressable>
                            )}
                            <Image
                                source={{ uri: attachment.uri }}
                                style={styles.attachmentImage}
                                resizeMode="cover"
                            />
                        </View>
                    ))}
                </ScrollView>
            )}

            {/* Add Button */}
            {attachments.length < maxAttachments && (
                <Pressable
                    style={styles.addButton}
                    onPress={showPickerOptions}
                    disabled={isUploading}
                >
                    <Text style={styles.addIcon}>📷</Text>
                    <Text style={styles.addText}>
                        Add Photo {attachments.length > 0 && `(${attachments.length}/${maxAttachments})`}
                    </Text>
                </Pressable>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        gap: 12,
    },
    attachmentsList: {
        marginBottom: 8,
    },
    attachmentItem: {
        position: 'relative',
        width: 120,
        height: 120,
        marginRight: 12,
        borderRadius: 12,
        overflow: 'hidden',
    },
    attachmentImage: {
        width: '100%',
        height: '100%',
    },
    uploadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
    },
    removeButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(0,0,0,0.7)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
    },
    removeIcon: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f0f4ff',
        padding: 16,
        borderRadius: 12,
        gap: 8,
        borderWidth: 1,
        borderColor: '#667eea',
        borderStyle: 'dashed',
    },
    addIcon: {
        fontSize: 20,
    },
    addText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#667eea',
    },
});