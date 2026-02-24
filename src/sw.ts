/// <reference lib="webworker" />
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';

declare let self: ServiceWorkerGlobalScope;

cleanupOutdatedCaches();

precacheAndRoute(self.__WB_MANIFEST);

const basePath = self.location.pathname.includes('/academpazam-app/') ? '/academpazam-app/' : '/';

const handler = createHandlerBoundToURL(`${basePath}index.html`);
const navigationRoute = new NavigationRoute(handler, {
    // Match any navigation to the subpath
    allowlist: [new RegExp(`^${basePath}`)],
    // Deny files with extensions (assets) to let them fall through to precache/network
    denylist: [new RegExp(`^${basePath}.*\\.[a-zA-Z0-9]+$`)],
});
registerRoute(navigationRoute);

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
