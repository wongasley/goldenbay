import os
import re
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.db import transaction
from django.core.files import File
from django.conf import settings
from menu.models import Category, MenuItem, MenuItemPrice, CookingMethod

class Command(BaseCommand):
    help = 'Seeds the database with the GoldenBay menu (Localized Filipino-Chinese & Simplified Chinese) and Images'

    def handle(self, *args, **options):
        # ---------------------------------------------------------
        # 1. TRANSLATION MAP FOR LIVE SEAFOOD
        # ---------------------------------------------------------
        SEAFOOD_TRANSLATIONS = {
            "Mantis Shrimp": "富贵虾 (海螳螂)",
            "Live Suahe": "游水沙虾",
            "Lobster": "生猛龙虾",
            "Lapu-Lapu": "游水石斑鱼",
            "Rock Lobster": "大龙虾",
            "Mud Crab": "肉蟹",
            "Clams": "蛤蜊",
            "Nylon Clams": "花蛤 (Nylon Shell)",
            "Shark": "鲨鱼"
        }

        # ---------------------------------------------------------
        # 2. IMAGE MAPPING (Code -> Relative Path from seed_images/menu/)
        # ---------------------------------------------------------
        IMAGE_MAP = {
            # --- Barbecue ---.
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

            # --- Soup ---
            "S01": "Soup/pumpkin_seafood_soup.webp",
            "S02": "Soup/spinach_seafood_soup.webp",
            "S03": "Soup/seafood_corn_soup.webp",
            "S04": "Soup/chicken_&_asparagus_soup.webp",
            "S05": "Soup/west_lake_minced_beef_soup.webp",
            "S06": "Soup/eight_treasure_winter_melon_soup.webp",
            "S07": "Soup/shanghai_hot_&_sour_soup.webp",
            "S08": "Soup/assorted_dried_seafood_soup.webp",

            # --- Sea Cucumber ---
            "SC01": "Sea Cucumber/sea_cucumber_with_zucchini_&_shrimp_roe.webp",
            "SC02": "Sea Cucumber/braised_sea_cucumber_with_scallion.webp",
            "SC03": "Sea Cucumber/crystal_jade_sea_cucumber.webp",
            "SC04": "Sea Cucumber/sea_cucumber_with_pork_tendon_in_pot.webp",
            "SC05": "Sea Cucumber/whole_sea_cucumber_with_shrimp_roe.webp",
            "SC06": "Sea Cucumber/whole_sea_cucumber_with_shredded_pork.webp",
            "SC07": "Sea Cucumber/sea_cucumber_with_fish_maw_&_conpoy.webp",

            # --- Shark's Fin ---
            "SB01": "Sharks Fin/braised_superior_shark_fin_in_stone_pot.webp",
            "SB02": "Sharks Fin/superior_stock_shark_fin_in_stone_pot.webp",
            "SB03": "Sharks Fin/shark_fin_with_crab_meat.webp",
            "SB04": "Sharks Fin/stir_fried_shark_fin_with_egg_&_bean_sprouts.webp",
            "SB05": "Sharks Fin/birds_nest_with_honey.webp",
            "SB06": "Sharks Fin/birds_nest_with_coconut_milk.webp",

            # --- Abalone ---
            "AB01": "Abalone/braised_abalone_&_seafood_pot.webp",
            "AB02": "Abalone/sliced_abalone_with_black_mushroom.webp",
            "AB03": "Abalone/diced_abalone_with_vegetables.webp",
            "AB04": "Abalone/whole_3_head_abalone_with_sea_cucumber.webp",
            "AB05": "Abalone/whole_3_head_abalone_with_fish_maw.webp",
            "AB06": "Abalone/braised_spiky_sea_cucumber_with_abalone.webp",

            # --- Shrimp ---
            "SP01": "Shrimp/hot_prawn_salad.webp",
            "SP02": "Shrimp/sauteed_prawns_with_broccoli.webp",
            "SP03": "Shrimp/sauteed_prawns_with_pomelo_sauce.webp",
            "SP04": "Shrimp/baked_prawns_with_black_&_white_pepper.webp",
            "SP05": "Shrimp/singaporean_cereal_prawns.webp",
            "SP06": "Shrimp/steamed_prawns_with_garlic_&_vermicelli.webp",
            "SP07": "Shrimp/sauteed_prawns_&_scallops_with_xo_sauce.webp",
            "SP08": "Shrimp/fried_shrimp_balls_with_lemon_sauce.webp",

            # --- Seafood Dishes ---
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

            # --- Sichuan ---
            "CQ01": "Sichuan Spicy Dishes/chong_qing_spicy_fish_in_chili_oil.webp",
            "CQ02": "Sichuan Spicy Dishes/sichuan_pickled_fish.webp",
            "CQ03": "Sichuan Spicy Dishes/hot_&_sour_shredded_potato.webp",
            "CQ04": "Sichuan Spicy Dishes/sichuan_style_spicy_prawns.webp",
            "CQ05": "Sichuan Spicy Dishes/home_style_spicy_tofu.webp",
            "CQ06": "Sichuan Spicy Dishes/spicy_poached_beef_in_chili_oil.webp",
            "CQ07": "Sichuan Spicy Dishes/sauteed_sliced_beef_with_green_pepper.webp",

            # --- Pork/Chicken ---
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

            # --- Beef ---
            "BF01": "Beef/sauteed_beef_with_broccoli.webp",
            "BF02": "Beef/beef_with_bitter_gourd_in_black_bean_sauce.webp",
            "BF03": "Beef/chinese_style_beef_tenderloin.webp",
            "BF04": "Beef/braised_beef_brisket_in_claypot.webp",
            "BF05": "Beef/curry_beef_brisket_in_claypot.webp",
            "BF06": "Beef/sizzling_short_ribs_in_black_pepper_sauce.webp",
            "BF07": "Beef/stir_fried_beef_cubes_with_potato.webp",

            # --- Bean Curd ---
            "BC01": "Bean Curd/crispy_fried_bean_curd.webp",
            "BC02": "Bean Curd/mapo_tofu.webp",
            "BC03": "Bean Curd/braised_seafood_bean_curd_claypot.webp",
            "BC04": "Bean Curd/spinach_bean_curd_with_scallop.webp",
            "BC05": "Bean Curd/steamed_bean_curd_with_assorted_seafood.webp",
            "BC06": "Bean Curd/hakka_style_stuffed_bean_curd.webp",

            # --- Veggies ---
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

            # --- Rice/Noodles ---
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

            # --- Live Seafood ---
            "LS01": "Live Seafood/sea_mantis.webp",
            "LS10": "Live Seafood/suahe.webp",
            "LS19": "Live Seafood/lobster.webp",
            "LS28": "Live Seafood/lapu_lapu.webp",
            "LS37": "Live Seafood/rock_lobster.webp",
            "LS46": "Live Seafood/crab.webp",
            "LS55": "Live Seafood/clams.webp",
            "LS64": "Live Seafood/nylon_shell.webp",
            "LS73": "Live Seafood/shark.webp",

            # --- Dimsum ---
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

        # ---------------------------------------------------------
        # 3. LIVE SEAFOOD IMAGES (Base Name -> Filename)
        # ---------------------------------------------------------
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

        # ---------------------------------------------------------
        # 4. MENU DATA (Localized English & Simplified Chinese)
        # ---------------------------------------------------------
        menu_data = {
            "Barbecue, Appetizer / 烧烤卤味": [
                {"code": "BA01", "en": "Roasted Cold Cuts Combination", "zh": "锦绣烧味拼盘", "prices": {"S": 750, "M": 1500, "L": 2250}},
                {"code": "BA02", "en": "Crispy Roasted Pork Belly (Lechon Macau)", "zh": "金牌烧腩仔", "prices": {"S": 680, "M": 1360, "L": 2040}},
                {"code": "BA03", "en": "Honey Glazed BBQ Pork Asado", "zh": "蜜汁烤叉烧", "prices": {"S": 600, "M": 1200, "L": 1800}},
                {"code": "BA04", "en": "Soy Chicken", "zh": "玫瑰豉油鸡", "prices": {"Half": 900, "Whole": 1800}},
                {"code": "BA05", "en": "White Chicken (Hainanese Style)", "zh": "水晶白切鸡", "prices": {"Half": 900, "Whole": 1800}},
                {"code": "BA06", "en": "Crispy Roasted Chicken", "zh": "南乳吊烧鸡", "prices": {"Half": 900, "Whole": 1800}},
                {"code": "BA07", "en": "Crispy Fried Pigeon", "zh": "金牌烧乳鸽", "price": 850},
                {"code": "BA08", "en": "Roasted Suckling Pig", "zh": "鸿运烤乳猪", "prices": {"Half": 5800, "Whole": 11000}},
                {"code": "BA09", "en": "Roasted Goose", "zh": "金海湾烧鹅", "prices": {"Half": 3200, "Whole": 6000}},
                {"code": "BA10", "en": "Peking Duck", "zh": "北京片皮鸭", "prices": {"Half": 1800, "Whole": 3500}},
                {"code": "BA11", "en": "Roasted Rice Duck", "zh": "挂炉烧米鸭", "prices": {"Half": 1600, "Whole": 3000}},
                {"code": "BA12", "en": "Jellyfish with Sesame Oil", "zh": "麻油拌海蜇", "prices": {"S": 500, "M": 1000, "L": 1500}},
                {"code": "BA13", "en": "Marinated Sliced Beef Shank", "zh": "卤水牛腱", "prices": {"S": 500, "M": 1000, "L": 1500}},
                {"code": "BA14", "en": "Century Egg with Pickled Ginger", "zh": "皮蛋酸姜", "price": 288},
                {"code": "BA15", "en": "Marinated Cucumber", "zh": "凉拌青瓜", "price": 288},
            ],
            "Soup / 汤羹": [
                {"code": "S01", "en": "Pumpkin Seafood Soup", "zh": "金瓜海皇羹", "prices": {"S": 650, "M": 975, "L": 1300}},
                {"code": "S02", "en": "Spinach Seafood Soup", "zh": "菠菜海鲜羹", "prices": {"S": 650, "M": 975, "L": 1300}},
                {"code": "S03", "en": "Seafood Corn Soup", "zh": "海鲜粟米羹", "prices": {"S": 650, "M": 975, "L": 1300}},
                {"code": "S04", "en": "Chicken & Asparagus Soup", "zh": "鲜露笋鸡片汤", "prices": {"S": 700, "M": 1050, "L": 1400}},
                {"code": "S05", "en": "West Lake Minced Beef Soup", "zh": "西湖牛肉羹", "prices": {"S": 650, "M": 975, "L": 1300}},
                {"code": "S06", "en": "Eight Treasure Winter Melon Soup", "zh": "八宝冬瓜粒汤", "prices": {"S": 750, "M": 1125, "L": 1500}},
                {"code": "S07", "en": "Hot & Sour Soup", "zh": "上海酸辣羹", "prices": {"S": 750, "M": 1125, "L": 1500}},
                {"code": "S08", "en": "Assorted Dried Seafood Soup", "zh": "三丝海味羹", "prices": {"S": 980, "M": 1470, "L": 1960}},
            ],
            "Sea Cucumber / 海参": [
                {"code": "SC01", "en": "Sea Cucumber with Zucchini & Shrimp Roe", "zh": "绿玉瓜虾子秃参", "prices": {"S": 1800, "M": 2700, "L": 3600}},
                {"code": "SC02", "en": "Braised Sea Cucumber with Scallion", "zh": "葱烧虾子海参", "prices": {"S": 1800, "M": 2700, "L": 3600}},
                {"code": "SC03", "en": "Crystal Jade Sea Cucumber", "zh": "白玉秃参伴翡翠", "prices": {"S": 2400, "M": 3600, "L": 4800}},
                {"code": "SC04", "en": "Sea Cucumber with Pork Tendon in Pot", "zh": "海参蹄筋煲", "prices": {"S": 2200, "M": 3300, "L": 4400}},
                {"code": "SC05", "en": "Whole Sea Cucumber with Shrimp Roe", "zh": "虾子扣原条海参", "prices": {"M": 4500, "L": 6000}},
                {"code": "SC06", "en": "Whole Sea Cucumber with Shredded Pork", "zh": "鱼香肉丝扣原条海参", "prices": {"M": 4500, "L": 6000}},
                {"code": "SC07", "en": "Sea Cucumber with Fish Maw & Conpoy", "zh": "金丝扒花胶海参", "prices": {"S": 3000, "M": 4500, "L": 6000}},
            ],
            "Shark Fin, Bird’s Nest / 鱼翅燕窝": [
                {"code": "SB01", "en": "Braised Superior Shark Fin in Stone Pot", "zh": "红烧石窝鲍翅", "price": 2200},
                {"code": "SB02", "en": "Superior Stock Shark Fin in Stone Pot", "zh": "浓汤石窝鲍翅", "price": 2200},
                {"code": "SB03", "en": "Shark Fin with Crab Meat", "zh": "红烧蟹肉翅", "prices": {"S": 3000, "M": 4500, "L": 6000}},
                {"code": "SB04", "en": "Stir-Fried Shark Fin with Egg & Bean Sprouts", "zh": "浓炒桂花翅", "prices": {"S": 3000, "M": 4500, "L": 6000}},
                {"code": "SB05", "en": "Bird’s Nest with Honey", "zh": "蜂蜜炖燕窝", "price": 2400},
                {"code": "SB06", "en": "Bird’s Nest with Coconut Milk", "zh": "椰汁炖燕窝", "price": 2400},
            ],
            "Abalone / 鲍鱼": [
                {"code": "AB01", "en": "Braised Abalone & Seafood Pot", "zh": "鲍鱼一品煲", "prices": {"S": 2500, "M": 3750, "L": 5000}},
                {"code": "AB02", "en": "Sliced Abalone with Black Mushroom", "zh": "冬菇入口鲍片", "prices": {"S": 3000, "M": 4500, "L": 6000}},
                {"code": "AB03", "en": "Diced Abalone with Vegetables", "zh": "翡翠入口鲍角", "prices": {"S": 3000, "M": 4500, "L": 6000}},
                {"code": "AB04", "en": "Whole 3-Head Abalone with Sea Cucumber", "zh": "原只鲍鱼扣海参", "price": 2400},
                {"code": "AB05", "en": "Whole 3-Head Abalone with Fish Maw", "zh": "原只鲍鱼扣花胶", "price": 2400},
                {"code": "AB06", "en": "Braised Spiky Sea Cucumber with Abalone", "zh": "红烧刺参鲍鱼", "price": 1300},
            ],
            "Shrimp / 虾": [
                {"code": "SP01", "en": "Hot Prawn Salad", "zh": "热沙律虾球", "prices": {"S": 1500, "M": 2250, "L": 3000}},
                {"code": "SP02", "en": "Sautéed Prawns with Broccoli", "zh": "西兰花虾球", "prices": {"S": 1500, "M": 2250, "L": 3000}},
                {"code": "SP03", "en": "Sautéed Prawns with Pomelo Sauce", "zh": "柚子明虾球", "prices": {"S": 1500, "M": 2250, "L": 3000}},
                {"code": "SP04", "en": "Baked Prawns with Black & White Pepper", "zh": "黑白胡椒焗大虾", "prices": {"S": 1900, "M": 2850, "L": 3800}},
                {"code": "SP05", "en": "Singaporean Cereal Prawns", "zh": "星洲麦片焗海虾", "prices": {"S": 1900, "M": 2850, "L": 3800}},
                {"code": "SP06", "en": "Steamed Prawns with Garlic & Vermicelli", "zh": "蒜蓉粉丝蒸大虾", "prices": {"S": 1900, "M": 2850, "L": 3800}},
                {"code": "SP07", "en": "Sautéed Prawns & Scallops with XO Sauce", "zh": "XO酱西芹炒虾球带子", "prices": {"S": 2000, "M": 3000, "L": 4000}},
                {"code": "SP08", "en": "Fried Shrimp Balls with Lemon Sauce", "zh": "沙律柠檬酱炸虾球", "prices": {"S": 1500, "M": 2250, "L": 3000}},
            ],
            "Seafood Dishes / 海鲜烹调": [
                {"code": "SF01", "en": "Sautéed Fish Fillet with Vegetables", "zh": "碧绿炒鱼片", "prices": {"S": 700, "M": 1050, "L": 1400}},
                {"code": "SF02", "en": "Steamed Fish Fillet with Garlic", "zh": "蒜茸蒸鱼柳", "prices": {"S": 550, "M": 825, "L": 1100}},
                {"code": "SF03", "en": "Eel & Pork Tendon with Abalone Sauce", "zh": "鲍鱼酱鳝球蹄筋", "prices": {"S": 1200, "M": 1800, "L": 2400}},
                {"code": "SF04", "en": "Sizzling Squid Tentacles", "zh": "铁板砵酒焗墨鱼须", "prices": {"S": 700, "M": 1050, "L": 1400}},
                {"code": "SF05", "en": "Salt and Pepper Squid", "zh": "蒜香椒盐鲜鱿花", "prices": {"S": 700, "M": 1050, "L": 1400}},
                {"code": "SF06", "en": "Clam Omelet with Preserved Radish", "zh": "菜脯花蛤煎蛋烙", "prices": {"S": 800, "M": 1200, "L": 1600}},
                {"code": "SF07", "en": "Seafood Salad Roll", "zh": "沙律海鲜卷", "prices": {"S": 900, "M": 1350, "L": 1800}},
                {"code": "SF08", "en": "Diced Scallop with Crab Roe in Taro Ring", "zh": "冠军蟹珠带子崧", "prices": {"S": 1400, "M": 2100, "L": 2800}},
                {"code": "SF09", "en": "Sautéed Scallops with Broccoli", "zh": "西兰花入口带子", "prices": {"S": 2000, "M": 3000, "L": 4000}},
                {"code": "SF10", "en": "Deep-Fried Shrimp Stuffed Crab Claw", "zh": "香酥百花酿蟹钳", "prices": {"S": 1800, "M": 2700, "L": 3600}},
                {"code": "SF11", "en": "Deep-Fried Cheese Stuffed Shrimp Balls", "zh": "蟹籽鲜虾芝心丸", "prices": {"S": 1800, "M": 2700, "L": 3600}},
                {"code": "SF12", "en": "Steamed Lobster Meat with Egg White", "zh": "上汤蛋白蒸龙虾肉", "price": "Seasonal Price"},
                {"code": "SF13", "en": "Fried Crispy Spiky Sea Cucumber with Black Truffle", "zh": "黑松露香芋脆刺参", "prices": {"S": 1280, "M": 1920, "L": 2560}},
                {"code": "SF14", "en": "Sautéed Chinese Yam (Huai Shan) in XO Sauce", "zh": "XO酱炒淮山片", "prices": {"S": 800, "M": 1200, "L": 1600}},
                {"code": "SF15", "en": "Pan-Fried Cuttlefish Cake", "zh": "香煎墨鱼饼", "prices": {"S": 700, "M": 1050, "L": 1400}},
                {"code": "SF16", "en": "Scallop with Scrambled Egg White & Black Truffle", "zh": "黑松露炒蛋白带子", "prices": {"S": 800, "M": 1200, "L": 1600}},
            ],
            "Sichuan Spicy Dishes / 川菜系列": [
                {"code": "CQ01", "en": "Chong Qing Spicy Fish in Chili Oil", "zh": "重庆水煮鱼", "price": "Seasonal Price"},
                {"code": "CQ02", "en": "Sichuan Pickled Fish", "zh": "四川酸菜鱼", "price": "Seasonal Price"},
                {"code": "CQ03", "en": "Hot & Sour Shredded Potato", "zh": "酸辣土豆丝", "prices": {"S": 650, "M": 975, "L": 1300}},
                {"code": "CQ04", "en": "Sichuan Style Spicy Prawns", "zh": "香辣炒虾", "prices": {"S": 1200, "M": 1800, "L": 2400}},
                {"code": "CQ05", "en": "Home-style Spicy Tofu", "zh": "家常烧豆腐", "prices": {"S": 900, "M": 1350, "L": 1800}},
                {"code": "CQ06", "en": "Spicy Poached Beef in Chili Oil", "zh": "四川水煮牛肉", "prices": {"S": 1400, "M": 2100, "L": 2800}},
                {"code": "CQ07", "en": "Sautéed Sliced Beef with Green Pepper", "zh": "杭椒嫩牛肉", "prices": {"S": 1000, "M": 1500, "L": 2000}},
            ],
            "Pork, Lamb, Chicken, Duck / 猪羊鸡鸭": [
                {"code": "P01", "en": "Braised Dong Po Pork", "zh": "苏杭东坡肉", "price": 350},
                {"code": "P02", "en": "Sweet and Sour Pork", "zh": "菠萝咕噜肉", "prices": {"S": 600, "M": 900, "L": 1200}},
                {"code": "P03", "en": "Salt & Pepper Spare Ribs", "zh": "椒盐焗肉排", "prices": {"S": 600, "M": 900, "L": 1200}},
                {"code": "P04", "en": "Pan-Fried Kurobuta Pork", "zh": "香煎黑豚肉", "prices": {"S": 1200, "M": 1800, "L": 2400}},
                {"code": "P05", "en": "Braised Pork Knuckle (Pata Tim)", "zh": "红烧大元蹄", "price": 1800},
                {"code": "P06", "en": "Lamb Brisket Claypot", "zh": "港式羊腩煲", "prices": {"S": 1800, "L": 3600}},
                {"code": "P07", "en": "Kung Pao Chicken", "zh": "宫保炒鸡丁", "prices": {"S": 600, "M": 900, "L": 1200}},
                {"code": "P08", "en": "Spare Ribs in Special Vinegar Sauce", "zh": "特制香醋排骨", "prices": {"S": 700, "M": 1050, "L": 1400}},
                {"code": "P09", "en": "Hong Kong Style Mala Chicken Pot", "zh": "港式麻辣鸡煲", "prices": {"S": 600, "M": 900, "L": 1200}},
                {"code": "P10", "en": "Stewed Dong Po Pork with Dried Bamboo Shoots", "zh": "干笋东坡肉", "prices": {"S": 1080, "M": 1620, "L": 2160}},
                {"code": "P11", "en": "Steamed Minced Pork with 3 Kinds of Egg", "zh": "三色蛋蒸肉饼", "prices": {"S": 700, "M": 1050, "L": 1400}},
            ],
            "Beef / 牛肉": [
                {"code": "BF01", "en": "Sautéed Beef with Broccoli", "zh": "西兰花牛肉", "prices": {"S": 800, "M": 1200, "L": 1600}},
                {"code": "BF02", "en": "Beef with Bitter Gourd in Black Bean Sauce", "zh": "豉汁凉瓜牛肉", "prices": {"S": 700, "M": 1050, "L": 1400}},
                {"code": "BF03", "en": "Chinese Style Beef Tenderloin", "zh": "中式煎牛柳", "prices": {"S": 1200, "M": 1800, "L": 2400}},
                {"code": "BF04", "en": "Braised Beef Brisket in Claypot", "zh": "柱侯牛腩煲", "prices": {"S": 1200, "M": 1800, "L": 2400}},
                {"code": "BF05", "en": "Curry Beef Brisket in Claypot", "zh": "马来咖喱牛腩煲", "prices": {"S": 1200, "M": 1800, "L": 2400}},
                {"code": "BF06", "en": "Sizzling Short Ribs in Black Pepper Sauce", "zh": "铁板黑椒牛仔骨", "prices": {"S": 1200, "M": 1800, "L": 2400}},
                {"code": "BF07", "en": "Stir-Fried Beef Cubes with Potato", "zh": "土豆炒牛柳粒", "prices": {"S": 800, "M": 1200, "L": 1600}},
            ],
            "Bean Curd / 豆腐": [
                {"code": "BC01", "en": "Crispy Fried Bean Curd", "zh": "脆皮炸豆腐", "prices": {"S": 500, "M": 750, "L": 1000}},
                {"code": "BC02", "en": "Mapo Tofu", "zh": "麻婆豆腐", "prices": {"S": 700, "M": 1050, "L": 1400}},
                {"code": "BC03", "en": "Braised Seafood Bean Curd Claypot", "zh": "海鲜豆腐煲", "prices": {"S": 700, "M": 1050, "L": 1400}},
                {"code": "BC04", "en": "Spinach Bean Curd with Scallop", "zh": "瑶柱翡翠金砖", "prices": {"S": 900, "M": 1350, "L": 1800}},
                {"code": "BC05", "en": "Steamed Bean Curd with Assorted Seafood", "zh": "翠塘豆腐", "prices": {"S": 800, "M": 1200, "L": 1600}},
                {"code": "BC06", "en": "Hakka Style Stuffed Bean Curd", "zh": "客家酿豆腐", "prices": {"S": 900, "M": 1350, "L": 1800}},
            ],
            "Vegetables / 蔬菜": [
                {"code": "VE01", "en": "Sautéed Imported Vegetables with Garlic", "zh": "蒜茸炒入口时蔬", "price": "Seasonal Price"},
                {"code": "VE02", "en": "Fried Pumpkin with Salted Egg", "zh": "黄金南瓜条", "prices": {"S": 500, "M": 750, "L": 1000}},
                {"code": "VE03", "en": "Braised Broccoli with Black Mushroom", "zh": "香菇扒西兰花", "prices": {"S": 700, "M": 1050, "L": 1400}},
                {"code": "VE04", "en": "Vegetables with 3 Kinds of Egg", "zh": "三皇蛋时蔬", "prices": {"S": 700, "M": 1050, "L": 1400}},
                {"code": "VE05", "en": "Assorted Vegetables with Fungus & Beancurd", "zh": "洪七公炒斋", "prices": {"S": 700, "M": 1050, "L": 1400}},
                {"code": "VE06", "en": "Spicy Eggplant Claypot with Minced Pork", "zh": "鱼香茄子煲", "prices": {"S": 600, "M": 900, "L": 1200}},
                {"code": "VE07", "en": "Dried Scallop with Golden Mushroom & Vegetables", "zh": "金瑶扒时蔬", "prices": {"S": 1000, "M": 1500, "L": 2000}},
                {"code": "VE08", "en": "Sautéed Chinese Yam (Huai Shan) with Mixed Mushrooms", "zh": "淮山西芹炒杂菌", "prices": {"S": 700, "M": 1050, "L": 1400}},
                {"code": "VE09", "en": "Golden Bay Special Vegetables", "zh": "金湾招牌菜", "prices": {"S": 780, "M": 1180, "L": 1560}},
                {"code": "VE10", "en": "Deep Fried Minced Shrimp with Taiwan Pechay", "zh": "台式白菜炸虾茸", "prices": {"S": 700, "M": 1050, "L": 1400}},
            ],
            "Rice & Noodles / 饭面": [
                {"code": "RN01", "en": "Stir-Fried Beef Ho Fan", "zh": "乾炒牛河", "prices": {"S": 650, "M": 980, "L": 1300}},
                {"code": "RN02", "en": "Traditional Fujian Misua", "zh": "福建炒面线", "prices": {"S": 650, "M": 980, "L": 1300}},
                {"code": "RN03", "en": "Pineapple Fried Rice", "zh": "原只菠萝炒饭", "prices": {"S": 980}},
                {"code": "RN04", "en": "Dried Scallop & Egg White Fried Rice", "zh": "瑶柱蛋白炒饭", "prices": {"S": 800, "M": 1200, "L": 1600}},
                {"code": "RN05", "en": "Braised E-Fu Noodles with Abalone Sauce", "zh": "鲍鱼汁炆伊面", "prices": {"S": 600, "M": 900, "L": 1200}},
                {"code": "RN06", "en": "Crispy Seafood Chow Mein", "zh": "港式海鲜炸面", "prices": {"S": 650, "M": 980, "L": 1300}},
                {"code": "RN07", "en": "Birthday Noodles", "zh": "生日伊面", "prices": {"S": 600, "M": 900, "L": 1200}},
                {"code": "RN08", "en": "Golden Bay Fried Rice", "zh": "金海湾炒饭", "prices": {"S": 800, "M": 1200, "L": 1600}},
                {"code": "RN09", "en": "Fujian Fried Rice", "zh": "福建炒饭", "prices": {"S": 650, "M": 980, "L": 1300}},
                {"code": "RN10", "en": "Yang Chow Fried Rice", "zh": "杨州炒饭", "prices": {"S": 600, "M": 900, "L": 1200}},
                {"code": "RN11", "en": "Salted Fish & Diced Chicken Fried Rice", "zh": "咸鱼鸡粒炒饭", "prices": {"S": 650, "M": 980, "L": 1300}},
                {"code": "RN12", "en": "Sautéed Vermicelli with Minced Pork & Dried Shrimp", "zh": "虾米肉碎炒粉丝", "prices": {"S": 700, "M": 1050, "L": 1400}},
                {"code": "RN13", "en": "Garlic Fried Rice", "zh": "蒜蓉炒饭", "prices": {"S": 450, "M": 680, "L": 900}},
                {"code": "RN14", "en": "Sautéed Noodles with Black Truffle", "zh": "黑松露炒面", "prices": {"S": 800, "M": 1200, "L": 1600}},
            ],
            "Live Seafood / 活海鲜": [
                {"code": "LS01", "en": "Mantis Shrimp (Baked in Superior Stock)", "zh": "海螳螂焗上汤", "price": "Seasonal Price"},
                {"code": "LS02", "en": "Mantis Shrimp (Baked with Cheese)", "zh": "芝士焗海螳螂", "price": "Seasonal Price"},
                {"code": "LS03", "en": "Mantis Shrimp (Steamed with Garlic)", "zh": "蒜蓉蒸海螳螂", "price": "Seasonal Price"},
                {"code": "LS04", "en": "Mantis Shrimp (with Superior E-FU Noodles)", "zh": "海螳螂上汤伊面", "price": "Seasonal Price"},
                {"code": "LS05", "en": "Mantis Shrimp (Salt & Pepper)", "zh": "椒盐海螳螂", "price": "Seasonal Price"},
                {"code": "LS06", "en": "Mantis Shrimp (Salted Egg Yolk)", "zh": "金沙海螳螂", "price": "Seasonal Price"},
                {"code": "LS07", "en": "Mantis Shrimp (Pei Fong Dong)", "zh": "避风塘炒海螳螂", "price": "Seasonal Price"},
                {"code": "LS08", "en": "Mantis Shrimp (Stir-Fried Ginger Onion)", "zh": "姜葱炒海螳螂", "price": "Seasonal Price"},
                {"code": "LS09", "en": "Mantis Shrimp (Steamed)", "zh": "清蒸海螳螂", "price": "Seasonal Price"},
                {"code": "LS10", "en": "Live Suahe (Baked in Superior Stock)", "zh": "沙虾焗上汤", "price": "Seasonal Price"},
                {"code": "LS11", "en": "Live Suahe (Baked with Cheese)", "zh": "芝士焗沙虾", "price": "Seasonal Price"},
                {"code": "LS12", "en": "Live Suahe (Steamed with Garlic)", "zh": "蒜蓉蒸沙虾", "price": "Seasonal Price"},
                {"code": "LS13", "en": "Live Suahe (with Superior E-FU Noodles)", "zh": "沙虾上汤伊面", "price": "Seasonal Price"},
                {"code": "LS14", "en": "Live Suahe (Salt & Pepper)", "zh": "椒盐沙虾", "price": "Seasonal Price"},
                {"code": "LS15", "en": "Live Suahe (Salted Egg Yolk)", "zh": "金沙沙虾", "price": "Seasonal Price"},
                {"code": "LS16", "en": "Live Suahe (Pei Fong Dong)", "zh": "避风塘炒沙虾", "price": "Seasonal Price"},
                {"code": "LS17", "en": "Live Suahe (Stir-Fried Ginger Onion)", "zh": "姜葱炒沙虾", "price": "Seasonal Price"},
                {"code": "LS18", "en": "Live Suahe (Steamed)", "zh": "清蒸沙虾", "price": "Seasonal Price"},
                {"code": "LS19", "en": "Lobster (Baked in Superior Stock)", "zh": "龙虾焗上汤", "price": "Seasonal Price"},
                {"code": "LS20", "en": "Lobster (Baked with Cheese)", "zh": "芝士焗龙虾", "price": "Seasonal Price"},
                {"code": "LS21", "en": "Lobster (Steamed with Garlic)", "zh": "蒜蓉蒸龙虾", "price": "Seasonal Price"},
                {"code": "LS22", "en": "Lobster (with Superior E-FU Noodles)", "zh": "龙虾上汤伊面", "price": "Seasonal Price"},
                {"code": "LS23", "en": "Lobster (Salt & Pepper)", "zh": "椒盐龙虾", "price": "Seasonal Price"},
                {"code": "LS24", "en": "Lobster (Salted Egg Yolk)", "zh": "金沙龙虾", "price": "Seasonal Price"},
                {"code": "LS25", "en": "Lobster (Pei Fong Dong)", "zh": "避风塘炒龙虾", "price": "Seasonal Price"},
                {"code": "LS26", "en": "Lobster (Stir-Fried Ginger Onion)", "zh": "姜葱炒龙虾", "price": "Seasonal Price"},
                {"code": "LS27", "en": "Lobster (Steamed)", "zh": "清蒸龙虾", "price": "Seasonal Price"},
                {"code": "LS28", "en": "Lapu-Lapu (Baked in Superior Stock)", "zh": "石斑鱼焗上汤", "price": "Seasonal Price"},
                {"code": "LS29", "en": "Lapu-Lapu (Baked with Cheese)", "zh": "芝士焗石斑鱼", "price": "Seasonal Price"},
                {"code": "LS30", "en": "Lapu-Lapu (Steamed with Garlic)", "zh": "蒜蓉蒸石斑鱼", "price": "Seasonal Price"},
                {"code": "LS31", "en": "Lapu-Lapu (with Superior E-FU Noodles)", "zh": "石斑鱼上汤伊面", "price": "Seasonal Price"},
                {"code": "LS32", "en": "Lapu-Lapu (Salt & Pepper)", "zh": "椒盐石斑鱼", "price": "Seasonal Price"},
                {"code": "LS33", "en": "Lapu-Lapu (Salted Egg Yolk)", "zh": "金沙石斑鱼", "price": "Seasonal Price"},
                {"code": "LS34", "en": "Lapu-Lapu (Pei Fong Dong)", "zh": "避风塘炒石斑鱼", "price": "Seasonal Price"},
                {"code": "LS35", "en": "Lapu-Lapu (Stir-Fried Ginger Onion)", "zh": "姜葱炒石斑鱼", "price": "Seasonal Price"},
                {"code": "LS36", "en": "Lapu-Lapu (Steamed)", "zh": "清蒸石斑鱼", "price": "Seasonal Price"},
                {"code": "LS37", "en": "Rock Lobster (Baked in Superior Stock)", "zh": "大龙虾焗上汤", "price": "Seasonal Price"},
                {"code": "LS38", "en": "Rock Lobster (Baked with Cheese)", "zh": "芝士焗大龙虾", "price": "Seasonal Price"},
                {"code": "LS39", "en": "Rock Lobster (Steamed with Garlic)", "zh": "蒜蓉蒸大龙虾", "price": "Seasonal Price"},
                {"code": "LS40", "en": "Rock Lobster (with Superior E-FU Noodles)", "zh": "大龙虾上汤伊面", "price": "Seasonal Price"},
                {"code": "LS41", "en": "Rock Lobster (Salt & Pepper)", "zh": "椒盐大龙虾", "price": "Seasonal Price"},
                {"code": "LS42", "en": "Rock Lobster (Salted Egg Yolk)", "zh": "金沙大龙虾", "price": "Seasonal Price"},
                {"code": "LS43", "en": "Rock Lobster (Pei Fong Dong)", "zh": "避风塘炒大龙虾", "price": "Seasonal Price"},
                {"code": "LS44", "en": "Rock Lobster (Stir-Fried Ginger Onion)", "zh": "姜葱炒大龙虾", "price": "Seasonal Price"},
                {"code": "LS45", "en": "Rock Lobster (Steamed)", "zh": "清蒸大龙虾", "price": "Seasonal Price"},
                {"code": "LS46", "en": "Mud Crab (Baked in Superior Stock)", "zh": "螃蟹焗上汤", "price": "Seasonal Price"},
                {"code": "LS47", "en": "Mud Crab (Baked with Cheese)", "zh": "芝士焗螃蟹", "price": "Seasonal Price"},
                {"code": "LS48", "en": "Mud Crab (Steamed with Garlic)", "zh": "蒜蓉蒸螃蟹", "price": "Seasonal Price"},
                {"code": "LS49", "en": "Mud Crab (with Superior E-FU Noodles)", "zh": "螃蟹上汤伊面", "price": "Seasonal Price"},
                {"code": "LS50", "en": "Mud Crab (Salt & Pepper)", "zh": "椒盐螃蟹", "price": "Seasonal Price"},
                {"code": "LS51", "en": "Mud Crab (Salted Egg Yolk)", "zh": "金沙螃蟹", "price": "Seasonal Price"},
                {"code": "LS52", "en": "Mud Crab (Pei Fong Dong)", "zh": "避风塘炒螃蟹", "price": "Seasonal Price"},
                {"code": "LS53", "en": "Mud Crab (Stir-Fried Ginger Onion)", "zh": "姜葱炒螃蟹", "price": "Seasonal Price"},
                {"code": "LS54", "en": "Mud Crab (Steamed)", "zh": "清蒸螃蟹", "price": "Seasonal Price"},
                {"code": "LS55", "en": "Clams (Baked in Superior Stock)", "zh": "蛤蜊焗上汤", "price": "Seasonal Price"},
                {"code": "LS56", "en": "Clams (Baked with Cheese)", "zh": "芝士焗蛤蜊", "price": "Seasonal Price"},
                {"code": "LS57", "en": "Clams (Steamed with Garlic)", "zh": "蒜蓉蒸蛤蜊", "price": "Seasonal Price"},
                {"code": "LS58", "en": "Clams (with Superior E-FU Noodles)", "zh": "蛤蜊上汤伊面", "price": "Seasonal Price"},
                {"code": "LS59", "en": "Clams (Salt & Pepper)", "zh": "椒盐蛤蜊", "price": "Seasonal Price"},
                {"code": "LS60", "en": "Clams (Salted Egg Yolk)", "zh": "金沙蛤蜊", "price": "Seasonal Price"},
                {"code": "LS61", "en": "Clams (Pei Fong Dong)", "zh": "避风塘炒蛤蜊", "price": "Seasonal Price"},
                {"code": "LS62", "en": "Clams (Stir-Fried Ginger Onion)", "zh": "姜葱炒蛤蜊", "price": "Seasonal Price"},
                {"code": "LS63", "en": "Clams (Steamed)", "zh": "清蒸蛤蜊", "price": "Seasonal Price"},
                {"code": "LS64", "en": "Nylon Clams (Baked in Superior Stock)", "zh": "蛤蜊焗上汤", "price": "Seasonal Price"},
                {"code": "LS65", "en": "Nylon Clams (Baked with Cheese)", "zh": "芝士焗蛤蜊", "price": "Seasonal Price"},
                {"code": "LS66", "en": "Nylon Clams (Steamed with Garlic)", "zh": "蒜蓉蒸蛤蜊", "price": "Seasonal Price"},
                {"code": "LS67", "en": "Nylon Clams (with Superior E-FU Noodles)", "zh": "蛤蜊上汤伊面", "price": "Seasonal Price"},
                {"code": "LS68", "en": "Nylon Clams (Salt & Pepper)", "zh": "椒盐蛤蜊", "price": "Seasonal Price"},
                {"code": "LS69", "en": "Nylon Clams (Salted Egg Yolk)", "zh": "金沙蛤蜊", "price": "Seasonal Price"},
                {"code": "LS70", "en": "Nylon Clams (Pei Fong Dong)", "zh": "避风塘炒蛤蜊", "price": "Seasonal Price"},
                {"code": "LS71", "en": "Nylon Clams (Stir-Fried Ginger Onion)", "zh": "姜葱炒蛤蜊", "price": "Seasonal Price"},
                {"code": "LS72", "en": "Nylon Clams (Steamed)", "zh": "清蒸蛤蜊", "price": "Seasonal Price"},
                {"code": "LS73", "en": "Shark (Baked in Superior Stock)", "zh": "鲨鱼焗上汤", "price": "Seasonal Price"},
                {"code": "LS74", "en": "Shark (Baked with Cheese)", "zh": "芝士焗鲨鱼", "price": "Seasonal Price"},
                {"code": "LS75", "en": "Shark (Steamed with Garlic)", "zh": "蒜蓉蒸鲨鱼", "price": "Seasonal Price"},
                {"code": "LS76", "en": "Shark (with Superior E-FU Noodles)", "zh": "鲨鱼上汤伊面", "price": "Seasonal Price"},
                {"code": "LS77", "en": "Shark (Salt & Pepper)", "zh": "椒盐鲨鱼", "price": "Seasonal Price"},
                {"code": "LS78", "en": "Shark (Salted Egg Yolk)", "zh": "金沙鲨鱼", "price": "Seasonal Price"},
                {"code": "LS79", "en": "Shark (Pei Fong Dong)", "zh": "避风塘炒鲨鱼", "price": "Seasonal Price"},
                {"code": "LS80", "en": "Shark (Stir-Fried Ginger Onion)", "zh": "姜葱炒鲨鱼", "price": "Seasonal Price"},
                {"code": "LS81", "en": "Shark (Steamed)", "zh": "清蒸鲨鱼", "price": "Seasonal Price"},
            ],
            "Dimsum / 点心": [
                {"code": "DM01", "en": "Hakaw (Shrimp Dumpling)", "zh": "晶莹鲜虾饺", "price": 328},
                {"code": "DM02", "en": "Chicken Feet", "zh": "豉汁蒸凤爪", "price": 288},
                {"code": "DM03", "en": "Pork Siomai", "zh": "蟹籽烧卖皇", "price": 268},
                {"code": "DM04", "en": "Steamed Spare Ribs", "zh": "豉汁蒸排骨", "price": 258},
                {"code": "DM05", "en": "Chiu Chow Dumpling", "zh": "潮式蒸粉粿", "price": 258},
                {"code": "DM06", "en": "Beef Ball with Beancurd Stick", "zh": "鲜竹牛肉球", "price": 258},
                {"code": "DM07", "en": "Bean Curd Sheet Roll", "zh": "蚝油鲜竹卷", "price": 258},
                {"code": "DM08", "en": "Glutinous Rice Wrap (Machang)", "zh": "荷叶珍珠鸡", "price": 258},
                {"code": "DM09", "en": "Crystal Spinach Dumpling", "zh": "水晶菠菜饺", "price": 258},
                {"code": "DM10", "en": "Steamed Beef Tripe with Black Pepper", "zh": "黑椒蒸牛肚", "price": 258},
                {"code": "DM11", "en": "Traditional Malay Cake", "zh": "怀旧马拉糕", "price": 208},

                {"code": "DM12", "en": "Egg Tart", "zh": "酥皮焗蛋挞", "price": 258},
                {"code": "DM13", "en": "Baked BBQ Asado Pork Pie", "zh": "松化叉烧酥", "price": 258},

                {"code": "DM14", "en": "Pan-Fried Radish Cake", "zh": "香煎萝卜糕", "price": 258},
                {"code": "DM15", "en": "XO Sauce Radish Cake", "zh": "XO酱萝卜糕", "price": 258},
                {"code": "DM16", "en": "Pan-Fried Rice Roll with XO Sauce", "zh": "XO酱煎肠粉", "price": 258},
                {"code": "DM17", "en": "Pan-Fried Pork Bun", "zh": "生煎鲜肉包", "price": 258},

                {"code": "DM18", "en": "Century Egg & Pork Congee", "zh": "皮蛋瘦肉粥", "price": 258},
                {"code": "DM19", "en": "Sliced Fish Congee", "zh": "鲜滑鱼片粥", "price": 258},

                {"code": "DM20", "en": "Fresh Shrimp Rice Roll", "zh": "手拆鲜虾肠粉", "price": 328},
                {"code": "DM21", "en": "BBQ Pork Asado Rice Roll", "zh": "蜜汁叉烧肠粉", "price": 258},
                {"code": "DM22", "en": "Minced Beef Rice Roll", "zh": "香茜牛肉肠粉", "price": 258},
                {"code": "DM23", "en": "Plain Rice Roll", "zh": "手工蒸滑肠粉", "price": 228},

                {"code": "DM24", "en": "Salted Egg Yolk Custard Bun", "zh": "金香流沙包", "price": 258},
                {"code": "DM25", "en": "Steamed BBQ Pork Bun (Asado Pao)", "zh": "蜜汁叉烧包", "price": 258},
                {"code": "DM26", "en": "Birthday Bun (Lotus Paste)", "zh": "莲蓉寿桃包", "price": 258},
                {"code": "DM27", "en": "Shanghai Xiao Long Bao", "zh": "上海小笼包", "price": 258},
                {"code": "DM28", "en": "Steamed Mantou", "zh": "蒸馒头", "price": 208},

                {"code": "DM29", "en": "Crispy Cheese Prawn Roll", "zh": "芝士虾春卷", "price": 258},
                {"code": "DM30", "en": "Deep Fried Taro Puff", "zh": "酥脆香芋角", "price": 258},
                {"code": "DM31", "en": "Ham Sui Kok (Fried Glutinous Rice Dumpling)", "zh": "家乡咸水角", "price": 258},
                {"code": "DM32", "en": "Fried Sesame Balls (Buchi)", "zh": "香炸芝麻球", "price": 208},
                {"code": "DM33", "en": "Fried Mantou", "zh": "黄金炸馒头", "price": 208},

                {"code": "DM34", "en": "Coffee Jelly", "zh": "生磨咖啡糕", "price": 188},
                {"code": "DM35", "en": "Mango Mochi (Snow Lady)", "zh": "香芒雪媚娘", "price": 228},

                {"code": "DM36", "en": "Hot Almond Cream with Glutinous Balls", "zh": "汤圆杏仁茶", "price": 188},
                {"code": "DM37", "en": "Hot Taro Sago", "zh": "香芋西米露", "price": 188},
                {"code": "DM38", "en": "Hot Black Glutinous Rice with Coconut Milk", "zh": "椰香紫米露", "price": 188},
            ],
            "Set Menu / 套餐": [
                {"code": "SET1", "en": "Set Menu 1 (Good for 10)", "zh": "套餐一", "price": 25800, "desc": "Assorted Cold Cuts, Steamed Live Suahe, Abalone Soup, Sautéed Shrimp & Squid, Seafood Salad Roll, Abalone Cubes, Steamed Lapu-Lapu, Roasted Chicken, Free Noodle or Rice, Free 2 Kinds of Dessert"},
                {"code": "SET2", "en": "Set Menu 2 (Good for 10)", "zh": "套餐二", "price": 32800, "desc": "Assorted Cold Cuts, Steamed Prawns, Double Boiled Fish Maw Soup, Scallop Salad Roll, Whole 10-Head Abalone, Fried Crispy Pigeon, Steamed Lapu-Lapu, Stir Fried Sea Cucumber, Shark Fin Rice, Free 2 Kinds of Dessert"},
                {"code": "SET3", "en": "Set Menu 3 (Good for 10)", "zh": "套餐三", "price": 35800, "desc": "Suckling Pig, Steamed Prawns, Shark Fin Soup, Diced Scallop in Taro Ring, Whole 10-Head Abalone with Sea Cucumber, Steamed Lapu-Lapu, Roasted Goose, Typhoon Shelter Crab, Free Noodles or Rice, Free 2 Kinds of Dessert"},
                {"code": "SET4", "en": "Set Menu 4 (Good for 10)", "zh": "套餐四", "price": 38800, "desc": "Suckling Pig with Mala Sea Cucumber, Shark Fin Soup, Imported Scallop with Broccoli, Shrimp Stuffed Fried Crab Claw, 8-Head Abalone with Fish Maw, Steamed Tiger Lapu-Lapu, Salt & Pepper Mantis Shrimp, Roasted Duck, Free Noodles or Rice, Free 2 Kinds of Dessert"},
                {"code": "SET5", "en": "Set Menu 5 (Good for 10)", "zh": "套餐五", "price": 55800, "desc": "Suckling Pig (Whole), Steamed Rock Lobster, Fried Taro Scallop Pie, Chicken Shark Fin Soup (Individual), Sea Cucumber with Dried Scallop, 8-Head Abalone with Fish Maw, Steamed Red Lapu-Lapu, Roasted Goose, Free Noodles or Rice, Bird's Nest in Mango Pomelo Sweet Soup, Mixed Fruits"},
                {"code": "SET6", "en": "Set Menu 6 (Good for 10)", "zh": "套餐六", "price": 65800, "desc": "Suckling Pig with Foie Gras & Caviar, Braised Shark Fin Soup, Original Lobster with Superior Sauce, Dried Scallop with Winter Melon Ring, Whole Sea Cucumber with Shredded Meat, Whole 6-Head Abalone with Fish Maw, Steamed Double Red Lapu-Lapu, Roasted Goose, Whole Scallop with Black Truffle Noodles, Bird's Nest Soup, Mixed Fruits"},
            ]
        }

        self.stdout.write("Clearing old menu data...")

        # WIPE DATA
        MenuItemPrice.objects.all().delete()
        MenuItem.objects.all().delete()
        Category.objects.all().delete()
        CookingMethod.objects.all().delete()

        # Path to your images folder (inside backend/seed_images/menu/)
        BASE_IMAGE_PATH = os.path.join(settings.BASE_DIR, 'seed_images', 'menu')

        with transaction.atomic():
            cat_order = 1
            for cat_full_name, items in menu_data.items():
                
                # 1. Category Name Parsing
                if " / " in cat_full_name:
                     cat_parts = cat_full_name.split(" / ")
                     cat_raw = cat_parts[0]
                     cat_zh = cat_parts[-1].strip()
                     cat_en = cat_raw.strip()
                else:
                    cat_en = cat_full_name
                    cat_zh = ""

                category, _ = Category.objects.get_or_create(
                    name=cat_en,
                    defaults={'name_zh': cat_zh, 'order': cat_order}
                )
                cat_order += 1
                
                self.stdout.write(f"Processing {category.name}...")

                # 2. Item Processing
                for item_data in items:
                    raw_name = item_data['en']
                    raw_name_zh = item_data.get('zh', '')
                    item_code = item_data.get('code')

                    # --- LOGIC FOR LIVE SEAFOOD GROUPING ---
                    # Matches "Name (Method)"
                    match = re.match(r"^(.*?)\s*\((.*?)\)$", raw_name)
                    
                    if "Live Seafood" in cat_en and match:
                        base_name = match.group(1).strip()
                        method_name = match.group(2).strip()
                        
                        # Use Translation Map for the BASE item name
                        base_name_zh = SEAFOOD_TRANSLATIONS.get(base_name, raw_name_zh)

                        # Create the Parent Item (e.g., "Mantis Shrimp")
                        item, created = MenuItem.objects.get_or_create(
                            name=base_name,
                            category=category,
                            defaults={
                                'code': item_code, # Takes the code of the first parsed variant
                                'name_zh': base_name_zh,
                                'description': "Fresh from our aquariums, cooked to your preference.",
                            }
                        )

                        # --- IMAGE HANDLING LOGIC FOR LIVE SEAFOOD ---
                        if created and base_name in SEAFOOD_IMAGES:
                            filename = SEAFOOD_IMAGES[base_name]
                            file_path = os.path.join(BASE_IMAGE_PATH, 'Live Seafood', filename)
                            
                            if os.path.exists(file_path):
                                self.stdout.write(f"  --> Attaching image: {filename}")
                                with open(file_path, 'rb') as f:
                                    item.image.save(filename, File(f), save=True)
                            else:
                                self.stdout.write(self.style.WARNING(f"  --> Image not found: {file_path}"))

                        # Create/Link Cooking Method
                        cooking_method, _ = CookingMethod.objects.get_or_create(name=method_name)
                        item.cooking_methods.add(cooking_method)

                        # Only add price logic on the first creation
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
                                'name_zh': raw_name_zh,
                                'description': item_data.get('desc', ''),
                            }
                        )

                        # --- IMAGE HANDLING LOGIC FOR STANDARD ITEMS ---
                        if created and item_code in IMAGE_MAP:
                            rel_path = IMAGE_MAP[item_code]
                            file_path = os.path.join(BASE_IMAGE_PATH, rel_path)
                            
                            if os.path.exists(file_path):
                                self.stdout.write(f"  --> Attaching image: {rel_path}")
                                with open(file_path, 'rb') as f:
                                    # Extract just the filename for saving
                                    filename = os.path.basename(rel_path)
                                    item.image.save(filename, File(f), save=True)
                            else:
                                self.stdout.write(self.style.WARNING(f"  --> Image not found: {file_path}"))
                        
                        # If item existed, wipe old prices to re-seed
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

        self.stdout.write(self.style.SUCCESS('Menu seeded successfully!'))