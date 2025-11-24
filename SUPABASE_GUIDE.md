# Supabase CLI Setup Guide

To automate your database updates, we are using the Supabase CLI. This allows you to define your database schema in code (migrations) and push changes to Supabase with a single command.

## 1. Prerequisites

You need to have the Supabase CLI installed. Since we initialized it in the project, you can run it using `npx supabase`.

## 2. Login to Supabase

Run the following command in your terminal and follow the instructions to log in:

```bash
npx supabase login
```

## 3. Link Your Project

You need to link your local project to your remote Supabase project.
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Open your project.
3. Copy the **Project ID** from the URL (it's the string after `project/`, e.g., `abcdefghijklm`).
4. Run:

```bash
npx supabase link --project-ref <your-project-id>
```

You will be asked for your database password.

## 4. Push Migrations

I have already created the initial migration file for you in `supabase/migrations/20240101000000_initial_schema.sql`.

To apply this schema to your remote database (and any future changes), run:

```bash
npx supabase db push
```

## 5. Making Future Changes

When you want to change the database schema (e.g., add a new table or column):

1. **Create a new migration:**
   ```bash
   npx supabase migration new name_of_change
   ```
   This creates a new SQL file in `supabase/migrations/`.

2. **Edit the file:** Add your SQL commands to that file.

3. **Push the changes:**
   ```bash
   npx supabase db push
   ```

This will automatically apply only the new changes to your database. No more copy-pasting!
