require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const helmet = require('helmet')
const winston = require('winston')
const { NODE_ENV } = require('./config')
const {bookmarks} = require('./store')
const { v4: uuid } = require('uuid');


const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
      new winston.transports.File({ filename: 'info.log' })
    ]
  });
  
  if (NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
      format: winston.format.simple()
    }));
  }
const app = express()

const morganOption = (NODE_ENV === 'production')
    ? 'tiny'
    : 'common';

app.use(morgan(morganOption))
app.use(helmet())
app.use(cors())

app.use(function validateBearerToken(req, res, next) {
    const apiToken = process.env.API_TOKEN
    const authToken = req.get('Authorization')
  
    if (!authToken || authToken.split(' ')[1] !== apiToken) {
      logger.error(`Unauthorized request to path: ${req.path}`)
      return res.status(401).json({ error: 'Unauthorized request' })
    }
    // move to the next middleware
    next()
  })
  
app.get('/', (req, res) => {
    res.send('Hello, world!')
})
app.get('/bookmarks', (req,res) => {
    res.json(bookmarks)
})
app.get('/bookmarks/:id',(req,res) => {
    const bookmark = bookmarks.find(bookmark=>bookmark.id == req.params.id)
    if (!bookmark){
        return res
            .status(404)
            .send('bookmark not found')
        
    }
    res
        .status(200)
        .json(bookmark)
})
app.use(express.json());
app.post('/bookmarks',(req,res) => {
    const {title,url,description,rating} = req.body
    if (!(title && url && rating)){
        logger.error('title, url or rating missing in post request')
        return res.status(400).send('invalid data')
    }
    const id = uuid()
    bookmarks.push({title,url,description,id})
    logger.info(`bookmark created with id ${id}`)
    res
    .status(201)
    .location(`http://localhost:8000/bookmarks/${id}`)
    .json(bookmarks)

})
app.delete('/bookmarks/:id',(req,res)=>{
    const id = req.params.id
    console.log(id)
    const index = bookmarks.findIndex(item=>item.id == id)
    if (index === -1){
        logger.error('no item to delete')
        return res
            .status(400)
            .send('Invalid request')
    }
    bookmarks.splice(index,1)
    res.status(204).send()
})

app.use(function errorHandler(error, req, res, next) {
    let response
    if (NODE_ENV === 'production') {
        response = { error: { message: 'server error' } }
    } else {
        console.error(error)
        response = { message: error.message, error }
    }
    res.status(500).json(response)
})

module.exports = app