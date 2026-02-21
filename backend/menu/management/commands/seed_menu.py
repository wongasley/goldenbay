import os
import re
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.db import transaction
from django.core.files import File
from django.conf import settings
from menu.models import Category, MenuItem, MenuItemPrice, CookingMethod

class Command(BaseCommand):
    help = 'Seeds the database with the GoldenBay menu (Multi-lingual: EN, ZH-Hans, ZH-Hant, JA, KO) and Images'

    def handle(self, *args, **options):
        
        # 1. CATEGORY TRANSLATIONS
        CATEGORY_TRANSLATIONS = {
            "Barbecue & Appetizer": {"zh": "烧烤卤味", "zh_hant": "燒烤滷味", "ja": "前菜・ロースト", "ko": "바비큐 및 에피타이저"},
            "Soup": {"zh": "汤羹", "zh_hant": "湯羹", "ja": "スープ", "ko": "수프"},
            "Sea Cucumber": {"zh": "海参", "zh_hant": "海參", "ja": "ナマコ料理", "ko": "해삼 요리"},
            "Shark Fin & Bird's Nest": {"zh": "鱼翅燕窝", "zh_hant": "魚翅燕窩", "ja": "フカヒレ・ツバメの巣", "ko": "샥스핀 및 제비집"},
            "Abalone": {"zh": "鲍鱼", "zh_hant": "鮑魚", "ja": "アワビ料理", "ko": "전복 요리"},
            "Shrimp": {"zh": "虾", "zh_hant": "蝦", "ja": "エビ料理", "ko": "새우 요리"},
            "Seafood Dishes": {"zh": "海鲜烹调", "zh_hant": "海鮮烹調", "ja": "海鮮料理", "ko": "해산물 요리"},
            "Sichuan Spicy Dishes": {"zh": "川菜系列", "zh_hant": "川菜系列", "ja": "四川風スパイシー料理", "ko": "사천식 매운 요리"},
            "Pork, Lamb, Chicken, Duck": {"zh": "猪羊鸡鸭", "zh_hant": "豬羊雞鴨", "ja": "肉料理 (豚・羊・鶏・鴨)", "ko": "고기 요리 (돼지, 양, 닭, 오리)"},
            "Beef": {"zh": "牛肉", "zh_hant": "牛肉", "ja": "牛肉料理", "ko": "소고기 요리"},
            "Bean Curd": {"zh": "豆腐", "zh_hant": "豆腐", "ja": "豆腐料理", "ko": "두부 요리"},
            "Vegetables": {"zh": "蔬菜", "zh_hant": "蔬菜", "ja": "野菜料理", "ko": "채소 요리"},
            "Rice & Noodles": {"zh": "饭面", "zh_hant": "飯麵", "ja": "ご飯・麺類", "ko": "밥 및 면 요리"},
            "Live Seafood": {"zh": "活海鲜", "zh_hant": "活海鮮", "ja": "活海鮮", "ko": "활해산물"},
            "Dimsum": {"zh": "点心", "zh_hant": "點心", "ja": "点心 (飲茶)", "ko": "딤섬"},
            "Set Menu": {"zh": "套餐", "zh_hant": "套餐", "ja": "コースメニュー", "ko": "세트 메뉴"},
        }

        # 2. LIVE SEAFOOD BASE TRANSLATIONS
        SEAFOOD_TRANSLATIONS = {
            "Mantis Shrimp": {"zh": "富贵虾 (海螳螂)", "zh_hant": "富貴蝦 (海螳螂)", "ja": "シャコ", "ko": "갯가재"},
            "Live Suahe": {"zh": "游水沙虾", "zh_hant": "游水沙蝦", "ja": "活きクルマエビ", "ko": "활 보리새우"},
            "Lobster": {"zh": "生猛龙虾", "zh_hant": "生猛龍蝦", "ja": "活きロブスター", "ko": "활 랍스터"},
            "Lapu-Lapu": {"zh": "游水石斑鱼", "zh_hant": "游水石斑魚", "ja": "ハタ (ラプラプ)", "ko": "다금바리 (라푸라푸)"},
            "Rock Lobster": {"zh": "大龙虾", "zh_hant": "大龍蝦", "ja": "イセエビ", "ko": "닭새우 (바위 랍스터)"},
            "Mud Crab": {"zh": "肉蟹", "zh_hant": "肉蟹", "ja": "マッドクラブ", "ko": "머드 크랩 (청게)"},
            "Clams": {"zh": "蛤蜊", "zh_hant": "蛤蜊", "ja": "ハマグリ", "ko": "조개"},
            "Nylon Clams": {"zh": "花蛤", "zh_hant": "花蛤", "ja": "アサリ", "ko": "바지락"},
            "Shark": {"zh": "鲨鱼", "zh_hant": "鯊魚", "ja": "サメ", "ko": "상어"}
        }

        # 3. COOKING METHOD TRANSLATIONS
        METHOD_TRANSLATIONS = {
            "Baked in Superior Stock": {"zh": "焗上汤", "zh_hant": "焗上湯", "ja": "上湯スープ焼き", "ko": "특제 육수 구이"},
            "Baked with Cheese": {"zh": "芝士焗", "zh_hant": "芝士焗", "ja": "チーズ焼き", "ko": "치즈 구이"},
            "Steamed with Garlic": {"zh": "蒜蓉蒸", "zh_hant": "蒜蓉蒸", "ja": "ニンニク蒸し", "ko": "마늘 찜"},
            "with Superior E-FU Noodles": {"zh": "上汤伊面", "zh_hant": "上湯伊麵", "ja": "上湯スープのイーフー麺添え", "ko": "특제 육수 이푸면"},
            "Salt & Pepper": {"zh": "椒盐", "zh_hant": "椒鹽", "ja": "塩胡椒炒め", "ko": "소금 후추 볶음"},
            "Salted Egg Yolk": {"zh": "金沙", "zh_hant": "金沙", "ja": "塩漬け卵黄炒め", "ko": "짭짤한 계란 노른자 볶음"},
            "Pei Fong Dong": {"zh": "避风塘炒", "zh_hant": "避風塘炒", "ja": "避風塘（フェイフォントン）風炒め", "ko": "비풍당 볶음 (홍콩식 마늘 후레이크)"},
            "Stir-Fried Ginger Onion": {"zh": "姜葱炒", "zh_hant": "薑蔥炒", "ja": "生姜とネギ炒め", "ko": "생강 파 볶음"},
            "Steamed": {"zh": "清蒸", "zh_hant": "清蒸", "ja": "清蒸 (姿蒸し)", "ko": "찜"},
        }

        # 4. IMAGE MAPPING
        IMAGE_MAP = {
            "BA01": "Barbecue/roasted_cold_cuts_combination.webp",
            "BA02": "Barbecue/crispy_roasted_pork_belly.webp",
            "BA03": "Barbecue/honey_glazed_bbq_pork_asado.webp",
            "BA04": "Barbecue/soy_sauce_chicken.webp",
            "BA05": "Barbecue/white_poached_chicken.webp",
            "BA06": "Barbecue/crispy_roasted_chicken.webp",
            "BA07": "Barbecue/crispy_fried_pigeon.webp",
            "BA08": "Barbecue/roasted_suckling_pig.webp",
            "BA09": "Barbecue/roasted_goose.webp",
            "BA10": "Barbecue/peking_duck.webp",
            "BA11": "Barbecue/roasted_rice_duck.webp",
            "BA12": "Barbecue/jellyfish_with_sesame_oil.webp",
            "BA13": "Barbecue/marinated_sliced_beef_shank.webp",
            "BA14": "Barbecue/century_egg_with_pickled_ginger.webp",
            "BA15": "Barbecue/marinated_cucumber.webp",
            "S01": "Soup/pumpkin_seafood_soup.webp",
            "S02": "Soup/spinach_seafood_soup.webp",
            "S03": "Soup/seafood_corn_soup.webp",
            "S04": "Soup/chicken_&_asparagus_soup.webp",
            "S05": "Soup/west_lake_minced_beef_soup.webp",
            "S06": "Soup/eight_treasure_winter_melon_soup.webp",
            "S07": "Soup/shanghai_hot_&_sour_soup.webp",
            "S08": "Soup/assorted_dried_seafood_soup.webp",
            "SC01": "Sea Cucumber/sea_cucumber_with_zucchini_&_shrimp_roe.webp",
            "SC02": "Sea Cucumber/braised_sea_cucumber_with_scallion.webp",
            "SC03": "Sea Cucumber/crystal_jade_sea_cucumber.webp",
            "SC04": "Sea Cucumber/sea_cucumber_with_pork_tendon_in_pot.webp",
            "SC05": "Sea Cucumber/whole_sea_cucumber_with_shrimp_roe.webp",
            "SC06": "Sea Cucumber/whole_sea_cucumber_with_shredded_pork.webp",
            "SC07": "Sea Cucumber/sea_cucumber_with_fish_maw_&_conpoy.webp",
            "SB01": "Sharks Fin/braised_superior_shark_fin_in_stone_pot.webp",
            "SB02": "Sharks Fin/superior_stock_shark_fin_in_stone_pot.webp",
            "SB03": "Sharks Fin/shark_fin_with_crab_meat.webp",
            "SB04": "Sharks Fin/stir_fried_shark_fin_with_egg_&_bean_sprouts.webp",
            "SB05": "Sharks Fin/birds_nest_with_honey.webp",
            "SB06": "Sharks Fin/birds_nest_with_coconut_milk.webp",
            "AB01": "Abalone/braised_abalone_&_seafood_pot.webp",
            "AB02": "Abalone/sliced_abalone_with_black_mushroom.webp",
            "AB03": "Abalone/diced_abalone_with_vegetables.webp",
            "AB04": "Abalone/whole_3_head_abalone_with_sea_cucumber.webp",
            "AB05": "Abalone/whole_3_head_abalone_with_fish_maw.webp",
            "AB06": "Abalone/braised_spiky_sea_cucumber_with_abalone.webp",
            "SP01": "Shrimp/hot_prawn_salad.webp",
            "SP02": "Shrimp/sauteed_prawns_with_broccoli.webp",
            "SP03": "Shrimp/sauteed_prawns_with_pomelo_sauce.webp",
            "SP04": "Shrimp/baked_prawns_with_black_&_white_pepper.webp",
            "SP05": "Shrimp/singaporean_cereal_prawns.webp",
            "SP06": "Shrimp/steamed_prawns_with_garlic_&_vermicelli.webp",
            "SP07": "Shrimp/sauteed_prawns_&_scallops_with_xo_sauce.webp",
            "SP08": "Shrimp/fried_shrimp_balls_with_lemon_sauce.webp",
            "SF01": "Seafood/sauteed_fish_fillet_with_vegetables.webp",
            "SF02": "Seafood/steamed_fish_fillet_with_garlic.webp",
            "SF03": "Seafood/eel_&_pork_tendon_with_abalone_paste.webp",
            "SF04": "Seafood/sizzling_squid_tentacles.webp",
            "SF05": "Seafood/salt_and_pepper_squid.webp",
            "SF06": "Seafood/clam_omelet_with_preserved_radish.webp",
            "SF07": "Seafood/seafood_salad_roll.webp",
            "SF08": "Seafood/diced_scallop_with_crab_roe_in_taro_ring.webp",
            "SF09": "Seafood/sauteed_scallops_with_broccoli.webp",
            "SF10": "Seafood/deep_fried_shrimp_stuffed_crab_claw.webp",
            "SF11": "Seafood/deep_fried_cheese_stuffed_shrimp_balls.webp",
            "SF12": "Seafood/steamed_lobster_meat_with_egg_white.webp",
            "SF13": "Seafood/fried_crispy_spiky_sea_cucumber_with_black_truffle.webp",
            "SF14": "Seafood/sauteed_chinese_yam_huai_shan_in_xo_sauce.webp",
            "SF15": "Seafood/pan_fried_cuttlefish_cake.webp",
            "SF16": "Seafood/scallop_with_scrambled_egg_white_and_black_truffle.webp",
            "CQ01": "Sichuan Spicy Dishes/chong_qing_spicy_fish_in_chili_oil.webp",
            "CQ02": "Sichuan Spicy Dishes/sichuan_pickled_fish.webp",
            "CQ03": "Sichuan Spicy Dishes/hot_&_sour_shredded_potato.webp",
            "CQ04": "Sichuan Spicy Dishes/sichuan_style_spicy_prawns.webp",
            "CQ05": "Sichuan Spicy Dishes/home_style_spicy_tofu.webp",
            "CQ06": "Sichuan Spicy Dishes/spicy_poached_beef_in_chili_oil.webp",
            "CQ07": "Sichuan Spicy Dishes/sauteed_sliced_beef_with_green_pepper.webp",
            "P01": "Pork, Lamb, Chicken, Duck/braised_dong_po_pork.webp",
            "P02": "Pork, Lamb, Chicken, Duck/sweet_&_sour_pork.webp",
            "P03": "Pork, Lamb, Chicken, Duck/salt_&_pepper_spare_ribs.webp",
            "P04": "Pork, Lamb, Chicken, Duck/pan_fried_kurobuta_pork.webp",
            "P05": "Pork, Lamb, Chicken, Duck/braised_pork_knuckle_pata_tim.webp",
            "P06": "Pork, Lamb, Chicken, Duck/lamb_brisket_claypot.webp",
            "P07": "Pork, Lamb, Chicken, Duck/kung_pao_chicken.webp",
            "P08": "Pork, Lamb, Chicken, Duck/spare_ribs_in_special_vinegar_sauce.webp",
            "P09": "Pork, Lamb, Chicken, Duck/hong_kong_style_mala_chicken_pot.webp",
            "P10": "Pork, Lamb, Chicken, Duck/stewed_dong_po_pork_with_dried_bamboo_shoots.webp",
            "P11": "Pork, Lamb, Chicken, Duck/steamed_minced_pork_with_3_kinds_of_egg.webp",
            "BF01": "Beef/sauteed_beef_with_broccoli.webp",
            "BF02": "Beef/beef_with_bitter_gourd_in_black_bean_sauce.webp",
            "BF03": "Beef/chinese_style_beef_tenderloin.webp",
            "BF04": "Beef/braised_beef_brisket_in_claypot.webp",
            "BF05": "Beef/curry_beef_brisket_in_claypot.webp",
            "BF06": "Beef/sizzling_short_ribs_in_black_pepper_sauce.webp",
            "BF07": "Beef/stir_fried_beef_cubes_with_potato.webp",
            "BC01": "Bean Curd/crispy_fried_bean_curd.webp",
            "BC02": "Bean Curd/mapo_tofu.webp",
            "BC03": "Bean Curd/braised_seafood_bean_curd_claypot.webp",
            "BC04": "Bean Curd/spinach_bean_curd_with_scallop.webp",
            "BC05": "Bean Curd/steamed_bean_curd_with_assorted_seafood.webp",
            "BC06": "Bean Curd/hakka_style_stuffed_bean_curd.webp",
            "VE01": "Vegetables/sauteed_imported_vegetables_with_garlic.webp",
            "VE02": "Vegetables/fried_pumpkin_with_salted_egg.webp",
            "VE03": "Vegetables/braised_brocolli_with_black_mushroom.webp",
            "VE04": "Vegetables/vegetables_with_3_kinds_of_egg.webp",
            "VE05": "Vegetables/assorted_vegetables_with_fungus_&_beancurd.webp",
            "VE06": "Vegetables/spicy_eggplant_claypot_with_minced_pork.webp",
            "VE07": "Vegetables/dried_scallop_with_golden_mushroom_&_vegetables.webp",
            "VE08": "Vegetables/sauteed_chinese_yam_huai_shan_with_mixed_mushrooms.webp",
            "VE09": "Vegetables/golden_bay_special_vegetables.webp",
            "VE10": "Vegetables/deep_fried_minced_shrimp_with_taiwan_pechay.webp",
            "RN01": "Rice & Noodles/stir_fried_beef_ho_fan.webp",
            "RN02": "Rice & Noodles/traditional_fujian_misua.webp",
            "RN03": "Rice & Noodles/pineapple_fried_rice.webp",
            "RN04": "Rice & Noodles/dried_scallop_&_egg_white_fried_rice.webp",
            "RN05": "Rice & Noodles/braised_efu_noodles_with_abalone_sauce.webp",
            "RN06": "Rice & Noodles/crispy_seafood_chow_mein.webp",
            "RN07": "Rice & Noodles/birthday_noodles.webp",
            "RN08": "Rice & Noodles/golden_bay_fried_rice.webp",
            "RN09": "Rice & Noodles/fujian_fried_rice.webp",
            "RN10": "Rice & Noodles/yang_chow_fried_rice.webp",
            "RN11": "Rice & Noodles/salted_fish_&_diced_chicken_fried_rice.webp",
            "RN12": "Rice & Noodles/sauteed_vermicelli_with_minced_pork_&_dried_shrimp.webp",
            "RN13": "Rice & Noodles/garlic_fried_rice.webp",
            "RN14": "Rice & Noodles/sauteed_noodles_with_black_truffle.webp",
            "DM01": "Dimsum/hakaw_shrimp_dumpling.webp",
            "DM02": "Dimsum/chicken_feet.webp",
            "DM03": "Dimsum/pork_siomai.webp",
            "DM04": "Dimsum/steamed_spare_ribs.webp",
            "DM05": "Dimsum/chiu_chow_dumpling.webp",
            "DM06": "Dimsum/beef_ball_with_beancurd_stick.webp",
            "DM07": "Dimsum/bean curd_sheet_roll.webp",
            "DM08": "Dimsum/glutinous_rice_wrap_machang.webp",
            "DM09": "Dimsum/crystal_spinach_dumpling.webp",
            "DM10": "Dimsum/steamed_beef_tripe_with_black_pepper.webp",
            "DM11": "Dimsum/traditional_malay_cake.webp",
            "DM12": "Dimsum/egg_tart.webp",
            "DM13": "Dimsum/baked_bbq_asado_pie.webp",
            "DM14": "Dimsum/pan_fried_radish_cake.webp",
            "DM15": "Dimsum/xo_sauce_radish_cake.webp",
            "DM16": "Dimsum/pan_fried_rice_roll_with_xo_sauce.webp",
            "DM17": "Dimsum/pan_fried_pork_bun.webp",
            "DM18": "Dimsum/century_egg_&_pork_congee.webp",
            "DM19": "Dimsum/sliced_fish_congee.webp",
            "DM20": "Dimsum/fresh_shrimp_rice_roll.webp",
            "DM21": "Dimsum/bbq_pork_asado_rice_roll.webp",
            "DM22": "Dimsum/minced_beef_rice_roll.webp",
            "DM23": "Dimsum/plain_rice_roll.webp",
            "DM24": "Dimsum/salted_egg_yolk_custard_bun.webp",
            "DM25": "Dimsum/steamed_bbq_pork_bun_asado_pao.webp",
            "DM26": "Dimsum/birthday_bun_lotus_paste.webp",
            "DM27": "Dimsum/shanghai_xiao_long_pao.webp",
            "DM28": "Dimsum/steamed_mantou.webp",
            "DM29": "Dimsum/crispy_cheese_prawn_roll.webp",
            "DM30": "Dimsum/deep_fried_taro_puff.webp",
            "DM31": "Dimsum/ham_shui_kok_fried_glutinous_rice_dumpling.webp",
            "DM32": "Dimsum/fried_sesame_balls_buchi.webp",
            "DM33": "Dimsum/fried_mantou.webp",
            "DM34": "Dimsum/coffee_jelly.webp",
            "DM35": "Dimsum/mango_mochi_snow_lady.webp",
            "DM36": "Dimsum/hot_almond_cream_with_glutinous_balls.webp",
            "DM37": "Dimsum/hot_taro_sago.webp",
            "DM38": "Dimsum/hot_black_glutinous_rice_with_coconut_milk.webp",
        }

        SEAFOOD_IMAGES = {
            "Mantis Shrimp": "sea_mantis.webp",
            "Live Suahe": "suahe.webp",
            "Lobster": "lobster.webp",
            "Lapu-Lapu": "lapu_lapu.webp",
            "Rock Lobster": "rock_lobster.webp",
            "Mud Crab": "crab.webp",
            "Clams": "clams.webp",
            "Nylon Clams": "nylon_shell.webp",
            "Shark": "shark.webp"
        }

        # 5. FULL MENU DATA
        menu_data = {
            "Barbecue & Appetizer": [
                {"code": "BA01", "en": "Roasted Cold Cuts Combination", "zh": "锦绣烧味拼盘", "zh_hant": "錦繡燒味拼盤", "ja": "冷製ロースト肉の盛り合わせ", "ko": "모듬 구이 냉채", "prices": {"S": 750, "M": 1500, "L": 2250}},
                {"code": "BA02", "en": "Crispy Roasted Pork Belly (Lechon Macau)", "zh": "金牌烧腩仔", "zh_hant": "金牌燒腩仔", "ja": "クリスピーローストポーク", "ko": "크리스피 로스트 포크 (레촌 마카오)", "prices": {"S": 680, "M": 1360, "L": 2040}},
                {"code": "BA03", "en": "Honey Glazed BBQ Pork Asado", "zh": "蜜汁烤叉烧", "zh_hant": "蜜汁烤叉燒", "ja": "ハニーローストポーク (チャーシュー)", "ko": "꿀 소스 바비큐 포크 (차슈)", "prices": {"S": 600, "M": 1200, "L": 1800}},
                {"code": "BA04", "en": "Soy Chicken", "zh": "玫瑰豉油鸡", "zh_hant": "玫瑰豉油雞", "ja": "鶏肉の醤油煮込み", "ko": "간장 닭고기 조림", "prices": {"Half": 900, "Whole": 1800}},
                {"code": "BA05", "en": "White Chicken (Hainanese Style)", "zh": "水晶白切鸡", "zh_hant": "水晶白切雞", "ja": "蒸し鶏 (ハイナン風)", "ko": "하이난식 백숙", "prices": {"Half": 900, "Whole": 1800}},
                {"code": "BA06", "en": "Crispy Roasted Chicken", "zh": "南乳吊烧鸡", "zh_hant": "南乳吊燒雞", "ja": "クリスピーローストチキン", "ko": "크리스피 로스트 치킨", "prices": {"Half": 900, "Whole": 1800}},
                {"code": "BA07", "en": "Crispy Fried Pigeon", "zh": "金牌烧乳鸽", "zh_hant": "金牌燒乳鴿", "ja": "鳩のクリスピー揚げ", "ko": "비둘기 튀김", "price": 850},
                {"code": "BA08", "en": "Roasted Suckling Pig", "zh": "鸿运烤乳猪", "zh_hant": "鴻運烤乳豬", "ja": "子豚の丸焼き", "ko": "새끼 돼지 통구이", "prices": {"Half": 5800, "Whole": 11000}},
                {"code": "BA09", "en": "Roasted Goose", "zh": "金海湾烧鹅", "zh_hant": "金海灣燒鵝", "ja": "ガチョウのロースト", "ko": "거위 로스트", "prices": {"Half": 3200, "Whole": 6000}},
                {"code": "BA10", "en": "Peking Duck", "zh": "北京片皮鸭", "zh_hant": "北京片皮鴨", "ja": "北京ダック", "ko": "베이징 덕", "prices": {"Half": 1800, "Whole": 3500}},
                {"code": "BA11", "en": "Roasted Rice Duck", "zh": "挂炉烧米鸭", "zh_hant": "掛爐燒米鴨", "ja": "ローストダック", "ko": "오리 구이", "prices": {"Half": 1600, "Whole": 3000}},
                {"code": "BA12", "en": "Jellyfish with Sesame Oil", "zh": "麻油拌海蜇", "zh_hant": "麻油拌海蜇", "ja": "クラゲのゴマ油和え", "ko": "해파리 참기름 무침", "prices": {"S": 500, "M": 1000, "L": 1500}},
                {"code": "BA13", "en": "Marinated Sliced Beef Shank", "zh": "卤水牛腱", "zh_hant": "滷水牛腱", "ja": "牛スネ肉の特製醤油漬け", "ko": "소사태 오향장육", "prices": {"S": 500, "M": 1000, "L": 1500}},
                {"code": "BA14", "en": "Century Egg with Pickled Ginger", "zh": "皮蛋酸姜", "zh_hant": "皮蛋酸薑", "ja": "ピータンと甘酢生姜", "ko": "피단과 생강 절임", "price": 288},
                {"code": "BA15", "en": "Marinated Cucumber", "zh": "凉拌青瓜", "zh_hant": "涼拌青瓜", "ja": "キュウリの冷菜", "ko": "오이 무침", "price": 288},
            ],
            "Soup": [
                {"code": "S01", "en": "Pumpkin Seafood Soup", "zh": "金瓜海皇羹", "zh_hant": "金瓜海皇羹", "ja": "カボチャと海鮮のスープ", "ko": "단호박 해산물 수프", "prices": {"S": 650, "M": 975, "L": 1300}},
                {"code": "S02", "en": "Spinach Seafood Soup", "zh": "菠菜海鲜羹", "zh_hant": "菠菜海鮮羹", "ja": "ほうれん草と海鮮のスープ", "ko": "시금치 해산물 수프", "prices": {"S": 650, "M": 975, "L": 1300}},
                {"code": "S03", "en": "Seafood Corn Soup", "zh": "海鲜粟米羹", "zh_hant": "海鮮粟米羹", "ja": "海鮮コーンスープ", "ko": "해산물 옥수수 수프", "prices": {"S": 650, "M": 975, "L": 1300}},
                {"code": "S04", "en": "Chicken & Asparagus Soup", "zh": "鲜露笋鸡片汤", "zh_hant": "鮮露筍雞片湯", "ja": "鶏肉とアスパラガスのスープ", "ko": "닭고기 아스파라거스 수프", "prices": {"S": 700, "M": 1050, "L": 1400}},
                {"code": "S05", "en": "West Lake Minced Beef Soup", "zh": "西湖牛肉羹", "zh_hant": "西湖牛肉羹", "ja": "西湖風 牛ミンチスープ", "ko": "서호 소고기 수프", "prices": {"S": 650, "M": 975, "L": 1300}},
                {"code": "S06", "en": "Eight Treasure Winter Melon Soup", "zh": "八宝冬瓜粒汤", "zh_hant": "八寶冬瓜粒湯", "ja": "八宝冬瓜スープ", "ko": "팔보 동과(겨울 멜론) 수프", "prices": {"S": 750, "M": 1125, "L": 1500}},
                {"code": "S07", "en": "Hot & Sour Soup", "zh": "上海酸辣羹", "zh_hant": "上海酸辣羹", "ja": "サンラータン (酸辣湯)", "ko": "상하이식 산라탕 (매콤새콤한 수프)", "prices": {"S": 750, "M": 1125, "L": 1500}},
                {"code": "S08", "en": "Assorted Dried Seafood Soup", "zh": "三丝海味羹", "zh_hant": "三絲海味羹", "ja": "乾燥海鮮の五目スープ", "ko": "건해산물 모듬 수프", "prices": {"S": 980, "M": 1470, "L": 1960}},
            ],
            "Sea Cucumber": [
                {"code": "SC01", "en": "Sea Cucumber with Zucchini & Shrimp Roe", "zh": "绿玉瓜虾子秃参", "zh_hant": "綠玉瓜蝦子禿參", "ja": "ナマコとズッキーニのエビ卵炒め", "ko": "해삼 쥬키니 새우알 볶음", "prices": {"S": 1800, "M": 2700, "L": 3600}},
                {"code": "SC02", "en": "Braised Sea Cucumber with Scallion", "zh": "葱烧虾子海参", "zh_hant": "蔥燒蝦子海參", "ja": "ナマコのネギ醤油煮込み", "ko": "해삼 파 볶음", "prices": {"S": 1800, "M": 2700, "L": 3600}},
                {"code": "SC03", "en": "Crystal Jade Sea Cucumber", "zh": "白玉秃参伴翡翠", "zh_hant": "白玉禿參伴翡翠", "ja": "翡翠ナマコ煮込み", "ko": "크리스탈 제이드 해삼", "prices": {"S": 2400, "M": 3600, "L": 4800}},
                {"code": "SC04", "en": "Sea Cucumber with Pork Tendon in Pot", "zh": "海参蹄筋煲", "zh_hant": "海參蹄筋煲", "ja": "ナマコと豚アキレス腱の土鍋煮込み", "ko": "해삼과 돼지 힘줄 뚝배기", "prices": {"S": 2200, "M": 3300, "L": 4400}},
                {"code": "SC05", "en": "Whole Sea Cucumber with Shrimp Roe", "zh": "虾子扣原条海参", "zh_hant": "蝦子扣原條海參", "ja": "丸ごとナマコのエビ卵煮込み", "ko": "통해삼 새우알 조림", "prices": {"M": 4500, "L": 6000}},
                {"code": "SC06", "en": "Whole Sea Cucumber with Shredded Pork", "zh": "鱼香肉丝扣原条海参", "zh_hant": "魚香肉絲扣原條海參", "ja": "丸ごとナマコと豚肉の細切りピリ辛炒め", "ko": "통해삼 돼지고기 채 볶음", "prices": {"M": 4500, "L": 6000}},
                {"code": "SC07", "en": "Sea Cucumber with Fish Maw & Conpoy", "zh": "金丝扒花胶海参", "zh_hant": "金絲扒花膠海參", "ja": "ナマコ、魚の浮き袋と干し貝柱の煮込み", "ko": "해삼, 생선 부레, 건관자 조림", "prices": {"S": 3000, "M": 4500, "L": 6000}},
            ],
            "Shark Fin & Bird's Nest": [
                {"code": "SB01", "en": "Braised Superior Shark Fin in Stone Pot", "zh": "红烧石窝鲍翅", "zh_hant": "紅燒石窩鮑翅", "ja": "特上フカヒレの石鍋煮込み", "ko": "돌솥 특급 샥스핀 찜", "price": 2200},
                {"code": "SB02", "en": "Superior Stock Shark Fin in Stone Pot", "zh": "浓汤石窝鲍翅", "zh_hant": "濃湯石窩鮑翅", "ja": "特上スープのフカヒレ石鍋", "ko": "돌솥 특상 육수 샥스핀", "price": 2200},
                {"code": "SB03", "en": "Shark Fin with Crab Meat", "zh": "红烧蟹肉翅", "zh_hant": "紅燒蟹肉翅", "ja": "蟹肉入りフカヒレスープ", "ko": "게살 샥스핀 수프", "prices": {"S": 3000, "M": 4500, "L": 6000}},
                {"code": "SB04", "en": "Stir-Fried Shark Fin with Egg & Bean Sprouts", "zh": "浓炒桂花翅", "zh_hant": "濃炒桂花翅", "ja": "フカヒレ、卵、もやしの炒め物", "ko": "계란 숙주 샥스핀 볶음", "prices": {"S": 3000, "M": 4500, "L": 6000}},
                {"code": "SB05", "en": "Bird’s Nest with Honey", "zh": "蜂蜜炖燕窝", "zh_hant": "蜂蜜燉燕窩", "ja": "ツバメの巣の蜂蜜煮", "ko": "꿀을 곁들인 제비집 요리", "price": 2400},
                {"code": "SB06", "en": "Bird’s Nest with Coconut Milk", "zh": "椰汁炖燕窝", "zh_hant": "椰汁燉燕窩", "ja": "ツバメの巣のココナッツミルク煮", "ko": "코코넛 밀크 제비집 요리", "price": 2400},
            ],
            "Abalone": [
                {"code": "AB01", "en": "Braised Abalone & Seafood Pot", "zh": "鲍鱼一品煲", "zh_hant": "鮑魚一品煲", "ja": "アワビと海鮮の土鍋煮込み", "ko": "전복 해산물 뚝배기", "prices": {"S": 2500, "M": 3750, "L": 5000}},
                {"code": "AB02", "en": "Sliced Abalone with Black Mushroom", "zh": "冬菇入口鲍片", "zh_hant": "冬菇入口鮑片", "ja": "スライスアワビと椎茸の煮込み", "ko": "전복 슬라이스와 표고버섯", "prices": {"S": 3000, "M": 4500, "L": 6000}},
                {"code": "AB03", "en": "Diced Abalone with Vegetables", "zh": "翡翠入口鲍角", "zh_hant": "翡翠入口鮑角", "ja": "角切りアワビと野菜の炒め", "ko": "전복 깍둑썰기와 채소 볶음", "prices": {"S": 3000, "M": 4500, "L": 6000}},
                {"code": "AB04", "en": "Whole 3-Head Abalone with Sea Cucumber", "zh": "原只鲍鱼扣海参", "zh_hant": "原隻鮑魚扣海參", "ja": "丸ごと３頭アワビとナマコの煮込み", "ko": "통 전복과 해삼 조림", "price": 2400},
                {"code": "AB05", "en": "Whole 3-Head Abalone with Fish Maw", "zh": "原只鲍鱼扣花胶", "zh_hant": "原隻鮑魚扣花膠", "ja": "丸ごと３頭アワビと魚の浮き袋の煮込み", "ko": "통 전복과 생선 부레 조림", "price": 2400},
                {"code": "AB06", "en": "Braised Spiky Sea Cucumber with Abalone", "zh": "红烧刺参鲍鱼", "zh_hant": "紅燒刺參鮑魚", "ja": "トゲナマコとアワビの醤油煮込み", "ko": "가시 해삼과 전복 조림", "price": 1300},
            ],
            "Shrimp": [
                {"code": "SP01", "en": "Hot Prawn Salad", "zh": "热沙律虾球", "zh_hant": "熱沙律蝦球", "ja": "エビのホットサラダ", "ko": "핫 프라운 샐러드", "prices": {"S": 1500, "M": 2250, "L": 3000}},
                {"code": "SP02", "en": "Sautéed Prawns with Broccoli", "zh": "西兰花虾球", "zh_hant": "西蘭花蝦球", "ja": "エビとブロッコリーの炒め", "ko": "새우 브로콜리 볶음", "prices": {"S": 1500, "M": 2250, "L": 3000}},
                {"code": "SP03", "en": "Sautéed Prawns with Pomelo Sauce", "zh": "柚子明虾球", "zh_hant": "柚子明蝦球", "ja": "エビのポメロソース炒め", "ko": "새우 포멜로 소스 볶음", "prices": {"S": 1500, "M": 2250, "L": 3000}},
                {"code": "SP04", "en": "Baked Prawns with Black & White Pepper", "zh": "黑白胡椒焗大虾", "zh_hant": "黑白胡椒焗大蝦", "ja": "エビの黒・白胡椒焼き", "ko": "흑백 후추 구이 대하", "prices": {"S": 1900, "M": 2850, "L": 3800}},
                {"code": "SP05", "en": "Singaporean Cereal Prawns", "zh": "星洲麦片焗海虾", "zh_hant": "星洲麥片焗海蝦", "ja": "シンガポール風シリアルエビ", "ko": "싱가포르 시리얼 새우", "prices": {"S": 1900, "M": 2850, "L": 3800}},
                {"code": "SP06", "en": "Steamed Prawns with Garlic & Vermicelli", "zh": "蒜蓉粉丝蒸大虾", "zh_hant": "蒜蓉粉絲蒸大蝦", "ja": "エビのニンニク春雨蒸し", "ko": "마늘 당면 대하 찜", "prices": {"S": 1900, "M": 2850, "L": 3800}},
                {"code": "SP07", "en": "Sautéed Prawns & Scallops with XO Sauce", "zh": "XO酱西芹炒虾球带子", "zh_hant": "XO醬西芹炒蝦球帶子", "ja": "エビとホタテのXO醤炒め", "ko": "새우와 관자 XO 소스 볶음", "prices": {"S": 2000, "M": 3000, "L": 4000}},
                {"code": "SP08", "en": "Fried Shrimp Balls with Lemon Sauce", "zh": "沙律柠檬酱炸虾球", "zh_hant": "沙律檸檬醬炸蝦球", "ja": "揚げエビ団子のレモンソース", "ko": "레몬 소스 새우 완자 튀김", "prices": {"S": 1500, "M": 2250, "L": 3000}},
            ],
            "Seafood Dishes": [
                {"code": "SF01", "en": "Sautéed Fish Fillet with Vegetables", "zh": "碧绿炒鱼片", "zh_hant": "碧綠炒魚片", "ja": "白身魚と野菜の炒め", "ko": "생선살 채소 볶음", "prices": {"S": 700, "M": 1050, "L": 1400}},
                {"code": "SF02", "en": "Steamed Fish Fillet with Garlic", "zh": "蒜茸蒸鱼柳", "zh_hant": "蒜茸蒸魚柳", "ja": "白身魚のニンニク蒸し", "ko": "생선살 마늘 찜", "prices": {"S": 550, "M": 825, "L": 1100}},
                {"code": "SF03", "en": "Eel & Pork Tendon with Abalone Sauce", "zh": "鲍鱼酱鳝球蹄筋", "zh_hant": "鮑魚醬鱔球蹄筋", "ja": "ウナギと豚アキレス腱のアワビソース煮", "ko": "장어와 돼지 힘줄 전복 소스 조림", "prices": {"S": 1200, "M": 1800, "L": 2400}},
                {"code": "SF04", "en": "Sizzling Squid Tentacles", "zh": "铁板砵酒焗墨鱼须", "zh_hant": "鐵板砵酒焗墨魚須", "ja": "イカゲソの鉄板焼き", "ko": "철판 오징어 다리 구이", "prices": {"S": 700, "M": 1050, "L": 1400}},
                {"code": "SF05", "en": "Salt and Pepper Squid", "zh": "蒜香椒盐鲜鱿花", "zh_hant": "蒜香椒鹽鮮魷花", "ja": "イカの塩胡椒揚げ", "ko": "오징어 소금 후추 튀김", "prices": {"S": 700, "M": 1050, "L": 1400}},
                {"code": "SF06", "en": "Clam Omelet with Preserved Radish", "zh": "菜脯花蛤煎蛋烙", "zh_hant": "菜脯花蛤煎蛋烙", "ja": "アサリと切り干し大根の卵焼き", "ko": "바지락 무말랭이 오믈렛", "prices": {"S": 800, "M": 1200, "L": 1600}},
                {"code": "SF07", "en": "Seafood Salad Roll", "zh": "沙律海鲜卷", "zh_hant": "沙律海鮮卷", "ja": "海鮮サラダロール", "ko": "해산물 샐러드 롤", "prices": {"S": 900, "M": 1350, "L": 1800}},
                {"code": "SF08", "en": "Diced Scallop with Crab Roe in Taro Ring", "zh": "冠军蟹珠带子崧", "zh_hant": "冠軍蟹珠帶子崧", "ja": "ホタテと蟹味噌のタロ芋リング揚げ", "ko": "게알 관자 타로 링 튀김", "prices": {"S": 1400, "M": 2100, "L": 2800}},
                {"code": "SF09", "en": "Sautéed Scallops with Broccoli", "zh": "西兰花入口带子", "zh_hant": "西蘭花入口帶子", "ja": "ホタテとブロッコリーの炒め", "ko": "관자 브로콜리 볶음", "prices": {"S": 2000, "M": 3000, "L": 4000}},
                {"code": "SF10", "en": "Deep-Fried Shrimp Stuffed Crab Claw", "zh": "香酥百花酿蟹钳", "zh_hant": "香酥百花釀蟹鉗", "ja": "蟹爪のエビすり身包み揚げ", "ko": "새우 품은 게집게발 튀김", "prices": {"S": 1800, "M": 2700, "L": 3600}},
                {"code": "SF11", "en": "Deep-Fried Cheese Stuffed Shrimp Balls", "zh": "蟹籽鲜虾芝心丸", "zh_hant": "蟹籽鮮蝦芝心丸", "ja": "チーズ入りエビ団子の揚げ物", "ko": "치즈 새우 완자 튀김", "prices": {"S": 1800, "M": 2700, "L": 3600}},
                {"code": "SF12", "en": "Steamed Lobster Meat with Egg White", "zh": "上汤蛋白蒸龙虾肉", "zh_hant": "上湯蛋白蒸龍蝦肉", "ja": "ロブスターの卵白蒸し", "ko": "랍스터 살 계란 흰자 찜", "price": "Seasonal Price"},
                {"code": "SF13", "en": "Fried Crispy Spiky Sea Cucumber with Black Truffle", "zh": "黑松露香芋脆刺参", "zh_hant": "黑松露香芋脆刺參", "ja": "クリスピーナマコの黒トリュフ風味", "ko": "블랙 트러플 크리스피 해삼 튀김", "prices": {"S": 1280, "M": 1920, "L": 2560}},
                {"code": "SF14", "en": "Sautéed Chinese Yam (Huai Shan) in XO Sauce", "zh": "XO酱炒淮山片", "zh_hant": "XO醬炒淮山片", "ja": "山芋のXO醤炒め", "ko": "마(산약) XO 소스 볶음", "prices": {"S": 800, "M": 1200, "L": 1600}},
                {"code": "SF15", "en": "Pan-Fried Cuttlefish Cake", "zh": "香煎墨鱼饼", "zh_hant": "香煎墨魚餅", "ja": "イカ団子のパンフライ", "ko": "오징어 어묵 구이", "prices": {"S": 700, "M": 1050, "L": 1400}},
                {"code": "SF16", "en": "Scallop with Scrambled Egg White & Black Truffle", "zh": "黑松露炒蛋白带子", "zh_hant": "黑松露炒蛋白帶子", "ja": "ホタテと卵白の黒トリュフ炒め", "ko": "블랙 트러플 계란 흰자 관자 볶음", "prices": {"S": 800, "M": 1200, "L": 1600}},
            ],
            "Sichuan Spicy Dishes": [
                {"code": "CQ01", "en": "Chong Qing Spicy Fish in Chili Oil", "zh": "重庆水煮鱼", "zh_hant": "重慶水煮魚", "ja": "重慶風 白身魚の唐辛子煮 (水煮魚)", "ko": "충칭식 마라 생선 전골 (수이주위)", "price": "Seasonal Price"},
                {"code": "CQ02", "en": "Sichuan Pickled Fish", "zh": "四川酸菜鱼", "zh_hant": "四川酸菜魚", "ja": "四川風 高菜と白身魚のスープ", "ko": "사천 갓절임 생선탕 (쏸차이위)", "price": "Seasonal Price"},
                {"code": "CQ03", "en": "Hot & Sour Shredded Potato", "zh": "酸辣土豆丝", "zh_hant": "酸辣土豆絲", "ja": "ジャガイモの細切り酸辣炒め", "ko": "매콤새콤 감자채 볶음", "prices": {"S": 650, "M": 975, "L": 1300}},
                {"code": "CQ04", "en": "Sichuan Style Spicy Prawns", "zh": "香辣炒虾", "zh_hant": "香辣炒蝦", "ja": "四川風スパイシーエビ炒め", "ko": "사천식 매운 새우 볶음", "prices": {"S": 1200, "M": 1800, "L": 2400}},
                {"code": "CQ05", "en": "Home-style Spicy Tofu", "zh": "家常烧豆腐", "zh_hant": "家常燒豆腐", "ja": "家庭風スパイシー豆腐", "ko": "가정식 매운 두부 요리", "prices": {"S": 900, "M": 1350, "L": 1800}},
                {"code": "CQ06", "en": "Spicy Poached Beef in Chili Oil", "zh": "四川水煮牛肉", "zh_hant": "四川水煮牛肉", "ja": "四川風 牛肉の唐辛子煮 (水煮牛)", "ko": "사천식 마라 소고기 전골 (수이주뉴루)", "prices": {"S": 1400, "M": 2100, "L": 2800}},
                {"code": "CQ07", "en": "Sautéed Sliced Beef with Green Pepper", "zh": "杭椒嫩牛肉", "zh_hant": "杭椒嫩牛肉", "ja": "牛肉と青唐辛子の炒め", "ko": "풋고추 소고기 볶음", "prices": {"S": 1000, "M": 1500, "L": 2000}},
            ],
            "Pork, Lamb, Chicken, Duck": [
                {"code": "P01", "en": "Braised Dong Po Pork", "zh": "苏杭东坡肉", "zh_hant": "蘇杭東坡肉", "ja": "豚バラ肉の角煮 (東坡肉)", "ko": "동파육", "price": 350},
                {"code": "P02", "en": "Sweet and Sour Pork", "zh": "菠萝咕噜肉", "zh_hant": "菠蘿咕嚕肉", "ja": "パイナップル入り酢豚", "ko": "파인애플 탕수육", "prices": {"S": 600, "M": 900, "L": 1200}},
                {"code": "P03", "en": "Salt & Pepper Spare Ribs", "zh": "椒盐焗肉排", "zh_hant": "椒鹽焗肉排", "ja": "スペアリブの塩胡椒揚げ", "ko": "돼지갈비 소금 후추 튀김", "prices": {"S": 600, "M": 900, "L": 1200}},
                {"code": "P04", "en": "Pan-Fried Kurobuta Pork", "zh": "香煎黑豚肉", "zh_hant": "香煎黑豚肉", "ja": "黒豚のパンフライ", "ko": "흑돼지 팬 구이", "prices": {"S": 1200, "M": 1800, "L": 2400}},
                {"code": "P05", "en": "Braised Pork Knuckle (Pata Tim)", "zh": "红烧大元蹄", "zh_hant": "紅燒大元蹄", "ja": "豚足の醤油煮込み (パタ・ティム)", "ko": "돼지 족발 간장 조림 (파타 팀)", "price": 1800},
                {"code": "P06", "en": "Lamb Brisket Claypot", "zh": "港式羊腩煲", "zh_hant": "港式羊腩煲", "ja": "ラム肉の土鍋煮込み", "ko": "양고기 뚝배기", "prices": {"S": 1800, "L": 3600}},
                {"code": "P07", "en": "Kung Pao Chicken", "zh": "宫保炒鸡丁", "zh_hant": "宮保炒雞丁", "ja": "鶏肉とカシューナッツのピリ辛炒め", "ko": "궁보계정 (닭고기 땅콩 볶음)", "prices": {"S": 600, "M": 900, "L": 1200}},
                {"code": "P08", "en": "Spare Ribs in Special Vinegar Sauce", "zh": "特制香醋排骨", "zh_hant": "特製香醋排骨", "ja": "スペアリブの特製黒酢ソース", "ko": "특제 흑초 돼지갈비", "prices": {"S": 700, "M": 1050, "L": 1400}},
                {"code": "P09", "en": "Hong Kong Style Mala Chicken Pot", "zh": "港式麻辣鸡煲", "zh_hant": "港式麻辣雞煲", "ja": "香港風 麻辣鶏鍋", "ko": "홍콩식 마라 닭고기 전골", "prices": {"S": 600, "M": 900, "L": 1200}},
                {"code": "P10", "en": "Stewed Dong Po Pork with Dried Bamboo Shoots", "zh": "干笋东坡肉", "zh_hant": "乾筍東坡肉", "ja": "乾燥タケノコ入り東坡肉", "ko": "건죽순 동파육", "prices": {"S": 1080, "M": 1620, "L": 2160}},
                {"code": "P11", "en": "Steamed Minced Pork with 3 Kinds of Egg", "zh": "三色蛋蒸肉饼", "zh_hant": "三色蛋蒸肉餅", "ja": "三種卵と豚ミンチの蒸し物", "ko": "세 가지 알을 곁들인 돼지고기 찜", "prices": {"S": 700, "M": 1050, "L": 1400}},
            ],
            "Beef": [
                {"code": "BF01", "en": "Sautéed Beef with Broccoli", "zh": "西兰花牛肉", "zh_hant": "西蘭花牛肉", "ja": "牛肉とブロッコリーの炒め", "ko": "소고기 브로콜리 볶음", "prices": {"S": 800, "M": 1200, "L": 1600}},
                {"code": "BF02", "en": "Beef with Bitter Gourd in Black Bean Sauce", "zh": "豉汁凉瓜牛肉", "zh_hant": "豉汁涼瓜牛肉", "ja": "牛肉とゴーヤの豆豉炒め", "ko": "소고기 여주(비터멜론) 블랙빈 소스 볶음", "prices": {"S": 700, "M": 1050, "L": 1400}},
                {"code": "BF03", "en": "Chinese Style Beef Tenderloin", "zh": "中式煎牛柳", "zh_hant": "中式煎牛柳", "ja": "中華風 牛テンダーロインステーキ", "ko": "중국식 소고기 안심 스테이크", "prices": {"S": 1200, "M": 1800, "L": 2400}},
                {"code": "BF04", "en": "Braised Beef Brisket in Claypot", "zh": "柱侯牛腩煲", "zh_hant": "柱侯牛腩煲", "ja": "牛バラ肉の土鍋煮込み", "ko": "소고기 양지 뚝배기", "prices": {"S": 1200, "M": 1800, "L": 2400}},
                {"code": "BF05", "en": "Curry Beef Brisket in Claypot", "zh": "马来咖喱牛腩煲", "zh_hant": "馬來咖喱牛腩煲", "ja": "マレー風 牛バラカレー土鍋", "ko": "말레이시아식 커리 소고기 뚝배기", "prices": {"S": 1200, "M": 1800, "L": 2400}},
                {"code": "BF06", "en": "Sizzling Short Ribs in Black Pepper Sauce", "zh": "铁板黑椒牛仔骨", "zh_hant": "鐵板黑椒牛仔骨", "ja": "骨付きカルビの鉄板黒胡椒焼き", "ko": "철판 흑후추 소갈비 구이", "prices": {"S": 1200, "M": 1800, "L": 2400}},
                {"code": "BF07", "en": "Stir-Fried Beef Cubes with Potato", "zh": "土豆炒牛柳粒", "zh_hant": "土豆炒牛柳粒", "ja": "サイコロ牛肉とポテトの炒め", "ko": "큐브 소고기와 감자 볶음", "prices": {"S": 800, "M": 1200, "L": 1600}},
            ],
            "Bean Curd": [
                {"code": "BC01", "en": "Crispy Fried Bean Curd", "zh": "脆皮炸豆腐", "zh_hant": "脆皮炸豆腐", "ja": "クリスピー揚げ出し豆腐", "ko": "크리스피 두부 튀김", "prices": {"S": 500, "M": 750, "L": 1000}},
                {"code": "BC02", "en": "Mapo Tofu", "zh": "麻婆豆腐", "zh_hant": "麻婆豆腐", "ja": "麻婆豆腐", "ko": "마파두부", "prices": {"S": 700, "M": 1050, "L": 1400}},
                {"code": "BC03", "en": "Braised Seafood Bean Curd Claypot", "zh": "海鲜豆腐煲", "zh_hant": "海鮮豆腐煲", "ja": "海鮮と豆腐の土鍋煮", "ko": "해산물 두부 뚝배기", "prices": {"S": 700, "M": 1050, "L": 1400}},
                {"code": "BC04", "en": "Spinach Bean Curd with Scallop", "zh": "瑶柱翡翠金砖", "zh_hant": "瑤柱翡翠金磚", "ja": "ホタテ貝柱とほうれん草豆腐の煮込み", "ko": "관자와 시금치 두부 조림", "prices": {"S": 900, "M": 1350, "L": 1800}},
                {"code": "BC05", "en": "Steamed Bean Curd with Assorted Seafood", "zh": "翠塘豆腐", "zh_hant": "翠塘豆腐", "ja": "海鮮のせ蒸し豆腐", "ko": "해산물 모듬 두부 찜", "prices": {"S": 800, "M": 1200, "L": 1600}},
                {"code": "BC06", "en": "Hakka Style Stuffed Bean Curd", "zh": "客家酿豆腐", "zh_hant": "客家釀豆腐", "ja": "客家風 肉詰め豆腐", "ko": "하카식 고기 품은 두부", "prices": {"S": 900, "M": 1350, "L": 1800}},
            ],
            "Vegetables": [
                {"code": "VE01", "en": "Sautéed Imported Vegetables with Garlic", "zh": "蒜茸炒入口时蔬", "zh_hant": "蒜茸炒入口時蔬", "ja": "輸入野菜のニンニク炒め", "ko": "수입 채소 마늘 볶음", "price": "Seasonal Price"},
                {"code": "VE02", "en": "Fried Pumpkin with Salted Egg", "zh": "黄金南瓜条", "zh_hant": "黃金南瓜條", "ja": "カボチャの塩漬け卵黄炒め", "ko": "단호박 짭짤한 계란 튀김", "prices": {"S": 500, "M": 750, "L": 1000}},
                {"code": "VE03", "en": "Braised Broccoli with Black Mushroom", "zh": "香菇扒西兰花", "zh_hant": "香菇扒西蘭花", "ja": "ブロッコリーと椎茸の煮込み", "ko": "표고버섯 브로콜리 볶음", "prices": {"S": 700, "M": 1050, "L": 1400}},
                {"code": "VE04", "en": "Vegetables with 3 Kinds of Egg", "zh": "三皇蛋时蔬", "zh_hant": "三皇蛋時蔬", "ja": "三種卵と野菜の上湯煮", "ko": "세 가지 알을 곁들인 채소 요리", "prices": {"S": 700, "M": 1050, "L": 1400}},
                {"code": "VE05", "en": "Assorted Vegetables with Fungus & Beancurd", "zh": "洪七公炒斋", "zh_hant": "洪七公炒齋", "ja": "野菜、キクラゲ、湯葉の精進炒め", "ko": "버섯 및 두부를 곁들인 모듬 채소 볶음", "prices": {"S": 700, "M": 1050, "L": 1400}},
                {"code": "VE06", "en": "Spicy Eggplant Claypot with Minced Pork", "zh": "鱼香茄子煲", "zh_hant": "魚香茄子煲", "ja": "麻婆茄子の土鍋煮込み", "ko": "돼지고기 가지 뚝배기", "prices": {"S": 600, "M": 900, "L": 1200}},
                {"code": "VE07", "en": "Dried Scallop with Golden Mushroom & Vegetables", "zh": "金瑶扒时蔬", "zh_hant": "金瑤扒時蔬", "ja": "干し貝柱とえのき茸の野菜あんかけ", "ko": "건관자와 팽이버섯 채소 볶음", "prices": {"S": 1000, "M": 1500, "L": 2000}},
                {"code": "VE08", "en": "Sautéed Chinese Yam (Huai Shan) with Mixed Mushrooms", "zh": "淮山西芹炒杂菌", "zh_hant": "淮山西芹炒雜菌", "ja": "山芋とミックスきのこの炒め", "ko": "마(산약)와 모듬 버섯 볶음", "prices": {"S": 700, "M": 1050, "L": 1400}},
                {"code": "VE09", "en": "Golden Bay Special Vegetables", "zh": "金湾招牌菜", "zh_hant": "金灣招牌菜", "ja": "ゴールデンベイ特製 野菜炒め", "ko": "골든베이 스페셜 채소 요리", "prices": {"S": 780, "M": 1180, "L": 1560}},
                {"code": "VE10", "en": "Deep Fried Minced Shrimp with Taiwan Pechay", "zh": "台式白菜炸虾茸", "zh_hant": "台式白菜炸蝦茸", "ja": "台湾白菜とエビのすり身揚げ", "ko": "타이완 배추와 다진 새우 튀김", "prices": {"S": 700, "M": 1050, "L": 1400}},
            ],
            "Rice & Noodles": [
                {"code": "RN01", "en": "Stir-Fried Beef Ho Fan", "zh": "乾炒牛河", "zh_hant": "乾炒牛河", "ja": "牛肉と平打ちライスヌードルの炒め", "ko": "소고기 볶음 넓은 쌀국수 (호펀)", "prices": {"S": 650, "M": 980, "L": 1300}},
                {"code": "RN02", "en": "Traditional Fujian Misua", "zh": "福建炒面线", "zh_hant": "福建炒麵線", "ja": "伝統的 福建焼きビーフン (ミスア)", "ko": "전통 푸젠 볶음면 (미수아)", "prices": {"S": 650, "M": 980, "L": 1300}},
                {"code": "RN03", "en": "Pineapple Fried Rice", "zh": "原只菠萝炒饭", "zh_hant": "原隻菠蘿炒飯", "ja": "パイナップルチャーハン", "ko": "파인애플 볶음밥", "prices": {"S": 980}},
                {"code": "RN04", "en": "Dried Scallop & Egg White Fried Rice", "zh": "瑶柱蛋白炒饭", "zh_hant": "瑤柱蛋白炒飯", "ja": "干し貝柱と卵白のチャーハン", "ko": "건관자와 계란 흰자 볶음밥", "prices": {"S": 800, "M": 1200, "L": 1600}},
                {"code": "RN05", "en": "Braised E-Fu Noodles with Abalone Sauce", "zh": "鲍鱼汁炆伊面", "zh_hant": "鮑魚汁炆伊麵", "ja": "イーフー麺のアワビソース煮込み", "ko": "전복 소스를 곁들인 이푸면", "prices": {"S": 600, "M": 900, "L": 1200}},
                {"code": "RN06", "en": "Crispy Seafood Chow Mein", "zh": "港式海鲜炸面", "zh_hant": "港式海鮮炸麵", "ja": "香港風 クリスピー海鮮焼きそば", "ko": "크리스피 해산물 볶음면 (차우멘)", "prices": {"S": 650, "M": 980, "L": 1300}},
                {"code": "RN07", "en": "Birthday Noodles", "zh": "生日伊面", "zh_hant": "生日伊麵", "ja": "長寿祝いの焼きそば (バースデーヌードル)", "ko": "생일 축하 이푸면", "prices": {"S": 600, "M": 900, "L": 1200}},
                {"code": "RN08", "en": "Golden Bay Fried Rice", "zh": "金海湾炒饭", "zh_hant": "金海灣炒飯", "ja": "ゴールデンベイ特製チャーハン", "ko": "골든베이 볶음밥", "prices": {"S": 800, "M": 1200, "L": 1600}},
                {"code": "RN09", "en": "Fujian Fried Rice", "zh": "福建炒饭", "zh_hant": "福建炒飯", "ja": "福建風あんかけチャーハン", "ko": "푸젠식 덮밥 볶음밥", "prices": {"S": 650, "M": 980, "L": 1300}},
                {"code": "RN10", "en": "Yang Chow Fried Rice", "zh": "杨州炒饭", "zh_hant": "楊州炒飯", "ja": "揚州チャーハン", "ko": "양저우 볶음밥", "prices": {"S": 600, "M": 900, "L": 1200}},
                {"code": "RN11", "en": "Salted Fish & Diced Chicken Fried Rice", "zh": "咸鱼鸡粒炒饭", "zh_hant": "鹹魚雞粒炒飯", "ja": "塩漬け魚と鶏肉のチャーハン", "ko": "소금에 절인 생선과 닭고기 볶음밥", "prices": {"S": 650, "M": 980, "L": 1300}},
                {"code": "RN12", "en": "Sautéed Vermicelli with Minced Pork & Dried Shrimp", "zh": "虾米肉碎炒粉丝", "zh_hant": "蝦米肉碎炒粉絲", "ja": "豚ミンチと干しエビの春雨炒め", "ko": "다진 돼지고기와 건새우 당면 볶음", "prices": {"S": 700, "M": 1050, "L": 1400}},
                {"code": "RN13", "en": "Garlic Fried Rice", "zh": "蒜蓉炒饭", "zh_hant": "蒜蓉炒飯", "ja": "ガーリックチャーハン", "ko": "마늘 볶음밥", "prices": {"S": 450, "M": 680, "L": 900}},
                {"code": "RN14", "en": "Sautéed Noodles with Black Truffle", "zh": "黑松露炒面", "zh_hant": "黑松露炒麵", "ja": "黒トリュフ焼きそば", "ko": "블랙 트러플 볶음면", "prices": {"S": 800, "M": 1200, "L": 1600}},
            ],
            "Live Seafood": [
                {"code": "LS01", "en": "Mantis Shrimp (Baked in Superior Stock)", "zh": "海螳螂焗上汤", "zh_hant": "海螳螂焗上湯", "ja": "シャコ (上湯スープ焼き)", "ko": "갯가재 (특제 육수 구이)", "price": "Seasonal Price"},
                {"code": "LS02", "en": "Mantis Shrimp (Baked with Cheese)", "zh": "芝士焗海螳螂", "zh_hant": "芝士焗海螳螂", "ja": "シャコ (チーズ焼き)", "ko": "갯가재 (치즈 구이)", "price": "Seasonal Price"},
                {"code": "LS03", "en": "Mantis Shrimp (Steamed with Garlic)", "zh": "蒜蓉蒸海螳螂", "zh_hant": "蒜蓉蒸海螳螂", "ja": "シャコ (ニンニク蒸し)", "ko": "갯가재 (마늘 찜)", "price": "Seasonal Price"},
                {"code": "LS04", "en": "Mantis Shrimp (with Superior E-FU Noodles)", "zh": "海螳螂上汤伊面", "zh_hant": "海螳螂上湯伊麵", "ja": "シャコ (イーフー麺添え)", "ko": "갯가재 (이푸면 곁들임)", "price": "Seasonal Price"},
                {"code": "LS05", "en": "Mantis Shrimp (Salt & Pepper)", "zh": "椒盐海螳螂", "zh_hant": "椒鹽海螳螂", "ja": "シャコ (塩胡椒炒め)", "ko": "갯가재 (소금 후추 튀김)", "price": "Seasonal Price"},
                {"code": "LS06", "en": "Mantis Shrimp (Salted Egg Yolk)", "zh": "金沙海螳螂", "zh_hant": "金沙海螳螂", "ja": "シャコ (塩漬け卵黄炒め)", "ko": "갯가재 (짭짤한 계란 노른자 볶음)", "price": "Seasonal Price"},
                {"code": "LS07", "en": "Mantis Shrimp (Pei Fong Dong)", "zh": "避风塘炒海螳螂", "zh_hant": "避風塘炒海螳螂", "ja": "シャコ (避風塘炒め)", "ko": "갯가재 (홍콩식 마늘 후레이크 볶음)", "price": "Seasonal Price"},
                {"code": "LS08", "en": "Mantis Shrimp (Stir-Fried Ginger Onion)", "zh": "姜葱炒海螳螂", "zh_hant": "薑蔥炒海螳螂", "ja": "シャコ (生姜とネギ炒め)", "ko": "갯가재 (생강 파 볶음)", "price": "Seasonal Price"},
                {"code": "LS09", "en": "Mantis Shrimp (Steamed)", "zh": "清蒸海螳螂", "zh_hant": "清蒸海螳螂", "ja": "シャコ (姿蒸し)", "ko": "갯가재 (찜)", "price": "Seasonal Price"},
                {"code": "LS10", "en": "Live Suahe (Baked in Superior Stock)", "zh": "沙虾焗上汤", "zh_hant": "沙蝦焗上湯", "ja": "活きクルマエビ (上湯スープ焼き)", "ko": "활 보리새우 (특제 육수 구이)", "price": "Seasonal Price"},
                {"code": "LS11", "en": "Live Suahe (Baked with Cheese)", "zh": "芝士焗沙虾", "zh_hant": "芝士焗沙蝦", "ja": "活きクルマエビ (チーズ焼き)", "ko": "활 보리새우 (치즈 구이)", "price": "Seasonal Price"},
                {"code": "LS12", "en": "Live Suahe (Steamed with Garlic)", "zh": "蒜蓉蒸沙虾", "zh_hant": "蒜蓉蒸沙蝦", "ja": "活きクルマエビ (ニンニク蒸し)", "ko": "활 보리새우 (마늘 찜)", "price": "Seasonal Price"},
                {"code": "LS13", "en": "Live Suahe (with Superior E-FU Noodles)", "zh": "沙虾上汤伊面", "zh_hant": "沙蝦上湯伊麵", "ja": "活きクルマエビ (イーフー麺添え)", "ko": "활 보리새우 (이푸면 곁들임)", "price": "Seasonal Price"},
                {"code": "LS14", "en": "Live Suahe (Salt & Pepper)", "zh": "椒盐沙虾", "zh_hant": "椒鹽沙蝦", "ja": "活きクルマエビ (塩胡椒炒め)", "ko": "활 보리새우 (소금 후추 튀김)", "price": "Seasonal Price"},
                {"code": "LS15", "en": "Live Suahe (Salted Egg Yolk)", "zh": "金沙沙虾", "zh_hant": "金沙沙蝦", "ja": "活きクルマエビ (塩漬け卵黄炒め)", "ko": "활 보리새우 (짭짤한 계란 노른자 볶음)", "price": "Seasonal Price"},
                {"code": "LS16", "en": "Live Suahe (Pei Fong Dong)", "zh": "避风塘炒沙虾", "zh_hant": "避風塘炒沙蝦", "ja": "活きクルマエビ (避風塘炒め)", "ko": "활 보리새우 (홍콩식 마늘 후레이크 볶음)", "price": "Seasonal Price"},
                {"code": "LS17", "en": "Live Suahe (Stir-Fried Ginger Onion)", "zh": "姜葱炒沙虾", "zh_hant": "薑蔥炒沙蝦", "ja": "活きクルマエビ (生姜とネギ炒め)", "ko": "활 보리새우 (생강 파 볶음)", "price": "Seasonal Price"},
                {"code": "LS18", "en": "Live Suahe (Steamed)", "zh": "清蒸沙虾", "zh_hant": "清蒸沙蝦", "ja": "活きクルマエビ (姿蒸し)", "ko": "활 보리새우 (찜)", "price": "Seasonal Price"},
                {"code": "LS19", "en": "Lobster (Baked in Superior Stock)", "zh": "龙虾焗上汤", "zh_hant": "龍蝦焗上湯", "ja": "活きロブスター (上湯スープ焼き)", "ko": "활 랍스터 (특제 육수 구이)", "price": "Seasonal Price"},
                {"code": "LS20", "en": "Lobster (Baked with Cheese)", "zh": "芝士焗龙虾", "zh_hant": "芝士焗龍蝦", "ja": "活きロブスター (チーズ焼き)", "ko": "활 랍스터 (치즈 구이)", "price": "Seasonal Price"},
                {"code": "LS21", "en": "Lobster (Steamed with Garlic)", "zh": "蒜蓉蒸龙虾", "zh_hant": "蒜蓉蒸龍蝦", "ja": "活きロブスター (ニンニク蒸し)", "ko": "활 랍스터 (마늘 찜)", "price": "Seasonal Price"},
                {"code": "LS22", "en": "Lobster (with Superior E-FU Noodles)", "zh": "龙虾上汤伊面", "zh_hant": "龍蝦上湯伊麵", "ja": "活きロブスター (イーフー麺添え)", "ko": "활 랍스터 (이푸면 곁들임)", "price": "Seasonal Price"},
                {"code": "LS23", "en": "Lobster (Salt & Pepper)", "zh": "椒盐龙虾", "zh_hant": "椒鹽龍蝦", "ja": "活きロブスター (塩胡椒炒め)", "ko": "활 랍스터 (소금 후추 튀김)", "price": "Seasonal Price"},
                {"code": "LS24", "en": "Lobster (Salted Egg Yolk)", "zh": "金沙龙虾", "zh_hant": "金沙龍蝦", "ja": "活きロブスター (塩漬け卵黄炒め)", "ko": "활 랍스터 (짭짤한 계란 노른자 볶음)", "price": "Seasonal Price"},
                {"code": "LS25", "en": "Lobster (Pei Fong Dong)", "zh": "避风塘炒龙虾", "zh_hant": "避風塘炒龍蝦", "ja": "活きロブスター (避風塘炒め)", "ko": "활 랍스터 (홍콩식 마늘 후레이크 볶음)", "price": "Seasonal Price"},
                {"code": "LS26", "en": "Lobster (Stir-Fried Ginger Onion)", "zh": "姜葱炒龙虾", "zh_hant": "薑蔥炒龍蝦", "ja": "活きロブスター (生姜とネギ炒め)", "ko": "활 랍스터 (생강 파 볶음)", "price": "Seasonal Price"},
                {"code": "LS27", "en": "Lobster (Steamed)", "zh": "清蒸龙虾", "zh_hant": "清蒸龍蝦", "ja": "活きロブスター (姿蒸し)", "ko": "활 랍스터 (찜)", "price": "Seasonal Price"},
                {"code": "LS28", "en": "Lapu-Lapu (Baked in Superior Stock)", "zh": "石斑鱼焗上汤", "zh_hant": "石斑魚焗上湯", "ja": "ハタ (上湯スープ焼き)", "ko": "다금바리 (특제 육수 구이)", "price": "Seasonal Price"},
                {"code": "LS29", "en": "Lapu-Lapu (Baked with Cheese)", "zh": "芝士焗石斑鱼", "zh_hant": "芝士焗石斑魚", "ja": "ハタ (チーズ焼き)", "ko": "다금바리 (치즈 구이)", "price": "Seasonal Price"},
                {"code": "LS30", "en": "Lapu-Lapu (Steamed with Garlic)", "zh": "蒜蓉蒸石斑鱼", "zh_hant": "蒜蓉蒸石斑魚", "ja": "ハタ (ニンニク蒸し)", "ko": "다금바리 (마늘 찜)", "price": "Seasonal Price"},
                {"code": "LS31", "en": "Lapu-Lapu (with Superior E-FU Noodles)", "zh": "石斑鱼上汤伊面", "zh_hant": "石斑魚上湯伊麵", "ja": "ハタ (イーフー麺添え)", "ko": "다금바리 (이푸면 곁들임)", "price": "Seasonal Price"},
                {"code": "LS32", "en": "Lapu-Lapu (Salt & Pepper)", "zh": "椒盐石斑鱼", "zh_hant": "椒鹽石斑魚", "ja": "ハタ (塩胡椒炒め)", "ko": "다금바리 (소금 후추 튀김)", "price": "Seasonal Price"},
                {"code": "LS33", "en": "Lapu-Lapu (Salted Egg Yolk)", "zh": "金沙石斑鱼", "zh_hant": "金沙石斑魚", "ja": "ハタ (塩漬け卵黄炒め)", "ko": "다금바리 (짭짤한 계란 노른자 볶음)", "price": "Seasonal Price"},
                {"code": "LS34", "en": "Lapu-Lapu (Pei Fong Dong)", "zh": "避风塘炒石斑鱼", "zh_hant": "避風塘炒石斑魚", "ja": "ハタ (避風塘炒め)", "ko": "다금바리 (홍콩식 마늘 후레이크 볶음)", "price": "Seasonal Price"},
                {"code": "LS35", "en": "Lapu-Lapu (Stir-Fried Ginger Onion)", "zh": "姜葱炒石斑鱼", "zh_hant": "薑蔥炒石斑魚", "ja": "ハタ (生姜とネギ炒め)", "ko": "다금바리 (생강 파 볶음)", "price": "Seasonal Price"},
                {"code": "LS36", "en": "Lapu-Lapu (Steamed)", "zh": "清蒸石斑鱼", "zh_hant": "清蒸石斑魚", "ja": "ハタ (姿蒸し)", "ko": "다금바리 (찜)", "price": "Seasonal Price"},
                {"code": "LS37", "en": "Rock Lobster (Baked in Superior Stock)", "zh": "大龙虾焗上汤", "zh_hant": "大龍蝦焗上湯", "ja": "イセエビ (上湯スープ焼き)", "ko": "닭새우 (특제 육수 구이)", "price": "Seasonal Price"},
                {"code": "LS38", "en": "Rock Lobster (Baked with Cheese)", "zh": "芝士焗大龙虾", "zh_hant": "芝士焗大龍蝦", "ja": "イセエビ (チーズ焼き)", "ko": "닭새우 (치즈 구이)", "price": "Seasonal Price"},
                {"code": "LS39", "en": "Rock Lobster (Steamed with Garlic)", "zh": "蒜蓉蒸大龙虾", "zh_hant": "蒜蓉蒸大龍蝦", "ja": "イセエビ (ニンニク蒸し)", "ko": "닭새우 (마늘 찜)", "price": "Seasonal Price"},
                {"code": "LS40", "en": "Rock Lobster (with Superior E-FU Noodles)", "zh": "大龙虾上汤伊面", "zh_hant": "大龍蝦上湯伊麵", "ja": "イセエビ (イーフー麺添え)", "ko": "닭새우 (이푸면 곁들임)", "price": "Seasonal Price"},
                {"code": "LS41", "en": "Rock Lobster (Salt & Pepper)", "zh": "椒盐大龙虾", "zh_hant": "椒鹽大龍蝦", "ja": "イセエビ (塩胡椒炒め)", "ko": "닭새우 (소금 후추 튀김)", "price": "Seasonal Price"},
                {"code": "LS42", "en": "Rock Lobster (Salted Egg Yolk)", "zh": "金沙大龙虾", "zh_hant": "金沙大龍蝦", "ja": "イセエビ (塩漬け卵黄炒め)", "ko": "닭새우 (짭짤한 계란 노른자 볶음)", "price": "Seasonal Price"},
                {"code": "LS43", "en": "Rock Lobster (Pei Fong Dong)", "zh": "避风塘炒大龙虾", "zh_hant": "避風塘炒大龍蝦", "ja": "イセエビ (避風塘炒め)", "ko": "닭새우 (홍콩식 마늘 후레이크 볶음)", "price": "Seasonal Price"},
                {"code": "LS44", "en": "Rock Lobster (Stir-Fried Ginger Onion)", "zh": "姜葱炒大龙虾", "zh_hant": "薑蔥炒大龍蝦", "ja": "イセエビ (生姜とネギ炒め)", "ko": "닭새우 (생강 파 볶음)", "price": "Seasonal Price"},
                {"code": "LS45", "en": "Rock Lobster (Steamed)", "zh": "清蒸大龙虾", "zh_hant": "清蒸大龍蝦", "ja": "イセエビ (姿蒸し)", "ko": "닭새우 (찜)", "price": "Seasonal Price"},
                {"code": "LS46", "en": "Mud Crab (Baked in Superior Stock)", "zh": "螃蟹焗上汤", "zh_hant": "肉蟹焗上湯", "ja": "マッドクラブ (上湯スープ焼き)", "ko": "머드 크랩 (특제 육수 구이)", "price": "Seasonal Price"},
                {"code": "LS47", "en": "Mud Crab (Baked with Cheese)", "zh": "芝士焗螃蟹", "zh_hant": "芝士焗肉蟹", "ja": "マッドクラブ (チーズ焼き)", "ko": "머드 크랩 (치즈 구이)", "price": "Seasonal Price"},
                {"code": "LS48", "en": "Mud Crab (Steamed with Garlic)", "zh": "蒜蓉蒸螃蟹", "zh_hant": "蒜蓉蒸肉蟹", "ja": "マッドクラブ (ニンニク蒸し)", "ko": "머드 크랩 (마늘 찜)", "price": "Seasonal Price"},
                {"code": "LS49", "en": "Mud Crab (with Superior E-FU Noodles)", "zh": "螃蟹上汤伊面", "zh_hant": "肉蟹上湯伊麵", "ja": "マッドクラブ (イーフー麺添え)", "ko": "머드 크랩 (이푸면 곁들임)", "price": "Seasonal Price"},
                {"code": "LS50", "en": "Mud Crab (Salt & Pepper)", "zh": "椒盐螃蟹", "zh_hant": "椒鹽肉蟹", "ja": "マッドクラブ (塩胡椒炒め)", "ko": "머드 크랩 (소금 후추 튀김)", "price": "Seasonal Price"},
                {"code": "LS51", "en": "Mud Crab (Salted Egg Yolk)", "zh": "金沙螃蟹", "zh_hant": "金沙肉蟹", "ja": "マッドクラブ (塩漬け卵黄炒め)", "ko": "머드 크랩 (짭짤한 계란 노른자 볶음)", "price": "Seasonal Price"},
                {"code": "LS52", "en": "Mud Crab (Pei Fong Dong)", "zh": "避风塘炒螃蟹", "zh_hant": "避風塘炒肉蟹", "ja": "マッドクラブ (避風塘炒め)", "ko": "머드 크랩 (홍콩식 마늘 후레이크 볶음)", "price": "Seasonal Price"},
                {"code": "LS53", "en": "Mud Crab (Stir-Fried Ginger Onion)", "zh": "姜葱炒螃蟹", "zh_hant": "薑蔥炒肉蟹", "ja": "マッドクラブ (生姜とネギ炒め)", "ko": "머드 크랩 (생강 파 볶음)", "price": "Seasonal Price"},
                {"code": "LS54", "en": "Mud Crab (Steamed)", "zh": "清蒸螃蟹", "zh_hant": "清蒸肉蟹", "ja": "マッドクラブ (姿蒸し)", "ko": "머드 크랩 (찜)", "price": "Seasonal Price"},
                {"code": "LS55", "en": "Clams (Baked in Superior Stock)", "zh": "蛤蜊焗上汤", "zh_hant": "蛤蜊焗上湯", "ja": "ハマグリ (上湯スープ焼き)", "ko": "조개 (특제 육수 구이)", "price": "Seasonal Price"},
                {"code": "LS56", "en": "Clams (Baked with Cheese)", "zh": "芝士焗蛤蜊", "zh_hant": "芝士焗蛤蜊", "ja": "ハマグリ (チーズ焼き)", "ko": "조개 (치즈 구이)", "price": "Seasonal Price"},
                {"code": "LS57", "en": "Clams (Steamed with Garlic)", "zh": "蒜蓉蒸蛤蜊", "zh_hant": "蒜蓉蒸蛤蜊", "ja": "ハマグリ (ニンニク蒸し)", "ko": "조개 (마늘 찜)", "price": "Seasonal Price"},
                {"code": "LS58", "en": "Clams (with Superior E-FU Noodles)", "zh": "蛤蜊上汤伊面", "zh_hant": "蛤蜊上湯伊麵", "ja": "ハマグリ (イーフー麺添え)", "ko": "조개 (이푸면 곁들임)", "price": "Seasonal Price"},
                {"code": "LS59", "en": "Clams (Salt & Pepper)", "zh": "椒盐蛤蜊", "zh_hant": "椒鹽蛤蜊", "ja": "ハマグリ (塩胡椒炒め)", "ko": "조개 (소금 후추 튀김)", "price": "Seasonal Price"},
                {"code": "LS60", "en": "Clams (Salted Egg Yolk)", "zh": "金沙蛤蜊", "zh_hant": "金沙蛤蜊", "ja": "ハマグリ (塩漬け卵黄炒め)", "ko": "조개 (짭짤한 계란 노른자 볶음)", "price": "Seasonal Price"},
                {"code": "LS61", "en": "Clams (Pei Fong Dong)", "zh": "避风塘炒蛤蜊", "zh_hant": "避風塘炒蛤蜊", "ja": "ハマグリ (避風塘炒め)", "ko": "조개 (홍콩식 마늘 후레이크 볶음)", "price": "Seasonal Price"},
                {"code": "LS62", "en": "Clams (Stir-Fried Ginger Onion)", "zh": "姜葱炒蛤蜊", "zh_hant": "薑蔥炒蛤蜊", "ja": "ハマグリ (生姜とネギ炒め)", "ko": "조개 (생강 파 볶음)", "price": "Seasonal Price"},
                {"code": "LS63", "en": "Clams (Steamed)", "zh": "清蒸蛤蜊", "zh_hant": "清蒸蛤蜊", "ja": "ハマグリ (姿蒸し)", "ko": "조개 (찜)", "price": "Seasonal Price"},
                {"code": "LS64", "en": "Nylon Clams (Baked in Superior Stock)", "zh": "花蛤焗上汤", "zh_hant": "花蛤焗上湯", "ja": "アサリ (上湯スープ焼き)", "ko": "바지락 (특제 육수 구이)", "price": "Seasonal Price"},
                {"code": "LS65", "en": "Nylon Clams (Baked with Cheese)", "zh": "芝士焗花蛤", "zh_hant": "芝士焗花蛤", "ja": "アサリ (チーズ焼き)", "ko": "바지락 (치즈 구이)", "price": "Seasonal Price"},
                {"code": "LS66", "en": "Nylon Clams (Steamed with Garlic)", "zh": "蒜蓉蒸花蛤", "zh_hant": "蒜蓉蒸花蛤", "ja": "アサリ (ニンニク蒸し)", "ko": "바지락 (마늘 찜)", "price": "Seasonal Price"},
                {"code": "LS67", "en": "Nylon Clams (with Superior E-FU Noodles)", "zh": "花蛤上汤伊面", "zh_hant": "花蛤上湯伊麵", "ja": "アサリ (イーフー麺添え)", "ko": "바지락 (이푸면 곁들임)", "price": "Seasonal Price"},
                {"code": "LS68", "en": "Nylon Clams (Salt & Pepper)", "zh": "椒盐花蛤", "zh_hant": "椒鹽花蛤", "ja": "アサリ (塩胡椒炒め)", "ko": "바지락 (소금 후추 튀김)", "price": "Seasonal Price"},
                {"code": "LS69", "en": "Nylon Clams (Salted Egg Yolk)", "zh": "金沙花蛤", "zh_hant": "金沙花蛤", "ja": "アサリ (塩漬け卵黄炒め)", "ko": "바지락 (짭짤한 계란 노른자 볶음)", "price": "Seasonal Price"},
                {"code": "LS70", "en": "Nylon Clams (Pei Fong Dong)", "zh": "避风塘炒花蛤", "zh_hant": "避風塘炒花蛤", "ja": "アサリ (避風塘炒め)", "ko": "바지락 (홍콩식 마늘 후레이크 볶음)", "price": "Seasonal Price"},
                {"code": "LS71", "en": "Nylon Clams (Stir-Fried Ginger Onion)", "zh": "姜葱炒花蛤", "zh_hant": "薑蔥炒花蛤", "ja": "アサリ (生姜とネギ炒め)", "ko": "바지락 (생강 파 볶음)", "price": "Seasonal Price"},
                {"code": "LS72", "en": "Nylon Clams (Steamed)", "zh": "清蒸花蛤", "zh_hant": "清蒸花蛤", "ja": "アサリ (姿蒸し)", "ko": "바지락 (찜)", "price": "Seasonal Price"},
                {"code": "LS73", "en": "Shark (Baked in Superior Stock)", "zh": "鲨鱼焗上汤", "zh_hant": "鯊魚焗上湯", "ja": "サメ (上湯スープ焼き)", "ko": "상어 (특제 육수 구이)", "price": "Seasonal Price"},
                {"code": "LS74", "en": "Shark (Baked with Cheese)", "zh": "芝士焗鲨鱼", "zh_hant": "芝士焗鯊魚", "ja": "サメ (チーズ焼き)", "ko": "상어 (치즈 구이)", "price": "Seasonal Price"},
                {"code": "LS75", "en": "Shark (Steamed with Garlic)", "zh": "蒜蓉蒸鲨鱼", "zh_hant": "蒜蓉蒸鯊魚", "ja": "サメ (ニンニク蒸し)", "ko": "상어 (마늘 찜)", "price": "Seasonal Price"},
                {"code": "LS76", "en": "Shark (with Superior E-FU Noodles)", "zh": "鲨鱼上汤伊面", "zh_hant": "鯊魚上湯伊麵", "ja": "サメ (イーフー麺添え)", "ko": "상어 (이푸면 곁들임)", "price": "Seasonal Price"},
                {"code": "LS77", "en": "Shark (Salt & Pepper)", "zh": "椒盐鲨鱼", "zh_hant": "椒鹽鯊魚", "ja": "サメ (塩胡椒炒め)", "ko": "상어 (소금 후추 튀김)", "price": "Seasonal Price"},
                {"code": "LS78", "en": "Shark (Salted Egg Yolk)", "zh": "金沙鲨鱼", "zh_hant": "金沙鯊魚", "ja": "サメ (塩漬け卵黄炒め)", "ko": "상어 (짭짤한 계란 노른자 볶음)", "price": "Seasonal Price"},
                {"code": "LS79", "en": "Shark (Pei Fong Dong)", "zh": "避风塘炒鲨鱼", "zh_hant": "避風塘炒鯊魚", "ja": "サメ (避風塘炒め)", "ko": "상어 (홍콩식 마늘 후레이크 볶음)", "price": "Seasonal Price"},
                {"code": "LS80", "en": "Shark (Stir-Fried Ginger Onion)", "zh": "姜葱炒鲨鱼", "zh_hant": "薑蔥炒鯊魚", "ja": "サメ (生姜とネギ炒め)", "ko": "상어 (생강 파 볶음)", "price": "Seasonal Price"},
                {"code": "LS81", "en": "Shark (Steamed)", "zh": "清蒸鲨鱼", "zh_hant": "清蒸鯊魚", "ja": "サメ (姿蒸し)", "ko": "상어 (찜)", "price": "Seasonal Price"},
            ],
            "Dimsum": [
                {"code": "DM01", "en": "Hakaw (Shrimp Dumpling)", "zh": "晶莹鲜虾饺", "zh_hant": "晶瑩鮮蝦餃", "ja": "ハーガオ (エビ蒸し餃子)", "ko": "하가우 (새우 딤섬)", "price": 328},
                {"code": "DM02", "en": "Chicken Feet", "zh": "豉汁蒸凤爪", "zh_hant": "豉汁蒸鳳爪", "ja": "鶏モミジの豆豉蒸し", "ko": "닭발 찜", "price": 288},
                {"code": "DM03", "en": "Pork Siomai", "zh": "蟹籽烧卖皇", "zh_hant": "蟹籽燒賣皇", "ja": "豚肉とエビのシュウマイ", "ko": "돼지고기 쇼마이", "price": 268},
                {"code": "DM04", "en": "Steamed Spare Ribs", "zh": "豉汁蒸排骨", "zh_hant": "豉汁蒸排骨", "ja": "スペアリブの豆豉蒸し", "ko": "돼지갈비 찜", "price": 258},
                {"code": "DM05", "en": "Chiu Chow Dumpling", "zh": "潮式蒸粉粿", "zh_hant": "潮式蒸粉粿", "ja": "潮州風 蒸し餃子", "ko": "차오저우식 딤섬", "price": 258},
                {"code": "DM06", "en": "Beef Ball with Beancurd Stick", "zh": "鲜竹牛肉球", "zh_hant": "鮮竹牛肉球", "ja": "牛肉団子の湯葉添え", "ko": "소고기 완자", "price": 258},
                {"code": "DM07", "en": "Bean Curd Sheet Roll", "zh": "蚝油鲜竹卷", "zh_hant": "蠔油鮮竹卷", "ja": "湯葉巻きのオイスターソース", "ko": "굴소스 콩고기 롤", "price": 258},
                {"code": "DM08", "en": "Glutinous Rice Wrap (Machang)", "zh": "荷叶珍珠鸡", "zh_hant": "荷葉珍珠雞", "ja": "鶏肉入りちまき", "ko": "연잎 찰밥 (마창)", "price": 258},
                {"code": "DM09", "en": "Crystal Spinach Dumpling", "zh": "水晶菠菜饺", "zh_hant": "水晶菠菜餃", "ja": "ほうれん草のクリスタル餃子", "ko": "크리스탈 시금치 딤섬", "price": 258},
                {"code": "DM10", "en": "Steamed Beef Tripe with Black Pepper", "zh": "黑椒蒸牛肚", "zh_hant": "黑椒蒸牛肚", "ja": "牛ハチノスの黒胡椒蒸し", "ko": "흑후추 소양 찜", "price": 258},
                {"code": "DM11", "en": "Traditional Malay Cake", "zh": "怀旧马拉糕", "zh_hant": "懷舊馬拉糕", "ja": "マーラーカオ (中華風蒸しカステラ)", "ko": "전통 말레이시아 케이크", "price": 208},
                {"code": "DM12", "en": "Egg Tart", "zh": "酥皮焗蛋挞", "zh_hant": "酥皮焗蛋撻", "ja": "エッグタルト", "ko": "에그 타르트", "price": 258},
                {"code": "DM13", "en": "Baked BBQ Asado Pork Pie", "zh": "松化叉烧酥", "zh_hant": "松化叉燒酥", "ja": "チャーシューパイ", "ko": "바비큐 돼지고기 파이", "price": 258},
                {"code": "DM14", "en": "Pan-Fried Radish Cake", "zh": "香煎萝卜糕", "zh_hant": "香煎蘿蔔糕", "ja": "大根餅のパンフライ", "ko": "무 조각 구이", "price": 258},
                {"code": "DM15", "en": "XO Sauce Radish Cake", "zh": "XO酱萝卜糕", "zh_hant": "XO醬蘿蔔糕", "ja": "XO醤風味の大根餅", "ko": "XO 소스 무 떡", "price": 258},
                {"code": "DM16", "en": "Pan-Fried Rice Roll with XO Sauce", "zh": "XO酱煎肠粉", "zh_hant": "XO醬煎腸粉", "ja": "ライスロールのXO醤炒め", "ko": "XO 소스 라이스 롤 볶음", "price": 258},
                {"code": "DM17", "en": "Pan-Fried Pork Bun", "zh": "生煎鲜肉包", "zh_hant": "生煎鮮肉包", "ja": "焼き小籠包", "ko": "군만두 (돼지고기)", "price": 258},
                {"code": "DM18", "en": "Century Egg & Pork Congee", "zh": "皮蛋瘦肉粥", "zh_hant": "皮蛋瘦肉粥", "ja": "ピータンと豚肉のお粥", "ko": "피단과 돼지고기 죽", "price": 258},
                {"code": "DM19", "en": "Sliced Fish Congee", "zh": "鲜滑鱼片粥", "zh_hant": "鮮滑魚片粥", "ja": "白身魚のお粥", "ko": "생선 슬라이스 죽", "price": 258},
                {"code": "DM20", "en": "Fresh Shrimp Rice Roll", "zh": "手拆鲜虾肠粉", "zh_hant": "手拆鮮蝦腸粉", "ja": "エビ入りチョンファン (腸粉)", "ko": "새우 라이스 롤", "price": 328},
                {"code": "DM21", "en": "BBQ Pork Asado Rice Roll", "zh": "蜜汁叉烧肠粉", "zh_hant": "蜜汁叉燒腸粉", "ja": "チャーシュー入りチョンファン", "ko": "바비큐 돼지고기 라이스 롤", "price": 258},
                {"code": "DM22", "en": "Minced Beef Rice Roll", "zh": "香茜牛肉肠粉", "zh_hant": "香茜牛肉腸粉", "ja": "牛ミンチ入りチョンファン", "ko": "소고기 라이스 롤", "price": 258},
                {"code": "DM23", "en": "Plain Rice Roll", "zh": "手工蒸滑肠粉", "zh_hant": "手工蒸滑腸粉", "ja": "プレーンチョンファン", "ko": "기본 라이스 롤", "price": 228},
                {"code": "DM24", "en": "Salted Egg Yolk Custard Bun", "zh": "金香流沙包", "zh_hant": "金香流沙包", "ja": "カスタードまん (流沙包)", "ko": "커스터드 찐빵", "price": 258},
                {"code": "DM25", "en": "Steamed BBQ Pork Bun (Asado Pao)", "zh": "蜜汁叉烧包", "zh_hant": "蜜汁叉燒包", "ja": "チャーシューまん", "ko": "차슈바오 (바비큐 돼지고기 찐빵)", "price": 258},
                {"code": "DM26", "en": "Birthday Bun (Lotus Paste)", "zh": "莲蓉寿桃包", "zh_hant": "蓮蓉壽桃包", "ja": "桃まんじゅう (ハスの実餡)", "ko": "생일 축하 찐빵 (연꽃 앙금)", "price": 258},
                {"code": "DM27", "en": "Shanghai Xiao Long Bao", "zh": "上海小笼包", "zh_hant": "上海小籠包", "ja": "小籠包", "ko": "샤오롱바오", "price": 258},
                {"code": "DM28", "en": "Steamed Mantou", "zh": "蒸馒头", "zh_hant": "蒸饅頭", "ja": "蒸しマントウ", "ko": "찐만두 (만터우)", "price": 208},
                {"code": "DM29", "en": "Crispy Cheese Prawn Roll", "zh": "芝士虾春卷", "zh_hant": "芝士蝦春卷", "ja": "チーズとエビの揚げ春巻き", "ko": "치즈 새우 스프링 롤", "price": 258},
                {"code": "DM30", "en": "Deep Fried Taro Puff", "zh": "酥脆香芋角", "zh_hant": "酥脆香芋角", "ja": "タロ芋のサクサク揚げ", "ko": "타로 튀김", "price": 258},
                {"code": "DM31", "en": "Ham Sui Kok (Fried Glutinous Rice Dumpling)", "zh": "家乡咸水角", "zh_hant": "家鄉咸水角", "ja": "五目餅揚げ (ハムスイコー)", "ko": "찹쌀 튀김 만두", "price": 258},
                {"code": "DM32", "en": "Fried Sesame Balls (Buchi)", "zh": "香炸芝麻球", "zh_hant": "香炸芝麻球", "ja": "ごま団子", "ko": "참깨 경단 (부치)", "price": 208},
                {"code": "DM33", "en": "Fried Mantou", "zh": "黄金炸馒头", "zh_hant": "黃金炸饅頭", "ja": "揚げマントウ", "ko": "튀긴 만터우", "price": 208},
                {"code": "DM34", "en": "Coffee Jelly", "zh": "生磨咖啡糕", "zh_hant": "生磨咖啡糕", "ja": "コーヒーゼリー", "ko": "커피 젤리", "price": 188},
                {"code": "DM35", "en": "Mango Mochi (Snow Lady)", "zh": "香芒雪媚娘", "zh_hant": "香芒雪媚娘", "ja": "マンゴー大福", "ko": "망고 모찌", "price": 228},
                {"code": "DM36", "en": "Hot Almond Cream with Glutinous Balls", "zh": "汤圆杏仁茶", "zh_hant": "湯圓杏仁茶", "ja": "白玉入りアーモンドクリーム", "ko": "따뜻한 아몬드 크림과 찹쌀떡", "price": 188},
                {"code": "DM37", "en": "Hot Taro Sago", "zh": "香芋西米露", "zh_hant": "香芋西米露", "ja": "タロ芋とタピオカの温かいデザート", "ko": "따뜻한 타로 사고", "price": 188},
                {"code": "DM38", "en": "Hot Black Glutinous Rice with Coconut Milk", "zh": "椰香紫米露", "zh_hant": "椰香紫米露", "ja": "ココナッツミルク入り黒米の温かいデザート", "ko": "코코넛 밀크 흑미 디저트", "price": 188},
            ],
            "Set Menu": [
                {"code": "SET1", "en": "Set Menu 1 (Good for 10)", "zh": "套餐一", "zh_hant": "套餐一", "ja": "セットメニュー 1 (10名様用)", "ko": "세트 메뉴 1 (10인분)", "price": 25800, "desc": "Assorted Cold Cuts, Steamed Live Suahe, Abalone Soup, Sautéed Shrimp & Squid, Seafood Salad Roll, Abalone Cubes, Steamed Lapu-Lapu, Roasted Chicken, Free Noodle or Rice, Free 2 Kinds of Dessert"},
                {"code": "SET2", "en": "Set Menu 2 (Good for 10)", "zh": "套餐二", "zh_hant": "套餐二", "ja": "セットメニュー 2 (10名様用)", "ko": "세트 메뉴 2 (10인분)", "price": 32800, "desc": "Assorted Cold Cuts, Steamed Prawns, Double Boiled Fish Maw Soup, Scallop Salad Roll, Whole 10-Head Abalone, Fried Crispy Pigeon, Steamed Lapu-Lapu, Stir Fried Sea Cucumber, Shark Fin Rice, Free 2 Kinds of Dessert"},
                {"code": "SET3", "en": "Set Menu 3 (Good for 10)", "zh": "套餐三", "zh_hant": "套餐三", "ja": "セットメニュー 3 (10名様用)", "ko": "세트 메뉴 3 (10인분)", "price": 35800, "desc": "Suckling Pig, Steamed Prawns, Shark Fin Soup, Diced Scallop in Taro Ring, Whole 10-Head Abalone with Sea Cucumber, Steamed Lapu-Lapu, Roasted Goose, Typhoon Shelter Crab, Free Noodles or Rice, Free 2 Kinds of Dessert"},
                {"code": "SET4", "en": "Set Menu 4 (Good for 10)", "zh": "套餐四", "zh_hant": "套餐四", "ja": "セットメニュー 4 (10名様用)", "ko": "세트 메뉴 4 (10인분)", "price": 38800, "desc": "Suckling Pig with Mala Sea Cucumber, Shark Fin Soup, Imported Scallop with Broccoli, Shrimp Stuffed Fried Crab Claw, 8-Head Abalone with Fish Maw, Steamed Tiger Lapu-Lapu, Salt & Pepper Mantis Shrimp, Roasted Duck, Free Noodles or Rice, Free 2 Kinds of Dessert"},
                {"code": "SET5", "en": "Set Menu 5 (Good for 10)", "zh": "套餐五", "zh_hant": "套餐五", "ja": "セットメニュー 5 (10名様用)", "ko": "세트 메뉴 5 (10인분)", "price": 55800, "desc": "Suckling Pig (Whole), Steamed Rock Lobster, Fried Taro Scallop Pie, Chicken Shark Fin Soup (Individual), Sea Cucumber with Dried Scallop, 8-Head Abalone with Fish Maw, Steamed Red Lapu-Lapu, Roasted Goose, Free Noodles or Rice, Bird's Nest in Mango Pomelo Sweet Soup, Mixed Fruits"},
                {"code": "SET6", "en": "Set Menu 6 (Good for 10)", "zh": "套餐六", "zh_hant": "套餐六", "ja": "セットメニュー 6 (10名様用)", "ko": "세트 메뉴 6 (10인분)", "price": 65800, "desc": "Suckling Pig with Foie Gras & Caviar, Braised Shark Fin Soup, Original Lobster with Superior Sauce, Dried Scallop with Winter Melon Ring, Whole Sea Cucumber with Shredded Meat, Whole 6-Head Abalone with Fish Maw, Steamed Double Red Lapu-Lapu, Roasted Goose, Whole Scallop with Black Truffle Noodles, Bird's Nest Soup, Mixed Fruits"},
            ]
        }

        self.stdout.write("Clearing old menu data...")

        # WIPE DATA
        MenuItemPrice.objects.all().delete()
        MenuItem.objects.all().delete()
        Category.objects.all().delete()
        CookingMethod.objects.all().delete()

        BASE_IMAGE_PATH = os.path.join(settings.BASE_DIR, 'seed_images', 'menu')

        with transaction.atomic():
            cat_order = 1
            for cat_key, items in menu_data.items():
                
                # Fetch category translations from dictionary
                cat_trans = CATEGORY_TRANSLATIONS.get(cat_key, {})

                category, _ = Category.objects.get_or_create(
                    name=cat_key,
                    defaults={
                        'name_zh': cat_trans.get('zh', ''), 
                        'name_zh_hant': cat_trans.get('zh_hant', ''), 
                        'name_ja': cat_trans.get('ja', ''), 
                        'name_ko': cat_trans.get('ko', ''), 
                        'order': cat_order
                    }
                )
                cat_order += 1
                
                self.stdout.write(f"Processing {category.name}...")

                # Process Items
                for item_data in items:
                    raw_name = item_data.get('en', '')
                    item_code = item_data.get('code')

                    # --- LOGIC FOR LIVE SEAFOOD GROUPING ---
                    # Matches "Name (Method)"
                    match = re.match(r"^(.*?)\s*\((.*?)\)$", raw_name)
                    
                    if cat_key == "Live Seafood" and match:
                        base_name = match.group(1).strip()
                        method_name = match.group(2).strip()
                        
                        # Fetch Base Seafood Translation (e.g., "Mantis Shrimp")
                        base_trans = SEAFOOD_TRANSLATIONS.get(base_name, {})
                        
                        # Create the Parent Item
                        item, created = MenuItem.objects.get_or_create(
                            name=base_name,
                            category=category,
                            defaults={
                                'code': item_code, 
                                'name_zh': base_trans.get('zh', ''),
                                'name_zh_hant': base_trans.get('zh_hant', ''),
                                'name_ja': base_trans.get('ja', ''),
                                'name_ko': base_trans.get('ko', ''),
                                'description': "Fresh from our aquariums, cooked to your preference.",
                            }
                        )

                        # Image Handling for Live Seafood
                        if created and base_name in SEAFOOD_IMAGES:
                            filename = SEAFOOD_IMAGES[base_name]
                            file_path = os.path.join(BASE_IMAGE_PATH, 'Live Seafood', filename)
                            
                            if os.path.exists(file_path):
                                self.stdout.write(f"  --> Attaching image: {filename}")
                                with open(file_path, 'rb') as f:
                                    item.image.save(filename, File(f), save=True)
                            else:
                                self.stdout.write(self.style.WARNING(f"  --> Image not found: {file_path}"))

                        # Create/Link Cooking Method Translations
                        method_trans = METHOD_TRANSLATIONS.get(method_name, {})
                        cooking_method, _ = CookingMethod.objects.get_or_create(
                            name=method_name,
                            defaults={
                                'name_zh': method_trans.get('zh', ''),
                                'name_zh_hant': method_trans.get('zh_hant', ''),
                                'name_ja': method_trans.get('ja', ''),
                                'name_ko': method_trans.get('ko', '')
                            }
                        )
                        item.cooking_methods.add(cooking_method)

                        # Add seasonal price placeholder
                        if created:
                            MenuItemPrice.objects.create(
                                menu_item=item, size="Regular", is_seasonal=True
                            )

                    else:
                        # --- STANDARD ITEM LOGIC ---
                        item, created = MenuItem.objects.get_or_create(
                            code=item_code,
                            defaults={
                                'category': category,
                                'name': raw_name,
                                'name_zh': item_data.get('zh', ''),
                                'name_zh_hant': item_data.get('zh_hant', ''),
                                'name_ja': item_data.get('ja', ''),
                                'name_ko': item_data.get('ko', ''),
                                'description': item_data.get('desc', ''),
                            }
                        )

                        # Image Handling for Standard Items
                        if created and item_code in IMAGE_MAP:
                            rel_path = IMAGE_MAP[item_code]
                            file_path = os.path.join(BASE_IMAGE_PATH, rel_path)
                            
                            if os.path.exists(file_path):
                                self.stdout.write(f"  --> Attaching image: {rel_path}")
                                with open(file_path, 'rb') as f:
                                    filename = os.path.basename(rel_path)
                                    item.image.save(filename, File(f), save=True)
                            else:
                                self.stdout.write(self.style.WARNING(f"  --> Image not found: {file_path}"))
                        
                        # Wiping old prices to re-seed cleanly
                        if not created:
                             item.prices.all().delete()

                        if 'prices' in item_data:
                            for size, price in item_data['prices'].items():
                                val = None
                                is_seasonal = False
                                if isinstance(price, str) and not price.isdigit():
                                    is_seasonal = True
                                else:
                                    val = Decimal(price)
                                MenuItemPrice.objects.create(menu_item=item, size=size, price=val, is_seasonal=is_seasonal)
                        elif 'price' in item_data:
                            price_val = item_data['price']
                            val = None
                            is_seasonal = False
                            if isinstance(price_val, str) and "Seasonal" in price_val:
                                is_seasonal = True
                            else:
                                val = Decimal(price_val)
                            MenuItemPrice.objects.create(menu_item=item, size="Regular", price=val, is_seasonal=is_seasonal)

        self.stdout.write(self.style.SUCCESS('Menu successfully seeded with 5 languages!'))