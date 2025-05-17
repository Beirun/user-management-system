<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useAccountService } from '@/_services/account.service'
import { useToastService } from '@/_services/toast.service'
import { type Toast } from '@/models/toast'
import { onMounted } from 'vue'
const route = useRoute()
const router = useRouter()
const token = route.query.token;
const { verifyEmail } = useAccountService()
const toast = useToastService()
const verifyEmailToken = async () => {
    try {
        const response = await verifyEmail(token as string)
        console.log("response", response)
        const toastOptions : Toast = {
            title: "Email Verification",
            description: response.message,
            type: "success",
        }
        toast.success(toastOptions)
        router.push("/login")
    } catch (error) {
        const toastOptions : Toast = {
            title: "Email Verification",
            description: (error as Error).message,
            type: "error",
        }
        toast.error(toastOptions)
    }

}

onMounted(async() => {
    await verifyEmailToken()
})

</script>

<template>
    <div>
        
    </div>

</template>