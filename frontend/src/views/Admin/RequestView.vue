// RequestView.vue
<script setup lang="ts">
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar' // This is from Shadcn-Vue
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
  Trash2,
  PlusCircle,
} from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import NavbarView from '@/views/NavbarView.vue'
import { ref, computed, onBeforeMount, watch, type Ref } from 'vue'
import {
  type DateValue,
  today,
  parseDate as parseDateValue,
  getLocalTimeZone,
  DateFormatter,
} from '@internationalized/date'

import { useRequestService } from '@/_services/request.service.ts';
import { useToastService } from '@/_services/toast.service.ts';
import { useEmployeeService } from '@/_services/employee.service.ts';
import { useWorkflowService } from '@/_services/workflow.service'
import type { Employee as BackendEmployeeModel } from '@/models/employee';

import type {
  Request as BackendRequestModel,
  RequestItemDetail as BackendRequestItemDetail,
  NewLeaveRequestPayload,
  NewItemRequestPayload,
  UpdateRequestPayload,
} from '@/models/request';
import type { Toast } from '@/models/toast'
import type { LeaveWorkflowPayload, ResourcesWorkflowPayload } from '@/models/workflow'

// --- Interfaces & Types ---
interface Employee {
  id: number;
  firstName: string;
  lastName: string;
}

type RequestType = 'Equipment' | 'Leave' | 'Resources';
type RequestStatus = 'Pending' | 'Approved' | 'Rejected' ;

interface ItemDetail {
  name: string;
  quantity: number;
}

interface FrontendBaseRequest {
  id: number;
  employeeId: number;
  status: RequestStatus;
  requestDate?: string;
}

interface FrontendEquipmentRequest extends FrontendBaseRequest {
  type: 'Equipment';
  items: ItemDetail[];
}

interface FrontendLeaveRequest extends FrontendBaseRequest {
  type: 'Leave';
  startDate: string;
  endDate: string;
}

interface FrontendResourcesRequest extends FrontendBaseRequest {
  type: 'Resources';
  resources: ItemDetail[];
}

type FrontendUnifiedRequest = FrontendEquipmentRequest | FrontendLeaveRequest | FrontendResourcesRequest;

interface RequestFormState {
  id?: number;
  type: RequestType;
  employeeId?: number;
  status: RequestStatus;
  requestDate?: string;
  startDate?: string;
  endDate?: string;
  items: ItemDetail[];
}

// --- Component State ---
const formatEmployeeId = (id: number) => `EMP-${String(id).padStart(3, '0')}`;
const requests = ref<FrontendUnifiedRequest[]>([]);
const employees = ref<Employee[]>([]);
const isLoading = ref(false);
const searchQuery = ref('');

const requestService = useRequestService();
const employeeService = useEmployeeService();
const toastService = useToastService();
const workflowService = useWorkflowService();

// Edit Dialog
const selectedRequestForEdit = ref<RequestFormState | null>(null);
const isEditDialogOpen = ref(false);
const editRequestDateForPicker = ref<DateValue | undefined>(); // For Request Date
const editStartDateForPicker = ref<DateValue | undefined>();
const editEndDateForPicker = ref<DateValue | undefined>();

// Add Dialog
const isAddRequestDialogOpen = ref(false);
const newRequestForm = ref<RequestFormState>(getDefaultRequestFormState());
const newRequestDateForPicker = ref<DateValue | undefined>(); // For Request Date
const newStartDateForPicker = ref<DateValue | undefined>();
const newEndDateForPicker = ref<DateValue | undefined>();

const requestTypeOptions: RequestType[] = ['Equipment', 'Leave', 'Resources'];
const requestStatusOptions: RequestStatus[] = ['Pending', 'Approved', 'Rejected'];

// --- Formatters & Helpers ---
const dateFormatter = new DateFormatter(navigator.language || 'en-US', { dateStyle: 'medium' });

function formatDisplayDate(dateString?: string): string {
  if (!dateString) return 'N/A';
  try {
    const dateVal = parseDateValue(dateString);
    return dateFormatter.format(dateVal.toDate(getLocalTimeZone()));
  } catch (e) {
    console.warn("Failed to parse/format date string for display:", dateString, e);
    return 'Invalid Date';
  }
}

const getEmployeeById = (employeeId?: number): Employee | undefined => {
  if (employeeId === undefined) return undefined;
  return employees.value.find(emp => emp.id === employeeId);
};

const getEmployeeFullName = (employeeId?: number): string => {
  if (employeeId === undefined) return 'Unassigned';
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
  switch (status) {
    case 'Approved':
      return 'bg-green-500/10 text-green-700 dark:bg-green-500/20 dark:text-green-400 border-green-500/30';
    case 'Pending':
      return 'bg-yellow-500/10 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400 border-yellow-500/30';
    case 'Rejected':
      return 'bg-red-500/10 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-red-500/30';
    default: return 'border-border';
  }
};

function getDefaultRequestFormState(defaultType: RequestType = 'Equipment'): RequestFormState {
  const todayDateString = today(getLocalTimeZone()).toString();
  const base = {
    employeeId: employees.value.length > 0 ? employees.value[0].id : undefined,
    status: 'Pending' as RequestStatus,
    requestDate: todayDateString,
    items: []
  };
  if (defaultType === 'Leave') {
    return { ...base, type: 'Leave', startDate: todayDateString, endDate: today(getLocalTimeZone()).add({ days: 1 }).toString() };
  } else if (defaultType === 'Equipment') {
    return { ...base, type: 'Equipment', items: [{ name: '', quantity: 1 }] };
  } else { // Resources
    return { ...base, type: 'Resources', items: [{ name: '', quantity: 1 }] };
  }
}

// --- Computed Properties ---
const filteredRequests = computed(() => {
  // Apply search filter if searchQuery exists
  const results = !searchQuery.value 
    ? [...requests.value] 
    : requests.value.filter(req => {
        const lowerSearch = searchQuery.value.toLowerCase();
        const empName = getEmployeeFullName(req.employeeId).toLowerCase();
        
        return (
          empName.includes(lowerSearch) ||
          req.type.toLowerCase().includes(lowerSearch) ||
          req.status.toLowerCase().includes(lowerSearch) ||
          (req.type === 'Equipment' && req.items.some(item => 
            item.name.toLowerCase().includes(lowerSearch))) ||
          (req.type === 'Resources' && req.resources.some(res => 
            res.name.toLowerCase().includes(lowerSearch)))
        );
      });

  // Sort by ID in ascending order (smaller IDs first)
  return results.sort((a, b) => b.id - a.id);
});

// --- Data Fetching & Mapping ---
function mapBackendRequestToFrontend(backendReq: BackendRequestModel): FrontendUnifiedRequest | null {
  const common = {
    id: backendReq.id,
    employeeId: backendReq.employeeId,
    status: backendReq.status as RequestStatus,
    requestDate: backendReq.requestDate,
  };
  const type = backendReq.type as RequestType;

  if (type === 'Leave' && backendReq.requestLeave) {
    return { ...common, type: 'Leave', startDate: backendReq.requestLeave.startDate, endDate: backendReq.requestLeave.endDate };
  } else if ((type === 'Equipment' || type === 'Resources') && backendReq.requestItems) {
    const items = backendReq.requestItems.map(item => ({ name: item.name, quantity: item.quantity }));
    if (type === 'Equipment') {
      return { ...common, type: 'Equipment', items: items };
    } else {
      return { ...common, type: 'Resources', resources: items };
    }
  }
  console.warn(`Could not map backend request: ID ${backendReq.id}, Type ${backendReq.type}.`);
  return null;
}

function mapBackendEmployeeToFrontend(backendEmp: BackendEmployeeModel): Employee {
    return { id: backendEmp.id, firstName: backendEmp.account?.firstName || 'N/A', lastName: backendEmp.account?.lastName || 'N/A' };
}

const fetchRequestsAndEmployees = async () => {
  isLoading.value = true;
  try {
    const backendEmployees = await employeeService.getAll();
    employees.value = backendEmployees.map(mapBackendEmployeeToFrontend);
    if (employees.value.length > 0) {
      if (newRequestForm.value.employeeId === undefined) newRequestForm.value.employeeId = employees.value[0].id;
        if (selectedRequestForEdit.value && selectedRequestForEdit.value.employeeId === undefined) selectedRequestForEdit.value.employeeId = employees.value[0].id;
      }
    const backendRequests = await requestService.getAll();
    console.log(backendRequests);
    requests.value = backendRequests.map(mapBackendRequestToFrontend).filter(r => r !== null) as FrontendUnifiedRequest[];
    console.log(requests.value);
  } catch (error) { console.error("Error fetching data:", error); }
  finally { isLoading.value = false; }
};

// --- Item Management for Dialogs ---
const addNewItemRow = (formRefValue: RequestFormState | null) => {
  if (!formRefValue) return;
  formRefValue.items.push({ name: '', quantity: 1 });
};

const removeItemRow = (formRefValue: RequestFormState | null, index: number) => {
  if (!formRefValue) return;
  formRefValue.items.splice(index, 1);
  if ((formRefValue.type === 'Equipment' || formRefValue.type === 'Resources') && formRefValue.items.length === 0) {
    addNewItemRow(formRefValue);
  }
};

// --- Edit Dialog Logic ---
const openEditDialog = (request: FrontendUnifiedRequest) => {
  let formState: RequestFormState;
  if (request.type === 'Leave') {
    formState = {
        id: request.id, type: 'Leave', employeeId: request.employeeId, status: request.status,
        requestDate: request.requestDate, startDate: request.startDate, endDate: request.endDate, items: []
    };
    try {
      editRequestDateForPicker.value = request.requestDate ? parseDateValue(request.requestDate) : undefined;
      editStartDateForPicker.value = request.startDate ? parseDateValue(request.startDate) : undefined;
      editEndDateForPicker.value = request.endDate ? parseDateValue(request.endDate) : undefined;
    } catch (e) {
      const todayVal = today(getLocalTimeZone());
      editRequestDateForPicker.value = todayVal; // Default if parsing fails
      editStartDateForPicker.value = todayVal;
      editEndDateForPicker.value = todayVal.add({ days: 1 });
      formState.requestDate = todayVal.toString();
      formState.startDate = todayVal.toString();
      formState.endDate = todayVal.add({days: 1}).toString();
    }
  } else { // Equipment or Resources
    const baseItems = request.type === 'Equipment' ? request.items : request.resources;
    formState = {
        id: request.id, type: request.type, employeeId: request.employeeId, status: request.status,
        requestDate: request.requestDate, items: JSON.parse(JSON.stringify(baseItems))
    };
    if (formState.items.length === 0) formState.items.push({ name: '', quantity: 1});
    try {
        editRequestDateForPicker.value = request.requestDate ? parseDateValue(request.requestDate) : undefined;
    } catch (e) {
        editRequestDateForPicker.value = today(getLocalTimeZone());
        formState.requestDate = today(getLocalTimeZone()).toString();
    }
    editStartDateForPicker.value = undefined; editEndDateForPicker.value = undefined;
  }
  selectedRequestForEdit.value = formState;
  isEditDialogOpen.value = true;
};

watch(() => selectedRequestForEdit.value?.type, (newType, oldType) => {
  if (!isEditDialogOpen.value || !selectedRequestForEdit.value || !newType || newType === oldType) return;
  const currentForm = selectedRequestForEdit.value;
  const commonData = { id: currentForm.id, employeeId: currentForm.employeeId, status: currentForm.status, requestDate: currentForm.requestDate };

  if (newType === 'Leave') {
    const todayVal = today(getLocalTimeZone());
    selectedRequestForEdit.value = { ...commonData, type: 'Leave', startDate: currentForm.startDate || todayVal.toString(), endDate: currentForm.endDate || todayVal.add({ days: 1 }).toString(), items: [] };
    if (selectedRequestForEdit.value.requestDate) editRequestDateForPicker.value = parseDateValue(selectedRequestForEdit.value.requestDate);
    editStartDateForPicker.value = parseDateValue(selectedRequestForEdit.value.startDate!);
    editEndDateForPicker.value = parseDateValue(selectedRequestForEdit.value.endDate!);
  } else {
    selectedRequestForEdit.value = { ...commonData, type: newType as 'Equipment' | 'Resources', items: currentForm.type === 'Leave' ? [{ name: '', quantity: 1 }] : (currentForm.items.length > 0 ? currentForm.items : [{name: '', quantity: 1}]) };
    if (selectedRequestForEdit.value.requestDate) editRequestDateForPicker.value = parseDateValue(selectedRequestForEdit.value.requestDate);
    editStartDateForPicker.value = undefined; editEndDateForPicker.value = undefined;
  }
});

const saveRequestChanges = async () => {
  if (!selectedRequestForEdit.value || selectedRequestForEdit.value.id === undefined) {
    
    return;
  }
    isLoading.value = true;

  const form = selectedRequestForEdit.value;
  let payload: UpdateRequestPayload = { status: form.status }; // Request date not typically updated via PUT payload

  if (form.type === 'Equipment' || form.type === 'Resources') {
    const validItems = form.items.filter(item => item.name && item.quantity > 0);
    if (validItems.length === 0) {
    isLoading.value = false;

      toastService.error({ title: 'Validation Error', description: `At least one valid ${form.type.toLowerCase()} item/resource (name and quantity > 0) is required.` } as Toast); return;
    }
    payload.items = validItems.map(item => ({ name: item.name, quantity: item.quantity }));
  } else if (form.type === 'Leave') {
    if (!editStartDateForPicker.value || !editEndDateForPicker.value) {
    isLoading.value = false;
      toastService.error({ title: 'Validation Error', description: 'Start and End dates are required.' } as Toast); return;
    }
    if (editStartDateForPicker.value.compare(editEndDateForPicker.value) > 0) {
    isLoading.value = false;
      toastService.error({ title: 'Invalid Dates', description: 'End date cannot be before start date.' } as Toast); return;
    }
    payload.startDate = editStartDateForPicker.value.toString();
    payload.endDate = editEndDateForPicker.value.toString();
  }
  if(form.type==='Leave') await workflowService.createLeaveWorkflow({
      employeeId: form.employeeId,
      startDate: editStartDateForPicker.value!.toString(),
      endDate: editEndDateForPicker.value!.toString()
    } as LeaveWorkflowPayload)
    else{
      await workflowService.createResourcesWorkflow({
        employeeId: form.employeeId,
        items: form.items
      } as ResourcesWorkflowPayload)
    }
  isLoading.value = true;
  try {
    await requestService.update(form.id!, payload);
    isEditDialogOpen.value = false; selectedRequestForEdit.value = null;
    isLoading.value = false;
    await fetchRequestsAndEmployees();
  } catch (error) { console.error("Error updating request:", error); }
  finally { isLoading.value = false; }
};

// --- Add New Request Logic ---
const openAddRequestDialog = () => {
  const currentEmployeeId = newRequestForm.value.employeeId || (employees.value.length > 0 ? employees.value[0].id : undefined);
  newRequestForm.value = getDefaultRequestFormState('Equipment');
  newRequestForm.value.employeeId = currentEmployeeId;

  try {
    newRequestDateForPicker.value = newRequestForm.value.requestDate ? parseDateValue(newRequestForm.value.requestDate) : today(getLocalTimeZone());
  } catch {
    newRequestDateForPicker.value = today(getLocalTimeZone());
    newRequestForm.value.requestDate = newRequestDateForPicker.value.toString();
  }

  if (newRequestForm.value.type === 'Leave') {
    newStartDateForPicker.value = parseDateValue(newRequestForm.value.startDate!);
    newEndDateForPicker.value = parseDateValue(newRequestForm.value.endDate!);
  } else {
    newStartDateForPicker.value = undefined; newEndDateForPicker.value = undefined;
  }
  isAddRequestDialogOpen.value = true;
};

watch(() => newRequestForm.value.type, (newType, oldType) => {
  if (!isAddRequestDialogOpen.value || !newType || newType === oldType) return;
  const { employeeId, status, requestDate } = newRequestForm.value; // Keep existing requestDate

  if (newType === 'Leave') {
    const todayVal = today(getLocalTimeZone());
    newRequestForm.value = { employeeId, status, requestDate, type: 'Leave', startDate: todayVal.toString(), endDate: todayVal.add({ days: 1 }).toString(), items: [] };
    newStartDateForPicker.value = parseDateValue(newRequestForm.value.startDate!);
    newEndDateForPicker.value = parseDateValue(newRequestForm.value.endDate!);
  } else {
    newRequestForm.value = { employeeId, status, requestDate, type: newType as 'Equipment' | 'Resources', items: [{ name: '', quantity: 1 }] };
    newStartDateForPicker.value = undefined; newEndDateForPicker.value = undefined;
  }
   // Ensure newRequestDateForPicker is in sync if requestDate was kept
  if (newRequestForm.value.requestDate) {
      try {
        newRequestDateForPicker.value = parseDateValue(newRequestForm.value.requestDate);
      } catch {
          newRequestDateForPicker.value = today(getLocalTimeZone()); // Fallback
          newRequestForm.value.requestDate = newRequestDateForPicker.value.toString();
      }
  }
});

const addNewRequest = async () => {
  isLoading.value = true;
  const form = newRequestForm.value;
  if (form.employeeId === undefined) {
    toastService.error({ title: 'Validation Error', description: 'Please select an employee.' } as Toast); return;
  }
  if (!form.requestDate) { // Ensure requestDate is set
    toastService.error({ title: 'Validation Error', description: 'Request date is required.' } as Toast); return;
  }

  let payload: NewLeaveRequestPayload | NewItemRequestPayload;

  if (form.type === 'Equipment' || form.type === 'Resources') {
    const validItems = form.items.filter(item => item.name && item.quantity > 0);
    if (validItems.length === 0) {
      isLoading.value = false;
      toastService.error({ title: 'Validation Error', description: `At least one valid ${form.type.toLowerCase()} item/resource (name and quantity > 0) is required.` } as Toast); return;
    }
    payload = { employeeId: form.employeeId, type: form.type, status: form.status, requestDate: form.requestDate, items: validItems.map(item => ({ name: item.name, quantity: item.quantity })) };
  } else if (form.type === 'Leave') {
    if (!newStartDateForPicker.value || !newEndDateForPicker.value) {
      isLoading.value = false;
      toastService.error({ title: 'Validation Error', description: 'Start and End dates are required.' } as Toast); return;
    }
    if (newStartDateForPicker.value.compare(newEndDateForPicker.value) > 0) {
      isLoading.value = false;
      toastService.error({ title: 'Invalid Dates', description: 'End date cannot be before start date.' } as Toast); return;
    }
    payload = { employeeId: form.employeeId, type: 'Leave', status: form.status, requestDate: form.requestDate, startDate: newStartDateForPicker.value.toString(), endDate: newEndDateForPicker.value.toString() };
  } else {
    isLoading.value = false;
    toastService.error({ title: 'Error', description: 'Invalid request type.' } as Toast); return;
  }
  try {
    await requestService.create(payload);
    if(form.type==='Leave') await workflowService.createLeaveWorkflow({
      employeeId: form.employeeId,
      startDate: newStartDateForPicker.value!.toString(),
      endDate: newEndDateForPicker.value!.toString()
    } as LeaveWorkflowPayload)
    else{
      await workflowService.createResourcesWorkflow({
        employeeId: form.employeeId,
        items: form.items
      } as ResourcesWorkflowPayload)
    }
    isLoading.value = false;
    isAddRequestDialogOpen.value = false;
    await fetchRequestsAndEmployees();
  } catch (error) { console.error("Error adding new request:", error); }
  finally { isLoading.value = false; }
};

// --- Lifecycle Hooks ---
onBeforeMount(async () => { await fetchRequestsAndEmployees(); });

// Watchers for date pickers
watch(newRequestDateForPicker, (val) => { if(val) newRequestForm.value.requestDate = val.toString(); });
watch(editRequestDateForPicker, (val) => { if(selectedRequestForEdit.value && val) selectedRequestForEdit.value.requestDate = val.toString();}); // Not editable, but good practice

watch(newStartDateForPicker, (val) => { if (newRequestForm.value?.type === 'Leave' && val) newRequestForm.value.startDate = val.toString(); });
watch(newEndDateForPicker, (val) => { if (newRequestForm.value?.type === 'Leave' && val) newRequestForm.value.endDate = val.toString(); });
watch(editStartDateForPicker, (val) => { if (selectedRequestForEdit.value?.type === 'Leave' && val) selectedRequestForEdit.value.startDate = val.toString(); });
watch(editEndDateForPicker, (val) => { if (selectedRequestForEdit.value?.type === 'Leave' && val) selectedRequestForEdit.value.endDate = val.toString(); });

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

          <div v-if="isLoading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card v-for="i in 3" :key="`skel-req-${i}`">
              <CardHeader><div class="flex justify-between items-start"><div class="space-y-1.5"> <Skeleton class="h-5 w-24" /> <Skeleton class="h-4 w-32" /> </div> <Skeleton class="h-6 w-20 rounded-md" /></div></CardHeader>
              <CardContent class="space-y-2"><Skeleton class="h-4 w-full" /> <Skeleton class="h-4 w-3/4" /></CardContent>
              <CardFooter> <Skeleton class="h-9 w-full" /> </CardFooter>
            </Card>
          </div>

          <div v-else-if="filteredRequests.length === 0 && !isLoading" class="flex flex-col items-center justify-center py-16 gap-4 text-center border rounded-lg bg-card">
            <FolderSearch class="h-16 w-16 text-muted-foreground" />
            <h3 class="text-xl font-medium">No Requests Found</h3>
            <p class="text-sm text-muted-foreground">No requests match your criteria, or none have been added yet.</p>
             <Button size="sm" @click="openAddRequestDialog" class="mt-2 text-foreground"><FilePlus2 class="mr-2 h-4 w-4" />Add First Request</Button>
          </div>

          <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card v-for="request in filteredRequests" :key="request.id" class="flex flex-col">
              <CardHeader>
                <div class="flex justify-between items-start gap-2">
                  <div>
                    <CardTitle class="text-lg flex items-center gap-2">
                      <component :is="getRequestTypeIcon(request.type)" class="h-5 w-5 text-primary flex-shrink-0" />
                      {{ request.type }} Request
                    </CardTitle>
                    <CardDescription>By: {{ getEmployeeFullName(request.employeeId) }} ({{ formatEmployeeId(request.employeeId) }})</CardDescription>
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
                    <li v-for="(item, idx) in request.items.slice(0, 3)" :key="`card-item-${request.id}-${idx}`">
                      {{ item.name }} (Qty: {{ item.quantity }})
                    </li>
                  </ul>
                  <p v-if="request.items.length > 3" class="text-xs text-muted-foreground ml-5 italic">+ {{ request.items.length - 3 }} more...</p>
                  <p v-if="!request.items.length" class="text-xs text-muted-foreground ml-1 italic">No items specified.</p>
                </template>
                <template v-else-if="request.type === 'Resources'">
                  <p class="font-medium text-muted-foreground">Resources:</p>
                  <ul v-if="request.resources.length" class="list-disc list-inside ml-1 space-y-0.5">
                    <li v-for="(res, idx) in request.resources.slice(0, 3)" :key="`card-res-${request.id}-${idx}`">
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
                <p class="text-xs text-muted-foreground pt-1">Req. Date: {{ formatDisplayDate(request.requestDate) }}</p>
                <p class="text-xs text-muted-foreground">ID: {{ request.id }}</p>
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
  <DialogContent class="sm:max-w-[620px]">
    <DialogHeader>
      <DialogTitle>Edit Request</DialogTitle>
      <DialogDescription>Update the details of the employee's request.</DialogDescription>
    </DialogHeader>
    <div v-if="selectedRequestForEdit" class="grid gap-8 py-4 max-h-[70vh] overflow-y-auto -mr-4 w-full">
      <div class="grid grid-cols-2 gap-4 w-full">
        <div class="space-y-1.5 w-full">
          <Label for="edit-employee">Employee *</Label>
          <Select id="edit-employee" v-model="selectedRequestForEdit.employeeId">
            <SelectTrigger class="w-full"><SelectValue placeholder="Select employee" /></SelectTrigger>
            <SelectContent>
              <SelectItem v-if="!employees.length" :value="null" disabled>No employees loaded</SelectItem>
              <SelectItem v-for="emp in employees" :key="`edit-emp-${emp.id}`" :value="emp.id">{{ `${formatEmployeeId(emp.id)} (${emp.firstName} ${emp.lastName})` }}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div class="space-y-1.5 w-full">
          <Label for="edit-request-date">Request Date</Label>
          <Popover>
            <PopoverTrigger as-child>
              <Button
                variant="outline"
                :class="cn('w-full justify-start text-left font-normal', !editRequestDateForPicker && 'text-muted-foreground')"
                disabled
              >
                <CalendarDays class="mr-2 h-4 w-4" />
                {{ editRequestDateForPicker ? dateFormatter.format(editRequestDateForPicker.toDate(getLocalTimeZone())) : "Pick a date" }}
              </Button>
            </PopoverTrigger>
          </Popover>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4 w-full">
        <div class="space-y-1.5 w-full">
          <Label for="edit-request-type">Request Type</Label>
          <Select id="edit-request-type" v-model="selectedRequestForEdit.type">
            <SelectTrigger class="w-full"><SelectValue placeholder="Select type" /></SelectTrigger>
            <SelectContent>
              <SelectItem v-for="typeOpt in requestTypeOptions" :key="`edit-${typeOpt}`" :value="typeOpt">{{ typeOpt }}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div class="space-y-1.5 w-full">
          <Label for="edit-request-status">Status</Label>
          <Select id="edit-request-status" v-model="selectedRequestForEdit.status">
            <SelectTrigger class="w-full"><SelectValue placeholder="Select status" /></SelectTrigger>
            <SelectContent>
              <SelectItem v-for="statusOpt in requestStatusOptions" :key="`edit-status-${statusOpt}`" :value="statusOpt">{{ statusOpt }}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <template v-if="selectedRequestForEdit.type === 'Equipment' || selectedRequestForEdit.type === 'Resources'">
        <div class="space-y-3 border p-3 rounded-md bg-muted/30">
          <Label class="font-semibold">{{ selectedRequestForEdit.type === 'Equipment' ? 'Equipment Items' : 'Resources' }} *</Label>
          <div v-if="selectedRequestForEdit.items.length > 0" class="space-y-2">
            <div v-for="(item, index) in selectedRequestForEdit.items" :key="`edit-dialog-item-row-${index}`" class="grid grid-cols-10 gap-2 items-center"> 
              <div class="col-span-6">
                <Input v-model="item.name" :placeholder="selectedRequestForEdit.type === 'Equipment' ? 'Item Name' : 'Resource Name'" class="text-sm h-9" />
              </div>
              <div class="col-span-3">
                <Input v-model.number="item.quantity" type="number" :placeholder="selectedRequestForEdit.type === 'Equipment' ? 'Qty' : 'Units'" min="1" class="text-sm h-9"/>
              </div>
              <div class="col-span-1 flex justify-end"> 
                <Button variant="ghost" size="icon" @click="removeItemRow(selectedRequestForEdit, index)" class="h-9 w-9">
                  <Trash2 class="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </div>
          <p v-else class="text-sm text-muted-foreground italic">No {{selectedRequestForEdit.type.toLowerCase()}} added. Click "Add New" to start.</p>
          <Button @click="addNewItemRow(selectedRequestForEdit)" variant="outline" size="sm" class="mt-2 w-full">
            <PlusCircle class="mr-2 h-4 w-4" /> Add New {{ selectedRequestForEdit.type === 'Equipment' ? 'Item' : 'Resource' }}
          </Button>
        </div>
      </template>

      <template v-else-if="selectedRequestForEdit.type === 'Leave'">
        <div class="space-y-1.5 w-full">
          <Label for="edit-start-date">Start Date *</Label>
          <Popover>
            <PopoverTrigger as-child>
              <Button variant="outline" :class="cn('w-full justify-start text-left font-normal', !editStartDateForPicker && 'text-muted-foreground')">
                <CalendarDays class="mr-2 h-4 w-4" />
                {{ editStartDateForPicker ? dateFormatter.format(editStartDateForPicker.toDate(getLocalTimeZone())) : "Pick a start date" }}
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-auto p-0">
              <Calendar v-model="editStartDateForPicker" initial-focus :min-value="parseDateValue('2000-01-01')" :max-value="today(getLocalTimeZone()).add({ years: 5 })" />
            </PopoverContent>
          </Popover>
        </div>
        <div class="space-y-1.5 w-full">
          <Label for="edit-end-date">End Date *</Label>
          <Popover>
            <PopoverTrigger as-child>
              <Button variant="outline" :class="cn('w-full justify-start text-left font-normal', !editEndDateForPicker && 'text-muted-foreground')">
                <CalendarDays class="mr-2 h-4 w-4" />
                {{ editEndDateForPicker ? dateFormatter.format(editEndDateForPicker.toDate(getLocalTimeZone())) : "Pick an end date" }}
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-auto p-0">
              <Calendar v-model="editEndDateForPicker" initial-focus :min-value="editStartDateForPicker || parseDateValue('2000-01-01')" :max-value="today(getLocalTimeZone()).add({ years: 5 })" />
            </PopoverContent>
          </Popover>
        </div>
      </template>
    </div>
    <DialogFooter class="pt-4 border-t">
      <Button variant="outline" @click="isEditDialogOpen = false">Cancel</Button>
      <Button @click="saveRequestChanges" class="text-foreground" :disabled="isLoading">
        <RefreshCw v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
        {{ isLoading ? 'Saving...' : 'Save Changes' }}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

    <!-- Add New Request Dialog -->
    <Dialog v-model:open="isAddRequestDialogOpen">
        <DialogContent class="sm:max-w-[620px]">
            <DialogHeader>
            <DialogTitle>Add New Request</DialogTitle>
            <DialogDescription>Fill in the details to create a new employee request.</DialogDescription>
            </DialogHeader>
            <div class="grid gap-8 py-4 max-h-[70vh] overflow-y-auto -mr-4 w-full">
                <div class="grid grid-cols-2 gap-4 w-full">
                  <div class="space-y-1.5 w-full">
                    <Label for="new-employee">Employee *</Label>
                    <Select id="new-employee" v-model="newRequestForm.employeeId">
                      <SelectTrigger class="w-full"><SelectValue  placeholder="Select employee" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem v-if="!employees.length" :value="null" disabled>No employees available</SelectItem>
                        <SelectItem v-for="emp in employees" :key="`new-emp-${emp.id}`" :value="emp.id">{{ `${formatEmployeeId(emp.id)} (${emp.firstName} ${emp.lastName})` }}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                    
                    <div class="space-y-1.5">
                        <Label for="new-request-date">Request Date *</Label>
                        <Popover>
                            <PopoverTrigger as-child>
                                <Button
                                variant="outline"
                                :class="cn('w-full justify-start text-left font-normal', !newRequestDateForPicker && 'text-muted-foreground')"
                                >
                                <CalendarDays class="mr-2 h-4 w-4" />
                                {{ newRequestDateForPicker ? dateFormatter.format(newRequestDateForPicker.toDate(getLocalTimeZone())) : "Pick a date" }}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent class="w-auto p-0">
                                <Calendar v-model="newRequestDateForPicker" initial-focus :min-value="today(getLocalTimeZone()).subtract({years:1})" :max-value="today(getLocalTimeZone()).add({years:1})" />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4 w-full">
                    <div class="space-y-1.5 col-span-1 w-full">
                        <Label for="new-request-type">Request Type *</Label>
                        <Select id="new-request-type" v-model="newRequestForm.type">
                        <SelectTrigger class="w-full"><SelectValue class="w-full" placeholder="Select type" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem v-for="typeOpt in requestTypeOptions" :key="`new-${typeOpt}`" :value="typeOpt">{{ typeOpt }}</SelectItem>
                        </SelectContent>
                        </Select>
                    </div>
                  
                  <div class="space-y-1.5">
                    <Label for="new-request-status">Initial Status *</Label>
                    <Select id="new-request-status" v-model="newRequestForm.status">
                    <SelectTrigger class="w-full"><SelectValue  placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem v-for="statusOpt in requestStatusOptions.filter(s => ['Pending'].includes(s))" :key="`new-status-${statusOpt}`" :value="statusOpt">{{ statusOpt }}</SelectItem>
                    </SelectContent>
                    </Select>
                </div>
                </div>

                <template v-if="newRequestForm.type === 'Equipment' || newRequestForm.type === 'Resources'">
                  <div class="space-y-3 border p-3 rounded-md bg-muted/30">
                    <Label class="font-semibold">{{ newRequestForm.type === 'Equipment' ? 'Equipment Items' : 'Resources' }} *</Label>
                     <div v-if="newRequestForm.items.length > 0" class="space-y-2">
                        <div v-for="(item, index) in newRequestForm.items" :key="`new-dialog-item-row-${index}`" class="grid grid-cols-10 gap-2 items-center">
                          <div class="col-span-6">
                             <Input v-model="item.name" :placeholder="newRequestForm.type === 'Equipment' ? 'Item Name' : 'Resource Name'" class="text-sm h-9"/>
                          </div>
                          <div class="col-span-3">
                             <Input v-model.number="item.quantity" type="number" :placeholder="newRequestForm.type === 'Equipment' ? 'Qty' : 'Units'" min="1" class="text-sm h-9"/>
                          </div>
                           <div class="col-span-1 flex justify-end">
                            <Button variant="ghost" size="icon" @click="removeItemRow(newRequestForm, index)" class="h-9 w-9">
                              <Trash2 class="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                    </div>
                    <p v-else class="text-sm text-muted-foreground italic">No {{newRequestForm.type.toLowerCase()}} added. Click "Add New" to start.</p>
                    <Button @click="addNewItemRow(newRequestForm)" variant="outline" size="sm" class="mt-2 w-full">
                        <PlusCircle class="mr-2 h-4 w-4" /> Add New {{ newRequestForm.type === 'Equipment' ? 'Item' : 'Resource' }}
                    </Button>
                  </div>
                </template>

                <template v-else-if="newRequestForm.type === 'Leave'">
                     <div class="space-y-1.5">
                        <Label for="new-start-date">Start Date *</Label>
                        <Popover><PopoverTrigger as-child><Button variant="outline" :class="cn('w-full justify-start text-left font-normal', !newStartDateForPicker && 'text-muted-foreground')"><CalendarDays class="mr-2 h-4 w-4" />{{ newStartDateForPicker ? dateFormatter.format(newStartDateForPicker.toDate(getLocalTimeZone())) : "Pick a start date" }}</Button></PopoverTrigger><PopoverContent class="w-auto p-0"><Calendar v-model="newStartDateForPicker" initial-focus :min-value="today(getLocalTimeZone()).subtract({days: 365})" :max-value="today(getLocalTimeZone()).add({ years: 2 })" /></PopoverContent></Popover>
                    </div>
                    <div class="space-y-1.5">
                        <Label for="new-end-date">End Date *</Label>
                        <Popover><PopoverTrigger as-child><Button variant="outline" :class="cn('w-full justify-start text-left font-normal', !newEndDateForPicker && 'text-muted-foreground')"><CalendarDays class="mr-2 h-4 w-4" />{{ newEndDateForPicker ? dateFormatter.format(newEndDateForPicker.toDate(getLocalTimeZone())) : "Pick an end date" }}</Button></PopoverTrigger><PopoverContent class="w-auto p-0"><Calendar v-model="newEndDateForPicker" initial-focus :min-value="newStartDateForPicker || today(getLocalTimeZone()).subtract({days: 365})" :max-value="today(getLocalTimeZone()).add({ years: 2 })" /></PopoverContent></Popover>
                    </div>
                </template>

                 
            </div>
            <DialogFooter class="pt-4 border-t">
                <Button variant="outline" @click="isAddRequestDialogOpen = false">Cancel</Button>
                <Button @click="addNewRequest" class="text-foreground" :disabled="isLoading">
                   <RefreshCw v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
                   {{ isLoading ? 'Adding...' : 'Add Request' }}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>

  </div>
</template>