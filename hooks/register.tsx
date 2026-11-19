import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { FilaAgente } from '../types'

const PANE = 'panel-agentes'
const TITULO = 'Agentes'
const FINALES = ['completed', 'failed', 'killed']

const agentes = atom({ plugin: 'panel-agentes', key: 'agentes' } as const, [], {
  shape: 'agentes-1',
})
const ahora = atom({ plugin: 'panel-agentes', key: 'ahora' } as const, 0)

const ESTADO: Record<string, { texto: string; icono: string; color: string }> = {
  pending: { texto: 'en cola', icono: '◌', color: 'inactive' },
  running: { texto: 'trabajando', icono: '●', color: 'warning' },
  waiting: { texto: 'esperando', icono: '◐', color: 'suggestion' },
  idle: { texto: 'en pausa', icono: '◐', color: 'suggestion' },
  completed: { texto: 'terminado', icono: '✓', color: 'success' },
  failed: { texto: 'falló', icono: '✗', color: 'error' },
  killed: { texto: 'detenido', icono: '■', color: 'error' },
}

function duracion(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000))
  if (s < 60) return `${s} s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m} min ${s % 60} s`
  return `${Math.floor(m / 60)} h ${m % 60} min`
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'agentes',
      description: 'Abre el panel que muestra qué hace cada subagente',
    })
    void $.ui.open({ id: PANE, title: TITULO })

    // Cada 2 s: refresca el estado de los agentes activos y el reloj del panel.
    $.clock.every(2000, async () => {
      const filas = await read($, agentes)
      if (!filas.some(f => f.fin === undefined)) return
      const lista = await $.agent.list()
      const t = await $.clock.now()
      await update($, agentes, actuales =>
        actuales.map(f => {
          if (f.fin !== undefined) return f
          const info = lista.find(a => a.id === f.id)
          // Si ya no aparece en la lista, lo damos por terminado.
          const estado = info ? info.status : 'completed'
          return FINALES.includes(estado) ? { ...f, estado, fin: t } : { ...f, estado }
        }),
      )
      await update($, ahora, () => t)
    })

    return next(e)
  })

  on('command.run', { command: 'agentes' }, async $ => {
    await $.ui.open({ id: PANE, title: TITULO })
    return { text: 'Panel de agentes abierto.' }
  })

  on('agent.spawn', async ($, e, next) => {
    const inicio = await $.clock.now()
    const r = await next(e)
    if (r.agentId) {
      const fila: FilaAgente = {
        id: r.agentId,
        tipo: e.subagentType,
        tarea: e.description,
        estado: 'running',
        inicio,
        herramientas: 0,
      }
      await update($, agentes, lista => [...lista, fila].slice(-50))
      await update($, ahora, () => inicio)
    }
    return r
  })

  on('tool.call', async ($, e, next) => {
    if (e.agentId) {
      const id = e.agentId
      await update($, agentes, lista =>
        lista.map(f =>
          f.id === id
            ? { ...f, herramientas: f.herramientas + 1, ultimaHerramienta: e.tool }
            : f,
        ),
      )
    }
    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text } = $.ui.resolve(e)
    const filas = await read($, agentes)
    const t = (await read($, ahora)) || (await $.clock.now())
    const activos = filas.filter(f => f.fin === undefined).length
    const room = Math.max(1, Math.floor(((e.viewport?.rows ?? 30) - 3) / 4))

    return (
      <Box flexDirection="column">
        <Text bold>
          {activos > 0 ? `${activos} trabajando` : 'Ningún agente activo'} · {filas.length} en total
        </Text>
        {filas.length === 0 && (
          <Text dimColor>Aún no se ha lanzado ningún subagente en esta sesión.</Text>
        )}
        {filas
          .slice(-room)
          .reverse()
          .map(f => {
            const est = ESTADO[f.estado] ?? { texto: f.estado, icono: '•', color: 'inactive' }
            const tiempo = duracion((f.fin ?? t) - f.inicio)
            const terminado = f.fin !== undefined
            return (
              <Box flexDirection="column" marginTop={1}>
                <Text>
                  <Text color={est.color}>{est.icono}</Text> <Text bold>{f.tipo}</Text>
                  <Text dimColor> · {est.texto}</Text>
                </Text>
                <Text dimColor={terminado}>  {f.tarea}</Text>
                <Text dimColor>
                  {'  '}
                  {terminado ? `duró ${tiempo}` : `lleva ${tiempo}`} · {f.herramientas} herramientas
                  {f.ultimaHerramienta && !terminado ? ` · ahora: ${f.ultimaHerramienta}` : ''}
                </Text>
              </Box>
            )
          })}
      </Box>
    )
  })
}
