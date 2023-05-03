const path = require('path')
const { parse } = require('csv-parse')
const fs = require('fs')

let planets = require('./planets.mongo')

const PLANETS_DATA_FILE = path.join(process.cwd(), 'data', 'kepler_data.csv')
console.log(`Loading from: ${PLANETS_DATA_FILE}`)


function isHabitable(planet) {
  return planet['koi_disposition'] === 'CONFIRMED'
    && planet['koi_insol'] > 0.36 && planet['koi_insol'] < 1.11
    && planet['koi_prad'] < 1.6
}


function loadPlanetsData () {
  return new Promise((resolve, reject) => {
    fs.createReadStream(PLANETS_DATA_FILE)
    .pipe(parse({
      comment: '#',
      columns: true,
    }))
    .on('data', async (data) => {
      if (isHabitable(data)) {
        //habitablePlanets.push(data)
        savePlanet(data)  
      }
    })
    .on('error', (err) => {
      console.log(err)
      reject(err)
    })
    .on('end', async () => {
      const countPlanets = (await getAllPlanets()).length
      console.log(`${countPlanets} habitable planets found!`)
      console.log('done!')
      resolve()
    })
  })
}

async function getAllPlanets () {
  /*const planetList = await planets.find({})
  habitablePlanets = planetList.map(planet => planet.keplerName)
  console.log(`Habitable planets ${habitablePlanets}`)
  return habitablePlanets*/
  return await planets.find({}, { '__v': 0, '_id': 0 })
}

async function savePlanet(data) {
  try {
    await planets.updateOne({ 
      keplerName: data.kepler_name
   }, { 
      keplerName: data.kepler_name 
    }, {
     upsert: true,
    })
  } catch(err) {
    console.log(`Planet save failed: ${err}`)
  }
}

module.exports = {
  loadPlanetsData,
  getAllPlanets
}