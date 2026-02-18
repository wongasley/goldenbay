import re
from django.core.management.base import BaseCommand
from django.db import transaction
from inventory.models import MenuItem, MenuCategory, MenuItemPrice
from decimal import Decimal, InvalidOperation

class Command(BaseCommand):
    help = 'Seeds the database with the full GoldenBay menu'

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Seeding full menu from provided data...'))

        # Clean existing menu data to prevent duplicates


        # The complete menu data transcribed from the PDF
        menu_data = {
            "Barbecue, Appetizer 燒烤滷味 / 燒烤滷味": [
                {"code": "BA01", "en": "Roasted Cold Cuts Combination", "zh": "錦繡燒味拼盤", "prices": {"S": 750, "M": 1500, "L": 2250}},
                {"code": "BA02", "en": "Crispy Roasted Pork Belly", "zh": "金牌燒腩仔", "prices": {"S": 680, "M": 1360, "L": 2040}},
                {"code": "BA03", "en": "Honey Sauce Pork Asado", "zh": "蜜汁烤叉燒", "prices": {"S": 600, "M": 900, "L": 1200}},
                {"code": "BA04", "en": "Soy Chicken", "zh": "玫瑰豉油雞", "prices": {"Half": 900, "Whole": 1800}},
                {"code": "BA05", "en": "White Chicken", "zh": "水晶白切雞", "prices": {"Half": 900, "Whole": 1800}},
                {"code": "BA06", "en": "Roasted Chicken", "zh": "南乳吊燒雞", "prices": {"Half": 900, "Whole": 1800}},
                {"code": "BA07", "en": "Crispy Fried Pigeon", "zh": "金牌燒乳鴿", "price": 750},
                {"code": "BA08", "en": "Suckling Pig", "zh": "鴻運烤乳豬", "prices": {"Half": 4000, "Whole": 7500}},
                {"code": "BA09", "en": "Roasted Goose", "zh": "金海灣燒鵝", "prices": {"Half": 3200, "Whole": 6000}},
                {"code": "BA10", "en": "Peking Duck", "zh": "北京片皮鴨", "prices": {"Half": 1800, "Whole": 3500}},
                {"code": "BA11", "en": "Roasted Rice Duck", "zh": "掛爐燒米鴨", "prices": {"Half": 1600, "Whole": 3000}},
                {"code": "BA12", "en": "Sesame Oil Jelly Fish", "zh": "麻油拌海蜇", "prices": {"S": 500, "M": 1000, "L": 1500}},
                {"code": "BA13", "en": "Sliced Beef Shank", "zh": "滷水牛腱", "prices": {"S": 500, "M": 1000, "L": 1500}},
                {"code": "BA14", "en": "Century Egg with Pickles Ginger", "zh": "皮蛋酸姜", "price": 288},
                {"code": "BA15", "en": "Marinated Cucumber", "zh": "凉拌青瓜", "price": 288},
            ],
            "Soup 湯羹 / 湯羹": [
                {"code": "S01", "en": "Pumpkin Seafood Soup", "zh": "金瓜海皇羹", "prices": {"S": 650, "M": 975, "L": 1300}},
                {"code": "S02", "en": "Spinach Seafood Soup", "zh": "菠菜海鮮羹", "prices": {"S": 650, "M": 975, "L": 1300}},
                {"code": "S03", "en": "Seafood Corn Soup", "zh": "海鮮粟米羹", "prices": {"S": 650, "M": 975, "L": 1300}},
                {"code": "S04", "en": "Chicken with Asparagus Soup", "zh": "鮮露筍雞片湯", "prices": {"S": 700, "M": 1050, "L": 1400}},
                {"code": "S05", "en": "West Lake Minced Beef Soup", "zh": "西湖牛肉羹", "prices": {"S": 650, "M": 975, "L": 1300}},
                {"code": "S06", "en": "8 Treasures in Winter Melon Soup", "zh": "八寶冬瓜粒湯", "prices": {"S": 750, "M": 1125, "L": 1500}},
                {"code": "S07", "en": "Hot & Sour Soup", "zh": "上海酸辣羹", "prices": {"S": 750, "M": 1125, "L": 1500}},
                {"code": "S08", "en": "Assorted Dried Seafood Soup", "zh": "三絲海味羹", "prices": {"S": 980, "M": 1470, "L": 1960}},
            ],
            "Sea Cucumber 海參 / 海參": [
                {"code": "SC01", "en": "Sea Cucumber with Vegetable", "zh": "綠玉瓜蝦子禿參", "prices": {"S": 1800, "M": 2700, "L": 3600}},
                {"code": "SC02", "en": "Stir-Fried Sea Cucumber w/ Scallion", "zh": "蔥燒蝦子海參", "prices": {"S": 1800, "M": 2700, "L": 3600}},
                {"code": "SC03", "en": "Crystal Jade Sea Cucumber", "zh": "白玉禿參伴翡翠", "prices": {"S": 2400, "M": 3600, "L": 4800}},
                {"code": "SC04", "en": "Sea Cucumber w/ Pork Tendon in Pot", "zh": "海参蹄筋煲", "prices": {"S": 2200, "M": 3300, "L": 4400}},
                {"code": "SC05", "en": "Whole Sea Cucumber w/ Shrimp Roe", "zh": "蝦子扣原條海參", "prices": {"M": 4500, "L": 6000}},
                {"code": "SC06", "en": "Whole Sea Cucumber w/ Shredded Meat", "zh": "魚香肉絲扣原條海參", "prices": {"M": 4500, "L": 6000}},
                {"code": "SC07", "en": "Sea Cucumber w/ Fish Maw & Conpoy Sauce", "zh": "金絲扒花膠海參", "prices": {"S": 3000, "M": 4500, "L": 6000}},
            ],
            "Shark’s Fin, Bird’s Nest 魚翅燕窩 / 魚翅燕窩": [
                {"code": "SB01", "en": "Superior Stock Shark’s Fin in Stone Pot", "zh": "紅燒石窩鮑翅", "price": 2200},
                {"code": "SB02", "en": "Puree Stock Shark’s Fin in Stone Pot", "zh": "濃湯石窩鮑翅", "price": 2200},
                {"code": "SB03", "en": "Shark’s Fin w/ Crab Meat", "zh": "紅燒蟹肉翅", "prices": {"S": 3000, "M": 4500, "L": 6000}},
                {"code": "SB04", "en": "Stir Fried Shark’s Fin", "zh": "濃炒桂花翅", "prices": {"S": 3000, "M": 4500, "L": 6000}},
                {"code": "SB05", "en": "Bird’s Nest in Honey", "zh": "蜂蜜燉燕窩", "price": 2400},
                {"code": "SB06", "en": "Bird’s Nest in Coconut Milk", "zh": "椰汁燉燕窩", "price": 2400},
            ],
            "Abalone 鲍鱼 / 鲍鱼": [
                {"code": "AB01", "en": "Seafood w/ Abalone in Pot", "zh": "鮑魚一品煲", "prices": {"S": 2500, "M": 3750, "L": 5000}},
                {"code": "AB02", "en": "Sliced Imported Abalone w/ Mushroom", "zh": "冬菇入口鮑片", "prices": {"S": 3000, "M": 4500, "L": 6000}},
                {"code": "AB03", "en": "Imported Abalone Cube w/ Vegetable", "zh": "翡翠入口鮑角", "prices": {"S": 3000, "M": 4500, "L": 6000}},
                {"code": "AB04", "en": "Whole 3 Head Abalone w/ Sea Cucumber", "zh": "原只鮑魚扣海參", "price": 2400},
                {"code": "AB05", "en": "Whole 3 Head Abalone w/ Fish Maw", "zh": "原只鮑魚扣花膠", "price": 2400},
                {"code": "AB06", "en": "Braised Spike Sea Cucumber with Abalone", "zh": "红烧刺参鲍鱼", "price": 1300},
            ],
            "Shrimp 蝦 / 蝦": [
                {"code": "SP01", "en": "Hot Prawn Salad", "zh": "熱沙律蝦球", "prices": {"S": 1500, "M": 2250, "L": 3000}},
                {"code": "SP02", "en": "Sautéed Prawn Balls w/ Broccoli Flower", "zh": "西蘭花蝦球", "prices": {"S": 1500, "M": 2250, "L": 3000}},
                {"code": "SP03", "en": "Sauteed Prawn Balls w/ Pomelo Sauce", "zh": "柚子明蝦球", "prices": {"S": 1500, "M": 2250, "L": 3000}},
                {"code": "SP04", "en": "Baked Prawns w/ Black & White Pepper", "zh": "黑白胡椒焗大蝦", "prices": {"S": 1800, "M": 2700, "L": 3600}},
                {"code": "SP05", "en": "Baked Cereal Prawns", "zh": "星洲麥片焗海蝦", "prices": {"S": 1800, "M": 2700, "L": 3600}},
                {"code": "SP06", "en": "Steamed Prawns w/ Garlic & Vermicelli", "zh": "蒜蓉粉絲蒸大蝦", "prices": {"S": 1800, "M": 2700, "L": 3600}},
                {"code": "SP07", "en": "Sautéed Prawn Ball and Scallop with Celery in XO Sauce", "zh": "XO酱西芹炒虾球带子", "prices": {"S": 2000, "M": 3000, "L": 4000}},
                {"code": "SP08", "en": "Fried Shrimp Ball with Salad Lemon Sauce", "zh": "沙律柠檬酱炸虾球", "prices": {"S": 1500, "M": 2250, "L": 3000}},
            ],
            "Seafood Dishes 海鮮烹調 / 海鮮烹調": [
                {"code": "SF01", "en": "Sautéed Fish Fillet w/ Vegetable", "zh": "碧綠炒魚片", "prices": {"S": 700, "M": 1050, "L": 1400}},
                {"code": "SF02", "en": "Steamed Fish Fillet w/ Garlic", "zh": "蒜茸蒸魚柳", "prices": {"S": 550, "M": 825, "L": 1100}},
                {"code": "SF03", "en": "Eel & Pork Tendon w/ Abalone Paste", "zh": "鮑魚醬鱔球蹄筋", "prices": {"S": 1200, "M": 1800, "L": 2400}},
                {"code": "SF04", "en": "Sizzling Squid Tentacle", "zh": "鐵板砵酒焗墨魚鬚", "prices": {"S": 700, "M": 1050, "L": 1400}},
                {"code": "SF05", "en": "Fried Squid in Salt and Pepper", "zh": "蒜香椒鹽鮮魷花", "prices": {"S": 700, "M": 1050, "L": 1400}},
                {"code": "SF06", "en": "Clam Omelet w/ Preserved Radish", "zh": "菜脯花蛤煎蛋烙", "prices": {"S": 800, "M": 1200, "L": 1600}},
                {"code": "SF07", "en": "Salad Seafood Roll", "zh": "沙律海鮮卷", "prices": {"S": 900, "M": 1350, "L": 1800}},
                {"code": "SF08", "en": "Diced Scallop w/ Crab Pearl in Taro Ring", "zh": "冠軍蟹珠帶子崧", "prices": {"S": 1400, "M": 2100, "L": 2800}},
                {"code": "SF09", "en": "Imported Scallops w/ Broccoli Flower", "zh": "西蘭花入口帶子", "prices": {"S": 2000, "M": 3000, "L": 4000}},
                {"code": "SF10", "en": "Shrimp Stuffed Fried Crab Claw", "zh": "香酥百花釀蟹鉗", "prices": {"S": 1800, "M": 2700, "L": 3600}},
                {"code": "SF11", "en": "Fried Stuffed Shrimp Ball w/ Cheese", "zh": "蟹籽鮮蝦芝心丸", "prices": {"S": 1800, "M": 2700, "L": 3600}},
                {"code": "SF12", "en": "Steamed Lobster Meat with Egg White in Superior Sauce", "zh": "上汤蛋白蒸龙虾肉", "price": "Seasonal Price"},
                {"code": "SF13", "en": "Fried Crispy Spike Sea Cucumber and Taro in Black Truffle", "zh": "黑松露香芋脆刺参", "prices": {"S": 1280, "M": 1920, "L": 2560}},
                {"code": "SF14", "en": "Sautéed Waysan and Slice in Xo Sauce", "zh": "XO酱炒淮山片", "prices": {"S": 800, "M": 1200, "L": 1600}},
                {"code": "SF15", "en": "Pan Fried Cuttlefish Cake", "zh": "香煎墨鱼饼", "prices": {"S": 700, "M": 1050, "L": 1400}},
                {"code": "SF16", "en": "Scallop with Scramble Egg White in Black Truffle Sauce", "zh": "黑松露炒蛋白带子", "prices": {"S": 800, "M": 1200, "L": 1600}},
            ],
            "Sichuan Spicy Dishes 川菜系列 / 川菜系列": [
                {"code": "CQ01", "en": "Chong Qing Spicy Fish in Chili Oil", "zh": "重慶水煮魚", "price": "Seasonal Price"},
                {"code": "CQ02", "en": "Sichuan Pickled Fish", "zh": "四川酸菜魚", "price": "Seasonal Price"},
                {"code": "CQ03", "en": "Hot & Sour Shredded Potato", "zh": "酸辣土豆絲", "prices": {"S": 650, "M": 975, "L": 1300}},
                {"code": "CQ04", "en": "Spicy Suahe Sichuan Style", "zh": "香辣炒蝦", "prices": {"S": 1200, "M": 1800, "L": 2400}},
                {"code": "CQ05", "en": "Home Made Sichuan Spicy Tofu", "zh": "家常燒豆腐", "prices": {"S": 900, "M": 1350, "L": 1800}},
                {"code": "CQ06", "en": "Spicy Beef in Chili Oil", "zh": "四川水煮牛肉", "prices": {"S": 1400, "M": 2100, "L": 2800}},
                {"code": "CQ07", "en": "Sautéed Sliced Beef w/ Green Pepper", "zh": "杭椒嫩牛肉", "prices": {"S": 1000, "M": 1500, "L": 2000}},
            ],
            "Pork, Lamb, Chicken, Duck 猪羊鸡鸭 / 猪羊鸡鸭": [
                {"code": "P01", "en": "Braised Dong Po Pork", "zh": "蘇杭東坡肉", "price": 350},
                {"code": "P02", "en": "Sweet and Sour Pork", "zh": "菠蘿咕嚕肉", "prices": {"S": 600, "M": 900, "L": 1200}},
                {"code": "P03", "en": "Spareribs Salt & Pepper", "zh": "椒鹽焗肉排", "prices": {"S": 600, "M": 900, "L": 1200}},
                {"code": "P04", "en": "Pan Fried Black Babe Meat", "zh": "香煎黑豚肉", "prices": {"S": 1200, "M": 1800, "L": 2400}},
                {"code": "P05", "en": "Patatim w/ Fried Bun", "zh": "紅燒大元蹄", "price": 1800},
                {"code": "P06", "en": "Lamb Brisket in Pot", "zh": "港式羊腩煲", "prices": {"S": 1800, "L": 3600}},
                {"code": "P07", "en": "Sliced Chicken Sze Chuan Style", "zh": "宮保炒雞丁", "prices": {"S": 600, "M": 900, "L": 1200}},
                {"code": "P08", "en": "Spareribs with Special Vinegar", "zh": "特制香醋排骨", "prices": {"S": 700, "M": 1050, "L": 1400}},
                {"code": "P09", "en": "Mala Chicken Pot Hong Kong Style", "zh": "港式麻辣鸡煲", "prices": {"S": 600, "M": 900, "L": 1200}},
                {"code": "P10", "en": "Stew Dongpo Pork with Dry Bamboo Shoot", "zh": "干笋东坡肉", "prices": {"S": 1080, "M": 1620, "L": 2160}},
                {"code": "P11", "en": "Steamed Mince Pork with 3 kind Egg", "zh": "三色蛋蒸肉饼", "prices": {"S": 700, "M": 1050, "L": 1400}},
            ],
            "Beef 牛肉 / 牛肉": [
                {"code": "BF01", "en": "Beef w/ Broccoli Flower", "zh": "西蘭花牛肉", "prices": {"S": 800, "M": 1200, "L": 1600}},
                {"code": "BF02", "en": "Beef w/ Ampalaya in Black Bean Sauce", "zh": "豉汁涼瓜牛肉", "prices": {"S": 700, "M": 1050, "L": 1400}},
                {"code": "BF03", "en": "Beef Tenderloin Chinese Style", "zh": "中式煎牛柳", "prices": {"S": 1200, "M": 1800, "L": 2400}},
                {"code": "BF04", "en": "Beef Brisket in Hot Pot", "zh": "柱侯牛腩煲", "prices": {"S": 1200, "M": 1800, "L": 2400}},
                {"code": "BF05", "en": "Curry Beef Brisket in Hot Pot", "zh": "馬來咖喱牛腩煲", "prices": {"S": 1200, "M": 1800, "L": 2400}},
                {"code": "BF06", "en": "Sizzling Beef Spareribs in Black Pepper Sauce", "zh": "鐵板黑椒牛仔骨", "prices": {"S": 1200, "M": 1800, "L": 2400}},
                {"code": "BF07", "en": "Beef Cubes with Potato", "zh": "土豆炒牛柳粒", "prices": {"S": 800, "M": 1200, "L": 1600}},
            ],
            "Bean Curd 豆腐 / 豆腐": [
                {"code": "BC01", "en": "Crispy Fried Bean Curd", "zh": "脆皮炸豆腐", "prices": {"S": 500, "M": 750, "L": 1000}},
                {"code": "BC02", "en": "Mapo Bean Curd", "zh": "麻婆豆腐", "prices": {"S": 700, "M": 1050, "L": 1400}},
                {"code": "BC03", "en": "Braised Seafood Bean Curd in Pot", "zh": "海鮮豆腐煲", "prices": {"S": 700, "M": 1050, "L": 1400}},
                {"code": "BC04", "en": "Spinach Bean Curd with Scallop", "zh": "瑤柱翡翠金磚", "prices": {"S": 900, "M": 1350, "L": 1800}},
                {"code": "BC05", "en": "Steamed Bean Curd w/ Assorted Seafood", "zh": "翠塘豆腐", "prices": {"S": 800, "M": 1200, "L": 1600}},
                {"code": "BC06", "en": "Stuffed with Minced Pork Bean Curd", "zh": "客家釀豆腐", "prices": {"S": 900, "M": 1350, "L": 1800}},
            ],
            "Vegetables 蔬菜 / 蔬菜": [
                {"code": "VE01", "en": "Sautéed Imported Vegetable w/ Garlic", "zh": "蒜茸炒入口時蔬", "price": "Seasonal Price"},
                {"code": "VE02", "en": "Fried Pumpkin w/ Salted Egg", "zh": "黃金南瓜條", "prices": {"S": 500, "M": 750, "L": 1000}},
                {"code": "VE03", "en": "Braised Broccoli w/ Black Mushroom", "zh": "香菇扒西蘭花", "prices": {"S": 700, "M": 1050, "L": 1400}},
                {"code": "VE04", "en": "Vegetable w/ 3 Kinds of Egg", "zh": "三皇蛋時蔬", "prices": {"S": 600, "M": 900, "L": 1200}},
                {"code": "VE05", "en": "Assorted Vegetables w/ Fungus & Bean Curd Stick", "zh": "洪七公炒齋", "prices": {"S": 700, "M": 1050, "L": 1400}},
                {"code": "VE06", "en": "Eggplant w/ Spicy Sauce in Pot", "zh": "魚香茄子煲", "prices": {"S": 600, "M": 900, "L": 1200}},
                {"code": "VE07", "en": "Dried Scallop w/ Golden Mushroom & Vegetable", "zh": "金瑤扒時蔬", "prices": {"S": 1000, "M": 1500, "L": 2000}},
                {"code": "VE08", "en": "Sautéed Waysan with Mix Mushroom and Celery", "zh": "淮山西芹炒杂菌", "prices": {"S": 700, "M": 1050, "L": 1400}},
                {"code": "VE09", "en": "Golden Bay Special", "zh": "金湾招牌菜", "prices": {"S": 780, "M": 1180, "L": 1560}},
                {"code": "VE10", "en": "Deep Fried Minced Shrimp with Taiwan Pechay", "zh": "台式白菜炸虾茸", "prices": {"S": 700, "M": 1050, "L": 1400}},
            ],
            "Rice & Noodles 飯麵 / 飯麵": [
                {"code": "RN01", "en": "Braised E-Fu Noodles w/ Abalone Sauce", "zh": "鮑魚汁炆伊麵", "prices": {"S": 600, "M": 900, "L": 1200}},
                {"code": "RN02", "en": "Fried Crispy Seafood Noodles", "zh": "港式海鮮炸麵", "prices": {"S": 650, "M": 980, "L": 1300}},
                {"code": "RN03", "en": "Birthday Noodles", "zh": "生日伊麵", "prices": {"S": 600, "M": 900, "L": 1200}},
                {"code": "RN04", "en": "Golden Bay Fried Rice", "zh": "金海灣炒飯", "prices": {"S": 800, "M": 1200, "L": 1600}},
                {"code": "RN05", "en": "Fujian Fried Rice", "zh": "福建炒飯", "prices": {"S": 650, "M": 980, "L": 1300}},
                {"code": "RN06", "en": "Yang Chow Fried Rice", "zh": "楊州炒飯", "prices": {"S": 600, "M": 900, "L": 1200}},
                {"code": "RN07", "en": "Salted Fish w/ Diced Chicken Fried Rice", "zh": "鹹魚雞粒炒飯", "prices": {"S": 650, "M": 980, "L": 1300}},
                {"code": "RN08", "en": "Sautéed Minced pork w/ dry Shrimp & Vermicelli", "zh": "虾米肉碎炒粉丝", "prices": {"S": 700, "M": 1050, "L": 1400}},
                {"code": "RN09", "en": "Garlic Fried Rice", "zh": "蒜蓉炒飯", "prices": {"S": 450, "M": 680, "L": 900}},
                {"code": "RN10", "en": "Sautéed Noodles with Black Truffle", "zh": "黑松露炒面", "prices": {"S": 800, "M": 1200, "L": 1600}},
            ],
            "Live Seafood 活海鮮 / 活海鮮": [
                {"code": "LS01", "en": "Sea Mantis (Baked Superior Stock)", "zh": "海螳螂焗上汤", "price": "Seasonal Price"},
                {"code": "LS02", "en": "Sea Mantis (Baked with Cheese)", "zh": "芝士焗海螳螂", "price": "Seasonal Price"},
                {"code": "LS03", "en": "Sea Mantis (Steamed w/ Garlic)", "zh": "蒜蓉蒸海螳螂", "price": "Seasonal Price"},
                {"code": "LS04", "en": "Sea Mantis (Superior E-FU Noodles)", "zh": "海螳螂上汤伊面", "price": "Seasonal Price"},
                {"code": "LS05", "en": "Sea Mantis (Salt & Pepper)", "zh": "椒盐海螳螂", "price": "Seasonal Price"},
                {"code": "LS06", "en": "Sea Mantis (Salted Egg Yolk)", "zh": "金沙海螳螂", "price": "Seasonal Price"},
                {"code": "LS07", "en": "Sea Mantis (Pei Fong Dong)", "zh": "避风塘炒海螳螂", "price": "Seasonal Price"},
                {"code": "LS08", "en": "Sea Mantis (Stir-Fried Ginger Onion)", "zh": "姜葱炒海螳螂", "price": "Seasonal Price"},
                {"code": "LS09", "en": "Sea Mantis (Steamed)", "zh": "清蒸海螳螂", "price": "Seasonal Price"},
                {"code": "LS10", "en": "Suahe (Baked Superior Stock)", "zh": "沙虾焗上汤", "price": "Seasonal Price"},
                {"code": "LS11", "en": "Suahe (Baked with Cheese)", "zh": "芝士焗沙虾", "price": "Seasonal Price"},
                {"code": "LS12", "en": "Suahe (Steamed w/ Garlic)", "zh": "蒜蓉蒸沙虾", "price": "Seasonal Price"},
                {"code": "LS13", "en": "Suahe (Superior E-FU Noodles)", "zh": "沙虾上汤伊面", "price": "Seasonal Price"},
                {"code": "LS14", "en": "Suahe (Salt & Pepper)", "zh": "椒盐沙虾", "price": "Seasonal Price"},
                {"code": "LS15", "en": "Suahe (Salted Egg Yolk)", "zh": "金沙沙虾", "price": "Seasonal Price"},
                {"code": "LS16", "en": "Suahe (Pei Fong Dong)", "zh": "避风塘炒沙虾", "price": "Seasonal Price"},
                {"code": "LS17", "en": "Suahe (Stir-Fried Ginger Onion)", "zh": "姜葱炒沙虾", "price": "Seasonal Price"},
                {"code": "LS18", "en": "Suahe (Steamed)", "zh": "清蒸沙虾", "price": "Seasonal Price"},
                {"code": "LS19", "en": "Lobster (Baked Superior Stock)", "zh": "龙虾焗上汤", "price": "Seasonal Price"},
                {"code": "LS20", "en": "Lobster (Baked with Cheese)", "zh": "芝士焗龙虾", "price": "Seasonal Price"},
                {"code": "LS21", "en": "Lobster (Steamed w/ Garlic)", "zh": "蒜蓉蒸龙虾", "price": "Seasonal Price"},
                {"code": "LS22", "en": "Lobster (Superior E-FU Noodles)", "zh": "龙虾上汤伊面", "price": "Seasonal Price"},
                {"code": "LS23", "en": "Lobster (Salt & Pepper)", "zh": "椒盐龙虾", "price": "Seasonal Price"},
                {"code": "LS24", "en": "Lobster (Salted Egg Yolk)", "zh": "金沙龙虾", "price": "Seasonal Price"},
                {"code": "LS25", "en": "Lobster (Pei Fong Dong)", "zh": "避风塘炒龙虾", "price": "Seasonal Price"},
                {"code": "LS26", "en": "Lobster (Stir-Fried Ginger Onion)", "zh": "姜葱炒龙虾", "price": "Seasonal Price"},
                {"code": "LS27", "en": "Lobster (Steamed)", "zh": "清蒸龙虾", "price": "Seasonal Price"},
                {"code": "LS28", "en": "Lapu-Lapu (Baked Superior Stock)", "zh": "石斑鱼焗上汤", "price": "Seasonal Price"},
                {"code": "LS29", "en": "Lapu-Lapu (Baked with Cheese)", "zh": "芝士焗石斑鱼", "price": "Seasonal Price"},
                {"code": "LS30", "en": "Lapu-Lapu (Steamed w/ Garlic)", "zh": "蒜蓉蒸石斑鱼", "price": "Seasonal Price"},
                {"code": "LS31", "en": "Lapu-Lapu (Superior E-FU Noodles)", "zh": "石斑鱼上汤伊面", "price": "Seasonal Price"},
                {"code": "LS32", "en": "Lapu-Lapu (Salt & Pepper)", "zh": "椒盐石斑鱼", "price": "Seasonal Price"},
                {"code": "LS33", "en": "Lapu-Lapu (Salted Egg Yolk)", "zh": "金沙石斑鱼", "price": "Seasonal Price"},
                {"code": "LS34", "en": "Lapu-Lapu (Pei Fong Dong)", "zh": "避风塘炒石斑鱼", "price": "Seasonal Price"},
                {"code": "LS35", "en": "Lapu-Lapu (Stir-Fried Ginger Onion)", "zh": "姜葱炒石斑鱼", "price": "Seasonal Price"},
                {"code": "LS36", "en": "Lapu-Lapu (Steamed)", "zh": "清蒸石斑鱼", "price": "Seasonal Price"},
                {"code": "LS37", "en": "Rock Lobster (Baked Superior Stock)", "zh": "大龙虾焗上汤", "price": "Seasonal Price"},
                {"code": "LS38", "en": "Rock Lobster (Baked with Cheese)", "zh": "芝士焗大龙虾", "price": "Seasonal Price"},
                {"code": "LS39", "en": "Rock Lobster (Steamed w/ Garlic)", "zh": "蒜蓉蒸大龙虾", "price": "Seasonal Price"},
                {"code": "LS40", "en": "Rock Lobster (Superior E-FU Noodles)", "zh": "大龙虾上汤伊面", "price": "Seasonal Price"},
                {"code": "LS41", "en": "Rock Lobster (Salt & Pepper)", "zh": "椒盐大龙虾", "price": "Seasonal Price"},
                {"code": "LS42", "en": "Rock Lobster (Salted Egg Yolk)", "zh": "金沙大龙虾", "price": "Seasonal Price"},
                {"code": "LS43", "en": "Rock Lobster (Pei Fong Dong)", "zh": "避风塘炒大龙虾", "price": "Seasonal Price"},
                {"code": "LS44", "en": "Rock Lobster (Stir-Fried Ginger Onion)", "zh": "姜葱炒大龙虾", "price": "Seasonal Price"},
                {"code": "LS45", "en": "Rock Lobster (Steamed)", "zh": "清蒸大龙虾", "price": "Seasonal Price"},
                {"code": "LS46", "en": "Crab (Baked Superior Stock)", "zh": "螃蟹焗上汤", "price": "Seasonal Price"},
                {"code": "LS47", "en": "Crab (Baked with Cheese)", "zh": "芝士焗螃蟹", "price": "Seasonal Price"},
                {"code": "LS48", "en": "Crab (Steamed w/ Garlic)", "zh": "蒜蓉蒸螃蟹", "price": "Seasonal Price"},
                {"code": "LS49", "en": "Crab (Superior E-FU Noodles)", "zh": "螃蟹上汤伊面", "price": "Seasonal Price"},
                {"code": "LS50", "en": "Crab (Salt & Pepper)", "zh": "椒盐螃蟹", "price": "Seasonal Price"},
                {"code": "LS51", "en": "Crab (Salted Egg Yolk)", "zh": "金沙螃蟹", "price": "Seasonal Price"},
                {"code": "LS52", "en": "Crab (Pei Fong Dong)", "zh": "避风塘炒螃蟹", "price": "Seasonal Price"},
                {"code": "LS53", "en": "Crab (Stir-Fried Ginger Onion)", "zh": "姜葱炒螃蟹", "price": "Seasonal Price"},
                {"code": "LS54", "en": "Crab (Steamed)", "zh": "清蒸螃蟹", "price": "Seasonal Price"},
                {"code": "LS55", "en": "Clams (Baked Superior Stock)", "zh": "蛤蜊焗上汤", "price": "Seasonal Price"},
                {"code": "LS56", "en": "Clams (Baked with Cheese)", "zh": "芝士焗蛤蜊", "price": "Seasonal Price"},
                {"code": "LS57", "en": "Clams (Steamed w/ Garlic)", "zh": "蒜蓉蒸蛤蜊", "price": "Seasonal Price"},
                {"code": "LS58", "en": "Clams (Superior E-FU Noodles)", "zh": "蛤蜊上汤伊面", "price": "Seasonal Price"},
                {"code": "LS59", "en": "Clams (Salt & Pepper)", "zh": "椒盐蛤蜊", "price": "Seasonal Price"},
                {"code": "LS60", "en": "Clams (Salted Egg Yolk)", "zh": "金沙蛤蜊", "price": "Seasonal Price"},
                {"code": "LS61", "en": "Clams (Pei Fong Dong)", "zh": "避风塘炒蛤蜊", "price": "Seasonal Price"},
                {"code": "LS62", "en": "Clams (Stir-Fried Ginger Onion)", "zh": "姜葱炒蛤蜊", "price": "Seasonal Price"},
                {"code": "LS63", "en": "Clams (Steamed)", "zh": "清蒸蛤蜊", "price": "Seasonal Price"},
                {"code": "LS64", "en": "Nylon Shell (Baked Superior Stock)", "zh": "蛤蜊焗上汤", "price": "Seasonal Price"},
                {"code": "LS65", "en": "Nylon Shell (Baked with Cheese)", "zh": "芝士焗蛤蜊", "price": "Seasonal Price"},
                {"code": "LS66", "en": "Nylon Shell (Steamed w/ Garlic)", "zh": "蒜蓉蒸蛤蜊", "price": "Seasonal Price"},
                {"code": "LS67", "en": "Nylon Shell (Superior E-FU Noodles)", "zh": "蛤蜊上汤伊面", "price": "Seasonal Price"},
                {"code": "LS68", "en": "Nylon Shell (Salt & Pepper)", "zh": "椒盐蛤蜊", "price": "Seasonal Price"},
                {"code": "LS69", "en": "Nylon Shell (Salted Egg Yolk)", "zh": "金沙蛤蜊", "price": "Seasonal Price"},
                {"code": "LS70", "en": "Nylon Shell (Pei Fong Dong)", "zh": "避风塘炒蛤蜊", "price": "Seasonal Price"},
                {"code": "LS71", "en": "Nylon Shell (Stir-Fried Ginger Onion)", "zh": "姜葱炒蛤蜊", "price": "Seasonal Price"},
                {"code": "LS72", "en": "Nylon Shell (Steamed)", "zh": "清蒸蛤蜊", "price": "Seasonal Price"},
                {"code": "LS73", "en": "Shark (Baked Superior Stock)", "zh": "鲨鱼焗上汤", "price": "Seasonal Price"},
                {"code": "LS74", "en": "Shark (Baked with Cheese)", "zh": "芝士焗鲨鱼", "price": "Seasonal Price"},
                {"code": "LS75", "en": "Shark (Steamed w/ Garlic)", "zh": "蒜蓉蒸鲨鱼", "price": "Seasonal Price"},
                {"code": "LS76", "en": "Shark (Superior E-FU Noodles)", "zh": "鲨鱼上汤伊面", "price": "Seasonal Price"},
                {"code": "LS77", "en": "Shark (Salt & Pepper)", "zh": "椒盐鲨鱼", "price": "Seasonal Price"},
                {"code": "LS78", "en": "Shark (Salted Egg Yolk)", "zh": "金沙鲨鱼", "price": "Seasonal Price"},
                {"code": "LS79", "en": "Shark (Pei Fong Dong)", "zh": "避风塘炒鲨鱼", "price": "Seasonal Price"},
                {"code": "LS80", "en": "Shark (Stir-Fried Ginger Onion)", "zh": "姜葱炒鲨鱼", "price": "Seasonal Price"},
                {"code": "LS81", "en": "Shark (Steamed)", "zh": "清蒸鲨鱼", "price": "Seasonal Price"},         
            ],
            "Dimsum 点心 / 点心": [
                {"code": "DM01", "en": "Hakaw", "zh": "晶瑩鮮蝦餃", "price": 328},
                {"code": "DM02", "en": "Chicken Feet", "zh": "豉汁蒸鳳爪", "price": 288},
                {"code": "DM03", "en": "Siomai", "zh": "蟹籽燒賣皇", "price": 268},
                {"code": "DM04", "en": "Steamed Spare Ribs", "zh": "豉汁蒸排骨", "price": 258},
                {"code": "DM05", "en": "Chow Zhou Dumpling", "zh": "潮式蒸粉粿", "price": 258},
                {"code": "DM06", "en": "Beef Ball w/ Beancurd Stick", "zh": "鮮竹牛肉球", "price": 258},
                {"code": "DM07", "en": "Beancurd Sheet Roll", "zh": "蠔油鮮竹卷", "price": 258},
                {"code": "DM08", "en": "Glutinous Rice (Machang)", "zh": "荷葉珍珠雞", "price": 258},
                {"code": "DM09", "en": "Spinach Dumpling", "zh": "水晶菠菜餃", "price": 258},
                {"code": "DM10", "en": "Beef Tripe (Goto)", "zh": "黑椒蒸牛肚", "price": 258},
                {"code": "DM11", "en": "Traditional Malay Cake", "zh": "懷舊馬拉糕", "price": 208},

                {"code": "DM12", "en": "Egg Tart", "zh": "酥皮焗蛋撻", "price": 258},
                {"code": "DM13", "en": "Asado Pie", "zh": "鬆化叉燒酥", "price": 258},

                {"code": "DM14", "en": "Radish Cake", "zh": "香煎蘿蔔糕", "price": 258},
                {"code": "DM15", "en": "XO Radish Cake", "zh": "XO醬蘿蔔糕", "price": 258},
                {"code": "DM16", "en": "Rice Roll w/ XO Sauce", "zh": "XO醬煎腸粉", "price": 258},
                {"code": "DM17", "en": "Pan-Fried Meat Pao", "zh": "生煎鮮肉包", "price": 258},

                {"code": "DM18", "en": "Century Egg & Pork Congee", "zh": "皮蛋瘦肉粥", "price": 258},
                {"code": "DM19", "en": "Fish Congee", "zh": "鮮滑魚片粥", "price": 258},

                {"code": "DM20", "en": "Shrimp Rice Roll", "zh": "手拆鮮蝦腸粉", "price": 328},
                {"code": "DM21", "en": "Asado Rice Roll", "zh": "蜜汁叉燒腸粉", "price": 258},
                {"code": "DM22", "en": "Beef Rice Roll", "zh": "香茜牛肉腸粉", "price": 258},
                {"code": "DM23", "en": "Plain Rice Roll", "zh": "手工蒸滑腸粉", "price": 228},

                {"code": "DM24", "en": "Custard Pao", "zh": "金香流沙包", "price": 258},
                {"code": "DM25", "en": "Asado Pao", "zh": "蜜汁叉燒包", "price": 258},
                {"code": "DM26", "en": "Birthday Bun", "zh": "蓮蓉壽桃包", "price": 258},
                {"code": "DM27", "en": "Siao Long Pao", "zh": "上海小籠包", "price": 258},
                {"code": "DM28", "en": "Steamed Bun", "zh": "蒸饅頭", "price": 208},

                {"code": "DM29", "en": "Cheese Prawn Roll", "zh": "芝士蝦春卷", "price": 258},
                {"code": "DM30", "en": "Taro Puff", "zh": "酥脆香芋角", "price": 258},
                {"code": "DM31", "en": "Ham Sui Kok", "zh": "家鄉咸水角", "price": 258},
                {"code": "DM32", "en": "Buchi", "zh": "香炸芝麻球", "price": 208},
                {"code": "DM33", "en": "Fried Bun", "zh": "黃金炸饅頭", "price": 208},

                {"code": "DM34", "en": "Coffee Jelly", "zh": "生磨咖啡糕", "price": 188},
                {"code": "DM35", "en": "Snow Lady", "zh": "香芒雪媚娘", "price": 228},

                {"code": "DM36", "en": "Hot Almond Glutinous", "zh": "湯圓杏仁茶", "price": 188},
                {"code": "DM37", "en": "Hot Taro Sago", "zh": "香芋西米露", "price": 188},
                {"code": "DM38", "en": "Hot Purple Rice", "zh": "椰香紫米露", "price": 188},
            ],
            "Set Menu 套餐 / 套餐": [
                {"code": "SET1", "en": "Set Menu 1 (Good for 10)", "zh": "套餐一", "price": 25800, "desc": "Assorted Cold Cuts, Steamed Suahe, Abalone Soup, Sauteed Shrimp & Squid, Salad Seafood Roll, Abalone Cubes, Steamed Lapu Lapu, Roasted Chicken, Free Noodle or Rice, Free 2 Kinds of Dessert"},
                {"code": "SET2", "en": "Set Menu 2 (Good for 10)", "zh": "套餐二", "price": 32800, "desc": "Assorted Cold Cuts, Steamed Prawn, Double Boiled Fish Maw Soup, Scallop Salad Roll, Whole 10 Head Abalone, Fried Crispy Pigeon, Steamed Lapu Lapu, Stir Fried Sea Cucumber, Shark’s Fin Rice, Free 2 Kinds of Dessert"},
                {"code": "SET3", "en": "Set Menu 3 (Good for 10)", "zh": "套餐三", "price": 35800, "desc": "Suckling Pig, Steamed Prawns, Shark’s Fin Soup, Diced Scallop in Taro Ring, Whole 10 Head Abalone w/ Sea Cucumber, Steamed Lapu Lapu, Roasted Goose, Pei Fong Dong Crab, Free Noodles or Rice, Free 2 Kinds of Dessert"},
                {"code": "SET4", "en": "Set Menu 4 (Good for 10)", "zh": "套餐四", "price": 38800, "desc": "Suckling Pig with Mala Sea Cucumber, Shark’s Fin Soup, Imported Scallop w/ Broccoli, Shrimp Stuffed Fried Crab Claw, 8 Head Abalone w/ Fish maw, Steamed Tiger Lapu Lapu, Salt & Pepper Sea Mantis, Roasted Duck, Free Noodles or Rice, Free 2 Kinds of Dessert"},
                {"code": "SET5", "en": "Set Menu 5 (Good for 10)", "zh": "套餐五", "price": 55800, "desc": "Suckling Pig (Whole), Steamed Rock Lobster, Fried Taro Scallop Pie, Chicken Shark’s Fin Soup (Individual), Sea Cucumber w/ Dry Scallop, 8 Head Abalone w/ Fish maw, Steamed Red Lapu Lapu, Roasted Goose, Free Noodles or Rice, Birds Nest in Mango Pomelo Sweet Soup, Mixed Fruits"},
                {"code": "SET6", "en": "Set Menu 6 (Good for 10)", "zh": "套餐六", "price": 65800, "desc": "Suckling Pig w/ Foie Gras & Caviar, Braised Shark’s Fin Soup, Original Lobster w/ Superior Sauce, Dry Scallop w/ Winter melon Ring, Whole Sea Cucumber w/ Shredded Meat, Whole 6 Head Abalone w/ Fish Maw, Steamed Double Red Lapu Lapu, Roasted Goose, Whole Scallop w/ Black Truffle Noodles, Birds Nest Soup, Mixed Fruits"},
            ]
        }

        self.stdout.write("Processing Menu Categories...")
        for cat_full_name, items in menu_data.items():
            cat_parts = cat_full_name.split('/')
            cat_en = cat_parts[0].strip()
            cat_zh = cat_parts[-1].strip() if len(cat_parts) > 1 else cat_en

            category, _ = MenuCategory.objects.get_or_create(name=cat_en, defaults={'name_zh': cat_zh})
            self.stdout.write(f"  - Processing Category: {category.name}")

            for item_data in items:
                # Create the main menu item without price
                menu_item = MenuItem.objects.create(
                    category=category,
                    name=item_data['en'],
                    name_zh=item_data.get('zh', ''),
                    description=item_data.get('desc', ''),
                    sku=item_data.get('code', '')
                )

                # Now, create the related MenuItemPrice objects
                if 'prices' in item_data:
                    for size, price_val in item_data['prices'].items():
                        MenuItemPrice.objects.create(
                            menu_item=menu_item,
                            size=size,
                            price=Decimal(price_val)
                        )
                elif 'price' in item_data:
                    price_val = item_data['price']
                    if isinstance(price_val, str) and not price_val.isnumeric():
                        price_val = None
                    
                    MenuItemPrice.objects.create(
                        menu_item=menu_item,
                        size='Regular',
                        price=Decimal(price_val) if price_val is not None else None,
                        price_type='SEASONAL' if price_val is None else 'FIXED'
                    )

        self.stdout.write(self.style.SUCCESS('Successfully seeded the GoldenBay menu.'))