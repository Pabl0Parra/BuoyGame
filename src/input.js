export function createInput(target = window, touchRoot = document) {
  const input = {
    left: false,
    right: false,
    jumpPressed: false,
    pausePressed: false,
    mutePressed: false,
  };

  const keyDown = (event) => {
    if (event.code === 'ArrowLeft' || event.code === 'KeyA') input.left = true;
    if (event.code === 'ArrowRight' || event.code === 'KeyD') input.right = true;
    if (event.code === 'Space' || event.code === 'ArrowUp' || event.code === 'KeyW') {
      input.jumpPressed = true;
      event.preventDefault();
    }
    if (event.code === 'KeyP') input.pausePressed = true;
    if (event.code === 'KeyM') input.mutePressed = true;
  };

  const keyUp = (event) => {
    if (event.code === 'ArrowLeft' || event.code === 'KeyA') input.left = false;
    if (event.code === 'ArrowRight' || event.code === 'KeyD') input.right = false;
  };

  target.addEventListener('keydown', keyDown);
  target.addEventListener('keyup', keyUp);

  const touchButtons = [...touchRoot.querySelectorAll('[data-touch]')];
  const touchHandlers = [];
  for (const button of touchButtons) {
    const control = button.dataset.touch;
    const press = (event) => {
      event.preventDefault();
      if (control === 'left') input.left = true;
      if (control === 'right') input.right = true;
      if (control === 'jump') input.jumpPressed = true;
    };
    const release = (event) => {
      event.preventDefault();
      if (control === 'left') input.left = false;
      if (control === 'right') input.right = false;
    };
    button.addEventListener('pointerdown', press);
    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
    button.addEventListener('pointerleave', release);
    touchHandlers.push({ button, press, release });
  }

  return {
    state: input,
    consumeFrame() {
      const frame = { ...input };
      input.jumpPressed = false;
      input.pausePressed = false;
      input.mutePressed = false;
      return frame;
    },
    destroy() {
      target.removeEventListener('keydown', keyDown);
      target.removeEventListener('keyup', keyUp);
      for (const { button, press, release } of touchHandlers) {
        button.removeEventListener('pointerdown', press);
        button.removeEventListener('pointerup', release);
        button.removeEventListener('pointercancel', release);
        button.removeEventListener('pointerleave', release);
      }
    },
  };
}
