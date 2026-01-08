import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Portal } from './pages/Portal';
import { AuthPage } from './pages/Auth';
import { DashboardLayout } from './layouts/DashboardLayout';
import { DashboardHome } from './pages/DashboardHome';
import { InterviewSetup } from './pages/InterviewSetup';
import { InterviewSession } from './pages/InterviewSession';
import { InterviewReview } from './pages/InterviewReview';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Portal />} />
        <Route path="/auth" element={<AuthPage />} />

        {/* Dashboard & App Area */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
        </Route>

        {/* Interview Flow (Wrapped in Layout) */}
        <Route path="/interview-prep" element={<DashboardLayout />}>
          <Route index element={<InterviewSetup />} />
          <Route path="review" element={<InterviewReview />} />
        </Route>

        {/* Standalone Session Route */}
        <Route path="/interview-prep/session" element={<InterviewSession />} />

        {/* Placeholder Routes */}
        <Route path="/settings" element={<DashboardLayout />}>
          <Route index element={<div className="text-white p-8">Settings Page</div>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
