import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { 
  StyleSheet, Text, View, TouchableOpacity, 
  ImageBackground, StatusBar, TextInput, Alert, ScrollView, ActivityIndicator, FlatList
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Calendar } from 'react-native-calendars';
import { format } from 'date-fns';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// --- CRITICAL FIX: POINT TO YOUR LIVE SERVER ---
// This connects the mobile app to your live database!
const BACKEND_URL = 'https://goldenbay.com.ph'; 

const axiosInstance = axios.create({ baseURL: BACKEND_URL });
axiosInstance.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('gb_customer_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (error) => Promise.reject(error));

const Stack = createNativeStackNavigator();

// --- THEME CONSTANTS ---
const COLORS = {
  background: '#F9F9F9',
  surface: '#FFFFFF',
  primary: '#D4AF37',
  primaryDark: '#C5A028',
  text: '#111827',
  textMuted: '#6B7280',
  border: '#E5E7EB',
  danger: '#EF4444',
  success: '#10B981'
};

// --------------------------------------------------------
// 1. HOME SCREEN (App Hub)
// --------------------------------------------------------
const HomeScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={styles.homeHeader}>
        <Text style={styles.homeTitle}>GOLDEN BAY</Text>
        <Text style={styles.homeSubtitle}>FRESH SEAFOOD RESTAURANT</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Hero Banner */}
        <ImageBackground 
          source={{ uri: `${BACKEND_URL}/static/assets/images/golden_bay_cover.webp` }} 
          style={styles.heroBanner}
          imageStyle={{ borderRadius: 12 }}
        >
          <View style={styles.heroOverlay}>
            <Text style={styles.heroText}>Experience Luxury Dining</Text>
          </View>
        </ImageBackground>

        {/* Action Grid */}
        <View style={styles.grid}>
          <TouchableOpacity style={styles.gridCard} onPress={() => navigation.navigate('Booking')}>
            <View style={styles.iconCircle}><Feather name="calendar" size={24} color={COLORS.primary} /></View>
            <Text style={styles.cardTitle}>Book a Table</Text>
            <Text style={styles.cardDesc}>Reserve VIP rooms or Hall</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridCard} onPress={() => navigation.navigate('Menu')}>
            <View style={styles.iconCircle}><Feather name="book-open" size={24} color={COLORS.primary} /></View>
            <Text style={styles.cardTitle}>Our Menu</Text>
            <Text style={styles.cardDesc}>Explore live seafood</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridCard} onPress={() => navigation.navigate('Rewards')}>
            <View style={styles.iconCircle}><Feather name="gift" size={24} color={COLORS.primary} /></View>
            <Text style={styles.cardTitle}>Rewards</Text>
            <Text style={styles.cardDesc}>View & redeem points</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridCard} onPress={() => navigation.navigate('Contact')}>
            <View style={styles.iconCircle}><Feather name="map-pin" size={24} color={COLORS.primary} /></View>
            <Text style={styles.cardTitle}>Contact</Text>
            <Text style={styles.cardDesc}>Location & Hours</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// --------------------------------------------------------
// 2. MENU SCREEN
// --------------------------------------------------------
const MenuScreen = ({ navigation }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await axiosInstance.get('/api/menu/');
        setCategories(res.data);
        if (res.data.length > 0) setActiveCategory(res.data[0].name);
      } catch (err) {
        Alert.alert("Error", "Could not connect to the live menu. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  const activeItems = categories.find(c => c.name === activeCategory)?.items || [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><Feather name="chevron-left" size={24} color={COLORS.text}/></TouchableOpacity>
        <Text style={styles.headerTitle}>OUR MENU</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
      ) : (
        <>
          {/* Category Tabs */}
          <View style={{ height: 60, borderBottomWidth: 1, borderColor: COLORS.border }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabContainer}>
              {categories.map(cat => (
                <TouchableOpacity 
                  key={cat.id} 
                  style={[styles.tab, activeCategory === cat.name && styles.tabActive]}
                  onPress={() => setActiveCategory(cat.name)}
                >
                  <Text style={[styles.tabText, activeCategory === cat.name && styles.tabTextActive]}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Items List */}
          <FlatList
            data={activeItems}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
              <View style={styles.menuCard}>
                {item.image && (
                  <Image source={{ uri: item.image.startsWith('http') ? item.image : `${BACKEND_URL}${item.image}` }} style={styles.menuImage} />
                )}
                <View style={styles.menuContent}>
                  <Text style={styles.menuName}>{item.name}</Text>
                  {item.description ? <Text style={styles.menuDesc} numberOfLines={2}>{item.description}</Text> : null}
                  
                  <View style={styles.priceRow}>
                    {item.prices.map(p => (
                      <Text key={p.id} style={styles.menuPrice}>
                        {p.size !== 'Regular' ? `${p.size}: ` : ''}
                        {p.is_seasonal ? <Text style={{ fontStyle: 'italic', color: COLORS.primary }}>Seasonal Price</Text> : `₱${Number(p.price).toLocaleString()}`}
                      </Text>
                    ))}
                  </View>
                </View>
              </View>
            )}
          />
        </>
      )}
    </SafeAreaView>
  );
};

// --------------------------------------------------------
// 3. BOOKING SCREEN
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

  const getAvailableTimes = () => {
    if (session === 'LUNCH') return ['11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00'];
    return ['17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'];
  };

  const handleNextToRooms = async () => {
    setLoadingRooms(true);
    setStep(2);
    setSelectedRoom(null); // Reset selection on new search
    try {
      const response = await axiosInstance.get(`/api/reservations/check/?date=${date}&session=${session}`);
      const sortedRooms = response.data.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
      setRooms(sortedRooms);
    } catch (error) {
      Alert.alert("Connection Error", "Could not fetch availability from the live database.");
      setStep(1);
    } finally {
      setLoadingRooms(false);
    }
  };

  const handleSubmitBooking = async () => {
    if (!formData.name || !formData.contact || !formData.time || !formData.pax) {
      Alert.alert("Missing Fields", "Please fill out all required fields (Name, Contact, Pax, Time).");
      return;
    }

    const cleanPhone = formData.contact.replace(/[\s-]/g, '');
    const phRegex = /^(09|\+?639)\d{9}$/;
    
    if (!phRegex.test(cleanPhone)) {
      Alert.alert("Invalid Number", "Please enter a valid Philippine mobile number (e.g., 09171234567).");
      return;
    }

    setIsSubmitting(true);
    const payload = {
        customer_name: formData.name, 
        customer_contact: cleanPhone,
        customer_email: formData.email,
        date: date, 
        session: session, 
        time: `${formData.time}:00`, // Format to HH:MM:SS
        pax: parseInt(formData.pax, 10),
        dining_area: selectedRoom.id, 
        special_request: formData.message, 
        status: 'PENDING',
        source: 'MOBILE_APP' // Identifies this came from the native app
    };

    try {
        await axiosInstance.post('/api/reservations/create/', payload);
        Alert.alert("Success!", "Your reservation request has been sent securely to the Golden Bay Dashboard. We will confirm via SMS shortly.", [
          { text: "Return Home", onPress: () => navigation.navigate('Home') }
        ]);
    } catch (error) {
        Alert.alert("Booking Failed", error.response?.data?.non_field_errors?.[0] || error.response?.data?.pax?.[0] || "Something went wrong.");
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : navigation.goBack()} style={styles.backBtn}><Feather name="chevron-left" size={24} color={COLORS.text}/></TouchableOpacity>
        <Text style={styles.headerTitle}>STEP {step} OF 3</Text>
        <View style={{ width: 24 }} /> 
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* STEP 1: DATE & SESSION */}
        {step === 1 && (
          <View>
            <Text style={styles.sectionTitle}>Select Date</Text>
            <View style={styles.card}>
              <Calendar
                onDayPress={day => setDate(day.dateString)}
                markedDates={{ [date]: { selected: true, selectedColor: COLORS.primary } }}
                minDate={format(new Date(), 'yyyy-MM-dd')}
                theme={{ todayTextColor: COLORS.primary, arrowColor: COLORS.primary }}
              />
            </View>

            <Text style={styles.sectionTitle}>Select Session</Text>
            <View style={styles.row}>
              <TouchableOpacity style={[styles.toggleBtn, session === 'LUNCH' && styles.toggleBtnActive]} onPress={() => setSession('LUNCH')}>
                <Text style={[styles.toggleText, session === 'LUNCH' && styles.toggleTextActive]}>LUNCH</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.toggleBtn, session === 'DINNER' && styles.toggleBtnActive]} onPress={() => setSession('DINNER')}>
                <Text style={[styles.toggleText, session === 'DINNER' && styles.toggleTextActive]}>DINNER</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Dining Preference</Text>
            <View style={styles.row}>
              <TouchableOpacity style={[styles.toggleBtn, bookingType === 'VIP' && styles.toggleBtnActive]} onPress={() => setBookingType('VIP')}>
                <Text style={[styles.toggleText, bookingType === 'VIP' && styles.toggleTextActive]}>VIP ROOMS</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.toggleBtn, bookingType === 'HALL' && styles.toggleBtnActive]} onPress={() => setBookingType('HALL')}>
                <Text style={[styles.toggleText, bookingType === 'HALL' && styles.toggleTextActive]}>MAIN HALL</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.buttonPrimary} onPress={handleNextToRooms}>
              <Text style={styles.buttonTextPrimary}>CHECK AVAILABILITY</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 2: SELECT ROOM */}
        {step === 2 && (
          <View>
            <Text style={styles.sectionTitle}>{bookingType === 'VIP' ? 'Available VIP Rooms' : 'Main Dining Hall'}</Text>
            {loadingRooms ? (
              <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
            ) : (
              rooms.filter(r => r.area_type === bookingType).map((room) => (
                <TouchableOpacity 
                  key={room.id} 
                  disabled={!room.is_available}
                  style={[ styles.roomCard, selectedRoom?.id === room.id && styles.roomCardSelected, !room.is_available && { opacity: 0.5 } ]}
                  onPress={() => setSelectedRoom(room)}
                >
                  <View style={styles.roomCardContent}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.roomName}>{room.name}</Text>
                      
                      {/* LOGIC FIX: Show Capacity vs Remaining Seats */}
                      {room.area_type === 'HALL' ? (
                         <Text style={styles.roomCapacity}><Feather name="users" size={12}/> {room.remaining_capacity} Seats Left</Text>
                      ) : (
                         <Text style={styles.roomCapacity}><Feather name="users" size={12}/> Up to {room.capacity} Guests</Text>
                      )}
                      
                      {Number(room.price) > 0 && <Text style={styles.roomPrice}>₱{Number(room.price).toLocaleString()} Consumable</Text>}
                    </View>
                    {!room.is_available && <Text style={styles.bookedText}>BOOKED</Text>}
                    {selectedRoom?.id === room.id && <Feather name="check-circle" size={24} color={COLORS.primary} style={{ position: 'absolute', right: 15, top: 15 }} />}
                  </View>
                </TouchableOpacity>
              ))
            )}

            {selectedRoom && (
              <TouchableOpacity style={styles.buttonPrimary} onPress={() => setStep(3)}>
                <Text style={styles.buttonTextPrimary}>NEXT: FINAL DETAILS</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* STEP 3: DETAILS FORM */}
        {step === 3 && (
          <View>
            <Text style={styles.sectionTitle}>Contact Details</Text>
            
            <Text style={styles.label}>Full Name *</Text>
            <TextInput style={styles.input} placeholder="e.g. John Doe" value={formData.name} onChangeText={t => setFormData({...formData, name: t})} />

            <Text style={styles.label}>Mobile Number *</Text>
            <TextInput style={styles.input} placeholder="e.g. 0917 123 4567" keyboardType="phone-pad" value={formData.contact} onChangeText={t => setFormData({...formData, contact: t})} />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Guests *</Text>
                <TextInput style={styles.input} placeholder="2" keyboardType="number-pad" value={formData.pax} onChangeText={t => setFormData({...formData, pax: t})} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Arrival Time *</Text>
                <View style={styles.timeGrid}>
                   {/* Horizontal Time Scroller */}
                   <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {getAvailableTimes().map(time => (
                        <TouchableOpacity key={time} style={[styles.timeChip, formData.time === time && styles.timeChipActive]} onPress={() => setFormData({...formData, time})}>
                          <Text style={[styles.timeText, formData.time === time && styles.timeTextActive]}>{time}</Text>
                        </TouchableOpacity>
                      ))}
                   </ScrollView>
                </View>
              </View>
            </View>

            <Text style={styles.label}>Special Requests / Allergies</Text>
            <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} placeholder="Enter notes here..." multiline value={formData.message} onChangeText={t => setFormData({...formData, message: t})} />

            <TouchableOpacity style={styles.buttonPrimary} onPress={handleSubmitBooking} disabled={isSubmitting || !formData.time}>
              {isSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonTextPrimary}>SUBMIT RESERVATION</Text>}
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

// --------------------------------------------------------
// 4. REWARDS SCREEN (Auth & Dashboard)
// --------------------------------------------------------
const RewardsScreen = ({ navigation }) => {
  const [step, setStep] = useState('LOADING'); 
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [customer, setCustomer] = useState(null);
  const [rewards, setRewards] = useState([]);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    const token = await AsyncStorage.getItem('gb_customer_token');
    const data = await AsyncStorage.getItem('gb_customer_data');
    if (token && data) {
      setCustomer(JSON.parse(data));
      setStep('DASHBOARD');
      fetchRewards();
    } else {
      setStep('LOGIN');
    }
  };

  const fetchRewards = async () => {
    try {
      const res = await axiosInstance.get('/api/reservations/rewards/');
      setRewards(res.data);
    } catch (err) {
      console.log("Failed to fetch rewards");
    }
  };

  const handleRequestOTP = async () => {
    setIsLoading(true);
    const cleanPhone = phone.replace(/[\s-]/g, '');
    try {
      await axiosInstance.post('/api/users/request-otp/', { phone: cleanPhone });
      setStep('OTP');
    } catch (err) {
      Alert.alert("Error", err.response?.data?.error || "Failed to send code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setIsLoading(true);
    const cleanPhone = phone.replace(/[\s-]/g, '');
    try {
      const res = await axiosInstance.post('/api/users/verify-otp/', { phone: cleanPhone, otp });
      await AsyncStorage.setItem('gb_customer_token', res.data.access);
      await AsyncStorage.setItem('gb_customer_data', JSON.stringify(res.data.customer));
      
      setCustomer(res.data.customer);
      setStep('DASHBOARD');
      fetchRewards();
    } catch (err) {
      Alert.alert("Error", "Invalid or expired code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRedeem = async (reward) => {
    Alert.alert(
      "Confirm Redemption",
      `Redeem ${reward.name} for ${reward.points_required} points?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Confirm", onPress: async () => {
            try {
              const res = await axiosInstance.post('/api/reservations/rewards/redeem/', { reward_id: reward.id });
              setCustomer(prev => ({ ...prev, points_balance: res.data.new_balance }));
              Alert.alert("Success!", "Reward redeemed. Please show this to your waiter.");
            } catch (err) {
              Alert.alert("Error", err.response?.data?.error || "Redemption failed.");
            }
        }}
      ]
    );
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('gb_customer_token');
    await AsyncStorage.removeItem('gb_customer_data');
    setCustomer(null);
    setStep('LOGIN');
  };

  if (step === 'LOADING') return <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary}/></View>;

  if (step === 'LOGIN' || step === 'OTP') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><Feather name="chevron-left" size={24} color={COLORS.text}/></TouchableOpacity>
          <Text style={styles.headerTitle}>MEMBER LOGIN</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.formContainer}>
          <View style={styles.authCard}>
            <View style={styles.iconCircle}><Feather name="award" size={32} color={COLORS.primary}/></View>
            <Text style={styles.authTitle}>Golden Rewards</Text>
            
            {step === 'LOGIN' ? (
              <>
                <Text style={styles.label}>Mobile Number</Text>
                <TextInput style={styles.input} placeholder="0917 123 4567" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
                <TouchableOpacity style={styles.buttonPrimary} onPress={handleRequestOTP} disabled={isLoading}>
                  {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonTextPrimary}>SEND CODE</Text>}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.label}>Enter 6-Digit Code</Text>
                <TextInput style={[styles.input, { fontSize: 24, textAlign: 'center', letterSpacing: 5 }]} placeholder="000000" keyboardType="number-pad" maxLength={6} value={otp} onChangeText={setOtp} />
                <TouchableOpacity style={styles.buttonPrimary} onPress={handleVerifyOTP} disabled={isLoading}>
                  {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonTextPrimary}>VERIFY</Text>}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setStep('LOGIN')} style={{ marginTop: 15 }}><Text style={styles.linkText}>Wrong number? Go back</Text></TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // REWARDS DASHBOARD
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><Feather name="chevron-left" size={24} color={COLORS.text}/></TouchableOpacity>
        <Text style={styles.headerTitle}>REWARDS</Text>
        <TouchableOpacity onPress={handleLogout}><Feather name="log-out" size={20} color={COLORS.text}/></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <Text style={styles.profileName}>{customer?.name}</Text>
          {customer?.is_vip && <View style={styles.vipBadge}><Text style={styles.vipText}>VIP MEMBER</Text></View>}
          <View style={styles.pointsRow}>
            <Text style={styles.pointsLabel}>Available Balance</Text>
            <Text style={styles.pointsValue}>{customer?.points_balance?.toLocaleString()} <Text style={{fontSize: 14, color: COLORS.textMuted}}>PTS</Text></Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Redeem Rewards</Text>
        {rewards.map(reward => {
          const canAfford = customer?.points_balance >= reward.points_required;
          return (
            <View key={reward.id} style={styles.rewardCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rewardName}>{reward.name}</Text>
                <Text style={styles.rewardCost}>{reward.points_required} PTS</Text>
              </View>
              <TouchableOpacity 
                style={[styles.redeemBtn, !canAfford && { backgroundColor: COLORS.border }]}
                disabled={!canAfford}
                onPress={() => handleRedeem(reward)}
              >
                <Text style={[styles.redeemBtnText, !canAfford && { color: COLORS.textMuted }]}>
                  {canAfford ? 'REDEEM' : 'LOCKED'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

// --------------------------------------------------------
// 5. CONTACT SCREEN
// --------------------------------------------------------
const ContactScreen = ({ navigation }) => (
  <SafeAreaView style={styles.container}>
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><Feather name="chevron-left" size={24} color={COLORS.text}/></TouchableOpacity>
      <Text style={styles.headerTitle}>CONTACT US</Text>
      <View style={{ width: 24 }} />
    </View>
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <View style={styles.card}>
        <View style={styles.contactRow}>
          <Feather name="map-pin" size={20} color={COLORS.primary} />
          <Text style={styles.contactText}>Lot 3&4 Block A2, Diosdado Macapagal Blvd, Pasay City</Text>
        </View>
        <View style={styles.contactRow}>
          <Feather name="phone" size={20} color={COLORS.primary} />
          <Text style={styles.contactText}>(02) 8804-0332{'\n'}+63 917 580 7166</Text>
        </View>
        <View style={styles.contactRow}>
          <Feather name="clock" size={20} color={COLORS.primary} />
          <Text style={styles.contactText}>Lunch: 11:00 AM – 2:30 PM{'\n'}Dinner: 5:00 PM – 9:30 PM</Text>
        </View>
      </View>
    </ScrollView>
  </SafeAreaView>
);

// --------------------------------------------------------
// APP NAVIGATOR
// --------------------------------------------------------
export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Booking" component={BookingScreen} />
          <Stack.Screen name="Menu" component={MenuScreen} />
          <Stack.Screen name="Rewards" component={RewardsScreen} />
          <Stack.Screen name="Contact" component={ContactScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

// --------------------------------------------------------
// STYLES (Light Theme)
// --------------------------------------------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  
  // Headers
  homeHeader: { padding: 20, alignItems: 'center', backgroundColor: COLORS.surface, borderBottomWidth: 1, borderColor: COLORS.border },
  homeTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.primary, letterSpacing: 3 },
  homeSubtitle: { fontSize: 10, color: COLORS.textMuted, letterSpacing: 2, marginTop: 4 },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 15, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderColor: COLORS.border },
  headerTitle: { color: COLORS.text, fontSize: 14, letterSpacing: 2, fontWeight: 'bold' },
  backBtn: { padding: 4 },

  // Home Elements
  heroBanner: { width: '100%', height: 200, marginBottom: 20, overflow: 'hidden', borderRadius: 12 },
  heroOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  heroText: { color: '#FFF', fontSize: 22, fontWeight: 'bold', letterSpacing: 1 },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15 },
  gridCard: { width: '47%', backgroundColor: COLORS.surface, padding: 20, borderRadius: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  iconCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#Fef6e3', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  cardDesc: { fontSize: 10, color: COLORS.textMuted, textAlign: 'center' },

  // Shared Form Elements
  scrollContent: { padding: 20, paddingBottom: 50 },
  sectionTitle: { color: COLORS.text, fontSize: 12, fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase', marginTop: 25, marginBottom: 10 },
  card: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  row: { flexDirection: 'row', gap: 10 },
  
  label: { color: COLORS.textMuted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, marginTop: 15, fontWeight: 'bold' },
  input: { backgroundColor: COLORS.surface, color: COLORS.text, padding: 15, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, fontSize: 16 },
  
  buttonPrimary: { backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 8, alignItems: 'center', marginTop: 30, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 },
  buttonTextPrimary: { color: '#FFF', fontWeight: 'bold', fontSize: 12, letterSpacing: 2 },

  // Toggles
  toggleBtn: { flex: 1, padding: 15, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, alignItems: 'center' },
  toggleBtnActive: { backgroundColor: '#Fef6e3', borderColor: COLORS.primary },
  toggleText: { color: COLORS.textMuted, fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  toggleTextActive: { color: COLORS.primaryDark },

  // Rooms
  roomCard: { backgroundColor: COLORS.surface, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  roomCardSelected: { borderColor: COLORS.primary, borderWidth: 2, backgroundColor: '#Fef6e3' },
  roomCardContent: { padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  roomName: { color: COLORS.text, fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  roomCapacity: { color: COLORS.textMuted, fontSize: 12, fontWeight: '600' },
  roomPrice: { color: COLORS.primaryDark, fontSize: 12, fontWeight: 'bold', marginTop: 4 },
  bookedText: { color: COLORS.danger, fontSize: 12, fontWeight: 'bold' },

  // Time Chips
  timeGrid: { flexDirection: 'row' },
  timeChip: { paddingVertical: 10, paddingHorizontal: 15, backgroundColor: COLORS.surface, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, marginRight: 8 },
  timeChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  timeText: { color: COLORS.text, fontSize: 14 },
  timeTextActive: { color: '#FFF', fontWeight: 'bold' },

  // Auth / Rewards
  formContainer: { flex: 1, padding: 20, justifyContent: 'center' },
  authCard: { backgroundColor: COLORS.surface, padding: 30, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  authTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, textAlign: 'center', marginBottom: 20 },
  linkText: { color: COLORS.primaryDark, textAlign: 'center', fontSize: 12, fontWeight: 'bold' },

  profileCard: { backgroundColor: COLORS.surface, padding: 24, borderRadius: 16, marginBottom: 30, borderWidth: 1, borderColor: '#Fef6e3', shadowColor: COLORS.primary, shadowOpacity: 0.1, shadowRadius: 10, elevation: 3 },
  profileName: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, marginBottom: 5 },
  vipBadge: { backgroundColor: '#Fef6e3', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginBottom: 15 },
  vipText: { color: COLORS.primaryDark, fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  pointsRow: { borderTopWidth: 1, borderColor: COLORS.border, paddingTop: 15, marginTop: 5 },
  pointsLabel: { fontSize: 10, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  pointsValue: { fontSize: 32, fontWeight: 'bold', color: COLORS.primaryDark },

  rewardCard: { flexDirection: 'row', backgroundColor: COLORS.surface, padding: 16, borderRadius: 12, marginBottom: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  rewardName: { fontSize: 14, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  rewardCost: { fontSize: 12, color: COLORS.primaryDark, fontWeight: 'bold' },
  redeemBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  redeemBtnText: { color: '#FFF', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },

  // Menu
  tabContainer: { paddingHorizontal: 16, alignItems: 'center' },
  tab: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, marginRight: 10 },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
  tabTextActive: { color: '#FFF' },

  menuCard: { flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: 12, marginBottom: 16, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  menuImage: { width: 100, height: '100%', backgroundColor: COLORS.border },
  menuContent: { flex: 1, padding: 12 },
  menuName: { fontSize: 14, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  menuDesc: { fontSize: 11, color: COLORS.textMuted, marginBottom: 8 },
  priceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  menuPrice: { fontSize: 12, fontWeight: 'bold', color: COLORS.text },

  // Contact
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 15, paddingVertical: 15, borderBottomWidth: 1, borderColor: COLORS.border },
  contactText: { fontSize: 14, color: COLORS.text, lineHeight: 22 }
});