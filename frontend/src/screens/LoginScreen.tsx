import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { AppIcon as Ionicons } from '../components/AppIcon';
import { palette, spacing, radius } from '../theme';
import CustomAlert, { useCustomAlert } from '../components/CustomAlert';
import LoadingScreen from '../components/LoadingScreen';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const { alertState, hideAlert, showError } = useCustomAlert();

  const handleLogin = async () => {
    if (!email || !password) {
      showError('Error', 'Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
    } catch (error: any) {
      showError('Error', error.message);
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Iniciando sesión..." />;
  }

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/amf-logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>AMFTeam</Text>
            <Text style={styles.tagline}>Tu equipo de entrenamiento</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Correo Electrónico</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color={palette.muted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="ejemplo@email.com"
                  placeholderTextColor={palette.mutedAlt}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  selectionColor={palette.primary}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contraseña</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={palette.muted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={palette.mutedAlt}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  selectionColor={palette.primary}
                />
              </View>
            </View>

            <TouchableOpacity 
              onPress={handleLogin}
              disabled={loading}
              style={[styles.button, loading && styles.buttonDisabled]}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Accediendo...' : 'Iniciar Sesión'}
              </Text>
              {!loading && <Ionicons name="arrow-forward" size={20} color={palette.text} />}
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => navigation.navigate('Register')}
              style={styles.registerLink}
            >
              <Text style={styles.linkText}>¿No tienes cuenta? </Text>
              <Text style={styles.linkTextBold}>Regístrate</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Custom Alert */}
      <CustomAlert
        visible={alertState.visible}
        type={alertState.type}
        title={alertState.title}
        message={alertState.message}
        buttons={alertState.buttons}
        onClose={hideAlert}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: palette.surface,
    borderWidth: 3,
    borderColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: spacing.md,
  },
  fireLogo: {
    fontSize: 56,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: palette.primary,
    letterSpacing: 3,
  },
  tagline: {
    color: palette.muted,
    fontSize: 14,
    marginTop: spacing.xs,
  },
  formContainer: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: spacing.xs,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.md,
    height: 52,
    paddingHorizontal: spacing.md,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    color: palette.text,
    fontSize: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.primary,
    height: 52,
    borderRadius: radius.md,
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  buttonDisabled: {
    backgroundColor: palette.mutedAlt,
  },
  buttonText: {
    color: palette.background,
    fontSize: 16,
    fontWeight: '700',
  },
  registerLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  linkText: {
    color: palette.muted,
    fontSize: 14,
  },
  linkTextBold: {
    color: palette.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
