import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Rule, storage } from '../../components/storage';

type Tab = 'settings' | 'about';

const SettingsTab = memo(() => {
  const [rules, setRules] = useState<Rule[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    index: number | null;
  }>({
    show: false,
    index: null,
  });
  const urlInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const isRuleEmpty = useCallback((rule: Rule) => {
    return rule.url.trim() === '';
  }, []);

  const focusNewRuleUrl = useCallback((ruleIndex: number) => {
    // Small delay to ensure DOM is updated
    setTimeout(() => {
      urlInputRefs.current[ruleIndex]?.focus();
    }, 50);
  }, []);

  const saveRules = useCallback(
    (rulesToSave: Rule[]) => {
      // Remove empty rules before saving
      const cleanRules = rulesToSave.filter(rule => !isRuleEmpty(rule));
      storage.set({ rules: cleanRules });
    },
    [isRuleEmpty]
  );

  useEffect(() => {
    storage.get().then(data => {
      const initialRules =
        data.rules.length > 0 ? data.rules : [{ url: '', phrase: '' }];
      setRules(initialRules);
    });
  }, []);

  // Save rules whenever they change (except during initial load)
  useEffect(() => {
    // Don't save during initial load (when rules are empty and we're about to load from storage)
    if (rules.length > 0) {
      saveRules(rules);
    }
  }, [rules, saveRules]);

  const update = () => {
    saveRules(rules);
    // Ensure we always have at least one rule (empty if needed)
    const cleanRules = rules.filter(rule => !isRuleEmpty(rule));
    setRules(cleanRules.length > 0 ? cleanRules : [{ url: '', phrase: '' }]);
  };

  const addRule = () => {
    setRules(prev => {
      const newRules = [...prev, { url: '', phrase: '' }];
      // Focus the new rule's URL input
      focusNewRuleUrl(newRules.length - 1);
      return newRules;
    });
  };

  const remove = (index: number) => {
    const rule = rules[index];
    const hasContent = rule.url.trim() !== '' || rule.phrase.trim() !== '';

    // Show confirmation dialog for rules with content
    if (hasContent) {
      setDeleteConfirm({ show: true, index });
      return;
    }

    // Delete empty rules immediately
    performDelete(index);
  };

  const performDelete = (index: number) => {
    const newRules = rules.filter((_, i) => i !== index);
    // Ensure we always have at least one rule (empty if needed)
    const finalRules =
      newRules.length > 0 ? newRules : [{ url: '', phrase: '' }];
    setRules(finalRules);
  };

  const confirmDelete = () => {
    if (deleteConfirm.index !== null) {
      performDelete(deleteConfirm.index);
    }
    setDeleteConfirm({ show: false, index: null });
  };

  const cancelDelete = () => {
    setDeleteConfirm({ show: false, index: null });
  };

  const handlePhraseBlur = (ruleIndex: number) => {
    const rule = rules[ruleIndex];
    const isLastRule = ruleIndex === rules.length - 1;
    const ruleHasContent = rule.url.trim() !== '' || rule.phrase.trim() !== '';

    // If this is the last rule and has content, add a new empty rule
    if (isLastRule && ruleHasContent) {
      setRules(prev => {
        const newRules = [...prev, { url: '', phrase: '' }];
        // Focus the new rule's URL input
        focusNewRuleUrl(newRules.length - 1);
        return newRules;
      });
    }
  };

  return (
    <div className='settings-tab'>
      <h2>Website Rules</h2>
      <p className='description'>
        Configure which websites require a phrase to access. Add the URL pattern
        and the phrase that must be typed.
      </p>

      <div className='rules-list'>
        {rules.map((rule, i) => (
          <div key={i} className='rule-item'>
            <div className='rule-inputs'>
              <input
                ref={el => {
                  urlInputRefs.current[i] = el;
                }}
                className='url-input'
                placeholder='URL pattern (e.g., google.com)'
                value={rule.url}
                onChange={e => {
                  const copy = [...rules];
                  copy[i].url = e.target.value;
                  setRules(copy);
                }}
              />
              <textarea
                className='phrase-input'
                placeholder='Phrase to type'
                value={rule.phrase}
                maxLength={150}
                rows={2}
                onChange={e => {
                  const copy = [...rules];
                  copy[i].phrase = e.target.value;
                  setRules(copy);
                }}
                onBlur={() => handlePhraseBlur(i)}
              />
            </div>
            <div className='rule-actions'>
              <button
                className='remove-btn'
                onClick={() => remove(i)}
                title='Remove rule'
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className='actions'>
        <button
          className='add-btn'
          onClick={addRule}
          title='Add another intention'
        >
          Add Intention
        </button>
        <button className='save-btn' onClick={update}>
          Save Changes
        </button>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirm.show && (
        <div
          className='confirmation-overlay'
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={cancelDelete}
        >
          <div
            className='confirmation-dialog'
            style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '8px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
              maxWidth: '400px',
              width: '90%',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3
              style={{
                margin: '0 0 16px 0',
                fontSize: '18px',
                fontWeight: '600',
              }}
            >
              Delete Rule
            </h3>
            <p
              style={{ margin: '0 0 24px 0', color: '#666', lineHeight: '1.5' }}
            >
              Are you sure you want to delete this rule? This action cannot be
              undone.
            </p>
            <div
              className='confirmation-actions'
              style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
              }}
            >
              <button
                className='cancel-btn'
                onClick={cancelDelete}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #ddd',
                  backgroundColor: 'white',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                className='confirm-btn'
                onClick={confirmDelete}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

const AboutTab = memo(() => {
  return (
    <div className='about-tab'>
      <h2>About Intentor</h2>
      <div className='about-content'>
        <p>
          Intentor is a browser extension that helps you pause and reflect
          before visiting certain websites. It creates a mindful moment where
          you must type a specific phrase to continue.
        </p>

        <h3>How it works</h3>
        <ol>
          <li>Configure websites and phrases in the Settings tab</li>
          <li>
            When you visit a configured website, Intentor shows an interstitial
            page
          </li>
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

        <div className='version-info'>
          <p>
            <strong>Version:</strong> 1.0.0
          </p>
          <p>
            <strong>Made with:</strong> React, TypeScript, WXT
          </p>
        </div>
      </div>
    </div>
  );
});

const Sidebar = memo(
  ({
    activeTab,
    setActiveTab,
  }: {
    activeTab: Tab;
    setActiveTab: (tab: Tab) => void;
  }) => (
    <div className='sidebar'>
      <div className='sidebar-header'>
        <h1>Intentor</h1>
      </div>
      <nav className='sidebar-nav'>
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
  )
);

const Options = () => {
  const [activeTab, setActiveTab] = useState<Tab>('settings');

  return (
    <div className='options-container'>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className='content'>
        {activeTab === 'settings' && <SettingsTab />}
        {activeTab === 'about' && <AboutTab />}
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<Options />);
