import React, { createContext, useState, useContext, useEffect } from 'react';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState(() => localStorage.getItem('siteLang') || 'en');

    useEffect(() => {
        localStorage.setItem('siteLang', language);
    }, [language]);

    const t = (key) => {
        const keys = key.split('.');
        let result = translations[language];
        for (const k of keys) {
            if (!result || result[k] === undefined) return key; 
            result = result[k];
        }
        return result;
    };

    const getFontClass = () => {
        switch(language) {
            case 'zh': return 'font-chinese';
            case 'zh_hant': return 'font-chinese_traditional';
            case 'ja': return 'font-japanese';
            case 'ko': return 'font-korean';
            default: return 'font-serif';
        }
    };

    const getLocData = (obj, fieldName) => {
        if (!obj) return "";
        if (language === 'en') return obj[fieldName];
        return obj[`${fieldName}_${language}`] || obj[fieldName];
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t, getFontClass, getLocData }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);

export const translations = {
    en: {
        nav: { menu: "Menu", events: "Events", news: "News & Promos", rooms: "Private Rooms", about: "About Us", contact: "Contact", book: "Book a Table" },
        footer: { explore: "Explore", contact: "Contact", hours: "Hours", lunch: "Lunch", dinner: "Dinner", address: "Lot 3&4 Block A2, Diosdado Macapagal Blvd, CBP, Pasay City, Metro Manila", rights: "Golden Bay Restaurant. All Rights Reserved." },
        home: { back: "← Back to Experience", enter: "Enter Experience", loc: "Lot 3&4 Block A2, Diosdado Macapagal Blvd, CBP, Pasay City" },
        marketing: { all: "All Updates", promo: "Promotions", blog: "Events & Stories", readMore: "Read More", limited: "Limited Offer", event: "Event", back: "← Back to News" },
        menu: { title: "Our Menu", search: "Search by name, code, or ingredient...", all: "All", empty: "No dishes found matching", clear: "Clear Search", liveCatch: "Live Catch", seasonal: "Seasonal Price", styles: "Available Cooking Styles", standard: "Standard", market: "Market Price" },
        about: { title: "Our Story", since: "Since 2009", p1: "Golden Bay Fresh Seafoods Restaurant is a landmark culinary destination in Pasay City, dedicated to the art of fine Chinese dining.", p2: "We blend traditional techniques with modern innovation to provide an unparalleled experience centered around the freshest seafood delights.", vision: "Our Vision", vDesc: "To be the premier destination for seafood lovers, celebrating the bounty of the sea through innovative dishes and memorable experiences.", mission: "Our Mission", mDesc: "To deliver excellence in every aspect—from sourcing sustainable ingredients to providing attentive, personalized service.", values: "Core Values", val1: "Excellence", val1d: "Perfection in every detail.", val2: "Integrity", val2d: "Honest sourcing & standards.", val3: "Sustainability", val3d: "Stewards of the sea.", val4: "Innovation", val4d: "Redefining tradition.", val5: "Hospitality", val5d: "Every guest is royalty.", services: "Services", sTitle: "World-Class Experiences", sDesc: "From intimate gatherings to grand celebrations, we offer versatile spaces and services tailored to your needs.", s1: "Signature Seafood Menu", s2: "Private VIP Rooms", s3: "Grand Event Spaces", s4: "Premium Delivery", bookEvent: "Book Your Event" },
        vip: { title: "Private Dining", roomType1: "Exclusive Room", roomType2: "Dining Hall", noImage: "No Image", pax: "PAX", seatsLeft: "Seats Left:", maxCap: "Max Capacity:", booked: "Booked", full: "Full", stdSetup: "Standard Setup", ready: "Ready to reserve a private room?", book: "Book Reservation" },
        events: { 
            title: "Event Inquiries", 
            subtitle: "Exquisite Venues for Life's Greatest Moments", 
            headline: "A Spectacular Stage for Your Legacy.",
            desc: "From intimate tea ceremonies to grand corporate galas, Golden Bay provides a spectacular stage for your milestones. Experience unrivaled elegance and world-class Chinese cuisine.", 
            f1Title: "Grand Banquet Hall", f1Desc: "A vast, pillar-less architectural marvel designed for grand celebrations of up to 1,200 guests.", 
            f2Title: "Versatile Function Rooms", f2Desc: "Private, sophisticated spaces perfect for business meetings, intimate weddings, or family reunions.", 
            f3Title: "Immersive Technology", f3Desc: "State-of-the-art LED walls and premium acoustics to ensure your presentations and visuals leave a lasting impression.", 
            milestones: "Milestones We Celebrate", 
            milestonesDesc: "Bespoke service and curated menus tailored perfectly to your specific occasion.",
            m1: "Weddings", m2: "Corporate", m3: "Birthdays", m4: "Banquets",
            advTitle: "The Golden Bay Advantage",
            adv1Title: "Perfectly Proportioned Spaces", adv1Desc: "Designed specifically for vibrant events of 300 to 800 guests. Your celebration will feel grand, intimate, and full of life, completely avoiding the empty atmosphere of partitioned mega-halls.",
            adv2Title: "Unrivaled Flexibility & Value", adv2Desc: "We bring your vision to life by being accommodating. Enjoy generous ingress times, complimentary use of state-of-the-art LED walls, and flexible policies for premium beverages.",
            adv3Title: "Prime Accessibility & Modern Luxury", adv3Desc: "Strategically located along Macapagal Blvd with seamless Skyway access and ample parking. Experience a modern, sophisticated aesthetic free from the heavy traffic of older districts.",
            capacities: "Capacities",
            venueSpecs: "Venue Specifications",
            space: "Function Space", banquet: "Banquet", cocktail: "Cocktail", amenities: "Amenities",
            hallName: "Grand Banquet Hall", hallDesc: "Stage, LED Wall, Full Audio",
            miniHall: "Main Dining (Bespoke)", miniDesc: "AV Ready, Buffet Area",
            vipManila: "Manila VIP Suite", vipDesc: "Private Restroom, KTV",
            consultation: "Consultation",
            connect: "Start Planning Your Event", 
            cDesc: "Our dedicated event specialists are ready to help you curate the perfect menu and logistical plan for your big day.", 
            direct: "Events Hotlines", emailInq: "Email Proposals", instant: "Instant Assistance", via: "Chat via WeChat or WhatsApp",
            scanQR: "Scan QR or save our number", coordinator: "Events Coordinator"
        },
        contact: { title: "Location & Contact", getTouch: "Get in Touch", cDesc: "Whether you have a question about our menu, need assistance finding us, or wish to inquire about corporate partnerships, our team is at your service.", addrLabel: "Address", resInq: "Reservations & Inquiries", emailLabel: "Email", hoursLabel: "Operating Hours" },
        reservation: { title: "Reservations", details: "Details", selectPref: "Select your preferred date and experience.", bookWechat: "Book via WeChat / WhatsApp", vipRooms: "VIP Private Rooms", alaCarte: "Ala Carte Dining", checking: "Checking availability...", confirmTitle: "Confirm Details", fName: "Full Name", fContact: "Contact / WhatsApp", fEmail: "Email (Optional)", fGuests: "Number of Guests", fTime: "Arrival Time", selTime: "Select Preferred Time", fNotes: "Special Request / Menu Preferences", proc: "Processing Request...", reqRes: "Request Reservation", wechatTitle: "WeChat / WhatsApp", scan: "Scan a code to chat directly with our reservation specialist.", retWeb: "Return to Web Booking", reqPend: "Request Pending", rev: "We are reviewing your details", allow: "Please allow up to 30 minutes for confirmation during operating hours. Requests made after hours will be confirmed the following morning.", retHome: "Return to Home" }
    },
    zh: {
        nav: { menu: "菜单", events: "活动", news: "新闻与优惠", rooms: "贵宾包厢", about: "关于我们", contact: "联系我们", book: "预订餐桌" },
        footer: { explore: "探索", contact: "联系", hours: "营业时间", lunch: "午餐", dinner: "晚餐", address: "帕赛市 Diosdado Macapagal 大道", rights: "金海湾海鲜酒家。保留所有权利。" },
        home: { back: "← 返回体验", enter: "开启体验", loc: "帕赛市 Diosdado Macapagal 大道" },
        marketing: { all: "全部动态", promo: "优惠促销", blog: "活动与故事", readMore: "阅读更多", limited: "限时优惠", event: "活动", back: "← 返回新闻" },
        menu: { title: "我们的菜单", search: "按名称、代码或成分搜索...", all: "全部", empty: "未找到匹配的菜品", clear: "清除搜索", liveCatch: "生猛海鲜", seasonal: "时价", styles: "可选烹饪方式", standard: "标准", market: "时价" },
        about: { title: "品牌故事", since: "始于 2009", p1: "金海湾海鲜大酒楼是帕赛市地标性的美食胜地，致力于提供高级中式餐饮的艺术体验。", p2: "我们将传统技艺与现代创新相结合，围绕最新鲜的海鲜美味提供无与伦比的体验。", vision: "我们的愿景", vDesc: "成为海鲜爱好者的首选目的地，通过创新菜肴庆祝海洋的馈赠。", mission: "我们的使命", mDesc: "在每个环节提供卓越体验——从采购可持续食材到提供超越期望的贴心服务。", values: "核心价值观", val1: "卓越", val1d: "细节尽善尽美。", val2: "诚信", val2d: "诚信采购与高标准。", val3: "可持续", val3d: "海洋的守护者。", val4: "创新", val4d: "重新定义传统。", val5: "好客", val5d: "宾至如归。", services: "服务", sTitle: "世界级的体验", sDesc: "从私人聚会到盛大庆典，我们提供多功能空间和量身定制的服务。", s1: "招牌海鲜菜单", s2: "贵宾专属包厢", s3: "盛大宴会空间", s4: "尊享外送服务", bookEvent: "预订您的活动" },
        vip: { title: "尊享私宴", roomType1: "专属包厢", roomType2: "大厅散座", noImage: "暂无图片", pax: "人", seatsLeft: "剩余座位:", maxCap: "最大容纳:", booked: "已满", full: "客满", stdSetup: "标准配置", ready: "准备预订包厢吗？", book: "立即预订" },
        events: { 
            title: "活动咨询", 
            subtitle: "为生命中最重要的时刻提供顶级场地", 
            headline: "为您传承打造的壮丽舞台。",
            desc: "从私密茶道到盛大企业年会，金海湾为您提供最辉煌的舞台。体验无与伦比的优雅和世界级的中华美食。", 
            f1Title: "豪华大宴会厅", f1Desc: "宏伟的无柱空间，专为容纳多达1200位贵宾的盛大庆典而设计。", 
            f2Title: "多功能宴会厅", f2Desc: "精致的私人空间，非常适合商务会议、小型婚礼或家庭聚会。", 
            f3Title: "沉浸式科技设备", f3Desc: "最先进的LED幕墙和顶级音响系统，确保您的视觉呈现留下深刻印象。", 
            milestones: "我们举办的盛事", 
            milestonesDesc: "为您的特殊场合量身定制的专属服务和精选菜单。",
            m1: "梦幻婚礼", m2: "企业盛典", m3: "生日寿宴", m4: "豪华宴会",
            advTitle: "金海湾的独特优势",
            adv1Title: "完美契合的空间比例", adv1Desc: "专为300至800人的活动精心设计。让您的庆典既盛大又温馨，充满活力，告别超大型分隔展厅的空旷感。",
            adv2Title: "无与伦比的灵活性与价值", adv2Desc: "我们致力于实现您的愿景。提供更充裕的进场布置时间、免费使用顶级LED幕墙以及灵活的高级酒水政策。",
            adv3Title: "优越的地理位置与现代奢华", adv3Desc: "坐落于 Macapagal 大道，紧邻 Skyway，交通便利且停车位充足。为您提供远离老旧街区拥堵的现代精致体验。",
            capacities: "场地容量",
            venueSpecs: "场地详细规格",
            space: "宴会空间", banquet: "晚宴人数", cocktail: "鸡尾酒会", amenities: "配套设施",
            hallName: "豪华大宴会厅", hallDesc: "舞台、LED墙、全套音响",
            miniHall: "主餐厅（定制空间）", miniDesc: "视听设备、自助餐区",
            vipManila: "马尼拉顶级贵宾房", vipDesc: "私人卫生间、KTV系统",
            consultation: "专属咨询",
            connect: "开始策划您的活动", 
            cDesc: "我们的专属活动专家已准备就绪，为您的大日子定制完美的菜单和执行方案。", 
            direct: "活动专线", emailInq: "策划方案咨询", instant: "即时通讯服务", via: "通过微信或WhatsApp联系",
            scanQR: "扫码或保存我们的号码", coordinator: "活动协调员"
        },
        contact: { title: "位置与联系方式", getTouch: "联系我们", cDesc: "无论您对菜单有疑问、需要寻路指引，还是希望咨询企业合作，我们的团队随时为您服务。", addrLabel: "地址", resInq: "预订与咨询", emailLabel: "电子邮件", hoursLabel: "营业时间" },
        reservation: { title: "预订座位", details: "预订详情", selectPref: "选择您的首选日期和体验。", bookWechat: "通过微信 / WhatsApp预订", vipRooms: "贵宾包厢", alaCarte: "大厅散座", checking: "正在查询...", confirmTitle: "确认详情", fName: "全名", fContact: "联系电话 / WhatsApp", fEmail: "电子邮件 (选填)", fGuests: "就餐人数", fTime: "预计到达时间", selTime: "选择时间", fNotes: "特殊要求 / 饮食偏好", proc: "处理中...", reqRes: "提交预订", wechatTitle: "微信 / WhatsApp", scan: "扫描二维码，直接与我们的预订专员沟通。", retWeb: "返回网页预订", reqPend: "预订已提交", rev: "我们正在审核您的预订信息", allow: "营业时间内请预留最多30分钟以便我们确认。非营业时间的预订将在次日上午处理。", retHome: "返回首页" }
    },
    zh_hant: {
        nav: { menu: "菜單", events: "活動", news: "新聞與優惠", rooms: "貴賓包廂", about: "關於我們", contact: "聯繫我們", book: "預訂餐桌" },
        footer: { explore: "探索", contact: "聯繫", hours: "營業時間", lunch: "午餐", dinner: "晚餐", address: "帕賽市 Diosdado Macapagal 大道", rights: "金海灣海鮮酒家。保留所有權利。" },
        home: { back: "← 返回體驗", enter: "開啟體驗", loc: "帕賽市 Diosdado Macapagal 大道" },
        marketing: { all: "全部動態", promo: "優惠促銷", blog: "活動與故事", readMore: "閱讀更多", limited: "限時優惠", event: "活動", back: "← 返回新聞" },
        menu: { title: "我們的菜單", search: "按名稱、代碼或成分搜索...", all: "全部", empty: "未找到匹配的菜品", clear: "清除搜索", liveCatch: "生猛海鮮", seasonal: "時價", styles: "可選烹飪方式", standard: "標準", market: "時價" },
        about: { title: "品牌故事", since: "始於 2009", p1: "金海灣海鮮大酒樓是帕賽市地標性的美食勝地，致力於提供高級中式餐飲的藝術體驗。", p2: "我們將傳統技藝與現代創新相結合，圍繞最新鮮的海鮮美味提供無與倫比的體驗。", vision: "我們的願景", vDesc: "成為海鮮愛好者的首選目的地，通過創新菜餚慶祝海洋的饋贈。", mission: "我們的使命", mDesc: "在每個環節提供卓越體驗——從採購可持續食材到提供超越期望的貼心服務。", values: "核心價值觀", val1: "卓越", val1d: "細節盡善盡美。", val2: "誠信", val2d: "誠信採購與高標準。", val3: "可持續", val3d: "海洋的守護者。", val4: "創新", val4d: "重新定義傳統。", val5: "好客", val5d: "賓至如歸。", services: "服務", sTitle: "世界級的體驗", sDesc: "從私人聚會到盛大慶典，我們提供多功能空間和量身定制的服務。", s1: "招牌海鮮菜單", s2: "貴賓專屬包廂", s3: "盛大宴會空間", s4: "尊享外送服務", bookEvent: "預訂您的活動" },
        vip: { title: "尊享私宴", roomType1: "專屬包廂", roomType2: "大廳散座", noImage: "暫無圖片", pax: "人", seatsLeft: "剩餘座位:", maxCap: "最大容納:", booked: "已滿", full: "客滿", stdSetup: "標準配置", ready: "準備預訂包廂嗎？", book: "立即預訂" },
        events: { 
            title: "活動諮詢", 
            subtitle: "為生命中最重要的時刻提供頂級場地", 
            headline: "為您傳承打造的壯麗舞台。",
            desc: "從私密茶道到盛大企業年會，金海灣為您提供最輝煌的舞台。體驗無與倫比的優雅和世界級的中華美食。", 
            f1Title: "豪華大宴會廳", f1Desc: "宏偉的無柱空間，專為容納多達1200位貴賓的盛大慶典而設計。", 
            f2Title: "多功能宴會廳", f2Desc: "精緻的私人空間，非常適合商務會議、小型婚禮或家庭聚會。", 
            f3Title: "沉浸式科技設備", f3Desc: "最先進的LED幕牆和頂級音響系統，確保您的視覺呈現留下深刻印象。", 
            milestones: "我們舉辦的盛事", 
            milestonesDesc: "為您的特殊場合量身定制的專屬服務和精選菜單。",
            m1: "夢幻婚禮", m2: "企業盛典", m3: "生日壽宴", m4: "豪華宴會",
            advTitle: "金海灣的獨特優勢",
            adv1Title: "完美契合的空間比例", adv1Desc: "專為300至800人的活動精心設計。讓您的慶典既盛大又溫馨，充滿活力，告別超大型分隔展廳的空曠感。",
            adv2Title: "無與倫比的靈活性與價值", adv2Desc: "我們致力於實現您的願景。提供更充裕的進場佈置時間、免費使用頂級LED幕牆以及靈活的高級酒水政策。",
            adv3Title: "優越的地理位置與現代奢華", adv3Desc: "坐落於 Macapagal 大道，緊鄰 Skyway，交通便利且停車位充足。為您提供遠離老舊街區擁堵的現代精緻體驗。",
            capacities: "場地容量",
            venueSpecs: "場地詳細規格",
            space: "宴會空間", banquet: "晚宴人數", cocktail: "雞尾酒會", amenities: "配套設施",
            hallName: "豪華大宴會廳", hallDesc: "舞台、LED牆、全套音響",
            miniHall: "主餐廳（定制空間）", miniDesc: "視聽設備、自助餐區",
            vipManila: "馬尼拉頂級貴賓房", vipDesc: "私人衛生間、KTV系統",
            consultation: "專屬諮詢",
            connect: "開始策劃您的活動", 
            cDesc: "我們的專屬活動專家已準備就緒，為您的大日子定制完美的菜單和執行方案。", 
            direct: "活動專線", emailInq: "策劃方案諮詢", instant: "即時通訊服務", via: "通過微信或WhatsApp聯繫",
            scanQR: "掃碼或保存我們的號碼", coordinator: "活動協調員"
        },
        contact: { title: "位置與聯繫方式", getTouch: "聯繫我們", cDesc: "無論您對菜單有疑問、需要尋路指引，還是希望諮詢企業合作，我們的團隊隨時為您服務。", addrLabel: "地址", resInq: "預訂與諮詢", emailLabel: "電子郵件", hoursLabel: "營業時間" },
        reservation: { title: "預訂座位", details: "預訂詳情", selectPref: "選擇您的首選日期和體驗。", bookWechat: "通過微信 / WhatsApp預訂", vipRooms: "貴賓包廂", alaCarte: "大廳散座", checking: "正在查詢...", confirmTitle: "確認詳情", fName: "全名", fContact: "聯繫電話 / WhatsApp", fEmail: "電子郵件 (選填)", fGuests: "就餐人數", fTime: "預計到達時間", selTime: "選擇時間", fNotes: "特殊要求 / 飲食偏好", proc: "處理中...", reqRes: "提交預訂", wechatTitle: "微信 / WhatsApp", scan: "掃描此二維碼，直接與我們的預訂專員溝通。", retWeb: "返回網頁預訂", reqPend: "預訂已提交", rev: "我們正在審核您的預訂信息", allow: "營業時間內請預留最多30分鐘以便我們確認。非營業時間的預訂將在次日上午處理。", retHome: "返回首頁" }
    },
    ja: {
        nav: { menu: "メニュー", events: "イベント", news: "ニュース＆プロモ", rooms: "個室", about: "私たちについて", contact: "お問い合わせ", book: "予約する" },
        footer: { explore: "探索", contact: "連絡先", hours: "営業時間", lunch: "ランチ", dinner: "ディナー", address: "パサイ市 ディオスダド・マカパガル大通り", rights: "ゴールデンベイ レストラン。全著作権所有。" },
        home: { back: "← 体験に戻る", enter: "体験を始める", loc: "パサイ市 ディオスダド・マカパガル大通り" },
        marketing: { all: "すべての更新", promo: "プロモーション", blog: "イベントとストーリー", readMore: "続きを読む", limited: "限定オファー", event: "イベント", back: "← ニュースに戻る" },
        menu: { title: "メニュー", search: "名前、コード、または材料で検索...", all: "すべて", empty: "料理が見つかりません", clear: "検索をクリア", liveCatch: "活魚", seasonal: "時価", styles: "調理方法", standard: "標準", market: "時価" },
        about: { title: "私たちの物語", since: "2009年以来", p1: "ゴールデンベイは、パサイ市にある高級中華料理のアートに捧げられた画期的な目的地です。", p2: "私たちは伝統的な技術と革新を融合させ、最も新鮮なシーフードを中心に比類のない体験を提供します。", vision: "私たちのビジョン", vDesc: "革新的な料理と思出に残る体験を通じて海の恵みを祝福すること。", mission: "私たちの使命", mDesc: "持続可能な食材の調達から、期待を超えるパーソナライズされたサービスの提供まで。", values: "コアバリュー", val1: "卓越性", val1d: "細部に至るまでの完璧さ。", val2: "誠実さ", val2d: "正直な調達と基準。", val3: "持続可能性", val3d: "海の管理者。", val4: "革新", val4d: "伝統の再定義。", val5: "おもてなし", val5d: "すべてのお客様を王族のように。", services: "サービス", sTitle: "世界クラスの体験", sDesc: "親密な集まりから壮大な祝賀会まで、お客様のニーズに合わせた多目的な空間とサービスを提供します。", s1: "シグネチャーシーフード", s2: "プライベートVIPルーム", s3: "壮大なイベントスペース", s4: "プレミアムデリバリー", bookEvent: "イベントを予約する" },
        vip: { title: "プライベートダイニング", roomType1: "個室", roomType2: "ダイニングホール", noImage: "画像なし", pax: "名様", seatsLeft: "残り席数:", maxCap: "最大定員:", booked: "予約済", full: "満席", stdSetup: "標準セットアップ", ready: "個室を予約する準備はできましたか？", book: "予約する" },
        events: { 
            title: "イベントのお問い合わせ", 
            subtitle: "人生の最高の瞬間を祝うための会場", 
            headline: "あなたのレガシーのための壮大なステージ。",
            desc: "親密なお茶会から壮大な企業のガラパーティーまで、ゴールデンベイは比類のない優雅さと世界クラスの中華料理を提供します。", 
            f1Title: "グランドバンケットホール", f1Desc: "最大1,200名様までの壮大なお祝いのために設計された、広大で柱のない建築の驚異。", 
            f2Title: "多目的なファンクションルーム", f2Desc: "ビジネスミーティング、少人数の結婚式、家族の再会に最適な、プライベートで洗練された空間。", 
            f3Title: "没入型テクノロジー", f3Desc: "最新のLEDウォールとプレミアムな音響により、プレゼンテーションと視覚効果が確実に印象に残ります。", 
            milestones: "私たちが祝うマイルストーン", 
            milestonesDesc: "特別な機会に合わせて完璧に調整された特注のサービスと厳選されたメニュー。",
            m1: "ウェディング", m2: "コーポレート", m3: "お誕生日", m4: "バンケット",
            advTitle: "ゴールデンベイの魅力",
            adv1Title: "完璧なプロポーションの空間", adv1Desc: "300〜800名様のイベントに最適な設計。巨大なホールを区切った際の空虚感を避け、壮大でありながら親密で活気に満ちたお祝いを実現します。",
            adv2Title: "比類のない柔軟性と価値", adv2Desc: "ゆとりのある搬入時間、最新LEDウォールの無料利用、プレミアム飲料の柔軟な対応など、お客様のビジョンを実現するためのサポートを惜しみません。",
            adv3Title: "抜群のアクセスとモダンなラグジュアリー", adv3Desc: "マカパガル通り沿いに位置し、スカイウェイからのアクセスも良好、十分な駐車場を完備。古い市街地の渋滞から解放された、洗練されたモダンな空間をご堪能ください。",
            capacities: "収容人数",
            venueSpecs: "会場の仕様",
            space: "ファンクションスペース", banquet: "バンケット (着席)", cocktail: "カクテル (立食)", amenities: "主な設備",
            hallName: "グランドバンケットホール", hallDesc: "ステージ、LEDウォール、フルオーディオ",
            miniHall: "メインダイニング (ミニバンケット)", miniDesc: "AV機器対応、ビュッフェエリア",
            vipManila: "VIPマニラスイート", vipDesc: "専用トイレ、KTVシステム",
            consultation: "ご相談",
            connect: "イベントの計画を始める", 
            cDesc: "カスタマイズされたイベントの性質上、専任のイベントチームが空き状況、メニュー、ロジスティクスについてご相談を承ります。", 
            direct: "イベント専用ダイヤル", emailInq: "メールでのご提案", instant: "インスタントメッセージ", via: "WeChatまたはWhatsApp経由でチャット",
            scanQR: "QRをスキャンするか、番号を保存してください", coordinator: "イベントコーディネーター"
        },
        contact: { title: "場所と連絡先", getTouch: "お問い合わせ", cDesc: "メニューに関するご質問、道案内が必要な場合、または企業パートナーシップに関するお問い合わせなど、私たちのチームが対応いたします。", addrLabel: "住所", resInq: "予約と問い合わせ", emailLabel: "メール", hoursLabel: "営業時間" },
        reservation: { title: "ご予約", details: "詳細", selectPref: "ご希望の日付と体験を選択してください。", bookWechat: "WeChat / WhatsApp で予約", vipRooms: "VIP個室", alaCarte: "アラカルトダイニング", checking: "空き状況を確認中...", confirmTitle: "詳細を確認", fName: "フルネーム", fContact: "連絡先 / WhatsApp", fEmail: "メールアドレス (任意)", fGuests: "ゲストの数", fTime: "到着時間", selTime: "希望の時間を選択", fNotes: "特別なご要望 / メニューの好み", proc: "リクエストを処理中...", reqRes: "予約をリクエストする", wechatTitle: "WeChat / WhatsApp", scan: "このコードをスキャンして、予約スペシャリストと直接チャットしてください。", retWeb: "Web予約に戻る", reqPend: "リクエスト保留中", rev: "詳細を確認しています", allow: "営業時間内のご予約は、確認まで最大30分ほどお待ちください。営業時間外のリクエストは翌朝処理されます。", retHome: "ホームに戻る" }
    },
    ko: {
        nav: { menu: "메뉴", events: "이벤트", news: "뉴스 및 프로모션", rooms: "프라이빗 룸", about: "소개", contact: "연락처", book: "테이블 예약" },
        footer: { explore: "둘러보기", contact: "연락처", hours: "영업 시간", lunch: "점심", dinner: "저녁", address: "파사이 시티, 디오스다도 마카파갈 대로", rights: "골든 베이 레스토랑. 모든 권리 보유." },
        home: { back: "← 체험으로 돌아가기", enter: "체험 시작", loc: "파사이 시티, 디오스다도 마카파갈 대로" },
        marketing: { all: "모든 소식", promo: "프로모션", blog: "이벤트 및 스토리", readMore: "더 보기", limited: "한정 혜택", event: "이벤트", back: "← 뉴스로 돌아가기" },
        menu: { title: "메뉴", search: "이름, 코드 또는 재료로 검색...", all: "전체", empty: "일치하는 요리를 찾을 수 없습니다", clear: "검색 지우기", liveCatch: "활어", seasonal: "시가", styles: "조리 방식", standard: "기본", market: "시가" },
        about: { title: "우리의 이야기", since: "2009년 설립", p1: "골든 베이 프레시 씨푸드 레스토랑은 파사이 시티의 랜드마크이자 고급 중식 다이닝의 예술을 선보이는 곳입니다.", p2: "전통적인 기술과 현대적인 혁신을 결합하여 신선한 해산물을 중심으로 놀라운 경험을 제공합니다.", vision: "우리의 비전", vDesc: "혁신적인 요리와 기억에 남는 경험을 통해 바다의 풍요로움을 축하하는 해산물 애호가들의 목적지.", mission: "우리의 사명", mDesc: "지속 가능한 식재료 조달부터 기대를 뛰어넘는 맞춤 서비스 제공까지.", values: "핵심 가치", val1: "탁월함", val1d: "모든 디테일의 완벽함.", val2: "무결성", val2d: "정직한 조달 및 표준.", val3: "지속 가능성", val3d: "바다의 관리자.", val4: "혁신", val4d: "전통의 재정의.", val5: "환대", val5d: "모든 고객을 왕족처럼.", services: "서비스", sTitle: "세계적인 수준의 경험", sDesc: "소규모 모임부터 성대한 축하 행사까지, 고객의 요구에 맞춘 다목적 공간과 서비스를 제공합니다.", s1: "시그니처 해산물", s2: "프라이빗 VIP 룸", s3: "그랜드 이벤트 공간", s4: "프리미엄 배달", bookEvent: "이벤트 예약하기" },
        vip: { title: "프라이빗 다이닝", roomType1: "독점 룸", roomType2: "다이닝 홀", noImage: "이미지 없음", pax: "명", seatsLeft: "남은 좌석:", maxCap: "최대 수용 인원:", booked: "예약됨", full: "만석", stdSetup: "기본 설정", ready: "프라이빗 룸을 예약하시겠습니까?", book: "예약하기" },
        events: { 
            title: "이벤트 문의", 
            subtitle: "인생 최고의 순간을 위한 장소", 
            headline: "당신의 레거시를 위한 장엄한 무대.",
            desc: "소규모 다과회부터 대규모 기업 행사까지, 골든 베이는 당신의 마일스톤을 위한 완벽한 무대를 제공합니다. 타의 추종을 불허하는 우아함과 세계적인 중화 요리를 경험하세요.", 
            f1Title: "그랜드 연회장", f1Desc: "최대 1,200명의 하객을 수용할 수 있도록 설계된 기둥 없는 웅장한 연회장.", 
            f2Title: "다목적 연회룸", f2Desc: "비즈니스 미팅, 소규모 웨딩, 가족 모임에 완벽하게 어울리는 프라이빗하고 세련된 공간.", 
            f3Title: "몰입형 기술", f3Desc: "최첨단 LED 비디오 월과 프리미엄 사운드 시스템으로 프레젠테이션과 영상을 더욱 돋보이게 합니다.", 
            milestones: "우리가 기념하는 마일스톤", 
            milestonesDesc: "특별한 행사를 위해 완벽하게 맞춤화된 서비스와 엄선된 메뉴.",
            m1: "웨딩", m2: "기업 행사", m3: "생일 및 파티", m4: "대규모 연회",
            advTitle: "골든 베이만의 특별한 이점",
            adv1Title: "완벽한 비율의 공간", adv1Desc: "300명에서 800명 규모의 활기찬 행사에 맞게 특별히 설계되었습니다. 거대한 홀을 파티션으로 나눴을 때의 텅 빈 느낌 없이, 웅장하면서도 친밀하고 생동감 넘치는 분위기를 제공합니다.",
            adv2Title: "비교할 수 없는 유연성과 가치", adv2Desc: "여유로운 행사 준비 시간, 최첨단 LED 비디오 월 무료 사용, 프리미엄 주류에 대한 유연한 정책 등 고객의 비전을 완벽하게 실현해 드립니다.",
            adv3Title: "최상의 접근성과 모던 럭셔리", adv3Desc: "마카파갈 대로(Macapagal Blvd)에 전략적으로 위치하여 스카이웨이 접근성이 뛰어나며 넉넉한 주차 공간을 제공합니다. 구도심의 교통 체증에서 벗어나 현대적이고 세련된 미학을 경험하세요.",
            capacities: "수용 인원",
            venueSpecs: "행사장 사양",
            space: "행사 공간", banquet: "연회 (착석)", cocktail: "칵테일 (스탠딩)", amenities: "주요 시설",
            hallName: "그랜드 연회장", hallDesc: "무대, LED 월, 풀 오디오 시스템",
            miniHall: "메인 다이닝 (미니 연회)", miniDesc: "AV 장비 완비, 뷔페 구역",
            vipManila: "VIP 마닐라 스위트", vipDesc: "전용 화장실, KTV 시스템",
            consultation: "상담",
            connect: "이벤트 기획 시작하기", 
            cDesc: "맞춤형 이벤트의 특성상, 전담 이벤트 팀이 일정, 맞춤 메뉴 및 세부 사항에 대해 논의할 준비가 되어 있습니다.", 
            direct: "이벤트 직통 전화", emailInq: "이메일 제안서 요청", instant: "빠른 상담", via: "WeChat 또는 WhatsApp을 통한 채팅",
            scanQR: "QR을 스캔하거나 번호를 저장하세요", coordinator: "이벤트 코디네이터"
        },
        contact: { title: "위치 및 연락처", getTouch: "연락하기", cDesc: "메뉴에 대한 질문이 있거나, 길 안내가 필요하거나, 기업 파트너십에 대해 문의하고 싶으시다면 저희 팀이 도와드리겠습니다.", addrLabel: "주소", resInq: "예약 및 문의", emailLabel: "이메일", hoursLabel: "영업 시간" },
        reservation: { title: "예약", details: "세부 정보", selectPref: "원하는 날짜와 경험을 선택하십시오.", bookWechat: "WeChat / WhatsApp 예약", vipRooms: "VIP 프라이빗 룸", alaCarte: "알라카르트 다이닝", checking: "예약 가능 여부 확인 중...", confirmTitle: "세부 정보 확인", fName: "성명", fContact: "연락처 / WhatsApp", fEmail: "이메일 (선택 사항)", fGuests: "게스트 수", fTime: "도착 시간", selTime: "원하는 시간 선택", fNotes: "특별 요청 / 메뉴 기본 설정", proc: "요청 처리 중...", reqRes: "예약 요청", wechatTitle: "WeChat / WhatsApp", scan: "이 코드를 스캔하여 예약 전문가와 직접 채팅하십시오.", retWeb: "웹 예약으로 돌아가기", reqPend: "요청 대기 중", rev: "세부 정보를 검토 중입니다", allow: "영업 시간 중 예약 확인에는 최대 30분이 소요됩니다. 영업 시간 외 요청은 다음 날 아침에 처리됩니다.", retHome: "홈으로 돌아가기" }
    }
};