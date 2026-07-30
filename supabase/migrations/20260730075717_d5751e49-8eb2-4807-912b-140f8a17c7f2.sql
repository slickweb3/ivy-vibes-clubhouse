UPDATE public.project_config
SET telegram_url = 'https://t.me/frogqueenivy'
WHERE telegram_url = 'https://t.me/IvyVibing' OR telegram_url IS NULL;