const redis = require('redis')
const dbData = require('./db.json');

const { port, password, hostName } = dbData;

const listener = redis.createClient(port, hostName, {no_ready_check: true});
// We need a second redis client because of specifity of redis workflow. Once redis client enters subscribe mode, it becomes uncapable of calling methods other than unsubscribe, quit, etc.
const handler = redis.createClient(port, hostName, {no_ready_check: true});

listener.auth(password, function (err) {
    if (err) throw err;
});

handler.auth(password, function (err) {
    if (err) throw err;
});

listener.on('error', err => {
  console.log('Error ' + err);
}); 

listener.on('connect', () => {
  console.log('Connected to Redis');
});

handler.on('connect', () => {
  console.log('Handler is connected to Redis');
});

//.: Set the config for "notify-keyspace-events" channel used for expired type events
listener.send_command('config', ['set','notify-keyspace-events','Ex']);

// __keyevent@0__:expired is the channel name to which we need to subscribe, 0 is the default DB
listener.subscribe('__keyevent@0__:expired');

listener.on('message', async (chan, msg) => {

  handler.watch(`${msg}-details`, watchError => {
    if (watchError) throw watchError;
  
    handler.get(`${msg}-details`, (getError, result) => {
      if (getError) throw getError;

      try {
        //running the job, which has to be available for this server
        msg();
      } catch (err) {
        // if unsuccessful, try again in a minute
        if(err) {
          handler
            .multi()
            .set(msg, "", 'EX', 60)
            .set(`${msg}-details`, JSON.stringify({
              failCount: JSON.parse(result).failCount++,
              isSuccessful: false
            }))
            .exec((execError, results) => {
              //  If err is null, it means Redis successfully attempted the operation.
              if (execError) throw err;

              /*
               If results === null, it means that a concurrent client changed the key while we were processing it and thus the execution of the MULTI command was not performed
               NOTICE: Failing an execution of MULTI is not considered an error. So you will have err === null and results === null
               */
            });
        } else {
          // this is the case when everything was successful and no error was thrown during job execution
          handler
            .multi()
            .set(`${msg}-details`, JSON.stringify({
              ...JSON.parse(result),
              isSuccessful: true
            }))
            .exec((execError, results) => {
              if (execError) throw err;
            })
        }
      }
    });
  })
})