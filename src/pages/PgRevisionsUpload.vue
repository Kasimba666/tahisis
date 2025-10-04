<template>
  <div class="PgRevisionsUpload">
    <ExcelRevisionsUpload @dataProcessed="fetchData" />

    <el-table :data="tableData" style="width: 100%">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="code" label="Код" width="100" />
      <el-table-column prop="quantity_all" label="Всего" width="100" />
      <el-table-column prop="revision" label="Ревизия" />
      <el-table-column label="Сословие">
        <template #default="{ row }">
          {{ row.subtype_name }}
        </template>
      </el-table-column>
      <el-table-column prop="men_quantity" label="Муж." width="100" />
      <el-table-column prop="women_quantity" label="Жен." width="100" />
    </el-table>
  </div>
</template>

<script>
import { supabase } from '@/services/supabase'
import ExcelRevisionsUpload from '@/components/ExcelRevisionsUpload.vue'

export default {
  name: 'PgRevisionsUpload',
  components: { ExcelRevisionsUpload },
  data() {
    return {
      tableData: []
    }
  },
  methods: {
    async fetchData() {
      const { data, error } = await supabase
          .from('Estate')
          .select(`
          id, men_quantity, women_quantity,
          Report_record (
            id, code, quantity_all,
            Revision_report ( year, number )
          ),
          Subtype_estate ( name )
        `)
      if (error) {
        console.error(error)
        return
      }
      this.tableData = data.map(e => ({
        id: e.id,
        code: e.Report_record?.code || '',
        quantity_all: e.Report_record?.quantity_all || '',
        revision: e.Report_record?.Revision_report
            ? `${e.Report_record.Revision_report.number} (${e.Report_record.Revision_report.year})`
            : '',
        subtype_name: e.Subtype_estate?.name || '',
        men_quantity: e.men_quantity || '',
        women_quantity: e.women_quantity || ''
      }))
    }
  },
  mounted() {
    this.fetchData()
  }
}
</script>

<style scoped>
.PgRevisionsUpload {
  padding: 1rem;
}
</style>
