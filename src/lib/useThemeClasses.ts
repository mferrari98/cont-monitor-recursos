import { useMemo } from 'react';

export interface ThemeClasses {
  bg: string;
  bgCard: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  textFaded: string;
  border: string;
  borderLight: string;
  borderHover: string;
  bgHover: string;
  iconBg: string;
  inputBg: string;
  accent: string;
  badge: string;
  resultBg: string;
}

/**
 * Hook centralizado para manejar clases de tema consistentes
 * Optimizado con useMemo para evitar recreación en cada render
 */
export const useThemeClasses = (theme: 'light' | 'dark'): ThemeClasses => {
  return useMemo(() => {
    const isDark = theme === 'dark';

    return {
      bg: isDark ? 'bg-[#141413]' : 'bg-[#FAF9F5]',
      bgCard: isDark ? 'bg-[#1F1E1D]' : 'bg-[#FFFFFF]',
      text: isDark ? 'text-[#E5E4E0]' : 'text-[#141413]',
      textMuted: isDark ? 'text-[#E5E4E0]/70' : 'text-[#666666]',
      textSubtle: isDark ? 'text-[#60a5fa]' : 'text-[#3b82f6]',
      textFaded: isDark ? 'text-[#E5E4E0]/50' : 'text-[#9ca3af]/50',
      border: isDark ? 'border-[#1F1E1D]' : 'border-[#E2E8F0]',
      borderLight: isDark ? 'border-[#1F1E1D]' : 'border-[#E2E8F0]',
      borderHover: isDark ? 'hover:border-[#2A2A28]' : 'hover:border-[#CBD5E1]',
      bgHover: isDark ? 'hover:bg-[#1F1E1D]' : 'hover:bg-[#F1F5F9]',
      iconBg: isDark ? 'bg-[#141413]' : 'bg-[#F8FAFC]',
      inputBg: isDark ? 'bg-[#1F1E1D]' : 'bg-[#FFFFFF]',
      accent: 'bg-[#3b82f6]',
      badge: isDark ? 'bg-[#3A3A38] text-[#E5E4E0]' : 'bg-[#E8E8E8] text-[#141413]',
      resultBg: isDark ? 'bg-[#2A2A28]' : 'bg-[#F0F0F0]'
    };
  }, [theme]);
};

/**
 * Versión simplificada para componentes que solo necesitan clases básicas
 */
export const useBasicThemeClasses = (theme: 'light' | 'dark') => {
  return useMemo(() => {
    const isDark = theme === 'dark';
    return {
      bg: isDark ? 'bg-[#141413]' : 'bg-[#FAF9F5]',
      bgCard: isDark ? 'bg-[#1F1E1D]' : 'bg-[#FFFFFF]',
      text: isDark ? 'text-[#E5E4E0]' : 'text-[#141413]',
      border: isDark ? 'border-[#1F1E1D]' : 'border-[#E2E8F0]',
    };
  }, [theme]);
};
