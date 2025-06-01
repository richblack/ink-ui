import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

async function enableMocking() {
  // Start MSW only in development.
  // For other environments, it should be disabled,
  // and for testing, src/mocks/server.ts is used.
  if (process.env.NODE_ENV !== 'development') {
    return;
  }
  const { worker } = await import('./mocks/browser');
  // 'msw/browser' also exports a 'start' function with options.
  // See https://mswjs.io/docs/api/setup-worker/start
  return worker.start({
    onUnhandledRequest: 'bypass', // Bypass unhandled requests by default
  });
}

enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
});
