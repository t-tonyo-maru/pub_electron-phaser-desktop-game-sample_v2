import type Phaser from 'phaser';

export const WORLD_WIDTH = 2400;
export const WORLD_HEIGHT = 1800;
const WALL_THICKNESS = 32;

type ObstacleArea = {
  x: number;
  y: number;
  w: number;
  h: number;
};

const OBSTACLE_AREAS: ObstacleArea[] = [
  { x: 460, y: 320, w: 120, h: 120 },
  { x: 680, y: 700, w: 180, h: 96 },
  { x: 1200, y: 420, w: 96, h: 190 },
  { x: 1500, y: 980, w: 150, h: 150 },
  { x: 1980, y: 760, w: 220, h: 96 },
  { x: 1900, y: 1350, w: 130, h: 130 },
  { x: 780, y: 1320, w: 200, h: 90 },
  { x: 300, y: 1200, w: 140, h: 140 }
];

export const setupWorld = (scene: Phaser.Scene): void => {
  scene.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  scene.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  scene.cameras.main.setBackgroundColor(0x0f171d);

  for (let x = 0; x < WORLD_WIDTH; x += 120) {
    for (let y = 0; y < WORLD_HEIGHT; y += 120) {
      const color = (x + y) % 240 === 0 ? 0x1c2b35 : 0x16212b;
      scene.add
        .rectangle(x + 60, y + 60, 118, 118, color)
        .setOrigin(0.5)
        .setDepth(-20);
    }
  }
};

export const createObstacles = (
  scene: Phaser.Scene
): Phaser.Physics.Arcade.StaticGroup => {
  const obstacles = scene.physics.add.staticGroup();

  OBSTACLE_AREAS.forEach((area) => {
    const obstacle = obstacles
      .create(area.x, area.y, 'obstacle')
      .setDisplaySize(area.w, area.h)
      .refreshBody();
    obstacle.setDepth(1);
  });

  return obstacles;
};

export const createWalls = (
  scene: Phaser.Scene
): Phaser.Physics.Arcade.StaticGroup => {
  const walls = scene.physics.add.staticGroup();

  const wallAreas = [
    {
      x: WORLD_WIDTH * 0.5,
      y: WALL_THICKNESS * 0.5,
      width: WORLD_WIDTH,
      height: WALL_THICKNESS
    },
    {
      x: WORLD_WIDTH * 0.5,
      y: WORLD_HEIGHT - WALL_THICKNESS * 0.5,
      width: WORLD_WIDTH,
      height: WALL_THICKNESS
    },
    {
      x: WALL_THICKNESS * 0.5,
      y: WORLD_HEIGHT * 0.5,
      width: WALL_THICKNESS,
      height: WORLD_HEIGHT
    },
    {
      x: WORLD_WIDTH - WALL_THICKNESS * 0.5,
      y: WORLD_HEIGHT * 0.5,
      width: WALL_THICKNESS,
      height: WORLD_HEIGHT
    }
  ];

  wallAreas.forEach((area) => {
    const wall = walls
      .create(area.x, area.y, 'obstacle')
      .setDisplaySize(area.width, area.height)
      .refreshBody();
    wall.setDepth(5);
    wall.setAlpha(0.7);
  });

  return walls;
};
