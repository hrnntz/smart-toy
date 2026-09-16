/*
 * ==============================================================================
 * PROYECTO: SMART TOY PANDA - FIRMWARE ESP32 ("PANDA_FISICO_BT")
 * ==============================================================================
 * Descripción:
 *   Firmware para el módulo ESP32 DevKit que se ubica dentro del muñeco peluche
 *   Panda junto al teléfono celular secundario ("Panda Inside").
 * 
 * Funcionalidades:
 *   1. Bluetooth Clásico (SPP) bajo el nombre "Panda_Fisico_BT".
 *   2. Sensores táctiles capacitivos integrados (TouchPins):
 *      - Cabeza (Caricias / Cosquillas)
 *      - Manos (Juegos / Cuentos / Saludo)
 *      - Pecho (Detección de Abrazos)
 *   3. LEDs WS2812B / NeoPixel en los Ojos:
 *      - Expresión Normal (Azul suave)
 *      - Expresión de Corazón (Abrazos)
 *      - Expresión de Habla (Reactivo al audio)
 *      - Expresión de Sueño (Ámbar tenue / Noche)
 *   4. Motor de Vibración Háptico (Simulación de latido / ronroneo en abrazos).
 * ==============================================================================
 */

#include "BluetoothSerial.h"
#include <Adafruit_NeoPixel.h>

#if !defined(CONFIG_BT_ENABLED) || !defined(CONFIG_BLUEDROID_ENABLED)
#error "Bluetooth no está habilitado en este ESP32. Habilítalo en el menú de Arduino IDE."
#endif

BluetoothSerial SerialBT;

// ==============================================================================
// CONFIGURACIÓN DE PINES (GPIO)
// ==============================================================================
// Sensores Capacitivos (Touch Pins del ESP32):
#define TOUCH_PIN_HEAD     T0  // GPIO 4  - Cabeza (Caricias)
#define TOUCH_PIN_HAND_L   T3  // GPIO 15 - Mano Izquierda (Cuentos / Juegos)
#define TOUCH_PIN_HAND_R   T4  // GPIO 13 - Mano Derecha (Inglés / Canciones)
#define TOUCH_PIN_CHEST    T7  // GPIO 27 - Pecho (Abrazos)

// Umbral de detección táctil capacitiva (Típicamente < 40 indica toque)
#define TOUCH_THRESHOLD    35  

// LEDs WS2812B para Ojos (2 anillos o tiras, ej: 8 a 16 LEDs en total):
#define LED_PIN            18  // GPIO 18 para la línea de datos NeoPixel
#define NUM_LEDS_EYE       8   // LEDs por ojo (8 LEDs c/u = 16 LEDs totales)
#define NUM_LEDS           (NUM_LEDS_EYE * 2)

Adafruit_NeoPixel strip(NUM_LEDS, LED_PIN, NEO_GRB + NEO_KHZ800);

// Motor de Vibración Háptico (Conectado mediante transistor NPN / MOSFET):
#define VIBRATION_PIN      19  // GPIO 19

// LED Indicador de estado en placa (opcional):
#define STATUS_LED         2   // GPIO 2

// ==============================================================================
// ESTADOS Y VARIABLES DE CONTROL
// ==============================================================================
enum EyeExpression {
  EYES_NORMAL,
  EYES_HEART,
  EYES_TALK,
  EYES_BLINK,
  EYES_SLEEP,
  EYES_HAPPY
};

EyeExpression currentExpression = EYES_NORMAL;
unsigned long expressionStartTime = 0;
unsigned long expressionDuration = 0;

// Filtro anti-rebote para sensores táctiles (Debounce en ms)
unsigned long lastTouchHead = 0;
unsigned long lastTouchHandL = 0;
unsigned long lastTouchHandR = 0;
unsigned long lastTouchChest = 0;
const unsigned long DEBOUNCE_DELAY = 1200; // 1.2 segundos entre eventos

// Temporizadores para animaciones
unsigned long lastBlinkTime = 0;
bool isBlinking = false;

// Declaraciones de funciones
void setEyesColor(uint8_t r, uint8_t g, uint8_t b);
void triggerHeartEyes(unsigned long durationMs);
void setEyesHappy();
void triggerHappyEyes(unsigned long durationMs);
void updateEyeAnimations(unsigned long now);
void pulseVibration(int durationMs);
void handleBluetoothCommand(String cmd);
void checkCapacitiveSensors(unsigned long now);

// ==============================================================================
// SETUP
// ==============================================================================
void setup() {
  Serial.begin(115200);
  pinMode(VIBRATION_PIN, OUTPUT);
  digitalWrite(VIBRATION_PIN, LOW);
  
  pinMode(STATUS_LED, OUTPUT);
  digitalWrite(STATUS_LED, LOW);

  // Inicializar Tira NeoPixel de los Ojos
  strip.begin();
  strip.setBrightness(60); // Brillo moderado para evitar calentamiento
  setEyesColor(0, 150, 255); // Azul celeste suave inicial
  strip.show();

  // Iniciar Bluetooth Serial con el nombre esperado por la app Android
  SerialBT.begin("Panda_Fisico_BT");
  Serial.println("=================================================");
  Serial.println(" Panda Inteligente ESP32 listo y transmitiendo");
  Serial.println(" Nombre Bluetooth: Panda_Fisico_BT");
  Serial.println("=================================================");

  // Señal visual de inicio (pequeño pulso)
  pulseVibration(150);
}

// ==============================================================================
// LOOP PRINCIPAL
// ==============================================================================
void loop() {
  unsigned long now = millis();

  // 1. Procesar Comandos entrantes desde el Celular Android vía Bluetooth
  if (SerialBT.available()) {
    String cmd = SerialBT.readStringUntil('\n');
    cmd.trim();
    if (cmd.length() > 0) {
      handleBluetoothCommand(cmd);
    }
  }

  // 2. Leer Sensores Capacitivos Táctiles (Cabeza, Manos, Pecho)
  checkCapacitiveSensors(now);

  // 3. Manejo de Animaciones de Ojos y Restablecimiento de Expresión
  updateEyeAnimations(now);

  delay(20);
}

// ==============================================================================
// PROCESAMIENTO DE COMANDOS DEL CELULAR ANDROID
// ==============================================================================
void handleBluetoothCommand(String cmd) {
  Serial.print("Comando recibido del Celular: ");
  Serial.println(cmd);

  // Comando legado de abrazo ("1") o explícito ("HUG" / "LED:HEART")
  if (cmd == "1" || cmd == "HUG" || cmd == "LED:HEART") {
    triggerHeartEyes(4000);
    pulseVibration(350); // Vibración suave simulando latido
    SerialBT.println("ACK:HUG_RECEIVED");
  } 
  else if (cmd == "LED:TALK") {
    currentExpression = EYES_TALK;
    expressionStartTime = millis();
    expressionDuration = 3000;
  }
  else if (cmd == "LED:HAPPY") {
    setEyesHappy();
    currentExpression = EYES_HAPPY;
    expressionStartTime = millis();
    expressionDuration = 4000;
  }
  else if (cmd == "LED:SLEEP") {
    setEyesColor(180, 80, 0); // Color ámbar muy tenue cálido
    currentExpression = EYES_SLEEP;
    expressionDuration = 0; // Se mantiene hasta otro comando
  }
  else if (cmd == "LED:NORMAL") {
    setEyesColor(0, 150, 255);
    currentExpression = EYES_NORMAL;
  }
  else if (cmd == "VIB:PULSE") {
    pulseVibration(250);
  }
}

// ==============================================================================
// LECTURA DE SENSORES CAPACITIVOS TÁCTILES
// ==============================================================================
void checkCapacitiveSensors(unsigned long now) {
  // A. Sensor de la Cabeza (Caricias / Cosquillas)
  int valHead = touchRead(TOUCH_PIN_HEAD);
  if (valHead < TOUCH_THRESHOLD && (now - lastTouchHead > DEBOUNCE_DELAY)) {
    lastTouchHead = now;
    Serial.println(">> ¡Toque en la CABEZA detectado!");
    SerialBT.println("TOUCH:HEAD");
    pulseVibration(80);
    triggerHappyEyes(2500);
  }

  // B. Sensor de Mano Izquierda (Cuentos / Juegos)
  int valHandL = touchRead(TOUCH_PIN_HAND_L);
  if (valHandL < TOUCH_THRESHOLD && (now - lastTouchHandL > DEBOUNCE_DELAY)) {
    lastTouchHandL = now;
    Serial.println(">> ¡Toque en MANO IZQUIERDA detectado!");
    SerialBT.println("TOUCH:HAND_L");
    pulseVibration(100);
  }

  // C. Sensor de Mano Derecha (Inglés / Canciones)
  int valHandR = touchRead(TOUCH_PIN_HAND_R);
  if (valHandR < TOUCH_THRESHOLD && (now - lastTouchHandR > DEBOUNCE_DELAY)) {
    lastTouchHandR = now;
    Serial.println(">> ¡Toque en MANO DERECHA detectado!");
    SerialBT.println("TOUCH:HAND_R");
    pulseVibration(100);
  }

  // D. Sensor de Pecho (Detección de Abrazo Físico)
  int valChest = touchRead(TOUCH_PIN_CHEST);
  if (valChest < TOUCH_THRESHOLD && (now - lastTouchChest > DEBOUNCE_DELAY)) {
    lastTouchChest = now;
    Serial.println(">> ¡ABRAZO FÍSICO en el pecho detectado!");
    SerialBT.println("TOUCH:CHEST");
    triggerHeartEyes(5000);
    pulseVibration(400); // Doble latido
    delay(100);
    pulseVibration(250);
  }
}

// ==============================================================================
// CONTROL DE ANIMACIONES DE LEDS (WS2812B NEOPIXEL)
// ==============================================================================
void setEyesColor(uint8_t r, uint8_t g, uint8_t b) {
  for (int i = 0; i < NUM_LEDS; i++) {
    strip.setPixelColor(i, strip.Color(r, g, b));
  }
  strip.show();
}

void triggerHeartEyes(unsigned long durationMs) {
  currentExpression = EYES_HEART;
  expressionStartTime = millis();
  expressionDuration = durationMs;

  for (int i = 0; i < NUM_LEDS; i++) {
    if (i % NUM_LEDS_EYE == 1 || i % NUM_LEDS_EYE == 2 || i % NUM_LEDS_EYE == 5 || i % NUM_LEDS_EYE == 6) {
      strip.setPixelColor(i, strip.Color(255, 20, 80)); // Rosa fuerte
    } else {
      strip.setPixelColor(i, strip.Color(255, 0, 30));  // Rojo vivo
    }
  }
  strip.show();
}

void setEyesHappy() {
  for (int i = 0; i < NUM_LEDS; i++) {
    if (i % NUM_LEDS_EYE < (NUM_LEDS_EYE / 2)) {
      strip.setPixelColor(i, strip.Color(0, 255, 120)); // Verde esmeralda alegre
    } else {
      strip.setPixelColor(i, strip.Color(0, 0, 0));
    }
  }
  strip.show();
}

void triggerHappyEyes(unsigned long durationMs) {
  currentExpression = EYES_HAPPY;
  expressionStartTime = millis();
  expressionDuration = durationMs;
  setEyesHappy();
}

void updateEyeAnimations(unsigned long now) {
  if (expressionDuration > 0 && (now - expressionStartTime > expressionDuration)) {
    expressionDuration = 0;
    currentExpression = EYES_NORMAL;
    setEyesColor(0, 150, 255); // Regresa a azul celeste normal
  }

  if (currentExpression == EYES_NORMAL) {
    if (now - lastBlinkTime > 5000) {
      lastBlinkTime = now;
      setEyesColor(0, 0, 0);
      delay(120);
      setEyesColor(0, 150, 255);
    }
  }

  if (currentExpression == EYES_TALK) {
    uint8_t breath = (sin(now / 150.0) * 80) + 160;
    setEyesColor(0, breath, 255);
  }
}

// ==============================================================================
// VIBRACIÓN HÁPTICA
// ==============================================================================
void pulseVibration(int durationMs) {
  digitalWrite(VIBRATION_PIN, HIGH);
  delay(durationMs);
  digitalWrite(VIBRATION_PIN, LOW);
}
