import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { palette, spacing } from '../theme';
import { AppIcon } from './AppIcon';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message }: LoadingScreenProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.2)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Fade in inicial
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideUp, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Animación de pulso suave
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Animación de brillo elegante
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.5,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.2,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Rotación sutil del anillo exterior
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      {/* Fondo con gradiente sutil */}
      <LinearGradient
        colors={['#F8FAFC', '#E0F2FE', '#F0F9FF']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Círculos decorativos de fondo */}
      <View style={styles.backgroundCircle1} />
      <View style={styles.backgroundCircle2} />

      <Animated.View 
        style={[
          styles.content,
          { 
            opacity: fadeIn,
            transform: [{ translateY: slideUp }]
          }
        ]}
      >
        {/* Anillo giratorio exterior */}
        <Animated.View 
          style={[
            styles.spinRing,
            { transform: [{ rotate: spin }] }
          ]}
        />
        
        {/* Glow animado */}
        <Animated.View 
          style={[
            styles.glowCircle,
            { opacity: glowAnim }
          ]}
        />
        
        {/* Logo principal */}
        <Animated.View 
          style={[
            styles.logoContainer,
            { transform: [{ scale: pulseAnim }] }
          ]}
        >
          <LinearGradient
            colors={[palette.primary, palette.accent]}
            style={styles.logoGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <AppIcon name="building" size={48} color="#FFFFFF" strokeWidth={2} />
          </LinearGradient>
        </Animated.View>
        
        {/* Nombre de la app */}
        <Text style={styles.title}>HypertrOffice</Text>
        <Text style={styles.subtitle}>Tu entrenador personal</Text>
        
        {/* Loading bar moderna */}
        <View style={styles.loadingBarContainer}>
          <LoadingBar />
        </View>
        
        {message && <Text style={styles.message}>{message}</Text>}
      </Animated.View>
      
      {/* Footer elegante */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Preparando tu experiencia...</Text>
      </View>
    </View>
  );
}

function LoadingBar() {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-width * 0.6, width * 0.6],
  });

  return (
    <View style={styles.loadingBar}>
      <Animated.View 
        style={[
          styles.loadingBarProgress,
          { transform: [{ translateX }] }
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundCircle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: palette.primaryGlow,
    top: -50,
    right: -100,
  },
  backgroundCircle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: palette.accentMuted,
    bottom: 100,
    left: -80,
    opacity: 0.3,
  },
  content: {
    alignItems: 'center',
  },
  spinRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: 'transparent',
    borderTopColor: palette.primary,
    borderRightColor: palette.primaryLight,
    top: -20,
  },
  glowCircle: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: palette.primary,
    top: -30,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 20,
  },
  logoGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: palette.text,
    marginTop: spacing.xl,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14,
    color: palette.muted,
    marginTop: spacing.xs,
    letterSpacing: 1,
  },
  loadingBarContainer: {
    marginTop: spacing.xl,
    width: width * 0.5,
    alignItems: 'center',
  },
  loadingBar: {
    width: '100%',
    height: 3,
    backgroundColor: palette.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  loadingBarProgress: {
    width: '40%',
    height: '100%',
    backgroundColor: palette.primary,
    borderRadius: 2,
  },
  message: {
    color: palette.muted,
    fontSize: 14,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 60,
  },
  footerText: {
    color: palette.mutedAlt,
    fontSize: 12,
    letterSpacing: 0.5,
  },
});
