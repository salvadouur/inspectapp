-- Permite al Inspector dueño borrar una inspección ya cerrada. Los hijos
-- (evidencias, interferencias, tokens_omision, notificaciones) ya tienen
-- "on delete cascade" en 0001_init.sql, así que se limpian solos.
drop policy if exists "permisos: el inspector dueño puede eliminar" on public.permisos;
create policy "permisos: el inspector dueño puede eliminar" on public.permisos
  for delete to authenticated using (inspector_id = auth.uid());
