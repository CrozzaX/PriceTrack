/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#E43030",
          "orange": "#D48D3B",
          "green": "#3E9242"
        },
        secondary: "#282828",
        "gray-200": "#EAECF0",
        "gray-300": "D0D5DD",
        "gray-500": "#667085",
        "gray-600": "#475467",
        "gray-700": "#344054",
        "gray-900": "#101828",
        "white-100": "#F4F4F4",
        "white-200": "#EDF0F8",
        "black-100": "#3D4258",
        "neutral-black": "#23263B",
      },
      boxShadow: {
        xs: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
      },
      maxWidth: {
        "10xl": '1440px'
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        spaceGrotesk: ['Space Grotesk', 'sans-serif'],
      },
      borderRadius: {
        10: "10px"
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)' }
        },
        pulse: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' }
        },
        bounce: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        slideRight: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' }
        },
        smoothFadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        smoothFadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' }
        },
        smoothSlideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        smoothSlideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        smoothSlideLeft: {
          '0%': { transform: 'translateX(10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' }
        },
        smoothSlideRight: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' }
        },
        smoothScale: {
          '0%': { transform: 'scale(0.98)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        smoothScaleDown: {
          '0%': { transform: 'scale(1.02)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        }
      },
      animation: {
        fadeIn: 'fadeIn 0.8s ease forwards',
        scaleIn: 'scaleIn 0.3s ease forwards',
        pulse: 'pulse 2s ease-in-out infinite',
        bounce: 'bounce 2s ease-in-out infinite',
        slideUp: 'slideUp 0.5s ease forwards',
        slideRight: 'slideRight 0.5s ease forwards',
        smoothFadeIn: 'smoothFadeIn 0.7s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        smoothFadeOut: 'smoothFadeOut 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        smoothSlideUp: 'smoothSlideUp 0.7s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        smoothSlideDown: 'smoothSlideDown 0.7s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        smoothSlideLeft: 'smoothSlideLeft 0.7s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        smoothSlideRight: 'smoothSlideRight 0.7s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        smoothScale: 'smoothScale 0.7s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        smoothScaleDown: 'smoothScaleDown 0.7s cubic-bezier(0.4, 0, 0.2, 1) forwards'
      }
    },
  },
  plugins: [],
};
