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
    <div class="w-screen h-screen bg-[#15161E] flex justify-center items-center font-sans text-white">
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
                        
                    </TableRow>
                </TableHeader>
            </Table>
        </div>
    </div>

</template>