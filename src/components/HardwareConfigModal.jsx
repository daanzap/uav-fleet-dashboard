import { useState, useEffect } from 'react'
import { normalizeConfig } from '../lib/hardwareConfig'
import './HardwareConfigModal.css'

const RADIO_OPTIONS = [
  { key: 'h30', label: 'H30' },
  { key: 'silvus', label: 'Silvus' },
  { key: 'radioNor', label: 'RadioNor' }
]

const FREQUENCY_OPTIONS = [
  { key: 's', label: 'S-Band' },
  { key: 'c', label: 'C-Band' },
  { key: 'l', label: 'L-Band' }
]

const GPS_OPTIONS = [
  { key: 'holyBro', label: 'Holybro' },
  { key: 'hardenGps', label: 'Harden GPS' },
  { key: 'arcXL', label: 'ARC_XL' },
  { key: 'arcX20', label: 'Arc (x20)' }
]

export default function HardwareConfigModal({ initialConfig, onSave, onClose }) {
  const [config, setConfig] = useState(() => normalizeConfig(initialConfig ?? null))

  useEffect(() => {
    setConfig(normalizeConfig(initialConfig ?? null))
  }, [initialConfig])

  const updateRadio = (optionKey, field, value) => {
    setConfig(prev => ({
      ...prev,
      radio: {
        ...prev.radio,
        [optionKey]: {
          ...prev.radio[optionKey],
          [field]: value
        }
      }
    }))
  }

  const updateFrequency = (key, value) => {
    setConfig(prev => ({
      ...prev,
      frequencyBand: {
        ...prev.frequencyBand,
        [key]: value
      }
    }))
  }

  const updateGps = (optionKey, field, value) => {
    setConfig(prev => ({
      ...prev,
      gps: {
        ...prev.gps,
        [optionKey]: {
          ...prev.gps[optionKey],
          [field]: value
        }
      }
    }))
  }

  const setVisualNav = (field, value) => {
    setConfig(prev => ({
      ...prev,
      visualNavigation: {
        ...prev.visualNavigation,
        [field]: value
      }
    }))
  }

  const handleSave = () => {
    onSave(config)
    onClose()
  }

  const setLegacyText = (value) => {
    setConfig(prev => ({ ...prev, legacy_text: value }))
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className="hw-config-overlay" onClick={handleBackdropClick}>
      <div className="hw-config-container" onClick={e => e.stopPropagation()}>
        <div className="hw-config-header">
          <div className="hw-config-icon">⚙️</div>
          <div>
            <h2>Hardware Configuration</h2>
            <p className="hw-config-subtitle">Radio, frequency, GPS, visual navigation</p>
          </div>
          <button type="button" onClick={onClose} className="hw-config-close" aria-label="Close">×</button>
        </div>

        <div className="hw-config-body">
          {/* Radio — single column: H30, Silvus, RadioNor, Custom + text */}
          <div className="hw-config-section">
            <h3 className="hw-config-section-title">Radio</h3>
            <div className="hw-config-radio-column">
              {RADIO_OPTIONS.map(({ key, label }) => (
                <label key={key} className="hw-config-check">
                  <input
                    type="checkbox"
                    checked={!!config.radio?.[key]?.enabled}
                    onChange={e => updateRadio(key, 'enabled', e.target.checked)}
                  />
                  <span>{label}</span>
                </label>
              ))}
              <label className="hw-config-check">
                <input
                  type="checkbox"
                  checked={!!config.radio?.custom?.enabled}
                  onChange={e => updateRadio('custom', 'enabled', e.target.checked)}
                />
                <span>Custom</span>
              </label>
              {config.radio?.custom?.enabled && (
                <input
                  type="text"
                  className="hw-config-input-inline hw-config-custom-full"
                  placeholder="Enter custom radio"
                  value={config.radio.custom.value ?? ''}
                  onChange={e => updateRadio('custom', 'value', e.target.value)}
                />
              )}
            </div>
          </div>

          {/* Frequency Band — single column: S-Band, C-Band, L-Band, Custom (text) */}
          <div className="hw-config-section">
            <h3 className="hw-config-section-title">Frequency Band</h3>
            <div className="hw-config-radio-column">
              {FREQUENCY_OPTIONS.map(({ key, label }) => (
                <label key={key} className="hw-config-check">
                  <input
                    type="checkbox"
                    checked={!!config.frequencyBand?.[key]}
                    onChange={e => updateFrequency(key, e.target.checked)}
                  />
                  <span>{label}</span>
                </label>
              ))}
              <label className="hw-config-check">
                <input
                  type="checkbox"
                  checked={(config.frequencyBand?.custom ?? '').trim() !== ''}
                  onChange={e => updateFrequency('custom', e.target.checked ? ((config.frequencyBand?.custom ?? '').trim() || ' ') : '')}
                />
                <span>Custom</span>
              </label>
              <input
                type="text"
                className="hw-config-input-inline hw-config-custom-full"
                placeholder="Enter custom band"
                value={config.frequencyBand?.custom === ' ' ? '' : (config.frequencyBand?.custom ?? '')}
                onChange={e => updateFrequency('custom', e.target.value)}
              />
            </div>
          </div>

          {/* Visual Navigation — single column: Yes, No, Boson */}
          <div className="hw-config-section">
            <h3 className="hw-config-section-title">Visual Navigation</h3>
            <div className="hw-config-radio-column">
              <label className="hw-config-check">
                <input
                  type="checkbox"
                  checked={!!config.visualNavigation?.yes}
                  onChange={e => setVisualNav('yes', e.target.checked)}
                />
                <span>Yes</span>
              </label>
              <label className="hw-config-check">
                <input
                  type="checkbox"
                  checked={!!config.visualNavigation?.no}
                  onChange={e => setVisualNav('no', e.target.checked)}
                />
                <span>No</span>
              </label>
              <label className="hw-config-check">
                <input
                  type="checkbox"
                  checked={!!config.visualNavigation?.boson}
                  onChange={e => setVisualNav('boson', e.target.checked)}
                />
                <span>Boson</span>
              </label>
            </div>
          </div>

          {/* GPS — single column: Holybro, Harden GPS, ARC_XL, Arc (x20), Custom (text) */}
          <div className="hw-config-section">
            <h3 className="hw-config-section-title">GPS</h3>
            <div className="hw-config-radio-column">
              {GPS_OPTIONS.map(({ key, label }) => (
                <label key={key} className="hw-config-check">
                  <input
                    type="checkbox"
                    checked={!!config.gps?.[key]?.enabled}
                    onChange={e => updateGps(key, 'enabled', e.target.checked)}
                  />
                  <span>{label}</span>
                </label>
              ))}
              <label className="hw-config-check">
                <input
                  type="checkbox"
                  checked={!!config.gps?.custom?.enabled}
                  onChange={e => updateGps('custom', 'enabled', e.target.checked)}
                />
                <span>Custom</span>
              </label>
              {config.gps?.custom?.enabled && (
                <input
                  type="text"
                  className="hw-config-input-inline hw-config-custom-full"
                  placeholder="Enter custom GPS"
                  value={config.gps.custom.value ?? ''}
                  onChange={e => updateGps('custom', 'value', e.target.value)}
                />
              )}
            </div>
          </div>

          {/* Others (free-text notes) */}
          <div className="hw-config-section hw-config-others-section">
            <h3 className="hw-config-section-title">Others</h3>
            <textarea
              className="hw-config-others-input"
              placeholder="e.g. what you changed, custom notes..."
              value={config.legacy_text ?? ''}
              onChange={e => setLegacyText(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="hw-config-actions">
          <button type="button" className="hw-config-btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="hw-config-btn-save" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
