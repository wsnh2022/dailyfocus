import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './db/schema';
import { prewarmSpeech } from './utils/sound';
import ErrorBoundary from './components/shared/ErrorBoundary';
import BottomNav from './components/shared/BottomNav';
import Toast from './components/shared/Toast';
import HomeScreen from './components/home/HomeScreen';
import EditorScreen from './components/editor/EditorScreen';
import HistoryScreen from './components/history/HistoryScreen';
import SettingsScreen from './components/settings/SettingsScreen';

prewarmSpeech();

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <div className="min-h-screen bg-slate-50 max-w-md mx-auto relative pb-20 overflow-x-hidden">
          <Routes>
            <Route path="/"           element={<HomeScreen />} />
            <Route path="/editor"     element={<EditorScreen />} />
            <Route path="/editor/:id" element={<EditorScreen />} />
            <Route path="/history"    element={<HistoryScreen />} />
            <Route path="/settings"   element={<SettingsScreen />} />
            <Route path="*"           element={<Navigate to="/" replace />} />
          </Routes>
          <BottomNav />
          <Toast />
        </div>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
