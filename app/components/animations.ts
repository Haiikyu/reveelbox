// animations.ts - Variantes d'animations réutilisables pour la homepage

import { Variants } from 'framer-motion'

// Animation pour le hero fade in
export const heroVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 1,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
}

// Animation pour les boxes preview (émergent du bas)
export const boxPreviewVariants: Variants = {
  hidden: {
    y: 200,
    opacity: 0.5
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 20,
      mass: 1
    }
  }
}

// Animation stagger pour plusieurs boxes
export const boxesContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

// Animation individuelle de box dans le container
export const boxItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 100,
    scale: 0.8
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15
    }
  }
}

// Animation hover pour box preview dans hero
export const boxHoverVariants: Variants = {
  rest: {
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  },
  hover: {
    y: -40,
    scale: 1.05,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
}

// Animation pour le carousel - carte centrale
export const carouselCenterVariants: Variants = {
  center: {
    scale: 1,
    opacity: 1,
    filter: 'blur(0px) brightness(1)',
    zIndex: 20,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 25
    }
  },
  side: {
    scale: 0.85,
    opacity: 0.5,
    filter: 'blur(3px) brightness(0.8)',
    zIndex: 10,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 25
    }
  }
}

// Animation de scroll reveal
export const scrollRevealVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 50
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 80,
      damping: 20,
      mass: 0.8
    }
  }
}

// Animation parallax légère
export const parallaxVariants = {
  initial: { x: 0 },
  animate: (custom: number) => ({
    x: custom * 10,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 30
    }
  })
}

// Glow effect animation
export const glowVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.8
  },
  animate: {
    opacity: [0.4, 0.8, 0.4],
    scale: [0.8, 1.2, 0.8],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
}
