import React, { useState, useEffect } from "react";
import { SafeAreaView, View,  Text, StyleSheet, Image, ScrollView, ActivityIndicator, TouchableOpacity} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { db } from "../../database/firebaseConfig";
import axios from "axios";
import colors from "frontend/assets/theme/colors";
import Card from "../components/Card";
import Constants from 'expo-constants';
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import * as Location from 'expo-location';


// Unsplash API Key; access key from environment variables
const UNSPLASH_ACCESS_KEY =
  process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY ||
  Constants.expoConfig?.extra?.UNSPLASH_ACCESS_KEY;

console.log('Unsplash API Key:', UNSPLASH_ACCESS_KEY);
  
interface BirdData {
  bird: string;
  latitude: number;
  longitude: number;
  timestamp: Date;
}
interface UploadResponse {
  birds: string[];
  message: string;
}
const IdentifyScreen: React.FC = () => {
  const [latestBird, setLatestBird] = useState<BirdData | null>(null);
  const [birdImage, setBirdImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionStatus, setDetectionStatus] = useState("Not Identifying Birds");

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  // Fetch the user's last detection from Firestore on mount
  useEffect(() => {
    const fetchLastBird = async () => {
      try {
        const birdsRef = collection(db, "birds");
        const q = query(birdsRef, orderBy("timestamp", "desc"), limit(1));
        const querySnap = await getDocs(q);
        if (!querySnap.empty) {
          const doc = querySnap.docs[0];
          const data = doc.data();
          const docTimestamp = data.timestamp ? data.timestamp.toDate() : new Date();
          setLatestBird({
            bird: data.bird,
            latitude: data.latitude || 0,
            longitude: data.longitude || 0,
            timestamp: docTimestamp,
          });
          await fetchBirdImage(data.bird);
        }
      } catch (err) {
        console.error("Error fetching last bird from Firestore:", err);
      }
    };
    fetchLastBird();
  }, []);

  // Get device location once on mount
  useEffect(() => {
    const fetchInitialLocation = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert("Permission required", "Enable location access for detection logs.");
          return;
        }
        let loc = await Location.getCurrentPositionAsync({});
        if (loc && loc.coords) {
          setLatitude(loc.coords.latitude);
          setLongitude(loc.coords.longitude);
        }
      } catch (err) {
        console.error("Error fetching location:", err);
      }
    };
    fetchInitialLocation();
  }, []);

  


  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* <Text style={styles.title}>Identification</Text> */}

        {/* Status Badges with Central Button */}
        <View style={styles.statusContainer}>
          <Card style={styles.badge}>
            <Text style={styles.badgeDate}></Text>
            <Text style={styles.badgeText}>{detectionStatus}</Text>
            <Text style={styles.badgeDate}></Text>
          </Card>

          <TouchableOpacity
            style={styles.listeningButton}
            onPress={toggleDetection}
          >
            <MaterialCommunityIcons
              name={isDetecting ? "microphone" : "microphone-off"}
              size={36}
              color={colors.card}
            />
          </TouchableOpacity>

          <Card style={styles.badge}>
            <Text style={styles.badgeText}>Bird Last Identified On</Text>
            <Text style={styles.badgeDate}>
              {latestBird
                ? latestBird.timestamp.toLocaleString()
                : "No bird detected yet"}
            </Text>
          </Card>
        </View>

        {/* Species Name */}

        <Text style={styles.speciesName}>
          {latestBird ? latestBird.bird : "American Robin"}
        </Text>
        <Text style={styles.speciesLatin}>
          {latestBird ? "Dynamic Bird Info" : "Turdus Migratorius"}
        </Text>

        {/* Robin Image */}
        <View style={styles.robinContainer}>
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : birdImage ? (
            <Image source={{ uri: birdImage }} style={styles.robinImage} />
          ) : (
            <Text style={styles.sectionText}>No image available.</Text>
          )}
        </View>

        {/* Sections with Lines */}
        <View>
          <Text style={styles.sectionHeading}>Physical Description</Text>
          <Text style={styles.sectionText}>

            American Robins are fairly large songbirds with a large, round body,
            long legs, and fairly long tail. Robins are the largest North
            American thrushes, and their profile offers a good chance to learn
            the basic shape of most thrushes. Robins make a good reference point
            for comparing the size and shape of other birds, too. American
            Robins are gray-brown birds with warm orange underparts and dark
            heads. In light, a white patch on the lower belly and under the tail
            can be conspicuous. Compared with males, females have paler heads
            that contrast less with the gray back.

            American Robins are fairly large songbirds with a large, round body, long legs, and fairly long tail. Robins are the largest North American thrushes, and their profile offers a good chance to learn the basic shape of most thrushes. Robins make a good reference point for comparing the size and shape of other birds, too. American Robins are gray-brown birds with warm orange underparts and dark heads. In light, a white patch on the lower belly and under the tail can be conspicuous. Compared with males, females have paler heads that contrast less with the gray back.

          </Text>
        </View>
        <View style={styles.separator} />

        <View>
          <Text style={styles.sectionHeading}>Overview</Text>
          <Text style={styles.sectionText}>

            A very familiar bird over most of North America, running and
            hopping on lawns with upright stance, often nesting on porches and
            windowsills. The Robin's rich caroling is among the earliest bird
            songs heard at dawn in spring and summer, often beginning just
            before first light. In fall and winter, robins may gather by the
            hundreds in roaming flocks, concentrating at sources of food.

            A very familiar bird over most of North America, running and hopping on lawns with upright stance, often nesting on porches and windowsills. The Robin's rich caroling is among the earliest bird songs heard at dawn in spring and summer, often beginning just before first light. In fall and winter, robins may gather by the hundreds in roaming flocks, concentrating at sources of food.

          </Text>
        </View>
        <View style={styles.separator} />

        <View>
          <Text style={styles.sectionHeading}>Habitat</Text>
          <Text style={styles.sectionText}>

            Cities, towns, lawns, farmland, forests; in winter, berry-bearing
            trees. Over most of the continent, summers occur wherever there are
            trees for nest sites and mud for nest material. In the arid
            southwest, summers mainly occur in coniferous forests in mountains,
            rarely in well-watered lowland suburbs. In winter, flocks gather in
            wooded areas where trees or shrubs have good crops of berries.

            Cities, towns, lawns, farmland, forests; in winter, berry-bearing trees. Over most of the continent, summers occur wherever there are trees for nest sites and mud for nest material. In the arid southwest, summers mainly occur in coniferous forests in mountains, rarely in well-watered lowland suburbs. In winter, flocks gather in wooded areas where trees or shrubs have good crops of berries.

          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    padding: 20,
  },
  title: {
    fontFamily: "Caprasimo",
    fontSize: 48,
    color: colors.secondary,
    textAlign: "center",
    marginBottom: 20,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  badge: {
    width: "35%",
    height: 110,
    justifyContent: "center",
    shadowRadius: 0,
    elevation: 3, 
    padding: 0,
  },
  badgeText: {
    fontFamily: "Caprasimo",
    fontSize: 16,
    color: colors.primary,
    textAlign: "center",
  },
  badgeDate: {
    fontFamily: "Radio Canada",
    fontSize: 12,
    color: colors.text,
    textAlign: "center",
  },
  listeningButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.accent,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  speciesName: {
    fontFamily: "Caprasimo",
    fontSize: 36,
    color: colors.secondary,
    textAlign: "center",
    marginBottom: 5,
  },
  speciesLatin: {
    fontFamily: "Radio Canada Italic",
    fontSize: 20,
    color: colors.text,
    textAlign: "center",
    fontWeight: "bold",
    marginBottom: 20,
  },
  robinContainer: {
    alignItems: "center",
    justifyContent: 'center',
    marginBottom: 20,
  },
  robinImage: {
    width: 350,
    height: 250,
    borderRadius: 20,
    borderWidth: 5,
    borderColor: colors.primary,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  sectionText: {
    fontFamily: "Radio Canada",
    fontSize: 16,
    color: colors.text,
    textAlign: "left",
    lineHeight: 24,
  },
  sectionHeading: {
    fontFamily: "Caprasimo",
    fontSize: 28,
    color: colors.secondary,
    textAlign: "center",
    marginBottom: 10,
  },
  separator: {
    height: 2,
    backgroundColor: colors.accent,
    marginVertical: 10,
  },
});

export default IdentifyScreen;
