// Composable для работы с маркерами карты
export function useMapMarkers() {
  // Создание маркера в виде концентрических кругов для Leaflet
  const createConcentricCirclesMarker = (estateTypes) => {
    if (!estateTypes || estateTypes.length === 0) {
      return '<div class="pie-marker"><svg width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="10" r="7" fill="transparent" stroke="hsl(0, 0%, 60%)" stroke-width="3"/></svg></div>'
    }

    const totalPopulation = estateTypes.reduce((sum, type) => sum + type.population, 0)
    
    const minRadius = 2.5
    const maxRadius = 12
    const minPopulation = 10
    const maxPopulation = 1000
    
    const normalizedPopulation = Math.min(Math.max(totalPopulation - minPopulation, 0) / (maxPopulation - minPopulation), 1)
    const radius = minRadius + (maxRadius - minRadius) * normalizedPopulation
    
    const strokeWidth = 3
    const svgSize = (maxRadius + strokeWidth) * 2
    const center = svgSize / 2

    if (estateTypes.length === 1) {
      return `<div class="pie-marker"><svg width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}"><circle cx="${center}" cy="${center}" r="${radius}" fill="transparent" stroke="${estateTypes[0].color}" stroke-width="${strokeWidth}"/></svg></div>`
    }

    let svg = `<svg width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}">`
    
    const segmentAngle = 360 / estateTypes.length
    let currentAngle = -90

    estateTypes.forEach((type) => {
      const endAngle = currentAngle + segmentAngle
      const startRad = (currentAngle * Math.PI) / 180
      const endRad = (endAngle * Math.PI) / 180
      const x1 = center + radius * Math.cos(startRad)
      const y1 = center + radius * Math.sin(startRad)
      const x2 = center + radius * Math.cos(endRad)
      const y2 = center + radius * Math.sin(endRad)
      const largeArcFlag = segmentAngle > 180 ? 1 : 0
      const pathData = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`
      svg += `<path d="${pathData}" fill="none" stroke="${type.color}" stroke-width="${strokeWidth}" stroke-linecap="butt"/>`
      currentAngle = endAngle
    })

    svg += '</svg>'
    return `<div class="pie-marker">${svg}</div>`
  }

  // Генерация простого popup для деталей сословия (без кнопки "Детали" и без пустых полей)
  const generateSimpleSettlementPopup = (settlement) => {
    let html = '<div class="settlement-popup-new">'
    
    // Старое название (обязательно)
    if (settlement.name || settlement.name_old) {
      html += `<div class="popup-field"><strong>${settlement.name || settlement.name_old}</strong></div>`
    }
    
    // Современное название (только если есть)
    if (settlement.nameModern) {
      html += `<div class="popup-field popup-field-modern">${settlement.nameModern}</div>`
    }
    
    // Волость (только если есть)
    if (settlement.volost) {
      html += `<div class="popup-field">Волость: ${settlement.volost}</div>`
    }
    
    // Помещик (только если есть)
    if (settlement.landowner) {
      html += `<div class="popup-field">Помещик: ${settlement.landowner}</div>`
    }
    
    // Военная организация (только если есть)
    if (settlement.militaryUnit) {
      html += `<div class="popup-field">Военная организация: ${settlement.militaryUnit}</div>`
    }
    
    // Численность
    const male = settlement.male || settlement.maleCount || 0
    const female = settlement.female || settlement.femaleCount || 0
    const total = settlement.totalCount || (male + female)
    
    if (total > 0) {
      html += '<div class="popup-estates">'
      html += `<div class="popup-estate-item">Мужчин: ${male}</div>`
      html += `<div class="popup-estate-item">Женщин: ${female}</div>`
      html += `<div class="popup-estate-total">Всего: ${total}</div>`
      html += '</div>'
    }
    
    html += '</div>'
    return html
  }

  // Генерация popup для населённого пункта
  const generateSettlementPopup = (settlement) => {
    const nameOld = settlement.name || '—'
    const nameModern = settlement.nameModern || '—'
    const district = settlement.district || '—'
    
    let estatesDetails = ''
    let totalSum = 0
    
    if (settlement.estates && settlement.estates.length > 0) {
      settlement.estates.forEach(estate => {
        const subtype = estate.subtype_estate_name || '—'
        const religion = estate.type_religion_name || '—'
        const male = estate.male || 0
        const female = estate.female || 0
        const total = estate.total || (male + female)
        totalSum += total
        
        estatesDetails += `<div class="popup-estate-item">${subtype}, ${religion}, М: ${male}, Ж: ${female}, Итого: ${total}</div>`
      })
      
      estatesDetails += `<div class="popup-estate-total">Всего: ${totalSum}</div>`
    } else {
      estatesDetails = '<div class="popup-estate-item">Нет данных о сословиях</div>'
    }

    return `
      <div class="settlement-popup-new">
        <div class="popup-field">${nameOld}</div>
        ${nameModern !== '—' ? `<div class="popup-field popup-field-modern">${nameModern}</div>` : ''}
        <div class="popup-field">${district}</div>
        <div class="popup-estates">
          ${estatesDetails}
        </div>
        <div class="popup-actions">
          <button class="popup-details-btn">Детали</button>
        </div>
      </div>
    `
  }

  // Конвертация HSL/HEX в HSLA/RGBA с прозрачностью
  const hslToHsla = (color, alpha) => {
    // Если уже HSLA или RGBA, возвращаем как есть
    if (color.startsWith('hsla(') || color.startsWith('rgba(')) {
      return color
    }
    
    // Если HSL, конвертируем в HSLA
    if (color.startsWith('hsl(')) {
      return color.replace('hsl(', 'hsla(').replace(')', `, ${alpha})`)
    }
    
    // Если HEX, конвертируем в RGBA
    if (color.startsWith('#')) {
      const hex = color.replace('#', '')
      const r = parseInt(hex.substring(0, 2), 16)
      const g = parseInt(hex.substring(2, 4), 16)
      const b = parseInt(hex.substring(4, 6), 16)
      return `rgba(${r}, ${g}, ${b}, ${alpha})`
    }
    
    return color
  }

  // Получение цвета слоя
  const getLayerColor = (layerId) => {
    const colors = [
      'hsl(0, 85%, 55%)', 'hsl(178, 63%, 52%)', 'hsl(197, 65%, 55%)', 
      'hsl(136, 33%, 65%)', 'hsl(48, 100%, 67%)', 'hsl(282, 44%, 70%)', 
      'hsl(174, 38%, 70%)', 'hsl(48, 100%, 67%)', 'hsl(262, 41%, 68%)', 
      'hsl(204, 70%, 67%)'
    ]
    return colors[layerId % colors.length]
  }

  return {
    createConcentricCirclesMarker,
    generateSettlementPopup,
    generateSimpleSettlementPopup,
    hslToHsla,
    getLayerColor
  }
}
