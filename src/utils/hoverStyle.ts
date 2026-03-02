/**
 * Creates inline style + mouse event handlers for dynamic color hover effects.
 * Use when the color must be a runtime CSS value (e.g., team-specific accent colors)
 * and Tailwind classes cannot be used.
 */
export function hoverColorProps(baseColor: string, hoverColor: string) {
  return {
    style: { color: baseColor },
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
      e.currentTarget.style.color = hoverColor;
    },
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
      e.currentTarget.style.color = baseColor;
    },
  };
}

/**
 * Creates border-color hover props for dynamic colors.
 */
export function hoverBorderProps(baseColor: string, hoverColor: string) {
  return {
    style: { borderColor: baseColor },
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
      e.currentTarget.style.borderColor = hoverColor;
    },
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
      e.currentTarget.style.borderColor = baseColor;
    },
  };
}
