Mapbox Directions & POI Finder

This project utilizes Mapbox’s Directions API and npm packages to enable users to select an origin and destination within a web service, and analyze both standard routes and optimal routes that take real-time traffic conditions into account.
Users can choose between the standard route and the real-time traffic route, and upon selection, view the expected path through marker animations.
During navigation, information retrieved via Mapbox’s Tilequery API allows users to see Points of Interest (POIs) along the route through toast messages, with additional filtering options available based on specific conditions

** Keypoints

•	Using the mapbox-gl package, you can easily build a geo-service within a web application.

•	With the mapbox-gl-directions package, you can quickly implement UI components for setting origin and destination, address autocomplete, and coordinate conversion.

•	Through the Directions API, you can obtain optimal routes as well as route information that reflects real-time traffic conditions.

•	With the Tilequery API, you can retrieve information about nearby Points of Interest (POIs).

Features

•	Interactive Map mapbox-gl, mapbox-gl-directions

•	Route Calculation using Mapbox Directions API
  
  o	Normal driving route (driving)
  
  o	Traffic-aware driving route (driving-traffic)

•	ETA Comparison (Estimated Time of Arrival) displayed in minutes

•	Route Visualization with color-coded layers
  
  o	Blue for normal driving
  
  o	Purple for traffic-aware driving

•	Animated Marker moving along the selected route

•	POI Detection using Mapbox Tilequery API
  
  o	Fuel stations
  
  o	Cafes
  
  o	Hospitals

•	Snackbar Notifications for nearby POIs

•	Buttons to filter POI categories

•	Modal to notify the destination

Dependencies

    "@emotion/react": "^11.14.0",

    "@emotion/styled": "^11.14.1",
    
    "@mapbox/mapbox-gl-directions": "^4.3.1",
    
    "@mui/material": "^7.3.7",
    
    "@turf/turf": "^7.3.3",
    
    "dotenv": "^17.2.3",
    
    "mapbox-gl": "^3.18.1",
    
    "next": "^16.1.6"

Installation
1.	Prerequisite; node.js, npm should be installed on your device
2.	Unzip mapbox.zip into your project directory
3.	npm install 
4.	Set up environment variables:
Create a .env.local file in the root directory and add your Mapbox access token:
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN={YOUR_ACCESS_TOKEN}
5.	Run the development server; npm run dev 

Usage
1.	Open the app in your browser (http://localhost:3060/mapbox).
2.	Select an origin and destination using the Mapbox Directions control.
3.	Once search is done, sidebar dashboard will be happen on left-top side
4.	Compare ETA for normal vs traffic-aware routes.
5.	Choose a route profile (normal or traffic-aware).
6.	Watch the animated marker move along the route.
7.	Enable POI filters (Fuel, Cafe, Hospital) to get nearby notifications.

Key Code Highlights

•	Route Fetching
 
 const fetchRoute = async (profile) => {
        const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${origin.join(",",)};${destination.join(",")}?geometries=geojson&access_token=${mapboxgl.accessToken}`;
  
            const res = await fetch(url);
        const data = await res.json();
        
        return data.routes[0];
      };

•	POI Query


      const getPoIdata = async (lng, lat) => {
        const url = `https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/tilequery/${lng},${lat}.json?radius=300&access_token=${mapboxgl.accessToken}`;
              const res = await fetch(url);
              const data = await res.json();
              data.features.map((v) => console.log(v.properties.type));
              if (toggle) {
                  return data.features.filter((f) => f.properties.type === toggle);
              }
              
              return data.features;
          };

•	Requires a valid Mapbox Access Token.

•	POI detection radius is set to 300 meters.

•	Snackbar notifications auto-hide after 1 second.

•	Toggle buttons allow single selection for POI categories.
