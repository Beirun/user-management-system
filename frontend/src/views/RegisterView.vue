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
import type { Account } from '@/models/account';
import type { Toast } from '@/models/toast';
import { useAccountService } from '@/_services/account.service';
import { useToastService } from '@/_services/toast.service';
import { mustMatch} from '@/_helpers/must-match.validator';

const router = useRouter();
const isRegistering = ref(false);
const {register} = useAccountService();
const toast = useToastService();
const newAccount = reactive({
    // id: "", // Add a default or generated ID
    role: "user", // Set a default role, e.g., "user"
    title: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword:"",
    acceptTerms: false
})

const handleSubmit = async () => {
    isRegistering.value = true;
    if(newAccount.password !== newAccount.confirmPassword) {
        const toastOptions : Toast = {
            title: "Password Mismatch",
            description: "Passwords do not match.",
            type: "error",
        }
        toast.error(toastOptions);
        isRegistering.value = false;    
        return;
    }
    if(!newAccount.firstName || !newAccount.lastName || !newAccount.email || !newAccount.password || !newAccount.confirmPassword) {
        const toastOptions : Toast = {
            title: "Registration Failed",
            description: "Please fill in all fields.",
            type: "error",
        }
        toast.error(toastOptions);
        isRegistering.value = false;    
        return;
    }

    if(newAccount.password.length < 6) {
        const toastOptions : Toast = {
            title: "Password Too Short",
            description: "Password must be at least 6 characters long.",
            type: "error",
        }
        toast.error(toastOptions);
        isRegistering.value = false;
        return;
    }

    // Handle form submission
    if (!newAccount.acceptTerms) {
        const toastOptions : Toast = {
            title: "Terms and Conditions",
            description: "You must accept the terms and conditions to register.",
            type: "error",
        }
        toast.error(toastOptions);
        isRegistering.value = false;    
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
        isRegistering.value = false;
        router.push("/login");       

    } catch (error) {
        console.error("Registration failed", error);
    }
}

</script>

<template>
    <div class="w-screen h-screen  flex justify-center items-center font-sans">
        <div class="w-2/5 h-7/8  rounded-xl">
            <div class="w-full h-full flex justify-center items-center  -mt-8">
                <div class="w-3/5 h-4/5 flex flex-col gap-6 ">
                    <div class="flex flex-col justify-center items-center gap-8">
                        <p class="text-5xl font-extrabold">Create an account</p>
                        <div class="w-full flex flex-col gap-4">
                            <Select v-model="newAccount.title">
                                <SelectTrigger class="w-full py-6  border-b-2 ">
                                <SelectValue placeholder="Title" />
                                </SelectTrigger>
                                <SelectContent>
                                <SelectGroup>
                                    <SelectItem value="Mr">
                                    Mr
                                    </SelectItem>
                                    <SelectItem value="Mrs">
                                    Mrs
                                    </SelectItem>
                                    <SelectItem value="Ms">
                                    Ms
                                    </SelectItem>
                                </SelectGroup>
                                </SelectContent>
                            </Select>
                            <Input v-model="newAccount.firstName" type="text" placeholder="Firstname" class="h-15 "/>
                            <Input v-model="newAccount.lastName" type="text" placeholder="Lastname" class="h-15"/>
                            <Input v-model="newAccount.email" type="email" placeholder="Email" class="h-15 "/>
                            <Input v-model="newAccount.password" type="password" placeholder="Password" class="h-15 "/>
                            <Input v-model="newAccount.confirmPassword" type="password" placeholder="Confirm Password" class="h-15"/>
                        </div>
                    </div>
                    <div class="flex text-right space-x-2">
                        <Checkbox v-model="newAccount.acceptTerms" id="terms" />
                        <Label for="terms">Accept terms and conditions</Label>
                    </div>
                    <Button @click="handleSubmit" :class="{'cursor-progress': isRegistering, 'bg-gray-400': isRegistering}" class="w-full text-foreground cursor-pointer h-15 text-md font-bold" :disabled="isRegistering">{{ isRegistering ? 'Registering...' : 'Register' }}</Button>
                    <div class="mt-3 self-center">
                        <p>Already have an account?<RouterLink to="/login" class="text-[#1A33C1]"> Login</RouterLink></p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>