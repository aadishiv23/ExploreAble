// Shared UI components for every file within dir
// in every directory
// shared elemen that are dipsplayed and persisted between page transitions
import { Slot } from 'expo-router';

export default function RootLayout() {
    return (
        // acts same as children prop in web apps, and renders index page or App componenet
        <Slot/>
    )
}