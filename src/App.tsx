import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import Layout from './components/shared/Layout';
import DashboardLayout from './components/shared/DashboardLayout';
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
import PrivacyPolicy from './components/pages/PrivacyPolicy';

function App() {
  return (
    <NotificationProvider>
      <Router>
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
            {/* <Route path="/ftc" element={<FTC />} /> */}{/* FTC page disabled */}
            <Route path="/become-a-sponsor" element={<BecomeASponsor />} />
            <Route path="/event" element={<Event />} />
            <Route path="/team" element={<Team />} />
            <Route path="/match" element={<MatchPage />} />
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
        </Routes>
  {/* API debug badge removed for production */}
      </Router>
    </NotificationProvider>
  );
}

export default App;
