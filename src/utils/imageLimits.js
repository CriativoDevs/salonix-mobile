// Limites da foto de perfil validados pelo BE (users/validators.py:
// ImageFileValidator): 50x50 a 2000x2000 px, até 2MB. Fotos de telemóvel
// (ex.: 4032x3024) levam 400 "Imagem muito grande"; validar antes de enviar
// dá uma mensagem clara em vez de um erro genérico ao salvar.
export const PROFILE_IMAGE_MIN_PX = 50;
export const PROFILE_IMAGE_MAX_PX = 2000;

// Se o picker não informa as dimensões, aceita (o BE continua a decidir).
export function hasValidProfileImageDimensions(asset) {
  const width = Number(asset?.width);
  const height = Number(asset?.height);
  if (!width || !height) return true;
  return (
    width >= PROFILE_IMAGE_MIN_PX &&
    height >= PROFILE_IMAGE_MIN_PX &&
    width <= PROFILE_IMAGE_MAX_PX &&
    height <= PROFILE_IMAGE_MAX_PX
  );
}
