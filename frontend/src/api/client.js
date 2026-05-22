import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000',
})

export function uploadPart(file) {
  const form = new FormData()
  form.append('file', file)
  return api.post('/parts/upload', form)
}

export function listParts() {
  return api.get('/parts/')
}

export function getPart(id) {
  return api.get(`/parts/${id}`)
}
