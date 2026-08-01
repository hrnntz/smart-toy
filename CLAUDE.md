# Estado del repositorio para Claude

Este archivo resume lo que falta o está incompleto en Smart Toy para que Claude pueda trabajar con contexto claro.

## Resumen general

El proyecto ya tiene una base funcional bastante sólida:
- Backend con modelos y rutas para auth, niños, juguetes, rutinas, mensajes e historias.
- Mobile con navegación, pantallas de autenticación, dashboard y pantallas de gestión.
- Integración inicial entre mobile y backend.

Sin embargo, todavía quedan varias mejoras importantes antes de considerar el proyecto completamente maduro.

## Pendientes prioritarios

### 1. Migraciones de base de datos
- El backend usa `synchronize: true` en la configuración de TypeORM.
- Eso sirve para desarrollo, pero no es adecuado para producción.
- Falta implementar un flujo de migraciones seguro y reproducible.

### 2. Validación compartida de entradas
- El backend tiene rutas separadas, pero no hay una capa clara de validación compartida.
- Se recomienda agregar una solución como `class-validator` o `zod` para validar payloads.
- Esto ayudaría a evitar errores por datos incompletos o mal formados.

### 3. Pruebas automáticas
- No parece haber una estrategia fuerte de pruebas en backend ni en mobile.
- Faltan pruebas unitarias/integración para servicios clave y flujos principales.
- Esto es importante para evitar regresiones al seguir desarrollando.

### 4. Mejoras de infraestructura y despliegue
- Falta una configuración más robusta de entorno para producción.
- Sería útil definir variables de entorno claras, pasos de despliegue y manejo de errores de red.
- También conviene revisar el manejo de secretos y configuraciones sensibles.

### 5. Limpieza y mantenibilidad
- Algunas partes del proyecto siguen siendo demo o prototipo, aunque ya se mejoraron bastante.
- Se recomienda revisar consistencia de nombres, estructura de servicios y reutilización de lógica.

## Archivos clave a revisar

- Backend:
  - [backend/src/config/database.ts](backend/src/config/database.ts)
  - [backend/src/controllers](backend/src/controllers)
  - [backend/src/routes](backend/src/routes)
  - [backend/src/models](backend/src/models)

- Mobile:
  - [mobile/src/services/api.ts](mobile/src/services/api.ts)
  - [mobile/src/config/env.ts](mobile/src/config/env.ts)
  - [mobile/src/screens](mobile/src/screens)

## Recomendación para Claude

Priorizar cambios en este orden:
1. Mejorar la robustez del backend.
2. Implementar validación de entrada.
3. Añadir pruebas básicas.
4. Refinar el flujo de despliegue y configuración.

## Nota importante

No conviene reescribir la arquitectura completa desde cero. Lo más rentable es ir mejorando lo que ya existe, manteniendo compatibilidad con el frontend y el flujo actual del proyecto.
