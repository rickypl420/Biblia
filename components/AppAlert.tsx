import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  accent: '#E94560', secondary: '#16213E', surface: '#0F3460',
  text: '#EAEAEA', muted: '#8892A4', bg: '#0D0D1A',
  success: '#4CAF50', error: '#FF5252', warning: '#FFC107',
};

type ButtonConfig = {
  text: string;
  onPress: () => void;
  style?: 'default' | 'destructive' | 'cancel';
};

type AppAlertProps = {
  visible: boolean;
  title: string;
  message?: string;
  buttons: ButtonConfig[];
  type?: 'info' | 'success' | 'error' | 'warning';
  onDismiss?: () => void;
};

const TYPE_CONFIG = {
  info:    { icon: 'information-circle-outline', color: COLORS.accent },
  success: { icon: 'checkmark-circle-outline',   color: COLORS.success },
  error:   { icon: 'alert-circle-outline',        color: COLORS.error },
  warning: { icon: 'warning-outline',             color: COLORS.warning },
};

export function AppAlert({ visible, title, message, buttons, type = 'info', onDismiss }: AppAlertProps) {
  const cfg = TYPE_CONFIG[type];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.box}>
          <View style={[styles.iconCircle, { borderColor: cfg.color, backgroundColor: cfg.color + '22' }]}>
            <Ionicons name={cfg.icon as any} size={32} color={cfg.color} />
          </View>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <View style={[styles.btnRow, buttons.length === 1 && { justifyContent: 'center' }]}>
            {buttons.map((btn, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.btn,
                  btn.style === 'destructive' && styles.btnDestructive,
                  btn.style === 'cancel' && styles.btnCancel,
                  btn.style === 'default' && styles.btnDefault,
                  buttons.length === 1 && { flex: 0, paddingHorizontal: 40 },
                ]}
                onPress={btn.onPress}
              >
                <Text style={[
                  styles.btnText,
                  btn.style === 'destructive' && styles.btnTextDestructive,
                  btn.style === 'cancel' && styles.btnTextCancel,
                ]}>
                  {btn.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Hook for easy usage
type AlertState = {
  visible: boolean;
  title: string;
  message?: string;
  buttons: ButtonConfig[];
  type?: 'info' | 'success' | 'error' | 'warning';
};

export function useAppAlert() {
  const [alertState, setAlertState] = React.useState<AlertState>({
    visible: false, title: '', buttons: [],
  });

  const showAlert = (
    title: string,
    message?: string,
    buttons?: ButtonConfig[],
    type?: 'info' | 'success' | 'error' | 'warning'
  ) => {
    setAlertState({
      visible: true, title, message,
      buttons: buttons ?? [{ text: 'OK', onPress: () => hide(), style: 'default' }],
      type: type ?? 'info',
    });
  };

  const hide = () => setAlertState(s => ({ ...s, visible: false }));

  const alertComponent = (
    <AppAlert
      visible={alertState.visible}
      title={alertState.title}
      message={alertState.message}
      buttons={alertState.buttons}
      type={alertState.type}
      onDismiss={hide}
    />
  );

  return { showAlert, hideAlert: hide, alertComponent };
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  box: {
    width: 320, backgroundColor: COLORS.secondary,
    borderRadius: 20, padding: 28, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.surface,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 20, elevation: 10,
  },
  iconCircle: {
    width: 64, height: 64, borderRadius: 32,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16, borderWidth: 2,
  },
  title: { fontSize: 18, fontWeight: '800', color: COLORS.text, textAlign: 'center', marginBottom: 8 },
  message: { fontSize: 14, color: COLORS.muted, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  btnRow: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 8 },
  btn: {
    flex: 1, height: 46, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: COLORS.accent,
  },
  btnDefault: { backgroundColor: COLORS.accent },
  btnDestructive: { backgroundColor: COLORS.error },
  btnCancel: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: COLORS.surface },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  btnTextDestructive: { color: '#fff' },
  btnTextCancel: { color: COLORS.muted },
});
