import os
import re
from django.core.management.base import BaseCommand
from tracker.models import FoodItem

class Command(BaseCommand):
    help = 'Seeds the FoodItem database from foods.js'

    def handle(self, *args, **kwargs):
        file_path = os.path.join('src', 'data', 'foods.js')
        if not os.path.exists(file_path):
            self.stdout.write(self.style.ERROR(f'Could not find {file_path}'))
            return

        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        match = re.search(r'const FOOD_DB = \[\s*(.*?)\s*\];', content, re.DOTALL)
        if not match:
            self.stdout.write(self.style.ERROR('Could not parse FOOD_DB'))
            return

        items_str = match.group(1)
        item_matches = re.finditer(r'\{([^\}]+)\}', items_str)
        count = 0
        
        FoodItem.objects.all().delete()
        
        for item_match in item_matches:
            item_content = item_match.group(1)
            
            def extract_val(pattern, is_str=False):
                m = re.search(pattern, item_content)
                if m:
                    v = m.group(1)
                    if is_str: return v
                    return float(v)
                return 0.0 if not is_str else ""
                
            name = extract_val(r'name:"([^"]+)"', True)
            if not name:
                continue
            cal = extract_val(r'cal:([0-9\.]+)')
            p = extract_val(r'p:([0-9\.]+)')
            c = extract_val(r'c:([0-9\.]+)')
            f = extract_val(r'f:([0-9\.]+)')
            fiber = extract_val(r'fiber:([0-9\.]+)')
            source = extract_val(r'source:"([^"]+)"', True)
            cat = extract_val(r'cat:"([^"]+)"', True)
            emoji = extract_val(r'emoji:"([^"]+)"', True)

            FoodItem.objects.create(
                name=name, calories=cal, protein=p, carbs=c, fat=f, 
                fiber=fiber, source=source, category=cat, emoji=emoji
            )
            count += 1
                
        self.stdout.write(self.style.SUCCESS(f'Successfully seeded {count} food items.'))
