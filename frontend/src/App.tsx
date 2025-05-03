import React, { Suspense, lazy } from 'react';
import './index.css';

const LazySearchView = lazy(() => import('./components/SearchView'));

function App() {
  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={<div className="text-white text-center pt-20">Loading Explorer...</div>}>
        <LazySearchView />
      </Suspense>
    </div>
  );
}

export default App;
