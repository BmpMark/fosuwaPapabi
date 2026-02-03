import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // The Vite PWA plugin handles registration, but we can add custom logic here
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
            console.log('SW registered: ', registration);
            // Listen for updates
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                if (newWorker) {
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New version available
                            console.log('New version available!');
                            // You could show a notification to the user here
                        }
                    });
                }
            });
        })
            .catch((registrationError) => {
            console.log('SW registration failed: ', registrationError);
        });
    });
}
// Handle PWA install prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
});
// Listen for app installed
window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    deferredPrompt = null;
});
createRoot(document.getElementById("root")).render(<App />);
//# sourceMappingURL=main.jsx.map