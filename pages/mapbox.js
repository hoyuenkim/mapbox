import { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
// Use mapbox-gl-directions
import MapboxDirections from "@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions";
import "@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions.css";
import Snackbar from "@mui/material/Snackbar";
import * as turf from "@turf/turf";

// MUI Dialog
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";

const INITIAL_CENTER = [127.0286, 37.4979];
const INITIAL_ZOOM = 10;

const Mapbox = () => {
  const mapRef = useRef();
  const mapContainerRef = useRef();

  // Routes
  const [routes, setRoutes] = useState({ normal: null, traffic: null });
  // Eta normal
  const [etaNormal, setEtaNormal] = useState(null);
  // Eta traffic
  const [etaTraffic, setEtaTraffic] = useState(null);
  // driving traffic type profile
  const [selectedProfile, setSelectedProfile] = useState(null);
  // Snackbar notification
  const [notification, setNotification] = useState(null);
  // Fuel, cafe, hospital, null
  const [toggle, setToggle] = useState(null);
  // Modal open state
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    // Get credentials from env
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

    // Initializing mapboxgm.map
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
    });

    // Create MapboxDirections
    const directions = new MapboxDirections({
      accessToken: mapboxgl.accessToken,
      unit: "metric",
      profile: "mapbox/driving",
    });

    // Add controler MapboxDirections
    mapRef.current.addControl(directions, "top-right");

    directions.on("route", async (e) => {
      // Prevent route undefined
      if (!e.route || e.route.length === 0) return;
      if (!directions.getOrigin() || !directions.getDestination()) return;

      // Get coordinates from directions object
      const origin = directions.getOrigin().geometry.coordinates;
      const destination = directions.getDestination().geometry.coordinates;

      // Call directions API
      const fetchRoute = async (profile) => {
        const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${origin.join(
          ",",
        )};${destination.join(",")}?geometries=geojson&access_token=${mapboxgl.accessToken}`;
        const res = await fetch(url);
        const data = await res.json();
        return data.routes[0];
      };

      // Fetch Routes
      const normalRoute = await fetchRoute("driving");
      const trafficRoute = await fetchRoute("driving-traffic");

      // Initialze layer and sources
      ["route-normal", "route-traffic"].forEach((src) => {
        if (mapRef.current.getSource(src)) {
          mapRef.current.removeLayer(`layer-${src}`);
          mapRef.current.removeSource(src);
        }
      });

      // addSource; route-normal
      mapRef.current.addSource("route-normal", {
        type: "geojson",
        data: {
          type: "Feature",
          // response.geometery from direction api
          geometry: normalRoute.geometry,
        },
      });
      // add layer for initial line
      mapRef.current.addLayer({
        id: "layer-route-normal",
        type: "line",
        source: "route-normal",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#1E5FF7 ",
        },
      });

      // addSource; route-traffic
      mapRef.current.addSource("route-traffic", {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: trafficRoute.geometry,
        },
      });

      // add layer for initial line
      mapRef.current.addLayer({
        id: "layer-route-traffic",
        type: "line",
        source: "route-traffic",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#A0A0A0",
        },
      });

      //set Eta states
      setEtaNormal((normalRoute.duration / 60).toFixed(1));
      setEtaTraffic((trafficRoute.duration / 60).toFixed(1));

      //set Routes
      setRoutes({ normal: normalRoute, traffic: trafficRoute });
    });

    //initalizing mapRef
    return () => mapRef.current.remove();
  }, []);

  // Update route line color based on profile
  useEffect(() => {
    // Check if mapRef.current existing
    if (!mapRef.current) return;

    // Check if layer-route-normal existing
    if (mapRef.current.getLayer("layer-route-normal")) {
      // set line paint property, blue
      mapRef.current.setPaintProperty(
        "layer-route-normal",
        "line-color",
        selectedProfile === "driving" ? "#1E5FF7" : "#A0A0A0",
      );
    }

    // Check if layer-route-traffic existing
    if (mapRef.current.getLayer("layer-route-traffic")) {
      // set line paint property, purple
      mapRef.current.setPaintProperty(
        "layer-route-traffic",
        "line-color",
        selectedProfile === "driving-traffic" ? "#9525E6" : "#A0A0A0",
      );
    }

    // Select profile, animate marker
    if (
      selectedProfile &&
      routes[selectedProfile === "driving" ? "normal" : "traffic"]
    ) {
      const route =
        selectedProfile === "driving" ? routes.normal : routes.traffic;

      const line = {
        type: "Feature",
        geometry: route.geometry,
      };

      // Generate turf line
      const lineDistance = turf.length(line);
      const steps = 20;
      const arc = [];

      // Generate points along the line
      for (let i = 0; i < lineDistance; i += lineDistance / steps) {
        const segment = turf.along(line, i);
        arc.push(segment.geometry.coordinates);
      }

      // Setup Marker
      const marker = new mapboxgl.Marker({ color: "#1E5FF7" })
        .setLngLat(arc[0]) // Intial coordinates
        .addTo(mapRef.current);

      let i = 0;

      //
      async function animate() {
        if (i < arc.length) {
          const [lng, lat] = arc[i];
          // Update marker coordinates
          marker.setLngLat([lng, lat]);

          // Get POIs for coordinates
          const getPoIdata = async (lng, lat) => {
            const url = `https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/tilequery/${lng},${lat}.json?radius=300&access_token=${mapboxgl.accessToken}`;
            const res = await fetch(url);
            const data = await res.json();
            // filter based on the type; fuel, cafe, hospital
            if (toggle) {
              return data.features.filter((f) => f.properties.type === toggle);
            }
            return data.features;
          };

          const pois = await getPoIdata(lng, lat);
          if (pois.length > 0) {
            // if poi happens, get first one, set notification message
            setNotification(
              `📍 Nearby ${toggle || "POI"}: ${
                pois[0].properties.name || "Unknown"
              }`,
            );
          }

          i++;
          requestAnimationFrame(animate);
        } else {
          // Open modal at the last coordinates
          setOpenModal(true);
        }
      }
      animate();
    }
    // Prevent re-redering
  }, [selectedProfile, routes, toggle]);

  return (
    <>
      {/* Show sidebar after search is finished only */}
      {etaNormal && etaTraffic && (
        <div className="sidebar">
          <div>ETA</div>
          <div>normal driving ETA: {etaNormal}min</div>
          <div>traffic driving ETA: {etaTraffic}min</div>
          <div>
            {/* Buttons to select profile type */}
            <button onClick={() => setSelectedProfile("driving")}>
              driving
            </button>
            <button onClick={() => setSelectedProfile("driving-traffic")}>
              driving traffic
            </button>
          </div>

          <div style={{ marginTop: "20px" }}>
            Select your PoI type
            <br />
            {/* Buttons to select poi type */}
            <button onClick={() => setToggle("fuel")}>Fuel</button>
            <button onClick={() => setToggle("cafe")}>Cafe</button>
            <button onClick={() => setToggle("hospital")}>Hospital</button>
          </div>
        </div>
      )}

      {notification && (
        // Show snackbar notification
        <Snackbar
          open={Boolean(notification)}
          autoHideDuration={1000}
          onClose={() => setNotification(null)}
          message={notification}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        />
      )}

      {/* Modal */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)}>
        <DialogTitle>Get the destination</DialogTitle>
        <DialogContent>It's your destination!</DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <div
        id="map-container"
        ref={mapContainerRef}
        style={{ height: "100vh" }}
      />
    </>
  );
};

export default Mapbox;
