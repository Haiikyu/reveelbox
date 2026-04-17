import type { CSSProperties } from 'react'

/**
 * Returns CSSProperties for rendering a username with a custom color.
 * Supports both solid colors and CSS gradient values.
 */
export function getUsernameStyle(
  colorValue: string | null | undefined,
  isGradient: boolean | null | undefined
): CSSProperties {
  if (!colorValue) return {}
  if (isGradient) {
    return {
      backgroundImage: colorValue,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    }
  }
  return { color: colorValue }
}
