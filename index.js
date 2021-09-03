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
  var build = new URLSearchParams();
  var functionNames = request.twilioFunctionstoDeploy.replace(' ', '').split(',');

  for (var fun in functionNames) {
    var data = new FormData();

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
        console.log('FUNCTION VERSION ID: ' + JSON.stringify(response.data.sid));
        build.append('FunctionVersions', response.data.sid);
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
        console.log('ASSET VERSION ID: ' + JSON.stringify(response.data.sid));
        build.append('AssetVersions', response.data.sid);
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

  var url = 'https://serverless.twilio.com/v1/Services/' + request.twilioServiceSid + '/Builds';

  var config = {
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${request.twilioUser}:${request.twilioPassword}`, 'utf8').toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  };

  var buildDetails = await axios
    .post(url, build, config)
    .then(response => {
      console.log(JSON.stringify('Buiulding - URL: ' + response.data.links.build_status));
      return response.data.links.build_status;
    })
    .catch(err => {
      console.log(err);
    });

  //'https://serverless.twilio.com/v1/Services/ZSXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/Builds/ZBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/Status' \
  //'https://serverless.twilio.com/v1/Services/' +  request.twilioServiceSid '/Builds/' + + '/Status';

  setInterval(function () {
    var url = buildDetails.links.build_status;
    var config = {
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${request.twilioUser}:${request.twilioPassword}`, 'utf8').toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    };

    axios
      .get(url, config)
      .then(response => {
        console.log('build status ' + JSON.stringify(response.data));

        if (response.data.status === 'completed') {
          var deploy = new URLSearchParams();
          var url =
            'https://serverless.twilio.com/v1/Services/' +
            request.twilioServiceSid +
            '/Environments/' +
            request.twilioEnvironmentSid +
            '/Deployments';
          deploy.append('BuildSid', buildDetails.sid);

          var config = {
            headers: {
              Authorization: 'Basic ' + Buffer.from(`${request.twilioUser}:${request.twilioPassword}`, 'utf8').toString('base64'),
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          };

          axios
            .post(url, deploy, config)
            .then(response => {
              console.log(JSON.stringify('Deploy status: ' + response.data));
              return;
            })
            .catch(err => {
              console.log(err);
            });
          return;
        }
      })
      .catch(err => {
        console.log(err);
      });
  }, 5000); //10000 milliseconds = 10 seconds
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
