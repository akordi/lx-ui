import { describe, test, expect, afterEach, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import LxTooltip from '@/components/Tooltip.vue';
import { vTooltip, closeTooltip, OPEN_DELAY } from '@/directives/tooltip';

let wrapper;

function mountTooltip(props = {}, slot = '<button class="inner">Inner</button>') {
  return mount(LxTooltip, {
    props: { value: 'Tooltip text', ...props },
    slots: { default: slot },
    attachTo: document.body,
  });
}

function trigger() {
  return document.querySelector('.lx-info-wrapper-content.lx-tooltip-kind');
}

function tooltipText() {
  return document.querySelector('#poppers .lx-tooltip-text')?.textContent ?? null;
}

function hover(el, x = 100, y = 100) {
  el.dispatchEvent(new MouseEvent('mousemove', { clientX: x, clientY: y, bubbles: true }));
  vi.advanceTimersByTime(OPEN_DELAY);
}

beforeEach(() => {
  const poppers = document.createElement('div');
  poppers.id = 'poppers';
  document.body.appendChild(poppers);
  vi.useFakeTimers();
});

afterEach(() => {
  closeTooltip();
  wrapper?.unmount();
  wrapper = null;
  vi.useRealTimers();
  document.body.innerHTML = '';
});

describe('LxTooltip', () => {
  test('renders through the v-tooltip directive', async () => {
    wrapper = mountTooltip();
    expect(trigger().getAttribute('data-lx-tooltip')).toBe('Tooltip text');

    hover(document.querySelector('.inner'));
    await nextTick();

    expect(tooltipText()).toBe('Tooltip text');
    expect(wrapper.vm.showPopper).toBe(true);
    expect(trigger().getAttribute('aria-describedby')).toBe('lx-tooltip-panel');
    expect(document.querySelector('.inner').getAttribute('aria-labelledby')).toBe(
      'lx-tooltip-panel'
    );
  });

  test('a nested v-tooltip is ignored in favour of the component', async () => {
    wrapper = mount(
      {
        components: { LxTooltip },
        directives: { tooltip: vTooltip },
        template: `<LxTooltip value="Outer"><button class="inner" v-tooltip="'Inner'">Inner</button></LxTooltip>`,
      },
      { attachTo: document.body }
    );
    expect(document.querySelector('.inner').getAttribute('data-lx-tooltip')).toBe('Inner');

    hover(document.querySelector('.inner'));
    expect(tooltipText()).toBe('Outer');
  });

  test('disabled suppresses the tooltip', () => {
    wrapper = mountTooltip({ disabled: true });
    hover(trigger());
    expect(tooltipText()).toBeNull();
    expect(trigger().classList.contains('lx-disabled')).toBe(true);
  });

  test('handleOpen and handleClose drive the panel', async () => {
    wrapper = mountTooltip();

    wrapper.vm.handleOpen();
    await nextTick();
    expect(tooltipText()).toBe('Tooltip text');
    expect(wrapper.vm.showPopper).toBe(true);

    wrapper.vm.handleClose();
    await nextTick();
    expect(tooltipText()).toBeNull();
    expect(wrapper.vm.showPopper).toBe(false);
    expect(document.querySelector('.inner').hasAttribute('aria-labelledby')).toBe(false);
  });

  test('handleClose leaves another trigger open', () => {
    wrapper = mountTooltip();
    const other = mount(LxTooltip, {
      props: { value: 'Other' },
      slots: { default: '<span class="other">Other</span>' },
      attachTo: document.body,
    });

    other.vm.handleOpen();
    wrapper.vm.handleClose();
    expect(tooltipText()).toBe('Other');
    other.unmount();
  });

  test('passes label and role through', () => {
    wrapper = mountTooltip({ label: 'Label', description: 'Desc', customRole: 'group' });
    expect(trigger().getAttribute('aria-label')).toBe('Label. Desc');
    expect(trigger().getAttribute('role')).toBe('group');
  });
});
