// components/Pedidos.js - VERSION CORREGIDA CON SEPARACIÓN DE PLATOS ESPECIALES
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ApiService from "../services/ApiService";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Dimensions,
  Platform,
  Alert,
  ActivityIndicator,
  StatusBar,
  Image,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Picker } from "@react-native-picker/picker";

const listaMesas = ["Mesa 1", "Mesa 2", "Mesa 3", "Mesa 4", "Mesa 5"];
const windowWidth = Dimensions.get("window").width;

export default function Pedidos({ 
  pedidos = {}, 
  setPedidos, 
  menu = [], 
  platosEspeciales = [],
  setVentas,
  ventas = [] 
}) {
  const insets = useSafeAreaInsets();
  
  // Estados principales
  const [mesaActual, setMesaActual] = useState("Mesa 1");
  const [modalVisible, setModalVisible] = useState(false);
  const [fechaResumen, setFechaResumen] = useState("");
  const [mostrarSelectorMesa, setMostrarSelectorMesa] = useState(false);
  const [guardandoVenta, setGuardandoVenta] = useState(false);
  
  // ✅ NUEVOS ESTADOS PARA CATEGORÍAS DINÁMICAS
  const [categoriasDisponibles, setCategoriasDisponibles] = useState([]);
  const [loadingCategorias, setLoadingCategorias] = useState(false);

  // ✅ FUNCIÓN DE FORMATEO DE PRECIOS CORREGIDA PARA PEDIDOS
  const formatearPrecio = React.useCallback((precio) => {    
    // Manejar casos null/undefined/empty
    if (precio === 0 || precio === null || precio === undefined) {
      // Solo logear si es un error real, no si es un precio válido de 0
      if (precio === null || precio === undefined) {
        console.warn('⚠️ PEDIDOS - Precio null/undefined, usando $0');
      }
      return '$0';
    }
    
    // Convertir a número de forma robusta
    let numeroLimpio;
    
    if (typeof precio === 'string') {
      numeroLimpio = parseFloat(precio.replace(/[^\d.-]/g, ''));
    } else if (typeof precio === 'number') {
      numeroLimpio = precio;
    } else {
      return '$0';
    }
    
    // Verificar que sea un número válido
    if (isNaN(numeroLimpio) || numeroLimpio < 0) {
      return '$0';
    }
    
    // ✅ FORMATEO ROBUSTO QUE FUNCIONA EN ANDROID E iOS
    try {
      if (Platform.OS === 'android') {
        // Formato manual para Android (más confiable)
        const numeroRedondeado = Math.round(numeroLimpio);
        const numeroFormateado = numeroRedondeado.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        return `$${numeroFormateado}`;
      } else {
        // iOS puede usar toLocaleString
        return numeroLimpio.toLocaleString('es-CO', {
          style: 'currency',
          currency: 'COP',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        });
      }
    } catch (error) {
      // Fallback simple
      const numeroRedondeado = Math.round(numeroLimpio);
      return `$${numeroRedondeado.toLocaleString()}`;
    }
  }, []);

  // ✅ CARGAR CATEGORÍAS DESDE LA BASE DE DATOS
  const cargarCategoriasDesdeDB = useCallback(async () => {
    try {
      setLoadingCategorias(true);
      console.log('📂 Cargando categorías desde la base de datos...');
      
      const response = await ApiService.getCategorias();
      const categoriasArray = Array.isArray(response) ? response : [];
      
      // ✅ FILTRAR "PLATOS ESPECIALES" - SE MANEJAN POR SEPARADO
      const categoriasFiltradas = categoriasArray.filter(categoria => {
        const nombre = categoria.nombre.toLowerCase();
        return !nombre.includes('especial') && 
               !nombre.includes('special') && 
               nombre !== 'platos especiales';
      });
      
      console.log('✅ Categorías cargadas para pedidos (sin especiales):', categoriasFiltradas);
      setCategoriasDisponibles(categoriasFiltradas);
      
    } catch (error) {
      console.error('❌ Error cargando categorías:', error);
      // Fallback con categorías hardcodeadas (SIN platos especiales)
      const categoriasFallback = [
        { id: 1, nombre: 'Entradas' },
        { id: 2, nombre: 'Platos Principales' },
        { id: 3, nombre: 'Postres' },
        { id: 4, nombre: 'Bebidas' },
        { id: 5, nombre: 'Pizzas' }
      ];
      setCategoriasDisponibles(categoriasFallback);
    } finally {
      setLoadingCategorias(false);
    }
  }, []);

  // ✅ FUNCIÓN PARA OBTENER NOMBRE DE CATEGORÍA POR ID
  const getNombreCategoriaById = useCallback((categoriaId) => {
    const categoria = categoriasDisponibles.find(cat => cat.id === categoriaId);
    return categoria ? categoria.nombre : 'Sin Categoría';
  }, [categoriasDisponibles]);

  // ✅ CARGAR CATEGORÍAS AL INICIAR
  useEffect(() => {
    cargarCategoriasDesdeDB();
  }, [cargarCategoriasDesdeDB]);

  // DEBUG Y VERIFICACION SEGURA DE DATOS
  useEffect(() => {
    console.log('🔍 DEBUG PEDIDOS - Props recibidas:', {
      menu_length: menu?.length || 0,
      menu_type: typeof menu,
      menu_is_array: Array.isArray(menu),
      platosEspeciales_length: platosEspeciales?.length || 0,
      platosEspeciales_type: typeof platosEspeciales,
      platosEspeciales_is_array: Array.isArray(platosEspeciales),
      ventas_length: ventas?.length || 0,
      categorias_length: categoriasDisponibles?.length || 0
    });

    // Verificar estructura del menu con precios
    if (Array.isArray(menu) && menu.length > 0) {
      console.log('🔍 Primer item del menu:', {
        id: menu[0]?.id,
        nombre: menu[0]?.nombre,
        categoria: menu[0]?.categoria,
        categoria_id: menu[0]?.categoria_id,
        disponible: menu[0]?.disponible,
        precio: menu[0]?.precio,
        precio_tipo: typeof menu[0]?.precio,
        precio_formateado: formatearPrecio(menu[0]?.precio),
        imagen_url: menu[0]?.imagen_url || menu[0]?.imagen
      });
    }
  }, [menu, platosEspeciales, ventas, formatearPrecio, categoriasDisponibles]);

  // ✅ FILTRADO DINÁMICO DE PRODUCTOS POR CATEGORÍA
  const filtrarProductosPorCategoria = useCallback((nombreCategoria) => {
    if (!Array.isArray(menu)) {
      console.warn('⚠️ Menu no es un array en filtrarProductosPorCategoria');
      return [];
    }

    return menu.filter((producto) => {
      if (!producto || typeof producto !== 'object') {
        console.warn('⚠️ Producto invalido encontrado:', producto);
        return false;
      }

      // Obtener la categoría del producto
      let categoriaProducto = '';
      if (producto.categoria_id) {
        categoriaProducto = getNombreCategoriaById(producto.categoria_id);
      } else if (producto.categoria) {
        categoriaProducto = producto.categoria;
      } else if (producto.categoria_nombre) {
        categoriaProducto = producto.categoria_nombre;
      }

      const estaDisponible = producto.disponible !== false;
      const coincideCategoria = categoriaProducto === nombreCategoria;

      // ✅ EXCLUIR productos que sean "platos especiales"
      const esEspecial = categoriaProducto.toLowerCase().includes('especial') || 
                        categoriaProducto.toLowerCase().includes('special') ||
                        categoriaProducto.toLowerCase() === 'platos especiales' ||
                        producto.es_especial === true;

      return estaDisponible && coincideCategoria && !esEspecial;
    });
  }, [menu, getNombreCategoriaById]);

  // ✅ PRODUCTOS FILTRADOS DE FORMA DINÁMICA
  const productosPorCategoria = useMemo(() => {
    const resultado = {};
    
    categoriasDisponibles.forEach(categoria => {
      const productos = filtrarProductosPorCategoria(categoria.nombre);
      const key = categoria.nombre.toLowerCase().replace(/\s+/g, '');
      resultado[key] = productos;
    });

    return resultado;
  }, [categoriasDisponibles, filtrarProductosPorCategoria]);

  // PLATOS ESPECIALES FILTRADOS DE FORMA SEGURA
  const especialesDisponibles = React.useMemo(() => {
    if (!Array.isArray(platosEspeciales)) {
      console.warn('⚠️ platosEspeciales no es un array:', typeof platosEspeciales);
      return [];
    }

    return platosEspeciales.filter((plato) => {
      if (!plato || typeof plato !== 'object') {
        console.warn('⚠️ Plato especial invalido:', plato);
        return false;
      }

      return plato.disponible !== false;
    });
  }, [platosEspeciales]);

  // ✅ FUNCIÓN CORREGIDA PARA AGREGAR PRODUCTO AL PEDIDO
  const agregarPedido = (producto, esProductoEspecial = false) => {
    // Verificar que el producto existe y tiene datos validos
    if (!producto || typeof producto !== 'object') {
      console.error('❌ Producto invalido recibido:', producto);
      Alert.alert('Error', 'Producto invalido seleccionado');
      return;
    }

    // Verificar datos criticos del producto
    if (!producto.id || !producto.nombre || producto.precio === undefined || producto.precio === null) {
      console.error('❌ Producto con datos incompletos:', {
        id: producto.id,
        nombre: producto.nombre,
        precio: producto.precio,
        categoria: producto.categoria
      });
      Alert.alert('Error', 'El producto seleccionado tiene datos incompletos');
      return;
    }

    // ✅ DETERMINAR SI ES PLATO ESPECIAL
    const esEspecial = esProductoEspecial || 
                      producto.categoria === 'Especial' || 
                      producto.es_especial === true ||
                      producto.categoria?.toLowerCase().includes('especial');

    console.log('✅ Agregando producto valido:', {
      id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      precio_formateado: formatearPrecio(producto.precio),
      categoria: producto.categoria || 'Sin categoria',
      es_especial: esEspecial
    });

    setPedidos((prev) => {
      const mesaPedidos = prev[mesaActual] || [];
      
      // ✅ BUSCAR EXISTENTE: DEBE COINCIDIR ID Y TIPO (especial/regular)
      const existente = mesaPedidos.find((p) => 
        p.id === producto.id && p.es_especial === esEspecial
      );
      
      let nuevosPedidos;
      
      if (existente) {
        // Incrementar cantidad si ya existe el mismo producto del mismo tipo
        nuevosPedidos = mesaPedidos.map((p) =>
          p.id === producto.id && p.es_especial === esEspecial 
            ? { ...p, cantidad: p.cantidad + 1 } 
            : p
        );
        console.log(`➕ Incrementada cantidad de ${producto.nombre} (${esEspecial ? 'Especial' : 'Regular'}) a ${existente.cantidad + 1}`);
      } else {
        // ✅ CREAR NUEVO PRODUCTO EN EL PEDIDO CON PRECIO NORMALIZADO
        const precioNormalizado = parseFloat(producto.precio) || 0;
        
        const productoCompleto = {
          id: producto.id,
          nombre: producto.nombre,
          precio: precioNormalizado, // ✅ PRECIO COMO NÚMERO
          categoria: producto.categoria || producto.categoria_nombre || getNombreCategoriaById(producto.categoria_id) || 'Sin categoria',
          descripcion: producto.descripcion || '',
          disponible: producto.disponible !== false,
          vegetariano: Boolean(producto.vegetariano),
          picante: Boolean(producto.picante),
          imagen_url: producto.imagen_url || producto.imagen || null,
          cantidad: 1,
          es_especial: esEspecial // ✅ MARCAR SI ES ESPECIAL
        };
        
        nuevosPedidos = [...mesaPedidos, productoCompleto];
        console.log('✅ Producto agregado al pedido:', {
          nombre: productoCompleto.nombre,
          precio: productoCompleto.precio,
          precio_formateado: formatearPrecio(productoCompleto.precio),
          tipo: esEspecial ? 'Especial' : 'Regular'
        });
      }
      
      return { ...prev, [mesaActual]: nuevosPedidos };
    });
  };

  // ✅ FUNCIONES CORREGIDAS CON PARÁMETRO esEspecial
  const descontarUnidad = (productoId, esEspecial) => {
    setPedidos((prev) => {
      const pedidosMesa = (prev[mesaActual] || [])
        .map((p) => {
          if (p.id === productoId && p.es_especial === esEspecial) {
            return { ...p, cantidad: p.cantidad - 1 };
          }
          return p;
        })
        .filter((p) => p.cantidad > 0);
      return { ...prev, [mesaActual]: pedidosMesa };
    });
  };

  const aumentarUnidad = (productoId, esEspecial) => {
    setPedidos((prev) => {
      const pedidosMesa = prev[mesaActual] || [];
      const nuevosPedidos = pedidosMesa.map((p) => {
        if (p.id === productoId && p.es_especial === esEspecial) {
          return { ...p, cantidad: p.cantidad + 1 };
        }
        return p;
      });
      return { ...prev, [mesaActual]: nuevosPedidos };
    });
  };

  const eliminarPedido = (id, esEspecial) => {
    setPedidos((prev) => {
      const nuevos = (prev[mesaActual] || []).filter((p) => 
        !(p.id === id && p.es_especial === esEspecial)
      );
      return { ...prev, [mesaActual]: nuevos };
    });
  };

  const cerrarMesa = () => {
    const pedidosMesa = pedidos[mesaActual] || [];
    if (pedidosMesa.length === 0) {
      Alert.alert("Mesa vacia", "No hay pedidos para esta mesa.");
      return;
    }

    setFechaResumen(new Date().toLocaleString());
    setModalVisible(true);
  };

  const confirmarCerrarMesa = async () => {
    const pedidosMesa = pedidos[mesaActual] || [];

    console.log('💰 Cerrando mesa:', {
      mesa: mesaActual,
      total_pedidos: pedidosMesa.length
    });

    // VALIDACION ESTRICTA DE PRODUCTOS
    const productosValidos = pedidosMesa.filter((p) => {
      const esValido = p?.id && 
                     p?.nombre && 
                     typeof p?.precio === 'number' && 
                     p?.precio > 0 && 
                     typeof p?.cantidad === 'number' && 
                     p?.cantidad > 0;
      
      if (!esValido) {
        console.warn('⚠️ Producto invalido encontrado en pedido:', p);
      }
      
      return esValido;
    });

    if (productosValidos.length === 0) {
      Alert.alert("Error", "No hay productos validos para guardar.");
      return;
    }

    const total = productosValidos.reduce(
      (sum, item) => sum + (item.precio * item.cantidad),
      0
    );
    const cantidadTotal = productosValidos.reduce(
      (sum, item) => sum + item.cantidad,
      0
    );

    const fechaActual = new Date();
    
    // PREPARAR ITEMS PARA EL BACKEND DE FORMA SEGURA
    const itemsParaBackend = productosValidos.map(item => {
      const esEspecial = item.categoria === 'Especial' || item.es_especial === true;
      
      return {
        id: parseInt(item.id),
        nombre: item.nombre,
        precio: parseFloat(item.precio),
        cantidad: parseInt(item.cantidad),
        categoria: item.categoria || 'Sin categoria',
        es_plato_especial: esEspecial
      };
    });

    // CREAR OBJETO DE VENTA SEGURO
    const nuevaVenta = {
      id: Date.now().toString(),
      mesa: mesaActual,
      items: productosValidos,
      total: Math.round(total * 100) / 100, // Redondear a 2 decimales
      cantidadItems: cantidadTotal,
      fecha: fechaActual.toISOString(),
      estado: 'completada',
      metodo_pago: 'efectivo'
    };

    setGuardandoVenta(true);

    try {
      // Intentar guardar en backend
      try {
        const requestData = {
          mesa: mesaActual,
          items: itemsParaBackend,
          total: total,
          metodo_pago: 'efectivo'
        };
        
        console.log('📤 Enviando al backend:', {
          mesa: requestData.mesa,
          items_count: requestData.items.length,
          total: formatearPrecio(requestData.total)
        });
        
        const ventaBackend = await ApiService.request('/ordenes', {
          method: 'POST',
          body: JSON.stringify(requestData),
        });
        
        console.log('✅ Venta guardada en backend:', ventaBackend);
        
        // Guardar tambien local como backup
        await guardarVentaLocal(nuevaVenta);
        
        // Limpiar pedidos
        setPedidos((prev) => {
          const nuevo = { ...prev };
          delete nuevo[mesaActual];
          return nuevo;
        });

        setModalVisible(false);
        setGuardandoVenta(false);
        
        Alert.alert(
          "✅ Mesa cerrada exitosamente", 
          `Total: ${formatearPrecio(total)}\nItems: ${cantidadTotal}`,
          [{ text: "OK", style: "default" }]
        );
        
        return;
        
      } catch (backendError) {
        console.log('⚠️ Error guardando en backend:', backendError.message);
        
        // Si falla el backend, guardar localmente
        await guardarVentaLocal(nuevaVenta);
        
        // Limpiar pedidos
        setPedidos((prev) => {
          const nuevo = { ...prev };
          delete nuevo[mesaActual];
          return nuevo;
        });

        setModalVisible(false);
        setGuardandoVenta(false);
        
        Alert.alert(
          "💾 Mesa cerrada (modo offline)", 
          `Venta guardada localmente.\nTotal: ${formatearPrecio(total)}\nItems: ${cantidadTotal}`,
          [{ text: "OK", style: "default" }]
        );
      }
      
    } catch (error) {
      console.error("❌ Error general guardando venta:", error);
      setGuardandoVenta(false);
      Alert.alert(
        "Error", 
        "No se pudo guardar la venta. Intenta nuevamente.",
        [{ text: "OK", style: "destructive" }]
      );
    }
  };

  const guardarVentaLocal = async (nuevaVenta) => {
    try {
      // Cargar ventas actuales
      const ventasGuardadas = await AsyncStorage.getItem("ventas");
      const ventasActuales = ventasGuardadas ? JSON.parse(ventasGuardadas) : [];
      
      // Anadir la nueva venta
      ventasActuales.push(nuevaVenta);
      
      // Guardar ventas actualizadas
      await AsyncStorage.setItem("ventas", JSON.stringify(ventasActuales));
      
      // Actualizar el estado de ventas
      if (typeof setVentas === 'function') {
        setVentas(ventasActuales);
      }
      
      console.log("💾 Venta guardada localmente");
      
    } catch (error) {
      console.error("❌ Error guardando venta local:", error);
      throw error;
    }
  };

  // ✅ CALCULOS SEGUROS PARA TOTALES CON FORMATEO CORRECTO
  const totalMesa = (pedidos[mesaActual] || []).reduce(
    (acc, p) => {
      const precio = typeof p?.precio === 'number' ? p.precio : (parseFloat(p?.precio) || 0);
      const cantidad = typeof p?.cantidad === 'number' ? p.cantidad : 0;
      return acc + (precio * cantidad);
    },
    0
  );

  const cantidadProductos = (pedidos[mesaActual] || []).reduce(
    (acc, p) => {
      const cantidad = typeof p?.cantidad === 'number' ? p.cantidad : 0;
      return acc + cantidad;
    },
    0
  );

  // ✅ FUNCION PARA RENDERIZAR GRID DE PRODUCTOS CON IMÁGENES
  const renderProductGrid = (productos, colorFondo, esSeccionEspecial = false) => {
    if (!Array.isArray(productos) || productos.length === 0) {
      return (
        <View style={styles.emptySection}>
          <Text style={styles.emptySectionText}>No hay productos disponibles</Text>
        </View>
      );
    }
    
    const filas = [];
    for (let i = 0; i < productos.length; i += 2) {
      filas.push(productos.slice(i, i + 2));
    }

    return filas.map((par, idx) => (
      <View key={idx} style={styles.gridRow}>
        {par.map((item) => {
          // VERIFICACION ADICIONAL ANTES DE RENDERIZAR
          if (!item || !item.id || !item.nombre) {
            console.warn('⚠️ Item invalido en renderProductGrid:', item);
            return null;
          }

          return (
            <ProductGridItem
              key={`${item.id}-${esSeccionEspecial ? 'especial' : 'regular'}`}
              item={item}
              colorFondo={colorFondo}
              onPress={() => agregarPedido(item, esSeccionEspecial)}
              formatearPrecio={formatearPrecio}
            />
          );
        })}
        {par.length === 1 && <View style={styles.emptyGridItem} />}
      </View>
    ));
  };

  const renderSelectorMesa = () => {
    if (Platform.OS === 'ios') {
      return (
        <View style={styles.mesaSelector}>
          <Text style={styles.label}>Mesa:</Text>
          <Picker
            selectedValue={mesaActual}
            onValueChange={(itemValue) => setMesaActual(itemValue)}
            style={styles.picker}
          >
            {listaMesas.map((m) => (
              <Picker.Item label={m} value={m} key={m} />
            ))}
          </Picker>
        </View>
      );
    }
    
    return (
      <View style={styles.mesaSelector}>
        <Text style={styles.label}>Mesa:</Text>
        <TouchableOpacity 
          style={styles.customPicker}
          onPress={() => setMostrarSelectorMesa(true)}
        >
          <Text style={styles.pickerText}>{mesaActual}</Text>
          <Ionicons name="chevron-down" size={20} color="#555" />
        </TouchableOpacity>
        
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
              {listaMesas.map((mesa) => (
                <TouchableOpacity 
                  key={mesa}
                  style={[
                    styles.mesaOpcion,
                    mesaActual === mesa && styles.mesaOpcionSeleccionada
                  ]}
                  onPress={() => {
                    setMesaActual(mesa);
                    setMostrarSelectorMesa(false);
                  }}
                >
                  <Text 
                    style={[
                      styles.mesaOpcionTexto,
                      mesaActual === mesa && styles.mesaOpcionTextoSeleccionado
                    ]}
                  >
                    {mesa}
                  </Text>
                  {mesaActual === mesa && (
                    <Ionicons name="checkmark" size={20} color="#fff" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      {/* ✅ STATUS BAR CONFIGURADO */}
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#f9f9f9" 
        translucent={false}
      />
      
      <ScrollView 
        style={styles.scrollContainer}
        contentInsetAdjustmentBehavior="automatic" // ✅ iOS safe area
      >
        <Text style={styles.title}>Pedidos</Text>

        {renderSelectorMesa()}

        {/* ✅ SECCIONES DINÁMICAS POR CATEGORÍA */}
        {loadingCategorias ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Cargando categorías...</Text>
          </View>
        ) : (
          categoriasDisponibles.map((categoria) => {
            const key = categoria.nombre.toLowerCase().replace(/\s+/g, '');
            const productos = productosPorCategoria[key] || [];
            
            // Obtener color de fondo según categoría
            const getColorCategoria = (nombreCategoria) => {
              const colores = {
                'entradas': "#FFE8E0",
                'platosprincipales': "#E8F5E8", 
                'postres': "#FFF0F5",
                'bebidas': "#E0FFEA",
                'pizzas': "#FFF8DC"
              };
              return colores[key] || "#F0F8FF";
            };

            return (
              <View key={categoria.id} style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {categoria.nombre}
                  <Text style={styles.counter}>({productos.length})</Text>
                </Text>
                {renderProductGrid(productos, getColorCategoria(categoria.nombre), false)}
              </View>
            );
          })
        )}

        {/* Seccion Platos Especiales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Platos Especiales 
            <Text style={styles.counter}>({especialesDisponibles.length})</Text>
          </Text>
          {renderProductGrid(especialesDisponibles, "#E0F2FF", true)}
        </View>

        {/* Resumen de pedidos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pedidos de {mesaActual}</Text>
          {(pedidos[mesaActual] || []).length === 0 ? (
            <Text style={styles.emptyPedidos}>No hay pedidos en esta mesa</Text>
          ) : (
            pedidos[mesaActual].map((p) => (
              <PedidoItem
                key={`${p?.id}-${p?.es_especial ? 'especial' : 'regular'}`}
                producto={p}
                onDescontar={() => descontarUnidad(p?.id, p?.es_especial)}
                onAumentar={() => aumentarUnidad(p?.id, p?.es_especial)}
                onEliminar={() => eliminarPedido(p?.id, p?.es_especial)}
                formatearPrecio={formatearPrecio}
              />
            ))
          )}
        </View>

        {/* ✅ TOTALES CON FORMATO CORRECTO */}
        <View style={styles.totalContainer}>
          <Text style={styles.totalText}>Total: {formatearPrecio(totalMesa)}</Text>
          <Text style={styles.totalText}>Productos: {cantidadProductos}</Text>
        </View>

        {/* Boton cerrar mesa */}
        <TouchableOpacity 
          style={[
            styles.cerrarMesaButton,
            (pedidos[mesaActual] || []).length === 0 && styles.cerrarMesaButtonDisabled
          ]} 
          onPress={cerrarMesa}
          disabled={(pedidos[mesaActual] || []).length === 0}
        >
          <Text style={styles.cerrarMesaText}>
            {(pedidos[mesaActual] || []).length === 0 ? 'MESA VACIA' : 'CERRAR MESA'}
          </Text>
        </TouchableOpacity>

        {/* Modal resumen */}
        <Modal visible={modalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Resumen de la cuenta</Text>
              <Text style={styles.modalInfo}>Mesa: {mesaActual}</Text>
              <Text style={styles.modalInfo}>Fecha: {fechaResumen}</Text>
              <Text style={styles.modalInfo}>Productos: {cantidadProductos}</Text>
              
              <View style={styles.modalDivider} />
              
              {(pedidos[mesaActual] || []).map((p) => (
                <View key={`${p?.id}-${p?.es_especial ? 'especial' : 'regular'}`} style={styles.modalItem}>
                  <Text style={styles.modalItemName}>
                    {p?.nombre || 'Sin nombre'} x {p?.cantidad || 0}
                    {p?.es_especial && ' (Especial)'}
                  </Text>
                  {/* ✅ PRECIO FORMATEADO CORRECTAMENTE EN MODAL */}
                  <Text style={styles.modalItemPrice}>
                    {formatearPrecio((p?.precio || 0) * (p?.cantidad || 0))}
                  </Text>
                </View>
              ))}
              
              <View style={styles.modalDivider} />
              
              {/* ✅ TOTAL FORMATEADO CORRECTAMENTE */}
              <Text style={styles.modalTotal}>
                Total a pagar: {formatearPrecio(totalMesa)}
              </Text>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setModalVisible(false)}
                  disabled={guardandoVenta}
                >
                  <Text style={styles.modalButtonText}>Cancelar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.modalButton, 
                    styles.confirmButton,
                    guardandoVenta && styles.buttonDisabled
                  ]}
                  onPress={confirmarCerrarMesa}
                  disabled={guardandoVenta}
                >
                  {guardandoVenta ? (
                    <>
                      <ActivityIndicator size="small" color="#fff" />
                      <Text style={[styles.modalButtonText, { marginLeft: 8 }]}>
                        Guardando...
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.modalButtonText}>Confirmar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

// ✅ COMPONENTE PARA ITEM DEL GRID CON IMAGEN
function ProductGridItem({ item, colorFondo, onPress, formatearPrecio }) {
  const [imageError, setImageError] = useState(false);
  
  if (!item || !item.id || !item.nombre) {
    return null;
  }

  const imagenUrl = item.imagen_url || item.imagen;

  return (
    <TouchableOpacity
      style={[styles.gridItem, { backgroundColor: colorFondo }]}
      onPress={onPress}
    >
      {/* ✅ IMAGEN MINIATURA DEL PRODUCTO */}
      <View style={styles.productImageContainer}>
        {imagenUrl && !imageError ? (
          <Image
            source={{ uri: imagenUrl }}
            style={styles.productImageMini}
            onError={() => setImageError(true)}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.productImagePlaceholder}>
            <Ionicons name="image-outline" size={16} color="#ccc" />
          </View>
        )}
      </View>

      <Text style={styles.gridItemName} numberOfLines={2}>
        {item.nombre}
      </Text>
      
      {/* ✅ PRECIO FORMATEADO CORRECTAMENTE */}
      <Text style={styles.gridItemPrice}>
        {formatearPrecio(item.precio)}
      </Text>
      
      <View style={styles.itemBadges}>
        {item.vegetariano && <Text style={styles.badge}>VEG</Text>}
        {item.picante && <Text style={[styles.badge, styles.badgePicante]}>PIC</Text>}
      </View>
    </TouchableOpacity>
  );
}

// ✅ COMPONENTE PARA ITEM DE PEDIDO CON IMAGEN
function PedidoItem({ producto, onDescontar, onAumentar, onEliminar, formatearPrecio }) {
  const [imageError, setImageError] = useState(false);
  
  if (!producto) return null;

  const imagenUrl = producto.imagen_url || producto.imagen;

  return (
    <View style={styles.pedidoItem}>
      <View style={styles.pedidoInfo}>
        {/* ✅ IMAGEN MINIATURA EN PEDIDO */}
        <View style={styles.pedidoImageContainer}>
          {imagenUrl && !imageError ? (
            <Image
              source={{ uri: imagenUrl }}
              style={styles.pedidoImage}
              onError={() => setImageError(true)}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.pedidoImagePlaceholder}>
              <Ionicons name="image-outline" size={12} color="#ccc" />
            </View>
          )}
        </View>

        <View style={styles.pedidoDetails}>
          <Text style={styles.pedidoNombre}>
            {producto?.nombre || 'Sin nombre'}
            {producto?.es_especial && ' 🌟'}
          </Text>
          <Text style={styles.pedidoCategoria}>
            ({producto?.categoria || 'Sin categoria'})
            {producto?.es_especial && ' - Especial'}
          </Text>
          {/* ✅ PRECIO FORMATEADO CORRECTAMENTE EN RESUMEN */}
          <Text style={styles.pedidoPrecio}>
            {formatearPrecio((producto?.precio || 0) * (producto?.cantidad || 0))}
          </Text>
        </View>
      </View>
      
      <View style={styles.controles}>
        <TouchableOpacity onPress={onDescontar}>
          <Ionicons name="remove-circle" size={24} color="#f39c12" />
        </TouchableOpacity>
        <Text style={styles.cantidad}>{producto?.cantidad || 0}</Text>
        <TouchableOpacity onPress={onAumentar}>
          <Ionicons name="add-circle" size={24} color="#27ae60" />
        </TouchableOpacity>
        <TouchableOpacity onPress={onEliminar}>
          <Ionicons name="trash" size={24} color="#e74c3c" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  scrollContainer: {
    padding: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 16,
    marginTop: 10,
    textAlign: "center",
    color: "#2c3e50",
  },
  // ✅ NUEVO: Estilos para loading de categorías
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  mesaSelector: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 10,
    elevation: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 10,
  },
  picker: {
    flex: 1,
    height: 50,
  },
  customPicker: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 50,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    backgroundColor: "#f9f9f9",
  },
  pickerText: {
    fontSize: 16,
    color: "#333",
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
  mesaOpcion: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    borderRadius: 5,
    marginBottom: 5,
  },
  mesaOpcionSeleccionada: {
    backgroundColor: "#4a6ee0",
  },
  mesaOpcionTexto: {
    fontSize: 16,
    color: "#333",
  },
  mesaOpcionTextoSeleccionado: {
    color: "#fff",
    fontWeight: "bold",
  },
  section: {
    marginBottom: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#34495e",
    borderBottomWidth: 1,
    borderBottomColor: "#ecf0f1",
    paddingBottom: 5,
  },
  counter: {
    fontSize: 14,
    fontWeight: "normal",
    color: "#7f8c8d",
  },
  emptySection: {
    textAlign: "center",
    fontStyle: "italic",
    padding: 20,
    color: "#95a5a6",
  },
  emptySectionText: {
    textAlign: "center",
    fontStyle: "italic",
    color: "#95a5a6",
  },
  gridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  gridItem: {
    width: (windowWidth - 60) / 2,
    height: 130,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    padding: 8,
    elevation: 2,
  },
  emptyGridItem: {
    width: (windowWidth - 60) / 2,
  },
  productImageContainer: {
    marginBottom: 6,
    borderRadius: 8,
    overflow: 'hidden',
  },
  productImageMini: {
    width: 50,
    height: 40,
    borderRadius: 8,
  },
  productImagePlaceholder: {
    width: 50,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
  },
  gridItemName: {
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 4,
    fontSize: 14,
    lineHeight: 18,
    color: "#2c3e50",
  },
  gridItemPrice: {
    fontSize: 16,
    color: "#e74c3c",
    fontWeight: "bold",
    marginBottom: 4,
  },
  itemBadges: {
    flexDirection: "row",
    marginTop: 2,
  },
  badge: {
    fontSize: 9,
    fontWeight: 'bold',
    backgroundColor: '#2ecc71',
    color: '#fff',
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 6,
    marginHorizontal: 1,
    overflow: 'hidden',
  },
  badgePicante: {
    backgroundColor: '#e74c3c',
  },
  emptyPedidos: {
    textAlign: "center",
    fontStyle: "italic",
    padding: 20,
    color: "#7f8c8d",
  },
  pedidoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ecf0f1",
  },
  pedidoInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pedidoImageContainer: {
    marginRight: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  pedidoImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  pedidoImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
  },
  pedidoDetails: {
    flex: 1,
  },
  pedidoNombre: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 3,
    color: "#2c3e50",
  },
  pedidoCategoria: {
    fontSize: 13,
    color: "#7f8c8d",
    marginBottom: 3,
  },
  pedidoPrecio: {
    color: "#e74c3c",
    fontWeight: "600",
    fontSize: 15,
  },
  controles: {
    flexDirection: "row",
    alignItems: "center",
  },
  cantidad: {
    width: 30,
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
    marginHorizontal: 10,
  },
  totalContainer: {
    backgroundColor: "#34495e",
    padding: 15,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  totalText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  cerrarMesaButton: {
    backgroundColor: "#c0392b",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 60,
  },
  cerrarMesaButtonDisabled: {
    backgroundColor: "#bdc3c7",
  },
  cerrarMesaText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
    color: "#2c3e50",
  },
  modalInfo: {
    fontSize: 14,
    color: "#7f8c8d",
    marginBottom: 5,
  },
  modalDivider: {
    height: 1,
    backgroundColor: "#ecf0f1",
    marginVertical: 10,
  },
  modalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 5,
  },
  modalItemName: {
    flex: 1,
    fontSize: 14,
  },
  modalItemPrice: {
    fontWeight: "bold",
    fontSize: 14,
  },
  modalTotal: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "right",
    marginTop: 5,
    color: "#e74c3c",
  },
  modalButtons: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 5,
    elevation: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  confirmButton: {
    backgroundColor: "#27ae60",
  },
  cancelButton: {
    backgroundColor: "#7f8c8d",
  },
  buttonDisabled: {
    backgroundColor: "#95a5a6",
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});