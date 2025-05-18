<script lang="ts" setup>
import { RouterLink, useRouter, useRoute } from 'vue-router';
import { useAccountService } from '@/_services/account.service';
import { useToastService } from '@/_services/toast.service';
import { type Toast } from '@/models/toast';
import { useAccountStore } from '@/stores/account';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Sun, Moon, LogOut, User, Users, Building2, FileText, RefreshCw } from 'lucide-vue-next';
import { useColorMode } from '@vueuse/core';
import { computed, ref, shallowRef, type Component } from 'vue'; // Added shallowRef and Component

// Define navigation items
interface NavItem {
  to: string;
  label: string;
  icon: Component; // Use Component type for icons
  adminOnly?: boolean;
  activePaths?: string[]; // Optional: for more complex active states if needed
}

const navItems: NavItem[] = [
  { to: '/admin/users', label: 'Accounts', icon: shallowRef(Users), adminOnly: true },
  { to: '/admin/employees', label: 'Employees', icon: shallowRef(Users), adminOnly: true },
  { to: '/admin/departments', label: 'Departments', icon: shallowRef(Building2), adminOnly: true },
  { to: '/admin/requests', label: 'Requests', icon: shallowRef(FileText), adminOnly: true },
  { to: '/profile', label: 'Profile', icon: shallowRef(User) },
];

const mode = useColorMode({ disableTransition: false });
const router = useRouter();
const route = useRoute();
const accountStore = useAccountStore();
const { logout } = useAccountService();
const toast = useToastService();

const isLoggingOut = ref(false);

const isAdmin = computed(() => accountStore.account?.role === 'Admin');

const homeLink = computed(() => isAdmin.value ? '/admin/users' : '/user/dashboard');

const displayedNavItems = computed(() => {
  return navItems.filter(item => isAdmin.value || !item.adminOnly);
});

const isActive = (itemPath: string) => {
  // Basic check, can be expanded with item.activePaths if needed
  return route.path === itemPath || route.path.startsWith(itemPath + '/'); // Handles sub-routes like /admin/users/1
};

const toggleTheme = () => {
  mode.value = mode.value === 'dark' ? 'light' : 'dark';
};

const handleLogout = async () => {
  isLoggingOut.value = true;
  try {
    await logout();
    accountStore.logout();
    toast.success({
      title: "Logout Successful",
      description: "Logged out successfully.",
    } as Toast); // Type assertion if needed, or ensure Toast model matches
    router.push('/login');
  } catch (error) {
    toast.error({
      title: 'Logout Failed',
      description: (error as Error).message,
    } as Toast);
  } finally {
    isLoggingOut.value = false;
  }
};
</script>

<template>
  <header
    class="sticky top-0 z-50 flex w-screen justify-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    <div class="container flex h-16 w-full items-center justify-between">
      <div class="flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
          <path d="M9 10h6" /><path d="M12 7v6" />
        </svg>
        <RouterLink :to="homeLink" class="text-lg font-semibold">EduManage</RouterLink>
      </div>

      <nav class="flex items-center gap-1">
        <!-- Navigation Links -->
        <RouterLink
          v-for="item in displayedNavItems"
          :key="item.to"
          :to="item.to"
          :class="isActive(item.to) ? 'text-primary dark:text-[#407cfd] pointer-events-none' : ''"
          custom
          v-slot="{ navigate, href }"
        >
          <Button as="a" :href="href" @click="navigate" variant="ghost" size="sm" class="gap-2">
            <component :is="item.icon" class="h-4 w-4" />
            <span :class="isActive(item.to) ? 'dark:text-shadow-md/30 dark:text-shadow-[#155dfc]' : ''">
              {{ item.label }}
            </span>
          </Button>
        </RouterLink>

        <!-- Theme Toggle -->
        <div class="flex items-center gap-2 pl-2">
          <Switch
            :model-value="mode === 'light'"
            @click="toggleTheme"
            class="data-[state=checked]:bg-foreground border-1 border-foreground"
          >
            <template #thumb>
              <Sun v-if="mode === 'light'" class="size-4 text-foreground" />
              <Moon v-else class="size-4 text-background" />
            </template>
          </Switch>
        </div>

        <!-- Logout Button -->
        <Button :disabled="isLoggingOut" variant="outline" size="sm" class="ml-2 gap-1" @click="handleLogout">
          <RefreshCw v-if="isLoggingOut" class="h-4 w-4 animate-spin" />
          <LogOut v-else class="h-4 w-4" />
          <span>Logout</span>
        </Button>
      </nav>
    </div>
  </header>
</template>