exports.handler = function (context, event, callback) {
  console.log("GROUPS");
  var settings = JSON.parse(decodeURI(event.setting));
  let twiml = new Twilio.twiml.VoiceResponse();

  // User selects 1 - Alert, 2 - Conference Bridge, 3 - Incident, 4 - Live Call
  if (
    (event.Digits !== undefined &&
      settings.alertTypes.length >= parseInt(event.Digits, 10)) ||
    event.severity !== undefined ||
    (event.severity === "none" && event.Digits !== undefined)
  ) {
    // No event severity set yet.
    // Action is either not "create incident" or it's the first time through for create incident.
    if (!event.severity) {
      if (parseInt(event.Digits, 10) === settings.options.Alert.d) {
        Message_Phrase = context.Alert_Phrase;
        what = "Alert";
      }
      if (parseInt(event.Digits, 10) === settings.options.Conference.d) {
        Message_Phrase = context.Conference_Phrase;
        what = "Conference";
      }
      if (parseInt(event.Digits, 10) === settings.options.Incident.d) {
        if (settings.NumberofGroups === 1) {
          var confirmationPhrase = settings.Incident_Phrase;
        } else {
          var confirmationPhrase = "";
        }

        Message_Phrase = confirmationPhrase + context.Severity_Phrase;
        what = "Incident-Initial";
      }
      if (parseInt(event.Digits, 10) === settings.options.Livecall.d) {
        Message_Phrase = context.Livecall_Phrase;
        what = "Livecall";
      }
    }
    // Set Incident Phrase when severity is already defined.
    // This function is recalled after we get incident severity
    else {
      Message_Phrase = context.Incident_Phrase;
      what = "Incident";
    }

    //  Direct to livecall function
    if (what === "Livecall") {
      // only 1 group, redirect with no gather to xm_livecall and include digits=1
      if (settings.NumberofGroups === 1) {
        twiml.redirect(
          "https://" +
            context.DOMAIN_NAME +
            settings.xm_livecall +
            "?setting=" +
            encodeURI(JSON.stringify(settings)) +
            "&Message_Phrase=" +
            encodeURI(Message_Phrase) +
            "&what=" +
            what +
            "&Digits=1"
        );
        callback(null, twiml);
      }

      const gather = twiml.gather({
        input: "dtmf",
        numDigits: 1,
        timeout: 10,
        action:
          "https://" +
          context.DOMAIN_NAME +
          settings.xm_livecall +
          "?setting=" +
          encodeURI(JSON.stringify(settings)) +
          "&Message_Phrase=" +
          encodeURI(Message_Phrase) +
          "&what=" +
          what +
          "&Digits=" +
          event.Digits,
      });

      // repeats the message until a response is recieved
      gather.say(
        { voice: settings.voice, loop: 1 },
        Message_Phrase + settings.Group_Speak_Text
      );

      twiml.redirect(
        "https://" +
          context.DOMAIN_NAME +
          settings.xm_group +
          "?setting=" +
          encodeURI(JSON.stringify(settings)) +
          "&Message_Phrase=" +
          encodeURI(Message_Phrase) +
          "&what=" +
          what +
          "&Digits=" +
          event.Digits
      );
      callback(null, twiml);
    }
    // Redirect to xm_incident so user can set incident severity
    // This only runs first time through on this script
    else if (what === "Incident-Initial") {
      // No default value set
      if (settings.defaultSeverity === "") {
        const gather = twiml.gather({
          input: "dtmf",
          numDigits: 1,
          timeout: 10,
          action:
            "https://" +
            context.DOMAIN_NAME +
            settings.xm_incident +
            "?setting=" +
            encodeURI(JSON.stringify(settings)) +
            "&Message_Phrase=" +
            encodeURI(Message_Phrase) +
            "&what=" +
            what +
            "&Digits=" +
            event.Digits,
        });

        // repeats the message until a response is recieved
        gather.say({ voice: settings.voice, loop: 1 }, Message_Phrase);
        twiml.redirect(
          "https://" +
            context.DOMAIN_NAME +
            settings.xm_group +
            "?setting=" +
            encodeURI(JSON.stringify(settings)) +
            "&Message_Phrase=" +
            encodeURI(Message_Phrase) +
            "&what=" +
            what +
            "&Digits=" +
            event.Digits
        );
        callback(null, twiml);
      }
      // Default value set
      else {
        twiml.redirect(
          "https://" +
            context.DOMAIN_NAME +
            settings.xm_group +
            "?setting=" +
            encodeURI(JSON.stringify(settings)) +
            "&severity=" +
            settings.defaultSeverity
        );

        callback(null, twiml);
      }
    }

    // Gather Group and direct to record function
    else {
      var severityValue = "&severity=";
      severityValue += event.severity ? event.severity : "none";

      // only 1 group, redirect with no gather to xm_record and pass digits through from action script you can get his using what and the settings.options
      if (settings.NumberofGroups === 1) {
        twiml.redirect(
          "https://" +
            context.DOMAIN_NAME +
            settings.xm_record +
            "?setting=" +
            encodeURI(JSON.stringify(settings)) +
            "&Message_Phrase=" +
            encodeURI(Message_Phrase) +
            "&what=" +
            what +
            severityValue +
            "&Digits=" +
            settings.options[what].d
        );
        callback(null, twiml);
      }

      const gather = twiml.gather({
        input: "dtmf",
        numDigits: 1,
        timeout: 10,
        action:
          "https://" +
          context.DOMAIN_NAME +
          settings.xm_record +
          "?setting=" +
          encodeURI(JSON.stringify(settings)) +
          "&Message_Phrase=" +
          encodeURI(Message_Phrase) +
          "&what=" +
          what +
          severityValue,
      });

      // repeats the message until a response is recieved
      gather.say(
        { voice: settings.voice, loop: 1 },
        Message_Phrase + settings.Group_Speak_Text
      );

      twiml.redirect(
        "https://" +
          context.DOMAIN_NAME +
          settings.xm_group +
          "?setting=" +
          encodeURI(JSON.stringify(settings)) +
          "&Message_Phrase=" +
          encodeURI(Message_Phrase) +
          "&what=" +
          what +
          "&Digits=" +
          event.Digits
      );
      callback(null, twiml);
    }
  }

  // Incorrect Digits Repeat last step
  else {
    // * redirects to begining
    if (event.Digits === "*") {
      twiml.say({ voice: settings.voice, loop: 1 }, context.Restart_Phrase);
      twiml.redirect("https://" + context.DOMAIN_NAME + settings.xm_settings);
      callback(null, twiml);
    }

    twiml.say({ voice: settings.voice, loop: 1 }, context.Invalid_Phrase);
    const gather = twiml.gather({
      input: "dtmf",
      numDigits: 1,
      timeout: 10,
      action:
        "https://" +
        context.DOMAIN_NAME +
        settings.xm_group +
        "?setting=" +
        encodeURI(JSON.stringify(settings)),
    });
    gather.say(
      { voice: settings.voice, loop: 1 },
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
        settings.xm_group +
        "?setting=" +
        encodeURI(JSON.stringify(settings))
    );

    callback(null, twiml);
  }
}; // close handler
