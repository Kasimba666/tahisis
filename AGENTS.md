Use Vue 3 with Options API, SCSS, Element Plus, and Yarn. Code must be consistent: camelCase for JS, kebab-case for CSS and components, component filenames with capital letters. Write async calls only with .then().catch. Project structure includes assets, components, composables, layout, pages, store, services, styles, and router. Components are ordered as template, script (name, props, data, computed, methods, watch), and scoped style, with imports always above export default. Styles are split into variables.scss for variables, themes.scss for light/dark themes using CSS variables switched via data-theme on html/body, and main.scss as the entry point and global rules. All CSS colors must be in hsl. Use Element Plus components by default, applying the current color scheme and rules, overriding native styles in main.scss. The interface must be very compact with minimal paddings.
Database schema:
CREATE TABLE public.District (
id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
name character varying NOT NULL,
CONSTRAINT District_pkey PRIMARY KEY (id)
);
CREATE TABLE public.Estate (
id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
id_report_record bigint NOT NULL,
id_subtype_estate bigint NOT NULL,
male bigint,
female bigint,
id_volost bigint,
id_landowner bigint,
id_military_unit bigint,
CONSTRAINT Estate_pkey PRIMARY KEY (id),
CONSTRAINT Estate_id_report_record_fkey FOREIGN KEY (id_report_record) REFERENCES public.Report_record(id),
CONSTRAINT Estate_id_subtype_estate_fkey FOREIGN KEY (id_subtype_estate) REFERENCES public.Subtype_estate(id),
CONSTRAINT Estate_id_volost_fkey FOREIGN KEY (id_volost) REFERENCES public.Volost(id),
CONSTRAINT Estate_id_landowner_fkey FOREIGN KEY (id_landowner) REFERENCES public.Landowner(id),
CONSTRAINT Estate_id_military_unit_fkey FOREIGN KEY (id_military_unit) REFERENCES public.Military_unit(id)
);
CREATE TABLE public.Landowner (
id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
description character varying,
person character varying,
CONSTRAINT Landowner_pkey PRIMARY KEY (id)
);
CREATE TABLE public.Military_unit (
id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
description character varying,
person character varying,
CONSTRAINT Military_unit_pkey PRIMARY KEY (id)
);
CREATE TABLE public.Report_record (
id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
code bigint NOT NULL,
population_all bigint,
id_revision_report bigint NOT NULL,
id_settlment bigint,
CONSTRAINT Report_record_pkey PRIMARY KEY (id),
CONSTRAINT Report_record_id_revision_report_fkey FOREIGN KEY (id_revision_report) REFERENCES public.Revision_report(id),
CONSTRAINT Report_record_id_settlment_fkey FOREIGN KEY (id_settlment) REFERENCES public.Settlement(id)
);
CREATE TABLE public.Revision_report (
id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
year bigint NOT NULL,
number bigint NOT NULL,
CONSTRAINT Revision_report_pkey PRIMARY KEY (id)
);
CREATE TABLE public.Settlement (
id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
name_modern character varying,
name_old character varying NOT NULL,
name_old_alt character varying,
lat numeric NOT NULL,
lon numeric NOT NULL,
id_district bigint NOT NULL,
CONSTRAINT Settlement_pkey PRIMARY KEY (id),
CONSTRAINT Settlement_id_district_fkey FOREIGN KEY (id_district) REFERENCES public.District(id)
);
CREATE TABLE public.Subtype_estate (
id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
name character varying NOT NULL DEFAULT ''::character varying,
id_type_estate bigint NOT NULL,
id_type_religion bigint NOT NULL,
id_type_affiliation bigint NOT NULL,
CONSTRAINT Subtype_estate_pkey PRIMARY KEY (id),
CONSTRAINT Subtype_estate_id_type_estate_fkey FOREIGN KEY (id_type_estate) REFERENCES public.Type_estate(id),
CONSTRAINT Subtype_estate_id_type_religion_fkey FOREIGN KEY (id_type_religion) REFERENCES public.Type_religion(id),
CONSTRAINT Subtype_estate_id_type_affiliation_fkey FOREIGN KEY (id_type_affiliation) REFERENCES public.Type_affiliation(id)
);
CREATE TABLE public.Type_affiliation (
id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
name character varying NOT NULL DEFAULT ''::character varying,
CONSTRAINT Type_affiliation_pkey PRIMARY KEY (id)
);
CREATE TABLE public.Type_estate (
id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
name character varying NOT NULL DEFAULT ''::character varying,
CONSTRAINT Type_estate_pkey PRIMARY KEY (id)
);
CREATE TABLE public.Type_religion (
id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
name character varying NOT NULL DEFAULT ''::character varying,
CONSTRAINT Type_religion_pkey PRIMARY KEY (id)
);
CREATE TABLE public.Volost (
id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
name character varying,
CONSTRAINT Volost_pkey PRIMARY KEY (id)
);
CREATE TABLE public.spatial_ref_sys (
srid integer NOT NULL CHECK (srid > 0 AND srid <= 998999),
auth_name character varying,
auth_srid integer,
srtext character varying,
proj4text character varying,
CONSTRAINT spatial_ref_sys_pkey PRIMARY KEY (srid)
);