import { router } from '$lib/server/api';
import type { RequestHandler } from './$types';

const handler: RequestHandler = (event) => {
	return router.fetch(event.request, event.platform?.env);
};

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
