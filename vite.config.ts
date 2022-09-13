import { defineConfig } from 'vite';
import Vue from '@vitejs/plugin-vue';
import Inspect from 'vite-plugin-inspect';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import {
  ElementPlusResolver,
  VueUseComponentsResolver,
} from 'unplugin-vue-components/resolvers';
import Unocss from 'unocss/vite';
export default defineConfig({
  plugins: [
    Vue(),
    Inspect(),
    Unocss({
      presets: [], // disable default preset
      rules: [
        // your custom rules
      ],
    }),
    AutoImport({
      vueTemplate: true,
      include: [
        /\.[tj]sx?$/, // .ts, .tsx, .js, .jsx
        /\.vue$/,
        /\.vue\?vue/, // .vue
        /\.md$/, // .md
      ],
      dts: './auto-imports.d.ts',
      // global imports to register
      imports: [
        // presets
        'vue',
        // custom
        {
          '@vueuse/core': [
            // named imports
            'useMouse', // import { useMouse } from '@vueuse/core',
            'useElementBounding',
            // alias
            ['useFetch', 'useMyFetch'], // import { useFetch as useMyFetch } from '@vueuse/core',
          ],
        },
      ],
    }),
    Components({
      dts: true,
      resolvers: [VueUseComponentsResolver(), ElementPlusResolver()],
    }),
  ],
});
