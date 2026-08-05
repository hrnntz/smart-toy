import { useColorScheme } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../theme/theme';

export const useTheme = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return {
    isDark,
    colors: isDark ? colors.dark : colors.light,
    typography,
    spacing,
    borderRadius,
    shadows: isDark ? shadows.dark : shadows.light,
  };
};
