// This file contains declarations for modules without their own type definitions

// Customize global window object
interface Window {
  // Add any global window properties here if needed
}

// Node process environment
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    REACT_APP_PUBLIC_POSTHOG_KEY?: string;
    REACT_APP_PUBLIC_POSTHOG_HOST?: string;
    REACT_APP_API_URL?: string;
    [key: string]: string | undefined;
  }
}

declare const process: {
  env: NodeJS.ProcessEnv;
};

// d3 libraries
declare module 'd3' {
  export * from 'd3-array';
  export * from 'd3-axis';
  export * from 'd3-brush';
  export * from 'd3-chord';
  export * from 'd3-contour';
  export * from 'd3-delaunay';
  export * from 'd3-dsv';
  export * from 'd3-fetch';
  export * from 'd3-force';
  export * from 'd3-format';
  export * from 'd3-geo';
  export * from 'd3-hierarchy';
  export * from 'd3-path';
  export * from 'd3-polygon';
  export * from 'd3-quadtree';
  export * from 'd3-random';
  export * from 'd3-scale';
  export * from 'd3-scale-chromatic';
  export * from 'd3-shape';
  export * from 'd3-time';
  export * from 'd3-time-format';
}

declare module 'd3-array' {}
declare module 'd3-axis' {}
declare module 'd3-brush' {}
declare module 'd3-chord' {}
declare module 'd3-contour' {}
declare module 'd3-delaunay' {}
declare module 'd3-dsv' {}
declare module 'd3-fetch' {}
declare module 'd3-force' {}
declare module 'd3-format' {}
declare module 'd3-geo' {}
declare module 'd3-hierarchy' {}
declare module 'd3-path' {}
declare module 'd3-polygon' {}
declare module 'd3-quadtree' {}
declare module 'd3-random' {}
declare module 'd3-scale' {}
declare module 'd3-scale-chromatic' {}
declare module 'd3-shape' {}
declare module 'd3-time' {}
declare module 'd3-time-format' {}

// Other libraries
declare module 'bonjour' {}
declare module 'debug' {}
declare module 'eslint' {}
declare module 'geojson' {}
declare module 'graceful-fs' {}
declare module 'hast' {}
declare module 'html-minifier-terser' {}
declare module 'http-proxy' {}
declare module 'istanbul-lib-coverage' {}
declare module 'istanbul-lib-report' {}
declare module 'istanbul-reports' {}
declare module 'mdast' {}
declare module 'ms' {}
declare module 'node-forge' {}
declare module 'prettier' {}
declare module 'semver' {}
declare module 'trusted-types' {}
declare module 'unist' {}
declare module 'ws' {}
declare module 'yargs' {}
declare module 'yargs-parser' {}
