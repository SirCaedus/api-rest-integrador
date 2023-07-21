const express = require('express')
const path = require('path')
const { connectToMongoDB, disconnectFromMongoDB, generateId } = require('./src/mongodb')
const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())
app.use(require('body-parser').json())
app.use(express.urlencoded({extended: true}))
app.use('/public', express.static(path.join(__dirname, 'public')))

app.use((err,req,res,next) => {
    if(err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        res.status(400).send('Error en el formato JSON enviado')
    } else next()
}) 
app.use((req,res,next) => {
    res.header('Content-Type', 'application/json; charset=utf-8')
    next()
})

app.get('/', (req,res) => {
    res.status(200).end('Bienvenido a la API de Computacion!')
})

//obtener toda la coleccion
app.get('/computacion', async (req,res) => {
    try{
        const client = await connectToMongoDB()
        if (!client) {
            res.status(500).send('Error al conectarse a MongoDB')
            return
        }    

        const db = client.db('computacion')
        const computacion = await db.collection('computacion').find().toArray() 
        res.json(computacion)       
    } catch (error) {
        res.status(500).send('Error al obtener la coleccion en la base de datos')
    } finally {    
        await disconnectFromMongoDB()
    }

})

//obtener por ID
app.get('/computacion/get/:id', async (req,res) => {
    const paramId = parseInt(req.params.id)
    try {
        const client = await connectToMongoDB()
        if(!client){
            res.status(500).send('Error al conectarse a MongoDB')
            return
        }

        const db = client.db('computacion')
        const objeto = await db.collection('computacion').findOne({codigo: paramId})
        if(objeto){
            res.json(objeto)
        } else {
            res.status(404).send('Objeto no encontrado')
        }
    } catch(error) {
        res.status(500).send('Error al obtener el objeto de la base de datos')
    } finally {
        await disconnectFromMongoDB()
    }

})

//obtener por nombre
app.get('/computacion/nombre/:nombre', async (req,res) => {
    const objetoQuery = req.params.nombre

    let objetoNombre = RegExp(objetoQuery,'i')
    try {
        const client = await connectToMongoDB()
        if(!client){
            res.status(500).send('Error al conectarse a MongoDB')
            return
        }

        const db = client.db('computacion')
        const objeto = await db.collection('computacion')
        .find({nombre: objetoNombre})
        .toArray()

        if(objeto.length > 0){
            res.json(objeto)
        } else {
            res.status(404).send('Objeto no encontrado')
        }
    } catch(error) {
        res.status(500).send('Error al obtener el objeto de la base de datos')
    } finally {
        await disconnectFromMongoDB()
    }

})

//obtener por categoria
app.get('/computacion/categoria/:categoria', async (req,res) => {
    const objetoQuery = req.params.categoria

    let objetoCategoria = RegExp(objetoQuery,'i')
    try {
        const client = await connectToMongoDB()
        if(!client){
            res.status(500).send('Error al conectarse a MongoDB')
            return
        }

        const db = client.db('computacion')
        const objeto = await db.collection('computacion')
        .find({categoria: objetoCategoria})
        .toArray()

        if(objeto.length > 0){
            res.json(objeto)
        } else {
            res.status(404).send('Objetos no encontrados')
        }
    } catch(error) {
        res.status(500).send('Error al obtener los objetos de la base de datos')
    } finally {
        await disconnectFromMongoDB()
    }

})

//insertar un nuevo objeto
app.post('/computacion/post', async (req, res) => {
    const { nombre, precio, categoria } = req.body

    if(!nombre || !precio || !categoria){
        return res.status(400).send('Error, faltan datos')
    }

    try {
        const client = await connectToMongoDB()
        if (!client) {
            res.status(500).send('Error al conectarse a MongoDB')
        }
    
        const db = client.db('computacion')
        const collection = db.collection('computacion')

        const objeto = {codigo: await generateId(collection), nombre, precio, categoria}
        await collection.insertOne(objeto)
        res.status(201).send(JSON.stringify(objeto, null, '\t'))
    } catch (error) {
        res.status(500).send('Error al intentar agregar una nuevo objeto')
    } finally {
        await disconnectFromMongoDB()
    }
})

//modificar  el precio de un objeto
app.patch('/computacion/patch/:id', async (req,res) => {
    const paramId = parseInt(req.params.id)
    const {precio} = req.body

    if(!precio){
        return res.status(400).send('Error en los datos')
    }

    try {
        const client = await connectToMongoDB()
        if(!client){
            res.status(500).send('Error al conectarse a MongoDB')
            return
        }

        const db = client.db('computacion')
        const collection = db.collection('computacion')

        await collection.updateOne({codigo: paramId}, {$set: {precio: precio}})
        console.log('Objeto actualizado')
        res.status(200).send(await db.collection('computacion').findOne({codigo: paramId}))

    } catch(error) {
        res.status(500).send('Error al obtener el objeto de la base de datos')
    } finally {
        await disconnectFromMongoDB()
    }

})

//eliminar un objeto
app.delete('/computacion/delete/:id', async (req, res) => {
    const objetoId = parseInt(req.params.id)
    try {
        if (!objetoId) {
            res.status(400).send('Error en el formato de datos a crear')
            return
        }
    
        const client = await connectToMongoDB()
        if (!client) {
            res.status(500).send('Error al conectarse a MongoDB')
            return
        }
    
        const db = client.db('computacion')
        const collection = db.collection('computacion')
        const resultado = await collection.deleteOne({ codigo: objetoId })
        if (resultado.deletedCount === 0) {
            res.status(404).send('No se encontró ningun objeto con el id seleccionado')
        } else {
            res.status(204).send('objeto eliminado')
        }
    } catch (error) {
        res.status(500).send('Error al eliminar el objeto')
    } finally {
        await disconnectFromMongoDB()
    }
})

app.use('*', (req,res) => {
    res.status(404).send('Error 404: URI no existente')
})

app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`)
})
