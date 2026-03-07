import type Phaser from 'phaser';

export const createRuntimeTextures = (scene: Phaser.Scene): void => {
  if (!scene.textures.exists('player')) {
    const graphics = scene.add.graphics({ x: 0, y: 0 });
    graphics.fillStyle(0x66ccff);
    graphics.fillCircle(20, 20, 20);
    graphics.generateTexture('player', 40, 40);
    graphics.clear();

    graphics.fillStyle(0xff7c7c);
    graphics.fillCircle(16, 16, 16);
    graphics.generateTexture('enemy', 32, 32);
    graphics.clear();

    graphics.fillStyle(0xf5f57a);
    graphics.fillCircle(5, 5, 5);
    graphics.generateTexture('bullet', 10, 10);
    graphics.clear();

    graphics.fillStyle(0x4d5c6a);
    graphics.fillRect(0, 0, 96, 96);
    graphics.generateTexture('obstacle', 96, 96);
    graphics.destroy();
  }
};
