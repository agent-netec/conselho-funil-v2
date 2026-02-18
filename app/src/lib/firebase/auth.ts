import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
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

// Sign in with Google
export async function signInWithGoogle() {
  if (!auth) throw new Error('Firebase Auth não inicializado.');
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return { user: result.user, error: null };
  } catch (error: any) {
    return { user: null, error: getErrorMessage(error.code) };
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
    await firebaseSendEmailVerification(result.user);
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

// R-1.7: Send email verification
export async function sendEmailVerification(user?: User | null) {
  const target = user || auth?.currentUser;
  if (!target) throw new Error('Nenhum usuário autenticado');
  if (target.emailVerified) return;
  await firebaseSendEmailVerification(target);
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


