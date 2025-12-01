const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

/**
 * Plugin to resolve TypeScript path aliases
 * @type {import('esbuild').Plugin}
 */
const tsconfigPathsPlugin = {
  name: 'tsconfig-paths',
  setup(build) {
    // Resolve @roo-code/* imports
    build.onResolve({ filter: /^@roo-code\// }, args => {
      const parts = args.path.split('/');
      const packageName = parts[1]; // e.g., 'types' from '@roo-code/types'
      const subPath = parts.slice(2).join('/'); // remaining path

      let resolvedPath = path.join(__dirname, 'src', 'packages', packageName);

      if (subPath) {
        resolvedPath = path.join(resolvedPath, subPath);
      } else {
        // Try to find index file
        const indexPath = path.join(resolvedPath, 'index.ts');
        if (fs.existsSync(indexPath)) {
          resolvedPath = indexPath;
        } else {
          resolvedPath = resolvedPath + '.ts';
        }
      }

      // Add .ts extension if needed
      if (!resolvedPath.endsWith('.ts') && !resolvedPath.endsWith('.js')) {
        if (fs.existsSync(resolvedPath + '.ts')) {
          resolvedPath = resolvedPath + '.ts';
        } else if (fs.existsSync(resolvedPath + '/index.ts')) {
          resolvedPath = resolvedPath + '/index.ts';
        }
      }

      return { path: resolvedPath };
    });

    // Resolve @shared/* imports
    build.onResolve({ filter: /^@shared\// }, args => {
      const subPath = args.path.replace('@shared/', '');
      let resolvedPath = path.join(__dirname, 'src', 'shared', subPath);

      // Add .ts extension if needed
      if (!resolvedPath.endsWith('.ts') && !resolvedPath.endsWith('.js')) {
        if (fs.existsSync(resolvedPath + '.ts')) {
          resolvedPath = resolvedPath + '.ts';
        } else if (fs.existsSync(resolvedPath + '/index.ts')) {
          resolvedPath = resolvedPath + '/index.ts';
        }
      }

      return { path: resolvedPath };
    });
  },
};

/**
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
  name: 'esbuild-problem-matcher',
  setup(build) {
    build.onStart(() => {
      console.log('[watch] build started');
    });
    build.onEnd(result => {
      result.errors.forEach(({ text, location }) => {
        console.error(`✘ [ERROR] ${text}`);
        console.error(`    ${location.file}:${location.line}:${location.column}:`);
      });
      console.log('[watch] build finished');
    });
  },
};

async function main() {
  const ctx = await esbuild.context({
    entryPoints: ['src/extension.ts'],
    bundle: true,
    format: 'cjs',
    minify: production,
    sourcemap: !production,
    sourcesContent: false,
    platform: 'node',
    outfile: 'out/extension.js',
    external: [
      'vscode',
      'sqlite3',
      'puppeteer-core',
      'puppeteer-chromium-resolver',
      '@vscode/ripgrep',
      'tree-sitter',
      'canvas',
      'keytar',
      'monaco-vscode-textmate-theme-converter',
      'say',
    ],
    logLevel: 'info',
    plugins: [
      tsconfigPathsPlugin,
      esbuildProblemMatcherPlugin,
    ],
    loader: {
      '.node': 'file',
      '.wasm': 'file',
    },
    mainFields: ['module', 'main'],
    treeShaking: true,
  });

  if (watch) {
    console.log('Watching for changes...');
    await ctx.watch();
  } else {
    await ctx.rebuild();
    await ctx.dispose();
    console.log('Build complete!');
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
