import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';

import { SessionProvider } from './context/SessionContext';
import { AuthProvider } from './context/AuthContext';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <SessionProvider>
        <RouterProvider router={router} />
      </SessionProvider>
    </AuthProvider>
  );
};

export default App;