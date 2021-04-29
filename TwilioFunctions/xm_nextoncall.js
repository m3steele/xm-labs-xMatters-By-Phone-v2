exports.handler = function (context, event, callback) {
  console.log("NEXTONCALL");
  var settings = JSON.parse(decodeURI(event.setting));
  let twiml = new Twilio.twiml.VoiceResponse();

  twiml.say(
    { voice: settings.voice },
    "Calling the next on-call resource, " + event.name + ", please stand by.."
  );

  twiml.enqueue(
    {
      waitUrl: settings.holdMusic,
    },
    settings.parentSid
  );

  callback(null, twiml);
};
