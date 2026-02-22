import { initializeApp } from 'firebase/app';
import {
	getAuth,
	signInWithPopup,
	GoogleAuthProvider,
	signOut,
	onIdTokenChanged,
	type User
} from 'firebase/auth';
import { firebaseConfig } from '$lib/config/firebase.client';
import { goto } from '$app/navigation';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export const authState = $state<{
	user: User | null;
	loading: boolean;
	error: string | null;
}>({
	user: null,
	loading: true,
	error: null
});

export function initAuthListener() {
	onIdTokenChanged(auth, async (firebaseUser) => {
		authState.user = firebaseUser;
		authState.loading = false;

		if (firebaseUser) {
			const idToken = await firebaseUser.getIdToken();
			document.cookie = `__session=${idToken}; path=/; max-age=3600; SameSite=Strict`;
		} else {
			document.cookie = '__session=; path=/; max-age=0; SameSite=Strict';
		}
	});
}

export const authActions = {
	async signInWithGoogle() {
        console.log('signInWithGoogle', authState);
		try {
			authState.error = null;
			const provider = new GoogleAuthProvider();
			await signInWithPopup(auth, provider);
		} catch (error: unknown) {
			authState.error = error instanceof Error ? error.message : 'Sign-in failed';
		}
	},

	async signOut() {
		try {
			await signOut(auth);
			authState.user = null;
			goto('/login');
		} catch (error: unknown) {
			authState.error = error instanceof Error ? error.message : 'Sign-out failed';
		}
	},

	async getIdToken(): Promise<string | null> {
		if (!authState.user) return null;
		return authState.user.getIdToken();
	}
};
