exports.handler = function (context, event, callback) {
  console.log("CONNECT");
  var settings = JSON.parse(decodeURI(event.setting));
  var targets = JSON.parse(decodeURI(event.targets));

  let twiml = new Twilio.twiml.VoiceResponse();
  var escalation = parseInt(event.escalation, 10) + 1;

  // No digit initially, play message to on-call person
  if (!event.Digits) {
    const gather = twiml.gather({
      input: "dtmf",
      numDigits: 1,
      timeout: 10,
      action:
        "https://" +
        context.DOMAIN_NAME +
        settings.xm_connect +
        "?setting=" +
        encodeURI(
          JSON.stringify(settings) +
            "&escalation=" +
            escalation +
            "&targets=" +
            encodeURI(JSON.stringify(targets)) +
            "&Digits=" +
            event.Digits
        ),
    });

    gather.say(
      {
        voice: settings.voice,
      },
      "Hello " +
        targets[parseInt(event.escalation, 10)].fullName +
        ", you're on-call in the " +
        settings.recipientGroup +
        " group and someone needs your help. Press any digit to connect with the caller."
    );

    // call next person if no resposne.
    twiml.redirect(
      "https://" +
        context.DOMAIN_NAME +
        settings.xm_escalate +
        "?setting=" +
        encodeURI(
          JSON.stringify(settings) +
            "&escalation=" +
            escalation +
            "&targets=" +
            encodeURI(JSON.stringify(targets))
        )
    );

    callback(null, twiml);
  } else {
    const dial = twiml.dial();
    dial.queue({}, settings.parentSid);

    callback(null, twiml);
  }
};
