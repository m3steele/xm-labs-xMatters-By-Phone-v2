exports.handler = function (context, event, callback) {
  console.log("CONFIRM REC");
  var settings = JSON.parse(decodeURI(event.setting));
  let twiml = new Twilio.twiml.VoiceResponse();

  // Remove some messaging elements from settings to allow for longer transcription text
  // Transcription text is added to a url parameterfor passing between functions.
  // The length of url parameters is limited and will become truncated and cause errors if it gets too long.
  // This block of code removes a bunch of settings that we no longer need to free up characters for transcription.
  // Remove from event.settings
  event.setting.options = "none";
  event.setting.Group_Speak_Text = "none";
  event.setting.xMatters_Groups = ".";
  event.setting.Speak_Groups = ".";

  // Remove from settings before getting added back to event.settings.
  settings.options = "none";
  settings.Group_Speak_Text = "none";
  settings.xMatters_Groups = ".";
  settings.Speak_Groups = ".";

  // Recording is good
  if (event.Digits === "1") {
    console.log("Happy with Recording");

    twiml.say(
      { voice: settings.voice, loop: 1 },
      "Hang on while I transcribe your audio."
    );

    twiml.pause({ length: 5 });
    twiml.redirect(
      "https://" +
        context.DOMAIN_NAME +
        settings.xm_shorten +
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
        "&Message_Phrase=" +
        encodeURI(event.Message_Phrase) +
        "&RecordingSid=" +
        event.RecordingSid
    );

    callback(null, twiml);
  } else if (event.Digits !== "1" && event.Digits !== undefined) {
    console.log("Not happy with recording");

    // * redirects to begining
    if (event.Digits === "*") {
      twiml.say({ voice: settings.voice, loop: 1 }, context.Restart_Phrase);
      twiml.redirect("https://" + context.DOMAIN_NAME + settings.xm_settings);
      callback(null, twiml);
    }

    // Skip the failure message in the case that transcription failure. We pass 00 as digits before starting this funciton for only this special case. This is passed from xm_message
    if (event.Digits !== "00") {
      twiml.say({ voice: settings.voice, loop: 1 }, context.Record_Fail_Phrase);
    }
    twiml.say({ voice: settings.voice, loop: 1 }, context.Record_Phrase);
    twiml.record({
      timeout: 0,
      transcribe: true,
      maxLength: 90,
      finishOnKey: "1234567890*#",
      action:
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
        encodeURI(event.Message_Phrase),
    });

    callback(null, twiml);
  }
}; // close handler
