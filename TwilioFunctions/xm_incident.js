exports.handler = function (context, event, callback) {
  console.log("INCIDENTS");
  var settings = JSON.parse(decodeURI(event.setting));
  let twiml = new Twilio.twiml.VoiceResponse();

  // Check input digits for incident severity is between 1 and 5
  if (
    event.Digits &&
    parseInt(event.Digits, 10) > 0 &&
    parseInt(event.Digits, 10) <= 5
  ) {
    twiml.redirect(
      "https://" +
        context.DOMAIN_NAME +
        settings.xm_group +
        "?setting=" +
        encodeURI(JSON.stringify(settings)) +
        "&severity=" +
        event.Digits
    );

    callback(null, twiml);
  } else {
    console.log("Invalid incident severity");

    // * redirects to begining
    if (event.Digits === "*") {
      twiml.say({ voice: settings.voice, loop: 1 }, context.Restart_Phrase);
      twiml.redirect("https://" + context.DOMAIN_NAME + settings.xm_settings);
      callback(null, twiml);
    }

    const gather = twiml.gather({
      input: "dtmf",
      numDigits: 1,
      timeout: 10,
      action:
        "https://" +
        context.DOMAIN_NAME +
        settings.xm_incident +
        "?setting=" +
        encodeURI(JSON.stringify(settings)),
    });
    gather.say(
      { voice: settings.voice, loop: 1 },
      context.Invalid_Phrase + context.Severity_Phrase
    );

    twiml.redirect(
      "https://" +
        context.DOMAIN_NAME +
        settings.xm_incident +
        "?setting=" +
        encodeURI(JSON.stringify(settings))
    );
    callback(null, twiml);
  }
}; // close handler
