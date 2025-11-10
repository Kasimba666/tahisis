import { reactive } from 'vue'

// Centralized store для состояния страниц (активные вкладки, режимы просмотра и т.д.)
const pageState = reactive({
  // Активные вкладки для страниц
  tabs: {
    'pg-estate-types': 'types',
    'pg-vector-layers': 'upload',
    'pg-estates-list': 'list',
    'pg-settlements': 'list',
    'pg-estates-by-type': 'list'
  },
  
  // Режимы просмотра для страниц
  viewModes: {
    'pg-settlements': 'list',
    'pg-estates-list': 'list', 
    'pg-estates-by-type': 'list'
  }
})

// Ключ для localStorage
const STORAGE_KEY = 'tahisis_page_state'

// Загрузка состояния из localStorage
export function loadPageState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsedState = JSON.parse(saved)
      
      // Восстанавливаем вкладки
      if (parsedState.tabs) {
        Object.keys(parsedState.tabs).forEach(page => {
          pageState.tabs[page] = parsedState.tabs[page]
        })
      }
      
      // Восстанавливаем режимы просмотра
      if (parsedState.viewModes) {
        Object.keys(parsedState.viewModes).forEach(page => {
          pageState.viewModes[page] = parsedState.viewModes[page]
        })
      }
    }
  } catch (error) {
    console.error('Error loading page state:', error)
  }
}

// Сохранение состояния в localStorage
export function savePageState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      tabs: pageState.tabs,
      viewModes: pageState.viewModes
    }))
  } catch (error) {
    console.error('Error saving page state:', error)
  }
}

// Получить активную вкладку для страницы
export function getActiveTab(pageName) {
  return pageState.tabs[pageName] || null
}

// Установить активную вкладку для страницы
export function setActiveTab(pageName, tabName) {
  pageState.tabs[pageName] = tabName
  savePageState()
}

// Получить режим просмотра для страницы
export function getViewMode(pageName) {
  return pageState.viewModes[pageName] || 'list'
}

// Установить режим просмотра для страницы
export function setViewMode(pageName, mode) {
  pageState.viewModes[pageName] = mode
  savePageState()
}

// Composable для использования в компонентах
export function usePageState(pageName) {
  return {
    // Для вкладок
    activeTab: {
      get: () => getActiveTab(pageName),
      set: (value) => setActiveTab(pageName, value)
    },
    // Для режимов просмотра
    viewMode: {
      get: () => getViewMode(pageName),
      set: (value) => setViewMode(pageName, value)
    }
  }
}

// Инициализация - загружаем состояние при импорте
loadPageState()

export default pageState
