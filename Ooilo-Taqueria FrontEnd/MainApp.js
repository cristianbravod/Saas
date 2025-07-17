// MainApp.js - VERSIÓN CORREGIDA CON NUEVA ARQUITECTURA
import React, { useState, useEffect, useCallback } from "react";
import { View, Platform, StatusBar, Alert } from "react-native";

// ✅ IMPORTACIONES SEGURAS DE SAFE AREA
import { 
  UniversalSafeAreaProvider, 
  useSafeAreaConfig,
  SafeAreaConfig 
} from "./navigation/SafeAreaProvider";

import { useAuth } from "./contexts/AuthContext";
import ApiService from "./services/ApiService";

// ✅ COMPONENTES
import LoginScreen from "./screens/LoginScreen";
import LoadingScreen from "./components/LoadingScreen";
import AppHeader from "./components/AppHeader";
import AppNavigator from "./navigation/AppNavigator";
import EchoService from "./services/EchoService";

// ✅ COMPONENTE INTERNO CON SAFE AREA
function MainAppContent() {
  const { user, isLoggedIn, loading, initializing, userRole } = useAuth();
  const safeAreaConfig = useSafeAreaConfig();
  
  // ✅ ESTADOS DE LA APLICACIÓN
  const [menu, setMenu] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [platosEspeciales, setPlatosEspeciales] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [nuevoProducto, setNuevoProducto] = useState({ 
    nombre: "", 
    precio: 0, 
    categoria: "", 
    descripcion: "" 
  });
  const [modoEdicion, setModoEdicion] = useState(null);
  
  // ✅ ESTADOS DE CARGA Y SINCRONIZACIÓN
  const [datosListos, setDatosListos] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isOffline, setIsOffline] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');

  // ✅ FUNCIÓN PARA CARGAR DATOS DESDE EL BACKEND
  const cargarDatosDesdeBackend = useCallback(async () => {
    if (loading) return;

    try {
      setLoadingMessage('🔄 Conectando con el servidor...');
      setLoadingProgress(10);

      // Verificar conectividad
      try {
        await ApiService.healthCheck?.();
        setIsOffline(false);
        setSyncStatus('🟢 Conectado al servidor');
      } catch (connectError) {
        setIsOffline(true);
        setSyncStatus('🔴 Modo offline - Datos locales');
        console.log('⚠️ Sin conexión, usando datos locales');
      }

      setLoadingMessage('📦 Cargando datos del restaurante...');
      setLoadingProgress(30);

      // Cargar datos con Promise.allSettled para manejo robusto de errores
      const [menuData, especialesData, categoriasData, pedidosData, ventasData] = await Promise.allSettled([
        ApiService.getMenu().catch(() => []),
        ApiService.getPlatosEspeciales().catch(() => []),
        ApiService.getCategorias().catch(() => []),
        ApiService.getPedidos().catch(() => []),
        ApiService.getVentas().catch(() => [])
      ]);

      setLoadingProgress(60);

      // Procesar resultados de manera segura
      if (menuData.status === 'fulfilled') {
        const menuArray = Array.isArray(menuData.value) ? 
          menuData.value : 
          menuData.value?.menu || [];
        setMenu(menuArray);
        console.log('✅ Menu cargado:', menuArray.length, 'items');
      } else {
        console.log('⚠️ Error cargando menu:', menuData.reason);
      }

      if (especialesData.status === 'fulfilled') {
        const especialesArray = Array.isArray(especialesData.value) ? 
          especialesData.value : 
          especialesData.value?.especiales || [];
        setPlatosEspeciales(especialesArray);
        console.log('✅ Platos especiales cargados:', especialesArray.length, 'items');
      } else {
        console.log('⚠️ Error cargando platos especiales:', especialesData.reason);
      }

      if (categoriasData.status === 'fulfilled') {
        const categoriasArray = Array.isArray(categoriasData.value) ? 
          categoriasData.value : 
          categoriasData.value?.categorias || [];
        setCategorias(categoriasArray);
        console.log('✅ Categorías cargadas:', categoriasArray.length, 'items');
      } else {
        console.log('⚠️ Error cargando categorías:', categoriasData.reason);
      }

      if (pedidosData.status === 'fulfilled') {
        const pedidosArray = Array.isArray(pedidosData.value) ? 
          pedidosData.value : 
          pedidosData.value?.pedidos || [];
        setPedidos(pedidosArray);
        console.log('✅ Pedidos cargados:', pedidosArray.length, 'items');
      } else {
        console.log('⚠️ Error cargando pedidos:', pedidosData.reason);
      }

      if (ventasData.status === 'fulfilled') {
        const ventasArray = Array.isArray(ventasData.value) ? 
          ventasData.value : 
          ventasData.value?.ventas || [];
        setVentas(ventasArray);
        console.log('✅ Ventas cargadas:', ventasArray.length, 'items');
      } else {
        console.log('⚠️ Error cargando ventas:', ventasData.reason);
      }

      setLoadingProgress(90);
      setLoadingMessage('✅ Preparando interfaz...');

      // Simular pequeña pausa para mostrar el progreso
      await new Promise(resolve => setTimeout(resolve, 500));

      setLoadingProgress(100);
      setDatosListos(true);
      setLoadingMessage('🎉 ¡Aplicación lista!');

      // Limpiar mensaje después de un momento
      setTimeout(() => {
        setLoadingMessage('');
      }, 1000);

    } catch (error) {
      console.error('❌ Error crítico cargando datos:', error);
      setLoadingMessage('❌ Error cargando datos - verificando conexión...');
      setIsOffline(true);
      setSyncStatus('🔴 Error de conexión');

      // Intentar continuar con datos vacíos en modo offline
      setTimeout(() => {
        setDatosListos(true);
        setLoadingMessage('📱 Modo offline - funcionalidad limitada');
        setSyncStatus('🔴 Sin conexión al servidor');
      }, 2000);
    }
  }, [loading]);

  // ✅ CARGAR DATOS AL INICIAR SESIÓN
  useEffect(() => {
    if (isLoggedIn && !datosListos) {
      console.log('🚀 Usuario autenticado, cargando datos...');
      cargarDatosDesdeBackend();
      const token = ApiService.authToken;
      const restaurantId = user?.restaurant_id || 1;
      if (token) {
        EchoService.init(token, restaurantId);
      }
    }
  }, [isLoggedIn, datosListos, cargarDatosDesdeBackend, user]);

  // ✅ LIMPIAR DATOS AL CERRAR SESIÓN
  useEffect(() => {
    if (!isLoggedIn) {
      console.log('👋 Sesión cerrada, limpiando datos...');
      EchoService.disconnect();
      setMenu([]);
      setPedidos([]);
      setPlatosEspeciales([]);
      setVentas([]);
      setCategorias([]);
      setDatosListos(false);
      setLoadingProgress(0);
      setLoadingMessage('');
      setSyncStatus('');
    }
  }, [isLoggedIn]);

  // ✅ RENDERIZADO CONDICIONAL
  if (initializing) {
    return (
      <LoadingScreen 
        type="initialization" 
        message="🚀 Iniciando aplicación..." 
        progress={0}
      />
    );
  }

  if (!isLoggedIn) {
    return <LoginScreen />;
  }

  if (isLoggedIn && !datosListos) {
    return (
      <LoadingScreen 
        type="data" 
        message={loadingMessage || '📦 Cargando datos...'} 
        progress={loadingProgress}
        isOffline={isOffline}
        syncStatus={syncStatus}
      />
    );
  }

  return (
    <View style={{ 
      flex: 1, 
      backgroundColor: '#f8f8f8',
      paddingTop: safeAreaConfig.getTopPadding(0) 
    }}>
      <StatusBar {...SafeAreaConfig.getStatusBarConfig()} />
      
      <AppHeader />

      <View style={{ 
        flex: 1, 
        paddingBottom: safeAreaConfig.getBottomPadding(0) 
      }}>
        <AppNavigator
          userRole={userRole || 'mesero'}
          menu={menu}
          setMenu={setMenu}
          pedidos={pedidos}
          setPedidos={setPedidos}
          platosEspeciales={platosEspeciales}
          setPlatosEspeciales={setPlatosEspeciales}
          ventas={ventas}
          setVentas={setVentas}
          nuevoProducto={nuevoProducto}
          setNuevoProducto={setNuevoProducto}
          modoEdicion={modoEdicion}
          setModoEdicion={setModoEdicion}
          categorias={categorias}
          setCategorias={setCategorias}
        />
      </View>
    </View>
  );
}

// ✅ COMPONENTE PRINCIPAL CON PROVIDER
export default function MainApp() {
  return (
    <UniversalSafeAreaProvider>
      <MainAppContent />
    </UniversalSafeAreaProvider>
  );
}