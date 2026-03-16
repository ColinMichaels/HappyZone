import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? 'HappyZone';
const base = process.env.GITHUB_PAGES === 'true' ? `/${repoName}/` : '/';

export default defineConfig({
    base,
    plugins: [react(), tailwindcss()],
    server: {
        port: 3000
    }
});
