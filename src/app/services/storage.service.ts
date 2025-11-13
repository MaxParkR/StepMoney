import { Injectable } from '@angular/core';

/**
 * Servicio de Almacenamiento Local
 * 
 * Este servicio maneja todo el almacenamiento de datos en el dispositivo
 * usando localStorage del navegador (funciona offline).
 * 
 * ¿Qué es localStorage?
 * - Es un espacio de almacenamiento en el navegador/dispositivo
 * - Los datos persisten incluso si cierras la app
 * - Puede guardar hasta 5-10MB de datos
 * - Perfecto para apps que funcionan sin internet
 */
@Injectable({
  providedIn: 'root'  // Esto hace que el servicio esté disponible en toda la app
})
export class StorageService {

  constructor() {
    console.log('✅ StorageService inicializado');
  }

  /**
   * Guarda un valor en el almacenamiento local
   * @param key - Clave para identificar el dato (ej: 'transactions')
   * @param value - Valor a guardar (puede ser cualquier objeto)
   */
  async set(key: string, value: any): Promise<void> {
    try {
      // Convertimos el objeto a texto JSON para guardarlo
      const jsonValue = JSON.stringify(value);
      localStorage.setItem(key, jsonValue);
      console.log(`💾 Datos guardados con clave: ${key}`);
    } catch (error) {
      console.error(`❌ Error al guardar datos con clave ${key}:`, error);
      throw error;
    }
  }

  /**
   * Recupera un valor del almacenamiento local
   * @param key - Clave del dato a recuperar
   * @returns El valor guardado o null si no existe
   */
  async get(key: string): Promise<any> {
    try {
      const value = localStorage.getItem(key);
      
      // Si no existe el valor, retornamos null
      if (value === null) {
        console.log(`📭 No hay datos guardados con clave: ${key}`);
        return null;
      }
      
      // Convertimos el texto JSON de vuelta a objeto
      const parsedValue = JSON.parse(value);
      console.log(`📥 Datos recuperados con clave: ${key}`);
      return parsedValue;
    } catch (error) {
      console.error(`❌ Error al recuperar datos con clave ${key}:`, error);
      return null;
    }
  }

  /**
   * Elimina un valor del almacenamiento local
   * @param key - Clave del dato a eliminar
   */
  async remove(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
      console.log(`🗑️ Datos eliminados con clave: ${key}`);
    } catch (error) {
      console.error(`❌ Error al eliminar datos con clave ${key}:`, error);
      throw error;
    }
  }

  /**
   * Limpia todo el almacenamiento local
   * ⚠️ Usar con precaución - elimina TODOS los datos
   */
  async clear(): Promise<void> {
    try {
      localStorage.clear();
      console.log('🧹 Almacenamiento local limpiado completamente');
    } catch (error) {
      console.error('❌ Error al limpiar almacenamiento local:', error);
      throw error;
    }
  }

  /**
   * Verifica si existe una clave en el almacenamiento
   * @param key - Clave a verificar
   * @returns true si existe, false si no
   */
  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }

  /**
   * Obtiene todas las claves almacenadas
   * @returns Array con todas las claves
   */
  async keys(): Promise<string[]> {
    try {
      const allKeys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          allKeys.push(key);
        }
      }
      return allKeys;
    } catch (error) {
      console.error('❌ Error al obtener claves:', error);
      return [];
    }
  }

  /**
   * Obtiene el tamaño aproximado del almacenamiento usado (en bytes)
   * @returns Tamaño en bytes
   */
  getStorageSize(): number {
    let size = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        size += localStorage[key].length + key.length;
      }
    }
    return size;
  }

  /**
   * Obtiene el tamaño en formato legible (KB, MB)
   * @returns String con el tamaño formateado
   */
  getStorageSizeFormatted(): string {
    const bytes = this.getStorageSize();
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }
}


