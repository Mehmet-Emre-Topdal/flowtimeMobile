import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface State {
    hasError: boolean;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
    state: State = { hasError: false };

    static getDerivedStateFromError(): State {
        return { hasError: true };
    }

    componentDidCatch(error: Error) {
        console.warn('[ErrorBoundary] Uncaught error:', error);
    }

    render() {
        if (this.state.hasError) {
            return (
                <View style={styles.container}>
                    <Text style={styles.message}>Bir şeyler ters gitti.</Text>
                    <TouchableOpacity
                        style={styles.retryBtn}
                        onPress={() => this.setState({ hasError: false })}
                    >
                        <Text style={styles.retryText}>Tekrar Dene</Text>
                    </TouchableOpacity>
                </View>
            );
        }
        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0f0f0f',
        padding: 24,
    },
    message: {
        color: '#888',
        fontSize: 16,
        marginBottom: 20,
        textAlign: 'center',
    },
    retryBtn: {
        backgroundColor: '#1a1a1a',
        paddingVertical: 12,
        paddingHorizontal: 28,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#2a2a2a',
    },
    retryText: {
        color: '#6366f1',
        fontSize: 15,
        fontWeight: '600',
    },
});
