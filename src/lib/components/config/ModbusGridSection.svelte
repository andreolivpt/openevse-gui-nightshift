<!-- src/lib/components/config/ModbusGridSection.svelte -->
<!-- Grid power over Modbus TCP for the Load Shaper, shown on the Modbus page
     with firmware that has the feature (modbus_grid_port present in /config). -->
<script>
  import { _ } from 'svelte-i18n'
  import { config_store } from '../../stores/config.js'
  import { status_store } from '../../stores/status.js'
  import ConfigSection from './ConfigSection.svelte'
  import FormField from './FormField.svelte'
  import ReadOnlyRow from './ReadOnlyRow.svelte'
  import TextInput from '../ui/TextInput.svelte'
  import NumberInput from '../ui/NumberInput.svelte'
  import Select from '../ui/Select.svelte'
  import Toggle from '../ui/Toggle.svelte'

  /** The page's createConfigForm() instance. */
  let { form } = $props()
  const ss = form.saveState

  // The firmware reports UINT32_MAX until the first valid reading.
  const NO_DATA = 4294967295

  const formats = ['int16', 'uint16', 'int32', 'uint32', 'float32'].map((f) => ({ value: f, label: f }))

  let enabled = $derived(!!$config_store?.modbus_grid_enabled)
  let connected = $derived($status_store?.modbus_grid_connected === 1)
  let age = $derived($status_store?.modbus_grid_data_age)
  let hasData = $derived(age !== undefined && age !== null && age !== NO_DATA)
  let interval = $derived(($config_store?.modbus_grid_interval ?? 5) * 1000)
  let ageTone = $derived(!hasData ? 'error' : age <= interval + 3000 ? 'ok' : 'warn')
  let power = $derived($status_store?.modbus_grid_power)
  let errors = $derived($status_store?.modbus_grid_errors ?? 0)
  let lastError = $derived($status_store?.modbus_grid_last_error)
  let shaperOn = $derived(!!$config_store?.current_shaper_enabled)
</script>

<ConfigSection title={$_('config.modbusgrid.title')}>
  <FormField label={$_('config.modbusgrid.enable')} description={$_('config.modbusgrid.desc')}>
    <Toggle
      checked={enabled}
      label={$_('config.modbusgrid.enable')}
      onchange={(v) => form.saveField('modbus_grid_enabled', v)}
    />
  </FormField>
  {#if enabled}
    <ReadOnlyRow
      label={$_('config.modbusgrid.connection')}
      value={connected ? $_('config.modbusmeter.connected') : $_('config.modbusmeter.not_connected')}
      tone={connected ? 'ok' : 'error'}
    />
    <ReadOnlyRow
      label={$_('config.modbusgrid.last_update')}
      value={hasData ? `${age} ms` : '—'}
      tone={ageTone}
    />
    <ReadOnlyRow
      label={$_('config.modbusgrid.power')}
      value={typeof power === 'number' && Number.isFinite(power) ? `${Math.round(power)} W` : '—'}
    />
    <ReadOnlyRow
      label={$_('config.modbusmeter.errors')}
      value={lastError ? `${errors} (${lastError})` : `${errors}`}
      tone={lastError ? 'warn' : undefined}
    />
    <ReadOnlyRow
      label={$_('config.modbusgrid.shaper')}
      value={shaperOn ? $_('config.modbusgrid.shaper_on') : $_('config.modbusgrid.shaper_off')}
      tone={shaperOn ? 'ok' : 'warn'}
    />

    <FormField label={$_('config.modbusmeter.host')} description={$_('config.modbusgrid.host_desc')} status={$ss.modbus_grid_host ?? 'idle'}>
      <TextInput
        value={$config_store?.modbus_grid_host ?? ''}
        placeholder="192.168.1.10"
        revert={form.revert}
        onchange={(v) => form.saveField('modbus_grid_host', v)}
      />
    </FormField>
    <FormField label={$_('config.modbusmeter.port')} status={$ss.modbus_grid_port ?? 'idle'}>
      <NumberInput
        value={$config_store?.modbus_grid_port ?? null}
        min={1}
        max={65535}
        placeholder="502"
        revert={form.revert}
        onchange={(v) => form.saveField('modbus_grid_port', v)}
      />
    </FormField>
    <FormField label={$_('config.modbusgrid.unit')} status={$ss.modbus_grid_unit ?? 'idle'}>
      <NumberInput
        value={$config_store?.modbus_grid_unit ?? null}
        min={0}
        max={255}
        placeholder="85"
        revert={form.revert}
        onchange={(v) => form.saveField('modbus_grid_unit', v)}
      />
    </FormField>
    <FormField label={$_('config.modbusmeter.interval')} status={$ss.modbus_grid_interval ?? 'idle'}>
      <NumberInput
        value={$config_store?.modbus_grid_interval ?? null}
        min={1}
        max={60}
        placeholder="5"
        revert={form.revert}
        onchange={(v) => form.saveField('modbus_grid_interval', v)}
      />
    </FormField>
  {/if}
</ConfigSection>

{#if enabled}
  <ConfigSection title={$_('config.modbusgrid.advanced')}>
    <p class="mb-2 text-xs text-text-dim">{$_('config.modbusgrid.advanced_desc')}</p>
    <FormField label={$_('config.modbusgrid.register')} description={$_('config.modbusgrid.register_desc')} status={$ss.modbus_grid_register ?? 'idle'}>
      <NumberInput
        value={$config_store?.modbus_grid_register ?? null}
        min={0}
        max={65535}
        placeholder="33"
        revert={form.revert}
        onchange={(v) => form.saveField('modbus_grid_register', v)}
      />
    </FormField>
    <FormField label={$_('config.modbusgrid.format')} status={$ss.modbus_grid_format ?? 'idle'}>
      <Select
        options={formats}
        value={$config_store?.modbus_grid_format ?? 'int32'}
        onchange={(v) => form.saveField('modbus_grid_format', v)}
      />
    </FormField>
    <FormField label={$_('config.modbusgrid.scale')} description={$_('config.modbusgrid.scale_desc')} status={$ss.modbus_grid_scale ?? 'idle'}>
      <NumberInput
        value={$config_store?.modbus_grid_scale ?? null}
        step={0.001}
        placeholder="1"
        revert={form.revert}
        onchange={(v) => form.saveField('modbus_grid_scale', v)}
      />
    </FormField>
    <FormField label={$_('config.modbusgrid.invert')} description={$_('config.modbusgrid.invert_desc')}>
      <Toggle
        checked={!!$config_store?.modbus_grid_invert}
        label={$_('config.modbusgrid.invert')}
        onchange={(v) => form.saveField('modbus_grid_invert', v)}
      />
    </FormField>
  </ConfigSection>
{/if}
