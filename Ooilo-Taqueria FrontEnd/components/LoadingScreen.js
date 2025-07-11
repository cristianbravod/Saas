// components/LoadingScreen.js - VERSIÓN CORREGIDA PARA EVITAR ICONFONTS ANTES DE CARGA
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MexicanChefLogo from './MexicanChefLogo';

const { width } = Dimensions.get('window');

export default function LoadingScreen({ 
  type = 'normal', // 'normal', 'coldstart', 'sync', 'error', 'initialization', 'data'
  message,
  subtitle,
  progress = 0,
  onRetry,
  showRetry = false,
  useIcons = true, // Permite deshabilitar iconos si las fuentes no están listas
}) {
  const insets = useSafeAreaInsets();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [dots, setDots] = useState('');
  const [progressAnim] = useState(new Animated.Value(0));

  // Animación de entrada
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  // Animación de puntos suspensivos
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Animación de progreso
  useEffect(() => {
    if (progress > 0) {
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [progress]);

  // Configuración según el tipo
  const getConfig = () => {
    switch (type) {
      case 'coldstart':
        return {
          icon: 'snow-outline',
          iconColor: '#3498db',
          title: 'Despertando Servidor',
          defaultMessage: 'El servidor estaba durmiendo, estamos despertándolo',
          backgroundColor: '#2c3e50',
          accentColor: '#3498db'
        };
      case 'sync':
        return {
          icon: 'sync-outline',
          iconColor: '#2ecc71',
          title: 'Sincronizando Datos',
          defaultMessage: 'Obteniendo la información más reciente',
          backgroundColor: '#27ae60',
          accentColor: '#2ecc71'
        };
      case 'error':
        return {
          icon: 'warning-outline',
          iconColor: '#e74c3c',
          title: 'Problemas de Conexión',
          defaultMessage: 'Reintentando conexión con el servidor',
          backgroundColor: '#c0392b',
          accentColor: '#e74c3c'
        };
      case 'initialization':
        return {
          icon: 'rocket-outline',
          iconColor: '#CD853F',
          title: 'Iniciando Aplicación',
          defaultMessage: 'Preparando todo para ti',
          backgroundColor: '#2c1810',
          accentColor: '#CD853F'
        };
      case 'data':
        return {
          icon: 'download-outline',
          iconColor: '#9b59b6',
          title: 'Cargando Datos',
          defaultMessage: 'Obteniendo información del restaurante',
          backgroundColor: '#8e44ad',
          accentColor: '#9b59b6'
        };
      default:
        return {
          icon: 'restaurant-outline',
          iconColor: '#CD853F',
          title: 'Mi Restaurante',
          defaultMessage: 'Cargando aplicación',
          backgroundColor: '#2c1810',
          accentColor: '#CD853F'
        };
    }
  };

  const config = getConfig();

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: config.backgroundColor,
        paddingTop: insets.top
      }
    ]}>
      <Animated.View style={[
        styles.content,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }]
        }
      ]}>
        {/* Logo o Icono */}
        <View style={styles.logoContainer}>
          {(type === 'normal' || type === 'initialization') ? (
            <MexicanChefLogo size={120} />
          ) : (
            useIcons ? (
              <View style={[styles.iconContainer, { borderColor: config.accentColor }]}>            
                <Ionicons 
                  name={config.icon} 
                  size={60} 
                  color={config.iconColor} 
                />
              </View>
            ) : (
              <MexicanChefLogo size={120} />
            )
          )}
        </View>

        {/* Título */}
        <Text style={[styles.title, { color: config.accentColor }]}>           
          {config.title}
        </Text>

        {/* Mensaje principal */}
        <Text style={styles.message}>
          {message || config.defaultMessage}{dots}
        </Text>

        {/* Subtítulo */}
        {subtitle && (
          <Text style={styles.subtitle}>
            {subtitle}
          </Text>
        )}

        {/* Barra de progreso */}
        {progress > 0 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBackground}>
              <Animated.View
                style={[
                  styles.progressBar,
                  {
                    backgroundColor: config.accentColor,
                    width: progressAnim.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%'],
                      extrapolate: 'clamp',
                    }),
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>{Math.round(progress)}%</Text>
          </View>
        )}

        {/* Indicador de carga */}
        <View style={styles.loaderContainer}>
          <ActivityIndicator 
            size="large" 
            color={config.accentColor} 
            style={styles.loader}
          />
        </View>

        {/* Información adicional según el tipo */}
        {type === 'coldstart' && (
          <View style={styles.infoContainer}>
            {useIcons && <Ionicons name="information-circle-outline" size={16} color="#bdc3c7" />}
            <Text style={styles.infoText}>
              Los servidores gratuitos se duermen después de 15 minutos.
              Esto puede tardar 30-60 segundos.
            </Text>
          </View>
        )}

        {/* Botón de reintentar */}
        {type === 'error' && showRetry && onRetry && (
          <TouchableOpacity 
            style={[styles.retryButton, { borderColor: config.accentColor }]}
            onPress={onRetry}
          >
            {useIcons && <Ionicons name="refresh-outline" size={20} color={config.accentColor} />}
            <Text style={[styles.retryText, { color: config.accentColor }]}>Reintentar</Text>
          </TouchableOpacity>
        )}

        {/* Tips informativos */}
        {(type === 'normal' || type === 'initialization') && (
          <View style={styles.tipsContainer}>
            <Text style={styles.tipTitle}>💡 Mientras esperas:</Text>
            <Text style={styles.tipText}>• Verifica tu conexión a internet</Text>
            <Text style={styles.tipText}>• La primera carga puede tardar más</Text>
            <Text style={styles.tipText}>• Los datos se guardan localmente</Text>
          </View>
        )}
      </Animated.View>

      {/* Indicador de versión */}
      <View style={[styles.versionContainer, { bottom: insets.bottom + 30 }]}>
        <Text style={styles.versionText}>v2.0.0 - SDK 51</Text>
        {type === 'error' && (
          <Text style={styles.statusText}>⚠️ Modo Offline</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 350,
  },
  logoContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    letterSpacing: 1,
  },
  message: {
    fontSize: 16,
    color: '#ecf0f1',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 22,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 14,
    color: '#bdc3c7',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 25,
    alignItems: 'center',
  },
  progressBackground: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#bdc3c7',
    fontWeight: '600',
  },
  loaderContainer: {
    marginVertical: 20,
  },
  loader: {
    transform: [{ scale: 1.2 }],
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
    maxWidth: '90%',
  },
  infoText: {
    fontSize: 12,
    color: '#bdc3c7',
    marginLeft: 8,
    lineHeight: 16,
    flex: 1,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  retryText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  tipsContainer: {
    marginTop: 30,
    padding: 16,
    backgroundColor: 'rgba(205, 133, 63, 0.1)',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#CD853F',
  },
  tipTitle: {
    fontSize: 14,
    color: '#CD853F',
    fontWeight: '600',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 12,
    color: '#DEB887',
    marginBottom: 4,
    lineHeight: 16,
  },
  versionContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  versionText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#e74c3c',
    fontWeight: '500',
  },
});
