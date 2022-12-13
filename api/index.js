const express = require('express')
const cors = require('cors')
const { appendFile } = require('fs')
const morgan = require('morgan')
const { connection } = require('./config/database')
require('dotenv').config()
const app = express()

app.use(cors())

app.use(morgan('dev'))
app.use(express.json())
console.log('you are in.')

app.get('/', (req, res) => {
  res.json('hello broonge')
})

app.post('/bike/start', async (req, res) => {
  try {
    const { id } = req.body
    if (!identifier || !status) return res.status(400).send('no required data')

    const [rows] = await (await connection()).execute(`select * from iot_status where bike_id = ?`, [id])
    if (!rows) return res.status(400).send('no bike')

    res.send({ rows })
  } catch (error) {
    console.log(error)
    return res.status(500)
  }
})

app.listen(4001, async () => {
  try {
    console.log('server running port 4001')
    const [rows] = await (await connection()).execute(`select * from bike`)
    if (rows.length === 0) {
      const [result] = await (await connection()).execute(`insert into bike (identifier) values(?)`, ['1241212319'])
      console.log(result)
    }
    console.log({ bikeList: rows })
  } catch (e) {
    console.log(e)
  }
})
