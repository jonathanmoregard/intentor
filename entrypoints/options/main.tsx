import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { storage, Rule } from '../../components/storage'

const Options = () => {
  const [rules, setRules] = useState<Rule[]>([])

  useEffect(() => {
    storage.get().then(data => setRules(data.rules))
  }, [])

  const update = () => storage.set({ rules })

  const add = () => {
    setRules([...rules, { url: '', prompt: '', passphrase: '' }])
  }

  return (
    <div>
      {rules.map((r, i) => (
        <div key={i}>
          <input
            placeholder="URL"
            value={r.url}
            onChange={e => {
              const copy = [...rules]; copy[i].url = e.target.value; setRules(copy)
            }}
          />
          <input
            placeholder="Prompt"
            value={r.prompt}
            onChange={e => {
              const copy = [...rules]; copy[i].prompt = e.target.value; setRules(copy)
            }}
          />
          <input
            placeholder="Passphrase"
            value={r.passphrase}
            onChange={e => {
              const copy = [...rules]; copy[i].passphrase = e.target.value; setRules(copy)
            }}
          />
        </div>
      ))}
      <button onClick={add}>Add</button>
      <button onClick={update}>Save</button>
    </div>
  )
}

const root = createRoot(document.getElementById('root')!)
root.render(<Options />)
