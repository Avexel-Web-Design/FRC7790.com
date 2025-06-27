import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import Layout from './components/shared/Layout';
import DashboardLayout from './components/shared/DashboardLayout';
import Home from './components/pages/Home';
import Robots from './components/pages/Robots';
import Sponsors from './components/pages/Sponsors';
import Schedule from './components/pages/Schedule';
import Scouting from './components/pages/Scouting';
import FTC from './components/pages/FTC';
import BecomeASponsor from './components/pages/BecomeASponsor';
import Event from './components/pages/Event';
import Team from './components/pages/Team';
import Match from './components/pages/Match';
import District from './components/pages/District';
import Regional from './components/pages/Regional';
import SearchResults from './components/pages/SearchResults';
import Login from './components/pages/auth/Login';
import Calendar from './components/pages/calendar/Calendar';
import Tasks from './components/pages/tasks/Tasks';
import Dashboard from './components/pages/Dashboard';
import Profile from './components/pages/Profile';
import AdminUsers from './components/pages/admin/AdminUsers';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route
          element={
            <Layout>
              <Outlet />
            </Layout>
          }
        >
          <Route path="/" element={<Home />} />
          <Route path="/robots" element={<Robots />} />
          <Route path="/sponsors" element={<Sponsors />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/scouting" element={<Scouting />} />
          <Route path="/ftc" element={<FTC />} />
          <Route path="/become-a-sponsor" element={<BecomeASponsor />} />
          <Route path="/event" element={<Event />} />
          <Route path="/team" element={<Team />} />
          <Route path="/match" element={<Match />} />
          <Route path="/district" element={<District />} />
          <Route path="/regional" element={<Regional />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/login" element={<Login />} />
        </Route>

        {/* Protected Routes */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Outlet />
              </DashboardLayout>
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
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
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
