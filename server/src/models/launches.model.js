const axios = require('axios')

const launches = require('./launches.mongo');
const planets = require('./planets.mongo')
const { getPagination } = require('../services/query')
const DEFAULT_FLIGHT_NUMBER = 100

// const launch = {
//     flightNumber: 100, // flight_number
//     mission: 'Kepler Exploration X', // name
//     rocket: 'Explorer IS1', //rocket.name
//     launchDate: new Date('December 27, 2030'), // date_local
//     target: 'Kepler-442 b', // not applicable
//     customers: ['ZTM', 'NASA'], // payloads.customers
//     upcoming: true, // upcoming
//     success: true,  // success
// }

// saveLaunch(launch)
const SPACEX_API_URL = 'https://api.spacexdata.com/v4/launches/query'

async function populateLaunches() {
  const response = await axios.post(SPACEX_API_URL, {
    query: {},
    options: {
      pagination: false,
      populate: [
        {
          path: 'rocket', 
          select:  {
            'name': 1,
          },
          
        },
        {
          path: 'payloads',
          select: {
            'customers': 1
          }
        }
      ]
    }
  })

  if (response.status !== 200) {
    console.log('Problem downloading launch data')
    throw new Error('Launch data download failed!')
  }

  const launchDocs = response.data.docs
  for (const launchDoc of launchDocs) {
    const payloads = launchDoc['payloads']
    const customers = payloads.flatMap((payload) => {
      return payload['customers']
    })

    const rocket = launchDoc['rocket']
    const launch = {
      flightNumber: launchDoc['flight_number'],
      mission: launchDoc['name'],
      rocket: rocket['name'],
      launchDate: launchDoc['date_local'],
      upcoming: launchDoc['upcoming'],
      success: launchDoc['success'],
      customers,
    }

    console.log(`Mission ${launch.mission} flight number: ${launch.flightNumber} rocket: ${rocket["name"]}`)

    await saveLaunch(launch)
  }
}

async function loadLaunchData() {
  console.log('Downloading launch data...')

  const firstLaunch = await findLaunch({
    flightNumber: 1,
    rocket: 'Falcon 1',
    mission: 'FalconSat',
  })

  if (firstLaunch) {
    console.log('Launch data was already loaded!')
  } else {
    console.log('No launch data in db, populating launches!')
    await populateLaunches()  
  }
}

async function findLaunch(filter) {
  return await launches.findOne(filter)
}

async function getLatestFlightNumber() {
  const latestLaunch = await launches
    .findOne()
    .sort('-flightNumber')

    if (!latestLaunch) {
      return DEFAULT_FLIGHT_NUMBER
    }
    return latestLaunch.flightNumber
}

async function getAllLaunches(skip, limit) {
  return await launches
    .find({}, { '_id': 0, '__v': 0 })
    .sort({ flightNumber: 1 })
    .skip(skip)
    .limit(limit)
}

async function saveLaunch(launch) {
  await launches.findOneAndUpdate({
    flightNumber: launch.flightNumber,
  }, launch, {
    upsert: true
  })
}

async function scheduleNewLaunch(launch) {
  const planet = await planets.findOne({ 
    keplerName: launch.target
  })

  console.log('launch target', launch.target)
  if(!planet) {
    throw new Error('No matching planets found!')
  }

  const latestFlightNumber = await getLatestFlightNumber()
  
  const newLaunch = Object.assign(launch, {
    customers: ['Zero to Mastery', 'NASA'],
    flightNumber: latestFlightNumber + 1,
    upcoming: true,
    success: true,
  })

  await saveLaunch(newLaunch)
  /*launches.set(
    latestFlightNumber, 
    Object.assign(launch, {
      customers: ['Zero to Mastery', 'NASA'],
      flightNumber: latestFlightNumber,
      upcoming: true,
      success: true,
    })
  )*/
}

async function existsLaunchWithId(launchId) {
  //return launches.has(launchId)
  const one = await findLaunch({ 
    flightNumber: launchId 
  })
  return one
}

async function abortLaunchById(launchId) {
  const aborted = await launches.updateOne({
    flightNumber: launchId 
  },
  {
    upcoming: false,
    success: false
  })

  return aborted.modifiedCount === 1
}

module.exports = {
  loadLaunchData,
  getAllLaunches,
  scheduleNewLaunch,
  existsLaunchWithId,
  abortLaunchById
}

