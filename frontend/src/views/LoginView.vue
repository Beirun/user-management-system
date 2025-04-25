<script setup lang="ts">
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-vue-next';
import { RouterLink } from 'vue-router'


</script>

<template>
    <div class="w-screen h-screen bg-[#15161E] flex justify-center font-sans">
        <div class="w-1/2 bg-[url('/src/assets/Login.png')] bg-cover flex flex-col items-center">
            <div class="w-3/4 h-3/5 flex flex-col justify-center gap-3">

                <p class="text-2xl font-regular">Welcome to</p>
                <p class="text-8xl font-extrabold text-[#1A33C1]">EduManage</p>
                <p>The best way to manage your education.</p>
            </div>
        </div>
        <div class="w-1/2 h-full flex justify-center items-center text-[#E4E5E7]">
            <div class="w-3/5 h-4/5 flex flex-col justify-center items-center gap-6">
                <p class="text-6xl font-extrabold">Login</p>
                <p>Please enter your credentials to access your account.</p>
                <Input type="text" placeholder="Username" class="h-15 bg-[#F5F5F5] border-b-2 border-[#666E99] text-black"/>
                <Input type="password" placeholder="Password" class="h-15 bg-[#F5F5F5] border-b-2 border-[#666E99] text-black">
                    <template #suffix>

                        <Eye color="black" :size="20"/>
                    </template>
                </Input>
                <div class="w-full text-right italic">
                    <RouterLink to="/forgot-password">Forgot your password?</RouterLink>
                </div>
                <Button class="w-full bg-[#1A33C1] hover:bg-[#1A33C1]/90 cursor-pointer h-15 text-md font-bold">Login</Button>
                <p>Don't have an account? <RouterLink to="/register" class="text-[#1A33C1]">Register</RouterLink></p>
            </div>
        </div>
    </div>
</template>