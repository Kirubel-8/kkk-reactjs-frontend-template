// src/components/RedirectRoute.js
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const RedirectRoute = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (token) {
      navigate('/'); 
    } else {
      navigate('/login'); 
    }
  }, [navigate]);

  return null;
};

export default RedirectRoute;


import { createBrowserRouter } from 'react-router-dom';

// Project import
// import MainRoutes from './MainRoutes';
// import LoginRoutes from './LoginRoutes';

// const isAuthenticated = () => {
//   return !!localStorage.getItem('userToken'); 
// };
// const routes = isAuthenticated() ? [MainRoutes] : [LoginRoutes]; 
// console.log(routes);
// const router = createBrowserRouter(routes, {
//   basename: import.meta.env.VITE_APP_BASE_NAME,
// });

// export default router;
