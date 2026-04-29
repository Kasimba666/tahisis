import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_KEY must be set in .env')
}

// Единый клиент для всех операций (использует анонимный ключ — безопасен для фронтенда)
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

/**
 * Выполняет Supabase-запрос с автоматическими повторными попытками при сетевых ошибках.
 * 
 * @param {Function} queryFn — функция, возвращающая Supabase-запрос (например, () => supabase.from('table').select('*'))
 * @param {Object} options — настройки повторных попыток
 * @param {number} options.maxRetries — максимальное число повторных попыток (по умолчанию 3)
 * @param {number} options.baseDelayMs — базовая задержка перед повтором в миллисекундах (по умолчанию 1000)
 * @param {string} options.operationName — название операции для логов (по умолчанию 'Supabase query')
 * @returns {Promise<{data: any, error: any}>}
 */
export function supabaseQueryWithRetry(queryFn, options = {}) {
  const {
    maxRetries = 3,
    baseDelayMs = 1000,
    operationName = 'Supabase query'
  } = options

  let attempt = 0

  function tryQuery() {
    attempt++
    const startTime = performance.now()

    return queryFn()
      .then(({ data, error }) => {
        const elapsed = (performance.now() - startTime).toFixed(0)

        if (error) {
          // Определяем, является ли ошибка сетевой/временной
          const isRetryable =
            error.message?.includes('fetch') ||
            error.message?.includes('network') ||
            error.message?.includes('timeout') ||
            error.message?.includes('abort') ||
            error.message?.includes('Failed to fetch') ||
            error.message?.includes('NetworkError') ||
            error.message?.includes('ETIMEDOUT') ||
            error.message?.includes('ECONNRESET') ||
            error.message?.includes('socket') ||
            error.message?.includes('connection') ||
            error.code === 'ETIMEDOUT' ||
            error.code === 'ECONNRESET' ||
            error.code === 'ECONNREFUSED'

          if (isRetryable && attempt < maxRetries) {
            const delay = baseDelayMs * Math.pow(2, attempt - 1) // Экспоненциальная задержка
            console.warn(
              `[RETRY] ${operationName} — попытка ${attempt}/${maxRetries} не удалась ` +
              `(ошибка: ${error.message || error.code || 'неизвестная'}). ` +
              `Повтор через ${delay}мс...`
            )
            return new Promise(resolve => setTimeout(resolve, delay)).then(tryQuery)
          }

          // Неповторяемая ошибка или исчерпаны попытки
          if (attempt >= maxRetries) {
            console.error(
              `[FAIL] ${operationName} — исчерпаны все ${maxRetries} попыток. ` +
              `Последняя ошибка: ${error.message || error.code || 'неизвестная'}`
            )
          } else {
            console.error(
              `[ERROR] ${operationName} — неповторяемая ошибка: ${error.message || error.code || 'неизвестная'}`
            )
          }

          return { data, error }
        }

        // Успешный ответ
        if (attempt > 1) {
          console.log(
            `[OK] ${operationName} — успешно выполнено с попытки ${attempt} (${elapsed}мс)`
          )
        }
        return { data, error: null }
      })
      .catch(exception => {
        // Ловим исключения на уровне JavaScript (например, проблемы с fetch API)
        const elapsed = (performance.now() - startTime).toFixed(0)
        console.error(
          `[EXCEPTION] ${operationName} — попытка ${attempt}/${maxRetries} ` +
          `(${elapsed}мс): ${exception?.message || exception}`
        )

        if (attempt < maxRetries) {
          const delay = baseDelayMs * Math.pow(2, attempt - 1)
          console.warn(`[RETRY] ${operationName} — повтор через ${delay}мс...`)
          return new Promise(resolve => setTimeout(resolve, delay)).then(tryQuery)
        }

        console.error(`[FAIL] ${operationName} — исчерпаны все ${maxRetries} попыток после исключения.`)
        return { data: null, error: exception }
      })
  }

  return tryQuery()
}