<script setup lang="ts">
import {Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,} from '@/components/ui/table'
  
import {Dialog,
  DialogContent,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,} from '@/components/ui/dialog'

  import { Pencil, Trash2 } from 'lucide-vue-next'
</script>

<template>  
    <div class="w-screen h-screen bg-[#15161E] flex justify-center  font-sans text-white">
        <div class="w-1/2 h-1/2 flex flex-col justify-center items-center gap-3">
            <p>Admin User List View</p>
            <Table>
                <TableCaption>
                </TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead>
                            Name
                        </TableHead>
                        <TableHead>
                            Email
                        </TableHead>
                        <TableHead class="w-1/8">
                            Action
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    
                    <TableRow>
                        <TableCell>
                            Name here
                        </TableCell>
                        <TableCell>
                            Email here
                        </TableCell>
                        <TableCell class="flex gap-5">
                            <!-- <Pencil color="blue" class="cursor-pointer"/> -->
                            <Dialog>
                                <DialogTrigger>
                                    <Pencil color="blue" class="cursor-pointer"/>
                                </DialogTrigger>
                                <DialogContent class="sm:max-w-[425px]">
                                    <DialogHeader>
                                    <DialogTitle>Edit User</DialogTitle>
                                    <DialogDescription>
                                        Make changes to the user's details.
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
                                    </div>
                                    <DialogFooter>
                                    <DialogClose class="bg-[#1A33C1] hover:bg-[#1A33C1]/90 cursor-pointer h-15 w-full text-md font-bold rounded-lg text-white">Save</DialogClose>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                            <Trash2 color="red" class="cursor-pointer"/>
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>
    </div>

</template>