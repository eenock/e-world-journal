import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';

interface VoiceRecorderProps {
    onRecordingComplete: (uri: string, duration: number) => void;
    onTranscriptionComplete?: (text: string) => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
    onRecordingComplete,
    onTranscriptionComplete,
}) => {
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [isTranscribing, setIsTranscribing] = useState(false);

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isRecording) {
            interval = setInterval(() => {
                setRecordingDuration((prev) => prev + 1);
            }, 1000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isRecording]);

    const requestPermissions = async () => {
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                'Permission Required',
                'Please enable microphone access to record voice notes.'
            );
            return false;
        }
        return true;
    };

    const startRecording = async () => {
        try {
            const hasPermission = await requestPermissions();
            if (!hasPermission) return;

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );

            setRecording(recording);
            setIsRecording(true);
            setRecordingDuration(0);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (error) {
            console.error('Failed to start recording:', error);
            Alert.alert('Error', 'Failed to start recording');
        }
    };

    const stopRecording = async () => {
        if (!recording) return;

        try {
            await recording.stopAndUnloadAsync();
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
            });

            const uri = recording.getURI();
            if (!uri) {
                throw new Error('No recording URI');
            }

            const duration = recordingDuration;

            setIsRecording(false);
            setRecording(null);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            onRecordingComplete(uri, duration);

            // Transcribe if handler provided
            if (onTranscriptionComplete) {
                await transcribeAudio(uri);
            }
        } catch (error) {
            console.error('Failed to stop recording:', error);
            Alert.alert('Error', 'Failed to stop recording');
        }
    };

    const transcribeAudio = async (uri: string) => {
        setIsTranscribing(true);

        try {
            // Read audio file as base64
            const audioData = await FileSystem.readAsStringAsync(uri, {
                encoding: FileSystem.EncodingType.Base64,
            });

            // Use Groq's Whisper endpoint
            const formData = new FormData();
            formData.append('file', {
                uri,
                type: 'audio/m4a',
                name: 'recording.m4a',
            } as any);
            formData.append('model', 'whisper-large-v3');

            const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${EXPO_PUBLIC_GROQ_API_KEY}`,
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Transcription failed');
            }

            const result = await response.json();
            const transcription = result.text;

            if (onTranscriptionComplete && transcription) {
                onTranscriptionComplete(transcription);
            }
        } catch (error) {
            console.error('Transcription error:', error);
            Alert.alert(
                'Transcription Failed',
                'Unable to transcribe audio. The recording has been saved.'
            );
        } finally {
            setIsTranscribing(false);
        }
    };

    const cancelRecording = async () => {
        if (recording) {
            await recording.stopAndUnloadAsync();
            setRecording(null);
            setIsRecording(false);
            setRecordingDuration(0);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (isTranscribing) {
        return (
            <View style={styles.transcribingContainer}>
                <ActivityIndicator color="#667eea" />
                <Text style={styles.transcribingText}>Transcribing...</Text>
            </View>
        );
    }

    if (isRecording) {
        return (
            <View style={styles.recordingContainer}>
                <View style={styles.recordingHeader}>
                    <View style={styles.recordingIndicator}>
                        <View style={styles.recordingDot} />
                        <Text style={styles.recordingText}>Recording</Text>
                    </View>
                    <Text style={styles.durationText}>{formatDuration(recordingDuration)}</Text>
                </View>

                <View style={styles.recordingActions}>
                    <Pressable style={styles.cancelButton} onPress={cancelRecording}>
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </Pressable>

                    <Pressable style={styles.stopButton} onPress={stopRecording}>
                        <View style={styles.stopIcon} />
                    </Pressable>
                </View>
            </View>
        );
    }

    return (
        <Pressable style={styles.startButton} onPress={startRecording}>
            <Text style={styles.micIcon}>🎙️</Text>
            <Text style={styles.startButtonText}>Record Voice Note</Text>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    startButton: {
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
    micIcon: {
        fontSize: 20,
    },
    startButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#667eea',
    },
    recordingContainer: {
        backgroundColor: '#fff3cd',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ffc107',
    },
    recordingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    recordingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    recordingDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#dc3545',
    },
    recordingText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#856404',
    },
    durationText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#856404',
        fontVariant: ['tabular-nums'],
    },
    recordingActions: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#dc3545',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#dc3545',
    },
    stopButton: {
        flex: 1,
        backgroundColor: '#dc3545',
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stopIcon: {
        width: 20,
        height: 20,
        backgroundColor: '#fff',
        borderRadius: 4,
    },
    transcribingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f0f4ff',
        padding: 16,
        borderRadius: 12,
        gap: 12,
    },
    transcribingText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#667eea',
    },
});