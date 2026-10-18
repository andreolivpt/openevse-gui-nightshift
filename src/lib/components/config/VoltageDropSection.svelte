<!-- src/lib/components/config/VoltageDropSection.svelte -->
<!-- Voltage drop between the supply entrance (AlphaESS grid meter) and the
     charger (Modbus TCP meter), shown on the Modbus page with firmware that
     reports it (voltage_drop_available present in /status). -->
<script>
  import { _ } from 'svelte-i18n'
  import { status_store } from '../../stores/status.js'
  import ConfigSection from './ConfigSection.svelte'
  import ReadOnlyRow from './ReadOnlyRow.svelte'

  const num = (v) => typeof v === 'number' && Number.isFinite(v)

  // Common wiring rules allow 3 % for lighting and 5 % for other circuits
  const pctTone = (pct) => (!num(pct) ? undefined : pct <= 3 ? 'ok' : pct <= 5 ? 'warn' : 'error')

  let available = $derived($status_store?.voltage_drop_available === 1)
  let grid = $derived($status_store?.voltage_drop_grid_voltage)
  let charger = $derived($status_store?.voltage_drop_charger_voltage)
  let drop = $derived($status_store?.voltage_drop)
  let pct = $derived($status_store?.voltage_drop_pct)
  let offset = $derived($status_store?.voltage_drop_offset)
  let ohms = $derived($status_store?.voltage_drop_resistance)
  let loss = $derived($status_store?.voltage_drop_loss)
  let atMax = $derived($status_store?.voltage_drop_at_max)
  let maxCurrent = $derived($status_store?.voltage_drop_max_current)
  let atMaxPct = $derived(num(atMax) && num(grid) && grid > 0 ? (atMax * 100) / grid : undefined)
</script>

<ConfigSection title={$_('config.voltagedrop.title')}>
  <p class="mb-2 text-xs text-text-dim">{$_('config.voltagedrop.desc')}</p>
  {#if !available}
    <p class="text-sm text-text-dim">{$_('config.voltagedrop.unavailable')}</p>
  {:else}
    <ReadOnlyRow label={$_('config.voltagedrop.grid')} value={num(grid) ? `${Math.round(grid)} V` : '—'} />
    <ReadOnlyRow label={$_('config.voltagedrop.charger')} value={num(charger) ? `${charger.toFixed(1)} V` : '—'} />
    <ReadOnlyRow
      label={$_('config.voltagedrop.drop')}
      value={num(drop) ? `${drop.toFixed(1)} V` : '—'}
      detail={num(pct) ? `(${pct.toFixed(1)} %)` : ''}
      tone={pctTone(pct)}
    />
    <ReadOnlyRow
      label={$_('config.voltagedrop.offset')}
      value={num(offset) ? `${offset.toFixed(1)} V` : $_('config.voltagedrop.learning')}
    />
    <ReadOnlyRow
      label={$_('config.voltagedrop.resistance')}
      value={num(ohms) ? `${Math.round(ohms * 1000)} mΩ` : $_('config.voltagedrop.learning')}
    />
    {#if num(ohms)}
      <ReadOnlyRow label={$_('config.voltagedrop.loss')} value={num(loss) ? `${Math.round(loss)} W` : '—'} />
      <ReadOnlyRow
        label={$_('config.voltagedrop.at_max', { values: { amps: maxCurrent ?? '?' } })}
        value={num(atMax) ? `${atMax.toFixed(1)} V` : '—'}
        detail={num(atMaxPct) ? `(${atMaxPct.toFixed(1)} %)` : ''}
        tone={pctTone(atMaxPct)}
      />
    {/if}
  {/if}
</ConfigSection>
