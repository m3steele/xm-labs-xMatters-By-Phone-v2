exports.handler = function (context, event, callback) {
  console.log('ACTIONS');
  let settings = JSON.parse(decodeURI(event.setting));
  let twiml = new Twilio.twiml.VoiceResponse();

  // Create actions in order declared in xm_settings
  let altertTypes = '';
  for (let at in settings.alertTypes) {
    // add each alert type in order
    altertTypes += setting.options[settings.alertTypes[at]].m + ' ';
  }

  const gather = twiml.gather({
    input: 'dtmf',
    numDigits: 1,
    timeout: 10,
    action: 'https://' + context.DOMAIN_NAME + settings.xm_group + '?setting=' + encodeURI(JSON.stringify(settings)) + '&Digits=' + event.Digits,
  });
  gather.say({ voice: settings.voice, loop: 1 }, context.Intro_Phrase + altertTypes + context.Menu_Phrase);

  twiml.redirect('https://' + context.DOMAIN_NAME + settings.xm_action + '?setting=' + encodeURI(JSON.stringify(settings)));

  callback(null, twiml);
}; // close handler
