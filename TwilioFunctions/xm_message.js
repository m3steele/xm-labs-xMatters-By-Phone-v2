var got = require("got");
exports.handler = function (context, event, callback) {
  console.log("MESSAGE");
  var settings = JSON.parse(decodeURI(event.setting));
  let twiml = new Twilio.twiml.VoiceResponse();

  var url =
    "https://api.twilio.com/2010-04-01/Accounts/" +
    event.AccountSid +
    "/Recordings/" +
    event.RecordingSid +
    "/Transcriptions.json";

  got
    .get(url, {
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(context.ACCOUNT_SID + ":" + context.AUTH_TOKEN).toString(
            "base64"
          ),
      },
    })
    .then(function (response) {
      var json = response.body;
      json = JSON.parse(response.body);
      console.log("Transcrition status: " + json.transcriptions[0].status);

      if (json.transcriptions[0].status === "completed") {
        var xm_url = settings.xmattersHTTP;
        twiml.say({ voice: settings.voice }, context.Record_Success_Phrase);

        // Add last parameters to event
        event.transcriptionText = json.transcriptions[0].transcription_text;
        event.transtatus = json.transcriptions[0].status;
        event.tranduration = json.transcriptions[0].duration;

        got
          .post(xm_url, {
            body: JSON.stringify(event),
            headers: {
              accept: "application/json",
            },
            json: true,
          })
          .then(function (response) {
            var json = response.body;
            console.log("xmatters event " + JSON.stringify(json));

            if (event.what === "Conference" && settings.transfer_to_bridge) {
              console.log("xmatters create Conference");
              twiml.redirect(
                "https://" +
                  context.DOMAIN_NAME +
                  settings.xm_bridgeforward +
                  "?setting=" +
                  encodeURI(JSON.stringify(settings)) +
                  "&requestId=" +
                  json.requestId
              );
              callback(null, twiml);
            } else {
              console.log("xmatters create Alert");
              twiml.say({ voice: settings.voice }, context.xMatters_Phrase);
              callback(null, twiml);
            }
          })
          .catch(function (error) {
            // Boo, there was an error.
            twiml.say({ voice: settings.voice }, context.Xmatters_Fail_Phrase);

            callback(error);
          });
      } else if (json.transcriptions[0].status === "in-progress") {
        if (event.wait === undefined) {
          event.wait = 0;
        }

        if (settings.waitPhrasetype === "joke") {
          got
            .get(settings.jokeUrl, {
              headers: {
                Accept: "application/json",
                "User-Agent":
                  "xMatters Phone API (https://github.com/xmatters/xm-labs-xMatters-By-Phone)",
              },
            })
            .then(function (response) {
              var jokeJson = JSON.parse(response.body);
              if (event.wait === 0) {
                var jokePreable = "... How about a joke while we wait.... ";
              } else {
                var jokePreable = "...";
              }
              event.waitPhrase = jokePreable + jokeJson.joke + "... ";
              redirectFunction(settings, event);
            })
            .catch(function (error) {
              console.log("Joke error " + error);
              event.waitPhrase = "This may take a while, please be patient.";
              redirectFunction(settings, event);
            });
        } else if (settings.waitPhrasetype === "phrase") {
          if (parseInt(settings.waitPhrasetype.length) <= event.wait) {
            event.waitPhrase = settings.waitPhrase[event.wait];
          } else {
            // Reset event.wait to first element
            event.wait = 0;
            event.waitPhrase = settings.waitPhrase[event.wait];
          }

          redirectFunction(settings, event);
        } else {
          event.waitPhrase = settings.waitPhraseStatic;
          redirectFunction(settings, event);
        }
      } else if (json.transcriptions[0].status === "failed") {
        twiml.say(
          { voice: settings.voice, loop: 1 },
          context.Transcribe_Fail_Phrase
        );
        twiml.redirect(
          "https://" +
            context.DOMAIN_NAME +
            settings.xm_confirmRec +
            "?setting=" +
            encodeURI(JSON.stringify(settings)) +
            "&what=" +
            event.what +
            "&severity=" +
            event.severity +
            "&recipient=" +
            encodeURI(event.recipient) +
            "&Message_Phrase=" +
            encodeURI(event.Message_Phrase) +
            "&Digits=" +
            "00"
        );

        callback(null, twiml);
      }
    })
    .catch(function (error) {
      // Handle error
      console.log("errors: " + error);
    });

  function redirectFunction(settings, event) {
    twiml.say({ voice: settings.voice, loop: 1 }, event.waitPhrase);
    twiml.pause({ length: 5 });

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
        event.shorturl +
        "&Message_Phrase=" +
        encodeURI(event.Message_Phrase) +
        "&RecordingSid=" +
        event.RecordingSid +
        "&transtatus=" +
        event.transtatus +
        "&tranduration=" +
        event.tranduration +
        "&wait=" +
        parseInt(event.wait + 1)
    );

    callback(null, twiml);
  }
}; // close handler
