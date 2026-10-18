// src/lib/components/config/__tests__/VoltageThrottleSection.test.js
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
import VoltageThrottleSection from '../VoltageThrottleSection.svelte'

const base = {
  voltage_throttle_enabled: true,
  voltage_throttle_low: 212,
  voltage_throttle_high: 218,
  voltage_throttle_interval: 30,
  voltage_throttle_step: 1,
}

function makeForm() {
  return { saveField: vi.fn(async () => true), saveState: writable({}), revert: 0 }
}

beforeEach(() => {
  config_store.set({ ...base })
  status_store.set({ voltage_throttle_active: 0, voltage_throttle_current: 0 })
})

describe('Voltage throttle section', () => {
  it('shows only the switch while disabled', () => {
    config_store.set({ ...base, voltage_throttle_enabled: false })
    const { getByText, queryByText } = render(VoltageThrottleSection, { form: makeForm() })
    expect(getByText('config.safety.voltage_throttle_enable')).toBeInTheDocument()
    expect(queryByText('config.safety.voltage_throttle_low')).not.toBeInTheDocument()
  })

  it('saves the switch', async () => {
    config_store.set({ ...base, voltage_throttle_enabled: false })
    const form = makeForm()
    const { getByRole } = render(VoltageThrottleSection, { form })
    await fireEvent.click(getByRole('switch'))
    expect(form.saveField).toHaveBeenCalledWith('voltage_throttle_enabled', true)
  })

  it('shows the active limit and the last mean voltage', () => {
    status_store.set({ voltage_throttle_active: 1, voltage_throttle_current: 9, voltage_throttle_voltage: 210.44 })
    const { getByText } = render(VoltageThrottleSection, { form: makeForm() })
    expect(getByText('config.safety.voltage_throttle_limiting 9 A')).toBeInTheDocument()
    expect(getByText('210.4 V')).toBeInTheDocument()
  })

  it('shows idle and no mean before the first interval', () => {
    const { getByText } = render(VoltageThrottleSection, { form: makeForm() })
    expect(getByText('config.safety.voltage_throttle_idle')).toBeInTheDocument()
    expect(getByText('—')).toBeInTheDocument()
  })

  it('saves the lower threshold on blur', async () => {
    const form = makeForm()
    const { getByDisplayValue } = render(VoltageThrottleSection, { form })
    const input = getByDisplayValue('212')
    await fireEvent.input(input, { target: { value: '210' } })
    await fireEvent.blur(input)
    expect(form.saveField).toHaveBeenCalledWith('voltage_throttle_low', 210)
  })
})
