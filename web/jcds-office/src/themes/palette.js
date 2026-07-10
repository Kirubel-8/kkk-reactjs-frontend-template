// material-ui
import { createTheme } from '@mui/material/styles';

// third-party
import { presetPalettes } from '@ant-design/colors';

// project import
import ThemeOption from './theme';

// ==============================|| DEFAULT THEME - PALETTE ||============================== //

export default function Palette(mode, presetColor) {
  const colors = presetPalettes;

  let greyPrimary = [
    '#ffffff',
    '#fafafa',
    '#f5f5f5',
    '#f0f0f0',
    '#d9d9d9',
    '#bfbfbf',
    '#8c8c8c',
    '#595959',
    '#262626',
    '#141414',
    '#000000'
  ];
  let greyAscent = ['#fafafa', '#bfbfbf', '#434343', '#1f1f1f'];
  let greyConstant = ['#f7f7ff', '#e6ebf1'];

  colors.grey = [...greyPrimary, ...greyAscent, ...greyConstant];

  const paletteColor = ThemeOption(colors, presetColor, mode);

  paletteColor.primary = {
    ...paletteColor.primary,
    lighter: '#cde7f6', // 100 - lightest
    100: '#cde7f6',
    200: '#97d2f2', // 200
    light: '#327492', // 550 - hover variant
    400: '#3f8caf', // 450
    main: '#215167', // 725 - primary brand color
    dark: '#275c75', // 625
    700: '#143240', // 800
    darker: '#143240', // 800
    900: '#0c1e27', // 900 - darkest
    contrastText: '#ffffff'
  };

  // Status colors for complaint/case management
  const statusColors = {
    // Button colors
    buttons: {
      pending: '#F6C979',
      rejected: '#F45549',
      accept: '#37A637DB',
      return: '#D3BE6C',
      underInvestigation: '#FFE89A',
      underReview: '#8CB0FF',
      decided: '#2E5B6D',
      neutral: '#6B7A8F'
    },
    // Status display colors
    statuses: {
      pending: '#F7B84B',
      rejected: '#E85A5A',
      accept: '#49C178',
      return: '#B792E8',
      underInvestigation: '#FFD666',
      underReview: '#4C8BFF',
      decided: '#2C5565'
    }
  };

  return createTheme({
    palette: {
      mode,
      common: {
        black: '#000',
        white: '#fff'
      },
      ...paletteColor,
      text: {
        primary: paletteColor.grey[700],
        secondary: paletteColor.grey[500],
        disabled: paletteColor.grey[400]
      },
      action: {
        disabled: paletteColor.grey[300]
      },
      divider: paletteColor.grey[200],
      background: {
        paper: paletteColor.grey[0],
        default: paletteColor.grey.A50
      },
      // Add status colors to palette
      status: statusColors.statuses,
      statusButtons: statusColors.buttons
    }
  });
}
