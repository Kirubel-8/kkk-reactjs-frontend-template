// material-ui
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import logo from './cci_logo.png';

// ==============================|| AUTH BLUR BACK SVG ||============================== //

export default function AuthBackground() {
  const theme = useTheme();
  return (
    <Box
  sx={{
    position: 'absolute', 
    filter: 'blur(6px)',   
    zIndex: -1,           
    bottom: 0,           
    left: 0,               
    width: '100%',         
    height: 'calc(100vh - 175px)', 
  }}
>
  
</Box>

  );
}
