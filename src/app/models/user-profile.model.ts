export interface ProfileFormData {
  fullName: string;
  username: string;
  email: string;
  phone: string;
  birthDate: string;
  gender: string;
  bio: string;
  city: string;
  website: string;
  profileImage?: string; // Ruta de la imagen de perfil
}

export interface UserProfile extends ProfileFormData {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProfileImageData {
  username: string;
  imagePath: string;
  fileName: string;
  uploadedAt: Date;
}