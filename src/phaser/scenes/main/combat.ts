import Phaser from 'phaser';

export const DASH_SPEED = 900;
export const DASH_DURATION_MS = 200;
export const BULLET_SPEED = 750;
export const BULLET_LIFE_MS = 1200;
export const BULLET_FIRE_INTERVAL_MS = 120;
export const DAMAGE_COOLDOWN_MS = 900;
export const KNOCKBACK_SPEED = 520;

export const resolveDashDirection = (
  leftX: number,
  leftY: number,
  fallbackDirection: Phaser.Math.Vector2
): Phaser.Math.Vector2 => {
  const direction = new Phaser.Math.Vector2(leftX, leftY);
  if (direction.lengthSq() < 0.01) {
    direction.copy(fallbackDirection);
  }

  return direction.normalize();
};

export const createKnockbackDirection = (
  playerX: number,
  playerY: number,
  enemyX: number,
  enemyY: number
): Phaser.Math.Vector2 =>
  new Phaser.Math.Vector2(playerX - enemyX, playerY - enemyY).normalize();
