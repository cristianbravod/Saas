// utils/theme.js - Tema Mexicano para toda la aplicación
export const MexicanTheme = {
  // Colores principales
  colors: {
    // Colores principales del chef mexicano
    primary: '#D2691E',         // Naranja chocolate (color principal)
    primaryDark: '#8B4513',     // Marrón silla de montar
    primaryLight: '#F4A460',    // Marrón arenoso claro
    
    // Colores de acento
    accent: '#CD853F',          // Oro peruano
    accentLight: '#DEB887',     // Marrón burla de madera
    accentDark: '#A0522D',      // Siena
    
    // Colores de fondo
    background: '#FFF8DC',      // Seda de maíz (fondo principal)
    backgroundLight: '#FFFAF0', // Blanco floral
    backgroundDark: '#2F2F2F',  // Gris muy oscuro
    
    // Colores de texto
    textPrimary: '#2F2F2F',     // Gris muy oscuro
    textSecondary: '#8B4513',   // Marrón silla de montar
    textAccent: '#D2691E',      // Naranja chocolate
    textLight: '#FFFFFF',       // Blanco
    
    // Colores de estado
    success: '#228B22',         // Verde bosque
    warning: '#FF8C00',         // Naranja oscuro
    danger: '#DC143C',          // Carmesí
    info: '#4682B4',           // Azul acero
    
    // Colores neutros
    white: '#FFFFFF',
    black: '#000000',
    gray: '#808080',
    lightGray: '#D3D3D3',
    darkGray: '#696969',
  },

  // Espaciado
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  // Tipografía
  typography: {
    // Tamaños de fuente
    fontSize: {
      xs: 10,
      sm: 12,
      md: 14,
      lg: 16,
      xl: 18,
      xxl: 20,
      title: 24,
      heading: 28,
      display: 32,
    },
    
    // Pesos de fuente
    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },
  },

  // Bordes y esquinas
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 50,
  },

  // Sombras
  shadows: {
    small: {
      shadowColor: '#D2691E',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: '#8B4513',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 5,
    },
    large: {
      shadowColor: '#2F2F2F',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 10,
    },
  },

  // Componentes específicos
  components: {
    // Botones
    button: {
      primary: {
        backgroundColor: '#D2691E',
        borderColor: '#CD853F',
        textColor: '#FFFFFF',
      },
      secondary: {
        backgroundColor: 'transparent',
        borderColor: '#D2691E',
        textColor: '#D2691E',
      },
      success: {
        backgroundColor: '#228B22',
        borderColor: '#32CD32',
        textColor: '#FFFFFF',
      },
      warning: {
        backgroundColor: '#F4A460',
        borderColor: '#DEB887',
        textColor: '#8B4513',
      },
    },

    // Inputs
    input: {
      backgroundColor: '#FFFAF0',
      borderColor: '#F4A460',
      textColor: '#2F2F2F',
      placeholderColor: '#999999',
      iconColor: '#D2691E',
    },

    // Cards
    card: {
      backgroundColor: '#FFFFFF',
      borderColor: '#F4A460',
      shadow: 'medium',
    },

    // Navigation
    navigation: {
      backgroundColor: '#FFFFFF',
      activeColor: '#D2691E',
      inactiveColor: '#808080',
      borderColor: '#F4A460',
    },
  },
};

// Estilos comunes reutilizables
export const CommonStyles = {
  // Contenedores
  container: {
    flex: 1,
    backgroundColor: MexicanTheme.colors.background,
  },
  
  safeContainer: {
    flex: 1,
    backgroundColor: MexicanTheme.colors.background,
    paddingHorizontal: MexicanTheme.spacing.md,
  },

  // Cards
  card: {
    backgroundColor: MexicanTheme.colors.white,
    borderRadius: MexicanTheme.borderRadius.lg,
    padding: MexicanTheme.spacing.md,
    borderWidth: 2,
    borderColor: MexicanTheme.colors.accentLight,
    ...MexicanTheme.shadows.medium,
  },

  // Botones
  primaryButton: {
    backgroundColor: MexicanTheme.colors.primary,
    borderRadius: MexicanTheme.borderRadius.md,
    paddingVertical: MexicanTheme.spacing.md,
    paddingHorizontal: MexicanTheme.spacing.lg,
    borderWidth: 2,
    borderColor: MexicanTheme.colors.accent,
    ...MexicanTheme.shadows.medium,
  },

  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: MexicanTheme.borderRadius.md,
    paddingVertical: MexicanTheme.spacing.md,
    paddingHorizontal: MexicanTheme.spacing.lg,
    borderWidth: 2,
    borderColor: MexicanTheme.colors.primary,
  },

  // Textos
  primaryButtonText: {
    color: MexicanTheme.colors.textLight,
    fontSize: MexicanTheme.typography.fontSize.lg,
    fontWeight: MexicanTheme.typography.fontWeight.bold,
    textAlign: 'center',
  },

  secondaryButtonText: {
    color: MexicanTheme.colors.primary,
    fontSize: MexicanTheme.typography.fontSize.md,
    fontWeight: MexicanTheme.typography.fontWeight.semibold,
    textAlign: 'center',
  },

  title: {
    fontSize: MexicanTheme.typography.fontSize.heading,
    fontWeight: MexicanTheme.typography.fontWeight.bold,
    color: MexicanTheme.colors.textPrimary,
    textAlign: 'center',
  },

  subtitle: {
    fontSize: MexicanTheme.typography.fontSize.lg,
    color: MexicanTheme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Inputs
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: MexicanTheme.colors.accentLight,
    borderRadius: MexicanTheme.borderRadius.md,
    paddingHorizontal: MexicanTheme.spacing.md,
    paddingVertical: MexicanTheme.spacing.sm,
    backgroundColor: MexicanTheme.colors.backgroundLight,
    marginBottom: MexicanTheme.spacing.md,
  },

  input: {
    flex: 1,
    marginLeft: MexicanTheme.spacing.sm,
    fontSize: MexicanTheme.typography.fontSize.lg,
    color: MexicanTheme.colors.textPrimary,
  },

  // Headers de secciones
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: MexicanTheme.spacing.md,
  },

  sectionTitle: {
    fontSize: MexicanTheme.typography.fontSize.xl,
    fontWeight: MexicanTheme.typography.fontWeight.semibold,
    color: MexicanTheme.colors.textPrimary,
  },

  // Badges/Contadores
  badge: {
    backgroundColor: MexicanTheme.colors.backgroundLight,
    color: MexicanTheme.colors.primary,
    fontWeight: MexicanTheme.typography.fontWeight.bold,
    fontSize: MexicanTheme.typography.fontSize.md,
    paddingHorizontal: MexicanTheme.spacing.sm,
    paddingVertical: MexicanTheme.spacing.xs,
    borderRadius: MexicanTheme.borderRadius.full,
    marginLeft: MexicanTheme.spacing.sm,
  },
};

// Utilidades para generar estilos dinámicos
export const ThemeUtils = {
  // Generar estilo de botón con estado
  getButtonStyle: (type = 'primary', disabled = false) => {
    const baseStyle = CommonStyles[`${type}Button`];
    return {
      ...baseStyle,
      opacity: disabled ? 0.6 : 1,
    };
  },

  // Generar estilo de texto con color dinámico
  getTextStyle: (color = 'textPrimary', size = 'md', weight = 'normal') => ({
    color: MexicanTheme.colors[color],
    fontSize: MexicanTheme.typography.fontSize[size],
    fontWeight: MexicanTheme.typography.fontWeight[weight],
  }),

  // Generar estilo de card con variantes
  getCardStyle: (variant = 'default') => {
    const variants = {
      default: CommonStyles.card,
      success: {
        ...CommonStyles.card,
        borderColor: MexicanTheme.colors.success,
        backgroundColor: '#F0FFF0', // Verde muy claro
      },
      warning: {
        ...CommonStyles.card,
        borderColor: MexicanTheme.colors.warning,
        backgroundColor: '#FFF8DC', // Crema
      },
      danger: {
        ...CommonStyles.card,
        borderColor: MexicanTheme.colors.danger,
        backgroundColor: '#FFF0F5', // Rosa muy claro
      },
    };
    return variants[variant] || variants.default;
  },
};

export default MexicanTheme;