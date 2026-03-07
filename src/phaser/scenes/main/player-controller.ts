import type Phaser from 'phaser';
import { resolveDashDirection } from './combat';

export const PLAYER_SPEED = 340;
export const AIM_MARKER_DISTANCE = 74;
export const AIM_DEADZONE = 0.2;

type UpdateMovementParams = {
  player: Phaser.Physics.Arcade.Sprite;
  now: number;
  dashEndTime: number;
  dashDirection: Phaser.Math.Vector2;
  leftX: number;
  leftY: number;
  dashSpeed: number;
  playerSpeed: number;
};

type StartDashParams = {
  player: Phaser.Physics.Arcade.Sprite;
  leftX: number;
  leftY: number;
  fallbackDirection: Phaser.Math.Vector2;
  dashDirection: Phaser.Math.Vector2;
  now: number;
  dashSpeed: number;
  dashDurationMs: number;
};

export const createAimMarker = (
  scene: Phaser.Scene,
  player: Phaser.Physics.Arcade.Sprite,
  aimDirection: Phaser.Math.Vector2,
  markerDistance: number
): Phaser.GameObjects.Arc =>
  scene.add
    .circle(
      player.x + aimDirection.x * markerDistance,
      player.y + aimDirection.y * markerDistance,
      8,
      0xffe066,
      0.9
    )
    .setDepth(4);

export const updateMovement = ({
  player,
  now,
  dashEndTime,
  dashDirection,
  leftX,
  leftY,
  dashSpeed,
  playerSpeed
}: UpdateMovementParams): void => {
  if (now <= dashEndTime) {
    player.setVelocity(
      dashDirection.x * dashSpeed,
      dashDirection.y * dashSpeed
    );
    return;
  }

  player.setVelocity(leftX * playerSpeed, leftY * playerSpeed);
};

export const updateAim = (
  aimDirection: Phaser.Math.Vector2,
  rightX: number,
  rightY: number,
  deadzone: number
): void => {
  const rightMagnitude = Math.hypot(rightX, rightY);

  if (rightMagnitude > deadzone) {
    aimDirection.set(rightX, rightY).normalize();
  }
};

export const updateAimMarker = (
  player: Phaser.Physics.Arcade.Sprite,
  aimMarker: Phaser.GameObjects.Arc,
  aimDirection: Phaser.Math.Vector2,
  markerDistance: number
): void => {
  if (!player.active) {
    aimMarker.setVisible(false);
    return;
  }

  aimMarker.setVisible(true);
  aimMarker.setPosition(
    player.x + aimDirection.x * markerDistance,
    player.y + aimDirection.y * markerDistance
  );
};

export const startDash = ({
  player,
  leftX,
  leftY,
  fallbackDirection,
  dashDirection,
  now,
  dashSpeed,
  dashDurationMs
}: StartDashParams): number => {
  const direction = resolveDashDirection(leftX, leftY, fallbackDirection);
  dashDirection.copy(direction);
  player.setVelocity(dashDirection.x * dashSpeed, dashDirection.y * dashSpeed);

  return now + dashDurationMs;
};
