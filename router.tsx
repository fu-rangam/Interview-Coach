import { createBrowserRouter } from 'react-router-dom';
import Home from './pages/Home';
import RoleSelection from './pages/RoleSelection';
import Interview from './pages/Interview';
import Review from './pages/Review';
import Summary from './pages/Summary';
import JobDescriptionInput from './pages/JobDescriptionInput';
import Dashboard from './pages/Dashboard';

export const router = createBrowserRouter([
    { path: '/', element: <Home /> },
    { path: '/dashboard', element: <Dashboard /> },
    { path: '/select-role', element: <RoleSelection /> },
    { path: '/job-description', element: <JobDescriptionInput /> },
    { path: '/interview', element: <Interview /> },
    { path: '/review', element: <Review /> },
    { path: '/summary', element: <Summary /> },
]);
