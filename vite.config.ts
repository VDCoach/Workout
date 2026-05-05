import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    // Indispensable pour que les ressources (JS/CSS) soient trouvées sur https://vdcoach.github.io/Workout/
    base: '/Workout/',[cite: 3]
    
    plugins: [react(), tailwindcss()],[cite: 3]
    
    resolve: {
      alias: {
        // Définit '@' comme alias pointant vers la racine du projet
        '@': path.resolve(__dirname, '.'),[cite: 3]
      },
    },
    
    server: {
      // Désactive le HMR (Hot Module Replacement) si la variable d'environnement DISABLE_HMR est à 'true'
      hmr: process.env.DISABLE_HMR !== 'true',[cite: 3]
    },
  };
});