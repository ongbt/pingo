import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Route-level code splitting: each page is its own chunk, loaded on demand
const HomePage    = lazy(() => import('./pages/HomePage'));
const CreatePage  = lazy(() => import('./pages/CreatePage'));
const JoinPage    = lazy(() => import('./pages/JoinPage'));
const LobbyPage   = lazy(() => import('./pages/LobbyPage'));
const GamePage    = lazy(() => import('./pages/GamePage'));
const SheetsPage  = lazy(() => import('./pages/SheetsPage'));
const SignInPage  = lazy(() => import('./pages/SignInPage'));
const SignUpPage  = lazy(() => import('./pages/SignUpPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

function PageSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageSpinner />}>
          <Routes>
            <Route path="/"         element={<HomePage />} />
            <Route path="/create"   element={<CreatePage />} />
            <Route path="/join"     element={<JoinPage />} />
            <Route path="/lobby/:id" element={<LobbyPage />} />
            <Route path="/game/:id" element={<GamePage />} />
            <Route path="/sheets"   element={<SheetsPage />} />
            <Route path="/signin"   element={<SignInPage />} />
            <Route path="/signup"   element={<SignUpPage />} />
            <Route path="/profile"  element={<ProfilePage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
