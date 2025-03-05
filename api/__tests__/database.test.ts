import 'dotenv/config'
import * as env from '../src/config/env.config'
import * as databaseHelper from '../src/common/databaseHelper'
import * as testHelper from './testHelper'
import Location from '../src/models/Location'
import Country from '../src/models/Country'
import ParkingSpot from '../src/models/ParkingSpot'

beforeAll(() => {
  // testHelper.initializeLogger()
})

describe('Test database connection', () => {
  it('should connect to database', async () => {
    // test success (connected)
    const res = await databaseHelper.connect(env.DB_URI, false, false)
    expect(res).toBeTruthy()
    await databaseHelper.close()
  })
})

describe('Test database connection failure', () => {
  it('should fail connecting to database', async () => {
    // test failure (wrong uri)
    const res = await databaseHelper.connect('wrong-uri', true, false)
    expect(res).toBeFalsy()
  })
})

describe('Test database initialization', () => {
  it('should initialize database', async () => {
    let res = await databaseHelper.connect(env.DB_URI, false, false)
    expect(res).toBeTruthy()

    const l1 = new Location({ country: testHelper.GetRandromObjectIdAsString(), name: 'location' })
    await l1.save()
    const l2 = new Location({ country: testHelper.GetRandromObjectIdAsString(), name: 'localização' })
    await l2.save()

    const c1 = new Country({ name: 'country' })
    await c1.save()
    const c2 = new Country({ name: 'país' })
    await c2.save()

    const ps1 = new ParkingSpot({ latitude: 1, longitude: 1, name: 'parking' })
    await ps1.save()
    const ps2 = new ParkingSpot({ latitude: 1, longitude: 1, name: 'estacionamento' })
    await ps2.save()

    // test success (initialization)
    await testHelper.delay(5 * 1000)
    res = await databaseHelper.initialize()
    expect(res).toBeTruthy()

    await l1.deleteOne()
    await l2.deleteOne()
    await c1.deleteOne()
    await c2.deleteOne()
    await ps1.deleteOne()
    await ps2.deleteOne()

    await databaseHelper.close()
  })
})

describe('Test database initialization failures', () => {
  it('should check database initialization failures', async () => {
    // test failure (lost db connection)
    await databaseHelper.close()
    expect(await databaseHelper.initializeLocations()).toBeFalsy()
    expect(await databaseHelper.initializeCountries()).toBeFalsy()
    expect(await databaseHelper.initializeParkingSpots()).toBeFalsy()
  })
})
