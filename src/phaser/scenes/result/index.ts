import Phaser from 'phaser';
import {
  createEmptyButtonStates,
  hasAnyButtonJustPressed
} from '../../../gamepad/buttonState';
import type { NativeGamepadState } from '../../../gamepad/types';
import { RESULT_SCENE_KEY, TITLE_SCENE_KEY } from '../../consts/sceneKeys';

type ResultSceneData = {
  score?: number;
};

export class ResultScene extends Phaser.Scene {
  private score: number;
  private resultText!: Phaser.GameObjects.Text;
  private guideText!: Phaser.GameObjects.Text;
  private previousButtons: boolean[];
  private isTransitioning: boolean;
  private isInputEnabled: boolean;
  private unsubscribeNativeGamepadListener: (() => void) | null;

  constructor() {
    super({ key: RESULT_SCENE_KEY });
    this.score = 0;
    this.previousButtons = createEmptyButtonStates();
    this.isTransitioning = false;
    this.isInputEnabled = false;
    this.unsubscribeNativeGamepadListener = null;
  }

  init(data: ResultSceneData): void {
    this.score = data.score ?? 0;
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0x1c1221);

    this.add
      .text(this.scale.width / 2, this.scale.height * 0.28, 'Result', {
        color: '#ffffff',
        fontSize: '56px'
      })
      .setOrigin(0.5);

    this.resultText = this.add
      .text(this.scale.width / 2, this.scale.height * 0.5, '得点は', {
        color: '#ffffff',
        fontSize: '42px'
      })
      .setOrigin(0.5);

    this.guideText = this.add
      .text(
        this.scale.width / 2,
        this.scale.height * 0.73,
        'ボタンを押すとタイトル画面に移動します。',
        {
          color: '#ffffff',
          fontSize: '28px'
        }
      )
      .setOrigin(0.5)
      .setVisible(false);

    this.startResultSequence();

    this.setupNativeGamepadListener();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (this.unsubscribeNativeGamepadListener) {
        this.unsubscribeNativeGamepadListener();
        this.unsubscribeNativeGamepadListener = null;
      }

      this.previousButtons = createEmptyButtonStates();
      this.isTransitioning = false;
      this.isInputEnabled = false;
      this.score = 0;
    });
  }

  private startResultSequence(): void {
    const dotFrames = ['得点は.', '得点は..', '得点は...'];

    dotFrames.forEach((text, index) => {
      this.time.delayedCall(1000 * (index + 1), () => {
        this.resultText.setText(text);
      });
    });

    this.time.delayedCall(4000, () => {
      this.resultText.setText(`得点は...${this.score}です！`).setStyle({
        fontSize: '56px'
      });

      this.guideText.setVisible(true);

      this.tweens.add({
        targets: this.guideText,
        alpha: 0.15,
        duration: 700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut'
      });

      this.time.delayedCall(1000, () => {
        this.isInputEnabled = true;
      });
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
    if (
      this.isInputEnabled &&
      !this.isTransitioning &&
      state.connected &&
      hasAnyButtonJustPressed(this.previousButtons, state.buttons)
    ) {
      this.isTransitioning = true;
      this.scene.start(TITLE_SCENE_KEY);
    }

    this.previousButtons = [...state.buttons];
  }
}
