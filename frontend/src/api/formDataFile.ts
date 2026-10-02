import { Platform } from 'react-native';

/**
 * React Native's FormData acepta un objeto { uri, name, type } para adjuntar
 * archivos locales, pero el tipo DOM estándar de FormData.append solo admite
 * `string | Blob`. Este alias documenta ese shape específico de RN.
 */
export interface ReactNativeFile {
  uri: string;
  name: string;
  type: string;
}

/**
 * Adjunta un archivo local a un FormData de forma cross-platform.
 *
 * - Nativo (iOS/Android): el runtime de FormData de React Native reconoce
 *   el shape { uri, name, type } y arma el multipart directo desde la URI
 *   de archivo local — no hace falta (ni se puede) convertirlo a Blob.
 * - Web: expo-image-picker/expo-document-picker devuelven una uri tipo
 *   blob: o data:, y react-native-web usa el FormData real del navegador,
 *   que NO entiende ese shape { uri, name, type } — si se appendea tal
 *   cual, el campo llega al backend como un string plano (algo como
 *   "[object Object]"), no como un archivo, y Laravel lo rechaza con
 *   "The field must be a file". Hay que resolver la uri a un Blob real
 *   primero (fetch + blob()) antes de appendearlo.
 */
export async function appendFile(formData: FormData, field: string, file: ReactNativeFile): Promise<void> {
  if (Platform.OS === 'web') {
    const response = await fetch(file.uri);
    const blob = await response.blob();
    formData.append(field, blob, file.name);
    return;
  }

  formData.append(field, file as unknown as Blob);
}
