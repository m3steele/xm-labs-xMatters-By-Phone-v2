exports.handler = function (context, event, callback) {
  console.log('CONNECT');
  let settings = JSON.parse(decodeURI(event.setting));
  let targets = JSON.parse(decodeURI(event.targets));

  let twiml = new Twilio.twiml.VoiceResponse();
  const client = context.getTwilioClient();

  let escalation = parseInt(event.escalation, 10) + 1;

  // Check that parent call is still connected
  console.log('Check parentcall status');
  client
    .calls(settings.parentSid)
    .fetch()
    .then(call => {
      if (call.status === 'completed') {
        console.log('parent call is completed');
        twiml.say(
          {
            loop: 1,
          },
          'Sorry but the caller hungup the phone before you answered. Goodbye.'
        );
        twiml.hangup();
        callback(null, twiml);
      }

      // No digit initially, play message to on-call person
      if (!event.Digits) {
        const gather = twiml.gather({
          input: 'dtmf',
          numDigits: 1,
          timeout: 15,
          action:
            'https://' +
            context.DOMAIN_NAME +
            settings.xm_connect +
            '?setting=' +
            encodeURI(
              JSON.stringify(settings)) + '&escalation=' + escalation + '&targets=' + encodeURIComponent(JSON.stringify(targets)) + '&Digits=' + event.Digits,
        });

        gather.say(
          {
            voice: settings.voice,
          },
          'Hello ' +
            targets[parseInt(event.escalation, 10)].fullName +
            ", you're on-call in the " +
            settings.recipientGroup +
            ' group and someone needs your help. Press any digit to connect with the caller.'
        );

        // call next person if no resposne.
        twiml.redirect(
          'https://' +
            context.DOMAIN_NAME +
            settings.xm_escalate +
            '?setting=' +
            encodeURI(JSON.stringify(settings)) + '&escalation=' + escalation + '&targets=' + encodeURIComponent(JSON.stringify(targets)) + '&nodigits=true'
        );

        callback(null, twiml);
      } else {
        const dial = twiml.dial();
        dial.queue({}, settings.parentSid);
        callback(null, twiml);
      }
    });
};
