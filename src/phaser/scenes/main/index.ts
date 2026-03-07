import Phaser from 'phaser';
import {
  createEmptyButtonStates,
  isButtonJustPressed
} from '../../../gamepad/buttonState';
import {
  applyInputSettings,
  loadInputSettingsFromStorage
} from '../../../gamepad/inputSettings';
import type { NativeGamepadState } from '../../../gamepad/types';
import {
  BARRIER_RADIUS,
  BUTTON_L,
  BUTTON_R,
  BUTTON_R2,
  SCORE_PER_ENEMY
} from '../../consts/game';
import { MAIN_SCENE_KEY } from '../../consts/sceneKeys';
import { createRuntimeTextures } from '../../utils/texture-generator';
import {
  checkResultTransition,
  firePlayerBullet,
  handlePlayerEnemyCollision,
  handlePlayerObstacleCollision
} from './battle-system';
import {
  BULLET_FIRE_INTERVAL_MS,
  BULLET_LIFE_MS,
  BULLET_SPEED,
  DAMAGE_COOLDOWN_MS,
  DASH_DURATION_MS,
  DASH_SPEED,
  KNOCKBACK_SPEED
} from './combat';
import type { ControllerDisplay } from './controller-display';
import {
  createControllerDisplay,
  updateControllerDisplay
} from './controller-display';
import { Enemy, MAX_ENEMY_COUNT } from './enemy';
import { subscribeNativeGamepadState } from './gamepad-bridge';
import { renderMiniMap } from './minimap';
import {
  AIM_DEADZONE,
  AIM_MARKER_DISTANCE,
  createAimMarker,
  PLAYER_SPEED,
  startDash,
  updateAim,
  updateAimMarker,
  updateMovement
} from './player-controller';
import { createMainUi, updateHpText, updateScoreText } from './ui';
import {
  createObstacles,
  createWalls,
  setupWorld,
  WORLD_HEIGHT,
  WORLD_WIDTH
} from './world';

class CameraFocusPoint extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'bullet');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setVisible(false);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);
  }
}

export class MainScene extends Phaser.Scene {
  private nativeGamepadState: NativeGamepadState | null;
  private previousButtons: boolean[];
  private unsubscribeNativeGamepadListener: (() => void) | null;

  private player!: Phaser.Physics.Arcade.Sprite;
  private focusPoint!: CameraFocusPoint;
  private barrier!: Phaser.GameObjects.Arc;
  private aimMarker!: Phaser.GameObjects.Arc;
  private bullets!: Phaser.Physics.Arcade.Group;
  private enemies!: Phaser.Physics.Arcade.Group;
  private obstacles!: Phaser.Physics.Arcade.StaticGroup;
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private miniMapGraphics!: Phaser.GameObjects.Graphics;
  private scoreText!: Phaser.GameObjects.Text;
  private hpText!: Phaser.GameObjects.Text;

  private controllerDisplay!: ControllerDisplay;

  private score: number;
  private hp: number;
  private dashEndTime: number;
  private damageCooldownEndTime: number;
  private isBarrierActive: boolean;
  private lastAimDirection: Phaser.Math.Vector2;
  private dashDirection: Phaser.Math.Vector2;
  private nextBulletTime: number;
  private readonly inputSettings;

  constructor() {
    super({ key: MAIN_SCENE_KEY });
    this.nativeGamepadState = null;
    this.previousButtons = createEmptyButtonStates();
    this.unsubscribeNativeGamepadListener = null;
    this.score = 0;
    this.hp = 5;
    this.dashEndTime = 0;
    this.damageCooldownEndTime = 0;
    this.isBarrierActive = false;
    this.lastAimDirection = new Phaser.Math.Vector2(1, 0);
    this.dashDirection = new Phaser.Math.Vector2(1, 0);
    this.nextBulletTime = 0;
    this.inputSettings = loadInputSettingsFromStorage();
  }

  preload(): void {}

  create(): void {
    this.score = 0;
    this.hp = 5;
    createRuntimeTextures(this);
    setupWorld(this);
    this._createPlayer();
    this.walls = createWalls(this);
    this.obstacles = createObstacles(this);
    this._createEnemies();
    this._createBullets();
    this._createCollisions();
    this._setupUi();
    this.controllerDisplay = createControllerDisplay(this);
    this.unsubscribeNativeGamepadListener = subscribeNativeGamepadState({
      getCurrentState: () => this.nativeGamepadState,
      setCurrentState: (state: NativeGamepadState) => {
        this.nativeGamepadState = state;
      },
      setPreviousButtons: (buttons: boolean[]) => {
        this.previousButtons = buttons;
      }
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (this.unsubscribeNativeGamepadListener) {
        this.unsubscribeNativeGamepadListener();
        this.unsubscribeNativeGamepadListener = null;
      }
      this.nativeGamepadState = null;
      this.previousButtons = createEmptyButtonStates();
    });
  }

  update(now: number): void {
    this._updateEnemies(now);
    this._updateBarrier();
    this._updateFocusPoint();
    updateAimMarker(
      this.player,
      this.aimMarker,
      this.lastAimDirection,
      AIM_MARKER_DISTANCE
    );
    this._updateMiniMap();

    if (!this.player.active || !this.nativeGamepadState?.connected) {
      return;
    }

    const state = this.nativeGamepadState;
    this._handleInputAndActions(now, state);
    updateControllerDisplay(this.controllerDisplay, state.buttons);
  }

  private _createPlayer(): void {
    this.player = this.physics.add.sprite(
      WORLD_WIDTH * 0.5,
      WORLD_HEIGHT * 0.5,
      'player'
    );
    this.player.setCollideWorldBounds(true);
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);

    this.focusPoint = new CameraFocusPoint(this, this.player.x, this.player.y);
    this.cameras.main.startFollow(this.focusPoint, true, 0.08, 0.08);

    this.barrier = this.add
      .circle(this.player.x, this.player.y, BARRIER_RADIUS, 0x66b3ff, 0.25)
      .setVisible(false)
      .setDepth(3);

    this.aimMarker = createAimMarker(
      this,
      this.player,
      this.lastAimDirection,
      AIM_MARKER_DISTANCE
    );
  }

  private _createEnemies(): void {
    this.enemies = this.physics.add.group({
      classType: Enemy,
      runChildUpdate: false
    });

    for (let index = 0; index < MAX_ENEMY_COUNT; index += 1) {
      const x = Phaser.Math.Between(120, WORLD_WIDTH - 120);
      const y = Phaser.Math.Between(120, WORLD_HEIGHT - 120);
      const enemy = new Enemy(this, x, y);
      this.enemies.add(enemy);
    }
  }

  private _createBullets(): void {
    this.bullets = this.physics.add.group({
      allowGravity: false,
      maxSize: 80
    });
  }

  private _createCollisions(): void {
    this.physics.add.collider(this.player, this.enemies, (_, enemyObject) => {
      const enemy = enemyObject as Phaser.Physics.Arcade.Sprite;
      const result = handlePlayerEnemyCollision({
        scene: this,
        player: this.player,
        enemy,
        isBarrierActive: this.isBarrierActive,
        hp: this.hp,
        now: this.time.now,
        damageCooldownEndTime: this.damageCooldownEndTime,
        damageCooldownMs: DAMAGE_COOLDOWN_MS,
        knockbackSpeed: KNOCKBACK_SPEED
      });

      const wasDamaged = result.hp !== this.hp;
      this.hp = result.hp;
      this.damageCooldownEndTime = result.damageCooldownEndTime;

      if (!wasDamaged) {
        return;
      }

      updateHpText(this.hpText, this.hp);

      if (this.hp <= 0) {
        checkResultTransition(this, this.enemies, this.score);
      }
    });

    this.physics.add.collider(this.player, this.obstacles, () => {
      if (!this.player.active) {
        return;
      }
      handlePlayerObstacleCollision();
    });

    this.physics.add.collider(this.enemies, this.obstacles);

    this.physics.add.collider(this.enemies, this.walls);

    this.physics.add.collider(this.bullets, this.obstacles, (bulletObject) => {
      bulletObject.destroy();
    });

    this.physics.add.overlap(
      this.bullets,
      this.enemies,
      (bulletObject, enemyObject) => {
        bulletObject.destroy();
        enemyObject.destroy();
        this.score += SCORE_PER_ENEMY;
        updateScoreText(this.scoreText, this.score);
        checkResultTransition(this, this.enemies, this.score);
      }
    );
  }

  private _setupUi(): void {
    const ui = createMainUi(this, this.hp);
    this.scoreText = ui.scoreText;
    this.hpText = ui.hpText;
    this.miniMapGraphics = ui.miniMapGraphics;
  }

  private _updateMiniMap(): void {
    renderMiniMap({
      graphics: this.miniMapGraphics,
      scaleWidth: this.scale.width,
      worldWidth: WORLD_WIDTH,
      worldHeight: WORLD_HEIGHT,
      walls: this.walls,
      obstacles: this.obstacles,
      enemies: this.enemies,
      player: this.player
    });
  }

  private _updateEnemies(now: number): void {
    this.enemies.children.iterate((enemyObject) => {
      const enemy = enemyObject as Enemy | null;
      if (!enemy) {
        return true;
      }

      enemy.updateMovement(now);
      return true;
    });
  }

  private _updateBarrier(): void {
    if (!this.player.active) {
      this.barrier.setVisible(false);
      return;
    }

    this.barrier.setPosition(this.player.x, this.player.y);
    this.barrier.setVisible(this.isBarrierActive);
  }

  private _updateFocusPoint(): void {
    if (!this.player.active) {
      return;
    }

    const lerpFactor = 0.2;
    const x = Phaser.Math.Linear(this.focusPoint.x, this.player.x, lerpFactor);
    const y = Phaser.Math.Linear(this.focusPoint.y, this.player.y, lerpFactor);
    this.focusPoint.setPosition(x, y);
  }

  private _handleInputAndActions(now: number, state: NativeGamepadState): void {
    const [leftX, leftY, rightX, rightY] = applyInputSettings(
      state.axes,
      this.inputSettings
    );

    updateMovement({
      player: this.player,
      now,
      dashEndTime: this.dashEndTime,
      dashDirection: this.dashDirection,
      leftX,
      leftY: -leftY,
      dashSpeed: DASH_SPEED,
      playerSpeed: PLAYER_SPEED
    });
    updateAim(this.lastAimDirection, rightX, -rightY, AIM_DEADZONE);

    this.isBarrierActive = state.buttons[BUTTON_L] ?? false;

    if (
      isButtonJustPressed(BUTTON_R2, this.previousButtons, state.buttons) &&
      this.player.active
    ) {
      this.dashEndTime = startDash({
        player: this.player,
        leftX,
        leftY: -leftY,
        fallbackDirection: this.lastAimDirection,
        dashDirection: this.dashDirection,
        now,
        dashSpeed: DASH_SPEED,
        dashDurationMs: DASH_DURATION_MS
      });
    }

    const isFirePressed = state.buttons[BUTTON_R] ?? false;
    if (isFirePressed && now >= this.nextBulletTime) {
      firePlayerBullet({
        scene: this,
        bullets: this.bullets,
        player: this.player,
        aimDirection: this.lastAimDirection,
        bulletSpeed: BULLET_SPEED,
        bulletLifeMs: BULLET_LIFE_MS
      });
      this.nextBulletTime = now + BULLET_FIRE_INTERVAL_MS;
    }

    if (!isFirePressed) {
      this.nextBulletTime = now;
    }
  }
}
