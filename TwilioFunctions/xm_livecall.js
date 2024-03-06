let got = require('got');
exports.handler = function (context, event, callback) {
  console.log('LIVECALL');
  let settings = JSON.parse(decodeURI(event.setting));
  let twiml = new Twilio.twiml.VoiceResponse();

  if (parseInt(event.Digits) <= parseInt(settings.NumberofGroups) && parseInt(event.Digits) !== 0) {
    if (event.groupIndex === undefined) {
      // Adds a Recipient element to the Event Object which will be passed to xMatters to target the group.
      // the element in xMatters_Groups is one less than the digit recieved from user input.
      let index = parseInt(event.Digits) - 1;
      event.recipient = settings.xMatters_Groups[index];
    } else {
      let targets = JSON.parse(decodeURI(event.targets));
      let groupIndex = parseInt(event.groupIndex);

      event.recipient = targets[groupIndex].targetName;
      // Remove the group we are working on now so we can insert membership in its place
      targets.splice(groupIndex, 1);
    }

    //***************************************
    //Get Whos-On-call
    //***************************************
    let currenttime = new Date();
    console.log('Getting Group On Call ' + event.recipient);
    return got(
      settings.xmatters +
        '/api/xm/1/on-call?groups=' +
        encodeURIComponent(event.recipient) +
        '&membersPerShift=100' +
        '&at=' +
        currenttime.toISOString(),
      {
        headers: {
          accept: 'application/json',
          Authorization: 'Basic ' + Buffer.from(settings.xm_user + ':' + settings.xm_pass).toString('base64'),
        },
        json: true,
      }
    )
      .then(function (response) {
        console.log('Get Group ' + JSON.stringify(response.statusCode) + JSON.stringify(response.body));
        response = response.body;

        // If groupIndex is undefined this must be the first time looking for groups
        if (event.groupIndex === undefined) {
          var oncallTarget = [];
        }
        // There is a group index we need to look up the group and get oncall
        else {
          var oncallTarget = targets;
        }

        console.log('oncallTarget ' + JSON.stringify(oncallTarget));

        let oncall_array = [];
        // Check if there are any members in the group. If there are not record no primary on call and continue.
        if (response['data'][0]['members'] === undefined) {
          console.log('No Members');
          // Group with no member, remove from oncallTargets
          oncallTarget.splice(groupIndex, 1);
          oncall_array.push(oncallTarget);
          return oncall_array;
        }

        // Get each member thats on call

        let targetArray = [];

        for (let m in response['data'][0]['members']['data']) {
          console.log(
            'Fetch the Group Members: ' +
              response['data'][0]['members']['data'][m]['member']['targetName'] +
              ' ' +
              response['data'][0]['members']['data'][m]['member']['status'] +
              ' ' +
              response['data'][0]['members']['data'][m]['member']['recipientType']
          );

          // Check if ACTIVE
          if (response['data'][0]['members']['data'][m]['member']['status'] === 'ACTIVE') {
            // Check if recipientType = PERSON
            if (response['data'][0]['members']['data'][m]['member']['recipientType'] === 'PERSON') {
              //Check for replacement
              if (response['data'][0]['members']['data'][m]['absences'] !== undefined) {
                for (let a in response['data'][0]['members']['data'][m]['absences']['data']) {
                  if (response['data'][0]['members']['data'][m]['absences']['data'][a]['absenceType'] !== 'VACANCY') {
                    console.log('HAS Absence, GET REPLACEMENT');
                    // Compare current time in UTC to response['data'][0]['members']['data'][0]['absences']['data'][a]['start'] and response['data'][0]['members']['data'][0]['absences']['data'][a]['end']
                    if (
                      currenttime >= new Date(response['data'][0]['members']['data'][m]['absences']['data'][a]['start']) &&
                      currenttime <= new Date(response['data'][0]['members']['data'][m]['absences']['data'][a]['end'])
                    ) {
                      let newTarget = {};
                      newTarget.type = response['data'][0]['members']['data'][m]['member']['recipientType'];
                      newTarget.position = response['data'][0]['members']['data'][m]['position'];
                      newTarget.fullName =
                        response['data'][0]['members']['data'][m]['absences']['data'][a]['replacement']['firstName'] +
                        ' ' +
                        response['data'][0]['members']['data'][m]['absences']['data'][a]['replacement']['lastName'];
                      newTarget.targetName = response['data'][0]['members']['data'][m]['absences']['data'][a]['replacement']['targetName'];
                      newTarget.voice = '';

                      if (event.groupIndex === undefined) {
                        oncallTarget.push(newTarget);
                      } else {
                        oncallTarget.splice(groupIndex, 0, newTarget);
                        groupIndex = groupIndex + 1;
                      }
                    }
                  } // Close VACANCY check
                }
              } else {
                console.log('No Absence, set member to oncall list');
                let newTarget = {};
                newTarget.type = response['data'][0]['members']['data'][m]['member']['recipientType'];
                newTarget.position = response['data'][0]['members']['data'][m]['position'];
                newTarget.fullName =
                  response['data'][0]['members']['data'][m]['member']['firstName'] +
                  ' ' +
                  response['data'][0]['members']['data'][m]['member']['lastName'];
                newTarget.targetName = response['data'][0]['members']['data'][m]['member']['targetName'];
                newTarget.voice = '';

                if (event.groupIndex === undefined) {
                  oncallTarget.push(newTarget);
                } else {
                  oncallTarget.splice(groupIndex, 0, newTarget);
                  groupIndex = groupIndex + 1;
                }
              } // Close else and Absence check
            } // Close is PERSON
            else if (response['data'][0]['members']['data'][m]['member']['recipientType'] === 'DEVICE') {
              if (response['data'][0]['members']['data'][m]['member']['deviceType'] === 'VOICE') {
                let newTarget = {};
                newTarget.type = response['data'][0]['members']['data'][m]['member']['recipientType'];
                newTarget.position = response['data'][0]['members']['data'][m]['position'];
                newTarget.fullName =
                  response['data'][0]['members']['data'][m]['member']['owner']['firstName'] +
                  ' ' +
                  response['data'][0]['members']['data'][m]['member']['owner']['lastName'];
                newTarget.targetName = response['data'][0]['members']['data'][m]['member']['owner']['targetName'];
                newTarget.voice = response['data'][0]['members']['data'][m]['member']['phoneNumber'];

                if (event.groupIndex === undefined) {
                  oncallTarget.push(newTarget);
                } else {
                  oncallTarget.splice(groupIndex, 0, newTarget);
                  groupIndex = groupIndex + 1;
                }
              }
            } else if (response['data'][0]['members']['data'][m]['member']['recipientType'] === 'GROUP') {
              console.log('Nested groups');

              let newTarget = {};
              newTarget.type = response['data'][0]['members']['data'][m]['member']['recipientType'];
              newTarget.position = response['data'][0]['members']['data'][m]['position'];
              newTarget.fullName = '';
              newTarget.targetName = response['data'][0]['members']['data'][m]['member']['targetName'];
              newTarget.voice = '';

              if (event.groupIndex === undefined) {
                oncallTarget.push(newTarget);
              } else {
                oncallTarget.splice(groupIndex, 0, newTarget);
                groupIndex = groupIndex + 1;
              }
            }
          } // Close ACTIVE
        } // Close Loop members

        //======================================================================================

        return oncallTarget;
      })
      .then(function (response) {
        let targets = response;
        console.log('Updated targets ' + JSON.stringify(targets));

        for (let gi in targets) {
          if (targets[gi].type === 'GROUP') {
            console.log('Group Found at ' + gi + ' ' + targets[gi].targetName);
            twiml.redirect(
              'https://' +
                context.DOMAIN_NAME +
                settings.xm_livecall +
                '?setting=' +
                encodeURI(JSON.stringify(settings)) +
                '&targets=' +
                encodeURIComponent(JSON.stringify(targets)) +
                '&Message_Phrase=' +
                encodeURI(event.Message_Phrase) +
                '&groupIndex=' +
                gi +
                '&Digits=' +
                event.Digits
            );
            callback(null, twiml);
            return 'group';
          }
        }
        console.log('No groups found, start getting devices.');
        return targets;
      })
      .then(function (response) {
        console.log('after group check : ' + JSON.stringify(response));

        if (response !== 'group') {
          const promises = [];

          let targets = response;

          // Get user devices from xMatters and add to oncall list
          for (let p in targets) {
            console.log('Getting Voice Device for : ' + JSON.stringify(targets[p].targetName));
            promises.push(getVoice(p, targets));
          }

          Promise.all(promises)
            .then(function (results) {
              console.log('FINAL RESULT ' + JSON.stringify(results));
              results = results[0];

              // Clean up target members and remove anyone who does not have a voice device
              if (results !== undefined) {
                // Loop backwords to prevent re-indexing issues with splice
                for (let blank = results.length - 1; blank >= 0; blank--) {
                  if (results[blank].voice === '') {
                    results.splice(blank, 1);
                  }
                }
              }

              // No primary on call members
              if (results === undefined || results.length < 1) {
                console.log('No primary oncall members');
                twiml.say(
                  {
                    voice: settings.voice,
                  },
                  'Sorry, there is no one with a voice device on call right now. Try again later or target a different group.'
                );
                twiml.redirect('https://' + context.DOMAIN_NAME + settings.xm_action + '?setting=' + encodeURI(JSON.stringify(settings)));
                callback(null, twiml);
              }
              // Call the Primary on call
              else if ((results.length > 0 && results[0].type === 'PERSON') || (results[0].type === 'DEVICE' && results[0].hasOwnProperty('voice'))) {
                console.log('Has Primary oncall members');

                let index = parseInt(event.Digits) - 1;
                let recipientGroup = settings.Speak_Groups[index];
                settings.recipientGroup = settings.Speak_Groups[index];

                // Tell user who we are about to call
                twiml.say(
                  {
                    voice: settings.voice,
                  },
                  'Sure, Please stand by while I connect you to the ' +
                    recipientGroup +
                    ' group, primary on call ' +
                    results[0].fullName +
                    '..., good luck with your problem!'
                );

                // Redirect to API Create Call script
                twiml.redirect(
                  'https://' +
                    context.DOMAIN_NAME +
                    settings.xm_escalate +
                    '?setting=' +
                    encodeURI(JSON.stringify(settings)) +
                    '&targets=' +
                    encodeURI(JSON.stringify(results)) +
                    '&escalation=0'
                );

                callback(null, twiml);
              }
            })
            .catch(function (e) {
              console.log('error', e);
              twiml.say(
                {
                  voice: settings.voice,
                },
                context.Livecall_Fail_Phrase
              );
              twiml.redirect('https://' + context.DOMAIN_NAME + settings.xm_action + '?setting=' + encodeURI(JSON.stringify(settings)));
              callback(null, twiml);
            });
        } // Close Group check

        function getVoice(p, targets) {
          const promise = new Promise((resolve, reject) => {
            return get_xm_devices(p, targets)
              .then(value => resolve(value))
              .catch(error => reject(error));
          });
          return promise;
        }
        //==========

        // Get target users Voice Device
        function get_xm_devices(p, targets) {
          return got(settings.xmatters + '/api/xm/1/people/' + targets[p].targetName + '/devices', {
            headers: {
              accept: 'application/json',
              Authorization: 'Basic ' + Buffer.from(settings.xm_user + ':' + settings.xm_pass).toString('base64'),
            },
            json: true,
          })
            .then(function (response) {
              response = response.body;
              console.log('Get Device Response ' + JSON.stringify(response));

              for (let t in response.data) {
                if (response.data[t].deviceType === 'VOICE') {
                  targets[p].voice = response.data[t].phoneNumber;
                }
              }

              console.log('Targets with Voice Devices added: ' + JSON.stringify(targets));
              return targets;
            })
            .catch(function (error) {
              console.log('error ' + error);
              twiml.say(
                {
                  voice: settings.voice,
                },
                context.Livecall_Fail_Phrase
              );
              twiml.redirect('https://' + context.DOMAIN_NAME + settings.xm_action + '?setting=' + encodeURI(JSON.stringify(settings)));
              callback(null, twiml);
            });
        } // Close function
        //=============
      })
      .catch(function (error) {
        console.log('error ' + error);
        twiml.say(
          {
            voice: settings.voice,
          },
          context.Livecall_Fail_Phrase
        );
        twiml.redirect('https://' + context.DOMAIN_NAME + settings.xm_action + '?setting=' + encodeURI(JSON.stringify(settings)));
        callback(null, twiml);
      });
  }
  // If group selection incorrect repeat the step
  else {
    // * redirects to begining
    if (event.Digits === '*') {
      twiml.say({ voice: settings.voice, loop: 1 }, context.Restart_Phrase);
      twiml.redirect('https://' + context.DOMAIN_NAME + settings.xm_settings);
      callback(null, twiml);
    }

    if (event.groupIndex === undefined) {
      twiml.say({ voice: settings.voice, loop: 1 }, context.Invalid_Phrase);

      const gather = twiml.gather({
        input: 'dtmf',
        numDigits: 1,
        timeout: 10,
        action:
          'https://' +
          context.DOMAIN_NAME +
          settings.xm_livecall +
          '?setting=' +
          encodeURI(JSON.stringify(settings)) +
          '&Message_Phrase=' +
          encodeURI(event.Message_Phrase) +
          '&what=' +
          event.what +
          '&Digits=' +
          event.Digits,
      });
      gather.say({ voice: settings.voice, loop: 1 }, event.Message_Phrase + settings.Group_Speak_Text);

      twiml.redirect(
        'https://' +
          context.DOMAIN_NAME +
          settings.xm_livecall +
          '?setting=' +
          encodeURI(JSON.stringify(settings)) +
          '&Message_Phrase=' +
          encodeURI(event.Message_Phrase) +
          '&what=' +
          event.what +
          '&Digits=' +
          event.Digits
      );
      callback(null, twiml);
    }
  }
}; // close handler
