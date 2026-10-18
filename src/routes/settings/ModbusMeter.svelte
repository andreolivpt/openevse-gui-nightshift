<!-- src/routes/settings/ModbusMeter.svelte -->
<script>
  import { _ } from 'svelte-i18n'
  import { config_store } from '../../lib/stores/config.js'
  import { status_store } from '../../lib/stores/status.js'
  import { createConfigForm } from '../../lib/config/configForm.svelte.js'
  import ConfigPage from '../../lib/components/config/ConfigPage.svelte'
  import ConfigSection from '../../lib/components/config/ConfigSection.svelte'
  import FormField from '../../lib/components/config/FormField.svelte'
  import ReadOnlyRow from '../../lib/components/config/ReadOnlyRow.svelte'
  import TextInput from '../../lib/components/ui/TextInput.svelte'
  import NumberInput from '../../lib/components/ui/NumberInput.svelte'
  import Toggle from '../../lib/components/ui/Toggle.svelte'
  import ModbusGridSection from '../../lib/components/config/ModbusGridSection.svelte'
  import VoltageDropSection from '../../lib/components/config/VoltageDropSection.svelte'

  const form = createConfigForm()
  const ss = form.saveState

  // The firmware reports UINT32_MAX until the first valid reading.
  const NO_DATA = 4294967295

  const num = (v) => typeof v === 'number' && Number.isFinite(v)

  let enabled = $derived(!!$config_store?.modbus_meter_enabled)
  let connected = $derived($status_store?.modbus_meter_connected === 1)
  let active = $derived($status_store?.modbus_meter_active === 1)
  let age = $derived($status_store?.modbus_meter_data_age)
  let hasData = $derived(age !== undefined && age !== null && age !== NO_DATA)
  let interval = $derived(($config_store?.modbus_meter_interval ?? 5) * 1000)
  let ageTone = $derived(!hasData ? 'error' : age <= interval + 3000 ? 'ok' : 'warn')
  let voltage = $derived($status_store?.modbus_meter_voltage)
  let current = $derived($status_store?.modbus_meter_current)
  let power = $derived($status_store?.modbus_meter_power)
  let energy = $derived($status_store?.modbus_meter_energy)
  let errors = $derived($status_store?.modbus_meter_errors ?? 0)
  let lastError = $derived($status_store?.modbus_meter_last_error)
</script>

<ConfigPage title={$_('config.pages.modbusmeter')}>
  <ConfigSection title={$_('config.modbusmeter.title')}>
    <FormField label={$_('config.modbusmeter.enable')} description={$_('config.modbusmeter.desc')}>
      <Toggle
        checked={enabled}
        label={$_('config.modbusmeter.enable')}
        onchange={(v) => form.saveField('modbus_meter_enabled', v)}
      />
    </FormField>
    {#if enabled}
      <ReadOnlyRow
        label={$_('config.modbusmeter.connection')}
        value={connected ? $_('config.modbusmeter.connected') : $_('config.modbusmeter.not_connected')}
        tone={connected ? 'ok' : 'error'}
      />
      <ReadOnlyRow
        label={$_('config.modbusmeter.source')}
        value={active ? $_('config.modbusmeter.source_meter') : $_('config.modbusmeter.source_default')}
        tone={active ? 'ok' : 'warn'}
      />
      <ReadOnlyRow
        label={$_('config.modbusmeter.last_update')}
        value={hasData ? `${age} ms` : '—'}
        tone={ageTone}
      />
      <ReadOnlyRow
        label={$_('config.modbusmeter.voltage')}
        value={num(voltage) ? `${voltage.toFixed(1)} V` : '—'}
      />
      <ReadOnlyRow
        label={$_('config.modbusmeter.current')}
        value={num(current) ? `${current.toFixed(2)} A` : '—'}
      />
      <ReadOnlyRow
        label={$_('config.modbusmeter.power')}
        value={num(power) ? `${Math.round(power)} W` : '—'}
      />
      <ReadOnlyRow
        label={$_('config.modbusmeter.energy')}
        value={num(energy) ? `${energy.toFixed(2)} kWh` : '—'}
      />
      <ReadOnlyRow
        label={$_('config.modbusmeter.errors')}
        value={lastError ? `${errors} (${lastError})` : `${errors}`}
        tone={lastError ? 'warn' : undefined}
      />
    {/if}
  </ConfigSection>

  {#if enabled}
    <ConfigSection title={$_('config.modbusmeter.settings')}>
      <FormField
        label={$_('config.modbusmeter.host')}
        description={$_('config.modbusmeter.host_desc')}
        status={$ss.modbus_meter_host ?? 'idle'}
      >
        <TextInput
          value={$config_store?.modbus_meter_host ?? ''}
          placeholder="192.168.1.50"
          revert={form.revert}
          onchange={(v) => form.saveField('modbus_meter_host', v)}
        />
      </FormField>
      <FormField
        label={$_('config.modbusmeter.port')}
        description={$_('config.modbusmeter.port_desc')}
        status={$ss.modbus_meter_port ?? 'idle'}
      >
        <NumberInput
          value={$config_store?.modbus_meter_port ?? null}
          min={1}
          max={65535}
          placeholder="502"
          revert={form.revert}
          onchange={(v) => form.saveField('modbus_meter_port', v)}
        />
      </FormField>
      <FormField
        label={$_('config.modbusmeter.unit')}
        description={$_('config.modbusmeter.unit_desc')}
        status={$ss.modbus_meter_unit ?? 'idle'}
      >
        <NumberInput
          value={$config_store?.modbus_meter_unit ?? null}
          min={1}
          max={247}
          placeholder="1"
          revert={form.revert}
          onchange={(v) => form.saveField('modbus_meter_unit', v)}
        />
      </FormField>
      <FormField
        label={$_('config.modbusmeter.interval')}
        description={$_('config.modbusmeter.interval_desc')}
        status={$ss.modbus_meter_interval ?? 'idle'}
      >
        <NumberInput
          value={$config_store?.modbus_meter_interval ?? null}
          min={1}
          max={30}
          placeholder="5"
          revert={form.revert}
          onchange={(v) => form.saveField('modbus_meter_interval', v)}
        />
      </FormField>
      <FormField
        label={$_('config.modbusmeter.timeout')}
        description={$_('config.modbusmeter.timeout_desc')}
        status={$ss.modbus_meter_timeout ?? 'idle'}
      >
        <NumberInput
          value={$config_store?.modbus_meter_timeout ?? null}
          min={10}
          max={120}
          placeholder="90"
          revert={form.revert}
          onchange={(v) => form.saveField('modbus_meter_timeout', v)}
        />
      </FormField>
    </ConfigSection>

    <ConfigSection title={$_('config.modbusmeter.setup')}>
      <p class="mb-2 text-sm text-text-dim">{$_('config.modbusmeter.setup_desc')}</p>
      <p class="text-xs text-text-dim">{$_('config.modbusmeter.shelly_note')}</p>
    </ConfigSection>
  {/if}

  <!-- Firmware with the Modbus grid power source always reports modbus_grid_port -->
  {#if $config_store?.modbus_grid_port !== undefined}
    <ModbusGridSection {form} />
  {/if}

  {#if $status_store?.voltage_drop_available !== undefined}
    <VoltageDropSection />
  {/if}
</ConfigPage>
