// components/MexicanChefLogo.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MexicanChefLogo = ({ size = 120 }) => {
  const logoSize = size;
  const dynamicStyles = getStyles(logoSize);

  return (
    <View style={[styles.logoContainer, { width: logoSize, height: logoSize * 0.9 }]}>
      {/* Fondo principal con esquinas redondeadas */}
      <View style={[styles.mainBackground, dynamicStyles.mainBackground]}>
        
        {/* Decoraciones superiores */}
        <View style={styles.topDecorations}>
          {/* Calavera en la parte superior */}
          <View style={[styles.skull, dynamicStyles.skull]}>
            <View style={[styles.skullEye, dynamicStyles.skullEye]} />
            <View style={[styles.skullEye, dynamicStyles.skullEye, { marginLeft: 4 }]} />
            <View style={[styles.skullMouth, dynamicStyles.skullMouth]} />
          </View>
          
          {/* Flores decorativas */}
          <View style={[styles.flower, styles.leftFlower, dynamicStyles.flower]}>
            <Text style={[styles.flowerText, dynamicStyles.flowerText]}>✿</Text>
          </View>
          <View style={[styles.flower, styles.rightFlower, dynamicStyles.flower]}>
            <Text style={[styles.flowerText, dynamicStyles.flowerText]}>✿</Text>
          </View>
          
          {/* Puntos decorativos */}
          <View style={[styles.decorDot, styles.dot1, dynamicStyles.decorDot]} />
          <View style={[styles.decorDot, styles.dot2, dynamicStyles.decorDot]} />
          <View style={[styles.decorDot, styles.dot3, dynamicStyles.decorDot]} />
          <View style={[styles.decorDot, styles.dot4, dynamicStyles.decorDot]} />
        </View>

        {/* Cara del chef */}
        <View style={[styles.chefFace, dynamicStyles.chefFace]}>
          {/* Ojos */}
          <View style={styles.eyes}>
            <View style={[styles.eye, dynamicStyles.eye]}>
              <View style={[styles.eyePupil, dynamicStyles.eyePupil]} />
              <View style={[styles.eyeShine, dynamicStyles.eyeShine]} />
            </View>
            <View style={[styles.eye, dynamicStyles.eye]}>
              <View style={[styles.eyePupil, dynamicStyles.eyePupil]} />
              <View style={[styles.eyeShine, dynamicStyles.eyeShine]} />
            </View>
          </View>
          
          {/* Nariz pequeña */}
          <View style={[styles.nose, dynamicStyles.nose]} />
          
          {/* Boca sonriente */}
          <View style={[styles.mouth, dynamicStyles.mouth]}>
            <View style={[styles.smile, dynamicStyles.smile]} />
          </View>
        </View>

        {/* Taco en las manos */}
        <View style={[styles.tacoContainer, dynamicStyles.tacoContainer]}>
          <View style={[styles.taco, dynamicStyles.taco]}>
            {/* Tortilla */}
            <View style={[styles.tortilla, dynamicStyles.tortilla]} />
            {/* Relleno */}
            <View style={[styles.filling, dynamicStyles.filling]} />
            <View style={[styles.lettuce, dynamicStyles.lettuce]} />
          </View>
          
          {/* Manos */}
          <View style={[styles.hand, styles.leftHand, dynamicStyles.hand]} />
          <View style={[styles.hand, styles.rightHand, dynamicStyles.hand]} />
        </View>

        {/* Decoraciones inferiores */}
        <View style={styles.bottomDecorations}>
          {/* Flores inferiores */}
          <View style={[styles.flower, styles.bottomLeftFlower, dynamicStyles.flower]}>
            <Text style={[styles.flowerText, dynamicStyles.flowerText]}>❀</Text>
          </View>
          <View style={[styles.flower, styles.bottomRightFlower, dynamicStyles.flower]}>
            <Text style={[styles.flowerText, dynamicStyles.flowerText]}>❀</Text>
          </View>
          
          {/* Hojas decorativas */}
          <View style={[styles.leaf, styles.leftLeaf, dynamicStyles.leaf]}>
            <Text style={[styles.leafText, dynamicStyles.leafText]}>🌿</Text>
          </View>
          <View style={[styles.leaf, styles.rightLeaf, dynamicStyles.leaf]}>
            <Text style={[styles.leafText, dynamicStyles.leafText]}>🌿</Text>
          </View>
        </View>
      </View>
      
      {/* Borde naranja exterior */}
      <View style={[styles.outerBorder, dynamicStyles.outerBorder]} />
    </View>
  );
};

const getStyles = (size) => ({
  mainBackground: {
    width: size * 0.9,
    height: size * 0.8,
    borderRadius: size * 0.15,
  },
  outerBorder: {
    width: size,
    height: size * 0.9,
    borderRadius: size * 0.18,
    borderWidth: size * 0.03,
  },
  skull: {
    width: size * 0.12,
    height: size * 0.1,
  },
  skullEye: {
    width: size * 0.02,
    height: size * 0.02,
    borderRadius: size * 0.01,
  },
  skullMouth: {
    width: size * 0.06,
    height: size * 0.01,
    borderRadius: size * 0.005,
    marginTop: size * 0.01,
  },
  flower: {
    width: size * 0.08,
    height: size * 0.08,
  },
  flowerText: {
    fontSize: size * 0.06,
  },
  decorDot: {
    width: size * 0.015,
    height: size * 0.015,
    borderRadius: size * 0.0075,
  },
  chefFace: {
    width: size * 0.45,
    height: size * 0.4,
    borderRadius: size * 0.225,
  },
  eye: {
    width: size * 0.08,
    height: size * 0.08,
    borderRadius: size * 0.04,
  },
  eyePupil: {
    width: size * 0.04,
    height: size * 0.04,
    borderRadius: size * 0.02,
  },
  eyeShine: {
    width: size * 0.015,
    height: size * 0.015,
    borderRadius: size * 0.0075,
  },
  nose: {
    width: size * 0.008,
    height: size * 0.008,
    borderRadius: size * 0.004,
  },
  mouth: {
    width: size * 0.12,
    height: size * 0.03,
    borderRadius: size * 0.015,
  },
  smile: {
    width: size * 0.08,
    height: size * 0.015,
    borderRadius: size * 0.04,
  },
  tacoContainer: {
    width: size * 0.3,
    height: size * 0.15,
  },
  taco: {
    width: size * 0.12,
    height: size * 0.08,
  },
  tortilla: {
    width: size * 0.12,
    height: size * 0.08,
    borderRadius: size * 0.02,
  },
  filling: {
    width: size * 0.08,
    height: size * 0.04,
    borderRadius: size * 0.01,
  },
  lettuce: {
    width: size * 0.06,
    height: size * 0.02,
    borderRadius: size * 0.01,
  },
  hand: {
    width: size * 0.06,
    height: size * 0.08,
    borderRadius: size * 0.03,
  },
  leaf: {
    width: size * 0.06,
    height: size * 0.06,
  },
  leafText: {
    fontSize: size * 0.04,
  },
});

const styles = StyleSheet.create({
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 20,
  },
  outerBorder: {
    position: 'absolute',
    borderColor: '#D2691E',
    backgroundColor: 'transparent',
    zIndex: 0,
    top: 0,
  },
  mainBackground: {
    backgroundColor: '#2F2F2F',
    position: 'relative',
    zIndex: 1,
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  
  // Decoraciones superiores
  topDecorations: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 5,
  },
  skull: {
    backgroundColor: '#D2691E',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  skullEye: {
    backgroundColor: '#2F2F2F',
    position: 'absolute',
    top: 2,
  },
  skullMouth: {
    backgroundColor: '#2F2F2F',
  },
  flower: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  leftFlower: {
    left: 15,
    top: -2,
  },
  rightFlower: {
    right: 15,
    top: -2,
  },
  bottomLeftFlower: {
    left: 10,
    bottom: 2,
  },
  bottomRightFlower: {
    right: 10,
    bottom: 2,
  },
  flowerText: {
    color: '#D2691E',
    fontWeight: 'bold',
  },
  decorDot: {
    backgroundColor: '#D2691E',
    position: 'absolute',
  },
  dot1: { left: 25, top: 8 },
  dot2: { right: 25, top: 8 },
  dot3: { left: 35, top: 15 },
  dot4: { right: 35, top: 15 },

  // Cara del chef
  chefFace: {
    backgroundColor: '#F5DEB3',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginVertical: 5,
  },
  eyes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '60%',
    marginBottom: 8,
  },
  eye: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  eyePupil: {
    backgroundColor: '#2F2F2F',
    position: 'absolute',
  },
  eyeShine: {
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    top: 8,
    left: 10,
  },
  nose: {
    backgroundColor: '#2F2F2F',
    marginBottom: 8,
  },
  mouth: {
    backgroundColor: '#2F2F2F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smile: {
    backgroundColor: '#F5DEB3',
    borderTopWidth: 2,
    borderTopColor: '#2F2F2F',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderLeftColor: '#2F2F2F',
    borderRightColor: '#2F2F2F',
  },

  // Taco y manos
  tacoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    position: 'relative',
  },
  taco: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tortilla: {
    backgroundColor: '#DEB887',
    borderWidth: 1,
    borderColor: '#CD853F',
  },
  filling: {
    backgroundColor: '#8B4513',
    position: 'absolute',
    top: 8,
  },
  lettuce: {
    backgroundColor: '#228B22',
    position: 'absolute',
    top: 12,
  },
  hand: {
    backgroundColor: '#F5DEB3',
    position: 'absolute',
  },
  leftHand: {
    left: -20,
    top: 10,
    transform: [{ rotate: '-15deg' }],
  },
  rightHand: {
    right: -20,
    top: 10,
    transform: [{ rotate: '15deg' }],
  },

  // Decoraciones inferiores
  bottomDecorations: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    marginTop: 5,
  },
  leaf: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  leftLeaf: {
    left: 5,
    bottom: -5,
    transform: [{ rotate: '-15deg' }],
  },
  rightLeaf: {
    right: 5,
    bottom: -5,
    transform: [{ rotate: '15deg' }],
  },
  leafText: {
    color: '#228B22',
  },
});

export default MexicanChefLogo;
