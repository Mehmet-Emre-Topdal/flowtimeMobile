import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store } from './src/store';
import RootNavigator from './src/navigation/RootNavigator';
import './src/lib/i18n';
import { setupNotifications } from './src/lib/notifications';

export default function App() {
    useEffect(() => {
        setupNotifications();
    }, []);

    return (
        <Provider store={store}>
            <SafeAreaProvider>
                <RootNavigator />
            </SafeAreaProvider>
        </Provider>
    );
}
