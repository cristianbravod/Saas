// navigation/AppNavigator.js - VERSIÓN CORREGIDA CON NUEVA ARQUITECTURA
import React from 'react';
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Platform } from "react-native";

// ✅ IMPORTACIONES SEGURAS DE SAFE AREA
let useSafeAreaInsets;
try {
  const SafeAreaContext = require('react-native-safe-area-context');
  useSafeAreaInsets = SafeAreaContext.useSafeAreaInsets;
} catch (error) {
  console.log('⚠️ SafeAreaContext no disponible, usando fallback');
  useSafeAreaInsets = () => ({ top: 0, bottom: 0, left: 0, right: 0 });
}

// ✅ IMPORTACIONES DE COMPONENTES
import Pedidos from "../components/Pedidos";
import Carta from "../components/Carta";
import PlatoEspecial from "../components/PlatoEspecial";
import Informes from "../components/Informes";
import GeneradorQR from "../components/GeneradorQR";

const Tab = createBottomTabNavigator();

export default function AppNavigator({
  menu,
  setMenu,
  pedidos,
  setPedidos,
  platosEspeciales,
  setPlatosEspeciales,
  ventas,
  setVentas,
  nuevoProducto,
  setNuevoProducto,
  modoEdicion,
  setModoEdicion,
  categorias,
  setCategorias
}) {
  // ✅ USO SEGURO DE SAFE AREA
  let insets = { top: 0, bottom: 0, left: 0, right: 0 };
  try {
    if (useSafeAreaInsets) {
      insets = useSafeAreaInsets();
    }
  } catch (error) {
    console.log('⚠️ Error usando useSafeAreaInsets en Navigator');
  }

  // ✅ CONFIGURACIÓN DINÁMICA DE TAB BAR
  const getTabBarStyle = () => {
    const isSmallDevice = Platform.OS === 'android' && Platform.Version < 29;
    
    return {
      backgroundColor: '#fff',
      borderTopColor: '#e1e8ed',
      borderTopWidth: 1,
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      height: Platform.select({
        ios: isSmallDevice ? 70 : 80,
        android: isSmallDevice ? 55 : 60,
      }),
      paddingBottom: Platform.select({
        ios: Math.max(insets.bottom, 20),
        android: 5,
      }),
      paddingTop: 5,
    };
  };

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => {
            const icons = {
              Pedidos: focused ? 'restaurant' : 'restaurant-outline',
              Menu: focused ? 'book' : 'book-outline',
              Especiales: focused ? 'star' : 'star-outline',
              Informes: focused ? 'bar-chart' : 'bar-chart-outline',
              QR: focused ? 'qr-code' : 'qr-code-outline',
            };
            return <Ionicons name={icons[route.name]} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#e74c3c',
          tabBarInactiveTintColor: '#95a5a6',
          tabBarStyle: getTabBarStyle(),
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
          },
          // ✅ CONFIGURACIÓN DE SAFE AREA PARA CADA TAB
          tabBarHideOnKeyboard: Platform.OS === 'android',
        })}
        initialRouteName="Pedidos"
      >
        <Tab.Screen 
          name="Pedidos"
          options={{
            title: 'Pedidos',
            tabBarBadge: pedidos?.length > 0 ? pedidos.length : undefined,
          }}
        >
          {(props) => (
            <Pedidos
              {...props}
              menu={menu}
              pedidos={pedidos}
              setPedidos={setPedidos}
              platosEspeciales={platosEspeciales}
              ventas={ventas}
              setVentas={setVentas}
            />
          )}
        </Tab.Screen>

        <Tab.Screen 
          name="Menu"
          options={{
            title: 'Menú',
            tabBarBadge: menu?.length > 0 ? menu.length : undefined,
          }}
        >
          {(props) => (
            <Carta
              {...props}
              menu={menu}
              setMenu={setMenu}
              nuevoProducto={nuevoProducto}
              setNuevoProducto={setNuevoProducto}
              modoEdicion={modoEdicion}
              setModoEdicion={setModoEdicion}
              categorias={categorias}
              setCategorias={setCategorias}
            />
          )}
        </Tab.Screen>

        <Tab.Screen 
          name="Especiales"
          options={{
            title: 'Especiales',
            tabBarBadge: platosEspeciales?.length > 0 ? platosEspeciales.length : undefined,
          }}
        >
          {(props) => (
            <PlatoEspecial
              {...props}
              platosEspeciales={platosEspeciales}
              setPlatosEspeciales={setPlatosEspeciales}
            />
          )}
        </Tab.Screen>

        <Tab.Screen 
          name="Informes"
          options={{
            title: 'Informes',
          }}
        >
          {(props) => <Informes {...props} ventas={ventas} />}
        </Tab.Screen>

        <Tab.Screen 
          name="QR" 
          component={GeneradorQR}
          options={{
            title: 'Código QR',
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}