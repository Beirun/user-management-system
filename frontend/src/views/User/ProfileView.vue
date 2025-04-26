<script setup lang="ts">
import NavbarView from '@/views/User/NavbarView.vue';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import {Dialog,
  DialogContent,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,} from '@/components/ui/dialog'
import Button from '@/components/ui/button/Button.vue';
import { ref } from 'vue';

</script>

<template>
    <div class="w-screen h-screen bg-[#15161E] flex flex-col font-sans text-white">
        <NavbarView></NavbarView>
        <div class="w-full h-full flex flex-col  items-center gap-10 mt-10">
            <div class="w-80 h-80 rounded-full bg-[url('/src/assets/profile.jpg')] bg-cover"></div>
            <div class="w-1/4 flex flex-col gap-5 justify-between">
                <div class="w-full flex ">
                    <p class="w-1/3">Name:</p>
                    <p>Mr. Bernard Jay Orillo</p>
                </div>
                <div class="w-full flex ">
                    <p class="w-1/3">Email:</p>
                    <p>orillobernardjay@gmail.com</p>
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
                        <div class="grid gap-4 py-4">
                            <div class="grid grid-cols-4 items-center gap-4">
                                <label for="title" class="text-right">Title</label>
                                <input id="title" type="text" class="col-span-3 h-10 border mt-1 rounded px-3 py-2 bg-[#F5F5F5] border-[#666E99] text-black" />
                            </div>
                            <div class="grid grid-cols-4 items-center gap-4">
                                <label for="firstname" class="text-right">Firstname</label>
                                <input id="firstname" type="text" class="col-span-3 h-10 border mt-1 rounded px-3 py-2 bg-[#F5F5F5] border-[#666E99] text-black" />
                            </div>
                            <div class="grid grid-cols-4 items-center gap-4">
                                <label for="lastname" class="text-right">Lastname</label>
                                <input id="lastname" type="text" class="col-span-3 h-10 border mt-1 rounded px-3 py-2 bg-[#F5F5F5] border-[#666E99] text-black" />
                            </div>
                            <div class="grid grid-cols-4 items-center gap-4">
                                <label for="email" class="text-right">Email</label>
                                <input id="email" type="email" class="col-span-3 h-10 border mt-1 rounded px-3 py-2 bg-[#F5F5F5] border-[#666E99] text-black" />
                            </div>
                            <div class="grid grid-cols-4 items-center gap-4">
                                <label for="password" class="text-right">Password</label>
                                <input id="password" type="password" class="col-span-3 h-10 border mt-1 rounded px-3 py-2 bg-[#F5F5F5] border-[#666E99] text-black" />
                            </div>
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