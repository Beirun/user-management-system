<script setup lang="ts">
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,} from '@/components/ui/table'
  
  import { useToastService } from '@/_services/toast.service'
import { type Toast } from '@/models/toast'
import { onBeforeMount } from 'vue'
import { useRouter } from 'vue-router'
import { useAccountStore } from '@/stores/account'
const router = useRouter()
const accountStore = useAccountStore();

onBeforeMount(async() => {
    const account = accountStore.getAccount();
    console.log("account", account!.role);
    if (!account?.role) {
        console.log("account1", account);
        const toastOptions: Toast = {
            title: "Unauthorized",
            description: "You are not authorized to access this page.",
            type: "error",
        }
        useToastService().error(toastOptions);
        router.push("/login");
    }
    if (account!.role === "User") {
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
  <div class="w-screen h-screen bg-[#15161E] flex flex-col font-sans text-white gap-5">
    <NavbarView></NavbarView>
    <div class="w-full h-full flex justify-center">
      <div class="w-3/4 flex flex-col gap-3">
        <p class="text-4xl font-extrabold mb-5">Admin User List View</p>

        <Table>
          <TableCaption> </TableCaption>
          <TableHeader>
            <TableRow class="hover:bg-transparent">
              <TableHead class="w-2/5"> Name </TableHead>
              <TableHead> Email </TableHead>
              <TableHead class="w-1/5"> Status </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow class="hover:text-black">
              <TableCell> Title Firstname Lastname </TableCell>
              <TableCell> Email here </TableCell>
              <TableCell class="w-1/5"> Status here </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  </div>
</template>
