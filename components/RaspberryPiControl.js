import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Alert, Switch, TouchableOpacity, StyleSheet, Image, ScrollView } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { BASE_URL } from '../constants';
import { CommonActions } from '@react-navigation/native';

const RaspberryPiControl = ({ navigation }) =>
{
    const [angle1, setAngle1] = useState("90");
    const [angle2, setAngle2] = useState("90");
    const [alertShown, setAlertShown] = useState(false);
    const [isHotspot, setIsHotspot] = useState(false);
    const [deviceLocation, setDeviceLocation] = useState(null);
    const [hotspotInfo, setHotspotInfo] = useState(null);
    const [distance, setDistance] = useState(null);

    const videoStreamUrl = `${BASE_URL}/video_feed`;

    const setServo = async (servo, angle) =>
    {
        const parsedAngle = parseInt(angle);
        if (isNaN(parsedAngle) || parsedAngle < 0 || parsedAngle > 180)
        {
            Alert.alert('Hata', 'Lütfen 0-180 arası geçerli bir açı giriniz.');
            return;
        }
        try
        {
            const response = await fetch(`${BASE_URL}/set_servo`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ servo, angle: parsedAngle }),
            });
            const data = await response.json();
            if (data.status === "başarılı")
            {
                Alert.alert(`Servo ${servo} açısı ${parsedAngle}° olarak ayarlandı.`);
            } else
            {
                Alert.alert("Hata", data.error);
            }
        } catch (error)
        {
            Alert.alert("Bağlantı Hatası", "Sunucuya ulaşılamadı.");
            console.error("Hata:", error);
        }
    };

    useEffect(() =>
    {
        const intervalId = setInterval(async () =>
        {
            try
            {
                const response = await fetch(`${BASE_URL}/detection_status`);
                const data = await response.json();
                if (data.hayalet_detected && !alertShown)
                {
                    Alert.alert("Uyarı", "Hayalet ağ tespit edildi!");
                    setAlertShown(true);
                }
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

    useEffect(() =>
    {
        getDeviceLocation();
    }, []);

    // Haversine formülü ile mesafe hesaplama
    const haversineDistance = (lat1, lon1, lat2, lon2) =>
    {
        const R = 6371e3;
        const toRad = (x) => x * Math.PI / 180;
        const φ1 = toRad(lat1);
        const φ2 = toRad(lat2);
        const Δφ = toRad(lat2 - lat1);
        const Δλ = toRad(lon2 - lon1);
        const a = Math.sin(Δφ / 2) ** 2 +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    // Eğer cihaz hotspot sağlayıcı ise konum bilgisini sunucuya gönder
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

    // Hotspot sağlamayan cihazlarda hotspot bilgisini al
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

    const handleLogout = () =>
    {
        navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
        });
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            {/* Header - Logo ve Başlık */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Raspberry Pi Kontrol</Text>
            </View>
            <View style={styles.videoContainer}>
                <WebView source={{ uri: videoStreamUrl }} style={styles.webview} javaScriptEnabled domStorageEnabled />
            </View>
            <View style={styles.controlPanel}>
                <Text style={styles.controlTitle}>Servo Motor Kontrolü</Text>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Servo 1 Açısı:</Text>
                    <TextInput
                        style={styles.servoInput}
                        keyboardType="numeric"
                        value={angle1}
                        onChangeText={setAngle1}
                        placeholder="0-180"
                    />
                    <TouchableOpacity style={styles.smallButton} onPress={() => setServo(1, angle1)}>
                        <Text style={styles.buttonText}>Ayarla</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Servo 2 Açısı:</Text>
                    <TextInput
                        style={styles.servoInput}
                        keyboardType="numeric"
                        value={angle2}
                        onChangeText={setAngle2}
                        placeholder="0-180"
                    />
                    <TouchableOpacity style={styles.smallButton} onPress={() => setServo(2, angle2)}>
                        <Text style={styles.buttonText}>Ayarla</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.hotspotContainer}>
                    <Text style={styles.controlTitle}>Hotspot Bilgisi</Text>
                    <View style={styles.switchContainer}>
                        <Text style={styles.label}>Bu cihaz hotspot mu?</Text>
                        <Switch value={isHotspot} onValueChange={setIsHotspot} />
                    </View>
                    {deviceLocation ? (
                        isHotspot ? (
                            <Text style={styles.infoText}>Bu cihaz hotspot (Konumunuz sunucuya gönderiliyor.)</Text>
                        ) : (
                            distance !== null ? (
                                <Text style={styles.infoText}>
                                    Hotspot'a Uzaklık: {distance.toFixed(2)} metre{"\n"}
                                    Cihaz Konumu: {deviceLocation.latitude.toFixed(5)}, {deviceLocation.longitude.toFixed(5)}{"\n"}
                                    {hotspotInfo && (
                                        <>Hotspot Konumu: {hotspotInfo.latitude.toFixed(5)}, {hotspotInfo.longitude.toFixed(5)}</>
                                    )}
                                </Text>
                            ) : (
                                <Text style={styles.infoText}>Hotspot bilgisi alınıyor...</Text>
                            )
                        )
                    ) : (
                        <TouchableOpacity style={styles.button} onPress={getDeviceLocation}>
                            <Text style={styles.buttonText}>Konumu Yenile</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
            {/* Çıkış Butonu */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutButtonText}>Çıkış Yap</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

export default RaspberryPiControl;

const styles = StyleSheet.create({
    container: {
        padding: 15,
        backgroundColor: '#f7f9fc',
        flexGrow: 1,
        alignItems: 'center',
    },
    header: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 20,
        marginTop: "15%",
    },
    logo: {
        width: 80,
        height: 80,
        resizeMode: 'contain',
        marginBottom: 10,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    videoContainer: {
        width: '100%',
        height: 240,
        backgroundColor: '#000',
        borderRadius: 10,
        overflow: 'hidden',
        marginBottom: 20,
    },
    webview: {
        flex: 1,
    },
    controlPanel: {
        width: '100%',
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        marginBottom: 20,
    },
    controlTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#444',
        textAlign: 'center',
        marginBottom: 15,
    },
    inputGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    label: {
        fontSize: 16,
        width: 120,
        color: '#555',
    },
    servoInput: {
        flex: 1,
        backgroundColor: '#eef2f9',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 10,
        marginRight: 10,
        textAlign: 'center',
        fontSize: 16,
    },
    smallButton: {
        backgroundColor: '#3498db',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 8,
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600',
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
    infoText: {
        fontSize: 16,
        color: '#444',
        textAlign: 'center',
        marginVertical: 10,
    },
    button: {
        backgroundColor: '#3498db',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: 'center',
    },
    logoutButton: {
        backgroundColor: '#e74c3c',
        paddingVertical: 14,
        paddingHorizontal: 30,
        borderRadius: 8,
        marginBottom: 30,
    },
    logoutButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
