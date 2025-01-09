const express = require('express')
const multer = require('multer')
require('dotenv').config()
const path = require('path')
const fs = require('fs')
const sharp = require('sharp')
const cloudinary = require('cloudinary').v2;

const app = express()
// server listen
app.listen(process.env.Port || 3000, () => console.log('Server is Start on Port', process.env.Port))

// middleware 
app.use(express.json())

// multer configuration using memory storage for getting buffer format !! 
const storage = multer.memoryStorage()
const upload = multer({storage: storage})

// cloudnary configuration //

cloudinary.config({ 
    cloud_name: process.env.cloud_name, 
    api_key: process.env.api_key, 
    api_secret: process.env.api_secret
  });

// Routes 
app.get('/upload', (req, res) => {
    res.status(200).send('App Running Good')
})
app.post('/upload', upload.single('image'), async (req, res) => {
    try {

        if (!req.file) {
            return  res.status(500).send('File not uploaded')
        }
        const file = req.file
        // console.log(file);

        // paths configuration 

        const filename = file.originalname
        const uploadpath = path.join(__dirname, `upload`)
        const uploadfilepath = path.join(uploadpath, filename)
        const compresspath = path.join(__dirname, 'compress')
        const compressfilepath = path.join(compresspath, filename)

        // file system use for verifying and creating files and folders

        if (!fs.existsSync(uploadpath)) {
            fs.mkdirSync(uploadpath)
        }
        if (!fs.existsSync(compresspath)) {
            fs.mkdirSync(compresspath)
        }
        fs.writeFileSync(uploadfilepath, file.buffer)

        // Sharp configuration for compressing the image size

        await sharp(file.buffer)
        .jpeg({quality: 40})
        .toFile(compressfilepath)

        // cloudniay upload setup

        cloudinary.uploader.upload(compressfilepath)
        .then((result) => {
            // remove the files sor optimize the server in future
            // fs.unlinkSync(uploadfilepath)
            // fs.unlinkSync(compressfilepath)
            return  res.status(200).json(result.url)
        })
        .catch(err => res.send({err : err}))

    }
    catch (err) {
        res.send(err)
    }
    
})

