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

import { Portal } from './pages/new/Portal';
import { DashboardLayout } from './layouts/DashboardLayout';
import { DashboardHome } from './pages/new/DashboardHome';
import { InterviewSetup } from './pages/new/InterviewSetup';
import { InterviewSession } from './pages/new/InterviewSession';
import { InterviewReview } from './pages/new/InterviewReview';
import { UserDataRights } from './features/UserDataRights';

export const router = createBrowserRouter([
    { path: '/', element: <Home /> },
    { path: '/auth', element: <Auth /> },

    // NEW UI: Parallel Routes
    { path: '/portal', element: <Portal /> },
    {
        path: '/glass',
        element: <DashboardLayout />,
        children: [
            { path: 'dashboard', element: <DashboardHome /> },
            { path: 'interview', element: <InterviewSetup /> },
            { path: 'interview/session', element: <InterviewSession /> },
            { path: 'review', element: <InterviewReview /> },
            { path: 'settings', element: <div className="p-8"><UserDataRights /></div> }
        ]
    },

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
