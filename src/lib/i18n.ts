import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from '../locales/en.json';
import tr from '../locales/tr.json';

const LANGUAGE_KEY = 'user-language';

const resources = {
    en: { translation: en },
    tr: { translation: tr },
};

const languageDetector: any = {
    type: 'languageDetector',
    async: true,
    detect: async (callback: (lang: string) => void) => {
        try {
            const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
            if (savedLanguage) {
                return callback(savedLanguage);
            }

            const deviceLang = Localization.getLocales()[0]?.languageCode ?? 'en';
            const supported = ['tr', 'en'];
            callback(supported.includes(deviceLang) ? deviceLang : 'en');
        } catch (error) {
            console.log('Error reading language', error);
            callback('en');
        }
    },
    init: () => { },
    cacheUserLanguage: async (language: string) => {
        try {
            await AsyncStorage.setItem(LANGUAGE_KEY, language);
        } catch (error) {
            console.log('Error saving language', error);
        }
    },
};

i18n
    .use(languageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false,
        },
        react: {
            useSuspense: false,
        },
    });

export default i18n;
