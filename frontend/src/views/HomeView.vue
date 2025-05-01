<script setup lang="ts">
import TheWelcome from '../components/TheWelcome.vue'
import { useRouter } from 'vue-router';
import { onBeforeMount } from 'vue';

const router = useRouter();
onBeforeMount(() => {
  router.push('/login')
});
</script>

<template>
  <main>
    <TheWelcome />
  </main>
</template>
