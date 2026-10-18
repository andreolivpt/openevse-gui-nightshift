<!-- src/routes/settings/Shaper.svelte -->
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

  const form = createConfigForm()
  const ss = form.saveState

  // Limiting in amps: the Modbus grid source reads an AlphaESS (firmware
  // with current_shaper_max_cur only)
  let ampsMode = $derived(
    $config_store?.current_shaper_max_cur !== undefined &&
      !!$config_store?.modbus_grid_enabled &&
      $config_store?.modbus_grid_mode === 'alphaess'
  )
  const num = (v) => typeof v === 'number' && Number.isFinite(v)
  let liveCur = $derived($status_store?.shaper_live_cur)
  let curLimit = $derived($status_store?.shaper_grid_cur_limit)
</script>

<ConfigPage title={$_('config.pages.shaper')}>
  <!-- Enabling/scheduling Grid shaping is done from the Charge Manager. -->
  <a
    href="#/schedule"
    class="mb-4 inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5
           text-sm font-semibold text-white transition hover:opacity-90"
  >
    + {$_('config.add_in_charge_manager')}
  </a>

  <ConfigSection>
    <ReadOnlyRow
      label={$_('config.shaper.state')}
      value={$status_store?.shaper_updated ? $_('config.shaper.updated') : $_('config.shaper.stale')}
      tone={$status_store?.shaper_updated ? 'ok' : 'error'}
    />
    <ReadOnlyRow label={$_('config.shaper.live_power')} value={`${$status_store?.shaper_live_pwr ?? 0} W`} />
    {#if num(liveCur)}
      <ReadOnlyRow
        label={$_('config.shaper.grid_current')}
        value={num(curLimit) ? `${liveCur.toFixed(1)} A / ${curLimit.toFixed(1)} A` : `${liveCur.toFixed(1)} A`}
      />
    {/if}
    <ReadOnlyRow label={$_('config.shaper.available')} value={`${$status_store?.shaper_cur ?? 0} A`} />
  </ConfigSection>

  <ConfigSection title={$_('config.shaper.settings')}>
    {#if ampsMode}
      <p class="mb-2 text-sm text-text-dim">{$_('config.shaper.amps_mode')}</p>
      <FormField
        label={$_('config.shaper.max_cur')}
        description={$_('config.shaper.max_cur_desc')}
        status={$ss.current_shaper_max_cur ?? 'idle'}
      >
        <NumberInput
          value={$config_store?.current_shaper_max_cur ?? null}
          min={0}
          max={500}
          placeholder="29"
          revert={form.revert}
          onchange={(v) => form.saveField('current_shaper_max_cur', v)}
        />
      </FormField>
      <FormField
        label={$_('config.shaper.max_va')}
        description={$_('config.shaper.max_va_desc')}
        status={$ss.current_shaper_max_va ?? 'idle'}
      >
        <NumberInput
          value={$config_store?.current_shaper_max_va ?? null}
          min={0}
          max={100000}
          placeholder="6900"
          revert={form.revert}
          onchange={(v) => form.saveField('current_shaper_max_va', v)}
        />
      </FormField>
    {/if}
    <FormField
      label={$_('config.shaper.max_power')}
      description={ampsMode ? $_('config.shaper.max_power_amps_desc') : undefined}
      status={$ss.current_shaper_max_pwr ?? 'idle'}
    >
      <NumberInput
        value={$config_store?.current_shaper_max_pwr ?? null}
        placeholder="9000"
        revert={form.revert}
        onchange={(v) => form.saveField('current_shaper_max_pwr', v)}
      />
    </FormField>
    {#if $config_store?.shelly_lnm_enabled}
      <FormField label={$_('config.shaper.live_topic')} description={$_('config.shaper.live_shelly')} />
    {:else if $config_store?.modbus_grid_enabled}
      <FormField label={$_('config.shaper.live_topic')} description={$_('config.shaper.live_modbus')} />
    {:else}
      <FormField label={$_('config.shaper.live_topic')} status={$ss.mqtt_live_pwr ?? 'idle'}>
        <TextInput
          value={$config_store?.mqtt_live_pwr ?? ''}
          placeholder="topic/powerload"
          revert={form.revert}
          onchange={(v) => form.saveField('mqtt_live_pwr', v)}
        />
      </FormField>
    {/if}
    <FormField label={$_('config.shaper.min_pause')} status={$ss.current_shaper_min_pause_time ?? 'idle'}>
      <NumberInput
        value={$config_store?.current_shaper_min_pause_time ?? null}
        min={0}
        max={60}
        placeholder="5"
        revert={form.revert}
        onchange={(v) => form.saveField('current_shaper_min_pause_time', v)}
      />
    </FormField>
    <FormField
      label={$_('config.shaper.max_interval')}
      description={$_('config.shaper.max_interval_desc')}
      status={$ss.current_shaper_data_maxinterval ?? 'idle'}
    >
      <NumberInput
        value={$config_store?.current_shaper_data_maxinterval ?? null}
        min={10}
        max={300}
        placeholder="120"
        revert={form.revert}
        onchange={(v) => form.saveField('current_shaper_data_maxinterval', v)}
      />
    </FormField>
    {#if $config_store?.current_shaper_release_on_timeout !== undefined}
      <FormField
        label={$_('config.shaper.release_on_timeout')}
        description={$_('config.shaper.release_on_timeout_desc')}
      >
        <Toggle
          checked={!!$config_store?.current_shaper_release_on_timeout}
          label={$_('config.shaper.release_on_timeout')}
          onchange={(v) => form.saveField('current_shaper_release_on_timeout', v)}
        />
      </FormField>
    {/if}
    <FormField
      label={$_('config.shaper.smoothing')}
      description={$_('config.shaper.smoothing_desc')}
      status={$ss.current_shaper_smoothing_time ?? 'idle'}
    >
      <NumberInput
        value={$config_store?.current_shaper_smoothing_time ?? null}
        min={0}
        max={600}
        revert={form.revert}
        onchange={(v) => form.saveField('current_shaper_smoothing_time', v)}
      />
    </FormField>
  </ConfigSection>
</ConfigPage>
