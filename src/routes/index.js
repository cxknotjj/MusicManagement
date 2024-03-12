
let express = require('express')

let router = express.Router();
const fs = require('fs')
const music = require('./music')
const bilibili = require('./bilibili')

router.use('/music',music)
router.use('/bilibili',bilibili)



module.exports = router