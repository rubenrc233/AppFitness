# iOS Setup Guide - FitTrack

## Requisitos previos
- macOS (Monterey o superior recomendado)
- Xcode 14+ instalado desde App Store
- CocoaPods instalado (`sudo gem install cocoapods`)
- Node.js 18+

## Pasos para configurar iOS

### 1. Generar el proyecto nativo iOS
Desde la carpeta `frontend/`, ejecuta:

```bash
npx expo prebuild --platform ios --clean
```

Este comando generará todos los archivos nativos de iOS necesarios.

### 2. Instalar dependencias de CocoaPods
```bash
cd ios
pod install
```

Si tienes problemas, intenta:
```bash
pod install --repo-update
```

### 3. Abrir en Xcode
```bash
open FitTrack.xcworkspace
```

**IMPORTANTE**: Siempre abre el archivo `.xcworkspace`, NO el `.xcodeproj`

### 4. Configurar el equipo de desarrollo
1. Abre el proyecto en Xcode
2. Selecciona el target "FitTrack"
3. Ve a "Signing & Capabilities"
4. Selecciona tu Team de desarrollo
5. Xcode generará automáticamente el provisioning profile

### 5. Ejecutar la app
- Selecciona un simulador o dispositivo físico
- Presiona Cmd+R o el botón de Play

## Comandos útiles

```bash
# Iniciar con Expo
npm start

# Correr directamente en iOS
npm run ios

# Build de desarrollo con EAS
eas build --platform ios --profile development

# Build de producción con EAS
eas build --platform ios --profile production
```

## Solución de problemas comunes

### Error: "pod install" falla
```bash
cd ios
pod deintegrate
pod cache clean --all
pod install --repo-update
```

### Error: Signing issues
- Asegúrate de tener una cuenta de desarrollador de Apple
- En Xcode: Preferences > Accounts > Agregar tu Apple ID

### Error: Build failed
```bash
# Limpia el proyecto
cd ios
xcodebuild clean -workspace FitTrack.xcworkspace -scheme FitTrack

# O desde Xcode: Product > Clean Build Folder (Cmd+Shift+K)
```

## Configuración para App Store

Para subir a App Store, necesitas:
1. Cuenta de Apple Developer ($99/año)
2. App Store Connect configurado
3. Certificados y provisioning profiles de distribución

Actualiza `eas.json` con tus credenciales:
```json
"submit": {
  "production": {
    "ios": {
      "appleId": "tu@email.com",
      "ascAppId": "123456789",
      "appleTeamId": "XXXXXXXXXX"
    }
  }
}
```

Luego ejecuta:
```bash
eas submit --platform ios
```
