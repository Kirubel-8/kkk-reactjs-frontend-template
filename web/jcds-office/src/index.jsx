import React from 'react';
import ReactDOM from 'react-dom/client';
import "./index.css"
// scroll bar
import 'simplebar-react/dist/simplebar.min.css';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

// google-fonts
import '@fontsource/montserrat/300.css';
import '@fontsource/montserrat/400.css';
import '@fontsource/montserrat/500.css';
import '@fontsource/montserrat/600.css';
import '@fontsource/montserrat/700.css';

// project import
import App from './App';
import reportWebVitals from './reportWebVitals';
import './i18';

const root = ReactDOM.createRoot(document.getElementById('root'));

// ==============================|| MAIN - REACT DOM RENDER ||============================== //

root.render(<App />);


reportWebVitals();
