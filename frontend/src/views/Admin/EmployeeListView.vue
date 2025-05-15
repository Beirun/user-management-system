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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Search,
  MoreHorizontal,
  UserPlus,
  RefreshCw,
  User,
  Briefcase,
  UserCheck,
  UserX,
} from 'lucide-vue-next'

import NavbarView from '@/views/NavbarView.vue'
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

interface Employee {
  id: string
  firstName: string
  lastName: string
  title: string
  employeeId: string
  position: string
  department: string
  hireDate: string
  email: string
  phone: string
  address: string
  status: 'active' | 'inactive' | 'on_leave'
}

const router = useRouter()
const accountStore = useAccountStore()
const employees = ref<Employee[]>([])
const isLoading = ref(false)
const searchQuery = ref('')
const selectedEmployee = ref<Employee | null>(null)
const isDialogOpen = ref(false)
const isAddDialogOpen = ref(false)

const departmentOptions = [
  'Engineering',
  'Product',
  'Marketing',
  'Sales',
  'HR',
  'Finance',
  'Operations',
  'Customer Support',
  'Design',
]

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'on_leave', label: 'On Leave' },
]

const newEmployee = ref<Omit<Employee, 'id'>>({
  firstName: '',
  lastName: '',
  title: 'Mr',
  employeeId: '',
  position: '',
  department: departmentOptions[0],
  hireDate: new Date().toISOString().split('T')[0],
  email: '',
  phone: '',
  address: '',
  status: 'active',
})

// Mock data for frontend display
const mockEmployees: Employee[] = [
  {
    id: '1',
    title: 'Mr',
    firstName: 'John',
    lastName: 'Doe',
    employeeId: 'EMP-001',
    position: 'Software Engineer',
    department: 'Engineering',
    hireDate: '2022-01-15',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    address: '123 Main St, Anytown, USA',
    status: 'active',
  },
  {
    id: '2',
    title: 'Ms',
    firstName: 'Jane',
    lastName: 'Smith',
    employeeId: 'EMP-002',
    position: 'Product Manager',
    department: 'Product',
    hireDate: '2021-11-03',
    email: 'jane.smith@example.com',
    phone: '+1 (555) 987-6543',
    address: '456 Oak Ave, Somewhere, USA',
    status: 'active',
  },
  {
    id: '3',
    title: 'Dr',
    firstName: 'Robert',
    lastName: 'Johnson',
    employeeId: 'EMP-003',
    position: 'Data Scientist',
    department: 'Analytics',
    hireDate: '2023-02-20',
    email: 'robert.j@example.com',
    phone: '+1 (555) 456-7890',
    address: '789 Pine Rd, Nowhere, USA',
    status: 'active',
  },
]

const filteredEmployees = computed(() => {
  if (!searchQuery.value) return employees.value
  return employees.value.filter(
    (employee) =>
      employee.firstName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      employee.lastName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      employee.department.toLowerCase().includes(searchQuery.value.toLowerCase()),
  )
})

const fetchEmployees = async () => {
  employees.value = mockEmployees
}

const openEmployeeDetails = (employee: Employee) => {
  selectedEmployee.value = { ...employee }
  isDialogOpen.value = true
}

const saveChanges = () => {
  if (selectedEmployee.value) {
    employees.value = employees.value.map((emp) =>
      emp.id === selectedEmployee.value!.id ? selectedEmployee.value! : emp,
    )
    useToastService().success({
      title: 'Success',
      description: 'Employee updated successfully',
      type: 'success',
    })
    isDialogOpen.value = false
  }
}

const addNewEmployee = () => {
  const newId = (employees.value.length + 1).toString()

  const employeeToAdd: Employee = {
    id: newId,
    ...newEmployee.value,
  }

  employees.value = [...employees.value, employeeToAdd]

  resetNewEmployeeForm()

  isAddDialogOpen.value = false

  useToastService().success({
    title: 'Success',
    description: 'Employee added successfully',
    type: 'success',
  })
}

const resetNewEmployeeForm = () => {
  newEmployee.value = {
    firstName: '',
    lastName: '',
    title: 'Mr',
    employeeId: '',
    position: '',
    department: departmentOptions[0],
    hireDate: new Date().toISOString().split('T')[0],
    email: '',
    phone: '',
    address: '',
    status: 'active',
  }
}

onBeforeMount(async () => {
  await fetchEmployees()
})

function formatDate(dateString: string): string {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' }
  return new Date(dateString).toLocaleDateString(undefined, options)
}

// Mock toast service for frontend-only
const useToastService = () => ({
  success: (toast: any) => console.log('Toast:', toast),
  error: (toast: any) => console.error('Toast Error:', toast),
})
</script>

<template>
  <div class="min-h-screen max-w-screen flex flex-col items-center bg-background">
    <NavbarView />

    <main class="container py-8">
      <div class="flex flex-col gap-6">
        <div class="flex flex-col gap-2">
          <h1 class="text-3xl font-bold tracking-tight">Employee Directory</h1>
          <p class="text-muted-foreground">Manage all company employees and their information</p>
        </div>

        <div class="flex flex-col gap-4">
          <div class="flex flex-col sm:flex-row justify-between gap-4">
            <div class="relative w-full sm:w-96">
              <Search
                class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
              />
              <Input v-model="searchQuery" placeholder="Search employees..." class="pl-10" />
            </div>

            <div class="flex gap-2">
              <Button variant="outline" size="sm" @click="fetchEmployees">
                <RefreshCw class="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button size="sm" @click="isAddDialogOpen = true">
                <UserPlus class="mr-2 h-4 w-4" />
                Add Employee
              </Button>
            </div>
          </div>

          <div
            v-if="filteredEmployees.length === 0"
            class="flex flex-col items-center justify-center py-12 gap-4"
          >
            <div class="text-center space-y-2">
              <h3 class="text-lg font-medium">No employees found</h3>
              <p class="text-sm text-muted-foreground">
                Try adjusting your search or add a new employee
              </p>
            </div>
          </div>

          <div v-else class="grid grid-cols-1 gap-4">
            <div class="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Hire Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead class="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="employee in filteredEmployees" :key="employee.id">
                    <TableCell class="font-medium">{{ employee.employeeId }}</TableCell>
                    <TableCell>{{ employee.email }}</TableCell>
                    <TableCell>{{ employee.position }}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" class="capitalize">
                        {{ employee.department }}
                      </Badge>
                    </TableCell>
                    <TableCell>{{ formatDate(employee.hireDate) }}</TableCell>
                    <TableCell>
                      <Badge
                        :variant="employee.status === 'active' ? 'default' : 'outline'"
                        :class="{
                          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200':
                            employee.status === 'active',
                          'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200':
                            employee.status === 'inactive',
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200':
                            employee.status === 'on_leave',
                        }"
                        class="capitalize"
                      >
                        {{ statusOptions.find((s) => s.value === employee.status)?.label }}
                      </Badge>
                    </TableCell>
                    <TableCell class="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger as-child>
                          <Button variant="ghost" class="h-8 w-8 p-0">
                            <MoreHorizontal class="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem @click="() => {}">
                            <UserCheck class="mr-2 h-4 w-4" />
                            Requests
                          </DropdownMenuItem>
                          <DropdownMenuItem @click="() => {}">
                            <RefreshCw class="mr-2 h-4 w-4" />
                            Workflows
                          </DropdownMenuItem>
                          <DropdownMenuItem @click="() => {}">
                            <UserX class="mr-2 h-4 w-4" />
                            Transfer
                          </DropdownMenuItem>
                          <DropdownMenuItem @click="openEmployeeDetails(employee)">
                            <User class="mr-2 h-4 w-4" />
                            Edit
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
    </main>

    <Dialog v-model:open="isDialogOpen">
      <DialogContent class="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Edit Employee</DialogTitle>
        </DialogHeader>
        <div v-if="selectedEmployee" class="grid gap-10 py-4">
          <div class="flex items-center gap-4">
            <Avatar class="h-16 w-16 bg-muted">
              <AvatarFallback class="text-muted-foreground">
                <Briefcase class="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 class="text-lg font-medium">
                {{ selectedEmployee.firstName }} {{ selectedEmployee.lastName }}
              </h3>
              <p class="text-sm text-muted-foreground">
                {{ selectedEmployee.position }} • {{ selectedEmployee.department }}
              </p>
            </div>
          </div>

          <div class="grid gap-8">
            <div class="grid grid-cols-5 gap-4">
              <div class="space-y-1 col-span-1">
                <Label for="title">Title</Label>
                <Select id="title" v-model="selectedEmployee.title">
                  <SelectTrigger class="h-8 w-full">
                    <SelectValue placeholder="Title" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mr">Mr</SelectItem>
                    <SelectItem value="Mrs">Mrs</SelectItem>
                    <SelectItem value="Ms">Ms</SelectItem>
                    <SelectItem value="Dr">Dr</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div class="space-y-1 col-span-2">
                <Label for="firstName">First Name</Label>
                <Input
                  id="firstName"
                  v-model="selectedEmployee.firstName"
                  placeholder="First name"
                />
              </div>
              <div class="space-y-1 col-span-2">
                <Label for="lastName">Last Name</Label>
                <Input id="lastName" v-model="selectedEmployee.lastName" placeholder="Last name" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1">
                <Label for="employeeId">Employee ID</Label>
                <Input
                  id="employeeId"
                  v-model="selectedEmployee.employeeId"
                  placeholder="Employee ID"
                />
              </div>
              <div class="space-y-1">
                <Label for="hireDate">Hire Date</Label>
                <Input
                  id="hireDate"
                  v-model="selectedEmployee.hireDate"
                  type="date"
                  placeholder="Hire Date"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1">
                <Label for="department">Department</Label>
                <Select v-model="selectedEmployee.department">
                  <SelectTrigger class="w-full">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="dept in departmentOptions" :key="dept" :value="dept">
                      {{ dept }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div class="space-y-1">
                <Label for="position">Position</Label>
                <Input id="position" v-model="selectedEmployee.position" placeholder="Position" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1">
                <Label for="email">Email</Label>
                <Input
                  id="email"
                  v-model="selectedEmployee.email"
                  type="email"
                  placeholder="Email"
                />
              </div>
              <div class="space-y-1">
                <Label for="phone">Phone</Label>
                <Input id="phone" v-model="selectedEmployee.phone" placeholder="Phone number" />
              </div>
            </div>

            <div class="space-y-1">
              <Label for="status">Status</Label>
              <Select v-model="selectedEmployee.status">
                <SelectTrigger class="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="status in statusOptions"
                    :key="status.value"
                    :value="status.value"
                  >
                    {{ status.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="space-y-1">
              <Label for="address">Address</Label>
              <Input id="address" v-model="selectedEmployee.address" placeholder="Address" />
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-4">
            <Button variant="outline" @click="isDialogOpen = false">Cancel</Button>
            <Button @click="saveChanges">Save changes</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="isAddDialogOpen">
      <DialogContent class="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
          <DialogDescription> Enter the required employee information </DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <div class="space-y-1">
            <Label for="new-employeeId">Employee ID</Label>
            <Input
              id="new-employeeId"
              v-model="newEmployee.employeeId"
              placeholder="Enter employee ID"
              required
            />
          </div>

          <div class="space-y-1">
            <Label for="new-account">Account</Label>
            <Select v-model="newEmployee.email" required>
              <SelectTrigger>
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin@company.com">Admin User (admin@company.com)</SelectItem>
                <SelectItem value="employee@company.com"
                  >Employee User (employee@company.com)</SelectItem
                >
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-1">
            <Label for="new-position">Position</Label>
            <Input
              id="new-position"
              v-model="newEmployee.position"
              placeholder="Enter position"
              required
            />
          </div>

          <div class="space-y-1">
            <Label for="new-department">Department</Label>
            <Select v-model="newEmployee.department" required>
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="dept in departmentOptions" :key="dept" :value="dept">
                  {{ dept }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-1">
            <Label for="new-hireDate">Hire Date</Label>
            <Input id="new-hireDate" v-model="newEmployee.hireDate" type="date" required />
          </div>

          <div class="space-y-1">
            <Label for="new-status">Status</Label>
            <Select v-model="newEmployee.status" required>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="flex justify-end gap-2 pt-4">
            <Button variant="outline" @click="isAddDialogOpen = false">Cancel</Button>
            <Button @click="addNewEmployee">Add Employee</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
