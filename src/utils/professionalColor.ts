export type ProfessionalColor = { dot: string; background: string };

// Mesma paleta e ordem do PWA (salonix-frontend-web/src/pages/Bookings.jsx,
// PROFESSIONAL_COLOR_PALETTE) - hex Tailwind 500, para o mesmo profissional ter a
// mesma cor em ambas as plataformas. "background" e o dot com ~20% de opacidade
// (sufixo hex "33"), usado como fundo do bloco; "dot" e a cor solida.
const PALETTE_HEX = [
  '#8b5cf6', // violet-500
  '#0ea5e9', // sky-500
  '#f59e0b', // amber-500
  '#f43f5e', // rose-500
  '#14b8a6', // teal-500
  '#d946ef', // fuchsia-500
  '#84cc16', // lime-500
  '#f97316', // orange-500
  '#06b6d4', // cyan-500
  '#ec4899', // pink-500
];

const PROFESSIONAL_COLOR_PALETTE: ProfessionalColor[] = PALETTE_HEX.map((hex) => ({
  dot: hex,
  background: `${hex}33`,
}));

export function getProfessionalColor(
  professionalId: string | number | null | undefined
): ProfessionalColor {
  const parsed =
    typeof professionalId === 'number'
      ? professionalId
      : parseInt(String(professionalId), 10);
  const index = Math.abs(Number.isNaN(parsed) ? 0 : parsed) % PROFESSIONAL_COLOR_PALETTE.length;
  return PROFESSIONAL_COLOR_PALETTE[index];
}
