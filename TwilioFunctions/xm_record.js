exports.handler = function (context, event, callback) {
  console.log('RECORD');
  let settings = JSON.parse(decodeURI(event.setting));
  let twiml = new Twilio.twiml.VoiceResponse();

  if (event.Digits !== '*') {
    // Check if group has any members on call. Does not matter what devices are present.
    got(settings.xmatters + '/api/xm/1/on-call-summary?groups=' + encodeURIComponent(settings.xMatters_Groups[parseInt(event.Digits, 10) - 1]), {
      headers: {
        accept: 'application/json',
        Authorization: 'Basic ' + Buffer.from(settings.xm_user + ':' + settings.xm_pass).toString('base64'),
      },
      json: true,
    })
      .then(function (response) {
        console.log('Get oncall Status Code: ' + response.statusCode);
        let json = response.body;

        // Response body is an array of on-call recipients
        if (response.statusCode === 200 && json.length === 0) {
          console.log('No on-call members found');
          // play message and return to main menu.
          twiml.say(
            { voice: settings.voice },
            'There are no members on-call in the ' + settings.xMatters_Groups[parseInt(event.Digits, 10) - 1] + 'group. Please try another group.'
          );
          twiml.redirect('https://' + context.DOMAIN_NAME + settings.xm_settings + '?Digits=*');
          callback(null, twiml);
        }

        // Group selection is correct move on to recording
        // when NumberofGroups is 1 then we come here directly from xm_action
        if (
          (event.Digits !== undefined &&
            parseInt(event.Digits) <= settings.NumberofGroups &&
            parseInt(event.Digits) !== 0 &&
            settings.NumberofGroups > 1) ||
          (settings.NumberofGroups === 1 && parseInt(event.Digits, 10) <= settings.alertTypes.length)
        ) {
          // Add recipient Group to the event payload for later
          // This deals with the case of targeting only 1 group
          // Add selection confirmation phrase when only targeting 1 group
          let confirmationPhrase = '';
          if (settings.NumberofGroups === 1) {
            event.recipient = settings.xMatters_Groups[0];
            if (parseInt(event.Digits, 10) === settings.options.Alert.d) {
              event.what = 'Alert';
              confirmationPhrase = settings.Alert_Phrase;
            }
            if (parseInt(event.Digits, 10) === settings.options.Conference.d) {
              event.what = 'Conference';
              confirmationPhrase = settings.Conference_Phrase;
            }
            if (parseInt(event.Digits, 10) === settings.options.Incident.d) {
              event.what = 'Incident';
              // We dont need confirmation phrase here as its played from xm_group function
              confirmationPhrase = '';
            }
            if (parseInt(event.Digits, 10) === settings.options.Livecall.d) {
              event.what = 'Livecall';
              confirmationPhrase = settings.Livecall_Phrase;

              // Send digit - 1 for first element in groups array. Required fo livecall to initiate to the first / only group
              twiml.say({ voice: settings.voice, loop: 1 }, confirmationPhrase);

              twiml.redirect(
                'https://' +
                  context.DOMAIN_NAME +
                  settings.xm_livecall +
                  '?setting=' +
                  encodeURI(JSON.stringify(settings)) +
                  '&what=' +
                  event.what +
                  '&Digits=' +
                  '1' +
                  '&severity=none'
              );
              callback(null, twiml);
            }
          }
          // This is for when there are more than 0 groups and user selects target group from phone.
          else {
            // Adds a Recipient element to the Event Object which will be passed to xMatters to target the appropriate group.
            // the element in xMatters_Groups is one less than the digit recieved from user input.
            let index = parseInt(event.Digits, 10) - 1;
            event.recipient = settings.xMatters_Groups[index];
          }
          // Record User message
          //
          twiml.say({ voice: settings.voice, loop: 1 }, confirmationPhrase + ' ' + context.Record_Phrase);
          twiml.record({
            timeout: 0,
            transcribe: true,
            maxLength: 90,
            finishOnKey: '1234567890*#',
            action:
              'https://' +
              context.DOMAIN_NAME +
              settings.xm_confirmRec +
              '?setting=' +
              encodeURI(JSON.stringify(settings)) +
              '&what=' +
              event.what +
              '&severity=' +
              event.severity +
              '&recipient=' +
              encodeURI(event.recipient) +
              '&Message_Phrase=' +
              encodeURI(event.Message_Phrase),
          });

          callback(null, twiml);
        }

        // If group selection is incorrect(> 1 group) or axtion phrase incorrect (< 1 group), repeat the step
        else {
          // * redirects to begining
          if (event.Digits === '*') {
            twiml.say({ voice: settings.voice, loop: 1 }, context.Restart_Phrase);
            twiml.redirect('https://' + context.DOMAIN_NAME + settings.xm_settings);
            callback(null, twiml);
          }
          // If there are more than 1 groups then we need to repeat group selection phrases
          if (settings.NumberofGroups > 1) {
            twiml.say({ voice: settings.voice, loop: 1 }, context.Invalid_Phrase);

            const gather = twiml.gather({
              input: 'dtmf',
              numDigits: 1,
              timeout: 10,
              action:
                'https://' +
                context.DOMAIN_NAME +
                settings.xm_record +
                '?setting=' +
                encodeURI(JSON.stringify(settings)) +
                '&what=' +
                event.what +
                '&severity=' +
                event.severity +
                '&Message_Phrase=' +
                encodeURI(event.Message_Phrase),
            });
            gather.say({ voice: settings.voice, loop: 1 }, event.Message_Phrase + settings.Group_Speak_Text);

            twiml.redirect(
              'https://' +
                context.DOMAIN_NAME +
                settings.xm_record +
                '?setting=' +
                encodeURI(JSON.stringify(settings)) +
                '&Message_Phrase=' +
                encodeURI(event.Message_Phrase) +
                '&what=' +
                event.what +
                '&severity=' +
                event.severity +
                '&Digits=' +
                event.Digits
            );
            callback(null, twiml);
          }
          // else there is only 1 group  we need to repeat main menu action phrases
          else {
            console.log('Incorrect digit repeat action phrase');
            twiml.say({ voice: settings.voice, loop: 1 }, context.Invalid_Phrase);

            const gather = twiml.gather({
              input: 'dtmf',
              numDigits: 1,
              timeout: 10,
              action: 'https://' + context.DOMAIN_NAME + settings.xm_record + '?setting=' + encodeURI(JSON.stringify(settings)),
            });

            gather.say(
              { voice: settings.voice, loop: 1 },
              settings.options.Alert.m + ' ' + settings.options.Conference.m + ' ' + settings.options.Incident.m + ' ' + settings.options.Livecall.m
            );
            twiml.redirect(
              'https://' + context.DOMAIN_NAME + settings.xm_record + '?setting=' + encodeURI(JSON.stringify(settings)) + '&Digits=' + event.Digits
            );
            callback(null, twiml);
          }
        }
      })
      .catch(function (error) {
        console.log('error ' + JSON.stringify(error));

        // play message and return to main menu.
        twiml.say(
          { voice: settings.voice },
          'There are no members on-call in the ' + settings.xMatters_Groups[parseInt(event.Digits, 10) - 1] + 'group. Please try another group.'
        );
        twiml.redirect('https://' + context.DOMAIN_NAME + settings.xm_settings + '?Digits=*');

        callback(null, twiml);
      });
  } else {
    // * redirects to begining
    if (event.Digits === '*') {
      twiml.play({ loop: 1 }, context.Restart_Phrase);

      twiml.redirect('https://' + context.DOMAIN_NAME + settings.xm_settings + '?Digits=*');
      callback(null, twiml);
    }
  }
}; // close handler
