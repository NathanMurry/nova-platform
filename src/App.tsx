
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import ChatBot from './pages/entrepreneur/ChatBot';
import LastenheftView from './pages/entrepreneur/LastenheftView';
import ProjectList from './pages/developer/ProjectList';
import Dashboard from './pages/admin/Dashboard';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/entrepreneur" element={<ChatBot />} />
                <Route path="/lastenheft/:id" element={<LastenheftView />} />
                <Route path="/developer" element={<ProjectList />} />
                <Route path="/admin" element={<Dashboard />} />
            </Routes>
        </Router>
    );
}

export default App;
