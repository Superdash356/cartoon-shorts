/**
 * Sample data matching the store screenshots. All names are fictional.
 * Viewer: Priya Nair (rider). Driver: Arjun Mehta.
 */
import type { HomeScreenProps } from './HomeScreen';
import type { RideScreenProps } from './RideScreen';
import type { LiveMapScreenProps } from './LiveMapScreen';
import type { RosterScreenProps } from './RosterScreen';
import type { NotificationCardProps } from './NotificationCard';
import type { MapCanvasProps, MapPoint } from './MapCanvas';
import { pointAlong } from './MapCanvas';
import { avatarTone } from './tokens';

export const people = {
  driver: { name: 'Arjun Mehta', first: 'Arjun', color: avatarTone('Arjun Mehta') },
  priya: { name: 'Priya Nair', first: 'Priya', color: avatarTone('Priya Nair') },
  rohan: { name: 'Rohan Verma', first: 'Rohan', color: avatarTone('Rohan Verma') },
  aditi: { name: 'Aditi Sharma', first: 'Aditi', color: avatarTone('Aditi Sharma') },
} as const;

export const vehicle = { name: 'Honda City', plate: 'KA 03 MX 4412', display: 'Honda City · KA 03 MX 4412' } as const;
export const destination = 'Prestige Tech Park';
export const poolName = 'Prestige Tech Park';
export const morningTime = '08:15';
export const eveningTime = '18:30';

export const pickups = {
  priya: 'Indiranagar Metro, Gate 2',
  rohan: 'HAL 2nd Stage, 80 Ft Rd',
  aditi: 'Domlur Flyover bus stop',
} as const;

// ---------------------------------------------------------------------------
// Home
// ---------------------------------------------------------------------------

export const home: HomeScreenProps = {
  greeting: 'Good morning',
  firstName: people.priya.first,
  poolName,
  rides: [
    {
      id: 'am', label: 'Morning ride', time: morningTime, status: 'DRIVER_ASSIGNED', upNext: true,
      driverName: people.driver.name, driverColor: people.driver.color, vehicleName: vehicle.display,
    },
    {
      id: 'pm', label: 'Evening ride', time: eveningTime, status: 'DRIVER_ASSIGNED',
      driverName: people.driver.name, driverColor: people.driver.color, vehicleName: vehicle.display,
    },
  ],
  promoVariant: 'morning',
  // promoImageSrc: staticFile('hero-morning.webp'),
};

/** Same screen with the morning ride live (black card, pulsing "Live"). */
export const homeLive: HomeScreenProps = {
  ...home,
  rides: [{ ...home.rides[0], status: 'STARTED', upNext: false }, home.rides[1]],
};

// ---------------------------------------------------------------------------
// Map geometry (street grid step is 78 px in MapCanvas)
// ---------------------------------------------------------------------------

const STEP = 78;
/** Route in grid units: from Rohan's pickup (bottom left), past Priya and Aditi, to the tech park. */
const ROUTE_GRID: [number, number][] = [[1, 6], [1, 4], [3, 4], [3, 2], [4, 2], [4, 1]];
const at = (c: number, r: number, ox: number, oy: number): MapPoint => ({ x: c * STEP + ox, y: r * STEP + oy });

/**
 * MapCanvas props for the morning ride. `progress` 0..1 moves the car along
 * the route (0.2 = just past Rohan, before Priya); `ox`/`oy` pan the whole
 * scene, street grid included.
 */
export function morningMap(progress = 0.2, ox = 0, oy = 0): Omit<MapCanvasProps, 'width' | 'height'> {
  const route = ROUTE_GRID.map(([c, r]) => at(c, r, ox, oy));
  const car = pointAlong(route, progress);
  const priyaPickup = at(2.2, 4, ox, oy);
  const aditiPickup = at(3, 2.6, ox, oy);
  return {
    gridOffset: { x: ox, y: oy },
    route,
    routeProgress: progress,
    destinationLabel: destination,
    car: { x: car.x, y: car.y, heading: car.heading, label: people.driver.first, aboard: 1 },
    people: [
      // Priya is waiting at her pickup; Aditi is still walking to hers.
      { id: 'priya', x: priyaPickup.x + 20, y: priyaPickup.y + 26, label: 'You', name: people.priya.name, color: people.priya.color, isMe: true },
      { id: 'aditi', x: aditiPickup.x + 44, y: aditiPickup.y + 40, label: people.aditi.first, name: people.aditi.name, color: people.aditi.color },
    ],
    pickups: [
      { ...priyaPickup, name: null },
      { ...aditiPickup, name: null },
    ],
  };
}

// ---------------------------------------------------------------------------
// Your ride
// ---------------------------------------------------------------------------

export const ride: RideScreenProps = {
  direction: 'MORNING',
  rideStatus: 'CHECKIN_OPEN',
  departureTime: morningTime,
  counters: { atPickup: 1, onTheirWay: 2, riding: 3 },
  driver: { name: people.driver.name, color: people.driver.color, vehicleName: vehicle.display, phone: true },
  myStatus: 'GOING',
  riders: [
    { id: 'priya', name: people.priya.name, color: people.priya.color, isMe: true, pickupName: pickups.priya, status: 'GOING' },
    { id: 'rohan', name: people.rohan.name, color: people.rohan.color, pickupName: pickups.rohan, status: 'READY' },
    { id: 'aditi', name: people.aditi.name, color: people.aditi.color, pickupName: pickups.aditi, status: 'GOING' },
  ],
};

/** After tapping "I'm at the pickup point". The app's own copy is the default; this uses the store wording. */
export const rideReady: RideScreenProps = {
  ...ride,
  myStatus: 'READY',
  counters: { atPickup: 2, onTheirWay: 1, riding: 3 },
  riders: ride.riders.map((r) => (r.id === 'priya' ? { ...r, status: 'READY' } : r)),
  readyNotice: { title: `${people.driver.first} sees you're ready`, body: "You're at the pickup point." },
};

/** Ride started: map on top, black hero. */
export const rideLive: RideScreenProps = {
  ...rideReady,
  rideStatus: 'STARTED',
  counters: { atPickup: 1, onTheirWay: 1, riding: 3 },
  riders: [
    { ...rideReady.riders[0] },
    { ...rideReady.riders[1], status: 'PICKED_UP' },
    { ...rideReady.riders[2] },
  ],
  map: { ...morningMap(0.2, -20, -170), destinationLabel: undefined },
};

// ---------------------------------------------------------------------------
// Live map
// ---------------------------------------------------------------------------

export const liveMap: LiveMapScreenProps = {
  driverName: people.driver.name,
  vehicleName: vehicle.name,
  // App copy: "Arjun Mehta is driving" / "1 aboard · 2 to pick up · Honda City".
  // Store wording, if wanted: driverTitle: 'Arjun is 1.1 km away'.
  riders: [
    { id: 'priya', name: people.priya.name, color: people.priya.color, isMe: true, state: 'ready', line: 'Waiting at the pickup point' },
    { id: 'aditi', name: people.aditi.name, color: people.aditi.color, state: 'live', line: '1.1 km from the car' },
    { id: 'rohan', name: people.rohan.name, color: people.rohan.color, state: 'aboard', line: 'In the car' },
  ],
  role: 'PASSENGER',
  connection: 'live',
  map: morningMap(0.2, -40, 40),
};

// ---------------------------------------------------------------------------
// Roster
// ---------------------------------------------------------------------------

const D = people.driver.name, P = people.priya.name, R = people.rohan.name, A = people.aditi.name;
export const roster: RosterScreenProps = {
  commuteDays: 21,
  myTurns: 5,
  // illustrationSrc: staticFile('calendar-roster.webp'),
  weeks: [
    {
      label: 'This week',
      days: [
        { date: '2026-11-09', type: 'COMMUTE_DAY', driverName: D },
        { date: '2026-11-10', type: 'COMMUTE_DAY', driverName: P, isMe: true },
        { date: '2026-11-11', type: 'COMMUTE_DAY', driverName: R },
        { date: '2026-11-12', type: 'COMMUTE_DAY', driverName: A },
        { date: '2026-11-13', type: 'COMMUTE_DAY', driverName: D },
      ],
    },
    {
      label: 'Next week',
      days: [
        { date: '2026-11-16', type: 'COMMUTE_DAY', driverName: P, isMe: true, projected: true },
        { date: '2026-11-17', type: 'COMMUTE_DAY', driverName: R, projected: true },
        { date: '2026-11-18', type: 'COMMUTE_DAY', driverName: A, projected: true },
        { date: '2026-11-19', type: 'COMMUTE_DAY', driverName: D, projected: true },
        { date: '2026-11-20', type: 'COMMUTE_DAY', driverName: P, isMe: true, projected: true },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Notifications (Activity rows). Titles/bodies follow the backend's wording.
// ---------------------------------------------------------------------------

export const notifications: Record<'rideStarted' | 'driverAssigned' | 'driverChanged' | 'delayed' | 'ready', NotificationCardProps> = {
  rideStarted: {
    type: 'RIDE_STARTED', unread: true, when: 'Just now',
    title: `${people.driver.name} has started the morning ride`, body: 'Track the car live and be at the gathering point.',
  },
  /** Sent to the driver ~12 h before (RideReminderScheduler). */
  driverAssigned: {
    type: 'DRIVER_REMINDER_12H', unread: true, when: '9 h ago',
    title: 'You are the scheduled driver', body: "Your morning ride leaves tomorrow at 08:15. Can't make it? Hand it over from the ride screen up to 2 hours before.",
  },
  driverChanged: {
    type: 'DRIVER_CHANGED', when: '2 h ago',
    title: 'Driver changed for 2026-11-09', body: `${people.driver.name} will drive instead of ${people.rohan.name}.`,
  },
  delayed: {
    type: 'RIDE_DELAYED', when: '5 min ago',
    title: 'Ride delayed by 10 minutes', body: `${people.driver.name} will leave around 08:25 instead of 08:15.`,
  },
  /** Not in the app (readiness is live-only). Promo addition in the same style. */
  ready: {
    type: 'PROMO_READY', unread: true, when: 'Just now',
    title: `${people.priya.first} is at the pickup point`, body: pickups.priya,
  },
};
