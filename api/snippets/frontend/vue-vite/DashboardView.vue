<script setup lang="ts">
import { useAuth0 } from '@auth0/auth0-vue'

const { user, logout } = useAuth0()

function handleLogout() {
  logout({ logoutParams: { returnTo: window.location.origin } })
}
</script>

<template>
  <div>
    <h1>Welcome, {{ user?.name }}</h1>
    <p>{{ user?.email }}</p>
    <button @click="handleLogout">
      Log out
    </button>
  </div>
</template>
