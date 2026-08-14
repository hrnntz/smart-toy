# 🐼 Smart Toy (PandaAI) — Plataforma Interactiva para Padres y Niños

![Status](https://img.shields.io/badge/Status-En_Desarrollo-orange)
![Mobile](https://img.shields.io/badge/Mobile-React_Native_Expo-blue)
![Backend](https://img.shields.io/badge/Backend-Node.js_Express-green)
![AI](https://img.shields.io/badge/AI-Groq_ElevenLabs-purple)

PandaAI es una plataforma móvil y backend inteligente diseñada para el acompañamiento interactivo de niños mediante juguetes conectados. Ofrece gestión de rutinas, interacción por voz impulsada por IA, supervisión remota por cámara en tiempo real, minijuegos educativos con dificultad adaptativa, e historias generadas dinámicamente.

---

## ✨ Funcionalidades Principales

*   **📱 Panel Parental Integral:** Aplicación para gestionar múltiples juguetes, monitorear la actividad, configurar perfiles infantiles y adaptar la experiencia del juguete.
*   **🎙️ Interacción de Voz en Tiempo Real ("Hablar con Panda"):**
    *   **STT (Speech-to-Text):** Transcripción rápida y precisa con **Groq Whisper** (`whisper-large-v3`).
    *   **Cerebro IA:** Motor conversacional con memoria contextual apoyado en **Groq LLM** (`llama-3.1-8b-instant`), manteniendo un historial fluido.
    *   **TTS (Text-to-Speech):** Síntesis de voz natural y expresiva utilizando **ElevenLabs API** para dar vida al personaje.
*   **📹 Supervisión Remota de Video en Vivo:**
    *   Acceso desde la nube (4G/5G/Wi-Fi) a través de un sistema de retransmisión con WebSockets (Socket.io).
    *   Modo emisor desde el juguete/dispositivo y modo visor seguro para los padres.
*   **🎮 Juegos Educativos Adaptativos:**
    *   Sesiones de 10 preguntas dinámicas (Lógica, Matemáticas, Lectura, Memoria).
    *   Niveles ajustables (Fácil, Medio, Difícil).
    *   Feedback inteligente: explicaciones amigables redactadas por la IA cuando el niño comete un error.
*   **🎵 Música y Nanas Generativas:**
    *   Creación de música ambiental mediante prompts (ej. "Música suave de lluvia").
    *   Reproductor interactivo con interfaz estilo Spotify.
*   **📖 Historias y Cuentos IA:** Cuentos ilustrados generados de manera única por IA.
*   **⏰ Rutinas y Recordatorios:** Alarmas personalizables para crear hábitos (dormir, estudiar, lavarse los dientes).

---

## 🛠️ Stack Tecnológico

### ⚙️ Backend
*   **Core:** Node.js, TypeScript, Express.
*   **Base de Datos:** PostgreSQL con **TypeORM** (soporte para migraciones y sincronización).
*   **IA & Voz:** Groq SDK y ElevenLabs API.
*   **Tiempo Real:** Socket.io para streaming de cámara y estado en vivo.
*   **Seguridad y Validación:** Zod, JWT, Helmet.

### 📱 Mobile (App Padres)
*   **Framework:** React Native + Expo (SDK 54).
*   **Navegación:** React Navigation 7.
*   **Multimedia:** `expo-camera`, `expo-av`, Socket.io-client.
*   **Almacenamiento:** Axios, AsyncStorage, Expo Secure Store.

### 🚀 Infraestructura y DevOps
*   **Contenedores:** Docker (Dockerfile multi-stage) y Docker Compose para despliegue unificado (PostgreSQL + Backend).
*   **CI/CD:** GitHub Actions para validación estática de tipos (TypeScript) en cada PR.

---

## 📂 Estructura del Proyecto

```text
smart-toy/
├── backend/                  # API REST & WebSockets
│   ├── src/                  # Controladores, Servicios, Modelos TypeORM
│   ├── Dockerfile            # Construcción optimizada del servidor
│   └── package.json
├── mobile/                   # App Expo para Padres
│   ├── src/                  # Componentes, Pantallas, Navegación
│   ├── android/              # Build nativo de Android
│   └── package.json
├── design/                   # Prototipos y assets (Figma)
├── docker-compose.yml        # Orquestación de contenedores
└── .github/workflows/ci.yml  # Pipelines de integración continua
```

---

## 💻 Desarrollo Local y Ejecución

### 1. Iniciar el Backend (con Docker - Recomendado)
La forma más rápida de levantar la base de datos y la API es utilizando Docker Compose:

```bash
docker compose up -d --build
```
> Esto iniciará un contenedor de PostgreSQL (puerto 5432) y la API de Node.js (puerto 3000).

*Alternativa Manual (Sin Docker):*
```bash
cd backend
npm install
# Crea un archivo .env basado en las variables requeridas (DB_*, GROQ_API_KEY, ELEVENLABS_API_KEY, etc.)
npm run dev
```

### 2. Iniciar la App Mobile (Expo)
```bash
cd mobile
npm install
# Configura mobile/.env con EXPO_PUBLIC_API_URL=http://<TU_IP_LOCAL>:3000/api
npx expo start -c
```

---

## 📦 Estado de Desarrollo

- [x] Autenticación de Padres (JWT + Zod)
- [x] Gestión de Niños y Juguetes
- [x] Chat Inteligente con Memoria (Groq)
- [x] Interfaz de Voz en Tiempo Real (STT + TTS)
- [x] Supervisión por Cámara en Vivo (Socket.io)
- [x] Minijuegos Educativos y Feedback IA
- [x] Generador de Música e Historias
- [x] Entorno Docker y CI/CD GitHub Actions
- [x] Compilación inicial de APK (Android)

*Para más detalles sobre futuras integraciones, consulta los reportes internos (PENDIENTES.md).*

---

## 🎓 Notas Académicas
Desarrollado como proyecto avanzado para la exploración de acompañamiento interactivo y supervisión parental de juguetes inteligentes — **Universidad de Córdoba**. El servicio actual en la nube utiliza tiers gratuitos (Render) y puede presentar "cold starts" iniciales.
