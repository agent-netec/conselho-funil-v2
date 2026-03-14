import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  sendEmailVerification as firebaseSendEmailVerification,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  type User,
} from 'firebase/auth';
import { auth } from './config';

// Sign in with email and password
export async function signIn(email: string, password: string) {
  if (!auth) throw new Error('Firebase Auth não inicializado.');
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return { user: result.user, error: null };
  } catch (error: any) {
    return { user: null, error: getErrorMessage(error.code) };
  }
}

// Sign up with email and password
export async function signUp(email: string, password: string) {
  if (!auth) throw new Error('Firebase Auth não inicializado.');
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return { user: result.user, error: null };
  } catch (error: any) {
    return { user: null, error: getErrorMessage(error.code) };
  }
}

// Sign in with Google (redirect flow — avoids COOP popup issues)
export async function signInWithGoogle() {
  if (!auth) throw new Error('Firebase Auth não inicializado.');
  try {
    const provider = new GoogleAuthProvider();
    await signInWithRedirect(auth, provider);
    // Page will redirect to Google — this line is never reached
    return { user: null, error: null };
  } catch (error: any) {
    return { user: null, error: getErrorMessage(error.code) };
  }
}

// Call this once on app init to complete any pending Google redirect sign-in
export async function handleGoogleRedirectResult() {
  if (!auth) return null;
  try {
    const result = await getRedirectResult(auth);
    return result?.user ?? null;
  } catch (error: any) {
    console.warn('[Auth] getRedirectResult error:', error.code);
    return null;
  }
}

// Sign out
export async function signOut() {
  if (!auth) return { error: 'Auth não disponível' };
  try {
    await firebaseSignOut(auth);
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
}

// Alias for signOut (used in components)
export const logout = signOut;

// Alias for signIn (used in login page)
export const loginWithEmail = async (email: string, password: string) => {
  if (!auth) throw new Error('Auth não disponível');
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
};

// Alias for signUp (used in signup page)
export const signupWithEmail = async (email: string, password: string, displayName?: string) => {
  if (!auth) throw new Error('Auth não disponível');
  const result = await createUserWithEmailAndPassword(auth, email, password);
  // Update display name if provided
  if (displayName && result.user) {
    const { updateProfile } = await import('firebase/auth');
    await updateProfile(result.user, { displayName });
  }
  // R-1.7: Send email verification after signup
  try {
    await firebaseSendEmailVerification(result.user, getActionCodeSettings());
  } catch (e) {
    console.warn('[Auth] Email verification send failed:', e);
  }
  return result.user;
};

// Subscribe to auth state changes
export function onAuthChange(callback: (user: User | null) => void) {
  if (!auth || (auth as any)._isMock) return () => {};
  return onAuthStateChanged(auth, callback);
}

// Get current user
export function getCurrentUser() {
  return auth?.currentUser || null;
}

// Action URL settings for Firebase email links
function getActionCodeSettings() {
  // Use current origin in browser so the URL is always whitelisted (matches the deployed domain)
  const baseUrl = typeof window !== 'undefined'
    ? window.location.origin
    : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001');
  return {
    url: `${baseUrl}/auth/action`,
    handleCodeInApp: false,
  };
}

// R-1.7: Send email verification
export async function sendEmailVerification(user?: User | null) {
  const target = user || auth?.currentUser;
  if (!target) throw new Error('Nenhum usuário autenticado');
  if (target.emailVerified) return;
  await firebaseSendEmailVerification(target, getActionCodeSettings());
}

// R-1.8: Send password reset email
export async function sendPasswordReset(email: string) {
  if (!auth) throw new Error('Auth não disponível');
  await firebaseSendPasswordResetEmail(auth, email);
}

// Error messages in Portuguese
function getErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    'auth/email-already-in-use': 'Este email já está em uso.',
    'auth/invalid-email': 'Email inválido.',
    'auth/operation-not-allowed': 'Operação não permitida.',
    'auth/weak-password': 'Senha muito fraca. Use pelo menos 6 caracteres.',
    'auth/user-disabled': 'Esta conta foi desativada.',
    'auth/user-not-found': 'Usuário não encontrado.',
    'auth/wrong-password': 'Senha incorreta.',
    'auth/invalid-credential': 'Credenciais inválidas.',
    'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
    'auth/popup-closed-by-user': 'Login cancelado.',
  };
  return messages[code] || 'Erro ao autenticar. Tente novamente.';
}


