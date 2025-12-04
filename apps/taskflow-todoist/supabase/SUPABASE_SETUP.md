# Supabase Setup for TaskFlow

Follow these steps to set up your Supabase backend in **10 minutes**.

---

## Step 1: Create Supabase Project (2 min)

1. **Go to Supabase**: https://supabase.com
2. **Sign up/Login** with GitHub or email
3. Click **"New Project"**
4. Fill in the form:
   - **Name**: `taskflow-production` (or any name)
   - **Database Password**: Generate a strong password (save it somewhere safe!)
   - **Region**: Choose closest to your target users (e.g., `us-east-1` for US)
   - **Pricing Plan**: Free (perfect for getting started)
5. Click **"Create new project"**
6. ⏱️ **Wait ~2 minutes** for project to initialize

---

## Step 2: Run Database Schema (3 min)

1. **Navigate to SQL Editor**:
   - In your Supabase dashboard, click **"SQL Editor"** in left sidebar
   
2. **Create new query**:
   - Click **"New Query"** button
   
3. **Copy & paste schema**:
   - Open `schema-complete.sql` in this folder
   - Copy ALL the contents
   - Paste into the SQL editor
   
4. **Run the query**:
   - Click **"Run"** button (or press Cmd/Ctrl + Enter)
   - ✅ You should see: "Success. No rows returned"

5. **Verify tables were created**:
   - Click **"Table Editor"** in left sidebar
   - You should see 6 tables:
     - ✅ `users`
     - ✅ `projects`
     - ✅ `tasks`
     - ✅ `subtasks`
     - ✅ `task_labels`
     - ✅ `task_label_assignments`

---

## Step 3: (Optional) Add Sample Data (1 min)

If you want to test with some sample data:

1. **Go back to SQL Editor**
2. **Click "New Query"**
3. **Copy & paste** the contents of `seed.sql`
4. **Run** the query
5. **Check Table Editor** → You'll see sample projects and tasks

---

## Step 4: Get Your API Credentials (1 min)

1. **Go to Project Settings**:
   - Click the ⚙️ (gear icon) at bottom of left sidebar
   - Or go to: **Settings** → **API**

2. **Copy these two values**:

   **Project URL** (looks like):
   ```
   https://abcdefghijklmnop.supabase.co
   ```

   **anon/public key** (looks like):
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJl...
   ```

   ⚠️ **Important**: Use the `anon` `public` key, NOT the `service_role` `secret` key!

---

## Step 5: Create .env File (2 min)

1. **In your terminal**, navigate to the taskflow-todoist directory:
   ```bash
   cd apps/taskflow-todoist
   ```

2. **Create .env file** (copy from example):
   ```bash
   cp .env.example .env
   ```

3. **Edit .env file**:
   ```bash
   # Use your preferred editor (nano, vim, vscode, etc.)
   nano .env
   ```

4. **Paste your credentials**:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   EXPO_PUBLIC_ENV=development
   ```

5. **Save the file** (Ctrl+O, Enter, Ctrl+X for nano)

---

## Step 6: Test the Connection (2 min)

1. **Start the app**:
   ```bash
   pnpm expo start
   ```

2. **Open on your device/emulator**:
   - Press `a` for Android or `i` for iOS
   - Or scan QR code with Expo Go app

3. **Test sign up**:
   - On the login screen, click "Don't have an account? Sign Up"
   - Enter email: `test@example.com`
   - Enter password: `password123`
   - Click "Sign Up"

4. **Check your email** (if using real email):
   - You should get a confirmation email from Supabase
   - Click the link to verify (or you can skip this by disabling email confirmation)

5. **Or skip email verification** (for testing):
   - Go to Supabase Dashboard → **Authentication** → **Settings**
   - Scroll to "Email Auth"
   - Toggle OFF "Enable email confirmations"
   - Now you can sign up without email verification

6. **Try creating a task**:
   - Click the purple **+** button
   - Enter task name: "Test task"
   - Click "Save"
   - ✅ Task should appear in your inbox!

---

## Step 7: Verify in Supabase Dashboard

1. **Go to Table Editor** in Supabase
2. **Click on `users` table**:
   - You should see your test user
3. **Click on `tasks` table**:
   - You should see the test task you created
4. **Try editing** a task in the app:
   - Mark it complete
   - Refresh the `tasks` table in Supabase
   - The `status` should be "completed"

✅ **If you see your data, you're all set!**

---

## Troubleshooting

### "Failed to connect to Supabase"

**Check**:
- [ ] `.env` file exists in `apps/taskflow-todoist/`
- [ ] Environment variables are correctly named (`EXPO_PUBLIC_` prefix)
- [ ] No extra spaces in the `.env` file
- [ ] Restart the Expo dev server after creating `.env`

**Fix**: 
```bash
# Stop the server (Ctrl+C)
# Restart it
pnpm expo start --clear
```

### "User already registered" error

**Fix**: Use a different email or reset the password in Supabase dashboard:
- Go to **Authentication** → **Users**
- Find your user
- Click "..." → "Send password recovery email"

### "Row Level Security policy violation"

**Check**:
- [ ] You ran `schema-complete.sql` (not just `schema.sql`)
- [ ] RLS policies were created (check SQL Editor for errors)
- [ ] User is authenticated (check auth token)

**Fix**: Re-run the schema:
```sql
-- In SQL Editor, run each section separately
-- 1. Tables
-- 2. Functions & Triggers  
-- 3. RLS Policies
-- 4. Grants
```

### Can't see tables in Table Editor

**Fix**: 
- Make sure schema ran successfully (check for errors in SQL Editor)
- Refresh the page
- Check you're looking at the `public` schema (not `auth` schema)

---

## Next Steps

✅ **Supabase is ready!**

Now you can:
1. **Create app assets** (icons, splash screen) - see `assets/ASSETS_README.md`
2. **Test all features** thoroughly
3. **Build for Android** - see `SETUP_GUIDE.md`
4. **Submit to Play Store** - see `SETUP_GUIDE.md`

---

## Security Notes

🔒 **Keep your credentials safe**:
- ✅ `.env` is in `.gitignore` (never commit it!)
- ✅ Use `anon` key in the app (NOT `service_role` key)
- ✅ Row Level Security (RLS) protects user data
- ✅ Each user can only see/edit their own tasks

📊 **Monitor your usage**:
- Free tier includes:
  - 500MB database space
  - 1GB file storage
  - 2GB bandwidth
  - 50,000 monthly active users
- Check usage: **Settings** → **Usage**

---

**Need help?** 
- Supabase Docs: https://supabase.com/docs
- Discord: https://discord.supabase.com

🎉 **Happy building!**

