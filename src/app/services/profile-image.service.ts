import { Injectable } from '@angular/core';
import { ProfileImageData } from '../models/user-profile.model';

/**
 * Servicio para gestionar imágenes de perfil
 * 
 * Este servicio maneja:
 * - Carga y procesamiento de imágenes
 * - Almacenamiento en localStorage como Base64
 * - Gestión de rutas y nombres de archivos
 * - Optimización de imágenes
 */
@Injectable({
  providedIn: 'root'
})
export class ProfileImageService {

  private readonly STORAGE_KEY = 'profile_images';
  private readonly MAX_IMAGE_SIZE = 500; // Tamaño máximo en KB
  private readonly IMAGE_QUALITY = 0.8; // Calidad de compresión (0.1 - 1.0)
  private readonly IMAGE_DIMENSIONS = { width: 400, height: 400 }; // Dimensiones finales

  constructor() {
    console.log('✅ ProfileImageService inicializado');
  }

  /**
   * Procesa y guarda una imagen de perfil
   * @param file - Archivo de imagen seleccionado
   * @param username - Nombre de usuario para generar el nombre del archivo
   * @returns Promise con la información de la imagen guardada
   */
  async uploadProfileImage(file: File, username: string): Promise<ProfileImageData> {
    try {
      console.log('📷 Iniciando carga de imagen de perfil para:', username);

      // Validar el archivo
      this.validateImageFile(file);

      // Procesar y comprimir la imagen
      const processedImageData = await this.processImage(file);

      // Generar información del archivo
      const fileName = `profile-${username}`;
      const imagePath = `assets/profiles/${fileName}`;

      const imageData: ProfileImageData = {
        username,
        imagePath,
        fileName,
        uploadedAt: new Date()
      };

      // Guardar la imagen en localStorage
      await this.saveImageToStorage(username, processedImageData, imageData);

      console.log('✅ Imagen de perfil guardada exitosamente');
      return imageData;

    } catch (error) {
      console.error('❌ Error al cargar imagen de perfil:', error);
      throw error;
    }
  }

  /**
   * Obtiene la imagen de perfil de un usuario
   * @param username - Nombre de usuario
   * @returns Base64 string de la imagen o null si no existe
   */
  async getProfileImage(username: string): Promise<string | null> {
    try {
      const storageKey = `${this.STORAGE_KEY}_${username}`;
      const savedData = localStorage.getItem(storageKey);
      
      if (!savedData) {
        console.log(`📭 No hay imagen guardada para usuario: ${username}`);
        return null;
      }

      const imageInfo = JSON.parse(savedData);
      console.log(`📥 Imagen recuperada para usuario: ${username}`);
      return imageInfo.imageBase64;

    } catch (error) {
      console.error('❌ Error al recuperar imagen de perfil:', error);
      return null;
    }
  }

  /**
   * Elimina la imagen de perfil de un usuario
   * @param username - Nombre de usuario
   */
  async deleteProfileImage(username: string): Promise<void> {
    try {
      const storageKey = `${this.STORAGE_KEY}_${username}`;
      localStorage.removeItem(storageKey);
      console.log(`🗑️ Imagen de perfil eliminada para usuario: ${username}`);
    } catch (error) {
      console.error('❌ Error al eliminar imagen de perfil:', error);
      throw error;
    }
  }

  /**
   * Obtiene todas las imágenes de perfil almacenadas
   * @returns Array con información de todas las imágenes
   */
  async getAllProfileImages(): Promise<ProfileImageData[]> {
    try {
      const allImages: ProfileImageData[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.STORAGE_KEY)) {
          const data = localStorage.getItem(key);
          if (data) {
            const imageInfo = JSON.parse(data);
            allImages.push(imageInfo.metadata);
          }
        }
      }

      return allImages;
    } catch (error) {
      console.error('❌ Error al obtener todas las imágenes:', error);
      return [];
    }
  }

  /**
   * Valida que el archivo sea una imagen válida
   * @param file - Archivo a validar
   */
  private validateImageFile(file: File): void {
    // Verificar que sea una imagen
    if (!file.type.startsWith('image/')) {
      throw new Error('El archivo seleccionado no es una imagen válida');
    }

    // Verificar tamaño (convertir a KB)
    const fileSizeKB = file.size / 1024;
    if (fileSizeKB > this.MAX_IMAGE_SIZE) {
      throw new Error(`La imagen es muy grande. Tamaño máximo: ${this.MAX_IMAGE_SIZE}KB`);
    }

    // Verificar tipos soportados
    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!supportedTypes.includes(file.type)) {
      throw new Error('Tipo de imagen no soportado. Use: JPEG, PNG o WebP');
    }
  }

  /**
   * Procesa y optimiza la imagen
   * @param file - Archivo de imagen
   * @returns Promise con la imagen procesada en Base64
   */
  private processImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const img = new Image();
        
        img.onload = () => {
          try {
            // Crear canvas para redimensionar
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
              throw new Error('No se pudo crear el contexto del canvas');
            }

            // Establecer dimensiones del canvas
            canvas.width = this.IMAGE_DIMENSIONS.width;
            canvas.height = this.IMAGE_DIMENSIONS.height;

            // Calcular proporciones para mantener aspecto
            const scale = Math.min(
              canvas.width / img.width,
              canvas.height / img.height
            );

            const newWidth = img.width * scale;
            const newHeight = img.height * scale;
            
            // Centrar la imagen
            const offsetX = (canvas.width - newWidth) / 2;
            const offsetY = (canvas.height - newHeight) / 2;

            // Limpiar canvas y dibujar imagen redimensionada
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, offsetX, offsetY, newWidth, newHeight);

            // Convertir a Base64 con compresión
            const compressedBase64 = canvas.toDataURL('image/jpeg', this.IMAGE_QUALITY);
            resolve(compressedBase64);

          } catch (error) {
            reject(error);
          }
        };

        img.onerror = () => reject(new Error('Error al cargar la imagen'));
        img.src = event.target?.result as string;
      };

      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Guarda la imagen procesada en localStorage
   * @param username - Nombre de usuario
   * @param imageBase64 - Imagen en formato Base64
   * @param metadata - Metadatos de la imagen
   */
  private async saveImageToStorage(
    username: string, 
    imageBase64: string, 
    metadata: ProfileImageData
  ): Promise<void> {
    try {
      const storageKey = `${this.STORAGE_KEY}_${username}`;
      
      const dataToSave = {
        imageBase64,
        metadata,
        savedAt: new Date().toISOString()
      };

      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
      console.log(`💾 Imagen guardada en localStorage con clave: ${storageKey}`);

    } catch (error) {
      // Si hay error de espacio, intentar limpiar imágenes viejas
      if (error instanceof DOMException && error.code === 22) {
        console.warn('⚠️ Almacenamiento lleno, limpiando imágenes antiguas...');
        await this.cleanupOldImages();
        
        // Intentar guardar nuevamente
        const storageKey = `${this.STORAGE_KEY}_${username}`;
        const dataToSave = { imageBase64, metadata, savedAt: new Date().toISOString() };
        localStorage.setItem(storageKey, JSON.stringify(dataToSave));
      } else {
        throw error;
      }
    }
  }

  /**
   * Limpia imágenes antiguas para liberar espacio
   */
  private async cleanupOldImages(): Promise<void> {
    try {
      const allImages = await this.getAllProfileImages();
      
      // Ordenar por fecha (más antiguas primero)
      allImages.sort((a, b) => 
        new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime()
      );

      // Eliminar las más antiguas (mantener solo las 10 más recientes)
      const imagesToDelete = allImages.slice(0, Math.max(0, allImages.length - 10));
      
      for (const imageData of imagesToDelete) {
        await this.deleteProfileImage(imageData.username);
      }

      console.log(`🧹 Limpieza completada: ${imagesToDelete.length} imágenes eliminadas`);
    } catch (error) {
      console.error('❌ Error durante la limpieza de imágenes:', error);
    }
  }

  /**
   * Obtiene el tamaño total ocupado por las imágenes de perfil
   * @returns Tamaño en bytes
   */
  getImagesStorageSize(): number {
    let totalSize = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.STORAGE_KEY)) {
        const data = localStorage.getItem(key);
        if (data) {
          totalSize += data.length;
        }
      }
    }
    
    return totalSize;
  }

  /**
   * Formatea el tamaño de almacenamiento
   * @returns String con el tamaño formateado
   */
  getImagesStorageSizeFormatted(): string {
    const bytes = this.getImagesStorageSize();
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }
}
