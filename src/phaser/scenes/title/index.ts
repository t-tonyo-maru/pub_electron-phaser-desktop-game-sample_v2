import Phaser from 'phaser';
import {
  createEmptyButtonStates,
  hasAnyButtonJustPressed,
  hasAnyButtonPressed
} from '../../../gamepad/buttonState';
import type { NativeGamepadState } from '../../../gamepad/types';
import { MAIN_SCENE_KEY, TITLE_SCENE_KEY } from '../../consts/sceneKeys';

export class TitleScene extends Phaser.Scene {
  private titleText!: Phaser.GameObjects.Text;
  private connectionText!: Phaser.GameObjects.Text;
  private startText!: Phaser.GameObjects.Text;
  private previousButtons: boolean[];
  private isTransitioning: boolean;
  private isInputEnabled: boolean;
  private isGuideVisible: boolean;
  private unsubscribeNativeGamepadListener: (() => void) | null;

  constructor() {
    super({ key: TITLE_SCENE_KEY });
    this.previousButtons = createEmptyButtonStates();
    this.isTransitioning = false;
    this.isInputEnabled = false;
    this.isGuideVisible = false;
    this.unsubscribeNativeGamepadListener = null;
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0x101421);

    this.titleText = this.add
      .text(
        this.scale.width / 2,
        -80,
        'Electron x Phaser x TypeScript\nゲームアプリ',
        {
          color: '#ffffff',
          fontSize: '40px'
        }
      )
      .setOrigin(0.5)
      .setAlpha(0);

    this.connectionText = this.add
      .text(
        this.scale.width / 2,
        this.scale.height * 0.48,
        'ゲームパッド接続状態: 未接続',
        {
          color: '#ffffff',
          fontSize: '24px'
        }
      )
      .setOrigin(0.5)
      .setVisible(false);

    this.startText = this.add
      .text(
        this.scale.width / 2,
        this.scale.height * 0.72,
        'ボタンを押下してください',
        {
          color: '#ffffff',
          fontSize: '28px'
        }
      )
      .setOrigin(0.5)
      .setVisible(false);

    this.playTitleSequence();

    this.setupNativeGamepadListener();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (this.unsubscribeNativeGamepadListener) {
        this.unsubscribeNativeGamepadListener();
        this.unsubscribeNativeGamepadListener = null;
      }
      this.previousButtons = createEmptyButtonStates();
      this.isTransitioning = false;
      this.isInputEnabled = false;
      this.isGuideVisible = false;
    });
  }

  private playTitleSequence(): void {
    this.tweens.add({
      targets: this.titleText,
      y: this.scale.height * 0.28,
      alpha: 1,
      duration: 1100,
      ease: 'Sine.Out',
      onComplete: () => {
        this.titleText.setShadow(0, 0, '#ffe680', 36, true, true);
        this.tweens.add({
          targets: this.titleText,
          duration: 420,
          repeat: 1,
          yoyo: true,
          ease: 'Sine.InOut',
          alpha: 0.65,
          onComplete: () => {
            this.titleText.setShadow();
            this.showGuideTexts();
          }
        });
      }
    });
  }

  private showGuideTexts(): void {
    this.isGuideVisible = true;
    this.connectionText.setVisible(true);
    this.startText.setVisible(true);

    this.tweens.add({
      targets: this.startText,
      alpha: 0.2,
      duration: 650,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut'
    });

    this.time.delayedCall(1000, () => {
      this.isInputEnabled = true;
    });
  }

  private setupNativeGamepadListener(): void {
    if (!window.electronAPI) {
      return;
    }

    this.unsubscribeNativeGamepadListener =
      window.electronAPI.onNativeGamepadState((state: NativeGamepadState) => {
        this.handleNativeGamepadState(state);
      });
  }

  private handleNativeGamepadState(state: NativeGamepadState): void {
    const nowButtons = state.buttons;
    const isConnected = state.connected && hasAnyButtonPressed(nowButtons);

    if (this.isGuideVisible) {
      this.connectionText.setText(
        `ゲームパッド接続状態: ${state.connected ? '接続中' : '未接続'} (${state.connectionState})`
      );
    }

    if (
      this.isInputEnabled &&
      !this.isTransitioning &&
      state.connected &&
      hasAnyButtonJustPressed(this.previousButtons, nowButtons)
    ) {
      this.isTransitioning = true;
      this.scene.start(MAIN_SCENE_KEY);
    }

    if (!isConnected && !state.connected) {
      this.connectionText.setColor('#ffb4b4');
    } else {
      this.connectionText.setColor('#ffffff');
    }

    this.previousButtons = [...nowButtons];
  }
}
