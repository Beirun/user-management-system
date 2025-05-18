<script setup lang="ts">
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Eye } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import { useRouter } from 'vue-router'
// import { toast } from 'vue-sonner'
import { reactive, ref } from 'vue'
// import axios from '@/_helpers/axios';
// import axios from 'axios';
import { useAccountService } from '@/_services/account.service'
import { useAccountStore } from '@/stores/account'
import { useToastService } from '@/_services/toast.service'
import type { Toast, ToastWithAction } from '@/models/toast'
import { Switch } from '@/components/ui/switch'
import { Sun, Moon, LogOut, User } from 'lucide-vue-next'
import { useColorMode } from '@vueuse/core'
import { is } from 'date-fns/locale'

const mode = useColorMode({ disableTransition: false })
const loginData = reactive({
  email: '',
  password: '',
})
const { login, isEmailVerified, emailExists, isPasswordCorrect } = useAccountService()
const accountStore = useAccountStore()
const toast = useToastService()
const router = useRouter()
const isSubmitting = ref(false)
const handleLogin = async () => {
  try {
    isSubmitting.value = true
    if (!loginData.email || !loginData.password) {
      const toastOptions: Toast = {
        title: 'Login Failed',
        description: 'Please enter your email and password.',
        type: 'error',
      }
      toast.error(toastOptions)
      isSubmitting.value = false
      return
    }
    //check if emailexists
    const emailExistsResult = await emailExists(loginData.email)
    if (!emailExistsResult.exists) {
      const toastOptions: Toast = {
        title: 'Login Failed',
        description: 'Email does not exist.',
        type: 'error',
      }
      toast.error(toastOptions)
      isSubmitting.value = false
      return
    }
    const isPasswordCorrectResult = await isPasswordCorrect(loginData.email, loginData.password)
    if (!isPasswordCorrectResult.isCorrect) {
      const toastOptions: Toast = {
        title: 'Login Failed',
        description: 'Password is incorrect.',
        type: 'error',
      }
      toast.error(toastOptions)
      isSubmitting.value = false
      return
    }

    const isVerified = await isEmailVerified(loginData.email)
    if (!isVerified.isVerified) {
      const toastOptions: ToastWithAction = {
        title: 'Login Failed',
        description: 'Invalid email address. Please verify your email before logging in.',
        type: 'error',
        action: {
          class: 'button',
          label: 'Verify Email',
          onClick: () => {
            router.push(`/account/verify-email?token=${isVerified.token}`)
          },
        },
      }
      toast.error(toastOptions)
      isSubmitting.value = false
      return
    }
    const response = await login(loginData.email, loginData.password)
    console.log('response', response)
    if (!response) {
      const toastOptions: Toast = {
        title: 'Login Failed',
        description: 'Invalid email or password.',
        type: 'error',
      }
      toast.error(toastOptions)
      isSubmitting.value = false
      return
    }

    accountStore.setAccount(response)
    const toastOptions: Toast = {
      title: 'Login Successful',
      description: 'Logged in successfully.',
      type: 'success',
    }
    toast.success(toastOptions)
    isSubmitting.value = false

    if (response.role === 'Admin') {
      router.push('/admin/users')
    } else {
      router.push('/user/dashboard')
    }

    // Handle login logic here
    // console.log(loginData);
    // const response = await fetch("http://localhost:3000/accounts/test");
    // const result = await response.json();

    // console.log(result);
    // toast.success('Success',{
    //     description:"Registration successful, please check your email for verification instructions.",
    // });
  } catch (error) {
    isSubmitting.value = false
  }
  finally {
    isSubmitting.value = false
  }
}

const toggleTheme = () => {
  mode.value = mode.value === 'dark' ? 'light' : 'dark'
}
</script>

<template>
  <div class="w-screen h-screen bg-background flex justify-center font-sans">
    <div class="w-1/2 bg-[url('/src/assets/Login.png')] bg-cover flex flex-col items-center">
      <div class="w-3/4 h-3/5 flex flex-col justify-center gap-3">
        <p class="text-2xl font-regular text-[#181818]">Welcome to</p>
        <p class="text-8xl font-extrabold text-primary">EduManage</p>
        <p class="text-[#181818]">The best way to manage your education.</p>
      </div>
    </div>
    <div class="w-1/2 h-full flex justify-center items-center">
      <div class="w-3/5 h-4/5 flex flex-col justify-center items-center gap-6">
        <p class="text-6xl font-extrabold">Login</p>
        <p>Please enter your credentials to access your account.</p>
        <Input v-model="loginData.email" type="email" placeholder="Email" class="h-15" />
        <Input v-model="loginData.password" type="password" placeholder="Password" class="h-15" />

        <div class="w-full text-right italic">
          <RouterLink class="hover:underline hover:text-primary transition-all duration-200" to="/forgot-password">
            Forgot your password?</RouterLink>
        </div>
        <Button @click="handleLogin" :disabled="isSubmitting"
          class="w-full cursor-pointer h-15 text-md font-bold text-foreground">{{ isSubmitting ? 'Logging in...' :
          'Login' }}</Button>
        <p>
          Don't have an account?
          <RouterLink to="/register" class="text-primary hover:underline">Register</RouterLink>
        </p>
        <div class="absolute bottom-10 gap-4 flex items-center text-lg">
          <p>Change To {{ mode === 'dark' ? 'Light' : 'Dark' }} Mode</p>
          <Switch :model-value="mode === 'light'" @click="toggleTheme"
            class="data-[state=checked]:bg-foreground border-1 border-foreground ">
            <template #thumb>
              <Sun v-if="mode === 'light'" class="size-4 text-foreground " />
              <Moon v-else class="size-4 text-background" />
            </template>
          </Switch>
        </div>
      </div>
    </div>
  </div>
</template>
