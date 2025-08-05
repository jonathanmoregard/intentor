import { debounce } from 'lodash-es';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  type Intention,
  type IntentionScope,
  type UnparsedIntention,
  canParseIntention,
  intentionToUnparsed,
  isEmpty,
  isParsedIntention,
  isUnparsedIntention,
  parseUrlToScope,
  unparsedToIntention,
} from '../../components/intention';
import { storage } from '../../components/storage';

type Tab = 'settings' | 'about';

// Union type for heterogeneous intentions
type IntentionItem = Intention;

// Helper function to create an empty IntentionScope
function createEmptyIntentionScope(): IntentionScope {
  return {
    domain: '',
    publicSuffix: '',
    subdomain: null,
    path: '',
    urlLength: 0,
    hasLanguageSuffix: false,
    hasLanguageSubdomain: false,
    hasLanguagePathStart: false,
    originalUrl: '',
  };
}

// Helper function to convert IntentionScope to display string
function viewScope(scope: IntentionScope): string {
  if (!scope.domain) return '';
  // tldts uses domain="registrableDomain" which includes the public suffix
  const hostname = scope.subdomain
    ? `${scope.subdomain}.${scope.domain}`
    : `${scope.domain}`;
  return hostname + scope.path;
}

// Helper function to convert user input string to IntentionScope
function stringToScope(input: string): IntentionScope {
  const trimmed = input.trim();
  if (!trimmed) return createEmptyIntentionScope();

  const parsed = parseUrlToScope(trimmed);
  return parsed || createEmptyIntentionScope();
}

const SettingsTab = memo(
  ({ setActiveTab }: { setActiveTab: (tab: Tab) => void }) => {
    const [intentions, setIntentions] = useState<IntentionItem[]>([]);
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
    const [showMoreOptions, setShowMoreOptions] = useState(false);

    const [blurredInputs, setBlurredInputs] = useState<Set<number>>(new Set());
    const [loadedIntentionIndices, setLoadedIntentionIndices] = useState<
      Set<number>
    >(new Set());
    const urlInputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const moreOptionsRef = useRef<HTMLDivElement>(null);

    const isIntentionEmpty = useCallback((intention: IntentionItem) => {
      return isEmpty(intention);
    }, []);

    const focusNewIntentionUrl = useCallback((intentionIndex: number) => {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        urlInputRefs.current[intentionIndex]?.focus();
      }, 50);
    }, []);

    const saveIntentions = useCallback(
      async (intentionsToSave: IntentionItem[]) => {
        try {
          // Save all intentions (including empty ones) as heterogeneous data
          await storage.set({ intentions: intentionsToSave });

          // Check for unparseable intentions for warning dialog
          const unparseable: UnparsedIntention[] = [];

          for (const item of intentionsToSave) {
            if (
              isUnparsedIntention(item) &&
              !isEmpty(item) &&
              !canParseIntention(item)
            ) {
              unparseable.push(item);
            }
          }
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
      []
    );

    // Debounced save function
    const debouncedSave = useCallback(
      debounce(async (intentionsToSave: IntentionItem[]) => {
        try {
          await saveIntentions(intentionsToSave);
        } catch (error) {
          console.error('Failed to auto-save intentions:', error);
          // Don't show toast for auto-save failures, only log them
        }
      }, 1000),
      [isIntentionEmpty]
    );

    useEffect(() => {
      storage.get().then(data => {
        const initialIntentions =
          data.intentions.length > 0
            ? data.intentions
            : [{ url: '', phrase: '' }];
        setIntentions(initialIntentions);

        // Track which intentions were loaded from storage (not newly created)
        const loadedIndices = new Set<number>();
        initialIntentions.forEach((intention, index) => {
          if (!isEmpty(intention)) {
            loadedIndices.add(index);
          }
        });
        setLoadedIntentionIndices(loadedIndices);

        // Check if we should show examples based on initial load
        const nonEmptyIntentions = initialIntentions.filter(
          intention => !isEmpty(intention)
        );
        setShowExamples(nonEmptyIntentions.length < 2);

        // Auto-focus first empty unparseable intention URL
        const firstEmptyIndex = initialIntentions.findIndex(
          (intention: IntentionItem) => {
            return isUnparsedIntention(intention) && isEmpty(intention);
          }
        );
        if (firstEmptyIndex !== -1) {
          setTimeout(() => {
            urlInputRefs.current[firstEmptyIndex]?.focus();
          }, 100);
        }
      });
    }, []);

    // Debounced auto-save whenever intentions change (except during initial load)
    useEffect(() => {
      // Don't save during initial load (when intentions are empty and we're about to load from storage)
      if (intentions.length > 0) {
        debouncedSave(intentions);
      }
    }, [intentions, debouncedSave]);

    // Close more options dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          moreOptionsRef.current &&
          !moreOptionsRef.current.contains(event.target as Node)
        ) {
          setShowMoreOptions(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);

    const update = async () => {
      await saveIntentions(intentions);

      // Show success toast only when manually saving
      const cleanIntentions = intentions.filter(
        intention => !isEmpty(intention)
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
      // Newly created intentions are not marked as loaded
    };

    const addExampleIntention = (example: { url: string; phrase: string }) => {
      setIntentions(prev => {
        const newIntention: UnparsedIntention = {
          url: example.url,
          phrase: example.phrase,
        };
        const newIntentions = [...prev, newIntention];
        // Focus the new intention's URL input
        focusNewIntentionUrl(newIntentions.length - 1);
        return newIntentions;
      });
      // Example intentions are not marked as loaded
    };

    const remove = (index: number) => {
      const intention = intentions[index];
      const hasContent = !isEmpty(intention);

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

      // Update loaded indices after deletion
      setLoadedIntentionIndices(prev => {
        const newLoadedIndices = new Set<number>();
        prev.forEach(loadedIndex => {
          if (loadedIndex < index) {
            // Keep indices before the deleted one unchanged
            newLoadedIndices.add(loadedIndex);
          } else if (loadedIndex > index) {
            // Shift indices after the deleted one down by 1
            newLoadedIndices.add(loadedIndex - 1);
          }
          // Skip the deleted index
        });
        return newLoadedIndices;
      });
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
      // Remove auto-adding on blur since we handle it in keydown
      // This was causing conflicts with tab navigation
    };

    const handlePhraseKeyDown = (
      e: React.KeyboardEvent,
      intentionIndex: number
    ) => {
      // Only add new intention on unmodified Tab key (not shift+tab)
      if (
        e.key === 'Tab' &&
        !e.ctrlKey &&
        !e.altKey &&
        !e.metaKey &&
        !e.shiftKey
      ) {
        const intention = intentions[intentionIndex];
        const isLastIntention = intentionIndex === intentions.length - 1;
        const intentionHasContent = !isEmpty(intention);

        if (isLastIntention && intentionHasContent) {
          e.preventDefault();
          setIntentions(prev => {
            const newIntentions = [...prev, { url: '', phrase: '' }];
            // Focus the new intention's URL input
            focusNewIntentionUrl(newIntentions.length - 1);
            return newIntentions;
          });
        }
      }
    };

    const exampleIntentions = [
      {
        url: 'reddit.com',
        phrase: 'I want to access something specific',
      },
      {
        url: 'facebook.com',
        phrase: 'I want to use events/chat, and have set a 5 minute timer',
      },
      {
        url: 'gmail.com',
        phrase: 'I am not checking my email out of habit/boredom',
      },
    ];

    const exportIntentions = () => {
      try {
        const cleanIntentions = intentions.filter(
          intention => !isEmpty(intention)
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

        // Convert to UnparsedIntention format for export
        const unparsedIntentions: UnparsedIntention[] = cleanIntentions.map(
          intention => intentionToUnparsed(intention)
        );

        const dataStr = JSON.stringify(unparsedIntentions, null, 2);
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
              const importedUnparsedIntentions = JSON.parse(
                e.target?.result as string
              );
              if (Array.isArray(importedUnparsedIntentions)) {
                // Convert to heterogeneous list
                const importedIntentions: IntentionItem[] =
                  importedUnparsedIntentions.map((item: any) => {
                    // Try to parse each intention
                    const parsed = unparsedToIntention(item);
                    return parsed || item; // Return parsed if successful, otherwise keep as unparsed
                  });

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
          Set intentions for websites, to help yourself use them wisely. Later,
          when you navigate to these sites, you will get a chance to reaffirm
          your intention before entering.
        </p>

        <div className='intentions-list'>
          {intentions.map((intention, i) => (
            <div key={i} className='intention-item'>
              <div className='intention-inputs'>
                <div className='input-group'>
                  <input
                    ref={el => {
                      urlInputRefs.current[i] = el;
                    }}
                    className={`url-input ${
                      isUnparsedIntention(intention) &&
                      !isEmpty(intention) &&
                      !canParseIntention(intention) &&
                      intention.url.trim() !== '' &&
                      (loadedIntentionIndices.has(i) || blurredInputs.has(i))
                        ? 'error'
                        : ''
                    } ${isParsedIntention(intention) ? 'parsed' : ''}`}
                    placeholder=' '
                    value={
                      isParsedIntention(intention)
                        ? viewScope(intention.scope)
                        : intention.url
                    }
                    onChange={e => {
                      // Reset blurred state when user starts typing
                      setBlurredInputs(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(i);
                        return newSet;
                      });

                      const copy = [...intentions];
                      // Always treat as unparsed during editing
                      copy[i] = {
                        url: e.target.value,
                        phrase: copy[i].phrase,
                      } as UnparsedIntention;
                      setIntentions(copy);
                    }}
                    onBlur={() => {
                      // Mark this input as blurred
                      setBlurredInputs(prev => new Set([...prev, i]));

                      // Try to parse on blur
                      if (
                        isUnparsedIntention(intention) &&
                        intention.url.trim() !== ''
                      ) {
                        const parsed = unparsedToIntention(intention);
                        if (parsed) {
                          const copy = [...intentions];
                          copy[i] = parsed;
                          setIntentions(copy);
                        }
                      }
                    }}
                  />
                  <label className='input-label'>Website URL</label>
                </div>
                <div className='input-group'>
                  <textarea
                    className='phrase-input'
                    placeholder=' '
                    value={intention.phrase}
                    maxLength={150}
                    rows={2}
                    onChange={e => {
                      const copy = [...intentions];
                      copy[i].phrase = e.target.value;
                      setIntentions(copy);
                    }}
                    onBlur={() => handlePhraseBlur(i)}
                    onKeyDown={e => handlePhraseKeyDown(e, i)}
                  />
                  <label className='input-label'>Intention Phrase</label>
                </div>
              </div>
              <button
                className='remove-btn'
                onClick={() => remove(i)}
                title='Remove intention'
                tabIndex={-1}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <div className='actions'>
          <button
            className='add-btn'
            onClick={addIntention}
            title='Add another intention'
          >
            Add Site
          </button>
          <button className='save-btn' onClick={update}>
            Save
          </button>
          <div className='more-options' ref={moreOptionsRef}>
            <button
              className='more-options-btn'
              onClick={() => setShowMoreOptions(!showMoreOptions)}
              title='More options'
            >
              ⋯
            </button>
            <div
              className={`more-options-dropdown ${
                showMoreOptions ? 'show' : ''
              }`}
            >
              <button className='dropdown-item' onClick={exportIntentions}>
                Export Intentions
              </button>
              <button className='dropdown-item' onClick={importIntentions}>
                Import Intentions
              </button>
            </div>
          </div>
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
          <div className='confirmation-overlay' onClick={cancelDelete}>
            <div
              className='confirmation-dialog'
              onClick={e => e.stopPropagation()}
            >
              <h3>Delete Intention</h3>
              <p>
                Are you sure you want to delete this intention? This action
                cannot be undone.
              </p>
              <div className='confirmation-actions'>
                <button className='cancel-btn' onClick={cancelDelete}>
                  Cancel
                </button>
                <button className='confirm-btn' onClick={confirmDelete}>
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
              backgroundColor: toast.type === 'success' ? '#9E8E33' : '#FE621D',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              animation: 'slideIn 0.3s ease-out',
            }}
          >
            {toast.message}
          </div>
        )}
      </div>
    );
  }
);

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
    onTabChange,
  }: {
    activeTab: Tab;
    setActiveTab: (tab: Tab) => void;
    onTabChange: (newTab: Tab, setActiveTab: (tab: Tab) => void) => void;
  }) => (
    <div className='sidebar'>
      <div className='sidebar-header'>
        <div className='logo'></div>
        <h1>Intender</h1>
      </div>
      <nav className='sidebar-nav'>
        <button
          className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => onTabChange('settings', setActiveTab)}
        >
          Settings
        </button>
        <button
          className={`tab-btn ${activeTab === 'about' ? 'active' : ''}`}
          onClick={() => onTabChange('about', setActiveTab)}
        >
          About
        </button>
      </nav>
    </div>
  )
);

const Options = () => {
  const [activeTab, setActiveTab] = useState<Tab>('settings');

  const handleTabChange = (newTab: Tab, setActiveTab: (tab: Tab) => void) => {
    // For now, just allow the tab change
    // The warning logic will be handled in the SettingsTab component
    setActiveTab(newTab);
  };

  return (
    <div className='options-container'>
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onTabChange={handleTabChange}
      />

      <div className='content'>
        {activeTab === 'settings' && (
          <SettingsTab setActiveTab={setActiveTab} />
        )}
        {activeTab === 'about' && <AboutTab />}
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<Options />);
