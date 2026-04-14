<template>
  <div class="help-page">
    <div class="help-container">
      <h1>📖 Руководство пользователя</h1>

      <div class="help-sections">
        <el-collapse v-model="activeSections">
          <el-collapse-item title="🔍 Работа с фильтрами" name="filters">
            <ul>
              <li>Выберите необходимые значения в фильтрах</li>
              <li>Можно выбрать несколько значений одновременно</li>
              <li>При выборе района автоматически фильтруется список населённых пунктов</li>
              <li>При выборе типа сословия автоматически фильтруется список подтипов</li>
              <li>Для применения фильтров нажмите кнопку <strong>"Применить"</strong></li>
              <li>Активные фильтры отображаются сверху в виде тегов</li>
              <li>Чтобы убрать фильтр нажмите крестик на теге или кнопку <strong>"Сбросить значения"</strong></li>
              <li>Вы можете получить постоянную ссылку с выбранными фильтрами нажав <strong>"Получить ссылку с фильтрами"</strong></li>
            </ul>
          </el-collapse-item>

          <el-collapse-item title="🏘️ Населённые пункты" name="settlements">
            <ul>
              <li>На странице отображается карта и список всех населённых пунктов</li>
              <li>При наведении на маркер на карте появляется подсказка с названием</li>
              <li>При клике на маркер открывается детальная информация</li>
              <li>В таблице можно сортировать данные по любому столбцу кликнув по заголовку</li>
              <li>Панели карты и таблицы можно изменять перетаскивая разделитель</li>
            </ul>
          </el-collapse-item>

          <el-collapse-item title="🧑🤝🧑 Сословия" name="estates">
            <ul>
              <li>Страница показывает сводную статистику по всем типам и подтипам сословий</li>
              <li>В таблице отображается количество населённых пунктов, мужчин, женщин и общая численность</li>
              <li>Кликните на строку таблицы чтобы открыть детальную информацию по подтипу сословия</li>
              <li>Внизу таблицы отображаются итоговые суммы по всем столбцам</li>
              <li>Цветные индикаторы слева показывают цвет соответствующего типа сословия</li>
            </ul>
          </el-collapse-item>

          <el-collapse-item title="📑 Ревизии" name="revisions">
            <ul>
              <li>Здесь отображаются все записи ревизских сказок по годам</li>
              <li>Каждая запись содержит данные о населении на момент ревизии</li>
              <li>Можно фильтровать по номеру ревизии и году</li>
              <li>Доступен фильтр по количеству сословий в записи</li>
              <li>Поддерживается сортировка по всем полям</li>
            </ul>
          </el-collapse-item>

          <el-collapse-item title="⚙️ Настройки" name="settings">
            <ul>
              <li>Переключение между светлой и тёмной темой</li>
              <li>Настройка отображения карты</li>
              <li>Выбор провайдера карт</li>
              <li>Настройка единиц измерения</li>
            </ul>
          </el-collapse-item>

          <el-collapse-item title="🔐 Авторизация" name="auth">
            <ul>
              <li>Для доступа к разделу "Управление данными" необходимо авторизоваться</li>
              <li>Нажмите кнопку <strong>"Войти"</strong> в правом верхнем углу</li>
              <li>После входа появится меню с административными функциями</li>
              <li>Авторизованные пользователи могут добавлять и редактировать данные</li>
            </ul>
          </el-collapse-item>

          <el-collapse-item title="💡 Советы и особенности" name="tips">
            <ul>
              <li>Все фильтры сохраняются автоматически при закрытии браузера</li>
              <li>При обновлении страницы состояние фильтров восстанавливается</li>
              <li>Ссылки с фильтрами можно отправлять другим пользователям</li>
              <li>Сайт адаптирован для работы на мобильных устройствах</li>
              <li>Для быстрого поиска внутри фильтров используйте поле поиска в выпадающих списках</li>
            </ul>
          </el-collapse-item>
        </el-collapse>
      </div>

      <div class="help-footer">
        <p>Если у вас возникли вопросы или нашли ошибку в работе сайта - свяжитесь с администратором.</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PgHelp',
  data() {
    return {
      activeSections: ['filters', 'settlements', 'estates', 'revisions', 'settings', 'auth', 'tips']
    }
  }
}
</script>

<style scoped lang="scss">
@use '@/styles/themes.scss' as *;

.help-page {
  padding: 1rem;
  max-width: 1000px;
  margin: 0 auto;
}

.help-container {
  background-color: var(--bg-secondary);
  border-radius: 8px;
  padding: 2rem;

  h1 {
    text-align: center;
    color: var(--text-primary);
    margin-bottom: 2rem;
  }
}

.help-sections {
  :deep(.el-collapse) {
    border: none;
    background: transparent;

    .el-collapse-item {
      border: 1px solid var(--border-color);
      border-radius: 6px;
      margin-bottom: 0.5rem;
      background-color: var(--bg-primary);

      .el-collapse-item__header {
        padding: 0.75rem 1rem;
        font-weight: 500;
        color: var(--text-primary);
      }

      .el-collapse-item__wrap {
        border-top: 1px solid var(--border-color);
      }

      .el-collapse-item__content {
        padding: 1rem 1.5rem;
        color: var(--text-secondary);
        line-height: 1.6;

        ul {
          margin: 0;
          padding-left: 1.25rem;

          li {
            margin-bottom: 0.5rem;

            &:last-child {
              margin-bottom: 0;
            }
          }
        }
      }
    }
  }
}

.help-footer {
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
  text-align: center;
  color: var(--text-muted);
  font-size: 0.9rem;
}
</style>