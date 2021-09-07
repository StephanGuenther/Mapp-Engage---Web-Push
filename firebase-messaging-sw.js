if('function' === typeof importScripts) {
    importScripts("https://www.gstatic.com/firebasejs/8.7.1/firebase-app.js");
    importScripts("https://www.gstatic.com/firebasejs/8.7.1/firebase-messaging.js");
    addEventListener('message', onMessage);

    function onMessage(e) {
        // do some work here
    }

    // Initialize the Firebase app in the service worker by passing in the
    // messagingSenderId.
    const firebaseConfig = {
        apiKey: "<<Firebase apiKey>>",
        authDomain: "<<Firebase authDomain>>",
        projectId: "<<Firebase projectId>>",
        storageBucket: "<<Firebase storageBucket>>",
        messagingSenderId: "<<Firebase messagingSenderId>>",
        appId: "<<Firebase appId>>",
        measurementId: "<<Firebase measurementId>>"
    };

    firebase.initializeApp(firebaseConfig);

    // Retrieve an instance of Firebase Messaging so that it can handle background messages.
    /*
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage(function(payload) {
        if (!payload.notification && payload.webpush && payload.webpush.notification) {
            const notificationTitle = payload.webpush.notification.title;
            const notificationOptions = payload.webpush.notification;

            if (notificationOptions.image && !notificationOptions.icon) {
                notificationOptions.icon = notificationOptions.image;
            }

            return self.registration.showNotification(
                notificationTitle,
                notificationOptions
            );
        }
    });
    */
}
