import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs/promises';
import svgr from '@svgr/rollup';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function copy404Plugin() {
    return {
        name: 'copy-404-html',
        closeBundle: async () => {
            try {
                const distDir = resolve(__dirname, 'dist');
                const indexPath = resolve(distDir, 'index.html');
                const notFoundPath = resolve(distDir, '404.html');
                await fs.copyFile(indexPath, notFoundPath);
            } catch (err) {
                // ignore if dist not created yet
            }
        },
    };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    const isProd = mode === 'production';
    const base = process.env.VITE_BASE_PATH || (isProd ? '/Resturant-Qr-Order-System/' : '/');

    return {
        base,
        resolve: {
            alias: {
                src: resolve(__dirname, 'src'),
                '@': resolve(__dirname, 'src'),
            },
        },
        optimizeDeps: {
            esbuildOptions: {
                plugins: [
                    {
                        name: 'load-js-files-as-tsx',
                        setup(build: { onLoad: (arg0: { filter: RegExp; }, arg1: (args: any) => Promise<{ loader: string; contents: string; }>) => void; }) {
                            build.onLoad(
                                { filter: /src\\.*\.js$/ },
                                async (args) => ({
                                    loader: 'tsx',
                                    contents: await fs.readFile(args.path, 'utf8'),
                                })
                            );
                        },
                    },
                ],
            },
        },

        plugins: [svgr(), react(), copy404Plugin()],
    };
});