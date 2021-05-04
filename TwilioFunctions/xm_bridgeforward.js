let got = require('got');
exports.handler = function (context, event, callback) {
  console.log('BRIDGEFORWARD');
  let settings = JSON.parse(decodeURI(event.setting));
  let twiml = new Twilio.twiml.VoiceResponse();

  got
    .get(settings.xmatters + '/api/xm/1/events?requestId=' + event.requestId, {
      headers: {
        Authorization: 'Basic ' + Buffer.from(settings.xm_user + ':' + settings.xm_pass).toString('base64'),
      },
    })
    .then(function (response) {
      console.log('xMatters event response: ' + response.body);
      let json = response.body;
      json = JSON.parse(response.body);

      if (json.count === 0) {
        console.log('Bridge not open yet..');

        twiml.say({ voice: settings.voice, loop: 1 }, context.Openbridge_Phrase);
        twiml.pause({
          length: 5,
        });
        twiml.redirect(
          'https://' +
            context.DOMAIN_NAME +
            settings.xm_bridgeforward +
            '?setting=' +
            encodeURI(JSON.stringify(settings)) +
            '&requestId=' +
            event.requestId
        );

        // return the TwiML
        callback(null, twiml);
      }

      if (json.data[0].conference) {
        console.log('Dialing Conference ' + JSON.stringify(json.data[0].conference));
        // set-up the variables that this Function will use to forward a phone call using TwiML
        let phoneNumber = settings.xmconference;
        const dial = twiml.dial();

        dial.number(
          {
            sendDigits: 'wwwwwwwwww' + json.data[0].conference.bridgeNumber + '#',
          },
          phoneNumber
        );
        // return the TwiML
        callback(null, twiml);
      }
    })
    .catch(function (error) {
      // Boo, there was an error.
      twiml.say(
        { voice: settings.voice },
        'Oops, something went wrong. The event has not been sent. You will need to send this event directly from x matters.'
      );

      callback(error);
    });
};
