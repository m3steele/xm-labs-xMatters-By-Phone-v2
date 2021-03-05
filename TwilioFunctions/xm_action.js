exports.handler = function (context, event, callback) {
  console.log("ACTIONS");
  var settings = JSON.parse(decodeURI(event.setting));
  let twiml = new Twilio.twiml.VoiceResponse();

  const gather = twiml.gather({
    input: "dtmf",
    numDigits: 1,
    timeout: 10,
    action:
      "https://" +
      context.DOMAIN_NAME +
      settings.xm_group +
      "?setting=" +
      encodeURI(JSON.stringify(settings)) +
      "&Digits=" +
      event.Digits,
  });
  gather.say(
    { voice: settings.voice, loop: 1 },
    context.Intro_Phrase +
      settings.options.Alert.m +
      " " +
      settings.options.Conference.m +
      " " +
      settings.options.Incident.m +
      " " +
      settings.options.Livecall.m +
      " " +
      context.Menu_Phrase
  );

  twiml.redirect(
    "https://" +
      context.DOMAIN_NAME +
      settings.xm_action +
      "?setting=" +
      encodeURI(JSON.stringify(settings))
  );

  callback(null, twiml);
}; // close handler
