import { useState, useRef, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, FlatList,
    StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSendMessageMutation } from '../features/assistant/api/assistantApi';
import {
    useGetChatHistoryQuery,
    useSaveChatHistoryMutation,
    useClearChatHistoryMutation,
} from '../features/assistant/api/chatHistoryApi';
import { ChatMessage } from '../types/assistant';

const SCROLL_DELAY_MS = 100;

export default function AssistantScreen() {
    const { t } = useTranslation();
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [summary, setSummary] = useState<string | null>(null);
    const [hasWelcomed, setHasWelcomed] = useState(false);
    const [welcomeError, setWelcomeError] = useState(false);
    const flatListRef = useRef<FlatList>(null);
    const initializedRef = useRef(false);

    const { data: historyData, isLoading: historyLoading } = useGetChatHistoryQuery();
    const [sendMessage, { isLoading: isSending }] = useSendMessageMutation();
    const [saveChatHistory] = useSaveChatHistoryMutation();
    const [clearChatHistory] = useClearChatHistoryMutation();

    useEffect(() => {
        if (initializedRef.current || !historyData) return;
        initializedRef.current = true;
        if (historyData.messages.length > 0) {
            setMessages(historyData.messages);
            setSummary(historyData.summary);
            setHasWelcomed(true);
        } else {
            triggerWelcome();
        }
    }, [historyData]);

    const triggerWelcome = async () => {
        if (hasWelcomed) return;
        setHasWelcomed(true);
        setWelcomeError(false);
        try {
            const result = await sendMessage({
                message: '',
                conversationHistory: [],
                conversationSummary: null,
            }).unwrap();
            setMessages(result.updatedHistory);
            setSummary(result.updatedSummary);
            await saveChatHistory({ messages: result.updatedHistory, summary: result.updatedSummary });
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), SCROLL_DELAY_MS);
        } catch (err) {
            console.warn('[Assistant] triggerWelcome failed:', err);
            setHasWelcomed(false);
            setWelcomeError(true);
        }
    };

    const handleRetryWelcome = () => {
        triggerWelcome();
    };

    const isLoading = historyLoading || isSending;

    const handleSend = async () => {
        const text = input.trim();
        if (!text || isSending) return;
        setInput('');

        const userMsg: ChatMessage = {
            role: 'user',
            content: text,
            timestamp: new Date().toISOString(),
        };
        const optimisticMessages = [...messages, userMsg];
        setMessages(optimisticMessages);

        try {
            const result = await sendMessage({
                message: text,
                conversationHistory: messages,
                conversationSummary: summary,
            }).unwrap();

            setMessages(result.updatedHistory);
            setSummary(result.updatedSummary);
            await saveChatHistory({ messages: result.updatedHistory, summary: result.updatedSummary });
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), SCROLL_DELAY_MS);
        } catch {
            const errMsg: ChatMessage = {
                role: 'assistant',
                content: t('assistant.errorMessage'),
                timestamp: new Date().toISOString(),
            };
            const withError = [...optimisticMessages, errMsg];
            setMessages(withError);
        }
    };

    const handleClear = async () => {
        await clearChatHistory();
        setMessages([]);
        setSummary(null);
        setHasWelcomed(false);
        initializedRef.current = false;
    };

    const renderMessage = ({ item }: { item: ChatMessage }) => {
        const isUser = item.role === 'user';
        return (
            <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
                <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextAssistant]}>
                    {item.content}
                </Text>
            </View>
        );
    };

    if (historyLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator color="#6366f1" />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={80}
        >
            <View style={styles.header}>
                <Text style={styles.heading}>{t('assistant.title')}</Text>
                {messages.length > 0 && (
                    <TouchableOpacity onPress={handleClear}>
                        <Text style={styles.clearText}>{t('common.clear')}</Text>
                    </TouchableOpacity>
                )}
            </View>

            {messages.length === 0 ? (
                <View style={styles.emptyArea}>
                    {isSending ? (
                        <ActivityIndicator color="#6366f1" />
                    ) : welcomeError ? (
                        <>
                            <Text style={styles.errorTitle}>{t('assistant.loadError', 'Asistan yüklenemedi')}</Text>
                            <TouchableOpacity style={styles.retryBtn} onPress={handleRetryWelcome}>
                                <Text style={styles.retryBtnText}>{t('common.retry', 'Tekrar Dene')}</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <Text style={styles.emptyTitle}>{t('assistant.welcomeTitle')}</Text>
                            <Text style={styles.emptySubtitle}>
                                {t('assistant.welcomeText')}
                            </Text>
                        </>
                    )}
                </View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(msg) => `${msg.timestamp}-${msg.role}`}
                    renderItem={renderMessage}
                    contentContainerStyle={styles.messageList}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                />
            )}

            {isSending && messages.length > 0 && (
                <View style={styles.typingRow}>
                    <ActivityIndicator color="#6366f1" size="small" />
                    <Text style={styles.typingText}>{t('assistant.thinking')}</Text>
                </View>
            )}

            <View style={styles.inputRow}>
                <TextInput
                    style={styles.input}
                    placeholder={t('assistant.placeholder')}
                    placeholderTextColor="#555"
                    value={input}
                    onChangeText={setInput}
                    multiline
                    editable={!isLoading}
                />
                <TouchableOpacity
                    style={[styles.sendBtn, (!input.trim() || isSending) && styles.sendBtnDisabled]}
                    onPress={handleSend}
                    disabled={!input.trim() || isSending}
                >
                    {isSending
                        ? <ActivityIndicator color="#fff" size="small" />
                        : <Text style={styles.sendBtnText}>↑</Text>
                    }
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f0f0f' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f0f0f' },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8,
    },
    heading: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
    clearText: { color: '#555', fontSize: 13 },
    emptyArea: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
    emptyTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
    emptySubtitle: { color: '#555', fontSize: 14, textAlign: 'center', lineHeight: 20 },
    errorTitle: { color: '#888', fontSize: 15, marginBottom: 16, textAlign: 'center' },
    retryBtn: {
        paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8,
        borderWidth: 1, borderColor: '#2a2a2a',
    },
    retryBtnText: { color: '#6366f1', fontSize: 14, fontWeight: '600' },
    messageList: { padding: 16, paddingBottom: 8 },
    bubble: {
        maxWidth: '82%', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10,
        marginBottom: 10,
    },
    bubbleUser: { backgroundColor: '#6366f1', alignSelf: 'flex-end' },
    bubbleAssistant: { backgroundColor: '#1a1a1a', alignSelf: 'flex-start', borderWidth: 1, borderColor: '#2a2a2a' },
    bubbleText: { fontSize: 14, lineHeight: 20 },
    bubbleTextUser: { color: '#fff' },
    bubbleTextAssistant: { color: '#ccc' },
    typingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingBottom: 6 },
    typingText: { color: '#555', fontSize: 12 },
    inputRow: {
        flexDirection: 'row', alignItems: 'flex-end', gap: 8,
        paddingHorizontal: 12, paddingVertical: 10,
        borderTopWidth: 1, borderTopColor: '#1a1a1a',
    },
    input: {
        flex: 1, backgroundColor: '#1a1a1a', color: '#fff',
        borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10,
        fontSize: 14, maxHeight: 100, borderWidth: 1, borderColor: '#2a2a2a',
    },
    sendBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: '#6366f1', justifyContent: 'center', alignItems: 'center',
    },
    sendBtnDisabled: { backgroundColor: '#2a2a2a' },
    sendBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
