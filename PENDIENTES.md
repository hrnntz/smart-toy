# Pendientes y Hoja de Ruta - Smart Toy

Este documento resume los avances realizados, los elementos pendientes y la hoja de ruta para la maduración del proyecto Smart Toy.

---

## 🚀 Estado Actual y Mejoras Recientes (Completado)

- [x] **Compilación y Corrección de Errores TypeScript Backend:**
  - Reinstalación de `typeorm@0.3.26` y corrección de tipos.
  - Ajuste de `tsconfig.json` en backend (`moduleResolution: Node16`, `lib: ["ES2022", "DOM"]`).
  - Resolución de errores de tipos implícitos y librerías externas.

- [x] **Endpoints del Backend e Integración Mobile:**
  - Implementación de `GET/PUT /api/child/profile` y `GET/PUT /api/config` (`DeviceConfig`).
  - Implementación de `GET /api/story/:id` para visualización detallada de historias.

- [x] **Navegación y Almacenamiento Mobile:**
  - Registro de `MusicaScreen` en `RootNavigator.tsx`.
  - Cierre de sesión completo en `MasScreen.tsx` (limpieza de `token` y `user`).
  - Recarga automática en `ConversacionesScreen.tsx` mediante `useFocusEffect`.
  - Sustitución de APIs solo web (`window.confirm`, `localStorage`) por abstracciones móviles nativas (`Alert`, `@react-native-async-storage/async-storage`).

- [x] **Manejo de Red y Entorno:**
  - Configuración de URL base de API centralizada en `mobile/src/config/env.ts` (Soporte para `EXPO_PUBLIC_API_URL` y emulador Android `10.0.2.2`).
  - SSL configurable en `backend/src/config/database.ts` vía variable de entorno `DB_SSL`.

---

## 📋 Pendientes Prioritarios (Por Implementar)

### 🔴 Prioridad Alta (Funcionalidades Principales & Backend)

1. **Migraciones de Base de Datos (TypeORM):**
   - Actualmente el backend usa `synchronize: true` en `database.ts`.
   - *Falta:* Desactivar `synchronize` para entornos de producción e implementar CLI de TypeORM con migraciones SQL reproducibles y seguras.

2. **Capa de Validación de Entradas (`class-validator` / `zod`):**
   - *Falta:* Implementar DTOs y middleware de validación en rutas de autenticación, niños, juguetes, rutinas, mensajes y configuración para rechazar payloads malformados o incompletos.

3. **Integración Real de WebSockets / Socket.io:**
   - `socket.io` está instalado en `backend/package.json`, pero no está inicializado en `index.ts`.
   - *Falta:* Crear el servidor de WebSockets para comunicación bidireccional en tiempo real entre la app móvil, el backend y el juguete físico.

4. **Integración Real de Audio (STT / TTS / Reproducción):**
   - La pantalla `MusicaScreen.tsx` simula reproducción en interfaz y el chat usa únicamente texto (`Groq`).
   - *Falta:* Integrar `expo-av` para reproducción real de audio/sonidos y servicio de conversión Voz a Texto (Speech-to-Text) y Texto a Voz (Text-to-Speech) para interacción hablada con Panda.

---

## 🟡 Prioridad Media (Experiencia de Usuario & App Mobile)

5. **Pantalla y Flujo de Supervisión por Cámara:**
   - La opción "Supervisión" en `HomeScreen.tsx` muestra un mensaje de "Próximamente".
   - *Falta:* Crear la pantalla `SupervisionScreen.tsx` con soporte para streaming de video/cámara WebRTC o RTSP.

6. **Minijuegos Interactivos Funcionales (`JuegosScreen.tsx`):**
   - Actualmente los juegos muestran un modal indicando que estarán disponibles pronto.
   - *Falta:* Implementar al menos 2 minijuegos educativos interactivos (ej: Adivinanzas, Matemáticas básicas) con contador de puntuación.

7. **Registro de Token de Notificaciones Push:**
   - `notificationService.ts` gestiona notificaciones locales, pero falta registrar el push token en la base de datos vinculada al usuario.

---

## 🟢 Prioridad Baja (Infraestructura, Pruebas & CI/CD)

8. **Pruebas Automatizadas (Unitarias e Integración):**
   - Backend: Configurar Jest / Supertest para probar controladores de Auth, Toy, Child y Story.
   - Mobile: Configurar React Native Testing Library / Jest para probar componentes y navegación.

9. **Dockerización y Despliegue:**
   - Crear `Dockerfile` y `docker-compose.yml` para levantar PostgreSQL y el backend con un solo comando.

10. **Pipeline CI/CD:**
    - Configurar GitHub Actions (`.github/workflows/ci.yml`) para ejecutar comprobación de tipos (`tsc --noEmit`), linting y tests en cada Pull Request.

---

## 📌 Resumen de Próximos Pasos Recomendados

1. **Paso 1:** Implementar capa de validación de entradas DTO con `zod` o `class-validator` en el Backend.
2. **Paso 2:** Configurar `socket.io` en Backend para eventos en tiempo real.
3. **Paso 3:** Integrar `expo-av` en Mobile para reproducción real de audio en `MusicaScreen`.
4. **Paso 4:** Configurar flujo de migraciones TypeORM para PostgreSQL.
