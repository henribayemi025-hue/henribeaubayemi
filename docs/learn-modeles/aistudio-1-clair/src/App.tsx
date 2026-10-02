import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { CourseCatalog } from './components/courses/CourseCatalog';
import { LessonPlayer } from './components/courses/LessonPlayer';
import { TutorView } from './components/tutors/TutorView';
import { ProjectsHub } from './components/projects/ProjectsHub';
import { ProgressView } from './components/progress/ProgressView';
import { CommunityView } from './components/community/CommunityView';
import { ToolsView } from './components/tools/ToolsView';
import { ProfileView } from './components/profile/ProfileView';
import { AccessibilityModal } from './components/accessibility/AccessibilityModal';

const MainLayout: React.FC = () => {
  const { activeView, theme } = useApp();
  const [isAccessibilityOpen, setIsAccessibilityOpen] = useState(false);

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${
        theme === 'noir' ? 'bg-[#0B0F17] text-slate-100' : 'bg-slate-50/50 text-slate-900'
      }`}
    >
      <Header onOpenAccessibility={() => setIsAccessibilityOpen(true)} />
      <Navigation />

      <main className="mx-auto max-w-7xl px-3 sm:px-6 pt-6">
        {activeView === 'courses' && <CourseCatalog />}
        {activeView === 'lesson' && <LessonPlayer />}
        {activeView === 'tutors' && <TutorView />}
        {activeView === 'projects' && <ProjectsHub />}
        {activeView === 'tree' && <ProgressView />}
        {activeView === 'community' && <CommunityView />}
        {activeView === 'tools' && <ToolsView />}
        {activeView === 'profile' && <ProfileView />}
      </main>

      <AccessibilityModal
        isOpen={isAccessibilityOpen}
        onClose={() => setIsAccessibilityOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
