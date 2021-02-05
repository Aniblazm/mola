const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');
const upload = multer();
const { Timber } = require('@timberio/node');
const moment = require('moment-timezone');
const twilio = require('twilio');

const fetch = require('node-fetch');
const AirtablePlus = require('airtable-plus');
const NodeCache = require('node-cache');

const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');

const sendMail = require('./mailers/sendMail');

const PORT = process.env.PORT || 5000;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRCALL_API_ID = process.env.AIRCALL_API_ID;
const AIRCALL_API_TOKEN = process.env.AIRCALL_API_TOKEN;
const AIRCALL_TEAM_ID = process.env.AIRCALL_TEAM_ID ? parseInt(process.env.AIRCALL_TEAM_ID) : 12856;
const AIRCALL_NUMBER = process.env.AIRCALL_NUMBER || '+34 911 43 60 53';
const MONGO_URL = process.env.MONGO_URL;

var clientTwilio = new twilio(
  process.env.TWILIO_SID || 'ACa31699676278bd839c2ca75b2375e46f',
  process.env.TWILIO_TOKEN || 'fa10efa3a7940a76dc80aca833969199'
);

console.log(
  `Init controller for calls on number [${AIRCALL_NUMBER}] Users Time ${moment().tz(
    'Europe/Madrid'
  )}`
);

// Open template file
var source = fs.readFileSync(
  path.join(__dirname, 'email-templates', 'newCall', 'html.hbs'),
  'utf8'
);
// Create email generator
var templateMail = Handlebars.compile(source);

const myCache = new NodeCache({ stdTTL: 100, checkperiod: 120 });

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

// Generic error handler used by all endpoints.
function handleError(res, reason, message, code) {
  console.log('ERROR: ' + reason);
  res.status(code || 500).json({ error: message });
}

var app = express();
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());
mongoose.set('useCreateIndex', true);
mongoose.connect(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.Promise = global.Promise;

//Get the default connection
var db = mongoose.connection;
//Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// Define schema
const Schema = mongoose.Schema;
const AircallEventSchema = new Schema(
  {
    resource: String,
    event: String,
    timestamp: Number,
    token: String,
    data: Object,
  },
  { timestamps: true }
);
// Compile model from schema
const AircallEvent = mongoose.model('AircallEvent', AircallEventSchema);

const NetelipEventSchema = new Schema(
  {
    callId: { type: String, required: true, unique: true },
    src: String,
    dst: String,
    api: String,
    startcall: String,
    transferCallDate: Date,
    endCallDate: Date,
    endCallDate: Date,
    voluntario: Object,
    abuelo: Object,
    duration: Number,
    recordingFile: String,
    steps: [Object],
  },
  { timestamps: true }
);
/**
 * ID: '1587419989.28046',
2020-04-20T21:59:50.715194+00:00 app[web.1]: src: '626543632',
2020-04-20T21:59:50.715195+00:00 app[web.1]: dst: '34910053461',
2020-04-20T21:59:50.715195+00:00 app[web.1]: api: 'API f7d56',
2020-04-20T21:59:50.715196+00:00 app[web.1]: startcall: '2020-04-20 23:59:49',
 */
// Compile model from schema
const NetelipEvent = mongoose.model('NetelipEvent', NetelipEventSchema);

const NetelipRawDataSchema = new Schema(
  {
    data: Object,
  },
  { timestamps: true }
);
/**
 {
2020-04-20T22:11:00.861807+00:00 app[web.1]: calls: '[{"ID":"1587419989.28046","startdate":"2020-04-21 00:00:10.340704","stopdate":"2020-04-21 00:00:10.340704","src":"0034910053461 (APIVoice 1587419989.28046)","dst":"647509795","dstname":"Espa\\u00f1a - m\\u00f3vil","duration":"0","cost":0,"status":"busy","ip":"","useragent":"APIVoice;1587419989.28046;API f7d56","plan":""},{"ID":"","startdate":"2020-04-20 23:59:49.731502","stopdate":"2020-04-21 00:00:19.731502","src":"626543632","dst":"34910053461","dstname":"","duration":"30","cost":0,"status":"answer","ip":"","useragent":"","plan":""}]'
2020-04-20T22:11:00.861807+00:00 app[web.1]: }
 */
// Compile model from schema
const NetelipRawData = mongoose.model('NetelipRawData', NetelipRawDataSchema);

const findVoluntario = async (phone) => {
  console.log(`findVoluntario(${phone})...`);
  const value = myCache.get('VOLUNTARIO_' + phone);
  if (value) {
    return value;
  }

  const data = await voluntarios.read({
    filterByFormula: `Mobile = "${phone}"`,
    maxRecords: 1,
  });

  if (data && data.length > 0) {
    myCache.set('VOLUNTARIO_' + phone, data[0]);
    return data[0];
  } else {
    return undefined;
  }
};

const findAbuelo = async (id) => {
  console.log(`findAbuelo(${id})...`);
  if (!id) {
    return undefined;
  }
  const value = myCache.get('ABUELO_' + id);
  if (value) {
    return value;
  }
  const data = await abuelos.find(id);
  myCache.set('ABUELO_' + id, data);
  return data;
};

const forwardCall = async (callerId, callId, number) => {
  // Populate Aircall API url with API_ID, API_TOKEN and callid
  const uri = `https://${AIRCALL_API_ID}:${AIRCALL_API_TOKEN}@api.aircall.io/v1/calls/${callId}/transfers`;
  console.log('AIRCALL API CALL=' + uri);

  const transfer = await fetch(uri, {
    method: 'post',
    body: JSON.stringify({
      number: number,
    }),
    headers: { 'Content-Type': 'application/json' },
  });
  console.log(`Call ${callId} - ${callerId} >>> transferred to NUMBER [${number}]`);
  console.log('Response=' + (transfer ? `${transfer.statusCode}-${transfer.status}` : ''));
};

const forwardCallToTeam = async (callerId, callId, teamId = AIRCALL_TEAM_ID) => {
  // Populate Aircall API url with API_ID, API_TOKEN and callid
  const uri = `https://${AIRCALL_API_ID}:${AIRCALL_API_TOKEN}@api.aircall.io/v1/calls/${callId}/transfers`;

  console.log('AIRCALL API CALL=' + uri);
  const transfer = await fetch(uri, {
    method: 'post',
    body: JSON.stringify({
      team_id: teamId,
    }),
    headers: { 'Content-Type': 'application/json' },
  });
  console.log(`Call ${callId} - ${callerId} >>> transferred to TEAM [${teamId}]`);
  console.log('Response=' + (transfer ? `${transfer.statusCode}-${transfer.status}` : ''));
};

const sendCard = async (callId, voluntario, abuelo) => {
  try {
    if (voluntario) {
      // Populate Aircall API url with API_ID, API_TOKEN and callid
      const uri = `https://${AIRCALL_API_ID}:${AIRCALL_API_TOKEN}@api.aircall.io/v1/calls/${callId}/insight_cards`;
      console.log('AIRCALL API CALL=' + uri);
      await fetch(uri, {
        method: 'post',
        body: JSON.stringify({
          contents: [
            {
              type: 'title',
              text: `${voluntario.fields['ShortName']} ${voluntario.fields['Surname']}`,
              label: 'voluntario',
            },
          ],
        }),
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (e) {
    console.log('Error', e);
  }
};

const saveEvent = async (body) => {
  try {
    const event = new AircallEvent(body);
    await event.save();
  } catch (e) {
    console.log('Error', e);
  }
};

/**
 *  [POST] /aircall/calls will listen to Aircall webhook
 */
app.post('/', async (req, res) => {
  if (req.body && req.body.data && req.body.data.number) {
    console.log(
      `CALLED WEBHOOK ${req.body.event} TO [${req.body.data.number.digits}] FROM [${req.body.data.raw_digits}]`
    );
  } else if (req.body) {
    console.log(`CALLED WEBHOOK ${req.body.event}`);
  } else {
    console.log(`CALLED WEBHOOK - NO BODY ERROR`);
  }

  try {
    if (!req.body) {
      res.sendStatus(200);
    }
    saveEvent(req.body);
    // req.body contains the Webhook payload
    if (
      req.body.event === 'call.created' &&
      req.body.data &&
      req.body.data.number &&
      req.body.data.number.digits.replace(/\s/g, '') === AIRCALL_NUMBER.replace(/\s/g, '')
    ) {
      if (req.body.data.direction === 'inbound') {
        console.log('--------------->>>>>>>');
        console.log(req.body);
        console.log('---------------');

        // 1. Get the caller contact:
        let callerId = req.body.data.raw_digits;
        const callId = req.body.data.id;

        if (callerId) {
          callerId = callerId.replace(/\s/g, '');
        }

        console.log(`NEW CALL...${callId} - FROM...[${callerId}]`);
        const voluntario = await findVoluntario(callerId);
        let abuelo;

        if (!voluntario) {
          // Lo mandamos a la cola?
          console.info(`voluntario ${callerId} not founded`);
          //TODO ... forwardCallToTeam(callId);
          return res.sendStatus(200);
        }

        if (voluntario && voluntario.fields['Abuelo'] && voluntario.fields['Abuelo'][0]) {
          abuelo = await findAbuelo(voluntario.fields['Abuelo'][0]);
        }

        /*
        try {
          await sendCard(callId, voluntario, abuelo);
        } catch (e) {
          console.log(e);
        }*/

        if (abuelo) {
          // ForwardCall to abuelo
          let phone = abuelo.fields['Phone'].replace(/\s/g, '');
          if (phone.length === 9) {
            phone = '+34' + phone;
          }
          forwardCall(callerId, callId, abuelo.fields['Phone']);
        } else {
          forwardCallToTeam(callerId, callId);
        }

        console.info('post forward try...');
        const updateRes = await voluntarios.update(voluntario.id, {
          'Last Call': new Date(),
          'Total Calls': voluntario.fields['Total Calls']
            ? voluntario.fields['Total Calls'] + 1
            : 1, // 1 for the "first call"
        });
      } else {
        console.info('Event direction non-handled:', req.body.data.direction);
      }
    } else {
      console.info('Event non-handled:', req.body.event);
    }
    res.sendStatus(200);
  } catch (e) {
    console.error('ERROR RARO...');
    console.error(e);
    return res.status(200).json({ success: false, message: e.message });
  }
});

app.get('/', async (req, res) => {
  try {
    const voluntario = await findVoluntario('+34691233186');
    if (!voluntario) {
      return res.json({ success: false, message: 'No voluntario with that number' });
    }

    let abuelo;

    if (voluntario.fields['Abuelo'] && voluntario.fields['Abuelo'][0]) {
      abuelo = await findAbuelo(voluntario.fields['Abuelo'][0]);
    }

    const updateRes = await voluntarios.update(voluntario.id, {
      'Last Call': new Date(),
      'Total Calls': voluntario.fields['Total Calls'] + 1,
    });

    /*if (!abuelo) {
      return res.json({ success: false, message: 'No abuelo with that voluntario' });
    }*/

    return res.json({ voluntario, abuelo });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, message: e.message });
  }
});

/**
 *  [POST] /netelip/report will listen to Aircall webhook
 */
app.post('/netelip/report', upload.none(), async (req, res) => {
  console.log('NETELIP REPORT');
  try {
    const data = JSON.parse(JSON.stringify(req.body));
    const calls = JSON.parse(data.calls);
    for (let i = 0; i < calls.length; i++) {
      var netelip = new NetelipRawData({ data: calls[i] });
      netelip.save();
    }
    console.log('--------');
    console.log(data);
    console.log('--------');
  } catch (e) {
    console.log('ERROR');
    console.error(e);
  }
  return res.status(200).json({});
});

/**
 *  [POST] /aircall/calls will listen to Aircall webhook
 */
app.post('/netelip', upload.none(), async (req, res) => {
  const data = JSON.parse(JSON.stringify(req.body));
  if (data) {
    // Body...
    /**
     * 
     * {
   "ID": "1576556033.1735",
   "api": "Mi API",
   "src": "638829213",
   "dst": "34951504990",
   "startcall": "2019-11-12 11:04:26",
   "typesrc": "did",
   "usersrc": "638829213"
}
     */
    console.log(`CALLED WEBHOOK NETELIP ${data.ID} TO [${data.dst}] FROM [${data.src}]`);
    console.log('--------');
    console.log(data);
    console.log('--------');
    //console.log(req);
  } else {
    console.log(`CALLED WEBHOOK - NO BODY ERROR`);
  }

  try {
    if (!data) {
      return res.sendStatus(200);
    }

    let voluntarioNumber = data.src.trim();

    if (voluntarioNumber.length === 9) {
      voluntarioNumber = '+34' + voluntarioNumber;
    }

    let voluntario = await findVoluntario(voluntarioNumber);
    let abuelo = null;

    if (voluntario && voluntario.fields['Abuelo'] && voluntario.fields['Abuelo'][0]) {
      abuelo = await findAbuelo(voluntario.fields['Abuelo'][0]);
    }

    let eventNet = {
      callId: data.ID,
      src: data.src,
      dst: data.dst,
      api: data.api,
    };

    if (voluntario) {
      eventNet.voluntario = voluntario;
    }

    if (abuelo) {
      eventNet.abuelo = abuelo;
    }

    if (data.startcall) {
      eventNet.startcall = data.startcall;
    }
    // Call trace Event...
    await NetelipEvent.update(
      { callId: data.ID },
      {
        $set: eventNet,
        $push: { steps: data },
      },
      { upsert: true, multi: false }
    );

    if (data.userfield === 'OK_ABUELO') {
      return res.status(200).json({
        command: 'record',
        options: '',
        userfield: 'OK_RECORD',
      });
    }

    if (data.userfield === 'OK_RECORD') {
      return res.status(200).json({
        command: 'callerid',
        options: 'AdoptaUnAbuelo;0034910053461',
        userfield: 'OK_CALLER_ID',
      });
    }

    if (data.userfield === 'NOANSWER' || data.userfield === 'FALLO') {
      return res.status(200).json({
        command: 'hangup',
        options: '',
        userfield: 'FIN',
      });
    }

    if (data.userfield === 'OK_LLAMADA') {
      if (data.description !== 'ANSWER') {
        return res.status(200).json({
          command: 'speak',
          options: `google;es;${voluntario.fields['ShortName']}. Lo sentimos, pero ${abuelo.fields[
            'ShortName'
          ].trim()} no está disponible para llamadas ahora mismo. ¿Te importa intentarlo un poco más tarde?`,
          userfield: 'NOANSWER',
        });
      } else {
        // CONECTADO... Llamada en curso.
        console.log(
          `*** NETELIP CALL CONNECTED...FROM: ${voluntario.fields['Mobile']} TO: ${
            abuelo.fields['Phone']
          } START:${data.startcall} CURRENT_DURATION:${
            data.durationcallanswered || data.durationcall
          }`
        );
        const updateRes = await voluntarios.update(voluntario.id, {
          'Last Call': new Date(),
          'Total Calls': voluntario.fields['Total Calls']
            ? voluntario.fields['Total Calls'] + 1
            : 1, // 1 for the "first call"
        });

        const minutos = Math.floor((data.durationcallanswered || 0) / 60);
        var locals = {
          voluntario: voluntario.fields['ShortName'],
          abuelo: abuelo.fields['ShortName'],
          url: `https://adoptaunabuelo.typeform.com/to/w0V6SW?idcall=${
            data.ID
          }&nombrevoluntario=${encodeURI(voluntario.fields['ShortName'])}&nombreabuelo=${encodeURI(
            abuelo.fields['ShortName']
          )}&email=${encodeURI(voluntario.fields['Email'])}&phonevoluntario=${encodeURI(
            voluntario.fields['Mobile']
          )}&phoneabuelo=${encodeURI(abuelo.fields['Phone'])}&minutos=${encodeURI(minutos)}`,
          minutos: minutos,
          email: voluntario.fields['Email'],
        };

        var options = (email, locals) => {
          console.info(`Sending voluntarios minutes email to ${email}.`);
          return {
            from: `"Adopta Un Abuelo" <${
              process.env.EMAIL_FROM_ADDR || 'info@adoptaunabuelo.com'
            }>`,
            to: email,
            subject: `Gracias por tu llamada a ${locals.abueloName} de hoy. ¿Nos ayudas a mejorar?`,
            html: templateMail(locals), // Process template with locals
          };
        };

        //sendMail(options(locals.email, locals));

        await NetelipEvent.update(
          { callId: data.ID },
          {
            $set: {
              transferCallDate: new Date(),
            },
          },
          { upsert: true, multi: false }
        );
      }
    }

    if (data.statuscall === 'ANSWER' && data.description === 'ANSWER') {
      await NetelipEvent.update(
        { callId: data.ID },
        {
          $set: {
            duration: parseInt(data.durationcallanswered),
            endCallDate: new Date(),
          },
        },
        { upsert: true, multi: false }
      );
    }

    if (data.userfield === 'OK_CALLER_ID') {
      if (voluntario && abuelo) {
        let abueloNumber = abuelo.fields['Phone'].replace('+34', '');
        return res.status(200).json({
          command: 'dial',
          options: `pstn,${abueloNumber},60,calling,7200` /** 1 hora = 3600segundos de límite */,
          userfield: 'OK_LLAMADA',
        });
      }
    } else if (!data.userfield && !data.command) {
      if (voluntario && abuelo) {
        let ontime = true;
        const madridTime = moment().tz('Europe/Madrid');
        const hour = parseInt(madridTime.format('HH'));
        if (hour >= 9 && hour < 21) {
          return res.status(200).json({
            command: 'speak',
            options: `google;es;Hola ${
              voluntario.fields['ShortName']
            }. Bienvenido a Adopta Un Abuelo. Te vamos a conectar con tu abuelo asignado, es ${abuelo.fields[
              'ShortName'
            ].trim()}. Por motivos de calidad esta conversación podrá ser grabada.`,
            userfield: 'OK_ABUELO',
          });
        } else {
          return res.status(200).json({
            command: 'speak',
            options: `google;es;Hola ${voluntario.fields['ShortName']}. Bienvenido a Adopta Un Abuelo. El servicio está solo disponible de 9 a 21 horas de lunes a domingo. Por favor, vuelve a llamar en ese horario. ¡Gracias!`,
            userfield: 'FALLO',
          });
        }
      } else if (!voluntario) {
        let  entrante = voluntarioNumber.split('');
        //Redirect to another number...
        return res.status(200).json({
          command: 'speak',
          options: `google;es;Bienvenido a Adopta Un Abuelo. Tu número de teléfono ${entrante} no está dado de alta en la plataforma de voluntarios. Puedes registrarte como voluntario en nuestra página web adopta un abuelo punto org;1`,
          userfield: 'FALLO',
        });
      } else if (!abuelo) {
        //Redirect to another number...
        return res.status(200).json({
          command: 'speak',
          options: `google;es;Hola ${voluntario.fields['ShortName']}. Bienvenido a Adopta Un Abuelo. Aún no te hemos asignado un abuelo. Te contactaremos lo antes posible.`,
          userfield: 'FALLO',
        });
      }
    }

    if (data.status === 'OK' && data.description) {
      // Voice recording file
      await NetelipEvent.update(
        { callId: data.ID },
        {
          $set: {
            recordingFile: data.description,
          },
        }
      );
    }
    return res.status(200).json({});
  } catch (e) {
    console.error('ERROR RARO...');
    console.error(e);
    return res.status(200).json({ success: false, message: e.message });
  }
});

function getForwardActionUrl(fallbackUrl) {
  const BASE_URL = '.';
  let actionUrl = BASE_URL + '?Dial=true';
  if (fallbackUrl !== '') {
    actionUrl += '&' + encodeURIComponent(fallbackUrl);
  }
  return actionUrl;
}

function isWorkingTime() {
  let timezone = 'Europe/Madrid';
  const hour = moment().tz(timezone).format('H');
  const dayOfWeek = moment().tz(timezone).format('d');
  if (hour >= 9 && hour <= 20 && dayOfWeek >= 1 && dayOfWeek <= 7) {
    // "open" from 9am to 20pm, CEST.
    return true;
  } else {
    return false;
  }
}
app.post('/twilio/call', async (req, res) => {
  try {
    const event = req.body;
    const twiml = new twilio.twiml.VoiceResponse();
    console.log('EVENT twilio/call >> ' + JSON.stringify(event));
    console.log(
      `New on Call Twilio Event /twilio/call - FROM [${event.From}]  TO [${event.To}] - ${event.DialCallStatus} - CALL_SID ${event.CallSid}`
    );

    if (event.DialCallStatus === 'busy') {
      twiml.say(
        {
          voice: 'woman',
          language: 'es-ES',
        },
        'El abuelo esta ocupado'
      );
    } else if (event.DialCallStatus === 'no-answer') {
      twiml.say(
        {
          voice: 'woman',
          language: 'es-ES',
        },
        'El abuelo no ha contestado'
      );
    } else if (event.DialCallStatus === 'failed') {
      twiml.say(
        {
          voice: 'woman',
          language: 'es-ES',
        },
        'Problema técnico conectando con el abuelo.'
      );
    } else {
      twiml.say(
        {
          voice: 'woman',
          language: 'es-ES',
        },
        'Llamada finalizada'
      );
      //TODO falta mandar email aqui... mirar el evento
      let from = event.From;
      if (from.length === 9) {
        from = '+34' + from; // Default Spain sountry code
      } else if (from.startsWith('00')) {
        from = from.replace('00', '+');
      }
      const voluntario = await findVoluntario(from);
      console.log(`Llamada finalizada...  - CALL_SID ${event.CallSid}`);
    }

    twiml.hangup();

    res.type('text/xml');
    return res.status(200).send(twiml.toString());
  } catch (e) {
    console.log(e);
    return res.status(500).json({ success: false, message: e });
  }
});

app.post('/twilio', async (req, res) => {
  const domain = 'adoptaunabuelo.herokuapp.com';
  const path = 'twilio/call';
  const event = req.body;
  const currentServiceUrl = `https://${domain}/${path}`;

  const twiml = new twilio.twiml.VoiceResponse();

  console.log('EVENT twilio >> ' + JSON.stringify(event));
  console.log(`Domain Service...${currentServiceUrl}`);

  console.log(
    `New Call Twilio /twilio - FROM [${event.From}]  TO [${event.To}] - CALL_SID ${event.CallSid}`
  );
  /** EVENT Object 
   * twilio [Object: null prototype] {
2020-05-11T15:45:07.716618+00:00 app[web.1]: AccountSid: 'ACa31699676278bd839c2ca75b2375e46f',
2020-05-11T15:45:07.716625+00:00 app[web.1]: ApiVersion: '2010-04-01',
2020-05-11T15:45:07.716626+00:00 app[web.1]: CallSid: 'CA05d9556023d5e1fb148485a1e6c01492',
2020-05-11T15:45:07.716626+00:00 app[web.1]: CallStatus: 'ringing',
2020-05-11T15:45:07.716626+00:00 app[web.1]: Called: '+34910782332',
2020-05-11T15:45:07.716627+00:00 app[web.1]: CalledCity: '',
2020-05-11T15:45:07.716627+00:00 app[web.1]: CalledCountry: 'ES',
2020-05-11T15:45:07.716627+00:00 app[web.1]: CalledState: '',
2020-05-11T15:45:07.716627+00:00 app[web.1]: CalledZip: '',
2020-05-11T15:45:07.716627+00:00 app[web.1]: Caller: '+266696687',
2020-05-11T15:45:07.716628+00:00 app[web.1]: CallerCity: '',
2020-05-11T15:45:07.716628+00:00 app[web.1]: CallerCountry: 'LS',
2020-05-11T15:45:07.716628+00:00 app[web.1]: CallerState: '',
2020-05-11T15:45:07.716628+00:00 app[web.1]: CallerZip: '',
2020-05-11T15:45:07.716628+00:00 app[web.1]: Direction: 'inbound',
2020-05-11T15:45:07.716629+00:00 app[web.1]: From: '+266696687',
2020-05-11T15:45:07.716630+00:00 app[web.1]: FromCity: '',
2020-05-11T15:45:07.716630+00:00 app[web.1]: FromCountry: 'LS',
2020-05-11T15:45:07.716630+00:00 app[web.1]: FromState: '',
2020-05-11T15:45:07.716630+00:00 app[web.1]: FromZip: '',
2020-05-11T15:45:07.716631+00:00 app[web.1]: To: '+34910782332',
2020-05-11T15:45:07.716631+00:00 app[web.1]: ToCity: '',
2020-05-11T15:45:07.716631+00:00 app[web.1]: ToCountry: 'ES',
2020-05-11T15:45:07.716632+00:00 app[web.1]: ToState: '',
2020-05-11T15:45:07.716632+00:00 app[web.1]: ToZip: ''
2020-05-11T15:45:07.716632+00:00 app[web.1]: }
   */

  if (!isWorkingTime()) {
    twiml.say(
      {
        voice: 'woman',
        language: 'es-ES',
      },
      'Lo sentimos, pero el servicio de Adopta Un Abuelo sólo funciona de Lunes a Viernes desde las 9 de la mañana a las 8 de la tarde. ¡Gracias!'
    );
    console.log(
      `Out of schedule call - FROM [${event.From}]  TO [${event.To}]. Closed now. - CALL_SID ${event.CallSid}`
    );
    return res.status(200).send(twiml.toString());
  }

  let from = event.From || event.from;
  if (from.length === 9) {
    from = '+34' + from; // Default Spain sountry code
  } else if (from.startsWith('00')) {
    from = from.replace('00', '+');
  }
  try {
    const voluntario = await findVoluntario(from);

    if (!voluntario) {
      twiml.say(
        {
          voice: 'woman',
          language: 'es-ES',
        },
        'Bienvenido a Adopta Un Abuelo. Tu número de teléfono no está dado de alta en la plataforma de voluntarios. Puedes registrarte como voluntario en nuestra página web adopta un abuelo punto org'
      );
      console.error(
        `Voluntario not founded for phone [${from}] on Airtable! - CALL_SID ${event.CallSid}`
      );
    } else {
      if (voluntario && voluntario.fields['Abuelo'] && voluntario.fields['Abuelo'][0]) {
        abuelo = await findAbuelo(voluntario.fields['Abuelo'][0]);
        let abueloNumber = abuelo.fields['Phone'];
        twiml.say(
          {
            voice: 'woman',
            language: 'es-ES',
          },
          `Hola ${
            voluntario.fields['ShortName']
          }. Bienvenido a Adopta Un Abuelo. Te vamos a conectar con tu abuelo asignado, es ${abuelo.fields[
            'ShortName'
          ].trim()}. Por motivos de calidad esta conversación podrá ser grabada.`
        );
        let dial = twiml.dial({
          record: 'record-from-answer-dual',
          timeLimit: 3600,
          timeout: 60,
          action: `${currentServiceUrl}`,
          method: 'POST',
        });
        console.log(
          `FORWARDING CALL FROM [${from}] TO [${abueloNumber}]... - CALL_SID ${event.CallSid}`
        );
        dial.number(abueloNumber);
        twiml.say(
          {
            voice: 'woman',
            language: 'es-ES',
          },
          'Gracias ' + voluntario.fields['ShortName']
        );
      } else {
        twiml.say(
          {
            voice: 'woman',
            language: 'es-ES',
          },
          `Hola ${voluntario.fields['ShortName']}. Bienvenido a Adopta Un Abuelo. Aún no te hemos asignado un abuelo. Te contactaremos lo antes posible.`
        );
        console.error(
          `ABUELO NOT ASSIGNED [${from}] on Airtable. Please review it. - CALL_SID ${event.CallSid}`
        );
      }
    }
  } catch (error) {
    console.error(
      `ERROR WITH CALL [${from}] >>> ${error.name}: ${error.message} - CALL_SID ${event.CallSid}`
    );
    twiml.say(
      {
        voice: 'woman',
        language: 'es-ES',
      },
      'Ha habido un error con la llamada, por favor reintentalo en unos minutos.'
    );
  }

  res.type('text/xml');
  return res.status(200).send(twiml.toString());
});

app.listen(PORT, () => console.log(`Listening on ${PORT}`));
