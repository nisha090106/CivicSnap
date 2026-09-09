import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Info } from 'lucide-react';
import { getSystemLocation } from '../utils/locationHelper';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, 12);
    }
  }, [center, map]);
  return null;
}

const createStatusIcon = (status) => {
  const s = (status || '').toLowerCase();
  const color = s === 'resolved' ? '#10B981' : s === 'in progress' ? '#F59E0B' : '#EF4444';
  return L.divIcon({
    className: 'custom-map-pin',
    html: `<div style="background-color: ${color}; width: 26px; height: 26px; border: 2.5px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px;">📍</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13]
  });
};

export default function CommunityMap({ reports = [] }) {
  const [mapCenter, setMapCenter] = useState([18.5204, 73.8567]); // Pune default
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    getSystemLocation().then((loc) => {
      if (loc.lat && loc.lng) {
        setMapCenter([loc.lat, loc.lng]);
        setUserLocation(loc);
      }
    });
  }, []);

  return (
    <div className="relative w-full h-[360px] sm:h-[440px] rounded-md overflow-hidden border border-pista-400 shadow-xl bg-pista-100">
      
      {/* Search Input Bar Overlay — Top Left */}
      <div className="absolute top-3 left-3 z-[1000] max-w-xs w-full">
        <div className="relative flex items-center bg-white/95 backdrop-blur-md rounded-xl border border-pista-400 shadow-md">
          <input
            type="text"
            placeholder="Search location or report ID..."
            className="w-full pl-8 pr-3 py-2 text-xs font-semibold text-slate-800 bg-transparent rounded-xl focus:outline-none"
          />
          <span className="absolute left-2.5 text-slate-500 text-xs">🔍</span>
        </div>
      </div>

      {/* Floating My Location Button — Bottom Right */}
      <button
        type="button"
        onClick={() => {
          if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition((pos) => {
              setMapCenter([pos.coords.latitude, pos.coords.longitude]);
            });
          }
        }}
        className="absolute bottom-4 right-4 z-[1000] px-4 py-2 bg-white/95 hover:bg-white text-[#072818] font-black text-xs rounded-xl border border-pista-400 shadow-lg flex items-center gap-1.5 cursor-pointer backdrop-blur-md transition"
      >
        <MapPin className="w-3.5 h-3.5 text-emerald-700" />
        <span>My Location ({userLocation?.city || 'GPS'})</span>
      </button>

      <MapContainer
        center={mapCenter}
        zoom={12}
        scrollWheelZoom={false}
        className="w-full h-full z-0"
      >
        <MapRecenter center={mapCenter} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {reports.map((report, idx) => {
          const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
          const imageUrl = report.image_url
            ? (report.image_url.startsWith('http') || report.image_url.startsWith('data:')
                ? report.image_url
                : `${BACKEND_URL}${report.image_url.startsWith('/') ? '' : '/'}${report.image_url}`)
            : null;
          const lat = parseFloat(report.latitude) || mapCenter[0];
          const lng = parseFloat(report.longitude) || mapCenter[1];
          const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

          return (
            <Marker key={idx} position={[lat, lng]} icon={createStatusIcon(report.status)}>
              <Popup>
                <div className="p-1 font-sans text-xs space-y-2 max-w-[200px]">
                  {imageUrl && (
                    <div className="h-24 rounded-lg overflow-hidden bg-slate-900 border border-slate-200">
                      <img src={imageUrl} alt="Evidence" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div>
                    <strong className="text-bottle-900 font-black block">{report.category || 'Civic Issue'}</strong>
                    <p className="text-slate-800 text-[11px] font-bold line-clamp-2 mt-0.5">{report.description || 'Reported civic issue'}</p>
                    <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">📍 {report.city_name || userLocation?.city || 'Local Area'}</span>
                  </div>
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1 w-full py-1.5 bg-[#072818] text-white rounded-lg text-[10px] font-black no-underline"
                  >
                    <span>Google Maps ↗</span>
                  </a>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Empty Map State Indicator */}
      {reports.length === 0 && (
        <div className="absolute bottom-4 left-4 right-4 z-[1000] bg-[#072818]/95 backdrop-blur-md p-3.5 rounded-md border border-bottle-800 text-center text-xs text-white font-bold shadow-xl flex items-center justify-center gap-2">
          <Info className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>No active issue pins on map near {userLocation?.city || 'your area'}. Click "SNAP & REPORT ISSUE" to pin the first report!</span>
        </div>
      )}

    </div>
  );
}
