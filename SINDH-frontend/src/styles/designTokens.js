export const colors = {
  primary: {
    50: '#F0F2F9',
    100: '#DDE1F1',
    200: '#BCC5E3',
    300: '#9BA8D5',
    400: '#7A8BC7',
    500: '#3B4883', // Blue Estate (Main brand color)
    600: '#344075',
    700: '#2D3867',
    800: '#262F59',
    900: '#1F274B',
  },
  accent: {
    50: '#FFF1E9',
    100: '#FFE4D3',
    200: '#FFC8A7',
    300: '#FFAD7B',
    400: '#FF914F',
    500: '#FF7124', // Burning Orange (Main accent)
    600: '#E66620',
    700: '#CC5B1C',
    800: '#B35018',
    900: '#994514',
  },
  neutral: {
    0: '#FFFFFF',
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#202124', // Noble Black (Dark gray for text)
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#111827',
  },
  semantic: {
    success: '#2E7D32',
    warning: '#FFB300',
    error: '#C62828',
    info: '#3B4883',
  }
};

export const typography = {
  fontFamily: {
    sans: ['Inter', 'Noto Sans Devanagari', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'].join(','),
  },
  fontSize: {
    xs: '12px',
    sm: '13px',
    base: '14px',
    lg: '16px',
    xl: '18px',
    '2xl': '20px',
    '3xl': '24px',
    '4xl': '32px',
  },
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  }
};

export const spacing = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
};

export const borderRadius = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '24px',
  full: '9999px',
};

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  primary: '0 8px 16px -4px rgba(63, 81, 181, 0.2)',
  accent: '0 8px 16px -4px rgba(255, 152, 0, 0.2)',
};

export const animations = {
  transition: {
    fast: '150ms',
    base: '200ms',
    slow: '300ms',
    slower: '500ms',
  },
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  }
};
