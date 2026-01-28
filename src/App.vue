<template>
  <div class="app-layout" :class="{ 'dark-mode': isDarkMode }">
    <TopBar :current-route="($route.name as string)" />
    <ShortcutBar @toggle-dark-mode="toggleDarkMode" :is-dark-mode="isDarkMode" />
    <main class="content-area">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import TopBar from "./components/TopBar.vue";
import ShortcutBar from "./components/ShortcutBar.vue";

const isDarkMode = ref(false);

function toggleDarkMode() {
  isDarkMode.value = !isDarkMode.value;
}
</script>

<style>
:root {
  --bg-primary: #f8f9fa;
  --bg-secondary: #ffffff;
  --bg-tertiary: #f3f4f6;
  --bg-quaternary: #fafafa;
  --text-primary: #212529;
  --text-secondary: #374151;
  --border-color: #e5e7eb;
  --hover-color: #e5e7eb;
}

.dark-mode {
  --bg-primary: #1a1a1a;
  --bg-secondary: #2d2d2d;
  --bg-tertiary: #242424;
  --bg-quaternary: #333333;
  --text-primary: #e5e5e5;
  --text-secondary: #d1d5db;
  --border-color: #404040;
  --hover-color: #404040;
}

body,
#app {
  margin: 0;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  transition:
    background-color 0.3s ease,
    color 0.3s ease;
  user-select: none;
  -webkit-user-select: none;
}

img {
  -webkit-user-drag: none;
}

input, textarea {
  user-select: text;
  -webkit-user-select: text;
}


img {
  -webkit-user-drag: none;
}

input, textarea {
  user-select: text;
  -webkit-user-select: text;
}
</style>

<style scoped>
.app-layout {
  display: grid;
  height: 100vh;
  grid-template-rows: 60px 1fr;
  grid-template-columns: 60px 1fr;
  grid-template-areas:
    "shortcut topbar"
    "shortcut content-area";
}

.content-area {
  grid-area: content-area;
  overflow: hidden;
  background-color: var(--bg-primary);
}
</style>
