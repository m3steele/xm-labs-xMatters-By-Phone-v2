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

  // Clean functions and assets to deploy data
  request.twilioFunctionstoDeploy = request.twilioFunctionstoDeploy.replace(/(\r\n|\n|\r)/gm, '').replace(' ', '');
  request.twilioAssetstoDeploy = request.twilioAssetstoDeploy.replace(/(\r\n|\n|\r)/gm, '').replace(' ', '');

  // Create new Twilio Function Version
  var build = new URLSearchParams();

  //var versions = await createVersions(request);
  //var assets = await createAssets(request);
  build = await createAssetFunction(request, 'Asset', build);
  build = await createAssetFunction(request, 'Function', build);

  // Create Build
  build.append(
    'Dependencies',
    '[\n   {"name":"lodash","version":"4.17.11"},\n   {"name":"twilio","version":"3.29.2"},\n   {"name":"fs","version":"0.0.1-security"},\n   {"name":"got","version":"6.7.1"},\n   {"name":"xmldom","version":"0.1.27"},{"name":"@twilio/runtime-handler","version":"1.0.1"}\n]'
  );
  var buildDetails = await makeBuild(request, build);

  const interval = setInterval(async function () {
    var url = buildDetails.links.build_status;
    var config = {
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${request.twilioUser}:${request.twilioPassword}`, 'utf8').toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    };

    await axios
      .get(url, config)
      .then(response => {
        console.log('Build status ' + JSON.stringify(response.data));

        if (response.data.status === 'completed') {
          makeDeploy(request, buildDetails);
          clearInterval(interval);
        }
      })
      .catch(err => {
        console.log(err);
      });
  }, 5000); //10000 milliseconds = 10 seconds
});

// request - The incoming payload
// type - can be either "Asset" or "Function"
// build - the object containing function and asset versions to deploy
const createAssetFunction = async (request, type, build) => {
  //Asset
  //Function

  //Create path to twilioAssetstoDeploy or twilioFunctionstoDeploy in request
  const twilioTypetoDeploy = 'twilio' + type + 'stoDeploy';
  //Create path to twilioAssetSids or twilioFunctionSids in request
  const twilioTypeSids = 'twilio' + type + 'Sids';

  if (request[twilioTypetoDeploy].split(',').length < 1) {
    var names = [];
    names.push(request[twilioTypetoDeploy]);
  } else {
    var names = request[twilioTypetoDeploy].split(',');
  }

  // Create new Twilio Function or Asset Version
  for (var x in names) {
    var data = new FormData();
    if (type === 'Function') {
      var url = path.join(__dirname + '/TwilioFunctions/' + names[x].replace(' ', '') + '.js');
    } else {
      var url = path.join(__dirname + '/TwilioFunctions/' + names[x].replace(' ', ''));
    }

    data.append('Content', fs.createReadStream(url));
    data.append('Path', names[x]);
    data.append('Visibility', 'public');

    var config = {
      method: 'post',
      url:
        'https://serverless-upload.twilio.com/v1/Services/' +
        request.twilioServiceSid +
        '/' +
        type +
        's/' +
        request[twilioTypeSids][names[x]] +
        '/Versions',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${request.twilioUser}:${request.twilioPassword}`, 'utf8').toString('base64'),
        ...data.getHeaders(),
      },
      data: data,
    };
    await axios(config)
      .then(function (response) {
        console.log(type + ' VERSION ID: ' + JSON.stringify(response.data.sid));
        build.append(type + 'Versions', response.data.sid);
      })
      .catch(function (error) {
        console.log(error);
      });
  } //  close for each asset
  return build;
};

const makeBuild = async (request, build) => {
  var url = 'https://serverless.twilio.com/v1/Services/' + request.twilioServiceSid + '/Builds';

  var config = {
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${request.twilioUser}:${request.twilioPassword}`, 'utf8').toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  };

  return await axios
    .post(url, build, config)
    .then(response => {
      console.log(JSON.stringify('Building - URL: ' + response.data.links.build_status));
      return response.data;
    })
    .catch(err => {
      console.log(err);
    });
};

function makeDeploy(request, buildDetails) {
  var deploy = new URLSearchParams();
  var url =
    'https://serverless.twilio.com/v1/Services/' + request.twilioServiceSid + '/Environments/' + request.twilioEnvironmentSid + '/Deployments';
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
      console.log('Deploy status: ' + JSON.stringify(response.data));
      return;
    })
    .catch(err => {
      console.log(err);
    });
}

//listen for request on port 3000, and as a callback function have the port listened on logged
app.listen(port, () => {
  console.log(`App listening on ${port}`);
});
