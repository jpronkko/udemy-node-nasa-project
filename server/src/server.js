const http = require('http')

const app = require('./app')
const { loadPlanetsData } = require('./models/planets.model')

const server = http.createServer(app)

const PORT = process.env.PORT || 8000

async function startServer() {
  await loadPlanetsData()

  server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}...`)
  })  
}

startServer()

// const express = require('express')
// const app = express()
// app.listen()




