
import React, { useEffect, useRef } from 'react';
import { Activity } from '../types';
import { FLORENCE_WALK_TRACK, GPX_WAYPOINTS } from '../constants';
import L from 'leaflet';

const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

interface MapProps {
  activities: Activity[];
  userLocation: { lat: number, lng: number } | null;
  focusedLocation: { lat: number, lng: number } | null;
}

const MapComponent: React.FC<MapProps> = ({ activities, userLocation, focusedLocation }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersRef = useRef<L.Layer[]>([]);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;
    // Centro inicial en Florencia
    const map = L.map(mapContainerRef.current, { zoomControl: false }).setView([43.7731, 11.2553], 14);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);
    mapInstanceRef.current = map;
    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    layersRef.current.forEach(layer => layer.remove());
    layersRef.current = [];

    const defaultIcon = L.icon({
      iconUrl, iconRetinaUrl, shadowUrl,
      iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
    });

    activities.forEach(act => {
      const marker = L.marker([act.coords.lat, act.coords.lng], { icon: defaultIcon }).addTo(map);
      marker.bindPopup(`
        <div style="padding: 10px; font-family: 'Roboto Condensed', sans-serif;">
          <h3 style="margin: 0; font-weight: bold; color: #881337;">${act.title}</h3>
          <p style="margin: 4px 0 0 0; font-size: 11px; color: #57534e;">${act.locationName}</p>
        </div>
      `);
      layersRef.current.push(marker);
    });

    GPX_WAYPOINTS.forEach(wpt => {
      const circleMarker = L.circleMarker([wpt.lat, wpt.lng], {
        radius: 6,
        fillColor: "#be123c",
        color: "#fff",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8
      }).addTo(map);
      circleMarker.bindPopup(`<div style="font-size: 12px; font-weight: bold; color: #be123c;">${wpt.name}</div>`);
      layersRef.current.push(circleMarker);
    });

    if (FLORENCE_WALK_TRACK.length > 0) {
      const trackLine = L.polyline(FLORENCE_WALK_TRACK, {
        color: '#be123c', // Rojo Florencia
        weight: 4,
        opacity: 0.8,
        dashArray: '8, 12'
      }).addTo(map);
      layersRef.current.push(trackLine);
    }

    if (userLocation) {
      const userIcon = L.divIcon({
        className: 'user-marker',
        html: '<div style="background-color: #0ea5e9; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(14,165,233,0.5);"></div>',
        iconSize: [18, 18]
      });
      const marker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon }).addTo(map);
      layersRef.current.push(marker);
    }
  }, [activities, userLocation]);

  useEffect(() => {
    if (mapInstanceRef.current && focusedLocation) {
      mapInstanceRef.current.flyTo([focusedLocation.lat, focusedLocation.lng], 16);
    }
  }, [focusedLocation]);

  return <div ref={mapContainerRef} className="w-full h-full z-0" />;
};

export default MapComponent;
