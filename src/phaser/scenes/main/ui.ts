import type Phaser from 'phaser';

type MainUi = {
  scoreText: Phaser.GameObjects.Text;
  hpText: Phaser.GameObjects.Text;
  miniMapGraphics: Phaser.GameObjects.Graphics;
};

export const createMainUi = (scene: Phaser.Scene, hp: number): MainUi => {
  const scoreText = scene.add
    .text(24, 22, 'Result: 0', {
      color: '#ffffff',
      fontSize: '28px'
    })
    .setScrollFactor(0)
    .setDepth(100);

  const hpText = scene.add
    .text(24, 56, `HP: ${hp}`, {
      color: '#ffffff',
      fontSize: '24px'
    })
    .setScrollFactor(0)
    .setDepth(100);

  scene.add
    .text(24, 92, '移動: 左スティック / 発射: R / バリア: L / ダッシュ: R2', {
      color: '#d9e4ff',
      fontSize: '18px'
    })
    .setScrollFactor(0)
    .setDepth(100);

  const miniMapGraphics = scene.add.graphics().setScrollFactor(0).setDepth(120);

  return {
    scoreText,
    hpText,
    miniMapGraphics
  };
};

export const updateScoreText = (
  scoreText: Phaser.GameObjects.Text,
  score: number
): void => {
  scoreText.setText(`Result: ${score}`);
};

export const updateHpText = (
  hpText: Phaser.GameObjects.Text,
  hp: number
): void => {
  hpText.setText(`HP: ${hp}`);
};
