import { Injectable } from '@angular/core';
import { ProfileFormData, UserProfile } from '../models/user-profile.model';
import { StorageService } from './storage.service';

/**
 * Servicio para gestionar perfiles de usuario
 * 
 * Este servicio maneja:
 * - CRUD de perfiles de usuario
 * - Validación de datos
 * - Gestión de usuarios únicos
 * - Persistencia de datos
 */
@Injectable({
  providedIn: 'root'
})
export class UserProfileService {

  private readonly STORAGE_KEY = 'user_profiles';
  private readonly CURRENT_USER_KEY = 'current_user';

  constructor(private storageService: StorageService) {
    console.log('✅ UserProfileService inicializado');
  }

  /**
   * Crea o actualiza un perfil de usuario
   * @param formData - Datos del formulario
   * @returns Promise con el perfil guardado
   */
  async saveUserProfile(formData: ProfileFormData): Promise<UserProfile> {
    try {
      console.log('💾 Guardando perfil de usuario:', formData.username);

      // Validar datos requeridos
      this.validateProfileData(formData);

      // Verificar si el usuario ya existe
      const existingProfiles = await this.getAllProfiles();
      const existingProfile = existingProfiles.find(p => p.username === formData.username);

      let userProfile: UserProfile;

      if (existingProfile) {
        // Actualizar perfil existente
        userProfile = {
          ...existingProfile,
          ...formData,
          updatedAt: new Date()
        };
        console.log('🔄 Actualizando perfil existente');
      } else {
        // Crear nuevo perfil
        userProfile = {
          ...formData,
          id: this.generateUserId(),
          createdAt: new Date(),
          updatedAt: new Date()
        };
        console.log('✨ Creando nuevo perfil');
      }

      // Guardar en la lista de perfiles
      await this.saveProfileToStorage(userProfile);

      // Establecer como usuario actual
      await this.setCurrentUser(userProfile);

      console.log('✅ Perfil guardado exitosamente');
      return userProfile;

    } catch (error) {
      console.error('❌ Error al guardar perfil:', error);
      throw error;
    }
  }

  /**
   * Obtiene el perfil del usuario actual
   * @returns Promise con el perfil actual o null
   */
  async getCurrentUserProfile(): Promise<UserProfile | null> {
    try {
      const currentUser = await this.storageService.get(this.CURRENT_USER_KEY);
      return currentUser;
    } catch (error) {
      console.error('❌ Error al obtener usuario actual:', error);
      return null;
    }
  }

  /**
   * Obtiene un perfil por nombre de usuario
   * @param username - Nombre de usuario
   * @returns Promise con el perfil o null
   */
  async getProfileByUsername(username: string): Promise<UserProfile | null> {
    try {
      const allProfiles = await this.getAllProfiles();
      return allProfiles.find(profile => profile.username === username) || null;
    } catch (error) {
      console.error('❌ Error al buscar perfil por username:', error);
      return null;
    }
  }

  /**
   * Obtiene todos los perfiles registrados
   * @returns Promise con array de perfiles
   */
  async getAllProfiles(): Promise<UserProfile[]> {
    try {
      const profiles = await this.storageService.get(this.STORAGE_KEY);
      return profiles || [];
    } catch (error) {
      console.error('❌ Error al obtener todos los perfiles:', error);
      return [];
    }
  }

  /**
   * Elimina un perfil de usuario
   * @param username - Nombre de usuario a eliminar
   */
  async deleteProfile(username: string): Promise<void> {
    try {
      const allProfiles = await this.getAllProfiles();
      const updatedProfiles = allProfiles.filter(p => p.username !== username);
      
      await this.storageService.set(this.STORAGE_KEY, updatedProfiles);
      
      // Si es el usuario actual, limpiar
      const currentUser = await this.getCurrentUserProfile();
      if (currentUser && currentUser.username === username) {
        await this.storageService.remove(this.CURRENT_USER_KEY);
      }

      console.log(`🗑️ Perfil eliminado: ${username}`);
    } catch (error) {
      console.error('❌ Error al eliminar perfil:', error);
      throw error;
    }
  }

  /**
   * Verifica si un nombre de usuario está disponible
   * @param username - Nombre de usuario a verificar
   * @param excludeCurrentUser - Excluir usuario actual de la verificación
   * @returns Promise con true si está disponible
   */
  async isUsernameAvailable(username: string, excludeCurrentUser: boolean = false): Promise<boolean> {
    try {
      const allProfiles = await this.getAllProfiles();
      
      if (excludeCurrentUser) {
        const currentUser = await this.getCurrentUserProfile();
        if (currentUser && currentUser.username === username) {
          return true; // Es el mismo usuario actual
        }
      }
      
      return !allProfiles.some(profile => profile.username === username);
    } catch (error) {
      console.error('❌ Error al verificar disponibilidad de username:', error);
      return false;
    }
  }

  /**
   * Establece el usuario actual
   * @param profile - Perfil de usuario
   */
  async setCurrentUser(profile: UserProfile): Promise<void> {
    try {
      await this.storageService.set(this.CURRENT_USER_KEY, profile);
      console.log(`👤 Usuario actual establecido: ${profile.username}`);
    } catch (error) {
      console.error('❌ Error al establecer usuario actual:', error);
      throw error;
    }
  }

  /**
   * Cierra sesión del usuario actual
   */
  async logout(): Promise<void> {
    try {
      await this.storageService.remove(this.CURRENT_USER_KEY);
      console.log('👋 Sesión cerrada');
    } catch (error) {
      console.error('❌ Error al cerrar sesión:', error);
      throw error;
    }
  }

  /**
   * Actualiza la imagen de perfil del usuario actual
   * @param imagePath - Ruta de la nueva imagen
   */
  async updateProfileImage(imagePath: string): Promise<void> {
    try {
      const currentUser = await this.getCurrentUserProfile();
      if (!currentUser) {
        throw new Error('No hay usuario logueado');
      }

      currentUser.profileImage = imagePath;
      currentUser.updatedAt = new Date();

      await this.saveProfileToStorage(currentUser);
      await this.setCurrentUser(currentUser);

      console.log('📷 Imagen de perfil actualizada');
    } catch (error) {
      console.error('❌ Error al actualizar imagen de perfil:', error);
      throw error;
    }
  }

  /**
   * Valida los datos del perfil
   * @param formData - Datos a validar
   */
  private validateProfileData(formData: ProfileFormData): void {
    const errors: string[] = [];

    // Validaciones requeridas
    if (!formData.fullName?.trim()) {
      errors.push('El nombre completo es requerido');
    }

    if (!formData.username?.trim()) {
      errors.push('El nombre de usuario es requerido');
    } else {
      // Validar formato del username
      const usernameRegex = /^[a-zA-Z0-9_.-]+$/;
      if (!usernameRegex.test(formData.username)) {
        errors.push('El username solo puede contener letras, números, puntos, guiones y guiones bajos');
      }
      
      if (formData.username.length < 3 || formData.username.length > 20) {
        errors.push('El username debe tener entre 3 y 20 caracteres');
      }
    }

    if (!formData.email?.trim()) {
      errors.push('El email es requerido');
    } else {
      // Validar formato del email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        errors.push('El formato del email no es válido');
      }
    }

    // Validaciones opcionales pero con formato
    if (formData.website && formData.website.trim()) {
      try {
        new URL(formData.website);
      } catch {
        errors.push('El formato de la URL del website no es válido');
      }
    }

    if (formData.bio && formData.bio.length > 200) {
      errors.push('La biografía no puede tener más de 200 caracteres');
    }

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
  }

  /**
   * Guarda un perfil en el almacenamiento
   * @param profile - Perfil a guardar
   */
  private async saveProfileToStorage(profile: UserProfile): Promise<void> {
    try {
      const allProfiles = await this.getAllProfiles();
      const existingIndex = allProfiles.findIndex(p => p.username === profile.username);

      if (existingIndex >= 0) {
        allProfiles[existingIndex] = profile;
      } else {
        allProfiles.push(profile);
      }

      await this.storageService.set(this.STORAGE_KEY, allProfiles);
    } catch (error) {
      console.error('❌ Error al guardar perfil en storage:', error);
      throw error;
    }
  }

  /**
   * Genera un ID único para el usuario
   * @returns String con ID único
   */
  private generateUserId(): string {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Obtiene estadísticas de uso
   * @returns Objeto con estadísticas
   */
  async getStats(): Promise<{
    totalUsers: number;
    storageUsed: string;
    lastActivity: Date | null;
  }> {
    try {
      const allProfiles = await this.getAllProfiles();
      const storageSize = this.storageService.getStorageSizeFormatted();
      
      let lastActivity: Date | null = null;
      if (allProfiles.length > 0) {
        const latestUpdate = Math.max(...allProfiles.map(p => p.updatedAt.getTime()));
        lastActivity = new Date(latestUpdate);
      }

      return {
        totalUsers: allProfiles.length,
        storageUsed: storageSize,
        lastActivity
      };
    } catch (error) {
      console.error('❌ Error al obtener estadísticas:', error);
      return {
        totalUsers: 0,
        storageUsed: '0 bytes',
        lastActivity: null
      };
    }
  }
}
