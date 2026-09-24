<script setup>
import { onMounted, ref, computed, watch } from 'vue';

import { vTooltip, openTooltip, closeTooltip } from '@/directives/tooltip';
import { generateUUID } from '@/utils/stringUtils';

// Tooltip markup, timings and positioning live in the v-tooltip directive
// `id` is kept for backwards compatibility – the directive owns the panel id
const props = defineProps({
  id: { type: String, default: () => generateUUID() },
  value: { type: String, default: null },
  disabled: { type: Boolean, default: false },
  label: { type: String, default: null },
  description: { type: String, default: null },
  customRole: { type: String, default: null },
});

const triggerRef = ref(null);
const showPopper = ref(false);

const ariaLabel = computed(() => {
  if (props.label && props.description) {
    return `${props.label}. ${props.description}`;
  }
  return props.label || props.description || null;
});

const tooltipBinding = computed(() => ({
  value: props.value,
  disabled: props.disabled,
  onToggle: (open) => {
    showPopper.value = open;
  },
}));

const handleOpen = () => {
  if (props.disabled || !triggerRef.value) return;
  openTooltip(triggerRef.value);
};

const handleClose = () => {
  if (triggerRef.value) closeTooltip(triggerRef.value);
};

// The slotted control is named by the open panel, same as the trigger's aria-describedby
const labelledByTarget = ref(null);
function updateLabelledBy() {
  const el = labelledByTarget.value;
  if (!(el instanceof HTMLElement)) return;
  const describedBy = triggerRef.value?.getAttribute('aria-describedby');
  if (showPopper.value && describedBy) {
    el.setAttribute('aria-labelledby', describedBy);
  } else {
    el.removeAttribute('aria-labelledby');
  }
}

watch(showPopper, updateLabelledBy);

onMounted(() => {
  labelledByTarget.value = triggerRef.value?.firstElementChild;
  updateLabelledBy();
});

defineExpose({ handleOpen, handleClose, showPopper });
</script>
<template>
  <div
    ref="triggerRef"
    v-tooltip="tooltipBinding"
    class="lx-info-wrapper-content lx-tooltip-kind"
    :class="[{ 'lx-disabled': disabled }]"
    :aria-label="ariaLabel"
    :role="customRole"
  >
    <slot />
  </div>
</template>
