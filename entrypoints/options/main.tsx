import React, { useEffect, useState, memo } from 'react'
import { createRoot } from 'react-dom/client'
import { storage, Rule } from '../../components/storage'

type Tab = 'settings' | 'about'

const SettingsTab = memo(() => {
  const [rules, setRules] = useState<Rule[]>([])

  useEffect(() => {
    storage.get().then(data => setRules(data.rules))
  }, [])

  // Clean up empty rules when component unmounts (settings page closes)
  useEffect(() => {
    return () => {
      const cleanRules = rules.filter(rule => rule.url.trim() !== '' || rule.phrase.trim() !== '')
      if (cleanRules.length !== rules.length) {
        storage.set({ rules: cleanRules })
      }
    }
  }, [rules])

  const update = () => {
    // Remove empty rules before saving
    const cleanRules = rules.filter(rule => rule.url.trim() !== '' || rule.phrase.trim() !== '')
    storage.set({ rules: cleanRules })
    setRules(cleanRules)
  }

  const add = () => {
    setRules([...rules, { url: '', phrase: '' }])
  }

  const remove = (index: number) => {
    const newRules = rules.filter((_, i) => i !== index)
    setRules(newRules)
  }

  return (
    <div className="settings-tab">
      <h2>Website Rules</h2>
      <p className="description">
        Configure which websites require a phrase to access. Add the URL pattern and the phrase that must be typed.
      </p>
      
      <div className="rules-list">
        {rules.map((rule, i) => (
          <div key={i} className="rule-item">
            <div className="rule-inputs">
              <input
                className="url-input"
                placeholder="URL pattern (e.g., google.com)"
                value={rule.url}
                onChange={e => {
                  const copy = [...rules]; copy[i].url = e.target.value; setRules(copy)
                }}
              />
              <textarea
                className="phrase-input"
                placeholder="Phrase to type"
                value={rule.phrase}
                maxLength={150}
                rows={4}
                onChange={e => {
                  const copy = [...rules]; copy[i].phrase = e.target.value; setRules(copy)
                }}
              />
            </div>
            <button 
              className="remove-btn"
              onClick={() => remove(i)}
              title="Remove rule"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      
      <div className="actions">
        <button className="add-btn" onClick={add}>Add Rule</button>
        <button className="save-btn" onClick={update}>Save Changes</button>
      </div>
    </div>
  )
})

const AboutTab = memo(() => {
  return (
    <div className="about-tab">
      <h2>About Intentor</h2>
      <div className="about-content">
        <p>
          Intentor is a browser extension that helps you pause and reflect before visiting certain websites. 
          It creates a mindful moment where you must type a specific phrase to continue.
        </p>
        
        <h3>How it works</h3>
        <ol>
          <li>Configure websites and phrases in the Settings tab</li>
          <li>When you visit a configured website, Intentor shows an interstitial page</li>
          <li>Type the exact phrase to continue to the website</li>
          <li>This creates a moment of intentionality before browsing</li>
        </ol>
        
        <h3>Features</h3>
        <ul>
          <li>Custom phrases for different websites</li>
          <li>Beautiful, mindful interstitial design</li>
          <li>Real-time phrase validation</li>
          <li>Simple, distraction-free interface</li>
        </ul>
        
        <div className="version-info">
          <p><strong>Version:</strong> 1.0.0</p>
          <p><strong>Made with:</strong> React, TypeScript, WXT</p>
        </div>
      </div>
    </div>
  )
})

const Sidebar = memo(({ activeTab, setActiveTab }: { activeTab: Tab; setActiveTab: (tab: Tab) => void }) => (
  <div className="sidebar">
    <div className="sidebar-header">
      <h1>Intentor</h1>
    </div>
    <nav className="sidebar-nav">
      <button 
        className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
        onClick={() => setActiveTab('settings')}
      >
        Settings
      </button>
      <button 
        className={`tab-btn ${activeTab === 'about' ? 'active' : ''}`}
        onClick={() => setActiveTab('about')}
      >
        About
      </button>
    </nav>
  </div>
))

const Options = () => {
  const [activeTab, setActiveTab] = useState<Tab>('settings')

  return (
    <div className="options-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="content">
        {activeTab === 'settings' && <SettingsTab />}
        {activeTab === 'about' && <AboutTab />}
      </div>
    </div>
  )
}

const root = createRoot(document.getElementById('root')!)
root.render(<Options />)
