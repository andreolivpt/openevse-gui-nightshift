<!-- src/lib/components/config/VoltageThrottleSection.svelte -->
<!-- Low voltage throttle settings, shown on the Safety page with firmware
     that has the feature (voltage_throttle_low present in /config). -->
<script>
  import { _ } from 'svelte-i18n'
  import { config_store } from '../../stores/config.js'
  import { status_store } from '../../stores/status.js'
  import ConfigSection from './ConfigSection.svelte'
  import FormField from './FormField.svelte'
  import ReadOnlyRow from './ReadOnlyRow.svelte'
  import NumberInput from '../ui/NumberInput.svelte'
  import Toggle from '../ui/Toggle.svelte'

  /** The page's createConfigForm() instance. */
  let { form } = $props()
  const ss = form.saveState

  let enabled = $derived(!!$config_store?.voltage_throttle_enabled)
  let active = $derived($status_store?.voltage_throttle_active === 1)
  let limit = $derived($status_store?.voltage_throttle_current)
  let mean = $derived($status_store?.voltage_throttle_voltage)
</script>

<ConfigSection title={$_('config.safety.voltage_throttle')}>
  <FormField label={$_('config.safety.voltage_throttle_enable')} description={$_('config.safety.voltage_throttle_desc')}>
    <Toggle
      checked={enabled}
      label={$_('config.safety.voltage_throttle_enable')}
      onchange={(v) => form.saveField('voltage_throttle_enabled', v)}
    />
  </FormField>
  {#if enabled}
    <ReadOnlyRow
      label={$_('config.safety.voltage_throttle_state')}
      value={active ? `${$_('config.safety.voltage_throttle_limiting')} ${limit} A` : $_('config.safety.voltage_throttle_idle')}
      tone={active ? 'warn' : 'ok'}
    />
    <ReadOnlyRow
      label={$_('config.safety.voltage_throttle_mean')}
      value={typeof mean === 'number' && Number.isFinite(mean) ? `${mean.toFixed(1)} V` : '—'}
    />
    <FormField
      label={$_('config.safety.voltage_throttle_low')}
      description={$_('config.safety.voltage_throttle_low_desc')}
      status={$ss.voltage_throttle_low ?? 'idle'}
    >
      <NumberInput
        value={$config_store?.voltage_throttle_low ?? null}
        min={150}
        max={260}
        placeholder="212"
        revert={form.revert}
        onchange={(v) => form.saveField('voltage_throttle_low', v)}
      />
    </FormField>
    <FormField
      label={$_('config.safety.voltage_throttle_high')}
      description={$_('config.safety.voltage_throttle_high_desc')}
      status={$ss.voltage_throttle_high ?? 'idle'}
    >
      <NumberInput
        value={$config_store?.voltage_throttle_high ?? null}
        min={150}
        max={260}
        placeholder="218"
        revert={form.revert}
        onchange={(v) => form.saveField('voltage_throttle_high', v)}
      />
    </FormField>
    <FormField
      label={$_('config.safety.voltage_throttle_interval')}
      description={$_('config.safety.voltage_throttle_interval_desc')}
      status={$ss.voltage_throttle_interval ?? 'idle'}
    >
      <NumberInput
        value={$config_store?.voltage_throttle_interval ?? null}
        min={10}
        max={600}
        placeholder="30"
        revert={form.revert}
        onchange={(v) => form.saveField('voltage_throttle_interval', v)}
      />
    </FormField>
    <FormField
      label={$_('config.safety.voltage_throttle_step')}
      description={$_('config.safety.voltage_throttle_step_desc')}
      status={$ss.voltage_throttle_step ?? 'idle'}
    >
      <NumberInput
        value={$config_store?.voltage_throttle_step ?? null}
        min={1}
        max={10}
        placeholder="1"
        revert={form.revert}
        onchange={(v) => form.saveField('voltage_throttle_step', v)}
      />
    </FormField>
  {/if}
</ConfigSection>
