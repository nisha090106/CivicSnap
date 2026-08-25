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
        {reports.map((report, idx) => (
          <Marker key={idx} position={[report.latitude || 19.076, report.longitude || 72.877]}>
            <Popup>
              <div className="p-1 font-sans text-xs">
                <strong className="text-bottle-900 font-black">{report.category || 'Civic Issue'}</strong>
                <p className="text-slate-800 mt-1 font-bold">{report.description || 'Reported by citizen'}</p>
              </div>
            </Popup>
          </Marker>
        ))}
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
