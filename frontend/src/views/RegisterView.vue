<script setup lang="ts">
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button';
import { RouterLink } from 'vue-router'
import { useRouter } from 'vue-router'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { reactive, ref } from 'vue';
import { Eye, EyeOff } from 'lucide-vue-next'
import { useAccountService } from '@/_services/account.service';
import { useToastService } from '@/_services/toast.service';
import type { Toast } from '@/models/toast';

const router = useRouter();
const {register} = useAccountService();
const toast = useToastService();
const showPassword = ref(false);
const showConfirmPassword = ref(false);

const newAccount = reactive({
    role: "user",
    title: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword:"",
    acceptTerms: false
})

const handleSubmit = async () => {
    if (!newAccount.acceptTerms) {
        const toastOptions : Toast = {
            title: "Terms and Conditions",
            description: "You must accept the terms and conditions to register.",
            type: "error",
        }
        toast.error(toastOptions);
        return;
    }

    if (newAccount.password !== newAccount.confirmPassword) {
        const toastOptions : Toast = {
            title: "Password Mismatch",
            description: "Passwords do not match.",
            type: "error",
        }
        toast.error(toastOptions);
        return;
    }
    
    try {
        const response = await register(newAccount);
        const toastOptions : Toast = {
            title: "Registration Successful",
            description: response.message,
            type: "success",
        }
        toast.success(toastOptions);
        router.push("/login");       

    } catch (error:any) {
        const toastOptions : Toast = {
            title: "Registration Failed",
            description: error.message || "Registration failed. Please try again.",
            type: "error",
        }
        toast.error(toastOptions);
    }
}
</script>

<template>
    <div class="w-screen h-screen bg-[#15161E] flex justify-center font-sans">
        <div class="w-1/2 bg-[url('/src/assets/Login.png')] bg-cover flex flex-col items-center">
            <div class="w-3/4 h-3/5 flex flex-col justify-center gap-3">
                <p class="text-2xl font-regular text-black">Welcome to</p>
                <p class="text-8xl font-extrabold text-[#1A33C1]">EduManage</p>
                <p class="text-black">The best way to manage your education.</p>
            </div>
        </div>
        <div class="w-1/2 h-full flex justify-center items-center text-[#E4E5E7]">
            <div class="w-3/5 h-4/5 flex flex-col justify-center items-center gap-6">
                <p class="text-6xl font-extrabold">Create Account</p>
                <p>Enter your information to get started.</p>
                
                <div class="w-full space-y-4">
                    <Select v-model="newAccount.title">
                        <SelectTrigger class="w-full h-15 bg-[#F5F5F5] text-black border-b-2 border-[#666E99]">
                            <SelectValue placeholder="Title" />
                        </SelectTrigger>
                        <SelectContent class="bg-[#F5F5F5]">
                            <SelectGroup>
                                <SelectItem value="Mr" class="hover:bg-[#1A33C1]/10">
                                    Mr
                                </SelectItem>
                                <SelectItem value="Mrs" class="hover:bg-[#1A33C1]/10">
                                    Mrs
                                </SelectItem>
                                <SelectItem value="Ms" class="hover:bg-[#1A33C1]/10">
                                    Ms
                                </SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    
                    <Input v-model="newAccount.firstName" type="text" placeholder="Firstname" class="h-15 bg-[#F5F5F5] text-black border-b-2 border-[#666E99]"/>
                    <Input v-model="newAccount.lastName" type="text" placeholder="Lastname" class="h-15 bg-[#F5F5F5] text-black border-b-2 border-[#666E99]"/>
                    <Input v-model="newAccount.email" type="email" placeholder="Email" class="h-15 bg-[#F5F5F5] text-black border-b-2 border-[#666E99]"/>
                    
                    <div class="relative">
                        <Input 
                            v-model="newAccount.password" 
                            :type="showPassword ? 'text' : 'password'" 
                            placeholder="Password" 
                            class="h-15 bg-[#F5F5F5] text-black border-b-2 border-[#666E99]"
                        />
                        <button 
                            class="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#666E99]"
                            @click="showPassword = !showPassword"
                        >
                            <Eye v-if="!showPassword" class="h-5 w-5" />
                            <EyeOff v-else class="h-5 w-5" />
                        </button>
                    </div>
                    
                    <div class="relative">
                        <Input 
                            v-model="newAccount.confirmPassword" 
                            :type="showConfirmPassword ? 'text' : 'password'" 
                            placeholder="Confirm Password" 
                            class="h-15 bg-[#F5F5F5] text-black border-b-2 border-[#666E99]"
                        />
                        <button 
                            class="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#666E99]"
                            @click="showConfirmPassword = !showConfirmPassword"
                        >
                            <Eye v-if="!showConfirmPassword" class="h-5 w-5" />
                            <EyeOff v-else class="h-5 w-5" />
                        </button>
                    </div>
                </div>
                
                <div class="flex items-center space-x-2 w-full">
                    <Checkbox 
                        id="terms" 
                        v-model="newAccount.acceptTerms" 
                        class="border-[#666E99] data-[state=checked]:bg-[#1A33C1]"
                    />
                    <Label for="terms" class="text-sm">Accept terms and conditions</Label>
                </div>
                
                <Button 
                    @click="handleSubmit" 
                    class="w-full bg-[#1A33C1] hover:bg-[#1A33C1]/90 cursor-pointer h-15 text-md font-bold"
                >
                    Register
                </Button>
                
                <p>Already have an account? <RouterLink to="/login" class="text-[#1A33C1]">Login</RouterLink></p>
            </div>
        </div>
    </div>
</template>