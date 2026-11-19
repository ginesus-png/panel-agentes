export type FilaAgente = {
  id: string
  tipo: string
  tarea: string
  estado: string
  inicio: number
  fin?: number
  herramientas: number
  ultimaHerramienta?: string
}

declare module 'claude-code' {
  interface PluginState {
    'panel-agentes': { agentes: Shaped<FilaAgente[]>; ahora: number }
  }
}
