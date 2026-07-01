from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from api.models import User, Category, Stock


class Command(BaseCommand):
    help = 'Seed database with sample data for testing'
    
    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding database...')
        
        # Create users for each role
        users = [
            {'username': 'admin', 'role': 'ADMIN', 'password': 'admin123'},
            {'username': 'manager', 'role': 'MANAGER', 'password': 'manager123'},
            {'username': 'procurement', 'role': 'PROCUREMENT', 'password': 'proc123'},
            {'username': 'cfo', 'role': 'CFO', 'password': 'cfo123'},
            {'username': 'storekeeper', 'role': 'STOREKEEPER', 'password': 'store123'},
            {'username': 'dean_science', 'role': 'DEPARTMENT', 'department': 'Science', 'password': 'science123'},
            {'username': 'dean_eng', 'role': 'DEPARTMENT', 'department': 'Engineering', 'password': 'eng123'},
        ]
        
        # Hardhat Account #0 address
        WALLET_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
        
        for user_data in users:
            user, created = User.objects.get_or_create(
                username=user_data['username'],
                defaults={
                    'role': user_data['role'],
                    'department': user_data.get('department', ''),
                    'wallet_address': WALLET_ADDRESS,
                    'password': make_password(user_data['password']),
                    'is_staff': user_data['role'] == 'ADMIN',
                    'is_superuser': user_data['role'] == 'ADMIN',
                }
            )
            if created:
                self.stdout.write(f'  Created user: {user.username} ({user.role})')
        
        # Create categories
        categories = [
            {'name': 'Office Supplies', 'description': 'Paper, pens, folders, etc.'},
            {'name': 'IT Equipment', 'description': 'Computers, printers, cables'},
            {'name': 'Furniture', 'description': 'Desks, chairs, tables'},
            {'name': 'Laboratory', 'description': 'Lab equipment and supplies'},
            {'name': 'Cleaning', 'description': 'Cleaning supplies and materials'},
        ]
        
        for cat_data in categories:
            category, created = Category.objects.get_or_create(
                name=cat_data['name'],
                defaults={'description': cat_data['description']}
            )
            if created:
                self.stdout.write(f'  Created category: {category.name}')
        
        # Create sample stock items
        cat_office = Category.objects.get(name='Office Supplies')
        cat_it = Category.objects.get(name='IT Equipment')
        cat_furniture = Category.objects.get(name='Furniture')
        
        stocks = [
            {'name': 'A4 Paper (Ream)', 'category': cat_office, 'quantity': 500, 'threshold': 100, 'location': 'Shelf A1'},
            {'name': 'Ballpoint Pens (Box)', 'category': cat_office, 'quantity': 50, 'threshold': 10, 'location': 'Shelf A2'},
            {'name': 'Laptop - Dell', 'category': cat_it, 'quantity': 15, 'threshold': 5, 'location': 'IT Cage'},
            {'name': 'Office Chair', 'category': cat_furniture, 'quantity': 30, 'threshold': 10, 'location': 'Warehouse B'},
            {'name': 'Whiteboard Markers (Pack)', 'category': cat_office, 'quantity': 80, 'threshold': 20, 'location': 'Shelf A3'},
        ]
        
        admin_user = User.objects.get(username='admin')
        for stock_data in stocks:
            stock, created = Stock.objects.get_or_create(
                name=stock_data['name'],
                defaults={
                    'category': stock_data['category'],
                    'original_quantity': stock_data['quantity'],
                    'current_quantity': stock_data['quantity'],
                    'min_threshold': stock_data['threshold'],
                    'location': stock_data['location'],
                    'cost_per_item': 0.00,
                    'created_by': admin_user,
                }
            )
            if created:
                self.stdout.write(f'  Created stock: {stock.name} ({stock.current_quantity} units)')
        
        self.stdout.write(self.style.SUCCESS('Database seeding complete!'))