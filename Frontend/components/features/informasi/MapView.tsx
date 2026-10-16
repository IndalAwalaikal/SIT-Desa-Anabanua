'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, ExternalLink } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

export interface PetaFasilitas {
  id: string;
  nama: string;
  kategori: string;
  lat: number;
  lng: number;
}

/** Warna brand per kategori - selaras dengan warna semantik seluruh situs. */
const KATEGORI_COLOR: Record<string, string> = {
  Pemerintahan: '#247623',
  Pendidikan: '#0d9488',
  Kesehatan: '#dc2626',
  Pariwisata: '#f59e0b',
  Sosial: '#b45309',
};

const kategoriColor = (k: string) => KATEGORI_COLOR[k] ?? '#247623';

/** Key i18n per kategori untuk label popup. */
const CATEGORY_KEY: Record<string, string> = {
  Pemerintahan: 'Peta.pemerintahan',
  Pendidikan: 'Peta.pendidikan',
  Kesehatan: 'Peta.kesehatan',
  Pariwisata: 'Peta.pariwisata',
};

/** divIcon pin kustom (menghindari ikon default Leaflet yang rusak). */
function buildPinIcon(color: string) {
  return L.divIcon({
    className: 'dm-marker',
    html: `<span class="dm-pin" style="--c:${color}"><i></i></span>`,
    iconSize: [30, 36],
    iconAnchor: [15, 34],
    popupAnchor: [0, -32],
  });
}

/** Komponen dalam MapContainer: tile (ikut tema), fit-bounds, & zoom kustom. */
function MapInner({ points }: { points: [number, number][] }) {
  const map = useMap();
  const { t } = useTranslation();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const apply = () => setDark(root.classList.contains('dark'));
    apply();
    const obs = new MutationObserver(apply);
    obs.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!points.length) return;
    const bounds = L.latLngBounds(points.map((p) => L.latLng(p[0], p[1])));
    map.fitBounds(bounds.pad(0.22), { animate: true, duration: 0.6 });
  }, [points, map]);

  return (
    <>
      <TileLayer
        key={dark ? 'dark' : 'satellite'}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.esri.com/">Esri</a> Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics'
        url={
          dark
            ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
            : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        }
      />

      <div className="leaflet-bottom leaflet-right z-[1000]">
        <div className="leaflet-control flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
          <button
            type="button"
            aria-label={t('Peta.zoomIn')}
            onClick={() => map.zoomIn()}
            className="grid h-9 w-9 place-items-center text-primary-700 transition-colors hover:bg-primary-50 dark:text-primary-300 dark:hover:bg-neutral-800"
          >
            +
          </button>
          <button
            type="button"
            aria-label={t('Peta.zoomOut')}
            onClick={() => map.zoomOut()}
            className="grid h-9 w-9 place-items-center border-t border-neutral-200 text-primary-700 transition-colors hover:bg-primary-50 dark:border-neutral-700 dark:text-primary-300 dark:hover:bg-neutral-800"
          >
            −
          </button>
        </div>
      </div>
    </>
  );
}

const initialCenter: [number, number] = [-2.958, 119.857];

export default function MapView({ fasilitas }: { fasilitas: PetaFasilitas[] }) {
  const { t } = useTranslation();
  const points = useMemo(
    () => fasilitas.map((f) => [f.lat, f.lng] as [number, number]),
    [fasilitas],
  );

  return (
    <MapContainer
      center={initialCenter}
      zoom={14}
      className="z-0 h-full w-full"
      scrollWheelZoom
      zoomControl={false}
      attributionControl
    >
      <MapInner points={points} />
      {fasilitas.map((f) => {
        const color = kategoriColor(f.kategori);
        return (
          <Marker
            key={f.id}
            position={[f.lat, f.lng]}
            icon={buildPinIcon(color)}
          >
            <Popup className="dm-popup" maxWidth={250}>
              <div className="dm-popup-body">
                <span className="dm-popup-dot" style={{ backgroundColor: color }} />
                <div className="dm-popup-text">
                  <p className="dm-popup-cat">{t(CATEGORY_KEY[f.kategori] ?? f.kategori, f.kategori)}</p>
                  <h4 className="dm-popup-title">{f.nama}</h4>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${f.lat},${f.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="dm-popup-link"
                  >
                    <Navigation className="w-3 h-3" />
                    {t('Peta.ruteGmaps')}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
