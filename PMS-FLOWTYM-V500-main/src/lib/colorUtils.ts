/**
 * Adjusts a hex color by a given percentage (positive to lighten, negative to darken).
 */
export const adjustColor = (color: string, percent: number): string => {
  const num = parseInt(color.slice(1), 16);
  const r = (num >> 16) + percent;
  const g = ((num >> 8) & 0x00ff) + percent;
  const b = (num & 0x0000ff) + percent;
  
  const clamp = (val: number) => Math.max(0, Math.min(255, val));
  
  return `#${(
    0x1000000 +
    clamp(r) * 0x10000 +
    clamp(g) * 0x100 +
    clamp(b)
  )
    .toString(16)
    .slice(1)}`;
};

/**
 * Returns either black or white depending on the contrast of the input hex color.
 */
export const getContrastColor = (hexcolor: string): string => {
  const r = parseInt(hexcolor.slice(1, 3), 16);
  const g = parseInt(hexcolor.slice(3, 5), 16);
  const b = parseInt(hexcolor.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? '#000000' : '#FFFFFF';
};

/**
 * Generates the full style object for a reservation card based on its channel color.
 */
export const getReservationStyle = (color: string) => {
  return {
    backgroundColor: color,
    borderLeft: `4px solid ${adjustColor(color, -30)}`,
    color: getContrastColor(color)
  };
};
