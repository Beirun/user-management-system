<script setup lang="ts">
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button';
import { RouterLink } from 'vue-router'
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


</script>

<template>
    <div class="w-screen h-screen bg-[#15161E] flex justify-center items-center font-sans">
        <div class="w-2/5 h-7/8  rounded-xl">
            <div class="w-full h-full flex justify-center items-center text-[#E4E5E7] -mt-8">
                <div class="w-3/5 h-4/5 flex flex-col gap-6 ">
                    <div class="flex flex-col justify-center items-center gap-8">
                        <p class="text-5xl font-extrabold">Create an account</p>
                        <div class="w-full flex flex-col gap-4">
                            <Select>
                                <SelectTrigger class="w-full bg-[#F5F5F5] py-6 text-black border-b-2 border-[#666E99]">
                                <SelectValue placeholder="Title" />
                                </SelectTrigger>
                                <SelectContent>
                                <SelectGroup>
                                    <SelectItem value="Mr">
                                    Mr.
                                    </SelectItem>
                                    <SelectItem value="Mrs">
                                    Mrs.
                                    </SelectItem>
                                </SelectGroup>
                                </SelectContent>
                            </Select>
                            <Input type="text" placeholder="Username" class="h-15 bg-[#F5F5F5] text-black border-b-2 border-[#666E99]"/>
                            <Input type="text" placeholder="Lastname" class="h-15 bg-[#F5F5F5] text-black border-b-2 border-[#666E99]"/>
                            <Input type="email" placeholder="Email" class="h-15 bg-[#F5F5F5] text-black border-b-2 border-[#666E99]"/>
                            <Input type="password" placeholder="Password" class="h-15 bg-[#F5F5F5] text-black border-b-2 border-[#666E99]"/>
                            <Input type="password" placeholder="Confirm Password" class="h-15 bg-[#F5F5F5] text-black border-b-2 border-[#666E99]"/>
                        </div>
                    </div>
                    <div class="flex text-right space-x-2">
                        <Checkbox id="terms" />
                        <Label for="terms">Accept terms and conditions</Label>
                    </div>
                    <Button class="w-full bg-[#1A33C1] hover:bg-[#1A33C1]/90 cursor-pointer h-15 text-md font-bold">Register</Button>
                    <div class="mt-3 self-center">
                        <p>Already have an account?<RouterLink to="/login" class="text-[#1A33C1]"> Login</RouterLink></p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>