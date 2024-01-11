var mqttjsPlugin={

$DataMqttJs: 
{
    out_msg:"",
    topic:"",
},

mqttConnect: function (brokerAddress,topicSub,callback)
{
  console.log("Connecting to broker");
  var client = mqtt.connect(UTF8ToString(brokerAddress));
  var topic= UTF8ToString(topicSub);
  console.log(topic);

  client.on("connect", () => {
    console.log("Connected");
    client.subscribe(topic);
    client.on('message', (topic, message) => {
    //Called each time a message is received
    console.log('Received message:', topic, message.toString());

    SendMessage('mqttResponse', 'GetData', message.toString());
    })
    });

client.on("error", (error) => {
  console.log(error);
  });
  },
  }
autoAddDeps(mqttjsPlugin, '$DataMqttJs');
mergeInto(LibraryManager.library, mqttjsPlugin);