<script lang="ts" setup>
import { useAccountService } from '@/_services/account.service'
import { useToastService } from '@/_services/toast.service'
import { type Toast } from '@/models/toast'
import { useAccountStore } from '@/stores/account'
import { useRouter } from 'vue-router'
import { computed, onBeforeMount, ref } from 'vue'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Sun, Moon, LogOut } from 'lucide-vue-next'
import { useColorMode } from '@vueuse/core'

const mode = useColorMode({ disableTransition: false })
const router = useRouter()
const accountStore = useAccountStore()
const { logout } = useAccountService()
const toast = useToastService()

const toggleTheme = () => {
  mode.value = mode.value === 'dark' ? 'light' : 'dark'
}
const handleLogout = async () => {
  try {
    await logout()
    accountStore.logout()
    router.push('/login')
    const toastOptions: Toast = {
      title: 'Logout',
      description: 'Logout successful',
      type: 'success',
    }
    toast.success(toastOptions)
  } catch (error) {
    const toastOptions: Toast = {
      title: 'Logout',
      description: (error as Error).message,
      type: 'error',
    }
    toast.error(toastOptions)
  }
}
console.log("mode",mode)
</script>

<template>
  <header
    class="sticky top-0 flex justify-center z-50 w-screen border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
  >
    <div class="container flex h-16 items-center justify-between w-full">
      <div class="flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="h-6 w-6"
        >
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
          <path d="M9 10h6" />
          <path d="M12 7v6" />
        </svg>
        <span class="text-lg font-semibold">EduManage</span>
      </div>

      <div class="flex items-center gap-2">
        <div class="flex items-center gap-2">
            <Switch 
            :checked="mode === 'dark'"
            @click="toggleTheme"
            class="data-[state=checked]:bg-primary"
            >
            <template #thumb>

                <Sun v-if="mode==='light'" class="h-4 w-4 text-primary " />
                <Moon v-else class="h-4 w-4 text-primary " />
            </template>
        </Switch>
  </div>

        <Button variant="outline" size="sm" class="gap-2" @click="handleLogout">
          <LogOut class="h-4 w-4" />
          <span>Logout</span>
        </Button>
      </div>
    </div>
  </header>
</template>
