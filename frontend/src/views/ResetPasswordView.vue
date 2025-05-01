<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useAccountService } from '@/_services/account.service'
import { useToastService } from '@/_services/toast.service'
import { type Toast } from '@/models/toast'
import { onMounted, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
const route = useRoute()
const router = useRouter()
const token = route.query.token;
const toast = useToastService()

const { resetPassword } = useAccountService()

const password = ref('')
const confirmPassword = ref('')


const handleSubmit = async()=>{
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
    const toastOptions: Toast = {
      title: 'Reset Success',
      description: response.message,
      type: 'success',
    }
    toast.success(toastOptions)
    router.push('/login')
}

</script>

<template>
    <div class="w-screen h-screen bg-[#15161E] flex flex-col  items-center font-sans">
        <div class="w-24/25 h-1/10 flex items-center">
            <ArrowLeft color="white" :size="32" @click="$router.back()" class="cursor-pointer"/>
        </div>
        <div class="w-full h-4/5 flex flex-col justify-center items-center">

            <div class="w-2/7  p-10  rounded-2xl  text-[#E4E5E7] flex flex-col justify-center items-center gap-10">
                <p class="text-4xl font-extrabold">Reset Password</p>
                <p class="text-md">Enter your new password</p>
                <Input v-model="password" type="password" placeholder="New Password" class="h-15"/>
                <Input v-model="confirmPassword" type="password" placeholder="Confirm Password" class="h-15"/>
                <Button @click="handleSubmit" class="w-full h-15 font-bold text-md text-foreground">Sumit</Button>
                
            </div>
        </div>
    </div>
</template>