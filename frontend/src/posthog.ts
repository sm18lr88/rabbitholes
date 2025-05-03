import posthog from 'posthog-js';

const POSTHOG_KEY = import.meta.env.VITE_PUBLIC_POSTHOG_KEY || '';
const POSTHOG_HOST = import.meta.env.VITE_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

posthog.init(
    POSTHOG_KEY,
    {
        api_host: POSTHOG_HOST,
        autocapture: true
    }
);

export default posthog;
