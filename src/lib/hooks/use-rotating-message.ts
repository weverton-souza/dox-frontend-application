import { useState, useEffect, useCallback } from 'react'

const MESSAGES = {
  early: [
    'Preparando tudo com cuidado para você...',
    'Organizando as informações...',
    'Reunindo o que há de mais relevante...',
    'Seu relatório está sendo elaborado...',
    'Estruturando tudo da melhor forma possível...',
    'Cada detalhe está sendo considerado...',
    'Dedicando atenção especial ao seu relatório...',
    'Juntando as peças com cuidado...',
    'Dando forma ao conteúdo...',
  ],
  mid: [
    'Boas coisas levam um tempinho...',
    'Trabalhando nos bastidores para você...',
    'Analisando as informações com atenção...',
    'Cruzando informações para o melhor resultado...',
    'Selecionando o que realmente importa...',
    'Processando com atenção aos detalhes...',
    'Conectando os pontos...',
    'Transformando informações em conhecimento...',
    'Montando o panorama completo...',
  ],
  late: [
    'Quase lá, só mais um instante...',
    'Finalizando os últimos detalhes...',
    'Dando os retoques finais...',
    'Refinando as informações para você...',
    'Qualidade leva tempo. Estamos quase lá...',
    'Priorizando clareza e precisão...',
    'Revisando tudo antes de entregar...',
    'Um instante... o resultado compensa...',
  ],
}

function getPool(percentage: number) {
  return percentage <= 30 ? MESSAGES.early : percentage <= 60 ? MESSAGES.mid : MESSAGES.late
}

function pickRandom(pool: string[], exclude?: string): string {
  const filtered = pool.length > 1 && exclude ? pool.filter(m => m !== exclude) : pool
  return filtered[Math.floor(Math.random() * filtered.length)]
}

export function useRotatingMessage(percentage: number, intervalMs = 12000) {
  const band = percentage <= 30 ? 'early' : percentage <= 60 ? 'mid' : 'late'
  const [message, setMessage] = useState(() => pickRandom(getPool(percentage)))

  const rotate = useCallback(() => {
    setMessage(prev => pickRandom(getPool(percentage), prev))
  }, [percentage])

  useEffect(() => {
    rotate()
  }, [band])

  useEffect(() => {
    const id = setInterval(rotate, intervalMs)
    return () => clearInterval(id)
  }, [rotate, intervalMs])

  return message
}
