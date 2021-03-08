# Initiate xMatters Event by Phone v2 (AKA, Phone Initiation)

This integration will help you to initiate xMatters notifications by calling a Phone number. It allows you to select the type of notification (Alert, conference, Incident, live call), the group you want to target and record a message over the phone that will be transcribed, URL shortened and sent as an xMatters notification.

_Version 2 of the integration has many new features and quality of life enhancements including_:

- Now uses xMatters Flow designer allowing for easy two-way integrations with other applications.
- xMatters form added to automate some of the installation process with Twilio.
- New option added to create an xMatters Incident via phone.
- Creating an xMatters conference bridge can now connect the caller to the conference bridge automatically. No need to call in separately.
- Speak phrases are saved as environment variables and removed from scripts. This allows for modifications to speak phrases without code changes.
- New option added to return to the caller to the main menu.
- Added API connection with a random dad joke generator. Jokes are played while audio is transcribed, and the user is waiting.
- Added configuration item to play random joke, ordered phrases or static phrases while the user waits.
- Various bug fixes.
- Leverages new Twilio features for deploying functions.
- Some Twilio dependencies removed.
- It's now easy to include/exclude each of the phone options for creating an xMatters alert, conference, incident or direct to lead calling.
- Easily change the voice used for speaking text and take advantage of the newest technologies around natural speech.
- Simplified control of whether call in user is authorized to use the integration.

<kbd>
  <img src="https://github.com/xmatters/xMatters-Labs/raw/master/media/disclaimer.png">
</kbd>

# Pre-Requisites

- Twilio account (https://www.twilio.com)
- Twilio Phone number with Calling capabilities.
- Bitly Account for shortening recording URLS. [get one](https://www.bitly.com).
- xMatters account - If you don't have one, [get one](https://www.xmatters.com)!

# Files

- Twilio function files

  - [xm_settings](TwilioFunctions/xm_settings.js)
  - [xm_action](TwilioFunctions/xm_action.js)
  - [xm_group](TwilioFunctions/xm_group.js)
  - [xm_record](TwilioFunctions/xm_record.js)
  - [xm_livecall](TwilioFunctions/xm_livecall.js)
  - [xm_escalate](TwilioFunctions/xm_escalate.js)
  - [xm_confirmRec](TwilioFunctions/xm_confirmRec.js)
  - [xm_shorten](TwilioFunctions/xm_shorten.js)
  - [xm_message](TwilioFunctions/xm_message.js)
  - [xm_incident](TwilioFunctions/xm_incident.js)
  - [xm_bridgeforward](TwilioFunctions/xm_bridgeforward.js)

- [xMatters Initiate Event via Phone Workflow](xMattersPlan/InitiateEventviaPhoneCallv2.zip)

# How it works

- Calling a Twilio Voice enabled phone number will allow you to create a new xMatters event (Alert, Conference, Incident, Livecall) targeting a group of your choice.
- This integration initiates a Twilio function that will play a series of prompts to the caller.
- The caller can press digits on their phone to control the xMatters event that is created.
- The user can record a message over the phone. The audio recording is transcribed and an mp3 audio file is stored on Twilio.
- The URL to the audio recording is shortened using Bitly and both the transcription text and a shortened link to the recording is sent as part of the xMatters Notification.
- The caller ID of the calling phone must belong to a user inside of xMatters and must be configured in the Twilio function. Multiple users can initiate an event, but they must be valid xMatters users. This feature can be disabled to allow any call-in number.
- The Twilio functions will provide telephone prompts to guide you through initiate an xMatters notification.
- You can decide to send a regular xMatters Alert/Notification an xMatters Conference Bridge or to create a new incident.
- You can connect the call-in user directly to the conference bridge as soon as xMatters opens it. No need to call back into the bridge.
- You can connect directly to the primary on call for a group and your call will escalate to the next on call if the phone is not answered.
- You can predefine up to 9 xMatters groups that can be target with your notification. You can select the group you would like to target using xMatters from phone prompts.
- The content of the message can be configured in the xMatters workflow.

## Integration Function Workflow

1. User Calls Twilio Voice enabled phone number.

2. Twilio Function **xm_settings** is initiated.

   - This file contains all the settings for the integration
   - Performs authentication based on the calling phone Caller ID.
   - Phones that block / hide the Caller ID will not be able to use this integration.

3. Twilio Function **xm_action** is initiated.

   - Prompts the user to:

     1. Create a regular xMatters Alert. => Initiates **xm_group** function.
     2. Create an xMatters Alert with a Conference Bridge. => Initiates **xm_group** function.
     3. Create an xMatters Incident => Initiates **xm_group** function => Initiates **xm_incident** function.
     4. Initiate a live call with the primary on call for a group. => Initiates **xm_livecall**

   - All event types above will target the same xMatters Workflow (On-Call Resource Alert)

<kbd>
  <img src="/media/flow.png">
</kbd>

```
  Hey there, What's the problem?
  Press 1 to alert an xMatters group.
  Press 2 to start an xMatters conference bridge.
  Press 3 to start an xMatters incident.
  Press 4 to speak directly with the primary on call.
  Press * at any time to return to this menu.
```

4. Twilio Function **xm_group** is initiated.
   - Prompts the user to select a target group for the notification.
   - Configure up to 9 groups as options in the prompts.
   - If creating an xMatters incident, this function will redirect to **xm_incident** script and prompt the user for an incident severity.
   - Setting **defaultSeverity** setting will use the value set instead of redirecting to **xm_incident** script. This means the user will not have the opportunity to set the severity.

```
What group would you like to alert. Press 1 for xyz. Press 2 for jkl. Press 3 for mno.
What group would you like to invite to the conference. Press 1 for xyz. Press 2 for jkl. Press 3 for mno.
What group would you like to invite to the incident. Press 1 for xyz. Press 2 for jkl. Press 3 for mno.
```

5. Twilio Function **xm_incident** is initiated.

   - Prompts the user to select an incident severity from 1 to 5.
   - This step can be bypassed by setting a value for **defaultSeverity** property.
   - User can provide a severity by dialing 1, 2, 3, 4, 5.
   - Incident severity drives the incident severity in xMatters and the event priority as follows:

   | Digit | xMatters Event Priority | xMatters Incident Severity |
   | ----- | ----------------------- | -------------------------- |
   | 1     | HIGH                    | Critical                   |
   | 2     | HIGH                    | High                       |
   | 3     | MEDIUM                  | Medium                     |
   | 4     | MEDIUM                  | Low                        |
   | 5     | LOW                     | Minimal                    |

```
What severity is the incident, dial 1 to 5?
```

6. Twilio Function **xm_livecall** is initiated.
   - Prompts the user to select a target group to speak with the primary on call.
   - Makes a GET request to xMatters to get Who's on call details about the group.
   - Nested groups (Group inside of a Group up to n levels), temporary absence with and without replacements, empty groups, users with no devices and groups with devices are all supported.
   - Dynamic Teams are not supported.
   - Handles cases where no users are on call or do not have a voice device.
   - Creates an ordered list of on call members with voice devices.
   - Attempts to connect to the first on call member in the group. => After first call is made **xm_escalate** is initialized.

```
What group would you like to speak directly with. Press 1 for xyz. Press 2 for jkl. Press 3 for mno.
Calling Admin Group, primary on call "John Smith", good luck with your problem.
```

7. Twilio Function **xm_escalate** is initiated.

   - Handles escalations to the next on-call when phone is not answer within 17 seconds.
   - An answering machine will stop the process and will result in not connecting with someone live. - 17 seconds is typically short enough that voicemail will not answer. This setting can be changed. - The system adds a 5 second buffer to the timeout setting provided. 12 seconds + 5 second buffer = 17 seconds.

     Line 27: ... **'timeout':12** ...

```
Calling the next on call, "Henry Stephens", good luck.
Calling the next on call, "nth member", good luck.
If no member answers the phone, caller is sent back to the xm_action.
```

8. Twilio Function **xm_record** is initiated.
   - Prompts the user to record a message over the phone.

```
Record your message after the beep. Press 1 if you are happy with your recording, any other key to restart.
```

9. Twilio Function **xm_confirm** is initiated.
   - Handles the case where user wants to re-record the message.
   - Moves the script to the next function if the user is happy with the recording.

```
Record your message after the beep. Press 1 if you are happy with your recording, any other key to restart.
```

10. Twilio Function **xm_shorten** is initiated.

- Sends the recording URL to Bitly where the long form URL is shortened.
- If there is an error shortening the URL we will continue on using the long version of the URL.

```
Long Recording URL:
https://api.twilio.com/2010-04-01/Accounts/AC3e82fb9a36dc3babf7617/Recordings/RE9f98203f4201a34920fd1748c8

Converted to:
http:/bit.ly/2sjdsis2
```

11. Twilio Function **xm_message** is initiated.

- Plays a message while user is waiting for the recording transcription to complete.
- Message can be configured using **waitPhrasetype** setting. Can be either "joke", "phrase" or "static".
- **Joke**: This will retrieve and speak a random dad joke from https://icanhazdadjoke.com/.
- **Phrase**: This will loop through a series of wait phrases set in the **waitPhrase** setting array.
- **Static**: This will play the single wait phrase set in **waitPhraseStatic** setting.
- This function continuously loops checking the transcription status every 5 seconds.
- The time this step takes to complete will vary depending on the length of the recorded message.
- When the transcription status changes to "completed" an API call to xMatters is made to initiate the new event.
- The user is notified if the event was successfully created in xMatters or if there was a problem injecting the event.
- Recordings / Transcriptions have a length limitation from 2 to 90 seconds. Recordings outside of this range will fail.
- When making a conference call if the setting transfer_to_bridge = true, the user will be directed to **xm_bridgeforward** function

**Wait Messages**

    *Joke*:

    ```
    - What do you call corn that joins the army? Kernel.
    - What’s the longest word in the dictionary? Smiles. Because there’s a mile between the two S’s.
    - What do you call a dad that has fallen through the ice? A Popsicle.

    ```

    *Phrases*:

    ```
    - Your transcription is not quite finished.
    - Thanks for your patients, it won't be long.
    - Good things come to those who wait.
    - I'm still working on it.
    ```

    *Static*:

    ```
    - Thanks for waiting, i'm still working on it...
    ```

**Event Sent to xMatters**

    ```
    - Sit back and relax, xMatters is taking care of business. Goodbye.
    - Oops, something went wrong. The event has not been sent. You will need to send this event directly from xMatters.
    ```

12. Twilio Function **xm_bridgeforward** is initiated.

- **transfer_to_bridge** setting allows the call-in user to be automatically transferred to the xMatters conference bridge when it is ready.
- setting **transfer_to_bridge** = _true_ will transfer to the xMatters bridge when it is ready
- setting **transfer_to_bridge** = _false_ will terminate the phone call once the xMatters event is created

13. xMatters Inbound HTTP Trigger (Initiate by Phone)

- This inbound HTTP trigger starts the xMatters Workflow
- You can customize this Flow and integrate with other applications.
- The inbound HTTP Trigger will create the following outputs:

  - Recipients
  - Audio URL
  - Description
  - Short Description
  - Type
  - Severity

# Installation

## Create an xMatters Integration User

This integration requires a user who can authenticate REST web service calls when injecting events.

This user needs to be able to work with events but does not need to update administrative settings. While you can use the default Company Supervisor role to authenticate REST web service calls, the best method is to create a user specifically for this integration with the "REST Web Service User" role that includes the permissions and capabilities.

**Note**: If you are installing this integration into an xMatters trial instance, you don't need to create a new user. Instead, locate the "Integration User" sample user that was automatically configured with the REST Web Service User role when your instance was created and assign them a new password. You can then skip ahead to the next section.

**Note 2**: This user won't be able to "see" other users with the Company Supervisor role and so won't be able to authenticate

**To create an integration user:**

1. Log in to the target xMatters system.
2. On the **Users** tab, click the **Add New User** icon.
3. Enter the appropriate information for your new user.
   Example username: **Twilio_API_User**
4. Assign the user the **REST Web Service User** role.
5. Click **Save**.

Make a note of the username and password that you set; you will need them when configuring other parts of this integration.

The integration username and password will be needed when configuring the Twilio xm_settings Function:
**xm_user** and **xm_pass**

<br><br>

## Import and Configure the xMatters Workflow

The next step is to import the Workflow

To import the workflow:

1. In the target xMatters system, on the **Workflows** tab, click **Import**.
2. Click **Browse**, and then locate the downloaded workflow: [xMatters Initiate Event via Phone Call Workflow](xMattersPlan/InitiateEventviaPhoneCall.zip)
3. Click **Import**.
4. Once the workflow has been imported, make sure that it is **Enabled**
5. Click on the workflow name (Initiate Event via Phone Call v2)
6. For the **On-Call Resource Alert** form, in the **Not Deployed** drop-down list, click **Enable for Web Service**.
7. After you Enable for Web Service, the drop-down list label will change to **Web Service**.
8. In the **Web Service** drop-down list, click **Sender Permissions**.
9. Add the **Twilio_API_User** you created above, and then click **Save Changes**.

Repeat steps 6 to 9 for **On-Call Resource Conference** form.

**Special Note:** The **Twilio_API_User** will always initiate the xMatters event for this integration. A separate setting inside the Twilio **xm_settings** function will control whether the calling phone/person is allowed to initiate an xMatters event using this integration. Assuming the person is calling from a phone with a caller ID matching a user in xMatters and the **xm_settings** configuration, an event will be created by the **Twilio_API_User**.

<br><br>

# Configure Speak Phrases

Speak phrases control what the integration will say to the user.

These phrases only need to be changed if you do not like the phrases.

When first setting up this integration, before using the xMatters installation form, you should change these from xMatters Workflow Constants.
[xMatters Constants](https://help.xmatters.com/ondemand/xmodwelcome/integrationbuilder/constants.htm)

<kbd>
  <img src="/media/xm-constants.png">
</kbd>

After the integration has been installed, these should be changed in Twilio under environment variables.
[Twilio Environment Variables](https://www.twilio.com/docs/runtime/functions/functions-editor/variables)

Twilio => Functions => Services => xMattersByPhone => Settings => Environment Variables

After changing environment variables in Twilio you will need to Click
**Deploy All** button before the new variables will be used.

<kbd>
  <img src="/media/twilio-env.png">
</kbd>

| **Speak Phrase**       | **Description**                                                                                                                                                                                                                                                                                                               |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intro_Phrase           | The initial introduction phrase before any instructions. The first thing you hear.                                                                                                                                                                                                                                            |
| Alert_Phrase           | Plays when Option to create xMatters Alert is selected.                                                                                                                                                                                                                                                                       |
| Conference_Phrase      | Plays when Option to Create xMatters Conference Bridge is selected.                                                                                                                                                                                                                                                           |
| Incident_Phrase        | Plays when Option to Create xMatters Incident is selected.                                                                                                                                                                                                                                                                    |
| Severity_Phrase        | Played to gather incident severity. You cannot change the expected digits for the integration by changing this phrase.                                                                                                                                                                                                        |
| Livecall_Phrase        | Plays when Option to speak directly with on-call resource is selected.                                                                                                                                                                                                                                                        |
| Menu_Phrase            | Instructions for returning to main menu if you want to start over. This is played at the end of initial menu instructions and start can be dialed at any time to return to the main menu. The only way to return to the main menu is by dialing star (\*) changing this phrase will not change the way the integration works. |
| Restart_Phrase         | Played when a user dials star to return to the main menu.                                                                                                                                                                                                                                                                     |
| Invalid_Phrase         | Played when user enters an invalid digit.                                                                                                                                                                                                                                                                                     |
| Record_Phrase          | Played as instructions for recording a message. Changing the instructions here will not change the integrations. Dialing 1 will still save the recording and anything else will end it.                                                                                                                                       |
| Record_Fail_Phrase     | Played when dialing 2,3,4,5,6,7,8,9,0,# to restart a recording.                                                                                                                                                                                                                                                               |
| Record_Success_Phrase  | Played when a message is successfully recorded.                                                                                                                                                                                                                                                                               |
| xMatters_Phrase        | Played when an xMatters Alert or Incident has been created successfully and just before the phone connection is terminated.                                                                                                                                                                                                   |
| Emptyoncall_Phrase     | Played when there is no one on-call for the selected groups when using live call action.                                                                                                                                                                                                                                      |
| Noanswer_Phrase        | Played when the primary on-call does not answer the phone.                                                                                                                                                                                                                                                                    |
| Openbridge_Phrase      | Played while an xMatters bridge is being opened before the user is connected.                                                                                                                                                                                                                                                 |
| Livecall_Fail_Phrase   | Played when a live call fails to connect or some other miscellaneous error happens.                                                                                                                                                                                                                                           |
| Xmatters_Fail_Phrase   | Played when an event fails to send over to xMatters.                                                                                                                                                                                                                                                                          |
| Transcribe_Fail_Phrase | Played when a transcription fails. Usually when a recording is either less than 2 seconds or greater than 90 seconds in length.                                                                                                                                                                                               |
| Shorten_Fail_Phrase    | Played when shortening a recording URL fails.                                                                                                                                                                                                                                                                                 |

| **Speak Phrase**       | **Default Value**                                                                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intro_Phrase           | Hey there, What's the problem?                                                                                                                    |
| Alert_Phrase           | What group would you like to alert?                                                                                                               |
| Conference_Phrase      | What group would you like to invite to the conference?                                                                                            |
| Incident_Phrase        | What group would you like to invite to the incident?                                                                                              |
| Livecall_Phrase        | What group would you like to speak directly with?                                                                                                 |
| Menu_Phrase            | Press star at any time to return to this menu.                                                                                                    |
| Restart_Phrase         | Let's try again.                                                                                                                                  |
| Invalid_Phrase         | Invalid Digit. Listen carefully.                                                                                                                  |
| Record_Phrase          | Record your message after the beep. Press 1 when you are happy with your recording, any other key to restart.                                     |
| Record_Fail_Phrase     | Without failure, there is no achievement. Let's try again.                                                                                        |
| Record_Success_Phrase  | You are a natural! I've sent this over to x matters.                                                                                              |
| xMatters_Phrase        | Sit back and relax, x matters is taking care of business. Goodbye.                                                                                |
| Emptyoncall_Phrase     | There is no one with a voice device on call right now. You might want to try another group or a different type of alert.                          |
| Noanswer_Phrase        | It's all fun and games, then the Primary On call forgets to answer the phone... You might want to try another group or a different type of alert. |
| Openbridge_Phrase      | xMatters is spinning up the conference bridge, I will connect you when it's ready.                                                                |
| Livecall_Fail_Phrase   | Oops, something went wrong. Please try again.                                                                                                     |
| Xmatters_Fail_Phrase   | Oops, something went wrong. The event has not be1en sent. You will need to send this event directly from x matters.                               |
| Transcribe_Fail_Phrase | I'm sorry, something went wrong transcribing your audio. We need to make the recording again.                                                     |
| Shorten_Fail_Phrase    | There was a problem shortening the recording u.r.l but do not worry, we will proceed with the long one instead.                                   |

## Create Twilio Account

1. Create a Free Twilio account [here](https://www.twilio.com/try-twilio)

## Purchase Twilio Voice Number.

1. Search "Buy a Number" and click "Buy a Number":

<kbd>
  <img src="/media/Buy-Number.png" width="250px">
</kbd>

2. Perform a Twilio phone number search.

<kbd>
  <img src="/media/Phone-Search.png" width="550px">
</kbd>

3. Make sure the number you select has Voice Capabilities and Buy Number.

<kbd>
  <img src="/media/Buy-Phone.png" width="550px">
</kbd>

`
This integration will work with a Twilio Trial account but will have the following limitations.

1. A message about using a Twilio Trial account will play before your integration scripts run.
2. You will only be able to make outgoing calls to Verified Caller ID's.
   [Twilio => Phone Numbers => Verified Caller IDs](https://www.twilio.com/console/phone-numbers/verified)
   [Twilio Help](https://support.twilio.com/hc/en-us/articles/223180048-Adding-a-Verified-Phone-Number-or-Caller-ID-with-Twilio)

You should upgrade your Twilio account to a paid account.

## Add Twilio Authentication Credentials to xMatters Endpoints

We need your Twilio authentication credentials for xMatters to communicate with Twilio.

1. Go to Twilio [Admin Console](https://www.twilio.com/console)
2. Copy Account SID and Account Token. These will act as your username and password.
3. Open the Initiate Event via Phone Call v2 workflow in xMatters.
4. Click Flows tab.
5. Click Components and go to Endpoints
6. Set authentication for Twilio and Twilio Upload Service Endpoints.

   Twilio Account SID => Username
   Twilio Account Token => Password

## Deploy a Twilio Service using xMatters Install Integration Form

This will programmatically create a Twilio Service and create all of the required environment variables into Twilio.

Before doing this step you should make sure you have configured xMatters Workflow Constants and xMatters endpoints for Twilio.

In the future this step may be enhanced to also deploy function versions (script) in Twilio and completely automate the installation process.
To deploy a function version to Twilio, the API request must be multipart/form-data and this is not currently supported by xMatters.

1. Open the Install Integration xMatters Form. Make sure it is deployed to Web UI or you will not be able to find/use it.
2. Set form fields appropriately.

   **Twilio Service Name**: This will be the name of the service created in Twilio.

   **Functions to Deploy**: These are the names of the functions to create in Twilio. Currently this feature does not do anything.

3. Click Send Message.

   - Re-running this form in the future will return any changed environment variables in Twilio back to the value in the corresponding xMatters constant.
   - This form does not need to target any recipients.
   - Instead of using this form, you could create a Twilio Service and add all of the Environment Variables manually.

## Configure Twilio Service

In this step we will be adding Twilio functions and dependencies to the service we just deployed.

### Open Twilio Service

1. Log into Twilio.
2. Go to Functions.
3. Click Services. You should see the Twilio service we deployed from xMatters. Default name is **xMattersByPhone**
4. Open **xMattersByPhone** service.

### Add Dependency

1. From the Twilio Service, click on Dependencies.
2. Add the following dependencies:

| Module | Version |
| ------ | ------- |
| got    | 6.7.1   |

### Add Functions

1. Click **Add +** Button
2. Select **Add Function**
3. Name the function according to table below (example: xm_settings, xm_action, xm_group ...) and press **enter**. The function will open.
4. Clear the default Twilio Code from the function.
5. **Copy** and **Paste** the appropriate function script into the Twilio Script editor and press **Save**.
6. Repeat until all functions have been added.

   **Twilio Function Scripts**

   - [xm_settings](TwilioFunctions/xm_settings.js)
   - [xm_action](TwilioFunctions/xm_action.js)
   - [xm_group](TwilioFunctions/xm_group.js)
   - [xm_record](TwilioFunctions/xm_record.js)
   - [xm_livecall](TwilioFunctions/xm_livecall.js)
   - [xm_escalate](TwilioFunctions/xm_escalate.js)
   - [xm_confirmRec](TwilioFunctions/xm_confirmRec.js)
   - [xm_shorten](TwilioFunctions/xm_shorten.js)
   - [xm_message](TwilioFunctions/xm_message.js)
   - [xm_incident](TwilioFunctions/xm_incident.js)
   - [xm_bridgeforward](TwilioFunctions/xm_bridgeforward.js)

## Configure Twilio "xm_settings" Functions

1. Log into Twilio.
2. Go to Functions.
3. Click Services.
4. Open **xMattersByPhone** service. Might be different if you renamed this service.
5. Click **xm_settings** function.
6. Configure each setting as described below:

<br><br>

### Alert Types

```js
setting.alertTypes = ['Alert', 'Conference', 'Incident', 'Livecall'];
```

This setting controls what actions the integration will allow.
You can include whatever types that you would like the integration to use.
You must include at least one item.

- **Alert** : Allows creation of an xMatters Event / Alert over the phone.
- **Conference** : Allows creation of an xMatters Conference Bridge over the phone.
- **Incident** : Allows creation of an xMattersIncident over the phone.
- **Oncall** : Allows speaking directly with the primary on-call of a selected group.

### Twilio Voice Model

```js
setting.voice = 'Polly.Joanna-Neural';
```

The Twilio [Voice Model](https://www.twilio.com/docs/voice/twiml/say/text-speech#polly-standard-and-neural-voices) to use for speaking text.

**Recommended values**:

- Polly.Joanna
- Polly.Kendra
- Polly.Kimberly
- Polly.Salli
- Polly.Joey
- Polly.Justin
- Polly.Matthew

Adding "_-Neural_" to the end of one of the names above, will make the voice sound more natural.

- Polly.Joanna-Neural
- Polly.Kendra-Neural
- Polly.Kimberly-Neural
- Polly.Salli-Neural
- Polly.Joey-Neural
- Polly.Justin-Neural
- Polly.Matthewv

### Outgoing Caller ID

```js
// A verified phone number to be used as the outgoing caller ID when calling on-call agent directly
// Instructions on how to Verify a phone number in Twilio.
// https://support.twilio.com/hc/en-us/articles/223180048-Adding-a-Verified-Phone-Number-or-Caller-ID-with-Twilio
// Failing to set a Verified number here will set the initiating phone number to the caller id
setting.callerID = '15555555555';
```

### xMatters Base URL and Webservice User

```js
// xMatters Base URL
// Do not include trailing slash
setting.xmatters = 'https://company.cs1.xmatters.com';

// xMatters Webservice username and password
// https://help.xmatters.com/ondemand/user/apikeys.htm
setting.xm_user = 'x-api-key-d061a0ae';
setting.xm_pass = '9f7420d0-f938-40fd7';
```

| **xMatters Base URL and Webservice User** |                                                                                  |
| ----------------------------------------- | -------------------------------------------------------------------------------- |
| xmatters                                  | The base URL of your xMatters environment. Example: https://company.xmatters.com |
| xm_user                                   | The username of the xMatters Twilio_API_User                                     |
| xm_pass                                   | The password of the xMatters Twilio_API_User                                     |

Further instructions [here](#create-an-xmatters-integration-user)

### Inbound Integration URLS

```js
// This is the Inbound HTTP Trigger URL for "On-Call Alert" workflow.
// Found by: Workflows => Initiate Event via Phone Call => Flows => "Initiate Event via Phone Call" Flow => Double click "Initiate by Phone Setting" Step
// Make sure to set authenticating user to the webservice user above.
setting.xmattersHTTP = 'https://company.cs1.xmatters.com/api/integration/1/functions/e6deb630-5172-xxx/triggers?apiKey=91643be0-b878-4317-xxx';
```

| **Integration URLS** | [Get the xMatters Inbound Integration Endpoints](#get-the-xmatters-inbound-integration-endpoints) |
| -------------------- | ------------------------------------------------------------------------------------------------- |
| setting.xmattersHTTP | The inbound HTTP trigger endpoint ULR for the On-Call Alert workflow.                             |

Further instructions [here](#get-the-xmatters-inbound-http-trigger-endpoint)

<br><br>

### xMatters Conference Bridge Number

```js
// xMatters conference bridge number
// Hint: Open an xMatters messaging form with an xMatters conference bridge and preview the message.
// This will show the conference phone number, assuming it is part of the messaging template body.
setting.xmconference = '18779595418';
```

This is the phone number you need to call to join an xMatters bridge. It does not include the bridge number.

### Transfer to Conference

```js
// Whether the call-in user should be automatically transferred to the conference bridge once it is opened by xMatters
setting.transfer_to_bridge = true;
```

This controls whether you want the initiating user to be automatically connected to the conference bridge once it is opened.

### Default Severity

```js
// This option allows you to set a default severity for incidents.
// This can be set to "1","2","3","4","5" or ""
// Setting to a number will make that the default severity.
// Setting to an empty string "" will prompt the user and ask for the severity of the incident
setting.defaultSeverity = ''; // "1","2","3","4","5" or ""
```

### xMatters Authenticated Users

```js
// List of xMatters userId's that are allowed to initiate this integration
// The caller ID initiating this event must be a voice device listed on an xMatters user profile
// When this feature is activated, the initiating phone must not restrict the caller id.
// Allow any phone number to initiate: Authorized_Users = [];
// Allow specific users to initiate: Authorized_Users = ["jsmith","rtopper"];
Authorized_Users = ['userid1', 'userid2', 'userid3'];
```

- This is a comma separated list of xMatters userID's. Each UserID must be in quotations and separated by a comma.
- The integration will check if a user listed here has a Voice device in xMatters matching the caller ID of the person calling your Twilio number to initiate an xMatters event.
- If the caller ID that is calling your Twilio number matches a voice device of a user in xMatters listed in the **Authorized_Users** array, the function will proceed.
- If the caller ID that is calling your Twilio number does not match a voice device of a user in xMatters listed in the **Authorized_Users** array, the function will play a not authorized message and terminate the call.
- Setting this value to an empty array will disabled user authentication. Example: **Authorized_Users** = []

<br><br>

### Group Configuration

```js
// Set the xMatters Group Names.
// Group names must match the name of your xMatters groups exactly.
// You can add additional Groups by adding parameters to the array below.
// You must add at least one group
// Providing a single group will automatically target that group and Group selection will be skipped.
// This array must have the same number of elements as the Speak_Group array below.
setting.xMatters_Groups = ['CAB Approval', 'Cloud DevOps', 'Database Infrastructure'];

// Set the Twilio Group Name.
// You can add additional punctuation, spaces, dashes and upper case letters to group names to help the text to speech engine pronounce it better.
// This array must have the same number of elements and be in the same order as the xMatters_Groups array above.
setting.Speak_Groups = ['C.A.B. Approval', 'Cloud DevOps.', 'Database Infrastructure'];

// Do not change this setting or the integration will not work.
setting.NumberofGroups = setting.xMatters_Groups.length;
```

| **Integration URLS**    |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| setting.xMatters_Groups | Listing of Group Names, exactly how they are configured in xMatters. You will be able to send the xMatters notifications to any of the groups listed here. You can have up to 9 groups. If you want to target multiple groups at the same time, we suggest creating a group with child groups and targeting the parent group from this integration. You could also use xMatters userID's to target individuals. If you dont wan't to use this option set it to **setting.xMatters_Groups** = []; Be sure to do the same for **setting.Speak_Groups**. |
| setting.Speak_Groups    | Your group names may not always be easy for the Twilio text-to-speech engine to read. This option lets you type your groups names in the same order as in **settings.xMatters_Groups** but spell them in a way that the text-to-speech engine understands. You must have the same number of groups listed here in the same order as **settings.xMatters_Groups**. Failing to do so will cause unintended behaviours.                                                                                                                                  |
| setting.NumberofGroups  | The number of Groups listed inside **xMatters_Groups** array. Changing this will break the integration.                                                                                                                                                                                                                                                                                                                                                                                                                                               |

<br><br>

### Bitley Access Token

```js
// Bitley Access Token
setting.bitly_token = 'scasoiueco23a432jcndl3s43a4cjdsalijfaweiud';
```

#### Create a Bitly Account

- Use your Bitly Access Token generated [here](#create-a-bitly-account).

<br><br>

### Message Phrase Settings

```js
// The call-in user will be required to wait on the phone while transcribing of the recorded message takes place.
// During this variable wait time, the integration will read jokes, pre-defined phrases or repeat a static phrase.
setting.waitPhrasetype = 'joke'; //"joke", "phrase", "static"
```

The call-in user will be required to wait on the phone while transcribing of the recorded message takes place.
During this variable wait time, the integration will read jokes, pre-defined phrases or repeat a static phrase.

```js
// Random Joke API
// https://icanhazdadjoke.com/api
// This is used to kill time while the integration transcribes audio to text.
// Random jokes will play while you wait to relieve stress and make your day better.
// This feature is called in /xm_message script. Disabling this feature will play random phrases instead so the user isn't confused about the wait
setting.jokeUrl = 'https://icanhazdadjoke.com';
```

This uses a free jokes api to deliver random jokes during the phone call while the user is waiting for the recording to be processed.

```js
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
```

You can modify these how you see fit or add additional phrases.

```js
setting.waitPhrase = waitPhrase;
// Static wait Phrase. Setting this setting to an empty string result in dead air and can be confusing.
setting.waitPhraseStatic = "Thanks for waiting, i'm still working on it...";
```

Use this if you just want to set a static phrase. Setting this to an empty string will remove the wait phrase entirely. This may lead to confusion on the phone as the caller will hear nothing while they wait.

## Deploy Twilio Service

Once you have configured and saved the **xm_settings** function you are ready to deploy the Twilio service.

1. Go to Functions.
2. Click Services.
3. Open **xMattersByPhone** service. Might be different if you renamed this service.
4. Click **Deploy All** button.
5. Wait for the Twilio Service to be deployed and display success message in the live logs.

## Configure Twilio Voice Number.

1. Go to **Phone Numbers**.

   <kbd>
     <img src="/media/Menu-Phone-Numbers.png"  width="250px">
   </kbd>

2. Go to **Manage Numbers**.

   <kbd>
      <img src="/media/Menu-Manage-Numbers.png"  width="250px">
    </kbd>

3. Click on the phone number you just purchased.

4. In the **Voice & Fax** section configure what happens when a **Call Comes in**, select the function relating to **xm_settings**.

   **A CALL COMES IN**: Function
   **SERVICE**: xMattersByPhone
   **ENVIRONMENT**: ui
   **FUNCTION PATH**: xm_settings

<kbd>
  <img src="/media/Call-in.png" width="550px">
</kbd>

<br><br>

## Get the xMatters Inbound HTTP Trigger Endpoint

1. Go to **Flows** tab.
2. Click on **On-Call Resource Alert** flow.
3. Double click **Initiate By Phone** inbound http trigger step.
4. Set the **Twilio_API_User** to **Authenticating User**
5. Copy the endpoint URL displayed on the right side of the screen.
6. Save the endpoint URL as we will use it in our Twilio **xm_settings** function later.

You must supervise of **Twilio_API_User** in order to select it. This user must also have a Web Service User Role. If you cannot select the **Twilio_API_User** if it because you do not supervise that user, or they do not have the REST Web Service User role.

This URL should be set for the **xmattersHTTP** setting inside of the Twilio function **xm_settings**.

<kbd>
  <img src="/media/xm-httpTrigger.png">
</kbd>

<br><br>

## Create a Bitly Account

1. Go to [Bitly.com](https://www.bitly.com) and create a new account.

2. Hamburger Menu -> Your profile -> Generic Access Token

3. Enter your Bitly password.

4. Click Generate Token.

5. Copy Access token.

6. Save the token as we will use it in our Twilio **xm_settings** function.

<br><br>

## Test the Integration.

1. Call your Twilio number.

2. Test your configuration and all of the call prompts making sure it works as expected.

<br><br>

# Troubleshooting

\*Most of the issue you could encounter have to do with the configuration of the **xm_settings** function in Twilio.
Use this Twilio resource for help with debugging functions:
https://www.twilio.com/docs/runtime/functions/debugging

\*Alternatively, you can check the Inbound Integration Activity Log in xMatters:
https://help.xmatters.com/ondemand/xmodwelcome/integrationbuilder/create-inbound-updates.htm
