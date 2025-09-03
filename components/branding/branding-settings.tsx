'use client'

import { useState, useEffect } from 'react'
import { 
  Palette, 
  Type, 
  Layout, 
  Eye,
  Upload,
  Save,
  RotateCcw,
  Monitor,
  Smartphone,
  Mail,
  CreditCard,
  Globe,
  Settings,
  Crown,
  Zap,
  Check
} from 'lucide-react'

interface BrandingConfig {
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    text: string
  }
  typography: {
    fontFamily: string
    headingFont: string
    fontSize: {
      small: string
      medium: string
      large: string
    }
  }
  layout: {
    headerStyle: string
    footerStyle: string
    borderRadius: string
    spacing: string
  }
  whiteLabel: {
    enabled: boolean
    hideTShopBranding: boolean
    customFooterText: string
    customPoweredBy: string
  }
  customization: {
    showTeamName: boolean
    showTeamLogo: boolean
    customWelcomeMessage: string
    customContactInfo: string
  }
}

interface BrandingData {
  teamId: string
  teamName: string
  logo?: string
  customDomain?: string
  plan: string
  config: BrandingConfig
  canUseWhiteLabel: boolean
  canUseCustomDomain: boolean
}

interface BrandingSettingsProps {
  teamId: string
  onBrandingUpdate?: (branding: BrandingData) => void
}

const FONT_OPTIONS = [
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins',
  'Source Sans Pro', 'Nunito', 'PT Sans', 'Ubuntu', 'Merriweather',
  'Playfair Display', 'Raleway', 'Oswald', 'Lora'
]

const HEADER_STYLES = [
  { value: 'default', name: 'Default', description: 'Standard header with navigation' },
  { value: 'minimal', name: 'Minimal', description: 'Clean header with minimal elements' },
  { value: 'centered', name: 'Centered', description: 'Logo and navigation centered' },
]

const FOOTER_STYLES = [
  { value: 'default', name: 'Default', description: 'Standard footer with links' },
  { value: 'minimal', name: 'Minimal', description: 'Simple footer with essential info' },
  { value: 'hidden', name: 'Hidden', description: 'No footer (white-label only)' },
]

const SPACING_OPTIONS = [
  { value: 'compact', name: 'Compact', description: 'Tight spacing for dense layouts' },
  { value: 'normal', name: 'Normal', description: 'Balanced spacing for readability' },
  { value: 'spacious', name: 'Spacious', description: 'Generous spacing for clean look' },
]

export default function BrandingSettings({ teamId, onBrandingUpdate }: BrandingSettingsProps) {
  const [branding, setBranding] = useState<BrandingData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('colors')
  const [previewType, setPreviewType] = useState('storefront')
  const [preview, setPreview] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    fetchBrandingSettings()
  }, [teamId])

  const fetchBrandingSettings = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/branding?teamId=${teamId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch branding settings')
      }

      setBranding(data.branding)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const updateConfig = (section: keyof BrandingConfig, updates: any) => {
    if (!branding) return

    setBranding(prev => ({
      ...prev!,
      config: {
        ...prev!.config,
        [section]: {
          ...prev!.config[section],
          ...updates,
        },
      },
    }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    if (!branding || !hasChanges) return

    try {
      setIsSaving(true)
      setError(null)

      const response = await fetch('/api/branding', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamId: branding.teamId,
          config: branding.config,
          logo: branding.logo,
          customDomain: branding.customDomain,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save branding settings')
      }

      setHasChanges(false)
      onBrandingUpdate?.(branding)

    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const generatePreview = async () => {
    if (!branding) return

    try {
      const response = await fetch('/api/branding/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamId: branding.teamId,
          config: branding.config,
          previewType,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setPreview(data.preview)
      }
    } catch (error) {
      console.error('Error generating preview:', error)
    }
  }

  const resetToDefaults = () => {
    if (!branding) return

    const defaultConfig: BrandingConfig = {
      colors: {
        primary: '#3B82F6',
        secondary: '#10B981',
        accent: '#8B5CF6',
        background: '#FFFFFF',
        text: '#111827',
      },
      typography: {
        fontFamily: 'Inter',
        headingFont: 'Inter',
        fontSize: {
          small: '14px',
          medium: '16px',
          large: '18px',
        },
      },
      layout: {
        headerStyle: 'default',
        footerStyle: 'default',
        borderRadius: '8px',
        spacing: 'normal',
      },
      whiteLabel: {
        enabled: false,
        hideTShopBranding: false,
        customFooterText: '',
        customPoweredBy: '',
      },
      customization: {
        showTeamName: true,
        showTeamLogo: true,
        customWelcomeMessage: '',
        customContactInfo: '',
      },
    }

    setBranding(prev => ({
      ...prev!,
      config: defaultConfig,
    }))
    setHasChanges(true)
  }

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (error || !branding) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
        <p className="font-medium">Error loading branding settings</p>
        <p className="text-sm mt-1">{error || 'Unknown error occurred'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Brand Customization</h2>
          <p className="text-gray-600">Customize your team's branding and white-label experience</p>
        </div>

        <div className="flex items-center space-x-3">
          {hasChanges && (
            <span className="text-sm text-orange-600 font-medium">
              Unsaved changes
            </span>
          )}
          
          <button
            onClick={generatePreview}
            className="btn-ghost flex items-center space-x-2"
          >
            <Eye className="h-4 w-4" />
            <span>Preview</span>
          </button>
          
          <button
            onClick={resetToDefaults}
            className="btn-ghost flex items-center space-x-2"
            disabled={isSaving}
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset</span>
          </button>
          
          <button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="btn-primary flex items-center space-x-2 disabled:opacity-50"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Plan Warning */}
      {!branding.canUseWhiteLabel && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Crown className="h-5 w-5 text-blue-600" />
            <h3 className="font-medium text-blue-900">Upgrade for White-Label Features</h3>
          </div>
          <p className="text-blue-800 text-sm mt-2">
            Advanced branding and white-label capabilities are available with Business and Enterprise plans.
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Settings Panel */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-lg">
            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {[
                  { id: 'colors', name: 'Colors', icon: Palette },
                  { id: 'typography', name: 'Typography', icon: Type },
                  { id: 'layout', name: 'Layout', icon: Layout },
                  { id: 'whitelabel', name: 'White Label', icon: Settings },
                ].map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center space-x-2 py-4 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{tab.name}</span>
                    </button>
                  )
                })}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'colors' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Brand Colors</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {Object.entries(branding.config.colors).map(([key, value]) => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                          {key === 'primary' && '🎨 '}
                          {key === 'secondary' && '🌟 '}
                          {key === 'accent' && '✨ '}
                          {key === 'background' && '🖼️ '}
                          {key === 'text' && '📝 '}
                          {key} Color
                        </label>
                        <div className="flex items-center space-x-3">
                          <input
                            type="color"
                            value={value}
                            onChange={(e) => updateConfig('colors', { [key]: e.target.value })}
                            className="w-12 h-12 border border-gray-300 rounded-lg cursor-pointer"
                          />
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => updateConfig('colors', { [key]: e.target.value })}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="#000000"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Color Preview</h4>
                    <div className="flex space-x-4">
                      <div 
                        className="w-16 h-16 rounded-lg border-2 border-white shadow-sm"
                        style={{ backgroundColor: branding.config.colors.primary }}
                        title="Primary"
                      ></div>
                      <div 
                        className="w-16 h-16 rounded-lg border-2 border-white shadow-sm"
                        style={{ backgroundColor: branding.config.colors.secondary }}
                        title="Secondary"
                      ></div>
                      <div 
                        className="w-16 h-16 rounded-lg border-2 border-white shadow-sm"
                        style={{ backgroundColor: branding.config.colors.accent }}
                        title="Accent"
                      ></div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'typography' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Typography</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Body Font
                      </label>
                      <select
                        value={branding.config.typography.fontFamily}
                        onChange={(e) => updateConfig('typography', { fontFamily: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {FONT_OPTIONS.map(font => (
                          <option key={font} value={font}>{font}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Heading Font
                      </label>
                      <select
                        value={branding.config.typography.headingFont}
                        onChange={(e) => updateConfig('typography', { headingFont: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {FONT_OPTIONS.map(font => (
                          <option key={font} value={font}>{font}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Typography Preview</h4>
                    <div style={{ fontFamily: branding.config.typography.headingFont }}>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">This is a heading</h2>
                    </div>
                    <div style={{ fontFamily: branding.config.typography.fontFamily }}>
                      <p className="text-gray-700">This is body text that shows how your font choices will look in practice. The quick brown fox jumps over the lazy dog.</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'layout' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Layout & Spacing</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Header Style
                    </label>
                    <div className="space-y-3">
                      {HEADER_STYLES.map((style) => (
                        <div
                          key={style.value}
                          className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                            branding.config.layout.headerStyle === style.value
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => updateConfig('layout', { headerStyle: style.value })}
                        >
                          <div className="flex items-center space-x-3">
                            <input
                              type="radio"
                              checked={branding.config.layout.headerStyle === style.value}
                              onChange={() => updateConfig('layout', { headerStyle: style.value })}
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <div>
                              <h4 className="font-medium text-gray-900">{style.name}</h4>
                              <p className="text-sm text-gray-600">{style.description}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Footer Style
                    </label>
                    <div className="space-y-3">
                      {FOOTER_STYLES.map((style) => (
                        <div
                          key={style.value}
                          className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                            branding.config.layout.footerStyle === style.value
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          } ${
                            style.value === 'hidden' && !branding.canUseWhiteLabel 
                              ? 'opacity-50 cursor-not-allowed' 
                              : ''
                          }`}
                          onClick={() => {
                            if (style.value === 'hidden' && !branding.canUseWhiteLabel) return
                            updateConfig('layout', { footerStyle: style.value })
                          }}
                        >
                          <div className="flex items-center space-x-3">
                            <input
                              type="radio"
                              checked={branding.config.layout.footerStyle === style.value}
                              onChange={() => {
                                if (style.value === 'hidden' && !branding.canUseWhiteLabel) return
                                updateConfig('layout', { footerStyle: style.value })
                              }}
                              disabled={style.value === 'hidden' && !branding.canUseWhiteLabel}
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <div>
                              <h4 className="font-medium text-gray-900 flex items-center">
                                {style.name}
                                {style.value === 'hidden' && !branding.canUseWhiteLabel && (
                                  <Crown className="h-4 w-4 ml-2 text-blue-600" />
                                )}
                              </h4>
                              <p className="text-sm text-gray-600">{style.description}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Border Radius
                      </label>
                      <input
                        type="text"
                        value={branding.config.layout.borderRadius}
                        onChange={(e) => updateConfig('layout', { borderRadius: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="8px"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Spacing
                      </label>
                      <select
                        value={branding.config.layout.spacing}
                        onChange={(e) => updateConfig('layout', { spacing: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {SPACING_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.name} - {option.description}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'whitelabel' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">White Label Settings</h3>
                    {!branding.canUseWhiteLabel && (
                      <div className="flex items-center space-x-2 text-blue-600">
                        <Crown className="h-4 w-4" />
                        <span className="text-sm font-medium">Upgrade Required</span>
                      </div>
                    )}
                  </div>
                  
                  {branding.canUseWhiteLabel ? (
                    <>
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="enableWhiteLabel"
                          checked={branding.config.whiteLabel.enabled}
                          onChange={(e) => updateConfig('whiteLabel', { enabled: e.target.checked })}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="enableWhiteLabel" className="text-sm font-medium text-gray-700">
                          Enable White Label Mode
                        </label>
                      </div>

                      {branding.config.whiteLabel.enabled && (
                        <div className="space-y-6 ml-6 border-l-2 border-blue-200 pl-6">
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              id="hideTShopBranding"
                              checked={branding.config.whiteLabel.hideTShopBranding}
                              onChange={(e) => updateConfig('whiteLabel', { hideTShopBranding: e.target.checked })}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor="hideTShopBranding" className="text-sm font-medium text-gray-700">
                              Hide TShop Branding
                            </label>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Custom Footer Text
                            </label>
                            <textarea
                              value={branding.config.whiteLabel.customFooterText}
                              onChange={(e) => updateConfig('whiteLabel', { customFooterText: e.target.value })}
                              placeholder="© 2024 Your Company Name. All rights reserved."
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                              rows={2}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Custom "Powered By" Text
                            </label>
                            <input
                              type="text"
                              value={branding.config.whiteLabel.customPoweredBy}
                              onChange={(e) => updateConfig('whiteLabel', { customPoweredBy: e.target.value })}
                              placeholder="Powered by Your Platform"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <div className="flex items-start space-x-3">
                        <Crown className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-blue-900 mb-2">White Label Features</h4>
                          <ul className="text-blue-800 text-sm space-y-1 mb-4">
                            <li className="flex items-center space-x-2">
                              <Check className="h-3 w-3" />
                              <span>Remove TShop branding</span>
                            </li>
                            <li className="flex items-center space-x-2">
                              <Check className="h-3 w-3" />
                              <span>Custom footer text</span>
                            </li>
                            <li className="flex items-center space-x-2">
                              <Check className="h-3 w-3" />
                              <span>Custom powered-by text</span>
                            </li>
                            <li className="flex items-center space-x-2">
                              <Check className="h-3 w-3" />
                              <span>Hidden footer option</span>
                            </li>
                          </ul>
                          <button className="btn-primary btn-sm">
                            Upgrade to Business
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Customization Options</h4>
                    
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="showTeamName"
                        checked={branding.config.customization.showTeamName}
                        onChange={(e) => updateConfig('customization', { showTeamName: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="showTeamName" className="text-sm font-medium text-gray-700">
                        Show Team Name in Header
                      </label>
                    </div>

                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="showTeamLogo"
                        checked={branding.config.customization.showTeamLogo}
                        onChange={(e) => updateConfig('customization', { showTeamLogo: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="showTeamLogo" className="text-sm font-medium text-gray-700">
                        Show Team Logo
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Custom Welcome Message
                      </label>
                      <input
                        type="text"
                        value={branding.config.customization.customWelcomeMessage}
                        onChange={(e) => updateConfig('customization', { customWelcomeMessage: e.target.value })}
                        placeholder={`Welcome to ${branding.teamName}`}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Information
                      </label>
                      <textarea
                        value={branding.config.customization.customContactInfo}
                        onChange={(e) => updateConfig('customization', { customContactInfo: e.target.value })}
                        placeholder="Contact us at hello@yourcompany.com or call (555) 123-4567"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Preview</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPreviewType('storefront')}
                  className={`p-2 rounded ${
                    previewType === 'storefront' 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                  title="Storefront"
                >
                  <Monitor className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPreviewType('email')}
                  className={`p-2 rounded ${
                    previewType === 'email' 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                  title="Email"
                >
                  <Mail className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPreviewType('checkout')}
                  className={`p-2 rounded ${
                    previewType === 'checkout' 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                  title="Checkout"
                >
                  <CreditCard className="h-4 w-4" />
                </button>
              </div>
            </div>

            {preview ? (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                {previewType === 'storefront' && (
                  <div className="bg-white" style={{ fontFamily: preview.components.typography.fontFamily }}>
                    {/* Header Preview */}
                    <div 
                      className="px-4 py-3"
                      style={{ 
                        backgroundColor: preview.components.header.backgroundColor,
                        color: preview.components.header.textColor,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {preview.components.header.logo && (
                            <div className="w-6 h-6 bg-white bg-opacity-20 rounded"></div>
                          )}
                          <span className="font-bold text-sm">{preview.components.header.teamName}</span>
                        </div>
                        <div className="text-xs">Menu</div>
                      </div>
                    </div>
                    
                    {/* Hero Preview */}
                    <div 
                      className="px-4 py-6 text-center"
                      style={{ 
                        backgroundColor: preview.components.hero.backgroundColor,
                        color: preview.components.hero.textColor,
                      }}
                    >
                      <h2 className="font-bold text-sm mb-2" style={{ fontFamily: preview.components.typography.headingFont }}>
                        {preview.components.hero.title}
                      </h2>
                      <p className="text-xs mb-3">{preview.components.hero.subtitle}</p>
                      <button 
                        className="px-3 py-1 text-xs rounded"
                        style={{ 
                          backgroundColor: preview.components.hero.ctaButton.backgroundColor,
                          color: preview.components.hero.ctaButton.textColor,
                          borderRadius: preview.components.typography.borderRadius,
                        }}
                      >
                        {preview.components.hero.ctaButton.text}
                      </button>
                    </div>
                    
                    {/* Products Preview */}
                    <div className="px-4 py-4">
                      <div className="grid grid-cols-3 gap-2">
                        {preview.components.products.cards.slice(0, 3).map((card: any, index: number) => (
                          <div key={index} className="text-center">
                            <div 
                              className="w-full h-16 bg-gray-200 mb-1"
                              style={{ borderRadius: card.borderRadius }}
                            ></div>
                            <div className="text-xs font-medium">{card.name}</div>
                            <div className="text-xs text-gray-600">{card.price}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Footer Preview */}
                    {preview.components.footer.style !== 'hidden' && (
                      <div 
                        className="px-4 py-2 text-center"
                        style={{ 
                          backgroundColor: preview.components.footer.backgroundColor,
                          color: preview.components.footer.textColor,
                        }}
                      >
                        <div className="text-xs">
                          {preview.components.footer.customText && (
                            <div className="mb-1">{preview.components.footer.customText}</div>
                          )}
                          {preview.components.footer.contactInfo && (
                            <div className="mb-1">{preview.components.footer.contactInfo}</div>
                          )}
                          {preview.components.footer.showTShopBranding && (
                            <div>Powered by TShop</div>
                          )}
                          {preview.components.footer.customPoweredBy && (
                            <div>{preview.components.footer.customPoweredBy}</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Email and Checkout previews would go here */}
                {previewType === 'email' && (
                  <div className="p-4 text-center text-sm text-gray-600">
                    Email preview functionality
                  </div>
                )}
                
                {previewType === 'checkout' && (
                  <div className="p-4 text-center text-sm text-gray-600">
                    Checkout preview functionality
                  </div>
                )}
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg p-8 text-center">
                <Eye className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">Click "Preview" to see your changes</p>
              </div>
            )}

            <button
              onClick={generatePreview}
              className="w-full mt-4 btn-primary btn-sm"
            >
              Generate Preview
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}