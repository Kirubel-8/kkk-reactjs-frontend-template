import { createBrowserRouter } from 'react-router-dom';
import Routes from './Routes';

const router = createBrowserRouter(Routes, { basename: import.meta.env.BASE_URL });

export default router;
