# 📱 Recursos de la Aplicación - StepMoney

## Cómo agregar tu ícono personalizado

### 1. Preparar los archivos

Coloca en esta carpeta:

| Archivo | Tamaño | Descripción |
|---------|--------|-------------|
| `icon.png` | 1024x1024 px | Ícono de la app (requerido) |
| `icon-foreground.png` | 1024x1024 px | Ícono adaptativo Android (opcional) |
| `icon-background.png` | 1024x1024 px | Fondo del ícono adaptativo (opcional) |
| `splash.png` | 2732x2732 px | Pantalla de carga (opcional) |

### 2. Recomendaciones para el ícono

- **Formato:** PNG con transparencia
- **Área segura:** Mantén el contenido importante en el centro (80% del área)
- **Sin texto pequeño:** Los íconos se ven muy pequeños en el teléfono
- **Colores sólidos:** Evita degradados muy sutiles
- **Bordes redondeados:** Android los agrega automáticamente

### 3. Generar los íconos

Una vez tengas tu `icon.png` en esta carpeta, ejecuta:

```bash
npx @capacitor/assets generate
```

Esto generará automáticamente todos los tamaños necesarios para:
- ✅ Android (todos los tamaños mipmap)
- ✅ iOS (si tienes la plataforma agregada)
- ✅ Web (favicons)

### 4. Sincronizar con las plataformas

Después de generar, ejecuta:

```bash
npx cap sync
```

### 5. Para Play Store / App Store

| Tienda | Tamaño del ícono | Formato |
|--------|------------------|---------|
| Google Play Store | 512x512 px | PNG de 32 bits |
| Apple App Store | 1024x1024 px | PNG sin transparencia |

---

## Íconos Adaptativos de Android (Opcional)

Android 8.0+ usa íconos adaptativos con dos capas:
- `icon-foreground.png`: El logo/símbolo (con área transparente)
- `icon-background.png`: El fondo (color sólido o patrón)

Si solo proporcionas `icon.png`, se usará como ícono legacy.

---

## Herramientas recomendadas para crear íconos

1. **Figma** (gratis) - https://figma.com
2. **Canva** (gratis) - https://canva.com
3. **Android Asset Studio** - https://romannurik.github.io/AndroidAssetStudio/
4. **App Icon Generator** - https://appicon.co/

