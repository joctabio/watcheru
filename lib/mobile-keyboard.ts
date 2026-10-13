function hasTextFocus() {
  const element = document.activeElement;
  if (!(element instanceof HTMLElement)) return false;
  if (element.isContentEditable || element.tagName === 'TEXTAREA') return true;
  return element.tagName === 'INPUT' && ['text', 'search', 'email', 'url', 'tel', 'password', 'number'].includes((element as HTMLInputElement).type);
}

export function subscribeToMobileKeyboard(onChange: (open: boolean) => void) {
  const viewport = window.visualViewport;
  let fullHeight = Math.max(window.innerHeight, viewport?.height ?? 0);
  let fullWidth = window.innerWidth;
  let awaitingKeyboard = hasTextFocus();
  let open: boolean | undefined;

  function update() {
    const height = viewport?.height ?? window.innerHeight;
    if (window.innerWidth !== fullWidth) {
      fullWidth = window.innerWidth;
      fullHeight = Math.max(window.innerHeight, height);
    }
    fullHeight = Math.max(fullHeight, height);
    const reduced = (viewport?.scale ?? 1) === 1 && fullHeight - height > 120;
    if (reduced) awaitingKeyboard = false;
    const nextOpen = reduced ? hasTextFocus() || Boolean(open) : awaitingKeyboard;
    if (nextOpen !== open) {
      open = nextOpen;
      onChange(open);
    }
  }

  function onFocus() {
    // Hide immediately, before the keyboard's viewport resize arrives.
    awaitingKeyboard = hasTextFocus();
    update();
  }

  function onBlur() {
    awaitingKeyboard = false;
    update();
  }

  document.addEventListener('focusin', onFocus);
  document.addEventListener('focusout', onBlur);
  viewport?.addEventListener('resize', update);
  window.addEventListener('resize', update);
  update();

  return () => {
    document.removeEventListener('focusin', onFocus);
    document.removeEventListener('focusout', onBlur);
    viewport?.removeEventListener('resize', update);
    window.removeEventListener('resize', update);
  };
}
