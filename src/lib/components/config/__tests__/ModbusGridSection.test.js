// src/lib/components/config/__tests__/ModbusGridSection.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/svelte'
import { writable } from 'svelte/store'

vi.mock('svelte-i18n', () => {
  const t = (k) => k
  t.subscribe = (fn) => { fn(t); return () => {} }
  return { _: t }
})

import { config_store } from '../../../stores/config.js'
import { status_store } from '../../../stores/status.js'
import ModbusGridSection from '../ModbusGridSection.svelte'

const base = {
  modbus_grid_enabled: true,
  modbus_grid_host: '192.168.0.10',
  modbus_grid_port: 5020,
  modbus_grid_unit: 85,
  modbus_grid_register: 33,
  modbus_grid_format: 'int32',
  modbus_grid_scale: 1,
  modbus_grid_invert: false,
  modbus_grid_interval: 5,
  current_shaper_enabled: false,
}

function makeForm() {
  return { saveField: vi.fn(async () => true), saveState: writable({}), revert: 0 }
}

beforeEach(() => {
  config_store.set({ ...base })
  status_store.set({ modbus_grid_connected: 1, modbus_grid_data_age: 1500, modbus_grid_power: 2345.6, modbus_grid_errors: 0 })
})

describe('Modbus grid section', () => {
  it('shows only the switch while disabled', () => {
    config_store.set({ ...base, modbus_grid_enabled: false })
    const { getByText, queryByText } = render(ModbusGridSection, { form: makeForm() })
    expect(getByText('config.modbusgrid.enable')).toBeInTheDocument()
    expect(queryByText('config.modbusgrid.register')).not.toBeInTheDocument()
  })

  it('shows the live reading and warns when the shaper is off', () => {
    const { getByText } = render(ModbusGridSection, { form: makeForm() })
    expect(getByText('config.modbusmeter.connected')).toBeInTheDocument()
    expect(getByText('2346 W')).toBeInTheDocument()
    expect(getByText('config.modbusgrid.shaper_off')).toBeInTheDocument()
  })

  it('treats "never received" as no data', () => {
    status_store.set({ modbus_grid_connected: 0, modbus_grid_data_age: 4294967295, modbus_grid_power: null, modbus_grid_errors: 2, modbus_grid_last_error: 'connect timeout' })
    const { getByText, getAllByText } = render(ModbusGridSection, { form: makeForm() })
    expect(getAllByText('—')).toHaveLength(2)
    expect(getByText('2 (connect timeout)')).toBeInTheDocument()
  })

  it('saves the host and the data type', async () => {
    const form = makeForm()
    const { getByDisplayValue } = render(ModbusGridSection, { form })
    const host = getByDisplayValue('192.168.0.10')
    await fireEvent.input(host, { target: { value: '192.168.0.20' } })
    await fireEvent.blur(host)
    expect(form.saveField).toHaveBeenCalledWith('modbus_grid_host', '192.168.0.20')
    await fireEvent.change(getByDisplayValue('int32'), { target: { value: 'float32' } })
    expect(form.saveField).toHaveBeenCalledWith('modbus_grid_format', 'float32')
  })

  it('has no mode choice on firmware without the AlphaESS mode', () => {
    const { queryByText } = render(ModbusGridSection, { form: makeForm() })
    expect(queryByText('config.modbusgrid.mode')).not.toBeInTheDocument()
  })

  it('switches to the AlphaESS mode', async () => {
    config_store.set({ ...base, modbus_grid_mode: 'register' })
    const form = makeForm()
    const { getByDisplayValue } = render(ModbusGridSection, { form })
    await fireEvent.change(getByDisplayValue('config.modbusgrid.mode_register'), { target: { value: 'alphaess' } })
    expect(form.saveField).toHaveBeenCalledWith('modbus_grid_mode', 'alphaess')
  })

  it('shows voltage, current and apparent power in AlphaESS mode, without the register block', () => {
    config_store.set({ ...base, modbus_grid_mode: 'alphaess' })
    status_store.set({
      modbus_grid_connected: 1, modbus_grid_data_age: 900, modbus_grid_power: -7,
      modbus_grid_voltage: 235, modbus_grid_current: -0.0298, modbus_grid_apparent: 423, modbus_grid_errors: 0,
    })
    const { getByText, queryByText } = render(ModbusGridSection, { form: makeForm() })
    expect(getByText('235 V')).toBeInTheDocument()
    expect(getByText('0.0 A')).toBeInTheDocument()
    expect(getByText('423 VA')).toBeInTheDocument()
    expect(queryByText('config.modbusgrid.register')).not.toBeInTheDocument()
  })
})
