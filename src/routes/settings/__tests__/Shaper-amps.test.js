// src/routes/settings/__tests__/Shaper-amps.test.js
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
import Shaper from '../Shaper.svelte'

const amps = {
  current_shaper_enabled: true,
  current_shaper_max_pwr: 6000,
  current_shaper_max_cur: 29,
  current_shaper_max_va: 6700,
  modbus_grid_enabled: true,
  modbus_grid_mode: 'alphaess',
}

beforeEach(() => {
  uistates_store.resetAlertBox()
  httpAPI.mockReset()
  httpAPI.mockResolvedValue({ msg: 'done' })
  status_store.set({ shaper_updated: true, shaper_live_pwr: 0, shaper_cur: 0 })
})

describe('Shaper page — limit in amps', () => {
  it('hides the amps limits while the grid source reads a power register', () => {
    config_store.set({ ...amps, modbus_grid_mode: 'register' })
    const { queryByText } = render(Shaper)
    expect(queryByText('config.shaper.max_cur')).not.toBeInTheDocument()
    expect(queryByText('config.shaper.max_power_amps_desc')).not.toBeInTheDocument()
  })

  it('hides them on firmware without the option', () => {
    const { current_shaper_max_cur, current_shaper_max_va, ...old } = amps
    config_store.set(old)
    const { queryByText } = render(Shaper)
    expect(queryByText('config.shaper.max_cur')).not.toBeInTheDocument()
  })

  it('shows and saves the amps limits in AlphaESS mode', async () => {
    config_store.set({ ...amps })
    const { getByText, getByDisplayValue } = render(Shaper)
    expect(getByText('config.shaper.max_cur')).toBeInTheDocument()
    expect(getByText('config.shaper.max_power_amps_desc')).toBeInTheDocument()
    const cur = getByDisplayValue('29')
    await fireEvent.input(cur, { target: { value: '28' } })
    await fireEvent.blur(cur)
    expect(httpAPI).toHaveBeenCalledWith('POST', '/config', JSON.stringify({ current_shaper_max_cur: 28 }))
  })

  it('shows the grid current against its limit', () => {
    config_store.set({ ...amps })
    status_store.set({ shaper_updated: true, shaper_live_pwr: 5000, shaper_cur: 12, shaper_live_cur: 21.27, shaper_grid_cur_limit: 28.5 })
    const { getByText } = render(Shaper)
    expect(getByText('21.3 A / 28.5 A')).toBeInTheDocument()
  })
})
