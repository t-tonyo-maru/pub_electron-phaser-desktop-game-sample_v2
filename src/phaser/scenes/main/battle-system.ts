import type Phaser from 'phaser';
import { RESULT_SCENE_KEY } from '../../consts/sceneKeys';
import { createKnockbackDirection } from './combat';

type FirePlayerBulletParams = {
  scene: Phaser.Scene;
  bullets: Phaser.Physics.Arcade.Group;
  player: Phaser.Physics.Arcade.Sprite;
  aimDirection: Phaser.Math.Vector2;
  bulletSpeed: number;
  bulletLifeMs: number;
};

type HandlePlayerEnemyCollisionParams = {
  scene: Phaser.Scene;
  player: Phaser.Physics.Arcade.Sprite;
  enemy: Phaser.Physics.Arcade.Sprite;
  isBarrierActive: boolean;
  hp: number;
  now: number;
  damageCooldownEndTime: number;
  damageCooldownMs: number;
  knockbackSpeed: number;
};

type CollisionResult = {
  hp: number;
  damageCooldownEndTime: number;
};

export const firePlayerBullet = ({
  scene,
  bullets,
  player,
  aimDirection,
  bulletSpeed,
  bulletLifeMs
}: FirePlayerBulletParams): void => {
  if (!player.active || aimDirection.lengthSq() === 0) {
    return;
  }

  const bullet = bullets.create(player.x, player.y, 'bullet').setDepth(2);
  const direction = aimDirection.clone().normalize();
  const body = bullet.body as Phaser.Physics.Arcade.Body;
  body.setAllowGravity(false);
  body.setVelocity(direction.x * bulletSpeed, direction.y * bulletSpeed);

  scene.time.delayedCall(bulletLifeMs, () => {
    if (bullet.active) {
      bullet.destroy();
    }
  });
};

export const handlePlayerEnemyCollision = ({
  scene,
  player,
  enemy,
  isBarrierActive,
  hp,
  now,
  damageCooldownEndTime,
  damageCooldownMs,
  knockbackSpeed
}: HandlePlayerEnemyCollisionParams): CollisionResult => {
  if (!player.active) {
    return {
      hp,
      damageCooldownEndTime
    };
  }

  const knockbackDirection = createKnockbackDirection(
    player.x,
    player.y,
    enemy.x,
    enemy.y
  );

  player.setVelocity(
    knockbackDirection.x * knockbackSpeed,
    knockbackDirection.y * knockbackSpeed
  );

  if (isBarrierActive) {
    enemy.setVelocity(
      -knockbackDirection.x * knockbackSpeed,
      -knockbackDirection.y * knockbackSpeed
    );
    return {
      hp,
      damageCooldownEndTime
    };
  }

  if (now < damageCooldownEndTime) {
    return {
      hp,
      damageCooldownEndTime
    };
  }

  const nextHp = hp - 1;
  const nextDamageCooldownEndTime = now + damageCooldownMs;

  scene.tweens.add({
    targets: player,
    alpha: 0.3,
    duration: 80,
    yoyo: true,
    repeat: 4
  });

  return {
    hp: nextHp,
    damageCooldownEndTime: nextDamageCooldownEndTime
  };
};

export const handlePlayerObstacleCollision = (): void => {
  // 今は特に処理なし
};

export const checkResultTransition = (
  scene: Phaser.Scene,
  enemies: Phaser.Physics.Arcade.Group,
  score: number
): void => {
  if (enemies.countActive(true) > 0) {
    return;
  }

  scene.scene.start(RESULT_SCENE_KEY, {
    score
  } satisfies ResultSceneData);
};

type ResultSceneData = {
  score: number;
};
