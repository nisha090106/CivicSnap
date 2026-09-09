export async function getSystemLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ city: 'Pune', lat: 18.5204, lng: 73.8567, fullAddress: 'Pune, Maharashtra' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const data = await res.json();
          const addr = data.address || {};
          const city = addr.city || addr.town || addr.municipality || addr.village || addr.county || addr.state_district || 'Pune';
          resolve({ city, lat, lng, fullAddress: data.display_name || `${city}, India` });
        } catch (e) {
          resolve({ city: 'Pune', lat, lng, fullAddress: `${lat.toFixed(4)}, ${lng.toFixed(4)}` });
        }
      },
      () => {
        // Fallback default coordinates if denied or timed out (e.g. Pune)
        resolve({ city: 'Pune', lat: 18.5204, lng: 73.8567, fullAddress: 'Pune, Maharashtra' });
      },
      { timeout: 4000 }
    );
  });
}
