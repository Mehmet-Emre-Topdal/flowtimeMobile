import { useState, useEffect } from 'react';
import {
    Text, TextInput, TouchableOpacity,
    ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform, View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useLoginWithEmailMutation, useRegisterWithEmailMutation, useLoginWithGoogleMutation } from '../features/auth/authApi';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = '290414008129-479nqms4n5oodido255jds092lomtlmn.apps.googleusercontent.com';

type Mode = 'login' | 'register';

export default function LoginScreen() {
    const { t } = useTranslation();
    const [mode, setMode] = useState<Mode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [error, setError] = useState<string | null>(null);

    const [loginWithEmail, { isLoading: isLoginLoading }] = useLoginWithEmailMutation();
    const [registerWithEmail, { isLoading: isRegisterLoading }] = useRegisterWithEmailMutation();
    const [loginWithGoogle, { isLoading: isGoogleLoading }] = useLoginWithGoogleMutation();

    const [request, response, promptAsync] = Google.useAuthRequest({
        webClientId: GOOGLE_CLIENT_ID,
        androidClientId: GOOGLE_CLIENT_ID,
    });

    useEffect(() => {
        if (response?.type === 'success') {
            const idToken = response.authentication?.idToken;
            if (idToken) {
                loginWithGoogle({ idToken }).unwrap().catch((err) => {
                    const e = err as { error?: string };
                    setError(e?.error ?? t('auth.googleFailed'));
                });
            } else {
                setError(t('auth.googleNoToken'));
            }
        } else if (response?.type === 'error') {
            setError(t('auth.googleCancelled'));
        }
    }, [response]);

    const isLoading = isLoginLoading || isRegisterLoading || isGoogleLoading;

    const handleSubmit = async () => {
        setError(null);
        if (!email.trim() || !password.trim()) {
            setError(t('auth.emailPasswordRequired'));
            return;
        }
        try {
            if (mode === 'login') {
                await loginWithEmail({ email, password }).unwrap();
            } else {
                if (!displayName.trim()) { setError(t('auth.nameRequired')); return; }
                await registerWithEmail({ email, password, displayName }).unwrap();
            }
        } catch (err) {
            const e = err as { error?: string };
            setError(e?.error ?? t('auth.genericError'));
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <Text style={styles.title}>Flowtime</Text>

            {error && <Text style={styles.error}>{error}</Text>}

            {mode === 'register' && (
                <TextInput
                    style={styles.input}
                    placeholder={t('auth.namePlaceholder')}
                    placeholderTextColor="#888"
                    value={displayName}
                    onChangeText={setDisplayName}
                    autoCapitalize="words"
                />
            )}

            <TextInput
                style={styles.input}
                placeholder={t('auth.emailPlaceholder')}
                placeholderTextColor="#888"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
            />

            <TextInput
                style={styles.input}
                placeholder={t('auth.passwordPlaceholder')}
                placeholderTextColor="#888"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={isLoading}>
                {isLoginLoading || isRegisterLoading
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.buttonText}>
                        {mode === 'login' ? t('auth.loginAction') : t('auth.registerAction')}
                    </Text>
                }
            </TouchableOpacity>

            <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>{t('auth.or')}</Text>
                <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
                style={[styles.button, styles.googleButton]}
                onPress={() => { setError(null); promptAsync(); }}
                disabled={isLoading || !request}
            >
                {isGoogleLoading
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.buttonText}>{t('auth.loginGoogle')}</Text>
                }
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}>
                <Text style={styles.switchText}>
                    {mode === 'login' ? t('auth.noAccount') : t('auth.hasAccount')}
                </Text>
            </TouchableOpacity>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
        backgroundColor: '#0f0f0f',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 40,
    },
    input: {
        backgroundColor: '#1a1a1a',
        color: '#fff',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#2a2a2a',
    },
    button: {
        backgroundColor: '#6366f1',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 20,
    },
    googleButton: {
        backgroundColor: '#333',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    error: {
        color: '#ef4444',
        marginBottom: 12,
        textAlign: 'center',
    },
    switchText: {
        color: '#888',
        textAlign: 'center',
        fontSize: 14,
    },
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#2a2a2a',
    },
    dividerText: {
        color: '#555',
        marginHorizontal: 12,
        fontSize: 13,
    },
});
