<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useAccountService } from '@/_services/account.service'
import { useToastService } from '@/_services/toast.service'
import { type Toast, type ToastWithAction } from '@/models/toast'
import { onMounted, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Sun, Moon, LogOut, User, ArrowLeft } from 'lucide-vue-next'
import { useColorMode } from '@vueuse/core'
import { RefreshCw } from 'lucide-vue-next'
const isSubmitting = ref(false)
const mode = useColorMode({ disableTransition: false })
const route = useRoute()
const router = useRouter()
const token = route.query.token;
const toast = useToastService()

const { resetPassword } = useAccountService()
const toggleTheme = () => {
  mode.value = mode.value === 'dark' ? 'light' : 'dark'
}
const password = ref('')
const confirmPassword = ref('')


const handleSubmit = async() => {
    isSubmitting.value = true
    try {
        if(!password.value || !confirmPassword.value){
            const toastOptions: Toast = {
                title: 'Reset Failed',
                description: 'Please fill in all fields.',
                type: 'error',
            }
            toast.error(toastOptions)
            return
        }
        if(password.value !== confirmPassword.value){
            const toastOptions: Toast = {
                title: 'Reset Failed',
                description: 'Passwords do not match.',
                type: 'error',
            }
            toast.error(toastOptions)
            return
        }
        const response = await resetPassword(token as string, password.value, confirmPassword.value)
        if(response){
            const toastOptions: Toast = {
                title: 'Reset Success',
                description: response.message,
                type: 'success',
                }     
            toast.success(toastOptions)
            router.push('/login')
        }
    } catch (error) {
        console.error(error)
    } finally {
        isSubmitting.value = false
    }
}
</script>

<template>
    <div class="w-screen h-screen flex flex-col  items-center font-sans">
        <div class="w-24/25 h-1/10 flex items-center">
            <ArrowLeft :color="mode !== 'dark' ? 'black': 'white'" :size="32" @click="$router.back()" class="cursor-pointer" />
        </div>
        <div class="w-full h-4/5 flex flex-col justify-center items-center">
            <div class="w-2/7  p-10  rounded-2xl   flex flex-col justify-center items-center gap-10">
                <p class="text-4xl font-extrabold">Reset Password</p>
                <p class="text-md">Enter your new password</p>
                <Input v-model="password" type="password" placeholder="New Password" class="h-15"/>
                <Input v-model="confirmPassword" type="password" placeholder="Confirm Password" class="h-15"/>
                <Button 
                    @click="handleSubmit" 
                    class="w-full h-15 font-bold text-md text-foreground"
                    :disabled="isSubmitting"
                >
                <RefreshCw v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />
                    {{ isSubmitting ? 'Submitting...' : 'Submit' }}
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