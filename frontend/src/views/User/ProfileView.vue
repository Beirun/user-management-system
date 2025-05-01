<script setup lang="ts">
import NavbarView from '@/views/User/NavbarView.vue';

import {Dialog,
  DialogContent,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,} from '@/components/ui/dialog'
  import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Button from '@/components/ui/button/Button.vue';
import { useToastService } from '@/_services/toast.service'
import { type Toast } from '@/models/toast'
import { onBeforeMount, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAccountStore } from '@/stores/account'
const router = useRouter()
const accountStore = useAccountStore();
const account = accountStore.getAccount();
const currentAccount = reactive({
    id: account?.id,
    role: account?.role,
    title: account?.title,
    firstName: account?.firstName,
    lastName: account?.lastName,
    email: account?.email,
    password: "",
    confirmPassword:"",
})
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
        <div class="w-full h-full flex flex-col  items-center gap-10 mt-10">
            <div class="w-80 h-80 rounded-full bg-[url('/src/assets/profile.jpg')] bg-cover"></div>
            <div class="w-1/4 flex flex-col gap-5 justify-between">
                <div class="w-full flex ">
                    <p class="w-1/3">Name:</p>
                    <p> {{ currentAccount.title }}. {{ currentAccount.firstName }} {{ currentAccount.lastName }}</p>
                </div>
                <div class="w-full flex ">
                    <p class="w-1/3">Email:</p>
                    <p>{{ currentAccount.email }}</p>

                </div>
                <Dialog>
                    <DialogTrigger>
                        <Button class="w-full bg-[#1A33C1] hover:bg-[#1A33C1]/90 cursor-pointer h-15 text-md font-bold">Edit Profile</Button>
                    </DialogTrigger>
                    <DialogContent class="sm:max-w-[425px]">
                        <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                        <DialogDescription>
                            Make changes to the your details.
                        </DialogDescription>
                        </DialogHeader>
                        <div class="w-full flex flex-col gap-4">
                            <Select v-model="currentAccount.title">
                                <SelectTrigger class="w-full bg-[#F5F5F5] py-6 text-black border-b-2 border-[#666E99]">
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
                            <Input v-model="currentAccount.firstName" type="text" placeholder="Firstname" class="h-15 bg-[#F5F5F5] text-black border-b-2 border-[#666E99]"/>
                            <Input v-model="currentAccount.lastName" type="text" placeholder="Lastname" class="h-15 bg-[#F5F5F5] text-black border-b-2 border-[#666E99]"/>
                            <Input v-model="currentAccount.email" type="email" placeholder="Email" class="h-15 bg-[#F5F5F5] text-black border-b-2 border-[#666E99]"/>
                            <Input v-model="currentAccount.password" type="password" placeholder="Password" class="h-15 bg-[#F5F5F5] text-black border-b-2 border-[#666E99]"/>
                            <Input v-model="currentAccount.confirmPassword" type="password" placeholder="Confirm Password" class="h-15 bg-[#F5F5F5] text-black border-b-2 border-[#666E99]"/>

                        </div>
                        <DialogFooter>
                        <DialogClose class="bg-[#1A33C1] hover:bg-[#1A33C1]/90 cursor-pointer h-15 w-full text-md font-bold rounded-lg text-white">Save</DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    </div>
</template>