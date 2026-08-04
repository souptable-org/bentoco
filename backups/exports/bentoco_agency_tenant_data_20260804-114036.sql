--
-- PostgreSQL database dump
--

\restrict xj7O4g5AksJFTgySKDGack7sWFs0aQWzmr7keYbmvP5iEuyWEHvzub8QllDbdh9

-- Dumped from database version 15.18
-- Dumped by pg_dump version 15.18

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: agency; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.agency VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'PixelCraft Digital Agency', 'pixelcraft', 'AGENCY-849201', 'admin@bentoco.com', '2026-07-31 16:47:44.268698+05:30', '2026-07-31 16:47:44.268698+05:30', 'AGENCY-849201', NULL);


--
-- Data for Name: agency_store_access; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.agency_store_access VALUES ('bd5b0b35-230d-45a1-b4be-0020f689ee5f', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'PENDING_CREATION', 'wovetow337@ayable.com', 'PENDING', '33d71ef9d687bc8df503e9b5c12668e45c8cd82f5bb556e2dd5810a245a05b67', '2026-08-02 18:03:41.222+05:30', '2026-07-31 18:03:41.22437+05:30', NULL, NULL, '2026-07-31 18:03:41.22437+05:30', '2026-07-31 18:03:41.22437+05:30');
INSERT INTO public.agency_store_access VALUES ('08d15b94-9781-458c-8f6f-64b38a02cca4', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'PENDING_CREATION', 'wovetow337@ayable.com', 'PENDING', '823bc53e984c340f421d03669dd85b27ffb06f913a4585c4547dbec740d9b3d3', '2026-08-02 18:06:21.659+05:30', '2026-07-31 18:06:21.661191+05:30', NULL, NULL, '2026-07-31 18:06:21.661191+05:30', '2026-07-31 18:06:21.661191+05:30');
INSERT INTO public.agency_store_access VALUES ('15d21469-9677-4bb9-905e-b1652f0efa7e', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'PENDING_CREATION', 'sister95@ethereal.email', 'ACTIVE', NULL, '2026-08-05 14:00:53.425+05:30', '2026-08-03 14:00:53.426516+05:30', '2026-08-03 14:01:29.553729+05:30', NULL, '2026-08-03 14:00:53.426516+05:30', '2026-08-03 14:00:53.426516+05:30');
INSERT INTO public.agency_store_access VALUES ('622eb876-8651-4a6c-b295-73d4131bf8d2', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'PENDING_CREATION', 'studio@123.com', 'PENDING', '9ae7a72419f22024055cbd3aeac81df2d2617de4b3e77108bd5d4e8e0f491205', '2026-08-05 15:05:12.213+05:30', '2026-08-03 15:05:12.219492+05:30', NULL, NULL, '2026-08-03 15:05:12.219492+05:30', '2026-08-03 15:05:12.219492+05:30');
INSERT INTO public.agency_store_access VALUES ('167baef2-d29a-4474-9095-1416df83c04b', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'PENDING_CREATION', 'StupidStudio@123.com', 'PENDING', 'b262623385020655458d45dbd3e2d566dd33582676cb9170d504cad8e46e349a', '2026-08-05 15:07:41.387+05:30', '2026-08-03 15:07:41.391774+05:30', NULL, NULL, '2026-08-03 15:07:41.391774+05:30', '2026-08-03 15:07:41.391774+05:30');
INSERT INTO public.agency_store_access VALUES ('33a8ab9d-7159-492f-9fbb-f1fc850b1c37', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'PENDING_CREATION', 'StupidStudio@123.com', 'PENDING', 'bb3703074c53a6fffb2e2bfde01d4fd25d657b031ed438ab557a35d75aeeac3e', '2026-08-05 15:09:13.493+05:30', '2026-08-03 15:09:13.493914+05:30', NULL, NULL, '2026-08-03 15:09:13.493914+05:30', '2026-08-03 15:09:13.493914+05:30');
INSERT INTO public.agency_store_access VALUES ('ab7c0a04-584a-4724-b336-5aaab4cfa399', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'PENDING_CREATION', 'StudioMerchat@123.in', 'PENDING', '1e33e0a7afc5215f24c8cc84f7f714b75b9928fd1cc4b49347602509bd8131be', '2026-08-05 15:11:32.157+05:30', '2026-08-03 15:11:32.159023+05:30', NULL, NULL, '2026-08-03 15:11:32.159023+05:30', '2026-08-03 15:11:32.159023+05:30');
INSERT INTO public.agency_store_access VALUES ('1eb5d1ca-b6ce-4785-80d7-95315d79e09c', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'PENDING_CREATION', 'Astam@123.in', 'PENDING', '299b56ce62f857c663574183d98d2afbca19d9206af5ab57f84ac318f2c657b0', '2026-08-05 15:14:34.309+05:30', '2026-08-03 15:14:34.310709+05:30', NULL, NULL, '2026-08-03 15:14:34.310709+05:30', '2026-08-03 15:14:34.310709+05:30');
INSERT INTO public.agency_store_access VALUES ('f8f79d30-a812-4c86-84b2-8debf9e8df35', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'PENDING_CREATION', 'sads@123.in', 'PENDING', '4e78c778b81d699b839443b0f6f8f42d0a25a3192fbfa2caaeefdda37a500ae2', '2026-08-05 16:45:13.393+05:30', '2026-08-03 16:45:13.397457+05:30', NULL, NULL, '2026-08-03 16:45:13.397457+05:30', '2026-08-03 16:45:13.397457+05:30');


--
-- Data for Name: agency_team_member; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: agency_store_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.agency_store_log VALUES ('6d098b5a-f8e5-42eb-b106-fd73dabe25b3', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'PENDING_CREATION', NULL, 'wovetow337@ayable.com', 'INVITE_SENT', '{"merchantExists": false, "storeDisplayName": "appel"}', NULL, '2026-07-31 18:03:41.252052+05:30');
INSERT INTO public.agency_store_log VALUES ('a167b34a-9501-40a3-ab84-73753eceb3f9', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'PENDING_CREATION', NULL, 'wovetow337@ayable.com', 'INVITE_SENT', '{"merchantExists": false, "storeDisplayName": "appel"}', NULL, '2026-07-31 18:06:21.675259+05:30');
INSERT INTO public.agency_store_log VALUES ('11bdfe63-4d28-4fbf-bc36-9ed3b5bfd847', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'PENDING_CREATION', NULL, 'sister95@ethereal.email', 'INVITE_SENT', '{"merchantExists": false, "storeDisplayName": "idealStudio"}', NULL, '2026-08-03 14:00:53.450633+05:30');
INSERT INTO public.agency_store_log VALUES ('93efb800-9769-46f4-9354-2732c873bd65', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'PENDING_CREATION', NULL, 'studio@123.com', 'INVITE_SENT', '{"merchantExists": false, "storeDisplayName": "StupidStudio"}', NULL, '2026-08-03 15:05:12.24018+05:30');
INSERT INTO public.agency_store_log VALUES ('fdd7c407-5901-401b-bc39-6b6e6544e809', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'PENDING_CREATION', NULL, 'StupidStudio@123.com', 'INVITE_SENT', '{"merchantExists": false, "storeDisplayName": "StupidStudio"}', NULL, '2026-08-03 15:07:41.396012+05:30');
INSERT INTO public.agency_store_log VALUES ('ffb094a1-b11d-48e4-b6c9-2d7ef5557193', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'PENDING_CREATION', NULL, 'StupidStudio@123.com', 'INVITE_SENT', '{"merchantExists": false, "storeDisplayName": "StupidStudio"}', NULL, '2026-08-03 15:09:13.496365+05:30');
INSERT INTO public.agency_store_log VALUES ('489e438d-6f03-43e0-99a7-a6c042ade97e', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'PENDING_CREATION', NULL, 'StudioMerchat@123.in', 'INVITE_SENT', '{"merchantExists": false, "storeDisplayName": "StudioMerchat"}', NULL, '2026-08-03 15:11:32.167925+05:30');
INSERT INTO public.agency_store_log VALUES ('e1f8b769-fd51-447c-a9a5-7084d383454e', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'PENDING_CREATION', NULL, 'Astam@123.in', 'INVITE_SENT', '{"merchantExists": false, "storeDisplayName": "Astam"}', NULL, '2026-08-03 15:14:34.321388+05:30');
INSERT INTO public.agency_store_log VALUES ('ee4361a4-a197-43c5-8095-f7906e2e63b8', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'PENDING_CREATION', NULL, 'sads@123.in', 'INVITE_SENT', '{"merchantExists": false, "storeDisplayName": "StuidoStupid"}', NULL, '2026-08-03 16:45:13.410147+05:30');


--
-- Data for Name: tenant; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.tenant VALUES ('8582b730-6afb-4662-94bf-7291ac71cb53', 'Brand Alpha', 'alpha', NULL, '2026-07-30 21:10:28.258137+05:30', '2026-07-30 21:10:28.258137+05:30', NULL, 'INDEPENDENT_MERCHANT', NULL, NULL, NULL, 'free', false);
INSERT INTO public.tenant VALUES ('5f10fdde-6dd6-4782-975a-259fe122a5bc', 'Brand Beta', 'beta', NULL, '2026-07-30 21:10:28.275888+05:30', '2026-07-30 21:10:28.275888+05:30', NULL, 'INDEPENDENT_MERCHANT', NULL, NULL, NULL, 'free', false);
INSERT INTO public.tenant VALUES ('71e3fd6d-28c5-4bed-abf1-3954146cd551', 'Bentoco Default Store', 'admin', NULL, '2026-07-31 12:38:10.310421+05:30', '2026-07-31 12:38:10.310421+05:30', NULL, 'INDEPENDENT_MERCHANT', NULL, NULL, NULL, 'free', false);


--
-- Data for Name: user; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."user" VALUES ('usr_agency_test_01', 'agcy@bentoco.com', NULL, NULL, 'AGENCY', '2026-08-03 23:49:26.559944+05:30', '2026-08-03 23:49:26.559944+05:30', NULL);
INSERT INTO public."user" VALUES ('usr_admin_1785481690321', 'admin@bentoco.com', 'Bentoco', 'Admin', 'MERCHANT', '2026-07-31 12:38:10.327602+05:30', '2026-07-31 12:38:10.327602+05:30', '71e3fd6d-28c5-4bed-abf1-3954146cd551');


--
-- PostgreSQL database dump complete
--

\unrestrict xj7O4g5AksJFTgySKDGack7sWFs0aQWzmr7keYbmvP5iEuyWEHvzub8QllDbdh9

