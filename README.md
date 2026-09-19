# 🐼 Smart Toy (PandaAI) — Plataforma Interactiva para Padres y Niños

![Status](https://img.shields.io/badge/Status-Proto_0.2-orange)
![Mobile](https://img.shields.io/badge/Mobile-React_Native_Expo-blue)
![Backend](https://img.shields.io/badge/Backend-Node.js_Express_TypeScript-green)
![Tests](https://img.shields.io/badge/Tests-Jest_40_Passed-brightgreen)
![Security](https://img.shields.io/badge/Security-Strix_AI_Scan-red)
![AI](https://img.shields.io/badge/AI-Groq_ElevenLabs-purple)

PandaAI es una plataforma integral de hardware y software diseñada para el acompañamiento interactivo, pedagógico y de supervisión infantil mediante un peluche inteligente conectado (ESP32), una API backend robusta en Node.js/TypeScript y una aplicación móvil para padres desarrollada en React Native y Expo.

---

## ✨ Funcionalidades Principales

* **📱 Panel Parental Integral:** Gestión de múltiples juguetes y perfiles infantiles, configuración de personalidades de IA, control de volumen y modo noche.
* **🎙️ Interacción de Voz en Tiempo Real ("Hablar con Panda"):**
  * **STT (Speech-to-Text):** Transcripción rápida y precisa con **Groq Whisper** (`whisper-large-v3`).
  * **Cerebro IA:** Motor conversacional contextual impulsado por **Groq LLM** (`openai/gpt-oss-20b` y familia Llama 3.3).
  * **TTS (Text-to-Speech):** Síntesis de voz natural y expresiva con **ElevenLabs API** (con voces infantiles y fallback transparente a Google Translate TTS).
* **🇬🇧 Módulo de Inglés (Estilo Duolingo):**
  * 5 etapas temáticas progresivas (Colores, Animales, Casa, Día a día, Colegio).
  * Evaluación de pronunciación por voz con tolerancia fonética adaptada al habla infantil.
  * Sistema de rachas diarias y cálculo dinámico de nivel (A1 a B1).
* **📹 Supervisión Remota de Video en Vivo:**
  * Retransmisión continua en tiempo real mediante **WebSockets (`Socket.io`)** con doble buffering anti-parpadeo.
  * Intercomunicador parental walkie-talkie y control remoto del peluche.
* **📖 Cuentos e Historias con IA:** Cuentos ilustrados generados dinámicamente con Groq y Pollinations.ai según temática, valores y edad.
* **⏰ Rutinas y Hábitos:** Alarmas y recordatorios personalizables con persistencia en base de datos y sincronización en tiempo real.
* **🎮 Minijuegos Educativos:** Sesiones dinámicas de preguntas de lógica, matemáticas y memoria con explicaciones amigables ante fallos.
* **🎵 Música y Nanas Generativas:** Compositor inteligente de nanas y música ambiental infantil.
* **🧸 Firmware ESP32 Físico:** Bluetooth Serial clásico (`Panda_Fisico_BT`), sensores táctiles capacitivos (cabeza, manos, pecho) y anillo LED NeoPixel para expresiones en los ojos.

---

## 🛠️ Stack Tecnológico

### ⚙️ Backend
* **Core:** Node.js, TypeScript, Express.
* **Base de Datos:** PostgreSQL con **TypeORM** (soporte para migraciones y SSL en la nube/Neon).
* **Testing:** **Jest** + **ts-jest** (40 pruebas unitarias automatizadas cubriendo validaciones Zod, middleware JWT y progresión de inglés).
* **IA & Multimedia:** Groq SDK, ElevenLabs API, Multer.
* **Tiempo Real:** Socket.io (streaming de video y telemetría).
* **Seguridad:** Zod, JWT (HS256), Helmet, Express Rate Limit.

### 📱 Mobile (App Padres y Dispositivo Panda)
* **Framework:** React Native + Expo (SDK 54).
* **Diseño UI:** **HeroUI Native** (`heroui-native`) con Tailwind CSS v4 y Uniwind.
* **Identidad Visual:** PandaAI Coral (`#E8533F`) y Deep Navy (`#0D0F16`) con soporte completo para modo claro y oscuro.
* **Navegación:** React Navigation 7 (Stack & Tabs).
* **Multimedia & Conectividad:** `expo-camera`, `expo-av`, Socket.io-client, Bluetooth Serial.

### 🔌 Firmware (ESP32)
* **Plataforma:** C++ / Arduino para ESP32 DevKit.
* **Periféricos:** BluetoothSerial (SPP), Tira LED NeoPixel WS2812B, Pines táctiles capacitivos (TouchPins), Motor de vibración háptico.

---

## 📂 Estructura del Repositorio

```text
smart-toy/
├── backend/                  # Servidor REST API & WebSockets
│   ├── src/
│   │   ├── __tests__/        # Suite de pruebas unitarias automatizadas (Jest)
│   │   ├── controllers/      # Controladores de negocio (auth, toy, rutina, english...)
│   │   ├── middleware/       # Autenticación JWT y validación
│   │   ├── models/           # Entidades TypeORM (PostgreSQL)
│   │   ├── routes/           # Enrutadores Express
│   │   ├── services/         # Integraciones de IA (Groq, ElevenLabs) y WebSockets
│   │   └── validators/       # Esquemas de validación Zod (VULN-hardened)
│   ├── jest.config.js        # Configuración de pruebas Jest + TypeScript
│   ├── Dockerfile            # Imagen multi-stage para producción
│   └── .env.example          # Plantilla documentada de variables de entorno
├── mobile/                   # Aplicación móvil React Native / Expo
│   ├── src/
│   │   ├── components/       # Componentes UI reutilizables (HeroUI)
│   │   ├── config/           # Entornos y URLs de conexión
│   │   ├── navigation/       # RootNavigator y TabNavigator
│   │   ├── screens/          # Pantallas de dashboard, IA, rutinas y supervisión
│   │   ├── services/         # Conexión API Axios, Bluetooth y Storage
│   │   └── theme/            # Tokens de diseño Coral y Navy
│   ├── global.css            # Configuración TailwindCSS / Uniwind
│   └── .env.example          # Plantilla de conexión para emuladores y nube
├── firmware/                 # Código fuente para el microcontrolador
│   └── esp32_panda/          # Sketch de Arduino para ESP32 DevKit
├── releases/                 # APKs independientes compilados listos para prueba
├── docker-compose.yml        # Orquestación de contenedores (PostgreSQL + API)
└── .github/workflows/        # Pipelines de Integración Continua (CI/CD)
    ├── ci.yml                # Typecheck, pruebas unitarias y compilación
    └── security.yml          # Auditoría automática de seguridad Strix AI
```

---

## 💻 Guía de Instalación y Ejecución Local

### Prerrequisitos
* **Node.js**: v20 o superior
* **PostgreSQL**: v14 o superior (o Docker)
* **npm**: v9 o superior
* **Expo Go** (en teléfono móvil) o Android Studio (emulador)

---

### Opción 1: Scripts Monorepo desde la Raíz (Recomendado)

Desde la carpeta raíz del proyecto puedes controlar ambos servicios:

```bash
# Instalar dependencias en backend y mobile
npm install --prefix backend
npm install --prefix mobile

# Correr la suite de 40 pruebas unitarias del backend
npm run backend:test

# Levantar el backend en modo desarrollo (nodemon)
npm run backend:dev

# Levantar la app móvil en Expo
npm run mobile:start
```

---

### Opción 2: Ejecución Manual Paso a Paso

#### 1. Configuración del Backend

```bash
cd backend
npm install

# Copiar la plantilla de variables de entorno:
cp .env.example .env
```

Edita `backend/.env` con tus credenciales:
```env
PORT=3000
NODE_ENV=development
JWT_SECRET=tu_clave_secreta_jwt_para_firmar_tokens
DB_HOST=localhost
DB_PORT=5432
DB_NAME=smart_toy
DB_USER=postgres
DB_PASSWORD=tu_password
GROQ_API_KEY=tu_api_key_de_groq
ELEVENLABS_API_KEY=tu_api_key_de_elevenlabs
```

Ejecutar las pruebas unitarias:
```bash
npm test
```

Iniciar el servidor:
```bash
npm run dev
```
> El backend estará disponible en `http://localhost:3000/api`.

#### 2. Configuración de la App Móvil

```bash
cd mobile
npm install

# Copiar la plantilla de variables de entorno:
cp .env.example .env
```

Edita `mobile/.env` según tu entorno de prueba:
```env
# Si pruebas en emulador de Android:
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000/api

# Si pruebas en la nube (Render):
# EXPO_PUBLIC_API_URL=https://smart-toy.onrender.com/api
```

Iniciar el servidor Metro de Expo:
```bash
npx expo start -c
```
* Presiona `a` para abrir el emulador de Android.
* O escanea el código QR con la aplicación **Expo Go** en tu dispositivo físico.

---

### Opción 3: Backend con Docker Compose

```bash
docker compose up -d --build
```
> Levanta automáticamente PostgreSQL y la API Node.js compilada en producción.

---

## 🧪 Pruebas Automatizadas

El backend incluye una suite de pruebas rigurosa con Jest:

```bash
cd backend
npm test
```

* **Validadores (`validators.test.ts`)**: 20 pruebas que verifican esquemas Zod para generación de historias (string/número), creación y actualización parcial de rutinas (`isActive`), registro/login seguro, perfiles infantiles y push tokens.
* **Autenticación (`authMiddleware.test.ts`)**: 8 pruebas que garantizan el correcto rechazo de tokens corruptos o faltantes y la asignación de usuarios autenticados.
* **Lógica Pedagógica (`englishProgression.test.ts`)**: 12 pruebas para la progresión por niveles Duolingo y la tolerancia fonética del algoritmo de pronunciación.

---

## 📦 Estado del Proyecto

- [x] Autenticación de Padres (JWT + Zod)
- [x] Gestión de Niños y Juguetes
- [x] Chat Inteligente con Memoria Contextual (Groq)
- [x] Interfaz de Voz en Tiempo Real (Whisper STT + ElevenLabs TTS)
- [x] Módulo de Aprendizaje de Inglés con Evaluación de Pronunciación
- [x] Supervisión por Cámara en Vivo con Doble Buffering (WebSockets)
- [x] Minijuegos Educativos y Feedback Pedagógico
- [x] Generador de Cuentos Ilustrados y Música Generativa
- [x] Suite de 40 Pruebas Unitarias Automatizadas (Jest)
- [x] Entorno Docker y CI/CD con GitHub Actions
- [x] Auditoría de Seguridad Automatizada con Strix AI

---

## 🎓 Notas Académicas

Desarrollado como proyecto de titulación en Ingeniería de Sistemas — **Universidad de Córdoba**.
Diseñado bajo principios de código limpio, contratos estrictos con Zod (*Parse, Don't Validate*), arquitectura desacoplada y separación de responsabilidades entre hardware embebido (ESP32), microservicios en la nube y clientes móviles.
