import { initializeApp } from 'firebase/app';
import {
	getAuth,
	signInWithPopup,
	GoogleAuthProvider,
	signInAnonymously,
	signOut,
	onAuthStateChanged,
	type User
} from 'firebase/auth';
import { firebaseConfig } from '$lib/config/firebase.client';
import { goto } from '$app/navigation';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Reactive state using Svelte 5 runes
export const authState = $state<{
	user: User | null;
	loading: boolean;
	error: string | null;
}>({
	user: null,
	loading: true,
	error: null
});

// Initialize auth state listener
export function initAuthListener() {
	onAuthStateChanged(auth, async (firebaseUser) => {
		authState.user = firebaseUser;
		authState.loading = false;

		if (firebaseUser) {
			// Send ID token to server to create session
			const idToken = await firebaseUser.getIdToken();

			const response = await fetch('/api/auth/session', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ idToken })
			});

			if (!response.ok) {
				authState.error = 'Failed to create session';
				console.error('Failed to create session:', await response.text());
			}
		}
	});
}

// Auth actions
export const authActions = {
	async signInWithGoogle() {
		try {
			authState.error = null;
			const provider = new GoogleAuthProvider();
			await signInWithPopup(auth, provider);
		} catch (error: any) {
			authState.error = error.message;
		}
	},

	async signInAnonymously() {
		try {
			authState.error = null;
			await signInAnonymously(auth);
		} catch (error: any) {
			authState.error = error.message;
		}
	},

	async signOut() {
		try {
			// Clear server session first
			await fetch('/api/auth/logout', { method: 'POST' });

			// Then sign out from Firebase
			await signOut(auth);
			authState.user = null;

			goto('/');
		} catch (error: any) {
			authState.error = error.message;
		}
	}
};
