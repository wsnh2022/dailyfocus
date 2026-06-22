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
import AppsScreen from './components/apps/AppsScreen';
import PomodoroApp from './components/apps/PomodoroApp';
import EnglishApp from './components/apps/EnglishApp';
import PythonLvl1Screen from './components/apps/python/PythonLvl1Screen';
import PythonLvl1Reader from './components/apps/python/PythonLvl1Reader';

prewarmSpeech();
navigator.storage?.persist();

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 max-w-md mx-auto relative pb-20 overflow-x-hidden transition-colors">
          <Routes>
            <Route path="/"           element={<HomeScreen />} />
            <Route path="/editor"     element={<EditorScreen />} />
            <Route path="/editor/:id" element={<EditorScreen />} />
            <Route path="/apps"           element={<AppsScreen />} />
            <Route path="/apps/pomodoro"  element={<PomodoroApp />} />
            <Route path="/apps/english"   element={<EnglishApp />} />
            <Route path="/apps/python-lvl-1" element={<PythonLvl1Screen />} />
            <Route path="/apps/python-lvl-1/:sectionId" element={<PythonLvl1Reader />} />
            <Route path="/history"        element={<HistoryScreen />} />
            <Route path="/settings"       element={<SettingsScreen />} />
            <Route path="*"               element={<Navigate to="/" replace />} />
          </Routes>
          <BottomNav />
          <Toast />
        </div>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
