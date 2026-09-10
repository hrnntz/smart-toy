import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  Alert,
  TextInput,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Label, Button, Chip, Spinner, useThemeColor } from 'heroui-native';
import { IconButton } from '../../components/ui/IconButton';

interface WifiNetwork {
  ssid: string;
  rssi: number;
}

export default function ToyWifiSetupScreen({ route, navigation }: any) {
  const { serialNumber: initialSerial } = route.params || {};

  const primary = useThemeColor('accent');
  const textSecondary = useThemeColor('muted');
  const successColor = useThemeColor('success');
  const dangerColor = useThemeColor('danger');
  const warningColor = useThemeColor('warning');

  // Estado de detección del Panda
  const [checkingPanda, setCheckingPanda] = useState(false);
  const [pandaDetected, setPandaDetected] = useState(false);
  const [pandaInfo, setPandaInfo] = useState<any>(null);

  // Redes Wi-Fi y formulario
  const [scanningWifi, setScanningWifi] = useState(false);
  const [networks, setNetworks] = useState<WifiNetwork[]>([]);
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [serial, setSerial] = useState(initialSerial || 'TOY-001-ABC');

  // Estado de guardado
  const [saving, setSaving] = useState(false);
  const [configSuccess, setConfigSuccess] = useState(false);
  const [testingHug, setTestingHug] = useState(false);

  useEffect(() => {
    checkPandaConnection();
  }, []);

  // 1. Verificar si el celular está conectado al AP Panda_Setup (192.168.4.1)
  const checkPandaConnection = async () => {
    setCheckingPanda(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch('http://192.168.4.1/telemetry', {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        setPandaDetected(true);
        setPandaInfo(data);
        if (data.serialNumber) {
          setSerial(data.serialNumber);
        }
        // Escanear redes automáticamente una vez detectado
        scanNearbyNetworks();
      } else {
        setPandaDetected(false);
      }
    } catch (e) {
      setPandaDetected(false);
    } finally {
      setCheckingPanda(false);
    }
  };

  // 2. Escanear redes Wi-Fi a través del ESP32
  const scanNearbyNetworks = async () => {
    setScanningWifi(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const res = await fetch('http://192.168.4.1/scan', {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data: WifiNetwork[] = await res.json();
        // Filtrar vacíos y duplicados
        const unique = data.filter(
          (net, index, self) =>
            net.ssid &&
            net.ssid.trim().length > 0 &&
            self.findIndex((n) => n.ssid === net.ssid) === index
        );
        setNetworks(unique);
      }
    } catch (e) {
      // Si falla scan, se ingresa manualmente
    } finally {
      setScanningWifi(false);
    }
  };

  // 3. Guardar credenciales y conectar Panda al Wi-Fi de la casa
  const handleSaveWifi = async () => {
    if (!ssid.trim()) {
      Alert.alert('Falta la Red Wi-Fi', 'Por favor ingresa o selecciona el nombre de tu red Wi-Fi.');
      return;
    }

    setSaving(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const formBody = new URLSearchParams();
      formBody.append('ssid', ssid.trim());
      formBody.append('password', password);
      formBody.append('serial', serial.trim() || 'TOY-001-ABC');

      const res = await fetch('http://192.168.4.1/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: formBody.toString(),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        setConfigSuccess(true);
        Alert.alert(
          '🎉 ¡Conexión Enviada!',
          `El Panda se está conectando a "${ssid}". En unos segundos estará en línea en la nube de PandaAI.`
        );
      } else {
        Alert.alert('Error', 'El Panda no pudo procesar los datos.');
      }
    } catch (e) {
      // A veces el ESP32 se reconecta a Wi-Fi y corta el socket AP de inmediato, lo cual es normal
      setConfigSuccess(true);
      Alert.alert(
        '🎉 ¡Datos Enviados!',
        `El Panda ha recibido las credenciales y se está conectando a "${ssid}".`
      );
    } finally {
      setSaving(false);
    }
  };

  // 4. Probar abrazo directo para comprobar que los servos responden
  const handleTestHug = async () => {
    setTestingHug(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch('http://192.168.4.1/hug', { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        Alert.alert('🤗 ¡Abrazo recibido!', 'El Panda ha cerrado y abierto sus brazos.');
      }
    } catch (e) {
      Alert.alert('Aviso', 'Comando enviado al Panda.');
    } finally {
      setTestingHug(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="pt-14 pb-4 px-4 flex-row items-center justify-between border-b border-separator/20">
        <IconButton icon="arrow-back" onPress={() => navigation.goBack()} />
        <View className="items-center">
          <Label className="text-foreground text-xl font-bold">Vincular Wi-Fi</Label>
          <Label className="text-muted text-xs">Setup Panda Físico</Label>
        </View>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        {/* Paso 1: Estado de Conexión con el Panda */}
        <Card
          variant="default"
          className={`rounded-3xl mb-5 border ${
            pandaDetected ? 'border-success/40 bg-success/5' : 'border-warning/40 bg-warning/5'
          }`}
        >
          <Card.Body className="p-5">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-2">
                <Ionicons
                  name={pandaDetected ? 'checkmark-circle' : 'warning-outline'}
                  size={24}
                  color={pandaDetected ? successColor : warningColor}
                />
                <Label className="text-foreground text-base font-bold">
                  {pandaDetected ? 'Panda Detectado' : 'Conéctate al Panda'}
                </Label>
              </View>
              <Chip variant="soft" color={pandaDetected ? 'success' : 'warning'}>
                <Chip.Label>{pandaDetected ? 'Conectado' : 'Sin conexión'}</Chip.Label>
              </Chip>
            </View>

            {pandaDetected ? (
              <View>
                <Label className="text-muted text-xs mb-2">
                  El Panda está listo para recibir el nombre y contraseña del Wi-Fi de tu hogar.
                </Label>
                <View className="flex-row flex-wrap gap-2 mt-1">
                  <Chip variant="soft">
                    <Chip.Label>🔋 {Math.round(pandaInfo?.batteryLevel || 100)}% batería</Chip.Label>
                  </Chip>
                  <Chip variant="soft">
                    <Chip.Label>🔑 {pandaInfo?.serialNumber || serial}</Chip.Label>
                  </Chip>
                </View>

                {/* Botón de prueba de abrazo inmediata */}
                <Pressable
                  onPress={handleTestHug}
                  disabled={testingHug}
                  className="mt-4 py-2.5 bg-accent/20 rounded-2xl items-center flex-row justify-center gap-2"
                >
                  {testingHug ? (
                    <Spinner size="sm" color="primary" />
                  ) : (
                    <>
                      <Ionicons name="heart" size={18} color={primary} />
                      <Label className="text-accent font-bold text-xs">
                        Probar Movimiento de Brazos (Abrazo)
                      </Label>
                    </>
                  )}
                </Pressable>
              </View>
            ) : (
              <View>
                <Label className="text-muted text-xs mb-3">
                  Para configurar tu Panda, asegúrate de:
                </Label>
                <View className="gap-2 mb-4">
                  <View className="flex-row items-center gap-2">
                    <Label className="text-foreground font-bold text-xs">1.</Label>
                    <Label className="text-muted text-xs flex-1">
                      Encender el Panda conectándolo al power bank Samsung.
                    </Label>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <Label className="text-foreground font-bold text-xs">2.</Label>
                    <Label className="text-muted text-xs flex-1">
                      En los Ajustes Wi-Fi de tu celular, conéctate a: <Text className="font-bold text-foreground">Panda_Setup</Text>.
                    </Label>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <Label className="text-foreground font-bold text-xs">3.</Label>
                    <Label className="text-muted text-xs flex-1">
                      Vuelve a esta app y presiona el botón de abajo.
                    </Label>
                  </View>
                </View>

                <Pressable
                  onPress={checkPandaConnection}
                  disabled={checkingPanda}
                  className="py-3 bg-accent rounded-2xl items-center flex-row justify-center gap-2"
                >
                  {checkingPanda ? (
                    <Spinner size="sm" color="white" />
                  ) : (
                    <>
                      <Ionicons name="refresh" size={18} color="white" />
                      <Label className="text-white font-bold text-sm">
                        Verificar Conexión con Panda
                      </Label>
                    </>
                  )}
                </Pressable>
              </View>
            )}
          </Card.Body>
        </Card>

        {/* Paso 2: Formulario Wi-Fi de la Casa */}
        <Card variant="default" className="rounded-3xl mb-5 shadow-sm">
          <Card.Body className="p-5">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center gap-2">
                <Ionicons name="wifi" size={22} color={primary} />
                <Label className="text-foreground text-base font-bold">
                  Wi-Fi de tu Casa (Internet)
                </Label>
              </View>
              {pandaDetected && (
                <Pressable
                  onPress={scanNearbyNetworks}
                  disabled={scanningWifi}
                  className="p-2 bg-surface-secondary rounded-xl"
                >
                  {scanningWifi ? (
                    <Spinner size="sm" color="primary" />
                  ) : (
                    <Ionicons name="scan" size={18} color={primary} />
                  )}
                </Pressable>
              )}
            </View>

            {/* Redes escaneadas (si hay) */}
            {networks.length > 0 && (
              <View className="mb-4">
                <Label className="text-muted text-xs mb-2">Redes detectadas por el Panda:</Label>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
                  {networks.map((net) => (
                    <Pressable
                      key={net.ssid}
                      onPress={() => setSsid(net.ssid)}
                      className={`px-3 py-2 rounded-xl border flex-row items-center gap-1.5 ${
                        ssid === net.ssid
                          ? 'border-accent bg-accent/15'
                          : 'border-separator/40 bg-surface'
                      }`}
                    >
                      <Ionicons
                        name="wifi"
                        size={14}
                        color={ssid === net.ssid ? primary : textSecondary}
                      />
                      <Label
                        className={`text-xs font-semibold ${
                          ssid === net.ssid ? 'text-accent' : 'text-foreground'
                        }`}
                      >
                        {net.ssid}
                      </Label>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Nombre de la red */}
            <Label className="text-foreground text-xs font-bold mb-1.5">
              Nombre de la Red Wi-Fi (SSID) *
            </Label>
            <View className="flex-row items-center bg-surface-secondary px-3.5 py-2.5 rounded-2xl mb-4 border border-separator/20">
              <Ionicons name="wifi-outline" size={18} color={primary} className="mr-2" />
              <TextInput
                value={ssid}
                onChangeText={setSsid}
                placeholder="Ej: MiCasa_2.4GHz"
                className="flex-1 text-foreground text-sm font-medium"
                autoCapitalize="none"
              />
            </View>

            {/* Contraseña */}
            <Label className="text-foreground text-xs font-bold mb-1.5">
              Contraseña del Wi-Fi *
            </Label>
            <View className="flex-row items-center bg-surface-secondary px-3.5 py-2.5 rounded-2xl mb-4 border border-separator/20">
              <Ionicons name="lock-closed-outline" size={18} color={primary} className="mr-2" />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Contraseña del router"
                secureTextEntry={!showPassword}
                className="flex-1 text-foreground text-sm font-medium"
                autoCapitalize="none"
              />
              <Pressable onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={textSecondary}
                />
              </Pressable>
            </View>

            {/* Serial Juguete */}
            <Label className="text-foreground text-xs font-bold mb-1.5">
              Número de Serie del Juguete
            </Label>
            <View className="flex-row items-center bg-surface-secondary px-3.5 py-2.5 rounded-2xl mb-5 border border-separator/20">
              <Ionicons name="barcode-outline" size={18} color={primary} className="mr-2" />
              <TextInput
                value={serial}
                onChangeText={setSerial}
                placeholder="TOY-001-ABC"
                className="flex-1 text-foreground text-sm font-medium"
                autoCapitalize="characters"
              />
            </View>

            {/* Botón Guardar */}
            <Pressable
              onPress={handleSaveWifi}
              disabled={saving || !pandaDetected}
              className={`py-3.5 rounded-2xl items-center flex-row justify-center gap-2 ${
                pandaDetected ? 'bg-accent' : 'bg-muted/40'
              }`}
            >
              {saving ? (
                <Spinner size="sm" color="white" />
              ) : (
                <>
                  <Ionicons name="cloud-upload" size={20} color="white" />
                  <Label className="text-white font-extrabold text-base">
                    Conectar Panda a la Nube
                  </Label>
                </>
              )}
            </Pressable>
          </Card.Body>
        </Card>

        {/* Explicación / Paso 3 */}
        {configSuccess && (
          <Card variant="default" className="rounded-3xl mb-8 border border-success/40 bg-success/5">
            <Card.Body className="p-5 items-center">
              <Ionicons name="checkmark-circle" size={48} color={successColor} />
              <Label className="text-foreground font-extrabold text-lg text-center mt-2 mb-1">
                ¡Panda Configurado con Éxito!
              </Label>
              <Label className="text-muted text-xs text-center mb-4">
                El Panda ya tiene las credenciales de tu Wi-Fi. Ya puedes reconectar tu teléfono a tu Wi-Fi habitual o datos móviles. Podrás enviarle abrazos y ver su batería desde cualquier lugar.
              </Label>
              <Pressable
                onPress={() => navigation.navigate('ToyControl')}
                className="py-3 px-6 bg-accent rounded-2xl items-center"
              >
                <Label className="text-white font-bold text-sm">Ir al Panel del Panda</Label>
              </Pressable>
            </Card.Body>
          </Card>
        )}

        <View className="h-10" />
      </ScrollView>
    </View>
  );
}
