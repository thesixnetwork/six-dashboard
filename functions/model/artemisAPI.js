
const axios = require('axios')
class ArtemisAPI {
  constructor (host, app, token) {
    this.host = host
    this.app = app
    this.token = token
    this.header = {
      'Content-Type': 'application/json',
      'WEB2PY-USER-TOKEN': token
    }
  }

  apiUrl () {
    return this.host + '/' + this.app
  }

  createIndividualCustomer (data) {
    let apiCall = axios.create({
      baseURL: this.apiUrl(),
      headers: this.header
    })
    return apiCall.post('/default/individual_risk', data)
  }

  updateIndividualCustomer (data) {
    let apiCall = axios.create({
      baseURL: this.apiUrl(),
      headers: this.header
    })
    return apiCall.put('/api/individual_customer', data)
  }

  getIndividualCustomer (data) {
    let apiCall = axios.create({
      baseURL: this.apiUrl(),
      headers: this.header
    })
    return apiCall.get('/api/individual_customer', {params: data})
  }

  // data is formdata type
  createIndividualCustomerDoc (imageUrl, data) {
    let headers = data.getHeaders()
    headers['WEB2PY-USER-TOKEN'] = this.token
    let apiCall = axios.create({
      baseURL: this.apiUrl(),
      headers: headers

    })
    return axios.get(imageUrl, { responseType: 'stream' }).then(response => {
      // data.append('file', fs.createReadStream('golf.jpg'), 'golf.jpg')
      data.append('file', response.data, 'golf.jpg')
      return apiCall.post('/api/individual_doc', data)
    })
  }

  checkIndividualFaceCustomer (data) {
    let apiCall = axios.create({
      baseURL: this.apiUrl(),
      headers: this.header
    })
    return apiCall.post('/api/individual_face', data)
  }

  createIndividualCustomerReport (data) {
    let apiCall = axios.create({
      baseURL: this.apiUrl(),
      headers: this.header
    })
    return apiCall.post('/api/individual_customer_report', data)
  }

  checkCustomApproveStatus (data) {
    let apiCall = axios.create({
      baseURL: this.apiUrl(),
      headers: this.header
    })
    return apiCall.get('/default/check_status.json', {params: data})
  }
}
module.exports = ArtemisAPI
