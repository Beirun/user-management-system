<script setup lang="ts">
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ArrowLeft } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import { ref } from 'vue'
import type { Toast, ToastWithAction } from '@/models/toast'
import { useToastService } from '@/_services/toast.service'
import { useAccountService } from '@/_services/account.service'
import { Switch } from '@/components/ui/switch'
import { Sun, Moon } from 'lucide-vue-next'
import { useColorMode } from '@vueuse/core'
import { RefreshCw } from 'lucide-vue-next'
const mode = useColorMode({ disableTransition: false })
const toast = useToastService()
const isSubmitting = ref(false) // Added loading state

const toggleTheme = () => {
  mode.value = mode.value === 'dark' ? 'light' : 'dark'
}

const { forgotPassword, emailExists} = useAccountService()
const email = ref('')

const handleSubmit = async () => {
  if (!email.value) {
    const toastOptions: Toast = {
      title: 'Reset Failed',
      description: 'Please enter your email.',
      type: 'error',
    }
    toast.error(toastOptions)
    return
  }
  const emailExistsResult = await emailExists(email.value)
  if (!emailExistsResult.exists) {
    const toastOptions: Toast = {
      title: 'Reset Failed',
      description: 'Email is currently not registered.',
      type: 'error',
    }
    toast.error(toastOptions)
    return
  }
  isSubmitting.value = true // Start loading
  try {
    const response = await forgotPassword(email.value)
    const toastOptions: ToastWithAction = {
                title: 'Reset Success',
                description: response.message,
                type: 'success',
                action: {
                    class:'button',
                    label: 'Reset Here',
                    onClick: () => {
                        window.location.href = response.url
                    },
                }
            } 
    toast.success(toastOptions)
  } catch (error) {
    const toastOptions: Toast = {
      title: 'Reset Failed',
      description: 'An error occurred. Please try again.',
      type: 'error',
    }
    toast.error(toastOptions)
  } finally {
    isSubmitting.value = false // End loading
  }
}
</script>

<template>
  <div class="w-screen h-screen flex flex-col items-center font-sans">
    <div class="w-24/25 h-1/10 flex items-center">
      <ArrowLeft :color="mode !== 'dark' ? 'black': 'white'" :size="32" @click="$router.back()" class="cursor-pointer" />
    </div>
    <div class="w-full h-4/5 flex flex-col justify-center items-center">
      <div class="w-2/7 h-3/5 p-10 rounded-2xl t flex flex-col justify-center items-center gap-10">
        <p class="text-4xl font-extrabold">Forgot Password</p>
        <p class="text-md">Enter your email to reset your password</p>
        <Input v-model="email" type="email" placeholder="Email" class="h-15" />
        
        <Button 
          @click="handleSubmit" 
          class="w-full h-15 font-bold text-md text-foreground"
          :disabled="isSubmitting"
        >
          <span v-if="isSubmitting"><RefreshCw v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />Submitting...</span>
          <span v-else>Submit</span>
        </Button>

        

        <div class="absolute bottom-10 gap-4 flex items-center text-lg">
          <p>Change To {{ mode === 'dark' ? 'Light' : 'Dark' }} Mode</p>
          <Switch
            :checked="mode === 'dark'"
            @click="toggleTheme"
            class="data-[state=checked]:bg-primary border-2 border-foreground"
          >
            <template #thumb>
              <Sun v-if="mode === 'light'" class="h-4 w-4 text-primary" />
              <Moon v-else class="h-4 w-4 text-primary" />
            </template>
          </Switch>
        </div>
      </div>
    </div>
  </div>
</template>