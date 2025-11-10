<template>
  <el-dialog
      v-model="dialogVisible"
      title="Авторизация"
      width="350px"
      class="auth-modal"
      :append-to-body="true"
      :destroy-on-close="true"
      center
  >
    <el-form
        ref="form"
        :model="formData"
        label-position="top"
        class="auth-form"
        @submit.prevent="signIn"
    >
      <el-form-item label="Email" prop="email">
        <el-input v-model="formData.email" placeholder="your@email.com" type="email" />
      </el-form-item>
      <el-form-item label="Пароль" prop="password">
        <el-input
            v-model="formData.password"
            placeholder="••••••••"
            type="password"
            show-password
        />
      </el-form-item>
      <el-form-item>
        <el-button
            type="primary"
            @click="signIn"
            class="auth-button"
            :loading="loading"
            native-type="submit"
        >
          Войти
        </el-button>
      </el-form-item>
    </el-form>
  </el-dialog>
</template>

<script>
import { ElMessage } from 'element-plus'
import { supabase } from '@/services/supabase.js'

export default {
  name: 'AuthModal',
  props: {
    modelValue: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      loading: false,
      formData: {
        email: '',
        password: ''
      }
    }
  },
  computed: {
    dialogVisible: {
      get() {
        return this.modelValue
      },
      set(value) {
        this.$emit('update:modelValue', value)
      }
    }
  },
  methods: {
    closeDialog() {
      this.dialogVisible = false
    },

    signIn() {
      this.loading = true
      supabase.auth.signInWithPassword({
        email: this.formData.email,
        password: this.formData.password
      })
          .then(({ error }) => {
            if (error) {
              ElMessage.error(error.message)
            } else {
              ElMessage.success('Signed in successfully!')
              this.closeDialog()
            }
          })
          .catch(error => {
            ElMessage.error(error.message)
          })
          .finally(() => {
            this.loading = false
          })
    },

  }
}
</script>

<style scoped lang="scss">
.auth-modal {
  // Overrides for Element Plus dialog to be more compact
  :deep(.el-dialog__header) {
    padding: 3px;
    margin-right: 0;
  }

  :deep(.el-dialog__body) {
    padding: 3px;
  }
}

.auth-form {
  :deep(.el-form-item) {
    margin-bottom: 3px;
  }
  :deep(.el-form-item__label) {
    padding-bottom: 2px;
    line-height: 1.2;
  }
}

.auth-button {
  width: 100%;
}
</style>
