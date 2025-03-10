import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { WebView } from 'react-native-webview';

// Raspberry Pi IP adresinizi buradan tek seferde değiştirebilirsiniz.
const BASE_URL = "http://192.168.0.57:5000";

const RaspberryPiControl = () =>
{
  const [angle1, setAngle1] = useState("90");
  const [angle2, setAngle2] = useState("90");

  const videoStreamUrl = `${BASE_URL}/video_feed`;

  const setServo = async (servo, angle) =>
  {
    try
    {
      const response = await fetch(`${BASE_URL}/set_servo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ servo, angle: parseInt(angle) }),
      });
      const data = await response.json();
      if (data.status === "başarılı")
      {
        Alert.alert(`Servo ${servo} açısı ${angle}° olarak ayarlandı.`);
      } else
      {
        Alert.alert("Hata", data.error);
      }
    } catch (error)
    {
      Alert.alert("Bağlantı Hatası", "Raspberry Pi'ye bağlanılamadı.");
      console.error("Hata:", error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.videoContainer}>
        <WebView
          source={{ uri: videoStreamUrl }}
          style={styles.webview}
          javaScriptEnabled
          domStorageEnabled
        />
      </View>
      <View style={styles.controlPanel}>
        <Text style={styles.title}>Servo Motor Kontrolü</Text>
        <View style={styles.inputGroup}>
          <Text>Servo 1 Açısı:</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={angle1}
            onChangeText={setAngle1}
          />
          <Button title="Servo 1'i Ayarla" onPress={() => setServo(1, angle1)} />
        </View>
        <View style={styles.inputGroup}>
          <Text>Servo 2 Açısı:</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={angle2}
            onChangeText={setAngle2}
          />
          <Button title="Servo 2'yi Ayarla" onPress={() => setServo(2, angle2)} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  videoContainer: {
    width: 300,
    height: 200,
    backgroundColor: 'black',
    marginBottom: 20,
  },
  webview: {
    flex: 1,
  },
  controlPanel: {
    width: '100%',
    padding: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  input: {
    width: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    textAlign: 'center',
    marginHorizontal: 10,
  },
});

export default RaspberryPiControl;
