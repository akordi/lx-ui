// @ts-nocheck
import { mount } from '@vue/test-utils';
import { test, expect, afterEach } from 'vitest';
import LxStateDisplay from '@/components/StateDisplay.vue';

let wrapper;

afterEach(() => {
  if (wrapper) {
    wrapper.unmount();
  }
});

function mountState(definition) {
  return mount(LxStateDisplay, {
    props: { value: definition.value, dictionary: [definition] },
  });
}

test('LxStateDisplay renders empty value when the dictionary has no match', () => {
  wrapper = mount(LxStateDisplay, { props: { value: 'x', dictionary: [] } });
  expect(wrapper.find('.lx-state').exists()).toBe(false);
});

test('LxStateDisplay renders state type and name', () => {
  wrapper = mountState({ value: 'a', displayName: 'New', displayType: 'new' });
  expect(wrapper.find('.lx-state').classes()).toContain('lx-state-new');
  expect(wrapper.find('.lx-state .lx-state-text').text()).toBe('New');
});

test('LxStateDisplay draws shapes as icons', () => {
  wrapper = mountState({
    value: 'a',
    displayName: 'New',
    displayType: 'new',
    displayShape: 'circle',
  });
  expect(wrapper.find('.lx-state svg.lx-state-icon').exists()).toBe(true);
  expect(wrapper.find('.lx-state .lx-state-indicator').exists()).toBe(false);
});

test('LxStateDisplay uses outline shapes for in-progress types', async () => {
  wrapper = mountState({
    value: 'a',
    displayName: 'Draft',
    displayType: 'draft',
    displayShape: 'circle',
  });
  expect(wrapper.find('.lx-state svg desc').text()).toContain('StatusCircleOutline');

  await wrapper.setProps({ dictionary: [{ value: 'a', displayName: 'New', displayType: 'new' }] });
  expect(wrapper.find('.lx-state svg desc').text()).toContain('StatusCircleFilled');
});

test('LxStateDisplay supports the diamond shape', () => {
  wrapper = mountState({
    value: 'a',
    displayName: 'New',
    displayType: 'new',
    displayShape: 'diamond',
  });
  expect(wrapper.find('.lx-state svg desc').text()).toContain('StatusDiamondFilled');
});

test('LxStateDisplay keeps dedicated status icons', () => {
  wrapper = mountState({
    value: 'a',
    displayName: 'Signed',
    displayType: 'signed',
    displayShape: 'icon',
  });
  expect(wrapper.find('.lx-state svg desc').text()).toContain('StatusSigned');
});

test('LxStateDisplay renders a round icon-only pill without a label', () => {
  wrapper = mountState({ value: 'a', displayType: 'new' });
  expect(wrapper.find('.lx-state').classes()).toContain('lx-state-icon-only');
  expect(wrapper.find('.lx-state .lx-state-text').exists()).toBe(false);
  expect(wrapper.find('.lx-state svg.lx-state-icon').exists()).toBe(true);
});

test('LxStateDisplay treats a blank label as no label', () => {
  wrapper = mountState({ value: 'a', displayName: '   ', displayType: 'new' });
  expect(wrapper.find('.lx-state').classes()).toContain('lx-state-icon-only');
});

test('LxStateDisplay is not icon-only when a label is given', () => {
  wrapper = mountState({ value: 'a', displayName: 'New', displayType: 'new' });
  expect(wrapper.find('.lx-state').classes()).not.toContain('lx-state-icon-only');
});

test('LxStateDisplay keeps custom numbered icons', () => {
  wrapper = mountState({
    value: 'a',
    displayName: 'Three',
    displayType: 'draft',
    displayShape: 'custom',
    options: { num: 3 },
  });
  expect(wrapper.find('.lx-state svg desc').text()).toContain('StatusThreeOutline');
});
