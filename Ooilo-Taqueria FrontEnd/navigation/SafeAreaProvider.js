// providers/SafeAreaProvider.js - CONFIGURACIÓN GLOBAL DE SAFE AREA
import React from 'react';
import { View, Platform, StatusBar } from 'react-native';

// ✅ IMPORTACIÓN SEGURA CON FALLBACK
let SafeAreaProvider, SafeAreaView, useSafeAreaInsets;
let SafeAreaContext;

try {
  SafeAreaContext = require('react-native-safe-area-context');
  SafeAreaProvider = SafeAreaContext.SafeAreaProvider;
  SafeAreaView = SafeAreaContext.SafeAreaView;
  useSafeAreaInsets = SafeAreaContext.useSafeAreaInsets;
  console.log('✅ SafeAreaContext cargado correctamente');
} catch (error) {
  console.log('⚠️ SafeAreaContext no disponible, usando componentes fallback');
  
  // Fallback components
  SafeAreaProvider = ({ children }) => <View style={{ flex: 1 }}>{children}</View>;
  SafeAreaView = View;
  useSafeAreaInsets = () => ({ 
    top: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24, 
    bottom: Platform.OS === 'ios' ? 34 : 0, 
    left: 0, 
    right: 0 
  });
}

// ✅ CONFIGURACIÓN UNIVERSAL DE SAFE AREA
export class SafeAreaConfig {
  // Detección del tipo de dispositivo
  static getDeviceType() {
    if (Platform.OS === 'ios') {
      return Platform.isPad ? 'tablet' : 'phone';
    }
    return 'android';
  }

  // Altura de la barra de estado
  static getStatusBarHeight() {
    if (Platform.OS === 'ios') {
      // iOS maneja esto automáticamente
      return 0;
    }
    return StatusBar.currentHeight || 24;
  }

  // Configuración del header
  static getHeaderConfig() {
    const deviceType = this.getDeviceType();
    
    return {
      headerStyle: {
        backgroundColor: '#fff',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
      },
      headerTitleStyle: {
        fontSize: deviceType === 'tablet' ? 20 : 18,
        fontWeight: 'bold',
        color: '#333',
      },
      headerTintColor: '#333',
    };
  }

  // Configuración del Tab Bar
  static getTabBarConfig() {
    const isSmallDevice = Platform.OS === 'android' && Platform.Version < 29;
    
    return {
      style: {
        paddingBottom: Platform.select({
          ios: isSmallDevice ? 20 : 5,
          android: isSmallDevice ? 20 : 5,
        }),
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
      }
    };
  }

  // Configuración del StatusBar
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

// ✅ HOOK PERSONALIZADO PARA USAR SAFE AREA
export const useSafeAreaConfig = () => {
  let insets = { top: 0, bottom: 0, left: 0, right: 0 };
  
  try {
    if (useSafeAreaInsets) {
      insets = useSafeAreaInsets();
    }
  } catch (error) {
    console.log('⚠️ Error usando useSafeAreaInsets, usando valores por defecto');
    insets = {
      top: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24,
      bottom: Platform.OS === 'ios' ? 34 : 0,
      left: 0,
      right: 0,
    };
  }
  
  return {
    // Insets nativos del dispositivo
    ...insets,
    
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
    
    // Funciones helper
    getTopPadding: (extra = 10) => {
      if (Platform.OS === 'android') {
        return StatusBar.currentHeight ? StatusBar.currentHeight + extra : 35;
      }
      return insets.top > 0 ? insets.top + extra : 50;
    },
    
    getBottomPadding: (extra = 20) => {
      return Math.max(insets.bottom || 0, extra);
    },
  };
};

// ✅ COMPONENTE WRAPPER UNIVERSAL
export const UniversalSafeAreaProvider = ({ children }) => {
  if (SafeAreaContext) {
    return (
      <SafeAreaProvider>
        {children}
      </SafeAreaProvider>
    );
  }
  
  // Fallback para cuando SafeAreaContext no está disponible
  return (
    <View style={{ flex: 1 }}>
      <StatusBar {...SafeAreaConfig.getStatusBarConfig()} />
      {children}
    </View>
  );
};

// ✅ COMPONENTE SAFE AREA VIEW UNIVERSAL
export const UniversalSafeAreaView = ({ children, style, ...props }) => {
  const safeAreaConfig = useSafeAreaConfig();
  
  if (SafeAreaContext) {
    return (
      <SafeAreaView style={[safeAreaConfig.containerStyle, style]} {...props}>
        {children}
      </SafeAreaView>
    );
  }
  
  // Fallback
  return (
    <View style={[
      safeAreaConfig.containerStyle, 
      style
    ]} {...props}>
      {children}
    </View>
  );
};

// ✅ EXPORTS (SafeAreaConfig ya está exportado como clase)
export {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets
};