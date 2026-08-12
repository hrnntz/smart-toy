# 🐼 Smart Toy / PandaAI — Plataforma para Padres

Plataforma móvil y backend inteligente de acompañamiento para niños mediante juguetes conectados (**PandaAI**): gestión de rutinas, interacción por voz con IA (Groq + ElevenLabs), supervisión remota por cámara en vivo en la nube (4G/5G/Wi-Fi), minijuegos educativos con dificultad adaptativa e historias con IA.

---

## 📱 Funcionalidades Principales

- 👨‍👩‍👧‍👦 **Plataforma para Padres:** Panel de control para gestionar juguetes, monitorear actividad, configurar perfiles de niños y controlar la experiencia del juguete.
- 🎙️ **"Hablar con Panda" (Voz en Tiempo Real):**
  - **Reconocimiento de Voz (STT):** Transcripción de voz mediante **Groq Whisper** (`whisper-large-v3`).
  - **Memoria de Conversación:** Groq LLM (`llama-3.1-8b-instant`) recuerda los últimos 15 mensajes del historial guardados en PostgreSQL.
  - **Voz de Panda con IA (TTS):** Síntesis de voz ultrarrealista de personaje infantil usando **ElevenLabs API**.
- 📹 **Supervisión por Cámara en Vivo en la Nube:**
  - **Modo Visor (App del Padre):** Monitoreo remoto en tiempo real accesible desde cualquier lugar con 4G/5G o Wi-Fi, visión nocturna, audio y captura de foto.
  - **Modo Transmisor (Teléfono Cámara / Juguete):** Emisión continua de video con `expo-camera` y WebSockets (Socket.io Cloud Relay).
- 🎮 **Minijuegos Educativos con IA Groq:**
  - **10 Preguntas por Sesión:** Retos dinámicos adaptados al nivel y juego (Lógica, Matemáticas, Lectura, Memoria).
  - **Selector de Dificultad:** Niveles **Fácil**, **Medio** y **Difícil**.
  - **Explicaciones Educativas en Fallos:** Si el niño se equivoca, la app destaca la respuesta correcta y despliega una tarjeta explicativa amigable redactada por la IA.
- 🎵 **Música & Nanas Generadas con IA:**
  - Generador de música ambiental para dormir mediante prompts (*"Canción de cuna suave con piano y lluvia"*).
  - Reproductor interactivo estilo Spotify/Apple Music con controles de play, pausa, reanudación y favoritos.
- 📖 **Cuentos e Historias con IA:** Generación de cuentos ilustrados por IA con imágenes temáticas.
- ⏰ **Gestión de Rutinas:** Recordatorios configurables para dormir, cepillarse los dientes o estudiar.

---

## 🛠️ Stack Técnico

### Backend
- **Core:** Node.js + TypeScript + Express.
- **Base de Datos:** TypeORM + PostgreSQL (soporte para migraciones CLI y `synchronize` dinámico).
- **IA Conversacional & Voice:** Groq SDK (`llama-3.1-8b-instant`, `whisper-large-v3`) + ElevenLabs API (TTS).
- **WebSockets:** Socket.io (streaming de cámara en la nube y eventos en tiempo real).
- **Validación & Seguridad:** Middleware de validación con **Zod**, JWT y Helmet.

### Mobile
- **Core:** React Native + Expo (SDK 54).
- **Cámara & Multimedia:** `expo-camera`, `expo-av` para audio, `socket.io-client`.
- **Navegación:** React Navigation 7.
- **Almacenamiento:** Axios, `@react-native-async-storage/async-storage`, Expo Secure Store.

### Infraestructura & DevOps
- **Dockerization:** `Dockerfile` multi-stage optimizado para backend Node.js.
- **Docker Compose:** [`docker-compose.yml`](./docker-compose.yml) para orquestar PostgreSQL 16 + Backend con un solo comando.
- **Pipeline CI/CD:** GitHub Actions workflow ([`.github/workflows/ci.yml`](./.github/workflows/ci.yml)) con comprobación automática de tipos TypeScript en cada PR/Push.
- **Compilación Mobile:** Proceso local de Release APK con Gradle (`gradlew assembleRelease`).

---

## 📂 Estructura del Proyecto

```
smart-toy/
├── backend/                  # API REST & WebSockets (Node + TypeScript + TypeORM)
│   ├── src/
│   │   ├── controllers/      # Controladores (Auth, Toy, Game, Music, Config, etc.)
│   │   ├── middleware/       # Auth JWT y Validación con Zod
│   │   ├── models/           # Entidades TypeORM (User, Child, Toy, Message, etc.)
│   │   ├── routes/           # Rutas API Express
│   │   ├── services/         # aiService (Groq), elevenlabsService, socket
│   │   └── socket.ts         # Servidor de WebSockets (Cámara & Status)
│   └── Dockerfile            # Dockerfile multi-stage para backend
├── mobile/                   # App React Native para Padres (Expo SDK 54)
│   ├── android/              # Configuración nativa de Android y Gradle wrapper
│   └── src/
│       ├── navigation/       # RootNavigator y TabNavigator
│       ├── screens/          # Todas las pantallas rediseñadas para padres
│       │   ├── dashboard/    # Home, Supervision, CameraBroadcaster, Juegos, Chat, Musica, etc.
│       │   └── auth/         # Login, Register, AuthLoading
│       └── services/         # API Service, audioService, notificationService
├── .github/workflows/ci.yml  # Pipeline de CI/CD GitHub Actions
├── docker-compose.yml        # Orquestador Docker (PostgreSQL + Backend)
├── PENDIENTES.md             # Estado de avances y roadmap del proyecto
└── Tree.md                   # Estructura completa de archivos
```

---

## 🚀 Desarrollo Local

### 1. Backend

```bash
cd backend
npm install
```

Crea `backend/.env`:
```env
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=smart_toy
DB_USER=postgres
DB_PASSWORD=postgrespassword
JWT_SECRET=super_secret_jwt_key
GROQ_API_KEY=tu_groq_api_key
ELEVENLABS_API_KEY=tu_elevenlabs_api_key
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
```

Iniciar servidor local:
```bash
npm run dev
```

### 2. Levantamiento con Docker Compose (Recomendado)

```bash
docker compose up -d --build
```
Levanta PostgreSQL 16 y el Backend en contenedores aislados.

### 3. Mobile (React Native / Expo)

```bash
cd mobile
npm install
```

Crea `mobile/.env`:
```env
EXPO_PUBLIC_API_URL=http://tu_ip_local:3000/api
```

Iniciar Expo:
```bash
npx expo start -c
```

---

## 📦 Estado Actual del Proyecto

| Funcionalidad | Estado |
|---|---|
| Autenticación de Padres (JWT + Zod) | ✅ Completado |
| Gestión de Niños y Juguetes | ✅ Completado |
| Chat con IA + Memoria de Contexto (Groq LLM) | ✅ Completado |
| "Hablar con Panda" (STT Groq Whisper + ElevenLabs TTS) | ✅ Completado |
| Supervisión por Cámara en Vivo en la Nube (4G/5G/Wi-Fi) | ✅ Completado |
| Modo Transmisor de Cámara (`expo-camera` + Socket.io) | ✅ Completado |
| Minijuegos IA (10 Preguntas + Dificultad + Explicación en Error) | ✅ Completado |
| Música & Nanas IA por Prompt + Player Spotify Style | ✅ Completado |
| Historias Infantiles Ilustradas con IA | ✅ Completado |
| Rutinas y Recordatorios Diarios | ✅ Completado |
| Rediseño Global de UI (Todas las Pantallas de Padres) | ✅ Completado |
| Dockerization + Docker Compose | ✅ Completado |
| GitHub Actions CI/CD Pipeline | ✅ Completado |
| Compilación de APK Release de Android | ✅ APK Generado (~74.5 MB) |

Ver [`PENDIENTES.md`](./PENDIENTES.md) para el roadmap detallado.

## 🔒 Notas

Este es un proyecto en construcción, sin publicar en tiendas de apps. La API pública en Render está en su tier gratuito, por lo que puede tardar unos segundos en responder tras periodos de inactividad (cold start).

---

## 📱 Binario APK Compilado

El instalador ejecutable para dispositivos Android se encuentra disponible en la siguiente ruta del repositorio:
`mobile/android/app/build/outputs/apk/release/app-release.apk`

---

## 🔒 Notas del Proyecto

Desarrollado como proyecto avanzado para el acompañamiento interactivo y supervisión parental de juguetes inteligentes — Universidad de Córdoba.
