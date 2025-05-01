<script setup lang="ts">
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import {Dialog,
  DialogContent,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,} from '@/components/ui/dialog'
import {ArrowLeft} from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import { ref } from 'vue'
import type { Toast, ToastWithAction } from '@/models/toast'
import { useToastService } from '@/_services/toast.service'
import { useAccountService } from '@/_services/account.service'
const toast = useToastService()

const { forgotPassword } = useAccountService()

const email = ref('')

const handleSubmit = async()=>{
    if(!email.value){
        const toastOptions: Toast = {
      title: 'Reset Failed',
      description: 'Please enter your email.',
      type: 'error',
    }
    toast.error(toastOptions)
    return
    }
    const response = await forgotPassword(email.value)
    const toastOptions: Toast = {
      title: 'Reset Success',
      description: response.message,
      type: 'success',
    }
    toast.success(toastOptions)

}

</script>

<template>
    <div class="w-screen h-screen bg-[#15161E] flex flex-col  items-center font-sans">
        <div class="w-24/25 h-1/10 flex items-center">
            <ArrowLeft color="white" :size="32" @click="$router.back()" class="cursor-pointer"/>
        </div>
        <div class="w-full h-4/5 flex flex-col justify-center items-center">

            <div class="w-2/7 h-3/5 p-10  rounded-2xl  text-[#E4E5E7] flex flex-col justify-center items-center gap-10">
                <p class="text-4xl font-extrabold">Reset Password</p>
                <p class="text-md">Enter your email to reset your password</p>
                <Input v-model="email" type="email" placeholder="Email" class="h-15"/>
                <Button @click="handleSubmit" class="w-full h-15 font-bold text-md text-foreground">Sumit</Button>
                <!-- <Dialog class="w-full bg-[#1A33C1] hover:bg-[#1A33C1]/90 cursor-pointer h-15 text-md font-bold">
                    <DialogTrigger class="w-full bg-[#1A33C1] hover:bg-[#1A33C1]/90 cursor-pointer h-15 text-md font-bold rounded-md">
                        Submit
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle></DialogTitle>
                            <DialogDescription>
                            </DialogDescription>
                        </DialogHeader>
                        Check your email for a link to reset your password.
                        
                        <DialogFooter>
                            <DialogClose>
                                <RouterLink type="button" variant="secondary" class="cursor-pointer" to="/login">
                                    Okay
                                </RouterLink>
                            </DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog> -->
            </div>
        </div>
    </div>
</template>