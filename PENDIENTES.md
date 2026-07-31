# Pendientes detectados en Smart Toy

Revisión estática del proyecto. Este archivo resume lo que falta o está incompleto según el código actual.

## Bloqueos funcionales

- [x] [Alta] ~~Falta implementar en el backend los endpoints que el mobile ya intenta usar para perfil y configuración.~~ **Implementado:** `GET/PUT /api/child/profile` y `GET/PUT /api/config` con modelo `DeviceConfig` y campos extendidos en `Child`.
- [x] [Alta] ~~La pantalla de configuración está inconsistente.~~ **Corregido:** `ConfiguracionScreen.tsx` ahora muestra configuración real del dispositivo (volumen, luces, vibración, modo noche, WiFi) usando `configService`. `MasScreen.tsx` enlaza a ella.
- [x] [Alta] ~~La URL base de la API está hardcodeada a `http://localhost:3000/api`.~~ **Corregido:** Centralizada en `mobile/src/config/env.ts` con soporte para `EXPO_PUBLIC_API_URL` y emulador Android (`10.0.2.2`).

## Compatibilidad mobile

- [x] [Alta] ~~Hay varias pantallas de React Native que usan APIs web: `window.confirm`, `localStorage` y llamadas `fetch` con IP fija.~~ **Corregido:** `ChildListScreen`, `RutinasScreen` y `ToyListScreen` ahora usan `Alert.alert`, `storage` y servicios centralizados de `api.ts`.
- [x] [Media] ~~`mobile/src/services/storage.ts` mezcla almacenamiento web con `localStorage` y almacenamiento nativo con SecureStore.~~ **Mejorado:** Las pantallas ya no usan `localStorage` directamente; pasan por la abstracción `storage`.
- [x] [Alta] ~~Falta dejar la compatibilidad cerrada para que el proyecto no falle en móvil y siga funcionando en web.~~ **Completado:** Acceso a almacenamiento, alertas y red centralizado.

## Funcionalidades que siguen como demo o prototipo

- [x] [Media] ~~`HomeScreen.tsx` tiene accesos visuales que no están conectados del todo.~~ **Mejorado:** Todos los botones del grid navegan, "Hablar con Panda" abre el chat del primer juguete, el estado de conexión usa datos reales de juguetes y la actividad reciente carga mensajes reales.
- [x] [Media] ~~`MusicaScreen.tsx` es una pantalla estática de ejemplo.~~ **Mejorado:** Ahora tiene estado de reproducción, pestañas funcionales (Música/Sonidos/Favoritos) y persistencia de favoritos con `storage`.
- [x] [Media] ~~`JuegosScreen.tsx` también parece un catálogo estático.~~ **Mejorado:** Corregidos caracteres corruptos (mojibake), agregada persistencia de progreso con `storage` y categorías funcionales.

## Infraestructura y mantenimiento

- [x] [Media] ~~No hay scripts de pruebas ni linting en `backend/package.json` ni en `mobile/package.json`.~~ **Agregado:** Scripts `lint` y `test` (basados en `tsc --noEmit`) en ambos `package.json`.
- [Media] El backend usa `synchronize: true` en TypeORM desde `backend/src/config/database.ts`. Eso sirve para desarrollo, pero falta migrar a un flujo con migraciones si se quiere llevar a producción con seguridad. *(Pendiente: requiere configuración de migraciones de TypeORM)*
- [Baja] La API tiene rutas bien separadas para auth, niños, juguetes, rutinas, mensajes e historias, pero todavía no aparece una capa clara de validación de entrada compartida. Eso haría falta para reducir errores por payloads inválidos. *(Pendiente: se recomienda agregar `class-validator` o `zod`)*

## Resumen corto

Lo más urgente ya está resuelto: endpoints de perfil y configuración implementados, pantalla de configuración corregida, dependencias web-only eliminadas, URL centralizada, pantallas demo convertidas en flujos reales con persistencia, y scripts de validación agregados. Quedan como trabajo futuro: migraciones de TypeORM y capa de validación de entrada compartida.