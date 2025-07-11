// components/Informes.js - Código Completo y Estructurado
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Platform,
  Alert,
  RefreshControl,
  Linking,
  StatusBar
} from "react-native";

// Importación segura con fallback
let SafeAreaView, useSafeAreaInsets;
try {
  const SafeAreaContext = require('react-native-safe-area-context');
  SafeAreaView = SafeAreaContext.SafeAreaView;
  useSafeAreaInsets = SafeAreaContext.useSafeAreaInsets;
  console.log('✅ SafeAreaContext cargado correctamente');
} catch (error) {
  console.log('⚠️ SafeAreaContext no disponible, usando fallback');
  SafeAreaView = View;
  useSafeAreaInsets = () => ({ top: 0, bottom: 0, left: 0, right: 0 });
}

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import ApiService from "../services/ApiService";
import { useAuth } from "../contexts/AuthContext";

export default function Informes({ ventas: ventasProp }) {
  const { userRole, isOffline } = useAuth();
  
  // Uso condicional del hook con fallback
  let insets = { top: 0, bottom: 0, left: 0, right: 0 };
  try {
    if (useSafeAreaInsets) {
      insets = useSafeAreaInsets();
    }
  } catch (error) {
    console.log('⚠️ Error usando useSafeAreaInsets, usando valores por defecto');
  }
  
  // ============================================
  // ESTADOS PRINCIPALES
  // ============================================
  const [ventas, setVentas] = useState([]);
  const [ventasFiltradas, setVentasFiltradas] = useState([]);
  const [estadisticas, setEstadisticas] = useState({});
  const [productosPopulares, setProductosPopulares] = useState([]);
  
  // Estados de filtros
  const [mesaSeleccionada, setMesaSeleccionada] = useState("");
  const [productoSeleccionado, setProductoSeleccionado] = useState("");
  const [fechaInicio, setFechaInicio] = useState(() => {
    const hoy = new Date();
    return new Date(hoy.setHours(0, 0, 0, 0));
  });
  const [fechaFin, setFechaFin] = useState(() => {
    const hoy = new Date();
    return new Date(hoy.setHours(23, 59, 59, 999));
  });
  
  // Estados de UI
  const [mostrarFechaInicio, setMostrarFechaInicio] = useState(false);
  const [mostrarFechaFin, setMostrarFechaFin] = useState(false);
  const [mostrarSelectorMesa, setMostrarSelectorMesa] = useState(false);
  const [mostrarSelectorProducto, setMostrarSelectorProducto] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [buscando, setBuscando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');

  // Estados para visualización
  const [mostrarTodosProductos, setMostrarTodosProductos] = useState(false);
  const [ordenProductos, setOrdenProductos] = useState('cantidad');
  const [mostrarResumenMesas, setMostrarResumenMesas] = useState(false);
  const [ordenMesas, setOrdenMesas] = useState('horario');
  const [mesaExpandida, setMesaExpandida] = useState(null);
  const [ordenExpandida, setOrdenExpandida] = useState(null);
  const [vistaDetallada, setVistaDetallada] = useState(false);
  const [mostrarListaOrdenes, setMostrarListaOrdenes] = useState(false);

  // Datos fijos
  const listaMesas = ["Mesa 1", "Mesa 2", "Mesa 3", "Mesa 4", "Mesa 5"];
  const [todosLosProductos, setTodosLosProductos] = useState([]);

  // ============================================
  // EFECTOS Y CARGA INICIAL
  // ============================================
  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  // ============================================
  // CÁLCULOS MEMOIZADOS
  // ============================================
  
  // Resumen por mesa con órdenes individuales
  const resumenPorMesa = React.useMemo(() => {
    if (!Array.isArray(ventasFiltradas)) return [];
    
    const mesasData = {};
    
    ventasFiltradas.forEach(venta => {
      if (!venta || !venta.mesa) return;
      
      const mesa = venta.mesa;
      const fechaVenta = new Date(venta.fecha);
      const total = parseFloat(venta.total || 0);
      
      if (!mesasData[mesa]) {
        mesasData[mesa] = {
          mesa: mesa,
          totalMesa: 0,
          numeroOrdenes: 0,
          horaCierre: fechaVenta,
          horaApertura: fechaVenta,
          productos: {},
          ordenes: []
        };
      }
      
      mesasData[mesa].totalMesa += total;
      mesasData[mesa].numeroOrdenes += 1;
      
      // Agregar cada orden individual
      mesasData[mesa].ordenes.push({
        id: venta.id || `orden-${Date.now()}-${Math.random()}`,
        numero_orden: venta.numero_orden || mesasData[mesa].numeroOrdenes,
        fecha: fechaVenta,
        total: total,
        items: venta.items || [],
        estado: venta.estado || 'completada',
        metodo_pago: venta.metodo_pago || 'efectivo',
        cliente: venta.cliente || 'Cliente',
        observaciones: venta.observaciones || ''
      });
      
      // Procesar productos de la mesa
      if (venta.items && Array.isArray(venta.items)) {
        venta.items.forEach(item => {
          const nombreProducto = item.nombre;
          if (!mesasData[mesa].productos[nombreProducto]) {
            mesasData[mesa].productos[nombreProducto] = {
              nombre: nombreProducto,
              cantidad: 0,
              subtotal: 0,
              precio: item.precio || 0
            };
          }
          mesasData[mesa].productos[nombreProducto].cantidad += item.cantidad || 0;
          mesasData[mesa].productos[nombreProducto].subtotal += (item.precio || 0) * (item.cantidad || 0);
        });
      }
      
      // Actualizar horarios
      if (fechaVenta > mesasData[mesa].horaCierre) {
        mesasData[mesa].horaCierre = fechaVenta;
      }
      if (fechaVenta < mesasData[mesa].horaApertura) {
        mesasData[mesa].horaApertura = fechaVenta;
      }
    });
    
    // Convertir productos a array y ordenar órdenes
    Object.values(mesasData).forEach(mesa => {
      mesa.productosArray = Object.values(mesa.productos)
        .sort((a, b) => b.cantidad - a.cantidad);
      mesa.ordenes = mesa.ordenes.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    });
    
    const mesasArray = Object.values(mesasData);
    
    if (ordenMesas === 'horario') {
      return mesasArray.sort((a, b) => new Date(b.horaCierre) - new Date(a.horaCierre));
    } else {
      return mesasArray.sort((a, b) => b.totalMesa - a.totalMesa);
    }
  }, [ventasFiltradas, ordenMesas]);

  // Lista de órdenes individuales filtradas y ordenadas
  const ordenesIndividuales = React.useMemo(() => {
    if (!Array.isArray(ventasFiltradas)) return [];
    
    const ordenes = ventasFiltradas.map((venta, index) => ({
      id: venta.id || `orden-${index}`,
      numero_orden: venta.numero_orden || venta.id || (index + 1),
      mesa: venta.mesa,
      fecha: new Date(venta.fecha),
      total: parseFloat(venta.total || 0),
      items: venta.items || [],
      estado: venta.estado || 'completada',
      metodo_pago: venta.metodo_pago || 'efectivo',
      cliente: venta.cliente || 'Cliente',
      observaciones: venta.observaciones || '',
      cantidad_items: (venta.items || []).reduce((sum, item) => sum + (item.cantidad || 0), 0)
    }));
    
    return ordenes.sort((a, b) => b.fecha - a.fecha);
  }, [ventasFiltradas]);

  // Total general de todas las órdenes listadas
  const totalGeneralOrdenes = React.useMemo(() => {
    return ordenesIndividuales.reduce((sum, orden) => sum + orden.total, 0);
  }, [ordenesIndividuales]);

  // Total general del período
  const totalGeneral = React.useMemo(() => {
    if (!Array.isArray(ventasFiltradas)) return {
      totalVentas: 0,
      totalOrdenes: 0,
      totalItems: 0,
      mesasActivas: 0
    };

    const totalVentas = ventasFiltradas.reduce((sum, venta) => sum + (venta.total || 0), 0);
    const totalItems = ventasFiltradas.reduce((sum, venta) => 
      sum + (venta.items?.reduce((itemSum, item) => itemSum + (item.cantidad || 0), 0) || 0), 0
    );
    const mesasUnicas = new Set(ventasFiltradas.map(venta => venta.mesa)).size;

    return {
      totalVentas,
      totalOrdenes: ventasFiltradas.length,
      totalItems,
      mesasActivas: mesasUnicas
    };
  }, [ventasFiltradas]);

  // Resumen de productos
  const resumenProductos = React.useMemo(() => {
    if (!Array.isArray(ventasFiltradas)) return [];
    
    const productos = {};
    
    ventasFiltradas.forEach(venta => {
      if (venta && Array.isArray(venta.items)) {
        venta.items.forEach(item => {
          const nombre = item.nombre;
          if (!productos[nombre]) {
            productos[nombre] = {
              nombre,
              cantidad: 0,
              subtotal: 0
            };
          }
          
          productos[nombre].cantidad += item.cantidad || 0;
          productos[nombre].subtotal += (item.precio || 0) * (item.cantidad || 0);
        });
      }
    });
    
    const productosArray = Object.values(productos);
    
    if (ordenProductos === 'cantidad') {
      return productosArray.sort((a, b) => b.cantidad - a.cantidad);
    } else {
      return productosArray.sort((a, b) => b.subtotal - a.subtotal);
    }
  }, [ventasFiltradas, ordenProductos]);

  // ============================================
  // FUNCIONES DE CARGA DE DATOS
  // ============================================
  const cargarDatosIniciales = async () => {
    try {
      setCargando(true);
      setSyncStatus('Cargando datos de informes...');
      
      if (Array.isArray(ventasProp) && ventasProp.length > 0) {
        await procesarVentasLocales(ventasProp);
        setSyncStatus('✅ Datos cargados desde almacenamiento local');
      } else {
        await cargarDesdeBackend();
      }
    } catch (error) {
      console.error('❌ Error cargando datos iniciales:', error);
      setSyncStatus('❌ Error cargando datos');
      await cargarDesdeAsyncStorage();
    } finally {
      setCargando(false);
      setTimeout(() => setSyncStatus(''), 3000);
    }
  };

  const cargarDesdeBackend = async () => {
    try {
      console.log('🌐 Cargando datos desde backend...');
      
      const filtrosIniciales = {
        fecha_inicio: formatearFechaParaAPI(fechaInicio),
        fecha_fin: formatearFechaParaAPI(fechaFin),
        limit: 1000
      };

      const [reporteVentas, productosTop] = await Promise.all([
        ApiService.getVentasReport(filtrosIniciales).catch(() => null),
        ApiService.getProductosPopulares({ limit: 20 }).catch(() => ({ productos: [] }))
      ]);

      if (reporteVentas && reporteVentas.ventas) {
        setVentas(reporteVentas.ventas);
        setVentasFiltradas(reporteVentas.ventas);
        setEstadisticas(reporteVentas.estadisticas || {});
        
        const productosUnicos = [...new Set(
          reporteVentas.ventas.flatMap(venta => 
            venta.items?.map(item => item.nombre) || []
          )
        )];
        setTodosLosProductos(productosUnicos);
        
        setSyncStatus('✅ Datos sincronizados con servidor');
      } else {
        await cargarDesdeAsyncStorage();
      }

      if (productosTop && productosTop.productos) {
        setProductosPopulares(productosTop.productos);
      }
    } catch (error) {
      console.error('❌ Error cargando desde backend:', error);
      setSyncStatus('❌ Error de conexión - usando datos locales');
      await cargarDesdeAsyncStorage();
    }
  };

  const cargarDesdeAsyncStorage = async () => {
    try {
      const [ventasLocal, estadisticasLocal, productosLocal] = await Promise.all([
        AsyncStorage.getItem("ventas"),
        AsyncStorage.getItem("informes_estadisticas"),
        AsyncStorage.getItem("informes_productos_populares")
      ]);

      let ventasCargadas = [];
      
      if (ventasLocal) {
        ventasCargadas = JSON.parse(ventasLocal);
      }

      if (ventasCargadas.length === 0 && ventasProp && ventasProp.length > 0) {
        ventasCargadas = ventasProp;
      }

      await procesarVentasLocales(ventasCargadas);

      if (estadisticasLocal) {
        setEstadisticas(JSON.parse(estadisticasLocal));
      }

      if (productosLocal) {
        setProductosPopulares(JSON.parse(productosLocal));
      }

      setSyncStatus('📱 Datos cargados desde almacenamiento local');
    } catch (error) {
      console.error('❌ Error cargando desde AsyncStorage:', error);
      setVentas([]);
      setVentasFiltradas([]);
      setSyncStatus('❌ No hay datos disponibles');
    }
  };

  const procesarVentasLocales = async (ventasLocal) => {
    try {
      const ventasProcesadas = ventasLocal.map(venta => {
        if (venta.items && Array.isArray(venta.items)) {
          return {
            id: venta.id || Date.now().toString(),
            mesa: venta.mesa || 'Mesa desconocida',
            fecha: venta.fecha || new Date().toISOString(),
            total: parseFloat(venta.total || 0),
            items: venta.items.map(item => ({
              nombre: item.nombre || 'Producto desconocido',
              cantidad: parseInt(item.cantidad || 1),
              precio: parseFloat(item.precio || 0),
              categoria: item.categoria || 'Sin categoría'
            })),
            estado: venta.estado || 'completada',
            metodo_pago: venta.metodo_pago || 'efectivo'
          };
        } else {
          return {
            id: venta.id || Date.now().toString(),
            mesa: venta.mesa || 'Mesa desconocida',
            fecha: venta.fecha || new Date().toISOString(),
            total: parseFloat(venta.total || 0),
            items: venta.productos ? venta.productos.map(producto => ({
              nombre: producto.nombre || 'Producto desconocido',
              cantidad: parseInt(producto.cantidad || 1),
              precio: parseFloat(producto.precio || 0),
              categoria: producto.categoria || 'Sin categoría'
            })) : [],
            estado: 'completada',
            metodo_pago: 'efectivo'
          };
        }
      });

      setVentas(ventasProcesadas);
      setVentasFiltradas(ventasProcesadas);

      const productosUnicos = [...new Set(
        ventasProcesadas.flatMap(venta => 
          venta.items?.map(item => item.nombre) || []
        )
      )];
      setTodosLosProductos(productosUnicos);

      const stats = calcularEstadisticasLocales(ventasProcesadas);
      setEstadisticas(stats);
    } catch (error) {
      console.error('❌ Error procesando ventas locales:', error);
    }
  };

  // ============================================
  // FUNCIONES DE UTILIDAD
  // ============================================
  const calcularEstadisticasLocales = (ventasData) => {
    const totalVentas = ventasData.reduce((sum, venta) => sum + (venta.total || 0), 0);
    const totalItems = ventasData.reduce((sum, venta) => 
      sum + (venta.items?.reduce((itemSum, item) => itemSum + item.cantidad, 0) || 0), 0
    );
    
    return {
      total_ventas: totalVentas,
      total_items: totalItems,
      numero_ordenes: ventasData.length,
      promedio_orden: ventasData.length > 0 ? totalVentas / ventasData.length : 0
    };
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "";
    try {
      return fecha.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      return String(fecha);
    }
  };

  const formatearHora = (fecha) => {
    if (!fecha) return "";
    try {
      return fecha.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return String(fecha);
    }
  };

  const formatearFechaParaAPI = (fecha) => {
    if (!fecha) return null;
    try {
      return fecha.toISOString().split('T')[0];
    } catch (e) {
      return null;
    }
  };

  // ============================================
  // FUNCIONES DE FILTRADO
  // ============================================
  const filtrarVentas = async () => {
    try {
      setBuscando(true);
      setSyncStatus('Aplicando filtros...');

      if (!isOffline) {
        try {
          const filtros = {
            fecha_inicio: formatearFechaParaAPI(fechaInicio),
            fecha_fin: formatearFechaParaAPI(fechaFin),
            ...(mesaSeleccionada && { mesa: mesaSeleccionada }),
            ...(productoSeleccionado && { producto: productoSeleccionado }),
            limit: 1000
          };

          const resultado = await ApiService.getVentasReport(filtros);
          
          if (resultado && resultado.ventas) {
            setVentasFiltradas(resultado.ventas);
            setEstadisticas(resultado.estadisticas || {});
            setSyncStatus('✅ Filtros aplicados desde servidor');
            return;
          }
        } catch (error) {
          console.log('⚠️ Error filtrando en backend, usando filtrado local:', error.message);
        }
      }

      await filtrarVentasLocal();
    } catch (error) {
      console.error('❌ Error filtrando ventas:', error);
      setSyncStatus('❌ Error aplicando filtros');
    } finally {
      setBuscando(false);
      setTimeout(() => setSyncStatus(''), 3000);
    }
  };

  const filtrarVentasLocal = async () => {
    const inicioDelDia = new Date(fechaInicio);
    inicioDelDia.setHours(0, 0, 0, 0);
    
    const finDelDia = new Date(fechaFin);
    finDelDia.setHours(23, 59, 59, 999);
    
    let ventasFiltradas = ventas.filter((venta) => {
      if (!venta) return false;
      
      const fechaVenta = new Date(venta.fecha);
      const dentroDelRango = fechaVenta >= inicioDelDia && fechaVenta <= finDelDia;
      const coincideMesa = mesaSeleccionada === "" || venta.mesa === mesaSeleccionada;
      
      return dentroDelRango && coincideMesa;
    });

    if (productoSeleccionado !== "") {
      ventasFiltradas = ventasFiltradas.map(venta => {
        const itemsFiltrados = venta.items?.filter(item => 
          item.nombre === productoSeleccionado
        ) || [];
        
        if (itemsFiltrados.length === 0) return null;
        
        return {
          ...venta,
          items: itemsFiltrados,
          total: itemsFiltrados.reduce((sum, item) => sum + (item.precio * item.cantidad), 0)
        };
      }).filter(Boolean);
    }

    setVentasFiltradas(ventasFiltradas);
    
    const stats = calcularEstadisticasLocales(ventasFiltradas);
    setEstadisticas(stats);
    
    setSyncStatus('✅ Filtros aplicados localmente');
  };

  const limpiarFiltros = () => {
    const hoy = new Date();
    setMesaSeleccionada("");
    setProductoSeleccionado("");
    setFechaInicio(new Date(hoy.setHours(0, 0, 0, 0)));
    setFechaFin(new Date(hoy.setHours(23, 59, 59, 999)));
    setVentasFiltradas(ventas);
    
    const stats = calcularEstadisticasLocales(ventas);
    setEstadisticas(stats);
  };

  // ============================================
  // FUNCIONES DE EXPORTACIÓN
  // ============================================
  const exportarDatos = async () => {
    try {
      setExportando(true);

      if (ventasFiltradas.length === 0) {
        Alert.alert("Sin datos", "No hay datos para exportar.");
        return;
      }

      const csvContent = generarCSVLocal();
      await compartirDatos(csvContent, 'csv');
    } catch (error) {
      console.error('❌ Error exportando datos:', error);
      Alert.alert("Error", "No se pudieron exportar los datos.");
    } finally {
      setExportando(false);
    }
  };

  const generarCSVLocal = () => {
    const datosCSV = [
      ['Mesa', 'Producto', 'Cantidad', 'Precio Unitario', 'Subtotal', 'Fecha', 'Hora']
    ];

    ventasFiltradas.forEach(venta => {
      if (venta && Array.isArray(venta.items)) {
        venta.items.forEach(item => {
          const fechaVenta = new Date(venta.fecha);
          datosCSV.push([
            venta.mesa || 'N/A',
            item.nombre || 'N/A',
            item.cantidad || 0,
            item.precio || 0,
            (item.precio || 0) * (item.cantidad || 0),
            fechaVenta.toLocaleDateString('es-ES'),
            fechaVenta.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
          ]);
        });
      }
    });

    return datosCSV.map(fila => 
      fila.map(celda => 
        typeof celda === 'string' && celda.includes(',') 
          ? `"${celda}"` 
          : celda
      ).join(',')
    ).join('\n');
  };

  const compartirDatos = async (contenido, tipo) => {
    const resumen = `
REPORTE DE VENTAS
================

Período: ${formatearFecha(fechaInicio)} - ${formatearFecha(fechaFin)}
Mesa: ${mesaSeleccionada || 'Todas'}
Producto: ${productoSeleccionado || 'Todos'}
Total registros: ${ventasFiltradas.reduce((acc, v) => acc + (v.items?.length || 0), 0)}
Total ventas: $${estadisticas.total_ventas || 0}
Generado: ${new Date().toLocaleString('es-ES')}

DATOS:
${contenido}
    `.trim();

    Alert.alert(
      "Exportar Datos",
      "¿Cómo deseas compartir los datos?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Compartir por Email",
          onPress: () => compartirPorEmail(resumen)
        }
      ]
    );
  };

  const compartirPorEmail = async (contenido) => {
    try {
      const asunto = `Reporte de Ventas - ${formatearFecha(fechaInicio)} a ${formatearFecha(fechaFin)}`;
      const emailUrl = `mailto:?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(contenido)}`;
      
      const canOpen = await Linking.canOpenURL(emailUrl);
      if (canOpen) {
        await Linking.openURL(emailUrl);
      } else {
        Alert.alert("Datos del Reporte", contenido);
      }
    } catch (error) {
      console.error('Error compartiendo por email:', error);
      Alert.alert("Error", "No se pudo compartir el reporte.");
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await cargarDesdeBackend();
    setRefreshing(false);
  };

  // ============================================
  // COMPONENTES DE RENDERIZADO
  // ============================================
  const renderSelectorMesa = () => {
    if (Platform.OS === 'ios') {
      return (
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={mesaSeleccionada}
            onValueChange={setMesaSeleccionada}
            style={styles.picker}
          >
            <Picker.Item label="Todas las mesas" value="" />
            {listaMesas.map((mesa) => (
              <Picker.Item label={mesa} value={mesa} key={mesa} />
            ))}
          </Picker>
        </View>
      );
    }
    
    return (
      <TouchableOpacity 
        style={styles.customPicker}
        onPress={() => setMostrarSelectorMesa(true)}
      >
        <Text style={styles.pickerText}>
          {mesaSeleccionada === "" ? "Todas las mesas" : mesaSeleccionada}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#555" />
        
        <Modal
          visible={mostrarSelectorMesa}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setMostrarSelectorMesa(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setMostrarSelectorMesa(false)}
          >
            <View style={styles.pickerModalContent}>
              <Text style={styles.pickerModalTitle}>Seleccionar Mesa</Text>
              
              <TouchableOpacity 
                style={[
                  styles.opcion,
                  mesaSeleccionada === "" && styles.opcionSeleccionada
                ]}
                onPress={() => {
                  setMesaSeleccionada("");
                  setMostrarSelectorMesa(false);
                }}
              >
                <Text 
                  style={[
                    styles.opcionTexto,
                    mesaSeleccionada === "" && styles.opcionTextoSeleccionado
                  ]}
                >
                  Todas las mesas
                </Text>
                {mesaSeleccionada === "" && (
                  <Ionicons name="checkmark" size={20} color="#fff" />
                )}
              </TouchableOpacity>
              
              {listaMesas.map((mesa) => (
                <TouchableOpacity 
                  key={mesa}
                  style={[
                    styles.opcion,
                    mesaSeleccionada === mesa && styles.opcionSeleccionada
                  ]}
                  onPress={() => {
                    setMesaSeleccionada(mesa);
                    setMostrarSelectorMesa(false);
                  }}
                >
                  <Text 
                    style={[
                      styles.opcionTexto,
                      mesaSeleccionada === mesa && styles.opcionTextoSeleccionado
                    ]}
                  >
                    {mesa}
                  </Text>
                  {mesaSeleccionada === mesa && (
                    <Ionicons name="checkmark" size={20} color="#fff" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      </TouchableOpacity>
    );
  };
 
 
 
  const renderSelectorProducto = () => {
    if (Platform.OS === 'ios') {
      return (
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={productoSeleccionado}
            onValueChange={setProductoSeleccionado}
            style={styles.picker}
          >
            <Picker.Item label="Todos los productos" value="" />
            {todosLosProductos.map((nombre) => (
              <Picker.Item label={nombre} value={nombre} key={nombre} />
            ))}
          </Picker>
        </View>
      );
    }
    
    return (
      <TouchableOpacity 
        style={styles.customPicker}
        onPress={() => setMostrarSelectorProducto(true)}
      >
        <Text style={styles.pickerText}>
          {productoSeleccionado === "" ? "Todos los productos" : productoSeleccionado}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#555" />
        
        <Modal
          visible={mostrarSelectorProducto}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setMostrarSelectorProducto(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setMostrarSelectorProducto(false)}
          >
            <View style={styles.pickerModalContent}>
              <Text style={styles.pickerModalTitle}>Seleccionar Producto</Text>
              
              <ScrollView style={{maxHeight: 300}}>
                <TouchableOpacity 
                  style={[
                    styles.opcion,
                    productoSeleccionado === "" && styles.opcionSeleccionada
                  ]}
                  onPress={() => {
                    setProductoSeleccionado("");
                    setMostrarSelectorProducto(false);
                  }}
                >
                  <Text 
                    style={[
                      styles.opcionTexto,
                      productoSeleccionado === "" && styles.opcionTextoSeleccionado
                    ]}
                  >
                    Todos los productos
                  </Text>
                  {productoSeleccionado === "" && (
                    <Ionicons name="checkmark" size={20} color="#fff" />
                  )}
                </TouchableOpacity>
                
                {todosLosProductos.map((nombre) => (
                  <TouchableOpacity 
                    key={nombre}
                    style={[
                      styles.opcion,
                      productoSeleccionado === nombre && styles.opcionSeleccionada
                    ]}
                    onPress={() => {
                      setProductoSeleccionado(nombre);
                      setMostrarSelectorProducto(false);
                    }}
                  >
                    <Text 
                      style={[
                        styles.opcionTexto,
                        productoSeleccionado === nombre && styles.opcionTextoSeleccionado
                      ]}
                    >
                      {nombre}
                    </Text>
                    {productoSeleccionado === nombre && (
                      <Ionicons name="checkmark" size={20} color="#fff" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      </TouchableOpacity>
    );
  };

  // ============================================
  // UTILIDADES DE PADDING
  // ============================================
  const getTopPadding = () => {
    if (Platform.OS === 'android') {
      return StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 35;
    }
    return insets.top > 0 ? insets.top + 10 : 50;
  };

  const getBottomPadding = () => {
    return Math.max(insets.bottom || 0, 20);
  };

  // 🔄 Loading state
  if (cargando) {
    return (
      <View style={[styles.centeredContainer, { paddingTop: getTopPadding() }]}>
        <StatusBar 
          barStyle="dark-content" 
          backgroundColor="#f8f9fa" 
          translucent={false}
        />
        <ActivityIndicator size="large" color="#4a6ee0" />
        <Text style={styles.loadingText}>Cargando informes...</Text>
        {syncStatus && <Text style={styles.syncStatusText}>{syncStatus}</Text>}
      </View>
    );
  }

  // 🎨 Renderizado principal
  return (
    <View style={[styles.container, { paddingTop: getTopPadding() }]}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#f8f9fa" 
        translucent={false}
      />
      
      <ScrollView 
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingBottom: getBottomPadding() }
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4a6ee0']}
          />
        }
        showsVerticalScrollIndicator={true}
      >
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.titulo}>Informes de Ventas</Text>
          {isOffline && (
            <View style={styles.offlineIndicator}>
              <Ionicons name="cloud-offline" size={16} color="#e67e22" />
              <Text style={styles.offlineText}>Modo Offline</Text>
            </View>
          )}
        </View>

        {/* Estado de sincronización */}
        {syncStatus && (
          <View style={styles.syncStatus}>
            <Text style={styles.syncStatusText}>{syncStatus}</Text>
          </View>
        )}

        {/* Sección de filtros */}
        <View style={styles.filtrosContainer}>
          <Text style={styles.filtrosTitulo}>
            <Ionicons name="filter" size={20} color="#4a6ee0" /> Filtros
          </Text>

          <View style={styles.filtroSeccion}>
            <Text style={styles.filtroLabel}>Mesa</Text>
            {renderSelectorMesa()}
          </View>

          <View style={styles.filtroSeccion}>
            <Text style={styles.filtroLabel}>Producto</Text>
            {renderSelectorProducto()}
          </View>

          <View style={styles.filtroSeccion}>
            <Text style={styles.filtroLabel}>Rango de fechas</Text>
            <View style={styles.fechasContainer}>
              <View style={styles.fechaSelector}>
                <Text style={styles.fechaLabel}>Desde:</Text>
                <TouchableOpacity
                  style={styles.fechaButton}
                  onPress={() => setMostrarFechaInicio(true)}
                >
                  <Text style={styles.fechaButtonText}>
                    {formatearFecha(fechaInicio)}
                  </Text>
                  <Ionicons name="calendar-outline" size={18} color="#4a6ee0" />
                </TouchableOpacity>
                {mostrarFechaInicio && (
                  <DateTimePicker
                    value={fechaInicio}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setMostrarFechaInicio(false);
                      if (selectedDate) setFechaInicio(selectedDate);
                    }}
                  />
                )}
              </View>

              <View style={styles.fechaSelector}>
                <Text style={styles.fechaLabel}>Hasta:</Text>
                <TouchableOpacity
                  style={styles.fechaButton}
                  onPress={() => setMostrarFechaFin(true)}
                >
                  <Text style={styles.fechaButtonText}>
                    {formatearFecha(fechaFin)}
                  </Text>
                  <Ionicons name="calendar-outline" size={18} color="#4a6ee0" />
                </TouchableOpacity>
                {mostrarFechaFin && (
                  <DateTimePicker
                    value={fechaFin}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setMostrarFechaFin(false);
                      if (selectedDate) setFechaFin(selectedDate);
                    }}
                  />
                )}
              </View>
            </View>
          </View>

          <View style={styles.botonesContainer}>
            <TouchableOpacity
              style={styles.botonSecundario}
              onPress={limpiarFiltros}
            >
              <Text style={styles.botonSecundarioTexto}>Limpiar</Text>
              <Ionicons name="refresh" size={18} color="#555" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.botonPrimario}
              onPress={filtrarVentas}
              disabled={buscando}
            >
              {buscando ? (
                <>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={[styles.botonTexto, {marginLeft: 8}]}>Buscando...</Text>
                </>
              ) : (
                <>
                  <Text style={styles.botonTexto}>Buscar</Text>
                  <Ionicons name="search" size={18} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Sección de resultados */}
        <View style={styles.resultadosContainer}>
          <View style={styles.resultadosHeader}>
            <Text style={styles.resultadosTitulo}>Resultados</Text>
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>{ventasFiltradas.length}</Text>
            </View>
          </View>

          {/* Botón de exportación */}
          {ventasFiltradas.length > 0 && (userRole === 'admin' || userRole === 'mesero') && (
            <TouchableOpacity
              style={styles.botonExportar}
              onPress={exportarDatos}
              disabled={exportando}
            >
              {exportando ? (
                <>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={[styles.botonExportarTexto, {marginLeft: 8}]}>Exportando...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="download-outline" size={20} color="#fff" />
                  <Text style={styles.botonExportarTexto}>Exportar Datos</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {ventasFiltradas.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="search" size={40} color="#ccc" />
              <Text style={styles.emptyText}>No se encontraron ventas</Text>
              <Text style={styles.emptySubtext}>Prueba con diferentes filtros</Text>
            </View>
          ) : (
            <View style={styles.estadisticasContainer}>
              {/* ✅ NUEVA SECCIÓN: LISTA DE ÓRDENES INDIVIDUALES */}
              <View style={styles.listaOrdenesSection}>
                <TouchableOpacity
                  style={styles.listaOrdenesToggle}
                  onPress={() => setMostrarListaOrdenes(!mostrarListaOrdenes)}
                >
                  <View style={styles.listaOrdenesHeader}>
                    <Ionicons name="receipt-outline" size={20} color="#4a6ee0" />
                    <Text style={styles.listaOrdenesTitle}>
                      Lista de Órdenes ({ordenesIndividuales.length})
                    </Text>
                  </View>
                  <View style={styles.listaOrdenesTotalContainer}>
                    <Text style={styles.listaOrdenesTotal}>
                      ${totalGeneralOrdenes.toLocaleString()}
                    </Text>
                    <Ionicons 
                      name={mostrarListaOrdenes ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color="#4a6ee0" 
                    />
                  </View>
                </TouchableOpacity>

                {mostrarListaOrdenes && (
                  <View style={styles.listaOrdenesContent}>
                    <Text style={styles.listaOrdenesSubtitle}>
                      Ordenadas por horario de cierre • Filtros aplicados: {mesaSeleccionada || 'Todas las mesas'} • {productoSeleccionado || 'Todos los productos'}
                    </Text>
                    
                    <ScrollView 
                      style={styles.ordenesScrollContainer}
                      nestedScrollEnabled={true}
                      showsVerticalScrollIndicator={true}
                    >
                      {ordenesIndividuales.map((orden, index) => (
                        <View key={orden.id} style={styles.ordenIndividualItem}>
                          <TouchableOpacity 
                            style={styles.ordenIndividualHeader}
                            onPress={() => setOrdenExpandida(
                              ordenExpandida === orden.id ? null : orden.id
                            )}
                          >
                            <View style={styles.ordenIndividualLeft}>
                              <View style={styles.ordenIndividualNumero}>
                                <Text style={styles.ordenNumeroTexto}>#{orden.numero_orden}</Text>
                                <Text style={styles.ordenMesaTexto}>{orden.mesa}</Text>
                              </View>
                              
                              <View style={styles.ordenIndividualInfo}>
                                <Text style={styles.ordenIndividualTotal}>
                                  ${orden.total.toLocaleString()}
                                </Text>
                                <Text style={styles.ordenIndividualItems}>
                                  {orden.cantidad_items} items
                                </Text>
                              </View>
                            </View>
                            
                            <View style={styles.ordenIndividualRight}>
                              <View style={styles.ordenIndividualHorario}>
                                <Ionicons name="time-outline" size={14} color="#4a6ee0" />
                                <Text style={styles.ordenIndividualHora}>
                                  {formatearHora(orden.fecha)}
                                </Text>
                              </View>
                              <Text style={styles.ordenIndividualFecha}>
                                {formatearFecha(orden.fecha)}
                              </Text>
                              
                              <Ionicons 
                                name={ordenExpandida === orden.id ? "chevron-up" : "chevron-down"} 
                                size={16} 
                                color="#666" 
                              />
                            </View>
                          </TouchableOpacity>
                          
                          {ordenExpandida === orden.id && (
                            <View style={styles.ordenIndividualDetalles}>
                              <View style={styles.ordenIndividualMetadata}>
                                <View style={styles.metadataItem}>
                                  <Ionicons name="person-outline" size={14} color="#666" />
                                  <Text style={styles.metadataTexto}>{orden.cliente}</Text>
                                </View>
                                <View style={styles.metadataItem}>
                                  <Ionicons name="card-outline" size={14} color="#666" />
                                  <Text style={styles.metadataTexto}>{orden.metodo_pago}</Text>
                                </View>
                                <View style={styles.metadataItem}>
                                  <Ionicons name="checkmark-circle-outline" size={14} color="#28a745" />
                                  <Text style={styles.metadataTexto}>{orden.estado}</Text>
                                </View>
                              </View>
                              
                              <Text style={styles.ordenProductosLabel}>
                                Productos de la orden:
                              </Text>
                              
                              <View style={styles.ordenProductosContainer}>
                                {orden.items.map((item, itemIndex) => (
                                  <View key={itemIndex} style={styles.ordenProductoDetalle}>
                                    <View style={styles.ordenProductoDetalleLeft}>
                                      <Text style={styles.ordenProductoDetalleNombre}>
                                        {item.nombre}
                                      </Text>
                                      <Text style={styles.ordenProductoDetalleCategoria}>
                                        {item.categoria || 'General'}
                                      </Text>
                                    </View>
                                    
                                    <View style={styles.ordenProductoDetalleCenter}>
                                      <Text style={styles.ordenProductoDetalleCantidad}>
                                        x{item.cantidad}
                                      </Text>
                                      <Text style={styles.ordenProductoDetallePrecio}>
                                        ${(item.precio || 0).toLocaleString()}/u
                                      </Text>
                                    </View>
                                    
                                    <View style={styles.ordenProductoDetalleRight}>
                                      <Text style={styles.ordenProductoDetalleSubtotal}>
                                        ${((item.precio || 0) * (item.cantidad || 0)).toLocaleString()}
                                      </Text>
                                    </View>
                                  </View>
                                ))}
                              </View>
                              
                              {orden.observaciones && (
                                <View style={styles.ordenObservacionesContainer}>
                                  <Text style={styles.ordenObservacionesLabel}>
                                    <Ionicons name="chatbubble-outline" size={12} color="#666" />
                                    {" "}Observaciones:
                                  </Text>
                                  <Text style={styles.ordenObservacionesTexto}>
                                    {orden.observaciones}
                                  </Text>
                                </View>
                              )}
                              
                              <View style={styles.ordenResumenContainer}>
                                <Text style={styles.ordenResumenTotal}>
                                  Total de la orden: ${orden.total.toLocaleString()}
                                </Text>
                                <Text style={styles.ordenResumenFechaCompleta}>
                                  {orden.fecha.toLocaleString('es-ES', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </Text>
                              </View>
                            </View>
                          )}
                        </View>
                      ))}
                    </ScrollView>
                    
                    <View style={styles.listaOrdenesTotalFinal}>
                      <Text style={styles.totalFinalLabel}>Total General de Órdenes Listadas:</Text>
                      <Text style={styles.totalFinalValor}>
                        ${totalGeneralOrdenes.toLocaleString()}
                      </Text>
                      <Text style={styles.totalFinalInfo}>
                        {ordenesIndividuales.length} órdenes • {ordenesIndividuales.reduce((sum, o) => sum + o.cantidad_items, 0)} items
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {/* ✅ TOTAL GENERAL DEL PERÍODO */}
              {!mostrarListaOrdenes && (
                <View style={styles.totalGeneralCard}>
                  <View style={styles.totalGeneralHeader}>
                    <Ionicons name="analytics-outline" size={24} color="#4a6ee0" />
                    <Text style={styles.totalGeneralLabel}>Resumen General del Período</Text>
                  </View>
                  <Text style={styles.periodoTexto}>
                    {formatearFecha(fechaInicio)} - {formatearFecha(fechaFin)}
                  </Text>
                  
                  <View style={styles.totalGeneralGrid}>
                    <View style={styles.totalGeneralItem}>
                      <Text style={styles.totalGeneralValor}>
                        ${totalGeneral.totalVentas.toLocaleString()}
                      </Text>
                      <Text style={styles.totalGeneralTexto}>Total Ventas</Text>
                    </View>
                    <View style={styles.totalGeneralItem}>
                      <Text style={styles.totalGeneralValor}>
                        {totalGeneral.totalOrdenes}
                      </Text>
                      <Text style={styles.totalGeneralTexto}>Órdenes</Text>
                    </View>
                    <View style={styles.totalGeneralItem}>
                      <Text style={styles.totalGeneralValor}>
                        {totalGeneral.totalItems}
                      </Text>
                      <Text style={styles.totalGeneralTexto}>Items</Text>
                    </View>
                    <View style={styles.totalGeneralItem}>
                      <Text style={styles.totalGeneralValor}>
                        {totalGeneral.mesasActivas}
                      </Text>
                      <Text style={styles.totalGeneralTexto}>Mesas Activas</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* ✅ RESUMEN POR MESA MEJORADO */}
              {!mostrarListaOrdenes && resumenPorMesa.length > 0 && (
                <View style={styles.mesasResumen}>
                  <View style={styles.mesasHeader}>
                    <Text style={styles.mesasResumenTitulo}>
                      <Ionicons name="restaurant" size={18} color="#555" /> 
                      Detalle por Mesa ({resumenPorMesa.length})
                    </Text>
                    
                    <View style={styles.ordenamientoContainer}>
                      <TouchableOpacity
                        style={[
                          styles.ordenamientoBoton,
                          ordenMesas === 'horario' && styles.ordenamientoBotonActivo
                        ]}
                        onPress={() => setOrdenMesas('horario')}
                      >
                        <Text style={[
                          styles.ordenamientoTexto,
                          ordenMesas === 'horario' && styles.ordenamientoTextoActivo
                        ]}>
                          Por Cierre
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[
                          styles.ordenamientoBoton,
                          ordenMesas === 'total' && styles.ordenamientoBotonActivo
                        ]}
                        onPress={() => setOrdenMesas('total')}
                      >
                        <Text style={[
                          styles.ordenamientoTexto,
                          ordenMesas === 'total' && styles.ordenamientoTextoActivo
                        ]}>
                          Por Total
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <Text style={styles.mesasSubtitulo}>
                    Ordenadas por {ordenMesas === 'horario' ? 'hora de cierre más reciente' : 'mayor total de ventas'}
                  </Text>
                  
                  <ScrollView 
                    style={[
                      styles.mesasLista, 
                      mostrarResumenMesas ? styles.mesasListaExpandida : styles.mesasListaColapsada
                    ]} 
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={false}
                  >
                    {(mostrarResumenMesas ? resumenPorMesa : resumenPorMesa.slice(0, 5)).map((mesa, i) => (
                      <View key={mesa.mesa} style={styles.mesaItemMejorada}>
                        <TouchableOpacity 
                          style={styles.mesaHeader}
                          onPress={() => setMesaExpandida(mesaExpandida === mesa.mesa ? null : mesa.mesa)}
                        >
                          <View style={styles.mesaIconContainer}>
                            <Ionicons 
                              name="restaurant-outline" 
                              size={20} 
                              color="#4a6ee0" 
                            />
                            <Text style={styles.mesaNumero}>{mesa.mesa}</Text>
                          </View>
                          
                          <View style={styles.mesaInfoPrincipal}>
                            <View style={styles.mesaTotalContainer}>
                              <Text style={styles.mesaTotalCerrada}>
                                ${mesa.totalMesa.toLocaleString()}
                              </Text>
                              <Text style={styles.mesaOrdenes}>
                                {mesa.numeroOrdenes} orden{mesa.numeroOrdenes !== 1 ? 'es' : ''}
                              </Text>
                            </View>
                            
                            <View style={styles.mesaCierreContainer}>
                              <Ionicons name="time-outline" size={14} color="#4a6ee0" />
                              <Text style={styles.mesaHoraCierre}>
                                Cierre: {formatearHora(mesa.horaCierre)}
                              </Text>
                            </View>
                          </View>
                          
                          <Ionicons 
                            name={mesaExpandida === mesa.mesa ? "chevron-up" : "chevron-down"} 
                            size={20} 
                            color="#666" 
                          />
                        </TouchableOpacity>
                        
                        {mesaExpandida === mesa.mesa && (
                          <View style={styles.mesaDetalles}>
                            {/* ✅ TOGGLE ENTRE VISTA RESUMEN Y ÓRDENES INDIVIDUALES */}
                            <View style={styles.vistaToggleContainer}>
                              <TouchableOpacity
                                style={[
                                  styles.vistaToggleBoton,
                                  !vistaDetallada && styles.vistaToggleBotonActivo
                                ]}
                                onPress={() => setVistaDetallada(false)}
                              >
                                <Ionicons 
                                  name="stats-chart" 
                                  size={14} 
                                  color={!vistaDetallada ? "#fff" : "#666"} 
                                />
                                <Text style={[
                                  styles.vistaToggleTexto,
                                  !vistaDetallada && styles.vistaToggleTextoActivo
                                ]}>
                                  Resumen
                                </Text>
                              </TouchableOpacity>
                              
                              <TouchableOpacity
                                style={[
                                  styles.vistaToggleBoton,
                                  vistaDetallada && styles.vistaToggleBotonActivo
                                ]}
                                onPress={() => setVistaDetallada(true)}
                              >
                                <Ionicons 
                                  name="list-outline" 
                                  size={14} 
                                  color={vistaDetallada ? "#fff" : "#666"} 
                                />
                                <Text style={[
                                  styles.vistaToggleTexto,
                                  vistaDetallada && styles.vistaToggleTextoActivo
                                ]}>
                                  Órdenes ({mesa.ordenes.length})
                                </Text>
                              </TouchableOpacity>
                            </View>
                            
                            {!vistaDetallada ? (
                              // VISTA RESUMEN - PRODUCTOS AGRUPADOS
                              <View style={styles.mesaProductosContainer}>
                                <Text style={styles.mesaProductosTitulo}>
                                  <Ionicons name="list-outline" size={16} color="#666" />
                                  {" "}Productos vendidos ({mesa.productosArray.length})
                                </Text>
                                
                                <ScrollView 
                                  style={styles.mesaProductosLista}
                                  nestedScrollEnabled={true}
                                  showsVerticalScrollIndicator={false}
                                >
                                  {mesa.productosArray.map((producto, index) => (
                                    <View key={index} style={styles.mesaProductoItem}>
                                      <View style={styles.mesaProductoInfo}>
                                        <Text style={styles.mesaProductoNombre} numberOfLines={1}>
                                          {producto.nombre}
                                        </Text>
                                        <View style={styles.mesaProductoStats}>
                                          <Text style={styles.mesaProductoCantidad}>
                                            x{producto.cantidad}
                                          </Text>
                                          <Text style={styles.mesaProductoSubtotal}>
                                            ${producto.subtotal.toLocaleString()}
                                          </Text>
                                        </View>
                                      </View>
                                    </View>
                                  ))}
                                </ScrollView>
                              </View>
							):(
                              // ✅ VISTA DETALLADA - ÓRDENES INDIVIDUALES
                              <View style={styles.mesaOrdenesContainer}>
                                <Text style={styles.mesaOrdenesTitulo}>
                                  <Ionicons name="receipt-outline" size={16} color="#666" />
                                  {" "}Órdenes individuales ({mesa.ordenes.length})
                                </Text>
                                
                                <ScrollView 
                                  style={styles.mesaOrdenesLista}
                                  nestedScrollEnabled={true}
                                  showsVerticalScrollIndicator={false}
                                >
                                  {mesa.ordenes.map((orden, index) => (
                                    <View key={orden.id} style={styles.ordenItem}>
                                      <TouchableOpacity 
                                        style={styles.ordenHeader}
                                        onPress={() => setOrdenExpandida(
                                          ordenExpandida === orden.id ? null : orden.id
                                        )}
                                      >
                                        <View style={styles.ordenNumeroContainer}>
                                          <Text style={styles.ordenNumero}>#{orden.numero_orden || index + 1}</Text>
                                          <View style={[
                                            styles.ordenEstadoBadge,
                                            orden.estado === 'completada' && styles.ordenEstadoCompletada
                                          ]}>
                                            <Text style={styles.ordenEstadoTexto}>
                                              {orden.estado || 'completada'}
                                            </Text>
                                          </View>
                                        </View>
                                        
                                        <View style={styles.ordenInfoPrincipal}>
                                          <View style={styles.ordenTotalContainer}>
                                            <Text style={styles.ordenTotal}>
                                              ${orden.total.toLocaleString()}
                                            </Text>
                                            <Text style={styles.ordenItemsCount}>
                                              {orden.items.length} items
                                            </Text>
                                          </View>
                                          
                                          <View style={styles.ordenHorarioContainer}>
                                            <Ionicons name="time-outline" size={12} color="#4a6ee0" />
                                            <Text style={styles.ordenHoraCierre}>
                                              {formatearHora(orden.fecha)}
                                            </Text>
                                            {orden.metodo_pago && (
                                              <>
                                                <Ionicons name="card-outline" size={12} color="#666" style={{marginLeft: 8}} />
                                                <Text style={styles.ordenMetodoPago}>
                                                  {orden.metodo_pago}
                                                </Text>
                                              </>
                                            )}
                                          </View>
                                        </View>
                                        
                                        <Ionicons 
                                          name={ordenExpandida === orden.id ? "chevron-up" : "chevron-down"} 
                                          size={16} 
                                          color="#666" 
                                        />
                                      </TouchableOpacity>
                                      
                                      {ordenExpandida === orden.id && (
                                        <View style={styles.ordenDetalles}>
                                          <Text style={styles.ordenProductosTitulo}>
                                            Productos de esta orden:
                                          </Text>
                                          
                                          {orden.items.map((item, itemIndex) => (
                                            <View key={itemIndex} style={styles.ordenProductoItem}>
                                              <View style={styles.ordenProductoInfo}>
                                                <Text style={styles.ordenProductoNombre}>
                                                  {item.nombre}
                                                </Text>
                                                <View style={styles.ordenProductoStats}>
                                                  <Text style={styles.ordenProductoCantidad}>
                                                    x{item.cantidad}
                                                  </Text>
                                                  <Text style={styles.ordenProductoPrecio}>
                                                    ${item.precio?.toLocaleString() || 0}
                                                  </Text>
                                                  <Text style={styles.ordenProductoSubtotal}>
                                                    ${((item.precio || 0) * (item.cantidad || 0)).toLocaleString()}
                                                  </Text>
                                                </View>
                                              </View>
                                            </View>
                                          ))}
                                          
                                          {orden.observaciones && (
                                            <View style={styles.ordenObservaciones}>
                                              <Text style={styles.ordenObservacionesLabel}>
                                                <Ionicons name="chatbubble-outline" size={12} color="#666" />
                                                {" "}Observaciones:
                                              </Text>
                                              <Text style={styles.ordenObservacionesTexto}>
                                                {orden.observaciones}
                                              </Text>
                                            </View>
                                          )}
                                          
                                          <View style={styles.ordenResumenFinal}>
                                            <Text style={styles.ordenResumenTexto}>
                                              Total de la orden: ${orden.total.toLocaleString()}
                                            </Text>
                                            <Text style={styles.ordenResumenFecha}>
                                              Fecha completa: {new Date(orden.fecha).toLocaleString('es-ES')}
                                            </Text>
                                          </View>
                                        </View>
                                      )}
                                    </View>
                                  ))}
                                </ScrollView>
                              </View>
                            )}
                            
                            <View style={styles.mesaHorariosDetalle}>
                              <View style={styles.mesaHorarioItem}>
                                <Ionicons name="play-outline" size={14} color="#28a745" />
                                <Text style={styles.mesaHorarioTexto}>
                                  Primera orden: {formatearHora(mesa.horaApertura)}
                                </Text>
                              </View>
                              <View style={styles.mesaHorarioItem}>
                                <Ionicons name="stop-outline" size={14} color="#dc3545" />
                                <Text style={styles.mesaHorarioTexto}>
                                  Última orden: {formatearHora(mesa.horaCierre)}
                                </Text>
                              </View>
                            </View>
                          </View>
                        )}
                      </View>
                    ))}
                  </ScrollView>
                  
                  {resumenPorMesa.length > 5 && (
                    <TouchableOpacity
                      style={styles.verTodosBoton}
                      onPress={() => setMostrarResumenMesas(!mostrarResumenMesas)}
                    >
                      <Text style={styles.verTodosTexto}>
                        {mostrarResumenMesas 
                          ? `Mostrar menos (${resumenPorMesa.length} mesas total)`
                          : `Ver todas las mesas (${resumenPorMesa.length - 5} más)`
                        }
                      </Text>
                      <Ionicons 
                        name={mostrarResumenMesas ? "chevron-up" : "chevron-down"} 
                        size={16} 
                        color="#4a6ee0" 
                      />
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* PRODUCTOS VENDIDOS (sin cambios) */}
              {resumenProductos.length > 0 && (
                <View style={styles.productosResumen}>
                  <View style={styles.productosHeader}>
                    <Text style={styles.productosResumenTitulo}>
                      <Ionicons name="list" size={18} color="#555" /> 
                      Productos Vendidos ({resumenProductos.length})
                    </Text>
                    
                    <View style={styles.ordenamientoContainer}>
                      <TouchableOpacity
                        style={[
                          styles.ordenamientoBoton,
                          ordenProductos === 'cantidad' && styles.ordenamientoBotonActivo
                        ]}
                        onPress={() => setOrdenProductos('cantidad')}
                      >
                        <Text style={[
                          styles.ordenamientoTexto,
                          ordenProductos === 'cantidad' && styles.ordenamientoTextoActivo
                        ]}>
                          Por Cantidad
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[
                          styles.ordenamientoBoton,
                          ordenProductos === 'ingresos' && styles.ordenamientoBotonActivo
                        ]}
                        onPress={() => setOrdenProductos('ingresos')}
                      >
                        <Text style={[
                          styles.ordenamientoTexto,
                          ordenProductos === 'ingresos' && styles.ordenamientoTextoActivo
                        ]}>
                          Por Ingresos
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <Text style={styles.productosSubtitulo}>
                    Ordenados por {ordenProductos === 'cantidad' ? 'mayor cantidad vendida' : 'mayores ingresos'}
                  </Text>
                  
                  <ScrollView 
                    style={[
                      styles.productosLista, 
                      mostrarTodosProductos ? styles.productosListaExpandida : styles.productosListaColapsada
                    ]} 
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={false}
                  >
                    {(mostrarTodosProductos ? resumenProductos : resumenProductos.slice(0, 10)).map((item, i) => (
                      <View key={i} style={styles.productoItem}>
                        <View style={[
                          styles.productoRanking,
                          i < 3 && styles[`productoRanking${i + 1}`]
                        ]}>
                          <Text style={[
                            styles.productoNumero,
                            i < 3 && styles.productoNumeroTop
                          ]}>
                            {i + 1}
                          </Text>
                        </View>
                        
                        <View style={styles.productoInfo}>
                          <Text style={styles.productoNombre} numberOfLines={2}>
                            {item.nombre}
                          </Text>
                          
                          <View style={styles.productoStats}>
                            <View style={styles.productoStat}>
                              <Ionicons name="layers-outline" size={14} color="#666" />
                              <Text style={styles.productoCantidad}>x{item.cantidad}</Text>
                            </View>
                            
                            <View style={styles.productoStat}>
                              <Ionicons name="cash-outline" size={14} color="#4a6ee0" />
                              <Text style={styles.productoSubtotal}>
                                ${item.subtotal.toLocaleString()}
                              </Text>
                            </View>
                          </View>
                        </View>
                        
                        {i < 3 && (
                          <View style={styles.topBadge}>
                            <Ionicons 
                              name={i === 0 ? "trophy" : i === 1 ? "medal" : "ribbon"} 
                              size={16} 
                              color={i === 0 ? "#FFD700" : i === 1 ? "#C0C0C0" : "#CD7F32"} 
                            />
                          </View>
                        )}
                      </View>
                    ))}
                  </ScrollView>
                  
                  {resumenProductos.length > 10 && (
                    <TouchableOpacity
                      style={styles.verTodosBoton}
                      onPress={() => setMostrarTodosProductos(!mostrarTodosProductos)}
                    >
                      <Text style={styles.verTodosTexto}>
                        {mostrarTodosProductos 
                          ? `Mostrar menos (${resumenProductos.length} productos total)`
                          : `Ver todos los productos (${resumenProductos.length - 10} más)`
                        }
                      </Text>
                      <Ionicons 
                        name={mostrarTodosProductos ? "chevron-up" : "chevron-down"} 
                        size={16} 
                        color="#4a6ee0" 
                      />
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
 
   const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 20,
  },
  scrollContainer: {
    padding: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#555",
    textAlign: "center",
  },
  
  // Header
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titulo: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  offlineText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#e67e22',
    fontWeight: '500',
  },
  
  // Sync status
  syncStatus: {
    backgroundColor: '#d4edda',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
  },
  syncStatusText: {
    fontSize: 14,
    color: '#155724',
    fontWeight: '500',
  },
  
  // Filtros
  filtrosContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  filtrosTitulo: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 14,
  },
  filtroSeccion: {
    marginBottom: 16,
  },
  filtroLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 6,
    color: "#555",
  },
  
  // Pickers
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
    overflow: "hidden",
  },
  picker: {
    height: 50,
  },
  customPicker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 50,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
  },
  pickerText: {
    fontSize: 16,
    color: "#333",
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  pickerModalContent: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    width: "80%",
    maxHeight: "60%",
    alignSelf: "center",
    elevation: 5,
  },
  pickerModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
    color: "#2c3e50",
  },
  opcion: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    borderRadius: 5,
    marginBottom: 5,
  },
  opcionSeleccionada: {
    backgroundColor: "#4a6ee0",
  },
  opcionTexto: {
    fontSize: 16,
    color: "#333",
  },
  opcionTextoSeleccionado: {
    color: "#fff",
    fontWeight: "bold",
  },
  
  // Fechas
  fechasContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  fechaSelector: {
    flex: 1,
    marginRight: 10,
  },
  fechaLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 6,
    color: "#555",
  },
  fechaButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
    padding: 12,
  },
  fechaButtonText: {
    fontSize: 14,
    color: "#333",
  },
  
  // Botones
  botonesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  botonPrimario: {
    backgroundColor: "#4a6ee0",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    flex: 2,
  },
  botonTexto: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
    marginRight: 8,
  },
  botonSecundario: {
    backgroundColor: "#f1f2f6",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginRight: 12,
    flexDirection: "row",
    justifyContent: "center",
    flex: 1,
  },
  botonSecundarioTexto: {
    color: "#555",
    fontWeight: "600",
    fontSize: 16,
    marginRight: 8,
  },
  botonExportar: {
    backgroundColor: "#27ae60",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  botonExportarTexto: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
    marginLeft: 8,
  },
  
  // Resultados
  resultadosContainer: {
    marginBottom: 20,
  },
  resultadosHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  resultadosTitulo: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2c3e50",
  },
  badgeContainer: {
    backgroundColor: "#e0e6ff",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 10,
  },
  badgeText: {
    color: "#4a6ee0",
    fontWeight: "bold",
    fontSize: 14,
  },
  
  // Empty state
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 40,
    marginBottom: 10,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 18,
    color: "#555",
    fontWeight: "500",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 4,
  },
  
  // Estadísticas
  estadisticasContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    overflow: "hidden",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  totalCard: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  totalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#555",
    marginLeft: 8,
  },
  totalValor: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#4a6ee0",
    marginBottom: 12,
  },
  estadisticasResumen: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  estatItem: {
    alignItems: 'center',
  },
  estatLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  estatValor: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },

  // ✅ NUEVOS ESTILOS PARA RESUMEN POR MESA
  mesasResumen: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  mesasHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  mesasResumenTitulo: {
    fontSize: 16,
    fontWeight: "500",
    color: "#555",
    marginBottom: 5,
  },
  mesasSubtitulo: {
    fontSize: 12,
    color: "#888",
    marginBottom: 15,
    fontStyle: "italic",
  },
  ordenamientoContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    padding: 2,
  },
  ordenamientoBoton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    marginHorizontal: 2,
  },
  ordenamientoBotonActivo: {
    backgroundColor: '#4a6ee0',
  },
  ordenamientoTexto: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  ordenamientoTextoActivo: {
    color: '#fff',
  },
  mesasLista: {
    maxHeight: 400,
  },
  mesasListaExpandida: {
    maxHeight: 600,
  },
  mesasListaColapsada: {
    maxHeight: 400,
  },
  mesaItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f1f1",
    position: 'relative',
  },
  mesaIconContainer: {
    alignItems: 'center',
    marginRight: 12,
    minWidth: 60,
  },
  mesaNumero: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#4a6ee0",
    marginTop: 2,
    textAlign: 'center',
  },
  mesaInfo: {
    flex: 1,
    paddingRight: 10,
  },
  mesaStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  mesaStat: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mesaTotal: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4a6ee0",
    marginLeft: 4,
  },
  mesaOrdenes: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
    marginLeft: 4,
  },
  mesaItems: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
    marginLeft: 4,
  },
  mesaHorarios: {
    marginTop: 4,
  },
  mesaHorario: {
    fontSize: 11,
    color: "#888",
    marginBottom: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  mesaPromedio: {
    alignItems: 'center',
    minWidth: 70,
  },
  mesaPromedioLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
  },
  mesaPromedioValor: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  
  // Productos - ESTILOS MEJORADOS
  productosResumen: {
    padding: 20,
  },
  productosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  productosResumenTitulo: {
    fontSize: 16,
    fontWeight: "500",
    color: "#555",
    marginBottom: 5,
  },
  productosSubtitulo: {
    fontSize: 12,
    color: "#888",
    marginBottom: 15,
    fontStyle: "italic",
  },
  productosLista: {
    maxHeight: 400,
  },
  productosListaExpandida: {
    maxHeight: 600,
  },
  productosListaColapsada: {
    maxHeight: 400,
  },
  productoItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f1f1",
    position: 'relative',
  },
  productoRanking: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#e0e6ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  productoRanking1: {
    backgroundColor: "#FFD700",
  },
  productoRanking2: {
    backgroundColor: "#C0C0C0",
  },
  productoRanking3: {
    backgroundColor: "#CD7F32",
  },
  productoNumero: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#4a6ee0",
  },
  productoNumeroTop: {
    color: "#fff",
  },
  productoInfo: {
    flex: 1,
    paddingRight: 10,
  },
  productoNombre: {
    fontSize: 15,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  productoStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productoStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productoCantidad: {
    fontSize: 14,
    color: "#777",
    fontWeight: "600",
    marginLeft: 4,
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  productoSubtotal: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4a6ee0",
    marginLeft: 4,
  },
  topBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 4,
  },
  verTodosBoton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  verTodosTexto: {
    fontSize: 14,
    color: '#4a6ee0',
    fontWeight: '500',
    marginRight: 8,
  },
});