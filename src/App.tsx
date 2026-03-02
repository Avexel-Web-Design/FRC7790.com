import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import Layout from './components/shared/Layout';
import DashboardLayout from './components/shared/DashboardLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ErrorBoundary from './components/shared/ErrorBoundary';
import Home from './components/pages/Home';
import Robots from './components/pages/Robots';
import Sponsors from './components/pages/Sponsors';
import Schedule from './components/pages/Schedule';
import Scouting from './components/pages/Scouting';
// import FTC from './components/pages/FTC'; // FTC page disabled
import BecomeASponsor from './components/pages/BecomeASponsor';
import Event from './components/pages/Event';
import Team from './components/pages/Team';
import MatchPage from './components/pages/Match';
import District from './components/pages/District';
import Regional from './components/pages/Regional';
import SearchResults from './components/pages/SearchResults';
import Atlas from './components/pages/Atlas';
import Login from './components/pages/auth/Login';
import CreateAccount from './components/pages/auth/CreateAccount';
import Settings from './components/pages/Settings';
import Dashboard from './components/pages/scouting/Dashboard';
import ScoutingMatch from './components/pages/scouting/Match';
import Pit from './components/pages/scouting/Pit';
import Analytics from './components/pages/scouting/Analytics';
import Alliances from './components/pages/scouting/Alliances';
import Simulations from './components/pages/scouting/Simulations';
import Strategy from './components/pages/scouting/Strategy';
import Share from './components/pages/scouting/Share';
import Archive from './components/pages/scouting/Archive';
import Profile from './components/pages/Profile';
import AdminUsers from './components/pages/admin/AdminUsers';
import AdminPublicUsers from './components/pages/admin/AdminPublicUsers';
import ProtectedRoute from './components/auth/ProtectedRoute';
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
const Calendar = lazy(() => import('./components/pages/calendar/Calendar'));
const Tasks = lazy(() => import('./components/pages/tasks/Tasks'));
const Channels = lazy(() => import('./components/pages/Channels'));
const Profile = lazy(() => import('./components/pages/Profile'));
const AdminUsers = lazy(() => import('./components/pages/admin/AdminUsers'));
const AdminPublicUsers = lazy(() => import('./components/pages/admin/AdminPublicUsers'));
const DirectMessages = lazy(() => import('./components/pages/DirectMessages'));
const PrivacyPolicy = lazy(() => import('./components/pages/PrivacyPolicy'));

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
              <Route path="/dashboard" element={<Channels />} />
              <Route path="/messages" element={<DirectMessages />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/tasks" element={<Tasks />} />
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
