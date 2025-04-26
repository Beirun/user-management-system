<script lang="ts" setup>
import { RouterLink } from 'vue-router';
import { useAccountService } from '@/_services/account.service'
import { useToastService } from '@/_services/toast.service'
import { type Toast } from '@/models/toast'

const { logout } = useAccountService()
const toast = useToastService()

const handleLogout = async () => {
    try {
        await logout();
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
        <RouterLink to="/user/dashboard">EduManage</RouterLink>
        <div class="flex flex-row h-full justify-center gap-5 items">
            <RouterLink to="/user/profile" class="h-10 px-5 flex flex-col justify-center cursor-pointer hover:underline">Profile</RouterLink>
            <button @click="handleLogout" class=" bg-red-400 h-10 px-5 rounded cursor-pointer hover:bg-red-500 transition-colors duration-300 flex flex-col justify-center">Logout</button>
        </div>
    </div>
</template>