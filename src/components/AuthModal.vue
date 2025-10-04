<template>
  <el-dialog
      v-model="dialogVisible"
      title="Authentication"
      width="350px"
      class="auth-modal"
      :append-to-body="true"
      :destroy-on-close="true"
      center
  >
    <el-tabs v-model="activeTab" class="auth-tabs">
      <el-tab-pane label="Sign In" name="signIn"></el-tab-pane>
      <el-tab-pane label="Sign Up" name="signUp"></el-tab-pane>
    </el-tabs>

    <el-form
        ref="form"
        :model="formData"
        label-position="top"
        class="auth-form"
        @submit.prevent="handleAuth"
    >
      <el-form-item label="Email" prop="email">
        <el-input v-model="formData.email" placeholder="your@email.com" type="email" />
      </el-form-item>
      <el-form-item label="Password" prop="password">
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
            @click="handleAuth"
            class="auth-button"
            :loading="loading"
            native-type="submit"
        >
          {{ activeTab === 'signIn' ? 'Sign In' : 'Sign Up' }}
        </el-button>
      </el-form-item>
    </el-form>

    <el-divider>Or continue with</el-divider>

    <div class="oauth-providers">
      <el-button @click="signInWithProvider('github')" circle>
        <i class="fab fa-github"></i>
      </el-button>
      <el-button @click="signInWithProvider('google')" circle>
        <i class="fab fa-google"></i>
      </el-button>
    </div>
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
      activeTab: 'signIn',
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

    handleAuth() {
      if (this.activeTab === 'signIn') {
        this.signIn()
      } else {
        this.signUp()
      }
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

    signUp() {
      this.loading = true
      supabase.auth.signUp({
        email: this.formData.email,
        password: this.formData.password
      })
          .then(({ error }) => {
            if (error) {
              ElMessage.error(error.message)
            } else {
              ElMessage.info('Check your email for the confirmation link!')
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

    signInWithProvider(provider) {
      this.loading = true
      supabase.auth.signInWithOAuth({ provider })
          .catch(error => {
            ElMessage.error(error.message)
          })
          .finally(() => {
            this.loading = false;
          })
    }
  }
}
</script>

<style scoped lang="scss">
.auth-modal {
  // Overrides for Element Plus dialog to be more compact
  :deep(.el-dialog__header) {
    padding: 10px 15px;
    margin-right: 0;
  }

  :deep(.el-dialog__body) {
    padding: 5px 25px 20px 25px;
  }
}

.auth-form {
  :deep(.el-form-item) {
    margin-bottom: 12px;
  }
  :deep(.el-form-item__label) {
    padding-bottom: 2px;
    line-height: 1.2;
  }
}

.auth-button {
  width: 100%;
}

.oauth-providers {
  display: flex;
  justify-content: center;
  gap: 1rem;

  .el-button {
    font-size: 1.2rem;
  }
}

// Add FontAwesome if you haven't already
// For example, in your index.html:
// <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
</style>
