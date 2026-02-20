#!/usr/bin/env python3
import os

# --- CONFIGURATION ---
# 1. Add the relative paths to the files you want to read in this list.
#    The paths should be relative to where this script is located.
FILES_TO_READ = [
    'backend/goldenbay/asgi.py',
    'backend/goldenbay/settings.py',
    'backend/goldenbay/urls.py',
    'backend/goldenbay/wsgi.py',

    'backend/core/admin.py',
    'backend/core/apps.py',
    'backend/core/models.py',
    'backend/core/serializers.py',
    'backend/core/urls.py',
    'backend/core/views.py',

    'backend/events/admin.py',
    'backend/events/apps.py',
    'backend/events/models.py',
    'backend/events/serializers.py',
    'backend/events/urls.py',
    'backend/events/views.py',

    'backend/menu/admin.py',
    'backend/menu/apps.py',
    'backend/menu/models.py',
    'backend/menu/serializers.py',
    'backend/menu/urls.py',
    'backend/menu/views.py',

    'backend/reservations/admin.py',
    'backend/reservations/apps.py',
    'backend/reservations/models.py',
    'backend/reservations/serializers.py',
    'backend/reservations/urls.py',
    'backend/reservations/views.py',
    'backend/reservations/utils.py',

    'backend/marketing/admin.py',
    'backend/marketing/apps.py',
    'backend/marketing/models.py',
    'backend/marketing/serializers.py',
    'backend/marketing/urls.py',
    'backend/marketing/views.py',
    'backend/marketing/utils.py',

    'backend/users/admin.py',
    'backend/users/apps.py',
    'backend/users/models.py',
    'backend/users/serializers.py',
    'backend/users/urls.py',
    'backend/users/views.py',
    'backend/users/reporting.py',
    'backend/users/tasks.py',
    'backend/users/services.py',

    'frontend/src/App.jsx',
    # 'frontend/src/App.css',
    'frontend/src/index.css',
    # 'frontend/src/styles/base.css',
    # 'frontend/src/styles/components.css',
    # 'frontend/src/main.jsx',
    # 'frontend/eslint.config.js',
    'frontend/index.html',
    # 'frontend/package-lock.json',
    # 'frontend/package.json',
    # 'frontend/postcss.config.js',
    'frontend/tailwind.config.js',
    # 'frontend/vite.config.js',

    'frontend/src/components/layout/Navbar.jsx',
    'frontend/src/pages/admin/dashboard/AdminDashboardPage.jsx',
    'frontend/src/pages/public/home/HomePage.jsx',
    'frontend/src/pages/public/menu/MenuPage.jsx',
    'frontend/src/pages/public/reservations/ReservationPage.jsx',
    'frontend/src/pages/admin/bookings/BookingManager.jsx',
    'frontend/src/components/reservations/ReservationForm.jsx',
    'backend/reservations/management/commands/seed_reservations.py',
    'backend/menu/management/commands/seed_menu.py',
    'backend/menu/management/commands/seed_menu.py',
    'frontend/src/pages/admin/auth/LoginPage.jsx',
    'backend/.env',
    'frontend/src/components/auth/LogoutButton.jsx',
    'frontend/src/components/layout/ProtectedRoute.jsx',
    'frontend/src/pages/public/marketing/NewsPage.jsx',
    'frontend/src/pages/public/marketing/SinglePostPage.jsx',
    'frontend/src/pages/admin/marketing/MarketingManager.jsx',
    'frontend/src/pages/admin/marketing/PostEditor.jsx',
    'backend/reservations/templates/emails/confirmation.html',
    'frontend/src/components/layout/Footer.jsx',
    'frontend/src/pages/admin/customers/PhoneBookPage.jsx',
    'frontend/src/components/layout/AdminLayout.jsx',
    'frontend/src/pages/public/about/AboutPage.jsx',
    'frontend/src/pages/public/vip/VIPRoomsPage.jsx',
    'backend/templates/emails/admin_notification.html',
    'backend/reservations/management/commands/send_reminders.py',
    '.github/workflows/deploy.yml',
    'frontend/src/pages/public/events/EventInquiriesPage.jsx',
    'frontend/public/sitemap.xml',
    'frontend/public/robots.txt',
    'frontend/src/pages/public/contact/ContactPage.jsx',
    'frontend/src/components/layout/ScrollToTop.jsx',
    
]

# 2. Set the name for the final output text file.
OUTPUT_FILENAME = 'combined_contents.txt'

# --- SCRIPT LOGIC (No need to edit below this line) ---
all_file_contents = []

print("Starting file export process...")

for file_path in FILES_TO_READ:
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            print(f"✅ Reading: {file_path}")
            content = f.read()
            
            # Create a clear header for each file's content in the output file
            # header = f"--- START OF FILE: {file_path} ---\n\n"
            # footer = f"\n\n--- END OF FILE: {file_path} ---"
            
            # all_file_contents.append(header + content + footer)
            all_file_contents.append(content)

    except FileNotFoundError:
        print(f"⚠️  WARNING: Could not find file at '{file_path}'. Skipping.")
    except Exception as e:
        print(f"❌ ERROR reading '{file_path}': {e}")

if all_file_contents:
    try:
        with open(OUTPUT_FILENAME, 'w', encoding='utf-8') as outfile:
            # Join all the collected parts with two newlines for separation
            outfile.write("\n\n".join(all_file_contents))
        print(f"\n🚀 Success! All content has been combined into '{OUTPUT_FILENAME}'.")
    except Exception as e:
        print(f"\n❌ ERROR writing to output file: {e}")
else:
    print("\n🤷 No valid files were found or read. Output file was not created.")