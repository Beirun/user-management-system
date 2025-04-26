<script setup lang="ts">
import NavbarView from '@/views/User/NavbarView.vue';
import { useAccountService } from '@/_services/account.service'
import { useToastService } from '@/_services/toast.service'
import { type Toast } from '@/models/toast'
import { onBeforeMount } from 'vue'
import { useRouter } from 'vue-router'
import { useAccountStore } from '@/stores/account'
const router = useRouter()
const accountStore = useAccountStore();

onBeforeMount(async() => {
    const account = accountStore.getAccount();
    if (!account) {
        const toastOptions: Toast = {
            title: "Unauthorized",
            description: "You are not authorized to access this page.",
            type: "error",
        }
        useToastService().error(toastOptions);
        router.push("/login");
    }
    if (account!.role !== "User") {
        const toastOptions: Toast = {
            title: "Unauthorized",
            description: "You are not authorized to access this page.",
            type: "error",
        }
        useToastService().error(toastOptions);
        router.push("/login");
    }
})
</script>

<template>
    <div class="w-screen h-screen bg-[#15161E] flex flex-col font-sans text-white">
        <NavbarView></NavbarView>
        <div class="w-full h-full flex flex-col justify-center items-center gap-3">
            <p class="text-2xl font-regular">Welcome to</p>
            <p class="text-8xl font-extrabold text-[#1A33C1]">EduManage</p>
            <p>The best way to manage your education.</p>
            <p class="italic font-bold">You have successfully logged in!</p>
        </div>
    </div>
</template>