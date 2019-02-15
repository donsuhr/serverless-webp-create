<template>
    <div class="log">
        <h3>Log</h3>
        <ul>
            <li
                v-for="item in items"
                :key="item.Key"
            >
                {{ item.transcoding }}:{{ item.Key }}
            </li>
        </ul>
    </div>
</template>
<script>
export default {
    name: 'Log',
    computed: {
        items() {
            return this.$store.getters['log/items'];
        },
    },
};
</script>
