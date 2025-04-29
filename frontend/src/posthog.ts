import posthog from 'posthog-js';

posthog.init(
    process.env.REACT_APP_PUBLIC_POSTHOG_KEY || '',
    {
        api_host: process.env.REACT_APP_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
        autocapture: true
    }
);

export default posthog;
