require('dotenv').config();
var sslRedirect = require('heroku-ssl-redirect');
// Get twillio auth and SID from heroku if deployed, else get from local .env file
//var twilioAuthToken = process.env.HEROKU_AUTH_TOKEN || process.env.LOCAL_AUTH_TOKEN;
//var twilioAccountSID = process.env.HEROKU_TWILLIO_SID || process.env.LOCAL_TWILLIO_SID;
//var twilio = require('twilio')(twilioAccountSID, twilioAuthToken);
var express = require('express');
var hbs = require('express-handlebars');
const cors = require('cors');
const bodyParser = require('body-parser');
const _ = require('lodash');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var path = require('path');
var AirtablePlus = require('airtable-plus');
const AWS = require('aws-sdk');
const fs = require('fs');
const uniqid = require('uniqid');
const multer = require('multer');
const multerS3 = require('multer-s3');
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.S3_BUCKET || 'aua-video',
    metadata: function (req, file, cb) {
      let meta = { fieldName: file.fieldname };
      try {
        if (req.body.abueloId) {
          meta.abueloId = req.body.abueloId;
        }
        if (req.body.voluntarioId) {
          meta.voluntarioId = req.body.voluntarioId;
        }
        if (req.body.abueloId) {
          meta.abueloId = req.body.abueloId;
        }
        if (req.body.nameVoluntario) {
          meta.nameVoluntario = req.body.nameVoluntario;
        }
      } catch (e) {
        console.log(e);
        return cb(null, { fieldName: file.fieldname });
      }
      cb(null, meta);
    },
    key: function (req, file, cb) {
      cb(null, uniqid() + '.webm');
    },
  }),
});

const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const TWILIO_SID = process.env.TWILIO_SID;
const TWILIO_TOKEN = process.env.TWILIO_TOKEN;
const twilio = require('twilio')(TWILIO_SID, TWILIO_TOKEN);

var public = path.join(__dirname, 'public');
const url = require('url');

const voluntarios = new AirtablePlus({
  baseID: AIRTABLE_BASE_ID,
  apiKey: AIRTABLE_API_KEY,
  tableName: 'Voluntarios',
});

const abuelos = new AirtablePlus({
  baseID: AIRTABLE_BASE_ID,
  apiKey: AIRTABLE_API_KEY,
  tableName: 'Abuelos',
});

const videos = new AirtablePlus({
  baseID: AIRTABLE_BASE_ID,
  apiKey: AIRTABLE_API_KEY,
  tableName: 'Videos',
});

const findVoluntarioByEmail = async (email) => {
  const data = await voluntarios.read({
    filterByFormula: `Email = "${email}"`,
    maxRecords: 1,
  });
  if (data && data.length > 0) {
    const voluntario = data[0];
    const abuelo = await abuelos.find(voluntario.fields['Abuelo'][0]);
    voluntario.abuelo = abuelo;
    return voluntario;
  } else {
    return undefined;
  }
};

// enable ssl redirect
app.use(sslRedirect());

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Remove trailing slashes in url
app.use(function (req, res, next) {
  if (req.path.substr(-1) === '/' && req.path.length > 1) {
    let query = req.url.slice(req.path.length);
    res.redirect(301, req.path.slice(0, -1) + query);
  } else {
    next();
  }
});

// view engine setup
app.set('view engine', 'hbs');

app.engine(
  'hbs',
  hbs({
    extname: 'hbs',
  })
);

// app.get('/', function (req, res) {
//   res.sendFile(path.join(public, 'landing.html'));
// });
app.get('/', function (req, res) {
  res.sendFile(path.join(public, 'voluntario.html'));
});

app.get('/newcall', function (req, res) {
  res.sendFile(path.join(public, 'newcall.html'));
});

app.get('/voluntario', function (req, res) {
  res.sendFile(path.join(public, 'voluntario.html'));
});

app.get('/voluntario/:email', async function (req, res) {
  const { email } = req.params;
  const voluntario = await findVoluntarioByEmail(email);
  if (voluntario) {
    res.status(200).json(voluntario);
  } else {
    res.status(404).json({});
  }
});

app.get('/voluntario/:voluntarioId/notify/:abueloId', async function (req, res) {
  try {
    const { voluntarioId, abueloId } = req.params;
    const voluntario = await voluntarios.find(voluntarioId);
    const abuelo = await abuelos.find(abueloId);
    if (abuelo) {
      let phone = abuelo.fields['Phone'].replace(/\s/g, '');
      if (phone.length === 9) {
        phone = '+34' + phone;
      }

      twilio.messages
        .create({
          body: `Hola ${abuelo.fields['Name']}, tu voluntari@ ${voluntario.fields['Name']} te esta esperando para una videoconferencia aqui: https://auavideo.herokuapp.com/join/${voluntarioId}`,
          from: 'ADOPTA1ABU',
          to: phone,
        })
        .then((message) => console.log(message.sid));
      res.status(200).json(voluntario);
    } else {
      res.status(404).json({});
    }
  } catch (e) {
    console.log(e);
    res.status(500).json({});
  }
});

app.get('/abuelo/:abueloId', async function (req, res) {
  const { abueloId } = req.params;
  const abuelo = await abuelos.find(abueloId);
  if (abuelo) {
    console.log(abuelo);
    res.render('abuelo', { abuelo });
  } else {
    res.status(404).json({});
  }
});

app.get('/join/', function (req, res) {
  res.redirect('/');
});

app.get('/join/*', function (req, res) {
  if (Object.keys(req.query).length > 0) {
    logIt('redirect:' + req.url + ' to ' + url.parse(req.url).pathname);
    res.redirect(url.parse(req.url).pathname);
  } else {
    res.sendFile(path.join(public, 'chat.html'));
  }
});

app.get('/notsupported', function (req, res) {
  res.sendFile(path.join(public, 'notsupported.html'));
});

app.get('/notsupportedios', function (req, res) {
  res.sendFile(path.join(public, 'notsupportedios.html'));
});

app.post('/video', upload.single('video'), async function (req, res) {
  try {
    console.log('file', req.file);
    const { key, size, mimetype, location } = req.file;
    const { abueloId, voluntarioName, voluntarioId } = req.body;

    await videos.create({
      videoURL: `https://video.adoptaunabuelo.org/video/${key}`,
      Abuelo: abueloId ? [abueloId] : null,
      Voluntario: voluntarioId ? [voluntarioId] : null,
      Name: voluntarioName,
      Video: [{ url: `https://video.adoptaunabuelo.org/video/${key}` }],
    });
    res.status(200).json({});
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e });
  }
});

app.get('/video/:videoId', function (req, res) {
  const { videoId } = req.params;
  console.log(`requested video...${videoId}`);

  // Setting up S3 upload parameters
  const params = {
    Bucket: process.env.S3_BUCKET,
    Key: videoId,
  };

  s3.getObject(params).createReadStream().pipe(res);
});

// Serve static files in the public directory
app.use(express.static('public'));

// Simple logging function to add room name
function logIt(msg, room) {
  if (room) {
    console.log(room + ': ' + msg);
  } else {
    console.log(msg);
  }
}

// When a socket connects, set up the specific listeners we will use.
io.on('connection', function (socket) {
  // When a client tries to join a room, only allow them if they are first or
  // second in the room. Otherwise it is full.
  socket.on('join', function (room) {
    logIt('A client joined the room', room);
    var clients = io.sockets.adapter.rooms[room];
    var numClients = typeof clients !== 'undefined' ? clients.length : 0;
    if (numClients === 0) {
      socket.join(room);
    } else if (numClients === 1) {
      socket.join(room);
      // When the client is second to join the room, both clients are ready.
      logIt('Broadcasting ready message', room);
      // First to join call initiates call
      socket.broadcast.to(room).emit('willInitiateCall', room);
      socket.emit('ready', room).to(room);
      socket.broadcast.to(room).emit('ready', room);
    } else {
      logIt('room already full', room);
      socket.emit('full', room);
    }
  });

  // When receiving the token message, use the Twilio REST API to request an
  // token to get ephemeral credentials to use the TURN server.
  socket.on('token', function (room) {
    logIt('Received token request', room);
    twilio.tokens.create(function (err, response) {
      if (err) {
        logIt(err, room);
      } else {
        logIt('Token generated. Returning it to the browser client', room);
        socket.emit('token', response).to(room);
      }
    });
  });

  // Relay candidate messages
  socket.on('candidate', function (candidate, room) {
    logIt('Received candidate. Broadcasting...', room);
    socket.broadcast.to(room).emit('candidate', candidate);
  });

  // Relay offers
  socket.on('offer', function (offer, room) {
    logIt('Received offer. Broadcasting...', room);
    socket.broadcast.to(room).emit('offer', offer);
  });

  // Relay answers
  socket.on('answer', function (answer, room) {
    logIt('Received answer. Broadcasting...', room);
    socket.broadcast.to(room).emit('answer', answer);
  });
});

// Listen for Heroku port, otherwise just use 3000
var port = process.env.PORT || 3000;
http.listen(port, function () {
  console.log('http://localhost:' + port);
});
