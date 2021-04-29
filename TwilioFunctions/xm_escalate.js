exports.handler = function (context, event, callback) {
  console.log("ESCALATE");
  var settings = JSON.parse(decodeURI(event.setting));
  var targets = JSON.parse(decodeURI(event.targets));

  let twiml = new Twilio.twiml.VoiceResponse();
  const client = context.getTwilioClient();
  var escalation = parseInt(event.escalation, 10) + 1;

  // Make call to on-cal agent
  if (targets.length > parseInt(event.escalation, 10)) {
    console.log("==============MAKING API CALL===============");

    var payload = {};
    settings.thisTarget = "";
    payload.url =
      "https://" +
      context.DOMAIN_NAME +
      settings.xm_connect +
      "?setting=" +
      encodeURI(JSON.stringify(settings)) +
      "&targets=" +
      encodeURI(JSON.stringify(targets)) +
      "&escalation=" +
      parseInt(event.escalation, 10);
    payload.statusCallbackEvent = ["completed"];
    payload.statusCallback =
      "https://" +
      context.DOMAIN_NAME +
      settings.xm_escalate +
      "?setting=" +
      encodeURI(JSON.stringify(settings)) +
      "&targets=" +
      encodeURI(JSON.stringify(targets)) +
      "&escalation=" +
      escalation;
    payload.method = "POST";
    payload.from = settings.callerID;
    payload.timeout = "20";
    payload.to = targets[parseInt(event.escalation, 10)].voice;

    twiml.enqueue(
      {
        waitUrl: settings.holdMusic,
      },
      settings.parentSid
    );
    // Place call to oncall resource
    client.calls
      .create(payload)
      .then((call) => {
        return call;
      })
      .then((res) => {
        console.log("Call created " + JSON.stringify(res));

        // If escalating update caller with next on-call resource name
        if (parseInt(event.escalation, 10) > 0) {
          client
            .calls(settings.parentSid)
            .update({
              url:
                "https://" +
                context.DOMAIN_NAME +
                settings.xm_nextoncall +
                "?setting=" +
                encodeURI(JSON.stringify(settings)) +
                "&name=" +
                encodeURI(targets[parseInt(event.escalation, 10)].fullName) +
                "&targets=" +
                encodeURI(JSON.stringify(targets)) +
                "&escalation=" +
                parseInt(event.escalation, 10),
            })
            .then((res) => {
              callback(null, twiml);
            });
        } else {
          callback(null, twiml);
        }
      });
  } else {
    console.log("No more users on-call");

    client
      .calls(settings.parentSid)
      .update({
        url:
          "https://" +
          context.DOMAIN_NAME +
          settings.xm_endqueue +
          "?setting=" +
          encodeURI(JSON.stringify(settings)) +
          "&group=" +
          encodeURI(settings.recipientGroup),
      })
      .then((res) => {
        console.log("Call terminated " + JSON.stringify(res));

        callback(null, twiml);
      });
  }
};
