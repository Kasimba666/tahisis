<template>
  <div class="pg-user-management">
    <div class="header-row">
      <h3>Управление пользователями</h3>
      <el-button type="primary" size="small" @click="openCreateDialog">
        <el-icon style="margin-right: 4px"><plus /></el-icon>
        Пригласить пользователя
      </el-button>
    </div>

    <div class="table-info">
      <el-alert
          type="info"
          :closable="false"
          show-icon
      >
        <template #title>
          Всего пользователей: {{ tableData.length }}
        </template>
      </el-alert>
    </div>

    <el-table
        :data="tableData"
        style="width: 100%"
        :default-sort="{ prop: 'created_at', order: 'descending' }"
        empty-text="Нет пользователей"
    >
      <el-table-column prop="id" label="ID" width="90" sortable show-overflow-tooltip />

      <el-table-column label="Email" sortable resizable min-width="200">
        <template #default="{ row }">
          {{ row.email || '—' }}
        </template>
      </el-table-column>

      <el-table-column prop="full_name" label="Имя" sortable resizable min-width="180">
        <template #default="{ row }">
          <div v-if="editRowId === row.id">
            <el-input v-model="editRow.full_name" size="small" />
          </div>
          <div v-else>
            {{ row.full_name || '—' }}
          </div>
        </template>
      </el-table-column>

      <el-table-column prop="role" label="Роль" width="160" sortable>
        <template #default="{ row }">
          <div v-if="editRowId === row.id">
            <el-select v-model="editRow.role" placeholder="Выберите роль" size="small">
              <el-option label="Администратор" value="admin" />
              <el-option label="Редактор" value="editor" />
              <el-option label="Исследователь" value="researcher" />
              <el-option label="Гость" value="guest" />
            </el-select>
          </div>
          <div v-else>
            <el-tag
                :type="roleTagType(row.role)"
                size="small"
            >
              {{ roleLabel(row.role) }}
            </el-tag>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="Активен" width="100" align="center">
        <template #default="{ row }">
          <el-switch
              :model-value="row.is_active"
              :disabled="editRowId !== row.id"
              size="small"
              @change="(val) => { editRow.is_active = val }"
          />
        </template>
      </el-table-column>

      <el-table-column prop="created_at" label="Создан" width="180" sortable>
        <template #default="{ row }">
          {{ formatDate(row.created_at) }}
        </template>
      </el-table-column>

      <el-table-column label="Действия" width="240" fixed="right">
        <template #default="{ row }">
          <div v-if="editRowId === row.id" class="action-btns">
            <el-button type="success" size="small" @click="updateRow(row.id)">Сохранить</el-button>
            <el-button type="warning" size="small" @click="cancelEdit">Отменить</el-button>
          </div>
          <div v-else class="action-btns">
            <el-button type="primary" size="small" @click="startEdit(row)">Редактировать</el-button>
            <el-popconfirm
                title="Удалить пользователя?"
                confirm-button-text="Удалить"
                cancel-button-text="Отмена"
                @confirm="deleteUser(row)"
            >
              <template #reference>
                <el-button type="danger" size="small">Удалить</el-button>
              </template>
            </el-popconfirm>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <!-- Диалог создания пользователя (только для администраторов) -->
    <el-dialog
        v-model="createDialogVisible"
        title="Пригласить пользователя"
        width="450px"
        :close-on-click-modal="false"
    >
      <el-form
          ref="createFormRef"
          :model="createForm"
          :rules="createFormRules"
          label-width="120px"
          size="small"
      >
        <el-form-item label="Email" prop="email">
          <el-input v-model="createForm.email" placeholder="user@example.com" />
        </el-form-item>
        <el-form-item label="Имя" prop="full_name">
          <el-input v-model="createForm.full_name" placeholder="Имя пользователя" />
        </el-form-item>
        <el-form-item label="Роль" prop="role">
          <el-select v-model="createForm.role" placeholder="Выберите роль" style="width: 100%">
            <el-option label="Редактор" value="editor" />
            <el-option label="Исследователь" value="researcher" />
            <el-option label="Гость" value="guest" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button size="small" @click="createDialogVisible = false">Отмена</el-button>
        <el-button type="primary" size="small" :loading="createLoading" @click="createUser">
          Пригласить
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { supabase } from '@/services/supabase'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

export default {
  name: 'PgUserManagement',
  components: { Plus },
  data() {
    return {
      tableData: [],
      editRowId: null,
      editRow: {},
      createDialogVisible: false,
      createLoading: false,
      createForm: {
        email: '',
        full_name: '',
        role: 'researcher'
      },
      createFormRules: {
        email: [
          { required: true, message: 'Введите email', trigger: 'blur' },
          { type: 'email', message: 'Некорректный email', trigger: 'blur' }
        ],
        role: [
          { required: true, message: 'Выберите роль', trigger: 'change' }
        ]
      }
    }
  },
  methods: {
    fetchData() {
      // Загружаем всех пользователей напрямую из user_profiles
      // RLS-политики разрешают администратору видеть всех пользователей
      supabase
          .from('user_profiles')
          .select('*')
          .order('created_at', { ascending: false })
          .then(({ data, error }) => {
            if (error) {
              console.error('Error fetching user_profiles:', error)
              ElMessage.error('Ошибка загрузки пользователей')
              return
            }
            this.tableData = data || []
          })
    },

    roleLabel(role) {
      const labels = {
        admin: 'Администратор',
        editor: 'Редактор',
        researcher: 'Исследователь',
        guest: 'Гость'
      }
      return labels[role] || role
    },

    roleTagType(role) {
      const types = {
        admin: 'danger',
        editor: 'warning',
        researcher: 'primary',
        guest: 'info'
      }
      return types[role] || 'info'
    },

    formatDate(dateStr) {
      if (!dateStr) return '—'
      const date = new Date(dateStr)
      return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    },

    startEdit(row) {
      this.editRowId = row.id
      this.editRow = {
        full_name: row.full_name || '',
        role: row.role,
        is_active: row.is_active
      }
    },

    cancelEdit() {
      this.editRowId = null
      this.editRow = {}
    },

    updateRow(id) {
      supabase
          .from('user_profiles')
          .update({
            full_name: this.editRow.full_name || null,
            role: this.editRow.role,
            is_active: this.editRow.is_active
          })
          .eq('id', id)
          .then(({ error }) => {
            if (error) {
              console.error('Error updating user profile:', error)
              ElMessage.error('Ошибка обновления пользователя')
              return
            }
            ElMessage.success('Пользователь обновлён')
            this.cancelEdit()
            this.fetchData()
          })
    },

    openCreateDialog() {
      this.createForm = {
        email: '',
        full_name: '',
        role: 'researcher'
      }
      this.createDialogVisible = true
    },

    createUser() {
      this.$refs.createFormRef.validate((valid) => {
        if (!valid) return

        this.createLoading = true

        supabase
            .rpc('admin_invite_user', {
              p_email: this.createForm.email,
              p_full_name: this.createForm.full_name || null,
              p_role: this.createForm.role
            })
            .then(({ data, error }) => {
              if (error) {
                console.error('Error inviting user via RPC:', error)
                ElMessage.error('Ошибка при приглашении пользователя: ' + error.message)
                this.createLoading = false
                return
              }

              ElMessage.success('Пользователь приглашён. Ему нужно войти с созданным email.')
              this.createDialogVisible = false
              this.createLoading = false
              this.fetchData()
            })
            .catch((err) => {
              console.error('Invite user error:', err)
              ElMessage.error('Ошибка при приглашении пользователя')
              this.createLoading = false
            })
      })
    },

    deleteUser(row) {
      supabase
          .rpc('admin_delete_user', { p_user_id: row.id })
          .then(({ data, error }) => {
            if (error) {
              console.warn('RPC admin_delete_user not available, deactivating user:', error.message)
              return supabase
                  .from('user_profiles')
                  .update({ is_active: false })
                  .eq('id', row.id)
            }
            ElMessage.success('Пользователь удалён')
            this.fetchData()
            return null
          })
          .then((result) => {
            if (result && !result.error) {
              ElMessage.success('Пользователь деактивирован')
              this.fetchData()
            } else if (result?.error) {
              ElMessage.error('Ошибка удаления пользователя')
            }
          })
    }
  },
  created() {
    this.fetchData()
  }
}
</script>

<style scoped lang="scss">
.pg-user-management {
  padding: 1rem;

  .header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;

    h3 {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
      background: linear-gradient(135deg, var(--accent-primary), var(--accent-hover));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
  }

  .table-info {
    margin-bottom: 1rem;
  }

  .action-btns {
    display: flex;
    gap: 4px;
  }
}
</style>