import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { type Account } from '@/models/account'
export const useAccountStore = defineStore('account', () => {
  const account = ref<Account | null>(null)
  const isLoggedIn = computed(() => account.value !== null)
  function login(newAccount: Account) {
    account.value = newAccount
  }
  function logout() {
    account.value = null
  }
  function getAccount() {
    return account.value
  }
  function setAccount(newAccount: Account) {
    account.value = newAccount
  }

  return { account, isLoggedIn, login, logout, getAccount, setAccount }
},{persist: true})
