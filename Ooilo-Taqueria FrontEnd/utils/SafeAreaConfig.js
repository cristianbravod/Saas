// utils/SafeAreaConfig.js - Configuración universal para SafeArea
import { Platform, StatusBar, Dimensions } from 'react-native';

export class SafeAreaConfig {
  static getStatusBarHeight() {
    if (Platform.OS === 'ios') {
      // En iOS, SafeAreaView maneja esto automáticamente
      return 0;
    } else {
      // En Android, necesitamos calcular la altura del StatusBar
      return StatusBar.currentHeight || 25;
    }
  }

  static getHeaderPadding() {
    return {
      paddingTop: Platform.select({
        ios: 10, // SafeAreaView ya maneja el notch
        android: this.getStatusBarHeight() + 10, // StatusBar + padding extra
      }),
      paddingBottom: 15,
      paddingHorizontal: 20,
    };
  }

  static getContainerStyle() {
    return {
      flex: 1,
      backgroundColor: '#f8f9fa',
      // En Android, empezar desde abajo del StatusBar
      paddingTop: Platform.OS === 'android' ? this.getStatusBarHeight() : 0,
    };
  }

  static getHeaderStyle() {
    return {
      backgroundColor: '#fff',
      ...this.getHeaderPadding(),
      borderBottomWidth: 1,
      borderBottomColor: '#e1e8ed',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 3,
      zIndex: 1000,
    };
  }

  static getTabBarStyle() {
    const { height } = Dimensions.get('window');
    const isSmallDevice = height < 700;
    
    return {
      paddingBottom: Platform.OS === 'ios' ? 20 : 5,
      height: Platform.select({
        ios: isSmallDevice ? 70 : 80,
        android: isSmallDevice ? 55 : 60,
      }),
      backgroundColor: '#fff',
      borderTopColor: '#e1e8ed',
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
    };
  }

  static getStatusBarConfig() {
    return {
      barStyle: Platform.select({
        ios: "dark-content",
        android: "dark-content",
      }),
      backgroundColor: Platform.OS === 'android' ? "#fff" : undefined,
      translucent: false,
    };
  }
}

// Hook personalizado para usar SafeArea
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const useSafeAreaConfig = () => {
  const insets = useSafeAreaInsets();
  
  return {
    // Insets nativos del dispositivo
    top: insets.top,
    bottom: insets.bottom,
    left: insets.left,
    right: insets.right,
    
    // Configuración calculada
    headerHeight: 60 + insets.top,
    statusBarHeight: SafeAreaConfig.getStatusBarHeight(),
    
    // Estilos preparados
    containerStyle: {
      flex: 1,
      paddingTop: insets.top,
      backgroundColor: '#f8f9fa',
    },
    
    headerStyle: {
      backgroundColor: '#fff',
      paddingTop: insets.top + 10,
      paddingBottom: 15,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: '#e1e8ed',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 3,
      zIndex: 1000,
    },
    
    // Para componentes internos que necesiten espacio seguro
    contentStyle: {
      flex: 1,
      backgroundColor: '#f8f9fa',
    },
  };
};