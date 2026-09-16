# 🐼 Firmware ESP32 — Panda Inteligente ("Panda_Fisico_BT")

Este firmware convierte cualquier placa **ESP32 DevKit** en el subsistema sensorial y de expresiones físicas del muñeco peluche Panda, trabajando en sincronía con el teléfono celular secundario ("Panda Inside").

---

## 📐 Diagrama de Conexiones (Pinout)

```
                       ESP32 DevKit (30 / 38 pines)
                             +---------------+
      [Cabeza: Caricias] --->| GPIO 4  (T0)  |
   [Mano Izq: Cuentos]   --->| GPIO 15 (T3)  |
   [Mano Der: Inglés]    --->| GPIO 13 (T4)  |
      [Pecho: Abrazos]   --->| GPIO 27 (T7)  |
                             |               |
 [LEDs WS2812B Ojos Data]<---| GPIO 18       |
  [Motor Vibración NPN]  <---| GPIO 19       |
                             |               |
       [Power Bank 5V]   --->| VIN (5V)      |
       [Power Bank GND]  --->| GND           |
                             +---------------+
```

### 1. Sensores Táctiles Capacitivos
- El ESP32 incluye pines con detección táctil capacitiva por hardware (`touchRead`).
- Se conectan láminas de papel aluminio, tela conductora o cable de cobre adheridas internamente a:
  - **Cabeza:** `GPIO 4` (`T0`)
  - **Mano Izquierda:** `GPIO 15` (`T3`)
  - **Mano Derecha:** `GPIO 13` (`T4`)
  - **Pecho:** `GPIO 27` (`T7`)

### 2. Ojos con LEDs WS2812B (NeoPixel)
- 2 anillos de 8 LEDs NeoPixel (o matrices circulares) colocados detrás de los ojos acrílicos del peluche.
- **VCC:** 5V (desde Power Bank o pin VIN del ESP32).
- **GND:** GND común.
- **DIN (Datos):** `GPIO 18` (se recomienda una resistencia de 330Ω en serie).

### 3. Motor de Vibración Háptico
- Pequeño motor tipo disco de 3V/5V.
- Conectado a `GPIO 19` a través de un transistor NPN (2N2222) o MOSFET con diodo flyback 1N4001 para proteger el ESP32.

---

## ⚡ Alimentación
- **Batería externa (Power Bank 10.000 mAh):**
  - Salida USB 1: Celular Android (mantiene el teléfono siempre cargado).
  - Salida USB 2 (o bifurcación): ESP32 (pin VIN + GND).
- **Interruptor General:** Corta la alimentación del Power Bank para apagar todo el peluche sin desmontarlo.

---

## 📡 Protocolo Bluetooth Serial ("Panda_Fisico_BT")

El ESP32 y el Celular Android se comunican mediante Bluetooth Clásico (SPP).

### Eventos enviados por el ESP32 hacia el Celular:
- `TOUCH:HEAD` -> Se acarició la cabeza.
- `TOUCH:HAND_L` -> Se tocó la mano izquierda.
- `TOUCH:HAND_R` -> Se tocó la mano derecha.
- `TOUCH:CHEST` -> Se abrazó el peluche.

### Comandos recibidos por el ESP32 desde el Celular:
- `1` o `HUG` -> Activa ojos de corazón y pulso de vibración (latido).
- `LED:HEART` -> Ojos de corazón rojo/magenta.
- `LED:TALK` -> Ojos reactivos que pulsan mientras el altavoz habla.
- `LED:HAPPY` -> Ojos de arco sonriente verde esmeralda.
- `LED:SLEEP` -> Ojos ámbar tenue cálido (modo rutina de dormir).
- `LED:NORMAL` -> Ojos celestes suaves con parpadeo automático.
- `VIB:PULSE` -> Pulso de vibración suave.
