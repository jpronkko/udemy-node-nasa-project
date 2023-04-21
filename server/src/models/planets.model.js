const path = require('path')
const { parse } = require('csv-parse')
const fs = require('fs')

const PLANETS_DATA_FILE = path.join(process.cwd(), 'data', 'kepler_data.csv')
console.log(`Loading from: ${PLANETS_DATA_FILE}`)

const habitablePlanets = []

function isHabitable(planet) {
  return planet['koi_disposition'] === 'CONFIRMED'
    && planet['koi_insol'] > 0.36 && planet['koi_insol'] < 1.11
    && planet['koi_prad'] < 1.6
}

/*
  const promise = new Promise((resolve, reject) => {
    ...
    resolve(42)
  })

  promise.then((result) => {

  })

  or

  const result = await promise
*/

 function loadPlanetsData () {
  return new Promise((resolve, reject) => {
    fs.createReadStream(PLANETS_DATA_FILE)
    .pipe(parse({
      comment: '#',
      columns: true,
    }))
    .on('data', (data) => {
      if (isHabitable(data)) {
        habitablePlanets.push(data)
      }
    })
    .on('error', (err) => {
      console.log(err)
      reject(err)
    })
    .on('end', () => {
      console.log(`${habitablePlanets.length} habitable planets found!`)
      console.log('done!')
      resolve()
    })
  })
}

function getAllPlanets() {
  return habitablePlanets
}

module.exports = {
  loadPlanetsData,
  getAllPlanets
}