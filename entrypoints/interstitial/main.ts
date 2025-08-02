import { storage } from '../../components/storage'

const query = new URLSearchParams(window.location.search)
const target = query.get('target')

const promptEl = document.getElementById('prompt') as HTMLElement
const inputEl = document.getElementById('pass') as HTMLInputElement
const buttonEl = document.getElementById('go') as HTMLButtonElement

storage.get().then(({ rules }) => {
  const match = rules.find(r => target?.includes(r.url))
  if (match) {
    promptEl.textContent = match.prompt
    buttonEl.onclick = () => {
      if (inputEl.value === match.passphrase) {
        window.location.href = target!
      } else {
        alert('Wrong passphrase')
      }
    }
  }
})
