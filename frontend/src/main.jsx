import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import ThemedToaster from './components/ThemedToaster.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <MotionConfig reducedMotion="user">
          <BrowserRouter>
            <AuthProvider>
              <App />
              <ThemedToaster />
            </AuthProvider>
          </BrowserRouter>
        </MotionConfig>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
