<script setup lang="ts">
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MoreHorizontal, Search } from 'lucide-vue-next'
import NavbarView from '@/views/Admin/NavbarView.vue'
import { ref } from 'vue'

// Sample data - replace with your actual data
const users = ref([
  {
    id: 1,
    title: 'Mr',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    status: 'Active',
    role: 'Admin'
  },
  {
    id: 2,
    title: 'Ms',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    status: 'Inactive',
    role: 'User'
  },
  {
    id: 3,
    title: 'Mrs',
    firstName: 'Alice',
    lastName: 'Johnson',
    email: 'alice.j@example.com',
    status: 'Pending',
    role: 'User'
  }
])

const searchQuery = ref('')
const isDialogOpen = ref(false)

// Form data for new user
const newUser = ref({
  title: '',
  firstName: '',
  lastName: '',
  email: '',
  status: 'Active',
  role: 'User'
})

// Title options
const titleOptions = ['Mr', 'Mrs', 'Ms', 'Dr', 'Prof']

// Add new user function
const addUser = () => {
  const id = users.value.length > 0 
    ? Math.max(...users.value.map(user => user.id)) + 1 
    : 1
  
  users.value.push({
    id,
    ...newUser.value
  })
  
  // Reset form
  newUser.value = {
    title: '',
    firstName: '',
    lastName: '',
    email: '',
    status: 'Active',
    role: 'User'
  }
  
  isDialogOpen.value = false
}
</script>

<template>
  <div class="min-h-screen w-full bg-[#15161E] font-sans text-[#E4E5E7]">
    <NavbarView />
    
    <div class="container mx-auto py-8 px-4">
      <div class="flex flex-col gap-6">
        <div class="flex flex-col space-y-2">
          <h1 class="text-4xl font-extrabold">User Management</h1>
          <p class="text-muted-foreground">View and manage all system users</p>
        </div>

        <div class="flex items-center justify-between gap-4">
          <div class="relative w-full max-w-md">
            <Search class="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-[#666E99]" />
            <Input
              v-model="searchQuery"
              placeholder="Search users..."
              class="w-full pl-10 h-12 bg-[#15161E] border-[#666E99] focus-visible:ring-[#1A33C1]"
            />
          </div>
          
          <Dialog v-model:open="isDialogOpen">
            <DialogTrigger as-child>
              <Button class="h-12 bg-[#1A33C1] hover:bg-[#1A33C1]/90 font-bold">
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent class="sm:max-w-[600px] bg-[#15161E] border-[#666E99] text-[#E4E5E7]">
              <DialogHeader>
                <DialogTitle class="text-2xl">Add New User</DialogTitle>
                <DialogDescription>
                  Fill in the details of the new user. Click save when you're done.
                </DialogDescription>
              </DialogHeader>
              
              <div class="grid gap-4 py-4">
                <div class="grid grid-cols-4 items-center gap-4">
                  <label for="title" class="text-right">Title</label>
                  <Select v-model="newUser.title" class="col-span-3">
                    <SelectTrigger class="bg-[#15161E] border-[#666E99]">
                      <SelectValue placeholder="Select title" />
                    </SelectTrigger>
                    <SelectContent class="bg-[#15161E] border-[#666E99] text-[#E4E5E7]">
                      <SelectItem 
                        v-for="title in titleOptions" 
                        :key="title" 
                        :value="title"
                        class="hover:bg-[#1A33C1]/30 focus:bg-[#1A33C1]/30 focus:text-white"
                      >
                        {{ title }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div class="grid grid-cols-4 items-center gap-4">
                  <label for="firstName" class="text-right">First Name</label>
                  <Input 
                    id="firstName" 
                    v-model="newUser.firstName" 
                    class="col-span-3 bg-[#15161E] border-[#666E99] focus-visible:ring-[#1A33C1]" 
                  />
                </div>
                
                <div class="grid grid-cols-4 items-center gap-4">
                  <label for="lastName" class="text-right">Last Name</label>
                  <Input 
                    id="lastName" 
                    v-model="newUser.lastName" 
                    class="col-span-3 bg-[#15161E] border-[#666E99] focus-visible:ring-[#1A33C1]" 
                  />
                </div>
                
                <div class="grid grid-cols-4 items-center gap-4">
                  <label for="email" class="text-right">Email</label>
                  <Input 
                    id="email" 
                    v-model="newUser.email" 
                    type="email"
                    class="col-span-3 bg-[#15161E] border-[#666E99] focus-visible:ring-[#1A33C1]" 
                  />
                </div>
                
                <div class="grid grid-cols-4 items-center gap-4">
                  <label for="role" class="text-right">Role</label>
                  <Select v-model="newUser.role" class="col-span-3">
                    <SelectTrigger class="bg-[#15161E] border-[#666E99]">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent class="bg-[#15161E] border-[#666E99] text-[#E4E5E7]">
                      <SelectItem 
                        value="Admin"
                        class="hover:bg-[#1A33C1]/30 focus:bg-[#1A33C1]/30 focus:text-white"
                      >
                        Admin
                      </SelectItem>
                      <SelectItem 
                        value="User"
                        class="hover:bg-[#1A33C1]/30 focus:bg-[#1A33C1]/30 focus:text-white"
                      >
                        User
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div class="grid grid-cols-4 items-center gap-4">
                  <label for="status" class="text-right">Status</label>
                  <Select v-model="newUser.status" class="col-span-3">
                    <SelectTrigger class="bg-[#15161E] border-[#666E99]">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent class="bg-[#15161E] border-[#666E99] text-[#E4E5E7]">
                      <SelectItem 
                        value="Active"
                        class="hover:bg-[#1A33C1]/30 focus:bg-[#1A33C1]/30 focus:text-white"
                      >
                        Active
                      </SelectItem>
                      <SelectItem 
                        value="Inactive"
                        class="hover:bg-[#1A33C1]/30 focus:bg-[#1A33C1]/30 focus:text-white"
                      >
                        Inactive
                      </SelectItem>
                      <SelectItem 
                        value="Pending"
                        class="hover:bg-[#1A33C1]/30 focus:bg-[#1A33C1]/30 focus:text-white"
                      >
                        Pending
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  class="border-[#666E99] hover:bg-[#1A33C1]/30 hover:text-[#E4E5E7] text-black"
                  @click="isDialogOpen = false"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  class="bg-[#1A33C1] hover:bg-[#1A33C1]/90"
                  @click="addUser"
                >
                  Save User
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div class="rounded-lg border border-[#666E99]/50 bg-[#15161E]/50 backdrop-blur supports-[backdrop-filter]:bg-[#15161E]/60">
          <Table>
            <TableHeader>
              <TableRow class="hover:bg-transparent border-b border-[#666E99]/50">
                <TableHead class="w-[200px]">Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Role</TableHead>
                <TableHead class="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow 
                v-for="user in users" 
                :key="user.id"
                class="border-b border-[#666E99]/30 hover:bg-[#1A33C1]/10"
              >
                <TableCell class="font-medium">
                  {{ user.title }} {{ user.firstName }} {{ user.lastName }}
                </TableCell>
                <TableCell>{{ user.email }}</TableCell>
                <TableCell>
                  <span 
                    :class="{
                      'text-green-400': user.status === 'Active',
                      'text-yellow-400': user.status === 'Pending',
                      'text-red-400': user.status === 'Inactive'
                    }"
                  >
                    {{ user.status }}
                  </span>
                </TableCell>
                <TableCell>
                  <span 
                    :class="{
                      'text-[#1A33C1]': user.role === 'Admin',
                      'text-[#E4E5E7]': user.role === 'User'
                    }"
                  >
                    {{ user.role }}
                  </span>
                </TableCell>
                <TableCell class="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                      <Button variant="ghost" class="h-8 w-8 p-0 hover:bg-[#1A33C1]/20">
                        <span class="sr-only">Open menu</span>
                        <MoreHorizontal class="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                      align="end" 
                      class="bg-[#15161E] border-[#666E99] text-[#E4E5E7]"
                    >
                      <DropdownMenuItem class="hover:bg-[#1A33C1]/30 focus:bg-[#1A33C1]/30">
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem class="hover:bg-[#1A33C1]/30 focus:bg-[#1A33C1]/30">
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        class="text-red-400 hover:bg-red-500/10 focus:bg-red-500/10"
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  </div>
</template>