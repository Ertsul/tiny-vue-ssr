<template>
  <div>
    hello
    <button @click="jumpTestPage">jumpTestPage</button>
  </div>
</template>

<script>
export default {
  methods: {
    jumpTestPage() {
      this.$router.push({
        name: 'Test'
      })
    }
  }
}
</script>

<style>

</style>