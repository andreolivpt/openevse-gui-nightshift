// src/routes/settings/__tests__/Shaper-release.test.js
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

beforeEach(() => {
  uistates_store.resetAlertBox()
  httpAPI.mockReset()
  httpAPI.mockResolvedValue({ msg: 'done' })
  status_store.set({ shaper_updated: true, shaper_live_pwr: 0, shaper_cur: 0 })
})

describe('Shaper page — release on timeout and Modbus source', () => {
  it('hides the release switch on firmware without the option', () => {
    config_store.set({ current_shaper_enabled: true })
    const { queryByText } = render(Shaper)
    expect(queryByText('config.shaper.release_on_timeout')).not.toBeInTheDocument()
  })

  it('saves the release switch', async () => {
    config_store.set({ current_shaper_enabled: true, current_shaper_release_on_timeout: false })
    const { getByRole } = render(Shaper)
    await fireEvent.click(getByRole('switch'))
    expect(httpAPI).toHaveBeenCalledWith('POST', '/config', JSON.stringify({ current_shaper_release_on_timeout: true }))
  })

  it('replaces the live power topic when the Modbus grid source is on', () => {
    config_store.set({ current_shaper_enabled: true, modbus_grid_enabled: true, mqtt_live_pwr: 'house/power' })
    const { getByText, queryByDisplayValue } = render(Shaper)
    expect(getByText('config.shaper.live_modbus')).toBeInTheDocument()
    expect(queryByDisplayValue('house/power')).not.toBeInTheDocument()
  })
})
