<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { Button } from '@/components/ui/button';

const props = defineProps<{
  show: boolean;
  x: number;
  y: number;
}>();

const emit = defineEmits<{
  (e: 'update'): void;
  (e: 'close'): void;
}>();

const menuRef = ref<HTMLDivElement | null>(null);

const handleClickOutside = (event: MouseEvent) => {
  if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
    emit('close');
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
  <div
    v-if="props.show"
    ref="menuRef"
    class="absolute bg-popover text-popover-foreground rounded-md shadow-md py-1 z-50"
    :style="{ top: `${props.y}px`, left: `${props.x}px` }"
  >
    <Button variant="ghost" class="w-full justify-start" @click="emit('update')">
      Update Message
    </Button>
  </div>
</template>