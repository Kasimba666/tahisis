#!/usr/bin/env python3
import re

# Читаем файл
with open('src/components/EstatesFilters.vue', 'r', encoding='utf-8') as f:
    content = f.read()

# Заменяем импорт иконок
content = re.sub(
    r"import \{ ArrowDown \} from '@element-plus/icons-vue'",
    "import { ArrowDown, Close } from '@element-plus/icons-vue'",
    content
)

# Добавляем Close в components
content = re.sub(
    r'components: \{\s*ArrowDown\s*\}',
    'components: {\n    ArrowDown,\n    Close\n  }',
    content
)

# Находим все <el-dropdown-menu class="filter-dropdown-menu"> и добавляем крестик после них
def add_close_button(match):
    return match.group(0) + '\n            <div class="dropdown-close">\n              <el-button link type="info" size="small" @click="() => document.body.click()">\n                <el-icon><Close /></el-icon>\n              </el-button>\n            </div>'

content = re.sub(
    r'<el-dropdown-menu class="filter-dropdown-menu">',
    add_close_button,
    content
)

# Записываем обратно
with open('src/components/EstatesFilters.vue', 'w', encoding='utf-8') as f:
    f.write(content)

print("Крестики закрытия добавлены во все dropdown-меню!")
