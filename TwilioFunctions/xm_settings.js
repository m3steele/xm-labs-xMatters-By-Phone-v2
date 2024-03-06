var got = require('got');

exports.handler = function (context, event, callback) {
  console.log('SETTINGS');

  //***************************************
  // CONFIGURATION
  //
  // Use the following in any of the other functions to log out all settings to help troubleshoot any issues you have
  /*
    for (var key in settings) {
      console.log("key: " + key + " = " + JSON.stringify(settings[key]));
    }
  */
  //***************************************
  setting = {};

  // NOTE about Twilio Trial Accounts
  // Trial accounts will play a message before executing your code. Upgrade to paid account to remove this message.
  // Twilio Trial accounts can only call verified phone numbers. Phone Numbers => Verified Caller ID

  //***************************************
  // INTEGRATION GENERAL SETTINGS
  //***************************************

  // What options would you like to use with this integration?
  // "Alert" : Allows creation of an xMatters Event / Alert over the phone.
  // "Conference" : Allows creation of an xMatters Conference Bridge over the phone.
  // "Incident" :  Allows creation of an xMattersIncident over the phone.
  // "Livecall" : Allows speaking directly with the primary on-call of a selected group.
  // The order of this array determines the order of the menu.
  setting.alertTypes = ['Alert', 'Conference', 'Incident', 'Livecall'];

  //***************************************
  // TWILIO SETTINGS
  //***************************************

  // Twilio Voice model to use
  // https://www.twilio.com/docs/voice/twiml/say/text-speech#polly-standard-and-neural-voices
  //
  // 'Polly.Joanna', 'Polly.Kendra','Polly.Kimberly','Polly.Salli',
  // 'Polly.Joey','Polly.Justin','Polly.Matthew'
  // Adding "-Neural" to end of one of the names above will make the voice more natural sounding
  setting.voice = 'Polly.Joanna-Neural';

  // A verified phone number to be used as the outgoing caller ID when calling on-call agent directly
  // Instructions on how to Verify a phone number in Twilio.
  // https://support.twilio.com/hc/en-us/articles/223180048-Adding-a-Verified-Phone-Number-or-Caller-ID-with-Twilio
  // Failing to set a Verified number here will set the initiating phone number to the caller id
  setting.callerID = '15555555555';

  //***************************************
  // XMATTERS SETTINGS
  //***************************************
  // xMatters Base URL
  // Do not include trailing slash
  setting.xmatters = 'https://company.cs1.xmatters.com';

  // Number of escalation levels
  // This option allows you to control the number of levels of on-call you would like to call.
  // This helps if you have multiple people in a group but dont want to call everyone.
  // Example: xMatters groups with 5 people on call and you only want to call the primary, secondard and tertiary
  // Seting this option to 3 will stop calls from going to 4th and 5th levels.
  setting.escLevels = '3';

  // xMatters Webservice username and password
  // https://help.xmatters.com/ondemand/user/apikeys.htm
  setting.xm_user = 'x-api-key-d061a0ae';
  setting.xm_pass = '9f7420d0-f938-40fd';

  // This is the Inbound HTTP Trigger URL for "On-Call Alert" workflow.
  // Found by: Workflows => Initiate Event via Phone Call => Flows => "Initiate Event via Phone Call" Flow => Double click "Initiate by Phone Setting" Step
  // Make sure to set authenticating user to the webservice user above.
  setting.xmattersHTTP = '/api/integration/1/functions/e6deb630-5172/triggers?apiKey=91643be0-b878';

  // This is the Flow designer http trigger to alert group if no answer"
  setting.noanswerHTTP = '/api/integration/1/functions/8b1e9be8-bd3b-4143/triggers?apiKey=7ed099c5-5b27';

  // xMatter conference bridge number
  // Hint: Open an xMatters messaging form with an xMatters conference bridge and preview the message.
  // This will show the conference phone number, assuming it is part of the messaging template body.
  setting.xmconference = '18777777777';

  // Whether the call-in user should be automatically transferred to the conference bridge once it is opened by xMatters
  setting.transfer_to_bridge = true;

  // This option allows you to set a default severity for incidents.
  // This can be set to "1","2","3","4","5" or ""
  // Setting this to a number (1 to 5) will make that the default severity.
  // Setting this to an empty string "" will prompt the user and ask for the severity of the incident
  setting.defaultSeverity = ''; // "1","2","3","4","5" or ""

  // List of xMatters userId's that are allowed to initiate this integration
  // The caller ID initiating this event must be a voice device listed on an xMatters user profile
  // When this feature is activated, the initiating phone must not restrict the caller id.
  // Allow any phone number to initiate: Authorized_Users = [];
  // Allow specific users to initiate: Authorized_Users = ["jsmith","rtopper"];
  Authorized_Users = [];

  // Set the xMatters Group Names.
  // Group names must match the name of your xMatters groups exactly.
  // You can add additional Groups by adding parameters to the array below.
  // You must add at least one group
  // Providing a single group will automatically target that group and Group selection will be skipped.
  // This array must have the same number of elements and be in the same order as the xMatters_Groups array above.
  setting.xMatters_Groups = ['CAB Approval', 'Cloud DevOps', 'Database Infrastructure', 'Database'];

  // Set the Twilio Group Name.
  // You can add additional punctuation, spaces, dashes and upper case letters to group names to help the text to speech engine pronounce it better.
  // This array must have the same number of elements as the xMatters_Groups array above.
  setting.Speak_Groups = ['C.A.B. Approval', 'Cloud DevOps.', 'Database Infrastructure', 'Database'];

  // Do not change this setting.
  setting.NumberofGroups = setting.xMatters_Groups.length;

  //***************************************
  // BITLEY SETTINGS
  //***************************************

  // Bitley Access Token
  // This setting is HIGHLY recommended. Failing to provide this setting will result in very long URLs and ruin the effectiveness default SMS messages.
  // You could use an alternate URL shortening service, but code changes would be required in xm_shorten script
  // If you do not want to use bitly to shorten URLs, provide an invalid token or an empty value.
  setting.bitly_token = 'b58207fe58966c3';

  //***************************************
  // HOLD MUSIC SETTINGS
  //***************************************

  // Hold music is played for the initiating user while they wait for the integration to find an on-call resource.
  // This url needs to point to a twiml script that contains music files.
  // You can use any of the following twiml scripts from Twilio labs: https://www.twilio.com/labs/twimlets/holdmusic
  // Fair warning, the music contained in these scripts might make your ears bleed.
  // http://twimlets.com/holdmusic?Bucket=com.twilio.music.ambient
  // http://twimlets.com/holdmusic?Bucket=com.twilio.music.classical
  // http://twimlets.com/holdmusic?Bucket=com.twilio.music.electronica
  // http://twimlets.com/holdmusic?Bucket=com.twilio.music.guitars
  // http://twimlets.com/holdmusic?Bucket=com.twilio.music.newage
  // http://twimlets.com/holdmusic?Bucket=com.twilio.music.rock
  // http://twimlets.com/holdmusic?Bucket=com.twilio.music.soft-rock
  // Alternatively, provide your own hold music by customizing the holdMusic.xml file and referencing it below.
  setting.holdMusic = 'http://twimlets.com/holdmusic?Bucket=com.twilio.music.classical';

  //***************************************
  // MESSAGE PHRASE SETTINGS
  //***************************************

  // The call in user will be required to wait on the phone while transcribing of the recorded message takes place.
  // During this variable wait time, the integration will read jokes, pre-defined phrases or repeat a static phrase.
  setting.waitPhrasetype = 'joke'; //"joke", "phrase", "static"

  // Random Joke API
  // https://icanhazdadjoke.com/api
  // This is used to kill time while the integration transcribes audio to text.
  // Random jokes will play while you wait to relieve stress and make your day better.
  // This feature is called in /xm_message script. Disabling this feature will play random phrases instead so the user isn't confused about the wait
  setting.jokeUrl = 'https://icanhazdadjoke.com';

  // Wait Phrases
  // Phrases to play while the user is waiting.
  // Phrases will be played in order that they appear below.
  // Add additional phrases if you'd like.
  // Depending on the time it takes to transcribe audio, not all phrases will play.
  waitPhrase = [];
  waitPhrase.push('Your transcription is not quite finished.');
  waitPhrase.push('Thanks for your patients, it wont be long.');
  waitPhrase.push('Good things come to those who wait.');
  waitPhrase.push("I'm still working on it.");
  //waitPhrase.push("Add more phrases here...");
  setting.waitPhrase = waitPhrase;

  // Static wait Phrase. Setting this setting to an empty string result in dead air and can be confusing.
  setting.waitPhraseStatic = 'Thanks for waiting, im still working on it...';

  //***************************************
  // SPEAK PHRASES
  //***************************************

  // Generally, it is not recommended that you make changes to these settings.
  // These settings are used to construct the phrases spoken to the user while interacting with this integration

  // These phrases will be used if there are no groups configured in setting.xMatters_Groups and Speak_Groups.
  if (setting.NumberofGroups === 1) {
    setting.Alert_Phrase = "Sure, I'll send an Alert to " + setting.Speak_Groups[0] + ' group. ';
    setting.Conference_Phrase = "Sure, I'll start a conference bridge and invite " + setting.Speak_Groups[0] + ' group. ';
    setting.Incident_Phrase = "Sure, I'll create an xMatters incident targeting " + setting.Speak_Groups[0] + ' group. ';
    setting.Livecall_Phrase = "Sure, I'll connect you to speak with the primary on call for " + setting.Speak_Groups[0] + ' group. ';
  }

  //***************************************
  // DO NOT MAKE CHANGES BELOW THIS COMMENT
  //***************************************

  // This defines the path for each of the functions in this integration.
  // Values here must match the function names in Twilio.

  setting.xm_settings = '/xm_settings';
  setting.xm_action = '/xm_action';
  setting.xm_incident = '/xm_incident';
  setting.xm_group = '/xm_group';
  setting.xm_livecall = '/xm_livecall';
  setting.xm_escalate = '/xm_escalate';
  setting.xm_nextoncall = '/xm_nextoncall';
  setting.xm_connect = '/xm_connect';
  setting.xm_record = '/xm_record';
  setting.xm_confirmRec = '/xm_confirmRec';
  setting.xm_shorten = '/xm_shorten';
  setting.xm_message = '/xm_message';
  setting.xm_bridgeforward = '/xm_bridgeforward';
  setting.xm_endqueue = '/xm_endqueue';

  // set caller id to twilio number if not set in settings above.
  if (setting.callerID == '') {
    setting.callerID = event.To;
  }

  // Sets up the Group targeting menu.
  // You probably shouldn't change this but if you must, be careful.
  for (i = 0; i < setting.NumberofGroups; i++) {
    if (i === 0) {
      setting.Group_Speak_Text = '';
    }
    digit = i + 1;
    setting.Group_Speak_Text += 'Press ' + digit + ' for ' + setting.Speak_Groups[i] + '. ';
  }
  if (setting.NumberofGroups === 0) {
    setting.Group_Speak_Text = '';
  }

  // Sets up the Action selection menu for each alertTypes.
  // You probably shouldn't change this but if you must, be careful.
  setting.options = {};
  var alert = {};
  var conference = {};
  var incident = {};
  var livecall = {};
  if (setting.alertTypes.includes('Alert')) {
    alert.d = parseInt(setting.alertTypes.indexOf('Alert') + 1);
    alert.m = 'Press ' + parseInt(setting.alertTypes.indexOf('Alert') + 1) + ' to alert an x matters group.';
  } else {
    alert.d = '';
    alert.m = '';
  }

  if (setting.alertTypes.includes('Conference')) {
    conference.d = parseInt(setting.alertTypes.indexOf('Conference') + 1);
    conference.m = 'Press ' + parseInt(setting.alertTypes.indexOf('Conference') + 1) + ' to create an x  matters conference.';
  } else {
    conference.d = '';
    conference.m = '';
  }

  if (setting.alertTypes.includes('Incident')) {
    incident.d = parseInt(setting.alertTypes.indexOf('Incident') + 1);
    incident.m = 'Press ' + parseInt(setting.alertTypes.indexOf('Incident') + 1) + ' to create an x  matters incident.';
    setting.options.Incident = incident;
  } else {
    incident.d = '';
    incident.m = '';
  }

  if (setting.alertTypes.includes('Livecall')) {
    livecall.d = parseInt(setting.alertTypes.indexOf('Livecall') + 1);
    livecall.m = 'Press ' + parseInt(setting.alertTypes.indexOf('Livecall') + 1) + ' to speak directly with the primary on call.';
  } else {
    livecall.d = '';
    livecall.m = '';
  }
  setting.options.Alert = alert;
  setting.options.Conference = conference;
  setting.options.Incident = incident;
  setting.options.Livecall = livecall;

  // Add parent CallSid;
  setting.parentSid = event.CallSid;

  // Get user devices from xMatters and compare with CallerID
  var promises = [];
  if (Authorized_Users.length > 0) {
    for (var user in Authorized_Users) {
      console.log('Checking if User is Authorized: ' + Authorized_Users[user]);
      promises.push(get_auth(Authorized_Users[user]));
    }
  }
  // User Authorization disabled push Yes to promises array
  else {
    promises.push('Yes');
  }

  Promise.all(promises)
    .then(function (results) {
      console.log('Final Authentication Results: ', results);

      // If we find a user who is authorized proceed  - Temporarily changed from -1 to allow all users to authenticate
      if (results.indexOf('Yes') > -1) {
        let twiml = new Twilio.twiml.VoiceResponse();

        twiml.redirect(
          {
            method: 'POST',
          },
          'https://' + context.DOMAIN_NAME + setting.xm_action + '?setting=' + encodeURI(JSON.stringify(setting))
        );

        callback(null, twiml);
      }
      // We did not find an athorized user exit
      else {
        let twiml = new Twilio.twiml.VoiceResponse();
        twiml.say(
          {
            voice: 'alice',
          },
          'Sorry, you are not authorized for this. Please speak with your x matters admin'
        );

        callback(null, twiml);
      }
    })
    .catch(function (e) {
      console.log('error', e);
    });

  function get_auth(user) {
    const promise = new Promise((resolve, reject) => {
      return get_xm_devices(user)
        .then(value => resolve(value))
        .catch(error => reject(error));
    });

    return promise;
  }

  function get_xm_devices(user) {
    console.log('Getting devices for (' + user + ')');

    return got(setting.xmatters + '/api/xm/1/people/' + user + '/devices', {
      headers: {
        accept: 'application/json',
        Authorization: 'Basic ' + Buffer.from(setting.xm_user + ':' + setting.xm_pass).toString('base64'),
      },
      json: true,
    })
      .then(function (response) {
        resdata = response.body.data;
        console.log('get_xm_devices Response ' + JSON.stringify(resdata));

        for (var device in resdata) {
          // User has voice device, check if the caller Id on initiating phone exists.
          if (resdata[device].deviceType === 'VOICE') {
            console.log("Get VOICE Device: '" + JSON.stringify(resdata[device].phoneNumber) + ' Initiating Phone: ' + JSON.stringify(event.From));

            // Authorized. User Voice device matching caller ID found.
            if (resdata[device].phoneNumber === event.From) {
              return 'Yes';
            }
          }
        }
        return 'No';
      })
      .catch(function (error) {
        console.log('get_xm_devices error ' + error);

        // We'll just skip the 404, if the user isn't found, then
        // user wouldn't be auth'd anyway
        if (error.statusCode != 404) callback(error);

        // Boo, there was an error.
        let twiml = new Twilio.twiml.VoiceResponse();
        twiml.say(
          {
            voice: 'alice',
          },
          'Oops, something went wrong. The event has not been sent. You will need to send this event directly from x matters.'
        );
      });
  }
};
