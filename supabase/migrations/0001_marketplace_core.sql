-- Finjaro marketplace — core schema (Buyer + Vendor).
-- Non-destructive: extends the existing `profiles` table and adds new tables.
-- Names are namespaced to avoid the pre-existing French scaffold (boutiques/produits/...).

-- ---------------------------------------------------------------------------
-- profiles: extend the existing auth-linked table with marketplace fields.
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists locale text default 'fr';
alter table public.profiles add column if not exists currency text default 'FCFA';
alter table public.profiles add column if not exists country text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists is_vendor boolean default false;
alter table public.profiles add column if not exists is_suspended boolean default false;
alter table public.profiles add column if not exists report_count integer default 0;

-- Auto-provision a profile row when a new auth user is created.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- shops
-- ---------------------------------------------------------------------------
create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  slug text unique not null,
  name text not null,
  bio text,
  banner_url text,
  avatar_url text,
  whatsapp text,
  country text,
  city text,
  categories text[] default '{}',
  rating numeric default 0,
  reviews_count integer default 0,
  followers_count integer default 0,
  offers_delivery boolean default false,
  delivery_fee_fcfa integer default 0,
  id_verified boolean default false,
  phone_confirmed boolean default false,
  is_verified boolean default false,
  status text not null default 'active' check (status in ('active','suspended')),
  report_count integer default 0,
  created_at timestamptz default now()
);
create index if not exists shops_owner_idx on public.shops(owner_id);

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null,
  description text,
  price_fcfa integer not null default 0,
  category text,
  images text[] default '{}',
  sizes text[] default '{}',
  colors text[] default '{}',
  stock integer default 0,
  views integer default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);
create index if not exists products_shop_idx on public.products(shop_id);
create index if not exists products_category_idx on public.products(category);

-- ---------------------------------------------------------------------------
-- orders + order_items
-- ---------------------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_no text unique default upper(substr(md5(random()::text), 1, 8)),
  buyer_id uuid not null references auth.users(id) on delete cascade,
  shop_id uuid not null references public.shops(id) on delete cascade,
  status text not null default 'new' check (status in ('new','confirmed','shipped','delivered','cancelled')),
  delivery_method text not null default 'pickup' check (delivery_method in ('pickup','delivery')),
  subtotal_fcfa integer default 0,
  delivery_fee_fcfa integer default 0,
  total_fcfa integer default 0,
  buyer_name text,
  buyer_phone text,
  address text,
  city text,
  country text,
  buyer_received boolean default false,
  created_at timestamptz default now()
);
create index if not exists orders_buyer_idx on public.orders(buyer_id);
create index if not exists orders_shop_idx on public.orders(shop_id);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  name text not null,
  price_fcfa integer not null default 0,
  qty integer not null default 1
);
create index if not exists order_items_order_idx on public.order_items(order_id);

-- ---------------------------------------------------------------------------
-- conversations + chat_messages (buyer <-> vendor)
-- ---------------------------------------------------------------------------
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references auth.users(id) on delete cascade,
  shop_id uuid not null references public.shops(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  last_message text,
  last_message_at timestamptz default now(),
  buyer_unread integer default 0,
  vendor_unread integer default 0,
  created_at timestamptz default now(),
  unique (buyer_id, shop_id)
);
create index if not exists conversations_buyer_idx on public.conversations(buyer_id);
create index if not exists conversations_shop_idx on public.conversations(shop_id);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  sender_role text not null check (sender_role in ('buyer','vendor')),
  body text,
  image_url text,
  status text default 'delivered' check (status in ('sent','delivered')),
  created_at timestamptz default now()
);
create index if not exists chat_messages_conv_idx on public.chat_messages(conversation_id);

-- ---------------------------------------------------------------------------
-- reels + likes
-- ---------------------------------------------------------------------------
create table if not exists public.reels (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  video_url text not null,
  caption text,
  product_id uuid references public.products(id) on delete set null,
  views integer default 0,
  likes integer default 0,
  comments integer default 0,
  shares integer default 0,
  created_at timestamptz default now()
);
create index if not exists reels_shop_idx on public.reels(shop_id);

create table if not exists public.reel_likes (
  id uuid primary key default gen_random_uuid(),
  reel_id uuid not null references public.reels(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique (reel_id, user_id)
);

-- ---------------------------------------------------------------------------
-- reviews (unlocked after delivery receipt)
-- ---------------------------------------------------------------------------
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  shop_id uuid not null references public.shops(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  buyer_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  body text,
  created_at timestamptz default now()
);
create index if not exists reviews_shop_idx on public.reviews(shop_id);
create index if not exists reviews_product_idx on public.reviews(product_id);

-- ---------------------------------------------------------------------------
-- reports (moderation)
-- ---------------------------------------------------------------------------
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('shop','user')),
  target_id uuid not null,
  reason text,
  created_at timestamptz default now(),
  unique (reporter_id, target_type, target_id)
);

-- ---------------------------------------------------------------------------
-- vendor_applications (structured for a future Admin app)
-- ---------------------------------------------------------------------------
create table if not exists public.vendor_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  shop_name text not null,
  country text,
  city text,
  categories text[] default '{}',
  first_name text,
  last_name text,
  id_front_url text,
  id_back_url text,
  phone text,
  banner_url text,
  avatar_url text,
  description text,
  whatsapp text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  rejection_reason text,
  created_at timestamptz default now()
);
create index if not exists vendor_apps_user_idx on public.vendor_applications(user_id);

-- ---------------------------------------------------------------------------
-- shop_follows
-- ---------------------------------------------------------------------------
create table if not exists public.shop_follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references auth.users(id) on delete cascade,
  shop_id uuid not null references public.shops(id) on delete cascade,
  created_at timestamptz default now(),
  unique (follower_id, shop_id)
);

-- ---------------------------------------------------------------------------
-- near_you_listings (Je cherche / Je propose)
-- ---------------------------------------------------------------------------
create table if not exists public.near_you_listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('cherche','propose')),
  category text,
  description text not null,
  photo_url text,
  country text,
  city text,
  created_at timestamptz default now()
);
create index if not exists near_you_country_idx on public.near_you_listings(country);

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text,
  body text,
  data jsonb default '{}',
  read boolean default false,
  created_at timestamptz default now()
);
create index if not exists notifications_user_idx on public.notifications(user_id);
