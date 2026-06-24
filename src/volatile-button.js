import { motion } from 'framer-motion';

/**
 * Volatile Button Component - Cyberpunk RGB Split Effect
 * Features:
 * - RGB chromatic aberration with cyan/magenta offset
 * - Rapid micro-animations on hover
 * - Pseudo-layer text clones with color shifts
 * - Digital, volatile aesthetic
 */

export const VolatileButton = ({
  children,
  onClick,
  className = '',
  variant = 'primary', // primary | secondary
  size = 'md' // sm | md | lg
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base'
  };

  const variantClasses = {
    primary: 'border-neon bg-neon/10 text-neon hover:bg-neon/20',
    secondary: 'border-cyber bg-cyber/10 text-cyber hover:bg-cyber/20'
  };

  // Animation variants for rapid micro-animations
  const containerVariants = {
    rest: { scale: 1 },
    hover: {
      scale: 1.02,
      transition: {
        duration: 0.2,
        ease: 'easeOut'
      }
    }
  };

  // RGB split layer animations - cyan offset
  const cyanLayerVariants = {
    rest: { x: 0, y: 0, opacity: 0 },
    hover: {
      x: 2,
      y: -2,
      opacity: 0.6,
      transition: {
        duration: 0.15,
        ease: 'easeOut'
      }
    }
  };

  // RGB split layer animations - magenta offset
  const magentaLayerVariants = {
    rest: { x: 0, y: 0, opacity: 0 },
    hover: {
      x: -2,
      y: 2,
      opacity: 0.6,
      transition: {
        duration: 0.15,
        ease: 'easeOut'
      }
    }
  };

  // Rapid shimmer effect on hover
  const shimmerVariants = {
    rest: { backgroundPosition: '200% 0' },
    hover: {
      backgroundPosition: '-200% 0',
      transition: {
        duration: 0.6,
        ease: 'linear',
        repeat: Infinity
      }
    }
  };

  // Border glow pulse
  const glowVariants = {
    rest: { boxShadow: '0 0 0px rgba(0, 229, 255, 0)' },
    hover: {
      boxShadow: [
        '0 0 5px rgba(0, 229, 255, 0.2)',
        '0 0 15px rgba(57, 255, 20, 0.3)',
        '0 0 5px rgba(0, 229, 255, 0.2)'
      ],
      transition: {
        duration: 0.6,
        repeat: Infinity
      }
    }
  };

  return (
    <motion.div
      initial="rest"
      whileHover="hover"
      className="relative inline-block"
    >
      <motion.button
        variants={containerVariants}
        onClick={onClick}
        className={`
          relative font-mono font-bold uppercase tracking-[0.18em]
          border-2 rounded-md
          transition-all duration-300
          overflow-hidden
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          ${className}
        `}
      >
        {/* Base button content */}
        <motion.span variants={glowVariants} className="absolute inset-0" />

        {/* Cyan RGB split layer (offset right-up) */}
        <motion.span
          variants={cyanLayerVariants}
          className="absolute inset-0 flex items-center justify-center text-cyan-400 pointer-events-none"
          style={{ textShadow: '0 0 10px rgba(0, 229, 255, 0.8)' }}
        >
          {children}
        </motion.span>

        {/* Magenta RGB split layer (offset left-down) */}
        <motion.span
          variants={magentaLayerVariants}
          className="absolute inset-0 flex items-center justify-center text-rose-500 pointer-events-none"
          style={{ textShadow: '0 0 10px rgba(239, 68, 68, 0.8)' }}
        >
          {children}
        </motion.span>

        {/* Shimmer overlay */}
        <motion.span
          variants={shimmerVariants}
          className="absolute inset-0 opacity-0 hover:opacity-100"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(0, 229, 255, 0.2), transparent)',
            backgroundSize: '200% 100%'
          }}
        />

        {/* Main text (white) */}
        <motion.span
          className="relative z-10 flex items-center justify-center gap-2"
          initial={{ opacity: 1 }}
          whileHover={{ opacity: 0.95 }}
        >
          {children}
        </motion.span>
      </motion.button>

      {/* Additional volatile effect - background pulse */}
      <motion.div
        className="absolute inset-0 -z-10 rounded-md"
        variants={{
          rest: { scale: 1, opacity: 0 },
          hover: {
            scale: 1.1,
            opacity: 0.3,
            transition: {
              duration: 0.3,
              repeat: Infinity,
              repeatType: 'reverse'
            }
          }
        }}
        style={{
          background: 'radial-gradient(circle, rgba(57, 255, 20, 0.2), transparent)',
          filter: 'blur(8px)'
        }}
      />
    </motion.div>
  );
};

export default VolatileButton;
