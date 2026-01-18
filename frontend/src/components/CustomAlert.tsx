import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { palette, spacing, radius, withOpacity } from '../theme';
import { AppIcon } from './AppIcon';

type AlertType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface CustomAlertProps {
  visible: boolean;
  type?: AlertType;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  onClose: () => void;
}

const alertConfig = {
  success: {
    icon: 'checkmark-circle' as const,
    color: palette.success,
    bgColor: withOpacity(palette.success, 0.15),
  },
  error: {
    icon: 'close-circle' as const,
    color: palette.danger,
    bgColor: withOpacity(palette.danger, 0.15),
  },
  warning: {
    icon: 'warning' as const,
    color: palette.warning,
    bgColor: withOpacity(palette.warning, 0.15),
  },
  info: {
    icon: 'information-circle' as const,
    color: palette.primary,
    bgColor: palette.primaryMuted,
  },
  confirm: {
    icon: 'help-circle' as const,
    color: palette.primary,
    bgColor: palette.primaryMuted,
  },
};

export default function CustomAlert({
  visible,
  type = 'info',
  title,
  message,
  buttons,
  onClose,
}: CustomAlertProps) {
  const config = alertConfig[type];
  
  const defaultButtons: AlertButton[] = buttons || [{ text: 'Aceptar', onPress: onClose }];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.alertContainer}>
              {/* Icono */}
              <View style={[styles.iconContainer, { backgroundColor: config.bgColor }]}>
                <AppIcon name={config.icon} size={32} color={config.color} />
              </View>

              {/* Título */}
              <Text style={styles.title}>{title}</Text>

              {/* Mensaje */}
              {message && <Text style={styles.message}>{message}</Text>}

              {/* Botones */}
              <View style={[
                styles.buttonContainer,
                defaultButtons.length > 1 && styles.buttonContainerMultiple
              ]}>
                {defaultButtons.map((button, index) => {
                  const isDestructive = button.style === 'destructive';
                  const isCancel = button.style === 'cancel';
                  const isPrimary = !isDestructive && !isCancel && index === defaultButtons.length - 1;

                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.button,
                        defaultButtons.length > 1 && styles.buttonMultiple,
                        isPrimary && styles.buttonPrimary,
                        isDestructive && styles.buttonDestructive,
                        isCancel && styles.buttonCancel,
                      ]}
                      onPress={() => {
                        button.onPress?.();
                        if (!button.onPress) onClose();
                      }}
                    >
                      <Text
                        style={[
                          styles.buttonText,
                          isPrimary && styles.buttonTextPrimary,
                          isDestructive && styles.buttonTextDestructive,
                          isCancel && styles.buttonTextCancel,
                        ]}
                      >
                        {button.text}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

// Hook para usar el alert fácilmente
export interface AlertState {
  visible: boolean;
  type: AlertType;
  title: string;
  message?: string;
  buttons?: AlertButton[];
}

export const initialAlertState: AlertState = {
  visible: false,
  type: 'info',
  title: '',
  message: undefined,
  buttons: undefined,
};

export function useCustomAlert() {
  const [alertState, setAlertState] = React.useState<AlertState>(initialAlertState);

  const showAlert = (
    type: AlertType,
    title: string,
    message?: string,
    buttons?: AlertButton[]
  ) => {
    setAlertState({
      visible: true,
      type,
      title,
      message,
      buttons,
    });
  };

  const hideAlert = () => {
    setAlertState(prev => ({ ...prev, visible: false }));
  };

  const showSuccess = (title: string, message?: string) => showAlert('success', title, message);
  const showError = (title: string, message?: string) => showAlert('error', title, message);
  const showWarning = (title: string, message?: string) => showAlert('warning', title, message);
  const showInfo = (title: string, message?: string) => showAlert('info', title, message);
  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    confirmText: string = 'Confirmar',
    cancelText: string = 'Cancelar',
    destructive: boolean = false
  ) => {
    showAlert('confirm', title, message, [
      { text: cancelText, style: 'cancel', onPress: onCancel || hideAlert },
      { text: confirmText, style: destructive ? 'destructive' : 'default', onPress: onConfirm },
    ]);
  };

  return {
    alertState,
    showAlert,
    hideAlert,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm,
  };
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  alertContainer: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  message: {
    fontSize: 14,
    color: palette.muted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  buttonContainer: {
    width: '100%',
    marginTop: spacing.sm,
  },
  buttonContainerMultiple: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  button: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surfaceAlt,
  },
  buttonMultiple: {
    flex: 1,
  },
  buttonPrimary: {
    backgroundColor: palette.primary,
  },
  buttonDestructive: {
    backgroundColor: '#EF4444',
  },
  buttonCancel: {
    backgroundColor: palette.surfaceAlt,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.text,
  },
  buttonTextPrimary: {
    color: '#FFFFFF',
  },
  buttonTextDestructive: {
    color: '#FFFFFF',
  },
  buttonTextCancel: {
    color: palette.muted,
  },
});
