import os
from django.core.management.base import BaseCommand
from tracker.models import FoodItem

class Command(BaseCommand):
    help = 'Seeds the FoodItem database with comprehensive FSSAI brands and Junk Food (Part 2)'

    def handle(self, *args, **kwargs):
        foods = [
            # EXCLUDING BRANDS IN PART 1. ADDING NEW BRANDS.
            
            # TACO BELL
            {"name": "Taco Bell Crunchy Taco (Veg)", "cal": 150, "p": 5, "c": 16, "f": 8, "fiber": 3, "cat": "Fast Food", "emoji": "🌮", "src": "Taco Bell India"},
            {"name": "Taco Bell Crunchy Taco (Chicken)", "cal": 170, "p": 9, "c": 14, "f": 9, "fiber": 2, "cat": "Fast Food", "emoji": "🌮", "src": "Taco Bell India"},
            {"name": "Taco Bell Cheese Quesadilla", "cal": 460, "p": 19, "c": 37, "f": 26, "fiber": 3, "cat": "Fast Food", "emoji": "🧀", "src": "Taco Bell India"},
            {"name": "Taco Bell Burrito Roll (Chicken)", "cal": 400, "p": 16, "c": 46, "f": 16, "fiber": 4, "cat": "Fast Food", "emoji": "🌯", "src": "Taco Bell India"},
            {"name": "Taco Bell Naked Chicken Taco", "cal": 310, "p": 16, "c": 22, "f": 18, "fiber": 2, "cat": "Fast Food", "emoji": "🌮", "src": "Taco Bell India"},
            
            # WOW! MOMO
            {"name": "Wow! Momo Chicken Steamed Momo (5 pcs)", "cal": 220, "p": 14, "c": 28, "f": 6, "fiber": 1.5, "cat": "Fast Food", "emoji": "🥟", "src": "Wow! Momo"},
            {"name": "Wow! Momo Veg Pan Fried Momo (5 pcs)", "cal": 380, "p": 8, "c": 46, "f": 18, "fiber": 4, "cat": "Fast Food", "emoji": "🥟", "src": "Wow! Momo"},
            {"name": "Wow! Momo Chicken Darjeeling Momo (5 pcs)", "cal": 240, "p": 15, "c": 29, "f": 7, "fiber": 1.5, "cat": "Fast Food", "emoji": "🥟", "src": "Wow! Momo"},
            {"name": "Wow! Momo Moburg (Veg)", "cal": 360, "p": 10, "c": 48, "f": 15, "fiber": 3, "cat": "Fast Food", "emoji": "🍔", "src": "Wow! Momo"},
            
            # CAFE COFFEE DAY (CCD) / COSTA COFFEE
            {"name": "CCD Cafe Mocha (Regular)", "cal": 270, "p": 9, "c": 38, "f": 9, "fiber": 1, "cat": "Beverage", "emoji": "☕", "src": "Cafe Coffee Day"},
            {"name": "CCD Devil's Own Frappe (Cold)", "cal": 410, "p": 7, "c": 54, "f": 18, "fiber": 1.5, "cat": "Beverage", "emoji": "🧋", "src": "Cafe Coffee Day"},
            {"name": "Costa Coffee Cappuccino (Primo)", "cal": 156, "p": 8.5, "c": 13, "f": 7.5, "fiber": 0, "cat": "Beverage", "emoji": "☕", "src": "Costa Coffee"},
            {"name": "CCD Chocolate Brownie (1 Pc)", "cal": 340, "p": 5, "c": 46, "f": 16, "fiber": 2, "cat": "Dessert", "emoji": "🥮", "src": "Cafe Coffee Day"},
            
            # BRITANNIA
            {"name": "Britannia Good Day Butter Cookies (30g)", "cal": 150, "p": 2, "c": 20, "f": 7, "fiber": 0.5, "cat": "Junk Food", "emoji": "🍪", "src": "Britannia Industries"},
            {"name": "Britannia Marie Gold Biscuit (5 Biscuits, ~30g)", "cal": 130, "p": 2.5, "c": 23, "f": 3, "fiber": 1, "cat": "Junk Food", "emoji": "🍪", "src": "Britannia Industries"},
            {"name": "Britannia NutriChoice Digestive (3 Biscuits, ~30g)", "cal": 145, "p": 2.6, "c": 19, "f": 6.5, "fiber": 2, "cat": "Junk Food", "emoji": "🍪", "src": "Britannia Industries"},
            {"name": "Britannia Bourbon (3 Biscuits, ~30g)", "cal": 150, "p": 1.5, "c": 21, "f": 6.5, "fiber": 0.5, "cat": "Junk Food", "emoji": "🍫", "src": "Britannia Industries"},
            {"name": "Britannia 50-50 Sweet & Salty (30g)", "cal": 140, "p": 2, "c": 20, "f": 6, "fiber": 0.5, "cat": "Junk Food", "emoji": "🍪", "src": "Britannia Industries"},
            
            # SUNFEAST / ITC
            {"name": "Sunfeast Dark Fantasy Choco Fills (2 Biscuits, ~25g)", "cal": 128, "p": 1.5, "c": 17, "f": 6, "fiber": 0.5, "cat": "Junk Food", "emoji": "🍪", "src": "ITC"},
            {"name": "Sunfeast Mom's Magic Cashew & Almond (30g)", "cal": 150, "p": 2, "c": 20, "f": 7, "fiber": 0.5, "cat": "Junk Food", "emoji": "🍪", "src": "ITC"},
            {"name": "Bingo! Mad Angles (30g)", "cal": 160, "p": 2, "c": 18, "f": 9, "fiber": 1, "cat": "Junk Food", "emoji": "🔺", "src": "ITC"},
            {"name": "Bingo! Tedhe Medhe (30g)", "cal": 165, "p": 2.2, "c": 17, "f": 10, "fiber": 1.5, "cat": "Junk Food", "emoji": "🥨", "src": "ITC"},
            
            # MTR (RTE / MIXES)
            {"name": "MTR Minute Fresh Rava Idli Mix (100g prepared)", "cal": 280, "p": 8, "c": 52, "f": 5, "fiber": 3, "cat": "Meal", "emoji": "🍲", "src": "MTR Foods"},
            {"name": "MTR Paneer Butter Masala RTE (1 Katori, 150g)", "cal": 240, "p": 7, "c": 12, "f": 18, "fiber": 2, "cat": "Meal", "emoji": "🍲", "src": "MTR Foods"},
            {"name": "MTR Gulab Jamun (2 pcs with syrup)", "cal": 300, "p": 4, "c": 48, "f": 10, "fiber": 0, "cat": "Dessert", "emoji": "🍨", "src": "MTR Foods"},
            
            # AMUL & MOTHER DAIRY (DAIRY ITEMS)
            {"name": "Amul Butter (1 Tbsp, 14g)", "cal": 100, "p": 0.1, "c": 0, "f": 11.2, "fiber": 0, "cat": "Fat/Dairy", "emoji": "🧈", "src": "Amul"},
            {"name": "Amul Cheese Slice (1 Slice, 20g)", "cal": 63, "p": 4, "c": 0.3, "f": 5, "fiber": 0, "cat": "Fat/Dairy", "emoji": "🧀", "src": "Amul"},
            {"name": "Amul Kool Flavored Milk (200ml)", "cal": 180, "p": 6.5, "c": 22, "f": 7, "fiber": 0, "cat": "Beverage", "emoji": "🧃", "src": "Amul"},
            {"name": "Amul Lassi (Rose/Mango, 200ml)", "cal": 150, "p": 4, "c": 26, "f": 3.4, "fiber": 0, "cat": "Beverage", "emoji": "🧃", "src": "Amul"},
            {"name": "Mother Dairy Mishti Doi (90g cup)", "cal": 130, "p": 3.5, "c": 20, "f": 4, "fiber": 0, "cat": "Dessert", "emoji": "🍮", "src": "Mother Dairy"},
            {"name": "Mother Dairy Paneer (100g)", "cal": 289, "p": 18.5, "c": 1.5, "f": 23, "fiber": 0, "cat": "Dairy", "emoji": "🧀", "src": "Mother Dairy"},
            
            # PACKAGED JUICES
            {"name": "Paper Boat Aam Panna (250ml)", "cal": 115, "p": 0.5, "c": 28, "f": 0, "fiber": 0.5, "cat": "Beverage", "emoji": "🧃", "src": "Hector Beverages"},
            {"name": "Paper Boat Jaljeera (250ml)", "cal": 100, "p": 0.3, "c": 24, "f": 0, "fiber": 0, "cat": "Beverage", "emoji": "🧃", "src": "Hector Beverages"},
            {"name": "Real Mixed Fruit Juice (1 Glass, 200ml)", "cal": 115, "p": 0.2, "c": 28, "f": 0.1, "fiber": 0.2, "cat": "Beverage", "emoji": "🧃", "src": "Dabur"},
            {"name": "Tropicana 100% Orange Juice (200ml)", "cal": 86, "p": 1.4, "c": 20, "f": 0, "fiber": 0.4, "cat": "Beverage", "emoji": "🧃", "src": "PepsiCo"},
            
            # SWEETS, SNACKS & HALDIRAM'S EXTENDED
            {"name": "Haldiram's Rasgulla (2 pcs)", "cal": 220, "p": 4, "c": 48, "f": 1.5, "fiber": 0, "cat": "Dessert", "emoji": "🍨", "src": "Haldiram's"},
            {"name": "Haldiram's Soan Papdi (2 pcs, ~50g)", "cal": 260, "p": 3.5, "c": 33, "f": 13, "fiber": 1, "cat": "Dessert", "emoji": "🧇", "src": "Haldiram's"},
            {"name": "Haldiram's Navrattan Mixture (30g)", "cal": 170, "p": 3.5, "c": 14, "f": 11.5, "fiber": 1.5, "cat": "Junk Food", "emoji": "🥨", "src": "Haldiram's"},
            {"name": "Bikanervala Raj Kachori (1 pc, ~200g)", "cal": 450, "p": 9, "c": 55, "f": 21, "fiber": 4, "cat": "Street Food", "emoji": "🧆", "src": "Bikanervala"},
            {"name": "Bikanervala Kaju Katli (2 pcs, ~30g)", "cal": 145, "p": 3.5, "c": 17, "f": 7.5, "fiber": 0.5, "cat": "Dessert", "emoji": "🍯", "src": "Bikanervala"},
            
            # ICE CREAM CHAINS
            {"name": "Baskin Robbins Cotton Candy Ice Cream (1 Scoop)", "cal": 180, "p": 3, "c": 22, "f": 9, "fiber": 0, "cat": "Dessert", "emoji": "🍦", "src": "Baskin Robbins India"},
            {"name": "Baskin Robbins Mint Choco Chip Ice Cream (1 Scoop)", "cal": 200, "p": 3.5, "c": 24, "f": 10, "fiber": 0.5, "cat": "Dessert", "emoji": "🍦", "src": "Baskin Robbins India"},
            {"name": "Naturals Tender Coconut Ice Cream (1 Scoop)", "cal": 160, "p": 3, "c": 18, "f": 8, "fiber": 1, "cat": "Dessert", "emoji": "🥥", "src": "Naturals (NIC)"},
            {"name": "Naturals Sitaphal Ice Cream (1 Scoop)", "cal": 150, "p": 2.5, "c": 21, "f": 6, "fiber": 0.5, "cat": "Dessert", "emoji": "🍨", "src": "Naturals (NIC)"},
            {"name": "Kwality Wall's Feast (1 Stick)", "cal": 220, "p": 3.2, "c": 25, "f": 12, "fiber": 1.2, "cat": "Dessert", "emoji": "🍦", "src": "Kwality Wall's"},

            # KINLEY / BISLERI / AQUAFINA
            {"name": "Kinley / Bisleri / Aquafina Packaged Drinking Water (1L)", "cal": 0, "p": 0, "c": 0, "f": 0, "fiber": 0, "cat": "Beverage", "emoji": "💧", "src": "FSSAI Packaged Data"}
        ]
        
        count = 0
        for data in foods:
            obj, created = FoodItem.objects.update_or_create(
                name=data['name'],
                defaults={
                    'calories': data['cal'],
                    'protein': data['p'],
                    'carbs': data['c'],
                    'fat': data['f'],
                    'fiber': data['fiber'],
                    'source': data['src'],
                    'category': data['cat'],
                    'emoji': data['emoji'],
                }
            )
            count += 1
            
        self.stdout.write(self.style.SUCCESS(f'Successfully injected {count} additional brand items (Part 2) into local DB!'))
