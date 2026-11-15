import '@fontsource/ibm-plex-sans-arabic/400.css';
import '@fontsource/ibm-plex-sans-arabic/500.css';
import '@fontsource/ibm-plex-sans-arabic/600.css';
import '@/theme/theme.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { bootstrap } from '@/app/bootstrap';
import { App } from './App';

void bootstrap().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
