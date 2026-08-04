# 🐼 Smart Toy / PandaAI

> ⚠️ **Prototipo en desarrollo temprano.** Proyecto académico/personal en construcción activa — puede contener errores, funcionalidades incompletas y cambios drásticos entre versiones.

App móvil para acompañar a niños con un juguete inteligente: gestión de rutinas, historias generadas por IA, chat con un personaje virtual y perfil del niño, conectado a un prototipo de hardware (ESP32 + peluche panda).

## 📱 Qué hace

- Autenticación de padres (registro/login con JWT)
- Gestión de niños y juguetes vinculados
- Chat con IA usando el juguete como personaje (personalidad y contexto configurables)
- Generación de historias infantiles con IA + imagen ilustrativa
- Rutinas diarias con recordatorios
- Panel con estado del dispositivo, próxima rutina y actividad reciente

## 🛠️ Stack técnico

**Backend**
- Node.js + TypeScript + Express
- TypeORM + PostgreSQL
- JWT para autenticación
- Groq SDK (chat conversacional)
- Pollinations.ai (generación de imágenes, sin API key)

**Mobile**
- React Native + Expo (SDK 54)
- React Navigation
- Axios + Expo Secure Store
- React Native Calendars

**Infraestructura**
- Base de datos: [Neon](https://neon.tech) (PostgreSQL serverless, free tier)
- Backend: [Render](https://render.com) (free tier, auto-deploy desde `main`)
- Mobile: Expo Go / EAS Build

## 📂 Estructura del proyecto
smart-toy/
├── backend/ # API REST (Node + TypeScript + TypeORM)
│ └── src/
│ ├── controllers/
│ ├── models/
│ ├── routes/
│ ├── middleware/
│ └── config/
├── mobile/ # App React Native (Expo)
│ └── src/
│ ├── screens/
│ ├── services/
│ ├── navigation/
│ └── config/
├── PENDIENTES.md # Roadmap y tareas pendientes
└── Tree.md # Árbol de estructura detallado

## 🚀 Desarrollo local

### Backend

```bash
cd backend
npm install
```

Crea `backend/.env`:
```env
PORT=3000
NODE_ENV=development
DB_HOST=tu_host_neon
DB_PORT=5432
DB_NAME=tu_db
DB_USER=tu_usuario
DB_PASSWORD=tu_password
JWT_SECRET=un_secreto_random
GROQ_API_KEY=tu_api_key
```

```bash
npm run dev
```

### Mobile

```bash
cd mobile
npm install
```

Crea `mobile/.env`:
```env
EXPO_PUBLIC_API_URL=https://smart-toy.onrender.com/api
```

```bash
npx expo start -c
```

Escanea el QR con **Expo Go** (Android/iOS).

## 📦 Estado actual

| Funcionalidad | Estado |
|---|---|
| Autenticación | ✅ |
| Gestión de niños | ✅ |
| Gestión de juguetes + chat IA | ✅ |
| Rutinas | ✅ |
| Rutinas (Notificaciones) |🚧 En desarrollo |
| Historias con IA | ✅ |
| Música y sonidos | 🚧 En desarrollo |
| Aprender inglés | 🚧 En desarrollo |
| Juegos educativos | 🚧 En desarrollo |
| Supervisión (cámara) | 🚧 Placeholder |

Ver [`PENDIENTES.md`](./PENDIENTES.md) para el roadmap detallado.

## 🔒 Notas

Este es un proyecto en construcción, sin publicar en tiendas de apps. La API pública en Render está en su tier gratuito, por lo que puede tardar unos segundos en responder tras periodos de inactividad (cold start).

---

Desarrollado como proyecto personal/académico — Universidad de Córdoba.
