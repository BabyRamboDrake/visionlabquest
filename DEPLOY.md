# Deployment Guide

## 1. Supabase Setup (Database)
1.  Go to [supabase.com](https://supabase.com) and create a free account.
2.  Create a new project.
3.  Go to the **SQL Editor** in the left sidebar.
4.  Click "New Query".
5.  Copy the contents of `schema.sql` from this project and paste it into the query editor.
6.  Click **Run** to create the tables and security policies.
7.  Go to **Project Settings** -> **API**.
8.  Copy the `Project URL` and `anon` public key. You will need these for Vercel.

## 2. GitHub Setup
1.  Create a new repository on GitHub (e.g., `pomodoro-quest`).
2.  Push your code to this repository:
    ```bash
    git init
    git add .
    git commit -m "Initial commit"
    git branch -M main
    git remote add origin <YOUR_GITHUB_REPO_URL>
    git push -u origin main
    ```

## 3. Vercel Setup (Hosting)
1.  Go to [vercel.com](https://vercel.com) and sign up/login.
2.  Click **Add New...** -> **Project**.
3.  Import your `pomodoro-quest` repository.
4.  In the **Configure Project** screen, find the **Environment Variables** section.
5.  Add the following variables (using the values from Supabase):
    - `VITE_SUPABASE_URL`: Your Supabase Project URL
    - `VITE_SUPABASE_ANON_KEY`: Your Supabase `anon` key
6.  Click **Deploy**.

## 4. Done!
Your app will be live at a URL like `https://pomodoro-quest.vercel.app`.
