const app = require('../src/app')
require('dotenv')

describe('App', () => {
  it('GET / responds with 200 containing "Hello, world!"', () => {
    return supertest(app)
      .get('/')
      .set('Authorization',`bearer ${process.env.API_TOKEN}`)
      .expect(200, 'Hello, world!')
  })
})