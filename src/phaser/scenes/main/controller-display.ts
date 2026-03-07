import type Phaser from 'phaser';

export type ControllerDisplay = {
  textButtonA: Phaser.GameObjects.Text;
  textButtonB: Phaser.GameObjects.Text;
  textButtonX: Phaser.GameObjects.Text;
  textButtonY: Phaser.GameObjects.Text;
  textButtonL: Phaser.GameObjects.Text;
  textButtonR: Phaser.GameObjects.Text;
  textButtonZL: Phaser.GameObjects.Text;
  textButtonZR: Phaser.GameObjects.Text;
  textButtonPlus: Phaser.GameObjects.Text;
  textButtonMinus: Phaser.GameObjects.Text;
  textButtonHome: Phaser.GameObjects.Text;
  textButtonCapture: Phaser.GameObjects.Text;
  textDpadTop: Phaser.GameObjects.Text;
  textDpadBottom: Phaser.GameObjects.Text;
  textDpadLeft: Phaser.GameObjects.Text;
  textDpadRight: Phaser.GameObjects.Text;
  textLeftStick: Phaser.GameObjects.Text;
  textRightStick: Phaser.GameObjects.Text;
};

export const createControllerDisplay = (
  scene: Phaser.Scene
): ControllerDisplay => {
  const buttonTextStyle = {
    color: '#888888', // グレーアウト
    fontSize: '20px'
  };

  const createButtonText = (x: number, y: number, text: string) => {
    return scene.add
      .text(x, y, text, buttonTextStyle)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(101);
  };

  const startX = 180; // 左下からの相対位置
  const startY = scene.scale.height - 120; // 画面左下を基準に調整

  const textButtonX = createButtonText(startX + 80, startY - 20, 'X');
  const textButtonB = createButtonText(startX + 80, startY + 60, 'B');
  const textButtonY = createButtonText(startX + 40, startY + 20, 'Y');
  const textButtonA = createButtonText(startX + 120, startY + 20, 'A');

  const textButtonL = createButtonText(startX - 100, startY - 50, 'L');
  const textButtonR = createButtonText(startX + 100, startY - 50, 'R');
  const textButtonZL = createButtonText(startX - 120, startY - 80, 'ZL');
  const textButtonZR = createButtonText(startX + 120, startY - 80, 'ZR');

  const textButtonPlus = createButtonText(startX + 40, startY - 20, '+');
  const textButtonMinus = createButtonText(startX - 40, startY - 20, '-');
  const textButtonHome = createButtonText(startX, startY + 90, 'HOME');
  const textButtonCapture = createButtonText(
    startX - 100,
    startY + 90,
    'CAPTURE'
  );

  const textDpadTop = createButtonText(startX - 80, startY - 20, '↑');
  const textDpadBottom = createButtonText(startX - 80, startY + 60, '↓');
  const textDpadLeft = createButtonText(startX - 120, startY + 20, '←');
  const textDpadRight = createButtonText(startX - 40, startY + 20, '→');

  const textLeftStick = createButtonText(startX - 80, startY + 20, 'LS');
  const textRightStick = createButtonText(startX + 80, startY + 20, 'RS');

  return {
    textButtonA,
    textButtonB,
    textButtonX,
    textButtonY,
    textButtonL,
    textButtonR,
    textButtonZL,
    textButtonZR,
    textButtonPlus,
    textButtonMinus,
    textButtonHome,
    textButtonCapture,
    textDpadTop,
    textDpadBottom,
    textDpadLeft,
    textDpadRight,
    textLeftStick,
    textRightStick
  };
};

export const updateControllerDisplay = (
  controllerDisplay: ControllerDisplay,
  buttons: boolean[]
): void => {
  const green = '#00ff00';
  const gray = '#888888';

  const setButtonColor = (
    buttonText: Phaser.GameObjects.Text,
    isPressed: boolean
  ) => {
    buttonText.setColor(isPressed ? green : gray);
  };

  setButtonColor(controllerDisplay.textButtonB, buttons[0]);
  setButtonColor(controllerDisplay.textButtonA, buttons[1]);
  setButtonColor(controllerDisplay.textButtonY, buttons[2]);
  setButtonColor(controllerDisplay.textButtonX, buttons[3]);
  setButtonColor(controllerDisplay.textButtonL, buttons[4]);
  setButtonColor(controllerDisplay.textButtonR, buttons[5]);
  setButtonColor(controllerDisplay.textButtonZL, buttons[6]);
  setButtonColor(controllerDisplay.textButtonZR, buttons[7]);
  setButtonColor(controllerDisplay.textButtonMinus, buttons[8]);
  setButtonColor(controllerDisplay.textButtonPlus, buttons[9]);
  setButtonColor(controllerDisplay.textLeftStick, buttons[10]); // Left Stick Click
  setButtonColor(controllerDisplay.textRightStick, buttons[11]); // Right Stick Click
  setButtonColor(controllerDisplay.textButtonHome, buttons[16]);
  setButtonColor(controllerDisplay.textButtonCapture, buttons[17]);

  setButtonColor(controllerDisplay.textDpadTop, buttons[12]);
  setButtonColor(controllerDisplay.textDpadBottom, buttons[13]);
  setButtonColor(controllerDisplay.textDpadLeft, buttons[14]);
  setButtonColor(controllerDisplay.textDpadRight, buttons[15]);
};
