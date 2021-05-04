exports.handler = function (context, event, callback) {
  console.log('ESCALATE');
  let settings = JSON.parse(decodeURI(event.setting));
  let targets = JSON.parse(decodeURI(event.targets));

  let twiml = new Twilio.twiml.VoiceResponse();
  const client = context.getTwilioClient();
  let escalation = parseInt(event.escalation, 10) + 1;

  // catch callback for completed calls that we dont want to do anythign with.
  // Allow no-answer and busy to call next on-call resource
  if (event.cb && event.CallStatus !== 'no-answer' && event.CallStatus !== 'busy') {
    console.log('Caught callback');
    return callback(null, twiml);
  }
  // Make call to next on-call agent
  else {
    // event.CallStatus === "in-progress" && !event.nodigits : First initiating call
    // event.CallStatus === "completed" && event.nodigits === "true" : Calls that were answered but no digits press
    //  event.CallStatus === "no-answer"  || event.CallStatus === "busy" : Calls that are not answered and no digits or phone is busy
    if (
      targets.length > parseInt(event.escalation, 10) &&
      parseInt(event.escalation, 10) < settings.escLevels &&
      ((event.CallStatus === 'in-progress' && !event.nodigits) ||
        (event.CallStatus === 'completed' && event.nodigits === 'true') ||
        event.CallStatus === 'no-answer' ||
        event.CallStatus === 'busy')
    ) {
      console.log('==============MAKING API CALL===============');

      let payload = {};
      settings.thisTarget = '';
      payload.url =
        'https://' +
        context.DOMAIN_NAME +
        settings.xm_connect +
        '?setting=' +
        encodeURI(JSON.stringify(settings)) +
        '&targets=' +
        encodeURI(JSON.stringify(targets)) +
        '&escalation=' +
        parseInt(event.escalation, 10);
      payload.statusCallbackEvent = ['completed'];
      payload.method = 'POST';
      payload.statusCallback =
        'https://' +
        context.DOMAIN_NAME +
        settings.xm_escalate +
        '?setting=' +
        encodeURI(JSON.stringify(settings)) +
        '&targets=' +
        encodeURI(JSON.stringify(targets)) +
        '&escalation=' +
        escalation +
        '&cb=true';
      payload.from = settings.callerID;
      payload.to = targets[parseInt(event.escalation, 10)].voice;
      payload.timeout = 60; // controls how long to call the resource.

      // Connect initiating caller to queue and hang up on answerd calls with no digits
      if (!event.nodigits) {
        twiml.enqueue(
          {
            waitUrl: settings.holdMusic,
          },
          settings.parentSid
        );
      }
      // Hangup when on-call resource answers and does not enter digits or it goes to vm
      else {
        twiml.hangup();
      }

      // Place call to oncall resource
      client.calls
        .create(payload)
        .then(call => {
          return call;
        })
        .then(res => {
          console.log('Call created ' + JSON.stringify(res));

          // If escalating update caller with next on-call resource name
          if (parseInt(event.escalation, 10) > 0) {
            client
              .calls(settings.parentSid)
              .update({
                url:
                  'https://' +
                  context.DOMAIN_NAME +
                  settings.xm_nextoncall +
                  '?setting=' +
                  encodeURI(JSON.stringify(settings)) +
                  '&name=' +
                  encodeURI(targets[parseInt(event.escalation, 10)].fullName) +
                  '&targets=' +
                  encodeURI(JSON.stringify(targets)) +
                  '&escalation=' +
                  parseInt(event.escalation, 10),
              })
              .then(res => {
                callback(null, twiml);
              });
          } else {
            callback(null, twiml);
          }
        });
    } else {
      console.log('No more users on-call');
      client
        .calls(settings.parentSid)
        .update({
          url:
            'https://' +
            context.DOMAIN_NAME +
            settings.xm_endqueue +
            '?setting=' +
            encodeURI(JSON.stringify(settings)) +
            '&group=' +
            encodeURI(settings.recipientGroup),
        })
        .then(res => {
          console.log('Call terminated ' + JSON.stringify(res));

          callback(null, twiml);
        });
    }
  }
};
