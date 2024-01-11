using UnityEngine;
using System.Runtime.InteropServices;
using TMPro;

//Version 3
public class mqttManagerJS : MonoBehaviour
{
    public string brokerAdress = "ws://ADDREESS.mqtt.BROKER:8080";
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