<script setup>
import { ref } from "vue";
const count = ref(0);
</script>

<template>
    <div>
        <NuxtRouteAnnouncer />
        <NuxtWelcome />
        <button @click="count++">Count is: {{ count }}</button>
    </div>
</template>
