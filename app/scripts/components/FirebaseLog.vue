<style lang="scss">
.firebase-log-table {
    border-collapse: collapse;
    th {
        text-align: left;
        font-weight: 600;
    }
    td,
    th {
        border: 1px solid var(--border-color);
        padding: 3px 5px;
    }
}
</style>
<template>
    <div class="log">
        <h3>Firebase Log</h3>
        <table class="firebase-log-table">
            <thead>
                <tr>
                    <th>Image/Key</th>
                    <th>Transcoding</th>
                </tr>
            </thead>
            <tbody>
                <tr
                    v-for="item in items"
                    :key="item.Key"
                >
                    <td>{{ item.Key }}</td>
                    <td>{{ item.transcoding }}</td>
                </tr>
            </tbody>
        </table>
    </div>
</template>
<script>
export default {
    name: 'FirebaseLog',
    computed: {
        items() {
            return this.$store.getters['log/items'];
        },
    },
};
</script>
