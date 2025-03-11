import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, Switch } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';

// Raspberry Pi IP adresinizi buradan tek seferde değiştirebilirsiniz.
const BASE_URL = "http://192.168.0.57:5000";

const RaspberryPiControl = () =>
{
  const [angle1, setAngle1] = useState("90");
  const [angle2, setAngle2] = useState("90");
  const [alertShown, setAlertShown] = useState(false);

  // Hotspot entegrasyonu için state'ler
  const [isHotspot, setIsHotspot] = useState(false);
  const [deviceLocation, setDeviceLocation] = useState(null);
  const [hotspotInfo, setHotspotInfo] = useState(null);
  const [distance, setDistance] = useState(null);

  const videoStreamUrl = `${BASE_URL}/video_feed`;

  // Servo motor kontrolü fonksiyonu
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

  // Bus tespiti için alert kontrolü
  useEffect(() =>
  {
    const intervalId = setInterval(async () =>
    {
      try
      {
        const response = await fetch(`${BASE_URL}/detection_status`);
        const data = await response.json();
        // Eğer bus tespit edilmişse ve alert daha önce gösterilmemişse
        if (data.hayalet_detected && !alertShown)
        {
          Alert.alert("Uyarı", "Hayalet ağ tespit edildi!");
          setAlertShown(true);
        }
        // Bus tespiti kalmadığında alert durumunu sıfırla
        if (!data.hayalet_detected && alertShown)
        {
          setAlertShown(false);
        }
      } catch (error)
      {
        console.error("Tespit durumu sorgulanırken hata:", error);
      }
    }, 2000);
    return () => clearInterval(intervalId);
  }, [alertShown]);

  // Cihaz konumunu alma fonksiyonu
  const getDeviceLocation = async () =>
  {
    try
    {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted')
      {
        Alert.alert('İzin Yok', 'Konum izni reddedildi');
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      setDeviceLocation(location.coords);
    } catch (error)
    {
      console.error("Konum alınırken hata:", error);
    }
  };

  // Sayfa yüklendiğinde cihazın konumunu al
  useEffect(() =>
  {
    getDeviceLocation();
  }, []);

  // Haversine formülü ile mesafe hesaplama
  const haversineDistance = (lat1, lon1, lat2, lon2) =>
  {
    const R = 6371e3; // Dünya yarıçapı (metre cinsinden)
    const toRad = (x) => x * Math.PI / 180;
    const φ1 = toRad(lat1);
    const φ2 = toRad(lat2);
    const Δφ = toRad(lat2 - lat1);
    const Δλ = toRad(lon2 - lon1);
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d;
  };

  // Eğer cihaz hotspot sağlayıcı ise, konum bilgisini sunucuya gönder
  useEffect(() =>
  {
    if (isHotspot && deviceLocation)
    {
      fetch(`${BASE_URL}/update_hotspot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: deviceLocation.latitude,
          longitude: deviceLocation.longitude,
        }),
      })
        .then(response => response.json())
        .then(data =>
        {
          if (data.status !== "başarılı")
          {
            Alert.alert("Hotspot Güncelleme Hatası", data.error);
          }
        })
        .catch(err => console.error("Hotspot güncellenemedi:", err));
    }
  }, [isHotspot, deviceLocation]);

  // Hotspot sağlayıcı olmayan cihazlar için, sunucudan hotspot konumunu al ve mesafeyi hesapla
  useEffect(() =>
  {
    if (!isHotspot)
    {
      const intervalId = setInterval(async () =>
      {
        try
        {
          const response = await fetch(`${BASE_URL}/hotspot_info`);
          const data = await response.json();
          if (!data.error)
          {
            setHotspotInfo(data);
            if (deviceLocation)
            {
              const d = haversineDistance(
                deviceLocation.latitude, deviceLocation.longitude,
                data.latitude, data.longitude
              );
              setDistance(d);
            }
          }
        } catch (error)
        {
          console.error("Hotspot bilgisi alınamadı:", error);
        }
      }, 10000);
      return () => clearInterval(intervalId);
    }
  }, [isHotspot, deviceLocation]);

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
        <View style={styles.hotspotContainer}>
          <Text style={styles.title}>Hotspot Bilgisi</Text>
          <View style={styles.switchContainer}>
            <Text>Bu cihaz hotspot mu?</Text>
            <Switch value={isHotspot} onValueChange={setIsHotspot} />
          </View>
          {deviceLocation ? (
            isHotspot ? (
              <Text>Bu cihaz hotspot (Konumunuz sunucuya gönderiliyor.)</Text>
            ) : (
              distance !== null ? (
                <Text>
                  Hotspot'a Uzaklık: {distance.toFixed(2)} metre{"\n"}
                  Cihaz Konumu: {deviceLocation.latitude.toFixed(5)}, {deviceLocation.longitude.toFixed(5)}{"\n"}
                  {hotspotInfo && (
                    <>Hotspot Konumu: {hotspotInfo.latitude.toFixed(5)}, {hotspotInfo.longitude.toFixed(5)}</>
                  )}
                </Text>
              ) : (
                <Text>Hotspot bilgisi alınıyor...</Text>
              )
            )
          ) : (
            <Button title="Konumu Yenile" onPress={getDeviceLocation} />
          )}
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
  hotspotContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
});

export default RaspberryPiControl;
