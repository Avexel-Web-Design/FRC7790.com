import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/shared/Layout';
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
      <Layout>
        <Routes>
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
          
          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/calendar" element={
            <ProtectedRoute>
              <Calendar />
            </ProtectedRoute>
          } />
          <Route path="/tasks" element={
            <ProtectedRoute>
              <Tasks />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          
          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute requireAdmin={true}>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute requireAdmin={true}>
              <AdminUsers />
            </ProtectedRoute>
          } />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
