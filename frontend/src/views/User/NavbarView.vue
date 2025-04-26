<script lang="ts">
export default {
    name: 'NavbarView'
}
import { RouterLink } from 'vue-router';

</script>

<template>
    <div class="w-full h-20 bg-[#1A33C1] top-0 flex justify-between items-center p-5">
        <RouterLink to="/user/dashboard">EduManage</RouterLink>
        <div class="flex flex-row h-full justify-center gap-5 items">
            <RouterLink to="/user/profile" class="h-10 px-5 flex flex-col justify-center cursor-pointer hover:underline">Profile</RouterLink>
            <RouterLink to="/login" class=" bg-red-400 h-10 px-5 rounded cursor-pointer hover:bg-red-500 transition-colors duration-300 flex flex-col justify-center">Logout</RouterLink>
        </div>
    </div>
</template>