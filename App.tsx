import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';

import { SessionProvider } from './context/SessionContext';

const App: React.FC = () => {
  return (
    <SessionProvider>
      <RouterProvider router={router} />
    </SessionProvider>
  );
};

export default App;