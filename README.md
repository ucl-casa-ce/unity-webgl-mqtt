# Unity WebGL MQTT
## A sample project to consume MQTT data stream using Unity WebGL and MQTT.JS

---

## Prerequisites

- MQTT broker publishing over a secure WebSocket
- Unity3D with WebGL build support (version used in this sample 2022.3.2f1)
- VSCode (or your preferred editor)

Languages used:
- HTML
- JavaScript
- C#

## Introduction

The [M2MQTT library](https://github.com/CE-SDV-Unity/M2MqttUnity) is the ideal tool to consume MQTT data in Unity3D. However, Unity's WebGL builds do not permit direct access to IP sockets for network connectivity. As a result, we must use WebSockets ([more information here](https://docs.unity3d.com/Manual/webgl-networking.html)). Although Unity3D cannot execute JavaScript files directly, it is feasible to incorporate an external JavaScript library into Unity via the library interface. This interface acts as a bridge, linking the external JavaScript library to Unity’s MonoBehaviour using standard C# scripts.

> NOTE: the JS library will only run in the Unity WebGL build and not in the UnityEditor.

## Process

### JS Library

- Start by creating a new Unity project. Then, navigate to _File -> Build Settings_ and switch the platform to `WebGL`.
- In the _Assets_ folder of the Unity project, create a new folder named _Plugins_.
- Using VSCode, create a new JavaScript file named `mqttjsPlugin.js` within the _Plugins_ folder. The JavaScript library must have a specific syntax to be recognized and utilized by Unity.

> NOTE: The JavaScript file should have the extension `.jslib`. However, it is recommended to initially create it as a `.js` file. This allows VSCode to provide the correct formatting, making it easier to code.

```Javascript
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
```

- An initial variable is utilized to encapsulate the content of the library.
- If multiple functions are employed and data needs to be shared among them, global variables can be declared using the `$Name_Context` syntax and registered using `autoAddDeps` method. To use them, you will need to access them using `Name_Context.Name_Variable`, omitting the `$` sign.

The function _mqttConnect_ is utilized to:
- Create the _MQTTJs client_.
- Subscribe to the provided topic.
- Retrieve the MQTT data and send a message to Unity using _SendMessage_.

In this case, the broker address and the topic are sent to the library from the `C# script` (we will discuss this shortly). Numeric types do not require any conversion. However, strings need to be converted using the `UTF8ToString` method.

Finally, the [SendMessage](https://docs.unity3d.com/Manual/webgl-interactingwithbrowserscripting.html) method is used to send the data back to the `C# script`.

The syntax used is `SendMessage(objectName, methodName, value);` where:

- `objectName` refers to a GameObject in the scene. The name must be __unique__ as Unity performs a `GameObject.Find` operation behind the scenes.
- `methodName` refers to the method of the `C# script` that is attached as a component to the `objectName`.
- `value` is the data sent to Unity from the JS library. It can be a string or a number. Arrays are not supported, but it is possible to send multiple values using JSON. The value can be empty.

The last line of the JS library is `mergeInto`, which is used to export the library in the WebGL build.

### C# Component

To utilize the JavaScript library with Unity, you should create a new C# script named `mqttManagerJS.cs`. Please note that this script should __not__ be created in the _Plugins_ folder.

```c#
using UnityEngine;
using System.Runtime.InteropServices;
using TMPro;

//Version 3
public class mqttManagerJS : MonoBehaviour
{
    public string brokerAdress = "ws://ADDRESS.mqtt.BROKER:8080";
    public string topicSub = "TOPIC/To/Subscribe";
    public TextMeshPro valueMqtt;

    // Import the external JavaScript functions
    [DllImport("__Internal")] private static extern void mqttConnect(string broker, string topic);

    private void Start()
    {
        mqttConnect(brokerAdress, topicSub); //this call the Javascript method
    }

    public void GetData(string message) //this is called from Javascript using the SendMessage method
    {
        Debug.Log("Received string from JavaScript: " + message);
        valueMqtt.text = message;
    }
}
```

- The `[DllImport("__Internal")]` attribute is used to import the functions declared in the JS Library.
- In the `Start` method, the component calls the JS function and passes the broker address and topic to subscribe to.
- In the JS library, the `GetData` method is called, and the MQTT message is passed to Unity.

### Visualise the Data

In this example, a TextMeshPro GameObject is used to visualize the message in Unity:

- Create a new `TMPro` GameObject by navigating to `GameObject -> 3D Object -> Text - TextMeshPro`.
- Right-click on it from the _Hierarchy panel_ and rename it from `Text (TMP)` to `mqttResponse`.

> NOTE: The name needs to be **unique** as it is used in the `SendMessage` method in the JS library.

- Adjust the position and font size of the _mqttResponse_ GameObject as needed to keep it visible to the camera.
- Attach the `mqttManagerJS.cs` to the _mqttResponse_ object as a new component.
- From the _Hierarchy panel_, drag and drop the _mqttResponse_ GameObject itself to the _Value Mqtt_ field.

### Build the WebGL App

Navigate to `File -> Build Settings`, add the _Open Scene_, and press `Build`. Unity will then create a folder containing the `index.html`, entry point of our App, and the data folders.

> NOTE: remember to set the public variables _Broker Address_ and _Topic Sub_ of the `mqttManagerJS.cs` component attached to the `mqttResponse` TextMeshPro GameObject.

The final step is to add the `MqttJs` library, which is called by the JavaScript library we created, to the head of the `index.html` file created by Unity.


```html
     <script src="https://unpkg.com/mqtt@4.3.7/dist/mqtt.min.js" type="text/javascript"></script> 
```

The `index.html` file will run the Unity WebGL application that displays and updates the MQTT message received in real time.

> NOTE: By default, Unity builds use `GZ compression`. If the webserver is not properly [configured](https://docs.unity3d.com/Manual/webgl-server-configuration-code-samples.html) or if you are running a local web server, it will throw an error (`Unable to parse Build/XXXX.framework.js.gz!`). In such cases, you can disable the compression by navigating to `Project Settings -> Player -> Publishing Settings -> Compression Format -> Disabled`. `GitHub Pages` supports gzip's content.

### Common Mistakes

- The name of the GameObject used in `SendMessage` is not unique.
- The data type sent using `SendMessage` does not match the type received by the C# Script.
- There are typos in the GameObject name or Method name, particularly with regard to case sensitivity.
- The JS library is not properly formatted or has an extension other than `.jslib`.
