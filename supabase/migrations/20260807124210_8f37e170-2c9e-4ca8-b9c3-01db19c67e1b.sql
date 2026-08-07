create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

select cron.unschedule(jobid) from cron.job where jobname = 'ivy-token-snapshot';

select cron.schedule(
  'ivy-token-snapshot',
  '*/15 * * * *',
  $$select net.http_get(
      url := 'https://project--ae92a54f-76f5-4c2b-9762-2e06f523c495.lovable.app/api/public/token-snapshot',
      timeout_milliseconds := 25000
  );$$
);