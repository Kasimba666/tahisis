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

  // Конвертация HSL в HSLA
  const hslToHsla = (hsl, alpha) => {
    if (hsl.startsWith('hsl(')) {
      return hsl.replace('hsl(', 'hsla(').replace(')', `, ${alpha})`)
    }
    return hsl
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
    hslToHsla,
    getLayerColor
  }
}
