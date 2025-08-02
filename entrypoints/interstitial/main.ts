import { storage } from '../../components/storage'

const query = new URLSearchParams(window.location.search)
const target = query.get('target')

const inputEl = document.getElementById('phrase') as HTMLInputElement
const buttonEl = document.getElementById('go') as HTMLButtonElement

storage.get().then(({ rules }) => {
  const match = rules.find(r => target?.includes(r.url))
  if (match) {
    buttonEl.onclick = () => {
      if (inputEl.value === match.phrase) {
        window.location.href = target!
      } else {
        alert('Wrong phrase')
      }
    }
  }
})
