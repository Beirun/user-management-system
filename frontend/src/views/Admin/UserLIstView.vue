<script setup lang="ts">
import {Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,} from '@/components/ui/table'
  

</script>

<template>  
    <div class="w-screen h-screen bg-[#15161E] flex justify-center font-sans text-white">
        <div class="w-1/2 h-1/2 flex flex-col justify-center items-center gap-3">
            <p class="text-4xl font-extrabold mb-5">Admin User List View</p>
            <Table>
                <TableCaption>
                </TableCaption>
                <TableHeader>
                    <TableRow class="hover:bg-transparent">
                        <TableHead class="w-2/5">
                            Name
                        </TableHead>
                        <TableHead>
                            Email
                        </TableHead>
                        <TableHead class="w-1/5" >
                            Status
                        </TableHead>

                    </TableRow>
                </TableHeader>
                <TableBody>
                    
                    <TableRow class="hover:text-black">
                        <TableCell>
                            Title Firstname Lastname
                        </TableCell>
                        <TableCell>
                            Email here
                        </TableCell>
                        <TableCell class="w-1/5">
                            Status here
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>
    </div>

</template>