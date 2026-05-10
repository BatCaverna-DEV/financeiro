<template>
  <div class="app-wrapper">
    <Sidebar :open="sidebarOpen" @close="sidebarOpen = false" />
    <div class="main-wrapper">
      <Navbar @toggle-sidebar="sidebarOpen = !sidebarOpen" />
      <main class="main-content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Sidebar from './Sidebar.vue'
import Navbar  from './Navbar.vue'

const sidebarOpen = ref(false)
</script>

<style scoped>
.app-wrapper {
  display: flex;
  min-height: 100vh;
  background: #f4f6fb;
}
.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.main-content {
  flex: 1;
  padding: 1.75rem;
  overflow-y: auto;
}
</style>
