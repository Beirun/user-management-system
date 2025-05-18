<script setup lang="ts">
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Search, Plus, RefreshCw, Briefcase, Pencil } from 'lucide-vue-next'
import NavbarView from '@/views/NavbarView.vue'
import { ref, computed, onBeforeMount } from 'vue'
import type { Department, NewDepartment } from '@/models/department'
import { useDepartmentService } from '@/_services/department.service'
import { useToastService } from '@/_services/toast.service'
import type { Toast } from '@/models/toast'
// interface Department {
//   id: string
//   name: string
//   description: string
//   employeeCount: number
//   createdAt: string
// }
const toast = useToastService();
const departmentService = useDepartmentService();
const departments = ref<Department[]>([])
const isLoading = ref(false)
const searchQuery = ref('')
const selectedDepartment = ref<Department | null>(null)
const isDialogOpen = ref(false)
const isAddDialogOpen = ref(false)

const newDepartment = ref<NewDepartment>({
  name: '',
  description: '',
})

// const mockDepartments: Department[] = [
//   {
//     id: '1',
//     name: 'Engineering',
//     description: 'Responsible for product development and technical solutions',
//     employeeCount: 42,
//     createdAt: '2020-05-15',
//   },
//   {
//     id: '2',
//     name: 'Marketing',
//     description: 'Handles brand promotion and customer acquisition',
//     employeeCount: 18,
//     createdAt: '2020-06-20',
//   },
//   {
//     id: '3',
//     name: 'Human Resources',
//     description: 'Manages recruitment, benefits, and employee relations',
//     employeeCount: 8,
//     createdAt: '2020-04-10',
//   },
//   {
//     id: '4',
//     name: 'Finance',
//     description: 'Oversees budgeting, accounting, and financial planning',
//     employeeCount: 12,
//     createdAt: '2020-07-05',
//   },
//   {
//     id: '5',
//     name: 'Product',
//     description: 'Defines product strategy and roadmap',
//     employeeCount: 15,
//     createdAt: '2021-01-12',
//   },
//   {
//     id: '6',
//     name: 'Customer Support',
//     description: 'Provides assistance and resolves customer issues',
//     employeeCount: 24,
//     createdAt: '2020-08-30',
//   },
// ]
const isAddingDepartment = ref(false)
const isEditingDepartment = ref(false)

const filteredDepartments = computed(() => {
  if (!searchQuery.value) return departments.value
  return departments.value.filter(
    (dept) =>
      dept.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      dept.description.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const fetchDepartments = async () => {
  isLoading.value = true
  const response = await departmentService.getAll();
  departments.value = response
  isLoading.value = false
}

const openDepartmentDetails = (department: Department) => {
  selectedDepartment.value = { ...department }
  isDialogOpen.value = true
}

const saveChanges = async () => {
  isEditingDepartment.value = true
  if (!selectedDepartment.value!.description || !selectedDepartment.value!.name) {
    toast.error({
      title: "Error",
      description: "Please fill in all fields.",
    } as Toast)
    isEditingDepartment.value = false
    return
  }
  await departmentService.update(selectedDepartment.value!.id, selectedDepartment.value!)

  isEditingDepartment.value = false
  departments.value = await departmentService.getAll();

  isDialogOpen.value = false
  selectedDepartment.value = null

}

const openAddDepartmentDialog = () => {
  resetNewDepartmentForm()
  isAddDialogOpen.value = true
}

const addNewDepartment = async () => {
  isAddingDepartment.value = true
  if (!newDepartment.value.description || !newDepartment.value.name) {
    toast.error({
      title: "Error",
      description: "Please fill in all fields.",
    } as Toast)
    isAddingDepartment.value = false
    return
  }

  await departmentService.create(newDepartment.value);
  isAddingDepartment.value = false

  departments.value = await departmentService.getAll();
  isAddDialogOpen.value = false
}

const resetNewDepartmentForm = () => {
  newDepartment.value = {
    name: '',
    description: '',
  }
}

const formatDisplayDate = (dateString: string) => {
  if (!dateString) return 'N/A'
  const options = { year: 'numeric', month: 'short', day: 'numeric' } as const
  return new Date(dateString).toLocaleDateString(undefined, options)
}

const getAvatarFallback = (name?: string) => {
  return name ? name.charAt(0).toUpperCase() : 'D'
}

onBeforeMount(() => {
  fetchDepartments()
})
</script>

<template>
  <div class="min-h-screen max-w-screen flex flex-col items-center bg-background">
    <NavbarView />

    <main class="container py-8">
      <div class="flex flex-col gap-6">
        <div class="flex flex-col gap-2">
          <h1 class="text-3xl font-bold tracking-tight">Departments</h1>
          <p class="text-muted-foreground">Manage all company departments and their information</p>
        </div>

        <div class="flex flex-col gap-4">
          <div class="flex flex-col sm:flex-row justify-between gap-4">
            <div class="relative w-full sm:w-96">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input v-model="searchQuery" placeholder="Search departments..." class="pl-10" />
            </div>

            <div class="flex gap-2">
              <Button variant="outline" size="sm" @click="fetchDepartments" :disabled="isLoading">
                <RefreshCw class="mr-2 h-4 w-4" :class="{ 'animate-spin': isLoading }" />
                Refresh
              </Button>
              <Button size="sm" @click="openAddDepartmentDialog" class="text-foreground">
                <Plus class="mr-2 h-4 w-4 text-foreground" />
                Add Department
              </Button>
            </div>
          </div>

          <!-- Loading State -->
          <div v-if="isLoading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div v-for="i in 6" :key="`skel-${i}`" class="border rounded-lg p-5 bg-card flex flex-col">
              <div class="flex items-start gap-4 mb-4">
                <Skeleton class="h-12 w-12 rounded-full" />
                <div class="flex-1 space-y-2 pt-1">
                  <Skeleton class="h-5 w-3/4" />
                  <Skeleton class="h-4 w-1/2" />
                </div>
              </div>
              <div class="space-y-2 text-sm mb-4 flex-grow">
                <Skeleton class="h-16 w-full" />
              </div>
              <div class="flex justify-between items-center pt-3 border-t">
                <Skeleton class="h-6 w-20 rounded-md" />
                <Skeleton class="h-8 w-8 rounded-md" />
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else-if="filteredDepartments.length === 0"
            class="flex flex-col items-center justify-center py-12 gap-4 text-center">
            <Briefcase class="h-16 w-16 text-muted-foreground" />
            <h3 class="text-xl font-medium">No departments found</h3>
            <p class="text-sm text-muted-foreground">
              Try adjusting your search criteria or add a new department.
            </p>
          </div>

          <!-- Card Grid -->
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div v-for="department in filteredDepartments" :key="department.id"
              class="border bg-card text-card-foreground rounded-lg p-5 hover:shadow-lg transition-shadow duration-200 flex flex-col">
              <div class="flex items-start gap-4 mb-4">
                <Avatar class="h-12 w-12 bg-muted border">
                  <AvatarFallback>
                    {{ getAvatarFallback(department.name) }}
                  </AvatarFallback>
                </Avatar>
                <div class="flex-1">
                  <h3 class="font-semibold text-lg leading-tight">
                    {{ department.name }}
                  </h3>
                  <p class="text-xs text-muted-foreground">
                    Created: {{ formatDisplayDate(department.created) }}
                  </p>
                </div>
              </div>

              <div class="space-y-2 text-sm mb-4 flex-grow">
                <p class="text-muted-foreground line-clamp-3">
                  {{ department.description }}
                </p>
              </div>

              <div class="flex justify-between items-center pt-3 border-t">
                <Badge variant="secondary" class="px-2 py-0.5">
                  {{ department.employeeCount }} {{ department.employeeCount === 1 ? 'employee' : 'employees' }}
                </Badge>
                <Button variant="ghost" size="sm" class="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                  @click="openDepartmentDetails(department)">
                  <Pencil class="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Edit Department Dialog -->
    <Dialog v-model:open="isDialogOpen">
      <DialogContent class="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Edit Department</DialogTitle>
          <DialogDescription>Update the department information.</DialogDescription>
        </DialogHeader>
        <div v-if="selectedDepartment" class="grid gap-4 py-4">
          <div class="flex items-center gap-4">
            <Avatar class="h-12 w-12 bg-muted border">
              <AvatarFallback>
                {{ getAvatarFallback(selectedDepartment.name) }}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 class="text-lg font-semibold">
                {{ selectedDepartment.name }}
              </h3>
              <p class="text-sm text-muted-foreground">
                {{ selectedDepartment.employeeCount }} employees
              </p>
            </div>
          </div>

          <div class="grid gap-4">
            <div class="space-y-1.5">
              <Label for="edit-name">Name *</Label>
              <Input id="edit-name" v-model="selectedDepartment.name" placeholder="Enter department name" required />
            </div>
            <div class="space-y-1.5">
              <Label for="edit-description">Description *</Label>
              <Input id="edit-description" v-model="selectedDepartment.description"
                placeholder="Enter department description" required />
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" @click="isDialogOpen = false">Cancel</Button>
            <Button @click="saveChanges" :disabled="isEditingDepartment" class="text-foreground">
              <RefreshCw v-if="isEditingDepartment" class="mr-2 h-4 w-4 animate-spin" />
              {{ isEditingDepartment ? 'Saving...' : 'Save Changes' }}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Add New Department Dialog -->
    <Dialog v-model:open="isAddDialogOpen">
      <DialogContent class="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Add New Department</DialogTitle>
          <DialogDescription>Enter the department information.</DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <div class="space-y-1.5">
            <Label for="new-name">Name *</Label>
            <Input id="new-name" v-model="newDepartment.name" placeholder="Enter department name" required />
          </div>
          <div class="space-y-1.5">
            <Label for="new-description">Description *</Label>
            <Input id="new-description" v-model="newDepartment.description!" placeholder="Enter department description"
              required />
          </div>

          <div class="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" @click="isAddDialogOpen = false">Cancel</Button>
            <Button :disabled="isAddingDepartment" class="text-foreground" @click="addNewDepartment">{{
              isAddingDepartment ? 'Adding...' : 'Add Department' }}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>