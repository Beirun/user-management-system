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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  ChevronDown,
  Search,
  MoreHorizontal,
  UserPlus,
  RefreshCw,
  User,
  UserCog,
  UserCheck,
  UserX,
} from 'lucide-vue-next'
import { Skeleton } from '@/components/ui/skeleton'

import NavbarView from '@/views/NavbarView.vue'
import { useAccountService } from '@/_services/account.service'
import { useToastService } from '@/_services/toast.service'
import { type Toast } from '@/models/toast'
import { type Account, type NewAccount } from '@/models/account'
import { onBeforeMount, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAccountStore } from '@/stores/account'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

const router = useRouter()
const accountStore = useAccountStore()
const accounts = ref<Account[]>([])
const isLoading = ref(true)
const searchQuery = ref('')
const selectedAccount = ref<Account | null>(null)
const isDialogOpen = ref(false)
const isCreatingUser = ref(false)
const isAddUserDialogOpen = ref(false)

const newUser = ref({
  title: '',
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: '',
  status: '',
  acceptTerms: true,
})

const filteredAccounts = computed(() => {
  if (!searchQuery.value) return accounts.value
  return accounts.value.filter(
    (account) =>
      account.firstName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      account.lastName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      account.email.toLowerCase().includes(searchQuery.value.toLowerCase()),
  )
})

const fetchAccounts = async () => {
  try {
    isLoading.value = true
    const { getAll } = useAccountService()
    accounts.value = await getAll()
  } catch (error) {
    useToastService().error({
      title: 'Error',
      description: 'Failed to fetch accounts',
      type: 'error',
    })
  } finally {
    console.log(accounts.value)
    isLoading.value = false
  }
}

const isSubmitting = ref(false)
const openUserDetails = (account: Account) => {
  selectedAccount.value = account
  isDialogOpen.value = true
}
const password = ref('')
const confirmPassword = ref('')
const resetNewUserForm = () => {
  newUser.value = {
    title: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    status: '',
    acceptTerms: true,
  }
}

const saveChanges = async () => {
  try {
    isSubmitting.value = true
    if (!selectedAccount.value) {
      isSubmitting.value = false
      return
    }

    // Validate passwords match if either is filled
    if (password.value || confirmPassword.value) {
      if (password.value !== confirmPassword.value) {
        useToastService().error({
          title: 'Error',
          description: 'Passwords do not match',
          type: 'error',
        })
        isSubmitting.value = false
        return
      }
    }

    const { update } = useAccountService()
    const updateData = {
      ...selectedAccount.value,
      ...(password.value ? { password: password.value, confirmPassword: confirmPassword.value } : {}),
    }

    await update(selectedAccount.value.id, updateData)

    useToastService().success({
      title: 'Success',
      description: 'User updated successfully',
      type: 'success',
    })

    // Reset password fields
    password.value = ''
    confirmPassword.value = ''

    accounts.value.map((acc) => acc.id === selectedAccount.value!.id ? selectedAccount.value : acc)
    // await fetchAccounts() // Refresh the list
    isDialogOpen.value = false
    isSubmitting.value = false
  } catch (error) {
    useToastService().error({
      title: 'Error',
      description: 'Failed to update user',
      type: 'error',
    })
    isSubmitting.value = false
  }
}

const createUser = async () => {
  try {
    if (!newUser.value.email || !newUser.value.password || !newUser.value.confirmPassword || !newUser.value.firstName || !newUser.value.lastName || !newUser.value.role || !newUser.value.status) {
      useToastService().error({
        title: 'Error',
        description: 'All fields are required',
        type: 'error',
      })
      return
    }
    isCreatingUser.value = true
    const { create } = useAccountService()

    // Validate passwords match
    if (newUser.value.password !== newUser.value.confirmPassword) {
      useToastService().error({
        title: 'Error',
        description: 'Passwords do not match',
        type: 'error',
      })
      isCreatingUser.value = false
      return
    }
    console.log(newUser.value)
    await create(newUser.value as NewAccount)


    useToastService().success({
      title: 'Success',
      description: 'User created successfully',
      type: 'success',
    })

    // Reset form
    newUser.value = {
      title: '',
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: '',
      status: '',
      acceptTerms: true,
    }

    isAddUserDialogOpen.value = false
    await fetchAccounts() // Refresh the list
  } catch (error) {
  } finally {
    isCreatingUser.value = false
  }
}

const account = accountStore.getAccount()
onBeforeMount(async () => {
  if (!account || account.role !== 'Admin') {
    useToastService().error({
      title: 'Unauthorized',
      description: 'You are not authorized to access this page.',
      type: 'error',
    })
    router.push('/login')
    return
  }
  await fetchAccounts()
})

function getTimeAgo(acc: Account, timestamp: Date | string | number): string {
  if (!acc.lastLogin) return "Never"
  if (accountStore.account!.id === acc.id) return "Active now";
  // Convert to Date object if it's not already
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Time intervals in seconds
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
    second: 1
  };

  // Calculate time difference
  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);

    if (interval >= 1) {
      return interval === 1
        ? `${interval} ${unit} ago`
        : `${interval} ${unit}s ago`;
    }
  }

  return 'Active now';
}
</script>

<template>
  <div class="min-h-screen max-w-screen flex flex-col items-center bg-background">
    <NavbarView />

    <main class="container py-8">
      <div class="flex flex-col gap-6">
        <div class="flex flex-col gap-2">
          <h1 class="text-3xl font-bold tracking-tight">User Management</h1>
          <p class="text-muted-foreground">Manage all registered users and their account status</p>
        </div>

        <div class="flex flex-col gap-4">
          <div class="flex flex-col sm:flex-row justify-between gap-4">
            <div class="relative w-full sm:w-96">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input v-model="searchQuery" placeholder="Search users..." class="pl-10" />
            </div>

            <div class="flex gap-2">
              <Button variant="outline" size="sm" @click="fetchAccounts">
                <RefreshCw class="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button class="text-foreground" size="sm" @click="isAddUserDialogOpen = true">
                <UserPlus class="mr-2 h-4 w-4" />
                Add User
              </Button>
            </div>
          </div>

          <!-- Loading State -->
          <div v-if="isLoading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div v-for="i in 8" :key="i" class="border rounded-lg p-4 bg-card">
              <div class="flex items-start gap-3">
                <Skeleton class="h-20 w-20 rounded-full" />
                <div class="flex-1 space-y-2">
                  <Skeleton class="h-5 w-[140px]" />
                  <Skeleton class="h-4 w-[100px]" />
                  <Skeleton class="h-4 w-[160px]" />
                </div>
              </div>
              <div class="mt-4 pt-4 border-t flex items-center justify-between">
                <Skeleton class="h-4 w-[100px]" />
                <Skeleton class="h-8 w-16 rounded-md" />
              </div>
            </div>
          </div>
          <!-- Empty State -->
          <div v-else-if="filteredAccounts.length === 0" class="flex flex-col items-center justify-center py-12 gap-4">
            <div class="text-center space-y-2">
              <h3 class="text-lg font-medium">No users found</h3>
              <p class="text-sm text-muted-foreground">
                Try adjusting your search or add a new user
              </p>
            </div>
          </div>

          <!-- Card Grid -->
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div v-for="account in filteredAccounts" :key="account.id"
              class="border bg-card text-card-foreground rounded-lg p-4 hover:shadow-md transition-shadow flex flex-col">
              <div class="flex items-start gap-3">
                <div class="relative">
                  <Avatar class="size-20 bg-muted">
                    <AvatarFallback class="text-muted-foreground">
                      <template v-if="account.role === 'Admin'">
                        <UserCog class="size-10" />
                      </template>
                      <template v-else>
                        <User class="size-10" />
                      </template>
                    </AvatarFallback>
                  </Avatar>
                  <Badge :variant="account.status === 'Active' ? 'default' : 'secondary'"
                    class="capitalize text-foreground absolute -bottom-1 left-3.25 h-5 px-1.5 text-xs">
                    {{ account.status }}
                  </Badge>
                </div>
                <div class="flex-1 space-y-1">
                  <h3 class="font-medium text-lg leading-tight">
                    {{ account.firstName }} {{ account.lastName }}
                  </h3>
                  <p class="text-sm text-muted-foreground">
                    {{ account.role }}
                  </p>
                  <p class="text-sm text-muted-foreground truncate">
                    {{ account.email }}
                  </p>
                </div>
              </div>

              <div class="mt-4 pt-4 border-t flex items-center justify-between">
                <div class="text-sm text-muted-foreground">Last active: {{ getTimeAgo(account, account.lastLogin) }}
                </div>
                <Button size="sm" @click="openUserDetails(account)" class="h-8 text-">
                  Edit
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- User Details Dialog -->
    <Dialog v-model:open="isDialogOpen">
      <DialogContent class="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>
        <div v-if="selectedAccount" class="grid gap-10 py-4">
          <div class="flex items-center gap-4">
            <Avatar class="h-16 w-16 bg-muted">
              <AvatarFallback class="text-muted-foreground">
                <User class="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 class="text-lg font-medium">
                {{ selectedAccount.firstName }} {{ selectedAccount.lastName }}
              </h3>
              <h2>{{ selectedAccount.role }}</h2>
            </div>
          </div>

          <div class="grid gap-8">
            <div class="grid grid-cols-5 gap-4">
              <div class="space-y-1 col-span-1">
                <Label for="status">Title</Label>
                <Select id="status" v-model="selectedAccount.title">
                  <SelectTrigger class="h-8 w-full">
                    <SelectValue placeholder="Title" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mr"> Mr </SelectItem>
                    <SelectItem value="Mrs"> Mrs </SelectItem>
                    <SelectItem value="Ms"> Ms </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div class="space-y-1 col-span-2">
                <Label for="firstName">First Name</Label>
                <Input id="firstName" v-model="selectedAccount.firstName" placeholder="First name" />
              </div>
              <div class="space-y-1 col-span-2">
                <Label for="lastName">Last Name</Label>
                <Input id="lastName" v-model="selectedAccount.lastName" placeholder="Last name" />
              </div>
            </div>
            <div class="grid grid-cols-4 gap-4">
              <div class="space-y-1 col-span-2">
                <Label for="email">Email</Label>
                <Input id="email" v-model="selectedAccount.email" type="email" placeholder="Email" />
              </div>
              <div class="space-y-1 col-span-1">
                <Label for="role">Role</Label>
                <Select :disabled="selectedAccount.id === account?.id" id="role" v-model="selectedAccount.role">
                  <SelectTrigger class="h-8 w-full">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="User">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div class="space-y-1 col-span-1">
                <Label for="status">Status</Label>
                <Select :disabled="selectedAccount.id === account?.id" id="status" v-model="selectedAccount.status">
                  <SelectTrigger class="h-8 w-full">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div class="space-y-1">
              <Label for="password">New Password</Label>
              <Input id="password" v-model="password" type="password" placeholder="Leave blank to keep current" />
            </div>

            <div class="space-y-1">
              <Label for="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" v-model="confirmPassword" type="password"
                placeholder="Confirm new password" />
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-4">
            <Button variant="outline" @click="isDialogOpen = false"> Cancel </Button>
            <Button :disabled="isSubmitting" @click="saveChanges" class="text-foreground">
              <RefreshCw v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />
              {{ isSubmitting ? 'Saving...' : 'Save Changes' }}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Add User Dialog -->
    <Dialog v-model:open="isAddUserDialogOpen" @update:open="(val) => {
      if (!val) resetNewUserForm()
    }">
      <DialogContent class="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
        </DialogHeader>
        <div class="grid gap-10 py-4">
          <div class="flex items-center gap-4">
            <Avatar class="h-16 w-16 bg-muted">
              <AvatarFallback class="text-muted-foreground">
                <User class="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 class="text-lg font-medium">{{ !newUser.firstName && !newUser.lastName ? 'New User' :
                `${newUser.firstName} ${newUser.lastName}` }}</h3>
            </div>
          </div>

          <div class="grid gap-8">
            <div class="grid grid-cols-5 gap-4">
              <div class="space-y-1 col-span-1">
                <Label for="new-title">Title</Label>
                <Select id="new-title" v-model="newUser.title">
                  <SelectTrigger class="h-8 w-full">
                    <SelectValue placeholder="Title" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mr"> Mr </SelectItem>
                    <SelectItem value="Mrs"> Mrs </SelectItem>
                    <SelectItem value="Ms"> Ms </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div class="space-y-1 col-span-2">
                <Label for="new-firstName">First Name</Label>
                <Input id="new-firstName" v-model="newUser.firstName" placeholder="First name" />
              </div>
              <div class="space-y-1 col-span-2">
                <Label for="new-lastName">Last Name</Label>
                <Input id="new-lastName" v-model="newUser.lastName" placeholder="Last name" />
              </div>
            </div>
            <div class="grid grid-cols-4 gap-4">
              <div class="space-y-1 col-span-2">
                <Label for="new-email">Email</Label>
                <Input id="new-email" v-model="newUser.email" type="email" placeholder="Email" />
              </div>
              <div class="space-y-1 col-span-1">
                <Label for="new-role">Role</Label>
                <Select id="new-role" v-model="newUser.role">
                  <SelectTrigger class="h-8 w-full">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="User">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div class="space-y-1 col-span-1">
                <Label for="new-status">Status</Label>
                <Select id="new-status" v-model="newUser.status">
                  <SelectTrigger class="h-8 w-full">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div class="space-y-1">
              <Label for="new-password">Password</Label>
              <Input id="new-password" v-model="newUser.password" type="password" placeholder="Password" />
            </div>

            <div class="space-y-1">
              <Label for="new-confirmPassword">Confirm Password</Label>
              <Input id="new-confirmPassword" v-model="newUser.confirmPassword" type="password"
                placeholder="Confirm password" />
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-4">
            <Button variant="outline" @click="isAddUserDialogOpen = false"> Cancel </Button>
            <Button :disabled="isCreatingUser" @click="createUser" class="text-foreground">
              <RefreshCw v-if="isCreatingUser" class="mr-2 h-4 w-4 animate-spin" />
              {{ isCreatingUser ? 'Creating...' : 'Create User' }}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>