exports.handler = function (context, event, callback) {
  console.log("ESCALATE");
  var settings = JSON.parse(decodeURI(event.setting));
  var targets = JSON.parse(decodeURI(event.targets));
  let twiml = new Twilio.twiml.VoiceResponse();

  var escalation = parseInt(event.escalation, 10) + 1;

  if (event.DialCallStatus === "no-answer" && targets.length > escalation) {
    console.log(
      "Escalation to the next on call " + targets[escalation].fullName
    );

    // Tell user who we are about to call
    twiml.say(
      { voice: settings.voice },
      "Calling the next on call " +
        targets[escalation].fullName +
        "..., good luck!"
    );
    // Make the call to primary on call
    const dial = twiml.dial({
      callerId: settings.callerID,
      timeout: 12,
      action:
        "https://" +
        context.DOMAIN_NAME +
        settings.xm_escalate +
        "?setting=" +
        encodeURI(JSON.stringify(settings)) +
        "&targets=" +
        encodeURI(JSON.stringify(targets)) +
        "&escalation=" +
        escalation,
    });
    dial.number(targets[escalation].voice);
    callback(null, twiml);
  } else if (event.DialCallStatus === "failed" && escalation === 1) {
    twiml.say({ voice: settings.voice }, context.Emptyoncall_Phrase);
    twiml.redirect(
      "https://" +
        context.DOMAIN_NAME +
        settings.xm_action +
        "?setting=" +
        encodeURI(JSON.stringify(settings))
    );
    callback(null, twiml);
  } else {
    twiml.say({ voice: settings.voice }, context.Noanswer_Phrase);
    twiml.redirect(
      "https://" +
        context.DOMAIN_NAME +
        settings.xm_action +
        "?setting=" +
        encodeURI(JSON.stringify(settings))
    );
    callback(null, twiml);
  }
}; // close handler
