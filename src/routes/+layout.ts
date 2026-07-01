// Disable SSR — this is a local-first PWA. IndexedDB and crypto don't
// exist on the server, and there's no SEO surface that benefits from
// pre-rendering the app shell.
export const ssr = false;
export const prerender = false;
export const trailingSlash = 'never';
