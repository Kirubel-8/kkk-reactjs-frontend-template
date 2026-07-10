import { createBrowserRouter } from 'react-router-dom';
import Routes from './Routes';

const router = createBrowserRouter(Routes, { basename: import.meta.env.VITE_APP_BASE_NAME });

export default router;
