let got = require('got');

exports.handler = function (context, event, callback) {
  console.log('Enqueue');
  let settings = JSON.parse(decodeURI(event.setting));
  let twiml = new Twilio.twiml.VoiceResponse();

  //No digits initialy, play no answer message
  if (!event.Digits) {
    const gather = twiml.gather({
      input: 'dtmf',
      numDigits: 1,
      timeout: 15,
      action: 'https://' + context.DOMAIN_NAME + settings.xm_endqueue + '?setting=' + encodeURI(JSON.stringify(settings) + '&group=' + event.group),
    });

    gather.say(
      {
        voice: settings.voice,
      },
      'None of the on-call agents in the ' +
        event.group +
        ' group answered. Press 1, to alert the team they missed your call by sms and email. Press 2, to return to the main menu. Hang-up to end the call.'
    );

    callback(null, twiml);
  }
  //Create xMatters alert
  else if (event.Digits === '1') {
    //Create xMatters alert if no answer
    let trigger = {
      whoCalled: event.From,
      targetGroup: event.group,
    };

    got
      .post(settings.xmatters + settings.noanswerHTTP, {
        body: JSON.stringify(trigger),
        headers: {
          'Content-Type': 'application/json',
        },
        json: true,
      })
      .then(function (response) {
        twiml.say({ voice: settings.voice }, 'An x matters alert has been sent to the ' + event.group + ' group. They should reach out to you soon.');
        twiml.hangup();

        callback(null, twiml);
      })
      .catch(function (error) {
        console.log('error: ' + error);
        // Boo, there was an error.
        twiml.say(
          { voice: settings.voice },
          'Oops, something went wrong. The event has not been sent. You will need to send this event directly from x matters.'
        );

        callback(error);
      });
  }
  // Return to main menu
  else if (event.Digits === '2') {
    twiml.redirect('https://' + context.DOMAIN_NAME + settings.xm_settings + '?Digits=*');

    callback(null, twiml);
  }
  // Invalid digit
  else {
    twiml.say(
      {
        voice: settings.voice,
      },
      'Invalid digit.'
    );

    twiml.redirect(
      'https://' + context.DOMAIN_NAME + settings.xm_endqueue + '?setting=' + encodeURI(JSON.stringify(settings) + '&group=' + event.group)
    );
    callback(null, twiml);
  }
};
