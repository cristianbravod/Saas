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
  userRole, // 'chef' or 'mesero'
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

  const ChefNavigator = () => (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            Pedidos: focused ? 'restaurant' : 'restaurant-outline',
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
        tabBarHideOnKeyboard: Platform.OS === 'android',
      })}
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
    </Tab.Navigator>
  );

  const WaiterNavigator = () => (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            Pedidos: focused ? 'restaurant' : 'restaurant-outline',
            Menu: focused ? 'book' : 'book-outline',
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
        tabBarHideOnKeyboard: Platform.OS === 'android',
      })}
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
    </Tab.Navigator>
  );

  return (
    <NavigationContainer>
      {userRole === 'chef' ? <ChefNavigator /> : <WaiterNavigator />}
    </NavigationContainer>
  );
}