# Sahyatri promo UI kit

Front-end pieces for the Remotion promo: copies of the real screen code, plus
standalone React DOM recreations sized to a 390 × 844 phone. Nothing in the app
was changed.

```
original/   copies of the app files behind these screens (reference only, React Native)
fonts/      Manrope TTFs (400, 500, 600, 700, 800)
web/        plain React + inline CSS recreations (no RN, no navigation, no state, no API)
```

## Web components → source files

| Web component | Recreates | Notes |
|---|---|---|
| `web/HomeScreen.tsx` | `original/src/screens/DashboardScreen.tsx` + `components/TabBar.tsx` | Main state: approved pool, rides today. The "Get set up" checklist and the pool picker sheet are left out. The "Heading out?" tip is behind `showTip`. |
| `web/RideScreen.tsx` | `original/src/screens/TodayRideScreen.tsx` | Passenger view. `myStatus` switches between the two buttons, the ready notice and the aboard notice. `rideStatus: 'STARTED'` adds the 260 px map and the black hero. |
| `web/LiveMapScreen.tsx` | `original/src/screens/RideMapScreen.tsx` | Full-screen map, glass close button, Live pill, bottom sheet. |
| `web/MapCanvas.tsx` | `original/src/components/LiveMap.tsx` + `original/src/screens/mapHtml.ts` | The basemap is a drawn SVG street grid. The marker, tag and pickup-pin styles are copied from `mapHtml.ts`. Use `pointAlong(route, t)` to move the car. |
| `web/RosterScreen.tsx` | `original/src/screens/RosterScreen.tsx` | Uses the roster's own avatar colours (`rosterAvatarColor`), not the kit's. |
| `web/NotificationCard.tsx` | Notification row in `original/src/screens/NotificationsScreen.tsx` | One Activity row, with the icon colours for each notification type. |
| `web/primitives.tsx` | `original/src/components/ui.tsx` | Avatar, Badge, Button, Card, Notice, PulseDot, SectionHeader and IconButton, plus the iOS status bar, the native-stack header and the home indicator. |
| `web/icons.tsx` | `@expo/vector-icons` Ionicons | Glyph outlines extracted from the app's own `Ionicons.ttf` (v15.1.1), so they match exactly. MIT licensed. |
| `web/tokens.ts` | `original/src/theme/colors.ts`, `original/src/theme/index.ts` | Every colour, font, radius, spacing, type, shadow, scrim and status tone, with the original names. Also includes `device` and `motion`. |
| `web/mockData.ts` | n/a | Store-screenshot data: Arjun Mehta, Honda City KA 03 MX 4412, Priya Nair (viewer), Rohan Verma, Aditi Sharma, 08:15 and 18:30, Prestige Tech Park. |

### Places where your brief and the app differ

- **"Arjun sees you're ready" toast.** The app has no toast. After "I'm at the
  pickup point", the buttons are replaced by an inline success notice: **"You're
  at the pickup point / The driver can see you're ready."** `RideScreen` draws
  that notice. `readyNotice` overrides its text, and `mockData.rideReady` uses
  your wording.
- **"Arjun is 1.1 km away" card.** This isn't in the app. The map sheet's driver
  row says **"Arjun Mehta is driving · 1 aboard · 2 to pick up · Honda City"**.
  Distances appear only on rider rows, as "1.1 km from the car". Pass
  `driverTitle="Arjun is 1.1 km away"` if you want the store wording.
- **Route line.** The real map draws no route, only the car, the riders and
  their pickup pins. `MapCanvas` draws a route only when you pass `route`. The
  black square marking the destination is also a promo addition.
- **Notifications.** The app has no "I'm ready" notification (readiness only
  updates live) and no OS push banners. The closest real notifications are
  `DRIVER_REMINDER_12H` ("You are the scheduled driver"), `DRIVER_REALLOTTED`,
  `DRIVER_CHANGED`, `RIDE_STARTED` and `RIDE_DELAYED`. Their text in `mockData`
  follows the backend's wording. `PROMO_READY` is a made-up type drawn in the
  same style.
- `original/DESIGN_SYSTEM.md` gives older hex values for green and yellow.
  `colors.ts` (and `tokens.ts`) hold the values the app actually uses: green
  `#5AAE45`, yellow `#F2CF5B`.

## Using in Remotion

```tsx
import { staticFile, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import './sahyatri-promo-ui/web/fonts.css';          // or load the TTFs with @remotion/fonts
import { HomeScreen, LiveMapScreen, mock } from './sahyatri-promo-ui/web';

export const Home = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <HomeScreen
      {...mock.home}
      promoImageSrc={staticFile('hero-morning.webp')}   // copy web/assets/* into public/
      timeMs={(frame / fps) * 1000}                      // plays the app's FadeIn + PulseDot timing
      scrollY={interpolate(frame, [60, 90], [0, 140], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}
    />
  );
};

export const Map = () => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [0, 150], [0.05, 0.45], { extrapolateRight: 'clamp' });
  return <LiveMapScreen {...mock.liveMap} map={mock.morningMap(t, -40, 40)} timeMs={(frame / 30) * 1000} />;
};
```

- The components are pure. Without `timeMs` they render a static, fully shown
  frame. With `timeMs` they replay the app's entrance staggers and pulses.
- Each screen is exactly 390 × 844 with `overflow: hidden`. Scale it into a
  device frame with `transform: scale(...)`.
- `showStatusBar={false}` hides the 9:41 bar if your device mockup has its own.
- `web/` needs only `react` (18+). Type-check with `npm i && npm run typecheck`
  inside `web/`. This was checked with TypeScript 5.6 and @types/react 18.3.

## Fonts

**Manrope** is the only typeface. The app loads it from
`@expo-google-fonts/manrope` (`App.tsx`) and registers each weight as its own
family:

| Token | App family | CSS |
|---|---|---|
| `regular` | `Manrope_400Regular` | `font-weight: 400` |
| `medium` | `Manrope_500Medium` | `500` |
| `semibold` | `Manrope_600SemiBold` | `600` |
| `bold` | `Manrope_700Bold` | `700` |
| `heavy` | `Manrope_800ExtraBold` | `800` |

The TTFs in `fonts/` come from that npm package (SIL Open Font License). The font
files aren't committed anywhere else in the repo. `web/fonts.css` maps them to a
single `'Manrope'` family. The status bar clock uses the system font (SF Pro),
as iOS does.

## Animations and transitions in the real app

All motion uses React Native `Animated` on the native driver
(`original/src/components/ui.tsx`). Durations are in ms.

| What | Where | Timing |
|---|---|---|
| **FadeIn** (enter) | Almost every block | Opacity 0→1 and translateY 12→0 px over **480 ms**, `cubic-bezier(0.2, 0.8, 0.2, 1)` |
| Home staggers | Dashboard | Pool switcher 0 · tiles 60 · ride cards `100 + i×70` · promo banner 220 |
| Ride staggers | TodayRide | Map 0 · hero 0 · driver card 80 · action buttons 140 · rider cards `200 + i×50` |
| Map sheet | RideMap | FadeIn with translateY **40→0**, 480 ms, same curve |
| Activity rows | Notifications | `min(i, 8) × 40` delay |
| **PressableScale** | Cards, buttons, tiles | Press-in springs to scale **0.97** (cards **0.985**), RN spring `speed 40, bounciness 0`; release springs back with `bounciness 6`. Light haptic on tap. |
| "I'm at the pickup point" | TodayRide | Press-scale, then a *success* haptic; the buttons swap to the green notice after the API call (no transition, just a re-render, and the notice FadeIns) |
| **PulseDot** ("Live", live riders) | Ride card, hero, map | Loops every **1400 ms**: halo 2.4× the dot size, scale 0.4→1, opacity 0.35→0, `Easing.out(quad)` |
| Map "me" halo | mapHtml.ts | CSS `pulse 2s ease-out infinite`: scale 0.6→2.2, opacity 0.5→0 |
| Map markers moving | mapHtml.ts | `transition: transform 1s linear` between location fixes, so the car glides |
| Map camera | mapHtml.ts | Leaflet `fitBounds` (animated) to keep everyone in view, max zoom 17; padding 60/110 top-left and 60/(sheet + 60) bottom-right. Tapping a person animates `setView` to zoom ≥ 17. |
| Illustration float | Roster art, empty states | translateY 0→−6 px→0, **2600 ms** each way, `Easing.inOut(sin)` |
| Skeleton shimmer | Loading | Opacity 0.5↔1, 750 ms each way |
| PopButton (yellow CTA) | Onboarding/empty states | Face shifts 4 px into its hard shadow over 90 ms |
| Segmented thumb | Inputs | Spring `speed 18, bounciness 4` |
| Screen push | Home → Your ride, Pools → Roster | native-stack `slide_from_right` (iOS push, ~350 ms) |
| Open live map | Your ride → map | `fade_from_bottom` |
| Bottom sheets / delay picker | Modals | RN Modal `animationType="slide"` over a 50% black scrim |
| Tab switch | Tab bar | No animation; light haptic; green 28×3 indicator above the active tab |

`web/tokens.ts › motion` has the same numbers in code, and
`web/primitives.tsx` exports `fadeIn(timeMs, delay, from)`, `floatOffset` and
`cubicBezier` so you can reuse the app's curves.

## What's in `original/`

- `src/screens/`: DashboardScreen, TodayRideScreen, RideMapScreen, RosterScreen,
  NotificationsScreen, mapHtml.ts (Leaflet page; tile settings are injected from
  `config.ts`, which is not included)
- `src/components/`: ui.tsx (the UI kit), LiveMap.tsx, rideMap.ts (rider status
  lines and distance formatting), Card.tsx, TabBar.tsx
- `src/theme/`: colors.ts, index.ts (all design tokens)
- `src/assets/illustrations.ts`: the app's illustration registry. It lists every
  piece of art; only the files these screens use are copied.
- `assets/illustrations/`: hero-morning, hero-evening (Home banner),
  calendar-roster (Roster), plus the empty, error and ride-complete states of
  these screens
- `DESIGN_SYSTEM.md`

These files import app-only modules (`../api/client`, `../context/*`,
`../config`, `../types`), which are intentionally left out. They are for
reference, not for compiling.

**Excluded:** `.env`, API keys, `config.ts`, `authConfig.ts`, `firebase.ts`,
`firebase/google-services.json`, the API client, auth and contexts, hooks
(sockets, location), the backend, analytics, real user data and `node_modules`.
