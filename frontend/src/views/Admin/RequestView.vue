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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Search,
  RefreshCw,
  Pencil,
  Package,
  CalendarDays,
  Archive,
  FolderSearch,
  FilePlus2,
  Trash2, // For remove item
  PlusCircle, // For add item to list
} from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import NavbarView from '@/views/NavbarView.vue'
import { ref, computed, onBeforeMount, watch } from 'vue'
import {
  type DateValue,
  today,
  parseDate as parseDateValue,
  getLocalTimeZone,
  DateFormatter,
} from '@internationalized/date'

// --- Interfaces ---
interface Employee {
  id: string;
  firstName: string;
  lastName: string;
}

type RequestType = 'Equipment' | 'Leave' | 'Resources';
type RequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'In Progress' | 'Completed';

interface ItemDetail {
  name: string;
  quantity: number;
}

interface BaseRequest {
  id: string;
  employeeId: string;
  status: RequestStatus;
}

interface EquipmentRequest extends BaseRequest {
  type: 'Equipment';
  items: ItemDetail[];
}

interface LeaveRequest extends BaseRequest {
  type: 'Leave';
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

interface ResourcesRequest extends BaseRequest {
  type: 'Resources';
  resources: ItemDetail[]; // Similar to equipment items
}

type Request = EquipmentRequest | LeaveRequest | ResourcesRequest;
type NewRequestData = Omit<EquipmentRequest, 'id'> | Omit<LeaveRequest, 'id'> | Omit<ResourcesRequest, 'id'>;


// --- Mock Data ---
const mockEmployees: Employee[] = [
  { id: 'emp-101', firstName: 'Alice', lastName: 'Smith' },
  { id: 'emp-102', firstName: 'Bob', lastName: 'Johnson' },
  { id: 'emp-103', firstName: 'Carol', lastName: 'Williams' },
];

const mockRequests: Request[] = [
  { id: 'req-001', type: 'Equipment', employeeId: 'emp-101', items: [{ name: 'Laptop Pro X', quantity: 1 }, { name: 'Wireless Mouse', quantity: 1}], status: 'Pending' },
  { id: 'req-002', type: 'Leave', employeeId: 'emp-102', startDate: '2024-08-15', endDate: '2024-08-20', status: 'Approved' },
  { id: 'req-003', type: 'Resources', employeeId: 'emp-101', resources: [{name: 'Cloud Server XL Access', quantity: 1}], status: 'In Progress' },
  { id: 'req-004', type: 'Equipment', employeeId: 'emp-103', items: [{ name: 'Ergonomic Keyboard', quantity: 2 }], status: 'Rejected' },
  { id: 'req-005', type: 'Leave', employeeId: 'emp-101', startDate: '2024-09-01', endDate: '2024-09-03', status: 'Completed' },
];

// --- Component State ---
const requests = ref<Request[]>([]);
const employees = ref<Employee[]>([]);
const isLoading = ref(false);
const searchQuery = ref('');

// Edit Dialog
const selectedRequest = ref<Request | null>(null);
const isEditDialogOpen = ref(false);
const editStartDateForPicker = ref<DateValue | undefined>();
const editEndDateForPicker = ref<DateValue | undefined>();
const currentEditItem = ref<ItemDetail>({ name: '', quantity: 1 }); // For adding items in edit dialog

// Add Dialog
const isAddRequestDialogOpen = ref(false);
const newRequest = ref<NewRequestData>(getDefaultNewRequest());
const newStartDateForPicker = ref<DateValue | undefined>();
const newEndDateForPicker = ref<DateValue | undefined>();
const currentNewItem = ref<ItemDetail>({ name: '', quantity: 1 }); // For adding items in new dialog

const requestTypeOptions: RequestType[] = ['Equipment', 'Leave', 'Resources'];
const requestStatusOptions: RequestStatus[] = ['Pending', 'Approved', 'Rejected', 'In Progress', 'Completed'];

// --- Formatters & Helpers ---
const dateFormatter = new DateFormatter(navigator.language || 'en-US', { dateStyle: 'medium' });

function formatDisplayDate(dateString: string): string {
  if (!dateString) return 'N/A';
  try {
    const dateVal = parseDateValue(dateString);
    return dateFormatter.format(dateVal.toDate(getLocalTimeZone()));
  } catch (e) {
    console.warn("Failed to parse/format date string for display:", dateString, e);
    return 'Invalid Date';
  }
}

const getEmployeeById = (employeeId: string): Employee | undefined => {
  return employees.value.find(emp => emp.id === employeeId);
};

const getEmployeeFullName = (employeeId: string): string => {
  const emp = getEmployeeById(employeeId);
  return emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown Employee';
};

const getRequestTypeIcon = (type: RequestType) => {
  switch (type) {
    case 'Equipment': return Package;
    case 'Leave': return CalendarDays;
    case 'Resources': return Archive;
    default: return Package;
  }
};

const getStatusBadgeClass = (status: RequestStatus) => {
  // ... (same as before)
  switch (status) {
    case 'Approved':
    case 'Completed':
      return 'bg-green-500/10 text-green-700 dark:bg-green-500/20 dark:text-green-400 border-green-500/30';
    case 'Pending':
    case 'In Progress':
      return 'bg-yellow-500/10 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400 border-yellow-500/30';
    case 'Rejected':
      return 'bg-red-500/10 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-red-500/30';
    default:
      return 'border-border';
  }
};

function getDefaultNewRequest(defaultType: RequestType = 'Equipment'): NewRequestData {
  const base = {
    employeeId: employees.value.length > 0 ? employees.value[0].id : '',
    status: 'Pending' as RequestStatus,
  };
  if (defaultType === 'Equipment') {
    return { ...base, type: 'Equipment', items: [] };
  } else if (defaultType === 'Leave') {
    const todayVal = today(getLocalTimeZone());
    return { ...base, type: 'Leave', startDate: todayVal.toString(), endDate: todayVal.add({ days: 1 }).toString() };
  } else { // Resources
    return { ...base, type: 'Resources', resources: [] };
  }
}

// --- Computed Properties ---
const filteredRequests = computed(() => {
  if (!searchQuery.value) return requests.value;
  const lowerSearch = searchQuery.value.toLowerCase();
  return requests.value.filter(req => {
    const empName = getEmployeeFullName(req.employeeId).toLowerCase();
    if (empName.includes(lowerSearch)) return true;
    if (req.type.toLowerCase().includes(lowerSearch)) return true;
    if (req.status.toLowerCase().includes(lowerSearch)) return true;
    if (req.type === 'Equipment' && req.items.some(item => item.name.toLowerCase().includes(lowerSearch))) return true;
    if (req.type === 'Resources' && req.resources.some(res => res.name.toLowerCase().includes(lowerSearch))) return true;
    return false;
  });
});

// --- Data Fetching & Actions ---
const fetchRequestsAndEmployees = async () => {
  isLoading.value = true;
  await new Promise(resolve => setTimeout(resolve, 700));
  employees.value = [...mockEmployees];
  requests.value = mockRequests.map(r => JSON.parse(JSON.stringify(r))); // Deep copy for safety
  isLoading.value = false;
  if (!newRequest.value.employeeId && employees.value.length > 0) {
      newRequest.value.employeeId = employees.value[0].id;
  }
};

// --- Edit Dialog Logic ---
const openEditDialog = (request: Request) => {
  selectedRequest.value = JSON.parse(JSON.stringify(request)); // Deep copy
  currentEditItem.value = { name: '', quantity: 1 }; // Reset temporary item

  if (selectedRequest.value?.type === 'Leave') {
    // ... (date picker logic same as before)
    try {
      editStartDateForPicker.value = selectedRequest.value.startDate ? parseDateValue(selectedRequest.value.startDate) : undefined;
      editEndDateForPicker.value = selectedRequest.value.endDate ? parseDateValue(selectedRequest.value.endDate) : undefined;
    } catch (e) {
      console.warn("Error parsing leave dates for picker on open (edit):", e);
      const todayVal = today(getLocalTimeZone());
      editStartDateForPicker.value = todayVal;
      editEndDateForPicker.value = todayVal.add({ days: 1 });
       if (selectedRequest.value) {
          (selectedRequest.value as LeaveRequest).startDate = todayVal.toString();
          (selectedRequest.value as LeaveRequest).endDate = todayVal.add({ days: 1 }).toString();
      }
    }
  } else {
    editStartDateForPicker.value = undefined;
    editEndDateForPicker.value = undefined;
  }
  isEditDialogOpen.value = true;
};

watch(() => selectedRequest.value?.type, (newType, oldType) => {
  if (!isEditDialogOpen.value || !selectedRequest.value || !newType || newType === oldType) return;

  const commonData = {
    id: selectedRequest.value.id,
    employeeId: selectedRequest.value.employeeId,
    status: selectedRequest.value.status,
  };

  if (newType === 'Leave') {
    const todayVal = today(getLocalTimeZone());
    const defaultStart = todayVal.toString();
    const defaultEnd = todayVal.add({ days: 1 }).toString();
    selectedRequest.value = { ...commonData, type: 'Leave', startDate: defaultStart, endDate: defaultEnd };
    editStartDateForPicker.value = parseDateValue(defaultStart);
    editEndDateForPicker.value = parseDateValue(defaultEnd);
  } else if (newType === 'Equipment') {
    selectedRequest.value = { ...commonData, type: 'Equipment', items: [] }; // Initialize items array
    editStartDateForPicker.value = undefined; editEndDateForPicker.value = undefined;
  } else if (newType === 'Resources') {
    selectedRequest.value = { ...commonData, type: 'Resources', resources: [] }; // Initialize resources array
    editStartDateForPicker.value = undefined; editEndDateForPicker.value = undefined;
  }
  currentEditItem.value = { name: '', quantity: 1 }; // Reset temp item on type change
});

const addItemToSelectedRequest = (type: 'Equipment' | 'Resources') => {
  if (!selectedRequest.value || !currentEditItem.value.name || currentEditItem.value.quantity <= 0) {
    useToastService().error({ title: 'Missing Info', description: 'Please provide item/resource name and a valid quantity.' });
    return;
  }
  if (type === 'Equipment' && selectedRequest.value.type === 'Equipment') {
    selectedRequest.value.items.push({ ...currentEditItem.value });
  } else if (type === 'Resources' && selectedRequest.value.type === 'Resources') {
    selectedRequest.value.resources.push({ ...currentEditItem.value });
  }
  currentEditItem.value = { name: '', quantity: 1 }; // Reset form
};

const removeItemFromSelectedRequest = (index: number, type: 'Equipment' | 'Resources') => {
  if (!selectedRequest.value) return;
  if (type === 'Equipment' && selectedRequest.value.type === 'Equipment') {
    selectedRequest.value.items.splice(index, 1);
  } else if (type === 'Resources' && selectedRequest.value.type === 'Resources') {
    selectedRequest.value.resources.splice(index, 1);
  }
};

const saveRequestChanges = () => {
  if (!selectedRequest.value) return;

  if (selectedRequest.value.type === 'Equipment' && selectedRequest.value.items.length === 0) {
     useToastService().error({ title: 'Validation Error', description: 'At least one equipment item is required.' }); return;
  }
  if (selectedRequest.value.type === 'Resources' && selectedRequest.value.resources.length === 0) {
     useToastService().error({ title: 'Validation Error', description: 'At least one resource is required.' }); return;
  }
  if (selectedRequest.value.type === 'Leave') {
    // ... (leave date validation same as before)
    if (editStartDateForPicker.value) (selectedRequest.value as LeaveRequest).startDate = editStartDateForPicker.value.toString();
    else { useToastService().error({ title: 'Validation Error', description: 'Start date is required for leave requests.' }); return; }
    if (editEndDateForPicker.value) (selectedRequest.value as LeaveRequest).endDate = editEndDateForPicker.value.toString();
    else { useToastService().error({ title: 'Validation Error', description: 'End date is required for leave requests.' }); return; }
    if (editStartDateForPicker.value.compare(editEndDateForPicker.value) > 0) {
      useToastService().error({ title: 'Invalid Dates', description: 'End date cannot be before start date.' }); return;
    }
  }

  const index = requests.value.findIndex(r => r.id === selectedRequest.value!.id);
  if (index !== -1) {
    requests.value[index] = JSON.parse(JSON.stringify(selectedRequest.value));
    useToastService().success({ title: 'Success', description: 'Request updated successfully.' });
  } else {
    useToastService().error({ title: 'Error', description: 'Failed to find and update request.' });
  }
  isEditDialogOpen.value = false;
  selectedRequest.value = null;
};

// --- Add New Request Logic ---
const openAddRequestDialog = () => {
  resetNewRequestForm();
  isAddRequestDialogOpen.value = true;
};

const resetNewRequestForm = () => {
  newRequest.value = getDefaultNewRequest('Equipment');
  currentNewItem.value = { name: '', quantity: 1 }; // Reset temporary item
  if (newRequest.value.type === 'Leave') {
    newStartDateForPicker.value = parseDateValue((newRequest.value as Omit<LeaveRequest, 'id'>).startDate);
    newEndDateForPicker.value = parseDateValue((newRequest.value as Omit<LeaveRequest, 'id'>).endDate);
  } else {
    newStartDateForPicker.value = undefined;
    newEndDateForPicker.value = undefined;
  }
};

watch(() => newRequest.value.type, (newType, oldType) => {
  if (!isAddRequestDialogOpen.value || !newType || newType === oldType) return;

  const currentEmployeeId = newRequest.value.employeeId;
  const currentStatus = newRequest.value.status;

  if (newType === 'Leave') {
    const todayVal = today(getLocalTimeZone());
    const defaultStart = todayVal.toString();
    const defaultEnd = todayVal.add({ days: 1 }).toString();
    newRequest.value = { employeeId: currentEmployeeId, status: currentStatus, type: 'Leave', startDate: defaultStart, endDate: defaultEnd };
    newStartDateForPicker.value = parseDateValue(defaultStart);
    newEndDateForPicker.value = parseDateValue(defaultEnd);
  } else if (newType === 'Equipment') {
    newRequest.value = { employeeId: currentEmployeeId, status: currentStatus, type: 'Equipment', items: [] };
    newStartDateForPicker.value = undefined; newEndDateForPicker.value = undefined;
  } else if (newType === 'Resources') {
    newRequest.value = { employeeId: currentEmployeeId, status: currentStatus, type: 'Resources', resources: [] };
    newStartDateForPicker.value = undefined; newEndDateForPicker.value = undefined;
  }
  currentNewItem.value = { name: '', quantity: 1 }; // Reset temp item on type change
});

const addItemToNewRequest = (type: 'Equipment' | 'Resources') => {
  if (!currentNewItem.value.name || currentNewItem.value.quantity <= 0) {
    useToastService().error({ title: 'Missing Info', description: 'Please provide item/resource name and a valid quantity.' });
    return;
  }
  if (type === 'Equipment' && newRequest.value.type === 'Equipment') {
    (newRequest.value as Omit<EquipmentRequest, 'id'>).items.push({ ...currentNewItem.value });
  } else if (type === 'Resources' && newRequest.value.type === 'Resources') {
    (newRequest.value as Omit<ResourcesRequest, 'id'>).resources.push({ ...currentNewItem.value });
  }
  currentNewItem.value = { name: '', quantity: 1 }; // Reset form
};

const removeItemFromNewRequest = (index: number, type: 'Equipment' | 'Resources') => {
  if (type === 'Equipment' && newRequest.value.type === 'Equipment') {
    (newRequest.value as Omit<EquipmentRequest, 'id'>).items.splice(index, 1);
  } else if (type === 'Resources' && newRequest.value.type === 'Resources') {
    (newRequest.value as Omit<ResourcesRequest, 'id'>).resources.splice(index, 1);
  }
};

const addNewRequest = () => {
  if (!newRequest.value.employeeId) {
    useToastService().error({ title: 'Validation Error', description: 'Please select an employee.' }); return;
  }

  let finalNewRequest: Request;
  const newId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  if (newRequest.value.type === 'Equipment') {
    if ((newRequest.value as Omit<EquipmentRequest, 'id'>).items.length === 0) {
      useToastService().error({ title: 'Validation Error', description: 'At least one equipment item is required.' }); return;
    }
    finalNewRequest = { id: newId, ...(newRequest.value as Omit<EquipmentRequest, 'id'>) };
  } else if (newRequest.value.type === 'Resources') {
     if ((newRequest.value as Omit<ResourcesRequest, 'id'>).resources.length === 0) {
      useToastService().error({ title: 'Validation Error', description: 'At least one resource is required.' }); return;
    }
    finalNewRequest = { id: newId, ...(newRequest.value as Omit<ResourcesRequest, 'id'>) };
  } else if (newRequest.value.type === 'Leave') {
    // ... (leave date validation same as before)
    if (!newStartDateForPicker.value || !newEndDateForPicker.value) {
      useToastService().error({ title: 'Validation Error', description: 'Start and End dates are required for leave requests.' }); return;
    }
    if (newStartDateForPicker.value.compare(newEndDateForPicker.value) > 0) {
      useToastService().error({ title: 'Invalid Dates', description: 'End date cannot be before start date.' }); return;
    }
    (newRequest.value as Omit<LeaveRequest, 'id'>).startDate = newStartDateForPicker.value.toString();
    (newRequest.value as Omit<LeaveRequest, 'id'>).endDate = newEndDateForPicker.value.toString();
    finalNewRequest = { id: newId, ...(newRequest.value as Omit<LeaveRequest, 'id'>) };
  } else {
    useToastService().error({ title: 'Error', description: 'Invalid request type.' }); return;
  }

  requests.value.unshift(finalNewRequest);
  useToastService().success({ title: 'Success', description: 'Request added successfully.' });
  isAddRequestDialogOpen.value = false;
};


// --- Lifecycle Hooks ---
onBeforeMount(async () => {
  await fetchRequestsAndEmployees();
});

// --- Mock Toast Service ---
const useToastService = () => ({
  success: (toast: {title: string, description: string}) => console.log(`Toast Success: ${toast.title} - ${toast.description}`),
  error: (toast: {title: string, description: string}) => console.error(`Toast Error: ${toast.title} - ${toast.description}`),
});

</script>

<template>
  <div class="min-h-screen max-w-screen flex flex-col items-center bg-background">
    <NavbarView />

    <main class="container py-8">
      <div class="flex flex-col gap-6">
        <div class="flex flex-col gap-2">
          <h1 class="text-3xl font-bold tracking-tight">Manage Requests</h1>
          <p class="text-muted-foreground">Review, update, and add new employee requests.</p>
        </div>

        <div class="flex flex-col gap-4">
          <div class="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div class="relative w-full sm:w-96">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input v-model="searchQuery" placeholder="Search requests..." class="pl-10" />
            </div>
            <div class="flex gap-2">
                <Button variant="outline" size="sm" @click="fetchRequestsAndEmployees" :disabled="isLoading">
                <RefreshCw class="mr-2 h-4 w-4" :class="{'animate-spin': isLoading}" />
                Refresh
              </Button>
              <Button size="sm" class="text-foreground" @click="openAddRequestDialog">
                <FilePlus2 class="mr-2 h-4 w-4 text-foreground" />
                Add Request
              </Button>
            </div>
          </div>

          <!-- Loading State -->
          <div v-if="isLoading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- Skeleton cards same as before -->
            <Card v-for="i in 3" :key="`skel-req-${i}`">
              <CardHeader><div class="flex justify-between items-start"><div class="space-y-1.5"> <Skeleton class="h-5 w-24" /> <Skeleton class="h-4 w-32" /> </div> <Skeleton class="h-6 w-20 rounded-md" /></div></CardHeader>
              <CardContent class="space-y-2"><Skeleton class="h-4 w-full" /> <Skeleton class="h-4 w-3/4" /></CardContent>
              <CardFooter> <Skeleton class="h-9 w-full" /> </CardFooter>
            </Card>
          </div>

          <!-- Empty State -->
          <div v-else-if="filteredRequests.length === 0" class="flex flex-col items-center justify-center py-16 gap-4 text-center border rounded-lg bg-card">
            <!-- Empty state UI same as before -->
            <FolderSearch class="h-16 w-16 text-muted-foreground" />
            <h3 class="text-xl font-medium">No Requests Found</h3>
            <p class="text-sm text-muted-foreground">No requests match your current search criteria, or none added yet.</p>
             <Button size="sm" @click="openAddRequestDialog" class="mt-2"><FilePlus2 class="mr-2 h-4 w-4" />Add First Request</Button>
          </div>

          <!-- Card Grid -->
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card v-for="request in filteredRequests" :key="request.id" class="flex flex-col">
              <CardHeader>
                <div class="flex justify-between items-start gap-2">
                  <div>
                    <CardTitle class="text-lg flex items-center gap-2">
                      <component :is="getRequestTypeIcon(request.type)" class="h-5 w-5 text-primary flex-shrink-0" />
                      {{ request.type }} Request
                    </CardTitle>
                    <CardDescription>By: {{ getEmployeeFullName(request.employeeId) }}</CardDescription>
                  </div>
                  <Badge :class="cn('text-xs px-2 py-1 capitalize whitespace-nowrap', getStatusBadgeClass(request.status))">
                    {{ request.status }}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent class="flex-grow space-y-1.5 text-sm">
                <template v-if="request.type === 'Equipment'">
                  <p class="font-medium text-muted-foreground">Items:</p>
                  <ul v-if="request.items.length" class="list-disc list-inside ml-1 space-y-0.5">
                    <li v-for="(item, idx) in request.items.slice(0, 3)" :key="`card-item-${idx}`">
                      {{ item.name }} (Qty: {{ item.quantity }})
                    </li>
                  </ul>
                  <p v-if="request.items.length > 3" class="text-xs text-muted-foreground ml-5 italic">+ {{ request.items.length - 3 }} more...</p>
                  <p v-if="!request.items.length" class="text-xs text-muted-foreground ml-1 italic">No items specified.</p>
                </template>
                <template v-else-if="request.type === 'Resources'">
                  <p class="font-medium text-muted-foreground">Resources:</p>
                  <ul v-if="request.resources.length" class="list-disc list-inside ml-1 space-y-0.5">
                    <li v-for="(res, idx) in request.resources.slice(0, 3)" :key="`card-res-${idx}`">
                      {{ res.name }} (Units: {{ res.quantity }})
                    </li>
                  </ul>
                  <p v-if="request.resources.length > 3" class="text-xs text-muted-foreground ml-5 italic">+ {{ request.resources.length - 3 }} more...</p>
                  <p v-if="!request.resources.length" class="text-xs text-muted-foreground ml-1 italic">No resources specified.</p>
                </template>
                <div v-else-if="request.type === 'Leave'">
                  <p><strong class="text-muted-foreground">Start:</strong> {{ formatDisplayDate(request.startDate) }}</p>
                  <p><strong class="text-muted-foreground">End:</strong> {{ formatDisplayDate(request.endDate) }}</p>
                </div>
                <p class="text-xs text-muted-foreground pt-1">ID: {{ request.id }}</p>
              </CardContent>
              <CardFooter class="border-t pt-4">
                <Button variant="outline" size="sm" @click="openEditDialog(request)" class="w-full">
                  <Pencil class="mr-2 h-4 w-4" />
                  Edit Request
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </main>

    <!-- Edit Request Dialog -->
    <Dialog v-model:open="isEditDialogOpen">
      <DialogContent class="sm:max-w-[580px]">
        <DialogHeader>
          <DialogTitle>Edit Request</DialogTitle>
          <DialogDescription>Update the details of the employee's request.</DialogDescription>
        </DialogHeader>
        <div v-if="selectedRequest" class="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4 -mr-4">
          <div class="space-y-1.5">
            <Label for="edit-request-type">Request Type</Label>
            <Select id="edit-request-type" v-model="selectedRequest.type">
              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                <SelectItem v-for="typeOpt in requestTypeOptions" :key="`edit-${typeOpt}`" :value="typeOpt">{{ typeOpt }}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-1.5">
            <Label for="edit-employee">Employee</Label>
            <Select id="edit-employee" v-model="selectedRequest.employeeId">
              <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
              <SelectContent>
                <SelectItem v-for="emp in employees" :key="`edit-emp-${emp.id}`" :value="emp.id">{{ emp.firstName }} {{ emp.lastName }}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Equipment Multiple Items - EDIT -->
          <template v-if="selectedRequest.type === 'Equipment'">
            <div class="space-y-3 border p-3 rounded-md bg-muted/30">
              <Label class="font-semibold">Equipment Items</Label>
              <div v-if="(selectedRequest as EquipmentRequest).items.length > 0" class="space-y-2">
                <div v-for="(item, index) in (selectedRequest as EquipmentRequest).items" :key="`edit-eq-item-${index}`" class="flex items-center justify-between gap-2 p-2 border rounded-md bg-background text-sm">
                  <span>{{ item.name }} (Qty: {{ item.quantity }})</span>
                  <Button variant="ghost" size="icon" @click="removeItemFromSelectedRequest(index, 'Equipment')" class="h-7 w-7">
                    <Trash2 class="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <p v-else class="text-sm text-muted-foreground italic">No equipment items added yet.</p>

              <div class="grid grid-cols-12 gap-2 items-end pt-2 border-t">
                <div class="space-y-1 col-span-6 sm:col-span-7">
                  <Label :for="`edit-current-item-name`" class="text-xs">Item Name</Label>
                  <Input :id="`edit-current-item-name`" v-model="currentEditItem.name" placeholder="e.g., Keyboard" />
                </div>
                <div class="space-y-1 col-span-3 sm:col-span-2">
                  <Label :for="`edit-current-item-qty`" class="text-xs">Qty</Label>
                  <Input :id="`edit-current-item-qty`" v-model.number="currentEditItem.quantity" type="number" placeholder="1" min="1" />
                </div>
                <Button @click="addItemToSelectedRequest('Equipment')" size="sm" class="col-span-3 sm:col-span-3 self-end h-9 text-foreground">
                  <PlusCircle class="mr-1 h-4 w-4 text-foreground" /> Add
                </Button>
              </div>
            </div>
          </template>

          <!-- Resources Multiple Items - EDIT -->
           <template v-if="selectedRequest.type === 'Resources'">
            <div class="space-y-3 border p-3 rounded-md bg-muted/30">
              <Label class="font-semibold">Resources</Label>
              <div v-if="(selectedRequest as ResourcesRequest).resources.length > 0" class="space-y-2">
                <div v-for="(res, index) in (selectedRequest as ResourcesRequest).resources" :key="`edit-res-item-${index}`" class="flex items-center justify-between gap-2 p-2 border rounded-md bg-background text-sm">
                  <span>{{ res.name }} (Units: {{ res.quantity }})</span>
                  <Button variant="ghost" size="icon" @click="removeItemFromSelectedRequest(index, 'Resources')" class="h-7 w-7">
                    <Trash2 class="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <p v-else class="text-sm text-muted-foreground italic">No resources added yet.</p>

              <div class="grid grid-cols-12 gap-2 items-end pt-2 border-t">
                <div class="space-y-1 col-span-6 sm:col-span-7">
                  <Label :for="`edit-current-res-name`" class="text-xs">Resource Name</Label>
                  <Input :id="`edit-current-res-name`" v-model="currentEditItem.name" placeholder="e.g., Software License" />
                </div>
                <div class="space-y-1 col-span-3 sm:col-span-2">
                  <Label :for="`edit-current-res-qty`" class="text-xs">Units</Label>
                  <Input :id="`edit-current-res-qty`" v-model.number="currentEditItem.quantity" type="number" placeholder="1" />
                </div>
                <Button @click="addItemToSelectedRequest('Resources')" size="sm" class="col-span-3 sm:col-span-3 self-end h-9 text-foreground">
                   <PlusCircle class="mr-1 h-4 w-4 text-foreground" /> Add
                </Button>
              </div>
            </div>
          </template>


          <template v-else-if="selectedRequest.type === 'Leave'">
            <!-- Leave fields same as before -->
            <div class="space-y-1.5">
              <Label for="edit-start-date">Start Date</Label>
              <Popover><PopoverTrigger as-child><Button variant="outline" :class="cn('w-full justify-start text-left font-normal', !editStartDateForPicker && 'text-muted-foreground')"><CalendarDays class="mr-2 h-4 w-4" />{{ editStartDateForPicker ? dateFormatter.format(editStartDateForPicker.toDate(getLocalTimeZone())) : "Pick a start date" }}</Button></PopoverTrigger><PopoverContent class="w-auto p-0"><Calendar v-model="editStartDateForPicker" initial-focus :min-value="parseDateValue('2000-01-01')" :max-value="today(getLocalTimeZone()).add({ years: 5 })" /></PopoverContent></Popover>
            </div>
            <div class="space-y-1.5">
              <Label for="edit-end-date">End Date</Label>
               <Popover><PopoverTrigger as-child><Button variant="outline" :class="cn('w-full justify-start text-left font-normal', !editEndDateForPicker && 'text-muted-foreground')"><CalendarDays class="mr-2 h-4 w-4" />{{ editEndDateForPicker ? dateFormatter.format(editEndDateForPicker.toDate(getLocalTimeZone())) : "Pick an end date" }}</Button></PopoverTrigger><PopoverContent class="w-auto p-0"><Calendar v-model="editEndDateForPicker" initial-focus :min-value="editStartDateForPicker || parseDateValue('2000-01-01')" :max-value="today(getLocalTimeZone()).add({ years: 5 })" /></PopoverContent></Popover>
            </div>
          </template>

          <div class="space-y-1.5">
            <Label for="edit-request-status">Status</Label>
            <Select id="edit-request-status" v-model="selectedRequest.status">
              <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
              <SelectContent>
                <SelectItem v-for="statusOpt in requestStatusOptions" :key="`edit-status-${statusOpt}`" :value="statusOpt">{{ statusOpt }}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter v-if="selectedRequest" class="pt-4 border-t">
          <Button variant="outline" @click="isEditDialogOpen = false">Cancel</Button>
          <Button @click="saveRequestChanges" class="text-foreground">Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Add New Request Dialog -->
    <Dialog v-model:open="isAddRequestDialogOpen">
        <DialogContent class="sm:max-w-[580px]">
            <DialogHeader>
            <DialogTitle>Add New Request</DialogTitle>
            <DialogDescription>Fill in the details to create a new employee request.</DialogDescription>
            </DialogHeader>
            <div class="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4 -mr-4">
                <div class="space-y-1.5">
                    <Label for="new-request-type">Request Type *</Label>
                    <Select id="new-request-type" v-model="newRequest.type">
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem v-for="typeOpt in requestTypeOptions" :key="`new-${typeOpt}`" :value="typeOpt">{{ typeOpt }}</SelectItem>
                    </SelectContent>
                    </Select>
                </div>

                <div class="space-y-1.5">
                    <Label for="new-employee">Employee *</Label>
                    <Select id="new-employee" v-model="newRequest.employeeId">
                    <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem v-if="!employees.length" value="" disabled>No employees available</SelectItem>
                        <SelectItem v-for="emp in employees" :key="`new-emp-${emp.id}`" :value="emp.id">{{ emp.firstName }} {{ emp.lastName }}</SelectItem>
                    </SelectContent>
                    </Select>
                </div>

                <!-- Equipment Multiple Items - ADD -->
                <template v-if="newRequest.type === 'Equipment'">
                  <div class="space-y-3 border p-3 rounded-md bg-muted/30">
                    <Label class="font-semibold">Equipment Items *</Label>
                    <div v-if="(newRequest as Omit<EquipmentRequest, 'id'>).items.length > 0" class="space-y-2">
                      <div v-for="(item, index) in (newRequest as Omit<EquipmentRequest, 'id'>).items" :key="`new-eq-item-${index}`" class="flex items-center justify-between gap-2 p-2 border rounded-md bg-background text-sm">
                        <span>{{ item.name }} (Qty: {{ item.quantity }})</span>
                        <Button variant="ghost" size="icon" @click="removeItemFromNewRequest(index, 'Equipment')" class="h-7 w-7">
                           <Trash2 class="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <p v-else class="text-sm text-muted-foreground italic">No equipment items added yet. Add at least one.</p>

                    <div class="grid grid-cols-12 gap-2 items-end pt-2 border-t">
                      <div class="space-y-1 col-span-6 sm:col-span-7">
                        <Label :for="`new-current-item-name`" class="text-xs">Item Name</Label>
                        <Input :id="`new-current-item-name`" v-model="currentNewItem.name" placeholder="e.g., Monitor Arm" />
                      </div>
                      <div class="space-y-1 col-span-3 sm:col-span-2">
                        <Label :for="`new-current-item-qty`" class="text-xs">Qty</Label>
                        <Input :id="`new-current-item-qty`" v-model.number="currentNewItem.quantity" type="number" placeholder="1" min="1" />
                      </div>
                      <Button @click="addItemToNewRequest('Equipment')" size="sm" class="col-span-3 sm:col-span-3 self-end h-9 text-foreground">
                         <PlusCircle class="mr-1 h-4 w-4" /> Add
                      </Button>
                    </div>
                  </div>
                </template>

                <!-- Resources Multiple Items - ADD -->
                <template v-else-if="newRequest.type === 'Resources'">
                  <div class="space-y-3 border p-3 rounded-md bg-muted/30">
                    <Label class="font-semibold">Resources *</Label>
                    <div v-if="(newRequest as Omit<ResourcesRequest, 'id'>).resources.length > 0" class="space-y-2">
                      <div v-for="(res, index) in (newRequest as Omit<ResourcesRequest, 'id'>).resources" :key="`new-res-item-${index}`" class="flex items-center justify-between gap-2 p-2 border rounded-md bg-background text-sm">
                        <span>{{ res.name }} (Units: {{ res.quantity }})</span>
                        <Button variant="ghost" size="icon" @click="removeItemFromNewRequest(index, 'Resources')" class="h-7 w-7">
                          <Trash2 class="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <p v-else class="text-sm text-muted-foreground italic">No resources added yet. Add at least one.</p>

                    <div class="grid grid-cols-12 gap-2 items-end pt-2 border-t">
                      <div class="space-y-1 col-span-6 sm:col-span-7">
                        <Label :for="`new-current-res-name`" class="text-xs">Resource Name</Label>
                        <Input :id="`new-current-res-name`" v-model="currentNewItem.name" placeholder="e.g., Project Z Access" />
                      </div>
                      <div class="space-y-1 col-span-3 sm:col-span-2">
                        <Label :for="`new-current-res-qty`" class="text-xs">Units</Label>
                        <Input :id="`new-current-res-qty`" v-model.number="currentNewItem.quantity" type="number" placeholder="1" />
                      </div>
                      <Button @click="addItemToNewRequest('Resources')" size="sm" class="col-span-3 sm:col-span-3 self-end h-9 text-foreground">
                         <PlusCircle class="mr-1 h-4 w-4 text-foreground" /> Add
                      </Button>
                    </div>
                  </div>
                </template>

                <template v-else-if="newRequest.type === 'Leave'">
                    <!-- Leave fields same as before -->
                     <div class="space-y-1.5">
                        <Label for="new-start-date">Start Date *</Label>
                        <Popover><PopoverTrigger as-child><Button variant="outline" :class="cn('w-full justify-start text-left font-normal', !newStartDateForPicker && 'text-muted-foreground')"><CalendarDays class="mr-2 h-4 w-4" />{{ newStartDateForPicker ? dateFormatter.format(newStartDateForPicker.toDate(getLocalTimeZone())) : "Pick a start date" }}</Button></PopoverTrigger><PopoverContent class="w-auto p-0"><Calendar v-model="newStartDateForPicker" initial-focus :min-value="today(getLocalTimeZone()).subtract({days: 365})" :max-value="today(getLocalTimeZone()).add({ years: 2 })" /></PopoverContent></Popover>
                    </div>
                    <div class="space-y-1.5">
                        <Label for="new-end-date">End Date *</Label>
                        <Popover><PopoverTrigger as-child><Button variant="outline" :class="cn('w-full justify-start text-left font-normal', !newEndDateForPicker && 'text-muted-foreground')"><CalendarDays class="mr-2 h-4 w-4" />{{ newEndDateForPicker ? dateFormatter.format(newEndDateForPicker.toDate(getLocalTimeZone())) : "Pick an end date" }}</Button></PopoverTrigger><PopoverContent class="w-auto p-0"><Calendar v-model="newEndDateForPicker" initial-focus :min-value="newStartDateForPicker || today(getLocalTimeZone()).subtract({days: 365})" :max-value="today(getLocalTimeZone()).add({ years: 2 })" /></PopoverContent></Popover>
                    </div>
                </template>

                <div class="space-y-1.5">
                    <Label for="new-request-status">Initial Status *</Label>
                    <Select id="new-request-status" v-model="newRequest.status">
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem v-for="statusOpt in requestStatusOptions.filter(s => ['Pending', 'Approved'].includes(s))" :key="`new-status-${statusOpt}`" :value="statusOpt">{{ statusOpt }}</SelectItem>
                    </SelectContent>
                    </Select>
                </div>
            </div>
            <DialogFooter class="pt-4 border-t">
                <Button variant="outline" @click="isAddRequestDialogOpen = false">Cancel</Button>
                <Button @click="addNewRequest" class="text-foreground">Add Request</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>

  </div>
</template>