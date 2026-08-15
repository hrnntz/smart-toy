/**
 * CustomAlert component — HeroUI Native v1
 *
 * Replaces the hand-rolled Modal+Animated implementation with heroui-native's
 * Alert compound component displayed inside a Modal overlay.
 *
 * Preserves the original API exactly:
 *  - visible: boolean
 *  - title: string
 *  - message: string
 *  - onClose: () => void
 *  - type?: 'info' | 'success' | 'error' | 'warning'  (new optional prop)
 */
import React from 'react';
import { Modal, View } from 'react-native';
import { Alert, Button } from 'heroui-native';

type AlertType = 'info' | 'success' | 'error' | 'warning';

type AlertStatus = 'accent' | 'success' | 'danger' | 'warning' | 'default';

const typeToStatus: Record<AlertType, AlertStatus> = {
  info: 'accent',
  success: 'success',
  error: 'danger',
  warning: 'warning',
};

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  type?: AlertType;
}

export default function CustomAlert({
  visible,
  title,
  message,
  onClose,
  type = 'info',
}: CustomAlertProps) {
  const status = typeToStatus[type];

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-backdrop px-6">
        <View className="w-full max-w-sm bg-overlay rounded-3xl p-5 gap-4 shadow-overlay">
          <Alert status={status}>
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>{title}</Alert.Title>
              <Alert.Description>{message}</Alert.Description>
            </Alert.Content>
          </Alert>

          <Button
            variant="primary"
            onPress={onClose}
            className="w-full"
          >
            <Button.Label>Aceptar</Button.Label>
          </Button>
        </View>
      </View>
    </Modal>
  );
}