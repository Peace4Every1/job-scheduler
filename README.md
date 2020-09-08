### How To Setup and Run The Project
1. Run the commands below:
- **`git clone https://github.com/Peace4Every1/job-scheduler`**
-  **`npm i`**
-  **`npm start`** - to start the job-creator
-  **`npm run start-listener`** - to start the job-listener/executor
2. Call the `jobScheduler()` function with 2 arguments: job name that must be available for execution for listener and amount of seconds when to be executed
3. Once the key expires, listener will make an attempt.

#### Logic explanation
- In this example **watch** is a method for making **multi** conditional. The server watches the value of a given key, then starts gets a chain of commands linked to **multi**. These commands get executed once **exec** is called. If the value of the of the watched key is changed at the moment of **exec** being called, the whole operation stops and fails, which means that *a concurrent client has changed the value*.

---
**P.S.** _comments are present across the code for further explanatory._