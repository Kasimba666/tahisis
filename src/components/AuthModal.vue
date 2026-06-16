<template>
  <el-dialog
      v-model="dialogVisible"
      :title="mode === 'login' ? 'Авторизация' : 'Заявка на регистрацию'"
      width="400px"
      class="auth-modal"
      :append-to-body="true"
      :destroy-on-close="true"
      center
  >
    <!-- Переключатель режимов -->
    <div class="mode-tabs">
      <el-button
          :type="mode === 'login' ? 'primary' : 'default'"
          size="small"
          @click="mode = 'login'"
      >
        Вход
      </el-button>
      <el-button
          :type="mode === 'register' ? 'primary' : 'default'"
          size="small"
          @click="mode = 'register'"
      >
        Заявка на регистрацию
      </el-button>
    </div>

    <!-- Форма входа -->
    <el-form
        v-if="mode === 'login'"
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

    <!-- Форма заявки на регистрацию -->
    <el-form
        v-if="mode === 'register'"
        ref="registerFormRef"
        :model="registerForm"
        :rules="registerFormRules"
        label-position="top"
        class="auth-form register-form"
        @submit.prevent="submitRegistrationRequest"
    >
      <el-form-item label="Email" prop="email">
        <el-input v-model="registerForm.email" placeholder="your@email.com" type="email" />
      </el-form-item>
      <el-form-item label="Пароль" prop="password">
        <el-input
            v-model="registerForm.password"
            placeholder="••••••••"
            type="password"
            show-password
        />
      </el-form-item>
      <el-form-item label="ФИО" prop="fullName">
        <el-input v-model="registerForm.fullName" placeholder="Иванов Иван Иванович" />
      </el-form-item>
      <el-form-item label="Организация" prop="organization">
        <el-input v-model="registerForm.organization" placeholder="Институт истории (необязательно)" />
      </el-form-item>
      <el-form-item label="Запрашиваемая роль" prop="requestedRole">
        <el-select v-model="registerForm.requestedRole" placeholder="Выберите роль" style="width: 100%">
          <el-option label="Исследователь" value="researcher" />
          <el-option label="Редактор" value="editor" />
        </el-select>
      </el-form-item>
      <el-form-item label="Комментарий" prop="comment">
        <el-input
            v-model="registerForm.comment"
            type="textarea"
            :rows="2"
            placeholder="Для чего вам нужен доступ? (необязательно)"
        />
      </el-form-item>
      <el-form-item>
        <el-button
            type="primary"
            @click="submitRegistrationRequest"
            class="auth-button"
            :loading="registerLoading"
            native-type="submit"
        >
          Отправить запрос
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
      mode: 'login',
      formData: {
        email: '',
        password: ''
      },
      registerLoading: false,
      registerForm: {
        email: '',
        password: '',
        fullName: '',
        organization: '',
        requestedRole: 'researcher',
        comment: ''
      },
      registerFormRules: {
        email: [
          { required: true, message: 'Введите email', trigger: 'blur' },
          { type: 'email', message: 'Некорректный email', trigger: 'blur' }
        ],
        password: [
          { required: true, message: 'Введите пароль', trigger: 'blur' },
          { min: 6, message: 'Пароль должен быть не менее 6 символов', trigger: 'blur' }
        ],
        fullName: [
          { required: true, message: 'Введите ФИО', trigger: 'blur' }
        ],
        requestedRole: [
          { required: true, message: 'Выберите роль', trigger: 'change' }
        ]
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
      this.mode = 'login'
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
              ElMessage.success('Вы успешно вошли!')
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

    submitRegistrationRequest() {
      this.$refs.registerFormRef.validate((valid) => {
        if (!valid) return

        this.registerLoading = true

        // 1. Create the user in Supabase Auth
        supabase.auth.signUp({
          email: this.registerForm.email,
          password: this.registerForm.password
        })
            .then(({ data, error }) => {
              if (error) {
                if (error.message?.includes('429') || error.status === 429) {
                  ElMessage.warning('Слишком много запросов. Пожалуйста, подождите минуту и попробуйте снова.')
                } else if (error.message?.includes('User already registered')) {
                  ElMessage.warning('Пользователь с таким email уже зарегистрирован. Вы можете войти в систему.')
                } else {
                  ElMessage.error('Ошибка создания учётной записи: ' + error.message)
                }
                this.registerLoading = false
                return
              }

              const userId = data.user?.id
              if (!userId) {
                ElMessage.error('Не удалось получить ID пользователя')
                this.registerLoading = false
                return
              }

              // 2. Call the SECURITY DEFINER function to create profile + registration request
              return supabase.rpc('create_registration_request', {
                p_user_id: userId,
                p_email: this.registerForm.email,
                p_full_name: this.registerForm.fullName,
                p_organization: this.registerForm.organization || null,
                p_requested_role: this.registerForm.requestedRole,
                p_comment: this.registerForm.comment || null
              })
            })
            .then(({ data, error }) => {
              this.registerLoading = false
              if (error) {
                ElMessage.error('Ошибка создания заявки: ' + error.message)
                return
              }
              if (data && data.success === false) {
                ElMessage.error('Ошибка создания заявки: ' + (data.error || 'неизвестная ошибка'))
                return
              }
              ElMessage.success('Заявка отправлена! Ожидайте подтверждения администратором.')
              this.closeDialog()
            })
            .catch((err) => {
              this.registerLoading = false
              ElMessage.error('Произошла ошибка: ' + (err.message || err))
            })
      })
    }
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

.mode-tabs {
  display: flex;
  gap: 4px;
  justify-content: center;
  margin-bottom: 8px;
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

.register-form {
  :deep(.el-form-item) {
    margin-bottom: 4px;
  }
}

.auth-button {
  width: 100%;
}
</style>
