import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { AppIcon as Ionicons } from '../components/AppIcon';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';
import { palette, radius, spacing, typography } from '../theme';
import CustomAlert, { useCustomAlert } from '../components/CustomAlert';

export default function SettingsScreen({ navigation }: any) {
  const { user, signOut, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const { alertState, hideAlert, showSuccess, showError, showConfirm } = useCustomAlert();

  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.name || '');

  const [editingPassword, setEditingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Modal para confirmar eliminación de cuenta
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');

  const handleUpdateName = async () => {
    if (!newName.trim()) {
      showError('Error', 'El nombre no puede estar vacío');
      return;
    }

    try {
      setLoading(true);
      await authService.updateProfile({ name: newName });
      await refreshUser();
      showSuccess('Éxito', 'Nombre actualizado correctamente');
      setEditingName(false);
    } catch (error: any) {
      showError('Error', error.response?.data?.error || 'No se pudo actualizar el nombre');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showError('Error', 'Debes completar todos los campos');
      return;
    }

    if (newPassword !== confirmPassword) {
      showError('Error', 'Las contraseñas no coinciden');
      return;
    }

    if (newPassword.length < 6) {
      showError('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      setLoading(true);
      await authService.updateProfile({ currentPassword, newPassword });
      showSuccess('Éxito', 'Contraseña actualizada correctamente');
      setEditingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      showError('Error', error.response?.data?.error || 'No se pudo actualizar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    showConfirm(
      'Cerrar Sesión',
      '¿Estás seguro que quieres cerrar sesión?',
      signOut
    );
  };

  const handleDeleteAccount = () => {
    showConfirm(
      'Eliminar Cuenta',
      'Esta acción es irreversible. Se eliminarán todos tus datos.\n\n¿Estás completamente seguro?',
      () => {
        setDeleteModalVisible(true);
      }
    );
  };

  const confirmDeleteAccount = async () => {
    if (!deletePassword) {
      showError('Error', 'Debes introducir tu contraseña');
      return;
    }

    try {
      setLoading(true);
      await authService.deleteAccount(deletePassword);
      setDeleteModalVisible(false);
      showSuccess('Cuenta Eliminada', 'Tu cuenta ha sido eliminada correctamente');
      await signOut();
    } catch (error: any) {
      showError('Error', error.response?.data?.error || 'No se pudo eliminar la cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={palette.text} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Configuración</Text>
          <Text style={styles.subtitle}>Gestiona tu cuenta</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información Personal</Text>
          
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Correo electrónico</Text>
              <Text style={styles.infoValue}>{user?.email}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cambiar Nombre</Text>
          
          <View style={styles.card}>
            {editingName ? (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Nuevo nombre"
                  placeholderTextColor={palette.mutedAlt}
                  value={newName}
                  onChangeText={setNewName}
                />
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.buttonCancel}
                    onPress={() => {
                      setEditingName(false);
                      setNewName(user?.name || '');
                    }}
                  >
                    <Text style={styles.buttonCancelText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.buttonPrimary}
                    onPress={handleUpdateName}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color={palette.text} size="small" />
                    ) : (
                      <Text style={styles.buttonPrimaryText}>Guardar</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <View style={styles.currentValueRow}>
                  <Text style={styles.currentLabel}>Nombre actual:</Text>
                  <Text style={styles.currentValue}>{user?.name}</Text>
                </View>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => setEditingName(true)}
                >
                  <Ionicons name="create-outline" size={18} color={palette.primary} />
                  <Text style={styles.editButtonText}>Editar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cambiar Contraseña</Text>
          
          <View style={styles.card}>
            {editingPassword ? (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Contraseña actual"
                  placeholderTextColor={palette.mutedAlt}
                  secureTextEntry
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Nueva contraseña"
                  placeholderTextColor={palette.mutedAlt}
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Confirmar nueva contraseña"
                  placeholderTextColor={palette.mutedAlt}
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.buttonCancel}
                    onPress={() => {
                      setEditingPassword(false);
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                  >
                    <Text style={styles.buttonCancelText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.buttonPrimary}
                    onPress={handleUpdatePassword}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color={palette.text} size="small" />
                    ) : (
                      <Text style={styles.buttonPrimaryText}>Guardar</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setEditingPassword(true)}
              >
                <Ionicons name="lock-closed-outline" size={18} color={palette.primary} />
                <Text style={styles.editButtonText}>Cambiar contraseña</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={palette.text} />
            <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
            <Ionicons name="trash-outline" size={20} color={palette.danger} />
            <Text style={styles.deleteButtonText}>Eliminar Cuenta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal para confirmar eliminación con contraseña */}
      <Modal visible={deleteModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModal}>
            <View style={styles.deleteModalHeader}>
              <Ionicons name="warning" size={40} color={palette.danger} />
              <Text style={styles.deleteModalTitle}>Confirmar Eliminación</Text>
              <Text style={styles.deleteModalSubtitle}>
                Introduce tu contraseña para confirmar
              </Text>
            </View>

            <TextInput
              style={styles.deleteModalInput}
              placeholder="Contraseña"
              placeholderTextColor={palette.mutedAlt}
              secureTextEntry
              value={deletePassword}
              onChangeText={setDeletePassword}
            />

            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={styles.deleteModalCancelButton}
                onPress={() => {
                  setDeleteModalVisible(false);
                  setDeletePassword('');
                }}
              >
                <Text style={styles.deleteModalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteModalConfirmButton}
                onPress={confirmDeleteAccount}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={palette.text} size="small" />
                ) : (
                  <Text style={styles.deleteModalConfirmText}>Eliminar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl * 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: 54,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    backgroundColor: palette.background,
    gap: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.title,
    color: palette.text,
  },
  subtitle: {
    fontSize: 14,
    color: palette.textWarm,
    marginTop: 4,
    opacity: 0.7,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.primaryLight,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: palette.border,
  },
  infoRow: {
    gap: 4,
  },
  infoLabel: {
    color: palette.muted,
    fontSize: 12,
  },
  infoValue: {
    color: palette.text,
    fontSize: 16,
  },
  input: {
    backgroundColor: palette.inputBg,
    borderRadius: radius.sm,
    padding: spacing.md,
    color: palette.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: spacing.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  buttonCancel: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: palette.surfaceAlt,
    alignItems: 'center',
  },
  buttonCancelText: {
    color: palette.muted,
    fontSize: 14,
    fontWeight: '600',
  },
  buttonPrimary: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: palette.primary,
    alignItems: 'center',
  },
  buttonPrimaryText: {
    color: palette.text,
    fontSize: 14,
    fontWeight: '600',
  },
  currentValueRow: {
    marginBottom: spacing.md,
  },
  currentLabel: {
    color: palette.muted,
    fontSize: 12,
    marginBottom: 2,
  },
  currentValue: {
    color: palette.text,
    fontSize: 16,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  editButtonText: {
    color: palette.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    gap: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: palette.border,
  },
  logoutButtonText: {
    color: palette.text,
    fontSize: 16,
    fontWeight: '500',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    padding: spacing.md,
    borderRadius: radius.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: palette.danger,
  },
  deleteButtonText: {
    color: palette.danger,
    fontSize: 16,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  deleteModal: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: palette.border,
  },
  deleteModalHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: palette.text,
    marginTop: spacing.sm,
  },
  deleteModalSubtitle: {
    fontSize: 14,
    color: palette.muted,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  deleteModalInput: {
    backgroundColor: palette.inputBg,
    borderRadius: radius.md,
    padding: spacing.md,
    color: palette.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: spacing.lg,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  deleteModalCancelButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: palette.surfaceAlt,
    alignItems: 'center',
  },
  deleteModalCancelText: {
    color: palette.muted,
    fontSize: 14,
    fontWeight: '600',
  },
  deleteModalConfirmButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: palette.danger,
    alignItems: 'center',
  },
  deleteModalConfirmText: {
    color: palette.text,
    fontSize: 14,
    fontWeight: '600',
  },
});
