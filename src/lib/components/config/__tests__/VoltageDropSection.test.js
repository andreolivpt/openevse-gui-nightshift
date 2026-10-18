// src/lib/components/config/__tests__/VoltageDropSection.test.js
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/svelte'

vi.mock('svelte-i18n', () => {
  const t = (k) => k
  t.subscribe = (fn) => { fn(t); return () => {} }
  return { _: t }
})

import { status_store } from '../../../stores/status.js'
import VoltageDropSection from '../VoltageDropSection.svelte'

describe('Voltage drop section', () => {
  it('waits for both meters', () => {
    status_store.set({ voltage_drop_available: 0 })
    const { getByText, queryByText } = render(VoltageDropSection)
    expect(getByText('config.voltagedrop.unavailable')).toBeInTheDocument()
    expect(queryByText('config.voltagedrop.drop')).not.toBeInTheDocument()
  })

  it('shows the drop while the offset and resistance are still being learnt', () => {
    status_store.set({
      voltage_drop_available: 1, voltage_drop_grid_voltage: 236, voltage_drop_charger_voltage: 237.4,
      voltage_drop: -1.4, voltage_drop_pct: -0.59,
    })
    const { getByText, getAllByText, queryByText } = render(VoltageDropSection)
    expect(getByText('-1.4 V')).toBeInTheDocument()
    expect(getAllByText('config.voltagedrop.learning')).toHaveLength(2)
    expect(queryByText('config.voltagedrop.loss')).not.toBeInTheDocument()
  })

  it('shows resistance, loss and the drop at the maximum current', () => {
    status_store.set({
      voltage_drop_available: 1, voltage_drop_grid_voltage: 235, voltage_drop_charger_voltage: 229.9,
      voltage_drop: 7.6, voltage_drop_pct: 3.23, voltage_drop_offset: -2.5,
      voltage_drop_resistance: 0.4752, voltage_drop_loss: 121.6, voltage_drop_at_max: 15.2, voltage_drop_max_current: 32,
    })
    const { getByText } = render(VoltageDropSection)
    expect(getByText('7.6 V')).toBeInTheDocument()
    expect(getByText('(3.2 %)')).toBeInTheDocument()
    expect(getByText('475 mΩ')).toBeInTheDocument()
    expect(getByText('122 W')).toBeInTheDocument()
    expect(getByText('15.2 V')).toBeInTheDocument()
    expect(getByText('(6.5 %)')).toBeInTheDocument()
  })
})
