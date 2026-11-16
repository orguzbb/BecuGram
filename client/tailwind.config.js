/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary, #3390EC)',
          shade: 'var(--color-primary-shade, #2f84d9)',
          tint: 'var(--color-primary-tint, rgba(51, 144, 236, 0.1))',
          foreground: 'var(--color-primary-foreground, #ffffff)',
        },
        tg: {
          primary: 'var(--color-primary, #3390EC)',
          bg: 'var(--color-background, #FFFFFF)',
          bgSecondary: 'var(--color-background-secondary, #F4F4F5)',
          bgSecondaryAccent: 'var(--color-background-secondary-accent, #E4E4E5)',
          ownBubble: 'var(--color-background-own, #E1FFC7)',
          inBubble: 'var(--color-background, #FFFFFF)',
          text: 'var(--color-text, #000000)',
          textSecondary: 'var(--color-text-secondary, #707579)',
          textMeta: 'var(--color-text-meta, #707579)',
          textOwn: 'var(--color-text-own, #000000)',
          textMetaOwn: 'var(--color-text-meta-own, rgba(63, 140, 0, 0.8))',
          border: 'var(--color-borders, #DADCE0)',
          divider: 'var(--color-dividers, #C8C6CC)',
          link: 'var(--color-links, #3390EC)',
          chatActive: 'var(--color-chat-active, #3390EC)',
          chatHover: 'var(--color-chat-hover, #F4F4F5)',
          itemHover: 'var(--color-item-hover, #F4F4F5)',
        },
      },
      fontFamily: {
        sans: [
          'Roboto',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Oxygen',
          'Ubuntu',
          'Cantarell',
          'Helvetica Neue',
          'sans-serif',
        ],
      },
      borderRadius: {
        'tg-pill': 'var(--composer-pill-radius, 1.5rem)',
        'tg-msg': 'var(--border-radius-messages, 1rem)',
        'tg-msg-sm': 'var(--border-radius-messages-small, 0.5rem)',
      },
    },
  },
  plugins: [],
};
