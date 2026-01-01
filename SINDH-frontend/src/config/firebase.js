
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
    initializeFirestore, 
    persistentLocalCache, 
    persistentMultipleTabManager 
} from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyBCxd098zKwbvt_RCj15iiifRkzaJZqc8I",
    authDomain: "sindh-8c91b.firebaseapp.com",
    projectId: "sindh-8c91b",
    storageBucket: "sindh-8c91b.firebasestorage.app",
    messagingSenderId: "265383518270",
    appId: "1:265383518270:web:d235c345b678e9f0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);

// Initialize Firestore with modern persistence (v11+)
export const db = initializeFirestore(app, {
    localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
    })
});

export default app;
