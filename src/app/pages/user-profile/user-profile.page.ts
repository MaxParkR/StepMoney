import { Component, OnInit } from '@angular/core';
import { ProfileFormData, UserProfile } from 'src/app/models/user-profile.model';
import { ProfileImageService, UserProfileService } from 'src/app/services';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.page.html',
  styleUrls: ['./user-profile.page.scss'],
  standalone: false
})
export class UserProfilePage implements OnInit {
  bioCount: number = 0;
  countryCode: string = '+57'; // Colombia por defecto
  currentProfileImage: string | null = null;
  isLoading: boolean = false;
  isEditMode: boolean = false; // Determina si está editando un perfil existente

  formData: ProfileFormData = {
    fullName: '',
    username: '',
    email: '',
    phone: '',
    birthDate: '',
    gender: '',
    bio: '',
    city: '',
    website: '',
    profileImage: ''
  };

  constructor(
    private profileImageService: ProfileImageService,
    private userProfileService: UserProfileService,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {}

  async ngOnInit() {
    await this.loadCurrentUserProfile();
  }

  /**
   * Carga el perfil del usuario actual si existe
   */
  async loadCurrentUserProfile() {
    try {
      this.isLoading = true;
      const currentUser = await this.userProfileService.getCurrentUserProfile();
      
      if (currentUser) {
        this.isEditMode = true;
        this.formData = { ...currentUser };
        this.bioCount = this.formData.bio?.length || 0;
        
        // Cargar imagen de perfil si existe
        if (currentUser.username) {
          this.currentProfileImage = await this.profileImageService.getProfileImage(currentUser.username);
        }
        
        console.log('👤 Perfil de usuario cargado:', currentUser.username);
      } else {
        this.isEditMode = false;
        console.log('✨ Modo creación de nuevo perfil');
      }
    } catch (error) {
      console.error('❌ Error al cargar perfil:', error);
      await this.showToast('Error al cargar el perfil de usuario', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Maneja el cambio en el campo de biografía
   */
  onBioChange(event: any) {
    const value = event.detail.value || '';
    this.bioCount = value.length;
    this.formData.bio = value;
  }

  /**
   * Guarda o actualiza el perfil de usuario
   */
  async handleSave() {
    if (this.isLoading) return;

    try {
      this.isLoading = true;
      
      // Mostrar loading
      const loading = await this.loadingController.create({
        message: this.isEditMode ? 'Actualizando perfil...' : 'Creando perfil...',
        spinner: 'crescent'
      });
      await loading.present();

      // Validar que el username esté disponible (solo para nuevos usuarios)
      if (!this.isEditMode) {
        const isUsernameAvailable = await this.userProfileService.isUsernameAvailable(this.formData.username);
        if (!isUsernameAvailable) {
          await loading.dismiss();
          await this.showAlert('Username no disponible', 'El nombre de usuario ya está en uso. Por favor, elige otro.');
          return;
        }
      }

      // Guardar perfil
      const savedProfile = await this.userProfileService.saveUserProfile(this.formData);
      
      await loading.dismiss();
      
      // Mostrar mensaje de éxito
      const message = this.isEditMode ? 'Perfil actualizado exitosamente' : 'Perfil creado exitosamente';
      await this.showToast(message, 'success');
      
      // Actualizar modo de edición
      this.isEditMode = true;
      
      console.log('✅ Perfil guardado:', savedProfile);
      
    } catch (error: any) {
      await this.loadingController.dismiss();
      console.error('❌ Error al guardar perfil:', error);
      
      const errorMessage = error.message || 'Error desconocido al guardar el perfil';
      await this.showAlert('Error al guardar', errorMessage);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Maneja la carga de imagen de perfil
   */
  async handleImageUpload() {
    if (this.isLoading) return;

    try {
      // Verificar que haya un username
      if (!this.formData.username?.trim()) {
        await this.showAlert('Username requerido', 'Debes ingresar un nombre de usuario antes de subir una imagen.');
        return;
      }

      // Crear input file
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.style.display = 'none';
      
      document.body.appendChild(input);

      input.onchange = async (event) => {
        const file = (event.target as HTMLInputElement)?.files?.[0];
        if (!file) return;

        try {
          this.isLoading = true;
          
          const loading = await this.loadingController.create({
            message: 'Procesando imagen...',
            spinner: 'crescent'
          });
          await loading.present();

          // Procesar y guardar imagen
          const imageData = await this.profileImageService.uploadProfileImage(file, this.formData.username);
          
          // Actualizar la imagen actual
          this.currentProfileImage = await this.profileImageService.getProfileImage(this.formData.username);
          this.formData.profileImage = imageData.imagePath;

          // Si ya existe el perfil, actualizar la imagen
          if (this.isEditMode) {
            await this.userProfileService.updateProfileImage(imageData.imagePath);
          }

          await loading.dismiss();
          await this.showToast('Imagen de perfil actualizada', 'success');
          
          console.log('📷 Imagen de perfil cargada:', imageData);

        } catch (error: any) {
          await this.loadingController.dismiss();
          console.error('❌ Error al cargar imagen:', error);
          
          const errorMessage = error.message || 'Error al procesar la imagen';
          await this.showAlert('Error de imagen', errorMessage);
        } finally {
          this.isLoading = false;
        }
      };

      input.click();
      
      // Limpiar después del uso
      setTimeout(() => {
        document.body.removeChild(input);
      }, 1000);

    } catch (error) {
      console.error('❌ Error al iniciar carga de imagen:', error);
      await this.showToast('Error al abrir selector de imagen', 'danger');
    }
  }

  /**
   * Obtiene la inicial del usuario para mostrar en el avatar
   */
  getUserInitial(): string {
    if (this.formData.fullName?.trim()) {
      return this.formData.fullName.trim().charAt(0).toUpperCase();
    }
    if (this.formData.username?.trim()) {
      return this.formData.username.trim().charAt(0).toUpperCase();
    }
    return 'U';
  }

  /**
   * Verifica si se puede mostrar la imagen de perfil
   */
  hasProfileImage(): boolean {
    return !!this.currentProfileImage;
  }

  /**
   * Valida el formulario antes de guardar
   */
  async validateForm(): Promise<boolean> {
    const errors: string[] = [];

    if (!this.formData.fullName?.trim()) {
      errors.push('El nombre completo es requerido');
    }

    if (!this.formData.username?.trim()) {
      errors.push('El nombre de usuario es requerido');
    }

    if (!this.formData.email?.trim()) {
      errors.push('El email es requerido');
    }

    if (errors.length > 0) {
      await this.showAlert('Campos requeridos', errors.join('\n'));
      return false;
    }

    return true;
  }

  /**
   * Muestra una alerta
   */
  private async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  /**
   * Muestra un toast
   */
  private async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'top',
      color
    });
    await toast.present();
  }

  /**
   * Elimina la imagen de perfil actual
   */
  async removeProfileImage() {
    if (!this.formData.username || !this.currentProfileImage) return;

    try {
      const alert = await this.alertController.create({
        header: 'Eliminar imagen',
        message: '¿Estás seguro de que quieres eliminar tu imagen de perfil?',
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel'
          },
          {
            text: 'Eliminar',
            handler: async () => {
              try {
                await this.profileImageService.deleteProfileImage(this.formData.username);
                this.currentProfileImage = null;
                this.formData.profileImage = '';
                
                if (this.isEditMode) {
                  await this.userProfileService.updateProfileImage('');
                }
                
                await this.showToast('Imagen de perfil eliminada', 'success');
              } catch (error) {
                console.error('❌ Error al eliminar imagen:', error);
                await this.showToast('Error al eliminar imagen', 'danger');
              }
            }
          }
        ]
      });

      await alert.present();
    } catch (error) {
      console.error('❌ Error al mostrar confirmación:', error);
    }
  }
}

