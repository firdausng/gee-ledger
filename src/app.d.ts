// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	// Extend auto-generated Cloudflare.Env with secrets/vars not tracked by wrangler types
	namespace Cloudflare {
		interface Env {
			RESEND_API_KEY: string;
			FROM_DOMAIN: string;
			STRIPE_SECRET_KEY: string;
			STRIPE_WEBHOOK_SECRET: string;
			STRIPE_PRICE_ID_PRO_MONTHLY: string;
			STRIPE_PRICE_ID_PRO_YEARLY: string;
		}
	}

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
			Bindings: Cloudflare.Env;
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
