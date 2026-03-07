import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { FuseV1Options, FuseVersion } from '@electron/fuses';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { VitePlugin } from '@electron-forge/plugin-vite';
import type { ForgeConfig } from '@electron-forge/shared-types';

const RUNTIME_NODE_MODULES_SOURCE = '.forge-runtime/node_modules';
const MINIMAL_RUNTIME_MODULES = ['node-hid', 'pkg-prebuilds'] as const;

/**
 * Forge のパッケージング前に、配布物へ同梱する最小限の runtime 依存だけを
 * `.forge-runtime/node_modules` 配下へ複製する。
 *
 * - 既存の `.forge-runtime` は毎回削除して再生成する
 * - 必須依存がローカルに存在しない場合は build を失敗させる
 */
const prepareMinimalRuntimeNodeModules = (): void => {
  const projectRoot = process.cwd();
  const runtimeRootDir = path.join(projectRoot, '.forge-runtime');
  const runtimeNodeModulesDir = path.join(
    projectRoot,
    RUNTIME_NODE_MODULES_SOURCE
  );

  rmSync(runtimeRootDir, { recursive: true, force: true });
  mkdirSync(runtimeNodeModulesDir, { recursive: true });

  for (const moduleName of MINIMAL_RUNTIME_MODULES) {
    const fromPath = path.join(projectRoot, 'node_modules', moduleName);
    const toPath = path.join(runtimeNodeModulesDir, moduleName);

    if (!existsSync(fromPath)) {
      throw new Error(`Missing runtime dependency: ${fromPath}`);
    }

    cpSync(fromPath, toPath, { recursive: true });
  }
};

const config: ForgeConfig = {
  hooks: {
    prePackage: async () => {
      prepareMinimalRuntimeNodeModules();
    }
  },
  packagerConfig: {
    asar: true,
    extraResource: [RUNTIME_NODE_MODULES_SOURCE]
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({}),
    new MakerZIP({}, ['darwin']),
    new MakerRpm({}),
    new MakerDeb({})
  ],
  plugins: [
    new AutoUnpackNativesPlugin({}),
    new VitePlugin({
      // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
      // If you are familiar with Vite configuration, it will look really familiar.
      build: [
        {
          // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
          entry: 'src/main.ts',
          config: 'vite.main.config.ts',
          target: 'main'
        },
        {
          entry: 'src/preload.ts',
          config: 'vite.preload.config.ts',
          target: 'preload'
        }
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.ts'
        }
      ]
    }),
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true
    })
  ]
};

export default config;
