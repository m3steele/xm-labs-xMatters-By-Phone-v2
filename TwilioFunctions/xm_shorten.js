var got = require("got");
exports.handler = function (context, event, callback) {
  console.log("SHORTEN");
  var settings = JSON.parse(decodeURI(event.setting));
  let twiml = new Twilio.twiml.VoiceResponse();

  var bitly = {};
  bitly.long_url = event.RecordingUrl;

  got
    .post("https://api-ssl.bitly.com/v4/shorten", {
      body: JSON.stringify(bitly),
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + settings.bitly_token,
      },
    })
    .then(function (response) {
      shorturl = JSON.parse(response.body);
      console.log(shorturl.link);

      twiml.redirect(
        "https://" +
          context.DOMAIN_NAME +
          settings.xm_message +
          "?setting=" +
          encodeURI(JSON.stringify(settings)) +
          "&what=" +
          event.what +
          "&severity=" +
          event.severity +
          "&recipient=" +
          encodeURI(event.recipient) +
          "&RecordingUrl=" +
          event.RecordingUrl +
          "&shorturl=" +
          shorturl.link +
          "&Message_Phrase=" +
          encodeURI(event.Message_Phrase) +
          "&RecordingSid=" +
          event.RecordingSid
      );
      callback(null, twiml);
    })
    .catch(function (error) {
      // Boo, there was an error.
      twiml.say({ voice: settings.voice }, context.Shorten_Fail_Phrase);
      console.log("About to redirect to message");
      twiml.redirect(
        "https://" +
          context.DOMAIN_NAME +
          settings.xm_message +
          "?setting=" +
          encodeURI(JSON.stringify(settings)) +
          "&what=" +
          event.what +
          "&severity=" +
          event.severity +
          "&recipient=" +
          encodeURI(event.recipient) +
          "&RecordingUrl=" +
          event.RecordingUrl +
          "&shorturl=" +
          event.RecordingUrl +
          "&Message_Phrase=" +
          encodeURI(event.Message_Phrase) +
          "&RecordingSid=" +
          event.RecordingSid
      );

      callback(null, twiml);
    });
}; // close handler
