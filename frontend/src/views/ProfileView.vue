<script setup lang="ts">
import NavbarView from '@/views/NavbarView.vue'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useToastService } from '@/_services/toast.service'
import { type Toast } from '@/models/toast'
import { onBeforeMount, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAccountStore } from '@/stores/account'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User } from 'lucide-vue-next'
import { useAccountService } from '@/_services/account.service'
const router = useRouter()
const isDialogOpen = ref(false)
const accountStore = useAccountStore()
const account = accountStore.getAccount()
const currentAccount = ref({
  id: account!.id,
  role: account!.role,
  title: account!.title,
  firstName: account!.firstName,
  lastName: account!.lastName,
  email: account!.email,
  status: account!.status,
  password: '',
  confirmPassword: '',
})

onBeforeMount(async () => {
  if (!account) {
    useToastService().error({
      title: 'Unauthorized',
      description: 'You are not authorized to access this page.',
      type: 'error',
    })
    router.push('/login')
  }
})

const password = ref('')
const confirmPassword = ref('')

const saveChanges = async () => {
  try {
    if (!currentAccount.value) return

    // Validate passwords match if either is filled
    if (password.value || confirmPassword.value) {
      if (password.value !== confirmPassword.value) {
        useToastService().error({
          title: 'Error',
          description: 'Passwords do not match',
          type: 'error',
        })
        return
      }
    }

    const { update } = useAccountService()
    const updateData = {
      ...currentAccount.value,
      ...(password.value ? { password: password.value } : {}),
    }

    await update(currentAccount.value.id, updateData)

    useToastService().success({
      title: 'Success',
      description: 'User updated successfully',
      type: 'success',
    })

    // Reset password fields
    password.value = ''
    confirmPassword.value = ''

    // await fetchAccounts() // Refresh the list
    isDialogOpen.value = false
  } catch (error) {
    useToastService().error({
      title: 'Error',
      description: 'Failed to update user',
      type: 'error',
    })
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center flex-col bg-background">
    <NavbarView />

    <main class="container flex-1 py-8">
      <div class="flex flex-col items-center gap-8">
        <div class="flex flex-col items-center gap-4">
          <Avatar class="size-80">
            <AvatarImage src="/src/assets/profile.jpg" />
            <AvatarFallback class="bg-muted">
              <User class="h-20 w-20 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>

          <div class="text-center space-y-1">
            <h2 class="text-2xl font-semibold">
              {{ currentAccount.title }}. {{ currentAccount.firstName }}
              {{ currentAccount.lastName }}
            </h2>
          </div>
          <Badge variant="default" class="mt-2 h-8 w-16 capitalize text-foreground">
            {{ currentAccount.status }}
          </Badge>
        </div>

        <div class="w-full max-w-md space-y-6">
          <div class="space-y-4">
            <div class="flex flex-col divide-y space-y-4">
              <div class="py-3 flex justify-between items-center">
                <Label class="text-sm font-medium">Full Name</Label>
                <p class="text-sm text-muted-foreground">
                  {{ currentAccount.title }} {{ currentAccount.firstName }}
                  {{ currentAccount.lastName }}
                </p>
              </div>

              <div class="py-3 flex justify-between items-center">
                <Label class="text-sm font-medium">Role</Label>
                <p class="text-sm text-muted-foreground">
                  {{ currentAccount.role }}
                </p>
              </div>
              <div class="py-3 flex justify-between items-center">
                <Label class="text-sm font-medium">Email</Label>
                <p class="text-sm text-muted-foreground">
                  {{ currentAccount.email }}
                </p>
              </div>
            </div>
          </div>

          <Button @click="() => (isDialogOpen = !isDialogOpen)" class="text-foreground h-12 w-full">
            Edit Profile
          </Button>
          <Dialog v-model:open="isDialogOpen">
            <DialogContent class="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Edit User</DialogTitle>
              </DialogHeader>
              <div v-if="currentAccount" class="grid gap-6 py-4">
                <div class="flex items-center gap-4">
                  <Avatar class="h-16 w-16 bg-muted">
                    <AvatarFallback class="text-muted-foreground">
                      <User class="h-8 w-8" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 class="text-lg font-medium">
                      {{ currentAccount.firstName }} {{ currentAccount.lastName }}
                    </h3>
                    <p class="text-sm text-muted-foreground">{{ currentAccount.role }}</p>
                  </div>
                </div>

                <div class="grid gap-8">
                  <div class="grid grid-cols-5 gap-4">
                    <div class="space-y-1 col-span-1">
                      <Label for="title">Title</Label>
                      <Select id="title" v-model="currentAccount.title">
                        <SelectTrigger class="h-8 w-full">
                          <SelectValue placeholder="Title" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Mr">Mr</SelectItem>
                          <SelectItem value="Mrs">Mrs</SelectItem>
                          <SelectItem value="Ms">Ms</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div class="space-y-1 col-span-2">
                      <Label for="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        v-model="currentAccount.firstName"
                        placeholder="First name"
                      />
                    </div>
                    <div class="space-y-1 col-span-2">
                      <Label for="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        v-model="currentAccount.lastName"
                        placeholder="Last name"
                      />
                    </div>
                  </div>

                  <div class="space-y-1">
                    <Label for="email">Email</Label>
                    <Input
                      id="email"
                      v-model="currentAccount.email"
                      type="email"
                      placeholder="Email"
                    />
                  </div>

                  <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-1">
                      <Label for="password">New Password</Label>
                      <Input
                        id="password"
                        v-model="password"
                        type="password"
                        placeholder="Leave blank to keep current"
                      />
                    </div>
                    <div class="space-y-1">
                      <Label for="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        v-model="confirmPassword"
                        type="password"
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>
                </div>

                <div class="flex justify-end gap-2 pt-4">
                  <Button variant="outline" @click="isDialogOpen = false"> Cancel </Button>
                  <Button class="text-foreground" @click="saveChanges"> Save changes </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </main>
  </div>
</template>
