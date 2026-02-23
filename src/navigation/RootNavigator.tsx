import { View, ActivityIndicator } from 'react-native';
import { useAuthInit } from '../features/auth/useAuthInit';
import { useAppSelector } from '../hooks/storeHooks';
import LoginScreen from '../screens/LoginScreen';
import MainScreen from '../screens/MainScreen';

export default function RootNavigator() {
    useAuthInit();
    const { isAuthenticated, isLoading } = useAppSelector(state => state.auth);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return isAuthenticated ? <MainScreen /> : <LoginScreen />;
}
