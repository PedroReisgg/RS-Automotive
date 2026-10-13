/** Dados fixos da RS Automotive usados em todo o site. */

export const WHATSAPP_NUMBER = '5511952817706'
export const PHONE_DISPLAY = '(11) 4171-5554'
export const WHATSAPP_DISPLAY = '(11) 95281-7706'
export const ADDRESS = 'Rua José Barros Magaldi, 1253 - Jardim Novo Santo Amaro, São Paulo - SP, 05815-010'

export function whatsappLink(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
}

export interface Service {
  id: string
  name: string
  description: string
  icon: string
}

/** Serviços na ordem do cartão da oficina. `icon` é o nome do ícone lucide. */
export const SERVICES: Service[] = [
  { id: 'injecao', name: 'Injeção eletrônica', description: 'Diagnóstico, limpeza e reparo do sistema de injeção.', icon: 'fuel' },
  { id: 'partida', name: 'Motor de partida', description: 'Revisão e reparo para o carro pegar de primeira.', icon: 'key-round' },
  { id: 'alternador', name: 'Alternador', description: 'Teste de carga e reparo do alternador.', icon: 'zap' },
  { id: 'vidro', name: 'Vidro elétrico', description: 'Conserto de motor, botão e módulo do vidro.', icon: 'square-arrow-down' },
  { id: 'trava', name: 'Trava elétrica', description: 'Reparo e instalação de travas elétricas.', icon: 'lock' },
  { id: 'som', name: 'Som', description: 'Instalação e reparo de som automotivo e central multimídia.', icon: 'speaker' },
  { id: 'alarme', name: 'Alarme', description: 'Instalação e manutenção de alarmes.', icon: 'bell-ring' },
  { id: 'bateria', name: 'Bateria', description: 'Teste, troca e instalação de bateria.', icon: 'battery-charging' },
  { id: 'eletrica', name: 'Elétrica em geral e acessórios', description: 'Diagnóstico de falhas elétricas e instalação de acessórios.', icon: 'plug' },
]

export interface Stage {
  title: string
  text: string
  tag: string
  /** Serviço pré-selecionado no formulário ao clicar em "Pedir orçamento". */
  service?: string
}

/** As 8 etapas da cena de rolagem (0%, 14%, 28%, 42%, 56%, 70%, 84%, 100%). */
export const STAGES: Stage[] = [
  {
    title: 'Seu carro, por fora e por dentro',
    text: 'Role a página para abrir o carro e ver cada sistema elétrico que a RS Automotive cuida.',
    tag: 'Elétrica e injeção',
  },
  {
    title: 'Carroceria aberta',
    text: 'Debaixo da lataria, o chicote elétrico liga tudo. É por ele que começa o diagnóstico.',
    tag: 'Elétrica em geral',
    service: 'eletrica',
  },
  {
    title: 'Bateria e alternador',
    text: 'Teste de carga, troca de bateria e reparo do alternador para o carro não te deixar na mão.',
    tag: 'Bateria e alternador',
    service: 'bateria',
  },
  {
    title: 'Injeção eletrônica',
    text: 'Bicos, sensores e módulo de injeção: diagnóstico, limpeza e reparo.',
    tag: 'Injeção eletrônica',
    service: 'injecao',
  },
  {
    title: 'Motor de partida',
    text: 'Revisão e reparo do motor de partida e dos cabos para o carro pegar de primeira.',
    tag: 'Motor de partida',
    service: 'partida',
  },
  {
    title: 'Cabine e travas',
    text: 'Motor e módulo do vidro elétrico, travas elétricas e sirene do alarme: conserto e instalação.',
    tag: 'Vidro, trava e alarme',
    service: 'vidro',
  },
  {
    title: 'Som e acessórios',
    text: 'Alto-falantes, central multimídia e amplificador instalados com acabamento de fábrica.',
    tag: 'Som e acessórios',
    service: 'som',
  },
  {
    title: 'Pronto para voltar à rua',
    text: 'Peças no lugar e carro fechado. Chame o Ronei no WhatsApp e peça seu orçamento.',
    tag: 'Orçamento sem compromisso',
  },
]

export const STAGE_PERCENT = [0, 14, 28, 42, 56, 70, 84, 100]
