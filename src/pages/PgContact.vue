<template>
  <main class="pg-contact">
    <div class="page-header">
      <h1>Контакты</h1>
      <p>Свяжитесь с нами для обсуждения вашего проекта</p>
    </div>
    
    <div class="contact-content">
      <div class="contact-info">
        <div class="contact-card">
          <h3>📧 Email</h3>
          <p>info@example.com</p>
        </div>
        
        <div class="contact-card">
          <h3>📞 Телефон</h3>
          <p>+7 (999) 123-45-67</p>
        </div>
        
        <div class="contact-card">
          <h3>📍 Адрес</h3>
          <p>г. Москва, ул. Примерная, д. 123</p>
        </div>
        
        <div class="contact-card">
          <h3>🕒 Время работы</h3>
          <p>Пн-Пт: 9:00 - 18:00</p>
        </div>
      </div>
      
      <div class="contact-form">
        <h3>Напишите нам</h3>
        <el-form :model="form" label-width="120px">
          <el-form-item label="Имя">
            <el-input v-model="form.name" placeholder="Ваше имя" />
          </el-form-item>
          
          <el-form-item label="Email">
            <el-input v-model="form.email" type="email" placeholder="your@email.com" />
          </el-form-item>
          
          <el-form-item label="Сообщение">
            <el-input 
              v-model="form.message" 
              type="textarea" 
              :rows="4"
              placeholder="Расскажите о вашем проекте..."
            />
          </el-form-item>
          
          <el-form-item>
            <el-button type="primary" @click="submitForm">Отправить</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </main>
</template>

<script>
import { ElMessage } from 'element-plus'

export default {
  name: 'PgContact',
  data() {
    return {
      form: {
        name: '',
        email: '',
        message: ''
      }
    }
  },
  methods: {
    submitForm() {
      ElMessage.success('Сообщение отправлено! Мы свяжемся с вами в ближайшее время.')
    }
  }
}
</script>

<style scoped lang="scss">
@use '@/styles/themes.scss' as *;

.pg-contact {
  flex: 1;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.page-header {
  text-align: center;
  margin-bottom: 3rem;
  
  h1 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    color: var(--text-primary);
  }
  
  p {
    font-size: 1.2rem;
    color: var(--text-secondary);
  }
}

.contact-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
}

.contact-info {
  display: grid;
  gap: 1.5rem;
}

.contact-card {
  @include card-style;
  
  h3 {
    color: var(--accent-primary);
    margin-bottom: 0.5rem;
    font-size: 1.1rem;
  }
  
  p {
    color: var(--text-secondary);
    margin: 0;
  }
}

.contact-form {
  @include card-style;
  
  h3 {
    color: var(--text-primary);
    margin-bottom: 1.5rem;
  }
}

@media (max-width: 768px) {
  .pg-contact {
    padding: 1rem;
  }
  
  .page-header h1 {
    font-size: 2rem;
  }
  
  .contact-content {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
}
</style>
