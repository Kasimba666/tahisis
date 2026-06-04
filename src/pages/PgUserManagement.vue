<template>
  <div class="pg-user-management">
    <h3>Управление пользователями</h3>

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
        default-sort="{prop: 'created_at', order: 'descending'}"
    >
      <el-table-column prop="id" label="ID" width="90" sortable />
      <el-table-column prop="full_name" label="Имя" sortable resizable min-width="180">
        <template #default="{ row }">
          <div v-if="editRowId === row.id">
            <el-input v-model="editRow.full_name" />
          </div>
          <div v-else>
            {{ row.full_name || '—' }}
          </div>
        </template>
      </el-table-column>

      <el-table-column prop="role" label="Роль" width="160" sortable>
        <template #default="{ row }">
          <div v-if="editRowId === row.id">
            <el-select v-model="editRow.role" placeholder="Выберите роль">
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
              @change="(val) => { editRow.is_active = val }"
          />
        </template>
      </el-table-column>

      <el-table-column prop="created_at" label="Создан" width="180" sortable>
        <template #default="{ row }">
          {{ formatDate(row.created_at) }}
        </template>
      </el-table-column>

      <el-table-column label="Действия" width="200" fixed="right">
        <template #default="{ row }">
          <div v-if="editRowId === row.id">
            <el-button type="success" size="small" @click="updateRow(row.id)">Сохранить</el-button>
            <el-button type="warning" size="small" @click="cancelEdit">Отменить</el-button>
          </div>
          <div v-else>
            <el-button type="primary" size="small" @click="startEdit(row)">Редактировать</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import { supabase } from '@/services/supabase'
import { ElMessage } from 'element-plus'

export default {
  name: 'PgUserManagement',
  data() {
    return {
      tableData: [],
      editRowId: null,
      editRow: {}
    }
  },
  methods: {
    fetchData() {
      supabase
          .from('user_profiles')
          .select('*')
          .order('created_at', { ascending: false })
          .then(({ data, error }) => {
            if (error) {
              console.error('Error fetching user profiles:', error)
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

  h3 {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0 0 1.5rem 0;
    background: linear-gradient(135deg, var(--accent-primary), var(--accent-hover));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .table-info {
    margin-bottom: 1rem;
  }
}
</style>