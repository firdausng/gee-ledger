// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { VerifyFirebaseAuthEnv } from '@hono/firebase-auth';

declare global {
	namespace App {
		interface Platform {
			env: Env;
			cf: CfProperties;
			ctx: ExecutionContext;
			caches: CacheStorage;
		}

		interface User {
			id: string;
			email: string | null;
			displayName: string | null;
			photoURL: string | null;
		}

		interface Locals {
			user: App.User | null;
		}

		interface Api {
			Bindings: Cloudflare.Env & VerifyFirebaseAuthEnv;
			Variables: {
				currentUser: App.User;
			};
		}

		// interface Error {}
		// interface PageData {}
		// interface PageState {}
	}
}

export {};
