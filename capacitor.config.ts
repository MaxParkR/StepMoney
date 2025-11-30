import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // TODO: Cambia este appId por uno único antes de generar el APK final
  // Formato recomendado: com.tuempresa.stepmoney o com.tunombre.stepmoney
  appId: 'com.stepmoney.app',
  appName: 'StepMoney',
  webDir: 'www',
  
  // Configuración de plugins
  plugins: {
    // Configuración del Splash Screen
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#3CA8E8',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
      splashFullScreen: false,
      splashImmersive: false
    },
    
    // Configuración de notificaciones locales
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#3CA8E8',
      sound: 'beep.wav'
    },
    
    // Configuración de la barra de estado
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#F8FAFC',
      overlaysWebView: false
    }
  },
  
  // Configuración específica de Android
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
      releaseType: 'APK' // o 'AAB' para Google Play Store
    }
  },
  
  // Configuración para desarrollo
  server: {
    // Descomentar para usar con live reload en dispositivo físico
    // url: 'http://192.168.1.X:8100',
    // cleartext: true
  }
};

export default config;
