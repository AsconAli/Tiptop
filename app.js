// ============================================
// RURAL TRANSPORT PWA - APPLICATION LOGIC
// OpenStreetMap + Leaflet Implementation
// FIXED: Passenger counting, map display, live tracking, UX
// ============================================

let currentLanguage = 'en';
let currentUserType = null;
let currentPassengerId = null;
let currentDriverId = null;
let currentPointId = null;
let currentRoadId = null;
let currentDriverPickupPoint = null;
let driverAvailable = false;
let driverLocation = 'pickup';
let driverOnTrip = false;
let statusUpdateInterval = null;
let map = null;
let vehicleMarkers = [];
let pickupMarker = null;
let routePolyline = null;

const translations = {
    en: {
        headerTitle: 'Transport System',
        selectUser: 'Select User Type',
        passenger: 'Passenger',
        driver: 'Driver',
        waiting: "I'm Waiting",
        detecting: 'Detecting your location...',
        yourLocation: 'Your Location',
        road: 'Road',
        pickupPoint: 'Pickup Point',
        cancelWaiting: 'Cancel Waiting',
        liveStatus: 'Live Status',
        waitingHere: 'Waiting here',
        vehiclesComing: 'Vehicles coming',
        liveVehicles: 'Live Vehicles on Road',
        routeProgress: 'Route Progress',
        currentStop: 'Current Stop',
        stopsRemaining: 'Stops Remaining',
        available: 'Available',
        notAvailable: 'Not Available',
        atPickup: 'At Pickup',
        onRoad: 'On Road',
        startTrip: 'Start Trip',
        endTrip: 'End Trip',
        tripActive: 'Trip Active',
        demandSummary: 'Demand Summary',
        locationError: 'Could not detect location. Please enable GPS.',
        navHome: 'Home',
        navLang: 'বাংলা',
        mobileNavHome: 'Home',
        mobileNavLang: 'Change Language',
        footerAbout: 'About',
        footerAboutText: 'Rural transport coordination system connecting passengers and drivers between Lalsora and Ratabari.',
        footerContact: 'Contact',
        footerContactText: 'For support and inquiries',
        footerRoutes: 'Routes',
        footerCopyright: '© 2026 Rural Transport System. All rights reserved.',
        vehicle: 'Vehicle',
        yourPickup: 'Your Pickup Point',
        waitingAt: 'Waiting at:',
        selectPickupLabel: 'Select Pickup Point:',
        choosePoint: 'Choose a point...',
        cancelSuccess: 'Waiting cancelled successfully',
        tripEnded: 'Trip ended successfully'
    },
    bn: {
        headerTitle: 'পরিবহন ব্যবস্থা',
        selectUser: 'ব্যবহারকারী নির্বাচন করুন',
        passenger: 'যাত্রী',
        driver: 'চালক',
        waiting: 'আমি অপেক্ষা করছি',
        detecting: 'আপনার অবস্থান খুঁজছি...',
        yourLocation: 'আপনার অবস্থান',
        road: 'রাস্তা',
        pickupPoint: 'উঠার স্থান',
        cancelWaiting: 'অপেক্ষা বাতিল করুন',
        liveStatus: 'সরাসরি অবস্থা',
        waitingHere: 'এখানে অপেক্ষমাণ',
        vehiclesComing: 'গাড়ি আসছে',
        liveVehicles: 'রাস্তায় সরাসরি গাড়ি',
        routeProgress: 'রুট অগ্রগতি',
        currentStop: 'বর্তমান স্টপ',
        stopsRemaining: 'অবশিষ্ট স্টপ',
        available: 'উপলব্ধ',
        notAvailable: 'অনুপলব্ধ',
        atPickup: 'উঠার স্থানে',
        onRoad: 'রাস্তায়',
        startTrip: 'যাত্রা শুরু করুন',
        endTrip: 'যাত্রা শেষ করুন',
        tripActive: 'যাত্রা চলছে',
        demandSummary: 'চাহিদার সারাংশ',
        locationError: 'অবস্থান খুঁজে পাওয়া যায়নি। GPS চালু করুন।',
        navHome: 'হোম',
        navLang: 'English',
        mobileNavHome: 'হোম',
        mobileNavLang: 'ভাষা পরিবর্তন করুন',
        footerAbout: 'সম্পর্কে',
        footerAboutText: 'লালসোরা এবং রাটাবাড়ীর মধ্যে যাত্রী এবং চালকদের সংযোগকারী গ্রামীণ পরিবহন সমন্বয় ব্যবস্থা।',
        footerContact: 'যোগাযোগ',
        footerContactText: 'সহায়তা এবং জিজ্ঞাসার জন্য',
        footerRoutes: 'রুট',
        footerCopyright: '© ২০২৬ গ্রামীণ পরিবহন ব্যবস্থা। সর্বস্বত্ব সংরক্ষিত।',
        vehicle: 'গাড়ি',
        yourPickup: 'আপনার উঠার স্থান',
        waitingAt: 'অপেক্ষা করছেন:',
        selectPickupLabel: 'পিকআপ পয়েন্ট নির্বাচন করুন:',
        choosePoint: 'একটি পয়েন্ট চয়ন করুন...',
        cancelSuccess: 'অপেক্ষা সফলভাবে বাতিল করা হয়েছে',
        tripEnded: 'যাত্রা সফলভাবে শেষ হয়েছে'
    }
};

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
    
    const backButton = document.getElementById('backButton');
    if (screenId === 'userTypeScreen') {
        backButton.classList.remove('show');
    } else {
        backButton.classList.add('show');
    }
}

function goBack() {
    if (currentUserType === 'passenger' && currentPassengerId) {
        cancelWaiting();
    } else if (currentUserType === 'driver') {
        if (statusUpdateInterval) {
            clearInterval(statusUpdateInterval);
        }
    }
    showHome();
}

function showError(message) {
    const errorEl = document.getElementById('errorMessage');
    errorEl.textContent = message;
    errorEl.style.display = 'block';
    setTimeout(() => {
        errorEl.style.display = 'none';
    }, 5000);
}

function showSuccess(message) {
    const errorEl = document.getElementById('errorMessage');
    errorEl.style.background = '#d1fae5';
    errorEl.style.color = '#065f46';
    errorEl.textContent = message;
    errorEl.style.display = 'block';
    setTimeout(() => {
        errorEl.style.display = 'none';
        errorEl.style.background = '#fee2e2';
        errorEl.style.color = '#991b1b';
    }, 3000);
}

function t(key) {
    return translations[currentLanguage][key] || key;
}

function updateUIText() {
    const elements = {
        headerTitle: 'headerTitle',
        selectUserText: 'selectUser',
        passengerText: 'passenger',
        driverText: 'driver',
        waitingText: 'waiting',
        detectingText: 'detecting',
        yourLocationText: 'yourLocation',
        roadLabelText: 'road',
        pickupPointLabelText: 'pickupPoint',
        cancelWaitingText: 'cancelWaiting',
        liveStatusText: 'liveStatus',
        waitingHereText: 'waitingHere',
        vehiclesComingText: 'vehiclesComing',
        liveVehiclesText: 'liveVehicles',
        routeProgressTitle: 'routeProgress',
        currentStopLabel: 'currentStop',
        stopsRemainingLabel: 'stopsRemaining',
        availabilityText: driverAvailable ? 'available' : 'notAvailable',
        atPickupText: 'atPickup',
        onRoadText: 'onRoad',
        tripStartText: driverOnTrip ? 'endTrip' : 'startTrip',
        demandSummaryText: 'demandSummary',
        navHome: 'navHome',
        navLang: 'navLang',
        mobileHeaderTitle: 'headerTitle',
        mobileNavHome: 'mobileNavHome',
        mobileNavLang: 'mobileNavLang',
        footerAbout: 'footerAbout',
        footerAboutText: 'footerAboutText',
        footerContact: 'footerContact',
        footerContactText: 'footerContactText',
        footerRoutes: 'footerRoutes',
        footerCopyright: 'footerCopyright',
        waitingAtText: 'waitingAt',
        selectPickupLabel: 'selectPickupLabel'
    };

    for (const [elementId, translationKey] of Object.entries(elements)) {
        const el = document.getElementById(elementId);
        if (el) {
            el.textContent = t(translationKey);
        }
    }
}

function toggleLanguage() {
    currentLanguage = currentLanguage === 'en' ? 'bn' : 'en';
    localStorage.setItem('language', currentLanguage);
    updateUIText();
    
    if (currentUserType === 'passenger' && currentPointId) {
        updatePassengerLocationDisplay();
        updateProgressBar();
    }
    if (currentUserType === 'driver') {
        loadDriverDemand();
        populatePickupPointSelector();
    }
}

function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    menu.classList.toggle('active');
}

function showHome() {
    if (statusUpdateInterval) {
        clearInterval(statusUpdateInterval);
    }
    currentUserType = null;
    currentDriverId = null;
    driverOnTrip = false;
    driverAvailable = false;
    showScreen('userTypeScreen');
}

function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

function findNearestPickupPoint(latitude, longitude) {
    if (!window.PICKUP_POINTS || !Array.isArray(window.PICKUP_POINTS)) {
        console.error('PICKUP_POINTS not defined or not an array');
        return null;
    }

    let nearestPoint = null;
    let minDistance = Infinity;
    let withinGeofence = false;

    for (const point of window.PICKUP_POINTS) {
        const distance = calculateDistance(latitude, longitude, point.lat, point.lng);
        
        if (distance <= point.radius) {
            if (distance < minDistance) {
                minDistance = distance;
                nearestPoint = point;
                withinGeofence = true;
            }
        }
    }

    if (!withinGeofence) {
        for (const point of window.PICKUP_POINTS) {
            const distance = calculateDistance(latitude, longitude, point.lat, point.lng);
            
            if (distance < minDistance) {
                minDistance = distance;
                nearestPoint = point;
            }
        }
    }

    return {
        point: nearestPoint,
        distance: minDistance,
        withinGeofence: withinGeofence
    };
}

function getOrCreatePassengerUID() {
    let passengerUID = localStorage.getItem('passenger_uid');
    if (!passengerUID) {
        passengerUID = 'passenger_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('passenger_uid', passengerUID);
    }
    return passengerUID;
}

function selectUserType(type) {
    currentUserType = type;
    
    if (type === 'passenger') {
        showScreen('passengerWaitingScreen');
    } else {
        const savedDriverId = localStorage.getItem('driver_id');
        if (savedDriverId) {
            currentDriverId = savedDriverId;
        } else {
            currentDriverId = 'driver_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('driver_id', currentDriverId);
        }
        currentRoadId = localStorage.getItem('driver_road_id') || 'road1';
        showScreen('driverHomeScreen');
        populatePickupPointSelector();
        loadDriverDemand();
        startDriverPolling();
    }
}

async function startWaiting() {
    showScreen('passengerLoadingScreen');

    if (!('geolocation' in navigator)) {
        showError(t('locationError'));
        showScreen('passengerWaitingScreen');
        return;
    }

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            await registerPassenger(latitude, longitude);
        },
        (error) => {
            console.error('Geolocation error:', error);
            showError(t('locationError'));
            showScreen('passengerWaitingScreen');
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

async function registerPassenger(latitude, longitude) {
    try {
        const result = findNearestPickupPoint(latitude, longitude);
        
        if (!result || !result.point) {
            showError('No pickup point found');
            showScreen('passengerWaitingScreen');
            return;
        }

        const { point, distance, withinGeofence } = result;
        
        currentPassengerId = getOrCreatePassengerUID();
        currentPointId = point.id;
        currentRoadId = point.road_id;

        const { doc, setDoc, serverTimestamp } = window.firestoreModules;
        
        await setDoc(doc(window.db, 'passengers', currentPassengerId), {
            passenger_id: currentPassengerId,
            road_id: point.road_id,
            point_id: point.id,
            status: 'waiting',
            last_update_time: serverTimestamp(),
            within_geofence: withinGeofence,
            distance_to_point: Math.round(distance)
        }, { merge: true });

        updatePassengerLocationDisplay();
        showScreen('passengerStatusScreen');
        initMap();
        await updatePassengerStatus();
        startPassengerPolling();

    } catch (error) {
        console.error('Error registering passenger:', error);
        showError('Failed to register. Please try again.');
        showScreen('passengerWaitingScreen');
    }
}

async function cancelWaiting() {
    if (!currentPassengerId) return;
    
    try {
        const { doc, setDoc, serverTimestamp } = window.firestoreModules;
        
        await setDoc(doc(window.db, 'passengers', currentPassengerId), {
            status: 'cancelled',
            cancelled_at: serverTimestamp()
        }, { merge: true });
        
        if (statusUpdateInterval) {
            clearInterval(statusUpdateInterval);
        }
        
        showSuccess(t('cancelSuccess'));
        setTimeout(() => {
            showScreen('passengerWaitingScreen');
        }, 1000);
        
    } catch (error) {
        console.error('Error cancelling waiting:', error);
        showError('Failed to cancel. Please try again.');
    }
}

function updatePassengerLocationDisplay() {
    const point = window.PICKUP_POINTS.find(p => p.id === currentPointId);
    const road = window.ROADS[currentRoadId];
    
    if (point && road) {
        document.getElementById('roadValue').textContent = currentLanguage === 'bn' ? road.name_bn : road.name;
        document.getElementById('pickupPointValue').textContent = currentLanguage === 'bn' ? point.name_bn : point.name;
    }
}

async function updatePassengerStatus() {
    try {
        const { collection, getDocs, query, where } = window.firestoreModules;
        
        const passengersRef = collection(window.db, 'passengers');
        const passengersQuery = query(
            passengersRef,
            where('point_id', '==', currentPointId),
            where('status', '==', 'waiting')
        );
        
        const passengersSnapshot = await getDocs(passengersQuery);
        const now = Date.now();
        const EXPIRY_MS = 45 * 60 * 1000;
        
        let waitingCount = 0;
        passengersSnapshot.forEach(doc => {
            const data = doc.data();
            const lastUpdate = data.last_update_time?.toMillis() || 0;
            if (now - lastUpdate < EXPIRY_MS) {
                waitingCount++;
            }
        });

        const driversRef = collection(window.db, 'drivers');
        const driversQuery = query(
            driversRef,
            where('road_id', '==', currentRoadId),
            where('availability', '==', true)
        );
        
        const driversSnapshot = await getDocs(driversQuery);
        const DRIVER_EXPIRY_MS = 10 * 60 * 1000;
        
        let activeDrivers = 0;
        const activeDriversData = [];
        
        driversSnapshot.forEach(doc => {
            const data = doc.data();
            const lastUpdate = data.last_update_time?.toMillis() || 0;
            if (now - lastUpdate < DRIVER_EXPIRY_MS) {
                activeDrivers++;
                if (data.location) {
                    let lat, lng;
                    if (data.location.latitude !== undefined) {
                        lat = data.location.latitude;
                        lng = data.location.longitude;
                    } else if (data.location._lat !== undefined) {
                        lat = data.location._lat;
                        lng = data.location._long;
                    }
                    
                    if (lat && lng) {
                        activeDriversData.push({
                            ...data,
                            location: { latitude: lat, longitude: lng }
                        });
                    }
                }
            }
        });

        document.getElementById('waitingCount').textContent = waitingCount;
        document.getElementById('vehiclesCount').textContent = activeDrivers;
        
        updateMapMarkers(activeDriversData);
        updateProgressBar(activeDriversData);

    } catch (error) {
        console.error('Error updating passenger status:', error);
    }
}

function initMap() {
    if (typeof L === 'undefined') {
        console.error('Leaflet not loaded');
        return;
    }

    const point = window.PICKUP_POINTS.find(p => p.id === currentPointId);
    if (!point) return;

    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    if (map) {
        map.remove();
    }

    map = L.map('map').setView([point.lat, point.lng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);

    const pickupIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="font-size: 32px; text-align: center; margin-top: -16px;">📍</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32]
    });

    pickupMarker = L.marker([point.lat, point.lng], { icon: pickupIcon })
        .addTo(map)
        .bindPopup(`<div class="vehicle-popup"><strong>${t('yourPickup')}</strong><br>${currentLanguage === 'bn' ? point.name_bn : point.name}</div>`);
}

function updateMapMarkers(driversData) {
    if (!map) return;

    vehicleMarkers.forEach(marker => map.removeLayer(marker));
    vehicleMarkers = [];

    driversData.forEach((driver, index) => {
        if (driver.location && driver.location.latitude && driver.location.longitude) {
            const vehicleIcon = L.divIcon({
                className: 'custom-div-icon',
                html: `<div style="font-size: 28px; text-align: center; margin-top: -14px;">🚐</div>`,
                iconSize: [28, 28],
                iconAnchor: [14, 14]
            });

            const marker = L.marker(
                [driver.location.latitude, driver.location.longitude],
                { icon: vehicleIcon }
            ).addTo(map);

            marker.bindPopup(`<div class="vehicle-popup"><strong>${t('vehicle')} ${index + 1}</strong></div>`);
            vehicleMarkers.push(marker);
        }
    });
}

function updateProgressBar(activeDriversData = []) {
    const roadPoints = window.PICKUP_POINTS.filter(p => p.road_id === currentRoadId);
    const currentPointIndex = roadPoints.findIndex(p => p.id === currentPointId);
    
    if (activeDriversData.length === 0 || currentPointIndex === -1) {
        document.getElementById('progressSection').style.display = 'none';
        return;
    }

    document.getElementById('progressSection').style.display = 'block';

    const closestVehicle = findClosestVehicleToRoute(activeDriversData[0], roadPoints);
    const vehiclePointIndex = closestVehicle.closestPointIndex;
    
    let progressPercentage = 0;
    let stopsRemaining = 0;
    let currentStopName = '';

    if (vehiclePointIndex < currentPointIndex) {
        progressPercentage = (vehiclePointIndex / currentPointIndex) * 100;
        stopsRemaining = currentPointIndex - vehiclePointIndex;
        currentStopName = currentLanguage === 'bn' ? roadPoints[vehiclePointIndex].name_bn : roadPoints[vehiclePointIndex].name;
    } else {
        progressPercentage = 100;
        stopsRemaining = 0;
        currentStopName = currentLanguage === 'bn' ? roadPoints[currentPointIndex].name_bn : roadPoints[currentPointIndex].name;
    }

    document.getElementById('progressPercentage').textContent = Math.round(progressPercentage) + '%';
    document.getElementById('progressBarFill').style.width = progressPercentage + '%';
    document.getElementById('currentStopValue').textContent = currentStopName;
    document.getElementById('stopsRemainingValue').textContent = stopsRemaining;

    renderProgressPoints(roadPoints, currentPointIndex, vehiclePointIndex);
}

function findClosestVehicleToRoute(vehicle, roadPoints) {
    if (!vehicle.location) {
        return { closestPointIndex: 0, distance: Infinity };
    }

    let closestPointIndex = 0;
    let minDistance = Infinity;

    roadPoints.forEach((point, index) => {
        const distance = calculateDistance(
            vehicle.location.latitude,
            vehicle.location.longitude,
            point.lat,
            point.lng
        );

        if (distance < minDistance) {
            minDistance = distance;
            closestPointIndex = index;
        }
    });

    return { closestPointIndex, distance: minDistance };
}

function renderProgressPoints(roadPoints, destinationIndex, vehicleIndex) {
    const container = document.getElementById('progressPoints');
    const routeLine = container.querySelector('.route-line');
    
    container.innerHTML = '';
    container.appendChild(routeLine);

    const pointsToShow = roadPoints.slice(0, destinationIndex + 1);

    pointsToShow.forEach((point, index) => {
        const pointDiv = document.createElement('div');
        pointDiv.className = 'progress-point';
        
        if (index < vehicleIndex) {
            pointDiv.classList.add('completed');
        } else if (index === vehicleIndex) {
            pointDiv.classList.add('active');
        }

        pointDiv.innerHTML = `
            <div class="progress-point-dot"></div>
            <div class="progress-point-label">${currentLanguage === 'bn' ? point.name_bn : point.name}</div>
        `;

        container.appendChild(pointDiv);
    });
}

function startPassengerPolling() {
    if (statusUpdateInterval) {
        clearInterval(statusUpdateInterval);
    }
    
    statusUpdateInterval = setInterval(() => {
        updatePassengerStatus();
    }, 15000);
}

function populatePickupPointSelector() {
    const select = document.getElementById('pickupPointSelect');
    select.innerHTML = `<option value="">${t('choosePoint')}</option>`;
    
    const roadPoints = window.PICKUP_POINTS.filter(p => p.road_id === currentRoadId);
    roadPoints.forEach(point => {
        const option = document.createElement('option');
        option.value = point.id;
        option.textContent = currentLanguage === 'bn' ? point.name_bn : point.name;
        select.appendChild(option);
    });
    
    if (currentDriverPickupPoint) {
        select.value = currentDriverPickupPoint;
    }
}

function updateDriverPickupPoint() {
    const select = document.getElementById('pickupPointSelect');
    currentDriverPickupPoint = select.value;
    
    if (currentDriverPickupPoint) {
        const point = window.PICKUP_POINTS.find(p => p.id === currentDriverPickupPoint);
        if (point) {
            const locationDisplay = document.getElementById('driverLocationDisplay');
            const locationText = document.getElementById('driverCurrentLocation');
            locationText.textContent = currentLanguage === 'bn' ? point.name_bn : point.name;
            locationDisplay.style.display = 'block';
        }
    }
    
    updateDriverStatus();
}

function toggleAvailability() {
    driverAvailable = !driverAvailable;
    const toggle = document.getElementById('availabilityToggle');
    
    if (driverAvailable) {
        toggle.classList.add('active');
    } else {
        toggle.classList.remove('active');
    }
    
    document.getElementById('availabilityText').textContent = driverAvailable ? t('available') : t('notAvailable');
    
    updateDriverStatus();
}

function setLocation(location) {
    driverLocation = location;
    
    const pickupBtn = document.getElementById('pickupBtn');
    const roadBtn = document.getElementById('roadBtn');
    const pickupSelector = document.getElementById('pickupPointSelector');
    
    if (location === 'pickup') {
        pickupBtn.classList.remove('btn-secondary');
        pickupBtn.classList.add('btn-primary');
        roadBtn.classList.remove('btn-primary');
        roadBtn.classList.add('btn-secondary');
        pickupSelector.style.display = 'block';
    } else {
        roadBtn.classList.remove('btn-secondary');
        roadBtn.classList.add('btn-primary');
        pickupBtn.classList.remove('btn-primary');
        pickupBtn.classList.add('btn-secondary');
        pickupSelector.style.display = 'none';
    }
    
    updateDriverStatus();
}

async function updateDriverStatus() {
    if (!currentDriverId || !currentRoadId) {
        return;
    }

    try {
        const { doc, setDoc, serverTimestamp } = window.firestoreModules;
        
        const driverData = {
            driver_id: currentDriverId,
            road_id: currentRoadId,
            availability: driverAvailable,
            current_segment: driverLocation,
            on_trip: driverOnTrip,
            last_update_time: serverTimestamp()
        };
        
        if (driverLocation === 'pickup' && currentDriverPickupPoint) {
            driverData.pickup_point_id = currentDriverPickupPoint;
        }
        
        if (driverAvailable && driverLocation === 'road' && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                driverData.location = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                };
                
                await setDoc(doc(window.db, 'drivers', currentDriverId), driverData, { merge: true });
            }, null, { enableHighAccuracy: false, timeout: 5000 });
        } else {
            await setDoc(doc(window.db, 'drivers', currentDriverId), driverData, { merge: true });
        }

    } catch (error) {
        console.error('Error updating driver status:', error);
    }
}

async function toggleTrip() {
    const btn = document.getElementById('tripStartBtn');
    
    if (driverOnTrip) {
        driverOnTrip = false;
        btn.classList.remove('btn-danger');
        btn.classList.add('btn-success');
        btn.innerHTML = '🚐 <span id="tripStartText">' + t('startTrip') + '</span>';
        
        driverLocation = 'pickup';
        setLocation('pickup');
        
        try {
            const { doc, setDoc, serverTimestamp } = window.firestoreModules;
            
            await setDoc(doc(window.db, 'drivers', currentDriverId), {
                current_segment: 'pickup',
                on_trip: false,
                trip_ended_at: serverTimestamp(),
                last_update_time: serverTimestamp()
            }, { merge: true });
            
            showSuccess(t('tripEnded'));

        } catch (error) {
            console.error('Error ending trip:', error);
        }
    } else {
        driverOnTrip = true;
        btn.classList.remove('btn-success');
        btn.classList.add('btn-danger');
        btn.innerHTML = '🚐 <span>' + t('endTrip') + '</span>';
        
        driverLocation = 'road';
        setLocation('road');
        
        try {
            const { doc, setDoc, serverTimestamp } = window.firestoreModules;
            
            await setDoc(doc(window.db, 'drivers', currentDriverId), {
                current_segment: 'on_trip',
                on_trip: true,
                trip_started_at: serverTimestamp(),
                last_update_time: serverTimestamp()
            }, { merge: true });

        } catch (error) {
            console.error('Error starting trip:', error);
        }
    }
}

async function loadDriverDemand() {
    try {
        const { collection, getDocs } = window.firestoreModules;
        
        const demandByPoint = {};
        const now = Date.now();
        const EXPIRY_MS = 45 * 60 * 1000;

        const passengersSnapshot = await getDocs(collection(window.db, 'passengers'));
        
        passengersSnapshot.forEach(doc => {
            const data = doc.data();
            const lastUpdate = data.last_update_time?.toMillis() || 0;
            
            if (data.status === 'waiting' && now - lastUpdate < EXPIRY_MS) {
                demandByPoint[data.point_id] = (demandByPoint[data.point_id] || 0) + 1;
            }
        });

        renderDriverDemand(demandByPoint);

    } catch (error) {
        console.error('Error loading driver demand:', error);
    }
}

function renderDriverDemand(demandByPoint) {
    const container = document.getElementById('demandContainer');
    container.innerHTML = '';

    Object.keys(window.ROADS).forEach(roadId => {
        const road = window.ROADS[roadId];
        const roadPoints = window.PICKUP_POINTS.filter(p => p.road_id === roadId);
        
        const roadSection = document.createElement('div');
        roadSection.className = 'road-section';
        
        const roadTitle = document.createElement('div');
        roadTitle.className = 'road-title';
        roadTitle.textContent = currentLanguage === 'bn' ? road.name_bn : road.name;
        roadSection.appendChild(roadTitle);

        roadPoints.forEach(point => {
            const count = demandByPoint[point.id] || 0;
            
            if (count > 0) {
                const level = count >= 6 ? 'high' : count >= 3 ? 'medium' : 'low';
                
                const pointRow = document.createElement('div');
                pointRow.className = 'point-row';
                
                pointRow.innerHTML = `
                    <div class="point-left">
                        <div class="demand-dot demand-${level}"></div>
                        <span>${currentLanguage === 'bn' ? point.name_bn : point.name}</span>
                    </div>
                    <div class="point-right">
                        <span class="point-count">${count}</span>
                        <span>👥</span>
                    </div>
                `;
                
                roadSection.appendChild(pointRow);
            }
        });

        if (roadSection.children.length > 1) {
            container.appendChild(roadSection);
        }
    });
}

function startDriverPolling() {
    if (statusUpdateInterval) {
        clearInterval(statusUpdateInterval);
    }
    
    statusUpdateInterval = setInterval(() => {
        loadDriverDemand();
        updateDriverStatus();
    }, 10000);
}

document.addEventListener('DOMContentLoaded', () => {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage) {
        currentLanguage = savedLanguage;
    }
    updateUIText();
});