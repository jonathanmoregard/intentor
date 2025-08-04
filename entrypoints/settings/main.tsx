import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Intention, storage } from '../../components/storage';

type Tab = 'settings' | 'about';

const SettingsTab = memo(() => {
  const [intentions, setIntentions] = useState<Intention[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    index: number | null;
  }>({
    show: false,
    index: null,
  });
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    show: false,
    message: '',
    type: 'success',
  });
  const [showExamples, setShowExamples] = useState(false);
  const urlInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const isIntentionEmpty = useCallback((intention: Intention) => {
    return intention.url.trim() === '';
  }, []);

  const focusNewIntentionUrl = useCallback((intentionIndex: number) => {
    // Small delay to ensure DOM is updated
    setTimeout(() => {
      urlInputRefs.current[intentionIndex]?.focus();
    }, 50);
  }, []);

  const saveIntentions = useCallback(
    async (intentionsToSave: Intention[]) => {
      try {
        // Remove empty intentions before saving
        const cleanIntentions = intentionsToSave.filter(
          intention => !isIntentionEmpty(intention)
        );
        await storage.set({ intentions: cleanIntentions });
      } catch (error) {
        console.error('Failed to save intentions:', error);
        setToast({
          show: true,
          message: 'Failed to save intentions. Please try again.',
          type: 'error',
        });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
      }
    },
    [isIntentionEmpty]
  );

  useEffect(() => {
    storage.get().then(data => {
      const initialIntentions =
        data.intentions.length > 0
          ? data.intentions
          : [{ url: '', phrase: '' }];
      setIntentions(initialIntentions);

      // Check if we should show examples based on initial load
      const nonEmptyIntentions = initialIntentions.filter(
        intention => !isIntentionEmpty(intention)
      );
      setShowExamples(nonEmptyIntentions.length < 2);
    });
  }, []);

  // Save intentions whenever they change (except during initial load)
  useEffect(() => {
    // Don't save during initial load (when intentions are empty and we're about to load from storage)
    if (intentions.length > 0) {
      saveIntentions(intentions);
    }
  }, [intentions, saveIntentions]);

  const update = async () => {
    await saveIntentions(intentions);

    // Show success toast only when manually saving
    const cleanIntentions = intentions.filter(
      intention => !isIntentionEmpty(intention)
    );
    setToast({
      show: true,
      message: `Successfully saved ${cleanIntentions.length} intention(s)`,
      type: 'success',
    });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);

    // Ensure we always have at least one intention (empty if needed)
    setIntentions(
      cleanIntentions.length > 0 ? cleanIntentions : [{ url: '', phrase: '' }]
    );
  };

  const addIntention = () => {
    setIntentions(prev => {
      const newIntentions = [...prev, { url: '', phrase: '' }];
      // Focus the new intention's URL input
      focusNewIntentionUrl(newIntentions.length - 1);
      return newIntentions;
    });
  };

  const addExampleIntention = (example: Intention) => {
    setIntentions(prev => {
      const newIntentions = [...prev, example];
      // Focus the new intention's URL input
      focusNewIntentionUrl(newIntentions.length - 1);
      return newIntentions;
    });
  };

  const remove = (index: number) => {
    const intention = intentions[index];
    const hasContent =
      intention.url.trim() !== '' || intention.phrase.trim() !== '';

    // Show confirmation dialog for intentions with content
    if (hasContent) {
      setDeleteConfirm({ show: true, index });
      return;
    }

    // Delete empty intentions immediately
    performDelete(index);
  };

  const performDelete = (index: number) => {
    const newIntentions = intentions.filter((_, i) => i !== index);
    // Ensure we always have at least one intention (empty if needed)
    const finalIntentions =
      newIntentions.length > 0 ? newIntentions : [{ url: '', phrase: '' }];
    setIntentions(finalIntentions);
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

  const handlePhraseBlur = (intentionIndex: number) => {
    const intention = intentions[intentionIndex];
    const isLastIntention = intentionIndex === intentions.length - 1;
    const intentionHasContent =
      intention.url.trim() !== '' || intention.phrase.trim() !== '';

    // If this is the last intention and has content, add a new empty intention
    if (isLastIntention && intentionHasContent) {
      setIntentions(prev => {
        const newIntentions = [...prev, { url: '', phrase: '' }];
        // Focus the new intention's URL input
        focusNewIntentionUrl(newIntentions.length - 1);
        return newIntentions;
      });
    }
  };

  const exampleIntentions = [
    {
      url: 'gmail.com',
      phrase: 'I am not checking my email out of habit/boredom',
    },
    {
      url: 'reddit.com',
      phrase: 'I am looking up something I need, I am not rabbit holeing',
    },
    {
      url: 'facebook.com',
      phrase:
        'I am entering facebook to check events, not doomscroll newsfeeds',
    },
  ];

  const exportIntentions = () => {
    try {
      const cleanIntentions = intentions.filter(
        intention => !isIntentionEmpty(intention)
      );

      if (cleanIntentions.length === 0) {
        setToast({
          show: true,
          message: 'No intentions to export. Add some intentions first.',
          type: 'error',
        });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
        return;
      }

      const dataStr = JSON.stringify(cleanIntentions, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'intentions.json';
      link.click();
      URL.revokeObjectURL(url);

      setToast({
        show: true,
        message: `Successfully exported ${cleanIntentions.length} intention(s)`,
        type: 'success',
      });
      setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
    } catch (error) {
      console.error('Export failed:', error);
      setToast({
        show: true,
        message: 'Failed to export intentions. Please try again.',
        type: 'error',
      });
      setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
    }
  };

  const importIntentions = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = e => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = e => {
          try {
            const importedIntentions = JSON.parse(e.target?.result as string);
            if (Array.isArray(importedIntentions)) {
              setIntentions(importedIntentions);
              setToast({
                show: true,
                message: `Successfully imported ${importedIntentions.length} intention(s)`,
                type: 'success',
              });
              setTimeout(
                () => setToast(prev => ({ ...prev, show: false })),
                3000
              );
            } else {
              setToast({
                show: true,
                message:
                  'Invalid file format. Please select a valid intentions file.',
                type: 'error',
              });
              setTimeout(
                () => setToast(prev => ({ ...prev, show: false })),
                3000
              );
            }
          } catch (error) {
            console.error('Failed to parse intentions file:', error);
            setToast({
              show: true,
              message:
                "Ooops! Couldn't understand the file you picked for import. Are you sure it's the right one?",
              type: 'error',
            });
            setTimeout(
              () => setToast(prev => ({ ...prev, show: false })),
              3000
            );
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <div className='settings-tab'>
      <h2>Website Intentions</h2>
      <p className='description'>
        Set up websites where you'd like to pause and reflect before visiting.
        Add the URL pattern and a phrase that helps you remember your intention.
      </p>

      <div className='intentions-list'>
        {intentions.map((intention, i) => (
          <div key={i} className='intention-item'>
            <div className='intention-inputs'>
              <input
                ref={el => {
                  urlInputRefs.current[i] = el;
                }}
                className='url-input'
                placeholder='URL pattern (e.g., google.com)'
                value={intention.url}
                onChange={e => {
                  const copy = [...intentions];
                  copy[i].url = e.target.value;
                  setIntentions(copy);
                }}
              />
              <textarea
                className='phrase-input'
                placeholder='Phrase to type'
                value={intention.phrase}
                maxLength={150}
                rows={2}
                onChange={e => {
                  const copy = [...intentions];
                  copy[i].phrase = e.target.value;
                  setIntentions(copy);
                }}
                onBlur={() => handlePhraseBlur(i)}
              />
            </div>
            <div className='intention-actions'>
              <button
                className='remove-btn'
                onClick={() => remove(i)}
                title='Remove intention'
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
          onClick={addIntention}
          title='Add another intention'
        >
          Add Intention
        </button>
        <button className='save-btn' onClick={update}>
          Save Changes
        </button>
        <button className='export-btn' onClick={exportIntentions}>
          Export
        </button>
        <button className='import-btn' onClick={importIntentions}>
          Import
        </button>
      </div>

      {/* Example Intentions */}
      {showExamples && (
        <div className='examples-section'>
          <h3>Example Intentions</h3>
          <p className='examples-description'>
            Quick-add these examples to get started:
          </p>
          <div className='examples-list'>
            {exampleIntentions.map((example, i) => (
              <div key={`example-${i}`} className='example-item'>
                <div className='example-content'>
                  <div className='example-url'>{example.url}</div>
                  <div className='example-phrase'>{example.phrase}</div>
                </div>
                <button
                  className='quick-add-btn'
                  onClick={() => addExampleIntention(example)}
                  title={`Add ${example.url} intention`}
                >
                  +
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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

      {/* Toast Notification */}
      {toast.show && (
        <div
          className={`toast ${toast.type}`}
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '6px',
            color: 'white',
            fontSize: '14px',
            fontWeight: '500',
            zIndex: 2000,
            backgroundColor: toast.type === 'success' ? '#28a745' : '#dc3545',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            animation: 'slideIn 0.3s ease-out',
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
});

const AboutTab = memo(() => {
  return (
    <div className='about-tab'>
      <h2>About Intender</h2>
      <div className='about-content'>
        <p>
          Intender is a browser extension that helps you pause and reflect
          before visiting certain websites. It gives you an opportunity to
          reflect and write down an intention before you enter the page.
        </p>

        <h3>How it works</h3>
        <ol>
          <li>Configure websites and phrases in the Settings tab</li>
          <li>
            When you visit a configured website, Intender shows a pause page
            page
          </li>
          <li>Type the exact phrase to continue to the website</li>
          <li>This creates a moment of intentionality before browsing</li>
        </ol>

        <h3>Features</h3>
        <ul>
          <li>Custom phrases for different websites</li>
          <li>Beautiful, mindful pause page design</li>
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
        <h1>Intender</h1>
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
