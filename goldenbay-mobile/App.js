import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { 
  StyleSheet, Text, View, TouchableOpacity, 
  ImageBackground, StatusBar, TextInput, Alert 
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

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
        
        {/* SVG Logo */}
        <Image 
          source={GoldenBayLogo} 
          style={styles.logo} 
          contentFit="contain"
          tintColor="#D4AF37" // Forces the SVG to be Gold
        />


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
// 2. BOOKING SCREEN (Native Form)
// --------------------------------------------------------
const BookingScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← BACK</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>RESERVATIONS</Text>
        <View style={{ width: 50 }} /> 
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput style={styles.input} placeholder="e.g. John Doe" placeholderTextColor="#999" />

        <Text style={styles.label}>Phone Number</Text>
        <TextInput style={styles.input} placeholder="e.g. 0917 123 4567" keyboardType="phone-pad" placeholderTextColor="#999" />

        <Text style={styles.label}>Number of Guests</Text>
        <TextInput style={styles.input} placeholder="2" keyboardType="number-pad" placeholderTextColor="#999" />

        <TouchableOpacity 
          style={[styles.button, styles.buttonPrimary, { marginTop: 20 }]} 
          onPress={() => Alert.alert("Coming Soon", "We will connect this to Django next!")}
        >
          <Text style={styles.buttonTextPrimary}>CHECK AVAILABILITY</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// --------------------------------------------------------
// 3. REWARDS LOGIN SCREEN (OTP Flow)
// --------------------------------------------------------
const RewardsScreen = ({ navigation }) => {
  const [step, setStep] = useState('PHONE'); // 'PHONE' or 'OTP'
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
            <TextInput 
              style={styles.input} 
              placeholder="0917 123 4567" 
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              placeholderTextColor="#999"
            />
            <TouchableOpacity 
              style={[styles.button, styles.buttonPrimary, { marginTop: 20 }]} 
              onPress={() => setStep('OTP')}
            >
              <Text style={styles.buttonTextPrimary}>SEND LOGIN CODE</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.label}>Enter 6-Digit Code</Text>
            <TextInput 
              style={[styles.input, { fontSize: 24, letterSpacing: 8, textAlign: 'center' }]} 
              placeholder="000000" 
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={setOtp}
              placeholderTextColor="#999"
            />
            <TouchableOpacity 
              style={[styles.button, styles.buttonPrimary, { marginTop: 20 }]} 
              onPress={() => Alert.alert("Success", "We will connect this to Django next!")}
            >
              <Text style={styles.buttonTextPrimary}>VERIFY & LOGIN</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => setStep('PHONE')} style={{ marginTop: 20 }}>
              <Text style={styles.linkText}>Wrong number? Go back</Text>
            </TouchableOpacity>
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
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', // Darker overlay for luxury feel
    justifyContent: 'center', alignItems: 'center', padding: 20,
  },
  logo: {
    width: '100%',      // Takes up 85% of the phone's screen width
    height: 300,       // Gives the SVG plenty of vertical room to scale up
    marginBottom: 1,
  },
  subtitle: {
    fontSize: 12, color: '#D4AF37', textTransform: 'uppercase', letterSpacing: 2,
    marginBottom: 60, textAlign: 'center', fontWeight: 'bold'
  },
  buttonContainer: {
    width: '100%', gap: 15, paddingHorizontal: 20,
  },
  button: {
    paddingVertical: 16, borderRadius: 4, width: '100%', alignItems: 'center',
    justifyContent: 'center'
  },
  buttonPrimary: { backgroundColor: '#C5A028' },
  buttonSecondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#C5A028' },
  buttonTextPrimary: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 12, letterSpacing: 2 },
  buttonTextSecondary: { color: '#C5A028', fontWeight: 'bold', fontSize: 12, letterSpacing: 2 },
  
  // Internal Screens
  container: { flex: 1, backgroundColor: '#0a0a0a' }, // Dark luxury background
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#222'
  },
  backText: { color: '#D4AF37', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  headerTitle: { color: '#FFF', fontSize: 16, letterSpacing: 3, fontWeight: '600' },
  formContainer: { padding: 30 },
  label: { color: '#999', fontSize: 10, uppercase: true, letterSpacing: 1, marginBottom: 8, marginTop: 20 },
  input: {
    backgroundColor: '#1a1a1a', color: '#FFF', padding: 15, borderRadius: 4,
    borderWidth: 1, borderColor: '#333', fontSize: 16
  },
  linkText: { color: '#D4AF37', textAlign: 'center', fontSize: 12, marginTop: 15 }
});