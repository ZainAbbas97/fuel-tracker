create extension if not exists pgcrypto;

create table if not exists cars (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null default 'Car',
  average_km_per_litre numeric(8,2) not null check (average_km_per_litre > 0),
  tint text not null default 'sage',
  icon text not null default '🚙',
  created_at timestamptz default now()
);

create table if not exists settings (
  id integer primary key default 1 check (id = 1),
  petrol_rate numeric(10,2) not null default 280,
  currency text not null default 'Rs'
);

create table if not exists daily_entries (
  id uuid primary key default gen_random_uuid(),
  car_id uuid not null references cars(id) on delete cascade,
  driven_km numeric(10,2) not null check (driven_km >= 0),
  driven_on date not null,
  created_at timestamptz default now()
);

insert into settings (id, petrol_rate, currency) values (1, 280, 'Rs') on conflict (id) do nothing;
insert into cars (name, type, average_km_per_litre, tint, icon)
select 'Blue Hatch', '2020 Hatchback', 18, 'sage', '🚙' where not exists (select 1 from cars);
insert into cars (name, type, average_km_per_litre, tint, icon)
select 'Red SUV', '2022 SUV', 12, 'peach', '🚗' where (select count(*) from cars) = 1;
