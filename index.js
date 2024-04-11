//Se importan los modulos necesarios
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const Joi = require('joi');
const moment = require('moment');
const { readData, writeData } = require('./src/files.js');
const app = express();

//libreria extra
const PDF = require('pdfkit');

app.use(bodyParser.json());

// Agregar el middleware de registro de solicitudes a la aplicación
app.use(logRequests);

// Esquema de validación para los datos del artículo
const itemValidation = Joi.object({
  id: Joi.number().required(),
  Type: Joi.string().required(),
  "Sub-Type": Joi.string().required(),
  Name: Joi.string().required(),
  "Relase-Data": Joi.date().required(),
  Price: Joi.number().required(),
  version: Joi.number().required(),
  Available: Joi.boolean().required(),
});

// Middleware de validación de datos del artículo
function validateItem(req, res, next) {
  const itemData = req.body;
  
  // Validar los datos utilizando Joi
  const { error } = itemValidation.validate(itemData);
  if (error) {
      return res.status(400).send(error.details[0].message);
  }

  next();
}

// Middleware para registro de solicitudes HTTP
function logRequests(req, res, next) {
  const { method, url, query, body, ip } = req;
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleString();
  const logLine = `${formattedDate} [${method}] ${url} ${JSON.stringify(query)} ${JSON.stringify(body)} ${ip}\n`;

  // Escribir en el archivo access_log.txt
  fs.appendFile('access_log.txt', logLine, (err) => {
    if (err) console.error('Error al escribir en el archivo access_log.txt:', err);
  });

  next();
}

function addCreatedAt(req, res, next) {
  if (!req.body.hasOwnProperty('created_at')) {
    req.body.created_at = moment().format('YYYY-MM-DD HH:mm');
  }
  next();
}

function addUpdatedAt(req, res, next) {
  if (req.method === 'PUT' && req.path === '/psnetwork/update-all') {
    const currentDate = moment().format('YYYY-MM-DD HH:mm');
    req.body.updated_at = currentDate;
  }
  next();
}

//Página principal
app.get('/', (req, res) => {
    res.send("welcome to the Main page of my first API - Web 2");
});

//Obtención de articulos dentro del JSON
app.get('/psnetwork', (req, res) => {
    const data = readData("./src/PSN.json");
    res.json(data.PlaystationNetwork);
});

//Obtención de articulos dentro del JSON con filtro
app.get('/psnetwork', (req, res) => {
  const data = readData("./src/PSN.json");
  let filteredData = data.PlaystationNetwork;
  const { filterBy, value } = req.query;
  if (filterBy && value) {
    filteredData = filteredData.filter(item => item[filterBy] === value);
  }
  res.json(filteredData);
});
//Obtención de articulos mediante el ID
app.get('/psnetwork/:id', (req, res) => {
    const data = readData("./src/PSN.json");
    const id = parseInt(req.params.id);
    const psn = data.PlaystationNetwork.find((psn) => psn.id === id);
    res.json(psn);
});

//Agregar un nuevo elemento dentro del JSON
app.post('/psnetwork', validateItem, addCreatedAt, (req, res) => {
  const data = readData("./src/PSN.json");
  const body = req.body;
  const newPSN = {
    id: data.PlaystationNetwork.length + 1,
    ...body,
    created_at: req.body.created_at
  };
  data.PlaystationNetwork.push(newPSN);
  writeData(data, "./src/PSN.json");
  res.json(newPSN);
});

//Actualizar un elemento existente en el JSON
app.put('/psnetwork/:id', validateItem, addCreatedAt, (req, res) => {
  const data = readData("./src/PSN.json");
  const body = req.body;
  const id = parseInt(req.params.id);
  const psnIndex = data.PlaystationNetwork.findIndex((psn) => psn.id === id);
  data.PlaystationNetwork[psnIndex] = { 
    ...data.PlaystationNetwork[psnIndex],
    ...body,
    created_at: req.body.created_at
  };
  writeData(data, "./src/PSN.json");
  res.json({ message: "PSN article updated correctly" });
});

//Actualizar el campo updated_at de todos los elementos en el JSON
app.put('/psnetwork/update-all/yes', addUpdatedAt, (req, res) => {
  const data = readData("./src/PSN.json");
  const currentDate = moment().format('YYYY-MM-DD HH:mm');
  data.PlaystationNetwork.forEach((psn) => {
    console.log(psn);
    psn.updated_at = currentDate;
  });  
  writeData(data, "./src/PSN.json");
  res.json({ message: "Updated updated_at field for all records" });
});

//Eliminar un elemento dentro del JSON
app.delete('/psnetwork/:id', (req, res) =>{
    const data = readData("./src/PSN.json");
    const id = parseInt(req.params.id);
    const psnIndex = data.PlaystationNetwork.findIndex((psn) => psn.id === id);
    data.PlaystationNetwork.splice(psnIndex, 1);
    writeData(data, "./src/PSN.json");
    res.json({ message: "PSN article deleted correctly" });
  });

//Generar PDF de manera programática
app.get('/generate-pdf/aunque-no-sea-conmigo', (req, res) => {
    const doc = new PDF();
   
    const texto = `
                A placer
                Puedes tomarte el tiempo necesario
                Que por mi parte yo estaré esperando
                El día en que te decidas a volver y ser feliz como antes fuimos
                Sé muy bien
                Que como yo estarás sufriendo a diario
                La soledad de dos amantes que al dejarse
                Están luchando cada quien por no encontrarse
                Y no es por eso
                Que haya dejado de quererte un solo día
                Estoy contigo aunque estés lejos de mi vida
                Por tu felicidad a costa de la mía
                Pero si ahora tienes
                Tan solo la mitad del gran amor que aún te tengo
                Puedes jurar que al que te tiene lo bendigo
                Quiero que seas feliz
                Aunque no sea conmigo
                Y no es por eso
                Que haya dejado de quererte un solo día
                Estoy contigo aunque estés lejos de mi vida
                Por tu felicidad a costa de la mía
                Pero si ahora tienes
                Tan solo la mitad del gran amor que aún te tengo
                Puedes jurar que al que te tiene lo bendigo
                Quiero que seas feliz
                Aunque no sea conmigo
                    `;
    doc.fontSize(20);
    doc.text(texto);

    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);
    doc.end();
});

app.listen(3000, () => {
    console.log('Listening on port 3000');
});
