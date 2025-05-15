<script setup lang="ts">
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
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
  CalendarIcon,
  Mail,
  Phone,
} from 'lucide-vue-next'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

import NavbarView from '@/views/NavbarView.vue'
import { onBeforeMount, ref, computed } from 'vue'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

import {
  type DateValue,
  CalendarDate,
  today,
  parseDate as parseDateValue,
  getLocalTimeZone,
  DateFormatter,
} from '@internationalized/date'

// For optional display formatting using date-fns if preferred over DateFormatter for some cases
import { format as formatDateFn_display_optional, parseISO, isValid as isValidJsDate } from 'date-fns'

interface Employee {
  id: string
  firstName: string
  lastName: string
  title: string
  employeeId: string
  position: string
  department: string
  hireDate: string // Stays as YYYY-MM-DD string
  email: string
  phone: string
  address: string
  status: 'active' | 'inactive' | 'on_leave'
}

const employees = ref<Employee[]>([])
const isLoading = ref(false)
const searchQuery = ref('')
const selectedEmployee = ref<Employee | null>(null)
const isDialogOpen = ref(false)
const isAddDialogOpen = ref(false)

// For DatePickers - using DateValue
const editHireDateForPicker = ref<DateValue | undefined>()
const newHireDateForPicker = ref<DateValue | undefined>()

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
  'Analytics',
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
  hireDate: today(getLocalTimeZone()).toString(), // Initial YYYY-MM-DD
  email: '',
  phone: '',
  address: '',
  status: 'active',
})

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
    status: 'on_leave',
  },
  {
    id: '4',
    title: 'Mrs',
    firstName: 'Emily',
    lastName: 'Davis',
    employeeId: 'EMP-004',
    position: 'UX Designer',
    department: 'Design',
    hireDate: '2022-08-10',
    email: 'emily.d@example.com',
    phone: '+1 (555) 234-5678',
    address: '321 Birch Ln, Anytown, USA',
    status: 'inactive',
  },
]

const filteredEmployees = computed(() => {
  if (!searchQuery.value) return employees.value
  return employees.value.filter(
    (employee) =>
      employee.firstName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      employee.lastName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      employee.department.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      employee.employeeId.toLowerCase().includes(searchQuery.value.toLowerCase()),
  )
})

const fetchEmployees = async () => {
  isLoading.value = true
  await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API
  employees.value = mockEmployees
  isLoading.value = false
}

const openEmployeeDetails = (employee: Employee) => {
  selectedEmployee.value = { ...employee }
  try {
    editHireDateForPicker.value = employee.hireDate ? parseDateValue(employee.hireDate) : undefined
  } catch (e) {
    console.warn("Failed to parse employee hire date for picker:", employee.hireDate, e);
    editHireDateForPicker.value = undefined;
  }
  isDialogOpen.value = true
}

const saveChanges = () => {
  if (selectedEmployee.value) {
    employees.value = employees.value.map((emp) =>
      emp.id === selectedEmployee.value!.id ? { ...selectedEmployee.value! } : emp,
    )
    useToastService().success({
      title: 'Success',
      description: 'Employee updated successfully',
    })
    isDialogOpen.value = false
    selectedEmployee.value = null
  }
}

const openAddEmployeeDialog = () => {
  resetNewEmployeeForm()
  isAddDialogOpen.value = true
}

const addNewEmployee = () => {
  const newId = `EMP-${String(employees.value.length + 10).padStart(3, '0')}`
  const employeeToAdd: Employee = {
    id: newId,
    ...newEmployee.value,
  }
  employees.value = [...employees.value, employeeToAdd]
  isAddDialogOpen.value = false
  useToastService().success({
    title: 'Success',
    description: 'Employee added successfully',
  })
}

const resetNewEmployeeForm = () => {
  const currentLocalDate = today(getLocalTimeZone())
  newEmployee.value = {
    firstName: '',
    lastName: '',
    title: 'Mr',
    employeeId: '',
    position: '',
    department: departmentOptions[0],
    hireDate: currentLocalDate.toString(),
    email: '',
    phone: '',
    address: '',
    status: 'active',
  }
  newHireDateForPicker.value = currentLocalDate
}

onBeforeMount(async () => {
  await fetchEmployees()
})

const dateFormatter = new DateFormatter(navigator.language || 'en-US', { dateStyle: 'medium' })

function formatDisplayDate(dateString: string): string {
  if (!dateString) return 'N/A'
  try {
    const dateVal = parseDateValue(dateString)
    return dateFormatter.format(dateVal.toDate(getLocalTimeZone()))
  } catch (e) {
     // Fallback for display if needed, e.g. using date-fns
    if (isValidJsDate(parseISO(dateString))) {
        return formatDateFn_display_optional(parseISO(dateString), 'MMM d, yyyy');
    }
    console.warn("Failed to parse/format date string for display:", dateString, e);
    return 'Invalid Date';
  }
}

const useToastService = () => ({
  success: (toast: {title: string, description: string}) => console.log('Toast Success:', toast.title, toast.description),
  error: (toast: {title: string, description: string}) => console.error('Toast Error:', toast.title, toast.description),
})

const getAvatarFallback = (firstName?: string, lastName?: string) => {
  const fn = firstName || ''
  const ln = lastName || ''
  return `${fn.charAt(0)}${ln.charAt(0)}`.toUpperCase() || `<Briefcase class="h-8 w-8" />`
}
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
              <Button variant="outline" size="sm" @click="fetchEmployees" :disabled="isLoading">
                <RefreshCw class="mr-2 h-4 w-4" :class="{'animate-spin': isLoading}" />
                Refresh
              </Button>
              <Button size="sm" @click="openAddEmployeeDialog">
                <UserPlus class="mr-2 h-4 w-4" />
                Add Employee
              </Button>
            </div>
          </div>

          <!-- Loading State -->
          <div v-if="isLoading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <div v-for="i in 4" :key="`skel-${i}`" class="border rounded-lg p-4 bg-card flex flex-col">
              <div class="flex items-start gap-4 mb-4">
                <Skeleton class="h-16 w-16 rounded-full" />
                <div class="flex-1 space-y-2 pt-1">
                  <Skeleton class="h-5 w-3/4" />
                  <Skeleton class="h-4 w-1/2" />
                  <Skeleton class="h-3 w-1/4" />
                </div>
                <Skeleton class="h-8 w-8 rounded-md" />
              </div>
              <div class="space-y-2 text-sm mb-4 flex-grow">
                <div class="flex items-center gap-2"> <Skeleton class="h-4 w-4" /> <Skeleton class="h-4 w-2/3" /> </div>
                <div class="flex items-center gap-2"> <Skeleton class="h-4 w-4" /> <Skeleton class="h-4 w-1/2" /> </div>
                <div class="flex items-center gap-2"> <Skeleton class="h-6 w-20 rounded-md" /></div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div
            v-else-if="filteredEmployees.length === 0"
            class="flex flex-col items-center justify-center py-12 gap-4 text-center"
          >
            <Briefcase class="h-16 w-16 text-muted-foreground" />
            <h3 class="text-xl font-medium">No employees found</h3>
            <p class="text-sm text-muted-foreground">
              Try adjusting your search criteria or add a new employee.
            </p>
          </div>

          <!-- Card Grid -->
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <div
              v-for="employee in filteredEmployees"
              :key="employee.id"
              class="border bg-card text-card-foreground rounded-lg p-4 hover:shadow-lg transition-shadow duration-200 flex flex-col"
            >
              <div class="flex items-start gap-4 mb-4">
                <Avatar class="h-16 w-16 text-xl bg-muted border">
                  <AvatarFallback>
                    {{ getAvatarFallback(employee.firstName, employee.lastName) }}
                  </AvatarFallback>
                </Avatar>
                <div class="flex-1 space-y-0.5">
                  <h3 class="font-semibold text-lg leading-tight">
                    {{ employee.title }} {{ employee.firstName }} {{ employee.lastName }}
                  </h3>
                  <p class="text-sm text-primary">{{ employee.position }}</p>
                  <p class="text-xs text-muted-foreground">{{ employee.employeeId }}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button variant="ghost" class="h-8 w-8 p-0 self-start text-muted-foreground hover:text-foreground">
                      <MoreHorizontal class="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" class="w-48">
                    <DropdownMenuItem @click="openEmployeeDetails(employee)">
                      <User class="mr-2 h-4 w-4" />
                      <span>Edit Details</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem @click="() => {}">
                      <UserCheck class="mr-2 h-4 w-4" />
                      <span>View Requests</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem @click="() => {}">
                      <RefreshCw class="mr-2 h-4 w-4" />
                      <span>Manage Workflows</span>
                    </DropdownMenuItem>
                     <DropdownMenuItem @click="() => {}" class="text-destructive focus:text-destructive focus:bg-destructive/10">
                      <UserX class="mr-2 h-4 w-4" />
                      <span>Initiate Transfer</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div class="space-y-2.5 text-sm mb-4 flex-grow">
                <div class="flex items-center">
                  <Briefcase class="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span class="truncate" :title="employee.department">Dept: {{ employee.department }}</span>
                </div>
                <div class="flex items-center">
                  <CalendarIcon class="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span>Hired: {{ formatDisplayDate(employee.hireDate) }}</span>
                </div>
                 <div class="flex items-center">
                  <Mail class="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <a :href="'mailto:'+employee.email" class="truncate text-primary hover:underline" :title="employee.email">{{ employee.email }}</a>
                </div>
                <div v-if="employee.phone" class="flex items-center">
                  <Phone class="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span class="truncate">{{ employee.phone }}</span>
                </div>
              </div>

              <div class="mt-auto pt-3 border-t">
                <Badge
                  :variant="employee.status === 'active' ? 'default' : 'outline'"
                  :class="{
                    'bg-green-500/10 text-green-700 dark:bg-green-500/20 dark:text-green-400 border-green-500/30': employee.status === 'active',
                    'bg-red-500/10 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-red-500/30': employee.status === 'inactive',
                    'bg-yellow-500/10 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400 border-yellow-500/30': employee.status === 'on_leave',
                  }"
                  class="capitalize text-xs px-2 py-0.5"
                >
                  {{ statusOptions.find((s) => s.value === employee.status)?.label }}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Edit Employee Dialog -->
    <Dialog v-model:open="isDialogOpen">
      <DialogContent class="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Edit Employee</DialogTitle>
          <DialogDescription>Update the employee's information.</DialogDescription>
        </DialogHeader>
        <div v-if="selectedEmployee" class="grid gap-6 py-4">
          <div class="flex items-center gap-4">
            <Avatar class="h-16 w-16 bg-muted border">
              <AvatarFallback>
                {{ getAvatarFallback(selectedEmployee.firstName, selectedEmployee.lastName) }}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 class="text-lg font-semibold">
                {{ selectedEmployee.title }} {{ selectedEmployee.firstName }} {{ selectedEmployee.lastName }}
              </h3>
              <p class="text-sm text-muted-foreground">
                {{ selectedEmployee.position }} • {{ selectedEmployee.department }}
              </p>
            </div>
          </div>

          <div class="grid gap-4 max-h-[60vh] overflow-y-auto pr-3 -mr-3"> {/* Added scroll padding */}
            <div class="grid grid-cols-5 gap-4 items-end">
              <div class="space-y-1.5 col-span-1">
                <Label for="edit-title">Title</Label>
                <Select id="edit-title" v-model="selectedEmployee.title">
                  <SelectTrigger><SelectValue placeholder="Title" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mr">Mr</SelectItem>
                    <SelectItem value="Mrs">Mrs</SelectItem>
                    <SelectItem value="Ms">Ms</SelectItem>
                    <SelectItem value="Dr">Dr</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div class="space-y-1.5 col-span-2">
                <Label for="edit-firstName">First Name</Label>
                <Input id="edit-firstName" v-model="selectedEmployee.firstName" placeholder="John" />
              </div>
              <div class="space-y-1.5 col-span-2">
                <Label for="edit-lastName">Last Name</Label>
                <Input id="edit-lastName" v-model="selectedEmployee.lastName" placeholder="Doe" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <Label for="edit-employeeId">Employee ID</Label>
                <Input id="edit-employeeId" v-model="selectedEmployee.employeeId" placeholder="EMP-001" />
              </div>
              <div class="space-y-1.5">
                <Label for="edit-hireDate">Hire Date</Label>
                <Popover>
                  <PopoverTrigger as-child>
                    <Button
                      variant="outline"
                      :class="cn(
                        'w-full justify-start text-left font-normal',
                        !editHireDateForPicker && 'text-muted-foreground',
                      )"
                    >
                      <CalendarIcon class="mr-2 h-4 w-4" />
                      {{ editHireDateForPicker ? dateFormatter.format(editHireDateForPicker.toDate(getLocalTimeZone())) : "Pick a date" }}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent class="w-auto p-0">
                    <Calendar
                      v-model="editHireDateForPicker"
                      @update:model-value="(dateVal: DateValue | undefined) => {
                        if (selectedEmployee) {
                          selectedEmployee.hireDate = dateVal ? dateVal.toString() : '';
                        }
                      }"
                      initial-focus
                      :min-value="parseDateValue('1900-01-01')"
                      :max-value="today(getLocalTimeZone()).add({ years: 5 })"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

             <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <Label for="edit-department">Department</Label>
                <Select id="edit-department" v-model="selectedEmployee.department">
                  <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="dept in departmentOptions" :key="dept" :value="dept">{{ dept }}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div class="space-y-1.5">
                <Label for="edit-position">Position</Label>
                <Input id="edit-position" v-model="selectedEmployee.position" placeholder="Software Engineer" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <Label for="edit-email">Email</Label>
                <Input id="edit-email" v-model="selectedEmployee.email" type="email" placeholder="john.doe@example.com" />
              </div>
              <div class="space-y-1.5">
                <Label for="edit-phone">Phone</Label>
                <Input id="edit-phone" v-model="selectedEmployee.phone" placeholder="+1 (555) 123-4567" />
              </div>
            </div>
            <div class="space-y-1.5">
              <Label for="edit-address">Address</Label>
              <Input id="edit-address" v-model="selectedEmployee.address" placeholder="123 Main St, Anytown, USA" />
            </div>
             <div class="space-y-1.5">
                <Label for="edit-status">Status</Label>
                <Select id="edit-status" v-model="selectedEmployee.status">
                  <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="statusOpt in statusOptions" :key="statusOpt.value" :value="statusOpt.value">
                      {{ statusOpt.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
          </div>

          <div class="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" @click="isDialogOpen = false">Cancel</Button>
            <Button @click="saveChanges">Save Changes</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Add New Employee Dialog -->
    <Dialog v-model:open="isAddDialogOpen">
      <DialogContent class="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
          <DialogDescription>Enter the required employee information.</DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-3 -mr-3"> {/* Added scroll padding */}
          <div class="space-y-1.5">
            <Label for="new-title">Title</Label>
            <Select id="new-title" v-model="newEmployee.title">
                <SelectTrigger><SelectValue placeholder="Title" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mr">Mr</SelectItem>
                  <SelectItem value="Mrs">Mrs</SelectItem>
                  <SelectItem value="Ms">Ms</SelectItem>
                  <SelectItem value="Dr">Dr</SelectItem>
                </SelectContent>
            </Select>
          </div>
           <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <Label for="new-firstName">First Name *</Label>
              <Input id="new-firstName" v-model="newEmployee.firstName" placeholder="Enter first name" required />
            </div>
            <div class="space-y-1.5">
              <Label for="new-lastName">Last Name *</Label>
              <Input id="new-lastName" v-model="newEmployee.lastName" placeholder="Enter last name" required />
            </div>
          </div>

          <div class="space-y-1.5">
            <Label for="new-employeeId">Employee ID *</Label>
            <Input id="new-employeeId" v-model="newEmployee.employeeId" placeholder="Enter employee ID (e.g., EMP-123)" required />
          </div>

          <div class="space-y-1.5">
            <Label for="new-email">Email Address *</Label>
            <Input id="new-email" v-model="newEmployee.email" type="email" placeholder="employee@example.com" required />
          </div>

          <div class="space-y-1.5">
            <Label for="new-position">Position *</Label>
            <Input id="new-position" v-model="newEmployee.position" placeholder="Enter position" required />
          </div>

          <div class="space-y-1.5">
            <Label for="new-department">Department *</Label>
            <Select id="new-department" v-model="newEmployee.department" required>
              <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
              <SelectContent>
                <SelectItem v-for="dept in departmentOptions" :key="dept" :value="dept">{{ dept }}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-1.5">
            <Label for="new-hireDate">Hire Date *</Label>
             <Popover>
                <PopoverTrigger as-child>
                  <Button
                    variant="outline"
                    :class="cn(
                      'w-full justify-start text-left font-normal',
                      !newHireDateForPicker && 'text-muted-foreground',
                    )"
                  >
                    <CalendarIcon class="mr-2 h-4 w-4" />
                    {{ newHireDateForPicker ? dateFormatter.format(newHireDateForPicker.toDate(getLocalTimeZone())) : "Pick a date" }}
                  </Button>
                </PopoverTrigger>
                <PopoverContent class="w-auto p-0">
                  <Calendar
                    v-model="newHireDateForPicker"
                     @update:model-value="(dateVal: DateValue | undefined) => {
                        newEmployee.hireDate = dateVal ? dateVal.toString() : '';
                      }"
                    initial-focus
                    :min-value="parseDateValue('1900-01-01')"
                    :max-value="today(getLocalTimeZone()).add({ years: 5 })"
                  />
                </PopoverContent>
              </Popover>
          </div>

          <div class="space-y-1.5">
            <Label for="new-phone">Phone Number</Label>
            <Input id="new-phone" v-model="newEmployee.phone" placeholder="Enter phone number" />
          </div>
          <div class="space-y-1.5">
            <Label for="new-address">Address</Label>
            <Input id="new-address" v-model="newEmployee.address" placeholder="Enter address" />
          </div>

          <div class="space-y-1.5">
            <Label for="new-status">Status *</Label>
            <Select id="new-status" v-model="newEmployee.status" required>
              <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="on_leave">On Leave</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" @click="isAddDialogOpen = false">Cancel</Button>
            <Button @click="addNewEmployee">Add Employee</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>