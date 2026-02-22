import { sequence } from '@sveltejs/kit/hooks';
import { setupServicesHandler } from '$lib/server/hooks/setupServicesHandler';
import { checkSessionHandler } from '$lib/server/hooks/checkSessionHandler';

export const handle = sequence(setupServicesHandler, checkSessionHandler);
