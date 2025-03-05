import 'dotenv/config'
import request from 'supertest'
import { nanoid } from 'nanoid'
import * as bookcarsTypes from ':bookcars-types'
import app from '../src/app'
import * as databaseHelper from '../src/common/databaseHelper'
import * as testHelper from './testHelper'
import * as env from '../src/config/env.config'
import Country from '../src/models/Country'
import Location from '../src/models/Location'

let COUNTRY_ID: string
let COUNTRY_NAME = nanoid()

//
// Connecting and initializing the database before running the test suite
//
beforeAll(async () => {
  testHelper.initializeLogger()

  const res = await databaseHelper.connect(env.DB_URI, false, false)
  expect(res).toBeTruthy()
  await testHelper.initialize()
})

//
// Closing and cleaning the database connection after running the test suite
//
afterAll(async () => {
  await testHelper.close()
  await databaseHelper.close()
})

//
// Unit tests
//

describe('POST /api/validate-country', () => {
  it('should validate a country', async () => {
    const token = await testHelper.signinAsAdmin()

    // test success (country found)
    const language = testHelper.LANGUAGE
    const name = nanoid()
    const country = new Country({ name })
    await country.save()
    const payload: bookcarsTypes.ValidateCountryPayload = {
      language,
      name,
    }
    let res = await request(app)
      .post('/api/validate-country')
      .set(env.X_ACCESS_TOKEN, token)
      .send(payload)
    expect(res.statusCode).toBe(204)

    // test success (country not found)
    payload.name = nanoid()
    res = await request(app)
      .post('/api/validate-country')
      .set(env.X_ACCESS_TOKEN, token)
      .send(payload)
    expect(res.statusCode).toBe(200)
    await country.deleteOne()

    // test failure (no payload)
    res = await request(app)
      .post('/api/validate-country')
      .set(env.X_ACCESS_TOKEN, token)
    expect(res.statusCode).toBe(400)

    await testHelper.signout(token)
  })
})

describe('POST /api/create-country', () => {
  it('should create a country', async () => {
    const token = await testHelper.signinAsAdmin()

    // test success
    let res = await request(app)
      .post('/api/create-country')
      .set(env.X_ACCESS_TOKEN, token)
      .send({ name: COUNTRY_NAME })
    expect(res.statusCode).toBe(200)
    expect(res.body?.name).toBe(COUNTRY_NAME)
    COUNTRY_ID = res.body?._id

    // test failure (no payload)
    res = await request(app)
      .post('/api/create-country')
      .set(env.X_ACCESS_TOKEN, token)
    expect(res.statusCode).toBe(400)

    await testHelper.signout(token)
  })
})

describe('PUT /api/update-country/:id', () => {
  it('should update a country', async () => {
    const token = await testHelper.signinAsAdmin()

    // test success
    COUNTRY_NAME = nanoid()
    let res = await request(app)
      .put(`/api/update-country/${COUNTRY_ID}`)
      .set(env.X_ACCESS_TOKEN, token)
      .send({ name: COUNTRY_NAME })
    expect(res.statusCode).toBe(200)
    expect(res.body?.name).toBe(COUNTRY_NAME)

    // test success (country not found)
    res = await request(app)
      .put(`/api/update-country/${testHelper.GetRandromObjectIdAsString()}`)
      .set(env.X_ACCESS_TOKEN, token)
      .send({ name: COUNTRY_NAME })
    expect(res.statusCode).toBe(204)

    // test failure (no payload)
    res = await request(app)
      .put(`/api/update-country/${COUNTRY_ID}`)
      .set(env.X_ACCESS_TOKEN, token)
    expect(res.statusCode).toBe(400)

    await testHelper.signout(token)
  })
})

describe('GET /api/country/:id/:language', () => {
  it('should get a country', async () => {
    const token = await testHelper.signinAsAdmin()
    const language = 'en'

    // test success
    let res = await request(app)
      .get(`/api/country/${COUNTRY_ID}/${language}`)
      .set(env.X_ACCESS_TOKEN, token)
    expect(res.statusCode).toBe(200)
    expect(res.body?.name).toBe(COUNTRY_NAME)

    // test success (country not found)
    res = await request(app)
      .get(`/api/country/${testHelper.GetRandromObjectIdAsString()}/${language}`)
      .set(env.X_ACCESS_TOKEN, token)
    expect(res.statusCode).toBe(204)

    // test failure (wrong language)
    res = await request(app)
      .get(`/api/country/${COUNTRY_ID}/zh`)
      .set(env.X_ACCESS_TOKEN, token)
    expect(res.statusCode).toBe(400)

    await testHelper.signout(token)
  })
})

describe('GET /api/countries/:page/:size/:language', () => {
  it('should get countries', async () => {
    const token = await testHelper.signinAsAdmin()
    const language = 'en'

    // test success
    let res = await request(app)
      .get(`/api/countries/${testHelper.PAGE}/${testHelper.SIZE}/${language}?s=${COUNTRY_NAME}`)
      .set(env.X_ACCESS_TOKEN, token)
    expect(res.statusCode).toBe(200)
    expect(res.body.length).toBe(1)

    // test failure (wrong page)
    res = await request(app)
      .get(`/api/countries/unknown/${testHelper.SIZE}/${language}`)
      .set(env.X_ACCESS_TOKEN, token)
    expect(res.statusCode).toBe(400)

    await testHelper.signout(token)
  })
})

describe('GET /api/check-country/:id', () => {
  it('should check a country', async () => {
    const token = await testHelper.signinAsAdmin()

    // test success (country related to a location)
    const locationId = await testHelper.createLocation('test-en', 'test-fr', COUNTRY_ID)
    let res = await request(app)
      .get(`/api/check-country/${COUNTRY_ID}`)
      .set(env.X_ACCESS_TOKEN, token)
    expect(res.statusCode).toBe(200)

    // test success (country not related to a location)
    await Location.deleteOne({ _id: locationId })
    res = await request(app)
      .get(`/api/check-country/${COUNTRY_ID}`)
      .set(env.X_ACCESS_TOKEN, token)
    expect(res.statusCode).toBe(204)

    // test failure (wrong country id)
    res = await request(app)
      .get(`/api/check-country/${nanoid()}`)
      .set(env.X_ACCESS_TOKEN, token)
    expect(res.statusCode).toBe(400)

    await testHelper.signout(token)
  })
})

describe('GET /api/countries-with-locations/:language/:imageRequired/:minLocations', () => {
  it('should get a countries with location', async () => {
    const language = 'en'

    const location = new Location({ country: COUNTRY_ID, name: 'Location 1' })
    await location.save()

    // test success (image not required)
    let res = await request(app)
      .get(`/api/countries-with-locations/${language}/false/1`)
    expect(res.statusCode).toBe(200)
    expect(res.body.find((country: bookcarsTypes.Country) => country._id === COUNTRY_ID)).toBeDefined()

    // test success (image required)
    res = await request(app)
      .get(`/api/countries-with-locations/${language}/true/1`)
    expect(res.statusCode).toBe(200)
    expect(res.body.find((country: bookcarsTypes.Country) => country._id === COUNTRY_ID)).toBeUndefined()

    await location.deleteOne()

    // test success (no related locations)
    res = await request(app)
      .get(`/api/countries-with-locations/${language}/false/1`)
    expect(res.statusCode).toBe(200)
    expect(res.body.find((country: bookcarsTypes.Country) => country._id === COUNTRY_ID)).toBeUndefined()

    // test failure (lost db connection)
    await databaseHelper.close()
    res = await request(app)
      .get(`/api/countries-with-locations/${language}/false/1`)
    expect(res.statusCode).toBe(400)
    const connRes = await databaseHelper.connect(env.DB_URI, false, false)
    expect(connRes).toBeTruthy()
  })
})

describe('GET /api/country-id/:name/:language', () => {
  it('should get a country id', async () => {
    const token = await testHelper.signinAsAdmin()
    const language = 'en'

    // test success
    let res = await request(app)
      .get(`/api/country-id/${COUNTRY_NAME}/${language}`)
      .set(env.X_ACCESS_TOKEN, token)
    expect(res.statusCode).toBe(200)
    expect(res.body).toBe(COUNTRY_ID)

    // test success (not found)
    res = await request(app)
      .get(`/api/country-id/unknown/${language}`)
      .set(env.X_ACCESS_TOKEN, token)
    expect(res.statusCode).toBe(204)

    // test failure (wrong language)
    res = await request(app)
      .get('/api/country-id/unknown/english')
      .set(env.X_ACCESS_TOKEN, token)
    expect(res.statusCode).toBe(400)

    await testHelper.signout(token)
  })
})

describe('DELETE /api/delete-country/:id', () => {
  it('should delete a country', async () => {
    const token = await testHelper.signinAsAdmin()

    // test success
    let country = await Country.findById(COUNTRY_ID)
    expect(country).not.toBeNull()
    let res = await request(app)
      .delete(`/api/delete-country/${COUNTRY_ID}`)
      .set(env.X_ACCESS_TOKEN, token)
    expect(res.statusCode).toBe(200)
    country = await Country.findById(COUNTRY_ID)
    expect(country).toBeNull()

    // test success (country not found)
    res = await request(app)
      .delete(`/api/delete-country/${COUNTRY_ID}`)
      .set(env.X_ACCESS_TOKEN, token)
    expect(res.statusCode).toBe(204)

    // test failure (wrong country id)
    res = await request(app)
      .delete('/api/delete-country/0')
      .set(env.X_ACCESS_TOKEN, token)
    expect(res.statusCode).toBe(400)

    await testHelper.signout(token)
  })
})
