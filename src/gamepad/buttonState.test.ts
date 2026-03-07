import { describe, expect, test } from 'vitest';
import {
  createEmptyButtonStates,
  DEFAULT_GAMEPAD_BUTTON_COUNT,
  hasAnyButtonJustPressed,
  hasAnyButtonPressed,
  isButtonJustPressed
} from './buttonState';

describe('buttonState', () => {
  test('いずれかのボタンが押下中なら true を返す', () => {
    expect(hasAnyButtonPressed([false, false, true])).toBe(true);
    expect(hasAnyButtonPressed([false, false, false])).toBe(false);
  });

  test('指定ボタンが非押下から押下になったとき true を返す', () => {
    expect(
      isButtonJustPressed(
        5,
        [false, false, false, false, false, false],
        [false, false, false, false, false, true]
      )
    ).toBe(true);
    expect(isButtonJustPressed(1, [false, true], [false, true])).toBe(false);
  });

  test('いずれかのボタンが新規押下されたら true を返す', () => {
    expect(hasAnyButtonJustPressed([false, false], [false, true])).toBe(true);
    expect(hasAnyButtonJustPressed([false, false], [false, false])).toBe(false);
  });

  test('ボタン状態配列を既定サイズで初期化できる', () => {
    const states = createEmptyButtonStates();
    expect(states).toHaveLength(DEFAULT_GAMEPAD_BUTTON_COUNT);
    expect(states.every((state) => !state)).toBe(true);
  });

  test('ボタン状態配列を任意サイズで初期化できる', () => {
    const states = createEmptyButtonStates(4);
    expect(states).toEqual([false, false, false, false]);
  });
});
