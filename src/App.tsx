import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import Layout from './components/shared/Layout';
import DashboardLayout from './components/shared/DashboardLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ErrorBoundary from './components/shared/ErrorBoundary';
import { NotificationProvider } from './contexts/NotificationContext';
import { SearchDataProvider } from './contexts/SearchDataContext';

// Lazy-loaded page components
const Home = lazy(() => import('./components/pages/Home'));
const Robots = lazy(() => import('./components/pages/Robots'));
const Sponsors = lazy(() => import('./components/pages/Sponsors'));
const Schedule = lazy(() => import('./components/pages/Schedule'));
const Scouting = lazy(() => import('./components/pages/Scouting'));
const BecomeASponsor = lazy(() => import('./components/pages/BecomeASponsor'));
const Event = lazy(() => import('./components/pages/Event'));
const Team = lazy(() => import('./components/pages/Team'));
const Match = lazy(() => import('./components/pages/Match'));
const District = lazy(() => import('./components/pages/District'));
const Regional = lazy(() => import('./components/pages/Regional'));
const SearchResults = lazy(() => import('./components/pages/SearchResults'));
const Atlas = lazy(() => import('./components/pages/Atlas'));
const Login = lazy(() => import('./components/pages/auth/Login'));
const CreateAccount = lazy(() => import('./components/pages/auth/CreateAccount'));
const Settings = lazy(() => import('./components/pages/Settings'));
const Profile = lazy(() => import('./components/pages/Profile'));
const AdminUsers = lazy(() => import('./components/pages/admin/AdminUsers'));
const AdminPublicUsers = lazy(() => import('./components/pages/admin/AdminPublicUsers'));
const PrivacyPolicy = lazy(() => import('./components/pages/PrivacyPolicy'));

// Scouting dashboard pages
const Dashboard = lazy(() => import('./components/pages/scouting/Dashboard'));
const ScoutingMatch = lazy(() => import('./components/pages/scouting/Match'));
const Pit = lazy(() => import('./components/pages/scouting/Pit'));
const Analytics = lazy(() => import('./components/pages/scouting/Analytics'));
const Alliances = lazy(() => import('./components/pages/scouting/Alliances'));
const Simulations = lazy(() => import('./components/pages/scouting/Simulations'));
const Strategy = lazy(() => import('./components/pages/scouting/Strategy'));
const Share = lazy(() => import('./components/pages/scouting/Share'));
const Archive = lazy(() => import('./components/pages/scouting/Archive'));

const PageLoader = () => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <div className="text-white text-lg">Loading...</div>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
    <NotificationProvider>
      <Router>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Routes with SearchDataProvider */}
            <Route
              element={
                <SearchDataProvider>
                  <Layout>
                    <Outlet />
                  </Layout>
                </SearchDataProvider>
              }
            >
              <Route path="/" element={<Home />} />
              <Route path="/robots" element={<Robots />} />
              <Route path="/sponsors" element={<Sponsors />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/scouting" element={<Scouting />} />
              <Route path="/become-a-sponsor" element={<BecomeASponsor />} />
              <Route path="/event" element={<Event />} />
              <Route path="/team" element={<Team />} />
              <Route path="/match" element={<Match />} />
              <Route path="/district" element={<District />} />
              <Route path="/regional" element={<Regional />} />
              <Route path="/atlas" element={<Atlas />} />
              <Route path="/search" element={<SearchResults />} />
              <Route path="/login" element={<Login />} />
              <Route path="/create-account" element={<CreateAccount />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/scouting/share/:token" element={<Share />} />
            </Route>

            {/* Member-only routes (block public) */}
            <Route
              element={
                <ProtectedRoute disallowPublic>
                  <DashboardLayout>
                    <Outlet />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/match" element={<ScoutingMatch />} />
              <Route path="/dashboard/pit" element={<Pit />} />
              <Route path="/profile" element={<Profile />} />
            </Route>

            {/* Admin Routes */}
            <Route
              element={
                <ProtectedRoute requireAdmin={true}>
                  <DashboardLayout>
                    <Outlet />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard/analytics" element={<Analytics />} />
              <Route path="/dashboard/alliances" element={<Alliances />} />
              <Route path="/dashboard/simulations" element={<Simulations />} />
              <Route path="/dashboard/strategy" element={<Strategy />} />
              <Route path="/dashboard/archive" element={<Archive />} />
              <Route path="/admin" element={<Dashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/public-users" element={<AdminPublicUsers />} />
            </Route>

            {/* 404 catch-all */}
            <Route path="*" element={
              <div className="min-h-screen bg-black flex items-center justify-center text-white">
                <div className="text-center">
                  <h1 className="text-4xl font-bold mb-4">404</h1>
                  <p className="text-gray-400 mb-6">Page not found</p>
                  <a href="/" className="text-baywatch-orange hover:underline">Go home</a>
                </div>
              </div>
            } />
          </Routes>
        </Suspense>
      </Router>
    </NotificationProvider>
    </ErrorBoundary>
  );
}

export default App;
