import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Info } from 'lucide-react';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const DEFAULT_CENTER = [19.0760, 72.8777];

export default function CommunityMap({ reports = [] }) {
  return (
    <div className="relative w-full h-[360px] sm:h-[440px] rounded-md overflow-hidden border border-pista-400 shadow-xl bg-pista-100">
      
      {/* Map Banner Overlay — DARK GREEN */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex items-center justify-between bg-bottle-900/95 backdrop-blur-md px-4 py-2.5 rounded-md border border-bottle-800 shadow-md text-white">
        <div className="flex items-center gap-2.5">
          <MapPin className="w-5 h-5 text-pista-300" />
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-wider">Community Issue Map</h4>
            <p className="text-[11px] text-pista-300 font-extrabold">OpenStreetMap Canvas &bull; {reports.length} report pins</p>
          </div>
        </div>
        <span className="text-[10px] px-2.5 py-1 bg-bottle-800 text-white border border-bottle-700 rounded-lg font-black font-mono">
          Live Map
        </span>
      </div>

      <MapContainer
        center={DEFAULT_CENTER}
        zoom={12}
        scrollWheelZoom={false}
        className="w-full h-full z-0"
      >
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
          const mapsUrl = `https://www.google.com/maps?q=${report.latitude || 19.076},${report.longitude || 72.877}`;

          return (
            <Marker key={idx} position={[report.latitude || 19.076, report.longitude || 72.877]}>
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
                  </div>
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1 w-full py-1.5 bg-bottle-900 text-white rounded-lg text-[10px] font-black no-underline"
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
        <div className="absolute bottom-4 left-4 right-4 z-[1000] bg-bottle-900/95 backdrop-blur-md p-3.5 rounded-md border border-bottle-800 text-center text-xs text-white font-bold shadow-xl flex items-center justify-center gap-2">
          <Info className="w-4 h-4 text-pista-300 shrink-0" />
          <span>No community pins on the map yet. Snap a report to add the first pin!</span>
        </div>
      )}

    </div>
  );
}
