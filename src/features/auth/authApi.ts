import { baseApi } from '../../store/api/baseApi';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile,
    signOut,
    GoogleAuthProvider,
    signInWithCredential,
} from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { UserDto } from '../../types/auth';

export const authApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({

        loginWithEmail: builder.mutation<UserDto, { email: string; password: string }>({
            queryFn: async ({ email, password }) => {
                try {
                    const result = await signInWithEmailAndPassword(auth, email, password);
                    const user = result.user;
                    return {
                        data: {
                            uid: user.uid,
                            email: user.email,
                            displayName: user.displayName,
                            photoURL: user.photoURL,
                        },
                    };
                } catch (error) {
                    const code = (error as { code?: string }).code;
                    const messages: Record<string, string> = {
                        'auth/user-not-found': 'Bu e-posta ile kayıtlı hesap bulunamadı.',
                        'auth/wrong-password': 'Hatalı e-posta veya şifre.',
                        'auth/invalid-credential': 'Hatalı e-posta veya şifre.',
                        'auth/too-many-requests': 'Çok fazla deneme. Lütfen daha sonra tekrar deneyin.',
                        'auth/invalid-email': 'Geçersiz e-posta adresi.',
                    };
                    return { error: { status: 'CUSTOM_ERROR', error: messages[code ?? ''] ?? 'Giriş başarısız.' } };
                }
            },
        }),

        registerWithEmail: builder.mutation<UserDto, { email: string; password: string; displayName: string }>({
            queryFn: async ({ email, password, displayName }) => {
                try {
                    const result = await createUserWithEmailAndPassword(auth, email, password);
                    await updateProfile(result.user, { displayName });
                    const user = result.user;
                    return {
                        data: {
                            uid: user.uid,
                            email: user.email,
                            displayName,
                            photoURL: user.photoURL,
                        },
                    };
                } catch (error) {
                    const code = (error as { code?: string }).code;
                    const messages: Record<string, string> = {
                        'auth/email-already-in-use': 'Bu e-posta zaten kayıtlı.',
                        'auth/weak-password': 'Şifre en az 6 karakter olmalı.',
                        'auth/invalid-email': 'Geçersiz e-posta adresi.',
                    };
                    return { error: { status: 'CUSTOM_ERROR', error: messages[code ?? ''] ?? 'Kayıt başarısız.' } };
                }
            },
        }),

        loginWithGoogle: builder.mutation<UserDto, { idToken: string }>({
            queryFn: async ({ idToken }) => {
                try {
                    const credential = GoogleAuthProvider.credential(idToken);
                    const result = await signInWithCredential(auth, credential);
                    const user = result.user;
                    return {
                        data: {
                            uid: user.uid,
                            email: user.email,
                            displayName: user.displayName,
                            photoURL: user.photoURL,
                        },
                    };
                } catch (error) {
                    const code = (error as { code?: string }).code;
                    const messages: Record<string, string> = {
                        'auth/invalid-credential': 'Google ile giriş başarısız.',
                        'auth/account-exists-with-different-credential': 'Bu e-posta farklı bir yöntemle kayıtlı.',
                    };
                    return { error: { status: 'CUSTOM_ERROR', error: messages[code ?? ''] ?? 'Google ile giriş başarısız.' } };
                }
            },
        }),

        logout: builder.mutation<null, void>({
            queryFn: async () => {
                try {
                    await signOut(auth);
                    return { data: null };
                } catch (error) {
                    return { error: { status: 'CUSTOM_ERROR', error: String(error) } };
                }
            },
        }),
    }),
});

export const {
    useLoginWithEmailMutation,
    useRegisterWithEmailMutation,
    useLoginWithGoogleMutation,
    useLogoutMutation,
} = authApi;
