const redis = require('redis');
const dbData = require('./db.json');

const { port, password, hostName } = dbData;

const client = redis.createClient(port, hostName, {no_ready_check: true});

client.auth(password, function (err) {
    if (err) throw err;
});

client.on('error', function (err) {
  console.log('Error ' + err);
}); 

client.on('connect', function() {
  console.log('Connected to Redis');
});

function jobScheduler(jobName, expiresInSeconds) {
  client.set(jobName, "", 'EX', expiresInSeconds);

  //why use another database, if we already have one
  client.set(`${jobName}-details`, JSON.stringify({
    failCount: 0,
    isSuccessful: false
  }), redis.print);
}

// Example
jobScheduler('sendEmail', 10);