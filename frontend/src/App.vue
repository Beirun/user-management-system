<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { Toaster } from '@/components/ui/sonner'
import { useColorMode } from '@vueuse/core'

const mode = useColorMode({ disableTransition: false })

</script>

<template>
    <Toaster richColors :theme="mode as 'light' | 'dark'" />

  <RouterView />
</template>

<style >

</style>
