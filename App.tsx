import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store } from './src/store';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
    return (
        <Provider store={store}>
            <SafeAreaProvider>
                <RootNavigator />
            </SafeAreaProvider>
        </Provider>
    );
}
