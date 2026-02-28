import { baseApi } from '../../store/api/baseApi';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile,
    signOut,
    GoogleAuthProvider,
    signInWithCredential,
    User,
} from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { UserDto } from '../../types/auth';

function toUserDto(user: User, overrides?: Partial<UserDto>): { data: UserDto } {
    return {
        data: {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            ...overrides,
        },
    };
}

function mapAuthError(error: unknown, messages: Record<string, string>, fallback: string) {
    const code = (error as { code?: string }).code ?? '';
    return { error: { status: 'CUSTOM_ERROR' as const, error: messages[code] ?? fallback } };
}

export const authApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({

        loginWithEmail: builder.mutation<UserDto, { email: string; password: string }>({
            queryFn: async ({ email, password }) => {
                try {
                    const result = await signInWithEmailAndPassword(auth, email, password);
                    return toUserDto(result.user);
                } catch (error) {
                    return mapAuthError(error, {
                        'auth/user-not-found': 'Bu e-posta ile kayıtlı hesap bulunamadı.',
                        'auth/wrong-password': 'Hatalı e-posta veya şifre.',
                        'auth/invalid-credential': 'Hatalı e-posta veya şifre.',
                        'auth/too-many-requests': 'Çok fazla deneme. Lütfen daha sonra tekrar deneyin.',
                        'auth/invalid-email': 'Geçersiz e-posta adresi.',
                    }, 'Giriş başarısız.');
                }
            },
        }),

        registerWithEmail: builder.mutation<UserDto, { email: string; password: string; displayName: string }>({
            queryFn: async ({ email, password, displayName }) => {
                try {
                    const result = await createUserWithEmailAndPassword(auth, email, password);
                    await updateProfile(result.user, { displayName });
                    return toUserDto(result.user, { displayName });
                } catch (error) {
                    return mapAuthError(error, {
                        'auth/email-already-in-use': 'Bu e-posta zaten kayıtlı.',
                        'auth/weak-password': 'Şifre en az 6 karakter olmalı.',
                        'auth/invalid-email': 'Geçersiz e-posta adresi.',
                    }, 'Kayıt başarısız.');
                }
            },
        }),

        loginWithGoogle: builder.mutation<UserDto, { idToken: string }>({
            queryFn: async ({ idToken }) => {
                try {
                    const credential = GoogleAuthProvider.credential(idToken);
                    const result = await signInWithCredential(auth, credential);
                    return toUserDto(result.user);
                } catch (error) {
                    return mapAuthError(error, {
                        'auth/invalid-credential': 'Google ile giriş başarısız.',
                        'auth/account-exists-with-different-credential': 'Bu e-posta farklı bir yöntemle kayıtlı.',
                    }, 'Google ile giriş başarısız.');
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
