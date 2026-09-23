import { nextTick } from 'vue';
import { describe, test, expect, afterEach, beforeEach } from 'vitest';
import { mount, RouterLinkStub } from '@vue/test-utils';
import LxModal from '@/components/Modal.vue';

let wrapper;

function mountModal(props = {}) {
  return mount(LxModal, {
    props: { label: 'Test modal', ...props },
    slots: { default: () => 'Body' },
    global: { stubs: { RouterLink: RouterLinkStub } },
  });
}

async function openModal() {
  wrapper.vm.open();
  await nextTick();
  await nextTick();
  await nextTick();
}

function pressEscape(target) {
  const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
  target.dispatchEvent(event);
  return event;
}

beforeEach(() => {
  const el = document.createElement('div');
  el.id = 'modals';
  document.body.appendChild(el);
});

afterEach(() => {
  if (wrapper) {
    wrapper.unmount();
    wrapper = null;
  }
  document.body.innerHTML = '';
});

describe.each(['default', 'native'])('LxModal (kind: %s) Escape', (kind) => {
  const target = () =>
    kind === 'default' ? document.querySelector('.lx-curtain') : document.querySelector('dialog');

  test('closes and emits close exactly once', async () => {
    wrapper = mountModal({ kind });
    await openModal();
    expect(target()).toBeTruthy();

    pressEscape(target());
    await nextTick();

    expect(wrapper.emitted('close')).toHaveLength(1);
    expect(target()).toBeNull();
  });

  // Regression: Escape used to close the modal even with disableClosing.
  test('does not close when disableClosing is true', async () => {
    wrapper = mountModal({ kind, disableClosing: true });
    await openModal();

    const event = pressEscape(target());
    await nextTick();

    expect(wrapper.emitted('close')).toBeUndefined();
    expect(target()).toBeTruthy();
    if (kind === 'native') {
      expect(event.defaultPrevented).toBe(true);
    }
  });

  test('does not close when escEnabled is false', async () => {
    wrapper = mountModal({ kind, escEnabled: false });
    await openModal();

    pressEscape(target());
    await nextTick();

    expect(wrapper.emitted('close')).toBeUndefined();
    expect(target()).toBeTruthy();
  });

  test('programmatic close() still works with disableClosing', async () => {
    wrapper = mountModal({ kind, disableClosing: true });
    await openModal();

    wrapper.vm.close();
    await nextTick();

    expect(wrapper.emitted('close')).toHaveLength(1);
    expect(target()).toBeNull();
  });
});

describe('LxModal (kind: native) cancel event', () => {
  test('is prevented when disableClosing is true', async () => {
    wrapper = mountModal({ kind: 'native', disableClosing: true });
    await openModal();

    const dialog = document.querySelector('dialog');
    const event = new Event('cancel', { cancelable: true });
    dialog.dispatchEvent(event);
    await nextTick();

    expect(event.defaultPrevented).toBe(true);
    expect(wrapper.emitted('close')).toBeUndefined();
  });

  test('closes and emits close once when allowed', async () => {
    wrapper = mountModal({ kind: 'native' });
    await openModal();

    const dialog = document.querySelector('dialog');
    dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
    await nextTick();
    await nextTick();

    expect(wrapper.emitted('close')).toHaveLength(1);
    expect(document.querySelector('dialog')).toBeNull();
  });
});
