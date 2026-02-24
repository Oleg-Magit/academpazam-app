/// <reference lib="webworker" />
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';

declare let self: ServiceWorkerGlobalScope;

cleanupOutdatedCaches();

precacheAndRoute(self.__WB_MANIFEST);

const handler = createHandlerBoundToURL('/academpazam-app/index.html');
const navigationRoute = new NavigationRoute(handler, {
    // Match any navigation to the subpath
    allowlist: [new RegExp('^/academpazam-app/')],
    // Deny files with extensions (assets) to let them fall through to precache/network
    denylist: [/^\/academpazam-app\/.*\.[a-zA-Z0-9]+$/],
});
registerRoute(navigationRoute);

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
