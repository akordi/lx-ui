// @ts-nocheck
import { test, expect, describe, afterEach, beforeEach, vi } from 'vitest';
import LxDateTimeRange from '@/components/datePicker/DateTimeRange.vue';
import { mount } from '@vue/test-utils';
import { getMonthNames } from '@/utils/date/intl';
import { getMonthNameByOrder } from '@/components/datePicker/helpers';
import { setGlobalProperties } from '@/utils/global';

let wrapper;

const dummyClickAway = {
  beforeMount() {},
  mounted() {},
  beforeUnmount() {},
  unmounted() {},
};

beforeEach(() => {
  const el = document.createElement('div');
  el.id = 'poppers';
  document.body.appendChild(el);
});

afterEach(() => {
  document.body.innerHTML = '';
  if (wrapper) {
    wrapper.unmount();
  }
});

describe.each([
  ['date', '.lx-calendar-container', '.lx-calendar-day-content', /\d+/],
  ['month', '.lx-calendar-container', '.lx-calendar-month', /Janv\./i],
  ['year', '.lx-calendar-container', '.lx-calendar-year', /\d+/],
  ['month-year', '.lx-calendar-container', '.lx-calendar-month', /Janv\./i],
  ['quarters', '.lx-calendar-container', '.lx-calendar-quarter', /^Q1$/],
  ['legacy', '.lx-calendar-container', '.lx-calendar-day-content', /\d+/],
])('LxDateTimePicker kind %s', (kind, container, unit, regEx) => {
  test('LxDateTimePicker test  container renders and there is item to select', async () => {
    expect(LxDateTimeRange).toBeTruthy();

    wrapper = mount(LxDateTimeRange, {
      props: {
        kind,
      },
      global: {
        stubs: ['router-link'],
        directives: {
          ClickAway: dummyClickAway,
        },
      },
    });

    const pickerInput = wrapper.find('.lx-date-time-picker.lx-input-area');
    expect(pickerInput.exists()).toBe(true);

    await pickerInput.trigger('keyup', { key: 'ArrowDown' });

    const calendarContainer = document.body.querySelector(container);
    expect(calendarContainer).toBeTruthy();

    const unitContent = calendarContainer.querySelector(unit);
    expect(unitContent).toBeTruthy();
    expect(unitContent.textContent).toMatch(regEx);
  });
});

describe('ArrowDown opens the range picker without scrolling the page', () => {
  function mountRange() {
    return mount(LxDateTimeRange, {
      props: { kind: 'date' },
      global: {
        stubs: ['router-link'],
        directives: { ClickAway: dummyClickAway },
      },
    });
  }

  test.each([
    ['start input', 0],
    ['end input', 1],
  ])(
    'prevents the default ArrowDown action on keydown for the %s so the page does not scroll',
    (_label, index) => {
      wrapper = mountRange();

      const inputs = wrapper.findAll('.lx-date-time-picker.lx-input-area');
      expect(inputs.length).toBeGreaterThan(1);

      // Cancelable so we can read defaultPrevented, which `wrapper.trigger` does not expose.
      const event = new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        bubbles: true,
        cancelable: true,
      });
      inputs[index].element.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(true);
    }
  );
});

describe('Space does not scroll the range picker page in non-input modes', () => {
  function mountRange(kind) {
    return mount(LxDateTimeRange, {
      props: { kind },
      global: {
        stubs: ['router-link'],
        directives: { ClickAway: dummyClickAway },
      },
    });
  }

  test('does not prevent the default Space action in input modes (e.g. date)', () => {
    wrapper = mountRange('date');

    const input = wrapper.find('.lx-date-time-picker.lx-input-area').element;
    const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
    input.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
  });

  test.each(['month', 'month-year', 'quarters'])(
    'prevents the default Space action on keydown for kind %s',
    (kind) => {
      wrapper = mountRange(kind);

      const inputs = wrapper.findAll('.lx-date-time-picker.lx-input-area');
      expect(inputs.length).toBeGreaterThan(0);

      inputs.forEach((input) => {
        const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
        input.element.dispatchEvent(event);

        expect(event.defaultPrevented).toBe(true);
      });
    }
  );
});

describe('LxDateTimeRange close on click beside vertically wrapped inputs', () => {
  function mountRange() {
    return mount(LxDateTimeRange, {
      props: { kind: 'date' },
      global: {
        stubs: ['router-link'],
        directives: { ClickAway: dummyClickAway },
      },
    });
  }

  async function openCalendar() {
    const startInput = wrapper.find('.lx-date-time-picker.lx-input-area');
    await startInput.trigger('keyup', { key: 'ArrowDown' });
    expect(document.body.querySelector('.lx-calendar-container')).toBeTruthy();
  }

  test('clicking the stretched empty area of the input container closes the calendar', async () => {
    wrapper = mountRange();
    await openCalendar();

    // The container stretches full width when inputs wrap vertically (responsive).
    // A click on the container itself (target === currentTarget) must fall through
    // to the toggler and close the menu instead of being swallowed by preventClose.
    await wrapper.find('.lx-datepicker-input-container').trigger('click');

    expect(document.body.querySelector('.lx-calendar-container')).toBeFalsy();
  });

  test('clicking an inner element (separator) keeps the calendar open', async () => {
    wrapper = mountRange();
    await openCalendar();

    await wrapper.find('.lx-date-time-range-separator').trigger('click');

    expect(document.body.querySelector('.lx-calendar-container')).toBeTruthy();
  });

  test('clicking the stretched empty area while closed does not open the calendar', async () => {
    wrapper = mountRange();

    expect(document.body.querySelector('.lx-calendar-container')).toBeFalsy();

    await wrapper.find('.lx-datepicker-input-container').trigger('click');

    expect(document.body.querySelector('.lx-calendar-container')).toBeFalsy();
  });
});

describe('timeAdjust', () => {
  const mountRange = (props = {}) =>
    mount(LxDateTimeRange, {
      props: {
        kind: 'date',
        ...props,
      },
      global: {
        stubs: ['router-link'],
        directives: {
          ClickAway: dummyClickAway,
        },
      },
    });

  const flush = async (wrp) => {
    await wrp.vm.$nextTick();
    await wrp.vm.$nextTick();
    await wrp.vm.$nextTick();
  };

  // Picks the first and then a later selectable day to complete a range
  const selectRange = async (wrp) => {
    const pickerInput = wrp.find('.lx-date-time-picker.lx-input-area');
    await pickerInput.trigger('keyup', { key: 'ArrowDown' });

    const container = document.body.querySelector('.lx-calendar-container');
    expect(container).toBeTruthy();

    const days = [
      ...container.querySelectorAll(
        '.lx-calendar-day:not(.lx-other-month):not(.lx-different-month):not(.lx-disabled-date):not(.lx-disabled-day)'
      ),
    ];
    expect(days.length).toBeGreaterThan(1);

    days[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    // The picker hands focus to the end input on a later tick, so let it settle
    // before the second click, otherwise it restarts the range instead of closing it.
    await flush(wrp);
    days[days.length - 1].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flush(wrp);
  };

  const lastEmitted = (wrp, event) => {
    const emitted = wrp.emitted(event);
    expect(emitted).toBeTruthy();
    return emitted[emitted.length - 1][0];
  };

  test('emits a plain date when timeAdjust is not set', async () => {
    wrapper = mountRange();
    await selectRange(wrapper);

    expect(lastEmitted(wrapper, 'update:startDate')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(lastEmitted(wrapper, 'update:endDate')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('a single timeAdjust string applies to both ends', async () => {
    wrapper = mountRange({ timeAdjust: '12:30:15' });
    await selectRange(wrapper);

    expect(lastEmitted(wrapper, 'update:startDate')).toMatch(/T12:30:15/);
    expect(lastEmitted(wrapper, 'update:endDate')).toMatch(/T12:30:15/);
  });

  test('timeAdjust requires the seconds and ignores HH:mm', async () => {
    wrapper = mountRange({ timeAdjust: '08:45' });
    await selectRange(wrapper);

    expect(lastEmitted(wrapper, 'update:startDate')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('an object timeAdjust sets each end separately', async () => {
    wrapper = mountRange({ timeAdjust: { start: '00:00:00', end: '23:59:59' } });
    await selectRange(wrapper);

    expect(lastEmitted(wrapper, 'update:startDate')).toMatch(/T00:00:00/);
    expect(lastEmitted(wrapper, 'update:endDate')).toMatch(/T23:59:59/);
  });

  test('an object timeAdjust with only one end leaves the other as a plain date', async () => {
    wrapper = mountRange({ timeAdjust: { end: '23:59:59' } });
    await selectRange(wrapper);

    expect(lastEmitted(wrapper, 'update:startDate')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(lastEmitted(wrapper, 'update:endDate')).toMatch(/T23:59:59/);
  });

  test("timeAdjust 'now' stamps the current time", async () => {
    const now = new Date();
    wrapper = mountRange({ timeAdjust: 'now' });
    await selectRange(wrapper);

    const startDate = lastEmitted(wrapper, 'update:startDate');
    expect(startDate).toMatch(/T\d{2}:\d{2}:\d{2}/);
    expect(new Date(startDate).getHours()).toBe(now.getHours());
    expect(new Date(startDate).getMinutes()).toBe(now.getMinutes());
  });

  test.each(['25:99:00', '7:30:00', '12:00', 'noon', ''])(
    'an unparsable timeAdjust (%s) falls back to a plain date',
    async (timeAdjust) => {
      wrapper = mountRange({ timeAdjust });
      await selectRange(wrapper);

      expect(lastEmitted(wrapper, 'update:startDate')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  );

  test('applies timeAdjust to a preselected range on load', async () => {
    wrapper = mountRange({
      startDate: '2026-09-10',
      endDate: '2026-09-20',
      timeAdjust: { start: '00:00:00', end: '23:59:59' },
    });
    await flush(wrapper);

    expect(lastEmitted(wrapper, 'update:startDate')).toMatch(/^2026-09-10T00:00:00/);
    expect(lastEmitted(wrapper, 'update:endDate')).toMatch(/^2026-09-20T23:59:59/);
  });

  test('does not touch a preselected range when timeAdjust is not set', async () => {
    wrapper = mountRange({ startDate: '2026-09-10', endDate: '2026-09-20' });
    await flush(wrapper);

    expect(wrapper.emitted('update:startDate')).toBeFalsy();
    expect(wrapper.emitted('update:endDate')).toBeFalsy();
  });

  test('does not re-emit once the preselected range already carries the time', async () => {
    wrapper = mountRange({
      startDate: '2026-09-10',
      endDate: '2026-09-20',
      timeAdjust: '06:15:00',
    });
    await flush(wrapper);

    const emitCount = wrapper.emitted('update:startDate').length;

    // Feed the adjusted value back in, the way a v-model binding would
    await wrapper.setProps({ startDate: lastEmitted(wrapper, 'update:startDate') });
    await flush(wrapper);

    expect(wrapper.emitted('update:startDate').length).toBe(emitCount);
  });

  test('applies timeAdjust to a preselected range when the prop changes later', async () => {
    wrapper = mountRange({ startDate: '2026-09-10', endDate: '2026-09-20' });
    await flush(wrapper);

    await wrapper.setProps({ timeAdjust: '18:00:00' });
    await flush(wrapper);

    expect(lastEmitted(wrapper, 'update:startDate')).toMatch(/^2026-09-10T18:00:00/);
    expect(lastEmitted(wrapper, 'update:endDate')).toMatch(/^2026-09-20T18:00:00/);
  });

  test('leaves a read-only preselected range untouched', async () => {
    wrapper = mountRange({
      startDate: '2026-09-10',
      endDate: '2026-09-20',
      timeAdjust: '18:00:00',
      readOnly: true,
    });
    await flush(wrapper);

    expect(wrapper.emitted('update:startDate')).toBeFalsy();
    expect(wrapper.emitted('update:endDate')).toBeFalsy();
  });

  test('timeAdjust is ignored for non-date kinds', async () => {
    wrapper = mountRange({ kind: 'year', timeAdjust: '12:00:00' });

    const pickerInput = wrapper.find('.lx-date-time-picker.lx-input-area');
    await pickerInput.trigger('keyup', { key: 'ArrowDown' });

    const container = document.body.querySelector('.lx-calendar-container');
    const years = [...container.querySelectorAll('.lx-calendar-year:not(.lx-disabled-year)')];
    expect(years.length).toBeGreaterThan(1);

    years[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flush(wrapper);
    years[1].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flush(wrapper);

    expect(lastEmitted(wrapper, 'update:startDate')).toMatch(/^\d{4}$/);
  });
});

describe("timeAdjust does not leak into the picker's own comparisons", () => {
  // A real consumer binds v-model, so the adjusted value flows straight back into the props
  // and on into the picker. Without that round trip these cases cannot reproduce.
  let boundWrapper = null;
  const syncProp = (key) => (value) => boundWrapper?.setProps({ [key]: value });

  const mountRange = (props = {}) => {
    const wrp = mount(LxDateTimeRange, {
      props: {
        kind: 'date',
        startDate: null,
        endDate: null,
        ...props,
        'onUpdate:startDate': syncProp('startDate'),
        'onUpdate:endDate': syncProp('endDate'),
      },
      global: {
        stubs: ['router-link'],
        directives: { ClickAway: dummyClickAway },
      },
    });
    boundWrapper = wrp;
    return wrp;
  };

  const flush = async (wrp) => {
    await wrp.vm.$nextTick();
    await wrp.vm.$nextTick();
    await wrp.vm.$nextTick();
  };

  // Clicks the same day twice, which must produce a single-day range
  const selectSameDayTwice = async (wrp) => {
    const pickerInput = wrp.find('.lx-date-time-picker.lx-input-area');
    await pickerInput.trigger('keyup', { key: 'ArrowDown' });

    const container = document.body.querySelector('.lx-calendar-container');
    const day = container.querySelector(
      '.lx-calendar-day:not(.lx-other-month):not(.lx-different-month):not(.lx-disabled-date):not(.lx-disabled-day)'
    );
    expect(day).toBeTruthy();

    day.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flush(wrp);
    day.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flush(wrp);
  };

  const lastEmitted = (wrp, event) => {
    const emitted = wrp.emitted(event);
    expect(emitted).toBeTruthy();
    return emitted[emitted.length - 1][0];
  };

  test.each([
    ['no timeAdjust', null],
    ['a single timeAdjust', '12:00:00'],
    ['a start-only timeAdjust object', { start: '11:00:00' }],
    ['an end-only timeAdjust object', { end: '11:00:00' }],
  ])('a single-day range can be picked with %s', async (_label, timeAdjust) => {
    wrapper = mountRange(timeAdjust ? { timeAdjust } : {});
    await selectSameDayTwice(wrapper);

    const startDate = lastEmitted(wrapper, 'update:startDate');
    const endDate = lastEmitted(wrapper, 'update:endDate');

    expect(startDate).toBeTruthy();
    expect(endDate).toBeTruthy();
    expect(endDate.slice(0, 10)).toBe(startDate.slice(0, 10));
  });
});

describe('rangeMonth', () => {
  const monthNames = getMonthNames('lv-LV');

  // The range picker renders two month panes, and its header labels them "<first>-<last>"
  const expectedHeader = (year, month) =>
    [month, month + 1]
      .map((m) => getMonthNameByOrder(monthNames, new Date(year, m, 1).getMonth(), true, 'short'))
      .join('-');

  const header = () =>
    document.body
      .querySelector('.lx-calendar-months-select-button .lx-button-label')
      .textContent.trim();

  // edge picks which of the two range inputs opens the calendar, since the active input
  // decides whether the view anchors on the start or the end date
  const openCalendar = async (props = {}, edge = 'start') => {
    wrapper = mount(LxDateTimeRange, {
      props: { id: 'range', kind: 'date', ...props },
      global: {
        stubs: ['router-link'],
        directives: { ClickAway: dummyClickAway },
      },
    });

    const pickerInput = wrapper.find(edge === 'end' ? '#till-range' : '#from-range');
    expect(pickerInput.exists()).toBe(true);
    await pickerInput.trigger('keyup', { key: 'ArrowDown' });
    expect(document.body.querySelector('.lx-calendar-container')).toBeTruthy();
  };

  test("defaults to 'next', anchoring the start date in the left pane", async () => {
    await openCalendar({ startDate: '2026-05-10', endDate: '2026-05-20' });

    expect(header()).toBe(expectedHeader(2026, 4));
  });

  test("'previous' anchors an end-only range in the right pane", async () => {
    await openCalendar({ endDate: '2026-05-20', rangeMonth: 'previous' });

    expect(header()).toBe(expectedHeader(2026, 3));
  });

  test("'previous' does not shift off a start date that is still awaiting its end", async () => {
    await openCalendar({ startDate: '2026-05-10', rangeMonth: 'previous' });

    expect(header()).toBe(expectedHeader(2026, 4));
  });

  test("'previous' does not shift while the end input picks the end of a pending start", async () => {
    await openCalendar({ startDate: '2026-05-10', rangeMonth: 'previous' }, 'end');

    expect(header()).toBe(expectedHeader(2026, 4));
  });

  test("'previous' shifts a complete range from the start input", async () => {
    await openCalendar(
      { startDate: '2026-05-10', endDate: '2026-05-20', rangeMonth: 'previous' },
      'start'
    );

    expect(header()).toBe(expectedHeader(2026, 3));
  });

  test("'previous' shifts a complete range from the end input", async () => {
    await openCalendar(
      { startDate: '2026-05-10', endDate: '2026-06-20', rangeMonth: 'previous' },
      'end'
    );

    expect(header()).toBe(expectedHeader(2026, 4));
  });

  test("'previous' shifts an empty picker back a month from today", async () => {
    const today = new Date();
    await openCalendar({ rangeMonth: 'previous' });

    const shifted = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    expect(header()).toBe(expectedHeader(shifted.getFullYear(), shifted.getMonth()));
  });

  test("'next' leaves an empty picker on the current month", async () => {
    const today = new Date();
    await openCalendar();

    expect(header()).toBe(expectedHeader(today.getFullYear(), today.getMonth()));
  });

  test("'previous' does not shift the view below minDate", async () => {
    await openCalendar({
      endDate: '2026-05-20',
      minDate: '2026-05-01',
      rangeMonth: 'previous',
    });

    expect(header()).toBe(expectedHeader(2026, 4));
  });
});

describe('timeAdjust validation warnings', () => {
  let warnSpy;

  beforeEach(() => {
    // lxDevUtils only logs on dev-like environments
    setGlobalProperties({ environment: 'development' });
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    setGlobalProperties({});
  });

  const mountRange = (timeAdjust) =>
    mount(LxDateTimeRange, {
      props: { kind: 'date', timeAdjust },
      global: {
        stubs: ['router-link'],
        directives: { ClickAway: dummyClickAway },
      },
    });

  const warnings = () => warnSpy.mock.calls.map(([message]) => message).join('\n');

  test.each([
    ['start', 'end', { start: '11:00:00' }],
    ['end', 'start', { end: '23:59:59' }],
  ])(
    'warns that only %s is set, leaving the %s without a time',
    async (defined, missing, value) => {
      wrapper = mountRange(value);

      expect(warnings()).toContain(`sets only '${defined}'`);
      expect(warnings()).toContain(`the ${missing} date keeps no time`);
    }
  );

  test('warns about unknown keys', async () => {
    wrapper = mountRange({ startDate: '11:00:00', end: '23:59:59' });

    expect(warnings()).toContain("unknown key(s) 'startDate'");
  });

  test('warns when the object sets neither end', async () => {
    wrapper = mountRange({});

    expect(warnings()).toContain("sets neither 'start' nor 'end'");
  });

  test('warns again when the prop changes to a half-filled object', async () => {
    wrapper = mountRange('12:00:00');
    expect(warnSpy).not.toHaveBeenCalled();

    await wrapper.setProps({ timeAdjust: { start: '11:00:00' } });

    expect(warnings()).toContain("sets only 'start'");
  });

  test('warns about an invalid time inside an object', async () => {
    wrapper = mountRange({ start: '11:00', end: '23:59:59' });

    expect(warnings()).toContain("'start' '11:00' is not a valid time");
  });

  test('warns about an unparsable time', async () => {
    wrapper = mountRange('12:00');

    expect(warnings()).toContain("value '12:00' is not a valid time");
  });

  test.each([
    ['a complete object', { start: '00:00:00', end: '23:59:59' }],
    ['a single string', '12:00:00'],
    ["the literal 'now'", 'now'],
    ['no value at all', null],
  ])('stays quiet for %s', async (_label, timeAdjust) => {
    wrapper = mountRange(timeAdjust);

    expect(warnSpy).not.toHaveBeenCalled();
  });
});
