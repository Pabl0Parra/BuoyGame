import test from 'node:test';
import assert from 'node:assert/strict';
import { createInput } from '../src/input.js';

test('F key sets shootPressed for one frame', () => {
  const target = createEventTarget();
  const input = createInput(target, createTouchRoot([]));

  target.dispatch('keydown', { code: 'KeyF', preventDefault() {} });

  assert.equal(input.consumeFrame().shootPressed, true);
  assert.equal(input.consumeFrame().shootPressed, false);
});

test('shoot touch button sets shootPressed for one frame', () => {
  const button = createTouchButton('shoot');
  const input = createInput(createEventTarget(), createTouchRoot([button]));

  button.dispatch('pointerdown', {
    pointerId: 1,
    preventDefault() {},
  });

  assert.equal(input.consumeFrame().shootPressed, true);
  assert.equal(input.consumeFrame().shootPressed, false);
});

function createEventTarget() {
  const listeners = new Map();
  return {
    addEventListener(type, listener) {
      listeners.set(type, [...(listeners.get(type) ?? []), listener]);
    },
    removeEventListener(type, listener) {
      listeners.set(
        type,
        (listeners.get(type) ?? []).filter((item) => item !== listener),
      );
    },
    dispatch(type, event) {
      for (const listener of listeners.get(type) ?? []) {
        listener(event);
      }
    },
  };
}

function createTouchRoot(buttons) {
  return {
    querySelectorAll() {
      return buttons;
    },
  };
}

function createTouchButton(control) {
  return {
    dataset: { touch: control },
    ...createEventTarget(),
    setPointerCapture() {},
    hasPointerCapture() {
      return false;
    },
    releasePointerCapture() {},
  };
}
