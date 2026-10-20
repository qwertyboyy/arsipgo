-- Untuk database Neon kosong saja. Membuat struktur tanpa data layanan.
BEGIN;
--
-- PostgreSQL database dump
--


-- Dumped from database version 18.2
-- Dumped by pg_dump version 18.2

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: bookings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bookings (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    service_id bigint NOT NULL,
    user_type character varying(80) DEFAULT 'Mahasiswa'::character varying NOT NULL,
    description text NOT NULL,
    document_count integer,
    start_date date,
    package_name character varying(100) DEFAULT 'Belum dipilih'::character varying NOT NULL,
    workers integer,
    duration_days integer,
    status character varying(40) DEFAULT 'menunggu_konfirmasi'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    amount integer,
    payment_status character varying(30) DEFAULT 'unpaid'::character varying NOT NULL,
    midtrans_order_id character varying(100),
    paid_at timestamp with time zone,
    payment_method character varying(30),
    payment_proof_path character varying(255),
    payment_proof_uploaded_at timestamp with time zone,
    payment_reject_reason text,
    payment_proof_data bytea,
    payment_proof_mime character varying(50),
    CONSTRAINT bookings_document_count_check CHECK (((document_count IS NULL) OR (document_count > 0))),
    CONSTRAINT bookings_duration_days_check CHECK (((duration_days IS NULL) OR (duration_days > 0))),
    CONSTRAINT bookings_payment_status_check CHECK (((payment_status)::text = ANY (ARRAY['unpaid'::text, 'pending'::text, 'paid'::text, 'expired'::text, 'cancelled'::text, 'failed'::text, 'menunggu_verifikasi'::text, 'ditolak'::text]))),
    CONSTRAINT bookings_status_check CHECK (((status)::text = ANY ((ARRAY['menunggu_konfirmasi'::character varying, 'dikonfirmasi'::character varying, 'diproses'::character varying, 'selesai'::character varying, 'dibatalkan'::character varying])::text[]))),
    CONSTRAINT bookings_workers_check CHECK (((workers IS NULL) OR (workers > 0)))
);


--
-- Name: bookings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.bookings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: bookings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.bookings_id_seq OWNED BY public.bookings.id;


--
-- Name: services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.services (
    id bigint NOT NULL,
    name character varying(150) NOT NULL,
    description text NOT NULL,
    pricing_type character varying(30) NOT NULL,
    price_per_unit integer,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT services_pricing_type_check CHECK (((pricing_type)::text = ANY ((ARRAY['document'::character varying, 'day'::character varying, 'package'::character varying, 'custom'::character varying])::text[])))
);


--
-- Name: services_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.services_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: services_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.services_id_seq OWNED BY public.services.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    name character varying(120) NOT NULL,
    email character varying(255) NOT NULL,
    whatsapp character varying(30),
    password_hash text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    role character varying(20) DEFAULT 'user'::character varying NOT NULL,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['user'::character varying, 'admin'::character varying])::text[])))
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: bookings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings ALTER COLUMN id SET DEFAULT nextval('public.bookings_id_seq'::regclass);


--
-- Name: services id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services ALTER COLUMN id SET DEFAULT nextval('public.services_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: bookings bookings_midtrans_order_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_midtrans_order_id_key UNIQUE (midtrans_order_id);


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- Name: services services_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_name_key UNIQUE (name);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_bookings_user_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_user_created ON public.bookings USING btree (user_id, created_at DESC);


--
-- Name: bookings bookings_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id);


--
-- Name: bookings bookings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--



COMMIT;

