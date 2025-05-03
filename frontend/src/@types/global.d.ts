/// <reference types="vite/client" />
/// <reference types="node" />

// Explicitly declare the Node.js process global
declare var process: NodeJS.Process;

// Ensure NodeJS namespace is available
declare namespace NodeJS {
  interface Process {
    env: ProcessEnv;
  }
}

// This file provides global type declarations
