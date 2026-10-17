// src/routes/settings/__tests__/ModbusMeter.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/svelte'

vi.mock('svelte-i18n', () => {
  const t = (k) => k
  t.subscribe = (fn) => { fn(t); return () => {} }
  return { _: t }
})
vi.mock('../../../lib/api/httpAPI.js', () => ({ httpAPI: vi.fn(() => Promise.resolve({ msg: 'done' })) }))

import { httpAPI } from '../../../lib/api/httpAPI.js'
import { config_store } from '../../../lib/stores/config.js'
import { status_store } from '../../../lib/stores/status.js'
import { uistates_store } from '../../../lib/stores/uistates.js'
import ModbusMeter from '../ModbusMeter.svelte'

const base = {
  modbus_meter_enabled: true,
  modbus_meter_host: '192.168.0.50',
  modbus_meter_port: 502,
  modbus_meter_unit: 1,
  modbus_meter_interval: 5,
  modbus_meter_timeout: 90,
}

const live = {
  modbus_meter_connected: 1,
  modbus_meter_active: 1,
  modbus_meter_data_age: 1200,
  modbus_meter_voltage: 231.24,
  modbus_meter_current: 31.8,
  modbus_meter_power: 7349.6,
  modbus_meter_energy: 1234.567,
  modbus_meter_errors: 0,
}

beforeEach(() => {
  uistates_store.resetAlertBox()
  httpAPI.mockReset()
  httpAPI.mockResolvedValue({ msg: 'done' })
  config_store.set({ ...base })
  status_store.set({ ...live })
})

describe('Modbus meter page', () => {
  it('shows only the enable switch while disabled', () => {
    config_store.set({ ...base, modbus_meter_enabled: false })
    const { getByText, queryByText } = render(ModbusMeter)
    expect(getByText('config.modbusmeter.enable')).toBeInTheDocument()
    expect(queryByText('config.modbusmeter.host')).not.toBeInTheDocument()
    expect(queryByText('config.modbusmeter.connected')).not.toBeInTheDocument()
  })

  it('enables the meter through /config', async () => {
    config_store.set({ ...base, modbus_meter_enabled: false })
    const { getByRole } = render(ModbusMeter)
    await fireEvent.click(getByRole('switch'))
    expect(httpAPI).toHaveBeenCalledWith('POST', '/config', JSON.stringify({ modbus_meter_enabled: true }))
  })

  it('shows the connection, source and latest readings', () => {
    const { getByText } = render(ModbusMeter)
    expect(getByText('config.modbusmeter.connected')).toBeInTheDocument()
    expect(getByText('config.modbusmeter.source_meter')).toBeInTheDocument()
    expect(getByText('1200 ms')).toBeInTheDocument()
    expect(getByText('231.2 V')).toBeInTheDocument()
    expect(getByText('31.80 A')).toBeInTheDocument()
    expect(getByText('7350 W')).toBeInTheDocument()
    expect(getByText('1234.57 kWh')).toBeInTheDocument()
  })

  it('treats "never received" and null readings as no data, and shows the last error', () => {
    status_store.set({
      modbus_meter_connected: 0, modbus_meter_active: 0, modbus_meter_data_age: 4294967295,
      modbus_meter_voltage: null, modbus_meter_current: null, modbus_meter_power: null, modbus_meter_energy: null,
      modbus_meter_errors: 3, modbus_meter_last_error: 'connect timeout',
    })
    const { getByText, getAllByText } = render(ModbusMeter)
    expect(getByText('config.modbusmeter.not_connected')).toBeInTheDocument()
    expect(getByText('config.modbusmeter.source_default')).toBeInTheDocument()
    expect(getAllByText('—')).toHaveLength(5)
    expect(getByText('3 (connect timeout)')).toBeInTheDocument()
  })

  it('saves the gateway address on blur', async () => {
    const { getByDisplayValue } = render(ModbusMeter)
    const input = getByDisplayValue('192.168.0.50')
    await fireEvent.input(input, { target: { value: '192.168.0.60' } })
    await fireEvent.blur(input)
    expect(httpAPI).toHaveBeenCalledWith('POST', '/config', JSON.stringify({ modbus_meter_host: '192.168.0.60' }))
  })
})
