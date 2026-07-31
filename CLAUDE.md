# Smart Toy - Resumen de estado actual para Claude

## 1. Qué es este proyecto
Smart Toy es una app móvil y backend para acompañar a niños con un juguete inteligente, rutinas, historias generadas por IA y chat con un personaje virtual.

## 2. Stack tecnológico

### Backend
- Node.js + TypeScript
- Express
- TypeORM
- PostgreSQL
- JWT para autenticación
- Groq SDK para IA conversacional
- Pollinations.ai para generar imágenes de historias y avatares

### Mobile
- React Native + Expo
- React Navigation
- Expo Secure Store para almacenamiento seguro
- Axios para API
- React Native Calendars para selección de fecha
- React Native Vector Icons

## 3. Arquitectura general
- Backend expone una API REST bajo /api
- Mobile consume la API con servicios centralizados en mobile/src/services
- La navegación principal se gestiona con RootNavigator y TabNavigator
- Los datos del usuario se guardan en el backend y el token en storage seguro del dispositivo

## 4. Funcionalidades ya implementadas

### Autenticación
- Registro de usuarios
- Login con email/contraseña
- Generación y uso de JWT
- Perfil autenticado
- Persistencia de sesión en mobile

Archivos clave:
- backend/src/controllers/authController.ts
- backend/src/routes/auth.ts
- backend/src/middleware/auth.ts
- mobile/src/screens/auth/LoginScreen.tsx
- mobile/src/screens/auth/RegisterScreen.tsx

### Gestión de niños
- Crear niño
- Listar niños del usuario autenticado
- Editar niño
- Eliminar niño
- Campos: nombre, fecha de nacimiento, género
- Relación con juguete (opcional)

Archivos clave:
- backend/src/controllers/childController.ts
- backend/src/models/Child.ts
- mobile/src/screens/dashboard/ChildListScreen.tsx
- mobile/src/screens/dashboard/ChildFormScreen.tsx

### Gestión de juguetes
- Crear juguete
- Listar juguetes
- Editar juguete
- Eliminar juguete
- Asignar juguete a un niño
- Personalidad y contexto del juguete para IA
- Avatar generado automáticamente con imagen IA
- Conectar/desconectar juguete
- Chat con IA usando el juguete como personaje
- Historial de mensajes guardado en base de datos

Archivos clave:
- backend/src/controllers/toyController.ts
- backend/src/models/Toy.ts
- backend/src/models/Message.ts
- mobile/src/screens/dashboard/ToyListScreen.tsx
- mobile/src/screens/dashboard/ToyFormScreen.tsx
- mobile/src/screens/dashboard/ChatScreen.tsx

### Rutinas
- Crear rutinas
- Listar rutinas
- Editar rutinas
- Eliminar rutinas
- Campos: nombre, hora, repetir, mensaje, acción adicional
- HomeScreen muestra la próxima rutina

Archivos clave:
- backend/src/controllers/rutinaController.ts
- backend/src/models/Rutina.ts
- mobile/src/screens/dashboard/RutinasScreen.tsx
- mobile/src/screens/dashboard/RutinaFormScreen.tsx
- mobile/src/screens/dashboard/HomeScreen.tsx

### Historias con IA
- Generar historias con IA
- Guardar historias en base de datos
- Listar historias del usuario
- Ver detalle de una historia
- Compartir historia
- Eliminar historia
- Imagen asociada generada automáticamente

Archivos clave:
- backend/src/controllers/storyController.ts
- backend/src/models/Story.ts
- backend/src/services/aiService.ts
- mobile/src/screens/dashboard/HistoriasScreen.tsx
- mobile/src/screens/dashboard/GenerarHistoriaScreen.tsx
- mobile/src/screens/dashboard/HistoriaDetalleScreen.tsx

### Navegación y pantallas de app
- Navegación por stack principal
- Tabs inferiores para Inicio, Rutinas, Historias, Música, Conversaciones y Más
- Pantallas existentes para:
  - AuthLoading
  - Login
  - Register
  - Home
  - ChildList / ChildForm
  - ToyList / ToyForm / Chat
  - Rutinas / RutinaForm
  - Historias / GenerarHistoria / HistoriaDetalle
  - Ingles, Juegos, Conversaciones, Perfil, Configuración, Música, Más

Archivos clave:
- mobile/src/navigation/RootNavigator.tsx
- mobile/src/navigation/TabNavigator.tsx

## 5. Base de datos
Se usa TypeORM con PostgreSQL y sincronización automática (synchronize: true).

Entidades implementadas:
- User
- Child
- Toy
- Message
- Rutina
- Story

## 6. Servicios y utilidades importantes
- mobile/src/services/api.ts: centraliza llamadas al backend
- mobile/src/services/storage.ts: manejo de token/usuario según plataforma
- mobile/src/services/auth.ts: servicio de perfil del usuario
- mobile/src/services/notificationService.ts: existe scaffolding para notificaciones

## 7. Estado visual y UX actual
- UI móvil bastante avanzada con pantallas estilizadas y navegación clara
- Hay pantallas con cards, botones, modales y formularios
- Se usa un alert customizado para mensajes del usuario
- HomeScreen ya muestra saludo dinámico, estado de conexión y próxima rutina

## 8. Cosas que ya están bien hechas
- Separación entre backend y mobile
- CRUD de entidades principales
- Integración de IA para chat y generación de historias
- Navegación funcional
- Persistencia de sesiones y mensajes
- Relación entre niños, juguetes e historias por usuario

## 9. Posibles mejoras o puntos a revisar
- La URL base de la API está hardcodeada a localhost en mobile/src/services/api.ts
- Algunas pantallas de mobile usan window.confirm y localStorage, lo cual es poco apropiado para React Native si se quiere compatibilidad real con móvil
- Hay algunos detalles de implementación que conviene revisar para limpieza y consistencia
- Falta revisar si todas las pantallas están realmente conectadas a los flujos finales del usuario o si algunas son prototipos

## 10. Puntos de entrada recomendados para continuar
Si Claude va a seguir trabajando, los puntos más importantes son:
1. Backend: controllers/routes/models para niños, juguetes, rutinas e historias
2. Mobile: navegación y pantallas de dashboard
3. Integración IA: aiService.ts
4. API connection: mobile/src/services/api.ts

## 11. Resumen corto para Claude
El proyecto ya tiene una base sólida de backend + app móvil con autenticación, gestión de niños/juguetes, rutinas, historias generadas por IA y chat con un juguete. La estructura general está bien organizada y el flujo principal está funcional a nivel de código.
