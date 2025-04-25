<script setup lang="ts">
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import {Dialog,
  DialogContent,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,} from '@/components/ui/dialog'
import {ArrowLeft} from 'lucide-vue-next'

</script>

<template>
    <div class="w-screen h-screen bg-[#15161E] flex flex-col  items-center font-sans">
        <div class="w-24/25 h-1/10 flex items-center">
            <ArrowLeft color="white" :size="32" @click="$router.back()" class="cursor-pointer"/>
        </div>
        <div class="w-full h-4/5 flex flex-col justify-center items-center">

            <div class="w-2/7 h-3/5 p-10  rounded-2xl  text-[#E4E5E7] flex flex-col justify-center items-center gap-10">
                <p class="text-4xl font-extrabold">Reset Password</p>
                <p class="text-md">Enter your email to reset your password</p>
                <Input type="email" placeholder="Email" class="h-15 bg-[#F5F5F5] border-b-2 border-[#666E99]  text-black"/>
                <Dialog class="w-full bg-[#1A33C1] hover:bg-[#1A33C1]/90 cursor-pointer h-15 text-md font-bold">
                    <DialogTrigger class="w-full bg-[#1A33C1] hover:bg-[#1A33C1]/90 cursor-pointer h-15 text-md font-bold rounded-md">
                        Submit
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle></DialogTitle>
                            <DialogDescription>
                                Check your email for a link to reset your password.
                            </DialogDescription>
                        </DialogHeader>
                        
                        <DialogFooter>
                            <DialogClose>
                                <Button type="button" variant="secondary" class="cursor-pointer">
                                    Close
                                </Button>
                            </DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    </div>
</template>