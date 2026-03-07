import Phaser from 'phaser';
import { MainScene } from './scenes/main/index';
import { ResultScene } from './scenes/result/index';
import { TitleScene } from './scenes/title/index';

const gameHeight = Math.min(window.innerHeight, 960);
const gameWidth = Math.min(window.innerWidth, gameHeight * (16 / 9));

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: gameWidth,
  height: gameHeight,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 }
    }
  },
  scene: [TitleScene, MainScene, ResultScene]
};

export const run = () => {
  const game = new Phaser.Game(config);

  const resize = () => {
    const newWindowWidth = window.innerWidth;
    const newWindowHeight = window.innerHeight;

    const newGameWidth = Math.min(newWindowWidth, newWindowHeight * (16 / 9));
    const newGameHeight = Math.min(newWindowHeight, newWindowWidth * (9 / 16));

    game.scale.resize(newGameWidth, newGameHeight);
  };

  window.addEventListener('resize', resize);
};
