import type Phaser from 'phaser';

export const MINI_MAP_WIDTH = 240;
export const MINI_MAP_HEIGHT = 180;
export const MINI_MAP_MARGIN = 16;

type MiniMapRenderParams = {
  graphics: Phaser.GameObjects.Graphics;
  scaleWidth: number;
  worldWidth: number;
  worldHeight: number;
  walls: Phaser.Physics.Arcade.StaticGroup;
  obstacles: Phaser.Physics.Arcade.StaticGroup;
  enemies: Phaser.Physics.Arcade.Group;
  player: Phaser.Physics.Arcade.Sprite;
};

export const renderMiniMap = ({
  graphics,
  scaleWidth,
  worldWidth,
  worldHeight,
  walls,
  obstacles,
  enemies,
  player
}: MiniMapRenderParams): void => {
  const mapX = scaleWidth - MINI_MAP_WIDTH - MINI_MAP_MARGIN;
  const mapY = MINI_MAP_MARGIN;

  graphics.clear();

  graphics.fillStyle(0x000000, 0.45);
  graphics.fillRect(mapX, mapY, MINI_MAP_WIDTH, MINI_MAP_HEIGHT);
  graphics.lineStyle(2, 0xffffff, 0.85);
  graphics.strokeRect(mapX, mapY, MINI_MAP_WIDTH, MINI_MAP_HEIGHT);

  drawStaticGroupOnMiniMap(
    graphics,
    walls,
    mapX,
    mapY,
    worldWidth,
    worldHeight,
    0x8ca1b3,
    0.95
  );

  drawStaticGroupOnMiniMap(
    graphics,
    obstacles,
    mapX,
    mapY,
    worldWidth,
    worldHeight,
    0x70879a,
    0.95
  );

  graphics.fillStyle(0xff6b6b, 0.95);
  enemies.children.each((enemyObject) => {
    const enemy = enemyObject as Phaser.Physics.Arcade.Sprite | null;
    if (!enemy || !enemy.active) {
      return true;
    }

    const miniX = mapX + (enemy.x / worldWidth) * MINI_MAP_WIDTH;
    const miniY = mapY + (enemy.y / worldHeight) * MINI_MAP_HEIGHT;
    graphics.fillCircle(miniX, miniY, 2.5);
    return true;
  });

  if (player.active) {
    const playerMiniX = mapX + (player.x / worldWidth) * MINI_MAP_WIDTH;
    const playerMiniY = mapY + (player.y / worldHeight) * MINI_MAP_HEIGHT;
    const markerHalfSize = 6;

    graphics.lineStyle(3, 0x00ff66, 1);
    graphics.lineBetween(
      playerMiniX - markerHalfSize,
      playerMiniY,
      playerMiniX + markerHalfSize,
      playerMiniY
    );
    graphics.lineBetween(
      playerMiniX,
      playerMiniY - markerHalfSize,
      playerMiniX,
      playerMiniY + markerHalfSize
    );
  }
};

const drawStaticGroupOnMiniMap = (
  graphics: Phaser.GameObjects.Graphics,
  group: Phaser.Physics.Arcade.StaticGroup,
  mapX: number,
  mapY: number,
  worldWidth: number,
  worldHeight: number,
  color: number,
  alpha: number
): void => {
  graphics.fillStyle(color, alpha);
  group.children.each((child) => {
    const object = child as Phaser.GameObjects.GameObject | null;
    if (!object) {
      return true;
    }

    const body = (object as Phaser.Types.Physics.Arcade.GameObjectWithBody)
      .body as Phaser.Physics.Arcade.StaticBody | undefined;
    if (!body) {
      return true;
    }

    const miniX = mapX + (body.x / worldWidth) * MINI_MAP_WIDTH;
    const miniY = mapY + (body.y / worldHeight) * MINI_MAP_HEIGHT;
    const miniW = (body.width / worldWidth) * MINI_MAP_WIDTH;
    const miniH = (body.height / worldHeight) * MINI_MAP_HEIGHT;
    graphics.fillRect(miniX, miniY, miniW, miniH);
    return true;
  });
};
