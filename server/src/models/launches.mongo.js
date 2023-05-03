const mongoose = require('mongoose')

const launchSchema = mongoose.Schema({
  flightNumber: { 
    type: Number,
    required: true,
  },
  mission: {
    type: String,
    required: true,
  },
  rocket:{
    type: String,
    required: true,
  },
  launchDate: Date,
  target: {
    type: String,
 //   required: true,
  },
  customers: [ String ],//['ZTM', 'NASA'],
  upcoming: {
    type: Boolean,
    required: true,
  },
  success: {
    type: Boolean,
    required: true,
    default: true,
  },
})

module.exports = mongoose.model('Launch', launchSchema)