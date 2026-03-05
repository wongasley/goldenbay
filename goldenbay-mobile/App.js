import React, { useState, useEffect, useMemo, createContext, useContext, useCallback, useRef } from 'react';
import { NavigationContainer, useFocusEffect } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { 
  StyleSheet, Text, View, TouchableOpacity, 
  StatusBar, TextInput, Alert, ScrollView, ActivityIndicator, FlatList
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Calendar } from 'react-native-calendars';
import { format } from 'date-fns';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// --- CONNECTION ---
const BACKEND_URL = 'https://goldenbay.com.ph'; 

const axiosInstance = axios.create({ baseURL: BACKEND_URL });
axiosInstance.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('gb_customer_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (error) => Promise.reject(error));

const Stack = createNativeStackNavigator();

// --- BASE THEME ---
const COLORS = {
  background: '#F8F9FA', 
  surface: '#FFFFFF',
  primary: '#D4AF37',
  primaryDark: '#B5952F',
  text: '#111827',
  textMuted: '#6B7280',
  border: '#E5E7EB',
  danger: '#EF4444',
  success: '#10B981',
  cardBg: '#FFFFFF'
};

// --- TRANSLATIONS DICTIONARY ---
const translations = {
  en: {
      home: { title: "GOLDEN BAY", sub: "FRESH SEAFOOD RESTAURANT", book: "Book a Table", bookDesc: "Reserve VIP or Hall", menu: "Our Menu", menuDesc: "Explore live seafood", rewards: "Rewards", rewardsDesc: "View & redeem points", contact: "Contact", contactDesc: "Location & Hours" },
      menu: { title: "OUR MENU", all: "All", seasonal: "Seasonal", standard: "Standard", market: "Market Price" },
      book: { step: "STEP", of: "OF", selectDate: "Select Date", selectSession: "Select Session", lunch: "LUNCH", dinner: "DINNER", pref: "Dining Preference", vip: "VIP ROOMS", hall: "MAIN HALL", check: "CHECK AVAILABILITY", seats: "Seats Left", guests: "Guests", consumable: "Consumable", booked: "BOOKED", next: "NEXT: FINAL DETAILS", details: "Contact Details", name: "Full Name", phone: "Mobile Number", pax: "Guests", time: "Arrival Time", notes: "Special Requests", submit: "SUBMIT RESERVATION" },
      auth: { login: "MEMBER LOGIN", rewards: "Golden Rewards", phone: "Mobile Number", send: "SEND CODE", code: "Enter 6-Digit Code", verify: "VERIFY", back: "Wrong number? Go back" },
      rewards: { title: "REWARDS", vip: "VIP MEMBER", active: "Active Member", balance: "Available Balance", pts: "PTS", redeem: "Redeem Rewards", locked: "LOCKED", action: "REDEEM", policy: "Fulfillment Policy", policyDesc: "To claim your reward, please present the digital receipt to your waiter upon ordering. Valid for dine-in visits only." },
      contact: { title: "CONTACT US" },
      settings: { title: "SETTINGS", theme: "Appearance", light: "Light Mode", dark: "Dark Mode", language: "Language", save: "SAVE SETTINGS" }
  },
  zh: {
      home: { title: "金海湾", sub: "海鲜大酒楼", book: "预订餐桌", bookDesc: "预订包厢或大厅", menu: "我们的菜单", menuDesc: "探索生猛海鲜", rewards: "会员奖励", rewardsDesc: "查看及兑换积分", contact: "联系我们", contactDesc: "位置与营业时间" },
      menu: { title: "菜单", all: "全部", seasonal: "时令", standard: "标准", market: "时价" },
      book: { step: "步骤", of: "/", selectDate: "选择日期", selectSession: "选择时段", lunch: "午餐", dinner: "晚餐", pref: "就餐偏好", vip: "贵宾包厢", hall: "大厅散座", check: "查询空位", seats: "剩余座位", guests: "人", consumable: "最低消费", booked: "已满", next: "下一步：最终详情", details: "联系详情", name: "全名", phone: "手机号码", pax: "就餐人数", time: "到达时间", notes: "特殊要求", submit: "提交预订" },
      auth: { login: "会员登录", rewards: "黄金奖励", phone: "手机号码", send: "发送验证码", code: "输入6位验证码", verify: "验证", back: "号码错误？返回" },
      rewards: { title: "奖励", vip: "贵宾会员", active: "活跃会员", balance: "可用余额", pts: "分", redeem: "兑换奖励", locked: "未解锁", action: "兑换", policy: "兑换政策", policyDesc: "点餐时请向服务员出示电子凭证以领取奖励。仅限堂食有效。" },
      contact: { title: "联系我们" },
      settings: { title: "设置", theme: "外观", light: "浅色模式", dark: "深色模式", language: "语言", save: "保存设置" }
  },
  zh_hant: {
      home: { title: "金海灣", sub: "海鮮大酒樓", book: "預訂餐桌", bookDesc: "預訂包廂或大廳", menu: "我們的菜單", menuDesc: "探索生猛海鮮", rewards: "會員獎勵", rewardsDesc: "查看及兌換積分", contact: "聯繫我們", contactDesc: "位置與營業時間" },
      menu: { title: "菜單", all: "全部", seasonal: "時令", standard: "標準", market: "時價" },
      book: { step: "步驟", of: "/", selectDate: "選擇日期", selectSession: "選擇時段", lunch: "午餐", dinner: "晚餐", pref: "就餐偏好", vip: "貴賓包廂", hall: "大廳散座", check: "查詢空位", seats: "剩餘座位", guests: "人", consumable: "最低消費", booked: "已滿", next: "下一步：最終詳情", details: "聯繫詳情", name: "全名", phone: "手機號碼", pax: "就餐人數", time: "到達時間", notes: "特殊要求", submit: "提交預訂" },
      auth: { login: "會員登錄", rewards: "黃金獎勵", phone: "手機號碼", send: "發送驗證碼", code: "輸入6位驗證碼", verify: "驗證", back: "號碼錯誤？返回" },
      rewards: { title: "獎勵", vip: "貴賓會員", active: "活躍會員", balance: "可用餘額", pts: "分", redeem: "兌換獎勵", locked: "未解鎖", action: "兌換", policy: "兌換政策", policyDesc: "點餐時請向服務員出示電子憑證以領取獎勵。僅限堂食有效。" },
      contact: { title: "聯繫我們" },
      settings: { title: "設置", theme: "外觀", light: "淺色模式", dark: "深色模式", language: "語言", save: "保存設置" }
  },
  ja: {
      home: { title: "ゴールデンベイ", sub: "シーフードレストラン", book: "予約する", bookDesc: "VIP・ホールを予約", menu: "メニュー", menuDesc: "活魚を探索", rewards: "リワード", rewardsDesc: "ポイントの確認・交換", contact: "お問い合わせ", contactDesc: "場所と営業時間" },
      menu: { title: "メニュー", all: "すべて", seasonal: "季節", standard: "標準", market: "時価" },
      book: { step: "ステップ", of: "/", selectDate: "日付を選択", selectSession: "時間帯を選択", lunch: "ランチ", dinner: "ディナー", pref: "座席の希望", vip: "VIP個室", hall: "メインホール", check: "空き状況を確認", seats: "残り席数", guests: "名様", consumable: "最低利用額", booked: "予約済", next: "次へ：最終詳細", details: "連絡先情報", name: "フルネーム", phone: "携帯電話番号", pax: "人数", time: "到着時間", notes: "特別なご要望", submit: "予約をリクエスト" },
      auth: { login: "メンバーログイン", rewards: "ゴールデンリワード", phone: "携帯電話番号", send: "コードを送信", code: "6桁のコードを入力", verify: "確認", back: "番号が間違っていますか？戻る" },
      rewards: { title: "リワード", vip: "VIPメンバー", active: "アクティブメンバー", balance: "利用可能残高", pts: "PTS", redeem: "特典を交換", locked: "ロック", action: "交換", policy: "利用規約", policyDesc: "特典を受け取るには、ご注文時にデジタルレシートをウェイターにご提示ください。店内飲食でのみ有効です。" },
      contact: { title: "お問い合わせ" },
      settings: { title: "設定", theme: "外観", light: "ライトモード", dark: "ダークモード", language: "言語", save: "設定を保存" }
  },
  ko: {
      home: { title: "골든 베이", sub: "해산물 레스토랑", book: "테이블 예약", bookDesc: "VIP 또는 홀 예약", menu: "메뉴", menuDesc: "활어 메뉴 보기", rewards: "리워드", rewardsDesc: "포인트 확인 및 교환", contact: "연락처", contactDesc: "위치 및 영업시간" },
      menu: { title: "메뉴", all: "전체", seasonal: "시즌", standard: "기본", market: "시가" },
      book: { step: "단계", of: "/", selectDate: "날짜 선택", selectSession: "시간대 선택", lunch: "점심", dinner: "저녁", pref: "좌석 선호도", vip: "VIP 룸", hall: "메인 홀", check: "예약 가능 확인", seats: "남은 좌석", guests: "명", consumable: "최소 주문액", booked: "예약됨", next: "다음: 세부 정보", details: "연락처 정보", name: "성명", phone: "휴대폰 번호", pax: "인원", time: "도착 시간", notes: "특별 요청사항", submit: "예약 제출" },
      auth: { login: "회원 로그인", rewards: "골든 리워드", phone: "휴대폰 번호", send: "코드 전송", code: "6자리 코드 입력", verify: "확인", back: "잘못된 번호입니까? 뒤로" },
      rewards: { title: "리워드", vip: "VIP 회원", active: "일반 회원", balance: "사용 가능 잔액", pts: "PTS", redeem: "리워드 교환", locked: "잠김", action: "교환", policy: "이용 약관", policyDesc: "리워드를 받으려면 주문 시 웨이터에게 디지털 영수증을 보여주세요. 매장 식사 시에만 유효합니다." },
      contact: { title: "연락처" },
      settings: { title: "설정", theme: "테마", light: "라이트 모드", dark: "다크 모드", language: "언어", save: "설정 저장" }
  }
};

// --- GLOBAL SETTINGS CONTEXT ---
const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');
  const [lang, setLang] = useState('en');

  useEffect(() => {
      const loadSettings = async () => {
          const storedTheme = await AsyncStorage.getItem('gb_theme');
          const storedLang = await AsyncStorage.getItem('gb_lang');
          if (storedTheme) setTheme(storedTheme);
          if (storedLang) setLang(storedLang);
      };
      loadSettings();
  }, []);

  const t = (key) => {
      const keys = key.split('.');
      let result = translations[lang];
      for (const k of keys) {
          if (!result || result[k] === undefined) return key;
          result = result[k];
      }
      return result;
  };

  const getLocData = (obj, fieldName) => {
    if (!obj) return "";
    if (lang === 'en') return obj[fieldName];
    return obj[`${fieldName}_${lang}`] || obj[fieldName];
  };

  const getThemeColors = () => {
      if (theme === 'dark') {
          return {
              background: '#0a0a0a',
              surface: '#1A1A1A',
              primary: '#D4AF37',
              primaryDark: '#B5952F',
              text: '#FFFFFF',
              textMuted: '#9CA3AF',
              border: '#333333',
              danger: '#EF4444',
              success: '#10B981',
              cardBg: '#1A1A1A'
          };
      }
      return COLORS;
  };

  return (
      <SettingsContext.Provider value={{ theme, setTheme, lang, setLang, t, getLocData, colors: getThemeColors() }}>
          {children}
      </SettingsContext.Provider>
  );
};


// --------------------------------------------------------
// 0. SETTINGS SCREEN
// --------------------------------------------------------
const SettingsScreen = ({ navigation }) => {
  const { theme, setTheme, lang, setLang, t, colors } = useContext(SettingsContext);

  const saveSettings = async () => {
      await AsyncStorage.setItem('gb_theme', theme);
      await AsyncStorage.setItem('gb_lang', lang);
      navigation.goBack();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><Feather name="chevron-left" size={24} color={colors.text}/></TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('settings.title')}</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('settings.theme')}</Text>
          <View style={styles.row}>
            <TouchableOpacity style={[styles.toggleBtn, { backgroundColor: colors.surface, borderColor: colors.border }, theme === 'light' && { borderColor: colors.primary }]} onPress={() => setTheme('light')}>
              <Text style={[{ color: colors.textMuted, fontSize: 12, fontWeight: '700' }, theme === 'light' && { color: colors.primary }]}>{t('settings.light')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.toggleBtn, { backgroundColor: colors.surface, borderColor: colors.border }, theme === 'dark' && { borderColor: colors.primary }]} onPress={() => setTheme('dark')}>
              <Text style={[{ color: colors.textMuted, fontSize: 12, fontWeight: '700' }, theme === 'dark' && { color: colors.primary }]}>{t('settings.dark')}</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('settings.language')}</Text>
          <View style={{ gap: 10 }}>
              {[
                  { code: 'en', label: 'English' },
                  { code: 'zh', label: '简体中文 (Simplified)' },
                  { code: 'zh_hant', label: '繁體中文 (Traditional)' },
                  { code: 'ja', label: '日本語 (Japanese)' },
                  { code: 'ko', label: '한국어 (Korean)' }
              ].map(l => (
                  <TouchableOpacity 
                      key={l.code} 
                      style={[styles.toggleBtn, { backgroundColor: colors.surface, borderColor: colors.border }, lang === l.code && { borderColor: colors.primary }]} 
                      onPress={() => setLang(l.code)}
                  >
                    <Text style={[{ color: colors.text, fontSize: 14, fontWeight: '600' }, lang === l.code && { color: colors.primary }]}>{l.label}</Text>
                  </TouchableOpacity>
              ))}
          </View>

          <TouchableOpacity style={[styles.buttonPrimary, { backgroundColor: colors.primaryDark }]} onPress={saveSettings}>
            <Text style={styles.buttonTextPrimary}>{t('settings.save')}</Text>
          </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};


// --------------------------------------------------------
// 1. HOME SCREEN
// --------------------------------------------------------
const HomeScreen = ({ navigation }) => {
  const { t, colors } = useContext(SettingsContext);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={colors.background === '#0a0a0a' ? "light-content" : "dark-content"} backgroundColor={colors.surface} />
      
      <View style={[styles.homeHeader, { backgroundColor: colors.surface, borderColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20 }]}>
        <View>
            <Text style={styles.homeTitle}>{t('home.title')}</Text>
            <Text style={styles.homeSubtitle}>{t('home.sub')}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
            <Feather name="settings" size={24} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroWrapper}>
          <View style={styles.heroBanner}>
            <View style={styles.heroOverlay}>
              <Feather name="star" size={24} color={colors.primary} style={{ marginBottom: 12 }} />
              <Text style={styles.heroLogoText}>GOLDEN BAY</Text>
              <Text style={styles.heroLogoSub}>VIP MOBILE ACCESS</Text>
            </View>
          </View>
        </View>

        <View style={styles.grid}>
          <TouchableOpacity style={[styles.gridCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]} onPress={() => navigation.navigate('Booking')} activeOpacity={0.7}>
            <View style={[styles.iconCircle, { backgroundColor: colors.background }]}><Feather name="calendar" size={22} color={colors.primaryDark} /></View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{t('home.book')}</Text>
            <Text style={[styles.cardDesc, { color: colors.textMuted }]} numberOfLines={2}>{t('home.bookDesc')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.gridCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]} onPress={() => navigation.navigate('Menu')} activeOpacity={0.7}>
            <View style={[styles.iconCircle, { backgroundColor: colors.background }]}><Feather name="book-open" size={22} color={colors.primaryDark} /></View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{t('home.menu')}</Text>
            <Text style={[styles.cardDesc, { color: colors.textMuted }]} numberOfLines={2}>{t('home.menuDesc')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.gridCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]} onPress={() => navigation.navigate('Rewards')} activeOpacity={0.7}>
            <View style={[styles.iconCircle, { backgroundColor: colors.background }]}><Feather name="gift" size={22} color={colors.primaryDark} /></View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{t('home.rewards')}</Text>
            <Text style={[styles.cardDesc, { color: colors.textMuted }]} numberOfLines={2}>{t('home.rewardsDesc')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.gridCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]} onPress={() => navigation.navigate('Contact')} activeOpacity={0.7}>
            <View style={[styles.iconCircle, { backgroundColor: colors.background }]}><Feather name="map-pin" size={22} color={colors.primaryDark} /></View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{t('home.contact')}</Text>
            <Text style={[styles.cardDesc, { color: colors.textMuted }]} numberOfLines={2}>{t('home.contactDesc')}</Text>
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
  const { t, getLocData, colors } = useContext(SettingsContext);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);

  // Focus effect ensures we fetch the data fresh every time we visit
  useFocusEffect(
    useCallback(() => {
      const fetchMenu = async () => {
        try {
          // Use plain axios to bypass token checks on public endpoints
          const res = await axios.get(`${BACKEND_URL}/api/menu/`);
          setCategories(res.data);
          if (res.data.length > 0 && !activeCategory) setActiveCategory(res.data[0].name);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchMenu();
    }, [])
  );

  const activeItems = categories.find(c => c.name === activeCategory)?.items || [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><Feather name="chevron-left" size={24} color={colors.text}/></TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('menu.title')}</Text>
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
      ) : (
        <>
          <View style={[styles.tabWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabContainer}>
              {categories.map(cat => (
                <TouchableOpacity 
                  key={cat.id} 
                  style={[styles.tab, { backgroundColor: colors.background, borderColor: colors.border }, activeCategory === cat.name && { borderColor: colors.primaryDark, backgroundColor: colors.primaryDark }]}
                  onPress={() => setActiveCategory(cat.name)}
                >
                  <Text style={[styles.tabText, { color: colors.textMuted }, activeCategory === cat.name && { color: '#FFF' }]}>{getLocData(cat, 'name')}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <FlatList
            data={activeItems}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={[styles.menuCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                {item.image ? (
                  <Image source={{ uri: item.image.startsWith('http') ? item.image : `${BACKEND_URL}${item.image}` }} style={styles.menuImage} />
                ) : (
                  <View style={[styles.menuImage, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                    <Feather name="image" size={24} color={colors.textMuted} />
                  </View>
                )}
                <View style={styles.menuContent}>
                  <Text style={[styles.menuName, { color: colors.text }]} numberOfLines={2}>{getLocData(item, 'name')}</Text>
                  {item.description ? <Text style={[styles.menuDesc, { color: colors.textMuted }]} numberOfLines={2}>{getLocData(item, 'description')}</Text> : null}
                  
                  <View style={styles.priceRow}>
                    {item.prices.map(p => (
                      <Text key={p.id} style={[styles.menuPrice, { color: colors.primaryDark }]}>
                        {p.size !== 'Regular' ? `${p.size}: ` : ''}
                        {p.is_seasonal ? <Text style={{ fontStyle: 'italic', color: colors.primary }}>{t('menu.market')}</Text> : `₱${Number(p.price).toLocaleString()}`}
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
  const { t, colors } = useContext(SettingsContext);
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
    setSelectedRoom(null); 
    try {
      // Use plain axios for public availability check to prevent token blocks
      const response = await axios.get(`${BACKEND_URL}/api/reservations/check/?date=${date}&session=${session}`);
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
      Alert.alert("Required Fields", "Please fill out Name, Contact, Pax, and Time.");
      return;
    }

    const cleanPhone = formData.contact.replace(/[\s-]/g, '');
    if (!/^(09|\+?639)\d{9}$/.test(cleanPhone)) {
      Alert.alert("Invalid Number", "Please enter a valid Philippine mobile number.");
      return;
    }

    setIsSubmitting(true);
    const payload = {
        customer_name: formData.name, 
        customer_contact: cleanPhone,
        customer_email: formData.email,
        date: date, 
        session: session, 
        time: `${formData.time}:00`, 
        pax: parseInt(formData.pax, 10),
        dining_area: selectedRoom.id, 
        special_request: formData.message, 
        status: 'PENDING',
        source: 'MOBILE_APP' 
    };

    try {
        // We can use plain axios here as well since Booking Create allows any user
        await axios.post(`${BACKEND_URL}/api/reservations/create/`, payload);
        Alert.alert("Success!", "Reservation requested! We will confirm via SMS shortly.", [
          { text: "OK", onPress: () => navigation.navigate('Home') }
        ]);
    } catch (error) {
        Alert.alert("Booking Failed", error.response?.data?.non_field_errors?.[0] || error.response?.data?.pax?.[0] || "Something went wrong.");
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : navigation.goBack()} style={styles.backBtn}><Feather name="chevron-left" size={24} color={colors.text}/></TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('book.step')} {step} {t('book.of')} 3</Text>
        <View style={{ width: 32 }} /> 
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {step === 1 && (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('book.selectDate')}</Text>
            <View style={[styles.calendarCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Calendar
                onDayPress={day => setDate(day.dateString)}
                markedDates={{ [date]: { selected: true, selectedColor: colors.primary } }}
                minDate={format(new Date(), 'yyyy-MM-dd')}
                theme={{ 
                  calendarBackground: colors.surface,
                  dayTextColor: colors.text,
                  monthTextColor: colors.text,
                  todayTextColor: colors.primaryDark, 
                  arrowColor: colors.primary,
                }}
              />
            </View>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('book.selectSession')}</Text>
            <View style={styles.row}>
              <TouchableOpacity style={[styles.toggleBtn, { backgroundColor: colors.surface, borderColor: colors.border }, session === 'LUNCH' && { borderColor: colors.primaryDark, backgroundColor: colors.primaryDark }]} onPress={() => setSession('LUNCH')}>
                <Text style={[{ color: colors.textMuted, fontSize: 12, fontWeight: '700' }, session === 'LUNCH' && { color: '#FFF' }]}>{t('book.lunch')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.toggleBtn, { backgroundColor: colors.surface, borderColor: colors.border }, session === 'DINNER' && { borderColor: colors.primaryDark, backgroundColor: colors.primaryDark }]} onPress={() => setSession('DINNER')}>
                <Text style={[{ color: colors.textMuted, fontSize: 12, fontWeight: '700' }, session === 'DINNER' && { color: '#FFF' }]}>{t('book.dinner')}</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('book.pref')}</Text>
            <View style={styles.row}>
              <TouchableOpacity style={[styles.toggleBtn, { backgroundColor: colors.surface, borderColor: colors.border }, bookingType === 'VIP' && { borderColor: colors.primaryDark, backgroundColor: colors.primaryDark }]} onPress={() => setBookingType('VIP')}>
                <Text style={[{ color: colors.textMuted, fontSize: 12, fontWeight: '700' }, bookingType === 'VIP' && { color: '#FFF' }]}>{t('book.vip')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.toggleBtn, { backgroundColor: colors.surface, borderColor: colors.border }, bookingType === 'HALL' && { borderColor: colors.primaryDark, backgroundColor: colors.primaryDark }]} onPress={() => setBookingType('HALL')}>
                <Text style={[{ color: colors.textMuted, fontSize: 12, fontWeight: '700' }, bookingType === 'HALL' && { color: '#FFF' }]}>{t('book.hall')}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={[styles.buttonPrimary, { backgroundColor: colors.primaryDark }]} onPress={handleNextToRooms}>
              <Text style={styles.buttonTextPrimary}>{t('book.check')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 2 && (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{bookingType === 'VIP' ? t('book.vip') : t('book.hall')}</Text>
            {loadingRooms ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
            ) : (
              rooms.filter(r => r.area_type === bookingType).map((room) => (
                <TouchableOpacity 
                  key={room.id} 
                  disabled={!room.is_available}
                  style={[ styles.roomCard, { backgroundColor: colors.cardBg, borderColor: colors.border }, selectedRoom?.id === room.id && { borderColor: colors.primaryDark, borderWidth: 2 }, !room.is_available && { opacity: 0.5 } ]}
                  onPress={() => setSelectedRoom(room)}
                  activeOpacity={0.8}
                >
                  <View style={styles.roomCardContent}>
                    <View style={{ flex: 1, paddingRight: 10 }}>
                      <Text style={[styles.roomName, { color: colors.text }]} numberOfLines={1}>{room.name}</Text>
                      {room.area_type === 'HALL' ? (
                         <Text style={[styles.roomCapacity, { color: colors.textMuted }]}><Feather name="users" size={12}/> {room.remaining_capacity} {t('book.seats')}</Text>
                      ) : (
                         <Text style={[styles.roomCapacity, { color: colors.textMuted }]}><Feather name="users" size={12}/> {t('book.guests')} {room.capacity}</Text>
                      )}
                      {Number(room.price) > 0 && <Text style={[styles.roomPrice, { color: colors.primaryDark }]}>₱{Number(room.price).toLocaleString()} {t('book.consumable')}</Text>}
                    </View>
                    
                    {!room.is_available ? (
                      <View style={styles.badgeDanger}><Text style={styles.badgeTextDanger}>{t('book.booked')}</Text></View>
                    ) : selectedRoom?.id === room.id ? (
                      <Feather name="check-circle" size={24} color={colors.primaryDark} />
                    ) : (
                      <Feather name="circle" size={24} color={colors.border} />
                    )}
                  </View>
                </TouchableOpacity>
              ))
            )}

            {selectedRoom && (
              <TouchableOpacity style={[styles.buttonPrimary, { backgroundColor: colors.primaryDark }]} onPress={() => setStep(3)}>
                <Text style={styles.buttonTextPrimary}>{t('book.next')}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {step === 3 && (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('book.details')}</Text>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textMuted }]}>{t('book.name')} <Text style={{color: colors.danger}}>*</Text></Text>
              <TextInput style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]} placeholderTextColor={colors.textMuted} placeholder="e.g. John Doe" value={formData.name} onChangeText={t => setFormData({...formData, name: t})} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textMuted }]}>{t('book.phone')} <Text style={{color: colors.danger}}>*</Text></Text>
              <TextInput style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]} placeholderTextColor={colors.textMuted} placeholder="e.g. 0917 123 4567" keyboardType="phone-pad" value={formData.contact} onChangeText={t => setFormData({...formData, contact: t})} />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.textMuted }]}>{t('book.pax')} <Text style={{color: colors.danger}}>*</Text></Text>
                <TextInput style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]} placeholderTextColor={colors.textMuted} placeholder="2" keyboardType="number-pad" value={formData.pax} onChangeText={t => setFormData({...formData, pax: t})} />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textMuted }]}>{t('book.time')} <Text style={{color: colors.danger}}>*</Text></Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 5 }}>
                  {getAvailableTimes().map(time => (
                    <TouchableOpacity key={time} style={[styles.timeChip, { backgroundColor: colors.surface, borderColor: colors.border }, formData.time === time && { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark }]} onPress={() => setFormData({...formData, time})}>
                      <Text style={[styles.timeText, { color: colors.text }, formData.time === time && { color: '#FFF' }]}>{time}</Text>
                    </TouchableOpacity>
                  ))}
              </ScrollView>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textMuted }]}>{t('book.notes')}</Text>
              <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top', backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]} placeholderTextColor={colors.textMuted} placeholder="Allergies, high chair..." multiline value={formData.message} onChangeText={t => setFormData({...formData, message: t})} />
            </View>

            <TouchableOpacity style={[styles.buttonPrimary, { backgroundColor: colors.primaryDark }]} onPress={handleSubmitBooking} disabled={isSubmitting || !formData.time}>
              {isSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonTextPrimary}>{t('book.submit')}</Text>}
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

// --------------------------------------------------------
// 4. REWARDS SCREEN
// --------------------------------------------------------
const RewardsScreen = ({ navigation }) => {
  const { t, getLocData, colors } = useContext(SettingsContext);
  const [step, setStep] = useState('LOADING'); 
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [customer, setCustomer] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [receiptData, setReceiptData] = useState(null);

  const groupedRewards = useMemo(() => {
    return rewards.reduce((acc, reward) => {
      if (!acc[reward.name]) {
        acc[reward.name] = { name: reward.name, name_zh: reward.name_zh, name_zh_hant: reward.name_zh_hant, name_ja: reward.name_ja, name_ko: reward.name_ko, image: reward.image, description: reward.description, options: [] };
      }
      acc[reward.name].options.push(reward);
      acc[reward.name].options.sort((a, b) => a.points_required - b.points_required);
      return acc;
    }, {});
  }, [rewards]);

  // Use plain axios to bypass interceptor blocks for the public catalog
  const fetchRewards = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/reservations/rewards/`);
      setRewards(res.data);
    } catch (err) { console.log("Failed to fetch rewards", err); }
  };

  const checkSession = async () => {
    const token = await AsyncStorage.getItem('gb_customer_token');
    const data = await AsyncStorage.getItem('gb_customer_data');
    
    // Always fetch rewards so catalog isn't empty!
    await fetchRewards();

    if (token && data) {
      setCustomer(JSON.parse(data));
      setStep('DASHBOARD');
    } else {
      setStep('LOGIN');
    }
  };

  // Refresh every time screen focuses
  useFocusEffect(
    useCallback(() => {
      checkSession();
    }, [])
  );

  const handleRequestOTP = async () => {
    setIsLoading(true);
    const cleanPhone = phone.replace(/[\s-]/g, '');
    try {
      await axios.post(`${BACKEND_URL}/api/users/request-otp/`, { phone: cleanPhone });
      setStep('OTP');
    } catch (err) {
      Alert.alert("Error", err.response?.data?.error || "Failed to send code.");
    } finally { setIsLoading(false); }
  };

  const handleVerifyOTP = async () => {
    setIsLoading(true);
    const cleanPhone = phone.replace(/[\s-]/g, '');
    try {
      const res = await axios.post(`${BACKEND_URL}/api/users/verify-otp/`, { phone: cleanPhone, otp });
      await AsyncStorage.setItem('gb_customer_token', res.data.access);
      await AsyncStorage.setItem('gb_customer_data', JSON.stringify(res.data.customer));
      setCustomer(res.data.customer);
      setStep('DASHBOARD');
    } catch (err) {
      Alert.alert("Error", "Invalid or expired code.");
    } finally { setIsLoading(false); }
  };

  const handleRedeem = async (reward) => {
    Alert.alert("Confirm", `Redeem ${reward.name} for ${reward.points_required} points?`, [
        { text: "Cancel", style: "cancel" },
        { text: "Confirm", onPress: async () => {
            try {
              const res = await axiosInstance.post('/api/reservations/rewards/redeem/', { reward_id: reward.id });
              
              setCustomer(prev => ({ ...prev, points_balance: res.data.new_balance }));
              await AsyncStorage.setItem('gb_customer_data', JSON.stringify({ ...customer, points_balance: res.data.new_balance }));
              
              setReceiptData({
                rewardName: reward.name,
                rewardSize: reward.size || 'Regular',
                points: reward.points_required,
                customerName: customer.name,
                timestamp: new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
                ticketId: Math.random().toString(36).substr(2, 8).toUpperCase()
              });
            } catch (err) {
              if (err.response && err.response.status === 401) {
                  Alert.alert("Session Expired", "Please log in again.");
                  handleLogout();
              } else {
                  Alert.alert("Error", err.response?.data?.error || "Redemption failed.");
              }
            }
        }}
    ]);
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('gb_customer_token');
    await AsyncStorage.removeItem('gb_customer_data');
    setCustomer(null);
    setPhone('');
    setOtp('');
    setStep('LOGIN');
  };

  if (step === 'LOADING') return <View style={[styles.centered, { backgroundColor: colors.background }]}><ActivityIndicator size="large" color={colors.primary}/></View>;

  if (step === 'LOGIN' || step === 'OTP') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><Feather name="chevron-left" size={24} color={colors.text}/></TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('auth.login')}</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.formContainer}>
          <View style={[styles.authCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.iconCircleLarge, { backgroundColor: colors.background }]}><Feather name="award" size={32} color={colors.primaryDark}/></View>
            <Text style={[styles.authTitle, { color: colors.text }]}>{t('auth.rewards')}</Text>
            
            {step === 'LOGIN' ? (
              <>
                <Text style={[styles.label, { color: colors.textMuted }]}>{t('auth.phone')}</Text>
                <View style={[styles.inputIconWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Feather name="phone" size={18} color={colors.textMuted} style={styles.inputIcon} />
                  <TextInput style={[styles.inputWithIcon, { color: colors.text }]} placeholderTextColor={colors.textMuted} placeholder="e.g. 0917 123 4567" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
                </View>
                <TouchableOpacity style={[styles.buttonPrimary, { backgroundColor: colors.primaryDark }]} onPress={handleRequestOTP} disabled={isLoading}>
                  {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonTextPrimary}>{t('auth.send')}</Text>}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={[styles.label, { color: colors.textMuted }]}>{t('auth.code')}</Text>
                <TextInput style={[styles.input, { fontSize: 24, textAlign: 'center', letterSpacing: 8, fontWeight: 'bold', backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]} placeholderTextColor={colors.textMuted} placeholder="000000" keyboardType="number-pad" maxLength={6} value={otp} onChangeText={setOtp} />
                <TouchableOpacity style={[styles.buttonPrimary, { backgroundColor: colors.primaryDark }]} onPress={handleVerifyOTP} disabled={isLoading}>
                  {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonTextPrimary}>{t('auth.verify')}</Text>}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setStep('LOGIN')} style={{ marginTop: 20 }}><Text style={styles.linkText}>{t('auth.back')}</Text></TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {receiptData && (
          <View style={styles.receiptOverlay}>
            <View style={styles.receiptCard}>
                <View style={styles.receiptHeader}>
                  <Feather name="check-circle" size={48} color="#10B981" style={{ marginBottom: 12 }} />
                  <Text style={styles.receiptTitle}>Reward Claimed</Text>
                  <Text style={styles.receiptId}>Ref: #{receiptData.ticketId}</Text>
                </View>
                <View style={styles.receiptBody}>
                  <Text style={styles.receiptInstruction}>⚠️ Show this screen to your server</Text>
                  <Text style={styles.receiptItem}>{receiptData.rewardName}</Text>
                  <Text style={styles.receiptSize}>Portion: {receiptData.rewardSize}</Text>
                  
                  <View style={styles.receiptDetailsRow}>
                    <Text style={styles.receiptDetailsLabel}>Guest Name</Text>
                    <Text style={styles.receiptDetailsValue}>{receiptData.customerName}</Text>
                  </View>
                  <View style={styles.receiptDetailsRow}>
                    <Text style={styles.receiptDetailsLabel}>Points Deducted</Text>
                    <Text style={[styles.receiptDetailsValue, { color: COLORS.danger }]}>-{receiptData.points} PTS</Text>
                  </View>
                  <View style={styles.receiptDetailsRow}>
                    <Text style={styles.receiptDetailsLabel}>Time</Text>
                    <Text style={styles.receiptDetailsValue}>{receiptData.timestamp}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.receiptCloseBtn} onPress={() => setReceiptData(null)}>
                  <Text style={styles.receiptCloseBtnText}>CLOSE TICKET</Text>
                </TouchableOpacity>
            </View>
          </View>
      )}

      <View style={[styles.header, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><Feather name="chevron-left" size={24} color={colors.text}/></TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('rewards.title')}</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.backBtn}><Feather name="log-out" size={20} color={colors.text}/></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
             <View style={{ flex: 1 }}>
                <Text style={[styles.profileName, { color: colors.text }]} numberOfLines={1}>{customer?.name}</Text>
                {customer?.is_vip ? (
                  <View style={styles.vipBadge}><Text style={styles.vipText}>{t('rewards.vip')}</Text></View>
                ) : (
                  <Text style={{color: colors.textMuted, fontSize: 12}}>{t('rewards.active')}</Text>
                )}
             </View>
             <View style={styles.pointsCircle}>
                <Text style={styles.pointsValue}>{customer?.points_balance?.toLocaleString() || 0}</Text>
                <Text style={styles.pointsLabel}>{t('rewards.pts')}</Text>
             </View>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('rewards.redeem')}</Text>
        {Object.values(groupedRewards).map((group) => (
            <View key={group.name} style={[styles.menuCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <View style={styles.menuImageContainer}>
                {group.image ? (
                <Image source={{ uri: group.image.startsWith('http') ? group.image : `${BACKEND_URL}${group.image}` }} style={styles.menuImageFull} />
                ) : (
                <View style={[styles.menuImagePlaceholder, { backgroundColor: colors.background }]}><Feather name="image" size={24} color={colors.textMuted} /></View>
                )}
            </View>

            <View style={styles.menuContent}>
                <Text style={[styles.menuName, { color: colors.text }]}>{getLocData(group, 'name')}</Text>
                {group.description && <Text style={[styles.menuDesc, { color: colors.textMuted }]} numberOfLines={2}>{group.description}</Text>}
                
                <View style={{ marginTop: 10 }}>
                {group.options.map((option) => {
                    const canAfford = (customer?.points_balance || 0) >= option.points_required;
                    return (
                    <View key={option.id} style={[styles.rewardOptionRow, { borderColor: colors.border }]}>
                        <View>
                          <Text style={[styles.rewardOptionSize, { color: colors.text }]}>{option.size || 'Regular'}</Text>
                          <Text style={[styles.rewardOptionPoints, { color: colors.primaryDark }]}>{option.points_required.toLocaleString()} {t('rewards.pts')}</Text>
                        </View>
                        <TouchableOpacity 
                          style={[styles.redeemBtn, { backgroundColor: colors.primaryDark }, !canAfford && { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }]}
                          disabled={!canAfford}
                          onPress={() => handleRedeem(option)}
                        >
                          <Text style={[styles.redeemBtnText, !canAfford && { color: colors.textMuted }]}>
                            {canAfford ? t('rewards.action') : t('rewards.locked')}
                          </Text>
                        </TouchableOpacity>
                    </View>
                    );
                })}
                </View>
            </View>
            </View>
        ))}
        
        <View style={[styles.policyBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <h4 style={[styles.policyTitle, { color: colors.text }]}><Feather name="clock" size={16} color={colors.primary} /> {t('rewards.policy')}</h4>
            <Text style={[styles.policyText, { color: colors.textMuted }]}>{t('rewards.policyDesc')}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// --------------------------------------------------------
// 5. CONTACT SCREEN
// --------------------------------------------------------
const ContactScreen = ({ navigation }) => {
  const { t, colors } = useContext(SettingsContext);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><Feather name="chevron-left" size={24} color={colors.text}/></TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('contact.title')}</Text>
        <View style={{ width: 32 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.contactCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.contactRow}>
            <View style={[styles.contactIconBg, { backgroundColor: colors.background }]}><Feather name="map-pin" size={20} color={colors.primaryDark} /></View>
            <Text style={[styles.contactText, { color: colors.text }]}>Lot 3&4 Block A2, Diosdado Macapagal Blvd, Pasay City</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.contactRow}>
            <View style={[styles.contactIconBg, { backgroundColor: colors.background }]}><Feather name="phone" size={20} color={colors.primaryDark} /></View>
            <Text style={[styles.contactText, { color: colors.text }]}>(02) 8804-0332{'\n'}+63 917 580 7166</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.contactRow}>
            <View style={[styles.contactIconBg, { backgroundColor: colors.background }]}><Feather name="clock" size={20} color={colors.primaryDark} /></View>
            <Text style={[styles.contactText, { color: colors.text }]}>Lunch: 11:00 AM – 2:30 PM{'\n'}Dinner: 5:00 PM – 9:30 PM</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// --------------------------------------------------------
// APP NAVIGATOR WRAPPER
// --------------------------------------------------------
export default function App() {
  return (
    <SettingsProvider>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Booking" component={BookingScreen} />
            <Stack.Screen name="Menu" component={MenuScreen} />
            <Stack.Screen name="Rewards" component={RewardsScreen} />
            <Stack.Screen name="Contact" component={ContactScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </SettingsProvider>
  );
}

// --------------------------------------------------------
// STYLES (Dynamic Context Base)
// --------------------------------------------------------
const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // Headers
  homeHeader: { paddingTop: 10, paddingBottom: 15, borderBottomWidth: 1, alignItems: 'center' },
  homeTitle: { fontSize: 22, fontWeight: '800', color: COLORS.primaryDark, letterSpacing: 4 },
  homeSubtitle: { fontSize: 10, color: COLORS.textMuted, letterSpacing: 2, marginTop: 4, fontWeight: '600' },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 15, borderBottomWidth: 1 },
  headerTitle: { fontSize: 14, letterSpacing: 2, fontWeight: '700' },
  backBtn: { padding: 6 },

  // Home Elements
  heroWrapper: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 5, marginBottom: 25 },
  heroBanner: { width: '100%', height: 180, borderRadius: 16, backgroundColor: '#0a0a0a', overflow: 'hidden' },
  heroOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  heroLogoText: { color: '#FFFFFF', fontSize: 26, fontWeight: '800', letterSpacing: 6, marginBottom: 6 },
  heroLogoSub: { color: COLORS.primary, fontSize: 10, fontWeight: 'bold', letterSpacing: 4, textTransform: 'uppercase' },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15, justifyContent: 'space-between' },
  gridCard: { width: '47.5%', padding: 20, borderRadius: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, borderWidth: 1 },
  iconCircle: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4, textAlign: 'center' },
  cardDesc: { fontSize: 11, textAlign: 'center', lineHeight: 16 },

  // Shared Structure
  scrollContent: { padding: 20, paddingBottom: 50 },
  sectionTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 25, marginBottom: 12 },
  row: { flexDirection: 'row', gap: 10 },
  divider: { height: 1, marginVertical: 5 },
  
  // Forms & Inputs
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, fontWeight: '700' },
  input: { padding: 16, borderRadius: 10, borderWidth: 1, fontSize: 16, fontWeight: '500' },
  inputIconWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10 },
  inputIcon: { paddingLeft: 16 },
  inputWithIcon: { flex: 1, padding: 16, fontSize: 16, fontWeight: '500' },
  
  buttonPrimary: { paddingVertical: 16, borderRadius: 10, alignItems: 'center', marginTop: 20, shadowColor: COLORS.primaryDark, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 3 },
  buttonTextPrimary: { color: '#FFF', fontWeight: '800', fontSize: 13, letterSpacing: 2 },

  // Toggles
  toggleBtn: { flex: 1, padding: 16, borderWidth: 1, borderRadius: 10, alignItems: 'center' },

  // Rooms View
  calendarCard: { borderRadius: 16, padding: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, borderWidth: 1 },
  roomCard: { borderRadius: 16, marginBottom: 15, borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  roomCardContent: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  roomName: { fontSize: 16, fontWeight: '800', marginBottom: 6 },
  roomCapacity: { fontSize: 12, fontWeight: '600' },
  roomPrice: { fontSize: 13, fontWeight: '800', marginTop: 6 },
  badgeDanger: { backgroundColor: '#FEE2E2', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#FCA5A5' },
  badgeTextDanger: { color: COLORS.danger, fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },

  // Time Chips
  timeGrid: { flexDirection: 'row' },
  timeChip: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, marginRight: 10 },
  timeText: { fontSize: 14, fontWeight: '600' },

  // Menu List
  tabWrapper: { height: 60, borderBottomWidth: 1 },
  tabContainer: { paddingHorizontal: 16, alignItems: 'center' },
  tab: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, borderWidth: 1, marginRight: 10 },
  tabText: { fontSize: 13, fontWeight: '700' },

  listContent: { padding: 16, paddingBottom: 40 },
  menuCard: { flexDirection: 'row', borderRadius: 16, marginBottom: 16, overflow: 'hidden', borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  menuImage: { width: 110, height: '100%' },
  menuImageContainer: { width: 110, backgroundColor: COLORS.border },
  menuImageFull: { width: '100%', height: '100%' },
  menuImagePlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  menuContent: { flex: 1, padding: 15, justifyContent: 'center' },
  menuName: { fontSize: 15, fontWeight: '800', marginBottom: 4, lineHeight: 20 },
  menuDesc: { fontSize: 12, marginBottom: 10, lineHeight: 16 },
  priceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  menuPrice: { fontSize: 13, fontWeight: '800' },

  // Auth / Rewards
  formContainer: { flex: 1, padding: 20, justifyContent: 'center' },
  authCard: { padding: 30, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15, elevation: 3, borderWidth: 1 },
  iconCircleLarge: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 15 },
  authTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 25 },
  linkText: { textAlign: 'center', fontSize: 13, fontWeight: '600', textDecorationLine: 'underline', color: COLORS.primaryDark },

  profileCard: { padding: 24, borderRadius: 16, marginBottom: 30, borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  profileName: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
  vipBadge: { backgroundColor: '#Fefce8', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: '#FEF08A' },
  vipText: { color: COLORS.primaryDark, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  pointsCircle: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#Fefce8', width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: COLORS.primaryDark },
  pointsValue: { fontSize: 22, fontWeight: '800', color: COLORS.primaryDark },
  pointsLabel: { fontSize: 10, color: COLORS.primaryDark, fontWeight: '700' },

  rewardOptionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1 },
  rewardOptionSize: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  rewardOptionPoints: { fontSize: 12, fontWeight: '800', marginTop: 2 },
  redeemBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  redeemBtnText: { color: '#FFF', fontSize: 11, fontWeight: '800', letterSpacing: 1 },

  policyBox: { marginTop: 16, padding: 20, borderRadius: 16, borderWidth: 1 },
  policyTitle: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', marginBottom: 6 },
  policyText: { fontSize: 12, lineHeight: 18 },

  // Digital Receipt Modal
  receiptOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 100, justifyContent: 'center', alignItems: 'center', padding: 20 },
  receiptCard: { width: '100%', maxWidth: 340, backgroundColor: COLORS.surface, borderRadius: 16, overflow: 'hidden' },
  receiptHeader: { backgroundColor: '#111827', padding: 30, alignItems: 'center' },
  receiptTitle: { color: COLORS.primary, fontSize: 20, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2 },
  receiptId: { color: '#9CA3AF', fontSize: 12, fontFamily: 'monospace', marginTop: 5 },
  receiptBody: { padding: 30, backgroundColor: '#F9FAFB' },
  receiptInstruction: { fontSize: 12, color: COLORS.primaryDark, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, backgroundColor: '#Fefce8', padding: 10, borderRadius: 6, overflow: 'hidden' },
  receiptItem: { fontSize: 24, fontWeight: '800', color: COLORS.text, textAlign: 'center', marginBottom: 5 },
  receiptSize: { fontSize: 12, color: COLORS.textMuted, textAlign: 'center', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: 25 },
  receiptDetailsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  receiptDetailsLabel: { fontSize: 12, color: COLORS.textMuted },
  receiptDetailsValue: { fontSize: 12, color: COLORS.text, fontWeight: 'bold' },
  receiptCloseBtn: { padding: 20, borderTopWidth: 1, borderColor: COLORS.border, alignItems: 'center', backgroundColor: '#FFFFFF' },
  receiptCloseBtnText: { color: COLORS.textMuted, fontWeight: 'bold', letterSpacing: 1 },

  // Contact
  contactCard: { borderRadius: 16, padding: 10, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 2, borderWidth: 1 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 15, paddingVertical: 16, paddingHorizontal: 10 },
  contactIconBg: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  contactText: { flex: 1, fontSize: 15, lineHeight: 24, fontWeight: '500' }
});