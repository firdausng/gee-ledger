import { user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import {drizzle} from "drizzle-orm/d1";
import * as schema from "$lib/server/db/schema";

interface FirebaseUser {
	uid: string;
	email?: string;
	name?: string;
	picture?: string;
	firebase: {
		sign_in_provider: string;
	};
}

export async function syncFirebaseUser(firebaseUser: FirebaseUser, env: Cloudflare.Env) {
	const db = drizzle(env.DB, { schema });
	const isAnonymous = firebaseUser.firebase.sign_in_provider === 'anonymous';

	const [existingUser] = await db.select().from(user).where(eq(user.id, firebaseUser.uid)).limit(1);

	if (existingUser) {
		// Update existing user
		await db
			.update(user)
			.set({
				email: firebaseUser.email || existingUser.email,
				displayName: firebaseUser.name || existingUser.displayName,
				photoURL: firebaseUser.picture || existingUser.photoURL,
				lastLoginAt: new Date()
			})
			.where(eq(user.id, firebaseUser.uid));

		return existingUser;
	} else {
		// Create new user
		const newUser = {
			id: firebaseUser.uid,
			email: firebaseUser.email || null,
			displayName: firebaseUser.name || null,
			photoURL: firebaseUser.picture || null,
			provider: firebaseUser.firebase.sign_in_provider,
			isAnonymous
		};

		await db.insert(user).values(newUser);

		return newUser;
	}
}
