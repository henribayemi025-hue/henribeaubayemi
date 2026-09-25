import { defineConfig, configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    // Le test de l'écran de l'atelier importe `@cloudflare/puppeteer`, une
    // dépendance de l'atelier seul (atelier/package.json), absente à la
    // racine : depuis le 24/09 il faisait échouer `npm test` en CI sans que
    // rien d'autre soit cassé. Il tourne depuis le dossier atelier.
    // `.claude/worktrees` : des copies de travail posées par l'outil dans le
    // dossier du projet ; sans ça, chaque test tournerait deux fois.
    exclude: [...configDefaults.exclude, 'atelier/test/ecran.test.js', '**/.claude/**'],
  },
});
