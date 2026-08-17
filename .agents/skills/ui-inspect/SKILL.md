---
name: ui-inspect
description: >-
  Utiliza esta skill cuando el usuario pida inspeccionar la UI (ui-inspect), revisar la pantalla (check-screen) o evaluar el diseño en React Native mediante ADB. Captura la pantalla del dispositivo Android y realiza un análisis visual.
---

# UI Inspection Skill (React Native)

Cuando el usuario invoque esta skill para inspeccionar la UI, debes seguir estos pasos al pie de la letra:

## Pasos

1. Asegúrate de que exista el directorio `.debug_ui` en la raíz del proyecto. Si no existe, créalo:
   ```powershell
   New-Item -ItemType Directory -Force -Path .debug_ui
   ```

2. Ejecuta los comandos de ADB para capturar la pantalla del dispositivo Android conectado y guardarla en el directorio:
   ```powershell
   adb shell screencap -p /sdcard/current_screen.png
   adb pull /sdcard/current_screen.png .debug_ui/current_screen.png
   adb shell rm /sdcard/current_screen.png
   ```

3. Lee la imagen generada usando la herramienta `view_file` indicando la ruta absoluta hacia `.debug_ui/current_screen.png`.

4. Realiza un análisis visual detallado de la pantalla capturada, evaluando los siguientes aspectos:
   - Layout general y jerarquía visual.
   - Paddings y margins (consistencia y espaciado adecuado).
   - Alineaciones de los elementos.
   - Contraste de colores y legibilidad.
   - Consistencia tipográfica.
   - Posibles desbordamientos de texto o contenido (overflows).

5. Redacta y presenta al usuario un reporte estructurado con los hallazgos y sugiere mejoras específicas en el código de React Native.
