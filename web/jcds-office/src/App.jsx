import { RouterProvider } from 'react-router-dom';

// project import
import router from 'routes';
import ThemeCustomization from 'themes';
import { ContextProvider } from './routes/contextProvider';

import ScrollTop from 'components/ScrollTop';

// ==============================|| APP - THEME, ROUTER, LOCAL ||============================== //

export default function App() {
  return (
    <ThemeCustomization>
      <ScrollTop>
        <ContextProvider>
          <RouterProvider router={router} />
        </ContextProvider>
      </ScrollTop>
    </ThemeCustomization>
  );
}
