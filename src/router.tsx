import { createBrowserRouter } from 'react-router-dom';
import Home from './pages/Home';
import RoleSelection from './pages/RoleSelection';
import Interview from './pages/Interview';
import Review from './pages/Review';
import Summary from './pages/Summary';
import JobDescriptionInput from './pages/JobDescriptionInput';
import Dashboard from './pages/Dashboard';
import DebugPrompt from './pages/DebugPrompt';
import SessionDetail from './pages/SessionDetail';

import Auth from './pages/Auth';
import ProtectedRoute from './components/ProtectedRoute';

export const router = createBrowserRouter([
    { path: '/', element: <Home /> },
    { path: '/auth', element: <Auth /> },

    // Public / Guest Routes (Teaser Access)
    { path: '/select-role', element: <RoleSelection /> },
    { path: '/job-description', element: <JobDescriptionInput /> },
    { path: '/interview', element: <Interview /> },
    { path: '/review', element: <Review /> },
    { path: '/summary', element: <Summary /> },

    // Protected Member Routes
    {
        element: <ProtectedRoute />,
        children: [
            { path: '/dashboard', element: <Dashboard /> },
            { path: '/debug', element: <DebugPrompt /> },
            { path: '/session/:id', element: <SessionDetail /> },
        ]
    }
]);
