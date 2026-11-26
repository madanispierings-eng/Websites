-- Waar het verwijslijntje van een genummerd punt eindigt (fractie van breedte/hoogte). De app tekent daar een
-- dikke lijn naartoe, zodat duidelijk is welke structuur bedoeld is; de gedrukte stippellijnen zijn te dun.
alter table public.anatomy_markers
  add column tip_x numeric(5, 4) check (tip_x between 0 and 1),
  add column tip_y numeric(5, 4) check (tip_y between 0 and 1),
  add constraint anatomy_markers_tip_pair check ((tip_x is null) = (tip_y is null));
