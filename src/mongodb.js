const {MongoClient} = require('mongodb')
const path = require('path')
require('dotenv').config({path: path.join(__dirname,'../.env')})
const client = new MongoClient(process.env.MONGODB_URLSTRING)


async function connectToMongoDB() {
    try {
        await client.connect()
            console.log('Conectado a MongoDB')
        return client
    } catch(error){
        console.error('error al conectar a MongoDB: ',error)
        return null
    }
}

async function disconnectFromMongoDB() {
    try {
        await client.close()
            console.log('Desconectado de MongoDB')
    } catch(error) {
            console.log('Error al desconectar de MongoDB: ', error)
    }
}

async function generateId(collection) {
    const documentMaxId = await collection.find().sort({ codigo: -1 }).limit(1).toArray()
    const maxId = documentMaxId[0]?.codigo ?? 0

    return maxId + 1
}

module.exports = {connectToMongoDB, disconnectFromMongoDB, generateId}