//Load HTTP module
const express = require('express');
const FormData = require('form-data');
const axios = require('axios');
const path = require('path');

var fs = require('fs');

const app = express();
const port = process.env.PORT || 8001;

// parse application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));
// parse application/json
app.use(express.json());

app.post('/installfunctions', async function (req, res) {
  res.send('Installing Twilio Function Versions now');
  console.log(JSON.stringify(req.body, null, 2));
  var request = req.body;

  // Create new Twilio Function Version
  var functionNames = request.twilioFunctionstoDeploy.replace(' ', '').split(',');

  for (var fun in functionNames) {
    var data = new FormData();
    var build = new URLSearchParams();
    var myBuild = {};

    const functionPath = path.join(__dirname + '/TwilioFunctions/' + functionNames[fun].replace(' ', '') + '.js');
    data.append('Content', fs.createReadStream(functionPath));
    data.append('Path', functionNames[fun]);
    data.append('Visibility', 'public');

    var config = {
      method: 'post',
      url:
        'https://serverless-upload.twilio.com/v1/Services/' +
        request.twilioServiceSid +
        '/Functions/' +
        request.twilioFunctionSids[functionNames[fun]] +
        '/Versions',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${request.twilioUser}:${request.twilioPassword}`, 'utf8').toString('base64'),
        ...data.getHeaders(),
      },
      data: data,
    };
    await axios(config)
      .then(function (response) {
        // console.log(JSON.stringify(response.data));
        console.log(JSON.stringify(response.data.function_sid));
        build.append('FunctionVersions', response.data.function_sid);
        myBuild.FunctionVersions = response.data.function_sid;

        //{"sid":"ZN564e2183eb08a503b74feac84dcff88d","account_sid":"AC931b01e2978dfc791b5c99658c7301e8","service_sid":"ZS26f9a7b18385aa1c56a0a693964f4520","function_sid":"ZH77608acf092549b5846e2e01d542e61f","path":"/xm_bridgeforward","visibility":"public","date_created":"2021-09-01T22:56:41Z"}
      })
      .catch(function (error) {
        console.log(error);
      });
  } //  close for each Function

  // Create Twilio Assets
  request.twilioAssetstoDeploy = request.twilioAssetstoDeploy.replace(/(\r\n|\n|\r)/gm, '');

  if (request.twilioAssetstoDeploy.split(',').length < 1) {
    var assetNames = [];
    assetNames.push(request.twilioAssetstoDeploy.replace(/(\r\n|\n|\r)/gm, ''));
  } else {
    var assetNames = request.twilioAssetstoDeploy
      .replace(' ', '')
      .replace(/(\r\n|\n|\r)/gm, '')
      .split(',');
  }

  // Create new Twilio Asset Version
  for (var ass in assetNames) {
    var asset = new FormData();

    const assetPath = path.join(__dirname + '/TwilioFunctions/' + assetNames[ass].replace(' ', ''));

    asset.append('Content', fs.createReadStream(assetPath));
    asset.append('Path', assetNames[ass]);
    asset.append('Visibility', 'public');

    var config = {
      method: 'post',
      url:
        'https://serverless-upload.twilio.com/v1/Services/' +
        request.twilioServiceSid +
        '/Assets/' +
        request.twilioAssetSids[assetNames[ass]] +
        '/Versions',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${request.twilioUser}:${request.twilioPassword}`, 'utf8').toString('base64'),
        ...asset.getHeaders(),
      },
      data: asset,
    };
    await axios(config)
      .then(function (response) {
        //console.log(JSON.stringify(response.data));
        console.log('ASSETID: ' + JSON.stringify(response.data.asset_sid));
        build.append('AssetVersions', response.data.asset_sid);
        myBuild.AssetVersions = response.data.asset_sid;
      })
      .catch(function (error) {
        console.log(error);
      });
  } //  close for each asset

  // Create Build
  build.append(
    'Dependencies',
    '[\n   {"name":"lodash","version":"4.17.11"},\n   {"name":"twilio","version":"3.29.2"},\n   {"name":"fs","version":"0.0.1-security"},\n   {"name":"got","version":"6.7.1"},\n   {"name":"xmldom","version":"0.1.27"},{"name":"@twilio/runtime-handler","version":"1.0.1"}\n]'
  );
  myBuild.Dependencies = [
    { name: 'lodash', version: '4.17.11' },
    { name: 'twilio', version: '3.29.2' },
    { name: 'fs', version: '0.0.1-security' },
    { name: 'got', version: '6.7.1' },
    { name: 'xmldom', version: '0.1.27' },
    { name: '@twilio/runtime-handler', version: '1.0.1' },
  ];

  console.log('BUILD:: ' + build);

  console.log('MY BUILD:: ' + JSON.stringify(myBuild));

  myBuild = JSON.stringify(myBuild);

  var config = {
    method: 'post',
    url: 'https://serverless.twilio.com/v1/Services/' + request.twilioServiceSid + '/Builds',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${request.twilioUser}:${request.twilioPassword}`, 'utf8').toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    data: myBuild,
  };
  await axios(config)
    .then(function (response) {
      console.log(JSON.stringify(response.data));
    })
    .catch(function (error) {
      console.log(error);
    });
});

function getTwilFunctions() {
  //var functionNames = ['xm_settings', 'xm_action', 'xm_group', 'xm_record', 'xm_livecall', 'xm_escalate', 'xm_confirmRec', 'xm_shorten', 'xm_message'];

  var functionNames = ['xm_settings'];

  for (var fun in functionNames) {
    var config = {
      method: 'get',
      url: 'https://api.github.com/repos/m3steele/xm-labs-xMatters-By-Phone-v2/contents/TwilioFunctions/' + functionNames[fun] + '.js',
      headers: {
        Accept: 'application/vnd.github.v3.raw',
      },
    };
    axios(config)
      .then(function (response) {
        fs.writeFileSync('/functions/' + functionNames[fun] + '.js', response.data);
      })
      .catch(function (error) {
        console.log(error);
      });
  }
}

//listen for request on port 3000, and as a callback function have the port listened on logged
app.listen(port, () => {
  console.log(`App listening on ${port}`);
});
