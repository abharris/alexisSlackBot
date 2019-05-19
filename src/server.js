import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import morgan from 'morgan';
import botkit from 'botkit';
import dotenv from 'dotenv';
import yelp from 'yelp-fusion';

dotenv.config({ silent: true });

// initialize
const app = express();
const yelpClient = yelp.client(process.env.YELP_API_KEY);


// botkit controller
const controller = botkit.slackbot({
  debug: false,
});

// initialize slackbot
const slackbot = controller.spawn({
  token: process.env.SLACK_BOT_TOKEN,
  // this grabs the slack token we exported earlier
}).startRTM((err) => {
  // start the real time message client
  if (err) { throw new Error(err); }
});

// prepare webhook
// for now we won't use this but feel free to look up slack webhooks
controller.setupWebserver(process.env.PORT || 3001, (err, webserver) => {
  controller.createWebhookEndpoints(webserver, slackbot, () => {
    if (err) { throw new Error(err); }
  });
});

// const getYelp = (place, food) => {
//   yelpClient.search({
//     term: 'Sushi',
//     location: 'hanover, nh',
//   }).then((response) => {
//     return (response.jsonBody.businesses);
//   }).catch((e) => {
//     console.log(e);
//   });
// };

controller.hears(['hello', 'hi', 'howdy'], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
  bot.api.users.info({ user: message.user }, (err, res) => {
    if (res) {
      bot.reply(message, `Hello, ${res.user.name}, say hungry to get some food recommendations!`);
    } else {
      bot.reply(message, 'Hello there, say hungry to get some food recommendations!');
    }
  });
});

controller.hears(['hungry'], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
  console.log('in hungry');
  bot.createConversation(message, (err, convo) => {
    convo.ask('What kind of food would you like?', async (answer) => {
    // do nothing.
      convo.gotoThread('place_q');
    }, { key: 'type' }, 'default');

    convo.ask('Where do you want to search for food?', async (answer) => {
    // do nothing.
      console.log('in place');
    }, { key: 'place' }, 'place_q');

    convo.activate();
  });
});


controller.hears(['help'], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
  bot.reply(message, 'Say hungry to get some food recommendations!');
});

// https://github.com/howdyai/botkit/issues/464
// have slackbot respond to unknown messages
controller.on(['direct_message', 'direct_mention', 'mention'], (bot, message) => {
  bot.reply(message, 'Come again?');
});


controller.on('outgoing_webhook', (bot, message) => {
  bot.replyPublic(message, 'Im up!');
});

// enable/disable cross origin resource sharing if necessary
app.use(cors());

// enable/disable http request logging
app.use(morgan('dev'));

// enable only if you want templating
app.set('view engine', 'ejs');

// enable only if you want static assets from folder static
app.use(express.static('static'));

// this just allows us to render ejs from the ../app/views directory
app.set('views', path.join(__dirname, '../src/views'));

// enable json message body for posting data to API
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


// default index route
app.get('/', (req, res) => {
  res.send('hi');
});

// START THE SERVER
// =============================================================================
const port = process.env.PORT || 9090;
app.listen(port);

console.log(`listening on: ${port}`);
