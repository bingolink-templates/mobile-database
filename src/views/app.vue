<template>
    <div style="flex:1">
        <database></database>
    </div>
</template>

<!--引入bui-weex样式文件-->
<style lang="scss" src="bui-weex/src/css/buiweex.scss"></style>

<script>
    import database from "./database.vue";
    module.exports = {
        data () {
            return {}
        },
        components: {
          database
        }
    }
</script>