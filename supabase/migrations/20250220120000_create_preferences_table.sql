create table if not exists public.preferences (
  id uuid primary key references public.profiles (id) on delete cascade,
  weight_unit text not null default 'kg' check (weight_unit in ('kg', 'lb')),
  curve text not null default 'average_weight'
    check (curve in ('maximum_weight', 'average_weight', 'total_weight', 'maximum_rep', 'average_rep', 'total_rep')),
  newsletter boolean not null default false,
  newsletter_shop boolean not null default false,
  newsletter_store boolean not null default false,
  survey boolean not null default false
);
