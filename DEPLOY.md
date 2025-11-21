# Deployment Guide

## 1. Supabase Setup (Database)
1.  Go to [supabase.com](https://supabase.com) and create a free account.
2.  Create a new project.
3.  Go to the **SQL Editor** in the left sidebar.
4.  Click "New Query".
5.  Copy the contents of `schema.sql` from this project and paste it into the query editor.
6.  Click **Run** to create the tables and security policies.
7.  Go to **Project Settings** -> **API**.
8.  Copy the `Project URL` and `anon` public key.

## 2. Netlify Setup (Hosting)
Since you have already deployed to Netlify:
1.  Go to your site settings on [netlify.com](https://netlify.com).
2.  Navigate to **Site configuration** -> **Environment variables**.
3.  Click **Add a variable**.
4.  Add the following variables (using the values from Supabase):
    - Key: `VITE_SUPABASE_URL`
      Value: (Your Project URL)
    - Key: `VITE_SUPABASE_ANON_KEY`
      Value: (Your anon public key)
5.  **Redeploy**: You may need to trigger a new deploy for the changes to take effect (or push a small change to GitHub).

## 3. Local Development
To run the app locally with Supabase:
1.  Create a file named `.env.local` in the root directory (`pomodoro-quest/.env.local`).
2.  Add your keys there:
    ```
    VITE_SUPABASE_URL=your_project_url
    VITE_SUPABASE_ANON_KEY=your_anon_key
    ```
