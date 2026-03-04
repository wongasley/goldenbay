import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { 
  StyleSheet, Text, View, TouchableOpacity, 
  ImageBackground, StatusBar, TextInput, Alert, ScrollView, ActivityIndicator
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Calendar } from 'react-native-calendars';
import { format } from 'date-fns';
import axiosInstance from './src/api';
import { Feather } from '@expo/vector-icons';

// Adjust this path if you placed the SVG somewhere else!
import GoldenBayLogo from './src/assets/goldenbaylogo2.svg'; 

const Stack = createNativeStackNavigator();

// --------------------------------------------------------
// 1. WELCOME SCREEN
// --------------------------------------------------------
const WelcomeScreen = ({ navigation }) => {
  return (
    <ImageBackground 
      source={{ uri: 'https://goldenbay.com.ph/assets/images/golden_bay_cover.webp' }} 
      style={styles.background}
    >
      <View style={styles.overlay}>
        <Image 
          source={GoldenBayLogo} 
          style={styles.logo} 
          contentFit="contain"
          tintColor="#D4AF37" 
        />

        {/* <Text style={styles.subtitle}>Golden Bay Fresh Seafoods Restaurant</Text> */}

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.buttonPrimary]} 
            onPress={() => navigation.navigate('Booking')}
          >
            <Text style={styles.buttonTextPrimary}>BOOK A TABLE</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.buttonSecondary]} 
            onPress={() => navigation.navigate('Rewards')}
          >
            <Text style={styles.buttonTextSecondary}>ENTER REWARDS</Text>
          </TouchableOpacity>
        </View>

      </View>
    </ImageBackground>
  );
};

// --------------------------------------------------------
// 2. BOOKING SCREEN (Native Form matching Web)
// --------------------------------------------------------
const BookingScreen = ({ navigation }) => {
  const [step, setStep] = useState(1);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [session, setSession] = useState('LUNCH');
  const [bookingType, setBookingType] = useState('VIP');
  
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  
  const [formData, setFormData] = useState({ name: '', contact: '', email: '', pax: '2', time: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate Time Slots based on Session
  const getAvailableTimes = () => {
    if (session === 'LUNCH') return ['11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00'];
    return ['17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'];
  };

  // Step 1 -> Step 2: Fetch Rooms
  const handleNextToRooms = async () => {
    setLoadingRooms(true);
    setStep(2);
    try {
      const response = await axiosInstance.get(`/api/reservations/check/?date=${date}&session=${session}`);
      // Sort VIP 1, VIP 2, etc. correctly
      const sortedRooms = response.data.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
      setRooms(sortedRooms);
    } catch (error) {
      Alert.alert("Error", "Could not fetch availability. Please check your connection.");
      setStep(1);
    } finally {
      setLoadingRooms(false);
    }
  };

  // Submit Final Booking
  const handleSubmitBooking = async () => {
    if (!formData.name || !formData.contact || !formData.time || !formData.pax) {
      Alert.alert("Missing Fields", "Please fill out all required fields (Name, Contact, Pax, Time).");
      return;
    }

    setIsSubmitting(true);
    const payload = {
        customer_name: formData.name, 
        customer_contact: formData.contact, 
        customer_email: formData.email,
        date: date, 
        session: session, 
        time: `${formData.time}:00`, // Format to HH:MM:SS for Django
        pax: parseInt(formData.pax, 10),
        dining_area: selectedRoom.id, 
        special_request: formData.message, 
        status: 'PENDING'
    };

    try {
        await axiosInstance.post('/api/reservations/create/', payload);
        Alert.alert("Success!", "Your reservation request has been submitted. We will confirm shortly.", [
          { text: "Return Home", onPress: () => navigation.navigate('Welcome') }
        ]);
    } catch (error) {
        Alert.alert("Booking Failed", error.response?.data?.non_field_errors?.[0] || "Something went wrong.");
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : navigation.goBack()}>
          <Text style={styles.backText}>← BACK</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>STEP {step} OF 3</Text>
        <View style={{ width: 50 }} /> 
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* STEP 1: DATE & SESSION */}
        {step === 1 && (
          <View>
            <Text style={styles.sectionTitle}>Select Date</Text>
            <Calendar
              onDayPress={day => setDate(day.dateString)}
              markedDates={{ [date]: { selected: true, selectedColor: '#D4AF37' } }}
              minDate={format(new Date(), 'yyyy-MM-dd')}
              theme={{
                todayTextColor: '#D4AF37',
                arrowColor: '#D4AF37',
                textDayFontFamily: 'sans-serif',
                textMonthFontFamily: 'sans-serif-medium',
              }}
              style={styles.calendar}
            />

            <Text style={styles.sectionTitle}>Select Session</Text>
            <View style={styles.row}>
              <TouchableOpacity 
                style={[styles.toggleBtn, session === 'LUNCH' && styles.toggleBtnActive]} 
                onPress={() => setSession('LUNCH')}
              >
                <Text style={[styles.toggleText, session === 'LUNCH' && styles.toggleTextActive]}>LUNCH</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.toggleBtn, session === 'DINNER' && styles.toggleBtnActive]} 
                onPress={() => setSession('DINNER')}
              >
                <Text style={[styles.toggleText, session === 'DINNER' && styles.toggleTextActive]}>DINNER</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Dining Preference</Text>
            <View style={styles.row}>
              <TouchableOpacity 
                style={[styles.toggleBtn, bookingType === 'VIP' && styles.toggleBtnActive]} 
                onPress={() => setBookingType('VIP')}
              >
                <Text style={[styles.toggleText, bookingType === 'VIP' && styles.toggleTextActive]}>VIP ROOMS</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.toggleBtn, bookingType === 'HALL' && styles.toggleBtnActive]} 
                onPress={() => setBookingType('HALL')}
              >
                <Text style={[styles.toggleText, bookingType === 'HALL' && styles.toggleTextActive]}>MAIN HALL</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={[styles.button, styles.buttonPrimary, { marginTop: 30 }]} onPress={handleNextToRooms}>
              <Text style={styles.buttonTextPrimary}>CHECK AVAILABILITY</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 2: SELECT ROOM */}
        {/* STEP 2: SELECT ROOM */}
        {step === 2 && (
          <View>
            <Text style={styles.sectionTitle}>Available Rooms</Text>
            {loadingRooms ? (
              <ActivityIndicator size="large" color="#D4AF37" style={{ marginTop: 50 }} />
            ) : (
              rooms.filter(r => r.area_type === bookingType).map((room) => (
                <TouchableOpacity 
                  key={room.id} 
                  disabled={!room.is_available}
                  style={[
                    styles.roomCard, 
                    selectedRoom?.id === room.id && styles.roomCardSelected,
                    !room.is_available && styles.roomCardDisabled
                  ]}
                  onPress={() => setSelectedRoom(room)}
                >
                  {/* Room Image */}
                  {room.image ? (
                    <Image 
                      source={{ uri: room.image.startsWith('http') ? room.image : `${axiosInstance.defaults.baseURL}${room.image}` }} 
                      style={styles.roomImage} 
                      contentFit="cover"
                    />
                  ) : (
                    <View style={[styles.roomImage, { backgroundColor: '#222', justifyContent: 'center', alignItems: 'center' }]}>
                      <Feather name="image" size={24} color="#444" />
                    </View>
                  )}

                  <View style={styles.roomCardContent}>
                    {/* Header Row: Name & Price */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <View style={{ flex: 1, paddingRight: 10 }}>
                        <Text style={styles.roomName}>{room.name}</Text>
                        <Text style={styles.roomCapacity}><Feather name="users" size={12}/> Up to {room.capacity} Guests</Text>
                      </View>
                      
                      {Number(room.price) > 0 && (
                        <View style={styles.priceTag}>
                          <Text style={styles.priceText}>₱{Number(room.price).toLocaleString()}</Text>
                          <Text style={styles.consumableText}>Consumable</Text>
                        </View>
                      )}
                    </View>

                    {/* Description */}
                    {room.description ? (
                      <Text style={styles.roomDesc} numberOfLines={2}>{room.description}</Text>
                    ) : null}

                    {/* Amenities Badges */}
                    <View style={styles.amenitiesRow}>
                      {room.has_ktv && (
                        <View style={styles.amenityBadge}><Text style={styles.amenityText}>🎤 KTV</Text></View>
                      )}
                      {room.has_restroom && (
                        <View style={styles.amenityBadge}><Text style={styles.amenityText}>🚻 CR</Text></View>
                      )}
                      {room.has_tv && (
                        <View style={styles.amenityBadge}><Text style={styles.amenityText}>📺 TV</Text></View>
                      )}
                      {room.has_couch && (
                        <View style={styles.amenityBadge}><Text style={styles.amenityText}>🛋️ Lounge</Text></View>
                      )}
                    </View>

                    {/* Booked Overlay Text */}
                    {!room.is_available && (
                      <Text style={styles.bookedText}>CURRENTLY BOOKED</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))
            )}

            {selectedRoom && (
              <TouchableOpacity style={[styles.button, styles.buttonPrimary, { marginTop: 30 }]} onPress={() => setStep(3)}>
                <Text style={styles.buttonTextPrimary}>NEXT: DETAILS</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

// --------------------------------------------------------
// 3. REWARDS LOGIN SCREEN
// --------------------------------------------------------
const RewardsScreen = ({ navigation }) => {
  const [step, setStep] = useState('PHONE'); 
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← BACK</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>VIP REWARDS</Text>
        <View style={{ width: 50 }} /> 
      </View>
      <View style={styles.formContainer}>
        {step === 'PHONE' ? (
          <>
            <Text style={styles.label}>Mobile Number</Text>
            <TextInput style={styles.input} placeholder="0917 123 4567" keyboardType="phone-pad" value={phone} onChangeText={setPhone} placeholderTextColor="#999" />
            <TouchableOpacity style={[styles.button, styles.buttonPrimary, { marginTop: 20 }]} onPress={() => setStep('OTP')}>
              <Text style={styles.buttonTextPrimary}>SEND LOGIN CODE</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.label}>Enter 6-Digit Code</Text>
            <TextInput style={[styles.input, { fontSize: 24, letterSpacing: 8, textAlign: 'center' }]} placeholder="000000" keyboardType="number-pad" maxLength={6} value={otp} onChangeText={setOtp} placeholderTextColor="#999" />
            <TouchableOpacity style={[styles.button, styles.buttonPrimary, { marginTop: 20 }]} onPress={() => Alert.alert("Success", "We will connect this to Django next!")}>
              <Text style={styles.buttonTextPrimary}>VERIFY & LOGIN</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setStep('PHONE')} style={{ marginTop: 20 }}><Text style={styles.linkText}>Wrong number? Go back</Text></TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

// --------------------------------------------------------
// APP NAVIGATOR
// --------------------------------------------------------
export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Booking" component={BookingScreen} />
          <Stack.Screen name="Rewards" component={RewardsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

// --------------------------------------------------------
// STYLES
// --------------------------------------------------------
const styles = StyleSheet.create({
  background: { flex: 1, resizeMode: 'cover' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  logo: { width: '85%', height: 270, marginBottom: 1 },
  subtitle: { fontSize: 12, color: '#D4AF37', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 60, textAlign: 'center', fontWeight: 'bold' },
  buttonContainer: { width: '100%', gap: 15, paddingHorizontal: 20 },
  button: { paddingVertical: 16, borderRadius: 4, width: '100%', alignItems: 'center', justifyContent: 'center' },
  buttonPrimary: { backgroundColor: '#C5A028' },
  buttonSecondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#C5A028' },
  buttonTextPrimary: { color: '#000000', fontWeight: 'bold', fontSize: 12, letterSpacing: 2 },
  buttonTextSecondary: { color: '#C5A028', fontWeight: 'bold', fontSize: 12, letterSpacing: 2 },
  
  // Internal Screens
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#222' },
  backText: { color: '#D4AF37', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  headerTitle: { color: '#FFF', fontSize: 16, letterSpacing: 3, fontWeight: '600' },
  scrollContent: { padding: 20, paddingBottom: 50 },
  formContainer: { padding: 20 },
  
  sectionTitle: { color: '#C5A028', fontSize: 12, fontWeight: 'bold', letterSpacing: 2, textTransform: 'uppercase', marginTop: 25, mb: 10 },
  row: { flexDirection: 'row', gap: 10, marginTop: 10 },
  toggleBtn: { flex: 1, padding: 15, borderWidth: 1, borderColor: '#333', borderRadius: 4, alignItems: 'center' },
  toggleBtnActive: { backgroundColor: '#C5A028', borderColor: '#C5A028' },
  toggleText: { color: '#999', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  toggleTextActive: { color: '#000' },
  calendar: { borderRadius: 8, marginTop: 10 },

  roomCard: { 
    backgroundColor: '#1a1a1a', 
    borderRadius: 8, 
    marginBottom: 15, 
    borderWidth: 1, 
    borderColor: '#333',
    overflow: 'hidden' // Keeps image inside borders
  },
  roomCardSelected: { borderColor: '#D4AF37', backgroundColor: '#221d0d' },
  roomCardDisabled: { opacity: 0.5 },
  roomImage: { width: '100%', height: 150 },
  roomCardContent: { padding: 15 },
  roomName: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  roomCapacity: { color: '#D4AF37', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
  roomDesc: { color: '#999', fontSize: 12, marginTop: 10, lineHeight: 18 },
  
  // Price Tag
  priceTag: { alignItems: 'flex-end' },
  priceText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  consumableText: { color: '#C5A028', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 },
  
  // Amenities
  amenitiesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 15 },
  amenityBadge: { backgroundColor: '#333', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  amenityText: { color: '#CCC', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  bookedText: { color: '#ff4444', fontSize: 12, fontWeight: 'bold', marginTop: 15, letterSpacing: 2, textAlign: 'center' },

  summaryBox: { backgroundColor: '#1a1a1a', padding: 15, borderRadius: 4, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: '#D4AF37' },
  summaryText: { color: '#FFF', fontSize: 14, fontWeight: 'bold', marginBottom: 5 },
  
  label: { color: '#999', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 15 },
  input: { backgroundColor: '#1a1a1a', color: '#FFF', padding: 15, borderRadius: 4, borderWidth: 1, borderColor: '#333', fontSize: 16 },
  
  timeChip: { paddingVertical: 10, paddingHorizontal: 15, backgroundColor: '#1a1a1a', borderRadius: 4, borderWidth: 1, borderColor: '#333' },
  timeChipActive: { backgroundColor: '#D4AF37', borderColor: '#D4AF37' },
  timeChipText: { color: '#999', fontSize: 14 },
  timeChipTextActive: { color: '#000', fontWeight: 'bold' },

  linkText: { color: '#D4AF37', textAlign: 'center', fontSize: 12, marginTop: 15 }
});