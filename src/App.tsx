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
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
