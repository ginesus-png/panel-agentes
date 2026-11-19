# panel-agentes

Mod para Claude Code: un panel junto al chat que muestra en vivo qué hace cada subagente.

- Tipo de agente y tarea que se le encargó
- Estado con color: ● trabajando, ✓ terminado, ✗ falló, ■ detenido
- Cuánto lleva (o cuánto duró), cuántas herramientas ha usado y cuál usa ahora
- Se refresca cada 2 segundos mientras haya agentes activos

El panel se abre al empezar cada sesión. Para reabrirlo: `/agentes`.

## Instalación

En el prompt de una sesión de Claude Code en la terminal:

```
/plugin install panel-agentes --marketplace ginesus-png/panel-agentes
```

Responde `y` para añadir el marketplace y elige el ámbito (usuario).

Desde una shell:

```
claude plugin install panel-agentes --marketplace ginesus-png/panel-agentes
```

En la app de escritorio (donde `/plugin` no funciona): pulsa **+** junto a la caja del prompt → **Plugins** → **Add marketplace** con `ginesus-png/panel-agentes` → **Add plugin**.

## Límites

Solo muestra los subagentes de la sesión en la que está abierto.
