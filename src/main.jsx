import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Apply persisted theme before first paint to avoid a flash
const _savedTheme = localStorage.getItem('df_theme') ?? 'light';
if (_savedTheme === 'dark') document.documentElement.classList.add('dark');
const _meta = document.querySelector('meta[name="theme-color"]');
if (_meta) _meta.setAttribute('content', _savedTheme === 'dark' ? '#020617' : '#1e293b');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
