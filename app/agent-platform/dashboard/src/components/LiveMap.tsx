import { useEffect, useRef } from "react";
import L from "leaflet";

interface Marker { id: string; lat: number; lng: number; label: string; }

export default function LiveMap({ markers }: { markers: Record<string, Marker> }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!el.current || map.current) return;
    map.current = L.map(el.current).setView([20, 78], 4);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
      maxZoom: 19,
    }).addTo(map.current);
    layer.current = L.layerGroup().addTo(map.current);
    return () => { map.current?.remove(); map.current = null; };
  }, []);

  useEffect(() => {
    if (!layer.current || !map.current) return;
    layer.current.clearLayers();
    const pts: L.LatLngExpression[] = [];
    Object.values(markers).forEach((m) => {
      L.marker([m.lat, m.lng]).bindPopup(m.label).addTo(layer.current!);
      pts.push([m.lat, m.lng]);
    });
    if (pts.length) map.current.fitBounds(L.latLngBounds(pts).pad(0.3));
  }, [markers]);

  return <div className="map" ref={el} />;
}
