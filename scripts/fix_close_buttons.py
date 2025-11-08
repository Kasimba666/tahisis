#!/usr/bin/env python3
import re

# Читаем файл
with open('src/components/EstatesFilters.vue', 'r', encoding='utf-8') as f:
    content = f.read()

# Заменяем все arrow functions на вызов метода
content = re.sub(
    r'@click="\(\) => document\.body\.click\(\)"',
    '@click="closeDropdown"',
    content
)

# Добавляем метод closeDropdown перед removeFilter
content = re.sub(
    r'(    removeFilter\(filter\) \{)',
    r'    closeDropdown() {\n      document.body.click()\n    },\n\n\1',
    content
)

# Записываем обратно
with open('src/components/EstatesFilters.vue', 'w', encoding='utf-8') as f:
    f.write(content)

print("Исправлено!")
