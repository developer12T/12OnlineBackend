const express = require('express')

const auth = require('./authen/middleware/auth')
const app = express()
const cors = require('cors')
const morgan = require('morgan')
// app.use(express.json())
const routeIndex = require('./routes/index')

app.use(cors())

app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb' }))

//zort
// const zort = require('./zort/index')

// const PurchaseCustomerOrder = require('./poco/index')

//M3API
// const M3API = require('./M3API/index')

//authen
// const loginToken = require('./authen/login')
// const loginTokenAnt = require('./authen/loginAnt')
// const devLoginToken = require('./authen/devlogin')
// const checkToken = require('./authen/checkToken')

//manageUser
// const manageUser = require('./manageuser/index')

//zort
// app.use('/zort',auth,zort)
// app.use('/PurchaseCustomerOrder',auth,PurchaseCustomerOrder)

// manageUser
// app.use('/manageUser',manageUser)

//M3API
// app.use('/M3API',M3API)

//authen
// app.use('/12Trading',loginToken)
// app.use('/12Trading',loginTokenAnt)
// app.use('/12Trading',devLoginToken)
// app.use('/12Trading',auth,checkToken)

// require('./cronjob/main')

// =============================
// API Metrics Middleware
// =============================
app.use((req, res, next) => {
  const start = process.hrtime() // ความแม่นยำสูงกว่า Date.now()

  res.on('finish', () => {
    const diff = process.hrtime(start)
    const responseTime = (diff[0] * 1e3 + diff[1] / 1e6).toFixed(2) // ms

    const statusCode = res.statusCode
    const method = req.method
    const url = req.originalUrl

    // Log Response Time
    console.log(
      `RT | ${method} ${url} | ${responseTime} ms | status ${statusCode}`
    )

    // Log Error Rate
    if (statusCode >= 500) {
      console.error(`ERR | ${method} ${url} | status ${statusCode}`)
    }
  })

  next()
})

app.use(morgan('dev'))
app.use(
  cors({
    origin: '*'
  })
)

// Routes
app.use('/online', routeIndex)

module.exports = app
