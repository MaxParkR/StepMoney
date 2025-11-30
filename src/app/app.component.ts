import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Platform } from '@ionic/angular';
import { StorageService } from './services/storage.service';
import { StatusBar, Style } from '@capacitor/status-bar';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  
  private isInitialized = false;

  constructor(
    private platform: Platform,
    private router: Router,
    private storageService: StorageService
  ) {}

  async ngOnInit() {
    await this.initializeApp();
  }

  /**
   * Inicializa la aplicación y verifica el onboarding
   * Espera a que la plataforma esté lista antes de continuar
   */
  private async initializeApp() {
    try {
      // Esperar a que la plataforma esté completamente lista
      await this.platform.ready();
      console.log('📱 Plataforma lista');

      // Configurar la barra de estado para dispositivos móviles
      await this.configureStatusBar();

      // Pequeña espera para asegurar que el localStorage esté accesible
      await this.delay(100);

      // Verificar estado del onboarding
      await this.checkOnboarding();
      
      this.isInitialized = true;
      console.log('📱 StepMoney inicializado completamente');
    } catch (error) {
      console.error('❌ Error al inicializar la app:', error);
      // En caso de error, ir al onboarding por seguridad
      this.router.navigateByUrl('/onboarding', { replaceUrl: true });
    }
  }

  /**
   * Verifica si el usuario ha completado el onboarding
   * Si no lo ha completado, redirige a la pantalla de bienvenida
   */
  private async checkOnboarding() {
    try {
      const onboardingComplete = await this.storageService.get('onboarding_complete');
      
      console.log('🔍 Estado de onboarding:', onboardingComplete);
      
      if (!onboardingComplete) {
        console.log('🆕 Nuevo usuario - Mostrando onboarding');
        this.router.navigateByUrl('/onboarding', { replaceUrl: true });
      } else {
        console.log('✅ Usuario existente - Cargando dashboard');
        // Asegurar que el usuario va al dashboard si ya completó el onboarding
        const currentUrl = this.router.url;
        if (currentUrl === '/' || currentUrl === '/onboarding') {
          this.router.navigateByUrl('/tabs/dashboard', { replaceUrl: true });
        }
      }
    } catch (error) {
      console.error('❌ Error al verificar onboarding:', error);
      // En caso de error, mostrar onboarding
      this.router.navigateByUrl('/onboarding', { replaceUrl: true });
    }
  }

  /**
   * Utilidad para esperar un tiempo determinado
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Configura la barra de estado para que no se superponga con el contenido
   * y tenga un estilo consistente con la app
   */
  private async configureStatusBar() {
    try {
      if (this.platform.is('capacitor')) {
        // Establecer el estilo de la barra de estado (iconos oscuros sobre fondo claro)
        await StatusBar.setStyle({ style: Style.Light });
        
        // Establecer el color de fondo de la barra de estado
        await StatusBar.setBackgroundColor({ color: '#F8FAFC' });
        
        // Asegurar que la barra de estado no se superponga con el WebView
        await StatusBar.setOverlaysWebView({ overlay: false });
        
        console.log('✅ StatusBar configurada correctamente');
      }
    } catch (error) {
      console.warn('⚠️ No se pudo configurar la StatusBar:', error);
    }
  }
}
