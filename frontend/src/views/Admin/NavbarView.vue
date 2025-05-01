<script lang="ts" setup>
import { useAccountService } from '@/_services/account.service'
import { useToastService } from '@/_services/toast.service'
import { type Toast } from '@/models/toast'
import { useAccountStore } from '@/stores/account'
import { useRouter } from 'vue-router'
const router = useRouter()
const accountStore = useAccountStore();
const { logout } = useAccountService()
const toast = useToastService()


const handleLogout = async () => {
    try {
        await logout();
        accountStore.logout();
        router.push("/login");
        const toastOptions: Toast = {
            title: "Logout",
            description: "Logout successful",
            type: "success",
        }
        toast.success(toastOptions);
    } catch (error) {
        const toastOptions: Toast = {
            title: "Logout",
            description: (error as Error).message,
            type: "error",
        }
        toast.error(toastOptions);
    }
}

</script>

<template>
    <div class="w-full h-20 bg-[#1A33C1] top-0 flex justify-between items-center p-5">
        <p>EduManage</p>
        <div class="flex flex-row h-full justify-center gap-5 items">
            <button @click="handleLogout" class=" bg-red-400 h-10 px-5 rounded cursor-pointer hover:bg-red-500 transition-colors duration-300 flex flex-col justify-center">Logout</button>
        </div>
    </div>
</template>