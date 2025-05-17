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
  DialogFooter,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Search,
  MoreHorizontal,
  UserPlus,
  RefreshCw,
  User,
  Briefcase,
  CalendarIcon,
  FileText,
  Package as LucidePackage,
  CalendarDays as LucideCalendarDays,
  Archive as LucideArchive,
  Pencil, // Added for edit request button
  PlusCircle, // For adding items in request dialog
  Trash2,     // For removing items in request dialog
} from 'lucide-vue-next'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

import NavbarView from '@/views/NavbarView.vue'
import { onBeforeMount, ref, computed, watch, reactive, type Ref } from 'vue'
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
  today,
  parseDate as parseDateValue,
  getLocalTimeZone,
  DateFormatter,
} from '@internationalized/date'
import { useAccountService } from '@/_services/account.service'
import { useEmployeeService } from '@/_services/employee.service'
import { useDepartmentService } from '@/_services/department.service'
import { useToastService } from '@/_services/toast.service'
import { useWorkflowService } from '@/_services/workflow.service'
import { useRequestService } from '@/_services/request.service' // Import Request Service

import type {
  Employee,
  NewEmployee,
  UpdateEmployeeParams,
  TransferDepartmentPayload,
  BasicRequest,
  BasicRequestItem, // From employee model
} from '@/models/employee'
import type { Department } from '@/models/department';
import type { Toast } from '@/models/toast'
import type { Account } from '@/models/account'
import type { LeaveWorkflowPayload, OnboardingWorkflowPayload, ResourcesWorkflowPayload, TransferDepartmentWorkflowPayload, UpdateWorkflowPayload, Workflow } from '@/models/workflow'
import type {
  Request as BackendRequestModel, // Main request model for fetching all requests
  NewLeaveRequestPayload as MainNewLeaveRequestPayload,
  NewItemRequestPayload as MainNewItemRequestPayload,
  UpdateRequestPayload as MainUpdateRequestPayload,
  RequestItemDetail,
} from '@/models/request'; // Main request models
import { is } from 'date-fns/locale'

// --- INTERFACES (Component-specific or for derived data) ---

// For Employee Display
interface AccountData {
  id: number
  email: string
  firstName: string
  lastName: string
  title: string
}
interface DepartmentData {
  id: number
  name: string
}

// For Main Request View (if this component also handles it)
type RequestType = 'Equipment' | 'Leave' | 'Resources'; // Main request types
type RequestStatus = 'Pending' | 'Approved' | 'Rejected' ; // Main request statuses

interface ItemDetail { // For items in request forms
  name: string;
  quantity: number;
}

interface FrontendBaseRequest { // For main request listing
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

// For main Add/Edit Request Dialog forms
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


// --- LOADING SUBMIT STATES ---
const isAddingEmployee = ref(false);
const isEditingEmployee = ref(false);
const isTransferringEmployee = ref(false);
const isUpdatingWorkflow = ref(false);
const isEditingRequest = ref(false);


// --- SERVICE INSTANCES ---
const employeeService = useEmployeeService();
const toastService = useToastService();
const accountService = useAccountService();
const departmentService = useDepartmentService();
const workflowService = useWorkflowService();
const requestService = useRequestService(); // For main request operations

// --- GLOBAL STATE ---
const isLoading = ref(false);
const searchQuery = ref(''); // For employee search

// --- EMPLOYEE MANAGEMENT STATE ---
const accounts = ref<Account[]>([]);
const departments = ref<Department[]>([]);
const employees = ref<Employee[]>([]); // Main store for API employee data (includes their requests and workflows)

const selectedEmployee = ref<Employee | null>(null); // For editing employee details
const isEmployeeEditDialogOpen = ref(false); // Renamed for clarity
const isAddEmployeeDialogOpen = ref(false);  // Renamed for clarity

const editHireDateForPicker = ref<DateValue>();
const newHireDateForPicker = ref<DateValue>();

const newEmployeeForm = reactive<NewEmployee>({
  accountId: 0,
  position: '',
  departmentId: 0,
  hireDate: today(getLocalTimeZone()).toString(),
  status: 'Active', // Default status
});

// Transfer Dialog State
const isTransferDialogOpen = ref(false);
const employeeToTransfer = ref<Employee | null>(null);
const newDepartmentForTransfer = ref<Department | undefined>()
const selectedCurrentDepartmentName = ref<string>('');

// Workflows Dialog State
const isWorkflowsDialogOpen = ref(false);
const workflowsForSelectedEmployee = ref<Workflow[]>([]);
const employeeForWorkflows = ref<Employee | null>(null);
const workflowStatusOptionsFromApi = ['Pending', 'Approved', 'Rejected'];

// Employee's Requests Dialog State
const isEmployeeRequestsDialogOpen = ref(false); // Renamed for clarity
const requestsForSelectedEmployee = ref<BasicRequest[]>([]);
const employeeForRequests = ref<Employee | null>(null);


// --- MAIN REQUEST MANAGEMENT STATE (like original RequestView.vue) ---
// This state is for the main request editing dialog,
// which can be triggered from an employee's request list.

// State for main Edit Request Dialog (triggered from employee's request list)
const selectedRequestForMainEdit = ref<RequestFormState | null>(null); // Renamed
const isMainRequestEditDialogOpen = ref(false); // Renamed
const mainEditRequestDateForPicker = ref<DateValue | undefined>();
const mainEditStartDateForPicker = ref<DateValue | undefined>();
const mainEditEndDateForPicker = ref<DateValue | undefined>();
// currentItemDetail for adding/editing items in the main request edit dialog
// This might not be needed if using direct row editing as per latest changes.
// For now, let's assume direct row editing for the main request dialog too.

// Constants for main request types/statuses
const mainRequestTypeOptions: RequestType[] = ['Equipment', 'Leave', 'Resources'];
const mainRequestStatusOptions: RequestStatus[] = ['Pending', 'Approved', 'Rejected'];


// --- FORMATTERS & HELPERS ---
const dateFormatter = new DateFormatter(navigator.language || 'en-US', { dateStyle: 'medium' });
const formatEmployeeId = (id: number) => `EMP-${String(id).padStart(3, '0')}`;

function formatDisplayDate(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A';
  try {
    const cleanDateString = dateString.split('T')[0];
    const dateVal = parseDateValue(cleanDateString);
    return dateFormatter.format(dateVal.toDate(getLocalTimeZone()));
  } catch (e) {
    console.warn("Error formatting date for display:", dateString, e);
    return 'Invalid Date';
  }
}

const getAvatarFallbackText = (account?: AccountData) => {
  if (!account) return '';
  return `${account.firstName?.charAt(0) || ''}${account.lastName?.charAt(0) || ''}`.toUpperCase();
};
const getEmployeeById = (employeeId?: number): Employee | undefined => {
  if (employeeId === undefined) return undefined;
  return employees.value.find(emp => emp.id === employeeId);
};


const getEmployeeFullName = (employeeId?: number): string => {
  if (employeeId === undefined) return 'Unassigned';
  const emp = getEmployeeById(employeeId);
  return emp ? `${emp.account?.firstName} ${emp.account?.lastName}` : 'Unknown Employee';
};

// For Employee Cards
const getDisplayEmployee = (emp: Employee | null) => {
  if (!emp) return null;
  return {
    ...emp,
    employeeIdString: formatEmployeeId(emp.id),
    accountDetails: emp.account ? { id: emp.accountId, email: emp.account.email, firstName: emp.account.firstName, lastName: emp.account.lastName, title: emp.account.title } as AccountData : undefined,
    departmentDetails: emp.department ? { id: emp.departmentId, name: emp.department.name } as DepartmentData : undefined,
    componentStatus: emp.status, // Keep original status for badge logic
  };
};
type DisplayEmployeeType = NonNullable<ReturnType<typeof getDisplayEmployee>>;

// For Request Cards (both in main view and employee's request dialog)
const getRequestCardIcon = (type: string | RequestType) => {
  const typeLower = type.toLowerCase();
  if (typeLower.includes('equipment')) return LucidePackage;
  if (typeLower.includes('leave')) return LucideCalendarDays;
  if (typeLower.includes('resource')) return LucideArchive;
  return FileText;
};

const getRequestCardStatusBadgeClass = (status: string | RequestStatus) => {
  // This can be used by both the main request view and the employee's request list dialog
  const s = status.toLowerCase();
  if (s === 'approved' || s === 'completed') return 'bg-green-500/10 text-green-700 dark:bg-green-500/20 dark:text-green-400 border-green-500/30';
  if (s === 'pending' || s === 'in progress') return 'bg-yellow-500/10 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400 border-yellow-500/30';
  if (s === 'rejected') return 'bg-red-500/10 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-red-500/30';
  return 'border-border';
};

// --- COMPUTED ---
const displayEmployees = computed((): DisplayEmployeeType[] => {
  return employees.value.map(emp => getDisplayEmployee(emp) as DisplayEmployeeType)
    .filter(emp => {
      if (!emp) return false;
      if (!searchQuery.value) return true;
      const sq = searchQuery.value.toLowerCase();
      return (
        emp.employeeIdString.toLowerCase().includes(sq) ||
        emp.id.toString().toLowerCase().includes(sq) ||
        emp.position.toLowerCase().includes(sq) ||
        (emp.accountDetails && (emp.accountDetails.firstName.toLowerCase().includes(sq) || emp.accountDetails.lastName.toLowerCase().includes(sq) || emp.accountDetails.email.toLowerCase().includes(sq))) ||
        (emp.departmentDetails && emp.departmentDetails.name.toLowerCase().includes(sq))
      );
    });
});


// --- DATA FETCHING ---
const fetchAllInitialData = async () => { // Renamed for clarity
  isLoading.value = true;
  try {
    // Fetch all employees, they should include their workflows and requests
    const apiResponseEmployees = await employeeService.getAll();
    employees.value = apiResponseEmployees;
    console.log(employees.value)

    accounts.value = (await accountService.getAll()).filter(a => a.status === "Active");
    departments.value = await departmentService.getAll();

    // Default newEmployeeForm if lists are now populated
    if (accounts.value.length > 0 && newEmployeeForm.accountId === 0) {
      newEmployeeForm.accountId = Number(accounts.value[0].id);
    }
    if (departments.value.length > 0 && newEmployeeForm.departmentId === 0) {
      newEmployeeForm.departmentId = departments.value[0].id;
    }
  } catch (error) {
    console.error("Failed to fetch initial data:", error);
    toastService.error({ title: 'Error', description: 'Could not load initial application data.' } as Toast);
    employees.value = []; accounts.value = []; departments.value = [];
  } finally {
    isLoading.value = false;
  }
};

// --- EMPLOYEE DIALOG LOGIC ---
const openEditEmployeeDialog = (employee: Employee) => {
  selectedEmployee.value = JSON.parse(JSON.stringify(employee));
  if (selectedEmployee.value?.hireDate) {
    try { editHireDateForPicker.value = parseDateValue(selectedEmployee.value.hireDate); }
    catch { editHireDateForPicker.value = today(getLocalTimeZone()); }
  } else {
    editHireDateForPicker.value = today(getLocalTimeZone());
  }
  isEmployeeEditDialogOpen.value = true;
};

const saveEditedEmployee = async () => {
  isEditingEmployee.value = true;
  if (!selectedEmployee.value) {
    isEditingEmployee.value = false;
    return;
  }
  const params: UpdateEmployeeParams = {
    position: selectedEmployee.value.position,
    accountId: selectedEmployee.value.accountId,
    status: selectedEmployee.value.status,
  };
  try {
    await employeeService.update(selectedEmployee.value.id, params);
    isEditingEmployee.value = false;
    isEmployeeEditDialogOpen.value = false; selectedEmployee.value = null;
    await fetchAllInitialData();
  } catch (error) {
    console.error("Failed to save employee:", error);
    toastService.error({ title: 'Error', description: 'Failed to update employee.' } as Toast);
    isEditingEmployee.value = false;
  }
};

const openAddEmployeeDialog = () => {
  resetNewEmployeeForm();
  isAddEmployeeDialogOpen.value = true;
};

const addNewEmployeeHandler = async () => { // Renamed to avoid conflict
  isAddingEmployee.value = true;
  if (!newEmployeeForm.accountId || !newEmployeeForm.departmentId || !newEmployeeForm.position || !newEmployeeForm.hireDate || !newEmployeeForm.status) {
    toastService.error({ title: 'Validation Error', description: 'All fields are required.' } as Toast); 
    isAddingEmployee.value = false;
    return;
  }
  try {
    const response = await employeeService.create(newEmployeeForm);
    if (response.employee?.id) {
      await workflowService.createOnboardingWorkflow({ employeeId: response.employee.id } as OnboardingWorkflowPayload);
    }
    isAddingEmployee.value = false;
    isAddEmployeeDialogOpen.value = false;
    await fetchAllInitialData();
  } catch (error) {
    console.error("Failed to add employee:", error);
    toastService.error({ title: 'Error', description: 'Failed to add employee.' } as Toast);
    isAddingEmployee.value = false;
  }
};

const resetNewEmployeeForm = () => {
  const currentLocalDate = today(getLocalTimeZone());
  newEmployeeForm.accountId = accounts.value.length > 0 ? Number(accounts.value[0].id) : 0;
  newEmployeeForm.position = '';
  newEmployeeForm.departmentId = departments.value.length > 0 ? departments.value[0].id : 0;
  newEmployeeForm.hireDate = currentLocalDate.toString();
  newEmployeeForm.status = 'Active';
  newHireDateForPicker.value = currentLocalDate;
};

// --- TRANSFER DIALOG LOGIC ---
const openTransferDialog = (employee: Employee) => {
  employeeToTransfer.value = { ...employee };
  selectedCurrentDepartmentName.value = employee.department?.name || 'N/A';
  newDepartmentForTransfer.value = undefined;
  isTransferDialogOpen.value = true;
};

const handleTransfer = async () => {
  isTransferringEmployee.value = true;
  if (!employeeToTransfer.value || !newDepartmentForTransfer.value) {
    toastService.error({ title: 'Error', description: 'Missing transfer information.' } as Toast); 
    isTransferringEmployee.value = false;
    return;
  }
  const payload: TransferDepartmentPayload = { departmentId: newDepartmentForTransfer.value.id };
  try {
    const wfPayload: TransferDepartmentWorkflowPayload = {
      employeeId: employeeToTransfer.value.id,
      oldDepartment: { name: employeeToTransfer.value.department?.name || 'Unknown' },
      newDepartment: { name: newDepartmentForTransfer.value.name }
    };
    await employeeService.transferDepartment(employeeToTransfer.value.id, payload);
    await workflowService.createTransferWorkflow(wfPayload);
    isTransferDialogOpen.value = false; employeeToTransfer.value = null;
    isTransferringEmployee.value = false;
    await fetchAllInitialData();
  } catch (error) {
    console.error("Failed to transfer employee:", error);
    toastService.error({ title: 'Error', description: 'Failed to transfer employee.' } as Toast);
    isTransferringEmployee.value = false;
  }
};

// --- WORKFLOWS DIALOG LOGIC ---
const openWorkflowsDialog = (employeeRecord: Employee) => {
  employeeForWorkflows.value = employeeRecord;
  workflowsForSelectedEmployee.value = employeeRecord.workflows || [];
  isWorkflowsDialogOpen.value = true;
};

const updateWorkflowStatus = async (employeeId: number, workflowId: number, newStatus: string) => {
  isUpdatingWorkflow.value = true;
  try {
    await workflowService.update(workflowId, { status: newStatus } as UpdateWorkflowPayload);
    const empIdx = employees.value.findIndex(e => e.id === employeeId);
    if (empIdx !== -1 && employees.value[empIdx].workflows) {
      const wfIdx = employees.value[empIdx].workflows!.findIndex(wf => wf.id === workflowId);
      if (wfIdx !== -1) employees.value[empIdx].workflows![wfIdx].status = newStatus;
    }
    workflowsForSelectedEmployee.value = [...(employees.value.find(e => e.id === employeeId)?.workflows || [])];
    isUpdatingWorkflow.value = false;
  } catch (error) {
    console.error("Failed to update workflow status:", error);
    toastService.error({ title: "Update Failed", description: "Could not update workflow status." } as Toast);
    isUpdatingWorkflow.value = false;
  }
};

// --- EMPLOYEE'S REQUESTS DIALOG LOGIC ---
const openEmployeeRequestsDialog = (employeeRecord: Employee) => { // Renamed
  employeeForRequests.value = employeeRecord;
  requestsForSelectedEmployee.value = employeeRecord.requests || [];
  console.log(requestsForSelectedEmployee.value)
  console.log(employeeForRequests.value)
  isEmployeeRequestsDialogOpen.value = true;
};

// Helper to convert BasicRequest to FrontendUnifiedRequest for the main edit dialog
function mapBasicRequestToFrontendUnified(basicReq: BasicRequest, empIdForContext: number): FrontendUnifiedRequest | null {
  const common = {
    id: basicReq.id,
    employeeId: empIdForContext, // Use the parent employee's ID
    status: basicReq.status as RequestStatus,
    requestDate: basicReq.requestDate,
  };
  const type = basicReq.type as RequestType;

  if (type === 'Leave' && basicReq.requestLeave) {
    return { ...common, type: 'Leave', startDate: basicReq.requestLeave.startDate, endDate: basicReq.requestLeave.endDate };
  } else if ((type === 'Equipment' || type === 'Resources') && basicReq.requestItems) {
    const items = basicReq.requestItems.map(item => ({ name: item.name, quantity: item.quantity }));
    if (type === 'Equipment') return { ...common, type: 'Equipment', items: items };
    if (type === 'Resources') return { ...common, type: 'Resources', resources: items }; // Map to 'resources' for FrontendResourcesRequest
  }
  return null;
}

// --- MAIN REQUEST EDIT DIALOG LOGIC (triggered from employee's request list) ---
function getDefaultMainRequestFormState(defaultType: RequestType = 'Equipment'): RequestFormState {
    const todayDateString = today(getLocalTimeZone()).toString();
    const base = {
        employeeId: undefined, // Will be set when opening
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

const openMainRequestEditDialog = (requestToEdit: FrontendUnifiedRequest) => {
    let formState: RequestFormState;
    if (requestToEdit.type === 'Leave') {
        formState = {
            id: requestToEdit.id, type: 'Leave', employeeId: requestToEdit.employeeId, status: requestToEdit.status,
            requestDate: requestToEdit.requestDate, startDate: requestToEdit.startDate, endDate: requestToEdit.endDate, items: []
        };
        try {
            mainEditRequestDateForPicker.value = requestToEdit.requestDate ? parseDateValue(requestToEdit.requestDate) : undefined;
            mainEditStartDateForPicker.value = requestToEdit.startDate ? parseDateValue(requestToEdit.startDate) : undefined;
            mainEditEndDateForPicker.value = requestToEdit.endDate ? parseDateValue(requestToEdit.endDate) : undefined;
        } catch (e) {
            const todayVal = today(getLocalTimeZone());
            mainEditRequestDateForPicker.value = todayVal; formState.requestDate = todayVal.toString();
            mainEditStartDateForPicker.value = todayVal; formState.startDate = todayVal.toString();
            mainEditEndDateForPicker.value = todayVal.add({ days: 1 }); formState.endDate = todayVal.add({ days: 1 }).toString();
        }
    } else { // Equipment or Resources
        const baseItems = requestToEdit.type === 'Equipment' ? requestToEdit.items : requestToEdit.resources;
        formState = {
            id: requestToEdit.id, type: requestToEdit.type, employeeId: requestToEdit.employeeId, status: requestToEdit.status,
            requestDate: requestToEdit.requestDate, items: JSON.parse(JSON.stringify(baseItems))
        };
        if (formState.items.length === 0) formState.items.push({ name: '', quantity: 1 });
        try {
            mainEditRequestDateForPicker.value = requestToEdit.requestDate ? parseDateValue(requestToEdit.requestDate) : undefined;
        } catch (e) {
            mainEditRequestDateForPicker.value = today(getLocalTimeZone()); formState.requestDate = today(getLocalTimeZone()).toString();
        }
        mainEditStartDateForPicker.value = undefined; mainEditEndDateForPicker.value = undefined;
    }
    selectedRequestForMainEdit.value = formState;
    isMainRequestEditDialogOpen.value = true;
};

watch(() => selectedRequestForMainEdit.value?.type, (newType, oldType) => {
    if (!isMainRequestEditDialogOpen.value || !selectedRequestForMainEdit.value || !newType || newType === oldType) return;
    const currentForm = selectedRequestForMainEdit.value;
    const commonData = { id: currentForm.id, employeeId: currentForm.employeeId, status: currentForm.status, requestDate: currentForm.requestDate };

    if (newType === 'Leave') {
        const todayVal = today(getLocalTimeZone());
        selectedRequestForMainEdit.value = { ...commonData, type: 'Leave', startDate: currentForm.startDate || todayVal.toString(), endDate: currentForm.endDate || todayVal.add({ days: 1 }).toString(), items: [] };
        if(selectedRequestForMainEdit.value.requestDate) mainEditRequestDateForPicker.value = parseDateValue(selectedRequestForMainEdit.value.requestDate);
        mainEditStartDateForPicker.value = parseDateValue(selectedRequestForMainEdit.value.startDate!);
        mainEditEndDateForPicker.value = parseDateValue(selectedRequestForMainEdit.value.endDate!);
    } else {
        selectedRequestForMainEdit.value = { ...commonData, type: newType as 'Equipment' | 'Resources', items: currentForm.type === 'Leave' ? [{ name: '', quantity: 1 }] : (currentForm.items.length > 0 ? currentForm.items : [{ name: '', quantity: 1 }]) };
        if(selectedRequestForMainEdit.value.requestDate) mainEditRequestDateForPicker.value = parseDateValue(selectedRequestForMainEdit.value.requestDate);
        mainEditStartDateForPicker.value = undefined; mainEditEndDateForPicker.value = undefined;
    }
});

const saveMainRequestChanges = async () => {
  isLoading.value = true;  
  if (!selectedRequestForMainEdit.value?.id){
    
    isLoading.value = false;  
    return;
  }
  const form = selectedRequestForMainEdit.value;
  let payload: MainUpdateRequestPayload = { status: form.status };
  
  if (form.type === 'Equipment' || form.type === 'Resources') {
    const validItems = form.items.filter(item => item.name && item.quantity > 0);
    if (validItems.length === 0) {
      isLoading.value = false;  
      toastService.error({ title: 'Validation Error', description: `At least one valid ${form.type.toLowerCase()} item/resource is required.` } as Toast); return;
    }
    payload.items = validItems.map(item => ({ name: item.name, quantity: item.quantity }));
  } else if (form.type === 'Leave') {
    if (!mainEditStartDateForPicker.value || !mainEditEndDateForPicker.value) {
          isLoading.value = false;  
          toastService.error({ title: 'Validation Error', description: 'Start and End dates are required.' } as Toast); return;
        }
        if (mainEditStartDateForPicker.value.compare(mainEditEndDateForPicker.value) > 0) {
          isLoading.value = false;  
          toastService.error({ title: 'Invalid Dates', description: 'End date cannot be before start date.' } as Toast); return;
        }
        payload.startDate = mainEditStartDateForPicker.value.toString();
        payload.endDate = mainEditEndDateForPicker.value.toString();
      }
      if(form.type==='Leave') await workflowService.createLeaveWorkflow({
        employeeId: form.employeeId,
        startDate: mainEditStartDateForPicker.value!.toString(),
        endDate: mainEditEndDateForPicker.value!.toString()
      } as LeaveWorkflowPayload)
      else{
        await workflowService.createResourcesWorkflow({
          employeeId: form.employeeId,
          items: form.items
        } as ResourcesWorkflowPayload)
      }
      try {
        await requestService.update(form.id!, payload); // Main request service update
        isMainRequestEditDialogOpen.value = false; selectedRequestForMainEdit.value = null;
        isLoading.value = false;
        await fetchAllInitialData(); // Re-fetch all data as an employee's request list might have changed
        const employeeRecord = employees.value.find(e => e.id === employeeForRequests.value!.id)!;
        employeeForRequests.value = employeeRecord;
        requestsForSelectedEmployee.value = employeeRecord.requests || [];
    } catch (error) {
        console.error("Error updating main request:", error);
        toastService.error({title: "Update Failed", description: "Could not update the request."} as Toast);
    } finally {
        isLoading.value = false;
    }
};

// Item row management for the main request edit dialog
const addRowToMainEditForm = () => {
    if(selectedRequestForMainEdit.value && (selectedRequestForMainEdit.value.type === 'Equipment' || selectedRequestForMainEdit.value.type === 'Resources')) {
        selectedRequestForMainEdit.value.items.push({ name: '', quantity: 1 });
    }
};
const removeRowFromMainEditForm = (index: number) => {
    if(selectedRequestForMainEdit.value && (selectedRequestForMainEdit.value.type === 'Equipment' || selectedRequestForMainEdit.value.type === 'Resources')) {
        selectedRequestForMainEdit.value.items.splice(index, 1);
        if(selectedRequestForMainEdit.value.items.length === 0) {
            addRowToMainEditForm(); // Ensure at least one row
        }
    }
};


// --- LIFECYCLE & WATCHERS ---
onBeforeMount(fetchAllInitialData);

watch(editHireDateForPicker, (newDateVal) => { if (selectedEmployee.value) selectedEmployee.value.hireDate = newDateVal ? newDateVal.toString() : selectedEmployee.value.hireDate; });
watch(newHireDateForPicker, (newDateVal) => { newEmployeeForm.hireDate = newDateVal ? newDateVal.toString() : ''; });

// Watchers for main request edit dialog date pickers
watch(mainEditRequestDateForPicker, (val) => { if(selectedRequestForMainEdit.value && val) selectedRequestForMainEdit.value.requestDate = val.toString();});
watch(mainEditStartDateForPicker, (val) => { if (selectedRequestForMainEdit.value?.type === 'Leave' && val) selectedRequestForMainEdit.value.startDate = val.toString(); });
watch(mainEditEndDateForPicker, (val) => { if (selectedRequestForMainEdit.value?.type === 'Leave' && val) selectedRequestForMainEdit.value.endDate = val.toString(); });

</script>

<template>
  <div class="min-h-screen max-w-screen flex flex-col items-center bg-background">
    <NavbarView />

    <main class="container py-8">
      <div class="flex flex-col gap-6">
        <div class="flex flex-col gap-2">
          <h1 class="text-3xl font-bold tracking-tight">Employee Directory</h1>
          <p class="text-muted-foreground">Manage company employee records.</p>
        </div>

        <div class="flex flex-col gap-4">
          <div class="flex flex-col sm:flex-row justify-between gap-4">
            <div class="relative w-full sm:w-96">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input v-model="searchQuery" placeholder="Search employees..." class="pl-10" />
            </div>
            <div class="flex gap-2">
              <Button variant="outline" size="sm" @click="fetchAllInitialData" :disabled="isLoading">
                <RefreshCw class="mr-2 h-4 w-4" :class="{'animate-spin': isLoading}" />
                Refresh
              </Button>
              <Button class="text-foreground" size="sm" @click="openAddEmployeeDialog">
                <UserPlus class="mr-2 h-4 w-4" />
                Add Employee
              </Button>
            </div>
          </div>

          <!-- Employee Loading Skeletons -->
          <div v-if="isLoading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <div v-for="i in 4" :key="`skel-emp-${i}`" class="border rounded-lg p-4 bg-card flex flex-col">
              <div class="flex items-start gap-4 mb-4"> <Skeleton class="h-16 w-16 rounded-full" /> <div class="flex-1 space-y-2 pt-1"> <Skeleton class="h-5 w-3/4" /> <Skeleton class="h-4 w-1/2" /> <Skeleton class="h-3 w-1/4" /> </div> <Skeleton class="h-8 w-8 rounded-md" /> </div>
              <div class="space-y-2 text-sm mb-4 flex-grow"> <div class="flex items-center gap-2"> <Skeleton class="h-4 w-4" /> <Skeleton class="h-4 w-2/3" /> </div> <div class="flex items-center gap-2"> <Skeleton class="h-4 w-4" /> <Skeleton class="h-4 w-1/2" /> </div> </div>
              <Skeleton class="h-6 w-20 rounded-md mt-auto" />
            </div>
          </div>
          <!-- Employee Empty State -->
          <div v-else-if="displayEmployees.length === 0" class="flex flex-col items-center justify-center py-12 gap-4 text-center">
            <Briefcase class="h-16 w-16 text-muted-foreground" /> <h3 class="text-xl font-medium">No employees found</h3> <p class="text-sm text-muted-foreground">Try adjusting your search or add a new employee record.</p>
          </div>
          <!-- Employee Card Grid -->
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <div v-for="employee in displayEmployees" :key="employee.id" class="border bg-card text-card-foreground rounded-lg p-4 hover:shadow-lg transition-shadow duration-200 flex flex-col">
              <div class="flex items-start gap-4 mb-4">
                <Avatar class="h-16 w-16 text-xl bg-muted border">
                    <AvatarFallback>{{ getAvatarFallbackText(employee.accountDetails)}}</AvatarFallback>
                </Avatar>
                <div class="flex-1 space-y-0.5">
                  <h3 class="font-semibold text-lg leading-tight"> {{ employee.accountDetails?.title }} {{ employee.accountDetails?.firstName }} {{ employee.accountDetails?.lastName }} </h3>
                  <p class="text-sm text-primary">{{ employee.position }}</p>
                  <p class="text-xs text-muted-foreground">ID: {{ employee.employeeIdString }}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger as-child> <Button variant="ghost" class="h-8 w-8 p-0 self-start text-muted-foreground hover:text-foreground"> <MoreHorizontal class="h-5 w-5" /> </Button> </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" class="w-52">
                    <DropdownMenuItem @click="openEditEmployeeDialog(employees.find(e => e.id === employee.id)!)"> <User class="mr-2 h-4 w-4" /> <span>Edit Record</span> </DropdownMenuItem>
                    <DropdownMenuItem @click="openTransferDialog(employees.find(e => e.id === employee.id)!)"> <Briefcase class="mr-2 h-4 w-4" /> <span>Transfer Department</span> </DropdownMenuItem>
                    <DropdownMenuItem @click="openWorkflowsDialog(employees.find(e => e.id === employee.id)!)"> <RefreshCw class="mr-2 h-4 w-4" /> <span>View Workflows</span> </DropdownMenuItem>
                    <DropdownMenuItem @click="openEmployeeRequestsDialog(employees.find(e => e.id === employee.id)!)"> <FileText class="mr-2 h-4 w-4" /> <span>View Requests</span> </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div class="space-y-2.5 text-sm mb-4 flex-grow">
                <div v-if="employee.accountDetails" class="flex items-center"> <User class="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" /> <a :href="'mailto:'+employee.accountDetails.email" class="truncate text-primary hover:underline" :title="employee.accountDetails.email"> {{ employee.accountDetails.email }} </a> </div>
                <div v-if="employee.departmentDetails" class="flex items-center"> <Briefcase class="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" /> <span class="truncate" :title="employee.departmentDetails.name">Dept: {{ employee.departmentDetails.name }}</span> </div>
                <div class="flex items-center"> <CalendarIcon class="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" /> <span>Hired: {{ formatDisplayDate(employee.hireDate) }}</span> </div>
              </div>
              <div class="mt-auto pt-3 border-t">
                <Badge
                    :variant="employee.status === 'Active' ? 'default' : 'secondary'"
                    class="capitalize text-foreground  h-5 p-3 text-xs"
                  >
                    {{ employee.status }}
                  </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Edit Employee Dialog -->
    <Dialog v-model:open="isEmployeeEditDialogOpen">
      <DialogContent class="sm:max-w-xl">
        <DialogHeader> <DialogTitle>Edit Employee Record</DialogTitle> <DialogDescription>Update the employee's assignment and status.</DialogDescription> </DialogHeader>
        <div v-if="selectedEmployee" class="py-4">
          <div class="space-y-8 max-h-[60vh] overflow-y-auto pr-3 -mr-3">
            <div class="grid grid-cols-5 gap-4">
                <div class="space-y-1.5 col-span-2"> <Label>Employee ID (System)</Label>
                          <p class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground min-h-[2.5rem] flex items-center">
                          {{ formatEmployeeId(selectedEmployee.id) }}
                          </p>
                </div>
                <div class="space-y-1.5 col-span-3"> <Label for="edit-account">Account *</Label>
                    <Select id="edit-account" v-model="selectedEmployee.accountId" required>
                        <SelectTrigger class="w-full"><SelectValue placeholder="Select account" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem v-for="acc in accounts.filter(acc => !employees.some(e => e.accountId === Number(acc.id) && e.id !== selectedEmployee?.id) || selectedEmployee?.accountId === Number(acc.id))" :key="acc.id" :value="acc.id"> {{ acc.email }} ({{ acc.firstName }} {{ acc.lastName }}) </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div class="grid grid-cols-5 gap-4">
                <div class="space-y-1.5 col-span-2"> <Label for="edit-status">Status *</Label>
                    <Select id="edit-status" v-model="selectedEmployee.status" required>
                        <SelectTrigger class="w-full"><SelectValue placeholder="Select status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Active"> Active </SelectItem>
                            <SelectItem value="Inactive"> Inactive </SelectItem>
                          </SelectContent>
                    </Select>
                </div>
                <div class="space-y-1.5 col-span-3"> <Label for="edit-position">Position *</Label> <Input id="edit-position" v-model="selectedEmployee.position" placeholder="Software Engineer" required class="w-full" /> </div>
            </div>
          </div>
          <DialogFooter class="flex justify-end gap-2 pt-6 mt-8 border-t"> <Button variant="outline" @click="isEmployeeEditDialogOpen = false">Cancel</Button> <Button :disabled="isEditingEmployee" class="text-foreground" @click="saveEditedEmployee">        <RefreshCw v-if="isEditingEmployee" class="mr-2 h-4 w-4 animate-spin" />
{{ isEditingEmployee ? 'Saving...' : 'Save Changes' }}</Button> </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Add New Employee Dialog -->
    <Dialog v-model:open="isAddEmployeeDialogOpen">
      <DialogContent class="sm:max-w-xl">
        <DialogHeader> <DialogTitle>Add New Employee Record</DialogTitle> <DialogDescription>Assign an account to an employee role.</DialogDescription> </DialogHeader>
        <div class="py-4">
          <div class="space-y-8 max-h-[70vh] overflow-y-auto pr-3 -mr-3">
            <div class="grid grid-cols-1 gap-4"> <div class="space-y-1.5"> <Label for="new-account">Account *</Label>
                <Select id="new-account" v-model="newEmployeeForm.accountId" required>
                    <SelectTrigger class="w-full"><SelectValue placeholder="Select an existing account" /></SelectTrigger>
                    <SelectContent> <SelectItem v-for="acc in accounts.filter(r => !employees.some(e => e.accountId === Number(r.id)))" :key="acc.id" :value="acc.id"> {{ acc.email }} ({{ acc.firstName }} {{ acc.lastName }}) </SelectItem> </SelectContent>
                </Select>
            </div> </div>
            <div class="grid grid-cols-5 gap-4">
                <div class="space-y-1.5 col-span-2"> <Label for="new-department">Department *</Label>
                    <Select id="new-department" v-model="newEmployeeForm.departmentId" required>
                        <SelectTrigger class="w-full"><SelectValue placeholder="Select department" /></SelectTrigger>
                        <SelectContent> <SelectItem v-for="dept in departments" :key="dept.id" :value="dept.id"> {{ dept.name }} </SelectItem> </SelectContent>
                    </Select>
                </div>
                <div class="space-y-1.5 col-span-3"> <Label for="new-position">Position *</Label> <Input id="new-position" v-model="newEmployeeForm.position" placeholder="E.g., Software Developer" required class="w-full" /> </div>
            </div>
            <div class="grid grid-cols-5 gap-4">
                <div class="space-y-1.5 col-span-2"> <Label for="new-hireDate">Hire Date *</Label>
                    <Popover>
                        <PopoverTrigger as-child> <Button variant="outline" :class="cn('w-full justify-start text-left font-normal',!newHireDateForPicker && 'text-muted-foreground')"> <CalendarIcon class="mr-2 h-4 w-4" /> {{ newHireDateForPicker ? dateFormatter.format(newHireDateForPicker.toDate(getLocalTimeZone())) : "Pick a date" }} </Button> </PopoverTrigger>
                        <PopoverContent class="w-auto p-0"> <Calendar v-model="newHireDateForPicker" initial-focus :min-value="parseDateValue('1950-01-01')" :max-value="today(getLocalTimeZone()).add({ years: 2 })" /> </PopoverContent>
                    </Popover>
                </div>
                <div class="space-y-1.5 col-span-3"> <Label for="new-status">Status *</Label>
                    <Select id="new-status" v-model="newEmployeeForm.status" required>
                        <SelectTrigger class="w-full"><SelectValue placeholder="Select status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Active"> Active </SelectItem>
                            <SelectItem value="Inactive"> Inactive </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
          </div>
          <DialogFooter class="flex justify-end gap-2 pt-6 mt-8 border-t"> <Button variant="outline" @click="isAddEmployeeDialogOpen = false">Cancel</Button> <Button :disabled="isAddingEmployee" class="text-foreground" @click="addNewEmployeeHandler">        <RefreshCw v-if="isAddingEmployee" class="mr-2 h-4 w-4 animate-spin" />
{{ isAddingEmployee ? 'Adding Employee...' : 'Add Employee' }}</Button> </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Transfer Department Dialog -->
    <Dialog v-model:open="isTransferDialogOpen">
      <DialogContent class="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Transfer Employee Department</DialogTitle>
          <DialogDescription v-if="employeeToTransfer && getDisplayEmployee(employeeToTransfer)?.accountDetails">
            Select a new department for {{ getDisplayEmployee(employeeToTransfer)!.accountDetails!.firstName }} {{ getDisplayEmployee(employeeToTransfer)!.accountDetails!.lastName }} (ID: {{ formatEmployeeId(employeeToTransfer.id) }}).
          </DialogDescription>
          <DialogDescription v-else-if="employeeToTransfer">
            Select a new department for Employee ID: {{ formatEmployeeId(employeeToTransfer.id) }}.
          </DialogDescription>
        </DialogHeader>
        <div v-if="employeeToTransfer" class="py-4">
          <div class="space-y-6 max-h-[60vh] overflow-y-auto pr-3 -mr-3">
            <div class="space-y-2"> <Label>Current Department</Label> <p class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground min-h-[2.5rem] flex items-center"> {{ selectedCurrentDepartmentName }} </p> </div>
            <div class="space-y-2"> <Label for="new-dept-transfer">New Department *</Label>
              <Select id="new-dept-transfer" v-model="newDepartmentForTransfer" required>
                <SelectTrigger class="w-full"><SelectValue placeholder="Select new department" /></SelectTrigger>
                <SelectContent> <SelectItem v-for="dept in departments" :key="dept.id" :value="dept" :disabled="dept.id === employeeToTransfer.departmentId"> {{ dept.name }} </SelectItem> </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter class="flex justify-end gap-2 pt-6 mt-4 border-t"> <Button variant="outline" @click="isTransferDialogOpen = false">Cancel</Button> <Button :disabled="isTransferringEmployee" @click="handleTransfer" class="text-foreground"><RefreshCw v-if="isTransferringEmployee" class="mr-2 h-4 w-4 animate-spin" />
{{ isTransferringEmployee ? 'Transferring Employee...' : 'Transfer Employee' }}</Button> </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>

    <!-- View Workflows Dialog -->
    <Dialog v-model:open="isWorkflowsDialogOpen">
      <DialogContent class="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Employee Workflows</DialogTitle>
          <DialogDescription v-if="employeeForWorkflows && getDisplayEmployee(employeeForWorkflows)?.accountDetails"> Workflows for {{ getDisplayEmployee(employeeForWorkflows)!.accountDetails!.firstName }} {{ getDisplayEmployee(employeeForWorkflows)!.accountDetails!.lastName }} (ID: {{ formatEmployeeId(employeeForWorkflows.id) }}). </DialogDescription>
          <DialogDescription v-else-if="employeeForWorkflows"> Workflows for Employee ID: {{ formatEmployeeId(employeeForWorkflows.id) }}. </DialogDescription>
        </DialogHeader>
        <div class="py-4 max-h-[70vh] overflow-y-auto">
          <div v-if="!workflowsForSelectedEmployee || workflowsForSelectedEmployee.length === 0" class="text-center py-10"> <p class="text-muted-foreground">No workflows found for this employee.</p> </div>
          <div v-else class="space-y-3">
            <div v-for="wf in workflowsForSelectedEmployee" :key="wf.id" class="border rounded-md p-3">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-2 items-start">
                <div> <p class="font-medium">{{ wf.type }}</p> <p class="text-xs text-muted-foreground">Submitted: {{ formatDisplayDate(wf.created.slice(0,10)) }}</p> </div>
                <div class="md:col-span-2"> <p class="text-sm">{{ wf.details }}</p> </div>
              </div>
              <div class="mt-2 pt-2 border-t flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <Badge :class="cn('capitalize', getRequestCardStatusBadgeClass(wf.status))"> {{ wf.status }} </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger as-child> <Button :disabled="isUpdatingWorkflow" variant="outline" size="sm">        <RefreshCw v-if="isUpdatingWorkflow" class="mr-2 h-4 w-4 animate-spin" />
                   {{ isUpdatingWorkflow ? 'Updating...' : 'Update Status' }} <MoreHorizontal class="ml-1 h-4 w-4" /> </Button> </DropdownMenuTrigger>
                  <DropdownMenuContent align="end"> <DropdownMenuItem v-for="statusOpt in workflowStatusOptionsFromApi.filter(s => s !== wf.status)" :key="statusOpt" @click="updateWorkflowStatus(employeeForWorkflows!.id,wf.id, statusOpt)"> Set to {{ statusOpt }} </DropdownMenuItem> </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter class="pt-4 mt-4 border-t"> <Button variant="outline" @click="isWorkflowsDialogOpen = false">Close</Button> </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- View Employee Requests Dialog -->
    <Dialog v-model:open="isEmployeeRequestsDialogOpen">
      <DialogContent class="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Employee Requests</DialogTitle>
          <DialogDescription v-if="employeeForRequests && getDisplayEmployee(employeeForRequests)?.accountDetails"> Requests for {{ getDisplayEmployee(employeeForRequests)!.accountDetails!.firstName }} {{ getDisplayEmployee(employeeForRequests)!.accountDetails!.lastName }} (ID: {{ formatEmployeeId(employeeForRequests.id) }}). </DialogDescription>
          <DialogDescription v-else-if="employeeForRequests"> Requests for Employee ID: {{ formatEmployeeId(employeeForRequests.id) }}. </DialogDescription>
        </DialogHeader>
        <div class="py-4 max-h-[70vh] overflow-y-auto pr-2 -mr-2">
          <div v-if="!requestsForSelectedEmployee || requestsForSelectedEmployee.length === 0" class="text-center py-10"> <p class="text-muted-foreground">No requests found for this employee.</p> </div>
          <div v-else class="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card v-for="req_basic in requestsForSelectedEmployee" :key="req_basic.id" class="flex flex-col bg-card text-card-foreground rounded-lg p-4 border-card">
              <CardHeader>
                <div class="flex justify-between items-start gap-2">
                  <div class="pb-4">
                    <CardTitle class="text-lg flex items-center gap-2"> <component :is="getRequestCardIcon(req_basic.type)" class="h-5 w-5 text-primary flex-shrink-0" /> {{ req_basic.type }} Request </CardTitle>
                    <CardDescription class="text-xs">ID: {{ req_basic.id }}</CardDescription>
                  </div>
                  <Badge :class="cn('text-xs px-2 py-1 capitalize whitespace-nowrap', getRequestCardStatusBadgeClass(req_basic.status))"> {{ req_basic.status }} </Badge>
                </div>
              </CardHeader>
              <CardContent class="flex-grow space-y-2 text-sm">
                
                <template v-if="req_basic.type.toLowerCase().includes('leave') && req_basic.requestLeave">
                  <p><strong class="text-muted-foreground">Start:</strong> {{ formatDisplayDate(req_basic.requestLeave.startDate) }}</p>
                  <p><strong class="text-muted-foreground">End:</strong> {{ formatDisplayDate(req_basic.requestLeave.endDate) }}</p>
                </template>
                <template v-if="(req_basic.type.toLowerCase().includes('equipment') || req_basic.type.toLowerCase().includes('resource')) && req_basic.requestItems && req_basic.requestItems.length > 0">
                  <p class="font-medium text-muted-foreground mt-1">{{ req_basic.type === 'Equipment' ? 'Items' : 'Resources' }}:</p>
                  <ul class="list-disc list-inside ml-1 space-y-0.5 pb-2">
                    <li v-for="(item, itemIdx) in req_basic.requestItems.slice(0, 3)" :key="`dialog-req-${req_basic.id}-item-${itemIdx}`"> {{ item.name }} (Qty: {{ item.quantity }}) </li>
                  </ul>
                  <p v-if="req_basic.requestItems.length > 3" class="text-xs text-muted-foreground ml-5 italic">+ {{ req_basic.requestItems.length - 3 }} more...</p>
                </template>
                <template v-if="(req_basic.type.toLowerCase().includes('equipment') || req_basic.type.toLowerCase().includes('resource')) && (!req_basic.requestItems || req_basic.requestItems.length === 0)"> <p class="text-sm italic text-muted-foreground mt-1">No items specified.</p> </template>
              </CardContent>
              <CardFooter class="border-t pt-4">
                <Button variant="outline" size="sm" @click="() => { console.log(req_basic); const unifiedReq = mapBasicRequestToFrontendUnified(req_basic, employeeForRequests!.id); if (unifiedReq) { openMainRequestEditDialog(unifiedReq);  } else { toastService.error({title: 'Error', description: 'Could not prepare request for editing.'} as Toast); } }" class="w-full">
                  <Pencil class="mr-2 h-4 w-4" /> Edit This Request
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
        <DialogFooter class="pt-4 mt-4 border-t"> <Button variant="outline" @click="isEmployeeRequestsDialogOpen = false">Close</Button> </DialogFooter>
      </DialogContent>
    </Dialog>

<!-- Main Request Edit Dialog (shared logic) -->
<Dialog v-model:open="isMainRequestEditDialogOpen">
  <DialogContent class="sm:max-w-[620px]">
    <DialogHeader>
      <DialogTitle>Edit Request</DialogTitle>
      <DialogDescription>Update the details of this request.</DialogDescription>
    </DialogHeader>
    <div v-if="selectedRequestForMainEdit" class="grid gap-8 py-4 max-h-[70vh] overflow-y-auto -mr-4 w-full">
      <div class="grid grid-cols-2 gap-4 w-full">
        <div class="space-y-1.5 w-full">
          <Label for="main-edit-employee">Employee</Label>
          <p class="w-full rounded-md border border-input bg-muted/30 px-3 py-1.75 opacity-80 text-sm text-muted-foreground flex items-center" id="main-edit-employee" >{{ `${getEmployeeFullName(selectedRequestForMainEdit.employeeId)} (${formatEmployeeId(selectedRequestForMainEdit.employeeId!)})` }}</p>
        </div>
        
        <div class="space-y-1.5 w-full">
          <Label for="main-edit-request-date">Request Date</Label>
          <Popover>
            <PopoverTrigger as-child>
              <Button
                variant="outline"
                :class="cn('w-full justify-start text-left font-normal', !mainEditRequestDateForPicker && 'text-muted-foreground')"
                disabled
              >
                <CalendarDays class="mr-2 h-4 w-4" />
                {{ mainEditRequestDateForPicker ? dateFormatter.format(mainEditRequestDateForPicker.toDate(getLocalTimeZone())) : "Pick a date" }}
              </Button>
            </PopoverTrigger>
          </Popover>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4 w-full">
        <div class="space-y-1.5 w-full">
          <Label for="main-edit-request-type">Request Type</Label>
          <Select id="main-edit-request-type" v-model="selectedRequestForMainEdit.type">
            <SelectTrigger class="w-full"><SelectValue placeholder="Select type" /></SelectTrigger>
            <SelectContent>
              <SelectItem v-for="typeOpt in mainRequestTypeOptions" :key="`main-edit-${typeOpt}`" :value="typeOpt">{{ typeOpt }}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div class="space-y-1.5 w-full">
          <Label for="main-edit-request-status">Status</Label>
          <Select id="main-edit-request-status" v-model="selectedRequestForMainEdit.status">
            <SelectTrigger class="w-full"><SelectValue placeholder="Select status" /></SelectTrigger>
            <SelectContent>
              <SelectItem v-for="statusOpt in mainRequestStatusOptions" :key="`main-edit-status-${statusOpt}`" :value="statusOpt">{{ statusOpt }}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <template v-if="selectedRequestForMainEdit.type === 'Equipment' || selectedRequestForMainEdit.type === 'Resources'">
        <div class="space-y-3 border p-3 rounded-md bg-muted/30">
          <Label class="font-semibold">{{ selectedRequestForMainEdit.type === 'Equipment' ? 'Equipment Items' : 'Resources' }} *</Label>
          <div v-if="selectedRequestForMainEdit.items.length > 0" class="space-y-2">
            <div v-for="(item, index) in selectedRequestForMainEdit.items" :key="`main-edit-item-${index}`" class="grid grid-cols-10 gap-2 items-center">
              <div class="col-span-6">
                <Input v-model="item.name" :placeholder="selectedRequestForMainEdit.type === 'Equipment' ? 'Item Name' : 'Resource Name'" class="text-sm h-9" />
              </div>
              <div class="col-span-3">
                <Input v-model.number="item.quantity" type="number" :placeholder="selectedRequestForMainEdit.type === 'Equipment' ? 'Qty' : 'Units'" min="1" class="text-sm h-9"/>
              </div>
              <div class="col-span-1 flex justify-end">
                <Button variant="ghost" size="icon" @click="removeRowFromMainEditForm(index)" class="h-9 w-9">
                  <Trash2 class="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </div>
          <p v-else class="text-sm text-muted-foreground italic">No items. Click "Add New" to start.</p>
          <Button @click="addRowToMainEditForm" variant="outline" size="sm" class="mt-2 w-full">
            <PlusCircle class="mr-2 h-4 w-4" /> Add New {{ selectedRequestForMainEdit.type === 'Equipment' ? 'Item' : 'Resource' }}
          </Button>
        </div>
      </template>

      <template v-else-if="selectedRequestForMainEdit.type === 'Leave'">
        <div class="space-y-1.5 w-full">
          <Label for="main-edit-start-date">Start Date *</Label>
          <Popover>
            <PopoverTrigger as-child>
              <Button variant="outline" :class="cn('w-full justify-start text-left font-normal', !mainEditStartDateForPicker && 'text-muted-foreground')">
                <CalendarDays class="mr-2 h-4 w-4" />
                {{ mainEditStartDateForPicker ? dateFormatter.format(mainEditStartDateForPicker.toDate(getLocalTimeZone())) : "Pick a start date" }}
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-auto p-0">
              <Calendar v-model="mainEditStartDateForPicker" initial-focus />
            </PopoverContent>
          </Popover>
        </div>
        <div class="space-y-1.5 w-full">
          <Label for="main-edit-end-date">End Date *</Label>
          <Popover>
            <PopoverTrigger as-child>
              <Button variant="outline" :class="cn('w-full justify-start text-left font-normal', !mainEditEndDateForPicker && 'text-muted-foreground')">
                <CalendarDays class="mr-2 h-4 w-4" />
                {{ mainEditEndDateForPicker ? dateFormatter.format(mainEditEndDateForPicker.toDate(getLocalTimeZone())) : "Pick an end date" }}
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-auto p-0">
              <Calendar v-model="mainEditEndDateForPicker" initial-focus :min-value="mainEditStartDateForPicker" />
            </PopoverContent>
          </Popover>
        </div>
      </template>
    </div>
    <DialogFooter class="pt-4 border-t">
      <Button variant="outline" @click="isMainRequestEditDialogOpen = false">Cancel</Button>
      <Button @click="saveMainRequestChanges" class="text-foreground" :disabled="isLoading">
        <RefreshCw v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
        Save Changes
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

  </div>
</template>