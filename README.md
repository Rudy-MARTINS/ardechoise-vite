# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Build android

### Pre-requis

1. Install Android-Studio and configure the variable environnement:
    For Linux:
    ```
    export CAPACITOR_ANDROID_STUDIO_PATH="/opt/android-studio-for-platform/bin/studio.sh"
    ```
    For Windows:
    ```

    ```
2.  Install capacitor:
    ```
    npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/app @capacitor/haptics @capacitor/keyboard @capacitor/status-bar
    ```

### Init capacitor

init capacitor:
```
    npx cap init
```

Add capabilities android:
``` 
    npx cap add android
```

**Never used**  but add ios capabilities:

```
    npx cap add ios
```

Synchronize configuration between the web app and Android:
```
    npx cap sync
```

Open android studio with this project:
```
    npx cap open android
```

### Build With Android Studio

Once the project open in android studio you can :

1. Build --> generated app bundle --> Generate Apk

### Build direct with Gradlew

Go in android repository created automatically with the command above: init capacitor.
```
cd android 
```

Compile
```
./gradlew assembleDebug
```

The apk build:
```
./android/app/build/outputs/apk/debug/app-debug.apk