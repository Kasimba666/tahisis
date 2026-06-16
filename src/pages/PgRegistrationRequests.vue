<template>
  <div class="pg-registration-requests">
    <div class="header-row">
      <h3>Заявки на регистрацию</h3>
    </div>

    <div class="table-info">
      <el-alert
          type="info"
          :closable="false"
          show-icon
      >
        <template #title>
          Всего заявок: {{ tableData.length }}
        </template>
      </el-alert>
    </div>

    <el-table
        :data="tableData"
        style="width: 100%"
        :default-sort="{ prop: 'created_at', order: 'descending' }"
        empty-text="Нет заявок"
    >
      <el-table-column prop="id" label="ID" width="70" sortable />

      <el-table-column prop="user_id" label="ID пользователя" sortable resizable min-width="150">
        <template #default="{ row }">
          <span class="user-id-cell">{{ row.user_id?.substring(0, 8) }}...</span>
        </template>
      </el-table-column>

      <el-table-column prop="full_name" label="ФИО" sortable resizable min-width="160">
        <template #default="{ row }">
          {{ row.full_name || '—' }}
        </template>
      </el-table-column>

      <el-table-column prop="organization" label="Организация" resizable min-width="130">
        <template #default="{ row }">
          {{ row.organization || '—' }}
        </template>
      </el-table-column>

      <el-table-column prop="requested_role" label="Роль" width="120" sortable>
        <template #default="{ row }">
          <el-tag
              :type="row.requested_role === 'editor' ? 'warning' : 'primary'"
              size="small"
          >
            {{ row.requested_role === 'editor' ? 'Редактор' : 'Исследователь' }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="comment" label="Комментарий" resizable min-width="150">
        <template #default="{ row }">
          {{ row.comment || '—' }}
        </template>
      </el-table-column>

      <el-table-column prop="status" label="Статус" width="100" sortable>
        <template #default="{ row }">
          <el-tag
              :type="statusTagType(row.status)"
              size="small"
          >
            {{ statusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="created_at" label="Создан" width="140" sortable>
        <template #default="{ row }">
          {{ formatDate(row.created_at) }}
        </template>
      </el-table-column>

      <el-table-column label="Действия" width="280" fixed="right">
        <template #default="{ row }">
          <div class="action-btns">
            <el-button
                type="primary"
                size="small"
                @click="openEditDialog(row)"
            >
              Редактировать
            </el-button>
            <template v-if="row.status === 'pending'">
              <el-button
                  type="success"
                  size="small"
                  :loading="approvingId === row.id"
                  @click="approveRequest(row)"
              >
                Одобрить
              </el-button>
              <el-popconfirm
                  title="Отклонить заявку?"
                  confirm-button-text="Отклонить"
                  cancel-button-text="Отмена"
                  @confirm="rejectRequest(row)"
              >
                <template #reference>
                  <el-button
                      type="warning"
                      size="small"
                      :loading="rejectingId === row.id"
                  >
                    Отклонить
                  </el-button>
                </template>
              </el-popconfirm>
            </template>
            <el-popconfirm
                title="Удалить заявку навсегда?"
                confirm-button-text="Удалить"
                cancel-button-text="Отмена"
                @confirm="deleteRequest(row)"
            >
              <template #reference>
                <el-button
                    type="danger"
                    size="small"
                    :loading="deletingId === row.id"
                >
                  Удалить
                </el-button>
              </template>
            </el-popconfirm>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <!-- Диалог редактирования заявки -->
    <el-dialog
        v-model="editDialogVisible"
        title="Редактировать заявку"
        width="450px"
        :close-on-click-modal="false"
    >
      <el-form
          ref="editFormRef"
          :model="editForm"
          label-position="top"
          size="small"
      >
        <el-form-item label="ФИО" prop="full_name">
          <el-input v-model="editForm.full_name" />
        </el-form-item>
        <el-form-item label="Организация" prop="organization">
          <el-input v-model="editForm.organization" placeholder="(необязательно)" />
        </el-form-item>
        <el-form-item label="Запрашиваемая роль" prop="requested_role">
          <el-select v-model="editForm.requested_role" style="width: 100%">
            <el-option label="Исследователь" value="researcher" />
            <el-option label="Редактор" value="editor" />
          </el-select>
        </el-form-item>
        <el-form-item label="Комментарий" prop="comment">
          <el-input
              v-model="editForm.comment"
              type="textarea"
              :rows="2"
              placeholder="(необязательно)"
          />
        </el-form-item>
        <el-form-item label="Статус" prop="status">
          <el-select v-model="editForm.status" style="width: 100%">
            <el-option label="Ожидает" value="pending" />
            <el-option label="Одобрен" value="approved" />
            <el-option label="Отклонён" value="rejected" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button size="small" @click="editDialogVisible = false">Отмена</el-button>
        <el-button type="primary" size="small" :loading="editLoading" @click="saveEdit">
          Сохранить
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { supabase } from '@/services/supabase'
import { ElMessage } from 'element-plus'
import { state as authState } from '@/store/auth'

export default {
  name: 'PgRegistrationRequests',
  data() {
    return {
      tableData: [],
      approvingId: null,
      rejectingId: null,
      deletingId: null,
      editDialogVisible: false,
      editLoading: false,
      editFormRef: null,
      editForm: {
        id: null,
        full_name: '',
        organization: '',
        requested_role: 'researcher',
        comment: '',
        status: 'pending'
      }
    }
  },
  methods: {
    fetchData() {
      supabase
          .from('registration_request')
          .select('*')
          .order('created_at', { ascending: false })
          .then(({ data, error }) => {
            if (error) {
              console.error('Error fetching registration requests:', error)
              ElMessage.error('Ошибка загрузки заявок')
              return
            }
            this.tableData = data || []
          })
    },

    statusLabel(status) {
      const labels = {
        pending: 'Ожидает',
        approved: 'Одобрен',
        rejected: 'Отклонён'
      }
      return labels[status] || status
    },

    statusTagType(status) {
      const types = {
        pending: 'info',
        approved: 'success',
        rejected: 'danger'
      }
      return types[status] || 'info'
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

    openEditDialog(row) {
      this.editForm = {
        id: row.id,
        full_name: row.full_name || '',
        organization: row.organization || '',
        requested_role: row.requested_role,
        comment: row.comment || '',
        status: row.status
      }
      this.editDialogVisible = true
    },

    saveEdit() {
      this.editLoading = true

      supabase
          .from('registration_request')
          .update({
            full_name: this.editForm.full_name,
            organization: this.editForm.organization || null,
            requested_role: this.editForm.requested_role,
            comment: this.editForm.comment || null,
            status: this.editForm.status,
            reviewed_by: this.editForm.status !== 'pending'
                ? (authState.user?.id || null)
                : null,
            reviewed_at: this.editForm.status !== 'pending'
                ? new Date().toISOString()
                : null
          })
          .eq('id', this.editForm.id)
          .then(({ error }) => {
            this.editLoading = false
            if (error) {
              ElMessage.error('Ошибка сохранения: ' + error.message)
              return
            }

            // Если статус approved — обновляем user_profiles
            if (this.editForm.status === 'approved') {
              const row = this.tableData.find(r => r.id === this.editForm.id)
              if (row) {
                supabase
                    .from('user_profiles')
                    .update({
                      role: this.editForm.requested_role,
                      is_active: true,
                      approved_at: new Date().toISOString()
                    })
                    .eq('id', row.user_id)
                    .then(() => {})
              }
            }

            ElMessage.success('Заявка обновлена')
            this.editDialogVisible = false
            this.fetchData()
          })
          .catch((err) => {
            this.editLoading = false
            ElMessage.error('Произошла ошибка: ' + (err.message || err))
          })
    },

    approveRequest(row) {
      this.approvingId = row.id

      supabase
          .rpc('approve_registration_request', {
            p_request_id: row.id,
            p_reviewer_id: authState.user?.id || null
          })
          .then(({ data, error }) => {
            this.approvingId = null
            if (error) {
              ElMessage.error('Ошибка одобрения заявки: ' + error.message)
              return
            }
            if (data && data.success === false) {
              ElMessage.error('Ошибка: ' + (data.error || 'неизвестная ошибка'))
              return
            }
            ElMessage.success('Заявка одобрена. Пользователь получил роль ' +
                (row.requested_role === 'editor' ? 'Редактор' : 'Исследователь'))
            this.fetchData()
          })
          .catch((err) => {
            this.approvingId = null
            ElMessage.error('Произошла ошибка: ' + (err.message || err))
          })
    },

    rejectRequest(row) {
      this.rejectingId = row.id

      supabase
          .from('registration_request')
          .update({
            status: 'rejected',
            reviewed_by: authState.user?.id || null,
            reviewed_at: new Date().toISOString()
          })
          .eq('id', row.id)
          .then(({ error }) => {
            this.rejectingId = null
            if (error) {
              ElMessage.error('Ошибка отклонения заявки: ' + error.message)
              return
            }
            ElMessage.success('Заявка отклонена')
            this.fetchData()
          })
          .catch((err) => {
            this.rejectingId = null
            ElMessage.error('Произошла ошибка: ' + (err.message || err))
          })
    },

    deleteRequest(row) {
      this.deletingId = row.id

      supabase
          .from('registration_request')
          .delete()
          .eq('id', row.id)
          .then(({ error }) => {
            this.deletingId = null
            if (error) {
              ElMessage.error('Ошибка удаления: ' + error.message)
              return
            }
            ElMessage.success('Заявка удалена')
            this.fetchData()
          })
          .catch((err) => {
            this.deletingId = null
            ElMessage.error('Произошла ошибка: ' + (err.message || err))
          })
    }
  },
  created() {
    this.fetchData()
  }
}
</script>

<style scoped lang="scss">
.pg-registration-requests {
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
    flex-wrap: wrap;
  }

  .user-id-cell {
    font-family: monospace;
    font-size: 0.85rem;
    color: var(--text-secondary);
  }
}
</style>