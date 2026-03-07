import Phaser from 'phaser';

export const MAX_ENEMY_COUNT = 16;

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  private readonly directionIntervalMs: number;
  private changeDirectionAt: number;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'enemy');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    this.setCollideWorldBounds(true);
    this.setBounce(1, 1);

    this.directionIntervalMs = Phaser.Math.Between(700, 1600);
    this.changeDirectionAt = 0;
    this.updateDirection();
  }

  updateMovement(now: number): void {
    if (!this.active) {
      return;
    }

    if (now >= this.changeDirectionAt) {
      this.updateDirection();
      this.changeDirectionAt = now + this.directionIntervalMs;
    }
  }

  private updateDirection(): void {
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const speed = Phaser.Math.Between(90, 220);
    this.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
  }
}
