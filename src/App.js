import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PersonTask from './pages/PersonTask';
import TaskTracking from './pages/TaskTracking';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PersonTask />} />
        <Route path="/takip" element={<TaskTracking />} />
      </Routes>
    </Router>
  );
}

export default App;